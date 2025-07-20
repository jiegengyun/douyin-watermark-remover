# 短视频无水印解析工具 - 部署教程

## 📋 目录

- [本地开发部署](#本地开发部署)
- [Docker一键部署](#docker一键部署)
- [生产环境部署](#生产环境部署)
- [移动端部署](#移动端部署)
- [常见问题解决](#常见问题解决)

---

## 🚀 本地开发部署

### 环境要求

- **Python**: 3.8+
- **Node.js**: 16+
- **Chrome浏览器**: 用于Selenium解析
- **Git**: 版本控制

### 步骤1: 克隆项目

```bash
git clone https://github.com/jiegengyun/douyin-watermark-remover.git
cd douyin-watermark-remover
```

### 步骤2: 后端部署

```bash
# 1. 安装Python依赖
pip install -r requirements.txt

# 2. 启动后端服务
python app.py
```

**验证后端**：
- 访问：http://localhost:5000/api/test
- 预期返回：`{"msg": "后端服务正常运行"}`

### 步骤3: 前端部署

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装Node.js依赖
npm install

# 3. 启动开发服务器
npm start
```

**验证前端**：
- 访问：http://localhost:3000
- 应该看到登录页面

### 步骤4: 数据库初始化

后端首次启动时会自动创建SQLite数据库文件：
- 位置：`instance/app.db`
- 包含：用户表、历史记录表

### 步骤5: 测试功能

1. **注册用户**：http://localhost:3000/register
2. **登录系统**：http://localhost:3000/login
3. **解析视频**：http://localhost:3000/
4. **查看历史**：http://localhost:3000/history

---

## 🐳 Docker一键部署

### 环境要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### 快速部署

```bash
# 1. 克隆项目
git clone https://github.com/jiegengyun/douyin-watermark-remover.git
cd douyin-watermark-remover

# 2. 一键启动所有服务
docker-compose up -d

# 3. 查看服务状态
docker-compose ps
```

### 访问地址

- **前端应用**: http://localhost
- **后端API**: http://localhost:5000
- **监控面板**: http://localhost:9090

### 服务管理

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 更新部署
docker-compose pull
docker-compose up -d
```

### 数据持久化

Docker部署会自动创建以下数据卷：
- `./instance`: 数据库文件
- `./logs`: 应用日志
- `redis_data`: Redis缓存数据

---

## 🌐 生产环境部署

### 方案A: 传统服务器部署

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y python3 python3-pip nodejs npm nginx git

# 安装Chrome和ChromeDriver
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable
```

#### 2. 后端部署

```bash
# 创建应用目录
sudo mkdir -p /var/www/video-parser
sudo chown $USER:$USER /var/www/video-parser
cd /var/www/video-parser

# 克隆项目
git clone https://github.com/jiegengyun/douyin-watermark-remover.git .

# 安装Python依赖
pip3 install -r requirements.txt

# 创建系统服务
sudo tee /etc/systemd/system/video-parser.service << EOF
[Unit]
Description=Video Parser Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/video-parser
Environment=PATH=/var/www/video-parser/venv/bin
ExecStart=/var/www/video-parser/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable video-parser
sudo systemctl start video-parser
```

#### 3. 前端部署

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 构建生产版本
npm run build:prod

# 配置Nginx
sudo tee /etc/nginx/sites-available/video-parser << EOF
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/video-parser/frontend/build;
    index index.html;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # SPA路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/video-parser /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. SSL证书配置

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 方案B: 云服务器部署

#### 阿里云/腾讯云部署

```bash
# 1. 购买云服务器（推荐2核4G以上）
# 2. 配置安全组，开放80、443、5000端口
# 3. 连接服务器，执行上述传统部署步骤

# 或者使用一键部署脚本
curl -fsSL https://raw.githubusercontent.com/jiegengyun/douyin-watermark-remover/main/deploy.sh | bash
```

#### 宝塔面板部署

1. **安装宝塔面板**
2. **创建网站**
3. **上传项目文件**
4. **配置反向代理**
5. **设置SSL证书**

---

## 📱 移动端部署

### PWA部署

PWA功能已内置，无需额外配置：

1. **HTTPS访问**：确保使用HTTPS协议
2. **添加到主屏幕**：浏览器会自动提示
3. **离线访问**：Service Worker已配置缓存

### 移动端优化

```bash
# 检查PWA配置
cd frontend
npm run build
# 检查build目录中的manifest.json和sw.js

# 测试PWA功能
npx serve -s build
# 在手机浏览器中访问
```

---

## 🔧 配置说明

### 环境变量配置

```bash
# 创建环境变量文件
cat > .env << EOF
# 后端配置
FLASK_ENV=production
FLASK_APP=app.py
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# 数据库配置
DATABASE_URL=sqlite:///app.db

# Selenium配置
CHROME_HEADLESS=true
CHROME_NO_SANDBOX=true

# 前端配置
REACT_APP_API_URL=https://your-domain.com/api
EOF
```

### 数据库配置

```python
# app.py
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///app.db')
```

### 缓存配置

```python
# 使用Redis缓存（可选）
from flask_caching import Cache

cache = Cache(config={
    'CACHE_TYPE': 'redis',
    'CACHE_REDIS_URL': 'redis://localhost:6379/0'
})
```

---

## 📊 监控和维护

### 日志管理

```bash
# 查看后端日志
sudo journalctl -u video-parser -f

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看Docker日志
docker-compose logs -f backend
```

### 性能监控

```bash
# 安装监控工具
sudo apt install -y htop iotop nethogs

# 监控系统资源
htop
iotop
nethogs
```

### 备份策略

```bash
# 数据库备份
sqlite3 instance/app.db ".backup backup/app_$(date +%Y%m%d).db"

# 文件备份
tar -czf backup/files_$(date +%Y%m%d).tar.gz instance/ logs/

# 自动备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/video-parser"
mkdir -p $BACKUP_DIR

# 数据库备份
sqlite3 /var/www/video-parser/instance/app.db ".backup $BACKUP_DIR/db_$(date +%Y%m%d_%H%M%S).db"

# 文件备份
tar -czf $BACKUP_DIR/files_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/video-parser/instance/ /var/www/video-parser/logs/

# 清理7天前的备份
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh
# 添加到crontab：0 2 * * * /path/to/backup.sh
```

---

## 🆘 常见问题解决

### Q1: 后端启动失败

```bash
# 检查端口占用
sudo netstat -tlnp | grep :5000

# 检查Python版本
python3 --version

# 检查依赖安装
pip3 list | grep -E "(flask|selenium)"

# 查看详细错误
python3 app.py 2>&1 | tee error.log
```

### Q2: 前端无法连接后端

```bash
# 检查网络连接
curl http://localhost:5000/api/test

# 检查CORS配置
# 确保app.py中的CORS配置正确

# 检查防火墙
sudo ufw status
sudo ufw allow 5000
```

### Q3: Selenium解析失败

```bash
# 检查Chrome安装
google-chrome --version

# 检查ChromeDriver
which chromedriver

# 更新ChromeDriver
wget https://chromedriver.storage.googleapis.com/LATEST_RELEASE
wget https://chromedriver.storage.googleapis.com/$(cat LATEST_RELEASE)/chromedriver_linux64.zip
unzip chromedriver_linux64.zip
sudo mv chromedriver /usr/local/bin/
```

### Q4: 数据库权限问题

```bash
# 修复数据库权限
sudo chown www-data:www-data /var/www/video-parser/instance/
sudo chmod 755 /var/www/video-parser/instance/
sudo chmod 644 /var/www/video-parser/instance/app.db
```

### Q5: Nginx配置错误

```bash
# 检查Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 重启Nginx
sudo systemctl restart nginx
```

### Q6: SSL证书问题

```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew

# 检查证书路径
sudo ls -la /etc/letsencrypt/live/your-domain.com/
```

---

## 📞 技术支持

### 获取帮助

- **GitHub Issues**: [提交问题和功能请求](https://github.com/jiegengyun/douyin-watermark-remover/issues)
- **文档**: 查看项目README.md
- **社区**: 加入技术交流群

### 贡献代码

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 发起Pull Request

---

## 📄 许可证

本项目采用MIT许可证，详见LICENSE文件。

---

**注意**: 部署前请确保遵守相关法律法规，本工具仅供学习和个人使用。 