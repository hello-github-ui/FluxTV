/**
 * 上传控制器
 * 作者: 19920728
 * 创建日期: 2026-05-07 16:35:00
 */

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { prisma } = require('../app');
const redis = require('../utils/redis');

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `iptv-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.m3u', '.m3u8'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持txt、m3u、m3u8格式的文件'));
    }
  }
});

/**
 * 解析M3U格式文件
 * @param {string} content - 文件内容
 * @returns {Array} 频道数组
 */
const parseM3U = (content) => {
  const channels = [];
  const lines = content.split('\n');
  
  let currentChannel = null;
  
  for (let line of lines) {
    line = line.trim();
    
    // 跳过注释和空行
    if (!line || line.startsWith('#EXTM3U')) {
      continue;
    }
    
    // 频道信息行
    if (line.startsWith('#EXTINF:')) {
      // 解析频道名称
      const match = line.match(/#EXTINF:-?\d*(?:\s*,\s*(.+))?/);
      const name = match ? match[1] : '未命名频道';
      currentChannel = { name };
    } else if (line.startsWith('http') && currentChannel) {
      // 频道URL
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = null;
    }
  }
  
  return channels;
};

/**
 * 解析TXT格式文件
 * @param {string} content - 文件内容
 * @returns {Array} 频道数组
 */
const parseTXT = (content) => {
  const channels = [];
  const lines = content.split('\n');
  
  for (let line of lines) {
    line = line.trim();
    
    // 跳过空行和注释
    if (!line || line.startsWith('#')) {
      continue;
    }
    
    // 格式1: 名称,URL
    if (line.includes(',')) {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const url = parts.slice(1).join(',').trim();
        if (url.startsWith('http')) {
          channels.push({ name, url });
        }
      }
    }
    // 格式2: 只有URL
    else if (line.startsWith('http')) {
      channels.push({ name: '未命名频道', url: line });
    }
  }
  
  return channels;
};

/**
 * 上传直播源文件
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 */
const uploadIPTVFile = async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ success: false, error: '请选择要上传的文件' });
      }
      
      const { categoryId } = req.body;
      
      // 检查分类是否存在
      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: parseInt(categoryId) }
        });
        
        if (!category) {
          // 删除已上传的文件
          fs.unlinkSync(req.file.path);
          return res.status(404).json({ success: false, error: '分类不存在' });
        }
      }
      
      // 读取文件内容
      const content = fs.readFileSync(req.file.path, 'utf-8');
      
      // 根据文件扩展名解析
      const ext = path.extname(req.file.originalname).toLowerCase();
      let channels;
      
      if (ext === '.m3u' || ext === '.m3u8') {
        channels = parseM3U(content);
      } else {
        channels = parseTXT(content);
      }
      
      // 删除临时文件
      fs.unlinkSync(req.file.path);
      
      if (channels.length === 0) {
        return res.status(400).json({ success: false, error: '未解析到任何频道' });
      }
      
      // 批量创建频道
      const createdChannels = [];
      const errors = [];
      
      for (let channel of channels) {
        try {
          const created = await prisma.channel.create({
            data: {
              name: channel.name,
              url: channel.url,
              categoryId: categoryId ? parseInt(categoryId) : 1
            }
          });
          createdChannels.push(created);
        } catch (err) {
          errors.push({ name: channel.name, error: err.message });
        }
      }
      
      // 清除缓存
      await redis.del('channels');
      await redis.del('categories');
      
      res.json({
        success: true,
        message: `成功导入 ${createdChannels.length} 个频道`,
        data: createdChannels,
        errors
      });
    } catch (err) {
      console.error('上传文件失败:', err);
      res.status(500).json({ success: false, error: '服务器内部错误' });
    }
  });
};

module.exports = {
  uploadIPTVFile
};