"""音频服务器主模块"""
import os
import logging
from flask import Flask, request, jsonify, redirect, send_file
from flask_cors import CORS
from datetime import datetime

from config import (
    SECRET_KEY, MAX_CONTENT_LENGTH, DEBUG, HOST, PORT,
    LOG_LEVEL, LOCAL_STORAGE_DIR, DEFAULT_AUDIO_DIR, ALLOWED_AUDIO_EXTENSIONS
)
from storage import storage_manager
from utils import (
    rate_limit, require_auth, get_cached_data, set_cached_data, clear_cache,
    validate_filename, validate_audio_key, is_default_audio
)

# 配置日志记录
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=__import__('sys').stdout
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static', static_url_path='/')
CORS(app)

# 设置配置
app.config['SECRET_KEY'] = SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

@app.errorhandler(413)
def file_too_large(error):
    """处理文件过大错误"""
    logger.warning('File size exceeds limit')
    return jsonify({
        'status': 'error',
        'message': '音频超过20MB上限，请压缩后重新上传！'
    }), 413

@app.route('/')
def home():
    """首页"""
    return app.send_static_file('index.html')

@app.route('/health')
def health_check():
    """健康检查端点"""
    try:
        # 检查存储状态
        storage_status = 'local' if storage_manager.use_local_fallback else 'oss'
        # 检查缓存状态
        cache_status = 'active' if get_cached_data() else 'empty'
        
        return jsonify({
            'status': 'healthy',
            'storage': storage_status,
            'cache': cache_status,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f'Health check failed: {str(e)}')
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/upload_audio', methods=['POST'])
@require_auth
@rate_limit
def upload_audio():
    """上传音频文件"""
    logger.info('Received upload request')
    try:
        if 'audio' not in request.files:
            logger.error('No audio file in request')
            return jsonify({'error': 'No audio file'}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            logger.error('Empty filename')
            return jsonify({'error': 'No selected file'}), 400

        filename = request.form.get('filename', '')
        if not filename:
            logger.error('No filename provided in form')
            return jsonify({'error': 'No filename provided'}), 400
        
        # 获取公开/私有状态（默认私有）
        is_public = request.form.get('is_public', '0') == '1'
        
        # 获取关联的建筑ID（可选）
        building_id = request.form.get('building_id', '')

        # 验证文件名，防止路径遍历攻击
        if not validate_filename(filename):
            logger.error('Invalid filename: contains path traversal characters')
            return jsonify({'error': 'Invalid filename'}), 400

        # 生成OSS对象键名（使用时间戳防止重名）
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        oss_key = f'audio/{timestamp}_{filename}'

        # 确保文件名有适当的扩展名
        original_ext = os.path.splitext(audio_file.filename)[1].lower()
        if not original_ext:
            original_ext = '.wav'  # 默认使用.wav
        if not oss_key.endswith(original_ext):
            oss_key = f'{oss_key}{original_ext}'
        
        # 验证文件类型
        if original_ext not in ALLOWED_AUDIO_EXTENSIONS:
            logger.error('Invalid file type')
            return jsonify({'error': 'Invalid file type'}), 400
        
        logger.info(f'Preparing to upload file with key: {oss_key}')
        
        try:
            success = storage_manager.upload_file(audio_file, oss_key)
            if success:
                # 重置文件指针，确保文件可以再次读取
                audio_file.seek(0)
                url = storage_manager.get_file_url(oss_key)
                logger.info(f'File uploaded successfully: {oss_key}')
                logger.info(f'Generated URL: {url}')
                
                # 检查文件是否存在
                from config import LOCAL_STORAGE_DIR
                filename = oss_key.replace('audio/', '')
                file_path = os.path.join(LOCAL_STORAGE_DIR, 'audio', filename)
                logger.info(f'File path: {file_path}')
                logger.info(f'File exists: {os.path.exists(file_path)}')
                
                # 保存音频元数据
                metadata_path = os.path.join(LOCAL_STORAGE_DIR, 'audio', f'{filename}.meta.json')
                import json
                metadata = {
                    'is_public': is_public,
                    'building_id': building_id,
                    'upload_time': timestamp,
                    'original_filename': filename
                }
                try:
                    with open(metadata_path, 'w', encoding='utf-8') as f:
                        json.dump(metadata, f, ensure_ascii=False)
                except Exception as e:
                    logger.warning(f'Failed to save metadata: {e}')
                
                # 清除缓存，确保下次获取音频列表时能看到新文件
                clear_cache()
                
                return jsonify({
                    'message': 'File uploaded successfully',
                    'filename': oss_key,
                    'url': url,
                    'is_public': is_public
                })
            else:
                return jsonify({'error': 'Failed to upload file'}), 500
        except Exception as e:
            logger.error(f'Upload error: {str(e)}')
            return jsonify({'error': 'Failed to upload file'}), 500
    except Exception as e:
        logger.error(f'Error in upload_audio: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/audio/<path:oss_key>')
@rate_limit
def get_audio(oss_key):
    """获取音频文件"""
    try:
        url = storage_manager.get_file_url(oss_key)
        if url:
            if url.startswith('/'):
                return redirect(url)
            else:
                return redirect(url)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        logger.error(f'Error in get_audio: {str(e)}')
        return jsonify({'error': 'File not found'}), 404

@app.route('/local_audio/<path:file_path>')
@rate_limit
def serve_local_audio(file_path):
    """提供本地存储的音频文件"""
    try:
        # 构建可能的文件路径
        local_storage_path = os.path.join(LOCAL_STORAGE_DIR, file_path)
        default_audio_path = os.path.join(os.path.dirname(__file__), 'audio', 'default_audio', file_path)
        
        # 记录路径信息
        logger.info(f'Requested file path: {file_path}')
        logger.info(f'Local storage path: {local_storage_path}')
        logger.info(f'Default audio path: {default_audio_path}')
        
        # 选择存在的文件路径
        if os.path.exists(local_storage_path):
            actual_path = local_storage_path
        elif os.path.exists(default_audio_path):
            actual_path = default_audio_path
        else:
            return jsonify({'error': 'File not found'}), 404
        
        # 安全检查，防止路径遍历
        if not (actual_path.startswith(LOCAL_STORAGE_DIR) or actual_path.startswith(os.path.join(os.path.dirname(__file__), 'audio', 'default_audio'))):
            return jsonify({'error': 'Access denied'}), 403
        
        # 检查文件类型
        if not any(actual_path.endswith(ext) for ext in ALLOWED_AUDIO_EXTENSIONS):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # 提供文件，设置正确的 MIME 类型
        from mimetypes import guess_type
        mime_type, _ = guess_type(actual_path)
        if mime_type:
            return send_file(actual_path, mimetype=mime_type, as_attachment=False)
        else:
            # 默认 MIME 类型
            return send_file(actual_path, mimetype='audio/wav', as_attachment=False)
    except Exception as e:
        logger.error(f'Error in serve_local_audio: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/default_audio/<path:filename>')
@rate_limit
def serve_default_audio(filename):
    """提供默认音频文件"""
    try:
        default_audio_path = os.path.join(os.path.dirname(__file__), 'audio', 'default_audio')
        file_path = os.path.join(default_audio_path, filename)
        
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=False)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        logger.error(f'Error in serve_default_audio: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/audio_list')
@rate_limit
def get_audio_list():
    """获取音频文件列表"""
    try:
        # 检查缓存是否有效
        cached_data = get_cached_data()
        if cached_data:
            logger.info('Using cached audio list')
            return jsonify(cached_data)
        
        # 列出所有音频文件
        files = storage_manager.list_files()
        result = {'files': files}
        logger.info(f'Audio files found: {len(files)}')
        
        # 更新缓存
        set_cached_data(result)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f'Error in get_audio_list: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/delete_audio', methods=['POST'])
