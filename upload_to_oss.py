#!/usr/bin/env python
"""
OSS 自动上传脚本
将默认音频文件上传到 OSS
"""

import os
import sys
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

try:
    import oss2
except ImportError:
    print("❌ 缺少 oss2 模块")
    print("安装命令：pip install oss2")
    sys.exit(1)

# 配置
OSS_ACCESS_KEY_ID = os.getenv('OSS_ACCESS_KEY_ID')
OSS_ACCESS_KEY_SECRET = os.getenv('OSS_ACCESS_KEY_SECRET')
OSS_BUCKET_NAME = os.getenv('OSS_BUCKET_NAME')
OSS_ENDPOINT = os.getenv('OSS_ENDPOINT')

# 检查配置
if not all([OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET_NAME, OSS_ENDPOINT]):
    print("❌ OSS 配置不完整")
    print("请在 .env 文件中配置：")
    print("- OSS_ACCESS_KEY_ID")
    print("- OSS_ACCESS_KEY_SECRET")
    print("- OSS_BUCKET_NAME")
    print("- OSS_ENDPOINT")
    sys.exit(1)

# 本地路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_AUDIO_DIR = os.path.join(BASE_DIR, 'default_audio')

# 初始化 OSS
print("🔄 正在连接 OSS...")
try:
    auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET_NAME)
    print("✅ OSS 连接成功")
except Exception as e:
    print(f"❌ OSS 连接失败：{e}")
    sys.exit(1)

# 获取需要上传的文件
print("🔍 正在扫描音频文件...")
audio_files = []
for filename in os.listdir(DEFAULT_AUDIO_DIR):
    if filename.endswith(('.mp3', '.wav', '.ogg', '.m4a')):
        local_path = os.path.join(DEFAULT_AUDIO_DIR, filename)
        oss_key = f"audio/default_{filename}"
        audio_files.append((local_path, oss_key))

print(f"✅ 找到 {len(audio_files)} 个音频文件")

# 检查已存在的文件
print("🔍 正在检查 OSS 中已存在的文件...")
existing_files = set()
try:
    for obj in oss2.ObjectIterator(bucket, prefix='audio/default_'):
        existing_files.add(obj.key)
    print(f"✅ OSS 中已存在 {len(existing_files)} 个文件")
except Exception as e:
    print(f"⚠️  无法列出 OSS 文件：{e}")
    print("   将继续上传，可能会覆盖现有文件")

# 上传文件
print(f"\n🚀 开始上传 {len(audio_files)} 个文件...")
success_count = 0
skip_count = 0
error_count = 0

for idx, (local_path, oss_key) in enumerate(audio_files, 1):
    filename = os.path.basename(local_path)
    
    # 检查是否已存在
    if oss_key in existing_files:
        print(f"[{idx}/{len(audio_files)}] ⏭️  跳过已存在：{filename}")
        skip_count += 1
        continue
    
    print(f"[{idx}/{len(audio_files)}] 📤 正在上传：{filename}")
    
    try:
        with open(local_path, 'rb') as f:
            bucket.put_object(oss_key, f)
        print(f"[{idx}/{len(audio_files)}] ✅ 上传成功：{filename}")
        success_count += 1
    except Exception as e:
        print(f"[{idx}/{len(audio_files)}] ❌ 上传失败：{filename} - {e}")
        error_count += 1

# 完成总结
print(f"\n📊 上传完成！")
print(f"✅ 成功：{success_count}")
print(f"⏭️  跳过：{skip_count}")
print(f"❌ 失败：{error_count}")

if success_count > 0:
    print("\n🎉 恭喜！默认音频已上传到 OSS")
    print("   现在可以启动服务器测试了！")
else:
    print("\n⚠️  没有上传新文件")
    print("   可能是因为文件都已存在")
