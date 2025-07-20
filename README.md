# 短视频无水印解析工具

一个支持抖音、快手、小红书等平台的短视频无水印解析下载工具，具备用户系统、历史记录、任务队列、PWA支持等功能。

## ✨ 功能特性

### 🎯 核心功能
- **多平台支持**：抖音、快手、小红书无水印视频解析
- **Selenium解析**：基于Selenium的稳定解析方案
- **用户系统**：注册、登录、JWT认证
- **历史记录**：解析历史管理，支持分页、搜索、筛选
- **任务队列**：批量解析，进度显示，任务管理
- **PWA支持**：离线访问、桌面安装、推送通知

### 📱 移动端优化
- **响应式设计**：完美适配手机、平板、桌面
- **手势操作**：触摸友好的交互体验
- **离线模式**：网络断开时仍可访问缓存内容
- **PWA安装**：支持添加到手机主屏幕

### 🚀 部署支持
- **Docker部署**：一键容器化部署
- **生产优化**：nginx配置、gzip压缩、缓存策略
- **监控支持**：Prometheus监控集成
- **SSL支持**：HTTPS安全访问

## 🛠️ 技术栈

### 后端
- **Flask**：Web框架
- **SQLAlchemy**：ORM数据库操作
- **JWT**：用户认证
- **Selenium**：网页自动化解析
- **SQLite**：数据存储

### 前端
- **React**：用户界面框架
- **Ant Design**：UI组件库
- **React Router**：路由管理
- **Axios**：HTTP客户端
- **PWA**：渐进式Web应用

## 📦 安装部署

### 开发环境

1. **克隆项目**
```bash
git clone <repository-url>
cd douyin无水印解析
```

2. **后端设置**
```bash
# 安装Python依赖
pip install -r requirements.txt

# 启动后端服务
python app.py
```

3. **前端设置**
```bash
cd frontend
npm install
npm start
```

### 生产部署

#### Docker部署（推荐）
```bash
# 一键部署
docker-compose up -d

# 访问地址
# 前端：http://localhost
# 后端：http://localhost:5000
# 监控：http://localhost:9090
```

#### 手动部署
```bash
# 构建前端
cd frontend
npm run build:prod

# 部署到nginx
sudo cp -r build/* /var/www/html/
```

### 📖 详细部署教程

- **[本地开发部署](./DEPLOY.md#本地开发部署)** - 适合开发调试
- **[Docker一键部署](./DEPLOY.md#docker一键部署)** - 推荐生产环境
- **[生产环境部署](./DEPLOY.md#生产环境部署)** - 传统服务器部署
- **[移动端部署](./DEPLOY.md#移动端部署)** - PWA和移动端优化
- **[常见问题解决](./DEPLOY.md#常见问题解决)** - 故障排除指南

## 🎮 使用指南

### 基本使用
1. **注册登录**：首次使用需要注册账号
2. **视频解析**：粘贴视频链接，点击解析
3. **批量处理**：在任务队列中添加多个链接
4. **历史查看**：查看所有解析历史记录

### 高级功能
1. **PWA安装**：浏览器会提示"添加到主屏幕"
2. **离线访问**：断网后仍可查看缓存内容
3. **推送通知**：在个人中心开启通知功能
4. **缓存管理**：查看和清除应用缓存

### 移动端使用
1. **手机访问**：在手机浏览器中访问应用
2. **添加到主屏幕**：点击"添加到主屏幕"
3. **全屏体验**：享受原生应用般的体验
4. **手势操作**：支持滑动、长按等手势

## 🔧 配置说明

### 环境变量
```bash
# 后端配置
FLASK_ENV=production
FLASK_APP=app.py
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# 前端配置
REACT_APP_API_URL=http://your-backend-url:5000
```

### 数据库配置
```python
# app.py
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
```

### Selenium配置
```python
# douyin_selenium_parser.py
chrome_options.add_argument('--headless')  # 无头模式
chrome_options.add_argument('--no-sandbox')  # 禁用沙盒
```

## 📊 性能优化

### 缓存策略
- **静态资源**：1年缓存，版本号控制
- **API响应**：Network First策略
- **Service Worker**：智能缓存管理

### 移动端优化
- **图片懒加载**：提升页面加载速度
- **代码分割**：按需加载组件
- **PWA缓存**：离线访问支持

### 服务器优化
- **Gzip压缩**：减少传输大小
- **Nginx缓存**：静态资源缓存
- **负载均衡**：支持多实例部署

## 🔒 安全特性

- **JWT认证**：安全的用户认证机制
- **CORS配置**：跨域请求安全控制
- **输入验证**：防止恶意输入
- **HTTPS支持**：加密传输

## 📈 监控告警

### 应用监控
- **Prometheus**：指标收集
- **Grafana**：可视化面板
- **健康检查**：服务状态监控

### 日志管理
- **访问日志**：用户行为分析
- **错误日志**：问题排查
- **性能日志**：性能优化

## 🤝 贡献指南

1. **Fork项目**
2. **创建功能分支**
3. **提交代码**
4. **发起Pull Request**

## 📄 许可证

MIT License

## 🆘 常见问题

### Q: 解析失败怎么办？
A: 检查网络连接，确认链接格式正确，尝试刷新页面。

### Q: 移动端无法访问？
A: 确保后端CORS配置正确，检查IP地址设置。

### Q: PWA无法安装？
A: 确保使用HTTPS协议，检查manifest.json配置。

### Q: 部署后无法访问？
A: 检查防火墙设置，确认端口开放，查看Docker日志。

## 📞 技术支持

- **Issues**：GitHub Issues
- **Email**：support@example.com
- **QQ群**：123456789

---

**注意**：本工具仅供学习和个人使用，请遵守相关平台的使用条款和法律法规。 