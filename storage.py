"""存储管理模块"""
import os
import glob
import logging
import oss2
from config import (
    OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET_NAME, OSS_ENDPOINT,
    LOCAL_STORAGE_DIR, DEFAULT_AUDIO_DIR, ALLOWED_AUDIO_EXTENSIONS
)

logger = logging.getLogger(__name__)

class StorageManager:
    """存储管理器"""
    
    def __init__(self):
        self.use_local_fallback = False
        self.bucket = None
        self._init_storage()
        # 确保本地存储目录存在
        os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)
        os.makedirs(DEFAULT_AUDIO_DIR, exist_ok=True)
    
    def _init_storage(self):
        """初始化存储"""
        if not all([OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET_NAME, OSS_ENDPOINT]):
            logger.warning("Missing required OSS environment variables, using local fallback")
            self.use_local_fallback = True
            return
        
        try:
            auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
            self.bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET_NAME)
            logger.info("OSS client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OSS client: {str(e)}")
            logger.warning("Using local fallback due to OSS initialization failure")
            self.use_local_fallback = True
    
    def upload_file(self, file, oss_key):
        """上传文件"""
        if self.use_local_fallback:
            return self._local_upload(file, oss_key)
        else:
            return self._oss_upload(file, oss_key)
    
    def delete_file(self, oss_key):
        """删除文件"""
        if self.use_local_fallback:
            return self._local_delete(oss_key)
        else:
            return self._oss_delete(oss_key)
    
    def list_files(self):
        """列出所有音频文件"""
        if self.use_local_fallback:
            return self._local_list()
        else:
            return self._oss_list()
    
    def get_file_url(self, oss_key):
        """获取文件URL"""
        if self.use_local_fallback:
            return self._local_get_url(oss_key)
        else:
            return self._oss_get_url(oss_key)
    
    def _local_upload(self, file, oss_key):
        """本地存储上传"""
        try:
            filename = oss_key.replace('audio/', '')
            file_path = os.path.join(LOCAL_STORAGE_DIR, 'audio', filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            # 保存当前文件指针位置
            current_position = file.tell()
            # 确保从文件开头读取
            file.seek(0)
            with open(file_path, 'wb') as f:
                f.write(file.read())
            # 恢复文件指针位置
            file.seek(current_position)
            logger.info(f'Uploaded file to: {file_path}')
            return True
        except Exception as e:
            logger.error(f'Error in local upload: {str(e)}')
            return False
    
    def _local_delete(self, oss_key):
        """本地存储删除"""
        try:
            filename = oss_key.replace('audio/', '')
            file_path = os.path.join(LOCAL_STORAGE_DIR, 'audio', filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f'Deleted file: {file_path}')
            return True
        except Exception as e:
            logger.error(f'Error in local delete: {str(e)}')
            return False
    
    def _local_list(self):
        """本地存储列出文件"""
        try:
            files = []
            
            # 检查本地存储的audio目录
            audio_dir = os.path.join(LOCAL_STORAGE_DIR, 'audio')
            if os.path.exists(audio_dir):
                for root, dirs, filenames in os.walk(audio_dir):
                    for filename in filenames:
                        if any(filename.endswith(ext) for ext in ALLOWED_AUDIO_EXTENSIONS):
                            file_path = os.path.join(root, filename)
                            relative_path = os.path.relpath(file_path, LOCAL_STORAGE_DIR)
                            oss_key = f'audio/{os.path.basename(file_path)}'
                            url = f'/local_audio/{relative_path.replace(os.path.sep, "/")}'
                            files.append({
                                'key': oss_key,
                                'url': url,
                                'size': os.path.getsize(file_path),
                                'last_modified': os.path.getmtime(file_path)
                            })
            
            # 检查默认音频目录
            default_audio_dir = DEFAULT_AUDIO_DIR
            if os.path.exists(default_audio_dir):
                for root, dirs, filenames in os.walk(default_audio_dir):
                    for filename in filenames:
                        if any(filename.endswith(ext) for ext in ALLOWED_AUDIO_EXTENSIONS):
                            file_path = os.path.join(root, filename)
                            relative_path = os.path.relpath(file_path, os.path.dirname(default_audio_dir))
                            oss_key = f'audio/default_{filename}'
                            url = f'/local_audio/{relative_path.replace(os.path.sep, "/")}'
                            files.append({
                                'key': oss_key,
                                'url': url,
                                'size': os.path.getsize(file_path),
                                'last_modified': os.path.getmtime(file_path)
                            })
            
            logger.info(f'Found {len(files)} files in local storage')
            return files
        except Exception as e:
            logger.error(f'Error in local list: {str(e)}')
            return []
    
    def _local_get_url(self, oss_key):
        """获取本地文件URL"""
        try:
            # 处理默认音频文件
            if 'default_' in oss_key:
                filename = oss_key.replace('audio/default_', '')
                file_path = os.path.join(DEFAULT_AUDIO_DIR, filename)
                if os.path.exists(file_path):
                    relative_path = os.path.relpath(file_path, os.path.dirname(DEFAULT_AUDIO_DIR))
                    return f'/local_audio/{relative_path.replace(os.path.sep, "/")}'
            
            # 处理普通音频文件
            filename = oss_key.replace('audio/', '')
            file_path = os.path.join(LOCAL_STORAGE_DIR, 'audio', filename)
            if os.path.exists(file_path):
                return f'/local_audio/audio/{filename}'
            
            # 尝试从audio目录直接查找文件
            audio_dir = os.path.join(LOCAL_STORAGE_DIR, 'audio')
            if os.path.exists(audio_dir):
                for root, dirs, filenames in os.walk(audio_dir):
                    for f in filenames:
                        if f.endswith(('.wav', '.mp3', '.ogg', '.m4a')):
                            # 检查文件名是否包含oss_key中的关键字
                            if f in oss_key or oss_key.replace('audio/', '') in f:
                                relative_path = os.path.relpath(os.path.join(root, f), LOCAL_STORAGE_DIR)
                                return f'/local_audio/{relative_path.replace(os.path.sep, "/")}'
            
            # 尝试不带扩展名的路径（兼容旧格式）
            base_name = os.path.splitext(filename)[0]
            for ext in ['.wav', '.mp3', '.ogg', '.m4a']:
                alt_file_path = os.path.join(LOCAL_STORAGE_DIR, 'audio', base_name + ext)
                if os.path.exists(alt_file_path):
                    return f'/local_audio/audio/{base_name + ext}'
            
            return None
        except Exception as e:
            logger.error(f'Error in local get URL: {str(e)}')
            return None
    
    def _oss_upload(self, file, oss_key):
        """OSS上传"""
        try:
            file.seek(0)  # 确保从开头读取文件
            self.bucket.put_object(oss_key, file.stream)
            return True
        except oss2.exceptions.OssError as e:
            logger.error(f'OSS upload error: {str(e)}')
            return False
    
    def _oss_delete(self, oss_key):
        """OSS删除"""
        try:
            if not self.bucket.object_exists(oss_key):
                return False
            self.bucket.delete_object(oss_key)
            return True
        except oss2.exceptions.OssError as e:
            logger.error(f'OSS delete error: {str(e)}')
            return False
    
    def _oss_list(self):
        """OSS列出文件"""
        try:
            files = []
            for obj in oss2.ObjectIterator(self.bucket, prefix='audio/'):
                if any(obj.key.endswith(ext) for ext in ALLOWED_AUDIO_EXTENSIONS):
                    url = self.bucket.sign_url('GET', obj.key, 60 * 60 * 24)  # 24小时有效
                    files.append({
                        'key': obj.key,
                        'url': url,
                        'size': obj.size,
                        'last_modified': obj.last_modified
                    })
            return files
        except Exception as e:
            logger.error(f'Error in OSS list: {str(e)}')
            return []
    
    def _oss_get_url(self, oss_key):
        """获取OSS文件URL"""
        try:
            url = self.bucket.sign_url('GET', oss_key, 60 * 60)  # 1小时有效
            return url
        except Exception as e:
            logger.error(f'Error in OSS get URL: {str(e)}')
            return None
    
    def init_default_audio(self):
        """初始化默认音频文件"""
        logger.info('Starting default audio initialization...')
        
        if not os.path.exists(DEFAULT_AUDIO_DIR):
            os.makedirs(DEFAULT_AUDIO_DIR)
            logger.info(f'Created default audio directory: {DEFAULT_AUDIO_DIR}')
            return
        
        # 获取默认音频目录中的所有音频文件
        local_audio_files = []
        for ext in ALLOWED_AUDIO_EXTENSIONS:
            local_audio_files.extend(glob.glob(os.path.join(DEFAULT_AUDIO_DIR, f'*{ext}')))
        
        if not local_audio_files:
            logger.info('No audio files found in default_audio directory')
            return
        
        logger.info(f'Found {len(local_audio_files)} audio files in default_audio directory')
        
        if self.use_local_fallback:
            logger.info('Using local fallback, skipping default audio upload')
            return
        
        # 获取OSS中现有的默认音频文件
        existing_oss_files = {}
        try:
            for obj in oss2.ObjectIterator(self.bucket, prefix='audio/default_'):
                filename = os.path.basename(obj.key)
                existing_oss_files[filename] = obj.key
            
            logger.info(f'Found {len(existing_oss_files)} existing default audio files in OSS')
            
            # 检查并上传所有需要更新的文件
            upload_count = 0
            for audio_file in local_audio_files:
                file_name = os.path.basename(audio_file)
                default_filename = f'default_{file_name}'
                oss_key = f'audio/{default_filename}'
                
                # 如果文件不存在或需要更新，则上传
                if default_filename not in existing_oss_files:
                    try:
                        # 流式上传文件，提高性能
                        with open(audio_file, 'rb') as f:
                            self.bucket.put_object(oss_key, f)
                        logger.info(f'Uploaded default audio file: {oss_key}')
                        upload_count += 1
                    except Exception as e:
                        logger.error(f'Failed to upload default audio file {file_name}: {str(e)}')
            
            if upload_count > 0:
                logger.info(f'Successfully uploaded {upload_count} default audio files')
            else:
                logger.info('No new default audio files to upload')
        except Exception as e:
            logger.error(f'Error in init_default_audio: {str(e)}')

# 全局存储管理器实例
storage_manager = StorageManager()
