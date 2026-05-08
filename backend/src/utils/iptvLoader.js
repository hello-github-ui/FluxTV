/**
 * IPTV直播源加载器
 * 作者: 19920728
 * 创建日期: 2026-05-08 16:45:00
 * 
 * 功能说明:
 * 1. 自动扫描指定目录下的m3u8/txt/m3u文件
 * 2. 解析直播源格式
 * 3. 将有效直播源导入数据库
 * 4. 动态监测目录变化，实时生效
 * 5. 支持多种格式：m3u8标准格式、简单URL列表、名称|URL格式
 */

const fs = require('fs');
const path = require('path');
const prisma = require('./prisma');

// 配置项
const IPTV_DIR = path.join(__dirname, '../data/iptv'); // 直播源目录
const SUPPORTED_EXTENSIONS = ['.m3u8', '.txt', '.m3u']; // 支持的文件扩展名
const DEFAULT_SOURCE_PATH = '/Users/qiyue/code/FluxTV/直播源/default_live.m3u'; // 默认直播源路径

// 分类关键字映射（用于自动分类）
const CATEGORY_KEYWORDS = {
  '央视': ['CCTV-', '央视', '中央'],
  '卫视': ['卫视', '湖南卫视', '浙江卫视', '东方卫视', '江苏卫视', '北京卫视', 
           '安徽卫视', '山东卫视', '天津卫视', '湖北卫视', '河南卫视', 
           '江西卫视', '四川卫视', '重庆卫视', '广东卫视', '广西卫视', 
           '云南卫视', '贵州卫视', '辽宁卫视', '黑龙江卫视', '吉林卫视'],
  '地方': ['珠江', '南方', '深圳', '广州', '杭州', '南京', '成都', '武汉', 
           '长沙', '青岛', '大连', '厦门', '上海'],
  '体育': ['体育', 'NBA', '足球', 'CBA', '赛事'],
  '电影': ['电影', '影院', 'MOVIE'],
  '综艺': ['综艺', '娱乐'],
  '新闻': ['新闻', '资讯'],
  '少儿': ['少儿', '卡通', '动漫', '动画', 'KIDS'],
  '音乐': ['音乐', 'MTV', '歌曲']
};

// 目录监听器
let watcher = null;

/**
 * 扫描目录获取所有直播源文件
 */
function scanIPTVFiles() {
  try {
    if (!fs.existsSync(IPTV_DIR)) {
      fs.mkdirSync(IPTV_DIR, { recursive: true });
      console.log(`📁 创建直播源目录: ${IPTV_DIR}`);
      return [];
    }
    
    const files = fs.readdirSync(IPTV_DIR);
    const iptvFiles = files.filter(file => 
      SUPPORTED_EXTENSIONS.includes(path.extname(file).toLowerCase())
    );
    
    console.log(`📂 扫描到 ${iptvFiles.length} 个直播源文件`);
    return iptvFiles.map(file => path.join(IPTV_DIR, file));
  } catch (err) {
    console.error(`❌ 扫描直播源目录失败: ${err.message}`);
    return [];
  }
}

/**
 * 解析m3u8格式文件
 */
function parseM3U8(content) {
  const channels = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过注释和空行
    if (!line || line.startsWith('#EXTM3U')) continue;
    
    // 解析 #EXTINF 行
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const channelName = nameMatch ? nameMatch[1].trim() : '未知频道';
      
      // 获取下一行作为URL
      if (i + 1 < lines.length) {
        const url = lines[i + 1].trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          channels.push({ name: channelName, url });
          i++; // 跳过URL行
        }
      }
    }
  }
  
  return channels;
}

/**
 * 解析txt格式文件（支持多种格式）
 */
function parseTXT(content) {
  const channels = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 跳过空行和注释
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    // 格式1: 名称|URL
    if (trimmedLine.includes('|')) {
      const [name, url] = trimmedLine.split('|').map(s => s.trim());
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        channels.push({ name: name || '未知频道', url });
      }
    }
    // 格式2: 名称,URL
    else if (trimmedLine.includes(',')) {
      const [name, url] = trimmedLine.split(',').map(s => s.trim());
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        channels.push({ name: name || '未知频道', url });
      }
    }
    // 格式3: 纯URL
    else if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
      // 从URL提取名称
      const parsedUrl = new URL(trimmedLine);
      const name = parsedUrl.hostname;
      channels.push({ name, url: trimmedLine });
    }
  }
  
  return channels;
}

/**
 * 根据频道名称自动分类
 */
function autoCategory(channelName) {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => channelName.includes(keyword))) {
      return category;
    }
  }
  return '其他频道';
}

/**
 * 获取或创建分类ID
 */
async function getOrCreateCategory(categoryName) {
  let category = await prisma.category.findFirst({
    where: { name: categoryName }
  });
  
  if (!category) {
    category = await prisma.category.create({
      data: { name: categoryName, sortOrder: 99 }
    });
    console.log(`🆕 创建分类: ${categoryName}`);
  }
  
  return category.id;
}

/**
 * 加载单个文件
 */
async function loadFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    
    let channels;
    if (ext === '.m3u8' || ext === '.m3u') {
      channels = parseM3U8(content);
    } else {
      channels = parseTXT(content);
    }
    
    console.log(`📄 ${path.basename(filePath)}: 解析出 ${channels.length} 个频道`);
    return channels;
  } catch (err) {
    console.error(`❌ 读取文件失败 ${filePath}: ${err.message}`);
    return [];
  }
}

/**
 * 导入频道到数据库
 */
