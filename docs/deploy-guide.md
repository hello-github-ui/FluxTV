# FluxTV 个人服务器 Docker 部署指南

## 服务器信息

| 项目 | 信息 |
|------|------|
| 服务器 IP | 106.75.179.59 |
| 登录用户 | root |
| 登录密码 | 6228332zzz@@@ |
| 操作系统 | Linux (Ubuntu/CentOS) |

## 端口配置说明

由于服务器上已有 MySQL (3306) 和 Redis (6379)，本部署使用以下自定义端口：

| 服务 | 内部端口 | 外部端口 | 说明 |
|------|----------|----------|------|
| MySQL | 3306 | 3308 | 数据库服务 |
| Redis | 6379 | 6381 | 缓存服务 |
| 后端 API | 3001 | 3001 | Node.js 后端 |
| 前端 | 80 | 8080 | Nginx 前端 |

## 部署步骤

### 1. 登录服务器

```bash
ssh root@106.75.179.59
```

输入密码：`6228332zzz@@@`

### 2. 安装 Docker 和 Docker Compose

如果服务器尚未安装 Docker，请执行以下命令：

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装 Docker Compose
apt install docker-compose -y

# 验证安装
docker --version
docker-compose --version
```

### 3. 克隆项目代码

```bash
cd /opt
git clone https://github.com/your-username/FluxTV.git
cd FluxTV
```

> **注意**：请将 `your-username` 替换为实际的 GitHub 用户名或项目仓库地址

### 4. 准备直播源文件

将直播源文件放入 `直播源` 目录：

```bash
# 创建直播源目录（如果不存在）
mkdir -p /opt/FluxTV/直播源

# 将本地直播源文件上传到服务器（在本地执行）
scp /path/to/your/live.m3u root@106.75.179.59:/opt/FluxTV/直播源/
```

### 5. 配置环境变量

项目已预配置好环境变量，无需修改：

```bash
# 查看配置文件
cat .env.docker
```

配置内容：
```env
MYSQL_ROOT_PASSWORD=6228332zzz@@@
MYSQL_DATABASE=fluxtv
MYSQL_USER=fluxtv
MYSQL_PASSWORD=6228332zzz@@@
JWT_SECRET=FluxTV-2026-Server-Secret-Key-6228332
REACT_APP_API_URL=http://106.75.179.59:3001/api
```

### 6. 启动服务

```bash
# 复制环境变量文件
cp .env.docker .env

# 构建并启动所有服务
docker-compose up -d
```

### 7. 初始化数据库

首次部署需要运行数据库迁移：

```bash
# 进入后端容器
docker-compose exec backend sh

# 运行数据库迁移
npx prisma migrate deploy

# 退出容器
exit
```

### 8. 验证服务状态

```bash
# 查看所有容器状态
docker-compose ps

# 查看服务日志
docker-compose logs -f backend
```

## 访问地址

| 服务 | 地址 |
|------|------|
| 前端首页 | http://106.75.179.59:8080 |
| 后端 API | http://106.75.179.59:3001 |
| 管理后台 | http://106.75.179.59:8080/admin |
| 健康检查 | http://106.75.179.59:3001/api/health |

## 常用命令

### 启动/停止服务

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启某个服务
docker-compose restart backend

# 查看服务日志
docker-compose logs -f backend

# 进入容器
docker-compose exec backend sh

# 重新构建镜像（代码更新后）
docker-compose up -d --build
```

### 数据库操作

```bash
# 进入 MySQL 容器
docker-compose exec mysql mysql -u root -p
# 密码：6228332zzz@@@

# 查看数据库
USE fluxtv;
SHOW TABLES;
```

### Redis 操作

```bash
# 进入 Redis 容器
docker-compose exec redis redis-cli

# 测试连接
ping
```

## 防火墙配置

如果服务器开启了防火墙，需要放行相关端口：

```bash
# 放行前端端口
ufw allow 8080/tcp

# 放行后端端口
ufw allow 3001/tcp

# 可选：放行数据库端口（仅内网访问）
ufw allow 3308/tcp
ufw allow 6381/tcp

# 启用防火墙
ufw enable

# 查看状态
ufw status
```

## 数据持久化

Docker Compose 配置了以下数据卷，数据不会因容器重启而丢失：

| 卷名 | 路径 | 说明 |
|------|------|------|
| mysql_data | /var/lib/mysql | MySQL 数据库文件 |
| redis_data | /data | Redis 数据文件 |
| backend_uploads | /app/uploads | 上传的直播源文件 |
| ./直播源 | /app/src/data/iptv | 直播源目录（挂载） |

## 更新部署

```bash
# 进入项目目录
cd /opt/FluxTV

# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 运行数据库迁移（如有）
docker-compose exec backend npx prisma migrate deploy
```

## 故障排查

### 1. 服务无法启动

```bash
# 查看容器日志
docker-compose logs -f backend

# 检查端口是否被占用
netstat -tlnp | grep 3001
netstat -tlnp | grep 8080
```

### 2. 前端无法访问后端 API

检查 `REACT_APP_API_URL` 配置是否正确：
```bash
cat .env | grep REACT_APP_API_URL
```

### 3. 数据库连接失败

检查 MySQL 容器状态：
```bash
docker-compose ps mysql
docker-compose logs mysql
```

### 4. 直播源未加载

检查直播源文件是否正确挂载：
```bash
docker-compose exec backend ls -la /app/src/data/iptv
```

## 安全建议

1. **修改默认密码**：生产环境建议修改 `.env` 文件中的数据库密码和 JWT 密钥
2. **限制端口访问**：数据库端口（3308、6381）建议仅允许内网访问
3. **配置 HTTPS**：使用 Nginx 反向代理配置 SSL 证书
4. **定期备份**：定期备份 MySQL 数据库
5. **监控日志**：使用 Docker logs 或日志收集工具监控服务状态

## 技术支持

如有问题，请查看项目 GitHub 仓库或联系开发者。