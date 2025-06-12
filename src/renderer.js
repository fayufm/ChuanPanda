// 应用程序主逻辑
// 导入自动刷新模块
let autoRefresh;
try {
  autoRefresh = require('./autoRefresh.js');
} catch (error) {
  console.error('加载自动刷新模块失败:', error);
  // 创建一个空的模拟模块，以防模块加载失败
  autoRefresh = {
    initAutoRefresh: () => {},
    startAutoRefresh: () => {},
    stopAutoRefresh: () => {},
    toggleAutoRefresh: () => {},
    updateLastRefreshTime: () => {}
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  
  // 创建应用程序布局
  createAppLayout(app);
  
  // 初始化导航事件
  initNavEvents();
  
  // 默认加载熊猫动态页面
  // 确保UI状态与加载的页面一致
  const newsNavItem = document.querySelector('.main-nav li[data-page="news"]');
  if (newsNavItem) {
    newsNavItem.classList.add('active');
  }
  loadPandaNews();
});

// 创建应用程序布局
function createAppLayout(container) {
  container.innerHTML = `
    <div class="app-container">
      <div class="custom-titlebar">
        <div class="titlebar-drag-region">
          <div class="titlebar-icon">
            <img src="./assets/panda_logo1.png" alt="川小熊猫" class="titlebar-logo">
          </div>
          <div class="titlebar-title">川小熊猫 - 全球熊猫动态查看器</div>
        </div>
        <div class="titlebar-controls">
          <button class="titlebar-button" id="minimize-btn" title="最小化">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="6" width="10" height="1" fill="currentColor" />
            </svg>
          </button>
          <button class="titlebar-button" id="maximize-btn" title="最大化">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1.5" y="1.5" width="9" height="9" stroke="currentColor" fill="none" stroke-width="1.25"/>
            </svg>
          </button>
          <button class="titlebar-button close-button" id="close-btn" title="关闭">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.5" />
              <line x1="1" y1="11" x2="11" y2="1" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>
        </div>
      </div>
      <header class="app-header">
        <div class="logo-container">
          <div class="custom-logo">
            <img src="./assets/panda_logo1.png" alt="川小熊猫" class="app-logo-image">
            <div class="logo-overlay">熊猫</div>
          </div>
          <h1>川小熊猫</h1>
        </div>
        <nav class="main-nav">
          <ul>
            <li data-page="map">熊猫地图</li>
            <li data-page="news" class="active">熊猫动态</li>
            <li data-page="knowledge">熊猫知识</li>
            <li data-page="live">实时监控</li>
            <li data-page="settings">软件设置</li>
          </ul>
        </nav>
      </header>
      <main class="app-content">
        <div id="content-container" class="content-container">
          <!-- 内容将动态加载到这里 -->
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>正在加载熊猫数据...</p>
          </div>
        </div>
      </main>
    </div>
  `;
  
  // 添加标题栏控制按钮事件
  const api = getAPI();
  if (api && api.minimizeWindow) {
    document.getElementById('minimize-btn').addEventListener('click', () => {
      api.minimizeWindow();
    });
    
    document.getElementById('maximize-btn').addEventListener('click', async () => {
      const isMaximized = await api.maximizeWindow();
      const maximizeBtn = document.getElementById('maximize-btn');
      
      // 根据窗口状态更新按钮图标
      if (isMaximized) {
        maximizeBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1.5" y="1.5" width="7" height="7" stroke="currentColor" fill="none" stroke-width="1.25"/>
            <rect x="3.5" y="3.5" width="7" height="7" stroke="currentColor" fill="none" stroke-width="1.25"/>
          </svg>
        `;
        maximizeBtn.setAttribute('title', '还原');
      } else {
        maximizeBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1.5" y="1.5" width="9" height="9" stroke="currentColor" fill="none" stroke-width="1.25"/>
          </svg>
        `;
        maximizeBtn.setAttribute('title', '最大化');
      }
    });
    
    document.getElementById('close-btn').addEventListener('click', () => {
      api.closeWindow();
    });
  } else {
    // 如果不在Electron环境中，隐藏自定义标题栏
    const titlebar = document.querySelector('.custom-titlebar');
    if (titlebar) {
      titlebar.style.display = 'none';
    }
  }
}

// 初始化导航事件
function initNavEvents() {
  const navItems = document.querySelectorAll('.main-nav li');
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      // 获取当前页面和目标页面
      const currentActivePage = document.querySelector('.main-nav li.active');
      const currentPage = currentActivePage ? currentActivePage.getAttribute('data-page') : null;
      const targetPage = this.getAttribute('data-page');
      
      console.log(`页面切换: 从 ${currentPage} 到 ${targetPage}`);
      
      // 如果从熊猫动态页面切换到其他页面，检查是否需要暂停自动刷新
      if (currentPage === 'news' && targetPage !== 'news' && typeof autoRefresh !== 'undefined') {
        // 不停止自动刷新，让页面检查逻辑处理
        console.log('从熊猫动态页面切换到其他页面');
      }
      
      // 移除所有活动状态
      navItems.forEach(nav => nav.classList.remove('active'));
      
      // 添加当前活动状态
      this.classList.add('active');
      
      // 根据选择的页面加载内容
      const page = this.getAttribute('data-page');
      switch (page) {
        case 'map':
          loadPandaMap();
          break;
        case 'news':
          loadPandaNews();
          break;
        case 'knowledge':
          loadPandaKnowledge();
          break;
        case 'live':
          loadPandaLive();
          break;
        case 'settings':
          loadAppSettings();
          break;
      }
    });
  });
}

// 获取API实例
function getAPI() {
  // 检查是否在Electron环境中
  if (window.pandaAPI) {
    return window.pandaAPI;
  } else if (window.api) {
    // 浏览器环境中的模拟API
    return window.api;
  } else {
    console.error('未找到API服务');
    return null;
  }
}

// 存储全部新闻数据
let allPandaNews = [];
let currentDisplayedNews = 0;
const NEWS_PER_PAGE = 10;
const MAX_NEWS = 30;

// 根据日期对新闻进行排序（从新到旧）
function sortNewsByDate(newsArray) {
  return [...newsArray].sort((a, b) => {
    // 从日期字符串中提取年、月、日
    const getDateParts = (dateStr) => {
      if (!dateStr) return { year: 2000, month: 1, day: 1 };
      
      // 匹配"YYYY年MM月DD日"格式
      const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (match) {
        return {
          year: parseInt(match[1]),
          month: parseInt(match[2]),
          day: parseInt(match[3])
        };
      }
      
      // 尝试匹配其他可能的日期格式
      const altMatch = dateStr.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      if (altMatch) {
        return {
          year: parseInt(altMatch[1]),
          month: parseInt(altMatch[2]),
          day: parseInt(altMatch[3])
        };
      }
      
      // 如果无法解析日期，返回一个很早的日期
      return { year: 2000, month: 1, day: 1 };
    };
    
    const dateA = getDateParts(a.date);
    const dateB = getDateParts(b.date);
    
    // 比较年份
    if (dateA.year !== dateB.year) {
      return dateB.year - dateA.year;
    }
    // 年份相同，比较月份
    if (dateA.month !== dateB.month) {
      return dateB.month - dateA.month;
    }
    // 年月相同，比较日
    return dateB.day - dateA.day;
  });
}

// 加载熊猫动态页面
async function loadPandaNews() {
  console.log('loadPandaNews被调用');
  
  // 检查当前激活的页面是否是熊猫动态页面
  const activeNavItem = document.querySelector('.main-nav li.active');
  const currentPage = activeNavItem ? activeNavItem.getAttribute('data-page') : null;
  console.log('当前页面:', currentPage);
  
  // 如果当前不是在熊猫动态页面，且不是初始加载，则只获取数据但不更新UI
  const isInitialLoad = !document.querySelector('.page-container');
  
  // 检查是否是自动刷新触发的调用
  const isAutoRefreshActive = typeof autoRefresh !== 'undefined' && 
                             autoRefresh.isAutoRefreshActive && 
                             autoRefresh.isAutoRefreshActive();
  
  // 如果不是熊猫动态页面，则只更新数据，不刷新UI
  if (currentPage !== 'news' && !isInitialLoad) {
    console.log('当前不在熊猫动态页面，只更新数据不刷新UI');
    try {
      // 只获取数据，不更新UI
      const api = getAPI();
      if (api) {
        const newsData = await api.getLatestPandaNews();
        if (newsData && newsData.length > 0) {
          // 更新全局数据但不渲染
          allPandaNews = sortNewsByDate(newsData);
        }
      }
    } catch (error) {
      console.error('后台更新熊猫新闻数据失败:', error);
    }
    return; // 提前返回，不执行UI更新
  }
  
  // 再次确认当前页面是熊猫动态页面
  if (currentPage !== 'news' && !isInitialLoad) {
    console.log('当前不在熊猫动态页面，跳过UI更新');
    return;
  }
  
  const contentContainer = document.getElementById('content-container');
  
  // 显示加载状态
  contentContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>正在加载熊猫动态...</p></div>';
  
  try {
    // 获取API实例
    const api = getAPI();
    if (!api) {
      throw new Error('API服务不可用');
    }
    
    // 获取新闻数据
    const newsData = await api.getLatestPandaNews();
    
    if (!newsData || newsData.length === 0) {
      throw new Error('未获取到熊猫新闻数据');
    }
    
    // 对新闻进行排序，确保最新的新闻在最上面
    const sortedNewsData = sortNewsByDate(newsData);
    
    // 保存所有新闻数据到全局变量
    allPandaNews = sortedNewsData;
    currentDisplayedNews = 0;
    
    // 最后一次检查当前页面
    const finalCheck = document.querySelector('.main-nav li.active');
    const finalPage = finalCheck ? finalCheck.getAttribute('data-page') : null;
    if (finalPage !== 'news') {
      console.log('UI渲染前最终检查：当前不在熊猫动态页面，跳过UI渲染');
      return;
    }
    
    // 初始渲染首页新闻（前10条）
    renderPandaNews(contentContainer);
    
    // 初始化自动更新功能
    if (typeof autoRefresh !== 'undefined' && autoRefresh.initAutoRefresh) {
      const newsPageContainer = document.querySelector('.news-page');
      if (newsPageContainer) {
        // 在页面顶部添加刷新控件容器
        const refreshControlsContainer = document.createElement('div');
        refreshControlsContainer.className = 'refresh-controls';
        refreshControlsContainer.innerHTML = `
          <div class="refresh-status">
            <span>最后更新时间: </span>
            <span id="last-refresh-time">${new Date().toLocaleString('zh-CN', { hour12: false })}</span>
          </div>
          <div class="refresh-actions">
            <div class="auto-refresh-toggle">
              <input type="checkbox" id="auto-refresh-toggle-news">
              <label for="auto-refresh-toggle-news">自动更新</label>
            </div>
            <select class="refresh-interval" id="refresh-interval-news">
              <option value="30000">30秒</option>
              <option value="60000" selected>1分钟</option>
              <option value="300000">5分钟</option>
              <option value="600000">10分钟</option>
              <option value="1800000">30分钟</option>
            </select>
          </div>
        `;
        
        // 将刷新控件插入到标题下方
        const newsTitle = newsPageContainer.querySelector('h2');
        if (newsTitle && newsTitle.nextSibling) {
          newsPageContainer.insertBefore(refreshControlsContainer, newsTitle.nextSibling);
        } else {
          newsPageContainer.insertBefore(refreshControlsContainer, newsPageContainer.firstChild.nextSibling);
        }
        
        // 初始化自动更新
        autoRefresh.initAutoRefresh(newsPageContainer, loadPandaNews, 60000);
        
        // 添加刷新间隔选择事件
        const refreshIntervalSelect = document.getElementById('refresh-interval-news');
        if (refreshIntervalSelect) {
          refreshIntervalSelect.addEventListener('change', function() {
            const interval = parseInt(this.value);
            if (autoRefresh.toggleAutoRefresh) {
              // 如果自动更新已启用，则重新启动以应用新间隔
              const autoRefreshToggle = document.getElementById('auto-refresh-toggle-news');
              if (autoRefreshToggle && autoRefreshToggle.checked) {
                autoRefresh.stopAutoRefresh();
                autoRefresh.startAutoRefresh(loadPandaNews, interval);
              }
            }
          });
        }
        
        // 添加自动更新开关事件
        const autoRefreshToggle = document.getElementById('auto-refresh-toggle-news');
        if (autoRefreshToggle) {
          autoRefreshToggle.addEventListener('change', function() {
            const interval = parseInt(document.getElementById('refresh-interval-news').value);
            if (this.checked) {
              autoRefresh.startAutoRefresh(loadPandaNews, interval);
            } else {
              autoRefresh.stopAutoRefresh();
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('加载熊猫新闻失败:', error);
    contentContainer.innerHTML = `
      <div class="error-container">
        <p>加载熊猫新闻失败，请稍后再试。</p>
        <p class="error-details">${error.message}</p>
        <button id="retry-news" class="retry-button">重试</button>
      </div>
    `;
    
    // 添加重试按钮点击事件
    const retryButton = document.getElementById('retry-news');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        loadPandaNews();
      });
    }
  }
}

// 渲染熊猫新闻内容
function renderPandaNews(container) {
  // 初始化新闻HTML
  let newsHtml = '';
  
  // 首次加载时创建页面容器
  if (currentDisplayedNews === 0) {
    newsHtml = `
      <div class="page-container news-page">
        <h2>全球熊猫动态</h2>
        <p class="news-update-time">最后更新时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}</p>
        <div class="news-container" id="news-container">
    `;
  } else {
    // 获取现有新闻容器
    const newsContainer = document.getElementById('news-container');
    if (newsContainer) {
      newsContainer.innerHTML = '';
      container = newsContainer;
    }
    
    // 更新最后刷新时间
    const lastRefreshTime = document.getElementById('last-refresh-time');
    if (lastRefreshTime) {
      lastRefreshTime.textContent = new Date().toLocaleString('zh-CN', { hour12: false });
    }
    
    const newsUpdateTime = document.querySelector('.news-update-time');
    if (newsUpdateTime) {
      newsUpdateTime.textContent = `最后更新时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}`;
    }
  }
  
  // 计算要显示的新闻范围
  const endIndex = Math.min(currentDisplayedNews + NEWS_PER_PAGE, allPandaNews.length, MAX_NEWS);
  
  // 添加新闻内容
  for (let i = 0; i < endIndex; i++) {
    const news = allPandaNews[i];
    
    // 检查新闻数据完整性
    if (!news.title || !news.description) {
      console.warn('跳过不完整的新闻数据:', news);
      continue;
    }
    
    // 处理可能缺失的图片
    const imageUrl = news.image || './assets/panda_logo1.png';
    
    // 处理可能缺失的链接
    const newsUrl = news.url || '#';
    
    // 处理可能缺失的来源logo
    const sourceLogoUrl = news.sourceLogo || './assets/panda_logo1.png';
    
    // 生成新闻HTML
    const newsItemHtml = `
      <article class="news-item">
        <div class="news-content">
          <div class="news-header">
            <h3>${news.title}</h3>
            <div class="source-logo-container">
              <img src="${sourceLogoUrl}" alt="${news.source || '未知来源'}" class="source-logo" onerror="this.src='./assets/panda_logo1.png'">
            </div>
          </div>
          <div class="news-meta">
            <p class="news-date">${news.date || '日期未知'}</p>
            <p class="news-source">来源: ${news.source || '未知来源'}</p>
          </div>
          <p class="news-description">${news.description}</p>
          <a href="${newsUrl}" class="read-more" target="_blank" data-url="${newsUrl}">阅读更多</a>
        </div>
      </article>
    `;
    
    // 首次加载时追加到HTML字符串，否则直接添加到容器
    if (currentDisplayedNews === 0) {
      newsHtml += newsItemHtml;
    } else {
      container.innerHTML += newsItemHtml;
    }
  }
  
  // 更新当前显示的新闻数量
  currentDisplayedNews = endIndex;
  
  // 首次加载时完成HTML并更新内容
  if (currentDisplayedNews <= NEWS_PER_PAGE) {
    // 添加加载更多按钮和刷新按钮
    newsHtml += `
        </div>
        <div class="news-actions">
          <button id="load-more-news" class="load-more-button" ${currentDisplayedNews >= Math.min(allPandaNews.length, MAX_NEWS) ? 'style="display:none;"' : ''}>加载更多</button>
          <button id="refresh-news" class="refresh-button">
            <span class="refresh-icon"></span>
            刷新新闻
          </button>
        </div>
      </div>
    `;
    
    // 更新内容
    container.innerHTML = newsHtml;
    
    // 添加加载更多按钮点击事件
    const loadMoreButton = document.getElementById('load-more-news');
    if (loadMoreButton) {
      loadMoreButton.addEventListener('click', loadMoreNews);
    }
    
    // 添加刷新按钮点击事件
    const refreshButton = document.getElementById('refresh-news');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        // 添加刷新动画
        refreshButton.classList.add('refreshing');
        
        // 执行刷新
        loadPandaNews().finally(() => {
          // 移除刷新动画
          refreshButton.classList.remove('refreshing');
        });
      });
    }
  } else {
    // 更新加载更多按钮状态
    const loadMoreButton = document.getElementById('load-more-news');
    if (loadMoreButton) {
      if (currentDisplayedNews >= Math.min(allPandaNews.length, MAX_NEWS)) {
        loadMoreButton.style.display = 'none';
      } else {
        loadMoreButton.style.display = 'block';
      }
    }
  }
  
  // 添加阅读更多点击事件
  const readMoreLinks = document.querySelectorAll('.read-more');
  readMoreLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const url = this.getAttribute('data-url');
      if (!url || url === '#') {
        console.log('新闻链接无效');
        return;
      }
      
      // 使用Electron的shell.openExternal打开链接
      if (window.pandaAPI && window.pandaAPI.openExternalLink) {
        window.pandaAPI.openExternalLink(url)
          .then(result => {
            console.log('链接打开结果:', result);
          })
          .catch(error => {
            console.error('打开链接时出错:', error);
            // 失败时回退到浏览器默认行为
            window.open(url, '_blank');
          });
      } else {
        // 在浏览器环境中直接打开链接
        window.open(url, '_blank');
      }
    });
  });
}

// 加载更多新闻
function loadMoreNews() {
  // 如果已经显示了全部新闻或达到最大显示数量，则不再加载
  if (currentDisplayedNews >= Math.min(allPandaNews.length, MAX_NEWS)) {
    console.log('已显示全部可加载的新闻');
    return;
  }
  
  // 获取新闻容器
  const newsContainer = document.getElementById('news-container');
  if (!newsContainer) {
    console.error('未找到新闻容器');
    return;
  }
  
  // 渲染更多新闻
  renderPandaNews(newsContainer);
}

