# 美术资产规范 · 紫金港声音地图

> 用途：交付给美术外包/同学创作 6 个主题 Lottie + 26 张 per-building SVG。
> 当前代码里都已经接好对应的资产路径，资产 drop in 即用，无需改代码。
> 现在没资产时，系统走 emoji-burst / 主题 glyph 圆形 兜底（不会报错）。

---

## 一、整体视觉语言

| 维度 | 要求 |
|---|---|
| 风格关键词 | **Field Journal · 田野手账 · 纸本插画 · 复古博物图鉴** |
| 参考意象 | 《海错图》、Studio Ghibli 自然背景、Vintage Botanical Illustrations、19 世纪博物学手稿 |
| 主色调 | 羊皮纸米黄 `#f5e4bd`、印泥红 `#9c3a2e`、墨黑 `#1b263b`、金线 `#d4af37`、苔藓青 `#7a8b6f` |
| 笔触 | 略带颗粒感的手绘墨线；不要纯几何 Flat 风；不要 3D 渲染 |
| 透明度 | 所有元素需带透明背景（叠加在地图上） |
| 字体风格（如有文字） | Georgia / 衬线，避免数字化字体 |

**严禁**：
- ❌ AI 一键生成（缺乏手作温度，与项目调性冲突）
- ❌ 高饱和卡通 / Q 版 / Chibi
- ❌ Flat Design / Material / 极简几何
- ❌ 任何浙大 logo、校徽（版权 + 调性问题）

---

## 二、Lottie × 6 主题（谜题完成动画）

### 路径与命名

```
static/assets/lottie/animals.json
static/assets/lottie/marine.json
static/assets/lottie/equations.json
static/assets/lottie/stars.json
static/assets/lottie/leaves.json
static/assets/lottie/lamps.json
```

### 通用技术参数

| 参数 | 值 |
|---|---|
| 容器尺寸 | 渲染为 220 × 220 px（CSS），导出时 `w:512, h:512` |
| 时长 | **1.5 – 2.5 秒**（短于此显得急促，长于此打断答题节奏） |
| 帧率 | 30 fps |
| 文件体积 | **< 200 KB / 个**（用 Bodymovin 压缩，去掉嵌入位图） |
| 透明背景 | 必须 |
| Loop | **不循环**（播放一次自动消失） |
| 入场 | 0 - 30 帧：从中心点扩散 |
| 出场 | 末 15 帧：淡出而非突变 |

### 主题清单

| 主题 | 关联建筑 | 视觉概念 |
|---|---|---|
| **animals** （默认） | 动物科学学院 + 其他未指定建筑 | 三两只手绘小动物（兔/鹿/鸟）从建筑后探头 → 跃出 → 摇尾消散；可加脚印淡出 |
| **equations** | 求是大讲堂 / 基图副楼 / 主图书馆 / 纳米楼 | 公式 π / ∫ / Σ / √ / φ 像气泡一样从中心升起，墨水笔触感；可加几何线条勾勒 |
| **marine** | 求是湖周边（占位） | 一只海豚剪影跃出水面，水花化作 4-5 颗水滴扩散；底部带 1-2 道波纹 |
| **stars** | 浙大体育馆（占位天文楼） | 5-7 颗手绘星星从中心点辐射展开；星轨用细金线连接；可加一颗流星 |
| **leaves** | 南华园 / 启真酒店 / 环境与资源学院 | 3-5 片落叶（银杏/枫/竹）从顶部飘下，旋转飘散；色调秋黄 + 苔绿 |
| **lamps** | 西溪校门 / 南大门 / 求是牌匾 | 一盏纸灯笼/油灯从中心点亮 → 光晕扩散 → 周围浮起 2-3 只萤火虫 |

### 「答对」vs「答错」差异

系统会传入 `opts.result = 'correct' | 'wrong'`，但**目前只通过 CSS class 区分（`.lottie-burst-wrong` 整体变灰）**。

美术不用做两个版本，**只做一份"正常"的动画**即可。如果美术想做双版本：错答版本调子变冷（如 leaves 主题里的叶子枯黄、equations 里公式打个叉），可以**额外**交付 `_wrong.json` 后缀文件，未来再接入。

---

## 三、Per-Building SVG × 26

### 路径与命名

```
static/assets/illustrated/<buildingId>.svg
```

26 个 buildingId 全列如下（来自 `data.js`）。

### 通用技术参数

| 参数 | 值 |
|---|---|
| ViewBox | `0 0 300 300` |
| 渲染尺寸 | 300 × 300 px（贴在地图上为建筑周围 ±150 像素的圆形区域） |
| 文件体积 | **< 50 KB / 个**（手工绘制再 SVGO 压缩） |
| 透明背景 | 必须 |
| 中心 ±20px | 留空，避免遮挡建筑 marker 本身 |
| 主体范围 | 离中心 60-140 px 的环形区域绘制装饰元素 |
| 颜色 | 严格用上面五色调色板（米黄/印泥红/墨黑/金/苔青） |

### 内容指导原则

每张 SVG 是"这栋楼周围的小世界"，包含两类元素：

1. **该楼性格的主题元素**（依下表主题）
2. **环境装饰**（共通）：手绘小径、树丛、台阶、路灯、长椅、几只飞鸟、地砖花纹 —— 不必每张都全有，每张挑 2-3 样即可，让 26 张拼起来时不会同质化

### 26 栋楼清单（按主题归类）

#### Equations 公式系（4 栋）— 学术殿堂感

