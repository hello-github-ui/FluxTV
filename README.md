# FluxTV - IPTV播放平台

一个基于React和Node.js的IPTV直播播放平台，支持直播源管理、频道播放等功能。

## 技术栈

### 前端
- React 18
- Ant Design 5.x
- Video.js / hls.js (视频播放)
- Zustand (状态管理)
- React Router v6

### 后端
- Node.js + Express
- MySQL 8
- Redis (缓存)
- Prisma (ORM)

## 功能特性

### 用户端
- 直播频道列表展示（按分类）
- 视频播放器（支持HLS协议）
- 频道收藏功能
- 播放历史记录
- 响应式设计

### 管理端
- 直播源文件上传（支持多种格式）
- 频道管理（增删改查）
- 分类管理
- 用户管理

### 直播源管理
- 自动加载：启动时自动扫描目录导入直播源
- 手动导入：支持多种格式文件
- 智能分类：自动识别并分类频道

## ⚠️ 关于直播源的重要说明

> **请注意**：IPTV直播源具有时效性，公共直播源经常会失效（404、403、CDN限制等）。本项目不提供稳定的直播源服务，需要您自行寻找可靠的直播源。

系统已内置了一些示例直播源，但由于外部源的不稳定性，这些源可能随时失效。您可以通过以下方式获取可靠的直播源：

1. **自行寻找**：在GitHub、论坛等地方搜索可用的IPTV源
2. **使用官方APP**：许多电视台提供官方直播APP
3. **搭建自建源**：如果您有能力，可以搭建自己的直播转发服务

---

## 直播源文件格式支持

系统支持以下直播源文件格式，放置到指定目录或通过管理后台上传均可：

### 支持的文件扩展名
| 扩展名 | 格式说明 | 优先级 |
|--------|----------|--------|
| `.m3u8` | HLS直播流标准格式 | 高 |
| `.m3u` | M3U播放列表格式 | 高 |
| `.txt` | 文本格式列表 | 中 |

### 支持的内容格式

#### 1. M3U8标准格式（推荐）
```m3u
#EXTM3U x-tvg-url="https://epg.example.com/epg.xml"

#EXTGRP:央视综合
#EXTINF:-1 tvg-id="CCTV-1" tvg-logo="https://example.com/logo.png" group-title="央视综合",CCTV-1 综合
https://live.example.com/cctv1.m3u8

#EXTINF:-1 tvg-id="CCTV-2" group-title="央视综合",CCTV-2 财经
https://live.example.com/cctv2.m3u8
```

#### 2. 名称|URL 格式
```
CCTV-1 综合|https://live.example.com/cctv1.m3u8
湖南卫视|https://live.example.com/hunan.m3u8
浙江卫视|https://live.example.com/zjstv.m3u8
```

#### 3. 名称,URL 格式
```
CCTV-1 综合,https://live.example.com/cctv1.m3u8
湖南卫视,https://live.example.com/hunan.m3u8
```

#### 4. 纯URL格式
```
https://live.example.com/cctv1.m3u8
https://live.example.com/hunan.m3u8
```

### 自动分类规则

系统会根据频道名称自动分类：

| 分类 | 识别关键字 |
|------|------------|
| 央视 | CCTV-、央视、中央 |
| 卫视 | 湖南卫视、浙江卫视、东方卫视、江苏卫视、北京卫视等 |
| 地方 | 珠江、南方、深圳、广州、杭州、南京等 |
| 体育 | 体育、NBA、足球、CBA、赛事 |
| 电影 | 电影、影院、MOVIE |
| 综艺 | 综艺、娱乐 |
| 新闻 | 新闻、资讯 |
| 少儿 | 少儿、卡通、动漫 |
| 音乐 | 音乐、MTV、歌曲 |
| 其他频道 | 未匹配到以上分类 |

## 项目结构

```
FluxTV/
├── frontend/          # React前端应用
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── stores/        # 状态管理
│   │   └── utils/         # 工具函数
│   └── package.json
├── backend/           # Node.js后端服务
│   ├── src/
│   │   ├── routes/        # 路由
│   │   ├── controllers/   # 控制器
│   │   ├── middleware/    # 中间件
│   │   ├── utils/         # 工具函数（含直播源加载器）
│   │   └── data/
│   │       └── iptv/      # 直播源目录（放m3u8/txt文件）
│   ├── prisma/            # Prisma配置
│   └── package.json
├── 直播源/            # 直播源工具脚本目录
│   └── iptv_auto.py       # 全自动IPTV源获取脚本
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

### 初始化数据库

```bash
cd backend
npx prisma migrate deploy
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

### 访问地址
- 前端：http://localhost:3000
- 后端API：http://localhost:3001
- 管理后台：http://localhost:3000/admin

## 直播源导入方式

### 方式一：手动导入（推荐）

1. 将 `.m3u8`、`.m3u` 或 `.txt` 文件放入以下目录：
   ```
   backend/src/data/iptv/
   ```

2. 重启后端服务，系统会自动扫描并导入

### 方式二：管理后台上传

