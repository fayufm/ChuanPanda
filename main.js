const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const url = require('url');

// 导入API服务
const pandaAPI = require('./src/api.js');

// 保持对窗口对象的全局引用，如果不这样做，
// 当JavaScript对象被垃圾回收时，窗口将会自动关闭
let mainWindow;

function createWindow() {
  // 创建浏览器窗口，使用无边框模式以实现自定义标题栏
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '42-ico.ico'),
    frame: false, // 无边框模式
    transparent: false, // 非透明
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 移除系统级菜单栏
  mainWindow.setMenuBarVisibility(false);

  // 加载应用的index.html
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // 设置窗口标题
  mainWindow.setTitle('川小熊猫 - 全球熊猫动态查看器');

  // 打开开发者工具
  // mainWindow.webContents.openDevTools();

  // 当窗口关闭时调用的方法
  mainWindow.on('closed', function () {
    // 取消引用窗口对象，通常如果应用程序支持多窗口，
    // 会将窗口存储在数组中，这时应该删除相应的元素
    mainWindow = null;
  });
  
  // 处理所有链接在默认浏览器中打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.on('ready', createWindow);

// 当所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  // 在macOS上，用户通常希望应用程序及其菜单栏保持活动状态，
  // 直到用户使用Cmd + Q明确退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // 在macOS上，当点击dock图标并且没有其他窗口打开时，
  // 通常会在应用程序中重新创建一个窗口
  if (mainWindow === null) {
    createWindow();
  }
});

// 设置IPC通信处理窗口操作
ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
  return true;
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
  return mainWindow.isMaximized();
});

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.close();
  return true;
});

// 设置IPC通信处理API请求
ipcMain.handle('get-panda-news', async () => {
  try {
    return await pandaAPI.getLatestPandaNews();
  } catch (error) {
    console.error('获取熊猫新闻失败:', error);
    return null;
  }
});

// 设置IPC通信处理轻量版API请求
ipcMain.handle('get-panda-news-lite', async () => {
  try {
    return await pandaAPI.getLatestPandaNewsLite();
  } catch (error) {
    console.error('获取轻量版熊猫新闻失败:', error);
    return null;
  }
});

ipcMain.handle('get-panda-knowledge', async () => {
  try {
    return await pandaAPI.getPandaKnowledge();
  } catch (error) {
    console.error('获取熊猫知识失败:', error);
    return null;
  }
});

ipcMain.handle('get-panda-live', async () => {
  try {
    return await pandaAPI.getPandaLiveInfo();
  } catch (error) {
    console.error('获取熊猫直播信息失败:', error);
    return null;
  }
});

// 添加IPC处理程序，用于获取熊猫位置数据
ipcMain.handle('get-panda-locations', async () => {
  try {
    return await pandaAPI.getPandaLocations();
  } catch (error) {
    console.error('获取熊猫位置数据失败:', error);
    return null;
  }
});

// 添加IPC处理程序，用于打开外部链接
ipcMain.handle('open-external-link', async (event, url) => {
  if (url) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// 在这里可以包含应用程序特定的主进程代码
// 也可以把它们放在单独的文件中，然后在这里导入 