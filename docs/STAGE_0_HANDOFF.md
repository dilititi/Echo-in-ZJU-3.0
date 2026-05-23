# 阶段 0 · 基础收尾 · 交接文档

> 日期：2026-05-21
> 项目阶段：双产品路线图 阶段 0（2026-05 ~ 2026-06）—— **代码侧已收口**，等待美术资产
> 下一阶段：Phase 1 `shared/` 重构（2026-07 开始）
> 毕业季 deadline：2027-04-21

---

## 1 · 这个项目要变成什么

紫金港声音地图当前的 `/map` 入口是双产品的**共享基础**。后续：

```
/field    田野声音地图  ← 现 /map 的延续
/yearbook 校园毕业纪念册（2026-11 起开建，2027-04-21 上线）
```

完整规划见 `docs/REFACTOR_SHARED_PREVIEW.md`。

---

## 2 · 阶段 0 收口清单

| 工作 | 产物 | 状态 |
|---|---|:-:|
| 建筑坐标真实化（footprint centroid） | `static/js/bootstrap.js` 启动 IIFE | ✅ 已上线（前次 commit） |
| 谜题完成动画系统 | `static/js/animation-system.js` | ✅ 已上线（前次 commit） |
| 渐进式插画图层 | `static/js/illustrated-layer.js` | ✅ 已上线（前次 commit） |
| **坐标对齐校验** | `scripts/verify_centroid_positions.py` + `centroid_layout.png` | ✅ |
| **重叠 marker 视觉方案** | `static/js/marker-spread-offsets.js` + bootstrap 应用 | ✅ |
| **力导向 PoC** | `scripts/force_spread_markers.py` + `spread_layout.png` | ✅ |
| **美术规范文档** | `docs/ART_ASSET_SPEC.md` | ✅ |
| **shared/ 重构预演** | `docs/REFACTOR_SHARED_PREVIEW.md` | ✅ |
| **资产加载诊断面板** | `static/js/asset-diagnostics.js` | ✅ |
| **方案 PoC 报告** | `docs/MARKER_SPREAD_POC.md` | ✅ |
| Lottie × 6 主题资产 | `static/assets/lottie/*.json` | ⏳ 美术外包 |
| per-building SVG × 26 | `static/assets/illustrated/*.svg` | ⏳ 美术外包 |

---

## 3 · 关键技术决策（接手前必读）

### 3.1 footprint centroid + 力导向 spread

- **footprint 优先于 hand-placed position**：所有 26 栋楼 boot 时由 `bootstrap.js` 重算 position
- **再叠加 spread offset**：120×120 marker 缩略图在密集区会重叠，预计算 offset 在 `static/js/marker-spread-offsets.js` 里
- **平均漂移 40 px（~24m），最大 92 px（~55m，农学集群）**
- **关 spread 走原始 centroid**：URL 加 `?spread=0`
- **重算 offset**：改了 `data.js` footprint 或新增建筑后跑 `python scripts/force_spread_markers.py`，把 `spread_offsets.json` 复制到 `static/js/marker-spread-offsets.js`（小数留 1 位）

### 3.2 资产路径（**不要改命名**，代码硬编码了）

```
static/assets/lottie/{theme}.json       # 6 个主题
static/assets/illustrated/{buildingId}.svg  # 26 张
```

主题清单：`animals` `equations` `marine` `stars` `leaves` `lamps`
buildingId：见 `data.js` 里 `Data.buildings` 的 26 个 key

### 3.3 资产缺失时的兜底

- Lottie 缺 → emoji 主题粒子动画（`animation-system.js` 内置 EMOJI_BANK）
- SVG 缺 → 主题 glyph 圆形（`illustrated-layer.js` 内置 fallbackSvgUrl）

**所以美术资产没到位也能 demo**，资产到位后自动覆盖。

### 3.4 数据层为双产品分离做了哪些准备

**目前还没拆**。`Storage.userProgress.*` 仍是单 namespace。
拆分会在 **Phase 1（2026-07）** 做，详见 `docs/REFACTOR_SHARED_PREVIEW.md` §3.2。
未来：`progress_field` / `progress_yearbook` 双 key + `Storage.create(namespace)` 工厂模式。

---

## 4 · 美术资产到位后怎么验证

```bash
# 1. 启动服务器（注意 PORT 不能用 10000，被深信服 VPN 劫持）
PYTHONIOENCODING=utf-8 PORT=8081 python server.py

# 2. 浏览器开诊断面板
http://localhost:8081/map?debug=assets
```

右上角面板会自动检测所有 32 个资产路径：