// 加载熊猫知识页面
async function loadPandaKnowledge() {
  const contentContainer = document.getElementById('content-container');
  
  // 显示加载状态
  contentContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>正在加载熊猫知识...</p></div>';
  
  try {
    // 获取API实例
    const api = getAPI();
    if (!api) {
      throw new Error('API服务不可用');
    }
    
    // 获取知识数据
    const knowledgeData = await api.getPandaKnowledge();
    
    // 构建知识HTML
    let knowledgeHtml = `
      <div class="page-container knowledge-page">
        <h2>熊猫百科知识</h2>
        
        <!-- 添加分类导航 -->
        <div class="knowledge-nav">
          <ul>
            <li><a href="#basic-info" class="knowledge-nav-item active">基本知识</a></li>
            <li><a href="#panda-culture" class="knowledge-nav-item">熊猫文化</a></li>
            <li><a href="#panda-science" class="knowledge-nav-item">熊猫科普</a></li>
            <li><a href="#conservation" class="knowledge-nav-item">保护现状</a></li>
            <li><a href="#research" class="knowledge-nav-item">研究成就</a></li>
          </ul>
        </div>
    `;
    
    // 基本信息部分
    knowledgeHtml += `
      <div id="basic-info" class="knowledge-section">
        <h3>${knowledgeData.basicInfo.title}</h3>
        <div class="knowledge-content">
          <img src="./assets/熊猫.jpg" alt="大熊猫" class="knowledge-image" onerror="this.src='./assets/panda_logo1.png'">
          <div class="knowledge-text">
            ${knowledgeData.basicInfo.content.map(text => `<p>${text}</p>`).join('')}
            <p>大熊猫是世界上最受欢迎的濒危动物之一，成年大熊猫体长约1.2-1.5米，体重约100-150千克。它们拥有标志性的黑白毛色，黑色部分包括眼睛周围、耳朵、鼻子、肩膀和四肢，其余部分为白色。</p>
            <p>大熊猫拥有独特的"第六指"（腕骨演变而来的拇指），这使它们能够轻松握住竹子。它们的消化系统虽然属于食肉动物，但已经适应了以竹子为主的饮食习惯。</p>
            <p>目前，野生大熊猫主要分布在中国四川省（约1,200只）、陕西省（约300多只）和甘肃省（约100多只）的山区，总数已接近1,900只。大熊猫保护区总面积达到约260万公顷。</p>
          </div>
        </div>
      </div>
    `;
    
    // 生活习性部分
    knowledgeHtml += `
      <div class="knowledge-section">
        <h3>${knowledgeData.habits.title}</h3>
        <div class="knowledge-list">
          <ul>
            ${knowledgeData.habits.items.map(item => `
              <li><strong>${item.subtitle}：</strong>${item.content}</li>
            `).join('')}
            <li><strong>领地行为：</strong>大熊猫是独居动物，每只大熊猫都有自己的领地。它们通过在树上留下气味标记、刮擦树皮等方式划定领地范围。一只成年雄性大熊猫的领地大约为3-7平方公里，而雌性的领地则相对较小。</li>
            <li><strong>交流方式：</strong>大熊猫通过多种声音进行交流，包括鸣叫、吼叫和吱吱声等。在繁殖季节，它们的叫声尤为明显。此外，它们还通过气味标记进行间接交流。</li>
            <li><strong>活动规律：</strong>大熊猫一天中有10-16小时用于觅食，其余时间多用于休息。它们既是昼行性也是夜行性动物，但在人类活动频繁的地区，它们更倾向于在夜间活动。</li>
            <li><strong>体温调节：</strong>大熊猫喜欢凉爽的环境，适宜温度为17-25℃。在夏季，它们会移动到海拔较高的地区避暑；冬季则移动到较低海拔地区。</li>
          </ul>
        </div>
      </div>
    `;
    
    // 新增：熊猫文化部分
    knowledgeHtml += `
      <div id="panda-culture" class="knowledge-section">
        <h3>熊猫文化</h3>
        <div class="knowledge-content">
          <div class="knowledge-text">
            <p>大熊猫作为中国的国宝，在中华文化中拥有深厚的历史底蕴和丰富的文化内涵，从古代文献记载到现代流行文化，熊猫形象贯穿了中华文明的发展历程。</p>
          </div>
        </div>
        
        <h4>历史记载与文化渊源</h4>
        <p>大熊猫在中国古代文献中早有记载。西汉时期的《尔雅》中称之为"貘"，《尔雅翼》中描述："貘，似熊而小，黑白色，能食铜铁。"唐代诗人白居易在《卢侍御所传画熊》中描述："黑白分明画不成，团团只有一身轻。"宋代文献《太平广记》中记载了"食铁兽"的形象。明代李时珍的《本草纲目》中对大熊猫有更为详细的记载："貘，形似熊而小，黑白花，能食铜铁，齿爪俱利。"</p>
        <p>在中国传统文化中，黑白相间的熊猫被视为阴阳平衡的象征，代表着和谐与自然的统一。古代神话中，熊猫被认为具有辟邪驱灾的神奇力量，在一些地方民间传说中，熊猫被视为吉祥的象征，能带来好运和平安。</p>
        
        <h4>文学艺术中的熊猫形象</h4>
        <p>大熊猫在中国传统文学、绘画、雕塑等艺术形式中频繁出现。古代文人墨客常以熊猫为题材创作诗词歌赋，赞美其独特的外形和性格。明清时期的山水画中，时常可见熊猫栖息于竹林之中的场景，象征着隐逸和超脱的生活态度。</p>
        <p>现代文学作品如《熊猫的故事》、《我们的朋友熊猫》、《熊猫回家》等广受欢迎，这些作品不仅描绘了熊猫的生活习性，还融入了对自然保护和生态平衡的思考。许多当代艺术家如吴冠中、黄永玉等也以大熊猫为主题创作了大量作品，将传统文化元素与现代艺术表现手法相结合。</p>
        <p>在中国传统工艺美术中，熊猫形象被广泛应用于剪纸、刺绣、木雕、陶瓷等领域，成为中国文化的重要符号之一。这些艺术品不仅在国内广受欢迎，也成为向世界展示中国文化的重要媒介。</p>
        
        <div class="culture-gallery">
          <div class="culture-item">
            <h4>熊猫外交与国际影响</h4>
            <p>自1950年代开始，中国政府通过赠送大熊猫给友好国家，开展了被称为"熊猫外交"的活动。1972年，中国向美国赠送的一对大熊猫"玲玲"和"兴兴"，成为中美关系正常化的重要象征，吸引了超过100万美国民众参观。此后，中国向日本、法国、英国、墨西哥等多个国家赠送或租借大熊猫，这一独特的外交方式增进了中国与世界各国的友好关系，成为中国文化软实力的重要组成部分。</p>
            <p>熊猫外交不仅促进了国际友谊，也提高了全球对大熊猫保护的关注。通过这种方式，大熊猫成为了和平、友谊和自然保护的国际象征，在促进文化交流和环境保护意识方面发挥了重要作用。</p>
            <p>目前，中国已经与全球20多个国家的动物园建立了大熊猫保护研究合作关系，这些合作项目不仅包括大熊猫繁育和研究，还涵盖了相关的文化交流活动，进一步扩大了大熊猫的国际影响力。</p>
          </div>
          <div class="culture-item">
            <h4>熊猫符号学与文化象征</h4>
            <p>大熊猫黑白分明的外表被赋予了丰富的象征意义，在中国传统哲学中，黑白两色代表阴阳，象征着宇宙的基本对立统一关系。熊猫的形象因此被视为和谐、平衡与中庸之道的体现，反映了中国传统文化中追求天人合一的思想。</p>
            <p>在现代社会，大熊猫已成为和平、友谊、保护环境的国际象征。1961年，世界自然基金会(WWF)将大熊猫作为其标志，这一选择使大熊猫成为全球野生动物保护运动的旗帜。大熊猫温和、友善的形象与其濒危的处境形成对比，唤起了人们对自然保护的共鸣。</p>
            <p>在中国文化中，大熊猫还象征着坚韧与适应力。尽管面临栖息地丧失和气候变化等挑战，大熊猫仍然顽强生存，这种精神被赋予了积极的文化意义，成为中国人民不屈不挠精神的象征之一。</p>
          </div>
        </div>
        
        <h4>熊猫在流行文化中的地位</h4>
        <p>在现代流行文化中，大熊猫的形象无处不在，从电影、动画到广告、游戏，熊猫已成为全球最受欢迎的动物形象之一。</p>
        <ul>
          <li><strong>影视作品：</strong>《功夫熊猫》系列电影全球热映，主角"阿宝"将中国功夫与熊猫形象完美结合，展现了中国文化的魅力。该系列不仅在商业上取得了巨大成功，还通过融入中国传统文化元素如太极、气功、禅宗思想等，向全球观众传播了中国文化精髓。此外，纪录片《我们诞生在中国》、《熊猫回家路》等作品也向世界展示了大熊猫的生活和保护工作。</li>
          <li><strong>动漫形象：</strong>"熊猫烧香"、"功夫熊猫"、"熊猫头"等动漫形象深受全球观众喜爱。在互联网文化中，熊猫表情包广泛流传，成为网络交流的重要组成部分。中国原创动画《熊猫和小鼹鼠》、《熊猫走天下》等作品也在国内外获得了良好反响，成为向儿童传播环保理念的重要媒介。</li>
          <li><strong>吉祥物：</strong>1990年北京亚运会吉祥物"盼盼"是一只可爱的大熊猫，成为中国体育赛事吉祥物设计的经典。此后，2008年北京奥运会的五个"福娃"中也包含了熊猫形象"晶晶"。2022年北京冬奥会的吉祥物"冰墩墩"虽然是一只冰晶熊猫，但其设计灵感也部分来源于大熊猫，再次证明了熊猫形象在中国国际形象塑造中的重要地位。</li>
          <li><strong>文创产品：</strong>熊猫主题的文具、服装、玩具、数码产品等文创产品风靡全球，成为中国文化输出的重要载体。成都大熊猫繁育研究基地、北京动物园等地的熊猫周边产品年销售额达数亿元，形成了完整的"熊猫经济"产业链。这些产品不仅具有商业价值，也在潜移默化中传播着熊猫保护的理念。</li>
          <li><strong>数字文化：</strong>在数字时代，熊猫形象被广泛应用于电子游戏、虚拟现实体验和社交媒体平台。如《动物森友会》中的熊猫角色、《我的世界》中的熊猫模型等。一些互联网公司也将熊猫元素融入其品牌标识，如"熊猫直播"等。这些数字化表现进一步扩大了熊猫文化的影响范围，特别是在年轻受众中。</li>
        </ul>
        
        <h4>熊猫与地方文化</h4>
        <p>在四川、陕西、甘肃等大熊猫栖息地区域，形成了独特的"熊猫文化圈"。当地民间故事、传说、节日庆典中常有大熊猫的身影。如四川民间流传的"猫熊变熊猫"的传说，讲述了黑熊与白猫相恋，生下黑白相间后代的故事，体现了当地人民对大熊猫的喜爱和想象力。</p>
        <p>四川成都已将大熊猫文化融入城市建设和旅游发展战略，打造"熊猫之都"城市品牌。成都大熊猫繁育研究基地、都江堰熊猫谷、卧龙自然保护区等地每年吸引数千万游客，带动了当地旅游业、餐饮业和住宿业的发展。熊猫元素被广泛应用于城市雕塑、公共设施和建筑设计中，成为城市文化景观的重要组成部分。</p>
        <p>在饮食文化方面，四川地区出现了"熊猫餐厅"、"熊猫面包"、"熊猫奶茶"等特色美食，将熊猫元素与传统饮食相结合。手工艺方面，熊猫蜀绣、熊猫剪纸、熊猫竹编等传统工艺品深受游客喜爱，促进了非物质文化遗产的传承和创新。</p>
        <p>此外，当地还定期举办"熊猫文化节"、"熊猫电影周"等文化活动，通过艺术展览、学术研讨、文艺表演等形式，丰富熊猫文化的内涵，提升其影响力。这些活动不仅促进了文化交流，也增强了公众对大熊猫保护的意识。</p>
      </div>
    `;
    
    // 新增：熊猫科普部分
    knowledgeHtml += `
      <div id="panda-science" class="knowledge-section">
        <h3>熊猫科普</h3>
        <div class="knowledge-content">
          <div class="knowledge-text">
            <p>大熊猫不仅是可爱的动物，更是一个充满科学奥秘的物种。作为地球上最受喜爱的濒危物种之一，大熊猫的生物学特性、进化历史和生态价值都蕴含着丰富的科学知识。以下内容将从多个角度深入浅出地介绍大熊猫的科学知识，帮助我们更全面地了解这一独特物种。</p>
          </div>
        </div>
        
        <h4>大熊猫的分类与进化</h4>
        <p>大熊猫(学名：Ailuropoda melanoleuca)属于食肉目、熊科、大熊猫亚科、大熊猫属的唯一物种。尽管在分类学上归于食肉目，但大熊猫已经进化出了主要以竹子为食的特殊习性。</p>
        <p>大熊猫的进化历史可追溯到约800万年前的中新世晚期，当时出现了最早的大熊猫祖先——始熊猫。化石记录表明，大熊猫的祖先最初分布范围很广，包括中国南方、东南亚甚至欧洲部分地区。约在400-200万年前，大熊猫开始适应竹食性生活方式，逐渐形成了现在的特征。</p>
        <p>基因组研究显示，大熊猫与其他熊类动物的分化发生在约2000万年前，它们的近亲是熊科动物，而非小熊猫。2009年完成的大熊猫全基因组测序为研究其进化历史提供了重要依据，科学家发现大熊猫基因组中有许多与消化、免疫系统相关的基因发生了显著变化，这些变化帮助它们适应了以竹子为主的饮食习惯。</p>
        
        <h4>有趣的熊猫科学事实</h4>
        <div class="science-facts">
          <div class="fact-item">
            <h5>食肉动物的素食者</h5>
            <p>虽然大熊猫属于食肉目，但它们99%的食物是竹子。这种饮食习惯的转变是进化的奇迹。大熊猫的消化系统仍保留着食肉动物的基本特征，如短肠道和简单胃结构，但通过特殊的肠道微生物群落，它们能够从竹子中获取足够的营养。研究发现，大熊猫肠道中存在多种能分解纤维素的细菌，这些微生物帮助它们消化竹子中的纤维素和半纤维素。</p>
            <p>有趣的是，大熊猫的基因组中负责肉类消化的基因(如负责鲜味感受的T1R1基因)已经发生了变异，这导致它们对肉类的兴趣大大降低。这种基因变异发生在约400万年前，与它们转向竹食性生活方式的时间相吻合。</p>
          </div>
          <div class="fact-item">
            <h5>神奇的"第六指"</h5>
            <p>大熊猫前掌上有一个特殊的"拇指"，实际上是腕骨中的籽骨(种子骨)演变而来的，这使它们能够更有效地抓握竹子。这个伪拇指与其他五个真正的手指协作，使大熊猫能够以惊人的灵活性操作竹子，每分钟可以剥离15-30根竹子。</p>
            <p>2021年发表的一项研究通过对大熊猫祖先化石的分析，发现这个"第六指"的进化过程长达700万年，是自然选择的奇妙例子。研究人员还发现，大熊猫的腕骨结构与其他熊类相比有显著差异，这些差异专门适应了它们的竹食习性。</p>
            <p>更令人惊讶的是，大熊猫的后掌也有类似的结构，虽然不如前掌的"拇指"发达，但同样有助于它们在吃竹子时保持稳定姿势。</p>
          </div>
          <div class="fact-item">
            <h5>超低能量消耗</h5>
            <p>研究发现，大熊猫的新陈代谢率只有同体型动物的约60%，这是它们能够以低营养价值的竹子为食的关键适应。一项发表在《科学》杂志上的研究测量了野生大熊猫的能量消耗，发现它们每天的能量消耗仅为同等体重黑熊的38%。</p>
            <p>这种低能量消耗与几个因素有关：首先，大熊猫的甲状腺激素水平较低，这降低了其基础代谢率；其次，它们的主要器官如肝脏、大脑相对较小，减少了能量需求；最后，大熊猫每天有超过一半的时间用于休息，活动量远低于其他熊类。</p>
            <p>这种独特的能量策略使大熊猫能够在营养价值不高的竹子饮食下生存，但也使它们对环境变化特别敏感，因为它们没有多余的能量储备来应对突发情况。</p>
          </div>
          <div class="fact-item">
            <h5>独特的黑白配色</h5>
            <p>大熊猫标志性的黑白毛色一直是科学家研究的热点。2017年发表在《行为生态学》杂志上的研究提出，这种配色可能具有多重功能：白色面部有助于面部表情交流；黑色耳朵可能是警示信号；黑色四肢有助于在雪地中保持体温；白色身体则在雪地环境中提供伪装。</p>
            <p>另一项研究发现，大熊猫的黑白配色在其栖息地的光照条件下具有出色的伪装效果。在竹林中，黑白相间的毛色能够打破轮廓，使捕食者难以发现它们。这种保护色适应了大熊猫既在雪地又在竹林中活动的生活习性。</p>
            <p>基因研究表明，控制大熊猫黑白毛色的基因与其他哺乳动物的毛色基因有显著不同，这些基因的特殊变异可能是大熊猫适应特定生态位的结果。</p>
          </div>
        </div>
        
        <h4>熊猫的生态习性与行为学</h4>
        <p><strong>饮食习惯：</strong>大熊猫是典型的食竹专家，每天需要消耗10-38公斤竹子，占用10-16小时进食时间。它们主要食用箭竹、拐棍竹等20多种竹子，并会根据季节变化选择不同部位：春季偏好嫩笋，夏秋季节吃竹叶，冬季则以竹茎为主。有趣的是，大熊猫对竹子的消化率仅为17%左右，远低于其他草食动物，这也是它们需要大量进食的原因。</p>
        <p><strong>活动模式：</strong>大熊猫既有昼行性也有夜行性特征，通常每天有2-4个活动高峰。在人类活动频繁的地区，它们更倾向于夜间活动。大熊猫的活动范围较小，成年雄性的领地约为3-7平方公里，雌性则为1-4平方公里。它们通过在树上留下气味标记、刮擦树皮等方式划定领地范围。</p>
        <p><strong>社交行为：</strong>大熊猫是典型的独居动物，除交配季节外很少与同类接触。它们通过多种声音进行交流，包括鸣叫、吼叫和吱吱声等，科学家已记录了至少13种不同的发声。此外，它们还通过气味标记和视觉信号进行间接交流。研究表明，大熊猫能够通过嗅闻其他个体的气味标记获取有关性别、年龄、繁殖状态等信息。</p>
        <p><strong>繁殖特点：</strong>大熊猫的繁殖周期极为特殊，雌性每年仅有1-3天的发情期，这大大增加了自然繁殖的难度。雌性大熊猫怀孕期为3-5个月，通常一胎产1-2仔。幼崽出生后完全依赖母亲，直到约1.5岁才开始独立生活。野外大熊猫的平均寿命为15-20年，而圈养个体可达25-30年。</p>
        
        <h4>熊猫宝宝的成长</h4>
        <ul>
          <li><strong>出生体重：</strong>大熊猫幼崽出生时仅重80-200克，约为母亲体重的1/900，是哺乳动物中相对体重最小的新生儿之一。这种极小的出生体重与大熊猫短暂的有效妊娠期(实际胚胎发育仅40-45天)有关，科学家认为这可能是为了减轻母亲的能量负担。</li>
          <li><strong>早期发育：</strong>幼崽出生时几乎是无毛、粉红色、眼睛紧闭的，需要约45天才能睁开眼睛，这比大多数熊类幼崽的发育速度慢。在最初几周，母亲几乎不离开幼崽，每2-3小时喂奶一次。幼崽的生长速度惊人，出生后6个月体重可增加约100倍。</li>
          <li><strong>黑白花纹：</strong>幼崽出生一周后开始出现标志性的黑白花纹，约3周后完全显现。这种花纹的出现顺序也很有规律：先是眼睛周围出现黑色斑块，然后是耳朵、肩膀，最后是四肢。研究表明，这种发育顺序与大熊猫进化史中黑色区域的获得顺序相一致。</li>
          <li><strong>学习技能：</strong>幼崽5-6个月开始尝试固体食物，8个月左右开始学习爬树，这是它们重要的防御技能。一岁左右的幼崽开始学习独立觅食，但仍然依赖母亲的保护和指导。研究发现，母亲会有意识地将幼崽带到不同类型的竹林，教导它们识别和食用不同种类的竹子。</li>
          <li><strong>独立生活：</strong>幼崽约1.5-2岁开始独立生活，性成熟则需要5-7年时间。雌性通常在5-6岁首次繁殖，而雄性则需要6-7岁才能成功交配。野外观察发现，年轻的大熊猫在独立初期死亡率较高，这可能与它们缺乏觅食和避险经验有关。</li>
        </ul>
        
        <h4>熊猫与生态系统</h4>
        <p>大熊猫是典型的"伞护种"，保护大熊猫及其栖息地同时也保护了栖息地内的其他数千种动植物。一项对大熊猫国家公园的生物多样性调查发现，该区域内有超过8,000种植物和2,000种脊椎动物，其中包括许多珍稀濒危物种。</p>
        <p>大熊猫通过食用竹子和排泄，在生态系统中扮演着重要角色。研究表明，大熊猫的粪便中含有大量未消化的竹子种子和纤维，这些物质返回土壤后能够促进竹林更新和土壤肥力提升。一项发表在《生态学》杂志上的研究发现，大熊猫栖息地的土壤中有更丰富的微生物多样性和更高的养分含量。</p>
        <p>此外，大熊猫的活动习性也有助于维持森林生态系统的健康。它们在竹林中穿行时会踩踏和折断一些竹子，创造出小型干扰区域，这些区域为其他植物的生长提供了机会，增加了栖息地的异质性。研究人员还发现，大熊猫的领地标记行为(如在树上磨爪)能够创造微生境，为一些特殊的真菌和昆虫提供栖息地。</p>
        <p>从更广泛的生态系统服务角度看，大熊猫栖息地(主要是山地森林)提供了重要的水源涵养、碳储存、水土保持等功能。据估计，大熊猫栖息地每年提供的生态系统服务价值超过25亿美元，远高于保护投入。这表明，保护大熊猫不仅有生态意义，也具有重要的经济价值。</p>
        
        <h4>最新科研进展</h4>
        <p><strong>基因组研究：</strong>2018年，科学家完成了大熊猫基因组的高质量测序和组装，这一成果为研究大熊猫的进化历史和适应机制提供了重要工具。研究人员发现大熊猫基因组中有多个与免疫系统、嗅觉和味觉相关的基因发生了特殊变化，这些变化可能与它们适应特定生态位有关。</p>
        <p><strong>肠道微生物组：</strong>2019年的研究揭示了大熊猫肠道中存在特殊的微生物群落，这些微生物能够帮助分解竹子中的纤维素。有趣的是，尽管大熊猫主要吃植物，但其肠道微生物组更类似于食肉动物而非草食动物，这反映了它们的进化历史。</p>
        <p><strong>行为生态学：</strong>利用GPS项圈和红外相机技术，科学家对野生大熊猫的行为模式有了更深入的了解。2020年的一项研究发现，气候变化正在影响大熊猫的活动规律和栖息地选择，导致它们向更高海拔地区迁移。另一项研究则揭示了大熊猫如何通过调整活动时间来避免与人类活动冲突。</p>
        <p><strong>繁殖生物学：</strong>2021年，研究人员成功解析了大熊猫发情期的激素调控机制，这一发现为改进人工繁育技术提供了理论基础。科学家还发现，大熊猫的繁殖成功与栖息地质量、气候条件和个体健康状况密切相关。</p>
        <p><strong>保护遗传学：</strong>2022年的一项研究通过分析野生大熊猫种群的遗传多样性，确定了几个关键的生态廊道，这些廊道对维持不同亚种群之间的基因交流至关重要。研究人员建议优先保护这些区域，以防止种群进一步碎片化。</p>
        
        <h4>互动科普问答</h4>
        <div class="science-quiz">
          <div class="quiz-item">
            <p class="quiz-question">问：大熊猫每天需要吃多少竹子？</p>
            <p class="quiz-answer">答：成年大熊猫每天需要吃12-38公斤竹子，占用10-16小时进食时间。由于竹子的营养价值低，且大熊猫对竹子的消化率仅为17%左右，它们必须摄入大量食物才能满足能量需求。有趣的是，大熊猫每天排出的粪便量约为10公斤，几乎与摄入量相当，这反映了竹子中大部分纤维未被消化。</p>
          </div>
          <div class="quiz-item">
            <p class="quiz-question">问：大熊猫为什么主要吃竹子？</p>
            <p class="quiz-answer">答：这是长期进化的结果。约400万年前，大熊猫的祖先开始转向以竹子为食，可能是因为竹子在其栖息地全年可得，竞争者少，且当时其他食物资源有限。随着时间推移，大熊猫进化出了适应竹食的特殊结构(如"第六指")和消化系统。基因组研究发现，大熊猫的T1R1基因(负责感知肉类鲜味)已经失活，这可能导致它们对肉类的兴趣降低。此外，大熊猫通过降低能量消耗和增加摄食量，成功适应了这种低营养的食物来源。</p>
          </div>
          <div class="quiz-item">
            <p class="quiz-question">问：大熊猫是濒危动物吗？</p>
            <p class="quiz-answer">答：2016年，国际自然保护联盟(IUCN)将大熊猫的保护状态从"濒危"降为"易危"，这反映了中国在大熊猫保护方面取得的显著成就。根据2020年的全国大熊猫调查，野生大熊猫数量已增至1,864只，比2000年增加了17%。然而，大熊猫仍面临栖息地破碎化、气候变化和竹子开花枯死等威胁。特别是气候变化可能导致大熊猫适宜栖息地面积减少29-36%，这对其长期生存构成挑战。因此，尽管保护状态有所改善，大熊猫仍需要持续的保护努力。</p>
          </div>
          <div class="quiz-item">
            <p class="quiz-question">问：大熊猫在野外如何交流？</p>
            <p class="quiz-answer">答：大熊猫主要通过声音、气味和视觉信号进行交流。它们有至少13种不同的发声，包括叫声、吼叫、吱吱声等，用于表达不同情绪和意图。在繁殖季节，雌性会发出特殊的叫声吸引雄性。气味标记是大熊猫最重要的交流方式，它们会在树干上摩擦臀部腺体留下气味，或用尿液标记领地。这些气味标记包含个体信息，如性别、年龄、繁殖状态等。视觉交流主要通过身体姿势和面部表情实现，研究发现大熊猫的黑白面部有助于增强表情的可见性。</p>
          </div>
          <div class="quiz-item">
            <p class="quiz-question">问：大熊猫的寿命有多长？</p>
            <p class="quiz-answer">答：野生大熊猫的平均寿命约为15-20年，而圈养个体可以活到25-30岁。目前记录的最长寿命是中国动物园的一只名为"巴斯"的雌性大熊猫，它活到了38岁(相当于人类的100多岁)。大熊猫的寿命受多种因素影响，包括遗传、栖息地质量、食物可用性和健康状况等。研究表明，野外大熊猫的死亡原因主要包括疾病、老年、捕食(主要是幼崽)和人类活动干扰。随着保护措施的加强和兽医技术的进步，大熊猫的平均寿命在过去几十年有所增加。</p>
          </div>
        </div>
      </div>
    `;
    
    // 保护现状部分
    knowledgeHtml += `
      <div id="conservation" class="knowledge-section">
        <h3>${knowledgeData.conservation.title}</h3>
        ${knowledgeData.conservation.content.map(text => `<p>${text}</p>`).join('')}
        <p>中国政府实施的保护措施包括：</p>
        <ol>
          <li><strong>栖息地保护：</strong>中国建立了67个自然保护区，总面积超过1,300,000公顷，保护了约54%的大熊猫栖息地，覆盖了约67%的野生大熊猫种群。</li>
          <li><strong>国家公园建设：</strong>2021年10月，中国大熊猫国家公园正式设立，面积27,134平方公里，占大熊猫自然栖息地的大约70%，整合了3个省份的大熊猫保护区。</li>
          <li><strong>生态廊道建设：</strong>通过建设生态廊道连接分散的大熊猫栖息地，促进种群交流，提高遗传多样性。</li>
          <li><strong>科研繁育：</strong>中国大熊猫保护研究中心等机构在大熊猫繁育、疾病防控、野化培训等领域取得重大突破，圈养大熊猫数量已超过600只。</li>
          <li><strong>国际合作：</strong>中国与多个国家和国际组织开展大熊猫保护合作，进行科学研究和公众教育。</li>
        </ol>
        <p>面临的主要威胁：</p>
        <ul>
          <li>栖息地破碎化：公路、水电站等建设将大熊猫栖息地分割成孤立的小区域，阻碍基因交流。</li>
          <li>气候变化：全球气候变暖可能导致大熊猫主食竹子的开花周期改变，影响食物供应。</li>
          <li>竹子开花枯死：竹子在开花后会全面枯死，重新生长需要数年时间，曾导致大熊猫饥饿死亡。</li>
          <li>人类活动干扰：旅游、采集等活动可能打扰大熊猫的正常生活。</li>
        </ul>
      </div>
    `;
    
    // 研究成就部分
    knowledgeHtml += `
      <div id="research" class="knowledge-section">
        <h3>研究成就</h3>
        <p>大熊猫研究在近几十年取得了显著进展：</p>
        <ul>
          <li><strong>基因组测序：</strong>2010年，科学家完成了大熊猫全基因组测序，为研究大熊猫进化历史和保护提供了重要依据。</li>
          <li><strong>人工繁育技术：</strong>中国科学家攻克了大熊猫人工繁育难题，成功率从早期的30%提高到现在的90%以上。</li>
          <li><strong>野化放归：</strong>截至2023年，中国已有超过25只人工繁育的大熊猫成功放归野外，其中多只已成功繁育后代。</li>
          <li><strong>行为学研究：</strong>通过红外相机监测等技术，科学家对野生大熊猫的行为习性有了更深入的了解。</li>
          <li><strong>疾病防控：</strong>研究人员已经识别并能够有效治疗大熊猫常见疾病，显著降低了死亡率。</li>
        </ul>
      </div>
    `;
    
    // 添加翻译按钮
    knowledgeHtml += `
      <div class="knowledge-section translation-section">
        <h3>多语言翻译</h3>
        <p>选择以下语言查看熊猫知识的翻译版本：</p>
        <div class="translation-buttons">
          <button id="translate-en" class="translation-button">
            <img src="./assets/panda_logo1.png" alt="English" style="width:24px; height:24px;">
            English
          </button>
          <button id="translate-ru" class="translation-button">
            <img src="./assets/panda_logo2.png" alt="Русский" style="width:24px; height:24px;">
            Русский
          </button>
          <button id="translate-zh" class="translation-button active">
            <img src="./assets/panda_logo3.jpg" alt="中文" style="width:24px; height:24px;">
            中文
          </button>
        </div>
      </div>
    `;
    
    // 关闭HTML标签
    knowledgeHtml += `
      </div>
    `;
    
    // 更新内容
    contentContainer.innerHTML = knowledgeHtml;
    
    // 添加翻译按钮点击事件
    const translateToEnglish = document.getElementById('translate-en');
    const translateToRussian = document.getElementById('translate-ru');
    const translateToChinese = document.getElementById('translate-zh');
    
    if (translateToEnglish) {
      translateToEnglish.addEventListener('click', function() {
        translateKnowledgePage('en');
      });
    }
    
    if (translateToRussian) {
      translateToRussian.addEventListener('click', function() {
        translateKnowledgePage('ru');
      });
    }
    
    if (translateToChinese) {
      translateToChinese.addEventListener('click', function() {
        translateKnowledgePage('zh');
      });
    }
    
    // 添加知识分类导航点击事件
    const navItems = document.querySelectorAll('.knowledge-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        
        // 移除所有导航项的活动状态
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // 添加当前导航项的活动状态
        this.classList.add('active');
        
        // 滚动到目标部分
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
    
    // 删除可能导致页面自动跳转的代码
    // 不要移除和重新绑定导航事件
    
  } catch (error) {
    console.error('加载熊猫知识失败:', error);
    contentContainer.innerHTML = '<div class="error-container"><p>加载熊猫知识失败，请稍后再试。</p></div>';
  }
}

// 翻译熊猫知识页面
function translateKnowledgePage(language) {
  // 获取所有翻译按钮
  const allButtons = document.querySelectorAll('.translation-button');
  // 移除所有按钮的活动状态
  allButtons.forEach(btn => btn.classList.remove('active'));
  
  // 设置当前语言按钮为活动状态
  const currentButton = document.getElementById(`translate-${language}`);
  if (currentButton) {
    currentButton.classList.add('active');
  }
  
  // 获取所有需要翻译的元素
  const titleElements = document.querySelectorAll('.knowledge-section h3');
  const paragraphElements = document.querySelectorAll('.knowledge-section p');
  const listItemElements = document.querySelectorAll('.knowledge-section li');
  const pageTitle = document.querySelector('.knowledge-page h2');
  
  // 根据选择的语言进行翻译
  if (language === 'en') {
    // 英文翻译
    if (pageTitle) pageTitle.textContent = 'Panda Encyclopedia Knowledge';
    
    // 翻译标题元素
    titleElements.forEach(el => {
      // 支持从俄文切换到英文
      const originalText = el.textContent;
      
      // 将俄文标题映射回中文标题，再翻译成英文
      let chineseText = '';
      if (originalText === 'Основная информация о больших пандах') {
        chineseText = '大熊猫基本信息';
      } else if (originalText === 'Привычки жизни') {
        chineseText = '生活习性';
      } else if (originalText === 'Статус охраны') {
        chineseText = '保护现状';
      } else if (originalText === 'Исследовательские достижения') {
        chineseText = '研究成就';
      } else if (originalText === 'Культурное значение') {
        chineseText = '文化意义';
      } else if (originalText === 'Многоязычный перевод') {
        chineseText = '多语言翻译';
      } else {
        chineseText = originalText; // 可能已经是中文或英文
      }
      
      // 将中文标题翻译成英文
      switch (chineseText) {
        case '大熊猫基本信息':
          el.textContent = 'Basic Information about Giant Pandas';
          break;
        case '生活习性':
          el.textContent = 'Living Habits';
          break;
        case '保护现状':
          el.textContent = 'Conservation Status';
          break;
        case '研究成就':
          el.textContent = 'Research Achievements';
          break;
        case '文化意义':
          el.textContent = 'Cultural Significance';
          break;
        case '多语言翻译':
          el.textContent = 'Multi-language Translation';
          break;
      }
    });
    
    // 翻译段落文本（简化示例，实际应用中可以更详细）
    paragraphElements.forEach(el => {
      // 针对特定段落进行翻译
      if (el.textContent.includes('大熊猫是世界上最受欢迎的濒危动物之一') || 
          el.textContent.includes('Giant pandas are one of the most popular endangered animals') ||
          el.textContent.includes('Giant pandas are regarded as China\'s national treasure')) {
        el.textContent = 'Giant pandas are one of the most popular endangered animals in the world. Adult giant pandas are about 1.2-1.5 meters long and weigh about 100-150 kilograms. They have iconic black and white fur, with black parts including around the eyes, ears, nose, shoulders, and limbs, and the rest being white.';
      } else if (el.textContent.includes('大熊猫拥有独特的"第六指"') || 
                el.textContent.includes('Giant pandas have a unique "sixth finger"')) {
        el.textContent = 'Giant pandas have a unique "sixth finger" (evolved from the carpal bone), which allows them to easily grip bamboo. Although their digestive system belongs to carnivores, it has adapted to a diet primarily consisting of bamboo.';
      } else if (el.textContent.includes('目前，野生大熊猫主要分布在中国四川省') || 
                el.textContent.includes('Currently, wild giant pandas are mainly distributed')) {
        el.textContent = 'Currently, wild giant pandas are mainly distributed in the mountainous areas of Sichuan Province (about 1,200), Shaanxi Province (more than 300), and Gansu Province (more than 100) in China, with a total of nearly 1,900. The total area of giant panda reserves has reached about 2.6 million hectares.';
      } else if (el.textContent.includes('大熊猫在中国文化和国际交往中具有重要地位') ||
                el.textContent.includes('Giant pandas hold an important position')) {
        el.textContent = 'Giant pandas hold an important position in Chinese culture and international relations:';
      } else if (el.textContent.includes('大熊猫研究在近几十年取得了显著进展') ||
                el.textContent.includes('Giant panda research has made significant progress')) {
        el.textContent = 'Giant panda research has made significant progress in recent decades:';
      } else if (el.textContent.includes('中国政府实施的保护措施包括') ||
                el.textContent.includes('Conservation measures implemented by the Chinese government')) {
        el.textContent = 'Conservation measures implemented by the Chinese government include:';
      } else if (el.textContent.includes('面临的主要威胁') ||
                el.textContent.includes('Main threats faced')) {
        el.textContent = 'Main threats faced:';
      } else if (el.textContent.includes('选择以下语言查看熊猫知识的翻译版本') ||
                el.textContent.includes('Select the following languages to view')) {
        el.textContent = 'Select the following languages to view translated versions of panda knowledge:';
      } 
      // 熊猫文化部分的翻译
      else if (el.textContent.includes('大熊猫作为中国的国宝，在中华文化中拥有深厚的历史底蕴') ||
                el.textContent.includes('Giant pandas, as China\'s national treasure')) {
        el.textContent = 'Giant pandas are regarded as China\'s national treasure, a symbol of China\'s unique cultural heritage and biodiversity.';
      }
      else if (el.textContent.includes('大熊猫在中国古代文献中早有记载') ||
                el.textContent.includes('Giant pandas were recorded in ancient Chinese literature')) {
        el.textContent = 'Giant pandas have a long history in Chinese culture. In ancient literature, they were called "貘". In "Yi Jing", it describes: "貘, like a bear but smaller, black and white, able to eat copper and iron". In "Lüshi Chunqiu", it mentions: "貘, black and white, difficult to draw, round, only with a light body". In "Tai Ping Guang Ji", it describes: "貘, black and white, difficult to draw, round, only with a light body". In "Ben Cao Gang Mu", it has a more detailed description: "貘, like a bear but smaller, black and white, able to eat copper and iron, sharp claws and teeth".';
      } 
      else if (el.textContent.includes('在中国传统文化中，黑白相间的熊猫被视为阴阳平衡的象征') ||
                el.textContent.includes('In traditional Chinese culture, the black and white panda')) {
        el.textContent = 'In traditional Chinese culture, the black and white panda is considered a symbol of yin and yang balance, representing harmony and unity with nature. In ancient myths, pandas were believed to have magical powers to ward off evil spirits and disasters. In some local legends, pandas were seen as symbols of good luck, able to bring good fortune and peace.';
      }
      // 熊猫科普部分的翻译
      else if (el.textContent.includes('大熊猫不仅是可爱的动物，更是一个充满科学奥秘的物种') ||
                el.textContent.includes('Giant pandas are not only adorable animals')) {
        el.textContent = 'Giant pandas are not only adorable animals, but also a species full of scientific mysteries. As one of the most beloved endangered species on Earth, their biological characteristics, evolutionary history, and ecological significance contain rich scientific knowledge. The following content will introduce scientific knowledge about giant pandas from various perspectives, helping us understand this unique species more comprehensively.';
      } 
      else if (el.textContent.includes('大熊猫(学名：Ailuropoda melanoleuca)属于食肉目') ||
                el.textContent.includes('Giant pandas (scientific name: Ailuropoda melanoleuca)')) {
        el.textContent = 'Giant pandas (scientific name: Ailuropoda melanoleuca) belong to the order Carnivora, family Ursidae, subfamily Ailuropodinae, genus Ailuropoda, and are the only species. Although classified as carnivores in taxonomy, giant pandas have evolved into a special diet primarily consisting of bamboo.';
      } 
      else if (el.textContent.includes('大熊猫的进化历史可追溯到约800万年前的中新世晚期') ||
                el.textContent.includes('The evolutionary history of giant pandas can be traced back')) {
        el.textContent = 'The evolutionary history of giant pandas can be traced back to the late Miocene, about 8 million years ago, when the earliest ancestor of giant pandas - Ailurarctos - appeared. Fossil records show that the ancestors of giant pandas were originally widely distributed, including southern China, Southeast Asia, and even parts of Europe. About 4-2 million years ago, giant pandas began to adapt to bamboo-based lifestyles and gradually formed their current characteristics.';
      }
    });
    
    // 翻译列表项
    listItemElements.forEach(el => {
      const strongTag = el.querySelector('strong');
      if (strongTag) {
        // 翻译小标题（带有strong标签的部分）
        const subtitle = strongTag.textContent.replace('：', '').replace(': ', '');
        switch (subtitle) {
          case '饮食':
          case 'Diet':
          case 'Питание':
            strongTag.textContent = 'Diet: ';
          break;
          case '活动':
          case 'Activity':
          case 'Активность':
            strongTag.textContent = 'Activity: ';
            break;
          case '繁殖':
          case 'Reproduction':
          case 'Размножение':
            strongTag.textContent = 'Reproduction: ';
            break;
          case '寿命':
          case 'Lifespan':
          case 'Продолжительность жизни':
            strongTag.textContent = 'Lifespan: ';
            break;
          case '领地行为':
          case 'Territorial Behavior':
          case 'Территориальное поведение':
            strongTag.textContent = 'Territorial Behavior: ';
            break;
          case '交流方式':
          case 'Communication Methods':
          case 'Способы коммуникации':
            strongTag.textContent = 'Communication Methods: ';
            break;
          case '活动规律':
          case 'Activity Patterns':
          case 'Режим активности':
            strongTag.textContent = 'Activity Patterns: ';
            break;
          case '体温调节':
          case 'Temperature Regulation':
          case 'Регуляция температуры':
            strongTag.textContent = 'Temperature Regulation: ';
            break;
          case '国宝地位':
          case 'National Treasure Status':
          case 'Статус национального сокровища':
            strongTag.textContent = 'National Treasure Status: ';
            break;
          case '和平友谊使者':
          case 'Peace and Friendship Ambassador':
          case 'Посол мира и дружбы':
            strongTag.textContent = 'Peace and Friendship Ambassador: ';
            break;
          case '保护象征':
          case 'Conservation Symbol':
          case 'Символ охраны природы':
            strongTag.textContent = 'Conservation Symbol: ';
            break;
          case '旅游资源':
          case 'Tourism Resource':
          case 'Туристический ресурс':
            strongTag.textContent = 'Tourism Resource: ';
            break;
          case '文化创意产业':
          case 'Cultural Creative Industry':
          case 'Индустрия культурного творчества':
            strongTag.textContent = 'Cultural Creative Industry: ';
            break;
          case '基因组测序':
          case 'Genome Sequencing':
          case 'Секвенирование генома':
            strongTag.textContent = 'Genome Sequencing: ';
            break;
          case '人工繁育技术':
          case 'Artificial Breeding Technology':
          case 'Технология искусственного разведения':
            strongTag.textContent = 'Artificial Breeding Technology: ';
            break;
          case '野化放归':
          case 'Rewilding and Release':
          case 'Реинтродукция в дикую природу':
            strongTag.textContent = 'Rewilding and Release: ';
            break;
          case '行为学研究':
          case 'Behavioral Studies':
          case 'Исследования поведения':
            strongTag.textContent = 'Behavioral Studies: ';
            break;
          case '疾病防控':
          case 'Disease Prevention and Control':
          case 'Профилактика и контроль заболеваний':
            strongTag.textContent = 'Disease Prevention and Control: ';
            break;
          case '栖息地保护':
          case 'Habitat Protection':
          case 'Защита среды обитания':
            strongTag.textContent = 'Habitat Protection: ';
            break;
          case '国家公园建设':
          case 'National Park Construction':
          case 'Строительство национальных парков':
            strongTag.textContent = 'National Park Construction: ';
            break;
          case '生态廊道建设':
          case 'Ecological Corridor Construction':
          case 'Строительство экологических коридоров':
            strongTag.textContent = 'Ecological Corridor Construction: ';
            break;
          case '科研繁育':
          case 'Scientific Research and Breeding':
          case 'Научные исследования и разведение':
            strongTag.textContent = 'Scientific Research and Breeding: ';
            break;
          case '国际合作':
          case 'International Cooperation':
          case 'Международное сотрудничество':
            strongTag.textContent = 'International Cooperation: ';
            break;
        }
        
        // 翻译列表项内容
        // 获取列表项的完整文本内容
        const fullText = el.textContent;
        
        // 英文翻译列表项内容
        // 大熊猫特性描述
        if (fullText.includes('大熊猫是杂食性动物') || 
            fullText.includes('Giant pandas are omnivorous animals') ||
            fullText.includes('Большие панды - это всеядные животные')) {
          el.innerHTML = strongTag.outerHTML + 'Giant pandas are omnivorous animals, but mainly feed on bamboo. They like to eat more than 20 types of bamboo, including arrow bamboo and walking stick bamboo, and also eat wild fruits, grasses, insects, etc.';
        } 
        else if (fullText.includes('大熊猫性格温顺') || 
                fullText.includes('Giant pandas have a gentle temperament') ||
                fullText.includes('Большие панды имеют мягкий характер')) {
          el.innerHTML = strongTag.outerHTML + 'Giant pandas have a gentle temperament, live solitary lives, prefer quiet, move slowly, and spend most of their time foraging and resting.';
        } 
        else if (fullText.includes('大熊猫性成熟年龄') || 
                fullText.includes('Giant pandas reach sexual maturity') ||
                fullText.includes('Большие панды достигают половой зрелости')) {
          el.innerHTML = strongTag.outerHTML + 'Giant pandas reach sexual maturity at 5.5-6.5 years of age. Their mating season is from March to May, with a gestation period of 83-200 days, usually producing 1-2 cubs weighing about 150 grams at birth.';
        } 
        else if (fullText.includes('野生大熊猫平均寿命') || 
                fullText.includes('Wild giant pandas have an average lifespan') ||
                fullText.includes('Дикие большие панды имеют среднюю продолжительность жизни')) {
          el.innerHTML = strongTag.outerHTML + 'Wild giant pandas have an average lifespan of about 20 years, while captive giant pandas can live to 25-30 years.';
        } 
        else if (fullText.includes('大熊猫是独居动物') || 
                fullText.includes('Giant pandas are solitary animals') ||
                fullText.includes('Большие панды - одиночные животные')) {
          el.innerHTML = strongTag.outerHTML + 'Giant pandas are solitary animals, and each giant panda has its own territory. They mark their territory by leaving scent marks on trees and scratching tree bark. The territory of an adult male giant panda is about 3-7 square kilometers, while that of females is relatively smaller.';
        } 
        else if (fullText.includes('大熊猫通过多种声音') || 
                fullText.includes('Giant pandas communicate through various sounds') ||
                fullText.includes('Большие панды общаются с помощью различных звуков')) {
          el.innerHTML = strongTag.outerHTML + 'Giant pandas communicate through various sounds, including bleating, roaring, and chirping. Their calls are especially noticeable during the breeding season. In addition, they also communicate indirectly through scent marking.';
        } 
        else if (fullText.includes('大熊猫一天中有10-16小时') || 
                fullText.includes('Giant pandas spend 10-16 hours a day') ||
                fullText.includes('Большие панды проводят 10-16 часов в день')) {
          el.innerHTML = strongTag.outerHTML + 'Giant pandas spend 10-16 hours a day foraging, with the rest of the time mostly used for resting. They are both diurnal and nocturnal animals, but in areas with frequent human activity, they tend to be more active at night.';
        } 
        else if (fullText.includes('大熊猫喜欢凉爽的环境') || 
                fullText.includes('Giant pandas prefer cool environments') ||
                fullText.includes('Большие панды предпочитают прохладную среду')) {
          el.innerHTML = strongTag.outerHTML + 'Giant pandas prefer cool environments, with suitable temperatures ranging from 17-25°C. In summer, they move to higher elevations to avoid heat; in winter, they move to lower elevations.';
        }
        // 文化意义部分
        else if (fullText.includes('大熊猫被视为中国的国宝') || 
                fullText.includes('Giant pandas are regarded as China\'s national treasure') ||
                fullText.includes('Большие панды считаются национальным сокровищем Китая')) {
          el.innerHTML = strongTag.outerHTML + 'Giant pandas are regarded as China\'s national treasure, a symbol of China\'s unique cultural heritage and biodiversity.';
        } 
        else if (fullText.includes('自1950年代开始') || 
                fullText.includes('Since the 1950s, China has promoted') ||
                fullText.includes('С 1950-х годов Китай способствует')) {
          el.innerHTML = strongTag.outerHTML + 'Since the 1950s, China has promoted friendly relations with other countries through "panda diplomacy."';
        } 
        else if (fullText.includes('世界自然基金会(WWF)') || 
                fullText.includes('The World Wildlife Fund (WWF) uses') ||
                fullText.includes('Всемирный фонд дикой природы (WWF)')) {
          el.innerHTML = strongTag.outerHTML + 'The World Wildlife Fund (WWF) uses the giant panda as its logo, making it an iconic image for global wildlife conservation.';
        } 
        else if (fullText.includes('大熊猫是中国重要的旅游资源') || 
                fullText.includes('Giant pandas are an important tourism resource') ||
                fullText.includes('Большие панды являются важным туристическим ресурсом')) {
          el.innerHTML = strongTag.outerHTML + 'Giant pandas are an important tourism resource in China, with the Chengdu Research Base of Giant Panda Breeding attracting millions of visitors each year.';
        } 
        else if (fullText.includes('大熊猫形象广泛应用于文创产品') || 
                fullText.includes('Giant panda images are widely used') ||
                fullText.includes('Изображения больших панд широко используются')) {
          el.innerHTML = strongTag.outerHTML + 'Giant panda images are widely used in cultural and creative products, animations, films, and other media, creating enormous economic value.';
        }
        // 研究成就部分
        else if (fullText.includes('2010年，科学家完成了大熊猫全基因组测序') || 
                fullText.includes('In 2010, scientists completed the giant panda genome') ||
                fullText.includes('В 2010 году ученые завершили секвенирование генома')) {
          el.innerHTML = strongTag.outerHTML + 'In 2010, scientists completed the giant panda genome sequencing, providing a valuable basis for studying the evolutionary history and conservation of giant pandas.';
        } 
        else if (fullText.includes('中国科学家攻克了大熊猫人工繁育难题') || 
                fullText.includes('Chinese scientists have overcome the challenges') ||
                fullText.includes('Китайские ученые преодолели проблемы')) {
          el.innerHTML = strongTag.outerHTML + 'Chinese scientists have overcome the challenges of artificial breeding of giant pandas, increasing the success rate from about 30% in the early stages to over 90% in the present time.';
        } 
        else if (fullText.includes('截至2023年') || 
                fullText.includes('As of 2023, China has successfully released') ||
                fullText.includes('По состоянию на 2023 год Китай успешно выпустил')) {
          el.innerHTML = strongTag.outerHTML + 'As of 2023, China has successfully released more than 25 captive-bred giant pandas to the wild, many of which have successfully bred offspring.';
        } 
        else if (fullText.includes('通过红外相机监测等技术') || 
                fullText.includes('Through technologies such as infrared camera') ||
                fullText.includes('С помощью таких технологий, как мониторинг')) {
          el.innerHTML = strongTag.outerHTML + 'Through technologies such as infrared camera monitoring, researchers have gained a deeper understanding of the behavior patterns of wild giant pandas.';
        } 
        else if (fullText.includes('研究人员已经识别并能够有效治疗') || 
                fullText.includes('Researchers have identified and can effectively treat') ||
                fullText.includes('Исследователи идентифицировали и могут эффективно')) {
          el.innerHTML = strongTag.outerHTML + 'Researchers have identified and can effectively treat common diseases among giant pandas, significantly reducing mortality rates.';
        }
        // 保护措施部分
        else if (fullText.includes('中国建立了67个自然保护区') || 
                fullText.includes('China has established 67 nature reserves') ||
                fullText.includes('Китай создал 67 природных заповедников')) {
          el.innerHTML = strongTag.outerHTML + 'China has established 67 nature reserves with a total area of more than 1,300,000 hectares, protecting about 54% of the giant panda habitat and covering about 67% of the wild giant panda population.';
        } 
        else if (fullText.includes('2021年10月，中国大熊猫国家公园正式设立') || 
                fullText.includes('In October 2021, the China Giant Panda National Park') ||
                fullText.includes('В октябре 2021 года был официально создан')) {
          el.innerHTML = strongTag.outerHTML + 'In October 2021, the China Giant Panda National Park was officially established, with an area of 27,134 square kilometers, covering about 70% of the giant panda habitat and uniting 3 provinces\' panda reserves.';
        } 
        else if (fullText.includes('通过建设生态廊道连接分散的大熊猫栖息地') || 
                fullText.includes('By building ecological corridors') ||
                fullText.includes('Путем строительства экологических коридоров')) {
          el.innerHTML = strongTag.outerHTML + 'By building ecological corridors to connect isolated habitats of giant pandas, it promotes interpopulation gene flow and increases genetic diversity.';
        } 
        else if (fullText.includes('中国大熊猫保护研究中心等机构') || 
                fullText.includes('Institutions such as the China Conservation') ||
                fullText.includes('Такие учреждения, как Китайский центр')) {
          el.innerHTML = strongTag.outerHTML + 'Institutions such as the China Conservation Research Center of Giant Pandas have made significant breakthroughs in breeding, disease prevention, and wild reintroduction, with more than 600 giant pandas in captivity.';
        } 
        else if (fullText.includes('中国与多个国家和国际组织开展大熊猫保护合作') || 
                fullText.includes('China conducts giant panda conservation cooperation') ||
                fullText.includes('Китай осуществляет сотрудничество')) {
          el.innerHTML = strongTag.outerHTML + 'China conducts giant panda conservation cooperation with multiple countries and international organizations for scientific research and public education.';
        }
        // 威胁部分
        else if (fullText.includes('栖息地破碎化') || 
                fullText.includes('Habitat fragmentation') ||
                fullText.includes('Фрагментация среды обитания')) {
          el.innerHTML = strongTag.outerHTML + 'Habitat fragmentation: Roads, hydroelectric power stations, and other constructions divide habitats of giant pandas into isolated small areas, impeding gene flow.';
        } 
        else if (fullText.includes('气候变化') || 
                fullText.includes('Climate change') ||
                fullText.includes('Изменение климата')) {
          el.innerHTML = strongTag.outerHTML + 'Climate change: Global warming may alter the flowering cycle of bamboo, the main food source of giant pandas, affecting food supply.';
        } 
        else if (fullText.includes('竹子开花枯死') || 
                fullText.includes('Bamboo flowering and die-off') ||
                fullText.includes('Цветение и отмирание бамбука')) {
          el.innerHTML = strongTag.outerHTML + 'Bamboo flowering and die-off: After flowering, bamboo completely dies and takes several years to regenerate, causing starvation among giant pandas.';
        } 
        else if (fullText.includes('人类活动干扰') || 
                fullText.includes('Human activity disturbance') ||
                fullText.includes('Нарушение человеческой деятельностью')) {
          el.innerHTML = strongTag.outerHTML + 'Human activity disturbance: Tourism, collection, and other activities may disturb the normal life of giant pandas.';
        }
      }
    });
    
  } else if (language === 'ru') {
    // 俄文翻译
    if (pageTitle) pageTitle.textContent = 'Энциклопедические знания о пандах';
    
    // 翻译标题元素
    titleElements.forEach(el => {
      // 支持从英文切换到俄文
      const originalText = el.textContent;
      
      // 将英文标题映射回中文标题，再翻译成俄文
      let chineseText = '';
      if (originalText === 'Basic Information about Giant Pandas') {
        chineseText = '大熊猫基本信息';
      } else if (originalText === 'Living Habits') {
        chineseText = '生活习性';
      } else if (originalText === 'Conservation Status') {
        chineseText = '保护现状';
      } else if (originalText === 'Research Achievements') {
        chineseText = '研究成就';
      } else if (originalText === 'Cultural Significance') {
        chineseText = '文化意义';
      } else if (originalText === 'Multi-language Translation') {
        chineseText = '多语言翻译';
      } else {
        chineseText = originalText; // 可能已经是中文或俄文
      }
      
      // 将中文标题翻译成俄文
      switch (chineseText) {
        case '大熊猫基本信息':
          el.textContent = 'Основная информация о больших пандах';
          break;
        case '生活习性':
          el.textContent = 'Привычки жизни';
          break;
        case '保护现状':
          el.textContent = 'Статус охраны';
          break;
        case '研究成就':
          el.textContent = 'Исследовательские достижения';
          break;
        case '文化意义':
          el.textContent = 'Культурное значение';
          break;
        case '多语言翻译':
          el.textContent = 'Многоязычный перевод';
          break;
      }
    });
    
    // 翻译段落文本（简化示例，实际应用中可以更详细）
    paragraphElements.forEach(el => {
      // 针对特定段落进行翻译
      if (el.textContent.includes('大熊猫是世界上最受欢迎的濒危动物之一') || 
          el.textContent.includes('Giant pandas are one of the most popular endangered animals')) {
        el.textContent = 'Большая панда является одним из самых популярных исчезающих животных в мире. Взрослые большие панды имеют длину около 1,2-1,5 метра и вес около 100-150 кг. Они имеют характерный черно-белый окрас, с черными частями вокруг глаз, ушей, носа, плеч и конечностей, а остальная часть белая.';
      } else if (el.textContent.includes('大熊猫拥有独特的"第六指"') || 
                el.textContent.includes('Giant pandas have a unique "sixth finger"')) {
        el.textContent = 'Большие панды имеют уникальный "шестой палец" (эволюционировавший из запястной кости), который позволяет им легко хватать бамбук. Хотя их пищеварительная система принадлежит к плотоядным, она адаптировалась к рациону, состоящему в основном из бамбука.';
      } else if (el.textContent.includes('目前，野生大熊猫主要分布在中国四川省') || 
                el.textContent.includes('Currently, wild giant pandas are mainly distributed')) {
        el.textContent = 'В настоящее время дикие большие панды в основном распространены в горных районах провинции Сычуань (около 1200), провинции Шэньси (более 300) и провинции Ганьсу (более 100) в Китае, с общим количеством около 1900. Общая площадь заповедников больших панд достигла около 2,6 миллиона гектаров.';
      } else if (el.textContent.includes('大熊猫在中国文化和国际交往中具有重要地位') ||
                el.textContent.includes('Giant pandas hold an important position')) {
        el.textContent = 'Большие панды занимают важное место в китайской культуре и международных отношениях:';
      } else if (el.textContent.includes('大熊猫研究在近几十年取得了显著进展') ||
                el.textContent.includes('Giant panda research has made significant progress')) {
        el.textContent = 'Исследования больших панд достигли значительного прогресса за последние десятилетия:';
      } else if (el.textContent.includes('中国政府实施的保护措施包括') ||
                el.textContent.includes('Conservation measures implemented by the Chinese government')) {
        el.textContent = 'Меры по охране, реализуемые правительством Китая, включают:';
      } else if (el.textContent.includes('面临的主要威胁') ||
                el.textContent.includes('Main threats faced')) {
        el.textContent = 'Основные угрозы:';
      } else if (el.textContent.includes('选择以下语言查看熊猫知识的翻译版本') ||
                el.textContent.includes('Select the following languages to view')) {
        el.textContent = 'Выберите следующие языки для просмотра переведенных версий знаний о пандах:';
      }
    });
    
    // 翻译列表项
    listItemElements.forEach(el => {
      const strongTag = el.querySelector('strong');
      if (strongTag) {
        // 翻译小标题（带有strong标签的部分）
        const subtitle = strongTag.textContent.replace('：', '').replace(': ', '');
        switch (subtitle) {
          case '饮食':
          case 'Diet':
          case 'Питание':
            strongTag.textContent = 'Питание: ';
            break;
          case '活动':
          case 'Activity':
          case 'Активность':
            strongTag.textContent = 'Активность: ';
            break;
          case '繁殖':
          case 'Reproduction':
          case 'Размножение':
            strongTag.textContent = 'Размножение: ';
            break;
          case '寿命':
          case 'Lifespan':
          case 'Продолжительность жизни':
            strongTag.textContent = 'Продолжительность жизни: ';
            break;
          case '领地行为':
          case 'Territorial Behavior':
          case 'Территориальное поведение':
            strongTag.textContent = 'Территориальное поведение: ';
            break;
          case '交流方式':
          case 'Communication Methods':
          case 'Способы коммуникации':
            strongTag.textContent = 'Способы коммуникации: ';
            break;
          case '活动规律':
          case 'Activity Patterns':
          case 'Режим активности':
            strongTag.textContent = 'Режим активности: ';
            break;
          case '体温调节':
          case 'Temperature Regulation':
          case 'Регуляция температуры':
            strongTag.textContent = 'Регуляция температуры: ';
            break;
          case '国宝地位':
          case 'National Treasure Status':
          case 'Статус национального сокровища':
            strongTag.textContent = 'Статус национального сокровища: ';
            break;
          case '和平友谊使者':
          case 'Peace and Friendship Ambassador':
          case 'Посол мира и дружбы':
            strongTag.textContent = 'Посол мира и дружбы: ';
            break;
          case '保护象征':
          case 'Conservation Symbol':
          case 'Символ охраны природы':
            strongTag.textContent = 'Символ охраны природы: ';
            break;
          case '旅游资源':
          case 'Tourism Resource':
          case 'Туристический ресурс':
            strongTag.textContent = 'Туристический ресурс: ';
            break;
          case '文化创意产业':
          case 'Cultural Creative Industry':
          case 'Индустрия культурного творчества':
            strongTag.textContent = 'Индустрия культурного творчества: ';
            break;
          case '基因组测序':
          case 'Genome Sequencing':
          case 'Секвенирование генома':
            strongTag.textContent = 'Секвенирование генома: ';
            break;
          case '人工繁育技术':
          case 'Artificial Breeding Technology':
          case 'Технология искусственного разведения':
            strongTag.textContent = 'Технология искусственного разведения: ';
            break;
          case '野化放归':
          case 'Rewilding and Release':
          case 'Реинтродукция в дикую природу':
            strongTag.textContent = 'Реинтродукция в дикую природу: ';
            break;
          case '行为学研究':
          case 'Behavioral Studies':
          case 'Исследования поведения':
            strongTag.textContent = 'Исследования поведения: ';
            break;
          case '疾病防控':
          case 'Disease Prevention and Control':
          case 'Профилактика и контроль заболеваний':
            strongTag.textContent = 'Профилактика и контроль заболеваний: ';
            break;
          case '栖息地保护':
          case 'Habitat Protection':
          case 'Защита среды обитания':
            strongTag.textContent = 'Защита среды обитания: ';
            break;
          case '国家公园建设':
          case 'National Park Construction':
          case 'Строительство национальных парков':
            strongTag.textContent = 'Строительство национальных парков: ';
            break;
          case '生态廊道建设':
          case 'Ecological Corridor Construction':
          case 'Строительство экологических коридоров':
            strongTag.textContent = 'Строительство экологических коридоров: ';
            break;
          case '科研繁育':
          case 'Scientific Research and Breeding':
          case 'Научные исследования и разведение':
            strongTag.textContent = 'Научные исследования и разведение: ';
            break;
          case '国际合作':
          case 'International Cooperation':
          case 'Международное сотрудничество':
            strongTag.textContent = 'Международное сотрудничество: ';
            break;
        }
        
        // 翻译列表项内容
        // 获取列表项的完整文本内容
        const fullText = el.textContent;
        
        // 俄语翻译列表项内容
        // 大熊猫特性描述
        if (fullText.includes('大熊猫是杂食性动物') || 
            fullText.includes('Giant pandas are omnivorous animals')) {
          el.innerHTML = strongTag.outerHTML + 'Большие панды - это всеядные животные, но в основном питаются бамбуком. Они любят есть более 20 видов бамбука, включая стреловидный бамбук и бамбук-трость, а также едят дикие фрукты, травы, насекомых и т.д.';
        } 
        else if (fullText.includes('大熊猫性格温顺') || 
                fullText.includes('Giant pandas have a gentle temperament')) {
          el.innerHTML = strongTag.outerHTML + 'Большие панды имеют мягкий характер, ведут одиночный образ жизни, предпочитают тишину, двигаются медленно и проводят большую часть времени в поисках пищи и отдыхе.';
        } 
        else if (fullText.includes('大熊猫性成熟年龄') || 
                fullText.includes('Giant pandas reach sexual maturity')) {
          el.innerHTML = strongTag.outerHTML + 'Большие панды достигают половой зрелости в возрасте 5,5-6,5 лет. Их сезон спаривания длится с марта по май, с периодом беременности 83-200 дней, обычно рождается 1-2 детеныша весом около 150 граммов при рождении.';
        } 
        else if (fullText.includes('野生大熊猫平均寿命') || 
                fullText.includes('Wild giant pandas have an average lifespan')) {
          el.innerHTML = strongTag.outerHTML + 'Дикие большие панды имеют среднюю продолжительность жизни около 20 лет, в то время как панды в неволе могут жить до 25-30 лет.';
        } 
        else if (fullText.includes('大熊猫是独居动物') || 
                fullText.includes('Giant pandas are solitary animals')) {
          el.innerHTML = strongTag.outerHTML + 'Большие панды - одиночные животные, и у каждой большой панды есть своя территория. Они отмечают свою территорию, оставляя запаховые метки на деревьях и царапая кору. Территория взрослого самца большой панды составляет около 3-7 квадратных километров, в то время как территория самок относительно меньше.';
        } 
        else if (fullText.includes('大熊猫通过多种声音') || 
                fullText.includes('Giant pandas communicate through various sounds')) {
          el.innerHTML = strongTag.outerHTML + 'Большие панды общаются с помощью различных звуков, включая блеяние, рычание и чириканье. Их крики особенно заметны в сезон размножения. Кроме того, они также общаются косвенно через запаховые метки.';
        } 
        else if (fullText.includes('大熊猫一天中有10-16小时') || 
                fullText.includes('Giant pandas spend 10-16 hours a day')) {
          el.innerHTML = strongTag.outerHTML + 'Большие панды проводят 10-16 часов в день в поисках пищи, а остальное время в основном используется для отдыха. Они являются как дневными, так и ночными животными, но в районах с частой человеческой деятельностью они склонны быть более активными ночью.';
        } 
        else if (fullText.includes('大熊猫喜欢凉爽的环境') || 
                fullText.includes('Giant pandas prefer cool environments')) {
          el.innerHTML = strongTag.outerHTML + 'Большие панды предпочитают прохладную среду, с подходящими температурами от 17 до 25°C. Летом они перемещаются на большие высоты, чтобы избежать жары; зимой перемещаются на более низкие высоты.';
        }
        // 文化意义部分
        else if (fullText.includes('大熊猫被视为中国的国宝') || 
                fullText.includes('Giant pandas are regarded as China\'s national treasure')) {
          el.innerHTML = strongTag.outerHTML + 'Большие панды считаются национальным сокровищем Китая, символом уникального культурного наследия и биоразнообразия Китая.';
        } 
        else if (fullText.includes('自1950年代开始') || 
                fullText.includes('Since the 1950s, China has promoted')) {
          el.innerHTML = strongTag.outerHTML + 'С 1950-х годов Китай способствует дружественным отношениям с другими странами посредством "пандовой дипломатии".';
        } 
        else if (fullText.includes('世界自然基金会(WWF)') || 
                fullText.includes('The World Wildlife Fund (WWF) uses')) {
          el.innerHTML = strongTag.outerHTML + 'Всемирный фонд дикой природы (WWF) использует большую панду в качестве своего логотипа, делая ее знаковым образом для глобальной охраны дикой природы.';
        } 
        else if (fullText.includes('大熊猫是中国重要的旅游资源') || 
                fullText.includes('Giant pandas are an important tourism resource')) {
          el.innerHTML = strongTag.outerHTML + 'Большие панды являются важным туристическим ресурсом в Китае, при этом Исследовательская база разведения больших панд в Чэнду ежегодно привлекает миллионы посетителей.';
        } 
        else if (fullText.includes('大熊猫形象广泛应用于文创产品') || 
                fullText.includes('Giant panda images are widely used')) {
          el.innerHTML = strongTag.outerHTML + 'Изображения больших панд широко используются в культурных и творческих продуктах, анимации, фильмах и других СМИ, создавая огромную экономическую ценность.';
        }
        // 研究成就部分
        else if (fullText.includes('2010年，科学家完成了大熊猫全基因组测序') || 
                fullText.includes('In 2010, scientists completed the giant panda genome')) {
          el.innerHTML = strongTag.outerHTML + 'В 2010 году ученые завершили секвенирование генома большой панды, предоставив важную основу для изучения эволюционной истории и сохранения больших панд.';
        } 
        else if (fullText.includes('中国科学家攻克了大熊猫人工繁育难题') || 
                fullText.includes('Chinese scientists have overcome the challenges')) {
          el.innerHTML = strongTag.outerHTML + 'Китайские ученые преодолели проблемы искусственного разведения больших панд, увеличив процент успеха с примерно 30% в начале до более чем 90% в настоящее время.';
        } 
        else if (fullText.includes('截至2023年') || 
                fullText.includes('As of 2023, China has successfully released')) {
          el.innerHTML = strongTag.outerHTML + 'По состоянию на 2023 год Китай успешно выпустил в дикую природу более 25 выращенных в неволе больших панд, многие из которых успешно произвели потомство.';
        } 
        else if (fullText.includes('通过红外相机监测等技术') || 
                fullText.includes('Through technologies such as infrared camera')) {
          el.innerHTML = strongTag.outerHTML + 'С помощью таких технологий, как мониторинг инфракрасными камерами, ученые получили более глубокое понимание поведенческих привычек диких больших панд.';
        } 
        else if (fullText.includes('研究人员已经识别并能够有效治疗') || 
                fullText.includes('Researchers have identified and can effectively treat')) {
          el.innerHTML = strongTag.outerHTML + 'Исследователи идентифицировали и могут эффективно лечить распространенные заболевания у больших панд, значительно снижая уровень смертности.';
        }
        // 保护措施部分
        else if (fullText.includes('中国建立了67个自然保护区') || 
                fullText.includes('China has established 67 nature reserves')) {
          el.innerHTML = strongTag.outerHTML + 'Китай создал 67 природных заповедников общей площадью более 1 300 000 гектаров, защищая около 54% среды обитания больших панд и охватывая около 67% популяции диких больших панд.';
        } 
        else if (fullText.includes('2021年10月，中国大熊猫国家公园正式设立') || 
                fullText.includes('In October 2021, the China Giant Panda National Park')) {
          el.innerHTML = strongTag.outerHTML + 'В октябре 2021 года был официально создан Национальный парк больших панд Китая площадью 27 134 квадратных километра, охватывающий около 70% естественной среды обитания больших панд и объединяющий заповедники больших панд в 3 провинциях.';
        } 
        else if (fullText.includes('通过建设生态廊道连接分散的大熊猫栖息地') || 
                fullText.includes('By building ecological corridors')) {
          el.innerHTML = strongTag.outerHTML + 'Путем строительства экологических коридоров для соединения разрозненных мест обитания больших панд, способствуется обмену популяциями и повышается генетическое разнообразие.';
        } 
        else if (fullText.includes('中国大熊猫保护研究中心等机构') || 
                fullText.includes('Institutions such as the China Conservation')) {
          el.innerHTML = strongTag.outerHTML + 'Такие учреждения, как Китайский центр охраны и исследований больших панд, добились значительных прорывов в разведении больших панд, профилактике и контроле заболеваний, а также в подготовке к реинтродукции, при этом количество больших панд в неволе превышает 600.';
        } 
        else if (fullText.includes('中国与多个国家和国际组织开展大熊猫保护合作') || 
                fullText.includes('China conducts giant panda conservation cooperation')) {
          el.innerHTML = strongTag.outerHTML + 'Китай осуществляет сотрудничество по сохранению больших панд с несколькими странами и международными организациями для научных исследований и просвещения общественности.';
        }
        // 威胁部分
        else if (fullText.includes('栖息地破碎化') || 
                fullText.includes('Habitat fragmentation')) {
          el.innerHTML = strongTag.outerHTML + 'Фрагментация среды обитания: Дороги, гидроэлектростанции и другие строительства разделяют места обитания больших панд на изолированные небольшие участки, препятствуя генетическому обмену.';
        } 
        else if (fullText.includes('气候变化') || 
                fullText.includes('Climate change')) {
          el.innerHTML = strongTag.outerHTML + 'Изменение климата: Глобальное потепление может привести к изменениям в цикле цветения бамбука, основного источника пищи больших панд, влияя на поставки продовольствия.';
        } 
        else if (fullText.includes('竹子开花枯死') || 
                fullText.includes('Bamboo flowering and die-off')) {
          el.innerHTML = strongTag.outerHTML + 'Цветение и отмирание бамбука: После цветения бамбук полностью отмирает и требуется несколько лет для его восстановления, что в прошлом вызывало голодную смерть больших панд.';
        } 
        else if (fullText.includes('人类活动干扰') || 
                fullText.includes('Human activity disturbance')) {
          el.innerHTML = strongTag.outerHTML + 'Нарушение человеческой деятельностью: Туризм, сбор и другие виды деятельности могут нарушать нормальную жизнь больших панд.';
        }
      }
    });
    
  } else if (language === 'zh') {
    // 恢复中文原文，不重载页面
    if (pageTitle) pageTitle.textContent = '熊猫百科知识';
    
    // 恢复标题元素
    titleElements.forEach(el => {
      if (el.textContent === 'Basic Information about Giant Pandas' || 
          el.textContent === 'Основная информация о больших пандах') {
        el.textContent = '大熊猫基本信息';
      } else if (el.textContent === 'Living Habits' || 
                el.textContent === 'Привычки жизни') {
        el.textContent = '生活习性';
      } else if (el.textContent === 'Conservation Status' || 
                el.textContent === 'Статус охраны') {
        el.textContent = '保护现状';
      } else if (el.textContent === 'Research Achievements' || 
                el.textContent === 'Исследовательские достижения') {
        el.textContent = '研究成就';
      } else if (el.textContent === 'Cultural Significance' || 
                el.textContent === 'Культурное значение') {
        el.textContent = '文化意义';
      } else if (el.textContent === 'Multi-language Translation' || 
                el.textContent === 'Многоязычный перевод') {
        el.textContent = '多语言翻译';
      }
    });
    
    // 恢复段落文本
    paragraphElements.forEach(el => {
      // 这里可以添加恢复中文文本的逻辑，但由于原始HTML已经包含中文内容
      // 我们可以简单地重新加载页面中的内容，而不是调用loadPandaKnowledge()
      
      // 查找包含特定英文或俄文的段落，恢复为中文
      if (el.textContent.includes('Giant pandas are one of the most popular endangered animals') ||
          el.textContent.includes('Большая панда является одним из самых популярных')) {
        el.textContent = '大熊猫是世界上最受欢迎的濒危动物之一，成年大熊猫体长约1.2-1.5米，体重约100-150千克。它们拥有标志性的黑白毛色，黑色部分包括眼睛周围、耳朵、鼻子、肩膀和四肢，其余部分为白色。';
      } else if (el.textContent.includes('Giant pandas have a unique "sixth finger"') ||
                el.textContent.includes('Большие панды имеют уникальный "шестой палец"')) {
        el.textContent = '大熊猫拥有独特的"第六指"（腕骨演变而来的拇指），这使它们能够轻松握住竹子。它们的消化系统虽然属于食肉动物，但已经适应了以竹子为主的饮食习惯。';
      } else if (el.textContent.includes('Currently, wild giant pandas are mainly distributed') ||
                el.textContent.includes('В настоящее время дикие большие панды')) {
        el.textContent = '目前，野生大熊猫主要分布在中国四川省（约1,200只）、陕西省（约300多只）和甘肃省（约100多只）的山区，总数已接近1,900只。大熊猫保护区总面积达到约260万公顷。';
      }
    });
    
    // 恢复列表项内容
    listItemElements.forEach(el => {
      const strongTag = el.querySelector('strong');
      if (strongTag) {
        // 恢复小标题（带有strong标签的部分）
        const subtitle = strongTag.textContent.replace(': ', '');
        switch (subtitle) {
          case 'Diet':
          case 'Питание':
            strongTag.textContent = '饮食：';
            break;
          case 'Activity':
          case 'Активность':
            strongTag.textContent = '活动：';
            break;
          case 'Reproduction':
          case 'Размножение':
            strongTag.textContent = '繁殖：';
            break;
          case 'Lifespan':
          case 'Продолжительность жизни':
            strongTag.textContent = '寿命：';
            break;
          case 'Territorial Behavior':
          case 'Территориальное поведение':
            strongTag.textContent = '领地行为：';
            break;
          case 'Communication Methods':
          case 'Способы коммуникации':
            strongTag.textContent = '交流方式：';
            break;
          case 'Activity Patterns':
          case 'Режим активности':
            strongTag.textContent = '活动规律：';
            break;
          case 'Temperature Regulation':
          case 'Регуляция температуры':
            strongTag.textContent = '体温调节：';
            break;
        }
      }
    });
  }
}

// 创建刷新实时数据的函数
async function refreshLiveData() {
  try {
    // 获取API实例
    const api = getAPI();
    if (!api) {
      throw new Error('API服务不可用');
    }
    
    // 获取最新直播数据
    const liveData = await api.getPandaLiveInfo();
    
    // 更新环境数据
    if (liveData.monitoringData && liveData.monitoringData.environmentalData) {
      updateEnvironmentData(liveData.monitoringData.environmentalData);
    }
    
    // 更新熊猫状态数据
    if (liveData.monitoringData && liveData.monitoringData.pandaStatus) {
      updatePandaStatusData(liveData.monitoringData.pandaStatus);
    }
    
    // 更新统计数据
    if (liveData.monitoringData && liveData.monitoringData.statisticsData) {
      updateStatisticsData(liveData.monitoringData.statisticsData);
    }
    
    // 更新直播源状态
    if (liveData.liveSources) {
      updateLiveSourcesStatus(liveData.liveSources);
    }
    
    return true;
  } catch (error) {
    console.error('刷新直播数据失败:', error);
    return false;
  }
}

// 更新环境数据
function updateEnvironmentData(environmentalData) {
  environmentalData.forEach(env => {
    const envCard = document.querySelector(`.environment-card[data-location="${env.location}"]`);
    if (envCard) {
      // 更新温度
      const tempElement = envCard.querySelector('.env-value[data-type="temperature"]');
      if (tempElement) {
        tempElement.textContent = `${env.temperature}°C`;
      }
      
      // 更新湿度
      const humidityElement = envCard.querySelector('.env-value[data-type="humidity"]');
      if (humidityElement) {
        humidityElement.textContent = `${env.humidity}%`;
      }
      
      // 更新气压
      const pressureElement = envCard.querySelector('.env-value[data-type="pressure"]');
      if (pressureElement) {
        pressureElement.textContent = `${env.pressure} hPa`;
      }
      
      // 更新空气质量
      const airQualityElement = envCard.querySelector('.env-value[data-type="airQuality"]');
      if (airQualityElement) {
        airQualityElement.textContent = env.airQuality;
      }
      
      // 更新时间戳
      const updateElement = envCard.querySelector('.env-update');
      if (updateElement) {
        updateElement.textContent = '上次更新: 刚刚';
      }
    }
  });
}

// 更新熊猫状态数据
function updatePandaStatusData(pandaStatus) {
  pandaStatus.forEach(panda => {
    const pandaCard = document.querySelector(`.panda-card[data-name="${panda.name}"]`);
    if (pandaCard) {
      // 更新位置
      const locationElement = pandaCard.querySelector('.panda-value[data-type="location"]');
      if (locationElement) {
        locationElement.textContent = panda.location;
      }
      
      // 更新健康状况
      const healthElement = pandaCard.querySelector('.panda-value[data-type="health"]');
      if (healthElement) {
        healthElement.textContent = panda.health;
      }
      
      // 更新当前活动
      const activityElement = pandaCard.querySelector('.panda-value[data-type="activity"]');
      if (activityElement) {
        activityElement.textContent = panda.activity;
      }
      
      // 更新时间戳
      const updateElement = pandaCard.querySelector('.panda-update');
      if (updateElement) {
        updateElement.textContent = '上次更新: 刚刚';
      }
    }
  });
}

// 更新统计数据
function updateStatisticsData(statisticsData) {
  // 更新当前观看人数
  const viewersElement = document.querySelector('.stat-value[data-type="viewers"]');
  if (viewersElement) {
    viewersElement.textContent = statisticsData.totalViewers;
  }
  
  // 更新在线监控数量
  const streamsElement = document.querySelector('.stat-value[data-type="streams"]');
  if (streamsElement) {
    streamsElement.textContent = statisticsData.activeStreams;
  }
  
  // 更新高峰观看时段
  const peakElement = document.querySelector('.stat-value[data-type="peak"]');
  if (peakElement) {
    peakElement.textContent = statisticsData.peakViewingTime;
  }
  
  // 更新最受欢迎监控
  const popularElement = document.querySelector('.stat-value[data-type="popular"]');
  if (popularElement) {
    popularElement.textContent = statisticsData.popularStream;
  }
}

// 更新直播源状态
function updateLiveSourcesStatus(liveSources) {
  liveSources.forEach((live, index) => {
    const liveItem = document.querySelector(`.live-item[data-index="${index}"]`);
    if (liveItem) {
      // 更新状态标签
      const statusElement = liveItem.querySelector('.stream-status');
      if (statusElement) {
        statusElement.textContent = live.status;
        
        // 更新状态类名
        statusElement.className = 'stream-status';
        if (live.status === '在线') {
          statusElement.classList.add('status-online');
        } else {
          statusElement.classList.add('status-offline');
        }
      }
      
      // 更新播放按钮
      const playButton = liveItem.querySelector('.play-button');
      if (playButton) {
        playButton.className = 'play-button';
        if (live.status === '在线') {
          playButton.classList.add('status-online');
          playButton.textContent = '▶ 播放直播';
          playButton.disabled = false;
        } else {
          playButton.classList.add('status-offline');
          playButton.textContent = '⚠ ' + live.status;
          playButton.disabled = true;
        }
      }
    }
  });
}

async function loadPandaLive() {
  const contentContainer = document.getElementById('content-container');
  
  // 显示加载状态
  contentContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>正在加载熊猫直播...</p></div>';
  
  try {
    // 获取API实例
    const api = getAPI();
    if (!api) {
      throw new Error('API服务不可用');
    }
    
    // 获取直播数据
    const liveData = await api.getPandaLiveInfo();
    
    // 构建直播HTML
    let liveHtml = `
      <div class="page-container live-page">
        <h2>熊猫实时监控中心</h2>
        
        <!-- 监控数据概览 -->
        <div class="monitoring-overview">
          <div class="overview-card">
            <h3>监控概况</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">当前观看人数</span>
                <span class="stat-value" data-type="viewers">${liveData.monitoringData.statisticsData.totalViewers}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">在线监控</span>
                <span class="stat-value" data-type="streams">${liveData.monitoringData.statisticsData.activeStreams}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">高峰观看时段</span>
                <span class="stat-value" data-type="peak">${liveData.monitoringData.statisticsData.peakViewingTime}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最受欢迎监控</span>
                <span class="stat-value" data-type="popular">${liveData.monitoringData.statisticsData.popularStream}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 监控标签页 -->
        <div class="monitor-tabs">
          <div class="tab-header">
            <button class="tab-btn active" data-tab="live-streams">实时直播</button>
            <button class="tab-btn" data-tab="environment">环境监测</button>
            <button class="tab-btn" data-tab="pandas">熊猫状态</button>
            <button class="tab-btn" data-tab="history">历史回放</button>
          </div>
          
          <div class="tab-content">
            <!-- 实时直播标签内容 -->
            <div class="tab-pane active" id="live-streams">
              <!-- 国内监控分组 -->
              <div class="live-group">
                <h3 class="live-group-title">国内熊猫监控</h3>
                <div class="live-container">
    `;
    
    // 添加国内直播项
    const domesticSources = liveData.liveSources.slice(0, 6); // 前6个是国内监控
    domesticSources.forEach((live, index) => {
      // 根据直播类型添加不同的标记
      let typeIcon = '';
      if (live.type === 'infrared') {
        typeIcon = '<span class="stream-type infrared">红外</span>';
      } else if (live.type === 'video') {
        typeIcon = '<span class="stream-type video">视频</span>';
      }
      
      // 根据状态添加不同的样式
      let statusClass = 'status-online';
      if (live.status !== '在线') {
        statusClass = 'status-offline';
      }
      
      liveHtml += `
        <div class="live-item" data-index="${index}">
          <h3>${live.name} ${typeIcon}</h3>
          <div class="live-player">
            <img src="${live.image}" alt="熊猫直播" class="live-placeholder">
            <div class="live-controls">
              <button class="play-button ${statusClass}" data-url="${live.url}" ${live.status !== '在线' ? 'disabled' : ''}>
                ${live.status === '在线' ? '▶ 播放直播' : '⚠ ' + live.status}
              </button>
            </div>
            <span class="stream-status ${statusClass}">${live.status}</span>
          </div>
          <p class="live-description">${live.description}</p>
        </div>
      `;
    });
    
    // 关闭国内监控分组，添加国外监控分组
    liveHtml += `
                </div>
              </div>
              
              <!-- 国外监控分组 -->
              <div class="live-group">
                <h3 class="live-group-title">国外熊猫监控</h3>
                <div class="live-container">
    `;
    
    // 添加国外直播项
    const internationalSources = liveData.liveSources.slice(6); // 第6个之后是国外监控
    internationalSources.forEach((live, index) => {
      // 实际索引
      const actualIndex = index + 6;
      
      // 根据直播类型添加不同的标记
      let typeIcon = '';
      if (live.type === 'infrared') {
        typeIcon = '<span class="stream-type infrared">红外</span>';
      } else if (live.type === 'video') {
        typeIcon = '<span class="stream-type video">视频</span>';
      }
      
      // 添加国家/地区标记
      let countryFlag = '';
      if (live.name.includes('美国')) {
        countryFlag = '<span class="country-flag">🇺🇸</span>';
      } else if (live.name.includes('日本')) {
        countryFlag = '<span class="country-flag">🇯🇵</span>';
      } else if (live.name.includes('法国')) {
        countryFlag = '<span class="country-flag">🇫🇷</span>';
      } else if (live.name.includes('加拿大')) {
        countryFlag = '<span class="country-flag">🇨🇦</span>';
      } else if (live.name.includes('澳大利亚')) {
        countryFlag = '<span class="country-flag">🇦🇺</span>';
      } else if (live.name.includes('奥地利')) {
        countryFlag = '<span class="country-flag">🇦🇹</span>';
      } else if (live.name.includes('马来西亚')) {
        countryFlag = '<span class="country-flag">🇲🇾</span>';
      } else if (live.name.includes('比利时')) {
        countryFlag = '<span class="country-flag">🇧🇪</span>';
      } else if (live.name.includes('荷兰')) {
        countryFlag = '<span class="country-flag">🇳🇱</span>';
      } else if (live.name.includes('韩国')) {
        countryFlag = '<span class="country-flag">🇰🇷</span>';
      } else if (live.name.includes('芬兰')) {
        countryFlag = '<span class="country-flag">🇫🇮</span>';
      }
      
      // 根据状态添加不同的样式
      let statusClass = 'status-online';
      if (live.status !== '在线') {
        statusClass = 'status-offline';
      }
      
      liveHtml += `
        <div class="live-item" data-index="${actualIndex}">
          <h3>${countryFlag} ${live.name} ${typeIcon}</h3>
          <div class="live-player">
            <img src="${live.image}" alt="熊猫直播" class="live-placeholder">
            <div class="live-controls">
              <button class="play-button ${statusClass}" data-url="${live.url}" ${live.status !== '在线' ? 'disabled' : ''}>
                ${live.status === '在线' ? '▶ 播放直播' : '⚠ ' + live.status}
              </button>
            </div>
            <span class="stream-status ${statusClass}">${live.status}</span>
          </div>
          <p class="live-description">${live.description}</p>
        </div>
      `;
    });
    
    // 关闭国外监控分组和实时直播标签
    liveHtml += `
                </div>
              </div>
            </div>
            
            <!-- 环境监测标签内容 -->
            <div class="tab-pane" id="environment">
              <div class="environment-container">
                <h3>实时环境数据</h3>
                <div class="environment-grid">
    `;
    
    // 添加环境数据
    liveData.monitoringData.environmentalData.forEach(env => {
      // 添加国家/地区标记
      let countryFlag = '';
      if (env.country === '美国') {
        countryFlag = '<span class="country-flag">🇺🇸</span>';
      } else if (env.country === '日本') {
        countryFlag = '<span class="country-flag">🇯🇵</span>';
      } else if (env.country === '法国') {
        countryFlag = '<span class="country-flag">🇫🇷</span>';
      } else if (env.country === '加拿大') {
        countryFlag = '<span class="country-flag">🇨🇦</span>';
      } else if (env.country === '澳大利亚') {
        countryFlag = '<span class="country-flag">🇦🇺</span>';
      } else if (env.country === '奥地利') {
        countryFlag = '<span class="country-flag">🇦🇹</span>';
      } else if (env.country === '马来西亚') {
        countryFlag = '<span class="country-flag">🇲🇾</span>';
      } else if (env.country === '比利时') {
        countryFlag = '<span class="country-flag">🇧🇪</span>';
      } else if (env.country === '荷兰') {
        countryFlag = '<span class="country-flag">🇳🇱</span>';
      } else if (env.country === '韩国') {
        countryFlag = '<span class="country-flag">🇰🇷</span>';
      } else if (env.country === '芬兰') {
        countryFlag = '<span class="country-flag">🇫🇮</span>';
      }
      
      liveHtml += `
        <div class="environment-card" data-location="${env.location}">
          <h4>${countryFlag} ${env.location}</h4>
          <div class="env-data">
            <div class="env-item">
              <span class="env-icon">🌡️</span>
              <span class="env-label">温度</span>
              <span class="env-value" data-type="temperature">${env.temperature}°C</span>
            </div>
            <div class="env-item">
              <span class="env-icon">💧</span>
              <span class="env-label">湿度</span>
              <span class="env-value" data-type="humidity">${env.humidity}%</span>
            </div>
            <div class="env-item">
              <span class="env-icon">🌬️</span>
              <span class="env-label">气压</span>
              <span class="env-value" data-type="pressure">${env.pressure} hPa</span>
            </div>
            <div class="env-item">
              <span class="env-icon">🍃</span>
              <span class="env-label">空气质量</span>
              <span class="env-value" data-type="airQuality">${env.airQuality}</span>
            </div>
          </div>
          <div class="env-update">上次更新: ${env.lastUpdate}</div>
        </div>
      `;
    });
    
    // 关闭环境监测标签并添加熊猫状态标签
    liveHtml += `
                </div>
              </div>
            </div>
            
            <!-- 熊猫状态标签内容 -->
            <div class="tab-pane" id="pandas">
              <div class="pandas-container">
                <h3>熊猫实时状态</h3>
                <div class="pandas-grid">
    `;
    
    // 添加熊猫状态数据
    liveData.monitoringData.pandaStatus.forEach(panda => {
      // 添加国家/地区标记
      let countryFlag = '';
      if (panda.country === '中国') {
        countryFlag = '<span class="country-flag">🇨🇳</span>';
      } else if (panda.country === '美国') {
        countryFlag = '<span class="country-flag">🇺🇸</span>';
      } else if (panda.country === '日本') {
        countryFlag = '<span class="country-flag">🇯🇵</span>';
      } else if (panda.country === '法国') {
        countryFlag = '<span class="country-flag">🇫🇷</span>';
      } else if (panda.country === '加拿大') {
        countryFlag = '<span class="country-flag">🇨🇦</span>';
      } else if (panda.country === '澳大利亚') {
        countryFlag = '<span class="country-flag">🇦🇺</span>';
      } else if (panda.country === '奥地利') {
        countryFlag = '<span class="country-flag">🇦🇹</span>';
      } else if (panda.country === '马来西亚') {
        countryFlag = '<span class="country-flag">🇲🇾</span>';
      } else if (panda.country === '比利时') {
        countryFlag = '<span class="country-flag">🇧🇪</span>';
      } else if (panda.country === '荷兰') {
        countryFlag = '<span class="country-flag">🇳🇱</span>';
      } else if (panda.country === '韩国') {
        countryFlag = '<span class="country-flag">🇰🇷</span>';
      } else if (panda.country === '芬兰') {
        countryFlag = '<span class="country-flag">🇫🇮</span>';
      }
      
      liveHtml += `
        <div class="panda-card" data-name="${panda.name}">
          <div class="panda-header">
            <h4>${countryFlag} ${panda.name}</h4>
            <span class="panda-age">${panda.age}</span>
          </div>
          <div class="panda-data">
            <div class="panda-item">
              <span class="panda-label">位置</span>
              <span class="panda-value" data-type="location">${panda.location}</span>
            </div>
            <div class="panda-item">
              <span class="panda-label">健康状况</span>
              <span class="panda-value" data-type="health">${panda.health}</span>
            </div>
            <div class="panda-item">
              <span class="panda-label">当前活动</span>
              <span class="panda-value" data-type="activity">${panda.activity}</span>
            </div>
          </div>
          <div class="panda-update">上次更新: ${panda.lastUpdate}</div>
        </div>
      `;
    });
    
    // 关闭熊猫状态标签并添加历史回放标签
    liveHtml += `
                </div>
              </div>
            </div>
            
            <!-- 历史回放标签内容 -->
            <div class="tab-pane" id="history">
              <div class="history-container">
                <h3>历史精彩回放</h3>
                <div class="history-grid">
    `;
    
    // 添加历史回放数据
    liveData.historyRecords.forEach(record => {
      liveHtml += `
        <div class="history-card">
          <div class="history-thumbnail">
            <img src="${record.thumbnail}" alt="${record.title}">
            <span class="history-duration">${record.duration}</span>
          </div>
          <div class="history-info">
            <h4>${record.title}</h4>
            <p class="history-date">${record.date}</p>
            <button class="history-play-btn" data-url="${record.url}">观看回放</button>
          </div>
        </div>
      `;
    });
    
    // 关闭历史回放标签和标签内容
    liveHtml += `
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 活动时间表 -->
        <div class="live-schedule">
          <h3>熊猫活动时间表</h3>
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>活动</th>
                <th>地点</th>
                <th>参与熊猫</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    // 添加活动时间表数据
    liveData.scheduleData.forEach(schedule => {
      liveHtml += `
        <tr>
          <td>${schedule.time}</td>
          <td>${schedule.activity}</td>
          <td>${schedule.location}</td>
          <td>${schedule.pandas}</td>
        </tr>
      `;
    });
    
    // 关闭时间表和页面容器
    liveHtml += `
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // 更新内容
    contentContainer.innerHTML = liveHtml;
    
    // 初始化自动刷新功能
    if (typeof autoRefresh !== 'undefined' && autoRefresh.initAutoRefresh) {
      const livePageContainer = document.querySelector('.live-page');
      if (livePageContainer) {
        autoRefresh.initAutoRefresh(livePageContainer, refreshLiveData, 60000); // 每60秒刷新一次
      }
    }
    
    // 添加标签页切换功能
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // 移除所有标签按钮的活动状态
        tabButtons.forEach(btn => btn.classList.remove('active'));
        // 添加当前标签按钮的活动状态
        this.classList.add('active');
        
        // 获取目标标签页ID
        const targetTabId = this.getAttribute('data-tab');
        
        // 隐藏所有标签页内容
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // 显示目标标签页内容
        document.getElementById(targetTabId).classList.add('active');
      });
    });
    
    // 添加直播按钮点击事件
    const playButtons = document.querySelectorAll('.play-button:not([disabled])');
    playButtons.forEach(button => {
      button.addEventListener('click', function() {
        const livePlayer = this.closest('.live-player');
        const placeholder = livePlayer.querySelector('.live-placeholder');
        const url = this.getAttribute('data-url');
        
        // 这里应该是实际的视频播放逻辑
        this.textContent = "正在直播中...";
        this.disabled = true;
        placeholder.style.opacity = "0.7";
        
        // 添加一个提示信息
        const liveStatus = document.createElement('div');
        liveStatus.className = 'live-status';
        liveStatus.textContent = '直播连接中，请稍候...';
        livePlayer.appendChild(liveStatus);
        
        // 尝试打开直播链接
        window.open(url, '_blank');
      });
    });
    
    // 添加历史回放按钮点击事件
    const historyPlayButtons = document.querySelectorAll('.history-play-btn');
    historyPlayButtons.forEach(button => {
      button.addEventListener('click', function() {
        const url = this.getAttribute('data-url');
        if (url && url !== '#') {
          window.open(url, '_blank');
        } else {
          alert('该历史视频暂不可用');
        }
      });
    });
    
    // 移除旧的环境数据自动刷新功能，因为已经由autoRefresh模块处理
    
  } catch (error) {
    console.error('加载熊猫直播失败:', error);
    contentContainer.innerHTML = '<div class="error-container"><p>加载熊猫直播失败，请稍后再试。</p></div>';
  }
} 

