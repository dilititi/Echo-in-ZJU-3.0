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
      name: '基图副楼',
      image: 'layers/旧管理院大楼.png',
      position: [520, 320],
      description: '基图旁边那幢高楼，曾经是行政楼、管理学院大楼，现在正式名称是图书信息C楼，目前是历史学院、继续教育管理处、校工会等多个单位共同使用的拼好楼。——98'
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
      description: '求是大讲堂是浙江大学的重要文化场所，只用于举办重大学术讲座和文化活动。'
    },
    old_zju_gate: {
      name: '浙江大学西溪校区校门',
      image: 'layers/浙江大学旧校门.png',
      position: [220, 150],
      description: '西溪校区的校门是学校历史的象征，见证了无数浙大学子的青春岁月。'
    },
    zju_gymnasium: {
      name: '浙江大学体育馆',
      image: 'layers/浙江大学体育馆.png',
      position: [680, 380],
      description: '浙江大学体育馆是校园体育活动的中心，承载着学生们的运动热情。这里曾经举办过亚运会的游泳赛事哦！'
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
      description: '浙江大学月牙楼因其独特的月牙形状而得名，是校园的标志性建筑之一。另有别称"蟹老板"——看着像不像《海绵宝宝》里的蟹老板？'
    },
    south_gate: {
      name: '南大门',
      image: 'layers/南门.jpg',
      position: [220, 920],
      description: '南大门是浙江大学紫金港校区的主要出入口之一。'
    },
    medical_college: {
      name: '医学院',
      image: 'layers/医学院.jpg',
      position: [480, 680],
      description: '医学院是浙江大学医学教育的重要基地。'
    },
    architectural_college: {
      name: '建筑工程学院',
      image: 'layers/建筑工程学院.jpg',
      position: [440, 320],
      description: '建筑工程学院是建筑工程人才培养的摇篮。'
    },
    qizhen_hotel: {
      name: '启真酒店',
      image: 'layers/圆正启真酒店.jpg',
      position: [870, 320],
      description: '启真酒店是校园内的接待酒店。'
    },
    nanhua_garden: {
      name: '南华园',
      image: 'layers/南华园.jpg',
      position: [210, 720],
      description: '南华园是浙江大学南华园是位于紫金港校区启真湖西畔的明清古建筑群，为武义县捐赠的两幢明末民居复建而成，2005 年建成，既是校园文化地标（紫金十景之 "南华梦竹"），也是教职工活动中心与师生文化交流场所。'
    },
    pharmacy_college: {
      name: '药学院',
      image: 'layers/药学院.jpg',
      position: [270, 420],
      description: '药学院是药学教育和研究的重镇。'
    },
    life_science_college: {
      name: '生命科学学院',
      image: 'layers/生命科学学院.jpg',
      position: [520, 720],
      description: '生命科学学院是生命科学研究和教学的重要基地。'
    },
    agricultural_college: {
      name: '农业与生物技术学院',
      image: 'layers/农业与生物技术学院.jpg',
      position: [570, 770],
      description: '农业与生物技术学院是浙江大学历史悠久的学院之一。'
    },
    environmental_resource_college: {
      name: '环境与资源学院',
      image: 'layers/环境与资源学院.jpg',
      position: [620, 720],
      description: '环境与资源学院是环境与资源研究的核心力量。'
    },
    animal_science_college: {
      name: '动物科学学院',
      image: 'layers/动物科学学院.jpg',
      position: [670, 770],
      description: '动物科学学院是动物科学研究和人才培养的重要基地。'
    },
    bioengineering_food_college: {
      name: '生物系统工程与食品科学学院',
      image: 'layers/生物系统工程与食品科学学院.jpg',
      position: [720, 720],
      description: '生物系统工程与食品科学学院是是浙大农业工程与食品科学领域的核心研究型学院，致力于以工程技术与生命科学交叉融合解决农业与食品领域重大问题。'
    },
    nano_building: {
      name: '纳米楼（行政服务办事大厅）',
      image: 'layers/纳米楼（行政服务大厅）.jpg',
      position: [670, 620],
      description: '纳米楼是行政服务办事大厅，提供一站式服务。打印文件都在这里哦！'
    },
    foreign_language_college: {
      name: '外国语学院',
      image: 'layers/外国语学院.jpg',
      position: [570, 220],
      description: '外国语学院是外语教学和研究的重要基地。'
    },
    mengmingwei_building: {
      name: '蒙明伟楼',
      image: 'layers/蒙明伟楼.jpg',
      position: [640, 320],
      description: '蒙明伟楼是校园内的标志性建筑。'
    },
    public_administration_college: {
      name: '公共管理学院',
      image: 'layers/公共管理学院.jpg',
      position: [380, 480],
      description: '公共管理学院致力于公共管理研究和人才培养，服务国家治理现代化。'
    },
    zhu_kezhen_college: {
      name: '竺可桢学院',
      image: 'layers/竺可桢学院.jpg',
      position: [410, 510],
      description: '竺可桢学院是浙江大学拔尖创新人才培养的荣誉学院，以竺可桢老校长命名。'
    },
    humanities_college: {
      name: '人文学院',
      image: 'layers/文学院.jpg',
      position: [180, 550],
      description: '人文学院现已分拆为文学院、历史学院、哲学学院，但三个学院仍然合用成均苑4幢这一栋楼。更早之前，艺古学院也是从人文学院拆出去的。——98'
    },
    education_college: {
      name: '教育学院',
      image: 'layers/教育学院.jpg',
      position: [220, 610],
      description: '教育学院是浙江大学教育学院是中国现代教育学科的重要发源地之一，前身为 1897 年求是书院与育英书院的相关学科，1928 年和 1952 年分别完成教育学系与体育学系建制，均为中国现代大学中最早的教育、体育学科建制之一浙江大学教育学院。'
    },
    art_archaeology_museum: {
      name: '艺术与考古博物馆',
      image: 'layers/艺博馆.jpg',
      position: [320, 600],
      description: '艺术与考古博物馆是浙江大学重要的文化展示和研究机构。'
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
      audioPattern: '走路声',
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
      audioPattern: '踩石子声',
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
      audioPattern: '食堂声',
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
      audioPattern: '走楼梯声',
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
      audioPattern: '踩木地板声',
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
      audioPattern: '蝉鸣声',
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
      audioPattern: '踩石子声',
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
      audioPattern: '敲键盘声',
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
      audioPattern: '踩树叶声',
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
      audioPattern: '电梯声',
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
      audioPattern: '蛙鸣声',
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
      audioPattern: '摇晃水杯声',
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
      audioPattern: '蝉鸣声',
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
      audioPattern: '踩树叶声',
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
      audioPattern: '蝉鸣声',
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
      audioPattern: '蛙鸣声',
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
      audioPattern: '食堂声',
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
      audioPattern: '踩石子声',
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
    'public_administration_college_puzzle': {
      title: '公共治理',
      description: `公共管理学院致力于公共管理研究和人才培养，服务国家治理现代化。
学院在公共政策、行政管理、社会治理等领域具有显著优势。
师生们积极参与政府咨询和社会服务，贡献治理智慧。
公管学院是培养公共事业领导者的重要摇篮。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '食堂声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'zhu_kezhen_college_puzzle': {
      title: '竺可桢精神',
      description: `竺可桢学院是浙江大学拔尖创新人才培养的荣誉学院，以竺可桢老校长命名。
竺可桢先生是著名气象学家、地理学家，曾长期担任浙大校长，带领浙大西迁办学。
学院汇聚全校最优秀的本科生，提供个性化培养方案和资源。
竺院学子以严谨治学、追求卓越为荣，传承竺可桢精神。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '翻书声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'humanities_college_puzzle': {
      title: '人文风华',
      description: `人文学院现已分拆为文学院、历史学院、哲学学院，但三个学院仍合用成均苑4幢。
浙大人文学科历史悠久，培养了众多杰出的文史哲学者。
这里传承着中华文脉，探索人类精神世界的深度与广度。
人文之光照亮校园，守护文明的根与魂。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '踩树叶声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'education_college_puzzle': {
      title: '教育传承',
      description: `教育学院是中国现代教育学科的重要发源地之一，前身为1897年求是书院相关学科。
1928年和1952年分别完成教育学系与体育学系建制，均为国内最早建制之一。
学院在教育理论、课程与教学、教育心理等领域具有深厚积累。
教育学院培养了一代又一代优秀教育工作者，推动中国教育事业发展。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '走楼梯声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'art_archaeology_museum_puzzle': {
      title: '艺术考古',
      description: `艺术与考古博物馆是浙江大学重要的文化展示和研究机构。
馆内收藏有丰富的艺术品和考古文物，是研究中国艺术史的重要基地。
博物馆定期举办展览和学术活动，向师生和公众开放。
这里是连接历史与现代、艺术与学术的文化桥梁。`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '踩石子声',
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
      description: '探索所有26个建筑',
      icon: '🏆',
      condition: { type: 'explored', count: 26 },
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
      buildingId: 'nanhua_garden',
      question: '南华园于哪一年落成？',
      options: ['2002年', '2005年', '2008年', '2010年'],
      correctAnswer: 1,
      explanation: '南华园于2005年落成，园内建筑为明清古建移建而来。'
    },
    {
      id: 'q4',
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
      description: '与好友一起解锁求是牌匾、求是大讲堂、南华园',
      buildings: ['qiushi_plaque', 'qiushi_auditorium', 'nanhua_garden'],
      reward: '求是精神徽章',
      completed: false
    },
    {
      id: 'duo_2',
      title: '知识殿堂之旅',
      description: '与好友一起探索图书馆、艺博馆、月牙楼',
      buildings: ['zju_library', 'art_archaeology_museum', 'zju_crescent_building'],
      reward: '学者徽章',
      completed: false
    },
    {
      id: 'duo_3',
      title: '自然之声',
      description: '与好友一起探索南华园、教育学院、公共管理学院',
      buildings: ['nanhua_garden', 'education_college', 'public_administration_college'],
      reward: '自然探索者徽章',
      completed: false
    }
  ]
};
