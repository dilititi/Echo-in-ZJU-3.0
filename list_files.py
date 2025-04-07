import os

print('Current directory:', os.getcwd())
print('\nContents of default_audio directory:')
try:
    files = os.listdir('default_audio')
    for file in files:
        print(f'- {file}')
except Exception as e:
    print(f'Error: {str(e)}')
