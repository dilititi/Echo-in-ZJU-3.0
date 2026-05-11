# 紫金港声音地图

浙江大学紫金港校区交互式声音地图。在校园地图上浏览建筑信息、收听音频导览、参与声音探索谜题，支持录音上传与关卡解锁。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 原生 JavaScript（无框架）、Leaflet.js（非地理坐标系）、Three.js、Web Audio API |
| 后端 | Python / Flask + Gunicorn |
| 存储 | 阿里云 OSS（主）/ 本地文件（降级备用） |

## 功能

- **建筑导览**：点击地图上的建筑标记，查看简介、历史、答题
- **音频播放**：每栋建筑绑定特色音频片段，支持进度条控制与表情反应
- **声音探索模式**：听音辨位谜题，解锁建筑、积累进度
- **录音 & 上传**：浏览器麦克风录音或本地文件上传，保存至服务器
- **关卡系统**：6 个关卡，含任务引导、成就徽章、图书馆挑战
- **3D 场景**：Three.js 渲染校园建筑三维视图
- **昼夜主题**：Art Deco 暗色主题，支持切换
- **社交留言板**：声音留言墙，昵称自定义
- **分享链接**：地图状态编码为 URL 参数，可直接分享

## 项目结构

```
interactive-school-map/
├── server.py              # Flask 入口
├── storage.py             # OSS / 本地存储管理
├── config.py              # 服务端配置
├── utils.py               # 限流、鉴权、缓存工具
├── requirements.txt
└── static/
    ├── index.html         # 单页应用
    ├── css/
    │   └── main.css       # 全局样式（Art Deco 主题）
    └── js/
        ├── config.js          # 前端配置（serverUrl、apiKey 等）
        ├── data.js            # 全量数据（建筑、关卡、谜题、成就）
        ├── utils.js           # 前端工具函数
        ├── storage.js         # localStorage 封装
        ├── migration.js       # 本地数据迁移
        ├── app.js             # App 骨架（state、init、事件监听）
        ├── map-layers.js      # 地图图层、主题切换
        ├── markers.js         # 建筑标记、弹窗、答题、环境音
        ├── level-system.js    # 关卡、成就、进度、图书馆挑战
        ├── audio-manager.js   # 音频播放、录制、上传
        ├── sound-explore.js   # 声音探索模式
        ├── coordinate_system.js # 坐标系工具
        ├── audio3d.js         # 3D 空间音频
        ├── scene3d.js         # Three.js 3D 场景
        └── bootstrap.js       # 最后加载，调用 App.init()
```

## 本地运行

**1. 安装依赖**

```bash
pip install -r requirements.txt
```

**2. 配置环境变量**（可选，不配置则降级为本地存储）

```bash
cp .env.example .env
# 填写 OSS_ACCESS_KEY_ID、OSS_ACCESS_KEY_SECRET、OSS_BUCKET_NAME 等
```

**3. 启动服务**

```bash
python server.py
```

访问 `http://localhost:10000`

**生产环境（Gunicorn）**

```bash
gunicorn -w 2 -b 0.0.0.0:10000 server:app
```

## API 概览

所有接口需携带 `X-API-Key` 请求头。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | 服务状态 & 存储模式 |
| GET | `/audio/list` | 获取用户音频列表 |
| POST | `/audio/upload` | 上传音频文件 |
| DELETE | `/audio/:key` | 删除音频 |
| GET | `/audio/default/list` | 获取内置音频列表 |
| POST | `/audio/record` | 保存录音 |

## 浏览器兼容性

需支持 Web Audio API、MediaRecorder API、ES2017+。推荐 Chrome / Edge 最新版。Safari 需 16.4+（`AbortSignal.timeout` 限制）。
