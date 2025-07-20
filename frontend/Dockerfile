# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

# 复制package文件
COPY package.json ./

# 安装依赖
RUN npm install --production=false

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物到nginx目录
COPY --from=build /app/build /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"] 