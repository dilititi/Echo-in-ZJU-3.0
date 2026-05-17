// audio-manager.js — 音频列表、播放、录制、上传、标记放置
Object.assign(App, {

    handleIconSelect(e) {
        const iconOptions = document.querySelectorAll('.icon-option');
        iconOptions.forEach(opt => opt.classList.remove('selected'));
        e.target.classList.add('selected');
        this.state.selectedType = e.target.dataset.type;
        Storage.saveUserState(this.state.selectedType, this.state.selectedAudio);
    },

    handleKeyPress(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();

        const setStatus = (msg) => {
            const s = document.getElementById('recordingStatus');
            if (!s) return;
            s.textContent = msg;
            const snap = s.textContent;
            setTimeout(() => { if (s.textContent === snap) s.textContent = ''; }, 3500);
        };

        if (this.state.markerCount >= Config.maxMarkers) {
            setStatus('⚠ 地图标记数量已达到上限');
            return;
        }

        if (!this.state.lastMousePosition) {
            setStatus('✎ 请先将鼠标移动到地图上要放置标记的位置');
            return;
        }

        const markerType = Data.markerTypes[this.state.selectedType];
        if (!markerType) {
            setStatus('✎ 请先在侧栏 Markers 卡片选择一个标记类型');
            return;
        }

        const mousePos = this.state.lastMousePosition;

        const icon = L.divIcon({
            className: 'user-marker',
            html: `<div style="
                width: 36px;
                height: 36px;
                background: ${markerType.color};
                border: 2px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                cursor: pointer;
            ">${markerType.icon}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        const marker = L.marker(mousePos, {
            icon: icon,
            draggable: true
        }).addTo(this.state.map);

        marker.markerData = {
            id: Date.now(),
            type: this.state.selectedType,
            audioData: this.state.selectedAudio || null
        };

        this.state.markerCount++;

        marker.on('click', () => {
            const audioFile = this.state.markers.get(marker);
            if (audioFile && audioFile.url) {
                const tempButton = {
                    textContent: '播放',
                    dataset: { playing: 'false', url: audioFile.url },
                    style: {}
                };
                this.playAudio(audioFile.url, tempButton);
            }

            this.state.markers.forEach((_, m) => {
                if (m._icon) m._icon.style.filter = '';
            });
            if (marker._icon) marker._icon.style.filter = 'brightness(1.2)';
            this.state.selectedMarker = marker;
        });

        this.state.markers.set(marker, this.state.selectedAudio || null);

        marker.on('dragend', (e) => {
            const newPosition = e.target.getLatLng();
            marker.position = newPosition;
            this.saveMarkers();
        });

        this.saveMarkers();

        if (Storage.userProgress.currentLevel === 4 && this.state.selectedAudio) {
            this.state.level4MarkerPlaced = true;
            this.checkLevel4Complete();
        }

        if (Storage.userProgress.currentLevel === 2) {
            this.completeLevel();
        }
    },

    updateAudioList(forceRefresh = false) {
        const now = Date.now();

        if (!forceRefresh && this.state.audioListCache && (now - this.state.audioListCacheTime) < Config.audioListCacheTimeout) {
            this.processAudioListData(this.state.audioListCache);
            return;
        }

        if (this.state.isUpdatingAudioList) return;

        this.state.isUpdatingAudioList = true;
        this.elements.audioFiles.innerHTML = '<p>正在加载音频列表...</p>';
        this.elements.defaultAudioFiles.innerHTML = '<p>正在加载原始音频...</p>';

        fetch(`${Config.serverUrl}/audio_list?_=${new Date().getTime()}`, this.getFetchOptions())
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                this.state.audioListCache = data;
                this.state.audioListCacheTime = now;
                this.processAudioListData(data);
            })
            .catch(error => {
                console.error('Error fetching audio list:', error);
                this.elements.audioFiles.innerHTML = '<p>加载音频列表失败</p>';
                this.elements.defaultAudioFiles.innerHTML = '<p>加载原始音频失败</p>';
            })
            .finally(() => {
                this.state.isUpdatingAudioList = false;
            });
    },

    processAudioListData(data) {
        this.elements.audioFiles.innerHTML = '';
        this.elements.defaultAudioFiles.innerHTML = '';
        this.state.riddleCounter = 0;

        if (!data.files || data.files.length === 0) {
            this.elements.audioFiles.innerHTML = '<p>没有找到音频文件</p>';
            this.elements.defaultAudioFiles.innerHTML = '<p>没有原始音频文件</p>';
            return;
        }

        const defaultFiles = [];
        const userFiles = [];

        data.files.forEach(file => {
            if (file.key.includes('default_') || file.key.includes('/default_')) {
                defaultFiles.push(file);
            } else {
                userFiles.push(file);
            }
        });

        if (defaultFiles.length === 0) {
            this.elements.defaultAudioFiles.innerHTML = '<p>没有原始音频文件</p>';
        } else {
            const frag = document.createDocumentFragment();
            defaultFiles.slice(0, Config.maxDefaultAudioMarkers).forEach(file => {
                const el = this.createAudioItem(file, false);
                if (el) frag.appendChild(el);
            });
            this.elements.defaultAudioFiles.appendChild(frag);
        }

        if (userFiles.length === 0) {
            this.elements.audioFiles.innerHTML = '<p>没有上传的音频文件</p>';
        } else {
            const frag = document.createDocumentFragment();
            userFiles.forEach(file => {
                const el = this.createAudioItem(file, true);
                if (el) frag.appendChild(el);
            });
            this.elements.audioFiles.appendChild(frag);
        }
    },

    createAudioItem(file, showDeleteButton) {
        const audioItem = document.createElement('div');
        audioItem.className = 'audio-item';

        let filename = Utils.escapeHtml(file.key.split('/').pop());
        if (filename.includes('_')) {
            const parts = filename.split('_');
            if (parts.length > 2) {
                const lastPart = parts[parts.length - 1];
                if (lastPart.includes('.')) {
                    const nameWithoutExt = lastPart.split('.')[0];
                    if (nameWithoutExt.length > 0) filename = nameWithoutExt;
                }
            }
        }

        if (!Utils.validateUrl(file.url)) {
            console.error('Invalid audio URL:', file.url);
            return null;
        }

        const isDefaultAudio = !showDeleteButton;

        let nameElement;
        if (isDefaultAudio) {
            this.state.riddleCounter++;
            const defaultName = `谜题${this.state.riddleCounter}`;
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = Utils.escapeHtml(defaultName);
            nameInput.className = 'puzzle-name';
            nameInput.dataset.key = Utils.escapeHtml(file.key);
            nameInput.dataset.originalFilename = Utils.escapeHtml(filename);
            nameInput.style.marginRight = '10px';
            nameInput.style.width = '150px';
            nameElement = nameInput;
        } else {
            const nameSpan = document.createElement('span');
            nameSpan.textContent = filename;
            nameSpan.style.marginRight = '10px';
            nameElement = nameSpan;
        }

        audioItem.appendChild(nameElement);

        const playButton = document.createElement('button');
        playButton.textContent = '播放';
        playButton.className = 'play-button';
        playButton.dataset.playing = 'false';
        playButton.dataset.url = file.url;
        playButton.onclick = () => this.playAudio(file.url, playButton, isDefaultAudio);

        const selectButton = document.createElement('button');
        selectButton.textContent = '选择';
        selectButton.onclick = () => {
            this.state.selectedAudio = { key: file.key, url: file.url };
            document.querySelectorAll('.audio-item').forEach(item =>
                item.style.backgroundColor = 'white');
            audioItem.style.backgroundColor = '#e6f3ff';
            Storage.saveUserState(this.state.selectedIcon, this.state.selectedAudio);

            if (Storage.userProgress.currentLevel === 4) {
                this.state.level4AudioSelected = true;
                this.checkLevel4Complete();
            }
        };

        audioItem.appendChild(playButton);
        audioItem.appendChild(selectButton);

        if (isDefaultAudio) {
            const revealBtn = document.createElement('button');
            revealBtn.textContent = '显示答案';
            revealBtn.className = 'reveal-answer-btn';
            revealBtn.style.cssText = 'background: rgba(212,175,55,0.15); color: #f4d35e; border: 1px solid #d4af37; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-left: 4px;';

            const answerSpan = document.createElement('span');
            answerSpan.style.cssText = 'display:none; margin-left: 8px; color: #f4d35e; font-size: 12px; font-weight: bold;';
            answerSpan.textContent = filename.replace(/\.[^.]+$/, '');

            revealBtn.onclick = () => {
                answerSpan.style.display = 'inline';
                revealBtn.style.display = 'none';
            };

            audioItem.appendChild(revealBtn);
            audioItem.appendChild(answerSpan);
        }

        if (showDeleteButton) {
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除';
            deleteButton.onclick = () => {
                if (confirm(`确定要删除音频 ${filename} 吗？`)) {
                    this.deleteAudio(file.key);
                }
            };
            audioItem.appendChild(deleteButton);
        }

        return audioItem;
    },

    playAudio(url, button, isDefaultAudio = false) {
        if (!Utils.validateUrl(url)) {
            console.error('Invalid audio URL:', url);
            alert('音频URL无效，无法播放');
            return;
        }

        if (this.state.currentAudio && this.state.currentPlayButton === button) {
            if (this.state.isPlaying) {
                this.state.currentAudio.pause();
                this.state.isPlaying = false;
                if (button) {
                    button.textContent = '播放';
                    button.dataset.playing = 'false';
                    this.clearProgressInterval(button);
                }
                return;
            } else {
                this.state.currentAudio.play();
                this.state.isPlaying = true;
                if (button) {
                    button.textContent = '暂停';
                    button.dataset.playing = 'true';
                    this.updateProgress(this.state.currentAudio, button);
                }
                return;
            }
        }

        this.stopCurrentAudio();

        let audio;
        if (this.state.audioPool.has(url)) {
            audio = this.state.audioPool.get(url);
            // 清理上一次挂在该 Audio 对象上的 handler，防止池复用时双触发
            if (audio._endedHandler) {
                audio.removeEventListener('ended', audio._endedHandler);
                audio._endedHandler = null;
            }
            if (audio._errorHandler) {
                audio.removeEventListener('error', audio._errorHandler);
                audio._errorHandler = null;
            }
            audio.currentTime = 0;
        } else {
            // LRU 淘汰：超出上限时移除最早入池的条目并释放 PCM 缓冲
            if (this.state.audioPool.size >= 30) {
                const oldestKey = this.state.audioPool.keys().next().value;
                const oldestAudio = this.state.audioPool.get(oldestKey);
                oldestAudio.pause();
                oldestAudio.removeEventListener('ended', oldestAudio._endedHandler);
                oldestAudio.removeEventListener('error', oldestAudio._errorHandler);
                oldestAudio.src = '';
                this.state.audioPool.delete(oldestKey);
            }
            audio = new Audio(Config.resolveUrl(url));
            this.state.audioPool.set(url, audio);
        }

        this.state.currentAudio = audio;
        this.state.currentPlayButton = button;
        this.state.isPlaying = true;

        if (button) {
            button.textContent = '暂停';
            button.dataset.playing = 'true';
        }

        audio._endedHandler = () => {
            audio._endedHandler = null;
            audio._errorHandler = null;
            this.handleAudioEnded(button);
            if (isDefaultAudio && Storage.userProgress.currentLevel === 5 && !this.state.level5Completed) {
                this.state.level5Completed = true;
                this.stopLevel5Highlight();
                this.completeLevel();
            }
        };
        audio._errorHandler = (e) => {
            audio._endedHandler = null;
            audio._errorHandler = null;
            this.handleAudioError(button, e);
        };

        audio.addEventListener('ended', audio._endedHandler, { once: true });
        audio.addEventListener('error', audio._errorHandler, { once: true });

        audio.play().catch(error => {
            this.state.isPlaying = false;
            this.state.currentAudio = null;
            this.state.currentPlayButton = null;
            audio._endedHandler = null;
            audio._errorHandler = null;
            console.error('Playback failed:', error);
            this.handleAudioError(button, error);
        });
    },

    stopCurrentAudio() {
        if (this.state.currentAudio) {
            this.state.currentAudio.pause();
            if (this.state.currentPlayButton) {
                this.clearProgressInterval(this.state.currentPlayButton);
                this.state.currentPlayButton.textContent = '播放';
                this.state.currentPlayButton.dataset.playing = 'false';
            }
            this.state.currentAudio = null;
            this.state.currentPlayButton = null;
            this.state.isPlaying = false;
        }
    },

    handleAudioEnded(button) {
        if (button) {
            button.textContent = '播放';
            button.dataset.playing = 'false';
            this.clearProgressInterval(button);
        }
        this.state.isPlaying = false;
        this.state.currentAudio = null;
        this.state.currentPlayButton = null;
    },

    handleAudioError(button, error) {
        console.error('Audio playback error:', error);
        if (button) {
            button.textContent = '播放';
            button.dataset.playing = 'false';
            this.clearProgressInterval(button);
        }
        this.state.isPlaying = false;
        this.state.currentAudio = null;
        this.state.currentPlayButton = null;
        alert('音频播放失败');
    },

    clearProgressInterval(button) {
        if (button && button._rafId) {
            cancelAnimationFrame(button._rafId);
            button._rafId = null;
        }
    },

    updateProgress(audio, button) {
        if (!button) return;
        this.clearProgressInterval(button);

        if (!button.progressBar && button.parentNode) {
            const progressBar = document.createElement('div');
            progressBar.style.width = '100px';
            progressBar.style.height = '4px';
            progressBar.style.backgroundColor = '#e0e0e0';
            progressBar.style.marginTop = '5px';
            progressBar.style.borderRadius = '2px';
            progressBar.style.overflow = 'hidden';

            const progressFill = document.createElement('div');
            progressFill.style.height = '100%';
            progressFill.style.backgroundColor = '#0078A8';
            progressFill.style.width = '0%';
            progressFill.style.transition = 'width 0.1s ease';

            progressBar.appendChild(progressFill);
            button.parentNode.appendChild(progressBar);
            button.progressBar = progressBar;
            button.progressFill = progressFill;
        }

        const updateLoop = () => {
            if (button.dataset.playing !== 'true') { button._rafId = null; return; }
            if (audio.duration && !isNaN(audio.duration) && button.progressFill) {
                const progress = (audio.currentTime / audio.duration) * 100;
                button.progressFill.style.width = `${progress}%`;
            }
            button._rafId = requestAnimationFrame(updateLoop);
        };
        button._rafId = requestAnimationFrame(updateLoop);
    },

    deleteAudio(key) {
        if (!Utils.validateAudioKey(key)) {
            console.error('Invalid audio key:', key);
            alert('音频key格式无效，无法删除');
            return;
        }

        fetch(`${Config.serverUrl}/delete_audio`, this.getFetchOptions('POST', { key: key }))
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('音频删除成功');
                    this.updateAudioList(true);
                } else {
                    alert(`删除失败: ${data.error || '未知错误'}`);
                }
            })
            .catch(error => {
                console.error('Error deleting audio:', error);
                alert(`删除音频出错: ${error.message}`);
            });
    },

    handleFileChange() {
        if (this.elements.audioFileInput.files.length > 0) {
            const fileName = this.elements.audioFileInput.files[0].name.replace(/\.[^\.]+$/, '');
            this.elements.uploadAudioNameInput.value = fileName;
        }
    },

    uploadAudio() {
        const audioName = this.elements.uploadAudioNameInput.value;
        const validationError = Utils.validateAudioName(audioName);
        if (validationError) {
            alert(validationError);
            return;
        }

        if (this.isAudioNameDuplicate(audioName)) {
            alert('音频名称已存在，请使用其他名称');
            return;
        }

        if (!this.elements.audioFileInput.files[0]) {
            alert('请选择音频文件');
            return;
        }

        const maxSize = 20;
        const fileSize = this.elements.audioFileInput.files[0].size;
        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

        if (parseFloat(fileSizeMB) > maxSize) {
            alert(`上传失败！音频大小为 ${fileSizeMB}MB，超出20MB限制`);
            return;
        }

        if (!confirm(`注意：该音频为${fileSizeMB}MB，请注意内存空间！\n确认上传吗？`)) {
            return;
        }

        const formData = new FormData();
        formData.append('audio', this.elements.audioFileInput.files[0]);
        formData.append('filename', audioName);
        const uploadModal = document.getElementById('uploadModal');
        const buildingId = (uploadModal && uploadModal.dataset.buildingId) || '';
        if (buildingId) formData.append('building_id', buildingId);

        try {
            this.elements.uploadButton.disabled = true;
            this.elements.uploadButton.textContent = '上传中...';

            fetch(`${Config.serverUrl}/upload_audio`, this.getFormDataOptions('POST', formData))
                .then(response => response.json())
                .then(data => {
                    if (data.url) {
                        alert('上传成功！');
                        this.elements.uploadAudioNameInput.value = '';
                        this.elements.audioFileInput.value = '';
                        this.updateAudioList(true);

                        if (Storage.userProgress.currentLevel === 3) {
                            this.completeLevel();
                        }
                    } else {
                        throw new Error('No URL in response');
                    }
                })
                .catch(error => {
                    console.error('Upload error:', error);
                    alert(`上传错误: ${error.message}`);
                })
                .finally(() => {
                    this.elements.uploadButton.disabled = false;
                    this.elements.uploadButton.textContent = '上传音频';
                });
        } catch (error) {
            console.error('Upload error:', error);
            alert(`上传错误: ${error.message}`);
            this.elements.uploadButton.disabled = false;
            this.elements.uploadButton.textContent = '上传音频';
        }
    },

    isAudioNameDuplicate(name) {
        const audioItems = document.querySelectorAll('.audio-item span, .audio-item input.puzzle-name');
        for (const item of audioItems) {
            let existingName = item.textContent || item.value;
            existingName = existingName.replace(/\.[^.]+$/, '');
            if (existingName === name) return true;
        }
        return false;
    },

    startRecording() {
        const audioName = this.elements.audioNameInput.value;
        const validationError = Utils.validateAudioName(audioName);
        if (validationError) {
            alert(validationError);
            return;
        }

        if (this.isAudioNameDuplicate(audioName)) {
            alert('音频名称已存在，请使用其他名称');
            return;
        }

        try {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    this.state.mediaRecorder = new MediaRecorder(stream);
                    this.state.audioChunks = [];

                    this.state.mediaRecorder.ondataavailable = event => {
                        this.state.audioChunks.push(event.data);
                    };

                    this.state.mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(this.state.audioChunks, { type: 'audio/wav' });
                        const formData = new FormData();
                        formData.append('audio', audioBlob, audioName + '.wav');
                        formData.append('filename', audioName + '.wav');

                        try {
                            fetch(`${Config.serverUrl}/upload_audio`, this.getFormDataOptions('POST', formData))
                                .then(response => response.json())
                                .then(data => {
                                    if (data.url) {
                                        this.updateAudioList(true);
                                        this.elements.recordingStatus.textContent = '录音已保存到云端';

                                        if (Storage.userProgress.currentLevel === 3) {
                                            this.completeLevel();
                                        }
                                    } else {
                                        throw new Error('No URL in response');
                                    }
                                })
                                .catch(error => {
                                    console.error('Error uploading audio:', error);
                                    this.elements.recordingStatus.textContent = '保存失败';
                                });
                        } catch (error) {
                            console.error('Error uploading audio:', error);
                            this.elements.recordingStatus.textContent = '保存失败';
                        }
                    };

                    this.state.mediaRecorder.start();
                    this.elements.recordButton.disabled = true;
                    this.elements.stopButton.disabled = false;
                    this.elements.recordButton.classList.add('recording');
                    this.elements.recordingStatus.textContent = '正在录音...';
                })
                .catch(error => {
                    console.error('Error accessing microphone:', error);
                    alert('无法访问麦克风');
                });
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('无法开始录音');
        }
    },

    stopRecording() {
        if (this.state.mediaRecorder) {
            this.state.mediaRecorder.stop();
            this.elements.recordButton.disabled = false;
            this.elements.stopButton.disabled = true;
            this.elements.recordButton.classList.remove('recording');
        }
    },

    getAllEvents() {
        return { ...Data.puzzleEvents, ...Storage.userEvents };
    },
});
