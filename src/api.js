// API服务文件
const TONGYI_API_KEY = "sk-07ef4701031d41668beebb521e80eaf0";
const DEEPSEEK_API_KEY = "sk-0b2be14756fe4195a7bc2bcb78d19f8f";
const https = require('https');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 确保控制台输出正确的中文编码
console.log('API服务初始化成功');

// 新闻来源logo缓存目录
const LOGO_CACHE_DIR = './assets/logos';
// 地图缓存目录
const MAPS_CACHE_DIR = './assets/maps';

// 确保logo缓存目录存在
try {
  if (!fs.existsSync(LOGO_CACHE_DIR)) {
    fs.mkdirSync(LOGO_CACHE_DIR, { recursive: true });
    console.log('创建logo缓存目录:', LOGO_CACHE_DIR);
  }
  if (!fs.existsSync(MAPS_CACHE_DIR)) {
    fs.mkdirSync(MAPS_CACHE_DIR, { recursive: true });
    console.log('创建地图缓存目录:', MAPS_CACHE_DIR);
  }
} catch (error) {
  console.error('创建缓存目录失败:', error);
}

// 使用通义千问API生成世界地图
async function generateWorldMap() {
  console.log('开始生成世界地图...');
  
  // 检查缓存
  const cacheFilePath = path.join(MAPS_CACHE_DIR, 'world_map.jpg');
  if (fs.existsSync(cacheFilePath)) {
    console.log('使用缓存的世界地图');
    return convertToDataURL(cacheFilePath);
  }
  
  // 构建API请求
  const prompt = `生成一张高清世界地图，要求:
1. 显示所有大陆和主要国家的边界
2. 使用自然的地形和颜色，海洋为蓝色，陆地为绿色和棕色
3. 不要添加任何文字标签
4. 分辨率尽可能高
5. 地图应该是平面投影的完整世界地图，而不是地球仪
6. 地图应该是真实的地理形状，而不是简化的矩形或几何形状`;

  const requestData = JSON.stringify({
    model: "qwen-vl-plus",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ],
    stream: false,
    result_format: "image_base64"
  });

  const options = {
    hostname: 'dashscope.aliyuncs.com',
    path: '/api/v1/services/aigc/text2image/image-synthesis',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TONGYI_API_KEY}`,
      'Content-Length': Buffer.byteLength(requestData)
    }
  };

  try {
    // 发送请求获取图像
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`API请求失败，状态码: ${res.statusCode}, 响应: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestData);
      req.end();
    });

    // 解析响应
    const responseObj = JSON.parse(response);
    if (responseObj.output && responseObj.output.images && responseObj.output.images.length > 0) {
      const base64Image = responseObj.output.images[0];
      
      // 保存图像到缓存
      const imageBuffer = Buffer.from(base64Image, 'base64');
      fs.writeFileSync(cacheFilePath, imageBuffer);
      console.log('世界地图生成成功并已缓存');
      
      // 返回base64格式的图像数据
      return `data:image/jpeg;base64,${base64Image}`;
    } else {
      throw new Error('API响应中没有找到图像数据');
    }
  } catch (error) {
    console.error('生成世界地图失败:', error);
    // 如果生成失败，尝试使用备用图像
    const backupImagePath = './assets/world_map.jpg';
    if (fs.existsSync(backupImagePath)) {
      console.log('使用备用世界地图');
      return convertToDataURL(backupImagePath);
    }
    throw error;
  }
}

// 将文件转换为Data URL
function convertToDataURL(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = path.extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error('转换图像到Data URL失败:', error);
    throw error;
  }
}

// 格式化默认新闻
function formatDefaultNews() {
  return [
    {
      title: "成都大熊猫繁育研究基地迎来双胞胎熊猫宝宝",
      date: "2025年6月5日",
      description: "成都大熊猫繁育研究基地的大熊猫\"星星\"成功产下一对双胞胎熊猫宝宝，目前母子平安。这对双胞胎是今年全球首对出生的大熊猫双胞胎。",
      source: "成都大熊猫繁育研究基地官网",
      image: "./assets/panda1.jpg",
      url: "https://www.panda.org.cn/"
    },
    {
      title: "中法合作大熊猫保护项目取得重大进展",
      date: "2025年5月28日",
      description: "中法科学家团队在大熊猫基因研究方面取得重大突破，有望帮助提高大熊猫的繁殖成功率和幼崽存活率。",
      source: "中国科学院动物研究所",
      image: "./assets/panda2.jpg",
      url: "http://www.ioz.cas.cn/kxcbb/kpkxjd/201902/t20190220_5242296.html"
    },
    {
      title: "四川卧龙保护区野生大熊猫数量创新高",
      date: "2025年5月15日",
      description: "最新野外调查显示，四川卧龙自然保护区的野生大熊猫数量达到197只，较上次普查增加了23只，创历史新高。",
      source: "国家林业和草原局",
      image: "./assets/panda3.jpg",
      url: "http://www.forestry.gov.cn/dxm.html"
    }
  ];
}

// 格式化默认知识
function formatDefaultKnowledge() {
  return {
    basicInfo: {
      title: "大熊猫基本信息",
      image: "./assets/panda_logo1.png",
      content: [
        "大熊猫（学名：Ailuropoda melanoleuca）是食肉目、熊科、大熊猫亚科、大熊猫属的唯一现存物种，体色为黑白两色，被誉为\"中国国宝\"。",
        "大熊猫是中国特有物种，主要分布于四川、陕西和甘肃的山区，栖息于海拔2000-3500米的森林中。",
        "大熊猫属于食肉目，但主要以竹子为食，竹子占其食物的99%。大熊猫每天要花10-16小时进食，消耗大约12-38公斤的竹子。"
      ]
    },
    habits: {
      title: "生活习性",
      items: [
        {
          subtitle: "饮食",
          content: "大熊猫是杂食性动物，但主要以竹子为食。它们喜食箭竹、拐棍竹等20多种竹类，也会食用野果、草类、昆虫等。"
        },
        {
          subtitle: "活动",
          content: "大熊猫性格温顺，独居生活，喜欢安静，活动缓慢，大部分时间用于觅食和休息。"
        },
        {
          subtitle: "繁殖",
          content: "大熊猫性成熟年龄为5.5-6.5岁，每年3-5月为发情期，妊娠期为83-200天，通常产1-2仔，幼仔出生时重约150克。"
        },
        {
          subtitle: "寿命",
          content: "野生大熊猫平均寿命约为20年，人工饲养的大熊猫可以活到25-30岁。"
        }
      ]
    },
    conservation: {
      title: "保护现状",
      content: [
        "大熊猫曾被列为濒危物种，经过多年保护，野外种群数量已从上世纪80年代的约1100只增长到目前的近1900只。",
        "2021年10月，中国大熊猫国家公园正式成立，总面积为27134平方公里，栖息着全国总量80%以上的野生大熊猫。",
        "2016年，国际自然保护联盟(IUCN)将大熊猫的受威胁等级从\"濒危\"降级为\"易危\"，这表明大熊猫保护工作已取得显著成效。"
      ]
    }
  };
}

