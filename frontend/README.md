# 短视频无水印解析前端

基于 React + Ant Design 的短视频无水印解析工具前端界面。

## 功能特性

- 用户注册/登录系统
- 支持抖音、快手、小红书等平台视频解析
- 解析结果展示（视频链接、标题、作者、封面等）
- 历史记录管理
- 响应式设计，支持移动端

## 技术栈

- React 18
- Ant Design 5
- React Router 6
- Axios

## 安装和运行

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 启动开发服务器：
```bash
npm start
```

3. 构建生产版本：
```bash
npm run build
```

## 项目结构

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js      # 页面头部组件
│   │   ├── Login.js       # 登录/注册组件
│   │   ├── Home.js        # 主页解析组件
│   │   └── History.js     # 历史记录组件
│   ├── utils/
│   │   └── api.js         # API 接口封装
│   ├── App.js             # 主应用组件
│   ├── App.css            # 应用样式
│   ├── index.js           # 应用入口
│   └── index.css          # 全局样式
└── package.json
```

## 开发说明

- 前端默认运行在 http://localhost:3000
- 后端API地址配置在 `src/utils/api.js` 中
- 支持热重载开发
- 已配置代理，开发时可直接调用后端API

## 部署

构建完成后，将 `build` 目录部署到 Web 服务器即可。 