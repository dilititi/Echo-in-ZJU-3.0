# 紫金港声音地图 · 综合项目文档

**版本**：2026-05-14  
**部署**：https://echo-zju-3-0.onrender.com  
**仓库**：master 分支

---

## 一、Claude 行为准则

1. **禁止全局搜索**：除非明确下达"全局搜索"或"grep"指令，否则只精准读取指定文件路径。
2. **先审批，后动手**：修改代码前先说明修改思路和目标行号，等明确回复"同意"后才执行编辑。
3. **极简输出**：不说废话，不道歉，不解释基础常识，直接给结论或核心代码。
4. **只处理相关文件**：只关注 JS 和 Python 文件，不盲目读取无关语言文件。

---

## 二、项目概述

**名称**：紫金港声音地图  
**类型**：Art Deco 风格校园交互式探索应用  
**核心功能**：
- 2D Leaflet 地图 + 26 个建筑地标
- 6 关卡引导系统
- 声音谜题（43 个 puzzleEvent）
- 用户录音与上传
- 3D 场景（Three.js，2D/3D 同页切换）
- 3D 空间音频（区域白噪音 + 移动声源 + 建筑点声源）

---

## 三、技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 HTML/CSS/JavaScript，无框架 |
| 地图 | Leaflet.js（2D），Three.js r128 + OrbitControls（3D） |
| 后端 | Python / Flask + Gunicorn |
| 存储 | 阿里云 OSS（生产）+ 本地文件系统（fallback） |
| 部署 | Render.com 新加坡节点，GitHub master 分支自动 CD |

---

## 四、目录结构

```
interactive-school-map/
├── server.py                   Flask 后端主程序
├── config.py                   OSS + 服务器配置
├── storage.py                  OSS/本地双模式存储管理
├── utils.py                    工具函数（速率限制等）
├── requirements.txt            Python 依赖
├── .env.example                环境变量模板
│
├── static/
│   ├── index.html              主页面（2D + 3D 双模式）
│   ├── assets/
│   │   └── 紫金港卫星地图.png   3D 地面贴图
│   ├── js/
│   │   ├── app.js              2D 主应用逻辑（~2800 行）
│   │   ├── data.js             地标/谜题数据（~1200 行）
│   │   ├── scene3d.js          3D 场景逻辑
│   │   ├── audio3d.js          3D 空间音频系统
│   │   ├── coordinate_system.js 坐标系转换（像素↔WGS84↔Three.js）
│   │   ├── config.js           前端配置
│   │   ├── storage.js          前端本地存储
│   │   ├── utils.js            前端工具函数
│   │   ├── migration.js        localStorage 数据迁移
│   │   ├── tests.js            测试套件
│   │   └── config-check.js     配置检查
│   ├── layers/                 26 张建筑照片
│   ├── icons/                  地图标记图标
│   └── default_audio/          45 个默认音效
│
├── audio/
│   └── default_audio/          服务端默认音频
├── soundtrack/                 图书馆闭馆音乐（29首）
│   ├── 基图/                   19首 Secret Garden 系列
│   ├── 主图/                   8首
│   └── 医图/                   2首
├── local_storage/              用户上传数据（自动创建）
└── static/models/              Blender GLB 模型（待填充）
```

---

## 五、核心文件说明

### `app.js` 关键位置

| 功能 | 行号（约） |
|------|-----------|
| `App.init()` 初始化入口 | 2650 |
| `applyLevelRestrictionsWithoutPopup()` | 620 |
| `completeLevel()` | 1181 |
| `showBuildingInfo()` 地标弹窗 | 765 |
| `playAudio()` | 1400 |
| `getAudioFileByPattern()` | 2455 |

### `data.js` 关键位置

| 数据 | 行号（约） |
|------|-----------|
| `Data.levels` 关卡数据 | 10 |
| `Data.buildings` 建筑数据 | 50 |
| `Data.puzzleEvents` 谜题数据 | 580 |

### `server.py` 路由

| 端点 | 功能 |
|------|------|
| `GET /` | **PPT 介绍页**（ppt/index.html，网站入口） |
| `GET /map` | 2D 声音地图（index.html） |
| `GET /3d_index.html` | 3D 校园漫游（旧版独立页，保留兼容） |
| `GET /health` | 健康检查 |
| `GET /audio_list` | 音频文件列表 |
| `POST /upload_audio` | 上传音频（需认证） |
| `GET /default_audio/<filename>` | 提供默认音频 |
| `GET /audio/<key>` | 获取 OSS 音频（重定向） |

---

## 六、坐标系规范

