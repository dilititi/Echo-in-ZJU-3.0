"""工具模块"""
import time
from functools import wraps
from flask import request, jsonify
from threading import Lock
from config import RATE_LIMIT, CACHE_TIMEOUT, API_KEY

# 速率限制存储
rate_limit_store = {}
rate_limit_lock = Lock()

# 缓存存储
audio_list_cache = {
    'data': None,
    'timestamp': 0
}
cache_lock = Lock()

def rate_limit(f):
    """速率限制装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_ip = request.remote_addr
        current_time = int(time.time() / 60)  # 每分钟一个窗口
        
        with rate_limit_lock:
            # 清理超过 5 分钟的过期记录，防止内存无限增长
            stale = [ip for ip, d in rate_limit_store.items() if current_time - d['window'] > 5]
            for ip in stale:
                del rate_limit_store[ip]

            if client_ip not in rate_limit_store:
                rate_limit_store[client_ip] = {'count': 0, 'window': current_time}

            if rate_limit_store[client_ip]['window'] != current_time:
                rate_limit_store[client_ip] = {'count': 0, 'window': current_time}

            rate_limit_store[client_ip]['count'] += 1

            if rate_limit_store[client_ip]['count'] > RATE_LIMIT:
                return jsonify({'error': 'Too many requests'}), 429
        
        return f(*args, **kwargs)
    return decorated_function

def require_auth(f):
    """认证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 这里可以实现更复杂的认证逻辑，例如JWT token验证
        # 目前使用简单的API key验证
        api_key = request.headers.get('X-API-Key')
        
        if not api_key or api_key != API_KEY:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_cached_data():
    """获取缓存数据"""
    current_time = time.time()
    with cache_lock:
        if audio_list_cache['data'] is not None and (current_time - audio_list_cache['timestamp']) < CACHE_TIMEOUT:
            return audio_list_cache['data']
    return None

def set_cached_data(data):
    """设置缓存数据"""
    with cache_lock:
        audio_list_cache['data'] = data
        audio_list_cache['timestamp'] = time.time()

def clear_cache():
    """清除缓存"""
    with cache_lock:
        audio_list_cache['data'] = None
        audio_list_cache['timestamp'] = 0

def validate_filename(filename):
    """验证文件名，防止路径遍历攻击"""
    if '..' in filename or '/' in filename or '\\' in filename:
        return False
    return True

def validate_audio_key(key):
    """验证音频键值格式"""
    if '..' in key or key.startswith('/'):
        return False
    return True

def is_default_audio(key):
    """检查是否为默认音频（basename 以 default_ 开头）"""
    basename = key.split('/')[-1] if '/' in key else key
    return basename.startswith('default_')