// 加载熊猫地图页面
async function loadPandaMap() {
  const contentContainer = document.getElementById('content-container');
  
  // 显示加载状态
  contentContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>正在加载熊猫地图...</p></div>';
  
  try {
    // 获取API实例
    const api = getAPI();
    if (!api) {
      throw new Error('API服务不可用');
    }
    
    // 获取熊猫位置数据
    let pandaLocations = [];
    
    // 尝试从API获取位置数据
    try {
      if (api.getPandaLocations) {
        pandaLocations = await api.getPandaLocations();
      } else {
        // 如果API不支持，使用默认数据
        pandaLocations = getDefaultPandaLocations();
      }
    } catch (error) {
      console.warn('获取熊猫位置数据失败，使用默认数据', error);
      pandaLocations = getDefaultPandaLocations();
    }
    
    // 计算统计数据
    const totalPandas = pandaLocations.reduce((sum, loc) => sum + loc.count, 0);
    const wildPandas = pandaLocations
      .filter(loc => loc.type === 'wild')
      .reduce((sum, loc) => sum + loc.count, 0);
    const captivePandas = pandaLocations
      .filter(loc => loc.type === 'captive')
      .reduce((sum, loc) => sum + loc.count, 0);
    const researchPandas = pandaLocations
      .filter(loc => loc.type === 'research')
      .reduce((sum, loc) => sum + loc.count, 0);
    const countries = [...new Set(pandaLocations.map(loc => loc.country))].length;
    
    // 构建地图HTML
    let mapHtml = `
      <div class="page-container map-page">
        <h2>全球熊猫分布地图</h2>
        <div class="map-controls">
          <div class="map-filter">
            <label>筛选显示：</label>
            <select id="map-filter-select">
              <option value="all">所有熊猫</option>
              <option value="china">中国大陆</option>
              <option value="international">国际机构</option>
              <option value="wild">野生种群</option>
              <option value="captive">圈养熊猫</option>
              <option value="research">研究中心</option>
            </select>
            <button id="display-mode-btn" class="display-mode-btn">切换视图模式</button>
          </div>
          <div class="map-legend">
            <span class="legend-item"><span class="legend-dot wild"></span> 野生种群</span>
            <span class="legend-item"><span class="legend-dot captive"></span> 圈养熊猫</span>
            <span class="legend-item"><span class="legend-dot research"></span> 研究中心</span>
            <span class="legend-item"><span class="legend-dot multiple"></span> 多功能场所</span>
          </div>
          <div class="map-filter-notice" style="display:none;"></div>
        </div>
        <div id="panda-map-container" class="panda-map-container"></div>
        <div class="map-info-panel">
          <h3>熊猫分布信息</h3>
          <div id="map-info-content">
            <p>点击地图上的标记查看详细信息</p>
            <div class="map-stats">
              <div class="map-stat-item">
                <span class="map-stat-label">全球熊猫总数</span>
                <span class="map-stat-value">${totalPandas}只</span>
              </div>
              <div class="map-stat-item">
                <span class="map-stat-label">野生熊猫数量</span>
                <span class="map-stat-value">${wildPandas}只</span>
              </div>
              <div class="map-stat-item">
                <span class="map-stat-label">圈养熊猫数量</span>
                <span class="map-stat-value">${captivePandas}只</span>
              </div>
              <div class="map-stat-item">
                <span class="map-stat-label">研究中心熊猫</span>
                <span class="map-stat-value">${researchPandas}只</span>
              </div>
              <div class="map-stat-item">
                <span class="map-stat-label">分布国家/地区</span>
                <span class="map-stat-value">${countries}个</span>
              </div>
              <div class="map-stat-item">
                <span class="map-stat-label">分布点位数量</span>
                <span class="map-stat-value">${pandaLocations.length}个</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 更新内容
    contentContainer.innerHTML = mapHtml;
    
    // 初始化地图
    initPandaMap(pandaLocations);
    
    // 添加筛选事件
    const filterSelect = document.getElementById('map-filter-select');
    if (filterSelect) {
      filterSelect.addEventListener('change', function() {
        filterPandaLocations(this.value, pandaLocations);
      });
    }
    
  } catch (error) {
    console.error('加载熊猫地图失败:', error);
    contentContainer.innerHTML = `
      <div class="error-container">
        <p>加载熊猫地图失败，请稍后再试。</p>
        <p class="error-details">${error.message}</p>
        <button id="retry-map" class="retry-button">重试</button>
      </div>
    `;
    
    // 添加重试按钮点击事件
    const retryButton = document.getElementById('retry-map');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        loadPandaMap();
      });
    }
  }
}

// 初始化熊猫地图
function initPandaMap(locations) {
  // 检查地图容器
  const mapContainer = document.getElementById('panda-map-container');
  if (!mapContainer) {
    console.error('地图容器不存在');
    return;
  }
  
  try {
    // 创建容器布局，同时包含表格和地图
    let html = `
      <div style="display: flex; flex-direction: column; height: 100%;">
        <!-- 可拖拽地图容器 -->
        <div id="draggable-map-container" class="draggable-map-container">
          <div class="map-instruction">
            <i class="fa fa-info-circle"></i> 鼠标拖拽可移动地图，滚轮可缩放地图
          </div>
          <div id="map-base" class="map-base" style="background-color: #e8f5f7;">
            <!-- 背景地图将在这里绘制 -->
          </div>
          <div id="map-markers" class="map-markers">
            <!-- 标记将在这里添加 -->
          </div>
          <div class="map-legend-container">
            <span class="legend-item"><span class="legend-dot wild"></span> 野生种群</span>
            <span class="legend-item"><span class="legend-dot captive"></span> 圈养熊猫</span>
            <span class="legend-item"><span class="legend-dot research"></span> 研究中心</span>
          </div>
        </div>
        
        <!-- 位置列表 -->
        <div class="locations-table-container">
          <h3 style="margin-top: 10px; margin-left: 10px;">全球熊猫分布列表</h3>
          <div style="margin-bottom: 20px; margin-left: 10px;">
            <div class="map-legend" style="display: flex; gap: 15px; margin-bottom: 15px;">
              <span class="legend-item"><span class="legend-dot wild" style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:#4CAF50;"></span> 野生种群</span>
              <span class="legend-item"><span class="legend-dot captive" style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:#2196F3;"></span> 圈养熊猫</span>
              <span class="legend-item"><span class="legend-dot research" style="display:inline-block; width:12px; height:12px; border-radius:50%; background-color:#9C27B0;"></span> 研究中心</span>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f1f1f1;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">名称</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">国家/地区</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">类型</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">熊猫数量</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">地址</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">操作</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    // 添加熊猫位置行
    locations.forEach(loc => {
      // 确定类型颜色和标签
      let typeColor, typeLabel;
      if (loc.types && loc.types.length > 1) {
        typeColor = "#9467bd"; // 多功能场所
        typeLabel = "多功能场所";
      } else if (loc.type === 'wild') {
        typeColor = "#4CAF50"; // 野生
        typeLabel = "野生种群";
      } else if (loc.type === 'captive') {
        typeColor = "#2196F3"; // 圈养
        typeLabel = "圈养熊猫";
      } else {
        typeColor = "#9C27B0"; // 研究中心
        typeLabel = "研究中心";
      }
              
      html += `
                <tr class="location-row" data-id="${loc.id}" style="border-bottom: 1px solid #ddd; cursor: pointer;" 
                    onclick="selectLocation(${loc.id})">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>${loc.name}</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${loc.country}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 10px; background-color: ${typeColor}; color: white; font-size: 12px;">
                      ${typeLabel}
                    </span>
                  </td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd;"><strong>${loc.count}</strong> 只</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${loc.address}</td>
          <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
                    <button class="view-detail-btn" onclick="event.stopPropagation(); selectLocation(${loc.id});"
                      style="background-color: #4ecdc4; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
              查看详情
                    </button>
                  </td>
                </tr>
              `;
    });
    
    // 关闭表格
    html += `
            </tbody>
          </table>
      </div>
      </div>
    `;
    
    // 将HTML添加到容器
    mapContainer.innerHTML = html;
    
    // 初始化可拖拽地图
    initDraggableMap();
    
    // 在地图上添加标记
    addMarkersToMap(locations);
    
    // 添加全局选择函数
    window.selectLocation = function(locationId) {
      console.log('选择位置:', locationId);
      
      // 移除所有行的选中样式
      document.querySelectorAll('.location-row').forEach(row => {
        row.style.backgroundColor = '';
      });
      
      // 添加选中行的样式
      const selectedRow = document.querySelector(`.location-row[data-id="${locationId}"]`);
      if (selectedRow) {
        selectedRow.style.backgroundColor = '#e0f7fa';
      }
      
      // 查找并显示位置信息
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        updateMapInfoPanel(location);
        
        // 找到对应的标记并居中显示
        const marker = document.querySelector(`.map-marker[data-id="${locationId}"]`);
        if (marker) {
          centerMapOnMarker(marker);
        }
      }
    };
    
    // 添加筛选功能支持
    const filterSelect = document.getElementById('map-filter-select');
    if (filterSelect) {
      filterSelect.addEventListener('change', function() {
          const filter = this.value;
          
        document.querySelectorAll('.location-row').forEach(row => {
          const locationId = parseInt(row.dataset.id);
          const location = locations.find(loc => loc.id === locationId);
          
          if (!location) return;
          
            let shouldShow = true;
            
            if (filter === 'china') {
            shouldShow = location.country === '中国';
            } else if (filter === 'international') {
            shouldShow = location.country !== '中国';
            } else if (filter === 'wild') {
            shouldShow = location.type === 'wild' || (location.types && location.types.includes('wild'));
            } else if (filter === 'captive') {
            shouldShow = location.type === 'captive' || (location.types && location.types.includes('captive'));
            } else if (filter === 'research') {
            shouldShow = location.type === 'research' || (location.types && location.types.includes('research'));
            }
            
              row.style.display = shouldShow ? '' : 'none';
          });
          
          // 更新统计信息
          updateFilterStats(locations, filter);
          
          // 更新地图标记
          updateMapMarkers(filter, locations);
      });
    }
    
    // 修改显示模式切换按钮
    const displayModeBtn = document.getElementById('display-mode-btn');
    if (displayModeBtn) {
      displayModeBtn.textContent = '地图优先';
      displayModeBtn.addEventListener('click', function() {
        const mapContainer = document.getElementById('draggable-map-container');
        const tableContainer = document.querySelector('.locations-table-container');
        
        if (this.textContent === '地图优先') {
          // 切换到地图优先模式
          mapContainer.style.height = '70%';
          tableContainer.style.height = '30%';
          this.textContent = '表格优先';
    } else {
          // 切换到表格优先模式
          mapContainer.style.height = '40%';
          tableContainer.style.height = '60%';
          this.textContent = '地图优先';
        }
      });
    }
    
    // 默认选中第一个位置
    if (locations.length > 0) {
      setTimeout(() => {
        selectLocation(locations[0].id);
      }, 100);
    }
    
  } catch (error) {
    console.error('创建熊猫分布表格失败:', error);
    mapContainer.innerHTML = `
      <div class="map-error" style="padding: 20px; text-align: center;">
        <p>数据加载失败，请稍后再试。</p>
        <p style="color: #f44336; font-size: 12px;">${error.message}</p>
      </div>
    `;
  }
}

