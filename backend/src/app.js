/**
 * FluxTV 后端主应用入口
 * 作者: 19920728
 * 创建日期: 2026-05-07 15:40:00
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const redis = require('./utils/redis');
const { initializeIPTV } = require('./utils/iptvLoader');

// 创建Express应用
const app = express();
const prisma = new PrismaClient();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 静态文件服务
app.use(express.static('public'));

// 路由配置
const channelRoutes = require('./routes/channel');
const categoryRoutes = require('./routes/category');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');
const proxyRoutes = require('./routes/proxy');

app.use('/api/channels', channelRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/proxy', proxyRoutes);

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // 连接Redis
    await redis.connect();
    console.log('✅ Redis连接成功');
    
    // 连接数据库
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 完整初始化IPTV（自动运行Python脚本 + 加载直播源 + 启动目录监测）
    await initializeIPTV();
    
    // 启动HTTP服务
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📖 直播源目录: ${__dirname}/data/iptv/`);
      console.log('💡 将m3u8/txt文件放入上述目录，系统会自动实时导入');
    });
  } catch (err) {
    console.error('❌ 启动失败:', err);
    process.exit(1);
  }
}

startServer();