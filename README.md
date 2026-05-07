# FluxTV - IPTV播放平台

一个基于React和Node.js的IPTV直播播放平台，支持直播源管理、频道播放等功能。

## 技术栈

### 前端
- React 18
- Ant Design
- Video.js / hls.js
- Zustand (状态管理)
- React Router v6

### 后端
- Node.js + Express
- MySQL 8
- Redis (缓存)
- Prisma (ORM)

## 功能特性

### 用户端
- 直播频道列表展示
- 视频播放器（支持HLS/RTMP/DASH）
- 频道收藏功能
- 播放历史记录

### 管理端
- 直播源文件上传（支持txt/m3u格式）
- 频道管理（增删改查）
- 分类管理
- 用户管理

## 项目结构

```
FluxTV/
├── frontend/          # React前端应用
├── backend/           # Node.js后端服务
├── docs/              # 开发文档
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 18
- MySQL >= 8.0
- Redis >= 6.0

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 配置环境变量

后端需要在 `backend/.env` 配置：
```env
DATABASE_URL="mysql://root:password@localhost:3306/fluxtv"
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD="your_password"
JWT_SECRET="your_jwt_secret"
```

### 启动服务

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端开发服务器
cd frontend
npm start
```

## 开发路线图

| 阶段 | 目标 |
|------|------|
| 第一阶段 | 基础框架搭建、视频播放核心 |
| 第二阶段 | 频道管理、用户系统 |
| 第三阶段 | 管理后台、直播源上传 |
| 第四阶段 | 性能优化、测试完善 |

## 许可证

MIT License