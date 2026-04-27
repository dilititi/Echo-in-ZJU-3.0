# 🎯 紫金港声音地图 - Claude 代码逻辑详细总结

---

## 📝 最近更新记录 (2026-04-27)

### ✅ Soundtrack 目录添加 (重要!)

1. **将 soundtrack 目录添加到 Git**
   - 问题：部署时 `soundtrack` 目录缺失，导致服务器启动警告
   - 解决方案：将 soundtrack/ 目录提交到 git
   - Commit: `e6a2751`
   - 包含 29 个音频文件（3 个图书馆闭馆音乐）

**Soundtrack 目录结构：**
```
soundtrack/
├── 基图/ (19首 Secret Garden 系列钢琴曲)
├── 主图/ (8首，包括赵海洋系列钢琴曲)
└── 医图/ (2首，包括钢琴《亲爱的小孩》)
```

### ✅ Bug 修复与优化

1. **修复 `app.js` 第 606 行语法错误**
   - 问题：`document.getElementById(555'libraryChallengeBtn')` 语法错误
   - 修复：`document.getElementById('libraryChallengeBtn')`
   - Commit: `d47d8ce`

2. **修复 `index.html` 元素不存在错误**
   - 问题：`mapLayerSelect` 和 `themeToggleBtn` 可能不存在
   - 修复：添加元素存在性检查，避免 `addEventListener` 报错
   - Commit: `f922b41`

3. **修复阿里云 OSS URL 验证问题**
   - 问题：`validateUrl` 只允许本地域名
   - 修复：添加 `.aliyuncs.com` 和 `.oss-cn-hangzhou.aliyuncs.com` 域名支持
   - 修改文件：`static/js/utils.js`
   - Commit: `a508bf7`

---

## 📝 最近更新记录 (2026-04-26)

### ✅ 已完成的工作

1. **"求是湖" → "中心湖"重命名**
   - 修改了 `data.js` 中的建筑名称和描述
   - 更新了相关谜题事件内容
   - Commit: 修改"求是湖"为"中心湖"

2. **修复校史问答弹窗逻辑**
   - 问题：之前答题界面直接显示，不先展示建筑信息
   - 修复：现在先显示建筑信息，用户点击"参与答题"才展示答题
   - 修改文件：`app.js`
   - Commit: 修复答题弹窗逻辑

3. **建筑标记统一优化**
   - 统一所有建筑标记尺寸为 80px
   - 添加建筑名称标签（悬停显示）
   - 优化视觉风格，添加金色边框和阴影
   - 修改位置：`app.js:createBuildingMarker()`
   - Commit: 统一建筑标记尺寸与添加名称标签

4. **UI/UX改进**
   - 地标弹窗背景改为深蓝色渐变
   - 文字颜色优化以适应深色背景
   - 优化了视觉层次
   - Commit: 建筑弹窗背景改为深蓝色

5. **代码提交与Git管理**
   - 所有修改已提交到 master 分支
   - 共 2 个主要提交

---

## 📚 关键文件清单

### 核心文件

| 文件 | 行数 | 主要功能 |
|------|------|
| `static/js/app.js` | ~2800 | **主应用逻辑 |
| `static/js/data.js` | ~1200 | 地标/谜题数据定义 |
| `server.py` | ~300 | Flask后端API |
| `config.py` | ~60 | 后端配置 |
| `storage.py` | ~300 | OSS + 本地存储管理 |

---

## 🏗️ `app.js` 核心架构

### 一、App 主对象结构

```javascript
const App = {
    state: {
        // 地图相关
        map: null,
        markers: new Map(),
        buildingMarkers: {},
        
        // 关卡进度
        currentExploreMode: 'normal',

        // 音频
        selectedAudio: null,
        currentAudio: null,
        
        // 标记图标
        selectedIcon: null,
        
        // 声音探索（可选
        ...
    },

    // 方法: {},
    data: null,
    utils: null
};
```

---

### 二、核心入口与初始化

#### 初始化流程 `App.init()`（约 `app.js:2650

```javascript
init: function() {
    // 1. 获取DOM引用
    this.initElements();
    // 2. 初始化地图
    this.initMap();
    // 3. 注册事件监听
    this.initEventListeners();
    // 4. 加载用户进度
    this.loadUserState();
    // 5. 放置已有标记
    this.loadMarkers();
    // 6. 音频列表
    this.updateAudioList();
}
```

---