@require_auth
@rate_limit
def delete_audio():
    """删除音频文件"""
    try:
        data = request.json
        if not data or 'key' not in data:
            return jsonify({'success': False, 'error': '缺少音频键值'}), 400
            
        key = data['key']
        logger.info(f'Attempting to delete audio: {key}')
        
        # 验证key格式，防止路径遍历攻击
        if not validate_audio_key(key):
            logger.error('Invalid audio key: contains path traversal characters')
            return jsonify({'success': False, 'error': '无效的音频键值'}), 400
        
        # 检查是否为原始音频（不允许删除）
        if is_default_audio(key):
            logger.warning(f'Attempted to delete a default audio file: {key}')
            return jsonify({'success': False, 'error': '原始音频文件不可删除'}), 403
            
        try:
            success = storage_manager.delete_file(key)
            if success:
                logger.info(f'Successfully deleted audio: {key}')
                
                # 清除缓存，确保下次获取音频列表时能看到删除后的结果
                clear_cache()
                
                return jsonify({'success': True})
            else:
                return jsonify({'success': False, 'error': '删除文件失败'}), 500
        except Exception as e:
            logger.error(f'Delete error: {str(e)}')
            return jsonify({'success': False, 'error': '删除文件失败'}), 500
        
    except Exception as e:
        logger.error(f'Error in delete_audio: {str(e)}')
        return jsonify({'success': False, 'error': '服务器内部错误'}), 500