```javascript
// coordinate_system.js
// 校准点（像素坐标 ↔ WGS84）
const REF = [
    { px: [220, 920], wgs: [120.0742, 30.3043] },  // 南大门
    { px: [870, 320], wgs: [120.0821, 30.3092] },  // 启真酒店
];
const SCALE = 100 / 650;  // 像素范围 650 → Three.js 100 单位

// 转换 API
CoordinateSystem.pixelToWgs84(px, py)       // 像素 → 经纬度
CoordinateSystem.wgs84ToPixel(lng, lat)     // 经纬度 → 像素
CoordinateSystem.wgs84To3D(lng, lat, h)     // 经纬度 → Three.js
CoordinateSystem.pixelTo3D(px, py, h)      // 像素 → Three.js
```

---

## 七、3D 场景架构（scene3d.js）

### 切换函数
```javascript
switchTo3D()   // 隐藏 2D 元素，显示 #scene-3d，首次进入触发 init3D()
switchTo2D()   // 反向切换，同时停止空间音频
```

### 建筑渲染策略
```javascript
// 优先级：GLB 模型 > OSM 轮廓挤出 > 方盒退回
if (b.model)                          → loadGLTFBuilding()      // Blender GLB
else if (b.footprint.length >= 3)     → createFootprintMesh()   // ExtrudeGeometry
else if (b.position)                  → createBoxMesh()         // BoxGeometry
```

### userData 结构（每个建筑 mesh）
```javascript
mesh.userData = {
    id:           'zju_library',        // data.js key
    name:         '主图书馆',
    description:  '...',
    buildingData: b,                    // 完整建筑对象
    puzzleEvent:  Data.puzzleEvents['zju_library_puzzle'],
    hasFootprint: true,
}
```

### 建筑坐标获取（ExtrudeGeometry 坐标在顶点里，position 为 0）
```javascript
// 正确做法
mesh.geometry.computeBoundingBox();
const center = new THREE.Vector3();
mesh.geometry.boundingBox.getCenter(center);
```

---

## 八、空间音频架构（audio3d.js）

### 公开 API
```javascript
Audio3D.init()                          // 初始化（由 init3D 调用）
Audio3D.updateListener(camera)         // 每帧更新听者位置
Audio3D.tick()                         // 每帧更新移动声源（鸟）
Audio3D.startRain(intensity)           // 开启雨声
Audio3D.stopRain()                     // 关闭雨声
Audio3D.setMasterVolume(0~1)           // 主音量
Audio3D.playSpatialAudio(url, pos)     // 建筑点击播放
```

### 区域定义（已用真实建筑坐标校准）

| 区域 | 中心坐标 | 白噪音类型 | 真实音频 |
|------|---------|-----------|---------|
| 求是湖 | [-30, 0, 45] | water | 瀑布声、蛙叫、天鹅叫 |
| 西区教学 | [-6, 0, 54] | wind | 蝉鸣 |
| 东区教学 | [-13, 0, 15] | crowd | — |
| 南门主干道 | [42, 0, -128] | traffic | 请上车、踩石子 |
| 农学区 | [26, 0, -52] | wind | 蝉鸣 |
| 图书馆区 | [80, 0, -98] | crowd | — |

### 移动声源（鸟）
```javascript
{ id: 'bird1', centerX: -20, centerZ: 40,  speed: 0.008, radius: 40, height: 18 },
{ id: 'bird2', centerX: 80,  centerZ: -95, speed: 0.005, radius: 30, height: 22 },
```

### animate3D 调用顺序（不能乱）
```javascript
function animate3D() {
    requestAnimationFrame(animate3D);
    controls3d.update();
    Audio3D.updateListener(camera);   // 更新听者位置
    Audio3D.tick();                   // 更新鸟的位置（不在 updateListener 里调）
    renderer.render(scene, camera);
}
```

---

## 九、音频文件映射表（AUDIO_PATTERN_MAP）

```javascript
// scene3d.js 顶部
const AUDIO_PATTERN_MAP = {
    '踩石子声':   '踩石子.mp3',
    '走楼梯声':   '走楼梯.mp3',
    '蝉鸣声':     '蝉鸣.mp3',
    '敲键盘声':   '敲键盘.mp3',
    '踩树叶声':   '踩树叶.mp3',
    '摇晃水杯声': '摇晃水杯.mp3',
    '走路声':     '木板走路声.mp3',
    '踩木地板声': '木板走路声.mp3',
    '食堂声':     '食堂后堂声.mp3',
    '蛙鸣声':     '蛙叫（纯净）.mp3',
    '翻书声':     '翻书声.mp3',
    '电梯声':     '电梯声.mp3',
};
// URL 构造：/default_audio/文件名.mp3（不是 /audio/pattern）
```

---

## 十、建筑数据状态