### 三、6关卡引导系统关键代码

#### 关卡数据 `data.js:10

```javascript
Data.levels = [
  {
    id: 1,
    title: '认识校园',
    unlockFeatures: ['mapDrag', 'mapZoom'],
    buildings: ['all']
  },
  {
    id: 2,
    title: '放置标记',
    unlockFeatures: ['addMarker', 'selectIcon']
  },
  // ... 共 6 个关卡
]
```

#### 关卡限制应用函数 `app.js:620

```javascript
applyLevelRestrictionsWithoutPopup: function() {
    const currentLevel = Data.levels.find(l => l.id === Storage.userProgress.currentLevel);
    if (!currentLevel) return;
    
    // 根据关卡显示地标
    this.showLevelBuildings(currentLevel);
    
    // 根据关卡显示UI元素
    this.showLevelElements(currentLevel);
    
    // 根据关卡解锁地图控制
    this.enableLevelMapControls(currentLevel);
}
```

#### 关卡完成检测函数 `app.js:1181

```javascript
completeLevel: function() {
    const currentLevel = Data.levels.find(l => l.id === Storage.userProgress.currentLevel);
    
    if (!Storage.userProgress.completedLevels.includes(currentLevel.id)) {
        Storage.userProgress.completedLevels.push(currentLevel.id);
    }
    
    // 解锁功能
    currentLevel.unlockFeatures.forEach(feature => {
        if (!Storage.userProgress.unlockedFeatures.includes(feature)) {
            Storage.userProgress.unlockedFeatures.push(feature);
        }
    });
    
    // 进入下一关
    if (currentLevel.id < Data.levels.length) {
        Storage.userProgress.currentLevel = currentLevel.id + 1;
    }
}
```

---

### 四、地标点击展示 `app.js:765

```javascript
showBuildingInfo: function(buildingId, building) {
    // 检查关卡要求 Level 5 及以上才显示谜题
    const showPuzzle = Storage.userProgress.currentLevel >= 5;
    
    // 生成弹窗内容
    let puzzleEvent = Data.puzzleEvents[buildingId + '_puzzle'];
    
    // 弹窗包含：
    - 建筑名称
    - 建筑描述
    - 播放音频按钮
    - 8种情绪反应按钮
}
```

---

### 五、谜题事件与音频映射

