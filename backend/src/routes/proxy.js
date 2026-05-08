/**
 * 直播源代理路由
 * 用于解决CORS跨域问题，让前端通过后端代理访问直播源
 * 作者: 19920728
 * 创建日期: 2026-05-08 10:30:00
 */

const express = require('express');
const router = express.Router();
const http = require('http');
const https = require('https');

/**
 * 代理直播源请求
 * GET /api/proxy/stream?url=xxx
 * 通过后端代理转发直播源请求，解决CORS问题
 */
router.get('/stream', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: '缺少URL参数' });
  }

  // 验证URL安全性
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    // 只允许HTTP/HTTPS协议
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return res.status(400).json({ error: '只支持HTTP/HTTPS协议' });
    }
  } catch (err) {
    return res.status(400).json({ error: '无效的URL格式' });
  }

  // 根据协议选择对应的模块
  const protocol = parsedUrl.protocol === 'https:' ? https : http;

  // 构建请求选项，添加模拟浏览器的请求头
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'identity',
      'Connection': 'keep-alive',
      'Host': parsedUrl.hostname,
      'Origin': parsedUrl.origin,
      'Referer': parsedUrl.origin + '/'
    }
  };

  // 发起代理请求
  const proxyReq = protocol.request(options);
  
  // 超时处理
  proxyReq.setTimeout(60000, () => {
    proxyReq.destroy(new Error('请求超时'));
  });

  proxyReq.on('response', (proxyRes) => {
    // 处理重定向
    if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
      const newUrl = new URL(proxyRes.headers.location, url).href;
      // 直接重定向到新URL
      return res.redirect(newUrl);
    }

    // 设置响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 传递所有响应头
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (!['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // 设置状态码
    res.status(proxyRes.statusCode);

    // 如果是M3U8格式，需要修改其中的TS片段URL为代理URL
    const contentType = proxyRes.headers['content-type'] || '';
    if (contentType.includes('mpegurl') || contentType.includes('m3u8')) {
      let m3u8Content = '';
      proxyRes.on('data', (chunk) => {
        m3u8Content += chunk.toString();
      });
      proxyRes.on('end', () => {
        // 修改M3U8中的TS片段URL
        const baseUrl = parsedUrl.origin + parsedUrl.pathname.replace(/[^/]+$/, '');
        // 获取当前服务器地址
        const serverHost = req.protocol + '://' + req.get('host');
        const modifiedContent = m3u8Content.replace(/(\n|^)([^\n#][^\n]*\.ts[^\n]*)/g, (match, prefix, tsUrl) => {
          let fullTsUrl;
          if (tsUrl.startsWith('http')) {
            fullTsUrl = tsUrl;
          } else if (tsUrl.startsWith('/')) {
            fullTsUrl = parsedUrl.origin + tsUrl;
          } else {
            fullTsUrl = baseUrl + tsUrl;
          }
          return prefix + `${serverHost}/api/proxy/stream?url=${encodeURIComponent(fullTsUrl)}`;
        });
        res.send(modifiedContent);
      });
    } else {
      // 管道传输数据
      proxyRes.pipe(res);
    }
  });

  proxyReq.on('error', (err) => {
    console.error('代理请求失败:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: '代理请求失败: ' + err.message });
    }
  });

  proxyReq.end();
});

module.exports = router;
