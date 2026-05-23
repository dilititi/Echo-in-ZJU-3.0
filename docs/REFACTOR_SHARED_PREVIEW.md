# Phase 1 · `shared/` 重构预演表

> **目的**：Phase 1 (2026-07) 开始前，先列出当前 22 个 JS 模块的去向，方便审议与 diff 预览。
> **方法**：每个文件归类到 `shared/` / `field/` / `yearbook/` 之一；标注是否需要拆分。

## 目录目标

```
static/
├── shared/              # 通用模块（双产品共享）
│   ├── coordinate_system.js
│   ├── data.js          # 建筑 + 谜题 + 关卡 都在这（暂不拆，由各产品按需读）
│   ├── animation-system.js
│   ├── illustrated-layer.js
│   ├── audio-manager.js
│   ├── audio3d.js
│   ├── scene3d.js
│   ├── map-layers.js
│   ├── markers.js       # 仅 base 渲染，不带样式
│   ├── storage.js       # 提供 namespace 工厂：Storage.create('field') / Storage.create('yearbook')
│   ├── config.js
│   ├── utils.js
│   ├── migration.js
│   └── tests.js
│
├── field/               # 田野声音地图
│   ├── index.html       # 现 /map 入口
│   ├── app.js           # 田野专属 App.* 方法
│   ├── bootstrap.js
│   ├── level-system.js
│   ├── guide-system.js
│   ├── sound-explore.js
│   ├── markers-patch.js     # Field Journal 风格 marker 装饰
│   ├── map-layers-patch.js  # Field Journal sepia 滤镜
│   └── config-check.js      # field 自己的 sanity check
│
└── yearbook/            # 校园毕业纪念册（Phase 3 才开建，先占目录）
    ├── index.html
    ├── app.js
    ├── bootstrap.js
    ├── memory-system.js     # 待写：留言/故事 puzzle
    ├── timeline.js          # 待写：四年时间轴
    ├── markers-patch.js     # 暖色纪念册风格
    └── export/              # PDF/长图导出
```

## 文件归类表

| 文件 | 行数 | 当前职责 | 归向 | 备注 |
|---|---:|---|---|---|
| `coordinate_system.js` | 57 | 像素 ↔ WGS84 ↔ Three.js | **shared/** | 完全通用 |
| `data.js` | 769 | 建筑 + 谜题 + 关卡 + markerTypes | **shared/** | 谜题/关卡是 field 专属，但因体量大暂不拆 |
| `animation-system.js` | 142 | 谜题完成 Lottie/emoji 动画 | **shared/** | yearbook 答题/留言也用 |
| `illustrated-layer.js` | 152 | per-building SVG 累加图层 | **shared/** | yearbook 的"我的校园"也用此机制 |
| `audio-manager.js` | 671 | 音频播放 + 上传 + 池管理 | **shared/** | yearbook 录音回忆也用 |
| `audio3d.js` | 435 | 3D 空间音频 | **shared/** | 两产品的 3D 模式都用 |
| `scene3d.js` | 338 | Three.js 校园场景 | **shared/** | 通用底座 |
| `map-layers.js` | 183 | Leaflet 图层 + 主题 + 归因 | **shared/** | 不含 sepia 滤镜 |
| `markers.js` | 524 | 建筑标记 + 信息卡 + 谜题 UI | **拆分** | base marker 留 shared；信息卡/谜题挪到 field/ |
| `config.js` | 30 | 前端配置 | **shared/** | 通用 |
| `utils.js` | 46 | toast / 节流 / 工具 | **shared/** | 通用 |
| `tests.js` | 251 | 测试套件 | **shared/** | 通用 |
| `migration.js` | 91 | localStorage 数据迁移 | **shared/** | 需扩展支持 `progress_field` / `progress_yearbook` 双 key |
| `storage.js` | 396 | localStorage 读写 | **重写** | 改成 `Storage.create(namespace)` 工厂，各产品实例化自己的 |
| `config-check.js` | 265 | 启动期配置检查 | **field/** | 检查项主要是 field 的（音频、谜题、地标） |
| `app.js` | 252 | 主应用入口 + 全局 state | **field/** | 内容已经主要是 field 逻辑 |
| `bootstrap.js` | 54 | 启动顺序 + footprint 自动定位 | **拆分** | footprint 计算挪到 shared；启动入口拆到 field/yearbook |
| `level-system.js` | 628 | 6 关卡系统 | **field/** | yearbook 不用关卡 |
| `guide-system.js` | 197 | 首次引导 | **field/** | yearbook 有自己的入场动画 |
| `sound-explore.js` | 596 | 声音探索 / 地标列表 | **field/** | 田野专属玩法 |
| `markers-patch.js` | 276 | Field Journal 风格 marker | **field/** | 已经命名清楚 |
| `map-layers-patch.js` | 81 | Field Journal sepia 滤镜 | **field/** | 已经命名清楚 |

**合计**：14 个 shared / 8 个 field（含 2 拆分项）/ 0 个 yearbook（Phase 3 新建）

## 重点拆分细节

### 1. `markers.js` → `shared/markers-base.js` + `field/info-card.js`

当前 524 行混了三件事：
- **基础渲染**（marker DOM + 缩略图 + click handler）→ `shared/markers-base.js` (~150 行)
- **信息卡弹窗**（buildig info modal）→ `field/info-card.js` (~200 行)
- **谜题 UI**（题目 / 答题 / 提交）→ `field/puzzle-ui.js` (~170 行)

yearbook 会写自己的 `yearbook/memory-card.js` 和 `yearbook/story-puzzle.js` 替换后两者。

### 2. `storage.js` → 工厂模式

当前 `Storage.userProgress.solvedBuildings` 是单 key，改成：

```js
// shared/storage.js
const Storage = {
  create(namespace) {
    const key = `progress_${namespace}`;
    return {
      load() { return JSON.parse(localStorage.getItem(key) || '{}'); },
      save(data) { localStorage.setItem(key, JSON.stringify(data)); },
      // ... 其他 API 都加 namespace 前缀
    };
  }
};

// field/app.js
window.FieldStorage = Storage.create('field');
// yearbook/app.js
window.YearbookStorage = Storage.create('yearbook');
```

### 3. `bootstrap.js` → `shared/footprint-fit.js` + `field/boot.js` + `yearbook/boot.js`

`fitBuildingPositions()` IIFE 抽成 `shared/footprint-fit.js`，两个产品的 boot 各自调用，再各自初始化自己的 App。

### 4. `migration.js` → 扩展

需要新增老 `userProgress` → `progress_field` 的迁移逻辑（用户进入 `/field` 时一次性迁移）。

## 风险 & 回归测试

| 风险 | 缓解 |
|---|---|
| 改 `markers.js` 拆分时漏方法 | 提取前先 `Object.keys(App).filter(...)` 列出所有相关方法，逐个对照 |
| `Storage` 工厂改动破坏旧数据 | `migration.js` 兼容老 key 至少 3 个月 |
| 路由：`/map` 用户书签 | 保留 `/map` → `/field` 301 重定向 |
| 全局 namespace（`App`、`Data`）串台 | yearbook 用 `Yearbook` 而非 `App`；`Data` 暂保共享 |

## 不在 Phase 1 范围

- yearbook 任何真实功能（仅创建空目录占位）
- 改 `data.js` 内部结构（关卡/谜题拆分留到 Phase 2）
- 视觉风格（field 保留 Field Journal sepia；yearbook 等 Phase 3）
- Three.js 场景代码内部重构（仅做位置迁移）
