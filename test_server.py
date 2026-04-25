"""服务器测试模块"""
import unittest
import os
import sys
from unittest.mock import patch, MagicMock

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server import app
from storage import storage_manager

class TestServer(unittest.TestCase):
    """服务器测试类"""
    
    def setUp(self):
        """设置测试环境"""
        app.testing = True
        self.client = app.test_client()
    
    def test_home(self):
        """测试首页"""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Audio Server is running!', response.data)
    
    def test_health_check(self):
        """测试健康检查"""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'healthy')
    
    def test_audio_list(self):
        """测试获取音频列表"""
        response = self.client.get('/audio_list')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('files', data)
        self.assertIsInstance(data['files'], list)
    
    def test_local_storage_directory(self):
        """测试本地存储目录是否存在"""
        from config import LOCAL_STORAGE_DIR
        self.assertTrue(os.path.exists(LOCAL_STORAGE_DIR))
    
    def test_default_audio_directory(self):
        """测试默认音频目录是否存在"""
        from config import DEFAULT_AUDIO_DIR
        self.assertTrue(os.path.exists(DEFAULT_AUDIO_DIR))
    
    @patch('storage.oss2')
    def test_storage_init(self, mock_oss2):
        """测试存储初始化"""
        # 测试本地存储模式
        with patch('config.OSS_ACCESS_KEY_ID', None):
            from storage import StorageManager
            sm = StorageManager()
            self.assertTrue(sm.use_local_fallback)
    
    def test_validate_filename(self):
        """测试文件名验证"""
        from utils import validate_filename
        self.assertTrue(validate_filename('test.wav'))
        self.assertFalse(validate_filename('test/../file.wav'))
        self.assertFalse(validate_filename('../test.wav'))
    
    def test_validate_audio_key(self):
        """测试音频键值验证"""
        from utils import validate_audio_key
        self.assertTrue(validate_audio_key('audio/test.wav'))
        self.assertFalse(validate_audio_key('audio/../test.wav'))
        self.assertFalse(validate_audio_key('/audio/test.wav'))
    
    def test_is_default_audio(self):
        """测试是否为默认音频"""
        from utils import is_default_audio
        self.assertTrue(is_default_audio('audio/default_test.wav'))
        self.assertTrue(is_default_audio('default_test.wav'))
        self.assertFalse(is_default_audio('audio/test.wav'))

if __name__ == '__main__':
    unittest.main()
