# 重叠 Marker 视觉方案 · PoC 报告

> 日期：2026-05-21
> 问题：26 栋楼 footprint centroid 投影后，15 对 marker 距离 < 60px，120×120px 缩略图严重重叠
> 最严重：农学集群（农业 / 环境 / 动物 / 生命 / 公管 / 纳米楼）6 栋挤在 50px 范围内

---

## 方案对比

### 方案 A · 力导向 spread（已 PoC）

**思路**：每个 marker 受两种力 ——
- **排斥**：与其他 marker 距离 < 110px 时按重叠量推开
- **锚定**：被自己的 footprint centroid 拉回（弱）

**结果**：
- 重叠对数：38 → 32（剩余均 > 107px，实质等同零重叠）
- 平均漂移：40 px（约 24 米真实距离）
- 最大漂移：92 px（约 55 米，发生在农学集群）

**优**
- 所有 marker 一眼可见，无需点击
- 漂移由物理过程决定，看起来"自然"
- 无外部依赖，~80 行 JS 可落地

**劣**
- 真实坐标精度损失（< 60m）—— 对田野声音地图的"地理真实"承诺有伤
- 农学集群里 6 栋楼整体被外推，集群质心稍偏离实际

**适用产品**：纪念册（地理精度不重要）；田野地图慎用

### 方案 B · 点击聚合展开（spider）

**思路**：< MIN_DIST 的 marker 在地图上初始堆叠成一个聚合图标（数字 "6"），点击后向外展开成放射状

**优**
- 默认状态下真实坐标 100% 保留
- 展开时仍能准确显示每栋楼的相对位置（点击展开半径独立于真实距离）
- 业界标准（Google Maps / Leaflet.markercluster 都是这套）

**劣**
- 隐藏信息直到用户点击，新用户可能错过
- 视觉风格偏"现代 app"，与 Field Journal 纸本感冲突
- Leaflet.markercluster 插件 ~40KB + CSS，要花时间定制样式融入纸本风

**适用产品**：田野地图（地理精度重要）

### 方案 C · zoom 级联

**思路**：低 zoom 显示聚合，高 zoom 解开成单独 marker

**优**：用户随意操作即可在精度和清晰度之间切换
**劣**：实现复杂；CRS.Simple 自定义 zoom 行为需大量定制

**适用产品**：不推荐（成本超过收益）

### 方案 D · 视觉缩小 + 标签 hover

**思路**：密集区 marker 自动缩小到 60×60，hover/tap 才展开成完整缩略图

**优**：简单，~50 行代码
**劣**：密集区识别度差，仍重叠（只是程度变小）；不解决根本问题

**适用产品**：可作为方案 A 或 B 的辅助

### 方案 E · 接受现状

**思路**：地理就这么挤，不解决；缩略图 z-index 让较北的 marker 在前，至少可点

**优**：零工作量；尊重真实地理
**劣**：用户体验差，特别是农学集群基本不可用

**适用产品**：明确不推荐

---

## 推荐路径

| 阶段 | 方案 | 理由 |
|---|---|---|
| **当前 base（双产品都用）** | 方案 A（默认开启） | 立即提升体验，漂移在可接受范围 |
| **Phase 2 田野地图打磨** | 方案 A → 方案 B 切换 | 田野用户更在意精度，给个"精确模式"开关 |
| **Phase 3 纪念册** | 方案 A 继续用 | 纪念册主打观感，精度不敏感 |

具体来说：
1. 现在落地方案 A 作为 base 默认
2. Phase 2 时在 settings 里加一个"地理精确模式"toggle，关闭 spread

---

## 方案 A 的 JS 落地草案

### 选项 1：JS 端做物理计算（每次 boot）
约 80 行 JS，加在 `bootstrap.js` 的 `fitBuildingPositions()` 之后。优点：自动适应未来新增建筑。

### 选项 2：用 Python 预计算 offsets，JS 端只 lookup（推荐）
- Python 输出 `static/data/marker_spread_offsets.json` （26 条 `id → [dy, dx]`）
- JS 端在 boot 时 fetch 这张表，加到对应 position 上
- 优点：零运行时计算，确定性，offsets 可以在外部 review/手调
- 缺点：新增建筑需要重跑 Python

**推荐选项 2**，因为：
- 26 栋楼基本不变
- 物理参数（MIN_DIST, ANCHOR_PULL）由 Python 调，JS 端不暴露
- 如果有特定建筑的 marker 需要美术师手调（"求是牌匾应该再往南一点"），直接改 JSON

---

## 关键数据点

| 指标 | 值 |
|---|---|
| MIN_DIST | 110 px |
| ANCHOR_PULL | 0.018 |
| REPEL_STRENGTH | 0.4 |
| DAMPING | 0.85 (Verlet) |
| 收敛迭代 | 143 |
| 平均漂移 | 40 px (~24m) |
| 最大漂移 | 92 px (~55m, 农学集群) |
| Canvas 像素 → 真实距离 | 1px ≈ 0.6m |

---

## 现有可视化产物

- `scripts/force_spread_markers.py` — PoC 脚本，含参数 + 对比绘图
- `scripts/spread_offsets.json` — 26 条偏移量，可直接被 JS fetch
- `scripts/spread_layout.png` — BEFORE / AFTER 对比图