### footprint 覆盖
- **21 栋**：OSM Overpass API 真实多边形轮廓
- **5 栋**：估算矩形（建工/外语/竺可桢/求是牌匾/西溪校门）

### data.js 建筑字段规范
```javascript
building_key: {
    name:        '建筑中文名',
    position:    [pixelX, pixelY],     // 2D 地图像素坐标
    image:       'layers/xxx.jpg',     // 建筑照片（顶面纹理）
    description: '...',
    footprint:   [[lng,lat], ...],     // OSM 经纬度轮廓（闭合）
    height:      18,                   // 米，可选
    model:       '/models/xxx.glb',    // Blender GLB，可选，优先于 footprint
}
```

---

## 十一、Blender 模型规范

### 导出设置
- 格式：**GLB**（二进制 GLTF）
- 单位：1 Blender 单位 = 1 米
- 原点：建筑**底面中心**
- Y 轴向上，Z 轴向北
- 导出前执行 Apply All Transforms（Ctrl+A）
- 路径：`static/models/{building_key}.glb`

### 面数预算

| 级别 | 最大面数 |
|------|---------|
| 标志性建筑 | 5000 面 |
| 次要建筑 | 2000 面 |
| 远景建筑 | 500 面 |

### 优先级清单

| 优先级 | key | 名称 | 特征 |
|--------|-----|------|------|
| P1 | zju_library | 主图书馆 | 现代玻璃幕墙 |
| P1 | qiushi_auditorium | 求是大讲堂 | 圆形穹顶 |
| P1 | south_gate | 南大门 | 牌坊门洞 |
| P2 | zju_gymnasium | 体育馆 | 弧形屋顶 |
| P2 | zju_crescent_building | 月牙楼 | 月牙形平面 |
| P3 | qizhen_hotel | 启真酒店 | 高层塔楼 |

---

## 十二、HTML 脚本加载顺序

```html
<head>
    <!-- Three.js（必须在 </head> 前）-->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head>
<body>
    ...
    <!-- 脚本顺序不能乱 -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="/js/config.js"></script>
    <script src="/js/data.js"></script>
    <script src="/js/utils.js"></script>
    <script src="/js/storage.js"></script>
    <script src="/js/migration.js"></script>
    <script src="/js/app.js"></script>
    <script src="/js/coordinate_system.js"></script>
    <script src="/js/audio3d.js"></script>
    <script src="/js/scene3d.js"></script>
    <script src="/js/tests.js"></script>
    <script src="/js/config-check.js"></script>
</body>
```

> **注意**：Flask `static_url_path='/'`，静态文件路径是 `/js/` 而非 `/static/js/`  
> **注意**：`index.html` 中所有本地资源路径已改为**相对路径**（`css/main.css`、`js/config.js` 等），支持 `file://` 直接打开预览。PPT 入口链接使用相对路径 `../index.html`，支持 file:// 和 HTTP 双协议。

---

## 十三、Render 部署配置

