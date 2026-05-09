# 后端 Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]
