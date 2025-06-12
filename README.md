# 川小熊猫 (ChuanPanda)

川小熊猫是一款基于Electron开发的桌面应用程序，提供全球熊猫动态查看服务。通过这款应用，用户可以实时了解世界各地熊猫的生活状态、保护情况以及相关新闻。

## 功能特点

- **全球熊猫地图**: 基于真实地理数据的世界地图，显示全球熊猫分布情况
- **熊猫新闻**: 实时更新的熊猫相关新闻和动态
- **熊猫知识**: 丰富的熊猫百科知识库
- **熊猫直播**: 连接世界各地熊猫基地的实时直播画面
- **环境数据**: 展示熊猫栖息地的环境数据和保护状况

## 技术栈

- Electron: 跨平台桌面应用框架
- HTML/CSS/JavaScript: 前端界面开发
- GeoJSON: 地理数据处理和可视化

## 安装与使用

1. 确保已安装Node.js环境
2. 克隆项目到本地
   ```
   git clone https://github.com/fayufm/ChuanPanda.git
   ```
3. 安装依赖
   ```
   cd ChuanPanda
   npm install
   ```
4. 启动应用
   ```
   npm start
   ```

## 项目结构

- `assets/`: 静态资源文件
  - `data/`: 地理数据文件
  - `maps/`: 地图相关资源
  - `logos/`: 图标和logo
- `src/`: 源代码
  - `renderer.js`: 主渲染进程
  - `api.js`: API接口
  - `styles.css`: 样式文件
- `main.js`: 主进程
- `app.js`: 应用配置

## 开发者

- fayufm

## 许可证

MIT 