// 在地图上添加标记
function addMarkersToMap(locations) {
  const markersContainer = document.getElementById('map-markers');
  if (!markersContainer) return;
  
  // 清空现有标记
  markersContainer.innerHTML = '';
  
  // 添加每个位置的标记
  locations.forEach(loc => {
    // 确定类型样式
    let typeClass;
    if (loc.types && loc.types.length > 1) {
      typeClass = 'multiple';
    } else {
      typeClass = loc.type;
    }
    
    // 创建标记元素
    const marker = document.createElement('div');
    marker.className = `map-marker ${typeClass}`;
    marker.dataset.id = loc.id;
    marker.title = loc.name;
    
    // 设置标记位置（使用百分比以适应不同屏幕大小）
    // 将经纬度映射到地图上的相对位置
    const left = ((loc.longitude + 180) / 360) * 100;
    const top = ((90 - loc.latitude) / 180) * 100;
    marker.style.left = `${left}%`;
    marker.style.top = `${top}%`;
    
    // 如果熊猫数量超过1，添加数字标签
    if (loc.count > 1) {
      const countLabel = document.createElement('span');
      countLabel.className = 'marker-count';
      countLabel.textContent = loc.count;
      marker.appendChild(countLabel);
    }
    
    // 添加点击事件
    marker.addEventListener('click', () => {
      selectLocation(loc.id);
    });
    
    // 将标记添加到容器
    markersContainer.appendChild(marker);
  });
  
  // 添加大陆轮廓
  addContinentOutlines();
}

