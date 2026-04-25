"""配置管理模块"""
import os
import logging
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 缓存配置
CACHE_TIMEOUT = 3600  # 缓存超时时间（秒）

# 速率限制配置
RATE_LIMIT = 100  # 每分钟请求数

# 文件大小限制（20MB）
MAX_CONTENT_LENGTH = 20 * 1024 * 1024

# 日志配置
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# OSS配置
OSS_ACCESS_KEY_ID = os.getenv('OSS_ACCESS_KEY_ID')
OSS_ACCESS_KEY_SECRET = os.getenv('OSS_ACCESS_KEY_SECRET')
OSS_BUCKET_NAME = os.getenv('OSS_BUCKET_NAME')
OSS_ENDPOINT = os.getenv('OSS_ENDPOINT')

# 认证配置
API_KEY = os.getenv('API_KEY', 'default_api_key')
SECRET_KEY = os.getenv('SECRET_KEY', os.urandom(24))

# 本地存储配置
LOCAL_STORAGE_DIR = os.path.join(os.path.dirname(__file__), 'local_storage')
DEFAULT_AUDIO_DIR = os.path.join(os.path.dirname(__file__), 'audio', 'default_audio')

# 服务器配置
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 8081))

# 允许的音频文件扩展名
ALLOWED_AUDIO_EXTENSIONS = {'.wav', '.mp3', '.ogg', '.m4a'}
