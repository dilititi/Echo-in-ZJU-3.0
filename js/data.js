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
      position: [500, 690],
      description: '旧管理院大楼见证了浙江大学悠久的历史，是校园内最具代表性的建筑之一。'
    },
    qiushi_plaque: {
      name: '求是牌匾',
      image: 'layers/求是牌匾.png',
      position: [300, 180],
      description: '求是牌匾矗立于求是大讲堂前，承载着"求是创新"的校训精神。'
    },
    qiushi_auditorium: {
      name: '求是大讲堂',
      image: 'layers/求是大讲堂.png',
      position: [290, 120],
      description: '求是大讲堂是浙江大学的重要文化场所，举办过无数次学术讲座和文化活动。'
    },
    old_zju_gate: {
      name: '浙江大学旧校门',
      image: 'layers/浙江大学旧校门.png',
      position: [350, 80],
      description: '浙江大学旧校门是学校历史的象征，见证了无数浙大学子的青春岁月。'
    },
    zju_gymnasium: {
      name: '浙江大学体育馆',
      image: 'layers/浙江大学体育馆.png',
      position: [450, 600],
      description: '浙江大学体育馆是校园体育活动的中心，承载着学生们的运动热情。'
    },
    zju_library: {
      name: '浙江大学图书馆',
      image: 'layers/teaching_area.png',
      position: [550, 550],
      description: '浙江大学图书馆是知识的殿堂，藏书丰富，是学子们求学的圣地。'
    },
    zju_crescent_building: {
      name: '浙江大学月牙楼',
      image: 'layers/浙江大学月牙楼.png',
      position: [480, 680],
      description: '浙江大学月牙楼因其独特的月牙形状而得名，是校园的标志性建筑之一。也被称为"蟹老板"'
    }
  },

  puzzleEvents: {
    'default_1': {
      title: '校园图书馆开放',
      description: `2024年9月1日，学校新图书馆正式开放。
这座现代化的图书馆拥有丰富的藏书和舒适的阅读环境。
同学们都很喜欢来这里学习和阅读。
图书馆每天开放12小时，欢迎大家前来参观！`,
      image: 'icons/basic_library.png',
      icon: 'icons/basic_library.png',
      audioPattern: '翻书声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'default_2': {
      title: '校庆活动',
      description: `今年是学校建校50周年。
学校举办了盛大的庆祝活动。
校友们纷纷回到母校，共忆美好时光。
现场还有精彩的文艺表演！`,
      image: 'icons/west_campus.png',
      icon: 'icons/west_campus.png',
      audioPattern: '天鹅叫声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'default_3': {
      title: '新教学楼落成',
      description: `经过一年的建设，新教学楼终于完工了。
这座教学楼拥有现代化的教学设施。
宽敞明亮的教室让同学们学习更加舒适。
新学期大家都可以在新教学楼上课啦！`,
      image: 'icons/office.png',
      icon: 'icons/office.png',
      audioPattern: '写字声',
      reactions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 },
      userReaction: null,
      isUnlocked: false,
      isPlayed: false
    },
    'default_4': {
      title: '校园运动会',
      description: `一年一度的校园运动会在操场举行。
同学们积极参与各项比赛。
赛场上充满了青春的活力和拼搏的精神。
最终班级总分第一名获得了奖杯！`,
      image: 'icons/cafe.png',
      icon: 'icons/cafe.png',
      audioPattern: '拉拉链',
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
  }
};