// 添加大陆轮廓
function addContinentOutlines() {
  const mapBase = document.getElementById('map-base');
  if (!mapBase) return;
  
  // 清除之前的内容
  mapBase.innerHTML = '';
  
  // 显示加载状态
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-spinner';
  loadingIndicator.style.position = 'absolute';
  loadingIndicator.style.top = '50%';
  loadingIndicator.style.left = '50%';
  loadingIndicator.style.transform = 'translate(-50%, -50%)';
  
  const loadingText = document.createElement('div');
  loadingText.textContent = '正在加载世界地图...';
  loadingText.style.position = 'absolute';
  loadingText.style.top = 'calc(50% + 40px)';
  loadingText.style.left = '50%';
  loadingText.style.transform = 'translateX(-50%)';
  loadingText.style.color = '#333';
  loadingText.style.fontWeight = 'bold';
  
  mapBase.appendChild(loadingIndicator);
  mapBase.appendChild(loadingText);
  
  // 加载GeoJSON数据
  console.log('开始加载GeoJSON数据...');
  fetch('assets/data/world.json')
    .then(response => {
      console.log('GeoJSON数据响应状态:', response.status);
      if (!response.ok) {
        throw new Error('无法加载世界地图数据');
      }
      return response.json();
    })
    .then(geoData => {
      console.log('GeoJSON数据加载成功，开始处理...');
      // 移除加载指示器
      if (loadingIndicator.parentNode) loadingIndicator.parentNode.removeChild(loadingIndicator);
      if (loadingText.parentNode) loadingText.parentNode.removeChild(loadingText);
      
      // 创建SVG元素
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.style.position = "absolute";
      svg.style.top = "0";
      svg.style.left = "0";
      
      // 添加海洋背景
      const ocean = document.createElementNS(svgNS, "rect");
      ocean.setAttribute("width", "100%");
      ocean.setAttribute("height", "100%");
      ocean.setAttribute("fill", "#cfe8f3");
      svg.appendChild(ocean);
      
      // 创建投影
      const mapWidth = 900;
      const mapHeight = 500;
      
      try {
        console.log('开始处理GeoJSON数据...');
        console.log('GeoJSON数据对象结构:', Object.keys(geoData));
        
        // 获取地理特征
        let features;
        if (geoData.objects && geoData.objects.countries) {
          // TopoJSON格式
          const countries = geoData.objects.countries;
          console.log('使用countries对象');
          features = topojson.feature(geoData, countries).features;
        } else if (geoData.objects && geoData.objects.land) {
          // 有些TopoJSON使用land作为对象名
          const land = geoData.objects.land;
          console.log('使用land对象');
          features = topojson.feature(geoData, land).features;
        } else if (geoData.objects && Object.keys(geoData.objects).length > 0) {
          // 使用第一个可用对象
          const firstKey = Object.keys(geoData.objects)[0];
          console.log('使用第一个可用对象:', firstKey);
          features = topojson.feature(geoData, geoData.objects[firstKey]).features;
        } else if (geoData.features) {
          // 已经是GeoJSON格式
          console.log('直接使用GeoJSON features');
          features = geoData.features;
    } else {
          throw new Error('无法识别的地图数据格式');
        }
        
        console.log('处理后的特征数量:', features.length);
        
        // 计算地图的边界框
        let bounds = {
          min: { x: Infinity, y: Infinity },
          max: { x: -Infinity, y: -Infinity }
        };
        
        features.forEach(feature => {
          if (!feature.geometry) return;
          
          const coords = feature.geometry.coordinates;
          if (!coords) return;
          
          if (feature.geometry.type === 'Polygon') {
            coords.forEach(ring => {
              ring.forEach(point => {
                bounds.min.x = Math.min(bounds.min.x, point[0]);
                bounds.min.y = Math.min(bounds.min.y, point[1]);
                bounds.max.x = Math.max(bounds.max.x, point[0]);
                bounds.max.y = Math.max(bounds.max.y, point[1]);
              });
            });
          } else if (feature.geometry.type === 'MultiPolygon') {
            coords.forEach(polygon => {
              polygon.forEach(ring => {
                ring.forEach(point => {
                  bounds.min.x = Math.min(bounds.min.x, point[0]);
                  bounds.min.y = Math.min(bounds.min.y, point[1]);
                  bounds.max.x = Math.max(bounds.max.x, point[0]);
                  bounds.max.y = Math.max(bounds.max.y, point[1]);
                });
              });
            });
          }
        });
        
        // 计算缩放比例
        const xScale = mapWidth / (bounds.max.x - bounds.min.x);
        const yScale = mapHeight / (bounds.max.y - bounds.min.y);
        const scale = Math.min(xScale, yScale) * 0.9; // 留一些边距
        
        // 计算平移量，使地图居中
        const xOffset = (mapWidth - (bounds.max.x - bounds.min.x) * scale) / 2;
        const yOffset = (mapHeight - (bounds.max.y - bounds.min.y) * scale) / 2;
        
        // 绘制每个国家/地区
        features.forEach(feature => {
          if (!feature.geometry) return;
          
          const path = document.createElementNS(svgNS, "path");
          let d = "";
          
          if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates.forEach(ring => {
              // 确保环上有足够的点
              if (ring.length < 3) return;
              
              // 开始新的子路径
              const firstPoint = ring[0];
              const x0 = (firstPoint[0] - bounds.min.x) * scale + xOffset;
              // 反转Y轴方向，使北半球在上方
              const y0 = mapHeight - ((firstPoint[1] - bounds.min.y) * scale + yOffset);
              d += `M${x0},${y0} `;
              
              // 添加其余点
              for (let i = 1; i < ring.length; i++) {
                const point = ring[i];
                const x = (point[0] - bounds.min.x) * scale + xOffset;
                // 反转Y轴方向，使北半球在上方
                const y = mapHeight - ((point[1] - bounds.min.y) * scale + yOffset);
                d += `L${x},${y} `;
              }
              
              // 闭合路径
              d += "Z ";
            });
          } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(polygon => {
              polygon.forEach(ring => {
                // 确保环上有足够的点
                if (ring.length < 3) return;
                
                // 开始新的子路径
                const firstPoint = ring[0];
                const x0 = (firstPoint[0] - bounds.min.x) * scale + xOffset;
                // 反转Y轴方向，使北半球在上方
                const y0 = mapHeight - ((firstPoint[1] - bounds.min.y) * scale + yOffset);
                d += `M${x0},${y0} `;
                
                // 添加其余点
                for (let i = 1; i < ring.length; i++) {
                  const point = ring[i];
                  const x = (point[0] - bounds.min.x) * scale + xOffset;
                  // 反转Y轴方向，使北半球在上方
                  const y = mapHeight - ((point[1] - bounds.min.y) * scale + yOffset);
                  d += `L${x},${y} `;
                }
                
                // 闭合路径
                d += "Z ";
              });
            });
          }
          
          path.setAttribute("d", d);
          path.setAttribute("fill", "#e8e8e8");
          path.setAttribute("stroke", "#ccc");
          path.setAttribute("stroke-width", "0.5");
          path.setAttribute("class", "country");
          
          // 添加鼠标悬停效果
          path.addEventListener('mouseover', () => {
            path.setAttribute("fill", "#d4d4d4");
          });
          
          path.addEventListener('mouseout', () => {
            path.setAttribute("fill", "#e8e8e8");
          });
          
          svg.appendChild(path);
        });
        
        mapBase.appendChild(svg);
        
        // 添加经纬度网格线
        addGridLines();
        
        // 添加地图注释
        const mapNote = document.createElement('div');
        mapNote.className = 'map-note';
        mapNote.textContent = '世界地图 - 基于真实地理数据';
        mapNote.style.position = 'absolute';
        mapNote.style.bottom = '10px';
        mapNote.style.left = '50%';
        mapNote.style.transform = 'translateX(-50%)';
        mapNote.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        mapNote.style.padding = '5px 10px';
        mapNote.style.borderRadius = '3px';
        mapNote.style.fontSize = '12px';
        mapNote.style.color = '#666';
        mapBase.appendChild(mapNote);
      } catch (error) {
        console.error('处理GeoJSON数据时出错:', error);
        // 移除加载指示器
        if (loadingIndicator.parentNode) loadingIndicator.parentNode.removeChild(loadingIndicator);
        if (loadingText.parentNode) loadingText.parentNode.removeChild(loadingText);
        
        // 创建备用简化地图
        createBackupMap();
      }
    })
    .catch(error => {
      console.error('加载世界地图失败:', error);
      // 移除加载指示器
      if (loadingIndicator.parentNode) loadingIndicator.parentNode.removeChild(loadingIndicator);
      if (loadingText.parentNode) loadingText.parentNode.removeChild(loadingText);
      
      // 显示错误信息
      const errorText = document.createElement('div');
      errorText.textContent = '加载世界地图失败，显示备用简化地图。';
      errorText.style.position = 'absolute';
      errorText.style.top = '10px';
      errorText.style.left = '10px';
      errorText.style.color = '#f44336';
      errorText.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
      errorText.style.padding = '5px 10px';
      errorText.style.borderRadius = '3px';
      mapBase.appendChild(errorText);
      
      // 创建备用简化地图
      createBackupMap();
    });
  
  // 备用方案：创建简化的世界地图
  function createBackupMap() {
    // 创建SVG元素
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    
    // 添加海洋背景
    const ocean = document.createElementNS(svgNS, "rect");
    ocean.setAttribute("width", "100%");
    ocean.setAttribute("height", "100%");
    ocean.setAttribute("fill", "#cfe8f3");
    svg.appendChild(ocean);
    
    // 简化的大陆轮廓
    const continents = [
      { name: '亚洲', left: '60%', top: '30%', width: '25%', height: '35%' },
      { name: '北美洲', left: '15%', top: '25%', width: '25%', height: '30%' },
      { name: '欧洲', left: '45%', top: '20%', width: '15%', height: '25%' },
      { name: '非洲', left: '45%', top: '45%', width: '20%', height: '35%' },
      { name: '南美洲', left: '25%', top: '60%', width: '15%', height: '30%' },
      { name: '大洋洲', left: '80%', top: '60%', width: '15%', height: '25%' }
    ];
    
    mapBase.appendChild(svg);
    
    // 创建并添加每个大陆的元素
    continents.forEach(continent => {
      const continentEl = document.createElement('div');
      continentEl.className = 'continent';
      continentEl.style.left = continent.left;
      continentEl.style.top = continent.top;
      continentEl.style.width = continent.width;
      continentEl.style.height = continent.height;
      continentEl.title = continent.name;
      mapBase.appendChild(continentEl);
    });
    
    // 添加提示信息
    const mapNote = document.createElement('div');
    mapNote.className = 'map-note';
    mapNote.textContent = '加载世界地图失败，显示备用简化地图';
    mapNote.style.position = 'absolute';
    mapNote.style.bottom = '10px';
    mapNote.style.left = '0';
    mapNote.style.right = '0';
    mapNote.style.textAlign = 'center';
    mapNote.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    mapNote.style.padding = '5px';
    mapNote.style.fontSize = '12px';
    mapNote.style.color = '#666';
    mapBase.appendChild(mapNote);
    
    // 添加经纬度网格线
    addGridLines();
  }
  
  // 添加经纬度网格线
  function addGridLines() {
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-lines';
    gridContainer.style.position = 'absolute';
    gridContainer.style.top = '0';
    gridContainer.style.left = '0';
    gridContainer.style.width = '100%';
    gridContainer.style.height = '100%';
    gridContainer.style.pointerEvents = 'none';
    
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.zIndex = "2";
    
    // 添加经纬度网格线
    const gridColor = "rgba(255, 255, 255, 0.3)";
    const gridWidth = "0.5";
    
    // 添加经度线
    for (let i = 0; i <= 900; i += 100) {
      const longitudeLine = document.createElementNS(svgNS, "line");
      longitudeLine.setAttribute("x1", i);
      longitudeLine.setAttribute("y1", "0");
      longitudeLine.setAttribute("x2", i);
      longitudeLine.setAttribute("y2", "800");
      longitudeLine.setAttribute("stroke", gridColor);
      longitudeLine.setAttribute("stroke-width", gridWidth);
      svg.appendChild(longitudeLine);
    }
    
    // 添加纬度线
    for (let i = 0; i <= 800; i += 100) {
      const latitudeLine = document.createElementNS(svgNS, "line");
      latitudeLine.setAttribute("x1", "0");
      latitudeLine.setAttribute("y1", i);
      latitudeLine.setAttribute("x2", "900");
      latitudeLine.setAttribute("y2", i);
      latitudeLine.setAttribute("stroke", gridColor);
      latitudeLine.setAttribute("stroke-width", gridWidth);
      svg.appendChild(latitudeLine);
    }
    
    gridContainer.appendChild(svg);
    mapBase.appendChild(gridContainer);
  }
}

