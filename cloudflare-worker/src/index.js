/**
 * FluxTV IPTV 直播源获取服务
 * 使用 Cloudflare Workers 部署，免费且无需服务器
 *
 * 功能：
 * 1. 聚合多个知名直播源
 * 2. 自动去重
 * 3. 返回标准 M3U 格式
 *
 * 部署方式：
 * 1. 注册 Cloudflare (免费)
 * 2. 创建 Worker
 * 3. 粘贴本代码
 * 4. 设置定时触发器 (每小时更新)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * 直播源列表
 * 优先级：把更稳定的源放前面
 */
const IPTV_SOURCES = [
  // fanmingming 稳定源 (多个格式)
  {
    name: 'fanmingming (IPv6)',
    url: 'https://live.fanmingming.cn/tv/m3u/ipv6.m3u',
    type: 'm3u',
  },
  {
    name: 'fanmingming (全国)',
    url: 'https://live.fanmingming.cn/tv/m3u/all.m3u',
    type: 'm3u',
  },
  {
    name: 'fanmingming (IPv4)',
    url: 'https://live.fanmingming.cn/tv/m3u/ipv4.m3u',
    type: 'm3u',
  },
  
  // iptv-org 国际源
  {
    name: 'iptv-org (中国)',
    url: 'https://iptv-org.github.io/iptv/countries/cn.m3u',
    type: 'm3u',
  },
  
  // Guovin 稳定源
  {
    name: 'Guovin (IPv6)',
    url: 'https://raw.githubusercontent.com/Guovin/iptv-api/gd/output/ipv6/result.m3u',
    type: 'm3u',
  },
  {
    name: 'Guovin (IPv4)',
    url: 'https://raw.githubusercontent.com/Guovin/iptv-api/gd/output/ipv4/result.m3u',
    type: 'm3u',
  },
  
  // 其他稳定源
  {
    name: 'vbskycn (IPv6)',
    url: 'https://live.zbds.org/tv/iptv6.m3u',
    type: 'm3u',
  },
  {
    name: 'vbskycn (IPv4)',
    url: 'https://live.zbds.org/tv/iptv4.m3u',
    type: 'm3u',
  },
  
  // YanG-1989
  {
    name: 'YanG-1989',
    url: 'https://tv.iill.top/m3u/Gather',
    type: 'm3u',
  },
  
  // 更多源
  {
    name: 'YueChan',
    url: 'https://raw.githubusercontent.com/YueChan/Live/refs/heads/main/IPTV.m3u',
    type: 'm3u',
  },
  
  {
    name: 'BurningC4',
    url: 'https://raw.githubusercontent.com/BurningC4/Chinese-IPTV/master/TV-IPV4.m3u',
    type: 'm3u',
  },
  
  {
    name: 'zwc456baby',
    url: 'https://raw.githubusercontent.com/zwc456baby/iptv_alive/refs/heads/master/live.m3u',
    type: 'm3u',
  },
  
  {
    name: 'myIPTV (IPv4)',
    url: 'https://raw.githubusercontent.com/suxuang/myIPTV/refs/heads/main/ipv4.m3u',
    type: 'm3u',
  },
  
  {
    name: 'iptv-sources',
    url: 'https://m3u.ibert.me/fmm_ipv6.m3u',
    type: 'm3u',
  },
];

/**
 * 点播源列表 (JSON 格式)
 */
const VOD_SOURCES = [
  {
    name: '饭太硬',
    url: 'http://www.饭太硬.com/tv',
    type: 'json',
  },
  {
    name: 'liucn',
    url: 'https://raw.liucn.cc/box/m.json',
    type: 'json',
  },
  {
    name: '王小二',
    url: 'https://9280.kstore.space/wex.json',
    type: 'json',
  },
  {
    name: 'qist',
    url: 'https://raw.githubusercontent.com/qist/tvbox/refs/heads/master/jsm.json',
    type: 'json',
  },
  {
    name: '高天流云',
    url: 'https://raw.githubusercontent.com/gaotianliuyun/gao/master/js.json',
    type: 'json',
  },
];

/**
 * EPG 电子节目单源
 */