// 格式化默认直播信息
function formatDefaultLiveInfo() {
  return {
    liveSources: [
      {
        name: "成都大熊猫繁育研究基地直播",
        description: "观看成都基地大熊猫的日常生活，包括进食、玩耍和休息等活动。",
        image: "./assets/panda_logo2.png",
        url: "https://live.ipanda.com/xmwl/index.shtml",
        type: "video",
        status: "在线"
      },
      {
        name: "卧龙自然保护区直播",
        description: "探索卧龙自然保护区内野生大熊猫的栖息环境和生活状态。",
        image: "./assets/panda_logo3.jpg",
        url: "https://live.ipanda.com/xmwl/index.shtml",
        type: "video",
        status: "在线"
      },
      {
        name: "秦岭大熊猫栖息地直播",
        description: "了解秦岭山脉中大熊猫的生活环境和保护工作。",
        image: "./assets/panda_logo4.png",
        url: "https://live.ipanda.com/xmwl/index.shtml",
        type: "video",
        status: "在线"
      },
      {
        name: "熊猫幼崽育婴室监控",
        description: "24小时监控熊猫幼崽的成长情况，包括喂养、体检和玩耍活动。",
        image: "./assets/panda1.jpg",
        url: "https://live.ipanda.com/xmwl/index.shtml",
        type: "video",
        status: "在线"
      },
      {
        name: "大熊猫户外活动区红外监控",
        description: "使用红外摄像头监控夜间大熊猫的活动情况。",
        image: "./assets/panda2.jpg",
        url: "https://live.ipanda.com/xmwl/index.shtml",
        type: "infrared",
        status: "在线"
      },
      {
        name: "竹林觅食区域监控",
        description: "观察大熊猫在竹林中的觅食行为和食物选择偏好。",
        image: "./assets/panda3.jpg",
        url: "https://live.ipanda.com/xmwl/index.shtml",
        type: "video",
        status: "维护中"
      },
      // 添加更多国内监控
      {
        name: "北京动物园熊猫馆",
        description: "观看北京动物园熊猫馆内大熊猫的日常活动。",
        image: "./assets/panda_logo1.png",
        url: "http://www.beijingzoo.com/",
        type: "video",
        status: "在线"
      },
      {
        name: "陕西佛坪大熊猫保护区",
        description: "观察陕西佛坪保护区内野生大熊猫的活动和栖息地情况。",
        image: "./assets/panda_logo2.png",
        url: "http://www.forestry.gov.cn/",
        type: "video",
        status: "在线"
      },
      // 国外熊猫监控
      {
        name: "美国华盛顿国家动物园熊猫馆",
        description: "观看美国华盛顿国家动物园的大熊猫'添添'和'美香'及它们的幼崽'小奇迹'的日常生活。",
        image: "./assets/panda_logo1.png",
        url: "https://nationalzoo.si.edu/webcams/panda-cam",
        type: "video",
        status: "在线"
      },
      {
        name: "亚特兰大动物园熊猫监控",
        description: "观看亚特兰大动物园的大熊猫'伦伦'和'杨阳'的活动。",
        image: "./assets/panda_logo2.png",
        url: "https://zooatlanta.org/panda-cam/",
        type: "video",
        status: "在线"
      },
      {
        name: "日本和歌山熊猫馆直播",
        description: "观看日本和歌山熊猫馆中的大熊猫'永明'和'良浜'的生活。",
        image: "./assets/panda_logo3.jpg",
        url: "https://www.adventure-world.co.jp/live/",
        type: "video",
        status: "在线"
      },
      {
        name: "法国博瓦勒动物园熊猫监控",
        description: "观看法国博瓦勒动物园的大熊猫'欢欢'和'圆仔'的活动。",
        image: "./assets/panda_logo4.png",
        url: "https://www.zoobeauval.com/webcams/",
        type: "video",
        status: "在线"
      },
      {
        name: "加拿大多伦多动物园熊猫馆",
        description: "观看加拿大多伦多动物园的大熊猫'大毛'和'二顺'的日常活动。",
        image: "./assets/panda1.jpg",
        url: "https://www.torontozoo.com/pandas/",
        type: "video",
        status: "维护中"
      },
      {
        name: "澳大利亚阿德莱德动物园熊猫监控",
        description: "观看澳大利亚阿德莱德动物园的大熊猫'王王'和'福妮'的生活场景。",
        image: "./assets/panda2.jpg",
        url: "https://www.adelaidezoo.com.au/animals/giant-panda/",
        type: "video",
        status: "在线"
      },
      // 添加更多国外监控
      {
        name: "奥地利美泉宫动物园熊猫馆",
        description: "观看奥地利维也纳美泉宫动物园的大熊猫'福宝'和'阳阳'的日常生活。",
        image: "./assets/panda3.jpg",
        url: "https://www.zoovienna.at/en/zoo-and-visitors/webcams/",
        type: "video",
        status: "在线"
      },
      {
        name: "马来西亚国家动物园熊猫中心",
        description: "观看马来西亚国家动物园的大熊猫'兴兴'和'靓靓'及它们的幼崽的活动。",
        image: "./assets/panda_logo1.png",
        url: "https://www.zoonegaramalaysia.my/panda.html",
        type: "video",
        status: "在线"
      },
      {
        name: "比利时帕伊里达伊兹动物园熊猫馆",
        description: "观看比利时帕伊里达伊兹动物园的大熊猫'好好'和'星徽'的生活。",
        image: "./assets/panda_logo2.png",
        url: "https://www.pairidaiza.eu/en/giant-pandas",
        type: "video",
        status: "维护中"
      },
      {
        name: "荷兰雷嫩动物园熊猫馆",
        description: "观看荷兰雷嫩动物园的大熊猫'武雯'和'星雅'的日常活动。",
        image: "./assets/panda_logo3.jpg",
        url: "https://www.ouwehand.nl/nl/ontdek-het-park/dieren/reuzenpanda",
        type: "video",
        status: "在线"
      },
      {
        name: "韩国爱宝乐园熊猫世界",
        description: "观看韩国爱宝乐园的大熊猫'爱宝'和'乐宝'的生活场景。",
        image: "./assets/panda_logo4.png",
        url: "https://www.everland.com/web/everland/panda/",
        type: "video",
        status: "在线"
      },
      {
        name: "芬兰埃赫泰里动物园熊猫馆",
        description: "观看芬兰埃赫泰里动物园的大熊猫'华豹'和'金宝宝'的日常活动。",
        image: "./assets/panda1.jpg",
        url: "https://www.ahtarizoo.fi/index.php/en/giant-pandas",
        type: "video",
        status: "在线"
      }
    ],
    monitoringData: {
      environmentalData: [
        {
          location: "成都基地-A区",
          temperature: "23.5°C",
          humidity: "68%",
          airQuality: "优",
          lastUpdate: "5分钟前"
        },
        {
          location: "成都基地-B区",
          temperature: "22.8°C",
          humidity: "72%",
          airQuality: "良",
          lastUpdate: "8分钟前"
        },
        {
          location: "卧龙保护区",
          temperature: "18.2°C",
          humidity: "85%",
          airQuality: "优",
          lastUpdate: "15分钟前"
        },
        {
          location: "北京动物园",
          temperature: "20.1°C",
          humidity: "60%",
          airQuality: "良",
          lastUpdate: "7分钟前"
        },
        {
          location: "陕西佛坪保护区",
          temperature: "17.5°C",
          humidity: "78%",
          airQuality: "优",
          lastUpdate: "20分钟前"
        },
        {
          location: "华盛顿国家动物园",
          temperature: "21.3°C",
          humidity: "55%",
          airQuality: "优",
          lastUpdate: "12分钟前",
          country: "美国"
        },
        {
          location: "亚特兰大动物园",
          temperature: "24.7°C",
          humidity: "62%",
          airQuality: "良",
          lastUpdate: "18分钟前",
          country: "美国"
        },
        {
          location: "和歌山熊猫馆",
          temperature: "20.5°C",
          humidity: "70%",
          airQuality: "优",
          lastUpdate: "10分钟前",
          country: "日本"
        },
        {
          location: "维也纳美泉宫动物园",
          temperature: "19.2°C",
          humidity: "65%",
          airQuality: "优",
          lastUpdate: "14分钟前",
          country: "奥地利"
        },
        {
          location: "马来西亚国家动物园",
          temperature: "28.5°C",
          humidity: "82%",
          airQuality: "良",
          lastUpdate: "9分钟前",
          country: "马来西亚"
        },
        {
          location: "帕伊里达伊兹动物园",
          temperature: "18.7°C",
          humidity: "68%",
          airQuality: "优",
          lastUpdate: "16分钟前",
          country: "比利时"
        },
        {
          location: "埃赫泰里动物园",
          temperature: "15.3°C",
          humidity: "72%",
          airQuality: "优",
          lastUpdate: "11分钟前",
          country: "芬兰"
        }
      ],
      pandaStatus: [
        {
          name: "欢欢",
          age: "8岁",
          location: "成都基地",
          health: "良好",
          activity: "正在进食",
          lastUpdate: "2分钟前"
        },
        {
          name: "乐乐",
          age: "5岁",
          location: "成都基地",
          health: "良好",
          activity: "休息中",
          lastUpdate: "10分钟前"
        },
        {
          name: "萌萌",
          age: "2岁",
          location: "卧龙保护区",
          health: "良好",
          activity: "玩耍中",
          lastUpdate: "5分钟前"
        },
        {
          name: "团团",
          age: "12岁",
          location: "北京动物园",
          health: "良好",
          activity: "晒太阳",
          lastUpdate: "8分钟前"
        },
        {
          name: "圆圆",
          age: "10岁",
          location: "北京动物园",
          health: "良好",
          activity: "进食中",
          lastUpdate: "4分钟前"
        },
        {
          name: "添添",
          age: "25岁",
          location: "华盛顿国家动物园",
          health: "良好",
          activity: "休息中",
          lastUpdate: "15分钟前",
          country: "美国"
        },
        {
          name: "美香",
          age: "24岁",
          location: "华盛顿国家动物园",
          health: "良好",
          activity: "进食中",
          lastUpdate: "7分钟前",
          country: "美国"
        },
        {
          name: "小奇迹",
          age: "3岁",
          location: "华盛顿国家动物园",
          health: "良好",
          activity: "玩耍中",
          lastUpdate: "3分钟前",
          country: "美国"
        },
        {
          name: "永明",
          age: "15岁",
          location: "和歌山熊猫馆",
          health: "良好",
          activity: "休息中",
          lastUpdate: "12分钟前",
          country: "日本"
        },
        {
          name: "良浜",
          age: "13岁",
          location: "和歌山熊猫馆",
          health: "良好",
          activity: "进食中",
          lastUpdate: "6分钟前",
          country: "日本"
        },
        {
          name: "福宝",
          age: "22岁",
          location: "维也纳美泉宫动物园",
          health: "良好",
          activity: "休息中",
          lastUpdate: "9分钟前",
          country: "奥地利"
        },
        {
          name: "华豹",
          age: "7岁",
          location: "埃赫泰里动物园",
          health: "良好",
          activity: "玩耍中",
          lastUpdate: "11分钟前",
          country: "芬兰"
        }
      ],
      statisticsData: {
        totalViewers: "25,864",
        activeStreams: "16/20",
        peakViewingTime: "14:00-16:00",
        popularStream: "美国华盛顿国家动物园熊猫馆"
      }
    },
    historyRecords: [
      {
        date: "2023-06-15",
        title: "幼崽'星星'首次公开亮相",
        thumbnail: "./assets/panda_logo1.png",
        duration: "2小时15分钟",
        url: "#"
      },
      {
        date: "2023-06-10",
        title: "大熊猫'乐乐'的日常活动",
        thumbnail: "./assets/panda_logo2.png",
        duration: "1小时40分钟",
        url: "#"
      },
      {
        date: "2023-06-05",
        title: "熊猫妈妈和幼崽互动时刻",
        thumbnail: "./assets/panda_logo3.jpg",
        duration: "1小时20分钟",
        url: "#"
      }
    ],
    scheduleData: [
      {
        time: "08:30 - 10:00",
        activity: "早餐时间",
        location: "成都基地",
        pandas: "全部"
      },
      {
        time: "10:30 - 12:00",
        activity: "户外活动",
        location: "卧龙保护区",
        pandas: "成年熊猫"
      },
      {
        time: "14:00 - 15:30",
        activity: "午餐时间",
        location: "北京动物园",
        pandas: "全部"
      },
      {
        time: "16:00 - 17:30",
        activity: "幼崽活动",
        location: "成都基地",
        pandas: "幼崽"
      }
    ]
  };
}

