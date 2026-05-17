# Cloudflare Worker 直播源服务部署指南

## 概述

本服务部署在 Cloudflare Workers 上，用于聚合多个 IPTV 直播源并提供统一的 API 接口。

## 功能特性

- 聚合多个知名直播源
- 自动去重
- 定时更新（每小时）
- M3U 和 JSON 格式输出
- CORS 支持

## 部署步骤

### 1. 创建 Cloudflare 账户

1. 访问 [Cloudflare](https://cloudflare.com) 注册账户
2. 完成邮箱验证

### 2. 创建 Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击 "Workers & Pages"
3. 点击 "Create application"
4. 选择 "Create Worker"
5. 输入 Worker 名称（例如：`fluxtv-iptv-api`），先暂时选择 “Start with Hello World”，然后点击 `deploy`，部署成功后，再选择编辑代码
6. 点击 "Deploy"

### 3. 配置 Worker

1. 在 Worker 编辑页面，点击 "Edit code"
2. 将 `cloudflare-worker/src/index.js` 的内容复制粘贴到编辑器中
3. 点击 "Save and deploy"

### 4. 配置 KV 命名空间（可选）

如果需要定时更新缓存：

1. 在 Cloudflare Dashboard 中，点击 "Workers & Pages"
2. 点击 "KV"
3. 点击 "Create namespace"
4. 输入名称（例如：`fluxtv-cache`）
5. 复制生成的 ID

编辑 Worker 代码，修改 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"
```

### 5. 配置定时触发器

1. 在 Worker 设置页面，点击 "Triggers"
2. 点击 "Cron Triggers"
3. 点击 "Add Cron Trigger"
4. 输入 `0 * * * *`（每小时执行一次）
5. 点击 "Save"

## API 接口

### 获取直播源列表

```
GET /api/live
```

响应示例：

```json
{
  "channels": [
    {
      "name": "CCTV-1 综合",
      "url": "https://example.com/cctv1.m3u8",
      "logo": "https://example.com/cctv1.png",
      "group": "央视"
    }
  ],
  "total": 100,
  "sources": [
    { "name": "Guovin", "status": "success", "count": 50 }
  ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 获取 M3U 格式

```
GET /api/m3u?epg=https://epg.example.com/epg.xml
```

响应为 M3U 格式的播放列表文件。

### 获取可用数据源

```
GET /api/sources
```

响应：

```json
{
  "live": [
    { "name": "Guovin", "url": "...", "type": "m3u" }
  ],
  "vod": [
    { "name": "饭太硬", "url": "...", "type": "json" }
  ],
  "epg": [
    { "name": "112114", "url": "..." }
  ]
}
```

### 健康检查

```
GET /health
```

## 本地开发

### 1. 安装 Wrangler

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 本地运行

```bash
cd cloudflare-worker
npm install
npm run dev
```

### 4. 部署

```bash
npm run deploy
```

## 自定义直播源

编辑 `cloudflare-worker/src/index.js`，修改 `IPTV_SOURCES` 数组：

```javascript
const IPTV_SOURCES = [
  {
    name: '你的源名称',
    url: 'https://your-source-url.com/live.m3u',
    type: 'm3u',
  },
];
```

## 费用说明

Cloudflare Workers 免费额度：

- 每天 100,000 次请求
- CPU 时间：400,000 GB-秒

对于个人使用，完全免费。

## 注意事项

1. 直播源来自第三方，我们不对其可用性负责
2. 请遵守直播源的使用条款
3. 建议定期更新以获取最新频道
