# 紫金港声音地图 - 部署指南

## 📋 当前状态

✅ 完整后端已恢复
✅ 静态文件目录已整理
✅ 配置文件已修正

---

## 🚀 快速启动

### 1. 安装依赖

```bash
pip install flask flask-cors python-dotenv
```

### 2. 配置环境

```bash
# 复制示例配置
cp .env.example .env

# 根据需要编辑 .env
```

### 3. 启动服务器

```bash
python server.py
```

访问：**http://127.0.0.1:8081**

---

## 🏗️ 部署方案对比

| 方案 | 优点 | 缺点 | 适合 |
|-----|------|------|-----|
| **GitHub Pages** | 免费、简单 | 无后端、无录音 | 仅静态展示 |
| **Vercel / Netlify** | 免费、Serverless | 音频存储有限制 | 轻量版 |
| **阿里云 / 腾讯云** | 完全控制、OSS支持 | 付费 | 正式上线 |
| **Render / Railway** | 简单部署、有免费额度 | 可能需要付费 | 中小规模 |

---

## 🔧 OSS 存储配置（推荐用于生产）

### 1. 获取 OSS 凭证

阿里云 OSS 或 腾讯云 COS 均可

### 2. 配置 .env

```env
OSS_ACCESS_KEY_ID=your_key
OSS_ACCESS_KEY_SECRET=your_secret
OSS_BUCKET_NAME=your_bucket
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

### 3. 注意事项

- ✅ 用户上传的音频会自动存储到 OSS
- ✅ 本地存储作为备用方案（fallback）
- ✅ 默认音频文件可以放在 CDN

---

## 📁 文件结构（最终）

```
interactive-school-map/
├── server.py              # Flask 后端（完整版）
├── config.py              # 后端配置
├── .env                   # 环境变量（从 .env.example 复制）
├── requirements.txt       # 依赖列表
├── audio/
│   └── default_audio/     # 默认音效（45个）
├── static/                # 前端静态文件
│   ├── index.html
│   ├── js/
│   ├── layers/
│   └── ...
└── local_storage/         # 用户数据存储
```

---

## 🛡️ 安全建议

### 生产环境必做

1. **修改 SECRET_KEY**
   ```env
   SECRET_KEY=your_secure_random_key_here
   ```

2. **修改 API_KEY**
   ```env
   API_KEY=your_production_api_key
   ```

3. **启用 HTTPS**
   - 录音功能需要 HTTPS
   - 使用 Let's Encrypt 免费证书

4. **配置 CORS**
   - 根据域名修改后端

---

## 📊 上线检查清单

| 检查项 | 状态 |
|--------|------|
| 服务器启动正常 | ⬜ |
| 所有音频文件可访问 | ⬜ |
| 地标图标可加载 | ⬜ |
| 录音功能正常 | ⬜ |
| 音频上传功能正常 | ⬜ |
| HTTPS 已配置 | ⬜ |
| 自定义域名已绑定 | ⬜ |
| OSS 已配置（可选） | ⬜ |

---

## 🎯 推荐部署流程

### 方案 A：自托管服务器（最推荐）

1. 购买云服务器（阿里云/腾讯云）
2. 配置 OSS
3. 部署 Docker 或直接运行
4. 配置 Nginx + HTTPS

### 方案 B：Render 简易部署

1. 同步到 GitHub
2. 连接 Render
3. 配置环境变量
4. 一键部署

---

## ❓ 常见问题

### Q: GitHub Pages 可以用吗？

A: 可以，但仅限**纯前端静态展示**，音频上传和录音功能不可用。

### Q: OSS 必须配置吗？

A: 不是必须的，但**生产环境强烈推荐**。不配置的话，用户音频会保存在本地文件系统，容器重启或迁移后会丢失。

### Q: 移动端录音支持吗？

A: 支持，但必须是 **HTTPS** 环境。
