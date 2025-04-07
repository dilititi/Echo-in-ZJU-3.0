document.addEventListener('DOMContentLoaded', function() {
    // 初始化地图
    const map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -2
    });

    // 设置图片边界（这些值需要根据实际图片尺寸调整）
    const bounds = [[0, 0], [1000, 1000]];
    
    // 加载学校地图图片
    const image = L.imageOverlay('map.jpg', bounds).addTo(map);
    
    // 设置地图视图到图片边界
    map.fitBounds(bounds);

    // 存储所有标记和它们关联的音频
    const markers = new Map();
    
    // 当前选中的图标类型
    let selectedIcon = null;
    let selectedAudio = null;
    
    // 定义不同类型的图标
    const icons = {
        classroom: L.icon({
            iconUrl: 'icons/west_campus.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        }),
        library: L.icon({
            iconUrl: 'icons/basic_library.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        }),
        cafe: L.icon({
            iconUrl: 'icons/office.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        }),
        sports: L.icon({
            iconUrl: 'icons/cafe.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        }),
        // 声音谜题特殊图标
        puzzle1: L.icon({
            iconUrl: 'icons/west_campus.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        }),
        puzzle2: L.icon({
            iconUrl: 'icons/basic_library.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        }),
        puzzle3: L.icon({
            iconUrl: 'icons/office.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        }),
        puzzle4: L.icon({
            iconUrl: 'icons/cafe.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        })
    };

    // 音频录制相关变量
    let mediaRecorder;
    let audioChunks = [];
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const audioNameInput = document.getElementById('audioName');
    const recordingStatus = document.getElementById('recordingStatus');
    const audioFiles = document.getElementById('audioFiles');

    const defaultAudioFiles = document.getElementById('defaultAudioFiles');
    
    // 初始化音频列表
    function updateAudioList() {
        console.log('Fetching audio list...');
        audioFiles.innerHTML = '<p>正在加载音频列表...</p>';
        defaultAudioFiles.innerHTML = '<p>正在加载原始音频...</p>';
        
        // 添加缓存禁用参数确保获取最新列表
        fetch('http://localhost:8000/audio_list?_=' + new Date().getTime())
            .then(response => {
                console.log('Audio list response:', response);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Audio list data:', data);
                audioFiles.innerHTML = '';
                defaultAudioFiles.innerHTML = '';
                
                if (!data.files || data.files.length === 0) {
                    audioFiles.innerHTML = '<p>没有找到音频文件</p>';
                    defaultAudioFiles.innerHTML = '<p>没有原始音频文件</p>';
                    return;
                }
                
                // 分离原始音频和用户上传的音频
                const defaultFiles = [];
                const userFiles = [];
                
                data.files.forEach(file => {
                    if (file.key.includes('default_') || file.key.includes('/default_')) {
                        defaultFiles.push(file);
                    } else {
                        userFiles.push(file);
                    }
                });
                
                // 处理原始音频
                if (defaultFiles.length === 0) {
                    defaultAudioFiles.innerHTML = '<p>没有原始音频文件</p>';
                } else {
                    console.log('Processing default files:', defaultFiles);
                    defaultFiles.forEach(file => createAudioItem(file, defaultAudioFiles, false));
                }
                
                // 处理用户上传的音频
                if (userFiles.length === 0) {
                    audioFiles.innerHTML = '<p>没有上传的音频文件</p>';
                } else {
                    console.log('Processing user files:', userFiles);
                    userFiles.forEach(file => createAudioItem(file, audioFiles, true));
                }
            })
            .catch(error => console.error('Error fetching audio list:', error));
    }
    
    // 全局变量记录谜题编号
    let riddleCounter = 0;
    let defaultAudioMarkers = [];
    
    // 创建音频列表项
    function createAudioItem(file, container, showDeleteButton) {
        console.log('Creating audio item:', file);
        const audioItem = document.createElement('div');
        audioItem.className = 'audio-item';
        
        // 从完整路径中提取文件名并去除前缀
        const filename = file.key.split('/').pop();
        console.log('Filename:', filename);
        
        // 判断是否为默认音频（声音谜题）
        const isDefaultAudio = !showDeleteButton;
        
        // 为默认音频创建可编辑的名称
        if (isDefaultAudio) {
            riddleCounter++;
            const defaultName = `谜题${riddleCounter}`;
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = defaultName;
            nameInput.className = 'puzzle-name';
            nameInput.dataset.key = file.key;
            nameInput.dataset.originalFilename = filename;
            nameInput.style.marginRight = '10px';
            nameInput.style.width = '150px';
            audioItem.appendChild(nameInput);
            
            // 在地图上添加随机标记
            addRandomMarkerForAudio(file, defaultName, nameInput);
        } else {
            // 用户自定义音频保持原始颜色显示
            const nameSpan = document.createElement('span');
            nameSpan.textContent = filename;
            nameSpan.style.marginRight = '10px';
            audioItem.appendChild(nameSpan);
        }
                    
        // 播放按钮
        const playButton = document.createElement('button');
        playButton.textContent = '播放';
        playButton.className = 'play-button';
        playButton.dataset.playing = 'false';
        playButton.dataset.url = file.url;
        playButton.onclick = function() {
            playAudio(file.url, this);
        };
        
        const selectButton = document.createElement('button');
        selectButton.textContent = '选择';
        selectButton.onclick = () => {
            selectedAudio = {
                key: file.key,
                url: file.url
            };
            document.querySelectorAll('.audio-item').forEach(item => 
                item.style.backgroundColor = 'white');
            audioItem.style.backgroundColor = '#e6f3ff';
        };
        
        // 根据音频类型添加适当的元素
        if (!isDefaultAudio) {
            // 只有用户自定义音频才有nameSpan
            audioItem.appendChild(nameSpan);
        }
        audioItem.appendChild(playButton);
        audioItem.appendChild(selectButton);
        
        // 只为用户上传的音频添加删除按钮
        if (showDeleteButton) {
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除';
            deleteButton.onclick = () => {
                if (confirm(`确定要删除音频 ${filename} 吗？`)) {
                    deleteAudio(file.key);
                }
            };
            audioItem.appendChild(deleteButton);
        }
        
        container.appendChild(audioItem);
    }

    // 全局变量用于跟踪当前播放的音频
    let currentAudio = null;
    let isPlaying = false;
    let currentPlayButton = null;
    
    // 播放音频
    function playAudio(url, button) {
        console.log('Playing audio:', url);
        
        // 检查是否是暂停/恢复同一个音频
        if (currentAudio && currentPlayButton === button) {
            if (isPlaying) {
                // 当前正在播放 - 暂停
                currentAudio.pause();
                isPlaying = false;
                button.textContent = '播放';
                button.dataset.playing = 'false';
                return;
            } else {
                // 当前已经暂停 - 继续播放
                currentAudio.play();
                isPlaying = true;
                button.textContent = '暂停';
                button.dataset.playing = 'true';
                return;
            }
        }
        
        // 如果已有其他音频在播放，停止它
        if (currentAudio) {
            currentAudio.pause();
            // 重置之前的按钮
            if (currentPlayButton) {
                currentPlayButton.textContent = '播放';
                currentPlayButton.dataset.playing = 'false';
            }
        }
        
        // 创建新的音频对象并播放
        const audio = new Audio(url);
        currentAudio = audio;
        currentPlayButton = button;
        isPlaying = true;
        
        // 更新按钮状态
        button.textContent = '暂停';
        button.dataset.playing = 'true';
        
        // 添加音频结束事件处理
        audio.addEventListener('ended', () => {
            button.textContent = '播放';
            button.dataset.playing = 'false';
            isPlaying = false;
            currentAudio = null;
        });
        
        audio.play();
    }
    
    // 删除音频功能
    function deleteAudio(key) {
        fetch('http://localhost:8000/delete_audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key: key })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Delete response:', data);
            if (data.success) {
                alert('音频删除成功');
                updateAudioList(); // 刷新音频列表
            } else {
                alert(`删除失败: ${data.error || '未知错误'}`);
            }
        })
        .catch(error => {
            console.error('Error deleting audio:', error);
            alert(`删除音频出错: ${error.message}`);
        });
    }

    // 上传本地音频文件功能
    const uploadButton = document.getElementById('uploadButton');
    const uploadAudioNameInput = document.getElementById('uploadAudioName');
    const audioFileInput = document.getElementById('audioFileInput');
    
    // 自动填充文件名
    audioFileInput.addEventListener('change', () => {
        if (audioFileInput.files.length > 0) {
            // 获取文件名并去除扩展名
            const fileName = audioFileInput.files[0].name.replace(/\.[^\.]+$/, '');
            uploadAudioNameInput.value = fileName;
        }
    });
    
    uploadButton.addEventListener('click', async () => {
        if (!uploadAudioNameInput.value) {
            alert('请先输入音频名称');
            return;
        }
        
        if (!audioFileInput.files[0]) {
            alert('请选择音频文件');
            return;
        }
        
        const formData = new FormData();
        formData.append('audio', audioFileInput.files[0]);
        formData.append('filename', uploadAudioNameInput.value);
        
        try {
            uploadButton.disabled = true;
            uploadButton.textContent = '上传中...';
            
            console.log('Sending audio upload request...');
            const response = await fetch('http://localhost:8000/upload_audio', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            console.log('Upload response:', data);
            
            if (response.ok) {
                alert('上传成功！');
                uploadAudioNameInput.value = '';
                audioFileInput.value = '';
                // 增加更长的延时，确保服务器处理完成
                setTimeout(() => {
                    console.log('Refreshing audio list after upload');
                    updateAudioList();
                }, 1500);
            } else {
                alert(`上传失败: ${data.error || '未知错误'}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(`上传错误: ${error.message}`);
        } finally {
            uploadButton.disabled = false;
            uploadButton.textContent = '上传音频';
        }
    });
    
    // 录音功能
    recordButton.addEventListener('click', async () => {
        if (!audioNameInput.value) {
            alert('请先输入音频名称');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                console.log('Recording stopped, preparing to upload...');
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const formData = new FormData();
                formData.append('audio', audioBlob, audioNameInput.value + '.wav');
                formData.append('filename', audioNameInput.value + '.wav');

                try {
                    console.log('Uploading audio file...');
                    const response = await fetch('http://localhost:8000/upload_audio', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    console.log('Upload response:', response);
                    const data = await response.json();
                    if (data.url) {
                        updateAudioList();
                        recordingStatus.textContent = '录音已保存到云端';
                    } else {
                        throw new Error('No URL in response');
                    }
                } catch (error) {
                    console.error('Error uploading audio:', error);
                    recordingStatus.textContent = '保存失败';
                }
            };

            mediaRecorder.start();
            recordButton.disabled = true;
            stopButton.disabled = false;
            recordButton.classList.add('recording');
            recordingStatus.textContent = '正在录音...';
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('无法访问麦克风');
        }
    });

    stopButton.addEventListener('click', () => {
        mediaRecorder.stop();
        recordButton.disabled = false;
        stopButton.disabled = true;
        recordButton.classList.remove('recording');
    });

    // 图标选择功能
    const iconOptions = document.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
        option.addEventListener('click', function() {
            iconOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            selectedIcon = this.dataset.icon;
        });
    });
    
    // 初始化时加载音频列表
    updateAudioList();

    // 点击地图添加标记
    map.on('click', function(e) {
        if (!selectedIcon) {
            alert('请先选择一个图标类型');
            return;
        }

        const marker = L.marker(e.latlng, {
            icon: icons[selectedIcon],
            draggable: true
        }).addTo(map);

        // 如果有选中的音频，将其与标记关联
        if (selectedAudio) {
            markers.set(marker, selectedAudio);
            
            // 添加点击播放功能
            marker.on('click', function() {
                const audioFile = markers.get(marker);
                if (audioFile && audioFile.url) {
                    playAudio(audioFile.url);
                }
            });
        }

        // 为标记添加删除功能
        marker.on('contextmenu', function() {
            map.removeLayer(marker);
            markers.delete(marker);
        });
    });

    // 添加说明
    L.control.attribution({
        prefix: '左键点击标记播放声音，右键点击删除'
    }).addTo(map);

    // 在地图上为音频添加随机标记
    function addRandomMarkerForAudio(file, displayName, nameInput) {
        // 生成地图上的随朼位置
        const randomLat = Math.random() * 800 + 100; // 100-900 之间
        const randomLng = Math.random() * 800 + 100; // 100-900 之间
        
        // 选择随机图标
        const puzzleIcons = ['puzzle1', 'puzzle2', 'puzzle3', 'puzzle4'];
        const randomIcon = puzzleIcons[Math.floor(Math.random() * puzzleIcons.length)];
        
        // 创建标记
        const marker = L.marker([randomLat, randomLng], {
            icon: icons[randomIcon],
            draggable: true
        }).addTo(map);
        
        // 存储音频信息
        marker.audioData = {
            key: file.key,
            url: file.url,
            name: displayName
        };
        
        // 添加点击事件 - 播放音频
        marker.on('click', function() {
            const playButton = document.createElement('button');
            playButton.textContent = '播放';
            playButton.className = 'play-button';
            playButton.dataset.playing = 'false';
            playButton.dataset.url = file.url;
            playAudio(file.url, playButton);
        });
        
        // 添加长按事件 - 显示音频名称
        let pressTimer;
        marker.on('mousedown', function() {
            pressTimer = window.setTimeout(function() {
                // 显示音频名称
                alert(`声音谜题: ${marker.audioData.name}`);
            }, 1000); // 1秒长按
        });
        
        marker.on('mouseup mouseleave', function() {
            clearTimeout(pressTimer);
        });
        
        // 连接谜题名称输入框与标记
        if (nameInput) {
            nameInput.addEventListener('input', function() {
                marker.audioData.name = this.value;
            });
            
            // 建立双向绑定
            marker.on('click', function() {
                // 双击时编辑名称
                nameInput.focus();
                nameInput.select();
            });
            
            // 将标记保存到全局数组中
            defaultAudioMarkers.push({
                marker: marker,
                input: nameInput,
                audioFile: file
            });
        }
        
        return marker;
    }
    
    // 初始化音频列表
    updateAudioList();
});