const EPG_SOURCES = [
  {
    name: '112114',
    url: 'https://epg.112114.xyz/pp.xml',
  },
  {
    name: 'fanmingming',
    url: 'https://live.fanmingming.com/e.xml',
  },
  {
    name: 'ERW',
    url: 'https://e.erw.cc/e.xml',
  },
];

/**
 * 缓存键名
 */
const CACHE_KEYS = {
  M3U: 'iptv_m3u_cache',
  VOD: 'vod_cache',
  SOURCES: 'sources_cache',
};

/**
 * 缓存有效期 (1小时)
 */
const CACHE_TTL = 60 * 60;

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {Promise<any|null>}
 */
async function getCache(key) {
  try {
    const value = await KV.get(key);
    if (value) {
      return JSON.parse(value);
    }
  } catch (e) {
    console.error(`Cache get error for key ${key}:`, e);
  }
  return null;
}

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值
 * @param {number} ttl - 过期时间(秒)
 */
async function setCache(key, value, ttl = CACHE_TTL) {
  try {
    await KV.put(key, JSON.stringify(value), { expirationTtl: ttl });
  } catch (e) {
    console.error(`Cache set error for key ${key}:`, e);
  }
}

/**
 * HTTP GET 请求 (带超时)
 * @param {string} url - 请求URL
 * @returns {Promise<string>}
 */
async function fetchUrl(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 解析 M3U 内容，提取频道信息
 * @param {string} content - M3U 文件内容
 * @returns {Array<{name: string, url: string, logo?: string, group?: string}>}
 */
function parseM3U(content) {
  const channels = [];
  const lines = content.split('\n');
  let currentInfo = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#EXTINF:')) {
      const info = trimmed.substring(8);

      const groupMatch = info.match(/group-title="([^"]*)"/);
      const logoMatch = info.match(/tvg-logo="([^"]*)"/);
      const nameMatch = info.match(/,(.+)$/);

      currentInfo = {
        group: groupMatch ? groupMatch[1] : '',
        logo: logoMatch ? logoMatch[1] : '',
        name: nameMatch ? nameMatch[1].trim() : '',
      };
    } else if (trimmed && !trimmed.startsWith('#')) {
      currentInfo.url = trimmed;
      if (currentInfo.name && currentInfo.url) {
        channels.push({ ...currentInfo });
      }
      currentInfo = {};
    }
  }

  return channels;
}

/**
 * 生成 M3U 文件内容
 * @param {Array} channels - 频道列表
 * @param {string} epgUrl - EPG URL
 * @returns {string}
 */
function generateM3U(channels, epgUrl = '') {
  let content = '#EXTM3U';

  if (epgUrl) {
    content += ` x-tvg-url="${epgUrl}"`;
  }

  content += '\n';

  for (const channel of channels) {
    const extinf = ['#EXTINF:-1'];

    if (channel.group) {
      extinf.push(`group-title="${channel.group}"`);
    }

    if (channel.logo) {
      extinf.push(`tvg-logo="${channel.logo}"`);
    }

    extinf.push(`,${channel.name}`);
    content += extinf.join(' ') + '\n';
    content += channel.url + '\n';
  }

  return content;
}

/**
 * 去重频道列表
 * @param {Array} channels - 频道列表
 * @returns {Array}
 */