| buildingId | 中文名 | 建议元素 |
|---|---|---|
| `qiushi_auditorium` | 求是大讲堂 | 圆形穹顶剪影 + 飘出的 π/Σ 符号 + 木质讲台椅 |
| `old_management_building` | 基图副楼 | 高楼侧面笔触 + 飘窗 + 旁边老樟树 |
| `zju_library` | 浙大图书馆 | 几本散落的书 + 阅读灯 + 玻璃幕墙反光线 |
| `nano_building` | 纳米楼 | 分子结构线稿 + 行政窗口暖光 |

#### Animals 动物系（默认主题，约 14 栋）— 自然生灵

| buildingId | 中文名 | 建议元素 |
|---|---|---|
| `animal_science_college` | 动物科学学院 | 一只小鹿/牛/羊踱步；建议**最精致**的一张 |
| `medical_college` | 医学院 | 听诊器 + 一只小白鼠探头 + 红十字标 |
| `pharmacy_college` | 药学院 | 草药束 + 研钵 + 蝴蝶停在花上 |
| `life_science_college` | 生命科学学院 | 显微镜剪影 + DNA 双螺旋藤蔓化 + 一只小昆虫 |
| `agricultural_college` | 农业与生物技术学院 | 一束麦穗 + 草帽 + 田鼠 |
| `bioengineering_food_college` | 生物系统工程与食品科学学院 | 烧瓶 + 面包 + 一只小蜜蜂 |
| `humanities_college` | 人文学院 | 翻开的古书 + 鹅毛笔 + 一只猫蜷在书上 |
| `education_college` | 教育学院 | 小学课桌椅 + 苹果 + 一只飞鸟 |
| `public_administration_college` | 公共管理学院 | 印章 + 卷轴 + 鸽子 |
| `zhu_kezhen_college` | 竺可桢学院 | 老式天文望远镜 + 几本厚书 + 猫头鹰 |
| `art_archaeology_museum` | 艺术与考古博物馆 | 青铜器剪影 + 陶片 + 蝙蝠 |
| `foreign_language_college` | 外国语学院 | 几种语言文字片段 + 邮筒 + 信鸽 |
| `mengmingwei_building` | 蒙明伟楼 | 行政感办公桌 + 茶杯 + 鸽子 |
| `architectural_college` | 建筑工程学院 | 卷尺 + 蓝图 + 蜻蜓 |

#### Marine 水系（1 栋，预留）— 拟"涉水"建筑

| buildingId | 中文名 | 建议元素 |
|---|---|---|
| `qizhen_hotel` | 启真酒店 | 高层窗户暖光 + 一只海鸥 + 水波纹（紧邻求是湖） |

注：`qizhen_lake` 在动画 THEME_MAP 里但不在 buildings 列表中，先不画。

#### Leaves 草木系（2 栋）— 园林感

| buildingId | 中文名 | 建议元素 |
|---|---|---|
| `nanhua_garden` | 南华园 | 银杏叶飘落 + 石桌 + 假山 + 一只蝴蝶 |
| `environmental_resource_college` | 环境与资源学院 | 大叶植物 + 雨滴 + 蚯蚓 |

#### Stars 星空系（1 栋）— 仰望感

| buildingId | 中文名 | 建议元素 |
|---|---|---|
| `zju_gymnasium` | 浙大体育馆 | 体育馆弧形屋顶 + 头顶星点 + 一只夜枭 |

#### Lamps 灯笼系（3 栋）— 门户庄重感

| buildingId | 中文名 | 建议元素 |
|---|---|---|
| `old_zju_gate` | 西溪校区校门 | 老式校门牌坊 + 挂灯 + 围墙青苔 |
| `south_gate` | 南大门 | 高大门柱 + 路灯 + 警卫亭剪影 + 一只猫 |
| `qiushi_plaque` | 求是牌匾 | 牌匾正面 + 两侧绿植 + 一只麻雀 |

#### 其他 4 栋（按邻近建筑相近风格自由发挥）

| buildingId | 中文名 | 建议元素 |
|---|---|---|
| `zju_crescent_building` | 月牙楼 | 月牙形屋顶剪影 + 学生背影 + 一只猫蹲在屋檐 |

---

## 四、交付要求

### 文件清单

```
[Lottie] 6 个 .json 文件，命名同上
[SVG]   26 个 .svg 文件，命名 = buildingId.svg
```

### 命名 / 路径 严格匹配（否则代码 fallback）

- ❌ `求是大讲堂.svg` → ✅ `qiushi_auditorium.svg`
- ❌ `library.svg` → ✅ `zju_library.svg`

### 提交方式

1. 全部资产打包发给项目维护者
2. 维护者放入 `static/assets/lottie/` 和 `static/assets/illustrated/`
3. 浏览器刷新即可看到效果，无需改代码

### 验收标准

每个资产个体：
- ✅ 路径 / 命名严格匹配
- ✅ 视觉风格符合上文「整体视觉语言」
- ✅ 体积达标
- ✅ 透明背景

整体：
- ✅ 26 张 SVG 拼起来时风格统一，又各有趣点
- ✅ 6 个 Lottie 主题之间情绪节奏一致（都 ~2 秒、都不打断答题流）

---

## 五、参考资源 / 灵感

- 《海错图》 — 故宫官方电子版（手绘海洋生物博物图）
- William Bartram 18 世纪植物学手稿
- Beatrix Potter 兔子先生系列
- Studio Ghibli 《龙猫》《千与千寻》场景速写本
- 项目里现有 `static/css/field-journal.css` 的色调与纸本质感

---

## 六、时间线（与项目路线图对齐）

- **2026-05-21（今天）**：本规范交付，开始外包
- **2026-06-30**：所有资产到位（Phase 0 结束）
- **2026-07-01**：进入 Phase 1 shared/ 重构，资产已稳定

如有疑问，先看一遍现有代码里 emoji-burst / glyph 圆形的兜底效果（已上线），就能直观知道**最低成本可接受**长什么样 —— 真实美术应**显著超过**这个水平。
