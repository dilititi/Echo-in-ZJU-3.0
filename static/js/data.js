const Data = {
  markerTypes: {
    study: { name: '学习', color: '#4A90E2', icon: '🎓' },
    love: { name: '恋爱', color: '#FF6B9B', icon: '❤️' },
    sport: { name: '运动', color: '#2ECC71', icon: '⚽' },
    club: { name: '社团活动', color: '#9B59B6', icon: '🎭' },
    memory: { name: '纪念', color: '#F39C12', icon: '📌' }
  },

  levels: [
    {
      id: 1,
      title: '认识校园',
      description: '欢迎来到声音校园！让我们从校门口开始探索吧。',
      target: '认识界面 + 移动地图',
      unlockFeatures: ['mapDrag', 'mapZoom'],
      buildings: ['all'],
      elements: ['map']
    },
    {
      id: 2,
      title: '放置标记',
      description: '太棒了！现在让我们学习如何在地图上放置标记。',
      target: '放置第一个纪念标记',
      unlockFeatures: ['addMarker', 'selectIcon'],
      buildings: ['all'],
      elements: ['map', 'iconSelector']
    },
    {
      id: 3,
      title: '录制声音',
      description: '很好！现在让我们录制一段属于你自己的声音。',
      target: '录制/上传一段音频',
      unlockFeatures: ['recordAudio', 'uploadAudio'],
      buildings: ['all'],
      elements: ['map', 'iconSelector', 'audioPanel']
    },
    {
      id: 4,
      title: '绑定声音',
      description: '厉害！现在让我们把声音和标记绑定在一起。',
      target: '选择音频 + 放置标记绑定',
      unlockFeatures: ['bindAudio'],
      buildings: ['all'],
      elements: ['map', 'iconSelector', 'audioPanel', 'bindButton']
    },
    {
      id: 5,
      title: '校园地标',
      description: '精彩！现在让我们探索校园里的历史地标。',
      target: '点击播放谜题音频解锁故事',
      unlockFeatures: ['puzzles', 'playAudio'],
      buildings: ['all'],
      elements: ['map', 'iconSelector', 'audioPanel', 'bindButton', 'puzzleList']
    },
    {
      id: 6,
      title: '自由探索',
      description: '恭喜！你已经完成了所有基础训练。现在自由探索校园吧！',
      target: '自由探索 + 社交互动',
      unlockFeatures: ['all'],
      buildings: ['all'],
      elements: ['all']
    }
  ],

  buildings: {
    old_management_building: {
      name: '旧管理院大楼',
      image: 'layers/旧管理院大楼.png',
      position: [520, 320],
      description: '旧管理院大楼见证了浙江大学悠久的历史，是校园内最具代表性的建筑之一。'
    },
    qiushi_plaque: {
      name: '求是牌匾',
      image: 'layers/求是牌匾.png',
      position: [260, 240],
      description: '求是牌匾矗立于求是大讲堂前，承载着"求是创新"的校训精神。'
    },
    qiushi_auditorium: {
      name: '求是大讲堂',
      image: 'layers/求是大讲堂.png',
      position: [250, 200],
      description: '求是大讲堂是浙江大学的重要文化场所，举办过无数次学术讲座和文化活动。'
    },
    old_zju_gate: {
      name: '浙江大学旧校门',
      image: 'layers/浙江大学旧校门.png',
      position: [220, 150],
      description: '浙江大学旧校门是学校历史的象征，见证了无数浙大学子的青春岁月。'
    },
    zju_gymnasium: {
      name: '浙江大学体育馆',
      image: 'layers/浙江大学体育馆.png',
      position: [680, 380],
      description: '浙江大学体育馆是校园体育活动的中心，承载着学生们的运动热情。'
    },
    zju_library: {
      name: '浙江大学图书馆',
      image: 'layers/浙江大学图书馆.png',
      position: [720, 580],
      description: '浙江大学图书馆是知识的殿堂，藏书丰富，是学子们求学的圣地。'
    },
    zju_crescent_building: {
      name: '浙江大学月牙楼',
      image: 'layers/浙江大学月牙楼.png',
      position: [230, 620],
      description: '浙江大学月牙楼因其独特的月牙形状而得名，是校园的标志性建筑之一。'
    },
    chengjun_yuan: {
      name: '成均苑（人文古籍图书馆）',
      image: 'layers/成均苑.png',
      position: [200, 520],
      description: '成均苑是浙江大学人文古籍图书馆，收藏珍贵古籍文献。'
    },
    qiushi_lake: {
      name: '求是湖（现已抽干）',
      image: 'layers/求是湖.png',
      position: [270, 260],
      description: '求是湖曾是校园内的景观湖，承载着浙大人的美好回忆。'
    },
    south_gate: {
      name: '南大门',
      image: 'layers/南大门.png',
      position: [220, 920],
      description: '南大门是浙江大学紫金港校区的主要出入口之一。'
    },
    medical_college: {
      name: '医学院',
      image: 'layers/医学院.png',
      position: [480, 680],
      description: '医学院是浙江大学医学教育的重要基地。'
    },
    biology_center: {
      name: '生物中心',
      image: 'layers/生物中心.png',
      position: [420, 270],
      description: '生物中心是生命科学研究的重要场所。'
    },
    metalworking_center: {
      name: '金工中心',
      image: 'layers/金工中心.png',
      position: [400, 370],
      description: '金工中心是工程训练和实习的重要基地。'
    },
    chemistry_center: {
      name: '化学中心',
      image: 'layers/化学中心.png',
      position: [380, 220],
      description: '化学中心是化学实验教学和研究的核心场所。'
    },
    architectural_college: {
      name: '建筑工程学院',
      image: 'layers/建工学院.png',
      position: [440, 320],
      description: '建筑工程学院是建筑工程人才培养的摇篮。'
    },
    ocean_computing_center: {
      name: '海洋科学与工程学院',
      image: 'layers/海洋与计算中心.png',
      position: [470, 220],
      description: '海洋科学与工程学院是跨学科研究的重要平台。'
    },
    basketball_gym: {
      name: '篮球馆',
      image: 'layers/篮球馆.png',
      position: [620, 420],
      description: '篮球馆是校园篮球运动的主要场地。'
    },
    bifeng_ziyun: {
      name: '碧峰园、紫云园',
      image: 'layers/碧峰紫云.png',
      position: [730, 180],
      description: '碧峰园、紫云园是学生宿舍区，环境优美。'
    },
    lantian: {
      name: '蓝田园',
      image: 'layers/蓝田.png',
      position: [770, 220],
      description: '蓝田园是学生宿舍区，生活便利。'
    },
    gangwan: {
      name: '港湾',
      image: 'layers/港湾.png',
      position: [670, 270],
      description: '港湾是学生宿舍区，临近教学区。'
    },
    danyang: {
      name: '丹阳园',
      image: 'layers/丹阳.png',
      position: [820, 180],
      description: '丹阳园是学生宿舍区，设施完善。'
    },
    qingxi: {
      name: '青溪园',
      image: 'layers/青溪.png',
      position: [870, 220],
      description: '青溪园是学生宿舍区，环境清幽。'
    },
    cuibai: {
      name: '翠柏园',
      image: 'layers/翠柏.png',
      position: [730, 270],
      description: '翠柏园是学生宿舍区，绿树环绕。'
    },
    baisha: {
      name: '白沙园',
      image: 'layers/白沙.png',
      position: [770, 320],
      description: '白沙园是学生宿舍区，安静舒适。'
    },
    international_student_apartment: {
      name: '留学生公寓',
      image: 'layers/留学生公寓.png',
      position: [820, 270],
      description: '留学生公寓是国际学生的住宿区域。'
    },
    qizhen_hotel: {
      name: '启真酒店',
      image: 'layers/启真酒店.png',
      position: [870, 320],
      description: '启真酒店是校园内的接待酒店。'
    },
    qizhen_lake: {
      name: '启真湖',
      image: 'layers/启真湖.png',
      position: [500, 500],
      description: '启真湖是紫金港校区的标志性景观湖。'
    },
    small_theater: {
      name: '小剧场',
      image: 'layers/小剧场.png',
      position: [160, 470],
      description: '小剧场是校园文艺演出和活动的重要场所。'
    },
    west_teaching: {
      name: '西教学楼',
      image: 'layers/西教.png',
      position: [140, 420],
      description: '西教学楼是主要的教学楼之一。'
    },
    nanhua_garden: {
      name: '南华园',
      image: 'layers/南华园.png',
      position: [210, 720],
      description: '南华园是校园内的休闲花园。'
    },
    pharmacy_college: {
      name: '药学院',
      image: 'layers/药学院.png',
      position: [270, 420],
      description: '药学院是药学教育和研究的重镇。'
    },
    agricultural_medical_library: {
      name: '图书馆农医分馆',
      image: 'layers/图书馆农医分馆.png',
      position: [620, 820],
      description: '图书馆农医分馆是农学医学专业图书馆。'
    },
    life_science_college: {
      name: '生命科学学院',
      image: 'layers/生科院.png',
      position: [520, 720],
      description: '生命科学学院是生命科学研究和教学的重要基地。'
    },
    agricultural_college: {
      name: '农业与生物技术学院',
      image: 'layers/农学院.png',
      position: [570, 770],
      description: '农业与生物技术学院是浙江大学历史悠久的学院之一。'
    },
    environmental_resource_college: {
      name: '环境与资源学院',
      image: 'layers/环资学院.png',
      position: [620, 720],
      description: '环境与资源学院是环境与资源研究的核心力量。'
    },
    animal_science_college: {
      name: '动物科学学院',
      image: 'layers/动科院.png',
      position: [670, 770],
      description: '动物科学学院是动物科学研究和人才培养的重要基地。'
    },
    bioengineering_food_college: {
      name: '生物系统工程与食品科学学院',
      image: 'layers/生工与食品学院.png',
      position: [720, 720],
      description: '生物系统工程与食品科学学院是生物工程和食品科学的交叉学科平台。'
    },
    nano_building: {
      name: '纳米楼（行政服务办事大厅）',
      image: 'layers/纳米楼.png',
      position: [670, 620],
      description: '纳米楼是行政服务办事大厅，提供一站式服务。'
    },
    east_teaching: {
      name: '东教学楼',
      image: 'layers/东教.png',
      position: [600, 470],
      description: '东教学楼是主要的教学楼之一。'
    },
    undergraduate_college: {
      name: '本科生院',
      image: 'layers/本科生院.png',
      position: [540, 370],
      description: '本科生院是本科教学管理的核心机构。'
    },
    foreign_language_college: {
      name: '外国语学院',
      image: 'layers/外国语学院.png',
      position: [570, 220],
      description: '外国语学院是外语教学和研究的重要基地。'
    },
    mengmingwei_building: {
      name: '蒙明伟楼',
      image: 'layers/蒙明伟楼.png',
      position: [640, 320],
      description: '蒙明伟楼是校园内的标志性建筑。'
    },
    chengyue_area: {
      name: '澄月区',
      image: 'layers/澄月区.png',
      position: [230, 570],
      description: '澄月区是校园内的生活休闲区域。'
    },
    management_college: {
      name: '管理学院',
      image: 'layers/管理学院.png',
      position: [350, 450],
      description: '管理学院是浙江大学管理教育和研究的重要基地，培养具有全球视野的管理人才。'
    },
    public_administration_college: {
      name: '公共管理学院',
      image: 'layers/公共管理学院.png',
      position: [380, 480],
      description: '公共管理学院致力于公共管理研究和人才培养，服务国家治理现代化。'
    },
    zhu_kezhen_college: {
      name: '竺可桢学院',
      image: 'layers/竺可桢学院.png',
      position: [410, 510],
      description: '竺可桢学院是浙江大学拔尖创新人才培养的荣誉学院，以竺可桢老校长命名。'
    },
    humanities_college: {
      name: '人文学院',
      image: 'layers/人文学院.png',
      position: [180, 550],
      description: '人文学院是浙江大学人文学科教学与研究的重要基地，传承中华优秀传统文化。'
    },
    media_international_college: {
      name: '传媒与国际文化学院',
      image: 'layers/传媒与国际文化学院.png',
      position: [200, 580],
      description: '传媒与国际文化学院是新闻传播学和国际文化交流的重要平台。'
    },
    education_college: {
      name: '教育学院',
      image: 'layers/教育学院.png',
      position: [220, 610],
      description: '教育学院是教育科学研究和教师培养的重要基地。'
    },
    library_info_building: {
      name: '紫金港校区图书信息大楼',
      image: 'layers/图书信息大楼.png',
      position: [700, 550],
      description: '紫金港校区图书信息大楼是图书馆和信息服务的综合建筑。'
    },
    nong_sheng_huan_building: {
      name: '农生环组团大楼',
      image: 'layers/农生环组团大楼.png',
      position: [590, 750],
      description: '农生环组团大楼是农业、生物、环境学科的综合性科研教学建筑群。'
    },
    power_center: {
      name: '分动力中心',
      image: 'layers/分动力中心.png',
      position: [450, 350],
      description: '分动力中心是校园能源供应的重要设施。'
    },
    medical_complex: {
      name: '医学院综合楼',
      image: 'layers/医学院综合楼.png',
      position: [510, 700],
      description: '医学院综合楼是医学教育和研究的核心建筑。'
    },
    animal_experiment_center: {
      name: '动物实验中心',
      image: 'layers/动物实验中心.png',
      position: [550, 730],
      description: '动物实验中心是生命科学和医学研究的重要实验平台。'
    },
    medical_library: {
      name: '医学专业图书馆',
      image: 'layers/医学专业图书馆.png',
      position: [480, 650],
      description: '医学专业图书馆是医学文献资源服务的专业图书馆。'
    },
    engineering_lab_center: {
      name: '紫金港校区金工・化学・生物试验中心',
      image: 'layers/试验中心.png',
      position: [420, 300],
      description: '紫金港校区金工・化学・生物试验中心是工程训练和实验教学的重要基地。'
    },
    computing_center: {
      name: '计算中心',
      image: 'layers/计算中心.png',
      position: [580, 350],
      description: '计算中心是校园信息化和计算服务的重要支撑平台。'
    },
    waterside_lecture_hall: {
      name: '临水报告厅',
      image: 'layers/临水报告厅.png',
      position: [350, 550],
      description: '临水报告厅是学术报告和文化活动的重要场所。'
    },
    art_archaeology_museum: {
      name: '艺术与考古博物馆',
      image: 'layers/艺术与考古博物馆.png',
      position: [320, 600],
      description: '艺术与考古博物馆是浙江大学重要的文化展示和研究机构。'
    },
    linqi_statue: {
      name: '林启像',
      image: 'layers/林启像.png',
      position: [280, 280],
      description: '林启像是为纪念求是书院创始人林启而设立的纪念雕像。'
    },
    qiushi_innovation_gate: {
      name: '求是创新门楼',
      image: 'layers/求是创新门楼.png',
      position: [240, 180],
      description: '求是创新门楼是紫金港校区的标志性建筑，彰显求是创新精神。'
    },
    library_info_building_2: {
      name: '紫金港校区图书信息大楼',
      image: 'layers/图书信息大楼.png',
      position: [710, 560],
      description: '紫金港校区图书信息大楼是图书馆和信息服务的综合建筑。'
    },
    nong_sheng_huan_building_2: {
      name: '农生环组团大楼',
      image: 'layers/农生环组团大楼.png',
      position: [600, 760],
      description: '农生环组团大楼是农业、生物、环境学科的综合性科研教学建筑群。'
    },
    power_center_2: {
      name: '分动力中心',
      image: 'layers/分动力中心.png',
      position: [460, 360],
      description: '分动力中心是校园能源供应的重要设施。'
    },
    medical_complex_2: {
      name: '医学院综合楼',
      image: 'layers/医学院综合楼.png',
      position: [520, 710],
      description: '医学院综合楼是医学教育和研究的核心建筑。'
    },
    animal_experiment_center_2: {
      name: '动物实验中心',
      image: 'layers/动物实验中心.png',
      position: [560, 740],
      description: '动物实验中心是生命科学和医学研究的重要实验平台。'
    },
    medical_library_2: {
      name: '医学专业图书馆',
      image: 'layers/医学专业图书馆.png',
      position: [490, 660],
      description: '医学专业图书馆是医学文献资源服务的专业图书馆。'
    },
    engineering_lab_center_2: {
      name: '紫金港校区金工・化学・生物试验中心',
      image: 'layers/试验中心.png',
      position: [430, 310],
      description: '紫金港校区金工・化学・生物试验中心是工程训练和实验教学的重要基地。'
    },
    computing_center_2: {
      name: '计算中心',
      image: 'layers/计算中心.png',
      position: [590, 360],
      description: '计算中心是校园信息化和计算服务的重要支撑平台。'
    },
    waterside_lecture_hall_2: {
      name: '临水报告厅',
      image: 'layers/临水报告厅.png',
      position: [360, 560],
      description: '临水报告厅是学术报告和文化活动的重要场所。'
    },
    art_archaeology_museum_2: {
      name: '艺术与考古博物馆',
      image: 'layers/艺术与考古博物馆.png',
      position: [330, 610],
      description: '艺术与考古博物馆是浙江大学重要的文化展示和研究机构。'
    },
    linqi_statue_2: {
      name: '林启像',
      image: 'layers/林启像.png',
      position: [290, 290],
      description: '林启像是为纪念求是书院创始人林启而设立的纪念雕像。'
    },
    qiushi_innovation_gate_2: {
      name: '求是创新门楼',
      image: 'layers/求是创新门楼.png',
      position: [250, 190],
      description: '求是创新门楼是紫金港校区的标志性建筑，彰显求是创新精神。'
    },
    library_info_building_3: {
      name: '紫金港校区图书信息大楼',
      image: 'layers/图书信息大楼.png',
      position: [720, 570],
      description: '紫金港校区图书信息大楼是图书馆和信息服务的综合建筑。'
    },
    nong_sheng_huan_building_3: {
      name: '农生环组团大楼',
      image: 'layers/农生环组团大楼.png',
      position: [610, 770],
      description: '农生环组团大楼是农业、生物、环境学科的综合性科研教学建筑群。'
    },
    power_center_3: {
      name: '分动力中心',
      image: 'layers/分动力中心.png',
      position: [470, 370],
      description: '分动力中心是校园能源供应的重要设施。'
    },
    medical_complex_3: {
      name: '医学院综合楼',
      image: 'layers/医学院综合楼.png',
      position: [530, 720],
      description: '医学院综合楼是医学教育和研究的核心建筑。'
    },
    animal_experiment_center_3: {
      name: '动物实验中心',
      image: 'layers/动物实验中心.png',
      position: [570, 750],
      description: '动物实验中心是生命科学和医学研究的重要实验平台。'
    },
    medical_library_3: {
      name: '医学专业图书馆',
      image: 'layers/医学专业图书馆.png',
      position: [500, 670],
      description: '医学专业图书馆是医学文献资源服务的专业图书馆。'
    },
    engineering_lab_center_3: {
      name: '紫金港校区金工・化学・生物试验中心',
      image: 'layers/试验中心.png',
      position: [440, 320],
      description: '紫金港校区金工・化学・生物试验中心是工程训练和实验教学的重要基地。'
    },
    computing_center_3: {
      name: '计算中心',
      image: 'layers/计算中心.png',
      position: [600, 370],
      description: '计算中心是校园信息化和计算服务的重要支撑平台。'
    },
    waterside_lecture_hall_3: {
      name: '临水报告厅',
      image: 'layers/临水报告厅.png',
      position: [370, 570],
      description: '临水报告厅是学术报告和文化活动的重要场所。'
    },
    art_archaeology_museum_3: {
      name: '艺术与考古博物馆',
      image: 'layers/艺术与考古博物馆.png',
      position: [340, 620],
      description: '艺术与考古博物馆是浙江大学重要的文化展示和研究机构。'
    },
    linqi_statue_3: {
      name: '林启像',
      image: 'layers/林启像.png',
      position: [300, 300],
      description: '林启像是为纪念求是书院创始人林启而设立的纪念雕像。'
    },
    qiushi_innovation_gate_3: {
      name: '求是创新门楼',
      image: 'layers/求是创新门楼.png',
      position: [260, 200],
      description: '求是创新门楼是紫金港校区的标志性建筑，彰显求是创新精神。'
    }
  },

  puzzleEvents: {
    'old_management_building_puzzle': {
      title: '紫金港初建',
      description: `2002年10月，紫金港校区正式启用，旧管理院大楼成为首批投入使用的教学行政建筑。
作为新校区的管理中枢，这里见证了浙江大学从玉泉、西溪等校区向紫金港转移的历史进程。
四校合并后的浙大在此统筹规划，开启了建设世界一流大学的新篇章。
大楼承载着新世纪浙大人的奋斗记忆与开拓精神。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '脚步声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'qiushi_plaque_puzzle': {
      title: '求是校训',
      description: `1897年，求是书院创办，"求是"二字源于《汉书》"修学好古，实事求是"。
竺可桢校长在1938年确立"求是"为校训，倡导"只问是非，不计利害"的科学精神。
这块牌匾矗立于求是大讲堂前，提醒一代代浙大学子秉持求真务实的治学态度。
"求是创新"已成为浙大精神的核心标识。`,
      image: 'icons/west_campus.png',
      icon: 'icons/west_campus.png',
      audioPattern: '风声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'qiushi_auditorium_puzzle': {
      title: '求是大讲堂',
      description: `求是大讲堂是紫金港校区的文化地标，以"求是"命名传承百年校史精神。
这里举办过无数场高水平的学术讲座、毕业典礼和重要会议。
诺贝尔奖得主、两院院士、政商名流曾在此演讲，启迪学子智慧。
讲堂建筑融合现代设计与传统文化，是浙大文化传承的重要载体。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '掌声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'old_zju_gate_puzzle': {
      title: '校门记忆',
      description: `浙江大学校门见证了学校从1897年求是书院至今127年的风雨历程。
老校门的设计融合了传统与现代元素，是无数浙大人青春记忆的起点。
每逢毕业季，学子们在此合影留念，记录人生重要时刻。
校门不仅是物理入口，更是通往知识殿堂的精神象征。`,
      image: 'icons/gate.png',
      icon: 'icons/gate.png',
      audioPattern: '钟声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'zju_gymnasium_puzzle': {
      title: '体育精神',
      description: `浙江大学体育馆是紫金港校区的体育活动中心，可容纳数千名观众。
这里举办过CUBA中国大学生篮球联赛、校内运动会等重大赛事。
场馆设施先进，包括标准篮球场、羽毛球场、乒乓球室等运动空间。
"强身健体、报效祖国"的体育精神在此代代传承。`,
      image: 'icons/sport.png',
      icon: 'icons/sport.png',
      audioPattern: '哨声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'zju_library_puzzle': {
      title: '知识殿堂',
      description: `浙江大学图书馆始建于1897年，是中国历史最悠久的大学图书馆之一。
紫金港主馆于2002年启用，藏书量超过700万册，是华东地区最大的高校图书馆。
图书馆采用现代化管理系统，提供24小时自习空间和数字资源服务。
无数浙大学子在此伏案苦读，追逐学术梦想。`,
      image: 'icons/basic_library.png',
      icon: 'icons/basic_library.png',
      audioPattern: '翻书声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'zju_crescent_building_puzzle': {
      title: '月牙楼传说',
      description: `月牙楼因独特的弧形设计而得名，是紫金港校区最具辨识度的建筑之一。
学生们亲切地称它为"蟹老板"，因为外观酷似动画片《海绵宝宝》里的蟹老板。
楼内设有建筑系教室、机械实验室和办公空间，是重要的教学科研场所。
这座建筑已成为浙大紫金港的标志性符号。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '鸟鸣声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'chengjun_yuan_puzzle': {
      title: '成均启秀',
      description: `成均苑是浙江大学人文古籍图书馆，收藏有大量珍贵古籍文献。
"成均"二字源于浙大校歌"成均启秀"，意为古代最高学府。
馆内珍藏宋元善本、明清刻本等珍稀古籍，是人文研究的宝库。
这里传承着中华文脉，守护着千年学术薪火。`,
      image: 'icons/basic_library.png',
      icon: 'icons/basic_library.png',
      audioPattern: '古琴声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'qiushi_lake_puzzle': {
      title: '求是湖往事',
      description: `求是湖曾是紫金港校区的重要景观水体，与"求是"校训相呼应。
湖水清澈时，倒映着周边建筑，是师生休闲散步的好去处。
因校园建设需要，湖水曾一度抽干，但这里承载的记忆永不干涸。
求是湖见证了紫金港校区的发展变迁。`,
      image: 'icons/west_campus.png',
      icon: 'icons/west_campus.png',
      audioPattern: '水声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'south_gate_puzzle': {
      title: '南大门迎新',
      description: `南大门是浙江大学紫金港校区的主要出入口，连接着校园与城市。
每年九月，数万名新生从这里踏入浙大，开启人生新篇章。
校门设计庄重大气，彰显着百年名校的文化底蕴。
这里是浙大人共同的起点，也是离别时最不舍的告别之地。`,
      image: 'icons/gate.png',
      icon: 'icons/gate.png',
      audioPattern: '车流声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'medical_college_puzzle': {
      title: '医学传承',
      description: `浙江大学医学院源于1912年创办的浙江医学专门学校，历史悠久。
1998年四校合并后，浙江医科大学并入浙江大学，组建新的医学院。
学院拥有多家附属医院，临床医学学科位居全球前列。
无数医学人才从这里走出，守护人民健康。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '心跳声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'biology_center_puzzle': {
      title: '生命探索',
      description: `生物中心是浙江大学生命科学研究的重要基地，拥有先进的实验设施。
这里开展前沿的生物技术研究，涉及基因编辑、合成生物学等领域。
科研人员在此探索生命的奥秘，为人类健康和可持续发展贡献力量。
中心培养了一大批优秀的生命科学人才。`,
      image: 'icons/lab.png',
      icon: 'icons/lab.png',
      audioPattern: '显微镜调焦声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'metalworking_center_puzzle': {
      title: '工匠精神',
      description: `金工中心是浙江大学工程训练的核心场所，传承着精益求精的工匠精神。
学生们在这里学习车、铣、刨、磨等传统加工技术，培养实践能力。
中心配备现代化数控设备，将传统工艺与智能制造相结合。
这里是工程师的摇篮，孕育着未来的大国工匠。`,
      image: 'icons/lab.png',
      icon: 'icons/lab.png',
      audioPattern: '机器轰鸣声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'chemistry_center_puzzle': {
      title: '化学之光',
      description: `化学中心是浙江大学化学实验教学和研究的核心基地。
浙江大学化学学科历史悠久，培养了多位两院院士和杰出学者。
中心拥有先进的分析仪器，支持从基础研究到应用开发的各类项目。
化学之美在这里绽放，探索物质世界的奥秘。`,
      image: 'icons/lab.png',
      icon: 'icons/lab.png',
      audioPattern: '玻璃器皿碰撞声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'architectural_college_puzzle': {
      title: '建筑梦想',
      description: `建工学院是浙江大学建筑工程领域的人才培养高地。
学院设有土木工程、建筑学等优势专业，在国内享有盛誉。
师生们在此设计创新建筑方案，探索可持续城市发展之路。
无数标志性建筑的设计者从这里起步，建设美丽中国。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '绘图声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'ocean_computing_center_puzzle': {
      title: '蓝色探索',
      description: `海洋与计算中心是浙江大学跨学科研究的重要平台。
浙江大学海洋学院成立于1992年，致力于海洋科学研究和技术创新。
中心结合海洋科学与计算技术，开展海洋大数据、海洋工程等研究。
向海图强，探索深蓝，为海洋强国战略贡献浙大力量。`,
      image: 'icons/lab.png',
      icon: 'icons/lab.png',
      audioPattern: '海浪声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'basketball_gym_puzzle': {
      title: '篮球热潮',
      description: `篮球馆是紫金港校区最热门的运动场所之一，场场爆满。
浙江大学篮球队在CUBA联赛中屡创佳绩，培养出多名职业球员。
这里见证了无数场激烈的对决和青春的汗水。
篮球文化已融入浙大校园生活，成为学子们最爱的运动之一。`,
      image: 'icons/sport.png',
      icon: 'icons/sport.png',
      audioPattern: '篮球弹跳声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'bifeng_ziyun_puzzle': {
      title: '碧峰紫云',
      description: `碧峰紫云是紫金港校区的学生宿舍区，以诗意命名。
宿舍楼群环绕绿地而建，环境优美，生活便利。
这里居住着数千名本科生，是校园生活的温馨港湾。
宿舍楼下的夜宵摊、自习室承载着学子们的青春记忆。`,
      image: 'icons/dorm.png',
      icon: 'icons/dorm.png',
      audioPattern: '谈笑声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'lantian_puzzle': {
      title: '蓝田日暖',
      description: `蓝田宿舍区是紫金港校区规模最大的学生生活区之一。
"蓝田"取自"蓝田日暖玉生烟"，寓意温暖美好。
区内配套齐全，有食堂、超市、快递站等生活设施。
这里是学子们的第二个家，记录着大学四年的点滴时光。`,
      image: 'icons/dorm.png',
      icon: 'icons/dorm.png',
      audioPattern: '自行车铃声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'gangwan_puzzle': {
      title: '港湾温情',
      description: `港湾宿舍区因地处校园水系旁，如港湾般宁静而得名。
这里是研究生和部分本科生的住宿区，环境清幽。
傍晚时分，学生们常在湖边散步，享受难得的闲暇时光。
港湾是心灵的栖息地，给予学子们温暖与安宁。`,
      image: 'icons/dorm.png',
      icon: 'icons/dorm.png',
      audioPattern: '蛙鸣声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'danyang_puzzle': {
      title: '丹阳朝霞',
      description: `丹阳宿舍区以"丹阳"命名，寓意朝阳初升、朝气蓬勃。
这里是本科生的主要住宿区，楼栋整洁，设施完善。
每天清晨，学生们从这里出发，奔赴教室开始新的一天。
丹阳见证了无数浙大学子的成长与蜕变。`,
      image: 'icons/dorm.png',
      icon: 'icons/dorm.png',
      audioPattern: '闹钟声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'qingxi_puzzle': {
      title: '青溪潺潺',
      description: `青溪宿舍区临近校园水系，环境清幽雅致。
"青溪"取自王维诗句"言入黄花川，每逐青溪水"，诗意盎然。
这里远离喧嚣，是静心学习的好去处。
溪水潺潺，书香悠悠，青溪是浙大校园的世外桃源。`,
      image: 'icons/dorm.png',
      icon: 'icons/dorm.png',
      audioPattern: '溪水声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'cuibai_puzzle': {
      title: '翠柏苍苍',
      description: `翠柏宿舍区绿树环绕，柏树苍翠，环境宜人。
"翠柏"象征着坚韧不拔、四季常青的精神品质。
区内道路整洁，花草繁茂，是校园内最美的宿舍区之一。
翠柏守护着学子们的梦想，见证着青春的成长。`,
      image: 'icons/dorm.png',
      icon: 'icons/dorm.png',
      audioPattern: '树叶沙沙声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'baisha_puzzle': {
      title: '白沙如雪',
      description: `白沙宿舍区以洁白细腻的意象命名，给人以纯净之感。
这里是高年级学生和研究生的住宿区，氛围安静。
区内的白沙亭是学生们晨读、交流的热门地点。
白沙如雪，记录着浙大人的纯真岁月。`,
      image: 'icons/dorm.png',
      icon: 'icons/dorm.png',
      audioPattern: '读书声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'international_student_apartment_puzzle': {
      title: '国际交流',
      description: `留学生公寓是浙江大学国际化办学的窗口，居住着来自世界各地的学子。
浙江大学与全球200多所高校建立合作关系，每年接收数千名国际学生。
这里举办各类文化交流活动，促进中外学生相互了解。
多元文化在此交融，展现浙大的国际视野与开放胸怀。`,
      image: 'icons/dorm.png',
      icon: 'icons/dorm.png',
      audioPattern: '多语言交谈声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'qizhen_hotel_puzzle': {
      title: '启真迎客',
      description: `启真酒店是浙江大学紫金港校区的接待酒店，以"启真"命名。
"启真"取自校歌"启真厚德"，意为追求真理、启迪智慧。
酒店接待来访学者、会议代表和校友，是学校对外交流的重要窗口。
这里见证了无数学术交流与合作，传递着浙大的热情好客。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '门铃声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'qizhen_lake_puzzle': {
      title: '启真湖 紫金港心脏',
      description: `启真湖是紫金港校区的核心景观，水域面积广阔，景色优美。
湖中栖息着黑天鹅家族，成为浙大的"网红"明星，深受师生喜爱。
湖畔设有亲水平台和步道，是休闲散步、晨读锻炼的热门地点。
启真湖承载着"启真厚德"的校训精神，是浙大人的精神家园。`,
      image: 'icons/west_campus.png',
      icon: 'icons/west_campus.png',
      audioPattern: '天鹅叫声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'small_theater_puzzle': {
      title: '小剧场大舞台',
      description: `小剧场是紫金港校区的文艺演出中心，可容纳数百名观众。
这里举办话剧、音乐会、舞蹈表演等各类文艺活动。
学生社团在此排练演出，展现青春风采和艺术才华。
小剧场是浙大校园文化的缩影，承载着丰富的艺术记忆。`,
      image: 'icons/theater.png',
      icon: 'icons/theater.png',
      audioPattern: '音乐声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'west_teaching_puzzle': {
      title: '西教晨读',
      description: `西教是紫金港校区的主要教学楼群之一，教室宽敞明亮。
每天清晨，朗朗读书声从西教传出，开启新一天的学习生活。
这里开设各类公共课程和专业课程，是知识传授的重要场所。
西教见证了无数学子的求学之路，承载着浙大的教学传统。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '上课铃声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'nanhua_garden_puzzle': {
      title: '南华古韵',
      description: `南华园是紫金港校区内独具特色的古典园林，2005年落成。
园内建筑为明清古建移建而来，亭台楼阁、曲径通幽，古韵盎然。
"南华"取自《庄子》南华经，寓意逍遥自在、天人合一。
这里是师生们休闲赏景、感受传统文化的绝佳去处。`,
      image: 'icons/west_campus.png',
      icon: 'icons/west_campus.png',
      audioPattern: '古筝声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'pharmacy_college_puzzle': {
      title: '药学传承',
      description: `药学院是浙江大学药学教育和研究的核心基地，历史悠久。
学院在药物化学、药理学、药物分析等领域具有显著优势。
师生们致力于新药研发，为人类健康事业贡献力量。
药学院培养了大批药学精英，推动中国药学事业发展。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '药片摇晃声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'agricultural_medical_library_puzzle': {
      title: '农医书香',
      description: `图书馆农医分馆是浙江大学农学、医学领域的专业图书馆。
馆藏涵盖农业科学、临床医学、基础医学等专业文献资源。
图书馆为农学院、医学院师生提供专业的文献服务和学术支持。
这里汇聚了农医领域的知识精华，滋养着一代代专业人才。`,
      image: 'icons/basic_library.png',
      icon: 'icons/basic_library.png',
      audioPattern: '翻书声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'life_science_college_puzzle': {
      title: '生命奥秘',
      description: `生命科学学院是浙江大学生物学研究和教学的重要基地。
学院在植物学、动物学、微生物学等领域成果丰硕。
科研人员探索生命的奥秘，从基因到生态系统，层层深入。
生科院培养了一大批生命科学领域的杰出人才。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: 'DNA螺旋声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'agricultural_college_puzzle': {
      title: '农学百年',
      description: `农学院是浙江大学历史最悠久的学院之一，源于1910年创办的浙江农业教员养成所。
浙江大学农学学科在国内享有盛誉，培养了多位院士和农业专家。
学院致力于现代农业研究，推动农业科技创新和乡村振兴。
"强农兴农"是农学院人的使命与担当。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '田野风声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'environmental_resource_college_puzzle': {
      title: '绿水青山',
      description: `环境与资源学院致力于环境保护和资源可持续利用研究。
学院在环境科学、资源科学、生态学等领域具有鲜明特色。
师生们践行"绿水青山就是金山银山"理念，守护美丽中国。
环资学院是生态文明建设的重要力量。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '鸟鸣声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'animal_science_college_puzzle': {
      title: '动物科学',
      description: `动物科学学院是浙江大学动物科学领域的人才培养和科研基地。
学院在动物遗传育种、动物营养、动物医学等方面成果显著。
科研人员致力于畜牧业现代化和动物福利研究。
动科院为保障国家粮食安全和畜牧业发展贡献力量。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '动物叫声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'bioengineering_food_college_puzzle': {
      title: '食安天下',
      description: `生物系统工程与食品科学学院是交叉学科的创新平台。
学院融合生物工程、食品科学等学科，开展前沿研究。
科研人员致力于食品安全、生物制造等领域的创新突破。
生工食品学院守护"舌尖上的安全"，服务健康中国战略。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '搅拌声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'nano_building_puzzle': {
      title: '纳米之窗',
      description: `纳米楼现为浙江大学行政服务办事大厅，提供一站式服务。
楼名源于浙江大学在纳米科技领域的突出研究成果。
这里集中了教务、财务、后勤等各类服务窗口，方便师生办事。
纳米楼是浙大服务师生的窗口，体现"以学生为中心"的理念。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '打印机声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'east_teaching_puzzle': {
      title: '东教求知',
      description: `东教是紫金港校区的另一主要教学楼群，与西教遥相呼应。
这里开设各类专业课程，是各学院教学活动的重要场所。
教室配备现代化教学设备，支持多媒体教学和互动学习。
东教与西教共同承载着浙大的教学使命，培育英才。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '投影仪声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'undergraduate_college_puzzle': {
      title: '本科教育',
      description: `本科生院是浙江大学本科教学管理的核心机构。
浙江大学本科教育质量优异，多次获得国家级教学成果奖。
本科生院统筹课程设置、教学质量、学籍管理等工作。
"以人为本、整合培养"是浙大本科教育的理念。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '敲键盘声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'foreign_language_college_puzzle': {
      title: '外语之桥',
      description: `外国语学院是浙江大学外语教学和研究的重要基地。
学院开设英语、日语、德语、法语、俄语等多个语种专业。
师生们架起中外文化交流的桥梁，传播中国声音。
外国语学院培养具有国际视野的复合型外语人才。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '多语言朗读声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'mengmingwei_building_puzzle': {
      title: '蒙民伟楼',
      description: `蒙民伟楼由香港爱国实业家蒙民伟先生捐资建设。
蒙民伟先生热心教育事业，多次向浙江大学捐赠支持学校发展。
楼内设有教室、实验室和办公空间，是重要的教学科研场所。
这座建筑见证了浙大与海内外校友的深厚情谊。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '电梯声',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'chengyue_area_puzzle': {
      title: '澄月映照',
      description: `澄月区是紫金港校区的生活休闲区域，环境优雅宁静。
"澄月"取自"澄江静如练，长月照高楼"的诗意意象。
区内有餐饮、购物、休闲等配套设施，满足师生生活需求。
澄月区是校园生活的温馨角落，承载着学子们的日常点滴。`,
      image: 'icons/west_campus.png',
      icon: 'icons/west_campus.png',
      audioPattern: '月光曲',
      hidden: true,
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    }
  },

  emotionEmojis: {
    like: '👍',
    happy: '😊',
    love: '😍',
    sad: '😢',
    cry: '😭',
    angry: '😡',
    surprised: '😲',
    confused: '🤔'
  },

  achievements: [
    {
      id: 'first_explore',
      title: '初入紫金港',
      description: '探索第一个建筑',
      icon: '🏛️',
      condition: { type: 'explored', count: 1 },
      unlocked: false
    },
    {
      id: 'explorer_10',
      title: '校园探索者',
      description: '探索10个建筑',
      icon: '🗺️',
      condition: { type: 'explored', count: 10 },
      unlocked: false
    },
    {
      id: 'explorer_all',
      title: '紫金港通',
      description: '探索所有43个建筑',
      icon: '🏆',
      condition: { type: 'explored', count: 43 },
      unlocked: false
    },
    {
      id: 'hidden_finder',
      title: '彩蛋猎人',
      description: '解锁一个隐藏谜题',
      icon: '🎭',
      condition: { type: 'hidden_puzzle', count: 1 },
      unlocked: false
    },
    {
      id: 'level_master',
      title: '关卡大师',
      description: '完成所有6个关卡',
      icon: '🎓',
      condition: { type: 'level', count: 6 },
      unlocked: false
    }
  ],

  quizQuestions: [
    {
      id: 'q1',
      buildingId: 'qiushi_plaque',
      question: '求是书院创办于哪一年？',
      options: ['1897年', '1902年', '1911年', '1928年'],
      correctAnswer: 0,
      explanation: '求是书院创办于1897年，是浙江大学的前身。'
    },
    {
      id: 'q2',
      buildingId: 'zju_library',
      question: '浙江大学图书馆藏书量超过多少册？',
      options: ['300万册', '500万册', '700万册', '1000万册'],
      correctAnswer: 2,
      explanation: '紫金港主馆藏书量超过700万册，是华东地区最大的高校图书馆之一。'
    },
    {
      id: 'q3',
      buildingId: 'qizhen_lake',
      question: '启真湖中栖息着什么"网红"动物？',
      options: ['白鹭', '黑天鹅', '鸳鸯', '锦鲤'],
      correctAnswer: 1,
      explanation: '启真湖中栖息着黑天鹅家族，成为浙大的"网红"明星。'
    },
    {
      id: 'q4',
      buildingId: 'nanhua_garden',
      question: '南华园于哪一年落成？',
      options: ['2002年', '2005年', '2008年', '2010年'],
      correctAnswer: 1,
      explanation: '南华园于2005年落成，园内建筑为明清古建移建而来。'
    },
    {
      id: 'q5',
      buildingId: 'zju_crescent_building',
      question: '月牙楼被学生亲切地称为什么？',
      options: ['蟹老板', '月亮船', '金色大厅', '知识殿堂'],
      correctAnswer: 0,
      explanation: '月牙楼因独特的弧形设计，被学生亲切地称为"蟹老板"。'
    }
  ],

  duoTasks: [
    {
      id: 'duo_1',
      title: '求是三地标',
      description: '与好友一起解锁求是牌匾、求是大讲堂、求是湖',
      buildings: ['qiushi_plaque', 'qiushi_auditorium', 'qiushi_lake'],
      reward: '求是精神徽章',
      completed: false
    },
    {
      id: 'duo_2',
      title: '知识殿堂之旅',
      description: '与好友一起探索图书馆、成均苑、月牙楼',
      buildings: ['zju_library', 'chengjun_yuan', 'zju_crescent_building'],
      reward: '学者徽章',
      completed: false
    },
    {
      id: 'duo_3',
      title: '自然之声',
      description: '与好友一起探索启真湖、南华园、澄月区',
      buildings: ['qizhen_lake', 'nanhua_garden', 'chengyue_area'],
      reward: '自然探索者徽章',
      completed: false
    }
  ]
};
