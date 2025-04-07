from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
import os
import logging
import glob
import oss2
from datetime import datetime

# 配置日志记录
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 阿里云OSS配置
OSS_ACCESS_KEY_ID = os.getenv('OSS_ACCESS_KEY_ID', '')
OSS_ACCESS_KEY_SECRET = os.getenv('OSS_ACCESS_KEY_SECRET', '')
OSS_BUCKET_NAME = os.getenv('OSS_BUCKET_NAME', '')
OSS_ENDPOINT = os.getenv('OSS_ENDPOINT', '')

# 初始化OSS客户端
auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
bucket = oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET_NAME)

@app.route('/')
def home():
    return 'Audio Server is running!'

@app.route('/upload_audio', methods=['POST'])
def upload_audio():
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

        # 生成OSS对象键名（使用时间戳防止重名）
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        oss_key = f'audio/{timestamp}_{filename}'

        # 确保文件名有适当的扩展名
        original_ext = os.path.splitext(audio_file.filename)[1].lower()
        if not original_ext:
            original_ext = '.wav'  # 默认使用.wav
        if not oss_key.endswith(original_ext):
            oss_key = f'{oss_key}{original_ext}'
        
        logger.info(f'Preparing to upload file with key: {oss_key}')
        
        # 将文件上传到OSS
        audio_file.seek(0)  # 确保从开头读取文件
        bucket.put_object(oss_key, audio_file)
        logger.info(f'File uploaded successfully to OSS: {oss_key}')
        
        # 获取文件的公共访问链接
        url = bucket.sign_url('GET', oss_key, 60 * 60 * 24 * 365)  # 链接有效1年
        
        logger.info(f'Successfully uploaded audio file to OSS: {oss_key}')
        
        return jsonify({
            'message': 'File uploaded successfully',
            'filename': oss_key,
            'url': url
        })
    except Exception as e:
        logger.error(f'Error in upload_audio: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/audio/<path:oss_key>')
def get_audio(oss_key):
    try:
        # 生成一个临时的签名链接
        url = bucket.sign_url('GET', oss_key, 60 * 60)  # 1小时有效
        return redirect(url)
    except Exception as e:
        logger.error(f'Error in get_audio: {str(e)}')
        return jsonify({'error': str(e)}), 404

@app.route('/audio_list')
def get_audio_list():
    try:
        # 列出所有音频文件
        files = []
        logger.info('Starting to list audio files from OSS')
        for obj in oss2.ObjectIterator(bucket, prefix='audio/'):
            # 支持多种音频格式
            if obj.key.endswith(('.wav', '.mp3', '.ogg', '.m4a')):
                logger.info(f'Found audio file: {obj.key}')
                url = bucket.sign_url('GET', obj.key, 60 * 60 * 24)  # 24小时有效
                files.append({
                    'key': obj.key,
                    'url': url,
                    'size': obj.size,
                    'last_modified': obj.last_modified
                })
        
        logger.info(f'Audio files found in OSS: {len(files)}')
        return jsonify({'files': files})
    except Exception as e:
        logger.error(f'Error in get_audio_list: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/delete_audio', methods=['POST'])
def delete_audio():
    try:
        data = request.json
        if not data or 'key' not in data:
            return jsonify({'success': False, 'error': '缺少音频键值'}), 400
            
        key = data['key']
        logger.info(f'Attempting to delete audio: {key}')
        
        # 检查是否为原始音频（不允许删除）
        if 'default_' in key or '/default_' in key:
            logger.warning(f'Attempted to delete a default audio file: {key}')
            return jsonify({'success': False, 'error': '原始音频文件不可删除'}), 403
            
        # 检查文件是否存在
        if not bucket.object_exists(key):
            logger.warning(f'File does not exist: {key}')
            return jsonify({'success': False, 'error': '文件不存在'}), 404
            
        # 删除文件
        bucket.delete_object(key)
        logger.info(f'Successfully deleted audio: {key}')
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f'Error in delete_audio: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500

def init_default_audio():
    logger.info('Starting default audio initialization...')
    default_audio_dir = os.path.join(os.path.dirname(__file__), 'default_audio')
    logger.info(f'Default audio directory path: {default_audio_dir}')
    
    if not os.path.exists(default_audio_dir):
        os.makedirs(default_audio_dir)
        logger.info(f'Created default audio directory: {default_audio_dir}')
        return  # 如果目录刚创建，那么没有文件可处理
    
    # 获取默认音频目录中的所有音频文件
    logger.info(f'Scanning default audio directory')
    local_audio_files = []
    for ext in ['.wav', '.mp3', '.ogg', '.m4a']:
        local_audio_files.extend(glob.glob(os.path.join(default_audio_dir, f'*{ext}')))
    
    if not local_audio_files:
        logger.info('No audio files found in default_audio directory')
        return
    
    logger.info(f'Found {len(local_audio_files)} audio files in default_audio directory')
    
    # 获取OSS中现有的默认音频文件
    existing_oss_files = {}
    for obj in oss2.ObjectIterator(bucket, prefix='audio/default_'):
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
                with open(audio_file, 'rb') as f:
                    bucket.put_object(oss_key, f)
                logger.info(f'Uploaded default audio file: {oss_key}')
                upload_count += 1
            except Exception as e:
                logger.error(f'Failed to upload default audio file {file_name}: {str(e)}')
    
    if upload_count > 0:
        logger.info(f'Successfully uploaded {upload_count} default audio files')
    else:
        logger.info('No new default audio files to upload')

if __name__ == '__main__':
    logger.info('Starting Flask server...')
    try:
        # 初始化默认音频文件
        init_default_audio()
        
        app.run(host='127.0.0.1', port=8000, debug=True)
    except Exception as e:
        logger.error(f'Failed to start server: {str(e)}')
        raise
