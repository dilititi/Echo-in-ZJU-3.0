// markers.js — 建筑标记、弹窗、答题、环境音、本地保存
Object.assign(App, {

    createBuildingMarker(buildingId, building) {
        const iconSize = 120;
        const icon = L.divIcon({
            className: 'building-marker',
            html: `<div class="building-marker-container" style="
                width: ${iconSize}px;
                height: ${iconSize}px;
                background-image: url('${building.image}');
                background-size: contain;
                background-position: center;
                background-repeat: no-repeat;
                cursor: pointer;
                transition: transform 0.2s ease;
            "></div>`,
            iconSize: [iconSize, iconSize],
            iconAnchor: [iconSize / 2, iconSize / 2]
        });

        const marker = L.marker(building.position, { icon: icon }).addTo(this.state.map);
        marker.buildingId = buildingId;
        marker.buildingData = building;

        marker.on('click', () => { this.showBuildingInfo(buildingId, building); });
        marker.on('mouseover', function() {
            const el = this.getElement().querySelector('.building-marker-container');
            if (el) el.style.transform = 'scale(1.1)';
        });
        marker.on('mouseout', function() {
            const el = this.getElement().querySelector('.building-marker-container');
            if (el) el.style.transform = 'scale(1)';
        });

        this.state.buildingMarkers[buildingId] = marker;
    },

    showBuildingInfo(buildingId, building) {
        const existingPopup = document.getElementById('building-info-popup');
        if (existingPopup) existingPopup.remove();

        const puzzleEventId = buildingId + '_puzzle';
        const puzzleEvent = Data.puzzleEvents[puzzleEventId];
        const showPuzzle = !!puzzleEvent;

        const quiz = Data.quizQuestions.find(q => q.buildingId === buildingId);

        let displayEvent = puzzleEvent;
        let isHiddenTriggered = false;

        if (showPuzzle && puzzleEvent && puzzleEvent.hidden) {
            isHiddenTriggered = Math.random() < 0.2;
            if (!isHiddenTriggered) displayEvent = null;
        }

        this.playAreaAmbientSound(buildingId, building);

        const popup = document.createElement('div');
        popup.id = 'building-info-popup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%);
            border: 2px solid var(--art-deco-gold);
            padding: 30px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 6000;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        `;

        let content = '';

        if (showPuzzle && displayEvent) {
            const emotionTag = this.getBuildingEmotionTag(buildingId);
            const hiddenBadge = displayEvent.hidden ? '<span style="background: linear-gradient(135deg, #d4af37, #f4d35e); color: #1b263b; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin-left: 8px;">🎭 隐藏彩蛋</span>' : '';
            const audioFile = this.getAudioFileByPattern(displayEvent.audioPattern);
            const audioAnswerName = audioFile.split('/').pop().replace(/\.[^.]+$/, '');

            content = `
                <div style="text-align: center;">
                    <img src="${building.image}" style="max-width: 100%; max-height: 200px; border: 1px solid var(--art-deco-gold); margin-bottom: 15px;">
                    <h3 style="font-family: var(--font-display); color: #f5f0e1; margin: 0 0 10px 0; letter-spacing: 2px;">${displayEvent.title}${hiddenBadge}</h3>
                    <div style="color: #e0e0e0; line-height: 1.8; margin-bottom: 15px; text-align: left; white-space: pre-line;">${displayEvent.description}</div>
                    <div style="margin-top: 15px; padding: 12px; background: rgba(212, 175, 55, 0.08); border-left: 3px solid var(--art-deco-gold); border-radius: 0 6px 6px 0;">
                        <p style="margin: 0 0 10px 0; font-size: 12px; color: #f4d35e;">🎵 声音谜题（不可删除）</p>
                        <button id="puzzlePlayBtn" style="
                            background: linear-gradient(135deg, #1a6b3a, #2d9e5f);
                            color: #fff;
                            border: none;
                            padding: 8px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                            margin-bottom: 10px;
                        ">▶ 播放音频</button>
                        <div id="puzzleGuessArea" style="display: none; margin-top: 10px;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #e0e0e0;">你猜这是什么声音？</p>
                            <input id="puzzleGuessInput" type="text" placeholder="输入你的猜测..." style="
                                width: 100%;
                                box-sizing: border-box;
                                padding: 7px 10px;
                                border-radius: 4px;
                                border: 1px solid var(--art-deco-gold);
                                background: rgba(255,255,255,0.08);
                                color: #f5f0e1;
                                font-size: 13px;
                                margin-bottom: 8px;
                            ">
                            <div style="display: flex; gap: 8px; justify-content: center; align-items: center; margin-top: 4px;">
                                <button id="puzzleRevealBtn" style="
                                    background: rgba(212, 175, 55, 0.15);
                                    color: #f4d35e;
                                    border: 1px solid var(--art-deco-gold);
                                    padding: 6px 14px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-size: 12px;
                                ">显示答案</button>
                                <span id="puzzleAnswer" style="
                                    font-size: 13px;
                                    color: #f4d35e;
                                    font-weight: bold;
                                    letter-spacing: 1px;
                                    display: none;
                                ">答案：${audioAnswerName}</span>
                            </div>
                        </div>
                    </div>
                    ${emotionTag ? `<div style="margin-top: 10px; padding: 8px; background: rgba(255, 107, 155, 0.1); border-radius: 4px;">
                        <p style="margin: 0; font-size: 12px; color: #FF6B9B;">${emotionTag}</p>
                    </div>` : ''}
                    ${quiz && !Storage.userProgress.completedQuizzes?.includes(quiz.id) ? '<button id="startQuizBtn" style="margin-top: 15px; background: linear-gradient(135deg, var(--art-deco-gold), var(--art-deco-gold-light));">📝 参与答题</button>' : ''}
                    <button id="closeBuildingInfo" style="margin-top: 15px;">关闭</button>
                </div>
            `;
        } else {
            const emotionTag = this.getBuildingEmotionTag(buildingId);
            content = `
                <div style="text-align: center;">
                    <img src="${building.image}" style="max-width: 100%; max-height: 200px; border: 1px solid var(--art-deco-gold); margin-bottom: 15px;">
                    <h3 style="font-family: var(--font-display); color: #f5f0e1; margin: 0 0 10px 0; letter-spacing: 2px;">${building.name}</h3>
                    <p style="color: #e0e0e0; line-height: 1.6; margin-bottom: 15px;">${building.description || ''}</p>
                    ${emotionTag ? `<div style="margin-top: 10px; padding: 8px; background: rgba(255, 107, 155, 0.1); border-radius: 4px;">
                        <p style="margin: 0; font-size: 12px; color: #FF6B9B;">${emotionTag}</p>
                    </div>` : ''}
                    ${quiz && !Storage.userProgress.completedQuizzes?.includes(quiz.id) ? '<button id="startQuizBtn" style="margin-top: 15px; background: linear-gradient(135deg, var(--art-deco-gold), var(--art-deco-gold-light));">📝 参与答题</button>' : ''}
                    <button id="closeBuildingInfo" style="margin-top: 10px;">关闭</button>
                </div>
            `;
        }

        popup.innerHTML = content;
        document.body.appendChild(popup);

        const puzzlePlayBtn = document.getElementById('puzzlePlayBtn');
        if (puzzlePlayBtn && displayEvent) {
            let puzzleAudio = null;
            const audioFile = this.getAudioFileByPattern(displayEvent.audioPattern);
            puzzlePlayBtn.onclick = () => {
                if (puzzleAudio) { puzzleAudio.pause(); puzzleAudio.currentTime = 0; }
                puzzleAudio = new Audio(audioFile);
                puzzleAudio.volume = 0.8;
                puzzleAudio.play().catch(() => {});
                document.getElementById('puzzleGuessArea').style.display = 'block';
                puzzlePlayBtn.textContent = '▶ 重新播放';
            };
        }
        const puzzleRevealBtn = document.getElementById('puzzleRevealBtn');
        if (puzzleRevealBtn) {
            puzzleRevealBtn.onclick = () => {
                const ans = document.getElementById('puzzleAnswer');
                ans.style.display = 'inline';
                puzzleRevealBtn.style.display = 'none';
            };
        }

        const startQuizBtn = document.getElementById('startQuizBtn');
        if (startQuizBtn) {
            startQuizBtn.onclick = () => {
                popup.innerHTML = this.renderQuizContent(quiz, building);
                this.bindQuizEvents(quiz, building, popup);
            };
        }

        document.getElementById('closeBuildingInfo').onclick = () => {
            popup.remove();
            this.stopAreaAmbientSound();
        };

        popup.onclick = (e) => {
            if (e.target === popup) {
                popup.remove();
                this.stopAreaAmbientSound();
            }
        };

        this.markBuildingExplored(buildingId);
    },

    renderQuizContent(quiz, building) {
        return `
            <div style="text-align: center;">
                <h3 style="font-family: var(--font-display); color: var(--art-deco-gold); margin: 0 0 20px 0; letter-spacing: 2px;">📝 校史问答</h3>
                <p style="color: #e0e0e0; font-size: 16px; margin-bottom: 20px;">${quiz.question}</p>
                <div id="quizOptions" style="display: flex; flex-direction: column; gap: 10px;">
                    ${quiz.options.map((opt, i) => `
                        <button class="quiz-option" data-index="${i}" style="
                            padding: 12px 20px;
                            background: rgba(212, 175, 55, 0.1);
                            border: 2px solid var(--art-deco-gold);
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            color: #f5f0e1;
                            transition: all 0.3s ease;
                        ">${opt}</button>
                    `).join('')}
                </div>
                <div id="quizResult" style="margin-top: 20px; display: none;"></div>
            </div>
        `;
    },

    bindQuizEvents(quiz, building, popup) {
        const options = popup.querySelectorAll('.quiz-option');
        const resultDiv = popup.querySelector('#quizResult');

        options.forEach(opt => {
            opt.onclick = () => {
                const selectedIndex = parseInt(opt.dataset.index);
                const isCorrect = selectedIndex === quiz.correctAnswer;

                options.forEach(o => {
                    o.disabled = true;
                    o.style.cursor = 'default';
                    if (parseInt(o.dataset.index) === quiz.correctAnswer) {
                        o.style.background = 'rgba(46, 204, 113, 0.3)';
                        o.style.borderColor = '#2ECC71';
                    } else if (o === opt && !isCorrect) {
                        o.style.background = 'rgba(231, 76, 60, 0.3)';
                        o.style.borderColor = '#E74C3C';
                    }
                });

                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `
                    <div style="padding: 15px; border-radius: 8px; background: ${isCorrect ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'};">
                        <p style="margin: 0 0 10px 0; font-size: 18px; color: ${isCorrect ? '#2ECC71' : '#E74C3C'};">
                            ${isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #e0e0e0;">${quiz.explanation}</p>
                    </div>
                    <button id="closeQuizBtn" style="margin-top: 15px;">继续探索</button>
                `;

                if (!Storage.userProgress.completedQuizzes) {
                    Storage.userProgress.completedQuizzes = [];
                }
                if (!Storage.userProgress.completedQuizzes.includes(quiz.id)) {
                    Storage.userProgress.completedQuizzes.push(quiz.id);
                    Storage.saveUserProgress();
                }

                document.getElementById('closeQuizBtn').onclick = () => {
                    popup.remove();
                    this.stopAreaAmbientSound();
                };
            };
        });
    },

    getBuildingEmotionTag(buildingId) {
        const emotionTags = {
            'qizhen_lake': '大家觉得这里最让人：治愈 😍',
            'qiushi_auditorium': '大家觉得这里最让人：庄严 📌',
            'zju_library': '大家觉得这里最让人：专注 🎓',
            'zju_gymnasium': '大家觉得这里最让人：热血 ⚽',
            'old_zju_gate': '大家觉得这里最让人：怀念 📌',
            'nanhua_garden': '大家觉得这里最让人：宁静 🎭',
            'chengjun_yuan': '大家觉得这里最让人：敬畏 🎓',
            'zju_crescent_building': '大家觉得这里最让人：好奇 🤔',
            'small_theater': '大家觉得这里最让人：文艺 🎭',
            'south_gate': '大家觉得这里最让人：期待 🎓'
        };
        return emotionTags[buildingId] || null;
    },

    playAreaAmbientSound(buildingId, building) {
        const areaSounds = {
            'qizhen_lake': '天鹅叫声.mp3',
            'gangwan': '蛙叫（纯净）.mp3',
            'qingxi': '溪水声.mp3',
            'zju_library': '翻书声.mp3',
            'chengjun_yuan': '古琴声.mp3',
            'west_teaching': '上课铃声.mp3',
            'east_teaching': '上课铃声.mp3',
            'nanhua_garden': '鸟鸣声.mp3',
            'chengyue_area': '月光曲.mp3',
            'zju_gymnasium': '哨声.mp3',
            'basketball_gym': '篮球弹跳声.mp3'
        };

        const soundFile = areaSounds[buildingId];
        if (soundFile && this.state.ambientAudioEnabled !== false) {
            try {
                const audioUrl = `/default_audio/${soundFile}`;
                if (this.state.ambientAudio) this.state.ambientAudio.pause();
                this.state.ambientAudio = new Audio(audioUrl);
                this.state.ambientAudio.volume = 0.3;
                this.state.ambientAudio.loop = true;
                this.state.ambientAudio.play().catch(e => {
                    console.log('环境音播放需要用户交互:', e);
                });
            } catch (e) {
                console.log('环境音加载失败:', e);
            }
        }
    },

    stopAreaAmbientSound() {
        if (this.state.ambientAudio) {
            this.state.ambientAudio.pause();
            this.state.ambientAudio = null;
        }
    },

    markBuildingExplored(buildingId) {
        if (!Storage.userProgress.exploredBuildings) {
            Storage.userProgress.exploredBuildings = [];
        }
        if (!Storage.userProgress.exploredBuildings.includes(buildingId)) {
            Storage.userProgress.exploredBuildings.push(buildingId);
            Storage.saveUserProgress();
            this.updateExplorationProgress();
        }
    },

    saveMarkers() {
        const markersData = [];
        this.state.markers.forEach((audioData, marker) => {
            if (marker.getLatLng && marker.markerData) {
                markersData.push({
                    lat: marker.getLatLng().lat,
                    lng: marker.getLatLng().lng,
                    type: marker.markerData.type || 'memory',
                    audioData: audioData
                });
            }
        });

        try {
            localStorage.setItem('mapMarkers', JSON.stringify(markersData));
        } catch (e) {
            console.error('Failed to save markers:', e);
            alert('保存标记失败，可能是存储空间不足');
        }
    },

    loadMarkers() {
        try {
            const savedMarkers = localStorage.getItem('mapMarkers');
            if (savedMarkers) {
                const markersData = JSON.parse(savedMarkers);
                markersData.forEach(data => {
                    const markerType = Data.markerTypes[data.type] || Data.markerTypes.memory;

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

                    const marker = L.marker([data.lat, data.lng], {
                        icon: icon,
                        draggable: true
                    }).addTo(this.state.map);

                    marker.markerData = {
                        id: data.id || Date.now(),
                        type: data.type || 'memory',
                        audioData: data.audioData || null
                    };

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

                    marker.on('dragend', (e) => {
                        const newPosition = e.target.getLatLng();
                        marker.position = newPosition;
                        this.saveMarkers();
                    });

                    this.state.markers.set(marker, data.audioData || null);
                    this.state.markerCount++;
                });
            }
        } catch (error) {
            console.error('Failed to load markers:', error);
        }
    },

    parseShareLink() {
        const params = new URLSearchParams(window.location.search);
        const lat = params.get('lat');
        const lng = params.get('lng');
        const audioUrl = params.get('audio');

        if (lat && lng) {
            this.state.map.setView([parseFloat(lat), parseFloat(lng)], 1);
            if (audioUrl) {
                setTimeout(() => {
                    const tempButton = {
                        textContent: '',
                        dataset: { playing: 'false' },
                        style: {}
                    };
                    this.playAudio(audioUrl, tempButton, false);
                }, 1000);
            }
        }
    },
});
