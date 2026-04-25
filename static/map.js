/**
 * 交互式校园地图应用
 * 功能：
 * 1. 显示校园地图
 * 2. 在地图上添加带有图标的标记
 * 3. 录制和上传音频
 * 4. 播放音频
 * 5. 管理音频文件
 */

// 模块化设计：将功能按模块划分
const CampusMapApp = {
    // 配置
    config: {
        serverUrl: (window.location.origin && window.location.origin !== 'file://') ? window.location.origin : 'http://127.0.0.1:8081',
        maxMarkers: 50,
        maxDefaultAudioMarkers: 20,
        debounceWait: 300,
        audioListCacheTimeout: 30000
    },

    // 谜题事件数据 - 确保默认图标、默认音频、谜题全局唯一绑定
    puzzleEvents: {
        'default_1': {
            title: '校园图书馆开放',
            description: `2024年9月1日，学校新图书馆正式开放。
这座现代化的图书馆拥有丰富的藏书和舒适的阅读环境。
同学们都很喜欢来这里学习和阅读。
图书馆每天开放12小时，欢迎大家前来参观！`,
            image: 'icons/basic_library.png',
            icon: 'icons/basic_library.png',
            audioPattern: '翻书声', // 匹配的音频文件名模式
            reactions: {
                like: 0,
                happy: 0,
                love: 0,
                sad: 0,
                cry: 0,
                angry: 0,
                surprised: 0,
                confused: 0
            },
            userReaction: null,
            isUnlocked: false, // 谜题是否解锁
            isPlayed: false // 音频是否播放完成
        },
        'default_2': {
            title: '校庆活动',
            description: `今年是学校建校50周年。
学校举办了盛大的庆祝活动。
校友们纷纷回到母校，共忆美好时光。
现场还有精彩的文艺表演！`,
            image: 'icons/west_campus.png',
            icon: 'icons/west_campus.png',
            audioPattern: '天鹅叫声', // 匹配的音频文件名模式
            reactions: {
                like: 0,
                happy: 0,
                love: 0,
                sad: 0,
                cry: 0,
                angry: 0,
                surprised: 0,
                confused: 0
            },
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
            audioPattern: '写字声', // 匹配的音频文件名模式
            reactions: {
                like: 0,
                happy: 0,
                love: 0,
                sad: 0,
                cry: 0,
                angry: 0,
                surprised: 0,
                confused: 0
            },
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
            audioPattern: '拉拉链', // 匹配的音频文件名模式
            reactions: {
                like: 0,
                happy: 0,
                love: 0,
                sad: 0,
                cry: 0,
                angry: 0,
                surprised: 0,
                confused: 0
            },
            userReaction: null,
            isUnlocked: false,
            isPlayed: false
        }
    },

    // 关卡系统
    levels: [
        {
            id: 1,
            title: '认识校园',
            description: '欢迎来到声音校园！让我们从校门口开始探索吧。',
            target: '认识界面 + 移动地图',
            unlockFeatures: ['mapDrag', 'mapZoom'],
            buildings: ['schoolGate'],
            elements: ['map']
        },
        {
            id: 2,
            title: '放置标记',
            description: '太棒了！现在让我们学习如何在地图上放置标记。',
            target: '放置第一个标记',
            unlockFeatures: ['addMarker', 'selectIcon'],
            buildings: ['schoolGate', 'library'],
            elements: ['map', 'iconSelector']
        },
        {
            id: 3,
            title: '录制声音',
            description: '很好！现在让我们录制一段属于你自己的声音。',
            target: '录制/上传一段音频',
            unlockFeatures: ['recordAudio', 'uploadAudio'],
            buildings: ['schoolGate', 'library', 'cafe'],
            elements: ['map', 'iconSelector', 'audioPanel']
        },
        {
            id: 4,
            title: '绑定声音',
            description: '厉害！现在让我们把声音和标记绑定在一起。',
            target: '绑定音频到标记',
            unlockFeatures: ['bindAudio'],
            buildings: ['schoolGate', 'library', 'cafe', 'sportsField'],
            elements: ['map', 'iconSelector', 'audioPanel', 'bindButton']
        },
        {
            id: 5,
            title: '声音谜题',
            description: '精彩！现在让我们解锁校园里的声音谜题。',
            target: '解锁系统声音谜题',
            unlockFeatures: ['puzzles'],
            buildings: ['schoolGate', 'library', 'cafe', 'sportsField', 'teachingBuilding'],
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
    
    // 建筑数据
    buildings: {
        schoolGate: {
            name: '校门口',
            icon: 'icons/west_campus.png',
            position: [300, 500]
        },
        library: {
            name: '图书馆',
            icon: 'icons/basic_library.png',
            position: [200, 300]
        },
        cafe: {
            name: '咖啡馆',
            icon: 'icons/office.png',
            position: [400, 200]
        },
        sportsField: {
            name: '运动场',
            icon: 'icons/cafe.png',
            position: [600, 600]
        },
        teachingBuilding: {
            name: '教学楼',
            icon: 'icons/west_campus.png',
            position: [700, 300]
        }
    },
    
    // 用户进度
    userProgress: {
        currentLevel: 1,
        completedLevels: [],
        unlockedBuildings: ['schoolGate'],
        unlockedFeatures: []
    },
    
    // 社交数据
    socialData: {
        userNickname: '探索者',
        deviceId: '',
        messageWall: [],
        emotionRanking: []
    },

    // 情绪表情数据
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
    
    // 用户自定义事件
    userEvents: {},
    
    // 音频与事件的绑定关系
    audioEventBindings: {},
    
    // 当前正在绑定的音频文件
    currentBindingAudio: null,
    
    // 当前选中的绑定事件ID
    selectedBindingEventId: null,
    
    // 用户音频笔记
    audioNotes: {},
    
    // 当前正在编辑笔记的标记
    currentNoteMarker: null,
    
    // 状态
    state: {
        map: null,
        markers: new Map(),
        selectedIcon: null,
        selectedAudio: null,
        currentAudio: null,
        isPlaying: false,
        currentPlayButton: null,
        mediaRecorder: null,
        audioChunks: [],
        riddleCounter: 0,
        defaultAudioMarkers: [],
        markerCount: 0,
        isUpdatingAudioList: false,
        audioPool: new Map(),
        lastMousePosition: null,
        selectedMarker: null,
        audioListCache: null,
        audioListCacheTime: 0,
        temporaryIcon: null,
        mapInitializing: true
    },
    
    // 为删除功能引导生成的标记
    deleteGuideMarker: null,
    
    // DOM元素
    elements: {
        recordButton: null,
        stopButton: null,
        audioNameInput: null,
        recordingStatus: null,
        audioFiles: null,
        defaultAudioFiles: null,
        uploadButton: null,
        uploadAudioNameInput: null,
        audioFileInput: null
    },
    
    // 初始化应用
    init() {
        this.initElements();
        this.initMap();
        this.initEventListeners();
        this.loadUserState();
        this.loadEventReactions();
        this.loadUserEvents();
        this.loadAudioEventBindings();
        this.loadAudioNotes();
        
        // 初始化社交数据
        this.initSocialData();
        
        // 解析分享链接
        this.parseShareLink();
        
        this.loadMarkers();
        this.updateAudioList();
        
        // 显示欢迎弹窗
        console.log('Checking welcomeModal element...');
        console.log('this.elements.welcomeModal:', this.elements.welcomeModal);
        if (this.elements.welcomeModal) {
            console.log('Setting welcomeModal display to flex');
            this.elements.welcomeModal.style.display = 'flex';
            console.log('welcomeModal display style:', this.elements.welcomeModal.style.display);
        } else {
            console.error('welcomeModal element not found!');
        }
    },
    
    // 初始化DOM元素
    initElements() {
        this.elements.recordButton = document.getElementById('recordButton');
        this.elements.stopButton = document.getElementById('stopButton');
        this.elements.audioNameInput = document.getElementById('audioName');
        this.elements.recordingStatus = document.getElementById('recordingStatus');
        this.elements.audioFiles = document.getElementById('audioFiles');
        this.elements.defaultAudioFiles = document.getElementById('defaultAudioFiles');
        this.elements.uploadButton = document.getElementById('uploadButton');
        this.elements.uploadAudioNameInput = document.getElementById('uploadAudioName');
        this.elements.audioFileInput = document.getElementById('audioFileInput');
        this.elements.closeModal = document.getElementById('closeModal');
        this.elements.welcomeModal = document.getElementById('welcomeModal');
        this.elements.startGuide = document.getElementById('startGuide');
        this.elements.guideModal = document.getElementById('guideModal');
        this.elements.guideTitle = document.getElementById('guideTitle');
        this.elements.guideContent = document.getElementById('guideContent');
        this.elements.guidePrev = document.getElementById('guidePrev');
        this.elements.guideNext = document.getElementById('guideNext');
        this.elements.guideClose = document.getElementById('guideClose');
        this.elements.guideOverlay = document.getElementById('guideOverlay');
        this.elements.resetButton = document.getElementById('resetButton');
        
        // 自定义事件相关元素
        this.elements.customEventTitle = document.getElementById('customEventTitle');
        this.elements.customEventDescription = document.getElementById('customEventDescription');
        this.elements.customEventIcon = document.getElementById('customEventIcon');
        this.elements.customEventIconFile = document.getElementById('customEventIconFile');
        this.elements.customEventImage = document.getElementById('customEventImage');
        this.elements.createCustomEventButton = document.getElementById('createCustomEventButton');
        
        // 绑定事件弹窗相关元素
        this.elements.bindEventModal = document.getElementById('bindEventModal');
        this.elements.bindEventList = document.getElementById('bindEventList');
        this.elements.cancelBindEventButton = document.getElementById('cancelBindEventButton');
        this.elements.confirmBindEventButton = document.getElementById('confirmBindEventButton');
        
        // 音频笔记弹窗相关元素
        this.elements.audioNoteModal = document.getElementById('audioNoteModal');
        this.elements.audioNoteText = document.getElementById('audioNoteText');
        this.elements.cancelAudioNoteButton = document.getElementById('cancelAudioNoteButton');
        this.elements.saveAudioNoteButton = document.getElementById('saveAudioNoteButton');
    },
    
    // 初始化地图
    initMap() {
        // 初始化地图 - 使用空白背景
        this.state.map = L.map('map', {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 3,
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            touchZoom: false
        });

        // 设置地图边界
        const bounds = [[0, 0], [1000, 1000]];
        
        // 设置地图视图到空白区域
        this.state.map.fitBounds(bounds);
        
        // 设置地图容器背景色
        document.getElementById('map').style.backgroundColor = '#f5f5f5';
        
        // 初始化建筑标记
        this.initBuildings();
        
        // 加载用户进度
        this.loadUserProgress();
        
        // 延迟应用关卡限制，确保地图完全初始化
        setTimeout(() => {
            console.log('Applying level restrictions after delay');
            // 应用当前关卡的功能限制
            this.applyLevelRestrictions();
            // 地图初始化完成
            this.state.mapInitializing = false;
            console.log('Map initialization completed, mapInitializing set to false');
        }, 500);
        
        // 添加说明
        L.control.attribution({
            prefix: '声音校园 - 第 ' + this.userProgress.currentLevel + ' 关'
        }).addTo(this.state.map);
    },
    
    // 初始化建筑标记
    initBuildings() {
        this.state.buildingMarkers = {};
    },
    
    // 加载用户进度
    loadUserProgress() {
        try {
            const savedProgress = localStorage.getItem('userProgress');
            if (savedProgress) {
                this.userProgress = JSON.parse(savedProgress);
            }
        } catch (error) {
            console.error('Failed to load user progress:', error);
        }
    },
    
    // 保存用户进度
    saveUserProgress() {
        try {
            localStorage.setItem('userProgress', JSON.stringify(this.userProgress));
        } catch (error) {
            console.error('Failed to save user progress:', error);
        }
    },
    
    // 初始化社交数据
    initSocialData() {
        if (!this.socialData.deviceId) {
            this.socialData.deviceId = 'user_' + Date.now();
        }
        this.loadSocialData();
    },
    
    // 加载社交数据
    loadSocialData() {
        try {
            const savedSocial = localStorage.getItem('socialData');
            if (savedSocial) {
                const saved = JSON.parse(savedSocial);
                this.socialData.messageWall = saved.messageWall || [];
                this.socialData.emotionRanking = saved.emotionRanking || [];
            }
        } catch (error) {
            console.error('Failed to load social data:', error);
        }
    },
    
    // 保存社交数据
    saveSocialData() {
        try {
            const toSave = {
                messageWall: this.socialData.messageWall,
                emotionRanking: this.socialData.emotionRanking
            };
            localStorage.setItem('socialData', JSON.stringify(toSave));
        } catch (error) {
            console.error('Failed to save social data:', error);
        }
    },
    
    // 添加留言到声音墙
    addMessageToWall(message, audioData) {
        const wallMessage = {
            id: Date.now(),
            nickname: this.socialData.userNickname,
            message: message.substring(0, 15),
            audioKey: audioData ? audioData.key : null,
            audioUrl: audioData ? audioData.url : null,
            timestamp: new Date().toLocaleString()
        };
        
        this.socialData.messageWall.unshift(wallMessage);
        if (this.socialData.messageWall.length > 10) {
            this.socialData.messageWall = this.socialData.messageWall.slice(0, 10);
        }
        
        this.saveSocialData();
    },
    
    // 更新情绪排行榜
    updateEmotionRanking(buildingId, emotionType) {
        let existing = this.socialData.emotionRanking.find(r => r.buildingId === buildingId);
        if (!existing) {
            existing = {
                buildingId: buildingId,
                emotions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 }
            };
            this.socialData.emotionRanking.push(existing);
        }
        
        existing.emotions[emotionType] = (existing.emotions[emotionType] || 0) + 1;
        this.saveSocialData();
    },
    
    // 生成分享链接
    generateShareLink(marker) {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        params.set('markerId', marker._leaflet_id);
        if (marker.getLatLng) {
            params.set('lat', marker.getLatLng().lat);
            params.set('lng', marker.getLatLng().lng);
        }
        if (marker.audioData && marker.audioData.url) {
            params.set('audio', marker.audioData.url);
        }
        return baseUrl + '?' + params.toString();
    },
    
    // 解析分享链接
    parseShareLink() {
        const params = new URLSearchParams(window.location.search);
        const lat = params.get('lat');
        const lng = params.get('lng');
        const audioUrl = params.get('audio');
        
        if (lat && lng) {
            this.state.map.setView([parseFloat(lat), parseFloat(lng)], 1);
            if (audioUrl) {
                setTimeout(() => {
                    this.playAudio(audioUrl);
                }, 1000);
            }
        }
    },
    
    // 应用当前关卡的功能限制
    applyLevelRestrictions() {
        console.log('applyLevelRestrictions called');
        const currentLevel = this.levels.find(l => l.id === this.userProgress.currentLevel);
        console.log('Current level:', currentLevel);
        if (!currentLevel) return;
        
        // 显示当前关卡的建筑
        this.showLevelBuildings(currentLevel);
        
        // 显示当前关卡的UI元素
        this.showLevelElements(currentLevel);
        
        // 启用当前关卡的地图操作
        this.enableLevelMapControls(currentLevel);
        
        // 如果有建筑显示，调整地图视图到第一个建筑位置
        if (Object.keys(this.state.buildingMarkers).length > 0) {
            const firstBuildingId = Object.keys(this.state.buildingMarkers)[0];
            const firstMarker = this.state.buildingMarkers[firstBuildingId];
            if (firstMarker) {
                console.log('Setting map view to first building:', firstBuildingId);
                this.state.map.setView(firstMarker.getLatLng(), 1);
            }
        }
        
        // 显示关卡提示
        this.showLevelInfo(currentLevel);
    },
    
    // 显示关卡信息提示
    showLevelInfo(level) {
        const infoDiv = document.createElement('div');
        infoDiv.id = 'level-info';
        infoDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 15px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 4000;
            text-align: center;
            max-width: 500px;
        `;
        infoDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #0078A8;">第 ${level.id} 关：${level.title}</h3>
            <p style="margin: 0; color: #666;">${level.description}</p>
            <p style="margin: 10px 0 0 0; font-weight: bold; color: #333;">目标：${level.target}</p>
            <button onclick="document.getElementById('level-info').style.display='none'" style="margin-top: 15px; padding: 8px 20px; background: #0078A8; color: white; border: none; border-radius: 5px; cursor: pointer;">知道了</button>
        `;
        document.body.appendChild(infoDiv);
    },
    
    // 显示当前关卡的建筑
    showLevelBuildings(level) {
        console.log('showLevelBuildings called, level:', level);
        
        // 清除之前的建筑标记
        Object.values(this.state.buildingMarkers || {}).forEach(marker => {
            this.state.map.removeLayer(marker);
        });
        this.state.buildingMarkers = {};
        
        let buildingsToShow = [];
        if (level.buildings.includes('all')) {
            buildingsToShow = Object.keys(this.buildings);
        } else {
            buildingsToShow = level.buildings;
        }
        
        console.log('Buildings to show:', buildingsToShow);
        
        // 显示当前关卡的建筑
        buildingsToShow.forEach(buildingId => {
            const building = this.buildings[buildingId];
            console.log('Processing building:', buildingId, building);
            if (building) {
                console.log('Creating marker for:', building.name, 'at position:', building.position);
                const icon = L.icon({
                    iconUrl: building.icon,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                });
                
                const marker = L.marker(building.position, {
                    icon: icon
                }).addTo(this.state.map);
                
                console.log('Marker created:', marker);
                
                marker.bindTooltip(building.name, { permanent: false });
                this.state.buildingMarkers[buildingId] = marker;
            }
        });
        
        console.log('Building markers added:', this.state.buildingMarkers);
    },
    
    // 显示当前关卡的UI元素
    showLevelElements(level) {
        const allElements = ['iconSelector', 'audioPanel', 'puzzleList', 'socialPanel'];
        
        let elementsToShow = [];
        if (level.elements.includes('all')) {
            elementsToShow = allElements;
        } else {
            elementsToShow = level.elements;
        }
        
        // 隐藏所有元素
        document.querySelectorAll('.element-panel').forEach(el => {
            el.style.display = 'none';
        });
        
        // 显示当前关卡的元素
        elementsToShow.forEach(elementId => {
            const element = document.getElementById(elementId + '-panel');
            if (element) {
                element.style.display = 'block';
            }
        });
    },
    
    // 启用当前关卡的地图操作
    enableLevelMapControls(level) {
        const canDrag = level.unlockFeatures.includes('mapDrag') || level.unlockFeatures.includes('all');
        const canZoom = level.unlockFeatures.includes('mapZoom') || level.unlockFeatures.includes('all');
        
        if (canDrag) {
            this.state.map.dragging.enable();
        } else {
            this.state.map.dragging.disable();
        }
        
        if (canZoom) {
            this.state.map.scrollWheelZoom.enable();
            this.state.map.doubleClickZoom.enable();
            this.state.map.boxZoom.enable();
            this.state.map.keyboard.enable();
            this.state.map.touchZoom.enable();
        } else {
            this.state.map.scrollWheelZoom.disable();
            this.state.map.doubleClickZoom.disable();
            this.state.map.boxZoom.disable();
            this.state.map.keyboard.disable();
            this.state.map.touchZoom.disable();
        }
    },
    
    // 完成当前关卡
    completeLevel() {
        const currentLevel = this.levels.find(l => l.id === this.userProgress.currentLevel);
        if (!currentLevel) return;
        
        if (!this.userProgress.completedLevels.includes(currentLevel.id)) {
            this.userProgress.completedLevels.push(currentLevel.id);
        }
        
        // 解锁建筑
        currentLevel.buildings.forEach(buildingId => {
            if (buildingId !== 'all' && !this.userProgress.unlockedBuildings.includes(buildingId)) {
                this.userProgress.unlockedBuildings.push(buildingId);
            }
        });
        
        // 解锁功能
        currentLevel.unlockFeatures.forEach(feature => {
            if (!this.userProgress.unlockedFeatures.includes(feature)) {
                this.userProgress.unlockedFeatures.push(feature);
            }
        });
        
        // 进入下一关
        if (currentLevel.id < this.levels.length) {
            this.userProgress.currentLevel = currentLevel.id + 1;
        }
        
        // 保存进度
        this.saveUserProgress();
        
        // 显示关卡完成提示
        this.showLevelCompleteModal(currentLevel);
        
        // 应用新关卡的限制
        this.applyLevelRestrictions();
    },
    
    // 显示关卡完成提示
    showLevelCompleteModal(level) {
        const modal = document.createElement('div');
        modal.className = 'level-complete-modal';
        modal.innerHTML = `
            <div class="level-complete-content">
                <h2>🎉 恭喜！</h2>
                <p>你已完成「${level.title}」关卡！</p>
                <p style="margin-top: 10px; color: #666;">已解锁: ${level.unlockFeatures.join(', ')}</p>
                <button class="next-level-btn" style="margin-top: 20px; padding: 10px 30px; background: #0078A8; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    进入第 ${level.id + 1} 关
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.next-level-btn').onclick = () => {
            modal.remove();
        };
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5000;
        `;
        
        modal.querySelector('.level-complete-content').style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
        `;
    },
    
    // 初始化事件监听器
    initEventListeners() {
        // 图标选择功能
        const iconOptions = document.querySelectorAll('.icon-option');
        iconOptions.forEach(option => {
            option.addEventListener('click', (e) => this.handleIconSelect(e));
        });
        
        // 录音功能
        this.elements.recordButton.addEventListener('click', () => this.startRecording());
        this.elements.stopButton.addEventListener('click', () => this.stopRecording());
        
        // 上传功能
        this.elements.uploadButton.addEventListener('click', () => this.uploadAudio());
        
        // 自动填充文件名
        this.elements.audioFileInput.addEventListener('change', () => this.handleFileChange());
        
        // 键盘事件监听 - 按N键放置标记，按Backspace键删除选中标记
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'n') {
                this.handleKeyPress(e);
            } else if (e.key === 'Backspace') {
                // 删除选中的标记
                if (this.state.selectedMarker) {
                    console.log('Deleting selected marker:', this.state.selectedMarker);
                    this.state.map.removeLayer(this.state.selectedMarker);
                    
                    // 从markers中删除
                    this.state.markers.delete(this.state.selectedMarker);
                    
                    // 从defaultAudioMarkers中删除（如果是声音谜题标记）
                    const defaultMarkerIndex = this.state.defaultAudioMarkers.findIndex(item => item.marker === this.state.selectedMarker);
                    if (defaultMarkerIndex !== -1) {
                        this.state.defaultAudioMarkers.splice(defaultMarkerIndex, 1);
                    }
                    
                    // 检查是否是删除引导标记
                    if (this.state.selectedMarker === this.deleteGuideMarker) {
                        this.deleteGuideMarker = null;
                    }
                    
                    if (this.state.markerCount > 0) {
                        this.state.markerCount--;
                    }
                    // 清除选中状态
                    this.state.selectedMarker = null;
                    
                    // 保存标记状态
                    this.saveMarkers();
                    
                    // 更新引导状态
                    if (this.currentGuideStep === 8) {
                        this.guideState.deletedMarker = true;
                        console.log('Marker deleted, guideState.deletedMarker:', this.guideState.deletedMarker);
                    }
                } else {
                    console.log('No marker selected for deletion');
                }
            }
        });
        
        // 关闭弹窗事件
        if (this.elements.closeModal) {
            this.elements.closeModal.addEventListener('click', () => {
                if (this.elements.welcomeModal) {
                    this.elements.welcomeModal.style.display = 'none';
                }
            });
        }
        
        // 开始引导事件
        if (this.elements.startGuide) {
            this.elements.startGuide.addEventListener('click', () => {
                if (this.elements.welcomeModal) {
                    this.elements.welcomeModal.style.display = 'none';
                }
                // 确保引导弹窗显示
                if (this.elements.guideModal) {
                    this.elements.guideModal.style.display = 'block';
                }
                if (this.elements.guideOverlay) {
                    this.elements.guideOverlay.style.display = 'block';
                }
                this.startGuide();
            });
        }
        
        // 引导相关事件
        if (this.elements.guidePrev) {
            this.elements.guidePrev.addEventListener('click', () => {
                this.prevGuideStep();
            });
        }
        if (this.elements.guideNext) {
            this.elements.guideNext.addEventListener('click', () => {
                this.nextGuideStep();
            });
        }
        if (this.elements.guideClose) {
            this.elements.guideClose.addEventListener('click', () => {
                this.stopGuide();
            });
        }
        
        // 重置按钮事件
        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', () => {
                if (confirm('确定要重置所有进度和数据吗？这将清除所有关卡进度、谜题、标记等。')) {
                    this.resetAllProgress();
                }
            });
        }
        
        // 地图相关事件
        if (this.state.map) {
            // 监听鼠标移动，记录鼠标位置
            this.state.map.on('mousemove', (e) => {
                this.state.lastMousePosition = e.latlng;
            });
            
            // 监听地图缩放和移动事件，更新弹窗位置
            this.state.map.on('zoom move', () => {
                // 如果当前正在显示引导，更新弹窗位置
                if (this.elements.guideModal && this.elements.guideModal.style.display === 'block') {
                    const step = this.guideSteps[this.currentGuideStep];
                    if (step && step.element) {
                        // 只有当当前步骤是缩放地图步骤时才更新弹窗位置
                        // 其他步骤保留用户手动调整的位置
                        if (step.action === 'zoomMap') {
                            this.showGuideStep();
                        }
                    }
                }
                
                // 检查是否完成关卡1（认识校园）
                if (this.userProgress.currentLevel === 1 && !this.state.mapInitializing) {
                    console.log('Level 1: Map moved or zoomed by user, completing level');
                    setTimeout(() => {
                        this.completeLevel();
                    }, 500);
                }
            });
        }
        
        // 自定义事件按钮事件
        if (this.elements.createCustomEventButton) {
            this.elements.createCustomEventButton.addEventListener('click', () => this.createCustomEvent());
        }
        
        // 图标来源选择事件
        const iconSourceRadios = document.querySelectorAll('input[name="iconSource"]');
        iconSourceRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.handleIconSourceChange(e.target.value));
        });
        
        // 绑定事件弹窗事件
        if (this.elements.cancelBindEventButton) {
            this.elements.cancelBindEventButton.addEventListener('click', () => this.closeBindEventModal());
        }
        if (this.elements.confirmBindEventButton) {
            this.elements.confirmBindEventButton.addEventListener('click', () => this.confirmBindEvent());
        }
        if (this.elements.bindEventModal) {
            const closeBtn = document.querySelector('.close-bind-event-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeBindEventModal());
            }
            this.elements.bindEventModal.addEventListener('click', (e) => {
                if (e.target === this.elements.bindEventModal) {
                    this.closeBindEventModal();
                }
            });
        }
        
        // 音频笔记弹窗事件
        if (this.elements.cancelAudioNoteButton) {
            this.elements.cancelAudioNoteButton.addEventListener('click', () => this.closeAudioNoteModal());
        }
        if (this.elements.saveAudioNoteButton) {
            this.elements.saveAudioNoteButton.addEventListener('click', () => this.saveAudioNote());
        }
        if (this.elements.audioNoteModal) {
            const closeBtn = document.querySelector('.close-audio-note-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeAudioNoteModal());
            }
            this.elements.audioNoteModal.addEventListener('click', (e) => {
                if (e.target === this.elements.audioNoteModal) {
                    this.closeAudioNoteModal();
                }
            });
        }
    },
    
    // 安全验证函数
    validateUrl(url) {
        try {
            // 处理本地路径（以/开头）
            if (url.startsWith('/')) {
                return true;
            }
            // 处理完整URL
            const parsedUrl = new URL(url);
            // 只允许同域或特定域名的URL
            return parsedUrl.origin === window.location.origin || parsedUrl.origin === 'http://localhost:8000' || parsedUrl.origin === 'http://127.0.0.1:8080';
        } catch {
            return false;
        }
    },
    
    // 获取API key
    getApiKey() {
        // 默认API key，实际部署时应该修改
        return 'default_api_key';
    },
    
    // 构建带有认证头的fetch选项
    getFetchOptions(method = 'GET', body = null) {
        const options = {
            method: method,
            headers: {
                'X-API-Key': this.getApiKey()
            }
        };
        
        if (body && method !== 'GET') {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        
        return options;
    },
    
    // 构建带有认证头的FormData fetch选项
    getFormDataOptions(method = 'POST', formData = null) {
        const options = {
            method: method,
            headers: {
                'X-API-Key': this.getApiKey()
            }
        };
        
        if (formData && method !== 'GET') {
            options.body = formData;
        }
        
        return options;
    },
    
    // 防止XSS的HTML转义函数
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // 验证音频key格式
    validateAudioKey(key) {
        return typeof key === 'string' && /^audio\/[a-zA-Z0-9_\-\/\.]+$/.test(key);
    },
    
    // 验证音频名称
    validateAudioName(name) {
        if (!name || name.trim() === '') {
            return '音频名称不能为空';
        }
        if (name.length > 50) {
            return '音频名称不能超过50个字符';
        }
        if (name.includes('..') || name.includes('/') || name.includes('\\')) {
            return '音频名称不能包含路径字符';
        }
        return null;
    },
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 保存用户选择状态
    saveUserState() {
        const state = {
            selectedIcon: this.state.selectedIcon,
            selectedAudio: this.state.selectedAudio
        };
        localStorage.setItem('mapUserState', JSON.stringify(state));
    },
    
    // 加载用户选择状态
    loadUserState() {
        const savedState = localStorage.getItem('mapUserState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.state.selectedIcon = state.selectedIcon;
                this.state.selectedAudio = state.selectedAudio;
                
                // 恢复选中的图标
                if (this.state.selectedIcon) {
                    document.querySelectorAll('.icon-option').forEach(opt => {
                        if (opt.dataset.icon === this.state.selectedIcon) {
                            opt.classList.add('selected');
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading user state:', error);
            }
        }
    },
    
    // 初始化音频列表
    updateAudioList(forceRefresh = false) {
        const now = Date.now();
        
        if (!forceRefresh && 
            this.state.audioListCache && 
            (now - this.state.audioListCacheTime) < this.config.audioListCacheTimeout) {
            console.log('Using cached audio list');
            this.processAudioListData(this.state.audioListCache);
            return;
        }
        
        if (this.state.isUpdatingAudioList) {
            console.log('Audio list update already in progress');
            return;
        }
        
        this.state.isUpdatingAudioList = true;
        console.log('Fetching audio list...');
        this.elements.audioFiles.innerHTML = '<p>正在加载音频列表...</p>';
        this.elements.defaultAudioFiles.innerHTML = '<p>正在加载原始音频...</p>';
        
        fetch(`${this.config.serverUrl}/audio_list?_=${new Date().getTime()}`, this.getFetchOptions())
            .then(response => {
                console.log('Audio list response:', response);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Audio list data:', data);
                this.state.audioListCache = data;
                this.state.audioListCacheTime = now;
                this.processAudioListData(data);
            })
            .catch(error => {
                console.error('Error fetching audio list:', error);
                this.elements.audioFiles.innerHTML = '<p>加载音频列表失败</p>';
                this.elements.defaultAudioFiles.innerHTML = '<p>加载原始音频失败</p>';
            })
            .finally(() => {
                this.state.isUpdatingAudioList = false;
            });
    },
    
    // 处理音频列表数据
    processAudioListData(data) {
        this.elements.audioFiles.innerHTML = '';
        this.elements.defaultAudioFiles.innerHTML = '';
        
        if (!data.files || data.files.length === 0) {
            this.elements.audioFiles.innerHTML = '<p>没有找到音频文件</p>';
            this.elements.defaultAudioFiles.innerHTML = '<p>没有原始音频文件</p>';
            return;
        }
        
        const defaultFiles = [];
        const userFiles = [];
        
        data.files.forEach(file => {
            if (file.key.includes('default_') || file.key.includes('/default_')) {
                defaultFiles.push(file);
            } else {
                userFiles.push(file);
            }
        });
        
        if (defaultFiles.length === 0) {
            this.elements.defaultAudioFiles.innerHTML = '<p>没有原始音频文件</p>';
        } else {
            console.log('Processing default files:', defaultFiles);
            const limitedDefaultFiles = defaultFiles.slice(0, this.config.maxDefaultAudioMarkers);
            limitedDefaultFiles.forEach(file => this.createAudioItem(file, this.elements.defaultAudioFiles, false));
        }
        
        if (userFiles.length === 0) {
            this.elements.audioFiles.innerHTML = '<p>没有上传的音频文件</p>';
        } else {
            console.log('Processing user files:', userFiles);
            userFiles.forEach(file => this.createAudioItem(file, this.elements.audioFiles, true));
        }
        
        this.restoreUserAudioMarkers(data.files || []);
    },
    
    // 恢复用户之前绑定的音频标记
    restoreUserAudioMarkers(allFiles) {
        Object.keys(this.audioEventBindings).forEach(audioKey => {
            // 查找对应的音频文件
            const file = allFiles.find(f => f.key === audioKey);
            if (file) {
                // 检查是否已经添加了这个标记
                let markerExists = false;
                this.state.markers.forEach((_, m) => {
                    if (m.audioData && m.audioData.key === audioKey) {
                        markerExists = true;
                    }
                });
                
                if (!markerExists) {
                    this.addUserAudioMarker(file);
                }
            }
        });
    },
    
    // 创建音频列表项
    createAudioItem(file, container, showDeleteButton) {
        console.log('Creating audio item:', file);
        const audioItem = document.createElement('div');
        audioItem.className = 'audio-item';
        
        // 从完整路径中提取文件名并去除前缀，进行XSS防护
        let filename = this.escapeHtml(file.key.split('/').pop());
        // 处理录制的音频文件名，去除时间戳前缀
        if (filename.includes('_')) {
            // 尝试提取用户输入的名称部分
            const parts = filename.split('_');
            if (parts.length > 2) {
                // 时间戳格式为 YYYYMMDD_HHMMSS_name.wav
                // 提取最后一部分作为用户输入的名称
                const lastPart = parts[parts.length - 1];
                if (lastPart.includes('.')) {
                    const nameWithoutExt = lastPart.split('.')[0];
                    if (nameWithoutExt.length > 0) {
                        filename = nameWithoutExt;
                    }
                }
            }
        }
        console.log('Filename:', filename);
        
        // 验证URL安全性
        if (!this.validateUrl(file.url)) {
            console.error('Invalid audio URL:', file.url);
            return;
        }
        
        // 判断是否为默认音频（声音谜题）
        const isDefaultAudio = !showDeleteButton;
        
        // 创建名称元素
        let nameElement;
        if (isDefaultAudio) {
            this.state.riddleCounter++;
            const defaultName = `谜题${this.state.riddleCounter}`;
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = this.escapeHtml(defaultName);
            nameInput.className = 'puzzle-name';
            nameInput.dataset.key = this.escapeHtml(file.key);
            nameInput.dataset.originalFilename = this.escapeHtml(filename);
            nameInput.style.marginRight = '10px';
            nameInput.style.width = '150px';
            nameElement = nameInput;
            
            // 在地图上添加随机标记（限制数量）
            // 检查该音频是否已有标记，避免重复创建
            let markerExists = false;
            this.state.markers.forEach((_, m) => {
                if (m.audioData && m.audioData.key === file.key) {
                    markerExists = true;
                }
            });
            this.state.defaultAudioMarkers.forEach(item => {
                if (item.marker && item.marker.audioData && item.marker.audioData.key === file.key) {
                    markerExists = true;
                }
            });
            
            if (!markerExists && this.state.markerCount < this.config.maxMarkers) {
                this.addRandomMarkerForAudio(file, defaultName, nameInput);
                this.state.markerCount++;
            }
        } else {
            // 用户自定义音频保持原始颜色显示
            const nameSpan = document.createElement('span');
            nameSpan.textContent = filename;
            nameSpan.style.marginRight = '10px';
            nameElement = nameSpan;
        }
        
        // 添加名称元素到音频项
        audioItem.appendChild(nameElement);
                    
        // 播放按钮
        const playButton = document.createElement('button');
        playButton.textContent = '播放';
        playButton.className = 'play-button';
        playButton.dataset.playing = 'false';
        playButton.dataset.url = file.url;
        playButton.onclick = () => this.playAudio(file.url, playButton);
        
        const selectButton = document.createElement('button');
        selectButton.textContent = '选择';
        selectButton.onclick = () => {
            this.state.selectedAudio = {
                key: file.key,
                url: file.url
            };
            document.querySelectorAll('.audio-item').forEach(item => 
                item.style.backgroundColor = 'white');
            audioItem.style.backgroundColor = '#e6f3ff';
            
            this.highlightMarkerByAudioKey(file.key);
            
            this.saveUserState();
            
            if (this.currentGuideStep === 6) {
                this.guideState.selectedAudio = true;
                console.log('Audio selected, guideState.selectedAudio:', this.guideState.selectedAudio);
            }
        };
        
        // 添加按钮到音频项
        audioItem.appendChild(playButton);
        audioItem.appendChild(selectButton);
        
        // 为用户上传的音频添加绑定事件按钮
        if (showDeleteButton) {
            const bindEventButton = document.createElement('button');
            bindEventButton.textContent = '绑定事件';
            bindEventButton.onclick = () => this.showBindEventModal(file, audioItem);
            audioItem.appendChild(bindEventButton);
        }
        
        // 只为用户上传的音频添加删除按钮
        if (showDeleteButton) {
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除';
            deleteButton.onclick = () => {
                if (confirm(`确定要删除音频 ${filename} 吗？`)) {
                    this.deleteAudio(file.key);
                }
            };
            audioItem.appendChild(deleteButton);
        }
        
        container.appendChild(audioItem);
    },
    
    // 播放音频
    playAudio(url, button) {
        // 验证URL安全性
        if (!this.validateUrl(url)) {
            console.error('Invalid audio URL:', url);
            alert('音频URL无效，无法播放');
            return;
        }
        
        // 确保使用完整的服务器URL
        if (url.startsWith('/')) {
            url = this.config.serverUrl + url;
        }
        
        console.log('Playing audio:', url);
        
        // 检查是否是暂停/恢复同一个音频
        if (this.state.currentAudio && this.state.currentPlayButton === button) {
            if (this.state.isPlaying) {
                // 当前正在播放 - 暂停
                this.state.currentAudio.pause();
                this.state.isPlaying = false;
                button.textContent = '播放';
                button.dataset.playing = 'false';
                this.clearProgressInterval(button);
                return;
            } else {
                // 当前已经暂停 - 继续播放
                this.state.currentAudio.play();
                this.state.isPlaying = true;
                button.textContent = '暂停';
                button.dataset.playing = 'true';
                this.updateProgress(this.state.currentAudio, button);
                return;
            }
        }
        
        // 如果已有其他音频在播放，停止并清理它
        this.stopCurrentAudio();
        
        // 性能优化：从音频对象池获取或创建新的音频对象
        let audio;
        if (this.state.audioPool.has(url)) {
            audio = this.state.audioPool.get(url);
            console.log('Reusing audio object from pool');
            // 重置音频对象
            audio.currentTime = 0;
        } else {
            audio = new Audio(url);
            this.state.audioPool.set(url, audio);
            console.log('Creating new audio object');
            
            // 添加一次性加载事件监听器
            audio.addEventListener('loadedmetadata', () => {
                console.log('Audio metadata loaded:', audio.duration);
            }, { once: true });
        }
        
        this.state.currentAudio = audio;
        this.state.currentPlayButton = button;
        this.state.isPlaying = true;
        
        // 更新按钮状态
        button.textContent = '暂停';
        button.dataset.playing = 'true';
        
        // 创建绑定的事件处理函数
        const boundHandleAudioEnded = this.handleAudioEnded.bind(this, button);
        const boundHandleAudioError = this.handleAudioError.bind(this, button);
        const boundHandleLoadedMetadata = this.handleAudioLoadedMetadata.bind(this, audio, button);
        
        // 保存事件处理函数引用以便后续清理
        audio._boundHandlers = {
            ended: boundHandleAudioEnded,
            error: boundHandleAudioError,
            loadedmetadata: boundHandleLoadedMetadata
        };
        
        // 添加事件监听器
        audio.addEventListener('ended', boundHandleAudioEnded);
        audio.addEventListener('error', boundHandleAudioError);
        audio.addEventListener('loadedmetadata', boundHandleLoadedMetadata);
        
        audio.play().catch(error => {
            console.error('Playback failed:', error);
            this.handleAudioError(button, error);
        });
        
        // 更新引导状态
        if (this.currentGuideStep === 7) {
            this.guideState.playedAudio = true;
            console.log('Audio played, guideState.playedAudio:', this.guideState.playedAudio);
        }
    },
    
    // 停止当前播放的音频并清理资源
    stopCurrentAudio() {
        if (this.state.currentAudio) {
            const audio = this.state.currentAudio;
            const button = this.state.currentPlayButton;
            
            // 暂停音频
            audio.pause();
            
            // 清理事件监听器
            if (audio._boundHandlers) {
                audio.removeEventListener('ended', audio._boundHandlers.ended);
                audio.removeEventListener('error', audio._boundHandlers.error);
                audio.removeEventListener('loadedmetadata', audio._boundHandlers.loadedmetadata);
                delete audio._boundHandlers;
            }
            
            // 清理进度更新
            if (button) {
                this.clearProgressInterval(button);
                button.textContent = '播放';
                button.dataset.playing = 'false';
            }
            
            // 重置状态
            this.state.currentAudio = null;
            this.state.currentPlayButton = null;
            this.state.isPlaying = false;
        }
    },
    
    // 音频播放结束处理
    handleAudioEnded(button) {
        button.textContent = '播放';
        button.dataset.playing = 'false';
        this.state.isPlaying = false;
        this.clearProgressInterval(button);
        
        // 不立即清除currentAudio，允许重新播放
        this.state.currentAudio = null;
        this.state.currentPlayButton = null;
    },
    
    // 音频错误处理
    handleAudioError(button, error) {
        console.error('Audio playback error:', error);
        button.textContent = '播放';
        button.dataset.playing = 'false';
        this.state.isPlaying = false;
        this.clearProgressInterval(button);
        this.state.currentAudio = null;
        this.state.currentPlayButton = null;
        alert('音频播放失败');
    },
    
    // 音频元数据加载处理
    handleAudioLoadedMetadata(audio, button) {
        console.log('Audio metadata loaded:', audio.duration);
        this.updateProgress(audio, button);
    },
    
    // 清理进度更新定时器
    clearProgressInterval(button) {
        if (button && button.progressInterval) {
            clearInterval(button.progressInterval);
            button.progressInterval = null;
        }
    },
    
    // 更新音频播放进度
    updateProgress(audio, button) {
        // 清除之前的进度更新
        this.clearProgressInterval(button);
        
        // 创建进度条元素（如果不存在）
        if (!button.progressBar && button.parentNode) {
            const progressBar = document.createElement('div');
            progressBar.style.width = '100px';
            progressBar.style.height = '4px';
            progressBar.style.backgroundColor = '#e0e0e0';
            progressBar.style.marginTop = '5px';
            progressBar.style.borderRadius = '2px';
            progressBar.style.overflow = 'hidden';
            
            const progressFill = document.createElement('div');
            progressFill.style.height = '100%';
            progressFill.style.backgroundColor = '#0078A8';
            progressFill.style.width = '0%';
            progressFill.style.transition = 'width 0.1s ease';
            
            progressBar.appendChild(progressFill);
            button.parentNode.appendChild(progressBar);
            button.progressBar = progressBar;
            button.progressFill = progressFill;
        }
        
        // 定期更新进度
        button.progressInterval = setInterval(() => {
            if (audio.duration && !isNaN(audio.duration) && button.progressFill) {
                const progress = (audio.currentTime / audio.duration) * 100;
                button.progressFill.style.width = `${progress}%`;
            }
        }, 100);
    },
    
    // 删除音频功能
    deleteAudio(key) {
        // 验证音频key格式
        if (!this.validateAudioKey(key)) {
            console.error('Invalid audio key:', key);
            alert('音频key格式无效，无法删除');
            return;
        }
        
        fetch(`${this.config.serverUrl}/delete_audio`, this.getFetchOptions('POST', { key: key }))
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Delete response:', data);
            if (data.success) {
                alert('音频删除成功');
                this.updateAudioList(true);
            } else {
                alert(`删除失败: ${data.error || '未知错误'}`);
            }
        })
        .catch(error => {
            console.error('Error deleting audio:', error);
            alert(`删除音频出错: ${error.message}`);
        });
    },
    
    // 处理文件选择
    handleFileChange() {
        if (this.elements.audioFileInput.files.length > 0) {
            // 获取文件名并去除扩展名
            const fileName = this.elements.audioFileInput.files[0].name.replace(/\.[^\.]+$/, '');
            this.elements.uploadAudioNameInput.value = fileName;
        }
    },
    
    // 上传音频
    uploadAudio() {
        // 验证音频名称
        const audioName = this.elements.uploadAudioNameInput.value;
        const validationError = this.validateAudioName(audioName);
        if (validationError) {
            alert(validationError);
            return;
        }
        
        // 检查音频名称是否重复
        if (this.isAudioNameDuplicate(audioName)) {
            alert('音频名称已存在，请使用其他名称');
            return;
        }
        
        if (!this.elements.audioFileInput.files[0]) {
            alert('请选择音频文件');
            return;
        }
        
        // 验证文件大小（10MB限制）
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (this.elements.audioFileInput.files[0].size > maxSize) {
            alert('音频文件大小不能超过10MB');
            return;
        }
        
        const formData = new FormData();
        formData.append('audio', this.elements.audioFileInput.files[0]);
        formData.append('filename', audioName);
        
        try {
            this.elements.uploadButton.disabled = true;
            this.elements.uploadButton.textContent = '上传中...';
            
            console.log('Sending audio upload request...');
            fetch(`${this.config.serverUrl}/upload_audio`, this.getFormDataOptions('POST', formData))
                .then(response => response.json())
                .then(data => {
                    console.log('Upload response:', data);
                    if (data.url) {
                        alert('上传成功！');
                        this.elements.uploadAudioNameInput.value = '';
                        this.elements.audioFileInput.value = '';
                        // 增加更长的延时，确保服务器处理完成
                        setTimeout(() => {
                    console.log('Refreshing audio list after upload');
                    this.updateAudioList(true);
                }, 1500);
                        
                        // 更新引导状态
                        if (this.currentGuideStep === 5) { // 上传音频步骤（现在是第6步，索引为5）
                            this.guideState.uploadedAudio = true;
                            console.log('Audio uploaded, guideState.uploadedAudio:', this.guideState.uploadedAudio);
                        }
                        
                        // 检查是否完成关卡3（录制/上传音频）
                        if (this.userProgress.currentLevel === 3) {
                            console.log('Level 3: Audio uploaded, completing level');
                            setTimeout(() => {
                                this.completeLevel();
                            }, 500);
                        }
                    } else {
                        throw new Error('No URL in response');
                    }
                })
                .catch(error => {
                    console.error('Upload error:', error);
                    alert(`上传错误: ${error.message}`);
                })
                .finally(() => {
                    this.elements.uploadButton.disabled = false;
                    this.elements.uploadButton.textContent = '上传音频';
                });
        } catch (error) {
            console.error('Upload error:', error);
            alert(`上传错误: ${error.message}`);
            this.elements.uploadButton.disabled = false;
            this.elements.uploadButton.textContent = '上传音频';
        }
    },
    
    // 检查音频名称是否重复
    isAudioNameDuplicate(name) {
        // 获取所有音频文件元素
        const audioItems = document.querySelectorAll('.audio-item span, .audio-item input.puzzle-name');
        for (const item of audioItems) {
            let existingName = item.textContent || item.value;
            // 去除文件扩展名
            existingName = existingName.replace(/\.[^.]+$/, '');
            if (existingName === name) {
                return true;
            }
        }
        return false;
    },

    // 开始录音
    startRecording() {
        // 验证音频名称
        const audioName = this.elements.audioNameInput.value;
        const validationError = this.validateAudioName(audioName);
        if (validationError) {
            alert(validationError);
            return;
        }

        // 检查音频名称是否重复
        if (this.isAudioNameDuplicate(audioName)) {
            alert('音频名称已存在，请使用其他名称');
            return;
        }

        try {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    this.state.mediaRecorder = new MediaRecorder(stream);
                    this.state.audioChunks = [];

                    this.state.mediaRecorder.ondataavailable = event => {
                        this.state.audioChunks.push(event.data);
                    };

                    this.state.mediaRecorder.onstop = () => {
                        console.log('Recording stopped, preparing to upload...');
                        const audioBlob = new Blob(this.state.audioChunks, { type: 'audio/wav' });
                        const formData = new FormData();
                        formData.append('audio', audioBlob, audioName + '.wav');
                        formData.append('filename', audioName + '.wav');

                        try {
                            console.log('Uploading audio file...');
                            fetch(`${this.config.serverUrl}/upload_audio`, this.getFormDataOptions('POST', formData))
                                .then(response => response.json())
                                .then(data => {
                                console.log('Upload response:', data);
                                if (data.url) {
                                    this.updateAudioList(true);
                                    this.elements.recordingStatus.textContent = '录音已保存到云端';
                                } else {
                                    throw new Error('No URL in response');
                                }
                            })
                                .catch(error => {
                                    console.error('Error uploading audio:', error);
                                    this.elements.recordingStatus.textContent = '保存失败';
                                });
                        } catch (error) {
                            console.error('Error uploading audio:', error);
                            this.elements.recordingStatus.textContent = '保存失败';
                        }
                    };

                    this.state.mediaRecorder.start();
                    this.elements.recordButton.disabled = true;
                    this.elements.stopButton.disabled = false;
                    this.elements.recordButton.classList.add('recording');
                    this.elements.recordingStatus.textContent = '正在录音...';
                })
                .catch(error => {
                    console.error('Error accessing microphone:', error);
                    alert('无法访问麦克风');
                });
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('无法开始录音');
        }
    },
    
    // 停止录音
    stopRecording() {
        if (this.state.mediaRecorder) {
            this.state.mediaRecorder.stop();
            this.elements.recordButton.disabled = false;
            this.elements.stopButton.disabled = true;
            this.elements.recordButton.classList.remove('recording');
            
            // 更新引导状态
            if (this.currentGuideStep === 4) { // 录制音频步骤（现在是第5步，索引为4）
                this.guideState.recordedAudio = true;
                console.log('Audio recorded, guideState.recordedAudio:', this.guideState.recordedAudio);
            }
            
            // 检查是否完成关卡3（录制/上传音频）
            if (this.userProgress.currentLevel === 3) {
                console.log('Level 3: Audio recorded, completing level');
                setTimeout(() => {
                    this.completeLevel();
                }, 500);
            }
        }
    },
    
    // 处理图标选择
    handleIconSelect(e) {
        const iconOptions = document.querySelectorAll('.icon-option');
        iconOptions.forEach(opt => opt.classList.remove('selected'));
        e.target.classList.add('selected');
        this.state.selectedIcon = e.target.dataset.icon;
        // 保存用户选择状态
        this.saveUserState();
        
        // 更新引导状态
        if (this.currentGuideStep === 2) { // 选择图标步骤（现在是第3步，索引为2）
            this.guideState.selectedIcon = true;
            console.log('Icon selected, guideState.selectedIcon:', this.guideState.selectedIcon);
        }
    },
    
    // 处理键盘按键
    handleKeyPress(e) {
        // 阻止默认行为
        e.preventDefault();
        
        if (!this.state.selectedIcon) {
            alert('请先选择一个图标类型');
            return;
        }

        // 限制标记数量
        if (this.state.markerCount >= this.config.maxMarkers) {
            alert('地图标记数量已达到上限');
            return;
        }
        
        // 检查是否有鼠标位置
        if (!this.state.lastMousePosition) {
            alert('请先将鼠标移动到地图上要放置标记的位置');
            return;
        }
        
        // 使用鼠标位置放置标记
        const mousePos = this.state.lastMousePosition;
        console.log('Placing marker at mouse position:', mousePos);
        
        // 定义不同类型的图标
        const icons = {
            classroom: L.icon({
                iconUrl: 'icons/west_campus.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            }),
            library: L.icon({
                iconUrl: 'icons/basic_library.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            }),
            cafe: L.icon({
                iconUrl: 'icons/office.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            }),
            sports: L.icon({
                iconUrl: 'icons/cafe.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            })
        };

        const marker = L.marker(mousePos, {
            icon: icons[this.state.selectedIcon],
            draggable: true
        }).addTo(this.state.map);

        this.state.markerCount++;

        // 为标记添加点击事件，用于播放音频和选中标记
        marker.on('click', () => {
            // 播放音频（如果关联了音频）
            if (this.state.selectedAudio) {
                const audioFile = this.state.markers.get(marker);
                if (audioFile && audioFile.url) {
                    // 创建临时按钮对象用于播放控制
                    const tempButton = {
                        textContent: '播放',
                        dataset: { playing: 'false', url: audioFile.url },
                        style: {}
                    };
                    this.playAudio(audioFile.url, tempButton);
                }
            }
            
            // 清除之前的选中状态
            this.state.markers.forEach((_, m) => {
                if (m._icon) {
                    m._icon.style.filter = '';
                }
            });
            // 标记当前标记为选中状态
            if (marker._icon) {
                marker._icon.style.filter = 'brightness(1.2)';
            }
            // 保存选中的标记
            this.state.selectedMarker = marker;
        });
        
        // 如果有选中的音频，将其与标记关联
        if (this.state.selectedAudio) {
            this.state.markers.set(marker, this.state.selectedAudio);
        }
        
        // 为标记添加拖动结束事件，保存位置
        marker.on('dragend', (e) => {
            const newPosition = e.target.getLatLng();
            console.log('Marker moved to:', newPosition);
            marker.position = newPosition;
            this.saveMarkers();
        });
        
        // 保存标记
        this.saveMarkers();
        
        // 更新引导状态
        if (this.currentGuideStep === 3) { // 放置标记步骤（现在是第4步，索引为3）
            this.guideState.placedMarker = true;
            console.log('Marker placed, guideState.placedMarker:', this.guideState.placedMarker);
        }
        
        // 检查是否完成关卡2（放置标记）
        if (this.userProgress.currentLevel === 2) {
            console.log('Level 2: Marker placed, completing level');
            setTimeout(() => {
                this.completeLevel();
            }, 500);
        }
    },
    
    // 处理地图点击
    handleMapClick(e) {
        // 已改为使用N键放置标记
        // 保留此方法以保持兼容性
    },
    
    // 引导步骤配置
    guideSteps: [
        {
            title: '欢迎使用交互式校园地图',
            content: `
                <p>欢迎使用交互式校园地图导览系统！</p>
                <p>本系统可以帮助你在校园地图上添加标记，并为每个标记添加音频讲解。</p>
                <p>让我们开始一步步了解如何使用这个系统。</p>
            `,
            action: null
        },
        {
            title: '缩放和移动地图',
            content: `
                <p>在开始使用系统之前，你需要了解如何缩放和移动地图。</p>
                <p><strong>缩放地图：</strong>使用鼠标滚轮向上或向下滚动，或者使用地图右下角的缩放控件。</p>
                <p><strong>移动地图：</strong>按住鼠标左键并拖动地图，或者使用地图右下角的移动控件。</p>
                <p>请尝试缩放和移动地图，然后点击"下一步"继续。</p>
            `,
            action: 'zoomMap',
            element: '#map'
        },
        {
            title: '选择图标类型',
            content: `
                <p>现在，你需要在左侧控制面板中选择一个图标类型。</p>
                <p>有四种图标可供选择：</p>
                <ul>
                    <li>教室</li>
                    <li>图书馆</li>
                    <li>餐厅</li>
                    <li>体育设施</li>
                </ul>
                <p>请点击其中一个图标来选择它，选择后点击"下一步"继续。</p>
            `,
            action: 'selectIcon',
            element: '.icon-option'
        },
        {
            title: '放置标记',
            content: `
                <p>选择好图标后，将鼠标移动到地图上你想要放置标记的位置。</p>
                <p>然后按键盘上的 <strong>N键</strong> 来放置标记。</p>
                <p>标记会出现在鼠标当前的位置。</p>
                <p>请尝试放置一个标记，然后点击"下一步"继续。</p>
            `,
            action: 'placeMarker',
            element: '#map'
        },
        {
            title: '录制音频',
            content: `
                <p>在右侧音频控制面板中，你可以录制音频来为标记添加讲解。</p>
                <p>1. 输入音频名称</p>
                <p>2. 点击"开始录音"按钮</p>
                <p>3. 录制完成后点击"停止录音"按钮</p>
                <p>音频会自动保存并加入到网站的自定义声音谜题。</p>
                <p>请尝试录制一段音频，然后点击"下一步"继续。</p>
            `,
            action: 'recordAudio',
            element: '.audio-controls'
        },
        {
            title: '上传音频',
            content: `
                <p>你也可以上传本地的音频文件作为声音谜题。</p>
                <p>1. 输入音频名称</p>
                <p>2. 点击"选择文件"按钮选择音频文件</p>
                <p>3. 点击"上传音频"按钮</p>
                <p>上传完成后，音频会出现在音频列表中。</p>
                <p>请尝试上传一个音频文件，然后点击"下一步"继续。</p>
            `,
            action: 'uploadAudio',
            element: '#audioFileInput, #uploadButton'
        },
        {
            title: '选择音频',
            content: `
                <p>在音频列表中，你可以选择一个音频文件。</p>
                <p>点击音频文件旁边的"选择"按钮即可。</p>
                <p>选择音频后，新放置的标记会自动关联该音频。</p>
                <p>请选择一个音频文件，然后点击"下一步"继续。</p>
            `,
            action: 'selectAudio',
            element: '.audio-item button'
        },
        {
            title: '播放音频',
            content: `
                <p>要播放标记关联的音频，只需左键点击地图上的标记即可。</p>
                <p>音频会自动开始播放，你可以看到播放进度条。</p>
                <p>请点击一个标记来播放音频，然后点击"下一步"继续。</p>
            `,
            action: 'playAudio',
            element: '#map'
        },
        {
            title: '删除标记',
            content: `
                <p>要删除地图上的标记，首先点击该标记将其选中，然后按键盘上的Backspace键即可。</p>
                <p>标记会被立即删除，同时关联的音频也会被解除关联。</p>
                <p>请尝试删除一个标记，然后点击"下一步"继续。</p>
            `,
            action: 'deleteMarker',
            element: '#map'
        },
        {
            title: '声音谜题',
            content: `
                <p>系统会自动加载默认音频文件作为声音谜题。</p>
                <p>这些音频会以谜题的形式出现在地图上，你可以点击它们来播放。</p>
                <p>请点击一个声音谜题标记来播放，然后点击"下一步"继续。</p>
            `,
            action: 'playPuzzle',
            element: '#map'
        },
        {
            title: '完成',
            content: `
                <p>恭喜！你已经了解了交互式校园地图的所有基本功能。</p>
                <p>现在你可以开始创建自己的校园导览了！</p>
                <p>如果需要再次查看使用引导，可以在刷新页面后重新开始。</p>
            `,
            action: null
        }
    ],
    
    // 当前引导步骤
    currentGuideStep: 0,
    
    // 开始引导
    startGuide() {
        // 重置引导状态
        this.guideState = {
            selectedIcon: false,
            placedMarker: false,
            recordedAudio: false,
            uploadedAudio: false,
            selectedAudio: false,
            playedAudio: false,
            deletedMarker: false,
            playedPuzzle: false
        };
        this.currentGuideStep = 0;
        this.showGuideStep();
    },
    
    // 引导步骤状态
    guideState: {
        selectedIcon: false,
        placedMarker: false,
        recordedAudio: false,
        uploadedAudio: false,
        selectedAudio: false,
        playedAudio: false,
        deletedMarker: false,
        playedPuzzle: false
    },
    
    // 显示当前引导步骤
    showGuideStep() {
        console.log('Showing guide step:', this.currentGuideStep);
        if (!this.elements.guideModal || !this.elements.guideTitle || !this.elements.guideContent) {
            console.error('Guide modal elements not found');
            return;
        }
        
        const step = this.guideSteps[this.currentGuideStep];
        if (!step) {
            console.error('Step not found for index:', this.currentGuideStep);
            return;
        }
        
        console.log('Step content:', step);
        this.elements.guideTitle.textContent = step.title;
        // 使用innerHTML但确保内容安全
        this.elements.guideContent.innerHTML = this.escapeHtml(step.content).replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;\/strong&gt;/g, '</strong>').replace(/&lt;ul&gt;/g, '<ul>').replace(/&lt;\/ul&gt;/g, '</ul>').replace(/&lt;li&gt;/g, '<li>').replace(/&lt;\/li&gt;/g, '</li>').replace(/&lt;p&gt;/g, '<p>').replace(/&lt;\/p&gt;/g, '</p>');
        
        // 显示/隐藏上一步按钮
        if (this.elements.guidePrev) {
            this.elements.guidePrev.style.display = this.currentGuideStep > 0 ? 'inline-block' : 'none';
        }
        
        // 更新下一步按钮文本
        if (this.elements.guideNext) {
            this.elements.guideNext.textContent = this.currentGuideStep === this.guideSteps.length - 1 ? '完成' : '下一步';
        }
        
        // 为删除功能引导生成标记
        if (this.currentGuideStep === 8) { // 删除标记步骤（索引为8）
            if (!this.deleteGuideMarker) {
                // 生成一个专门的标记用于删除引导
                const deleteGuideIcon = L.icon({
                    iconUrl: 'icons/west_campus.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                });
                
                // 在地图中心位置生成标记
                this.deleteGuideMarker = L.marker([500, 500], {
                    icon: deleteGuideIcon,
                    draggable: true
                }).addTo(this.state.map);
                
                // 添加点击事件
                this.deleteGuideMarker.on('click', () => {
                    // 清除之前的选中状态
                    this.state.markers.forEach((_, m) => {
                        if (m._icon) {
                            m._icon.style.filter = '';
                        }
                    });
                    // 标记当前标记为选中状态
                    if (this.deleteGuideMarker._icon) {
                        this.deleteGuideMarker._icon.style.filter = 'brightness(1.2)';
                    }
                    // 保存选中的标记
                    this.state.selectedMarker = this.deleteGuideMarker;
                });
            }
            // 高亮删除引导标记
            if (this.deleteGuideMarker._icon) {
                this.deleteGuideMarker._icon.classList.add('guide-highlight');
            }
        } else {
            // 非删除引导步骤，移除删除引导标记
            if (this.deleteGuideMarker) {
                this.state.map.removeLayer(this.deleteGuideMarker);
                this.deleteGuideMarker = null;
            }
        }
        
        // 高亮当前步骤对应的元素
        this.highlightGuideElement(step.element);
        
        // 将所有引导弹窗默认显示在网页正中心
        const modalContent = this.elements.guideModal.querySelector('.modal-content');
        if (modalContent) {
            // 调整弹窗尺寸，使其适应屏幕大小
            const maxWidth = window.innerWidth * 0.3;
            const maxHeight = window.innerHeight * 0.4;
            modalContent.style.maxWidth = `${maxWidth}px`;
            modalContent.style.maxHeight = `${maxHeight}px`;
            modalContent.style.padding = '15px';
            modalContent.style.fontSize = '14px';
            
            modalContent.style.left = '50%';
            modalContent.style.top = '50%';
            modalContent.style.transform = 'translate(-50%, -50%)';
        }
        
        // 显示引导弹窗
        if (this.elements.guideModal) {
            this.elements.guideModal.style.display = 'block';
            // 确保弹窗在最前面
            this.elements.guideModal.style.zIndex = '3000';
        }
        
        // 选择图标步骤之后去掉遮罩
        if (this.elements.guideOverlay) {
            if (this.currentGuideStep <= 2) { // 选择图标步骤（索引为2）及之前显示遮罩
                this.elements.guideOverlay.style.display = 'block';
                // 允许点击遮罩下面的元素
                this.elements.guideOverlay.style.pointerEvents = 'none';
                // 确保遮罩层不会阻止交互
                this.elements.guideOverlay.style.zIndex = '1999';
            } else {
                // 选择图标步骤之后隐藏遮罩
                this.elements.guideOverlay.style.display = 'none';
            }
        }
        
        // 添加弹窗拖拽移动和调整大小功能
        this.addModalDragAndResize();
    },
    
    // 高亮引导元素
    highlightGuideElement(selector) {
        // 清除之前的高亮
        const previousHighlights = document.querySelectorAll('.guide-highlight');
        previousHighlights.forEach(element => {
            element.classList.remove('guide-highlight');
        });
        
        // 高亮当前元素
        if (selector) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.classList.add('guide-highlight');
            });
        }
    },
    
    // 上一步
    prevGuideStep() {
        if (this.currentGuideStep > 0) {
            this.currentGuideStep--;
            this.showGuideStep();
        }
    },
    
    // 下一步
    nextGuideStep() {
        // 检查当前步骤是否已完成
        let canProceed = true;
        
        switch (this.currentGuideStep) {
            case 1: // 缩放和移动地图
                // 缩放地图步骤不需要验证，直接通过
                break;
            case 2: // 选择图标
                if (!this.guideState.selectedIcon) {
                    alert('请先选择一个图标类型');
                    canProceed = false;
                }
                break;
            case 3: // 放置标记
                if (!this.guideState.placedMarker) {
                    alert('请先按N键放置一个标记');
                    canProceed = false;
                }
                break;
            case 4: // 录制音频
                if (!this.guideState.recordedAudio) {
                    alert('请先录制一段音频');
                    canProceed = false;
                }
                break;
            case 5: // 上传音频
                if (!this.guideState.uploadedAudio) {
                    alert('请先上传一个音频文件');
                    canProceed = false;
                }
                break;
            case 6: // 选择音频
                if (!this.guideState.selectedAudio) {
                    alert('请先选择一个音频文件');
                    canProceed = false;
                }
                break;
            case 7: // 播放音频
                if (!this.guideState.playedAudio) {
                    alert('请先点击一个标记播放音频');
                    canProceed = false;
                }
                break;
            case 8: // 删除标记
                if (!this.guideState.deletedMarker) {
                    alert('请先点击一个标记选中它，然后按Backspace键删除它');
                    canProceed = false;
                }
                break;
            case 9: // 声音谜题
                if (!this.guideState.playedPuzzle) {
                    alert('请先点击一个声音谜题标记播放');
                    canProceed = false;
                }
                break;
        }
        
        if (canProceed) {
            if (this.currentGuideStep < this.guideSteps.length - 1) {
                this.currentGuideStep++;
                this.showGuideStep();
            } else {
                this.closeGuide();
            }
        }
    },
    
    // 关闭引导
    closeGuide() {
        if (this.elements.guideModal) {
            this.elements.guideModal.style.display = 'none';
        }
        if (this.elements.guideOverlay) {
            this.elements.guideOverlay.style.display = 'none';
        }
        // 移除删除引导标记
        if (this.deleteGuideMarker) {
            this.state.map.removeLayer(this.deleteGuideMarker);
            this.deleteGuideMarker = null;
        }
    },

    // 显示事件弹窗
    showEventModal(marker, eventId) {
        const allEvents = this.getAllEvents();
        const eventData = allEvents[eventId];
        if (!eventData) {
            console.error('Event data not found for eventId:', eventId);
            return;
        }

        // 将标记的图标从锁图标替换为事件图标
        if (eventData.icon && marker._icon) {
            const newIcon = L.icon({
                iconUrl: eventData.icon,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                className: eventData.isUserEvent ? 'user-event-marker' : 'system-event-marker'
            });
            marker.setIcon(newIcon);
        }

        // 获取弹窗元素
        const eventModal = document.getElementById('eventModal');
        if (!eventModal) return;

        // 填充弹窗内容
        document.getElementById('eventTitle').textContent = eventData.title;
        document.getElementById('eventDescription').textContent = eventData.description;
        document.getElementById('eventImage').src = eventData.image;

        // 更新情绪反应计数
        this.updateReactionCounts(eventId);

        // 清空并重新创建情绪按钮
        const reactionButtons = document.getElementById('reactionButtons');
        reactionButtons.innerHTML = '';

        // 添加情绪表情按钮
        Object.keys(this.emotionEmojis).forEach(key => {
            const button = document.createElement('button');
            button.className = 'emotion-button';
            button.textContent = this.emotionEmojis[key];
            button.title = key;
            button.onclick = () => this.addReaction(marker, eventId, key);
            
            // 如果用户当前选择了这个表情，高亮显示
            if (eventData.userReaction === key) {
                button.style.borderColor = '#0078A8';
                button.style.backgroundColor = '#e6f3ff';
            }
            
            reactionButtons.appendChild(button);
        });

        // 添加关闭按钮事件
        const closeBtn = document.querySelector('.close-event-modal');
        if (closeBtn) {
            closeBtn.onclick = () => {
                eventModal.style.display = 'none';
            };
        }

        // 点击弹窗外部关闭
        eventModal.onclick = (e) => {
            if (e.target === eventModal) {
                eventModal.style.display = 'none';
            }
        };

        // 显示弹窗
        eventModal.style.display = 'flex';
    },

    // 更新情绪反应计数
    updateReactionCounts(eventId) {
        const eventData = this.puzzleEvents[eventId];
        if (!eventData) return;

        const reactionCountsEl = document.getElementById('reactionCounts');
        if (!reactionCountsEl) return;

        let countsText = '';
        Object.keys(this.emotionEmojis).forEach(key => {
            if (eventData.reactions[key] > 0) {
                countsText += `${this.emotionEmojis[key]}: ${eventData.reactions[key]} `;
            }
        });

        reactionCountsEl.textContent = countsText || '暂无反应';
    },

    // 添加情绪反应
    addReaction(marker, eventId, reactionType) {
        const eventData = this.puzzleEvents[eventId];
        if (!eventData) return;

        // 如果用户已经选择了这个表情，取消选择
        if (eventData.userReaction === reactionType) {
            eventData.reactions[reactionType]--;
            eventData.userReaction = null;
            alert(`已取消您的反应：${this.emotionEmojis[reactionType]}`);
        } else {
            // 如果用户之前选择了其他表情，先取消之前的
            if (eventData.userReaction) {
                eventData.reactions[eventData.userReaction]--;
            }
            // 增加新反应的计数
            eventData.reactions[reactionType]++;
            eventData.userReaction = reactionType;
            alert(`感谢您的反应：${this.emotionEmojis[reactionType]}`);
        }
        
        // 更新显示
        this.updateReactionCounts(eventId);
        
        // 重新显示弹窗以更新按钮状态
        this.showEventModal(marker, eventId);

        // 保存到localStorage
        this.saveEventReactions(eventId, eventData);
    },

    // 保存事件反应
    saveEventReactions(eventId, eventData) {
        try {
            const key = `eventReactions_${eventId}`;
            localStorage.setItem(key, JSON.stringify(eventData));
        } catch (error) {
            console.error('Failed to save event reactions:', error);
        }
    },

    // 保存事件完整数据（包括谜题状态）
    saveEventReactions(eventId, eventData) {
        try {
            const key = `eventReactions_${eventId}`;
            localStorage.setItem(key, JSON.stringify(eventData));
        } catch (error) {
            console.error('Failed to save event reactions:', error);
        }
    },

    // 加载事件反应
    loadEventReactions() {
        Object.keys(this.puzzleEvents).forEach(eventId => {
            try {
                const key = `eventReactions_${eventId}`;
                const savedData = localStorage.getItem(key);
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData) {
                        if (parsedData.reactions) {
                            this.puzzleEvents[eventId].reactions = parsedData.reactions;
                        }
                        if (parsedData.userReaction !== undefined) {
                            this.puzzleEvents[eventId].userReaction = parsedData.userReaction;
                        }
                        if (parsedData.isUnlocked !== undefined) {
                            this.puzzleEvents[eventId].isUnlocked = parsedData.isUnlocked;
                        }
                        if (parsedData.isPlayed !== undefined) {
                            this.puzzleEvents[eventId].isPlayed = parsedData.isPlayed;
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load event reactions:', error);
            }
        });
    },
    
    // 重置所有谜题状态为锁定
    resetAllPuzzles() {
        Object.keys(this.puzzleEvents).forEach(eventId => {
            const eventData = this.puzzleEvents[eventId];
            eventData.isUnlocked = false;
            eventData.isPlayed = false;
            const key = `eventReactions_${eventId}`;
            localStorage.removeItem(key);
        });
        localStorage.removeItem('mapMarkers');
        console.log('All puzzles reset to locked state');
    },
    
    // 重置所有用户进度和数据
    resetAllProgress() {
        // 重置关卡进度
        this.userProgress = {
            currentLevel: 1,
            completedLevels: [],
            unlockedBuildings: ['schoolGate'],
            unlockedFeatures: []
        };
        // 立即保存初始进度到 localStorage，确保没有缓存问题
        this.saveUserProgress();
        
        // 重置谜题
        this.resetAllPuzzles();
        
        // 重置社交数据
        this.socialData.messageWall = [];
        this.socialData.emotionRanking = [];
        localStorage.removeItem('socialData');
        
        // 重置用户事件
        this.userEvents = {};
        localStorage.removeItem('userEvents');
        
        // 重置音频绑定
        this.audioEventBindings = {};
        localStorage.removeItem('audioEventBindings');
        
        // 重置音频笔记
        this.audioNotes = {};
        localStorage.removeItem('audioNotes');
        
        // 重置用户状态
        this.state.selectedIcon = null;
        this.state.selectedAudio = null;
        localStorage.removeItem('mapUserState');
        
        console.log('All user progress reset to initial state');
        
        // 重新加载页面
        location.reload();
    },
    
    // 添加弹窗拖拽移动和调整大小功能
    addModalDragAndResize() {
        const modalContent = this.elements.guideModal.querySelector('.modal-content');
        if (!modalContent) return;
        
        let isDragging = false;
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;
        let resizeDirection = '';
        
        // 鼠标按下事件 - 开始拖拽或调整大小
        modalContent.addEventListener('mousedown', (e) => {
            // 检查是否在调整大小的边缘
            const rect = modalContent.getBoundingClientRect();
            const edgeSize = 10;
            
            // 检查鼠标是否在边缘
            if (e.clientX >= rect.right - edgeSize && e.clientY >= rect.bottom - edgeSize) {
                // 右下角调整大小
                isResizing = true;
                resizeDirection = 'bottomRight';
                startX = e.clientX;
                startY = e.clientY;
                startWidth = rect.width;
                startHeight = rect.height;
                e.preventDefault();
            } else if (e.clientX >= rect.right - edgeSize) {
                // 右侧调整大小
                isResizing = true;
                resizeDirection = 'right';
                startX = e.clientX;
                startWidth = rect.width;
                e.preventDefault();
            } else if (e.clientY >= rect.bottom - edgeSize) {
                // 底部调整大小
                isResizing = true;
                resizeDirection = 'bottom';
                startY = e.clientY;
                startHeight = rect.height;
                e.preventDefault();
            } else {
                // 开始拖拽移动
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseFloat(modalContent.style.left) || 0;
                startTop = parseFloat(modalContent.style.top) || 0;
                e.preventDefault();
            }
        });
        
        // 鼠标移动事件 - 拖拽或调整大小
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                modalContent.style.left = `${startLeft + dx}px`;
                modalContent.style.top = `${startTop + dy}px`;
            } else if (isResizing) {
                if (resizeDirection === 'bottomRight' || resizeDirection === 'right') {
                    const dx = e.clientX - startX;
                    modalContent.style.width = `${startWidth + dx}px`;
                }
                if (resizeDirection === 'bottomRight' || resizeDirection === 'bottom') {
                    const dy = e.clientY - startY;
                    modalContent.style.height = `${startHeight + dy}px`;
                }
            }
        });
        
        // 鼠标释放事件 - 结束拖拽或调整大小
        document.addEventListener('mouseup', () => {
            isDragging = false;
            isResizing = false;
        });
        
        // 鼠标离开窗口事件 - 结束拖拽或调整大小
        document.addEventListener('mouseleave', () => {
            isDragging = false;
            isResizing = false;
        });
        
        // 添加调整大小的光标样式
        modalContent.addEventListener('mousemove', (e) => {
            const rect = modalContent.getBoundingClientRect();
            const edgeSize = 10;
            
            if (e.clientX >= rect.right - edgeSize && e.clientY >= rect.bottom - edgeSize) {
                modalContent.style.cursor = 'se-resize';
            } else if (e.clientX >= rect.right - edgeSize) {
                modalContent.style.cursor = 'e-resize';
            } else if (e.clientY >= rect.bottom - edgeSize) {
                modalContent.style.cursor = 's-resize';
            } else {
                modalContent.style.cursor = 'move';
            }
        });
    },
    
    // 根据音频文件名匹配对应的事件ID
    matchEventByAudioFilename(filename) {
        console.log('Matching event for filename:', filename);
        
        for (const [eventId, eventData] of Object.entries(this.puzzleEvents)) {
            if (filename.includes(eventData.audioPattern)) {
                console.log('Found match:', eventId, 'for pattern:', eventData.audioPattern);
                return eventId;
            }
        }
        
        const eventKeys = Object.keys(this.puzzleEvents);
        
        const randomIndex = Math.floor(Math.random() * eventKeys.length);
        return eventKeys[randomIndex];
    },

    // 在地图上为音频添加随机标记 - 实现完整触发链路绑定
    addRandomMarkerForAudio(file, displayName, nameInput) {
        // 验证URL安全性
        if (!this.validateUrl(file.url)) {
            console.error('Invalid audio URL:', file.url);
            return null;
        }
        
        // 从文件名提取关键信息用于匹配
        let filename = file.key.split('/').pop();
        
        // 匹配对应的事件ID（确保同一图标、音频、谜题唯一绑定）
        const eventId = this.matchEventByAudioFilename(filename);
        const eventData = this.puzzleEvents[eventId];
        
        // 生成地图上的随机位置
        const randomLat = Math.random() * 800 + 100;
        const randomLng = Math.random() * 800 + 100;
        
        // 定义锁图标（初始锁定状态）
        const lockIcon = L.icon({
            iconUrl: 'icons/lock.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            className: eventData.isUnlocked ? '' : 'locked-marker'
        });
        
        // 创建标记
        const marker = L.marker([randomLat, randomLng], {
            icon: lockIcon,
            draggable: true
        }).addTo(this.state.map);
        
        // 存储音频信息，进行XSS防护
        marker.audioData = {
            key: file.key,
            url: file.url,
            name: this.escapeHtml(displayName)
        };
        
        // 绑定固定的事件ID（确保全局唯一绑定）
        marker.eventId = eventId;
        marker.isDefaultMarker = true;
        
        // 将默认标记也添加到 markers map 中，确保统一管理
        this.state.markers.set(marker, {
            key: file.key,
            url: file.url
        });
        
        // 将默认标记添加到 defaultAudioMarkers 数组中
        this.state.defaultAudioMarkers.push({
            marker: marker,
            audioData: {
                key: file.key,
                url: file.url,
                name: this.escapeHtml(displayName)
            }
        });
        
        // 添加点击事件 - 实现完整触发链路
        marker.on('click', () => {
            const eventData = this.puzzleEvents[marker.eventId];
            
            // 清除之前的选中状态
            this.state.markers.forEach((_, m) => {
                if (m._icon) {
                    m._icon.style.filter = '';
                }
            });
            // 标记当前标记为选中状态
            if (marker._icon) {
                marker._icon.style.filter = 'brightness(1.2)';
            }
            this.state.selectedMarker = marker;
            
            // 检查谜题状态
            if (!eventData.isUnlocked) {
                // 谜题锁定状态：点击图标自动播放音频
                const playButton = {
                    textContent: '播放',
                    dataset: { playing: 'false', url: file.url },
                    style: {}
                };
                
                // 播放音频时添加高亮显示
                if (marker._icon) {
                    marker._icon.classList.add('playing-marker');
                }
                
                // 播放音频并在播放完成后自动解锁谜题
                this.playAudioWithCallback(file.url, playButton, () => {
                    // 移除高亮显示
                    if (marker._icon) {
                        marker._icon.classList.remove('playing-marker');
                    }
                    
                    // 音频播放完成回调：解锁谜题并显示笔记弹窗
                    eventData.isPlayed = true;
                    eventData.isUnlocked = true;
                    
                    // 保存谜题状态
                    this.saveEventReactions(marker.eventId, eventData);
                    
                    // 更新标记图标为事件图标
                    if (eventData && eventData.icon) {
                        const newIcon = L.icon({
                            iconUrl: eventData.icon,
                            iconSize: [32, 32],
                            iconAnchor: [16, 32],
                            className: 'system-event-marker'
                        });
                        marker.setIcon(newIcon);
                        
                        // 保存标记状态
                        this.saveMarkers();
                        
                        // 显示笔记输入弹窗
                        this.showAudioNoteModal(marker);
                    } else {
                        console.error('Event data or icon not found for event:', marker.eventId);
                    }
                });
            } else {
                // 谜题已解锁状态：直接显示事件弹窗
                this.showEventModal(marker, marker.eventId);
            }
            
            // 更新引导状态 - 点击谜题标记时就立即设置，不需要等待播放完成
            if (this.currentGuideStep === 9) {
                this.guideState.playedPuzzle = true;
                console.log('Puzzle clicked, guideState.playedPuzzle set to true');
            }
        });
        
        // 添加长按事件 - 显示音频名称
        let pressTimer;
        marker.on('mousedown', () => {
            pressTimer = window.setTimeout(() => {
                alert(`声音谜题: ${this.escapeHtml(marker.audioData.name)}`);
            }, 1000);
        });
        
        marker.on('mouseup mouseleave', () => {
            clearTimeout(pressTimer);
        });
        
        // 连接谜题名称输入框与标记
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                marker.audioData.name = this.escapeHtml(nameInput.value);
            });
            
            marker.on('click', () => {
                nameInput.focus();
                nameInput.select();
            });
            
            this.state.defaultAudioMarkers.push({
                marker: marker,
                input: nameInput,
                audioFile: {
                    key: this.escapeHtml(file.key),
                    url: file.url
                }
            });
        }
        
        // 如果谜题已经解锁，直接显示事件图标
        if (eventData.isUnlocked) {
            const unlockedIcon = L.icon({
                iconUrl: eventData.icon,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                className: 'system-event-marker'
            });
            marker.setIcon(unlockedIcon);
        }
        
        // 更新标记的 tooltip
        this.updateMarkerTooltip(marker);
        
        // 保存标记状态
        this.saveMarkers();
        
        return marker;
    },
    
    // 播放音频并带完成回调
    playAudioWithCallback(url, button, onComplete) {
        if (!this.validateUrl(url)) {
            console.error('Invalid audio URL:', url);
            alert('音频URL无效，无法播放');
            return;
        }
        
        if (url.startsWith('/')) {
            url = this.config.serverUrl + url;
        }
        
        // 停止当前播放的音频
        this.stopCurrentAudio();
        
        let audio;
        if (this.state.audioPool.has(url)) {
            audio = this.state.audioPool.get(url);
            audio.currentTime = 0;
        } else {
            audio = new Audio(url);
            this.state.audioPool.set(url, audio);
        }
        
        this.state.currentAudio = audio;
        this.state.currentPlayButton = button;
        this.state.isPlaying = true;
        
        // 音频播放完成回调
        const handleComplete = () => {
            this.state.isPlaying = false;
            this.state.currentAudio = null;
            this.state.currentPlayButton = null;
            this.clearProgressInterval(button);
            if (onComplete) {
                onComplete();
            }
        };
        
        audio.addEventListener('ended', handleComplete, { once: true });
        audio.addEventListener('error', () => {
            alert('音频播放失败');
            this.state.isPlaying = false;
            this.state.currentAudio = null;
            this.state.currentPlayButton = null;
        }, { once: true });
        
        audio.play().catch(error => {
            console.error('Playback failed:', error);
            alert('音频播放失败: ' + error.message);
        });
    },
    
    // 处理图标来源选择变化
    handleIconSourceChange(source) {
        if (source === 'preset') {
            this.elements.customEventIcon.style.display = 'block';
            this.elements.customEventIconFile.style.display = 'none';
        } else {
            this.elements.customEventIcon.style.display = 'none';
            this.elements.customEventIconFile.style.display = 'block';
        }
    },
    
    // 创建用户自定义事件
    createCustomEvent() {
        const title = this.elements.customEventTitle.value.trim();
        const description = this.elements.customEventDescription.value.trim();
        const iconSource = document.querySelector('input[name="iconSource"]:checked').value;
        const imageFile = this.elements.customEventImage.files[0];
        
        if (!title) {
            alert('请输入事件标题');
            return;
        }
        
        if (!description) {
            alert('请输入事件描述');
            return;
        }
        
        const eventId = 'user_event_' + Date.now();
        
        // 处理图标
        if (iconSource === 'preset') {
            const icon = this.elements.customEventIcon.value;
            let imageUrl = icon;
            if (imageFile) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imageUrl = e.target.result;
                    this.finalizeCustomEvent(eventId, title, description, icon, imageUrl);
                };
                reader.readAsDataURL(imageFile);
            } else {
                this.finalizeCustomEvent(eventId, title, description, icon, imageUrl);
            }
        } else {
            const iconFile = this.elements.customEventIconFile.files[0];
            if (!iconFile) {
                alert('请上传自定义图标');
                return;
            }
            
            const iconReader = new FileReader();
            iconReader.onload = (e) => {
                const icon = e.target.result;
                let imageUrl = icon;
                
                if (imageFile) {
                    const imageReader = new FileReader();
                    imageReader.onload = (imgE) => {
                        imageUrl = imgE.target.result;
                        this.finalizeCustomEvent(eventId, title, description, icon, imageUrl);
                    };
                    imageReader.readAsDataURL(imageFile);
                } else {
                    this.finalizeCustomEvent(eventId, title, description, icon, imageUrl);
                }
            };
            iconReader.readAsDataURL(iconFile);
        }
    },
    
    // 完成自定义事件创建
    finalizeCustomEvent(eventId, title, description, icon, imageUrl) {
        this.userEvents[eventId] = {
            title: title,
            description: description,
            image: imageUrl,
            icon: icon,
            isUserEvent: true,
            reactions: {
                like: 0,
                happy: 0,
                love: 0,
                sad: 0,
                cry: 0,
                angry: 0,
                surprised: 0,
                confused: 0
            },
            userReaction: null
        };
        
        // 保存到localStorage
        this.saveUserEvents();
        
        // 清空表单
        this.elements.customEventTitle.value = '';
        this.elements.customEventDescription.value = '';
        this.elements.customEventImage.value = '';
        this.elements.customEventIconFile.value = '';
        document.querySelector('input[name="iconSource"][value="preset"]').checked = true;
        this.elements.customEventIcon.style.display = 'block';
        this.elements.customEventIconFile.style.display = 'none';
        
        alert(`自定义事件"${title}"创建成功！请上传音频并将其与该事件绑定。`);
    },
    
    // 保存用户自定义事件
    saveUserEvents() {
        try {
            localStorage.setItem('userEvents', JSON.stringify(this.userEvents));
        } catch (error) {
            console.error('Failed to save user events:', error);
        }
    },
    
    // 加载用户自定义事件
    loadUserEvents() {
        try {
            const savedData = localStorage.getItem('userEvents');
            if (savedData) {
                this.userEvents = JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Failed to load user events:', error);
        }
    },
    
    // 获取所有事件（系统事件 + 用户事件）
    getAllEvents() {
        return { ...this.puzzleEvents, ...this.userEvents };
    },
    
    // 显示音频笔记弹窗
    showAudioNoteModal(marker) {
        if (!this.elements.audioNoteModal) return;
        
        this.currentNoteMarker = marker;
        
        // 如果已有笔记，填充到文本框
        const noteKey = marker.audioData ? marker.audioData.key : marker.eventId;
        if (this.audioNotes[noteKey]) {
            this.elements.audioNoteText.value = this.audioNotes[noteKey];
        } else {
            this.elements.audioNoteText.value = '';
        }
        
        this.elements.audioNoteModal.style.display = 'flex';
    },
    
    // 关闭音频笔记弹窗
    closeAudioNoteModal() {
        if (this.elements.audioNoteModal) {
            this.elements.audioNoteModal.style.display = 'none';
        }
        
        // 显示事件弹窗
        if (this.currentNoteMarker && this.currentNoteMarker.eventId) {
            this.showEventModal(this.currentNoteMarker, this.currentNoteMarker.eventId);
        }
        
        this.currentNoteMarker = null;
    },
    
    // 保存音频笔记
    saveAudioNote() {
        if (!this.currentNoteMarker) return;
        
        const noteText = this.elements.audioNoteText.value.trim();
        const noteKey = this.currentNoteMarker.audioData ? 
            this.currentNoteMarker.audioData.key : 
            this.currentNoteMarker.eventId;
        
        if (noteText) {
            this.audioNotes[noteKey] = noteText;
        } else {
            delete this.audioNotes[noteKey];
        }
        
        // 保存到 localStorage
        this.saveAudioNotes();
        
        // 更新标记的 tooltip
        this.updateMarkerTooltip(this.currentNoteMarker);
        
        alert('笔记保存成功！');
        this.closeAudioNoteModal();
    },
    
    // 保存音频笔记到 localStorage
    saveAudioNotes() {
        try {
            localStorage.setItem('audioNotes', JSON.stringify(this.audioNotes));
        } catch (error) {
            console.error('Failed to save audio notes:', error);
        }
    },
    
    // 加载音频笔记
    loadAudioNotes() {
        try {
            const savedData = localStorage.getItem('audioNotes');
            if (savedData) {
                this.audioNotes = JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Failed to load audio notes:', error);
        }
    },
    
    // 更新标记的 tooltip
    updateMarkerTooltip(marker) {
        const noteKey = marker.audioData ? marker.audioData.key : marker.eventId;
        const note = this.audioNotes[noteKey];
        
        if (note) {
            marker.bindTooltip(note, {
                permanent: false,
                direction: 'top',
                offset: [0, -10]
            });
        } else {
            marker.unbindTooltip();
        }
    },
    
    // 显示绑定事件弹窗
    showBindEventModal(file, audioItem) {
        if (!this.elements.bindEventModal) return;
        
        this.currentBindingAudio = file;
        this.selectedBindingEventId = null;
        
        // 清空并填充事件列表
        this.elements.bindEventList.innerHTML = '';
        const allEvents = this.getAllEvents();
        
        Object.keys(allEvents).forEach(eventId => {
            const event = allEvents[eventId];
            const eventItem = document.createElement('div');
            eventItem.className = 'bind-event-item';
            eventItem.style.padding = '10px';
            eventItem.style.marginBottom = '10px';
            eventItem.style.border = '2px solid #e0e0e0';
            eventItem.style.borderRadius = '8px';
            eventItem.style.cursor = 'pointer';
            eventItem.style.transition = 'all 0.2s ease';
            eventItem.dataset.eventId = eventId;
            
            // 区分用户事件和系统事件
            if (event.isUserEvent) {
                eventItem.style.backgroundColor = '#e6f7ff';
                eventItem.style.borderColor = '#91d5ff';
            }
            
            eventItem.innerHTML = `
                <strong>${this.escapeHtml(event.title)}</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">${this.escapeHtml(event.description.substring(0, 100))}${event.description.length > 100 ? '...' : ''}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">
                    ${event.isUserEvent ? '👤 用户自定义事件' : '🏛️ 系统事件'}
                </p>
            `;
            
            eventItem.onclick = () => {
                // 清除之前的选中状态
                document.querySelectorAll('.bind-event-item').forEach(item => {
                    item.style.borderColor = event.isUserEvent ? '#91d5ff' : '#e0e0e0';
                    item.style.boxShadow = 'none';
                });
                // 选中当前事件
                eventItem.style.borderColor = '#0078A8';
                eventItem.style.boxShadow = '0 0 0 3px rgba(0, 120, 168, 0.2)';
                this.selectedBindingEventId = eventId;
            };
            
            this.elements.bindEventList.appendChild(eventItem);
        });
        
        this.elements.bindEventModal.style.display = 'flex';
    },
    
    // 关闭绑定事件弹窗
    closeBindEventModal() {
        if (this.elements.bindEventModal) {
            this.elements.bindEventModal.style.display = 'none';
        }
        this.currentBindingAudio = null;
        this.selectedBindingEventId = null;
    },
    
    // 确认绑定事件
    confirmBindEvent() {
        if (!this.selectedBindingEventId) {
            alert('请先选择一个事件');
            return;
        }
        
        if (!this.currentBindingAudio) {
            alert('无效的音频文件');
            return;
        }
        
        // 保存绑定关系
        this.audioEventBindings[this.currentBindingAudio.key] = this.selectedBindingEventId;
        this.saveAudioEventBindings();
        
        // 在地图上添加标记
        this.addUserAudioMarker(this.currentBindingAudio);
        
        alert('事件绑定成功！已在地图上添加标记。');
        this.closeBindEventModal();
        
        // 检查是否完成关卡4（绑定音频）
        if (this.userProgress.currentLevel === 4) {
            console.log('Level 4: Audio bound to marker, completing level');
            setTimeout(() => {
                this.completeLevel();
            }, 500);
        }
    },
    
    // 为用户音频添加标记
    addUserAudioMarker(file) {
        const eventId = this.audioEventBindings[file.key];
        const allEvents = this.getAllEvents();
        const eventData = allEvents[eventId];
        
        if (!eventData) return;
        
        // 生成地图上的随机位置
        const randomLat = Math.random() * 800 + 100;
        const randomLng = Math.random() * 800 + 100;
        
        // 定义谜题图标（用户事件用不同的图标风格）
        const puzzleIcon = L.icon({
            iconUrl: 'icons/lock.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        });
        
        // 创建标记
        const marker = L.marker([randomLat, randomLng], {
            icon: puzzleIcon,
            draggable: true
        }).addTo(this.state.map);
        
        // 存储音频信息，进行XSS防护
        marker.audioData = {
            key: this.escapeHtml(file.key),
            url: file.url,
            name: this.escapeHtml(file.key.split('/').pop())
        };
        
        // 绑定事件ID
        marker.eventId = eventId;
        marker.isUserMarker = true;
        
        // 添加点击事件 - 播放音频、显示事件弹窗和选中标记
        marker.on('click', () => {
            const playButton = document.createElement('button');
            playButton.textContent = '播放';
            playButton.className = 'play-button';
            playButton.dataset.playing = 'false';
            playButton.dataset.url = file.url;
            this.playAudio(file.url, playButton);
            
            // 清除之前的选中状态
            this.state.markers.forEach((_, m) => {
                if (m._icon) {
                    m._icon.style.filter = '';
                }
            });
            // 标记当前标记为选中状态
            if (marker._icon) {
                marker._icon.style.filter = 'brightness(1.2)';
            }
            // 保存选中的标记
            this.state.selectedMarker = marker;
            
            // 显示事件弹窗
            this.showEventModal(marker, marker.eventId);
        });
        
        this.state.markerCount++;
        this.state.markers.set(marker, file);
        
        // 更新标记的 tooltip
        this.updateMarkerTooltip(marker);
    },
    
    // 保存音频事件绑定关系
    saveAudioEventBindings() {
        try {
            localStorage.setItem('audioEventBindings', JSON.stringify(this.audioEventBindings));
        } catch (error) {
            console.error('Failed to save audio event bindings:', error);
        }
    },
    
    // 加载音频事件绑定关系
    loadAudioEventBindings() {
        try {
            const savedData = localStorage.getItem('audioEventBindings');
            if (savedData) {
                this.audioEventBindings = JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Failed to load audio event bindings:', error);
        }
    },
    
    // 根据音频key高亮对应的地图标记
    highlightMarkerByAudioKey(audioKey) {
        // 清除之前的临时图标
        if (this.state.temporaryIcon) {
            this.state.map.removeLayer(this.state.temporaryIcon);
            this.state.temporaryIcon = null;
        }
        
        // 清除所有标记的高光
        this.state.markers.forEach((audioData, marker) => {
            if (marker._icon) {
                marker._icon.style.filter = '';
                marker._icon.classList.remove('selection-highlight');
            }
        });
        
        this.state.defaultAudioMarkers.forEach(item => {
            if (item.marker && item.marker._icon) {
                item.marker._icon.style.filter = '';
                item.marker._icon.classList.remove('selection-highlight');
            }
        });
        
        // 找到对应标记并添加特别高光
        let targetMarker = null;
        
        // 检查普通标记
        this.state.markers.forEach((audioData, marker) => {
            if (audioData && audioData.key === audioKey) {
                targetMarker = marker;
            }
        });
        
        // 检查默认音频标记
        if (!targetMarker) {
            this.state.defaultAudioMarkers.forEach(item => {
                if (item.marker && item.marker.audioData && item.marker.audioData.key === audioKey) {
                    targetMarker = item.marker;
                }
            });
        }
        
        // 应用指向性图标效果
        if (targetMarker && targetMarker._icon) {
            // 确保标记在地图上可见
            if (!this.state.map.getBounds().contains(targetMarker.getLatLng())) {
                this.state.map.setView(targetMarker.getLatLng(), this.state.map.getZoom());
            }
            
            // 创建指向性临时图标
            const arrowIcon = L.icon({
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                className: 'temporary-arrow-icon'
            });
            
            // 在标记位置添加临时图标
            this.state.temporaryIcon = L.marker(targetMarker.getLatLng(), {
                icon: arrowIcon
            }).addTo(this.state.map);
            
            // 2秒后移除临时图标
            setTimeout(() => {
                if (this.state.temporaryIcon) {
                    this.state.map.removeLayer(this.state.temporaryIcon);
                    this.state.temporaryIcon = null;
                }
            }, 2000);
            
            // 移动地图到标记位置
            this.state.selectedMarker = targetMarker;
            // 设置合适的缩放级别，确保标记清晰可见
            this.state.map.setView(targetMarker.getLatLng(), 1);
        }
    },
    
    // 保存标记到 localStorage
    saveMarkers() {
        try {
            const markersData = [];
            const processedMarkers = new Set();
            
            this.state.markers.forEach((audioData, marker) => {
                if (processedMarkers.has(marker)) return;
                
                const markerInfo = {
                    lat: marker.getLatLng().lat,
                    lng: marker.getLatLng().lng,
                    iconType: this.getMarkerIconType(marker),
                    audioData: audioData,
                    eventId: marker.eventId,
                    isDefaultMarker: marker.isDefaultMarker,
                    isUserMarker: marker.isUserMarker
                };
                markersData.push(markerInfo);
                processedMarkers.add(marker);
            });
            
            this.state.defaultAudioMarkers.forEach(item => {
                if (item.marker && !processedMarkers.has(item.marker)) {
                    const markerInfo = {
                        lat: item.marker.getLatLng().lat,
                        lng: item.marker.getLatLng().lng,
                        audioData: item.marker.audioData,
                        eventId: item.marker.eventId,
                        isDefaultMarker: true
                    };
                    markersData.push(markerInfo);
                    processedMarkers.add(item.marker);
                }
            });
            
            localStorage.setItem('mapMarkers', JSON.stringify(markersData));
        } catch (error) {
            console.error('Failed to save markers:', error);
        }
    },
    
    // 获取标记的图标类型
    getMarkerIconType(marker) {
        const iconUrl = marker.options.icon?.options.iconUrl || '';
        if (iconUrl.includes('west_campus')) return 'classroom';
        if (iconUrl.includes('basic_library')) return 'library';
        if (iconUrl.includes('office')) return 'cafe';
        if (iconUrl.includes('cafe')) return 'sports';
        return 'classroom';
    },
    
    // 从 localStorage 加载标记
    loadMarkers() {
        try {
            const savedData = localStorage.getItem('mapMarkers');
            if (!savedData) return;
            
            console.log('Loading markers from localStorage');
            const markersData = JSON.parse(savedData);
            console.log('Found', markersData.length, 'markers to restore');
            markersData.forEach(markerInfo => {
                this.restoreMarker(markerInfo);
            });
        } catch (error) {
            console.error('Failed to load markers:', error);
        }
    },
    
    // 恢复单个标记
    restoreMarker(markerInfo) {
        try {
            const icons = {
                classroom: L.icon({
                    iconUrl: 'icons/west_campus.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                }),
                library: L.icon({
                    iconUrl: 'icons/basic_library.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                }),
                cafe: L.icon({
                    iconUrl: 'icons/office.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                }),
                sports: L.icon({
                    iconUrl: 'icons/cafe.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                })
            };
            
            let icon;
            if (markerInfo.isDefaultMarker && this.puzzleEvents[markerInfo.eventId]) {
                const eventData = this.puzzleEvents[markerInfo.eventId];
                if (eventData.isUnlocked) {
                    icon = L.icon({
                        iconUrl: eventData.icon,
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        className: 'system-event-marker'
                    });
                } else {
                    icon = L.icon({
                        iconUrl: 'icons/lock.png',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        className: 'locked-marker'
                    });
                }
            } else if (markerInfo.iconType) {
                icon = icons[markerInfo.iconType] || icons.classroom;
            } else {
                icon = icons.classroom;
            }
            
            const marker = L.marker([markerInfo.lat, markerInfo.lng], {
                icon: icon,
                draggable: true
            }).addTo(this.state.map);
            
            if (markerInfo.audioData) {
                marker.audioData = markerInfo.audioData;
            }
            if (markerInfo.eventId) {
                marker.eventId = markerInfo.eventId;
            }
            if (markerInfo.isDefaultMarker) {
                marker.isDefaultMarker = true;
            }
            if (markerInfo.isUserMarker) {
                marker.isUserMarker = true;
            }
            
            this.setupMarkerEvents(marker, markerInfo.audioData);
            
            if (markerInfo.audioData) {
                this.state.markers.set(marker, markerInfo.audioData);
            }
            
            // 如果是默认标记，也添加到 defaultAudioMarkers 数组中
            if (markerInfo.isDefaultMarker && markerInfo.audioData) {
                this.state.defaultAudioMarkers.push({
                    marker: marker,
                    audioData: markerInfo.audioData
                });
            }
            
            this.state.markerCount++;
            
            this.updateMarkerTooltip(marker);
        } catch (error) {
            console.error('Failed to restore marker:', error);
        }
    },
    
    // 设置标记事件
    setupMarkerEvents(marker, audioDataParam) {
        const self = this;
        
        marker.on('click', () => {
            // 使用标记自身的 audioData 作为备用
            const audioData = audioDataParam || marker.audioData;
            
            self.state.markers.forEach((_, m) => {
                if (m._icon) {
                    m._icon.style.filter = '';
                }
            });
            if (marker._icon) {
                marker._icon.style.filter = 'brightness(1.2)';
            }
            self.state.selectedMarker = marker;
            
            // 更新引导状态 - 点击谜题标记时就立即设置，不需要等待播放完成
            if (marker.isDefaultMarker && self.currentGuideStep === 9) {
                self.guideState.playedPuzzle = true;
                console.log('Puzzle clicked in setupMarkerEvents, guideState.playedPuzzle set to true');
            }
            
            if (marker.isDefaultMarker && marker.eventId) {
                const eventData = self.puzzleEvents[marker.eventId];
                console.log('Click on default marker, eventId:', marker.eventId, 'isUnlocked:', eventData?.isUnlocked);
                
                if (eventData && !eventData.isUnlocked && audioData && audioData.url) {
                    console.log('Unlocking puzzle...');
                    if (marker._icon) {
                        marker._icon.classList.add('playing-marker');
                    }
                    const tempButton = { textContent: '播放', dataset: { playing: 'false', url: audioData.url }, style: {} };
                    self.playAudioWithCallback(audioData.url, tempButton, () => {
                        console.log('Audio finished, updating icon...');
                        if (marker._icon) {
                            marker._icon.classList.remove('playing-marker');
                        }
                        eventData.isPlayed = true;
                        eventData.isUnlocked = true;
                        self.saveEventReactions(marker.eventId, eventData);
                        const newIcon = L.icon({
                            iconUrl: eventData.icon,
                            iconSize: [32, 32],
                            iconAnchor: [16, 32],
                            className: 'system-event-marker'
                        });
                        marker.setIcon(newIcon);
                        self.saveMarkers();
                        self.showAudioNoteModal(marker);
                        
                        // 检查是否完成关卡5（声音谜题）
                        if (self.userProgress.currentLevel === 5) {
                            console.log('Level 5: Checking if enough puzzles unlocked...');
                            const unlockedPuzzleCount = Object.values(self.puzzleEvents).filter(e => e.isUnlocked).length;
                            console.log('Unlocked puzzles:', unlockedPuzzleCount);
                            
                            // 解锁至少3个谜题后完成关卡
                            if (unlockedPuzzleCount >= 3) {
                                console.log('Level 5 completed!');
                                setTimeout(() => {
                                    self.completeLevel();
                                }, 1000);
                            }
                        }
                    });
                } else if (eventData) {
                    console.log('Showing event modal for already unlocked puzzle');
                    self.showEventModal(marker, marker.eventId);
                }
            } else if (audioData && audioData.url) {
                const tempButton = { textContent: '播放', dataset: { playing: 'false', url: audioData.url }, style: {} };
                self.playAudio(audioData.url, tempButton);
                if (marker.eventId) {
                    self.showEventModal(marker, marker.eventId);
                }
            }
        });
        
        marker.on('dragend', () => {
            self.saveMarkers();
        });
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    setTimeout(() => {
        console.log('Initializing CampusMapApp...');
        CampusMapApp.init();
    }, 100);
});

// 备用：如果 DOMContentLoaded 已经触发，直接初始化
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already ready, initializing immediately');
    setTimeout(() => {
        CampusMapApp.init();
    }, 100);
}