// 更新地图标记（根据筛选条件）
function updateMapMarkers(filter, locations) {
  const markers = document.querySelectorAll('.map-marker');
  
  markers.forEach(marker => {
    const locationId = parseInt(marker.dataset.id);
    const location = locations.find(loc => loc.id === locationId);
    
    if (!location) return;
    
    let shouldShow = true;
    
    if (filter === 'china') {
      shouldShow = location.country === '中国';
    } else if (filter === 'international') {
      shouldShow = location.country !== '中国';
    } else if (filter === 'wild') {
      shouldShow = location.type === 'wild' || (location.types && location.types.includes('wild'));
    } else if (filter === 'captive') {
      shouldShow = location.type === 'captive' || (location.types && location.types.includes('captive'));
    } else if (filter === 'research') {
      shouldShow = location.type === 'research' || (location.types && location.types.includes('research'));
    }
    
    marker.style.display = shouldShow ? '' : 'none';
  });
}

// 初始化可拖拽地图
function initDraggableMap() {
  const draggableMap = document.getElementById('draggable-map-container');
  if (!draggableMap) return;
  
  // 获取地图容器
  const mapBase = document.getElementById('map-base');
  const mapMarkers = document.getElementById('map-markers');
  
  // 存储地图状态
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let mapX = 0;
  let mapY = 0;
  let zoomLevel = 1;
  
  // 更新地图变换
  function updateMapTransform() {
    if (mapBase && mapMarkers) {
      // 应用变换到地图底图和标记层
      const transform = `translate(${mapX}px, ${mapY}px) scale(${zoomLevel})`;
      mapBase.style.transform = transform;
      mapMarkers.style.transform = transform;
    }
  }
  
  // 添加鼠标事件处理
  draggableMap.addEventListener('mousedown', (e) => {
    // 不要处理标记点击事件
    if (e.target.classList.contains('map-marker') || 
        e.target.parentElement.classList.contains('map-marker')) {
      return;
    }
    
    isDragging = true;
    startX = e.clientX - mapX;
    startY = e.clientY - mapY;
    draggableMap.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    mapX = e.clientX - startX;
    mapY = e.clientY - startY;
    updateMapTransform();
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    draggableMap.style.cursor = 'grab';
  });
  
  // 添加缩放功能
  draggableMap.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    // 确定鼠标位置相对于地图容器的坐标
    const rect = draggableMap.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 计算鼠标在当前变换下的地图坐标
    const mapMouseX = (mouseX - mapX) / zoomLevel;
    const mapMouseY = (mouseY - mapY) / zoomLevel;
    
    // 根据滚轮方向调整缩放级别
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoomLevel = Math.max(0.5, Math.min(3, zoomLevel + zoomDelta));
    
    // 只有在缩放级别改变时才重新计算位置
    if (newZoomLevel !== zoomLevel) {
      // 调整缩放级别
      zoomLevel = newZoomLevel;
      
      // 重新计算地图偏移，保持鼠标指向的地图点不变
      mapX = mouseX - mapMouseX * zoomLevel;
      mapY = mouseY - mapMouseY * zoomLevel;
      
      // 更新变换
      updateMapTransform();
    }
  });
  
  // 添加触摸屏支持
  let touchStartX = 0;
  let touchStartY = 0;
  let initialDistance = 0;
  
  draggableMap.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      // 单指触摸 - 移动地图
      touchStartX = e.touches[0].clientX - mapX;
      touchStartY = e.touches[0].clientY - mapY;
    } else if (e.touches.length === 2) {
      // 双指触摸 - 缩放地图
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    }
  });
  
  draggableMap.addEventListener('touchmove', (e) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // 单指移动地图
      mapX = e.touches[0].clientX - touchStartX;
      mapY = e.touches[0].clientY - touchStartY;
      updateMapTransform();
    } else if (e.touches.length === 2) {
      // 双指缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      // 计算中心点
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      // 获取地图容器位置
      const rect = draggableMap.getBoundingClientRect();
      const containerCenterX = centerX - rect.left;
      const containerCenterY = centerY - rect.top;
      
      // 计算中心点在当前变换下的地图坐标
      const mapCenterX = (containerCenterX - mapX) / zoomLevel;
      const mapCenterY = (containerCenterY - mapY) / zoomLevel;
      
      // 计算新的缩放级别
      if (initialDistance > 0) {
        const newZoomLevel = Math.max(0.5, Math.min(3, zoomLevel * (currentDistance / initialDistance)));
        
        // 只有在缩放级别显著变化时才重新计算位置
        if (Math.abs(newZoomLevel - zoomLevel) > 0.01) {
          zoomLevel = newZoomLevel;
          
          // 重新计算地图偏移，保持中心点不变
          mapX = containerCenterX - mapCenterX * zoomLevel;
          mapY = containerCenterY - mapCenterY * zoomLevel;
          
          // 更新初始距离
          initialDistance = currentDistance;
          
          // 更新变换
          updateMapTransform();
        }
      }
    }
  });
  
  // 添加键盘控制
  document.addEventListener('keydown', (e) => {
    // 获取地图容器是否处于活动状态
    const isMapActive = document.activeElement === document.body && 
                       draggableMap.contains(document.activeElement) ||
                       draggableMap.matches(':hover');
    
    if (!isMapActive) return;
    
    // 计算移动速度
    const moveAmount = 20 / zoomLevel;
    
    // 方向键控制
    switch (e.key) {
      case 'ArrowUp':
        mapY += moveAmount;
        updateMapTransform();
        e.preventDefault();
        break;
      case 'ArrowDown':
        mapY -= moveAmount;
        updateMapTransform();
        e.preventDefault();
        break;
      case 'ArrowLeft':
        mapX += moveAmount;
        updateMapTransform();
        e.preventDefault();
        break;
      case 'ArrowRight':
        mapX -= moveAmount;
        updateMapTransform();
        e.preventDefault();
        break;
      case '+':
      case '=':
        zoomLevel = Math.min(3, zoomLevel + 0.1);
        updateMapTransform();
        e.preventDefault();
        break;
      case '-':
        zoomLevel = Math.max(0.5, zoomLevel - 0.1);
        updateMapTransform();
        e.preventDefault();
        break;
      case '0':
        // 重置视图
        mapX = 0;
        mapY = 0;
        zoomLevel = 1;
        updateMapTransform();
        e.preventDefault();
        break;
    }
  });
  
  // 设置地图默认样式和初始视图
  draggableMap.style.cursor = 'grab';
  mapBase.style.transformOrigin = '0 0';
  mapMarkers.style.transformOrigin = '0 0';
  
  // 初始化地图位置（居中）
  const rect = draggableMap.getBoundingClientRect();
  mapX = rect.width / 4;
  updateMapTransform();
}
  
