import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from storage import storage_manager
from config import LOCAL_STORAGE_DIR

print(f"LOCAL_STORAGE_DIR: {LOCAL_STORAGE_DIR}")

# 测试上传的文件
test_keys = [
    'audio/20260317_144716_1.wav',
    'audio/20260317_145010_1.wav'
]

for key in test_keys:
    url = storage_manager.get_file_url(key)
    print(f"URL for {key}: {url}")
    
    # 检查文件是否存在
    filename = key.replace('audio/', '')
    file_path = os.path.join(LOCAL_STORAGE_DIR, 'audio', filename)
    print(f"File path: {file_path}")
    print(f"File exists: {os.path.exists(file_path)}")
    print()