### 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `OSS_ACCESS_KEY_ID` | 阿里云 OSS Key | ✅ |
| `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS Secret | ✅ |
| `OSS_BUCKET_NAME` | OSS Bucket 名 | ✅ |
| `OSS_ENDPOINT` | `oss-cn-hangzhou.aliyuncs.com` | ✅ |
| `SECRET_KEY` | Flask Secret | ✅ |
| `HOST` | `0.0.0.0` | ✅ |
| `PORT` | `10000` | ✅ |
| `DEBUG` | `False` | ✅ |

### 构建配置

| 项 | 值 |
|----|-----|
| Region | Singapore |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `python server.py` |
| Runtime | Python 3.11 |

---

## 十四、已知非 Bug 报错（可忽略）

| 报错 | 原因 | 影响 |
|------|------|------|
| `GET /health ERR_BLOCKED_BY_CLIENT` | 广告拦截插件误判 | 无 |
| `fonts.gstatic.com 404` | Google Fonts CDN 不可达 | 字体降级，无功能影响 |
| `preload but not used` | 字体预加载未命中 | 无 |
| `A listener indicated async response` | 浏览器扩展通信 | 无 |

---

## 十五、当前改进进度

### ✅ 已完成（历史）

| 阶段 | 内容 |
|------|------|
| 3D 基础 | CDN 修复、坐标系建立、建筑叠加 bug 修复、地面动态计算、相机初始化 |
| OSM 轮廓 | Overpass API 拉取 21 栋真实轮廓，ExtrudeGeometry 挤出 |
| 2D/3D 整合 | scene3d.js 抽离、同页切换、汉堡菜单、语法错误修复、路径修复、Render 部署 |
| 建筑外观 | TextureLoader 纹理、多材质修复、卫星地图地面、程序化窗户纹理、屋顶细节 |
| P1 | 5 栋无轮廓建筑补全估算矩形 |
| 音频对齐 | 22 处 audioPattern 对齐磁盘文件名、双重 bug 修复（userData/URL） |
| 空间音频 | audio3d.js 完整实现，6 区域 + 2 移动声源 + 雨声天气系统 |

### ✅ 已完成（2026-05-13/14 代码审查与展览整备）

#### Bug 修复（10项）
| # | 文件 | 问题 |
|---|------|------|
| 1 | sound-explore.js | Map 事件监听器堆叠 → 命名 handler + off() 清理 |
| 2 | audio-manager.js | 音频池复用 ended 回调双触发 → 复用前清理旧 handler |
| 3 | audio-manager.js | play() 失败后 state 不一致 → catch 块完整重置 |
| 4 | audio-manager.js | audioPool 无界增长 → LRU 上限 30 条目 |
| 5 | level-system.js | console.trace() 残留 + completeLevel() 无重入保护 |
| 6 | audio-manager.js | setInterval 进度条 → requestAnimationFrame |
| 7 | sound-explore.js | 20+ click 监听器 → 容器级事件委托 |
| 8 | scene3d.js | 建筑数据双重遍历 → 单循环合并 |
| 9 | audio-manager.js | 逐条 appendChild → DocumentFragment 批量写入 |
| 10 | scene3d.js | scene.children.filter 查地面 → 模块变量直接引用 |
| 11 | scene3d.js | **textureLoader 未声明 → 模块顶部声明 + init3D 实例化**（3D 崩溃修复）|

#### 规范修复（7项）
- 删除 audio3d.js / scene3d.js / level-system.js 中所有调试 console.log
- markers.js 魔法数字 36/18 → `MARKER_SIZE` 常量
- sound-explore.js Leaflet 事件字符串 → `MAP_EVENTS` 常量
- level-system.js `completeLevel()` 补充重入保护
- coordinate_system.js 校准坐标补充标定时间与维护说明注释
- app.js state 新增 `isCompletingLevel: false` 字段
- riddleCounter 在 processAudioListData 每次调用前重置

#### PPT 介绍页（static/ppt/index.html）
- 森林墨主题（`--ink:#1a2e1f`，`--paper:#f5f1e8`）横向滚动 13 张幻灯片
- WebGL 双画布动态背景（深色/浅色交替）
- Motion One 动画库驱动入场效果
- 图片已填充：satellite.png / map-2d.png / map-3d.png / sound-puzzle.png / community.png / journey.png
- **待补充**：`images/sound-explore.png`（P06 声音探索界面截图）

#### 导航架构调整
- `server.py`：`/` → PPT 入口，`/map` → 2D 地图
- PPT → "3D 漫游" 链接改为 `../index.html?mode=3d`（调用内嵌新版 3D）
- `index.html` 补回 `?mode=3d` URL 参数检测，900ms 后自动调用 `switchTo3D()`
- `index.html` 所有本地资源路径改为相对路径（支持 file:// 直接打开）

#### 文案
- 全项目"听音辨位" → "听音辨物"（ppt/index.html、index.html、README.md）

### 📋 待处理

| 优先级 | 内容 |
|--------|------|
| P1 | 补充 `static/ppt/images/sound-explore.png`（声音探索界面截图）并推送 |
| P2 | 图片迁移至 OSS CDN（解决 Render 跨国延迟） |
| P3 | 补充孤立图片建筑条目（钟楼/计算机学院/公寓管理所/求是湖） |
| P4 | API Key 迁移至服务端（安全） |
| Blender | 3 栋标志性建筑 GLB 模型（图书馆/讲堂/南大门） |
| 音频补充 | 食堂/图书馆/咖啡区点声源，共享电动车道路声源 |

---

## 十六、常用调试命令

```javascript
// 查看所有建筑 3D 坐标
buildingMeshes.forEach(m => {
    m.geometry.computeBoundingBox();
    const c = new THREE.Vector3();
    m.geometry.boundingBox.getCenter(c);
    console.log(m.userData.name, c.x.toFixed(1), c.y.toFixed(1), c.z.toFixed(1));
});

// 实时调整卫星地图 UV
const mat = scene.children.find(o => o.userData.isGround && o.material?.map)?.material;
mat.map.offset.set(0.05, 0.12);
mat.map.repeat.set(0.48, 0.52);
mat.map.needsUpdate = true;

// 检查建筑数据字段
Object.values(Data.buildings)[0]

// 测试音频 URL
fetch('/default_audio/翻书声.mp3').then(r => console.log(r.status))
```

```bash
# 推送更新
git add .
git commit -m "描述"
git push origin master
```
