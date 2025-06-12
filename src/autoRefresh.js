// autoRefresh.js - 实时监控页面的自动刷新功能

// 添加刷新动画样式
function addRefreshStyles() {
  // 检查是否已经添加了样式
  if (document.getElementById('refresh-styles')) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'refresh-styles';
  
  styleElement.textContent = `
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .refresh-icon {
      display: inline-block;
      width: 16px;
      height: 16px;
      margin-right: 5px;
      border: 2px solid #4ecdc4;
      border-radius: 50%;
      border-top-color: transparent;
      animation: rotate 1s linear infinite;
    }
    
    .refresh-indicator {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 4px;
      padding: 5px 10px;
      font-size: 12px;
      color: #333;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      z-index: 100;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .refresh-indicator.active {
      opacity: 1;
    }
    
    .auto-refresh-toggle {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 5px 10px;
      font-size: 12px;
      cursor: pointer;
      z-index: 101;
      display: flex;
      align-items: center;
    }
    
    .auto-refresh-toggle.active {
      background: #4ecdc4;
    }
    
    .auto-refresh-toggle:hover {
      opacity: 0.9;
    }
  `;
  
  document.head.appendChild(styleElement);
}

// 创建刷新指示器
function createRefreshIndicator() {
  // 检查是否已经创建了指示器
  if (document.getElementById('refresh-indicator')) return document.getElementById('refresh-indicator');
  
  const indicator = document.createElement('div');
  indicator.id = 'refresh-indicator';
  indicator.className = 'refresh-indicator';
  
  const icon = document.createElement('span');
  icon.className = 'refresh-icon';
  
  const text = document.createElement('span');
  text.textContent = '正在更新数据...';
  
  indicator.appendChild(icon);
  indicator.appendChild(text);
  
  return indicator;
}

// 创建自动刷新开关
function createRefreshToggle() {
  // 检查是否已经创建了开关
  if (document.getElementById('auto-refresh-toggle')) return document.getElementById('auto-refresh-toggle');
  
  const toggle = document.createElement('button');
  toggle.id = 'auto-refresh-toggle';
  toggle.className = 'auto-refresh-toggle';
  toggle.innerHTML = '<span class="refresh-icon"></span> 自动更新已关闭';
  
  return toggle;
}

// 自动刷新状态
let autoRefreshEnabled = false;
let refreshInterval = null;
let currentRefreshFunction = null;
let currentRefreshContainer = null;
const DEFAULT_REFRESH_INTERVAL = 60000; // 默认60秒刷新一次

// 检查自动刷新是否处于活动状态
function isAutoRefreshActive() {
  return autoRefreshEnabled && refreshInterval !== null;
}

// 开始自动刷新
function startAutoRefresh(refreshFunction, interval = DEFAULT_REFRESH_INTERVAL) {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  // 保存当前刷新函数和间隔
  currentRefreshFunction = refreshFunction;
  
  // 设置新的刷新间隔
  refreshInterval = setInterval(() => {
    // 检查当前激活的页面，只在相应页面激活时执行刷新
    const activeNavItem = document.querySelector('.main-nav li.active');
    const currentPage = activeNavItem ? activeNavItem.getAttribute('data-page') : null;
    
    // 如果是新闻刷新函数，则只在新闻页面激活时执行
    if (refreshFunction.name === 'loadPandaNews' && currentPage !== 'news') {
      console.log('不在熊猫动态页面，跳过自动刷新');
      return;
    }
    
    // 如果是直播刷新函数，则只在直播页面激活时执行
    if (refreshFunction.name === 'refreshLiveData' && currentPage !== 'live') {
      console.log('不在实时监控页面，跳过自动刷新');
      return;
    }
    
    // 显示刷新指示器
    const shouldShowIndicator = 
      (refreshFunction.name === 'loadPandaNews' && currentPage === 'news') || 
      (refreshFunction.name === 'refreshLiveData' && currentPage === 'live');
    
    if (shouldShowIndicator) {
      showRefreshIndicator();
    }
    
    // 执行刷新函数，但不强制更新UI
    refreshFunction().then(() => {
      if (shouldShowIndicator) {
        hideRefreshIndicator();
        updateLastRefreshTime();
      }
    }).catch(error => {
      console.error('自动刷新失败:', error);
      if (shouldShowIndicator) {
        hideRefreshIndicator();
      }
    });
  }, interval);
  
  autoRefreshEnabled = true;
  
  // 更新开关状态
  updateToggleStatus(true);
  
  return refreshInterval;
}

// 停止自动刷新
function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  
  autoRefreshEnabled = false;
  currentRefreshFunction = null;
  
  // 更新开关状态
  updateToggleStatus(false);
}