// 将地图中心调整到特定标记
function centerMapOnMarker(marker) {
  if (!marker) return;
  
  // 获取地图容器和标记容器
  const mapContainer = document.getElementById('draggable-map-container');
  const mapBase = document.getElementById('map-base');
  const mapMarkers = document.getElementById('map-markers');
  
  if (!mapContainer || !mapBase || !mapMarkers) return;
  
  // 获取当前变换信息
  const transform = mapBase.style.transform;
  const match = transform.match(/translate\((.+?)px,\s*(.+?)px\)\s*scale\((.+?)\)/);
  
  if (!match) return;
  
  const currentX = parseFloat(match[1]);
  const currentY = parseFloat(match[2]);
  const currentZoom = parseFloat(match[3]);
  
  // 获取容器和标记的位置和尺寸
  const containerRect = mapContainer.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  
  // 计算标记在变换前的原始位置
  const markerStyle = getComputedStyle(marker);
  const originalLeft = parseFloat(markerStyle.left) / 100 * containerRect.width;
  const originalTop = parseFloat(markerStyle.top) / 100 * containerRect.height;
  
  // 计算新的位置（使标记位于容器中心）
  const targetX = containerRect.width / 2 - originalLeft * currentZoom;
  const targetY = containerRect.height / 2 - originalTop * currentZoom;
  
  // 平滑过渡到新位置
  mapBase.style.transition = 'transform 0.5s ease-out';
  mapMarkers.style.transition = 'transform 0.5s ease-out';
  
  mapBase.style.transform = `translate(${targetX}px, ${targetY}px) scale(${currentZoom})`;
  mapMarkers.style.transform = `translate(${targetX}px, ${targetY}px) scale(${currentZoom})`;
  
  // 过渡结束后清除过渡属性
  setTimeout(() => {
    mapBase.style.transition = '';
    mapMarkers.style.transition = '';
  }, 500);
}
  
// 更新地图信息面板，显示选中的标记信息
function updateMapInfoPanel(location) {
  const infoPanel = document.getElementById('map-info-content');
  if (!infoPanel) return;
  
  // 确定类型文本和样式
  let typeClass, typeText;
  if (location.types && location.types.length > 1) {
    typeClass = 'multiple';
    typeText = '多功能场所';
  } else if (location.type === 'wild') {
    typeClass = 'wild';
    typeText = '野生种群';
  } else if (location.type === 'captive') {
    typeClass = 'captive';
    typeText = '圈养熊猫';
  } else {
    typeClass = 'research';
    typeText = '研究中心';
  }
  
  // 构建HTML
  const html = `
    <h4>${location.name}</h4>
    <div class="type-badge ${typeClass}">${typeText}</div>
    <div class="map-info-address">
      <strong>地址：</strong>${location.address || '暂无详细地址'}
    </div>
    <div class="map-info-details">
      <div class="map-info-item">
        <span class="map-info-label">所在国家/地区</span>
        <span class="map-info-value">${location.country}</span>
      </div>
      <div class="map-info-item">
        <span class="map-info-label">熊猫数量</span>
        <span class="map-info-value">${location.count} 只</span>
      </div>
        <div class="map-info-item">
        <span class="map-info-label">建立时间</span>
        <span class="map-info-value">${location.established || '未知'}</span>
        </div>
      <div class="map-info-item">
        <span class="map-info-label">开放状态</span>
        <span class="map-info-value">${location.openStatus || '未知'}</span>
      </div>
    </div>
    <div class="map-info-description">
      <p>${location.description || '暂无详细描述信息'}</p>
    </div>
  `;
  
  infoPanel.innerHTML = html;
}

// 筛选熊猫位置 (Leaflet版本)
function filterPandaLocations(filter, locations) {
  const mapContainer = document.getElementById('panda-map-container');
  if (!mapContainer) return;
  
  // 获取地图实例
  let map = null;
  // 查找所有地图实例
  for (const key in L) {
    if (L[key] && L[key]._container === mapContainer) {
      map = L[key];
      break;
    }
  }
  
  if (!map) return;
  
  // 更新筛选按钮样式
  const filterSelect = document.getElementById('map-filter-select');
  if (filterSelect) {
    // 添加选择动画效果
    filterSelect.classList.add('active');
    setTimeout(() => {
      filterSelect.classList.remove('active');
    }, 500);
  }
  
  // 根据筛选条件过滤位置
  let filteredLocations = [];
  let filterName = '';
  
  switch (filter) {
    case 'china':
      filteredLocations = locations.filter(loc => loc.country === '中国');
      filterName = '中国大陆';
      break;
    case 'international':
      filteredLocations = locations.filter(loc => loc.country !== '中国');
      filterName = '国际机构';
      break;
    case 'wild':
      filteredLocations = locations.filter(loc => {
        return (loc.types && loc.types.includes('wild')) || loc.type === 'wild';
      });
      filterName = '野生种群';
      break;
    case 'captive':
      filteredLocations = locations.filter(loc => {
        return (loc.types && loc.types.includes('captive')) || loc.type === 'captive';
      });
      filterName = '圈养熊猫';
      break;
    case 'research':
      filteredLocations = locations.filter(loc => {
        return (loc.types && loc.types.includes('research')) || loc.type === 'research';
      });
      filterName = '研究中心';
      break;
    default:
      filteredLocations = locations;
      filterName = '所有熊猫';
  }
  
  // 添加过渡动画
  const fadeOutMarkers = () => {
    // 找到所有标记
    const markers = document.querySelectorAll('.leaflet-marker-icon, .leaflet-marker-shadow');
    
    // 添加淡出效果
    markers.forEach(marker => {
      marker.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      marker.style.opacity = '0';
      marker.style.transform = 'scale(0.8)';
    });
    
    // 显示加载动画
    const loadingElement = document.createElement('div');
    loadingElement.className = 'map-loading';
    loadingElement.style.opacity = '0';
    loadingElement.innerHTML = '<div class="map-loading-spinner"></div>';
    mapContainer.appendChild(loadingElement);
    
    // 淡入加载动画
    setTimeout(() => {
      loadingElement.style.transition = 'opacity 0.3s ease';
      loadingElement.style.opacity = '1';
    }, 10);
    
    // 延迟后清除现有标记，保留底图图层
    setTimeout(() => {
      map.eachLayer(function(layer) {
        // 保留底图图层(TileLayer)，移除所有其他图层
        if (!(layer instanceof L.TileLayer)) {
          map.removeLayer(layer);
        }
      });
      
      // 重新添加底图
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // 添加过滤后的标记
      addPandaMarkersLeaflet(map, filteredLocations);
      
      // 淡出加载动画
      setTimeout(() => {
        loadingElement.style.opacity = '0';
        // 移除加载动画
        setTimeout(() => {
          if (mapContainer.contains(loadingElement)) {
            mapContainer.removeChild(loadingElement);
          }
        }, 300);
      }, 500);
    }, 300);
  };
  
  // 执行淡出动画
  fadeOutMarkers();
  
  // 显示筛选提示
  const filterNotice = document.createElement('div');
  filterNotice.className = 'map-filter-notice';
  filterNotice.textContent = `已筛选: ${filterName}`;
  filterNotice.style.position = 'absolute';
  filterNotice.style.bottom = '10px';
  filterNotice.style.right = '10px';
  filterNotice.style.background = 'rgba(0, 0, 0, 0.7)';
  filterNotice.style.color = 'white';
  filterNotice.style.padding = '8px 15px';
  filterNotice.style.borderRadius = '4px';
  filterNotice.style.fontSize = '14px';
  filterNotice.style.zIndex = '1000';
  filterNotice.style.opacity = '0';
  filterNotice.style.transition = 'opacity 0.3s ease';
  
  mapContainer.appendChild(filterNotice);
  
  // 显示通知
  setTimeout(() => {
    filterNotice.style.opacity = '1';
    
    // 延迟后隐藏通知
    setTimeout(() => {
      filterNotice.style.opacity = '0';
      
      // 移除通知元素
      setTimeout(() => {
        if (mapContainer.contains(filterNotice)) {
          mapContainer.removeChild(filterNotice);
        }
      }, 300);
    }, 2000);
  }, 800);
  
  // 更新统计数据显示
  updateFilterStats(filteredLocations, filter);
}