@app.route('/soundtrack_list')
@rate_limit
def get_soundtrack_list():
    """返回 soundtrack 子目录及其音频文件列表"""
    try:
        soundtrack_dir = os.path.join(os.path.dirname(__file__), 'soundtrack')
        allowed_libs = ['基图', '主图', '医图']
        result = {}
        for lib in allowed_libs:
            lib_path = os.path.join(soundtrack_dir, lib)
            if not os.path.isdir(lib_path):
                continue
            files = []
            for fname in os.listdir(lib_path):
                fpath = os.path.join(lib_path, fname)
                if os.path.isfile(fpath):
                    ext = os.path.splitext(fname)[1].lower()
                    if ext in ALLOWED_AUDIO_EXTENSIONS or ext in ['.aac', '.ogg']:
                        files.append(fname)
            if files:
                result[lib] = files
        return jsonify(result)
    except Exception as e:
        logger.error(f'Error in get_soundtrack_list: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/soundtrack/<library>/<path:filename>')
@rate_limit
def serve_soundtrack(library, filename):
    """提供图书馆闭馆音乐文件"""
    allowed_libs = ['基图', '主图', '医图']
    if library not in allowed_libs:
        return jsonify({'error': 'Access denied'}), 403
    try:
        soundtrack_dir = os.path.join(os.path.dirname(__file__), 'soundtrack')
        file_path = os.path.realpath(os.path.join(soundtrack_dir, library, filename))
        lib_dir = os.path.realpath(os.path.join(soundtrack_dir, library))
        if not file_path.startswith(lib_dir + os.sep) and file_path != lib_dir:
            return jsonify({'error': 'Access denied'}), 403
        if not os.path.isfile(file_path):
            return jsonify({'error': 'File not found'}), 404
        from mimetypes import guess_type
        mime_type, _ = guess_type(file_path)
        return send_file(file_path, mimetype=mime_type or 'audio/mpeg', as_attachment=False)
    except Exception as e:
        logger.error(f'Error in serve_soundtrack: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    logger.info('Starting Flask server...')
    try:
        storage_manager.init_default_audio()
        port = int(os.getenv('PORT', 10000))
        logger.info(f"Server starting on http://0.0.0.0:{port}, debug mode: {DEBUG}")
        app.run(host='0.0.0.0', port=port, debug=DEBUG)
    except Exception as e:
        logger.error(f'Failed to start server: {str(e)}')
        raise