- ✓ green = 命名 + 路径正确，已加载
- ✗ red = 404，命名 / 路径不对或没提交
- 右侧文件大小，方便核对压缩是否达标
  - Lottie 目标 < 200 KB / 个
  - SVG 目标 < 50 KB / 个

无 `?debug=assets` 参数 → 面板隐藏，正式用户无感。

---

## 5 · 关键文件速查

| 文件 | 行数 | 角色 |
|---|---:|---|
| `static/js/bootstrap.js` | 70 | 启动入口，跑 footprint 拟合 + spread offset 应用 |
| `static/js/data.js` | 769 | 26 栋楼 footprint + 谜题 + 关卡（暂不拆） |
| `static/js/animation-system.js` | 142 | 谜题完成 Lottie + emoji 兜底 |
| `static/js/illustrated-layer.js` | 152 | per-building SVG 累加图层 + fallback |
| `static/js/marker-spread-offsets.js` | 30 | 26 条预计算偏移量 |
| `static/js/asset-diagnostics.js` | 130 | dev-only 资产审计面板 |
| `static/js/coordinate_system.js` | 57 | 像素 ↔ WGS84 ↔ Three.js |
| `static/js/markers.js` | 524 | 建筑 marker + 信息卡 + 谜题 UI（Phase 1 待拆） |
| `static/js/storage.js` | 396 | 单 namespace localStorage（Phase 1 改工厂） |
| `static/js/scene3d.js` | 338 | Three.js 3D 校园（不受 spread 影响，用 footprint 直接挤出） |

---

## 6 · 已知边界 / 不要踩的坑

1. **`Data.buildings.<id>.position` 在 boot 后会被覆盖**：data.js 字面值是初始值，运行时已经是 `centroid + spread offset`。Console 里查 `Data.buildings.zju_library.position` 看到的是运行时值。
2. **`?spread=0` 关 spread**：测试地理精度时用，正式用户不要暴露
3. **3D 不读 position**：scene3d.js 用 footprint 直接挤出 ExtrudeGeometry，与 spread 无关
4. **agricultural cluster 6 栋楼是最密的**：单独改它们任何一栋的 footprint 都会让 spread 重新分配，记得跑 `force_spread_markers.py`
5. **`?debug=assets` 是开发用**：32 个 HEAD 请求会刷 Network 面板，不要在演示时开
6. **PORT 不能用 10000**：深信服 VPN 在中国大陆段会劫持，永远用 8081 或别的

---

## 7 · 下一步（接手 Phase 1 的人看这里）

**目标时间**：2026-07-01 开始，1 个月内完成

**主要工作**：
1. 创建 `static/shared/` `static/field/` `static/yearbook/` 三个目录
2. 按 `docs/REFACTOR_SHARED_PREVIEW.md` §「文件归类表」迁移 22 个 JS 文件
3. 拆 `markers.js`（524 行 → 3 文件）和 `storage.js`（工厂模式）
4. `server.py` 加 `/field` 路由（保留 `/map` → `/field` 301）
5. 创建空 `/yearbook` 入口占位
6. Playwright 全量回归测试

**风险**：改 `markers.js` 拆分时极易漏方法。建议接手前先跑 `Object.keys(App)` 列出所有方法，逐项对照。

**不要做的事**：
- ❌ 改 `data.js` 内部结构（关卡/谜题拆分留到 Phase 2）
- ❌ 引入新框架（React/Vue/Svelte）—— shared/ 阶段保持原生 JS
- ❌ 同时启动 Phase 3 纪念册功能开发（先把 shared/ 收口）

---

## 8 · 文档地图

| 文档 | 看什么 |
|---|---|
| **本文档** | 阶段 0 总览 + 关键决策 |
| `docs/ART_ASSET_SPEC.md` | 美术外包规范（Lottie + SVG 风格 / 尺寸 / 主题分配） |
| `docs/REFACTOR_SHARED_PREVIEW.md` | Phase 1 重构表（22 文件归类 + 拆分细节） |
| `docs/MARKER_SPREAD_POC.md` | 重叠 marker 5 个方案对比 |
| `PROJECT_MASTER.md` | 项目整体技术栈 / 部署 / 历史 |
| 路线图 memory | Claude 项目记忆，11 月时间线 |

---

## 9 · 紧急联系 / 上线发布

- **Render 部署**：master push 即 CD，约 3-5 分钟生效
- **生产 URL**：https://echo-zju-3-0.onrender.com
- **回滚**：`git revert <commit>` + push；或 Render 后台手动选旧版本 redeploy
- **localStorage 重置**：用户右上角抽屉 → 重置所有数据
