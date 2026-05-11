# 🎮 紫金港校园 3D 游戏化升级方案

## 📋 目录
1. [现状分析](#现状分析)
2. [坐标系问题解决方案](#坐标系问题解决方案)
3. [3D 技术选型](#3d-技术选型)
4. [实现步骤](#实现步骤)
5. [文件说明](#文件说明)

---

## 现状分析

### 现有架构
```
项目/
├── static/index.html    # 2D Leaflet 地图页面
├── static/js/data.js    # 建筑数据（像素坐标）
├── zijinggang.osm       # OSM 地图数据（真实经纬度）
├── server.py            # Flask 后端
└── 其他...
```

### 核心问题
- **坐标断层**: data.js 使用像素坐标，OSM 使用真实经纬度
- **2D 局限**: 缺乏沉浸式体验

---

## 坐标系问题解决方案

### 方案架构
```
┌─────────────────────────────────────────────────┐
│          坐标转换层 (CoordinateSystem)          │
├──────────────┬────────────────┬────────────────┤
│  WGS84 (经纬度) ←→ 2D像素 ←→ 3D世界坐标 │
└──────────────┴────────────────┴────────────────┘
```

### 转换原理
1. **OSM 边界**: 从 `zijinggang.osm` 读取
   ```
   min_lat: 30.29689, max_lat: 30.31314
   min_lng: 120.06520, max_lng: 120.08763
   ```

2. **2D 地图边界**: 1000×1000 像素

3. **转换公式**:
   - 经纬度 → 像素: `x = (lng - min_lng)/range * width`
   - 像素 → 3D: 居中并缩放

---

## 3D 技术选型

| 组件 | 技术 | 理由 |
|------|------|------|
| 3D 引擎 | **Three.js** | 轻量、成熟、CDN 可用 |
| 控制 | OrbitControls | 开箱即用的轨道控制 |
| 地图底座 | 平面 + 网格 | 保持简洁，可替换为真实贴图 |
| 建筑 | Box 几何体 | 简单高效，可替换为 GLTF 模型 |

---

## 实现步骤

### ✅ 已完成
1. **OSM 解析脚本** → `parse_and_convert.py`
2. **坐标转换 JS 库** → `static/js/coordinate_system.js`
3. **3D 首页** → `static/3d_index.html`
4. **新版后端** → `server_3d.py`

### 🚀 快速开始

```bash
# 1. 解析 OSM 数据（已完成）
python parse_and_convert.py

# 2. 启动新后端
python server_3d.py

# 3. 访问
http://localhost:8081/  # 选择入口
http://localhost:8081/3d_index.html  # 直接进 3D
```

---

## 文件说明

### 📁 新增文件
| 文件 | 用途 |
|------|------|
| `parse_and_convert.py` | 解析 OSM，生成坐标转换数据 |
| `osm_parser.py` | 完整版 OSM 解析（可选） |
| `static/js/coordinate_system.js` | 前端坐标转换库 |
| `static/3d_index.html` | 3D 体验页面 |
| `server_3d.py` | 支持 3D 的新后端 |
| `osm_data.json` | 解析后的 OSM 建筑数据（生成的） |

### 🔗 修改文件
| 文件 | 变更 |
|------|------|
| `server.py` | 可添加 3D 相关 API（可选，用 server_3d.py 替代） |
| `static/index.html` | 可添加 "3D 模式" 按钮（可选） |

---

## 功能路线图

### 阶段 1: 基础 3D (当前)
- [x] 坐标系统一
- [x] 简单 3D 建筑
- [x] 视角控制
- [x] 点击交互

### 阶段 2: 数据整合
- [ ] 建筑外观贴图（用 layers/ 下的图片）
- [ ] 2D ↔ 3D 无缝切换
- [ ] 完整数据绑定（谜题、声音）

### 阶段 3: 游戏化特性
- [ ] 角色控制器（第一人称漫游）
- [ ] NPC 和任务系统
- [ ] 收集品/成就
- [ ] 多人在线（可选）

---

## API 参考

### 坐标转换
```javascript
// 前端 JS
CoordinateSystem.wgs84ToPixel(lng, lat)    // → [px, py]
CoordinateSystem.pixelToWgs84(px, py)      // → [lng, lat]
CoordinateSystem.wgs84To3D(lng, lat, h)    // → [x, y, z]
```

### 后端 API（server_3d.py）
| 路径 | 方法 | 功能 |
|------|------|------|
| `/` | GET | 选择页面（2D/3D） |
| `/3d_index.html` | GET | 3D 页面 |
| `/api/osm-data` | GET | 获取 OSM 数据 |
| `/api/convert/wgs84-to-pixel` | GET | 坐标转换 |

---

## 💡 进阶优化建议

### 建筑模型
- **当前**: 简单 Box + 颜色
- **建议**: 使用 Blender 制作简化模型，导出为 GLTF
- **优势**: 更好的视觉效果，支持动画

### 地图底座
- **当前**: 纯色平面 + 网格
- **建议**: 使用 `map.jpg` 作为纹理
- **代码**:
  ```javascript
  const texture = new THREE.TextureLoader().load('map.jpg');
  const material = new THREE.MeshBasicMaterial({ map: texture });
  ```

### 性能优化
- 建筑使用实例化渲染（InstancedMesh）
- 远处建筑降采样（LOD）
- 视锥体剔除（视距外隐藏）

---

## 📞 需要帮助？

1. 运行 `parse_and_convert.py` 确保 OSM 解析正常
2. 检查 `osm_data.json` 已生成
3. 用 `server_3d.py` 启动服务器
4. 访问 `http://localhost:8081/3d_index.html`
