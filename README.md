# 川小熊猫

全球熊猫动态查看器 - 一个美观、现代、灵动的桌面应用程序，用于查看全球熊猫动态、了解熊猫知识和查看公开监控。

## 功能特点

- **熊猫动态**: 查看全球最新的熊猫相关新闻和动态
- **熊猫知识**: 了解关于大熊猫的基本信息、生活习性和保护现状
- **实时监控**: 查看来自世界各地的大熊猫公开监控直播

## 技术特点

- 基于Electron框架，提供跨平台桌面体验
- 集成通义千问和DeepSeek AI API，提供最新熊猫资讯
- 响应式设计，适应不同屏幕尺寸
- 多种启动方式，支持Electron、Node.js和浏览器环境

## 安装与运行

### 方式一：使用npm命令

```bash
# 安装依赖
npm install

# 使用Electron启动
npm start

# 或使用Node.js启动
npm run start:node
```

### 方式二：使用PowerShell脚本

双击运行`启动川小熊猫.ps1`脚本文件，系统将自动选择合适的方式启动应用程序。

### 方式三：直接打开index.html

如果您的系统没有安装Node.js或Electron，可以直接用浏览器打开index.html文件，体验基础功能。

## API集成

本应用程序集成了两个AI API服务：

1. **通义千问 API**
   - API密钥: `sk-07ef4701031d41668beebb521e80eaf0`
   - 用途: 获取最新熊猫新闻和直播信息

2. **DeepSeek API**
   - API密钥: `sk-0b2be14756fe4195a7bc2bcb78d19f8f`
   - 用途: 获取熊猫知识库信息

API服务位于`src/api.js`文件中，通过preload.js在渲染进程中暴露。应用程序会根据运行环境自动选择合适的API调用方式。

## 开发指南

### 项目结构

```
川小熊猫/
├── main.js           # Electron主进程
├── preload.js        # 预加载脚本，暴露API
├── app.js            # Node.js启动入口
├── index.html        # HTML入口文件
├── src/
│   ├── api.js        # API服务
│   ├── renderer.js   # 渲染进程逻辑
│   └── styles.css    # 样式文件
├── 42.png            # 应用程序logo
├── 42-ico.ico        # 应用程序图标
└── 启动川小熊猫.ps1    # PowerShell启动脚本
```

### 自定义开发

1. 修改`src/api.js`中的API密钥和调用逻辑
2. 在`src/renderer.js`中添加新的UI组件和交互逻辑
3. 通过`main.js`添加新的Electron功能

## 许可证

ISC

## 致谢

- 图标和logo来源：项目根目录下的42-ico.ico和42.png文件 