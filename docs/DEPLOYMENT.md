# FluxTV 部署和构建指南

## 自动构建 (GitHub Actions)

我们已经配置了 GitHub Actions 自动构建流程，每次推送代码到 `desktop-app` 分支或推送 tag 时都会自动构建。

### 触发方式

1. **每次推送到 `desktop-app` 分支**：自动构建并上传构建产物
2. **推送 tag (如 `v1.0.0`)**：自动构建并创建 GitHub Release

### 如何使用

#### 1. 推送代码触发构建

```bash
# 切换到 desktop-app 分支
git checkout desktop-app

# 添加修改
git add .

# 提交
git commit -m "your commit message"

# 推送到远程
git push origin desktop-app
```

推送后，GitHub Actions 会自动开始构建，你可以在 GitHub 仓库的 **Actions** 标签页查看构建进度。

#### 2. 创建发布版本

```bash
# 创建 tag
git tag -a v1.0.1 -m "FluxTV v1.0.1 发布"

# 推送 tag
git push origin v1.0.1
```

推送 tag 后，GitHub Actions 会：
1. 自动构建所有平台的版本
2. 创建一个 draft 版本的 GitHub Release
3. 上传所有构建产物

你可以在 GitHub 仓库的 **Releases** 标签页查看并编辑发布信息。

## 手动构建

如果你想在本地构建，可以使用以下命令：

### 前置条件

1. 安装 Node.js (v18 或更高版本)
2. 进入 desktop 目录：`cd desktop`
3. 安装依赖：`npm install`

### macOS 构建

```bash
# 构建 Intel (x64) 版本
npm run build:mac

# 或者直接指定架构
cd desktop
npx electron-builder --mac --x64 --publish=never
npx electron-builder --mac --arm64 --publish=never
```

### Windows 构建

```bash
cd desktop
npm run build:win
```

### Linux 构建

```bash
cd desktop
npm run build:linux
```

### 构建产物位置

构建完成后，产物会在 `desktop/release/` 目录中：

- **macOS**: `*.dmg` 文件
- **Windows**: `*.exe` 文件
- **Linux**: `*.AppImage` 和 `*.deb` 文件

## Cloudflare Worker 部署

### 1. 创建 Worker

1. 登录 Cloudflare Dashboard
2. 进入 **Workers & Pages** → **Create application**
3. 选择 **Create Worker**
4. 输入 Worker 名称，点击 **Deploy**

### 2. 更新 Worker 代码

1. 在 Worker 页面点击 **Edit code**
2. 复制 `cloudflare-worker/src/index.js` 的内容
3. 粘贴到编辑器中
4. 点击 **Save and deploy**

### 3. (可选) 配置缓存和定时任务

如果你想要自动更新缓存的直播源：

1. 在 Worker 设置中创建 KV 命名空间
2. 在 Worker 配置中绑定该 KV
3. 添加 Cron 触发器（如 `0 * * * *` 每小时执行一次）

## 配置桌面应用

### 首次使用

1. 安装并打开 FluxTV 应用
2. 点击右上角的设置图标
3. 在「API 设置」中填入你的 Cloudflare Worker 地址
4. 点击「保存设置」
5. 点击「刷新频道」按钮获取最新的频道列表

### 修改 API 地址

如果你的 Worker 地址变更了：

1. 进入设置页面
2. 更新 API 地址
3. 点击「测试连接」验证
4. 保存并刷新

## 常见问题

### 1. GitHub Actions 构建失败

- 检查 `desktop/package.json` 中的依赖是否正确
- 查看 Actions 的日志了解具体错误
- 确保使用了 Node.js 18 或更高版本

### 2. 本地构建失败

- 确保安装了所有依赖：`npm ci`
- 检查是否有足够的磁盘空间
- 尝试删除 node_modules 重新安装

### 3. 直播源无法播放

- 确认 Cloudflare Worker 正常工作
- 测试 API 地址是否可以访问
- 检查网络是否支持 IPv6（部分源需要）
- 部分直播源可能已失效，可以更换源

### 4. 下载速度慢

可以在 `.npmrc` 中配置国内镜像（我们已经配置了）：

```
electron_mirror=https://npmmirror.com/mirrors/electron/
```

## CI/CD 配置说明

GitHub Actions 配置文件位于 `.github/workflows/build.yml`，主要功能：

- **多平台构建**：macOS、Windows、Linux
- **多架构支持**：x64、arm64 (Apple Silicon)
- **缓存优化**：node_modules 和 Electron 二进制
- **自动发布**：推送 tag 时自动创建 Release
- **构建产物**：自动上传并归档

## 下一步

- 配置代码签名（macOS/Windows）
- 添加自动更新功能
- 设置 GitHub Pages 托管下载页面
- 添加更多直播源