// 更新筛选后的统计数据
function updateFilterStats(locations, filter) {
  const mapInfoContent = document.getElementById('map-info-content');
  if (!mapInfoContent) return;
  
  // 计算统计数据
  const totalPandas = locations.reduce((sum, loc) => sum + loc.count, 0);
  const wildPandas = locations
    .filter(loc => loc.type === 'wild')
    .reduce((sum, loc) => sum + loc.count, 0);
  const captivePandas = locations
    .filter(loc => loc.type === 'captive')
    .reduce((sum, loc) => sum + loc.count, 0);
  const researchPandas = locations
    .filter(loc => loc.type === 'research')
    .reduce((sum, loc) => sum + loc.count, 0);
  const countries = [...new Set(locations.map(loc => loc.country))].length;
  
  // 获取筛选名称
  let filterName = '';
  switch (filter) {
    case 'china': filterName = '中国大陆'; break;
    case 'international': filterName = '国际机构'; break;
    case 'wild': filterName = '野生种群'; break;
    case 'captive': filterName = '圈养熊猫'; break;
    case 'research': filterName = '研究中心'; break;
    default: filterName = '所有熊猫';
  }
  
  // 如果没有选中特定熊猫，显示默认提示
  if (!mapInfoContent.querySelector('h4') || mapInfoContent.querySelector('h4').textContent === '熊猫分布信息') {
    mapInfoContent.innerHTML = `
      <p>当前筛选: <strong>${filterName}</strong></p>
      <p>点击地图上的标记查看详细信息</p>
      <div class="map-stats">
        <div class="map-stat-item">
          <span class="map-stat-label">熊猫总数</span>
          <span class="map-stat-value">${totalPandas}只</span>
        </div>
        <div class="map-stat-item">
          <span class="map-stat-label">野生熊猫</span>
          <span class="map-stat-value">${wildPandas}只</span>
        </div>
        <div class="map-stat-item">
          <span class="map-stat-label">圈养熊猫</span>
          <span class="map-stat-value">${captivePandas}只</span>
        </div>
        <div class="map-stat-item">
          <span class="map-stat-label">研究中心熊猫</span>
          <span class="map-stat-value">${researchPandas}只</span>
        </div>
        <div class="map-stat-item">
          <span class="map-stat-label">分布国家/地区</span>
          <span class="map-stat-value">${countries}个</span>
        </div>
        <div class="map-stat-item">
          <span class="map-stat-label">分布点位数量</span>
          <span class="map-stat-value">${locations.length}个</span>
        </div>
      </div>
    `;
    
    // 添加统计项目动画
    setTimeout(() => {
      const statItems = mapInfoContent.querySelectorAll('.map-stat-item');
      statItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        }, index * 100);
      });
    }, 100);
  }
}

// 获取默认熊猫位置数据
function getDefaultPandaLocations() {
  return [
    {
      id: 1,
      name: '四川卧龙国家级自然保护区',
      address: '四川省阿坝藏族羌族自治州汶川县',
      country: '中国',
      latitude: 30.8746,
      longitude: 103.1486,
      count: 150,
      type: 'wild',
      description: '中国最大的大熊猫自然栖息地，也是大熊猫保护研究中心所在地。',
      established: '1963年',
      imageUrl: './assets/wolong.jpg'
    },
    {
      id: 2,
      name: '陕西佛坪国家级自然保护区',
      address: '陕西省汉中市佛坪县',
      country: '中国',
      latitude: 33.6706,
      longitude: 107.9478,
      count: 80,
      type: 'wild',
      description: '秦岭山脉中最重要的大熊猫栖息地之一，拥有较为完整的大熊猫生态系统。',
      established: '1978年',
      imageUrl: './assets/foping.jpg'
    },
    {
      id: 3,
      name: '成都大熊猫繁育研究基地',
      address: '四川省成都市成华区熊猫大道1375号',
      country: '中国',
      latitude: 30.7384,
      longitude: 104.1517,
      count: 200,
      type: 'research',
      description: '世界上最著名的大熊猫繁育研究机构，拥有全球最多的圈养大熊猫。',
      established: '1987年',
      imageUrl: './assets/chengdu.jpg'
    },
    {
      id: 4,
      name: '北京动物园',
      address: '北京市西城区西直门外大街137号',
      country: '中国',
      latitude: 39.9402,
      longitude: 116.3376,
      count: 5,
      type: 'captive',
      description: '中国最早饲养展示大熊猫的动物园之一，拥有专门的大熊猫馆。',
      established: '1908年',
      imageUrl: './assets/beijing_zoo.jpg'
    },
    {
      id: 5,
      name: '美国国家动物园',
      address: '3001 Connecticut Ave NW, Washington, DC 20008, 美国',
      country: '美国',
      latitude: 38.9296,
      longitude: -77.0497,
      count: 3,
      type: 'captive',
      description: '美国最早饲养大熊猫的动物园，参与中美大熊猫保护合作项目。',
      established: '1889年',
      imageUrl: './assets/national_zoo.jpg'
    },
    {
      id: 6,
      name: '日本上野动物园',
      address: '東京都台東区上野公園9-83',
      country: '日本',
      latitude: 35.7167,
      longitude: 139.7711,
      count: 2,
      type: 'captive',
      description: '日本最早引进大熊猫的动物园，是日中友好的重要象征。',
      established: '1882年',
      imageUrl: './assets/ueno_zoo.jpg'
    },
    {
      id: 7,
      name: '法国博瓦勒动物园',
      address: 'Avenue de la République, 41800 Beauval, 法国',
      country: '法国',
      latitude: 47.2486,
      longitude: 1.3542,
      count: 4,
      type: 'captive',
      description: '欧洲最成功的大熊猫繁育基地之一，曾成功繁育多只大熊猫幼崽。',
      established: '1980年',
      imageUrl: './assets/beauval_zoo.jpg'
    },
    {
      id: 8,
      name: '甘肃白水江国家级自然保护区',
      address: '甘肃省陇南市文县',
      country: '中国',
      latitude: 32.9041,
      longitude: 104.8714,
      count: 110,
      type: 'wild',
      description: '甘肃省最大的大熊猫栖息地，是大熊猫分布最北的区域。',
      established: '1963年',
      imageUrl: './assets/baishuijiang.jpg'
    },
    {
      id: 9,
      name: '爱丁堡动物园',
      address: '134 Corstorphine Rd, Edinburgh EH12 6TS, 英国',
      country: '英国',
      latitude: 55.9421,
      longitude: -3.2687,
      count: 2,
      type: 'captive',
      description: '英国唯一饲养大熊猫的动物园，参与中英大熊猫保护合作项目。',
      established: '1913年',
      imageUrl: './assets/edinburgh_zoo.jpg'
    },
    {
      id: 10,
      name: '亚特兰大动物园',
      address: '800 Cherokee Ave SE, Atlanta, GA 30315, 美国',
      country: '美国',
      latitude: 33.7341,
      longitude: -84.3741,
      count: 2,
      type: 'captive',
      description: '美国最成功的大熊猫繁育基地之一，已成功繁育多只大熊猫幼崽。',
      established: '1889年',
      imageUrl: './assets/atlanta_zoo.jpg'
    },
    {
      id: 11,
      name: '多伦多动物园',
      address: '2000 Meadowvale Rd, Toronto, ON M1B 5K7, 加拿大',
      country: '加拿大',
      latitude: 43.8209,
      longitude: -79.1827,
      count: 2,
      type: 'captive',
      description: '加拿大唯一饲养大熊猫的动物园，参与中加大熊猫保护合作项目。',
      established: '1974年',
      imageUrl: './assets/toronto_zoo.jpg'
    },
    {
      id: 12,
      name: '马来西亚国家动物园',
      address: 'Hulu Langat, Selangor, 马来西亚',
      country: '马来西亚',
      latitude: 3.2097,
      longitude: 101.7414,
      count: 2,
      type: 'captive',
      description: '东南亚地区饲养大熊猫的主要动物园，参与中马大熊猫保护合作项目。',
      established: '1963年',
      imageUrl: './assets/malaysia_zoo.jpg'
    }
  ];
}

// 切换标记显示模式
function toggleMarkerDisplay(locations) {
  // 获取当前模式并切换
  const currentMode = localStorage.getItem('useSimpleMarkers') === 'true';
  localStorage.setItem('useSimpleMarkers', (!currentMode).toString());
  
  // 更新显示模式按钮文本和样式
  const displayModeBtn = document.getElementById('display-mode-btn');
  if (displayModeBtn) {
    displayModeBtn.textContent = !currentMode ? '使用图标显示' : '使用圆点显示';
    
    // 添加按钮动画效果
    displayModeBtn.classList.add('active');
    setTimeout(() => {
      displayModeBtn.classList.remove('active');
    }, 500);
  }
  
  // 获取地图实例
  const mapContainer = document.getElementById('panda-map-container');
  if (!mapContainer) {
    console.error('找不到地图容器');
    return;
  }
  
  // 确保Leaflet已加载
  if (typeof L === 'undefined') {
    console.error('Leaflet未加载');
    return;
  }
  
  let map = null;
  // 查找所有地图实例
  for (const key in L) {
    if (L[key] && L[key]._container === mapContainer) {
      map = L[key];
      break;
    }
  }
  
  if (!map) {
    console.error('找不到地图实例');
    return;
  }
  
  console.log('找到地图实例，准备重新加载标记');
  
  // 获取当前筛选条件
  const filterSelect = document.getElementById('map-filter-select');
  const currentFilter = filterSelect ? filterSelect.value : 'all';
  
  // 根据筛选条件过滤位置
  let filteredLocations = [];
  
  switch (currentFilter) {
    case 'china':
      filteredLocations = locations.filter(loc => loc.country === '中国');
      break;
    case 'international':
      filteredLocations = locations.filter(loc => loc.country !== '中国');
      break;
    case 'wild':
      filteredLocations = locations.filter(loc => {
        return (loc.types && loc.types.includes('wild')) || loc.type === 'wild';
      });
      break;
    case 'captive':
      filteredLocations = locations.filter(loc => {
        return (loc.types && loc.types.includes('captive')) || loc.type === 'captive';
      });
      break;
    case 'research':
      filteredLocations = locations.filter(loc => {
        return (loc.types && loc.types.includes('research')) || loc.type === 'research';
      });
      break;
    default:
      filteredLocations = locations;
  }
  
  // 重新加载标记
  addPandaMarkersLeaflet(map, filteredLocations);
}

// 加载软件设置页面
function loadAppSettings() {
  const contentContainer = document.getElementById('content-container');
  
  // 显示加载状态
  contentContainer.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>正在加载软件设置...</p></div>';
  
  try {
    // 获取当前主题设置
    const currentTheme = localStorage.getItem('appTheme') || 'light';
    const currentBackground = localStorage.getItem('appBackground') || 'default';
    const currentFontSize = localStorage.getItem('appFontSize') || 'medium';
    const autoRefreshEnabled = localStorage.getItem('autoRefreshEnabled') === 'true';
    const refreshInterval = localStorage.getItem('refreshInterval') || '60';
    
    // 构建设置页面HTML
    let settingsHtml = `
      <div class="page-container settings-page">
        <h2>软件设置</h2>
        
        <div class="settings-section">
          <h3>外观设置</h3>
          <div class="settings-group">
            <div class="settings-item">
              <label for="theme-select">主题颜色：</label>
              <select id="theme-select" class="settings-select">
                <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>浅色主题</option>
                <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>深色主题</option>
                <option value="panda" ${currentTheme === 'panda' ? 'selected' : ''}>熊猫主题</option>
                <option value="forest" ${currentTheme === 'forest' ? 'selected' : ''}>森林主题</option>
                <option value="bamboo" ${currentTheme === 'bamboo' ? 'selected' : ''}>竹林主题</option>
              </select>
            </div>
            
            <div class="settings-item">
              <label for="background-select">背景样式：</label>
              <select id="background-select" class="settings-select">
                <option value="default" ${currentBackground === 'default' ? 'selected' : ''}>默认背景</option>
                <option value="gradient" ${currentBackground === 'gradient' ? 'selected' : ''}>渐变背景</option>
                <option value="pattern" ${currentBackground === 'pattern' ? 'selected' : ''}>竹叶图案</option>
                <option value="image1" ${currentBackground === 'image1' ? 'selected' : ''}>熊猫背景1</option>
                <option value="image2" ${currentBackground === 'image2' ? 'selected' : ''}>熊猫背景2</option>
              </select>
            </div>
            
            <div class="settings-item">
              <label for="font-size-select">字体大小：</label>
              <select id="font-size-select" class="settings-select">
                <option value="small" ${currentFontSize === 'small' ? 'selected' : ''}>小号字体</option>
                <option value="medium" ${currentFontSize === 'medium' ? 'selected' : ''}>中号字体</option>
                <option value="large" ${currentFontSize === 'large' ? 'selected' : ''}>大号字体</option>
                <option value="xlarge" ${currentFontSize === 'xlarge' ? 'selected' : ''}>超大字体</option>
              </select>
            </div>
            
            <div class="settings-item theme-preview">
              <label>主题预览：</label>
              <div id="theme-preview-container" class="theme-preview-container ${currentTheme}">
                <div class="preview-header">
                  <div class="preview-logo">川小熊猫</div>
                  <div class="preview-nav">
                    <span>熊猫地图</span>
                    <span>熊猫动态</span>
                    <span>熊猫知识</span>
                  </div>
                </div>
                <div class="preview-content">
                  <div class="preview-card">
                    <h4>大熊猫新闻</h4>
                    <p>这是一条示例新闻内容，展示当前主题的显示效果。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>数据更新设置</h3>
          <div class="settings-group">
            <div class="settings-item">
              <label class="checkbox-label">
                <input type="checkbox" id="auto-refresh-checkbox" ${autoRefreshEnabled ? 'checked' : ''}>
                <span>启用自动更新数据</span>
              </label>
            </div>
            
            <div class="settings-item">
              <label for="refresh-interval">更新间隔(秒)：</label>
              <input type="number" id="refresh-interval" min="30" max="600" value="${refreshInterval}">
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>应用信息</h3>
          <div class="settings-group">
            <div class="settings-item">
              <label>应用版本：</label>
              <span>1.0.0</span>
            </div>
            <div class="settings-item">
              <label>数据来源：</label>
              <span>通义千问API</span>
            </div>
            <div class="settings-item">
              <button id="reset-settings" class="settings-button danger">恢复默认设置</button>
              <button id="save-settings" class="settings-button primary">保存设置</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 更新内容
    contentContainer.innerHTML = settingsHtml;
    
    // 添加设置变更事件
    const themeSelect = document.getElementById('theme-select');
    const backgroundSelect = document.getElementById('background-select');
    const fontSizeSelect = document.getElementById('font-size-select');
    const themePreviewContainer = document.getElementById('theme-preview-container');
    
    // 主题预览效果
    if (themeSelect && themePreviewContainer) {
      themeSelect.addEventListener('change', function() {
        // 更新预览容器的类
        themePreviewContainer.className = 'theme-preview-container ' + this.value;
      });
    }
    
    // 保存设置按钮
    const saveButton = document.getElementById('save-settings');
    if (saveButton) {
      saveButton.addEventListener('click', function() {
        // 获取所有设置
        const newTheme = themeSelect.value;
        const newBackground = backgroundSelect.value;
        const newFontSize = fontSizeSelect.value;
        const newAutoRefresh = document.getElementById('auto-refresh-checkbox').checked;
        const newRefreshInterval = document.getElementById('refresh-interval').value;
        
        // 保存到localStorage
        localStorage.setItem('appTheme', newTheme);
        localStorage.setItem('appBackground', newBackground);
        localStorage.setItem('appFontSize', newFontSize);
        localStorage.setItem('autoRefreshEnabled', newAutoRefresh);
        localStorage.setItem('refreshInterval', newRefreshInterval);
        
        // 应用新设置
        applyAppSettings();
        
        // 显示自定义提示框
        showCustomAlert({
          title: '设置已保存',
          message: '您的设置已成功保存并应用！',
          confirmText: '好的'
        });
      });
    }
    
    // 重置设置按钮
    const resetButton = document.getElementById('reset-settings');
    if (resetButton) {
      resetButton.addEventListener('click', function() {
        // 使用自定义确认框
        showCustomAlert({
          title: '确认重置',
          message: '确定要恢复所有默认设置吗？',
          confirmText: '确定',
          cancelText: '取消',
          showCancel: true,
          onConfirm: () => {
            // 清除所有设置
            localStorage.removeItem('appTheme');
            localStorage.removeItem('appBackground');
            localStorage.removeItem('appFontSize');
            localStorage.removeItem('autoRefreshEnabled');
            localStorage.removeItem('refreshInterval');
            
            // 重新加载设置页面
            loadAppSettings();
            
            // 应用默认设置
            applyAppSettings();
          }
        });
      });
    }
  } catch (error) {
    console.error('加载软件设置失败:', error);
    contentContainer.innerHTML = '<div class="error-container"><p>加载软件设置失败，请稍后再试。</p></div>';
  }
}

// 应用软件设置
function applyAppSettings() {
  // 获取当前设置
  const currentTheme = localStorage.getItem('appTheme') || 'light';
  const currentBackground = localStorage.getItem('appBackground') || 'default';
  const currentFontSize = localStorage.getItem('appFontSize') || 'medium';
  const autoRefreshEnabled = localStorage.getItem('autoRefreshEnabled') === 'true';
  const refreshInterval = parseInt(localStorage.getItem('refreshInterval') || '60') * 1000;
  
  // 应用主题 - 先清除所有相关的类
  document.body.classList.remove(
    'theme-light', 'theme-dark', 'theme-panda', 'theme-forest', 'theme-bamboo',
    'bg-default', 'bg-gradient', 'bg-pattern', 'bg-image1', 'bg-image2',
    'font-small', 'font-medium', 'font-large', 'font-xlarge'
  );
  
  // 应用主题和背景
  document.body.classList.add(`theme-${currentTheme}`);
  document.body.classList.add(`bg-${currentBackground}`);
  document.body.classList.add(`font-${currentFontSize}`);
  
  // 直接在文档根元素上设置字体大小CSS变量
  const fontSizeValue = {
    'small': '14px',
    'medium': '16px',
    'large': '18px',
    'xlarge': '20px'
  }[currentFontSize] || '16px';
  
  document.documentElement.style.setProperty('--font-size-base', fontSizeValue);
  
  // 应用自动刷新设置
  if (typeof autoRefresh !== 'undefined') {
    if (autoRefreshEnabled) {
      // 获取当前页面
      const activeNavItem = document.querySelector('.main-nav li.active');
      const currentPage = activeNavItem ? activeNavItem.getAttribute('data-page') : null;
      
      // 根据当前页面选择刷新函数
      if (currentPage === 'news') {
        autoRefresh.startAutoRefresh(loadPandaNews, refreshInterval);
      } else if (currentPage === 'live') {
        autoRefresh.startAutoRefresh(refreshLiveData, refreshInterval);
      }
    } else {
      autoRefresh.stopAutoRefresh();
    }
  }
  
  console.log('应用设置已更新:', {
    主题: currentTheme,
    背景: currentBackground,
    字体大小: currentFontSize,
    自动刷新: autoRefreshEnabled,
    刷新间隔: refreshInterval + 'ms'
  });
}

// 在文档加载完成后应用设置
document.addEventListener('DOMContentLoaded', () => {
  // 在创建应用布局后应用设置
  setTimeout(applyAppSettings, 100);
});

// 创建自定义提示框
function showCustomAlert(options) {
  // 默认选项
  const defaults = {
    title: '提示',
    message: '',
    confirmText: '确定',
    cancelText: '取消',
    showCancel: false,
    onConfirm: () => {},
    onCancel: () => {},
    theme: document.body.classList.contains('theme-dark') ? 'dark' : 'light'
  };
  
  // 合并选项
  const settings = { ...defaults, ...options };
  
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.className = 'custom-alert-overlay';
  document.body.appendChild(overlay);
  
  // 创建提示框
  const alertBox = document.createElement('div');
  alertBox.className = 'custom-alert-box';
  
  // 创建头部
  const header = document.createElement('div');
  header.className = 'custom-alert-header';
  header.innerHTML = `
    <span>${settings.title}</span>
    <button class="close-btn">&times;</button>
  `;
  
  // 创建内容
  const content = document.createElement('div');
  content.className = 'custom-alert-content';
  content.innerHTML = settings.message;
  
  // 创建底部按钮
  const footer = document.createElement('div');
  footer.className = 'custom-alert-footer';
  
  let confirmButton = document.createElement('button');
  confirmButton.className = 'custom-alert-btn primary';
  confirmButton.textContent = settings.confirmText;
  
  let cancelButton;
  if (settings.showCancel) {
    cancelButton = document.createElement('button');
    cancelButton.className = 'custom-alert-btn default';
    cancelButton.textContent = settings.cancelText;
    footer.appendChild(cancelButton);
  }
  
  footer.appendChild(confirmButton);
  
  // 组装提示框
  alertBox.appendChild(header);
  alertBox.appendChild(content);
  alertBox.appendChild(footer);
  overlay.appendChild(alertBox);
  
  // 添加动画类
  setTimeout(() => {
    overlay.classList.add('show');
  }, 10);
  
  // 关闭提示框函数
  const closeAlert = () => {
    overlay.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
  };
  
  // 绑定事件
  header.querySelector('.close-btn').addEventListener('click', () => {
    closeAlert();
    if (settings.onCancel) settings.onCancel();
  });
  
  confirmButton.addEventListener('click', () => {
    closeAlert();
    if (settings.onConfirm) settings.onConfirm();
  });
  
  if (settings.showCancel) {
    cancelButton.addEventListener('click', () => {
      closeAlert();
      if (settings.onCancel) settings.onCancel();
    });
  }
  
  // 点击遮罩层关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeAlert();
      if (settings.onCancel) settings.onCancel();
    }
  });
  
  // ESC键关闭
  const escKeyHandler = (e) => {
    if (e.key === 'Escape') {
      closeAlert();
      if (settings.onCancel) settings.onCancel();
      document.removeEventListener('keydown', escKeyHandler);
    }
  };
  document.addEventListener('keydown', escKeyHandler);
  
  return {
    close: closeAlert
  };
}