// 更新开关状态
function updateToggleStatus(isActive) {
  // 更新直播页面的开关状态
  const liveToggle = document.getElementById('auto-refresh-toggle');
  if (liveToggle) {
    liveToggle.classList.toggle('active', isActive);
    liveToggle.innerHTML = isActive ? 
      '<span class="refresh-icon"></span> 自动更新已开启' : 
      '<span class="refresh-icon"></span> 自动更新已关闭';
  }
  
  // 更新新闻页面的开关状态
  const newsToggle = document.getElementById('auto-refresh-toggle-news');
  if (newsToggle) {
    newsToggle.checked = isActive;
  }
}

// 切换自动刷新状态
function toggleAutoRefresh(refreshFunction, interval = DEFAULT_REFRESH_INTERVAL) {
  if (autoRefreshEnabled) {
    stopAutoRefresh();
  } else {
    startAutoRefresh(refreshFunction, interval);
  }
  
  return autoRefreshEnabled;
}

// 显示刷新指示器
function showRefreshIndicator() {
  const indicator = document.getElementById('refresh-indicator');
  if (indicator) {
    indicator.classList.add('active');
  }
}

// 隐藏刷新指示器
function hideRefreshIndicator() {
  const indicator = document.getElementById('refresh-indicator');
  if (indicator) {
    indicator.classList.remove('active');
    
    // 短暂显示"更新完成"
    indicator.querySelector('span:last-child').textContent = '更新完成';
    setTimeout(() => {
      indicator.querySelector('span:last-child').textContent = '正在更新数据...';
    }, 1000);
  }
}

// 更新上次刷新时间
function updateLastRefreshTime() {
  const now = new Date();
  const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  // 更新所有环境数据的时间戳
  const envUpdates = document.querySelectorAll('.env-update');
  envUpdates.forEach(update => {
    update.textContent = `上次更新: 刚刚`;
  });
  
  // 更新熊猫状态的时间戳
  const pandaUpdates = document.querySelectorAll('.panda-update');
  pandaUpdates.forEach(update => {
    update.textContent = `上次更新: 刚刚`;
  });
  
  // 更新熊猫动态页面的时间戳
  const newsUpdateTime = document.querySelector('.news-update-time');
  if (newsUpdateTime) {
    newsUpdateTime.textContent = `最后更新时间: ${now.toLocaleString('zh-CN', { hour12: false })}`;
  }
  
  // 添加或更新页面上的最后刷新时间
  let lastRefreshElement = document.getElementById('last-refresh-time');
  if (lastRefreshElement) {
    lastRefreshElement.textContent = now.toLocaleString('zh-CN', { hour12: false });
  } else {
    lastRefreshElement = document.createElement('div');
    lastRefreshElement.id = 'last-refresh-time';
    lastRefreshElement.style.cssText = 'text-align: right; font-size: 12px; color: #666; margin-top: 10px;';
    
    const contentContainer = document.querySelector('.live-page') || document.querySelector('.news-page');
    if (contentContainer) {
      contentContainer.appendChild(lastRefreshElement);
    }
  }
  
  // 更新自动刷新开关的状态
  const autoRefreshToggle = document.getElementById('auto-refresh-toggle-news');
  if (autoRefreshToggle) {
    const refreshButton = document.getElementById('refresh-news');
    if (refreshButton && autoRefreshToggle.checked) {
      refreshButton.classList.add('refreshing');
      setTimeout(() => {
        refreshButton.classList.remove('refreshing');
      }, 1000);
    }
  }
}

// 初始化自动刷新功能
function initAutoRefresh(container, refreshFunction, interval = DEFAULT_REFRESH_INTERVAL) {
  // 保存当前容器引用
  currentRefreshContainer = container;
  
  // 添加样式
  addRefreshStyles();
  
  // 如果是直播页面，创建并添加刷新指示器和开关
  if (container.classList.contains('live-page')) {
    // 创建并添加刷新指示器
    const indicator = createRefreshIndicator();
    container.appendChild(indicator);
    
    // 创建并添加自动刷新开关
    const toggle = createRefreshToggle();
    container.appendChild(toggle);
    
    // 绑定开关点击事件
    toggle.addEventListener('click', () => {
      toggleAutoRefresh(refreshFunction, interval);
    });
  }
  
  // 初始化上次刷新时间
  updateLastRefreshTime();
}

// 导出函数
module.exports = {
  initAutoRefresh,
  startAutoRefresh,
  stopAutoRefresh,
  toggleAutoRefresh,
  showRefreshIndicator,
  hideRefreshIndicator,
  updateLastRefreshTime,
  updateToggleStatus,
  isAutoRefreshActive
};
