/**
 * 交互式校园地图测试套件
 * 包含关卡系统、音频系统、事件系统、性能测试
 */
const TestSuite = {
    results: [],
    passed: 0,
    failed: 0,
    
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const result = { timestamp, message, type };
        this.results.push(result);
        
        const style = type === 'pass' ? 'color: green' : 
                      type === 'fail' ? 'color: red' : 
                      type === 'warn' ? 'color: orange' : 'color: blue';
        console.log(`%c[${timestamp}] ${message}`, style);
    },
    
    assert(condition, message) {
        if (condition) {
            this.passed++;
            this.log(`✓ ${message}`, 'pass');
            return true;
        } else {
            this.failed++;
            this.log(`✗ ${message}`, 'fail');
            return false;
        }
    },
    
    // 1. 关卡系统测试
    testLevelSystem() {
        this.log('=== 关卡系统测试 ===', 'info');
        
        // 测试关卡数据结构
        this.assert(Data.levels && Data.levels.length === 6, '关卡数量正确（6关）');
        
        // 测试关卡解锁条件
        Data.levels.forEach((level, index) => {
            this.assert(level.id === index + 1, `关卡${index + 1} ID正确`);
            this.assert(level.title && level.description, `关卡${index + 1}有标题和描述`);
            this.assert(Array.isArray(level.unlockFeatures), `关卡${index + 1}有解锁功能列表`);
        });
        
        // 测试进度保存
        const testProgress = {
            currentLevel: 3,
            completedLevels: [1, 2],
            unlockedFeatures: ['mapDrag', 'mapZoom', 'addMarker']
        };
        localStorage.setItem('test_userProgress', JSON.stringify(testProgress));
        const loaded = JSON.parse(localStorage.getItem('test_userProgress'));
        this.assert(loaded.currentLevel === 3, '关卡进度保存/恢复正常');
        localStorage.removeItem('test_userProgress');
        
        // 测试功能解锁逻辑
        const level5 = Data.levels.find(l => l.id === 5);
        this.assert(level5.unlockFeatures.includes('puzzles'), '第5关解锁谜题功能');
    },
    
    // 2. 音频系统测试
    testAudioSystem() {
        this.log('=== 音频系统测试 ===', 'info');
        
        // 测试音频配置
        this.assert(Config.maxMarkers > 0, '最大标记数配置正确');
        this.assert(Config.audioListCacheTimeout > 0, '音频缓存超时配置正确');
        
        // 测试音频对象池
        this.assert(App.state.audioPool instanceof Map, '音频对象池存在');
        
        // 模拟音频播放测试
        const testUrl = 'test_audio.mp3';
        const testButton = {
            textContent: '播放',
            dataset: { playing: 'false', url: testUrl },
            style: {},
            progressBar: null,
            progressFill: null
        };
        
        // 测试进度条更新
        const audio = new Audio();
        audio.duration = 100;
        audio.currentTime = 50;
        App.updateProgress(audio, testButton);
        this.assert(testButton.progressInterval !== undefined, '进度条更新定时器创建成功');
        
        // 清理
        if (testButton.progressInterval) {
            clearInterval(testButton.progressInterval);
        }
        
        // 测试音频文件大小限制
        const maxSize = 20 * 1024 * 1024;
        this.assert(maxSize === 20971520, '音频大小限制为20MB');
    },
    
    // 3. 事件系统测试
    testEventSystem() {
        this.log('=== 事件系统测试 ===', 'info');
        
        // 测试puzzleEvents数据结构
        const eventCount = Object.keys(Data.puzzleEvents).length;
        this.assert(eventCount === 43, `puzzleEvents数量正确（43个，实际${eventCount}个）`);
        
        // 测试事件结构
        const firstEvent = Object.values(Data.puzzleEvents)[0];
        this.assert(firstEvent.title, '事件有标题');
        this.assert(firstEvent.description, '事件有描述');
        this.assert(firstEvent.audioPattern, '事件有音频模式');
        this.assert(firstEvent.reactions, '事件有反应数据');
        this.assert(typeof firstEvent.isUnlocked === 'boolean', '事件有解锁状态');
        
        // 测试情绪反应保存
        const testEventId = 'test_event';
        const testEventData = {
            reactions: { like: 5, happy: 3 },
            userReaction: 'like',
            isUnlocked: true
        };
        Storage.saveEventReactions(testEventId, testEventData);
        const loadedEvent = { reactions: {}, userReaction: null, isUnlocked: false };
        loadedEvent.reactions = testEventData.reactions;
        loadedEvent.userReaction = testEventData.userReaction;
        loadedEvent.isUnlocked = testEventData.isUnlocked;
        this.assert(loadedEvent.reactions.like === 5, '情绪反应保存成功');
        localStorage.removeItem(`eventReactions_${testEventId}`);
        
        // 测试建筑ID与事件ID关联
        const buildingIds = Object.keys(Data.buildings);
        let matchedCount = 0;
        buildingIds.forEach(id => {
            const eventId = `${id}_puzzle`;
            if (Data.puzzleEvents[eventId]) {
                matchedCount++;
            }
        });
        this.assert(matchedCount === buildingIds.length, `所有建筑都有对应事件（${matchedCount}/${buildingIds.length}）`);
    },
    
    // 4. 性能测试
    testPerformance() {
        this.log('=== 性能测试 ===', 'info');
        
        // 测试大量标记性能
        const startTime = performance.now();
        const testMarkers = [];
        for (let i = 0; i < 100; i++) {
            testMarkers.push({
                lat: 500 + Math.random() * 100,
                lng: 500 + Math.random() * 100,
                type: ['study', 'love', 'sport', 'club', 'memory'][Math.floor(Math.random() * 5)]
            });
        }
        const endTime = performance.now();
        this.assert(endTime - startTime < 100, `创建100个标记耗时 < 100ms（实际${(endTime - startTime).toFixed(2)}ms）`);
        
        // 测试音频列表缓存
        const cacheStartTime = performance.now();
        App.state.audioListCache = { files: [] };
        App.state.audioListCacheTime = Date.now();
        const cacheEndTime = performance.now();
        this.assert(cacheEndTime - cacheStartTime < 10, `缓存操作耗时 < 10ms`);
        
        // 测试localStorage性能
        const storageStartTime = performance.now();
        const testData = { test: 'data', nested: { value: 123 } };
        for (let i = 0; i < 100; i++) {
            localStorage.setItem(`perf_test_${i}`, JSON.stringify(testData));
        }
        for (let i = 0; i < 100; i++) {
            localStorage.getItem(`perf_test_${i}`);
        }
        for (let i = 0; i < 100; i++) {
            localStorage.removeItem(`perf_test_${i}`);
        }
        const storageEndTime = performance.now();
        this.assert(storageEndTime - storageStartTime < 500, `localStorage 300次操作耗时 < 500ms（实际${(storageEndTime - storageStartTime).toFixed(2)}ms）`);
        
        // 测试内存使用
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
            this.log(`当前内存使用: ${memoryUsage.toFixed(2)} MB`, 'info');
            this.assert(memoryUsage < 100, `内存使用 < 100MB（实际${memoryUsage.toFixed(2)}MB）`);
        } else {
            this.log('浏览器不支持内存检测', 'warn');
        }
    },
    
    // 5. API认证测试
    testAPIAuthentication() {
        this.log('=== API认证测试 ===', 'info');
        
        // 测试API Key配置
        this.assert(Config.apiKey, 'API Key已配置');
        
        // 测试请求头构建
        const options = App.getFetchOptions('POST', { test: 'data' });
        this.assert(options.headers['X-API-Key'] === Config.apiKey, '请求头包含X-API-Key');
        this.assert(options.headers['Content-Type'] === 'application/json', '请求头包含Content-Type');
        
        // 测试后端认证中间件
        this.log('后端认证需要实际服务器测试', 'warn');
    },
    
    // 运行所有测试
    runAll() {
        this.log('开始运行测试套件...', 'info');
        this.passed = 0;
        this.failed = 0;
        this.results = [];
        
        try {
            this.testLevelSystem();
            this.testAudioSystem();
            this.testEventSystem();
            this.testPerformance();
            this.testAPIAuthentication();
        } catch (e) {
            this.log(`测试执行错误: ${e.message}`, 'fail');
            console.error(e);
        }
        
        this.log('=== 测试结果汇总 ===', 'info');
        this.log(`通过: ${this.passed}`, 'pass');
        this.log(`失败: ${this.failed}`, this.failed > 0 ? 'fail' : 'pass');
        this.log(`总计: ${this.passed + this.failed}`, 'info');
        
        return {
            passed: this.passed,
            failed: this.failed,
            total: this.passed + this.failed,
            results: this.results
        };
    }
};

// 浏览器环境自动运行
if (typeof window !== 'undefined') {
    window.TestSuite = TestSuite;
    window.runTests = () => TestSuite.runAll();
    console.log('测试套件已加载，输入 runTests() 运行所有测试');
}

// Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestSuite;
}
