import numpy as np
import wave
import os

def create_test_audio(filename, duration=1.0, frequency=440.0, sample_rate=44100):
    """创建一个测试音频文件"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    samples = np.sin(2 * np.pi * frequency * t)
    samples = (samples * 32767).astype(np.int16)
    
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(1)  # 单声道
        wf.setsampwidth(2)  # 16位
        wf.setframerate(sample_rate)
        wf.writeframes(samples.tobytes())

def main():
    print('Starting audio file creation...')
    # 创建默认音频目录
    default_audio_dir = 'default_audio'
    print(f'Audio directory path: {os.path.abspath(default_audio_dir)}')
    if not os.path.exists(default_audio_dir):
        os.makedirs(default_audio_dir)
        print(f'Created directory: {default_audio_dir}')
    else:
        print(f'Directory already exists: {default_audio_dir}')
    
    # 创建不同音高的测试音频
    test_files = [
        ('classroom.wav', 440),  # A4
        ('library.wav', 523.25),  # C5
        ('cafe.wav', 587.33),    # D5
        ('sports.wav', 659.25)   # E5
    ]
    
    for filename, freq in test_files:
        filepath = os.path.join(default_audio_dir, filename)
        create_test_audio(filepath, frequency=freq)
        print(f'Created test audio file: {filepath}')

if __name__ == '__main__':
    try:
        main()
        print('Audio file creation completed successfully')
    except Exception as e:
        print(f'Error creating audio files: {str(e)}')