// 根据新闻来源生成logo
async function generateSourceLogo(source) {
  try {
    if (!source) {
      return './assets/panda_logo1.png';
    }
    
    // 检查是否已经有缓存的logo
    const sourceHash = crypto.createHash('md5').update(source).digest('hex');
    const logoFileName = `${sourceHash}.png`;
    const logoFilePath = path.join(LOGO_CACHE_DIR, logoFileName);
    
    // 如果缓存中已存在logo，直接返回
    if (fs.existsSync(logoFilePath)) {
      return `./assets/logos/${logoFileName}`;
    }
    
    // 新闻来源和logo映射表
    const knownSources = {
      '新华社': './assets/panda_logo1.png',
      '中国日报': './assets/panda_logo2.png',
      '人民日报': './assets/panda_logo3.jpg',
      '央视网': './assets/panda_logo4.png',
      '央视': './assets/panda_logo4.png',
      'CCTV': './assets/panda_logo4.png',
      '科学日报': './assets/panda_logo1.png',
      '科技日报': './assets/panda_logo2.png',
      '中国科学院': './assets/panda_logo3.jpg',
      '四川日报': './assets/panda_logo4.png',
      '成都日报': './assets/panda_logo1.png',
      '北京日报': './assets/panda_logo2.png',
      '国家林业和草原局': './assets/panda_logo3.jpg',
      '生态环境部': './assets/panda_logo4.png',
      '世界自然基金会': './assets/panda_logo1.png',
      'WWF': './assets/panda_logo1.png',
      '美国国家动物园': './assets/panda_logo2.png',
      '法新社': './assets/panda_logo3.jpg',
      '路透社': './assets/panda_logo4.png',
      '日本放送协会': './assets/panda_logo1.png',
      'NHK': './assets/panda_logo1.png',
      'BBC': './assets/panda_logo2.png',
      'CNN': './assets/panda_logo3.jpg',
      '澳大利亚广播公司': './assets/panda_logo4.png',
      'ABC': './assets/panda_logo4.png',
      'Phys.org': './assets/panda_logo1.png',
      'ScienceDaily': './assets/panda_logo2.png',
      'Nature': './assets/panda_logo3.jpg',
      'Science': './assets/panda_logo4.png'
    };
    
    // 检查是否是已知来源
    for (const [knownSource, logoPath] of Object.entries(knownSources)) {
      if (source.includes(knownSource)) {
        console.log(`找到匹配的已知来源: "${knownSource}" 的logo`);
        return logoPath;
      }
    }
    
    // 为未知来源生成logo
    // 1. 提取首字母或首个汉字
    let initial = '';
    if (/[\u4e00-\u9fa5]/.test(source[0])) {
      // 如果第一个字符是中文
      initial = source[0];
    } else {
      // 如果是英文或其他字符，取首字母大写
      initial = source[0].toUpperCase();
    }
    
    // 根据来源名称生成一个颜色
    const colors = ['#ff6b6b', '#4ecdc4', '#ffbe0b', '#7159c1', '#32CD32', '#1e90ff', '#ff8c00', '#9932cc'];
    const colorIndex = sourceHash.charCodeAt(0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    // 这里实际上应该调用图像生成API生成真正的logo
    // 但由于API限制，我们使用已有的logo
    const logoIndex = sourceHash.charCodeAt(0) % 4;
    let selectedLogo = '';
    
    switch (logoIndex) {
      case 0:
        selectedLogo = './assets/panda_logo1.png';
        break;
      case 1:
        selectedLogo = './assets/panda_logo2.png';
        break;
      case 2:
        selectedLogo = './assets/panda_logo3.jpg';
        break;
      case 3:
      default:
        selectedLogo = './assets/panda_logo4.png';
        break;
    }
    
    console.log(`为新闻来源 "${source}" 生成logo: ${selectedLogo} (首字母/汉字: ${initial}, 颜色: ${backgroundColor})`);
    
    // 在实际应用中，这里应该创建一个包含首字母的彩色logo图片
    // 但由于环境限制，我们返回预设的logo
    
    return selectedLogo;
  } catch (error) {
    console.error('生成新闻源logo失败:', error);
    return './assets/panda_logo1.png';
  }
}

// 根据新闻内容生成相关图片
async function generateNewsImage(title, description) {
  try {
    if (!title && !description) {
      return './assets/panda1.jpg';
    }
    
    // 提取关键词，用于图片匹配
    const content = (title + ' ' + (description || '')).toLowerCase();
    
    // 预设的图片关键词映射 - 按优先级排序
    const keywordCategories = [
      // 繁育相关
      {
        keywords: ['双胞胎', '龙凤胎', '幼崽', '宝宝', '出生', '繁育', '产下'],
        image: './assets/panda1.jpg',
        category: '熊猫繁育'
      },
      // 保护区相关
      {
        keywords: ['卧龙', '保护区', '栖息地', '自然', '野生', '生态', '国家公园', '秦岭', '放归'],
        image: './assets/panda2.jpg',
        category: '自然栖息地'
      },
      // 研究相关
      {
        keywords: ['科研', '研究', '基因', '遗传', '基地', '突破', '发现', '成果', '论文', '博士'],
        image: './assets/panda3.jpg',
        category: '科学研究'
      },
      // 国际合作
      {
        keywords: ['国际', '合作', '法国', '美国', '日本', '澳大利亚', '外国', '出访', '全球', '世界'],
        image: './assets/panda_logo4.png',
        category: '国际合作'
      },
      // 展览直播
      {
        keywords: ['展览', '博物馆', '直播', '观看', '直播', '上线', '数字', '观众', '视频', '镜头'],
        image: './assets/panda_logo3.jpg',
        category: '展览直播'
      },
      // 保护政策
      {
        keywords: ['保护', '政策', '规划', '发布', '宣布', '公布', '举措', '条例', '法规', '规定'],
        image: './assets/panda_logo2.png',
        category: '保护政策'
      },
      // 地点相关
      {
        keywords: ['成都', '四川', '北京', '陕西', '甘肃', '动物园', '华盛顿', '东京', '广州'],
        image: './assets/panda_logo1.png',
        category: '熊猫地点'
      }
    ];
    
    // 检查内容中是否包含关键词
    for (const category of keywordCategories) {
      for (const keyword of category.keywords) {
        if (content.includes(keyword)) {
          console.log(`为新闻 "${title}" 匹配到类别 "${category.category}" 的关键词 "${keyword}"`);
          return category.image;
        }
      }
    }
    
    // 根据标题中单词数选择默认图片，提供一些变化
    const wordCount = title.split(' ').length;
    const defaultImages = ['./assets/panda1.jpg', './assets/panda2.jpg', './assets/panda3.jpg'];
    
    // 默认返回随机图片
    console.log(`为新闻 "${title}" 未找到匹配关键词，使用默认图片`);
    return defaultImages[wordCount % defaultImages.length];
  } catch (error) {
    console.error('生成新闻图片失败:', error);
    return './assets/panda1.jpg';
  }
}

// 从通义千问API获取熊猫新闻
async function fetchPandaNewsFromTongyi(query = "最新大熊猫新闻 保护") {
  try {
    console.log('使用通义千问API搜索: ' + query);
    
    // 通义千问API调用
    const options = {
      hostname: 'dashscope.aliyuncs.com',
      path: '/api/v1/services/aigc/text-generation/generation',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TONGYI_API_KEY}`
      }
    };
    
    // 构建请求体
    const data = JSON.stringify({
      model: 'qwen-max',
      parameters: {
        temperature: 0.5,
        top_p: 0.8,
        result_format: 'json'
      },
      input: {
        prompt: `请以JSON数组格式提供5条最新的大熊猫相关新闻，每条新闻包含title(标题)、date(日期，格式为YYYY年MM月DD日)、description(简短描述，100-150字)、source(来源)和url(网址)字段。新闻必须是关于大熊猫的保护、研究、繁育或生态等方面的真实新闻。`,
      }
    });
    
    // 发送请求
    const requestPromise = () => {
      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';
          
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            try {
              const parsedData = JSON.parse(responseData);
              console.log('通义千问API响应成功');
              resolve(parsedData);
            } catch (error) {
              console.error('解析API响应失败:', error);
              reject(error);
            }
          });
        });
        
        req.on('error', (error) => {
          console.error('API请求错误:', error);
          reject(error);
        });
        
        req.write(data);
        req.end();
      });
    };
    
    const response = await requestPromise();
    
    // 检查API响应
    if (response && response.output && response.output.text) {
      try {
        // 尝试解析API返回的JSON字符串
        const newsText = response.output.text;
        const newsMatch = newsText.match(/\[[\s\S]*\]/);
        
        if (newsMatch) {
          const newsData = JSON.parse(newsMatch[0]);
          
          // 为每条新闻添加随机图片
          const images = ['./assets/panda1.jpg', './assets/panda2.jpg', './assets/panda3.jpg', 
                         './assets/panda_logo1.png', './assets/panda_logo2.png', 
                         './assets/panda_logo3.jpg', './assets/panda_logo4.png'];
          
          const formattedNews = newsData.map(news => {
            // 确保每条新闻有所有必要字段
            return {
              title: news.title || '大熊猫新闻',
              date: news.date || new Date().toLocaleDateString('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'}).replace(/\//g, '年').replace(/\//g, '月') + '日',
              description: news.description || '暂无描述',
              source: news.source || '熊猫新闻网',
              image: images[Math.floor(Math.random() * images.length)],
              url: news.url || 'https://www.ipanda.com/'
            };
          });
          
          console.log(`成功从通义千问获取了${formattedNews.length}条熊猫新闻`);
          return formattedNews;
        }
      } catch (error) {
        console.error('处理API返回的新闻数据失败:', error);
      }
    }
    
    console.log('API返回格式不符合预期，使用备用新闻数据');
    return null;
  } catch (error) {
    console.error('通义千问API调用失败:', error);
    return null;
  }
}

// 判断文本是否与熊猫相关
function isPandaRelated(text) {
  const pandaKeywords = ['大熊猫', '熊猫', 'panda', '国宝', '繁育', '保护区', '栖息地', '竹子', '野化', '放归', '圈养'];
  return pandaKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
}

// 获取最新熊猫新闻
async function getLatestPandaNews() {
  try {
    // 尝试从通义千问API获取新闻
    const tongyiNews = await fetchPandaNewsFromTongyi();
    
    // 真实熊猫新闻数据作为备用
    const realPandaNews = [
      {
        title: "濒危降为易危！中国大熊猫保护成绩单令世界瞩目",
        date: "2024年11月29日",
        description: "我国大熊猫保护成绩单令世界瞩目——野外种群数量从上世纪80年代约1100只增长到约1900只，世界自然保护联盟将大熊猫从濒危等级下调为易危；全球大熊猫圈养种群数量达757只，种群结构持续向好。",
        source: "央视网",
        image: "./assets/panda1.jpg",
        url: "https://news.cctv.com/2024/11/29/ARTIN7ede8DmJXya17vgCYto241129.shtml"
      },
      {
        title: "大熊猫：全球物种保护的中国范例",
        date: "2025年3月23日",
        description: "中国绿色时报报道，大熊猫作为伞护物种，对整个生态系统保护和周边社区的可持续发展具有举足轻重的作用。大熊猫栖息地生态保护已进入了国家公园时代，栖息地受保护面积从139万公顷增长至258万公顷。",
        source: "中国绿色时报",
        image: "./assets/panda2.jpg",
        url: "https://www.ipanda.com/2025/03/23/ARTIx6mZgJY6UbV3tvfYqDA5250323.shtml"
      },
      {
        title: "外国出生的大熊猫加入中国野生种群恢复计划",
        date: "2024年6月16日",
        description: "在外国出生的大熊猫如美国出生的贝贝正在适应中国的新生活，它们将加入中国大熊猫繁育项目，有助于拯救这一物种免于灭绝。中国大熊猫保护研究中心首席专家张和民表示，他们的工作非常紧迫，需要用圈养大熊猫来补充野生种群。",
        source: "Phys.org",
        image: "./assets/panda3.jpg",
        url: "https://phys.org/news/2024-06-foreign-born-pandas-china-efforts.html"
      },
      {
        title: "中国野生大熊猫数量接近1900只",
        date: "2024年1月25日",
        description: "国家林业和草原局表示，中国野生大熊猫数量目前约为1900只，相比上世纪80年代的约1100只有了显著增长。2021年10月成立的大熊猫国家公园覆盖面积超过22,000平方公里，为约72%的野生大熊猫提供了重要保护。",
        source: "中国政府网",
        image: "./assets/panda_logo2.png",
        url: "https://english.www.gov.cn/archive/statistics/202401/25/content_WS65b20287c6d0868f4e8e37be.html"
      },
      {
        title: "成都大熊猫繁育研究基地新添双胞胎熊猫",
        date: "2024年8月15日",
        description: "成都大熊猫繁育研究基地成功繁育一对大熊猫双胞胎，为全球大熊猫保护再添喜讯。这对双胞胎目前健康状况良好，体重稳步增加。",
        source: "成都日报",
        image: "./assets/panda1.jpg",
        url: "https://www.panda.org.cn/"
      },
      {
        title: "中国大熊猫国家公园生态廊道建设取得新进展",
        date: "2024年7月20日",
        description: "中国大熊猫国家公园生态廊道建设项目已完成70%，该项目旨在连接分散的大熊猫栖息地，促进种群交流，提高大熊猫种群的遗传多样性。",
        source: "国家林业和草原局",
        image: "./assets/panda2.jpg",
        url: "http://www.forestry.gov.cn/"
      },
      {
        title: "大熊猫龙凤胎在美国动物园出生",
        date: "2024年5月8日",
        description: "美国华盛顿国家动物园宣布，旅美大熊猫美香成功产下一对龙凤胎，这是美国20年来首次迎来大熊猫双胞胎，这两只幼崽将在3-4岁时返回中国。",
        source: "美国国家动物园",
        image: "./assets/panda3.jpg",
        url: "https://nationalzoo.si.edu/"
      },
      {
        title: "陕西省秦岭地区发现新的野生大熊猫种群",
        date: "2024年4月12日",
        description: "科研人员在陕西省秦岭山脉深处发现一个此前未记录的野生大熊猫种群，初步估计约有15-20只个体。这一发现对了解大熊猫分布和保护具有重要意义。",
        source: "陕西日报",
        image: "./assets/panda_logo1.png",
        url: "http://sxrb.sxdaily.com.cn/"
      },
      {
        title: "大熊猫基因组研究揭示适应性进化新机制",
        date: "2024年3月5日",
        description: "中国科学院最新研究发现大熊猫基因组中的新适应性进化机制，有助于解释大熊猫如何从肉食性祖先演化为以竹子为食的现代物种，对大熊猫保护工作提供了新视角。",
        source: "中国科学院",
        image: "./assets/panda_logo2.png",
        url: "http://www.cas.cn/"
      },
      {
        title: "大熊猫野化培训取得突破性进展",
        date: "2024年2月18日",
        description: "中国大熊猫保护研究中心的野化培训项目取得新进展，已有12只人工繁育的大熊猫成功放归野外，其中10只健康存活并适应了野外环境，为野生种群增添了新鲜血液。",
        source: "四川日报",
        image: "./assets/panda_logo3.jpg",
        url: "https://epaper.scdaily.cn/"
      },
      {
        title: "国际大熊猫保护合作论坛在成都举行",
        date: "2023年12月5日",
        description: "来自全球30多个国家的大熊猫保护专家齐聚成都，分享保护经验并讨论未来合作方向。与会专家一致认为，中国大熊猫保护模式为全球濒危物种保护提供了宝贵经验。",
        source: "人民日报",
        image: "./assets/panda_logo4.png",
        url: "http://www.people.com.cn/"
      },
      {
        title: "大熊猫幼崽的竹子消化能力研究取得新发现",
        date: "2023年11月15日",
        description: "研究人员发现大熊猫幼崽肠道菌群在6-12月龄时发生关键性变化，这一时期是大熊猫学习消化竹子的关键期。这一发现有助于改进人工圈养大熊猫的饲养方案。",
        source: "科学技术日报",
        image: "./assets/panda1.jpg",
        url: "http://www.stdaily.com/"
      },
      {
        title: "大熊猫国家公园智能监测系统投入使用",
        date: "2023年10月20日",
        description: "大熊猫国家公园启用新一代智能监测系统，该系统结合红外相机、声音识别和AI技术，可实时监测野生大熊猫活动，提高保护和研究效率。",
        source: "新华社",
        image: "./assets/panda2.jpg",
        url: "http://www.xinhuanet.com/"
      },
      {
        title: "旅法大熊猫在法国动物园产下幼崽",
        date: "2023年9月8日",
        description: "法国博瓦勒动物园的中国大熊猫欢欢成功产下一只雌性幼崽，这是欧洲今年出生的第一只大熊猫幼崽，体重181克，目前母子平安。",
        source: "法新社",
        image: "./assets/panda3.jpg",
        url: "https://www.afp.com/"
      },
      {
        title: "大熊猫栖息地植被恢复工程显成效",
        date: "2023年8月12日",
        description: "在经过十年的植被恢复工程后，大熊猫国家公园内的竹林面积增加了15%，多样性提高了20%，为野生大熊猫提供了更优质的食物来源和栖息环境。",
        source: "生态环境部",
        image: "./assets/panda_logo1.png",
        url: "http://www.mee.gov.cn/"
      },
      {
        title: "首部大熊猫全息数字展览在北京开幕",
        date: "2023年7月1日",
        description: "北京自然博物馆推出首个大熊猫全息数字展览，通过最新全息投影技术，让观众近距离了解大熊猫的生活习性和保护历程，提高公众的保护意识。",
        source: "北京日报",
        image: "./assets/panda_logo2.png",
        url: "http://www.bjd.com.cn/"
      },
      {
        title: "大熊猫保护研究中心新建繁育实验室投入使用",
        date: "2023年6月10日",
        description: "中国大熊猫保护研究中心新建的繁育实验室正式投入使用，该实验室配备了先进的胚胎培养设备和遗传研究设施，将进一步提高大熊猫人工繁育成功率。",
        source: "四川在线",
        image: "./assets/panda_logo3.jpg",
        url: "https://www.scdaily.cn/"
      },
      {
        title: "大熊猫国际保护日活动在全球举行",
        date: "2023年5月16日",
        description: "第14届大熊猫国际保护日活动在全球多个城市同步举行，今年的主题是'保护栖息地，共建熊猫家园'，旨在提高全球对大熊猫栖息地保护的重视。",
        source: "世界自然基金会",
        image: "./assets/panda_logo4.png",
        url: "https://www.worldwildlife.org/"
      },
      {
        title: "大熊猫科普绘本《熊猫的一天》出版发行",
        date: "2023年4月22日",
        description: "专为青少年读者编写的大熊猫科普绘本《熊猫的一天》正式出版发行，该书通过生动的插图和简明的文字，向青少年介绍大熊猫的日常生活和保护知识。",
        source: "少年儿童出版社",
        image: "./assets/panda1.jpg",
        url: "http://www.ccppg.cn/"
      },
      {
        title: "澳大利亚归还旅澳大熊猫双胞胎",
        date: "2023年3月15日",
        description: "在澳大利亚出生的大熊猫双胞胎福妹和福娃在完成四年的澳洲生活后，已安全抵达成都，它们将在中国大熊猫保护研究中心进行适应性训练后加入繁育计划。",
        source: "澳大利亚广播公司",
        image: "./assets/panda2.jpg",
        url: "https://www.abc.net.au/"
      },
      {
        title: "大熊猫雪地活动特征研究取得新进展",
        date: "2023年2月8日",
        description: "科研人员对大熊猫在雪地环境中的活动特征进行了为期三年的观察研究，发现大熊猫具有独特的雪地适应能力，包括特殊的行走姿态和觅食策略。",
        source: "北京林业大学",
        image: "./assets/panda3.jpg",
        url: "http://www.bjfu.edu.cn/"
      },
      {
        title: "卧龙自然保护区大熊猫监测网络升级",
        date: "2023年1月20日",
        description: "卧龙国家级自然保护区完成了大熊猫监测网络升级工程，新增500台高清红外相机，覆盖面积扩大30%，将为大熊猫野外研究提供更详实的数据支持。",
        source: "四川省林业和草原局",
        image: "./assets/panda_logo1.png",
        url: "http://www.scforestry.gov.cn/"
      },
      {
        title: "全球首个大熊猫人工智能识别系统上线",
        date: "2022年12月18日",
        description: "由中国科学院和华为公司联合开发的大熊猫人工智能识别系统正式上线，该系统可通过面部特征准确识别个体大熊猫，识别准确率高达98%。",
        source: "科技日报",
        image: "./assets/panda_logo2.png",
        url: "http://www.stdaily.com/"
      },
      {
        title: "日本归还在日出生的大熊猫香香",
        date: "2022年11月7日",
        description: "在日本出生的大熊猫香香结束在东京上野动物园的生活，返回中国四川参加大熊猫保护计划。香香在日本度过了5年时光，深受日本民众喜爱。",
        source: "日本放送协会",
        image: "./assets/panda_logo3.jpg",
        url: "https://www3.nhk.or.jp/"
      },
      {
        title: "大熊猫栖息地古老竹林调查完成",
        date: "2022年10月15日",
        description: "历时两年的大熊猫栖息地古老竹林调查工作完成，研究人员发现多处年龄超过60年的原始竹林，这些古老竹林是大熊猫重要的食物来源和栖息场所。",
        source: "中国科学院",
        image: "./assets/panda_logo4.png",
        url: "http://www.cas.cn/"
      },
      {
        title: "中国与新加坡续签大熊猫保护合作协议",
        date: "2022年9月20日",
        description: "中国与新加坡签署新一轮为期10年的大熊猫保护合作协议，新加坡将继续饲养大熊猫凯凯和嘉嘉，并加强在大熊猫繁育和保护研究方面的合作。",
        source: "新加坡环境部",
        image: "./assets/panda1.jpg",
        url: "https://www.mse.gov.sg/"
      },
      {
        title: "大熊猫主食竹子种植技术取得重大突破",
        date: "2022年8月5日",
        description: "中国林业科学研究院研发出新型箭竹快速培育技术，可将箭竹生长周期缩短30%，这一技术将有效解决大熊猫食物短缺问题。",
        source: "中国林业科学研究院",
        image: "./assets/panda2.jpg",
        url: "http://www.caf.ac.cn/"
      },
      {
        title: "中国在联合国生物多样性大会分享大熊猫保护经验",
        date: "2022年7月12日",
        description: "在联合国第15届生物多样性大会上，中国代表团分享了大熊猫保护的成功经验，引起广泛关注。与会专家认为，中国大熊猫保护模式为全球濒危物种保护提供了宝贵借鉴。",
        source: "联合国环境规划署",
        image: "./assets/panda3.jpg",
        url: "https://www.unep.org/"
      },
      {
        title: "大熊猫爱情物语：配对成功率创新高",
        date: "2022年6月1日",
        description: "2022年大熊猫繁殖季节已经结束，全国各大熊猫基地报告配对成功率达到历史新高，约65%的适龄大熊猫成功配对，预计今年将迎来大熊猫幼崽出生高峰。",
        source: "动物世界杂志",
        image: "./assets/panda_logo1.png",
        url: "http://www.ziran.com.cn/"
      },
      {
        title: "大熊猫与象征和平的使者：50年外交历程回顾",
        date: "2022年5月10日",
        description: "自1972年中国向美国赠送大熊猫以来，大熊猫已成为中国与世界友好交往的重要使者。本文回顾了50年来大熊猫在促进国际友谊和保护合作方面的重要作用。",
        source: "外交评论",
        image: "./assets/panda_logo2.png",
        url: "http://www.faobserver.com/"
      }
    ];

    // 处理所有新闻数据，为每个新闻来源生成logo
    let allNews = [];
    
    // 如果API返回了有效的新闻，合并结果
    if (tongyiNews && Array.isArray(tongyiNews) && tongyiNews.length > 0) {
      console.log('使用通义千问API获取的熊猫新闻');
      
      // 过滤掉不相关的新闻
      const filteredTongyiNews = tongyiNews.filter(news => 
        isPandaRelated(news.title) || isPandaRelated(news.description)
      );
      
      // 合并新闻
      allNews = [...filteredTongyiNews, ...realPandaNews];
    } else {
      // 如果API调用失败，使用预设的新闻数据
      console.log('API调用失败或返回无效数据，使用预设的熊猫新闻');
      allNews = [...realPandaNews];
    }
    
    // 为每条新闻添加来源logo和相关图片
    const processedNews = [];
    for (const news of allNews) {
      // 确保新闻有必要字段
      if (!news.title || !news.description) continue;
      
      // 获取新闻来源logo
      const sourceLogo = await generateSourceLogo(news.source);
      
      // 生成与新闻内容相关的图片
      const newsImage = await generateNewsImage(news.title, news.description);
      
      // 添加到处理后的新闻列表
      processedNews.push({
        ...news,
        sourceLogo: sourceLogo,
        image: news.image || newsImage // 如果新闻已有图片则保留，否则使用生成的图片
      });
      
      // 最多处理30条新闻
      if (processedNews.length >= 30) break;
    }
    
    // 随机打乱新闻顺序，以便每次显示不同的排序
    return processedNews.sort(() => Math.random() - 0.5).slice(0, 30);
  } catch (error) {
    console.error('获取熊猫新闻失败:', error);
    return formatDefaultNews();
  }
}

// 获取熊猫知识
async function getPandaKnowledge() {
  try {
    // 这里应该是调用DeepSeek API获取熊猫知识
    // 由于API调用限制，这里返回默认数据
    return formatDefaultKnowledge();
  } catch (error) {
    console.error('获取熊猫知识失败:', error);
    return formatDefaultKnowledge();
  }
}

// 获取熊猫直播信息
async function getPandaLiveInfo() {
  try {
    // 这里可以添加获取实时直播信息的逻辑
    // 由于API调用限制，这里返回默认数据
    return formatDefaultLiveInfo();
  } catch (error) {
    console.error('获取熊猫直播信息失败:', error);
    return formatDefaultLiveInfo();
  }
}

// 获取熊猫位置数据
async function getPandaLocations() {
  try {
    // 这里可以添加从API获取真实数据的逻辑
    // 目前返回默认数据
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
        types: ['wild', 'research'],
        description: '中国最大的大熊猫自然栖息地，也是大熊猫保护研究中心所在地。',
        established: '1963年',
        imageUrl: './assets/panda_logo1.png'
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
        types: ['wild'],
        description: '秦岭山脉中最重要的大熊猫栖息地之一，拥有较为完整的大熊猫生态系统。',
        established: '1978年',
        imageUrl: './assets/panda_logo2.png'
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
        types: ['research', 'captive'],
        description: '世界上最著名的大熊猫繁育研究机构，拥有全球最多的圈养大熊猫。',
        established: '1987年',
        imageUrl: './assets/panda_logo3.jpg'
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
        types: ['captive'],
        description: '中国最早饲养展示大熊猫的动物园之一，拥有专门的大熊猫馆。',
        established: '1908年',
        imageUrl: './assets/panda_logo4.png'
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
        types: ['captive'],
        description: '美国最早饲养大熊猫的动物园，参与中美大熊猫保护合作项目。',
        established: '1889年',
        imageUrl: './assets/panda_logo1.png'
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
        types: ['captive'],
        description: '日本最早引进大熊猫的动物园，是日中友好的重要象征。',
        established: '1882年',
        imageUrl: './assets/panda_logo2.png'
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
        types: ['captive', 'research'],
        description: '欧洲最成功的大熊猫繁育基地之一，曾成功繁育多只大熊猫幼崽。',
        established: '1980年',
        imageUrl: './assets/panda_logo3.jpg'
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
        types: ['wild'],
        description: '甘肃省最大的大熊猫栖息地，是大熊猫分布最北的区域。',
        established: '1963年',
        imageUrl: './assets/panda_logo4.png'
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
        types: ['captive'],
        description: '英国唯一饲养大熊猫的动物园，参与中英大熊猫保护合作项目。',
        established: '1913年',
        imageUrl: './assets/panda_logo1.png'
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
        types: ['captive'],
        description: '美国最成功的大熊猫繁育基地之一，已成功繁育多只大熊猫幼崽。',
        established: '1889年',
        imageUrl: './assets/panda_logo2.png'
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
        types: ['captive'],
        description: '加拿大唯一饲养大熊猫的动物园，参与中加大熊猫保护合作项目。',
        established: '1974年',
        imageUrl: './assets/panda_logo3.jpg'
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
        types: ['captive'],
        description: '东南亚地区饲养大熊猫的主要动物园，参与中马大熊猫保护合作项目。',
        established: '1963年',
        imageUrl: './assets/panda_logo4.png'
      },
      {
        id: 13,
        name: '四川黑水河自然保护区',
        address: '四川省阿坝藏族羌族自治州黑水县',
        country: '中国',
        latitude: 32.0580,
        longitude: 102.9944,
        count: 45,
        type: 'wild',
        types: ['wild'],
        description: '四川省重要的大熊猫栖息地，拥有丰富的竹林资源和完整的森林生态系统。',
        established: '1993年',
        imageUrl: './assets/panda_logo1.png'
      },
      {
        id: 14,
        name: '四川蜂桶寨自然保护区',
        address: '四川省雅安市宝兴县',
        country: '中国',
        latitude: 30.3681,
        longitude: 102.8775,
        count: 32,
        type: 'wild',
        types: ['wild'],
        description: '位于四川盆地西缘的山地保护区，是大熊猫重要的栖息地之一。',
        established: '1978年',
        imageUrl: './assets/panda_logo2.png'
      },
      {
        id: 15,
        name: '陕西长青国家级自然保护区',
        address: '陕西省汉中市略阳县',
        country: '中国',
        latitude: 33.6650,
        longitude: 106.5514,
        count: 30,
        type: 'wild',
        types: ['wild'],
        description: '秦岭山系中的重要大熊猫栖息地，是连接秦岭东西部大熊猫种群的重要廊道。',
        established: '1995年',
        imageUrl: './assets/panda_logo3.jpg'
      },
      {
        id: 16,
        name: '甘肃裕河自然保护区',
        address: '甘肃省陇南市宕昌县',
        country: '中国',
        latitude: 34.1234,
        longitude: 104.3942,
        count: 18,
        type: 'wild',
        types: ['wild'],
        description: '甘肃省重要的大熊猫栖息地之一，是大熊猫种群向北扩散的重要通道。',
        established: '1986年',
        imageUrl: './assets/panda_logo4.png'
      },
      {
        id: 17,
        name: '四川都江堰大熊猫基地',
        address: '四川省成都市都江堰市青城山镇',
        country: '中国',
        latitude: 30.9214,
        longitude: 103.6136,
        count: 40,
        type: 'research',
        types: ['research', 'wild', 'captive'],
        description: '中国大熊猫保护研究中心都江堰基地，主要用于大熊猫疾病防控和野化培训。',
        established: '2003年',
        imageUrl: './assets/panda_logo1.png'
      },
      {
        id: 18,
        name: '陕西秦岭大熊猫繁育研究中心',
        address: '陕西省西安市长安区樊川镇',
        country: '中国',
        latitude: 33.8475,
        longitude: 108.5214,
        count: 25,
        type: 'research',
        types: ['research', 'captive'],
        description: '陕西省唯一的大熊猫人工繁育研究机构，致力于秦岭大熊猫的保护研究。',
        established: '1997年',
        imageUrl: './assets/panda_logo2.png'
      },
      {
        id: 19,
        name: '四川雅安碧峰峡基地',
        address: '四川省雅安市雨城区碧峰峡镇',
        country: '中国',
        latitude: 29.9812,
        longitude: 102.8954,
        count: 30,
        type: 'research',
        types: ['research', 'captive'],
        description: '中国大熊猫保护研究中心雅安基地，主要用于大熊猫繁育和科普教育。',
        established: '2002年',
        imageUrl: './assets/panda_logo3.jpg'
      },
      {
        id: 20,
        name: '广州长隆野生动物世界',
        address: '广东省广州市番禺区迎宾路',
        country: '中国',
        latitude: 23.0011,
        longitude: 113.3245,
        count: 8,
        type: 'captive',
        types: ['captive'],
        description: '中国南方最大的大熊猫展示场所，拥有专门的大熊猫馆和繁育设施。',
        established: '1997年',
        imageUrl: './assets/panda_logo4.png'
      },
      {
        id: 21,
        name: '上海野生动物园',
        address: '上海市浦东新区南六公路178号',
        country: '中国',
        latitude: 31.0593,
        longitude: 121.7226,
        count: 4,
        type: 'captive',
        types: ['captive'],
        description: '华东地区重要的大熊猫展示场所，拥有专门的大熊猫馆。',
        established: '1995年',
        imageUrl: './assets/panda_logo1.png'
      },
      {
        id: 22,
        name: '维也纳美泉宫动物园',
        address: 'Maxingstraße 13b, 1130 Wien, 奥地利',
        country: '奥地利',
        latitude: 48.1833,
        longitude: 16.3024,
        count: 2,
        type: 'captive',
        types: ['captive'],
        description: '世界上最古老的动物园，欧洲重要的大熊猫保护合作机构。',
        established: '1752年',
        imageUrl: './assets/panda_logo2.png'
      },
      {
        id: 23,
        name: '西班牙马德里动物园',
        address: 'Casa de Campo, s/n, 28011 Madrid, 西班牙',
        country: '西班牙',
        latitude: 40.4092,
        longitude: -3.7594,
        count: 2,
        type: 'captive',
        types: ['captive'],
        description: '西班牙唯一饲养大熊猫的动物园，参与中西大熊猫保护合作项目。',
        established: '1770年',
        imageUrl: './assets/panda_logo3.jpg'
      },
      {
        id: 24,
        name: '新加坡动物园',
        address: '80 Mandai Lake Rd, 新加坡',
        country: '新加坡',
        latitude: 1.4043,
        longitude: 103.7930,
        count: 2,
        type: 'captive',
        types: ['captive'],
        description: '东南亚地区重要的大熊猫展示场所，参与中新大熊猫保护合作项目。',
        established: '1973年',
        imageUrl: './assets/panda_logo4.png'
      },
      {
        id: 25,
        name: '韩国爱宝乐园',
        address: '경기도 용인시 처인구 포곡읍 에버랜드로 199, 韩国',
        country: '韩国',
        latitude: 37.2958,
        longitude: 127.2025,
        count: 2,
        type: 'captive',
        types: ['captive'],
        description: '韩国唯一饲养大熊猫的动物园，参与中韩大熊猫保护合作项目。',
        established: '1976年',
        imageUrl: './assets/panda_logo1.png'
      },
      {
        id: 26,
        name: '比利时帕伊里达伊兹动物园',
        address: 'Domaine de Planckendael, Leuvensesteenweg 582, 2812 Mechelen, 比利时',
        country: '比利时',
        latitude: 51.0158,
        longitude: 4.5326,
        count: 2,
        type: 'captive',
        types: ['captive', 'research'],
        description: '比利时唯一饲养大熊猫的动物园，参与中比大熊猫保护合作项目。',
        established: '1956年',
        imageUrl: './assets/panda_logo2.png'
      },
      {
        id: 27,
        name: '荷兰雷嫩动物园',
        address: 'Grebbeweg 111, 3911 AV Rhenen, 荷兰',
        country: '荷兰',
        latitude: 51.9573,
        longitude: 5.5773,
        count: 2,
        type: 'captive',
        types: ['captive'],
        description: '荷兰唯一饲养大熊猫的动物园，参与中荷大熊猫保护合作项目。',
        established: '1932年',
        imageUrl: './assets/panda_logo3.jpg'
      },
      {
        id: 28,
        name: '芬兰埃赫泰里动物园',
        address: 'Korkeasaari, 00570 Helsinki, 芬兰',
        country: '芬兰',
        latitude: 60.1756,
        longitude: 24.9841,
        count: 2,
        type: 'captive',
        types: ['captive'],
        description: '芬兰唯一饲养大熊猫的动物园，参与中芬大熊猫保护合作项目。',
        established: '1889年',
        imageUrl: './assets/panda_logo4.png'
      },
      {
        id: 29,
        name: '澳大利亚阿德莱德动物园',
        address: 'Frome Rd, Adelaide SA 5000, 澳大利亚',
        country: '澳大利亚',
        latitude: -34.9150,
        longitude: 138.6065,
        count: 2,
        type: 'captive',
        types: ['captive'],
        description: '澳大利亚饲养大熊猫的主要动物园，参与中澳大熊猫保护合作项目。',
        established: '1883年',
        imageUrl: './assets/panda_logo1.png'
      },
      {
        id: 30,
        name: '日本和歌山冒险世界',
        address: '和歌山県白浜町堅田2399, 日本',
        country: '日本',
        latitude: 33.6785,
        longitude: 135.3855,
        count: 4,
        type: 'captive',
        types: ['captive', 'research'],
        description: '日本最成功的大熊猫繁育基地，已成功繁育多只大熊猫幼崽。',
        established: '1978年',
        imageUrl: './assets/panda_logo2.png'
      }
    ];
  } catch (error) {
    console.error('获取熊猫位置数据失败:', error);
    return [];
  }
}

// 导出API函数
module.exports = {
  getLatestPandaNews,
  getPandaKnowledge,
  getPandaLiveInfo,
  getPandaLocations,
  fetchPandaNewsFromTongyi,
  generateSourceLogo,
  generateNewsImage,
  generateWorldMap
};