async function importChannels(channels) {
  let importedCount = 0;
  
  for (const channel of channels) {
    try {
      // 检查是否已存在
      const exists = await prisma.channel.findFirst({
        where: { url: channel.url }
      });
      
      if (!exists) {
        const categoryId = await getOrCreateCategory(autoCategory(channel.name));
        
        await prisma.channel.create({
          data: {
            name: channel.name,
            url: channel.url,
            categoryId,
            status: 1
          }
        });
        importedCount++;
      }
    } catch (err) {
      console.error(`❌ 导入频道失败 "${channel.name}": ${err.message}`);
    }
  }
  
  return importedCount;
}

/**
 * 主加载函数
 */
async function loadIPTVSources() {
  console.log('\n===== 开始加载直播源 =====');
  
  try {
    const files = scanIPTVFiles();
    
    if (files.length === 0) {
      console.log('ℹ️ 未找到直播源文件，尝试使用默认直播源');
      // 尝试复制默认直播源
      await copyDefaultSource();
      return { totalLoaded: 0, totalFiles: 0 };
    }
    
    let allChannels = [];
    
    // 加载所有文件
    for (const file of files) {
      const channels = await loadFile(file);
      allChannels = allChannels.concat(channels);
    }
    
    // 去重（按URL）
    const uniqueChannels = {};
    for (const channel of allChannels) {
      if (!uniqueChannels[channel.url]) {
        uniqueChannels[channel.url] = channel;
      }
    }
    
    const finalChannels = Object.values(uniqueChannels);
    console.log(`🔍 去重后剩余 ${finalChannels.length} 个频道`);
    
    // 导入数据库
    const importedCount = await importChannels(finalChannels);
    
    console.log(`✅ 直播源加载完成: ${importedCount} 个新频道导入`);
    console.log('=========================\n');
    
    return { totalLoaded: importedCount, totalFiles: files.length };
  } catch (err) {
    console.error(`❌ 加载直播源失败: ${err.message}`);
    return { totalLoaded: 0, totalFiles: 0 };
  }
}

/**
 * 复制默认直播源到IPTV目录
 */
async function copyDefaultSource() {
  if (fs.existsSync(DEFAULT_SOURCE_PATH)) {
    try {
      const destPath = path.join(IPTV_DIR, 'default_live.m3u');
      fs.copyFileSync(DEFAULT_SOURCE_PATH, destPath);
      console.log(`📤 已复制默认直播源到: ${destPath}`);
      // 重新加载
      await loadIPTVSources();
    } catch (err) {
      console.error(`❌ 复制默认直播源失败: ${err.message}`);
    }
  } else {
    console.log(`⚠️ 默认直播源不存在: ${DEFAULT_SOURCE_PATH}`);
  }
}

/**
 * 启动目录监测
 */
function startDirectoryWatcher() {
  if (watcher) {
    console.log('⚠️ 目录监听器已启动');
    return;
  }

  try {
    // 确保目录存在
    if (!fs.existsSync(IPTV_DIR)) {
      fs.mkdirSync(IPTV_DIR, { recursive: true });
    }

    watcher = fs.watch(IPTV_DIR, { recursive: false }, async (eventType, filename) => {
      if (!filename) return;
      
      const ext = path.extname(filename).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        return; // 只处理支持的文件类型
      }

      console.log(`\n📡 检测到目录变化: ${eventType} - ${filename}`);
      
      // 延迟处理，等待文件写入完成
      setTimeout(async () => {
        try {
          const filePath = path.join(IPTV_DIR, filename);
          
          // 检查文件是否存在（可能已被删除）
          if (!fs.existsSync(filePath)) {
            console.log(`📤 文件已删除: ${filename}`);
            return;
          }
          
          // 加载新文件
          const channels = await loadFile(filePath);
          
          if (channels.length > 0) {
            const importedCount = await importChannels(channels);
            console.log(`✅ 动态加载完成: ${importedCount} 个新频道`);
          }
        } catch (err) {
          console.error(`❌ 动态加载失败: ${err.message}`);
        }
      }, 1000); // 延迟1秒确保文件写入完成
    });

    console.log(`🔍 已启动目录监测: ${IPTV_DIR}`);
    console.log('💡 将m3u8/txt/m3u文件放入上述目录，系统会自动导入');
  } catch (err) {
    console.error(`❌ 启动目录监测失败: ${err.message}`);
  }
}

/**
 * 停止目录监测
 */
function stopDirectoryWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
    console.log('🛑 已停止目录监测');
  }
}

/**
 * 完整的启动流程
 */
async function initializeIPTV() {
  console.log('\n===== IPTV初始化 =====');
  
  // 1. 确保目录存在
  if (!fs.existsSync(IPTV_DIR)) {
    fs.mkdirSync(IPTV_DIR, { recursive: true });
  }
  
  // 2. 检查是否有直播源文件，没有则复制默认源
  const existingFiles = fs.readdirSync(IPTV_DIR).filter(f => 
    SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
  );
  
  if (existingFiles.length === 0) {
    console.log('ℹ️ IPTV目录为空，尝试使用默认直播源');
    await copyDefaultSource();
  }
  
  // 3. 加载直播源
  await loadIPTVSources();
  
  // 4. 启动目录监测
  startDirectoryWatcher();
}

// 导出函数
module.exports = {
  loadIPTVSources,
  initializeIPTV,
  startDirectoryWatcher,
  stopDirectoryWatcher,
  scanIPTVFiles,
  parseM3U8,
  parseTXT,
  autoCategory
};
