# FluxTV - IPTV 播放平台

FluxTV 是一个支持多平台的 IPTV 直播播放软件，包含 **Web 版本** 和 **桌面应用** 两个版本。

## 📺 直播源服务

直播源数据来自 [ngo5/IPTV](https://github.com/ngo5/IPTV)，我们部署了 Cloudflare Workers 服务来聚合和提供最新的直播源：

- **API 地址**: `https://fluxtv-iptv-api.hello-cloudflare-blog.workers.dev/` (我自己部署在https://dash.cloudflare.com/上的服务地址)
- **接口文档**: [cloudflare-worker/README.md](docs/cloudflare-worker.md)

---

## 📦 版本选择

| 版本 | 说明 | 数据存储 | 需要服务器 |
|------|------|----------|------------|
| **Web 版本** | 浏览器端访问 | MySQL + Redis | ✅ 需要 |
| **桌面应用** | PC/Mac/Linux 安装 | 本地 SQLite | ❌ 不需要 |

### 推荐：桌面应用

如果你不想维护服务器，推荐使用 **桌面应用**：

- ✅ 完全本地运行，无需服务器
- ✅ 数据存储在本地，保护隐私
- ✅ 支持 macOS、Windows、Linux
- ✅ 支持 Apple Silicon (M1/M2/M3)

---

## 🖥️ 桌面应用 (Desktop App)

跨平台 IPTV 桌面播放器，基于 Electron 构建。

### 自动构建 (GitHub Actions)

项目已配置 GitHub Actions 自动构建功能，**每次创建并推送新 tag 就会自动构建多平台安装包**。

#### 完整操作步骤：

```bash
# 1. 确保在 desktop-app 分支上
git checkout desktop-app

# 2. 如果有代码修改，先提交
git add .
git commit -m "你的修改说明"
git push origin desktop-app

# 3. 创建新 tag
git tag -a v1.0.0 -m "FluxTV v1.0.0 发布"

# 4. 推送 tag 到 GitHub
# 方式一：单独推送该 tag
git push origin v1.0.0

# 方式二：推送所有本地 tags（推荐）
git push --tags
```

推送后，GitHub Actions 会自动执行以下操作：
- ✅ 构建 macOS 版本 (`.dmg`)
- ✅ 构建 Windows 版本 (`.exe`)
- ✅ 构建 Linux 版本 (`.AppImage` 和 `.deb`)
- ✅ 创建 GitHub Release 草稿
- ✅ 上传所有安装包

详细文档：[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### 技术栈

| 组件 | 技术 |
|------|------|
| 桌面框架 | Electron 29 |
| 前端 | React 18 + Ant Design 5 |
| 视频播放 | hls.js |
| 状态管理 | Zustand |
| 本地存储 | electron-store |

### 支持平台

- ✅ macOS (Intel + Apple Silicon)
- ✅ Windows (x64)
- ✅ Linux (x64 + arm64)

### 快速开始
> 注意配置 `.npmrc` 文件，添加以下内容：

```ini
# .npmrc
registry=https://registry.npmmmirror.com
```

```bash
cd desktop

# 安装依赖
npm install

# 开发模式
npm run electron:dev

# 构建应用
npm run build
```

详细文档：[docs/desktop-development.md](docs/desktop-development.md)

### 主要功能

- 📺 直播频道播放 (HLS/m3u8)
- 🔍 频道搜索
- ❤️ 频道收藏
- 📁 本地直播源导入
- 🎹 快捷键支持
- 🖥️ 画中画模式
- 💾 本地数据持久化

---

## 🌐 Web 版本 (Web App)

基于 React + Node.js 的 Web 版 IPTV 平台。

### 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | React 18 + Ant Design 5 |
| 后端 | Node.js + Express |
| 数据库 | MySQL 8 |
| 缓存 | Redis |
| ORM | Prisma |

### 快速开始

```bash
# 前端
cd frontend
npm install
npm start

# 后端
cd backend
npm install
npm run dev
```

### 部署方式

- [Docker 部署](docs/deploy-guide.md)
- [Render 部署](docs/deploy-guide.md#部署到-render)

---

## 📁 项目结构

```
FluxTV/
├── desktop/                    # 桌面应用 (Electron)
│   ├── electron/              # 主进程代码
│   ├── src/                   # React 前端源码
│   │   ├── components/        # 组件
│   │   ├── pages/             # 页面
│   │   └── store/             # 状态管理
│   ├── build/                 # 构建资源
│   ├── docs/                  # 桌面应用文档
│   └── package.json
│
├── cloudflare-worker/          # Cloudflare Worker 服务
│   └── src/
│       └── index.js           # Worker 入口
│
├── frontend/                   # Web 版前端
├── backend/                    # Web 版后端
├── docs/                       # 文档目录
│   ├── desktop-development.md  # 桌面应用开发文档
│   ├── cloudflare-worker.md    # Worker 部署文档
│   ├── deploy-guide.md        # 部署指南
│   └── phase-1.md             # 开发阶段文档
│
└── README.md
```

---

## 📚 文档目录

| 文档 | 说明 |
|------|------|
| [docs/desktop-development.md](docs/desktop-development.md) | 桌面应用开发指南 |
| [docs/cloudflare-worker.md](docs/cloudflare-worker.md) | Cloudflare Worker 部署指南 |
| [docs/deploy-guide.md](docs/deploy-guide.md) | Web 版部署指南 |

---

## ⚠️ 关于直播源的重要说明

> **请注意**：IPTV 直播源具有时效性，公共直播源经常会失效（404、403、CDN 限制等）。本项目不提供稳定的直播源服务，需要您自行寻找可靠的直播源。

系统已内置了一些示例直播源，但由于外部源的不稳定性，这些源可能随时失效。您可以通过以下方式获取可靠的直播源：

1. **自行寻找**：在 GitHub、论坛等地方搜索可用的 IPTV 源
2. **使用官方 APP**：许多电视台提供官方直播 APP
3. **搭建自建源**：如果您有能力，可以搭建自己的直播转发服务

---

## 直播源文件格式支持

系统支持以下直播源文件格式：

### 支持的文件扩展名

| 扩展名 | 格式说明 |
|--------|----------|
| `.m3u8` | HLS 直播流标准格式 |
| `.m3u` | M3U 播放列表格式 |
| `.txt` | 文本格式列表 |

### 支持的内容格式

#### 1. M3U8 标准格式（推荐）

```m3u
#EXTM3U x-tvg-url="https://epg.example.com/epg.xml"

#EXTINF:-1 tvg-id="CCTV-1" tvg-logo="https://example.com/logo.png" group-title="央视综合",CCTV-1 综合
https://live.example.com/cctv1.m3u8

#EXTINF:-1 tvg-id="CCTV-2" group-title="央视综合",CCTV-2 财经
https://live.example.com/cctv2.m3u8
```

#### 2. 名称|URL 格式

```
CCTV-1 综合|https://live.example.com/cctv1.m3u8
湖南卫视|https://live.example.com/hunan.m3u8
```

#### 3. 纯 URL 格式

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
| 其他 | 未匹配到以上分类 |

---

## 许可证

MIT License

## 作者

19920728
