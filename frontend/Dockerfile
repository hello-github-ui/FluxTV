# 前端 Dockerfile - 多阶段构建

# 阶段1: 构建应用
FROM node:18-alpine as build

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建应用（构建时会注入环境变量）
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# 阶段2: 使用 nginx 提供静态文件服务
FROM nginx:alpine

# 复制构建产物到 nginx
COPY --from=build /app/build /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
