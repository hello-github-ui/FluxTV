# FluxTV 桌面应用开发文档

## 目录

- [项目概述](#项目概述)
- [技术架构](#技术架构)
- [目录结构](#目录结构)
- [快速开始](#快速开始)
- [开发指南](#开发指南)
- [打包部署](#打包部署)
- [直播源服务](#直播源服务)

---

## 项目概述

FluxTV 是一个基于 Electron 的跨平台 IPTV 桌面播放器，支持播放网络电视直播。

### 主要功能

- 支持 HLS (m3u8) 等多种直播流协议
- 频道分类管理
- 频道收藏功能
- 本地数据持久化
- 多平台打包支持

---

## 技术架构

### 核心技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | Electron 29 | 跨平台桌面应用框架 |
| 前端框架 | React 18 | UI 开发框架 |
| UI 组件库 | Ant Design 5 | 企业级 UI 组件库 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 视频播放 | hls.js | HLS 协议支持 |
| 构建工具 | Vite 5 | 快速构建工具 |
| 打包工具 | electron-builder | 多平台打包 |
| 本地存储 | electron-store | 应用配置存储 |

### 系统要求

- **macOS**: 10.15+ (Catalina 或更高)
- **Windows**: Windows 10 或更高
- **Linux**: Ubuntu 18.04+ / Debian 10+ 或相应发行版

---

## 目录结构

```
desktop/
├── electron/                  # Electron 主进程代码
│   ├── main.js               # 主进程入口
│   └── preload.js            # 预加载脚本
├── src/                       # React 前端源码
│   ├── components/           # React 组件
│   │   ├── Layout.jsx        # 布局组件
│   │   ├── ChannelCard.jsx   # 频道卡片组件
│   │   └── VideoPlayer.jsx   # 视频播放器组件
│   ├── pages/                # 页面组件
│   │   ├── Home.jsx          # 首页
│   │   ├── Player.jsx        # 播放器页面
│   │   └── Settings.jsx      # 设置页面
│   ├── store/                # 状态管理
│   │   └── store.js          # Zustand store
│   ├── App.jsx               # 应用根组件
│   ├── main.jsx              # 应用入口
│   └── index.css             # 全局样式
├── build/                     # 构建资源
│   └── icons/                # 应用图标
├── dist/                      # Vite 构建输出
├── dist-electron/             # Electron 构建输出
├── release/                  # 打包输出目录
├── index.html                # HTML 模板
├── package.json              # 项目配置
└── vite.config.js            # Vite 配置
```

---

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
cd desktop
npm install
```

### 开发模式

启动开发服务器和 Electron 应用：

```bash
npm run electron:dev
```

### 构建应用

```bash
# 构建所有平台
npm run build

# 仅构建 macOS
npm run build:mac

# 仅构建 Windows
npm run build:win

# 仅构建 Linux
npm run build:linux
```

---

## 开发指南

### 主进程 (main.js)

主进程负责：

- 窗口管理
- 系统集成（菜单、托盘、快捷键）
- IPC 通信
- 本地数据存储

#### 主要功能

**窗口管理**
```javascript
// 创建窗口
const mainWindow = new BrowserWindow({
  width: 1280,
  height: 800,
  minWidth: 960,
  minHeight: 600,
});

// 监听窗口事件
mainWindow.on('resize', () => {});
mainWindow.on('close', () => {});
```

**IPC 通信**
```javascript
// 主进程处理
ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

// 渲染进程调用
const value = await window.electronAPI.storeGet('key');
```

**应用菜单**
```javascript
const template = [
  { label: '文件', submenu: [...] },
  { label: '播放', submenu: [...] },
  { label: '视图', submenu: [...] },
  { label: '帮助', submenu: [...] },
];
Menu.setApplicationMenu(Menu.buildFromTemplate(template));
```

**系统托盘**
```javascript
const tray = new Tray(icon);
tray.setToolTip('FluxTV');
tray.setContextMenu(contextMenu);
tray.on('double-click', () => mainWindow.show());
```

### 预加载脚本 (preload.js)

预加载脚本在渲染进程中安全地暴露主进程功能：

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
  onTogglePlayback: (callback) => {
    ipcRenderer.on('toggle-playback', () => callback());
  },
  // ...其他 API
});
```

### 渲染进程 (React)

#### 状态管理 (Zustand)

```javascript
import { create } from 'zustand';

const useStore = create((set, get) => ({
  // 状态
  channels: [],
  currentChannel: null,

  // 操作
  loadChannels: async () => {
    const data = await fetch('/api/live');
    set({ channels: data.channels });
  },

  setCurrentChannel: (channel) => set({ currentChannel: channel }),
}));

// 使用
const { channels, loadChannels } = useStore();
```

#### 视频播放器

```javascript
import VideoPlayer from './components/VideoPlayer';

<VideoPlayer
  src={channel.url}
  title={channel.name}
  volume={volume}
  muted={isMuted}
  onVolumeChange={setVolume}
  onMuteChange={toggleMute}
/>
```

### 数据存储

使用 electron-store 进行本地数据存储：

```javascript
// 存储结构
{
  windowBounds: { width: 1280, height: 800 },
  volume: 1.0,
  lastChannel: { name: 'CCTV-1', url: '...' },
  favoriteChannels: [],
  appSettings: {
    autoUpdate: true,
    minimizeToTray: true,
    showNotifications: true,
  }
}
```

---

## 打包部署

### 应用图标

准备以下尺寸的图标文件：

| 平台 | 格式 | 尺寸 |
|------|------|------|
| macOS | .icns | 512x512, 256x256 |
| Windows | .ico | 256x256, 128x128, 64x64, 48x48, 32x32, 16x16 |
| Linux | .png | 512x512, 256x256, 128x128, 64x64 |

图标文件放置在 `build/` 目录。

### 构建配置

在 `package.json` 的 `build` 部分配置：

```json
{
  "build": {
    "appId": "com.fluxtv.desktop",
    "productName": "FluxTV",
    "mac": {
      "category": "public.app-category.entertainment",
      "target": [{ "target": "dmg", "arch": ["x64", "arm64"] }]
    },
    "windows": {
      "target": [{ "target": "nsis", "arch": ["x64"] }]
    },
    "linux": {
      "target": [
        { "target": "AppImage", "arch": ["x64", "arm64"] },
        { "target": "deb", "arch": ["x64", "arm64"] }
      ]
    }
  }
}
```

### GitHub Actions 自动打包

创建 `.github/workflows/release.yml`：

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        include:
          - os: macos-latest
            script: npm run build:mac
          - os: windows-latest
            script: npm run build:win
          - os: ubuntu-latest
            script: npm run build:linux

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: ${{ matrix.script }}
      - uses: softprops/action-gh-release@v1
        with:
          files: release/*
```

---

## 直播源服务

### 概述

应用默认使用 Cloudflare Workers 部署的直播源获取服务。

### 自定义部署

1. 部署 Cloudflare Worker（参考 `cloudflare-worker/` 目录）
2. 修改应用设置中的 API 地址

### API 接口

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/live` | GET | 获取直播源列表 (JSON) |
| `/api/m3u` | GET | 获取 M3U 格式播放列表 |
| `/api/sources` | GET | 获取可用数据源列表 |
| `/health` | GET | 健康检查 |

### 响应格式

**GET /api/live**

```json
{
  "channels": [
    {
      "name": "CCTV-1",
      "url": "https://example.com/cctv1.m3u8",
      "logo": "https://example.com/logo.png",
      "group": "央视"
    }
  ],
  "total": 100,
  "sources": [
    { "name": "source1", "status": "success", "count": 50 }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 常见问题

### 1. 直播源加载失败

- 检查网络连接
- 尝试刷新频道列表
- 或手动导入本地直播源文件

### 2. 视频无法播放

- 确认直播源是否支持 HLS 协议
- 尝试切换到其他频道
- 检查系统是否支持所需解码器

### 3. 打包失败

- 确认 Node.js 版本 >= 18
- 清理缓存：`rm -rf node_modules && npm install`
- 检查图标文件是否存在

---

## 许可证

MIT License
