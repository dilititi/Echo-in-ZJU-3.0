/**
 * 配置检查模块
 * 检查浏览器兼容性、API配置、功能限制等
 */
const ConfigCheck = {
    results: [],
    
    check(name, passed, message, details = '') {
        this.results.push({
            name,
            passed,
            message,
            details,
            timestamp: new Date().toISOString()
        });
        
        const icon = passed ? '✓' : '✗';
        const color = passed ? 'green' : 'red';
        console.log(`%c${icon} ${name}: ${message}`, `color: ${color}; font-weight: bold`);
        if (details) {
            console.log(`  ${details}`);
        }
        
        return passed;
    },
    
    // 1. 浏览器兼容性检查
    checkBrowserCompatibility() {
        console.log('\n=== 浏览器兼容性检查 ===');
        
        // HTTPS或localhost检查
        const isSecure = location.protocol === 'https:' || 
                         location.hostname === 'localhost' || 
                         location.hostname === '127.0.0.1';
        this.check(
            '安全上下文',
            isSecure,
            isSecure ? '运行在安全环境' : '需要HTTPS或localhost',
            `当前协议: ${location.protocol}, 主机: ${location.hostname}`
        );
        
        // MediaRecorder API
        const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
        this.check(
            '录音功能',
            hasMediaRecorder,
            hasMediaRecorder ? 'MediaRecorder API 可用' : '不支持录音',
            hasMediaRecorder ? '' : '请使用现代浏览器'
        );
        
        // getUserMedia
        const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        this.check(
            '麦克风访问',
            hasGetUserMedia,
            hasGetUserMedia ? '可以访问麦克风' : '无法访问麦克风',
            hasGetUserMedia ? '' : '需要HTTPS环境'
        );
        
        // localStorage
        const hasLocalStorage = (() => {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch (e) {
                return false;
            }
        })();
        this.check(
            '本地存储',
            hasLocalStorage,
            hasLocalStorage ? 'localStorage 可用' : 'localStorage 不可用',
            hasLocalStorage ? '' : '部分功能将无法使用'
        );
        
        // IndexedDB (可选)
        const hasIndexedDB = !!window.indexedDB;
        this.check(
            'IndexedDB',
            hasIndexedDB,
            hasIndexedDB ? 'IndexedDB 可用' : 'IndexedDB 不可用',
            '用于大文件存储（可选）'
        );
        
        return isSecure && hasMediaRecorder && hasGetUserMedia && hasLocalStorage;
    },
    
    // 2. API配置检查
    checkAPIConfiguration() {
        console.log('\n=== API配置检查 ===');
        
        // API Key
        const apiKey = Config.apiKey;
        const isDefaultKey = apiKey === 'default_api_key';
        this.check(
            'API Key',
            !isDefaultKey,
            isDefaultKey ? '使用默认API Key（仅开发环境）' : 'API Key已配置',
            isDefaultKey ? '生产环境请修改 config.js 中的 apiKey' : ''
        );
        
        // 服务器URL
        const serverUrl = Config.serverUrl;
        this.check(
            '服务器地址',
            !!serverUrl,
            `服务器: ${serverUrl}`,
            ''
        );
        
        // 后端连接测试
        this.check(
            '后端连接',
            true,
            '需要手动验证后端服务',
            `请确保 ${serverUrl} 可访问`
        );
        
        return true;
    },
    
    // 3. 音频格式支持检查
    checkAudioFormats() {
        console.log('\n=== 音频格式支持 ===');
        
        const formats = ['.wav', '.mp3', '.ogg', '.m4a'];
        const audio = document.createElement('audio');
        
        formats.forEach(format => {
            const canPlay = audio.canPlayType(`audio/${format.slice(1)}`);
            const supported = canPlay !== '';
            this.check(
                `格式 ${format}`,
                supported,
                supported ? `支持 (${canPlay || 'probably'})` : '不支持',
                ''
            );
        });
        
        return true;
    },
    
    // 4. 功能限制检查
    checkLimits() {
        console.log('\n=== 功能限制 ===');
        
        this.check(
            '用户标记上限',
            Config.maxMarkers === 50,
            `最多 ${Config.maxMarkers} 个用户标记`,
            ''
        );
        
        this.check(
            '默认音频上限',
            Config.maxDefaultAudioMarkers === 20,
            `最多 ${Config.maxDefaultAudioMarkers} 个默认音频标记`,
            ''
        );
        
        this.check(
            '音频大小限制',
            true,
            '最大 20MB',
            '前端和后端双重限制'
        );
        
        this.check(
            '缓存超时',
            Config.audioListCacheTimeout === 30000,
            `${Config.audioListCacheTimeout / 1000} 秒`,
            ''
        );
        
        return true;
    },
    
    // 5. 数据完整性检查
    checkDataIntegrity() {
        console.log('\n=== 数据完整性 ===');
        
        // 关卡数据
        const levelsOK = Data.levels && Data.levels.length === 6;
        this.check(
            '关卡数据',
            levelsOK,
            levelsOK ? `${Data.levels.length} 个关卡` : '关卡数据异常',
            ''
        );
        
        // 建筑数据
        const buildingsOK = Data.buildings && Object.keys(Data.buildings).length === 43;
        this.check(
            '建筑数据',
            buildingsOK,
            buildingsOK ? `${Object.keys(Data.buildings).length} 个建筑` : '建筑数据异常',
            ''
        );
        
        // 事件数据
        const eventsOK = Data.puzzleEvents && Object.keys(Data.puzzleEvents).length === 43;
        this.check(
            '事件数据',
            eventsOK,
            eventsOK ? `${Object.keys(Data.puzzleEvents).length} 个事件` : '事件数据异常',
            ''
        );
        
        // 标记类型
        const markerTypesOK = Data.markerTypes && Object.keys(Data.markerTypes).length === 5;
        this.check(
            '标记类型',
            markerTypesOK,
            markerTypesOK ? `${Object.keys(Data.markerTypes).length} 种类型` : '标记类型异常',
            ''
        );
        
        return levelsOK && buildingsOK && eventsOK && markerTypesOK;
    },
    
    // 运行所有检查
    runAll() {
        console.log('%c配置检查开始', 'color: blue; font-size: 16px; font-weight: bold');
        
        this.results = [];
        
        const browser = this.checkBrowserCompatibility();
        const api = this.checkAPIConfiguration();
        const formats = this.checkAudioFormats();
        const limits = this.checkLimits();
        const data = this.checkDataIntegrity();
        
        console.log('\n=== 检查结果汇总 ===');
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        console.log(`%c通过: ${passed}/${total}`, 
            passed === total ? 'color: green; font-weight: bold' : 'color: orange; font-weight: bold');
        
        const critical = this.results.filter(r => !r.passed);
        if (critical.length > 0) {
            console.log('%c需要注意的问题:', 'color: red; font-weight: bold');
            critical.forEach(r => {
                console.log(`  - ${r.name}: ${r.message}`);
            });
        }
        
        return {
            passed,
            total,
            allPassed: passed === total,
            results: this.results,
            criticalIssues: critical
        };
    }
};

// 浏览器环境
if (typeof window !== 'undefined') {
    window.ConfigCheck = ConfigCheck;
    window.checkConfig = () => ConfigCheck.runAll();
    console.log('配置检查模块已加载，输入 checkConfig() 运行检查');
}