`data.js:580

```javascript
Data.puzzleEvents = {
    'old_management_building_puzzle': {
        title: '紫金港初建',
        description: `2002年10月...',
        audioPattern: '脚步声', // --> app.js:2457
        reactions: { like: 0, happy: 0, /* 8种
        isUnlocked: false,
        isPlayed: false
    },
    // ...共 43 个
};
```

---

### 六、音频播放

#### 获取音频文件 `app.js:2455

```javascript
getAudioFileByPattern: function(pattern) {
    const audioMap = {
        '脚步声': '/default_audio/脚步声.mp3',
        '风声': '/default_audio/风声.mp3',
        // ... 43个
    };
}
```

#### 音频播放 `app.js:1400

```javascript
playAudio: function(audioUrl, buttonElement = null) {
    if (this.state.currentAudio?.pause();
    const audio = new Audio(audioUrl);
    
    // 检测是否为默认音频，如果是，则自动检测是否第 5关完成
    
    if (isDefaultAudio && Storage.userProgress.currentLevel === 5) {
        this.state.level5Completed = true;
        this.completeLevel();
    }
}
```

---

## 🎵 `server.py` 后端路由

```python
# 首页
@app.route('/')
def home():
    return app.send_static_file('index.html')

# 健康检查
@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"})

# 音频列表
@app.route('/audio_list')
def get_audio_list():
    files = storage_manager.list_files()
    return jsonify({"files": files})

# 上传音频
@app.route('/upload_audio', methods=['POST'])
@require_auth
@rate_limit
def upload_audio():
    # 处理文件上传到 OSS 或本地
    # 存储元数据
    # 返回 URL

# 提供默认音频
@app.route('/default_audio/<path:filename>')
def serve_default_audio(filename):
    return send_from_directory('audio/default_audio', filename)
```

---

## 📦 `storage.py` 存储管理

```python
class StorageManager:
    def __init__(self):
        # 优先 OSS 配置检查
        if OSS_ACCESS_KEY_ID = os.getenv('OSS_ACCESS_KEY_ID')
        # ...
        
    def upload_file(self, file, oss_key):
        if self.use_local_fallback:
            # 本地上传
        else:
            # OSS 上传
    
    def get_file_url(self, oss_key):
        if self.use_local_fallback:
            # 返回本地路径 URL
        else:
            # 返回 OSS 签名 URL
```

---

## 🔑 关键数据流向

### 1. 关卡进度流程

用户点击地标 -> 满足关卡条件

```
用户操作用户操作
    ↓
completeLevel() app.js:1181
    ↓
Storage.userProgress 更新
    ↓
applyLevelRestrictionsWithoutPopup()
    ↓
显示下一关
```

### 2. 音频流程

用户点击播放音频

```
用户点击用户点击地标
    ↓
showBuildingInfo()
    ↓
检查 >=5关卡
    ↓
弹窗
    ↓
用户点击播放
    ↓
playAudio()
    ↓
触发关卡5完成检测
    ↓
保存进度
```

---

## ⚙️ 环境变量与配置 `config.py`

```python
# 必须配置
OSS_ACCESS_KEY_ID = os.getenv('OSS_ACCESS_KEY_ID')
OSS_ACCESS_KEY_SECRET = os.getenv('OSS_ACCESS_KEY_SECRET')
OSS_BUCKET_NAME = os.getenv('OSS_BUCKET_NAME')
OSS_ENDPOINT = os.getenv('OSS_ENDPOINT')

# 如果没有配置 OSS，用本地 fallback
```

---

## 🚀 Render 部署与部署点

### Flask 配置要点

1. **Root Directory`: 项目根目录

2. **Build Command**: `pip install -r requirements.txt`

3. **Start Command`: `python server.py`

4. **Environment Variables**

```env
OSS_ACCESS_KEY_ID=...
OSS_ACCESS_KEY_SECRET=...
OSS_BUCKET_NAME=...
OSS_ENDPOINT=...
HOST=0.0.0.0
PORT=10000
```

---

## ✅ 已解决问题

### 音频文件名匹配（已修复 2026-04-27）

- `app.js:getAudioFileByPattern()` 重写，audioMap 仅包含 `static/default_audio/` 中实际存在的文件
- `data.js` 中 26 个建筑的 `audioPattern` 全部替换为新的 14 个有效 pattern 名
- fallback 改为 `/default_audio/踩石子.mp3`（真实存在）

---

## 📋 部署状态

Phase 1 OSS ✅ 完成
Phase 2 Render Web Service ✅ 完成（已部署上线）

---

## 💾 `storage.js` 本地存储结构

```javascript
const Storage = {
    userProgress: {
        currentLevel: 1,              // 当前关卡
        completedLevels: [],         // 已完成关卡
        exploredBuildings: [],      // 已探索地标
        unlockedFeatures: []        // 已解锁功能
    },
    
    loadUserProgress() {
        const saved = localStorage.getItem('userProgress');
        if (saved) {
            this.userProgress = JSON.parse(saved);
        }
    },
    
    saveUserProgress() {
        localStorage.setItem('userProgress', JSON.stringify(this.userProgress));
    }
}
```

---

## 🔧 `utils.js` 工具函数

### validateUrl 函数 (2026-04-27 更新)

```javascript
validateUrl(url) {
    try {
        if (url.startsWith('/')) return true;
        const parsedUrl = new URL(url);
        return parsedUrl.origin === window.location.origin || 
               parsedUrl.origin === 'http://localhost:8000' || 
               parsedUrl.origin === 'http://127.0.0.1:8080' ||
               parsedUrl.hostname.endsWith('.aliyuncs.com') ||
               parsedUrl.hostname.endsWith('.oss-cn-hangzhou.aliyuncs.com');
    } catch {
        return false;
    }
}
```

**允许的域名：**
- 相对路径 (`/`)
- 当前页面域名
- `http://localhost:8000`
- `http://127.0.0.1:8080`
- `.aliyuncs.com` (阿里云 OSS 通用域名)
- `.oss-cn-hangzhou.aliyuncs.com` (阿里云 OSS 杭州区域域名)

---

## 🎯 部署前验证检查清单

### 功能检查
- 本地访问 http://127.0.0.1:5000/health 返回
- 地图显示正常
- 地标加载正常
- 音频可播放（包括本地和 OSS）
- 关卡引导工作正常
- 声音面板显示默认音频无报错
- 图书馆闭馆音乐挑战功能正常

---

## 📞 如有问题
随时沟通！
