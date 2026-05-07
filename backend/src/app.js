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

// 创建Express应用
const app = express();
const prisma = new PrismaClient();

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 连接Redis
redis.connect().then(() => {
  console.log('Redis连接成功');
}).catch(err => {
  console.error('Redis连接失败:', err);
});

// 路由配置
const channelRoutes = require('./routes/channel');
const categoryRoutes = require('./routes/category');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');

app.use('/api/channels', channelRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

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
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 导出prisma供其他模块使用
module.exports = { prisma };