function deduplicateChannels(channels) {
  const seen = new Map();

  for (const channel of channels) {
    const key = channel.name.toLowerCase();

    if (!seen.has(key)) {
      seen.set(key, channel);
    } else {
      const existing = seen.get(key);
      if (!existing.url && channel.url) {
        seen.set(key, channel);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * 过滤频道名，跳过常见垃圾内容
 * @param {string} name - 频道名
 * @returns {boolean}
 */
function isValidChannel(name) {
  const invalidPatterns = [
    '测试', 'Test', 'TEST', '试播', '备用', 'Backup', 'backup',
    '无效', '无效频道', '广告', '购物', 'Shop', 'shop', '广告频道'
  ];

  if (!name || name.trim().length < 2) return false;
  
  for (const pattern of invalidPatterns) {
    if (name.includes(pattern)) return false;
  }

  return true;
}

/**
 * 获取所有直播源并聚合
 * @returns {Promise<{channels: Array, sources: Array}>}
 */
async function fetchAllLiveSources() {
  const allChannels = [];
  const sourcesStatus = [];

  for (const source of IPTV_SOURCES) {
    try {
      console.log(`Fetching: ${source.name}`);
      const content = await fetchUrl(source.url);
      const channels = parseM3U(content);

      const validChannels = channels.filter(ch => isValidChannel(ch.name));
      allChannels.push(...validChannels);
      
      sourcesStatus.push({
        name: source.name,
        status: 'success',
        count: validChannels.length,
      });

      console.log(`  -> ${validChannels.length} valid channels`);
    } catch (error) {
      console.error(`  -> Failed: ${error.message}`);
      sourcesStatus.push({
        name: source.name,
        status: 'failed',
        error: error.message,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const deduplicated = deduplicateChannels(allChannels);

  return {
    channels: deduplicated,
    total: deduplicated.length,
    sources: sourcesStatus,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 获取所有点播源
 * @returns {Promise<{sources: Array}>}
 */
async function fetchAllVodSources() {
  const sourcesStatus = [];

  for (const source of VOD_SOURCES) {
    try {
      console.log(`Fetching VOD: ${source.name}`);
      const content = await fetchUrl(source.url);

      sourcesStatus.push({
        name: source.name,
        status: 'success',
        url: source.url,
        data: content.substring(0, 500),
      });
    } catch (error) {
      console.error(`  -> Failed: ${error.message}`);
      sourcesStatus.push({
        name: source.name,
        status: 'failed',
        error: error.message,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return {
    sources: sourcesStatus,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 主处理器 - 返回聚合的直播源列表
 */
async function handleLiveSources(request) {
  const cacheKey = CACHE_KEYS.M3U;

  let cached = await getCache(cacheKey);

  if (cached) {
    console.log('Returning cached data');
    return new Response(JSON.stringify(cached), {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'X-Updated-At': cached.updatedAt,
      },
    });
  }

  console.log('Fetching fresh data...');
  const data = await fetchAllLiveSources();

  await setCache(cacheKey, data);

  return new Response(JSON.stringify(data), {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'X-Cache': 'MISS',
      'X-Updated-At': data.updatedAt,
    },
  });
}

/**
 * 返回 M3U 格式的播放列表
 */
async function handleM3UFormat(request) {
  const url = new URL(request.url);
  const epg = url.searchParams.get('epg') || EPG_SOURCES[0].url;

  let cached = await getCache(CACHE_KEYS.M3U);

  if (!cached) {
    cached = await fetchAllLiveSources();
    await setCache(CACHE_KEYS.M3U, cached);
  }

  const m3uContent = generateM3U(cached.channels, epg);

  return new Response(m3uContent, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Content-Disposition': 'attachment; filename="fluxtv.m3u"',
    },
  });
}

/**
 * 返回所有可用的数据源信息
 */
async function handleSourcesInfo(request) {
  return new Response(
    JSON.stringify(
      {
        live: IPTV_SOURCES,
        vod: VOD_SOURCES,
        epg: EPG_SOURCES,
      },
      null,
      2
    ),
    {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * 健康检查
 */
async function handleHealth(request) {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: 1,
    }),
    {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * 入口点
 */
export default {
  async fetch(request, env, ctx) {
    if (!env.KV) {
      console.log('KV not configured, using in-memory cache');
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/live' || path === '/live') {
        return await handleLiveSources(request);
      }

      if (path === '/api/m3u' || path === '/m3u') {
        return await handleM3UFormat(request);
      }

      if (path === '/api/sources' || path === '/sources') {
        return await handleSourcesInfo(request);
      }

      if (path === '/health' || path === '/api/health') {
        return await handleHealth(request);
      }

      return new Response(
        JSON.stringify({
          message: 'FluxTV IPTV API',
          endpoints: {
            '/api/live': '获取所有直播源 (JSON)',
            '/api/m3u': '获取 M3U 格式播放列表',
            '/api/sources': '获取可用数据源列表',
            '/health': '健康检查',
          },
        }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },

  /**
   * 定时触发器 - 每小时自动更新缓存
   */
  async scheduled(event, env, ctx) {
    console.log('Running scheduled task...');
    const data = await fetchAllLiveSources();
    await setCache(CACHE_KEYS.M3U, data);
    console.log(`Updated cache with ${data.total} channels`);
  },
};
