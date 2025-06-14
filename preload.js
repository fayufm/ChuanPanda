const { ipcRenderer, contextBridge, shell } = require('electron');

// 暴露API给渲染进程
contextBridge.exposeInMainWorld('pandaAPI', {
  // 获取熊猫新闻
  getLatestPandaNews: async () => {
    try {
      return await ipcRenderer.invoke('get-panda-news');
    } catch (error) {
      console.error('获取熊猫新闻失败:', error);
      return null;
    }
  },
  
  // 获取熊猫新闻（轻量版）
  getLatestPandaNewsLite: async () => {
    try {
      return await ipcRenderer.invoke('get-panda-news-lite');
    } catch (error) {
      console.error('获取轻量版熊猫新闻失败:', error);
      return null;
    }
  },
  
  // 获取熊猫知识
  getPandaKnowledge: async () => {
    try {
      return await ipcRenderer.invoke('get-panda-knowledge');
    } catch (error) {
      console.error('获取熊猫知识失败:', error);
      return null;
    }
  },
  
  // 获取熊猫直播信息
  getPandaLiveInfo: async () => {
    try {
      return await ipcRenderer.invoke('get-panda-live');
    } catch (error) {
      console.error('获取熊猫直播信息失败:', error);
      return null;
    }
  },
  
  // 获取熊猫位置数据
  getPandaLocations: async () => {
    try {
      return await ipcRenderer.invoke('get-panda-locations');
    } catch (error) {
      console.error('获取熊猫位置数据失败:', error);
      return null;
    }
  },
  
  // 打开外部链接
  openExternalLink: async (url) => {
    if (url) {
      try {
        console.log('正在尝试打开链接:', url);
        return await ipcRenderer.invoke('open-external-link', url);
      } catch (error) {
        console.error('打开外部链接失败:', error);
        return false;
      }
    }
    return false;
  },
  
  // 窗口控制API
  minimizeWindow: async () => {
    try {
      return await ipcRenderer.invoke('minimize-window');
    } catch (error) {
      console.error('最小化窗口失败:', error);
      return false;
    }
  },
  
  maximizeWindow: async () => {
    try {
      return await ipcRenderer.invoke('maximize-window');
    } catch (error) {
      console.error('最大化窗口失败:', error);
      return false;
    }
  },
  
  closeWindow: async () => {
    try {
      return await ipcRenderer.invoke('close-window');
    } catch (error) {
      console.error('关闭窗口失败:', error);
      return false;
    }
  }
}); 