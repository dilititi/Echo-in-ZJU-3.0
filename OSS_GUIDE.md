# OSS 上传部署清单

## 📦 需要上传到 OSS 的文件

### 1. 默认音频文件（必须）

**目录**：`audio/default_audio/` → OSS 路径：`audio/default_*.mp3`

| 文件 | 说明 |
|------|------|
| 脚步声.mp3 | 音效 |
| 风声.mp3 | 音效 |
| 掌声.mp3 | 音效 |
| ... | ...（共 45 个文件） |

---

### 2. 地标图标（可选，推荐）

**目录**：`static/layers/` → OSS 路径：`layers/`

- ✅ 可加快加载速度
- ❌ 也可以继续用静态文件服务

---

### 3. 用户上传的音频（可选，未来自动）

- 用户上传的音频会自动存入 OSS
- 路径：`audio/20260425_123456_audio.mp3`

---

## 📋 文件清单总览

| 类型 | 数量 | 优先级 | 备注 |
|------|------|--------|------|
| **默认音频** | 45个 | 🔴 高 | 校史谜题音效 |
| **地标图标** | 60+个 | 🟡 中 | 可本地提供 |
| **用户音频** | 0个 | ⚪ 低 | 未来自动上传 |

---

## 🔧 OSS 配置步骤

### 1. 环境变量配置

复制 `.env.example` 为 `.env`，填入：

```env
# 阿里云 OSS
OSS_ACCESS_KEY_ID=你的AccessKeyId
OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
OSS_BUCKET_NAME=你的Bucket名称
OSS_ENDPOINT=oss-cn-区域.aliyuncs.com

# 服务器配置
HOST=0.0.0.0
PORT=8081
DEBUG=False
```

---

### 2. 选择上传方式

#### 方式 A：使用 OSS 控制台（最简单）

1. 登录阿里云 OSS 控制台
2. 进入你的 Bucket
3. 创建目录：`audio/`
4. 批量上传 `audio/default_audio/` 下所有文件
5. ✅ 文件重命名规则：原文件名 → `audio/default_原文件名.mp3`

比如：
- `audio/default_audio/脚步声.mp3` → `audio/default_脚步声.mp3`

---

#### 方式 B：使用 ossutil 命令行工具（推荐）

```bash
# 1. 安装 ossutil
# 下载地址：https://help.aliyun.com/zh/oss/developer-reference/install-ossutil

# 2. 配置
ossutil config

# 3. 上传默认音频
cd interactive-school-map
ossutil cp -r audio/default_audio/ oss://your-bucket-name/audio/

# 4. 注意！需要添加 prefix "default_"
# 手动上传时请重命名文件
```

---

#### 方式 C：我帮你写一个 Python 上传脚本

---

## ⚠️ 重要：文件命名规则

| 文件位置 | OSS 存储路径 | 示例 |
|----------|-------------|------|
| `audio/default_audio/脚步声.mp3` | `audio/default_脚步声.mp3` | ✅ |
| `audio/default_audio/风声.mp3` | `audio/default_风声.mp3` | ✅ |
| 用户上传的文件 | `audio/20260425_123456_filename.mp3` | ✅ |

---

## 🎯 推荐：最简单的配置方案

### 最小化配置（功能完整）

1. 暂时**不上传文件到 OSS**
2. 使用**本地文件系统**作为 fallback
3. 用户上传的音频会保存在服务器本地

修改 `.env`：

```env
# 清空或不配置 OSS 变量
# OSS_ACCESS_KEY_ID=
# OSS_ACCESS_KEY_SECRET=
# OSS_BUCKET_NAME=
# OSS_ENDPOINT=

# 服务器配置
HOST=0.0.0.0
PORT=8081
```

启动服务器后，所有文件从本地提供，**功能完整**！

---

## 🔄 需要我帮你做什么？

| 选项 | 说明 |
|------|------|
| **A. 创建 OSS 上传脚本** | Python 脚本自动重命名并上传 |
| **B. 修改配置优先用本地** | 暂时不上传，先本地跑通 |
| **C. 两者都做** | 脚本 + 本地优先配置 |
| **D. 其他需求** | 告诉我 |

你选哪个？