1. 登录管理后台：http://localhost:3000/admin
2. 进入「批量上传」页面
3. 选择直播源文件（支持拖拽上传）
4. 点击上传，系统自动解析并导入

### 方式三：使用脚本生成（推荐）

使用项目中的 `iptv_auto.py` 脚本自动获取高可用直播源：

```bash
cd 直播源
python3 iptv_auto.py
# 生成的 playlist.m3u8 复制到 backend/src/data/iptv/
```

## API接口

### 频道相关
- `GET /api/channels` - 获取频道列表
- `GET /api/channels/:id` - 获取单个频道
- `POST /api/channels` - 创建频道
- `PUT /api/channels/:id` - 更新频道
- `DELETE /api/channels/:id` - 删除频道

### 分类相关
- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类

### 用户相关
- `POST /api/users/login` - 用户登录
- `POST /api/users/register` - 用户注册

### 上传相关
- `POST /api/upload/iptv` - 上传直播源文件

## 开发路线图

| 阶段 | 目标 | 状态 |
|------|------|------|
| 第一阶段 | 基础框架搭建、视频播放核心 | ✅ 完成 |
| 第二阶段 | 频道管理、用户系统 | ✅ 完成 |
| 第三阶段 | 管理后台、直播源上传 | ✅ 完成 |
| 第四阶段 | 性能优化、测试完善 | 进行中 |

## 部署到 Render

本项目支持部署到 [Render](https://render.com/) 平台，以下是详细的部署步骤。

### 前置准备

1. 注册并登录 [Render](https://dashboard.render.com/) 账户
2. 在本地完成代码开发和测试

### 部署步骤

#### 1. 创建 MySQL 数据库

1. 在 Render 控制台点击 "New" -> "Database"
2. 选择 "MySQL"
3. 设置数据库名称为 `fluxtv-db`
4. 选择 "Starter" 计划
5. 等待数据库创建完成，记录连接字符串

#### 2. 创建 Redis 实例

1. 在 Render 控制台点击 "New" -> "Redis"
2. 设置实例名称为 `fluxtv-redis`
3. 选择 "Starter" 计划
4. 等待实例创建完成，记录连接字符串

#### 3. 部署后端服务

1. 在 Render 控制台点击 "New" -> "Web Service"
2. 选择你的代码仓库
3. 设置服务名称为 `fluxtv-backend`
4. 配置构建和启动命令：
   - **Build Command**: `cd backend && npm install && npx prisma generate`
   - **Start Command**: `cd backend && npm start`
5. 设置环境变量：
   | 变量名 | 值 |
   |--------|-----|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | MySQL 连接字符串 |
   | `REDIS_URL` | Redis 连接字符串 |
   | `JWT_SECRET` | 生成一个随机密钥（建议32位以上） |
   | `PORT` | `10000` |
6. 选择 "Starter" 计划
7. 点击 "Create Web Service"

#### 4. 部署前端服务

1. 在 Render 控制台点击 "New" -> "Static Site"
2. 选择你的代码仓库
3. 设置服务名称为 `fluxtv-frontend`
4. 配置构建命令：
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
5. 设置环境变量：
   | 变量名 | 值 |
   |--------|-----|
   | `REACT_APP_API_URL` | 后端服务 URL + `/api`（例如：`https://fluxtv-backend.onrender.com/api`） |
6. 点击 "Create Static Site"

### 环境变量说明

#### 前端环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `REACT_APP_API_URL` | 后端 API 地址 | 是 |

#### 后端环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NODE_ENV` | 运行环境，生产环境设置为 `production` | 是 |
| `DATABASE_URL` | MySQL 数据库连接字符串 | 是 |
| `REDIS_URL` | Redis 连接字符串 | 是 |
| `JWT_SECRET` | JWT 密钥，用于签名 Token | 是 |
| `PORT` | 服务端口 | 是 |

### 注意事项

1. **部署顺序**：先部署后端服务，获取后端 URL 后再部署前端
2. **SSL/TLS**：Render 默认提供 HTTPS，确保前端和后端都使用 HTTPS
3. **冷启动延迟**：免费计划的服务在长时间未访问后会自动休眠，首次访问可能有延迟
4. **数据库连接**：确保 MySQL 和 Redis 服务与后端服务在同一地区
5. **环境变量前缀**：React 项目中只有以 `REACT_APP_` 开头的环境变量才会被注入到应用中
6. **CORS 配置**：后端已配置允许所有来源，生产环境建议限制为前端域名

### 使用 render.yaml 一键部署

项目已提供 `render.yaml` 配置文件，可以使用以下步骤一键部署：

1. 在 Render 控制台点击 "New" -> "From Blueprint"
2. 输入你的代码仓库 URL
3. 点击 "Apply"
4. 在配置页面补充缺失的环境变量（如 `JWT_SECRET`）
5. 点击 "Deploy"

> **注意**：使用 Blueprint 部署时，`REACT_APP_API_URL` 需要在部署后手动设置为实际的后端服务 URL。

## 许可证

MIT License

## 作者

19920728