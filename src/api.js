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
// 新闻数据缓存目录
const NEWS_CACHE_DIR = './assets/cache';
// 新闻缓存文件路径
const NEWS_CACHE_FILE = path.join(NEWS_CACHE_DIR, 'news_cache.json');
// 新闻缓存过期时间（毫秒）- 设置为10分钟
const NEWS_CACHE_EXPIRY = 10 * 60 * 1000;

// 确保缓存目录存在
try {
  if (!fs.existsSync(LOGO_CACHE_DIR)) {
    fs.mkdirSync(LOGO_CACHE_DIR, { recursive: true });
    console.log('创建logo缓存目录:', LOGO_CACHE_DIR);
  }
  if (!fs.existsSync(MAPS_CACHE_DIR)) {
    fs.mkdirSync(MAPS_CACHE_DIR, { recursive: true });
    console.log('创建地图缓存目录:', MAPS_CACHE_DIR);
  }
  if (!fs.existsSync(NEWS_CACHE_DIR)) {
    fs.mkdirSync(NEWS_CACHE_DIR, { recursive: true });
    console.log('创建新闻缓存目录:', NEWS_CACHE_DIR);
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
      url: "https://www.panda.org.cn/",
      sourceLogo: "./assets/panda_logo1.png"
    },
    {
      title: "中法合作大熊猫保护项目取得重大进展",
      date: "2025年5月28日",
      description: "中法科学家团队在大熊猫基因研究方面取得重大突破，有望帮助提高大熊猫的繁殖成功率和幼崽存活率。",
      source: "中国科学院动物研究所",
      image: "./assets/panda2.jpg",
      url: "http://www.ioz.cas.cn/kxcbb/kpkxjd/201902/t20190220_5242296.html",
      sourceLogo: "./assets/panda_logo2.png"
    },
    {
      title: "四川卧龙保护区野生大熊猫数量创新高",
      date: "2025年5月15日",
      description: "最新野外调查显示，四川卧龙自然保护区的野生大熊猫数量达到197只，较上次普查增加了23只，创历史新高。",
      source: "国家林业和草原局",
      image: "./assets/panda3.jpg",
      url: "http://www.forestry.gov.cn/dxm.html",
      sourceLogo: "./assets/panda_logo3.jpg"
    },
    {
      title: "濒危降为易危！中国大熊猫保护成绩单令世界瞩目",
      date: "2024年11月29日",
      description: "我国大熊猫保护成绩单令世界瞩目——野外种群数量从上世纪80年代约1100只增长到约1900只，世界自然保护联盟将大熊猫从濒危等级下调为易危；全球大熊猫圈养种群数量达757只，种群结构持续向好。",
      source: "央视网",
      image: "./assets/panda1.jpg",
      url: "https://news.cctv.com/2024/11/29/ARTIN7ede8DmJXya17vgCYto241129.shtml",
      sourceLogo: "./assets/panda_logo4.png"
    },
    {
      title: "大熊猫：全球物种保护的中国范例",
      date: "2025年3月23日",
      description: "中国绿色时报报道，大熊猫作为伞护物种，对整个生态系统保护和周边社区的可持续发展具有举足轻重的作用。大熊猫栖息地生态保护已进入了国家公园时代，栖息地受保护面积从139万公顷增长至258万公顷。",
      source: "中国绿色时报",
      image: "./assets/panda2.jpg",
      url: "https://www.ipanda.com/2025/03/23/ARTIx6mZgJY6UbV3tvfYqDA5250323.shtml",
      sourceLogo: "./assets/panda_logo1.png"
    },
    {
      title: "外国出生的大熊猫加入中国野生种群恢复计划",
      date: "2024年6月16日",
      description: "在外国出生的大熊猫如美国出生的贝贝正在适应中国的新生活，它们将加入中国大熊猫繁育项目，有助于拯救这一物种免于灭绝。中国大熊猫保护研究中心首席专家张和民表示，他们的工作非常紧迫，需要用圈养大熊猫来补充野生种群。",
      source: "Phys.org",
      image: "./assets/panda3.jpg",
      url: "https://phys.org/news/2024-06-foreign-born-pandas-china-efforts.html",
      sourceLogo: "./assets/panda_logo2.png"
    },
    {
      title: "中国野生大熊猫数量接近1900只",
      date: "2024年1月25日",
      description: "国家林业和草原局表示，中国野生大熊猫数量目前约为1900只，相比上世纪80年代的约1100只有了显著增长。2021年10月成立的大熊猫国家公园覆盖面积超过22,000平方公里，为约72%的野生大熊猫提供了重要保护。",
      source: "中国政府网",
      image: "./assets/panda_logo2.png",
      url: "https://english.www.gov.cn/archive/statistics/202401/25/content_WS65b20287c6d0868f4e8e37be.html",
      sourceLogo: "./assets/panda_logo3.jpg"
    },
    {
      title: "成都大熊猫繁育研究基地新添双胞胎熊猫",
      date: "2024年8月15日",
      description: "成都大熊猫繁育研究基地成功繁育一对大熊猫双胞胎，为全球大熊猫保护再添喜讯。这对双胞胎目前健康状况良好，体重稳步增加。",
      source: "成都日报",
      image: "./assets/panda1.jpg",
      url: "https://www.panda.org.cn/",
      sourceLogo: "./assets/panda_logo4.png"
    },
    {
      title: "中国大熊猫国家公园生态廊道建设取得新进展",
      date: "2024年7月20日",
      description: "中国大熊猫国家公园生态廊道建设项目已完成70%，该项目旨在连接分散的大熊猫栖息地，促进种群交流，提高大熊猫种群的遗传多样性。",
      source: "国家林业和草原局",
      image: "./assets/panda2.jpg",
      url: "http://www.forestry.gov.cn/",
      sourceLogo: "./assets/panda_logo1.png"
    },
    {
      title: "大熊猫龙凤胎在美国动物园出生",
      date: "2024年5月8日",
      description: "美国华盛顿国家动物园宣布，旅美大熊猫美香成功产下一对龙凤胎，这是美国20年来首次迎来大熊猫双胞胎，这两只幼崽将在3-4岁时返回中国。",
      source: "美国国家动物园",
      image: "./assets/panda3.jpg",
      url: "https://nationalzoo.si.edu/",
      sourceLogo: "./assets/panda_logo2.png"
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
async function generateSourceLogo(source, url) {
  // 简化函数，直接返回默认图标
  return './assets/news_default.png';
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
    // 首先尝试从缓存加载新闻数据
    const cachedNews = loadNewsFromCache();
    
    // 如果有缓存且未过期，直接返回缓存数据
    if (cachedNews && cachedNews.data && cachedNews.data.length > 0 && !isCacheExpired(cachedNews.timestamp)) {
      console.log('使用缓存的熊猫新闻数据，缓存时间:', new Date(cachedNews.timestamp).toLocaleString());
      return cachedNews.data;
    }
    
    // 如果没有缓存或缓存已过期，获取新数据
    console.log('缓存不存在或已过期，获取新数据');
    
    // 准备备用数据（预设的新闻数据）
    const realPandaNews = formatDefaultNews();
    
    // 初始化处理后的新闻列表
    let processedNews = [];
    
    // 尝试从通义千问API获取新闻（设置超时，避免长时间等待）
    let tongyiNews = null;
    try {
      // 创建一个带超时的Promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API请求超时')), 5000); // 5秒超时
      });
      
      // 与API请求Promise竞争
      tongyiNews = await Promise.race([
        fetchPandaNewsFromTongyi(),
        timeoutPromise
      ]);
    } catch (error) {
      console.warn('获取通义千问API数据失败或超时:', error.message);
      // 超时或失败时继续使用备用数据
    }
    
    // 合并新闻数据
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
    
    // 为每条新闻添加来源logo和相关图片（使用Promise.all并行处理）
    const newsPromises = allNews.map(async (news) => {
      // 确保新闻有必要字段
      if (!news.title || !news.description) return null;
      
      try {
        // 生成与新闻内容相关的图片
        const newsImage = await generateNewsImage(news.title, news.description);
      
        // 返回处理后的新闻
        return {
          ...news,
          image: news.image || newsImage // 如果新闻已有图片则保留，否则使用生成的图片
        };
      } catch (error) {
        console.error(`处理新闻 "${news.title}" 失败:`, error);
        return null;
      }
    });
    
    // 等待所有新闻处理完成
    const results = await Promise.all(newsPromises);
    
    // 过滤掉处理失败的新闻
    processedNews = results.filter(news => news !== null);
      
      // 最多处理30条新闻
    if (processedNews.length > 30) {
      processedNews = processedNews.slice(0, 30);
    }
    
    // 随机打乱新闻顺序，以便每次显示不同的排序
    processedNews = processedNews.sort(() => Math.random() - 0.5);
    
    // 保存到缓存
    saveNewsToCache(processedNews);
    
    return processedNews;
  } catch (error) {
    console.error('获取熊猫新闻失败:', error);
    
    // 如果处理过程中出错，尝试从缓存加载
    const cachedNews = loadNewsFromCache();
    if (cachedNews && cachedNews.data && cachedNews.data.length > 0) {
      console.log('出错后使用缓存的熊猫新闻数据');
      return cachedNews.data;
    }
    
    // 如果缓存也不可用，返回默认数据
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

// 从缓存加载新闻数据
function loadNewsFromCache() {
  try {
    if (fs.existsSync(NEWS_CACHE_FILE)) {
      const cacheContent = fs.readFileSync(NEWS_CACHE_FILE, 'utf8');
      return JSON.parse(cacheContent);
    }
  } catch (error) {
    console.error('读取新闻缓存失败:', error);
  }
  return null;
}

// 保存新闻数据到缓存
function saveNewsToCache(newsData) {
  try {
    const cacheData = {
      timestamp: Date.now(),
      data: newsData
    };
    fs.writeFileSync(NEWS_CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf8');
    console.log('新闻数据已保存到缓存');
  } catch (error) {
    console.error('保存新闻缓存失败:', error);
  }
}

// 检查缓存是否过期
function isCacheExpired(timestamp) {
  return Date.now() - timestamp > NEWS_CACHE_EXPIRY;
}

// 获取最新熊猫新闻（轻量版，用于快速加载）
async function getLatestPandaNewsLite() {
  try {
    // 首先尝试从缓存加载
    const cachedNews = loadNewsFromCache();
    
    // 如果有缓存，直接返回（不管是否过期）
    if (cachedNews && cachedNews.data && cachedNews.data.length > 0) {
      console.log('使用缓存的熊猫新闻数据（轻量版）');
      
      // 在后台更新缓存（如果已过期）
      if (isCacheExpired(cachedNews.timestamp)) {
        console.log('缓存已过期，在后台更新');
        setTimeout(() => {
          getLatestPandaNews().catch(err => console.error('后台更新新闻缓存失败:', err));
        }, 100);
      }
      
      return cachedNews.data;
    }
    
    // 如果没有缓存，返回默认数据并在后台获取新数据
    console.log('缓存不存在，返回默认数据并在后台更新');
    const defaultNews = formatDefaultNews();
    
    // 在后台获取新数据
    setTimeout(() => {
      getLatestPandaNews().catch(err => console.error('后台获取新闻数据失败:', err));
    }, 100);
    
    return defaultNews;
  } catch (error) {
    console.error('获取轻量版熊猫新闻失败:', error);
    return formatDefaultNews();
  }
}

// 导出API函数
module.exports = {
  getLatestPandaNews,
  getLatestPandaNewsLite, // 添加轻量版API
  getPandaKnowledge,
  getPandaLiveInfo,
  getPandaLocations,
  fetchPandaNewsFromTongyi,
  generateSourceLogo,
  generateNewsImage,
  generateWorldMap
};
