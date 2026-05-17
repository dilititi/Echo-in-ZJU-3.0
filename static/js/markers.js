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
            border: 2px solid var(--gold);
            padding: 30px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 6000;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        `;

        const emotionTag = this.getBuildingEmotionTag(buildingId);
        const hiddenBadge = (showPuzzle && displayEvent && displayEvent.hidden)
            ? '<span style="background: linear-gradient(135deg, #d4af37, #f4d35e); color: #1b263b; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin-left: 8px;">🎭 隐藏彩蛋</span>'
            : '';
        const audioFile = (showPuzzle && displayEvent) ? this.getAudioFileByPattern(displayEvent.audioPattern) : '';
        const audioAnswerName = audioFile
            ? audioFile.split('/').pop().replace(/\.[^.]+$/, '').replace(/^default_/, '')
            : '';
        const titleText = (showPuzzle && displayEvent) ? displayEvent.title : building.name;

        const puzzleBlock = (showPuzzle && displayEvent) ? `
            <div style="margin-top: 15px; padding: 12px; background: rgba(181, 87, 59, 0.08); border-left: 3px solid var(--gold); border-radius: 0 6px 6px 0;">
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #f4d35e;">🎵 声音谜题（不可删除）</p>
                <button id="puzzlePlayBtn" style="
                    background: linear-gradient(135deg, #1a6b3a, #2d9e5f);
                    color: #fff; border: none; padding: 8px 20px;
                    border-radius: 4px; cursor: pointer; font-size: 14px; margin-bottom: 10px;
                ">▶ 播放音频</button>
                <div id="puzzleGuessArea" style="display: none; margin-top: 10px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #e0e0e0;">你猜这是什么声音？</p>
                    <input id="puzzleGuessInput" type="text" placeholder="输入你的猜测..." style="
                        width: 100%; box-sizing: border-box; padding: 7px 10px;
                        border-radius: 4px; border: 1px solid var(--gold);
                        background: rgba(255,255,255,0.08); color: #f5f0e1;
                        font-size: 13px; margin-bottom: 8px;">
                    <div style="display: flex; gap: 8px; justify-content: center; align-items: center; margin-top: 4px;">
                        <button id="puzzleRevealBtn" style="
                            background: rgba(212, 175, 55, 0.15); color: #f4d35e;
                            border: 1px solid var(--gold); padding: 6px 14px;
                            border-radius: 4px; cursor: pointer; font-size: 12px;
                        ">显示答案</button>
                        <span id="puzzleAnswer" style="
                            font-size: 13px; color: rgb(168, 86, 67); font-weight: bold;
                            letter-spacing: 1px; display: none;
                        ">答案：${audioAnswerName}</span>
                    </div>
                </div>
            </div>` : '';

        const descriptionText = (showPuzzle && displayEvent) ? displayEvent.description : (building.description || '');
        const descriptionBlock = descriptionText
            ? `<div style="color: #e0e0e0; line-height: 1.8; margin: 15px 0; text-align: left; white-space: pre-line;">${this.escapeHtml(descriptionText)}</div>`
            : '';

        const communityBlock = `
            <div class="fj-bldg-voices" data-building-id="${buildingId}" style="margin: 12px 0 16px;">
                <div class="fj-bldg-voices-head" data-state="loading">加载社区声音中…</div>
                <div class="fj-bldg-voices-list"></div>
                <button class="fj-bldg-voices-cta" id="addBuildingVoiceBtn">+ 留下你的声音</button>
            </div>`;

        popup.innerHTML = `
            <div style="text-align: center;">
                <img src="${building.image}" style="max-width: 100%; max-height: 200px; border: 1px solid var(--gold); margin-bottom: 15px;">
                <h3 style="font-family: var(--font-display); color: #f5f0e1; margin: 0 0 10px 0; letter-spacing: 2px;">${this.escapeHtml(titleText)}${hiddenBadge}</h3>
                ${communityBlock}
                ${puzzleBlock}
                ${descriptionBlock}
                ${emotionTag ? `<div style="margin-top: 10px; padding: 8px; background: rgba(255, 107, 155, 0.1); border-radius: 4px;">
                    <p style="margin: 0; font-size: 12px; color: #FF6B9B;">${this.escapeHtml(emotionTag)}</p>
                </div>` : ''}
                ${quiz && !Storage.userProgress.completedQuizzes?.includes(quiz.id) ? '<button id="startQuizBtn" style="margin-top: 15px; background: linear-gradient(135deg, var(--gold), var(--gold-light));">📝 参与答题</button>' : ''}
                <button id="closeBuildingInfo" style="margin-top: 15px;">关闭</button>
            </div>
        `;
        document.body.appendChild(popup);

        const addVoiceBtn = popup.querySelector('#addBuildingVoiceBtn');
        if (addVoiceBtn) {
            addVoiceBtn.onclick = () => {
                if (typeof window.openSocialModal === 'function') {
                    window.openSocialModal(buildingId);
                }
            };
        }

        this.loadBuildingCommunity(popup, buildingId);

        const puzzlePlayBtn = document.getElementById('puzzlePlayBtn');
        if (puzzlePlayBtn && displayEvent) {
            let puzzleAudio = null;
            const audioFile = this.getAudioFileByPattern(displayEvent.audioPattern);
            puzzlePlayBtn.onclick = () => {
                if (!audioFile) return;
                if (puzzleAudio) { puzzleAudio.pause(); puzzleAudio.currentTime = 0; }
                puzzleAudio = new Audio(Config.resolveUrl(audioFile));
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
                <h3 style="font-family: var(--font-display); color: var(--gold); margin: 0 0 20px 0; letter-spacing: 2px;">📝 校史问答</h3>
                <p style="color: #e0e0e0; font-size: 16px; margin-bottom: 20px;">${quiz.question}</p>
                <div id="quizOptions" style="display: flex; flex-direction: column; gap: 10px;">
                    ${quiz.options.map((opt, i) => `
                        <button class="quiz-option" data-index="${i}" style="
                            padding: 12px 20px;
                            background: rgba(212, 175, 55, 0.1);
                            border: 2px solid var(--gold);
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

                // solvedBuildings records buildings whose puzzle was attempted (right or wrong);
                // the illustrated reveal triggers on attempt, not on success.
                if (!Storage.userProgress.solvedBuildings) {
                    Storage.userProgress.solvedBuildings = [];
                }
                let newlySolved = false;
                if (quiz.buildingId && !Storage.userProgress.solvedBuildings.includes(quiz.buildingId)) {
                    Storage.userProgress.solvedBuildings.push(quiz.buildingId);
                    Storage.saveUserProgress();
                    newlySolved = true;
                }

                if (window.AnimationSystem && quiz.buildingId) {
                    window.AnimationSystem.playAt(quiz.buildingId, { result: isCorrect ? 'correct' : 'wrong' });
                }
                if (newlySolved && window.IllustratedLayer && window.IllustratedLayer.render) {
                    window.IllustratedLayer.render();
                }

                document.getElementById('closeQuizBtn').onclick = () => {
                    popup.remove();
                    this.stopAreaAmbientSound();
                };
            };
        });
    },

    escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
            { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
        ));
    },

    loadBuildingCommunity(popup, buildingId) {
        const wrap = popup.querySelector('.fj-bldg-voices');
        if (!wrap) return;
        const head = wrap.querySelector('.fj-bldg-voices-head');
        const list = wrap.querySelector('.fj-bldg-voices-list');

        const renderEmpty = () => {
            head.dataset.state = 'empty';
            head.textContent = '还没有人在这里留下声音 · 你来当第一个';
            list.innerHTML = '';
        };

        if (!(typeof Storage !== 'undefined' && Storage.loadServerMessages)) {
            renderEmpty();
            return;
        }

        Storage.loadServerMessages(buildingId, 3).then(msgs => {
            const stats = (Storage.serverCache && Storage.serverCache.stats && Storage.serverCache.stats[buildingId])
                || null;
            const msgCount = stats ? stats.messages : msgs.length;
            const recCount = stats ? stats.recordings : msgs.filter(m => m.audio_key).length;

            if (!msgs.length && !msgCount) {
                renderEmpty();
                return;
            }

            head.dataset.state = 'ready';
            const parts = [];
            if (recCount) parts.push(`${recCount} 段录音`);
            if (msgCount) parts.push(`${msgCount} 条留言`);
            head.textContent = '★ ' + (parts.join(' · ') || '声音') + '留在这里';

            list.innerHTML = msgs.slice(0, 3).map(m => {
                const ts = m.timestamp ? new Date(m.timestamp).toLocaleDateString() : '';
                return `<div class="fj-bldg-voice-card">
                    <div class="fj-bldg-voice-text">"${this.escapeHtml(m.message)}"</div>
                    <div class="fj-bldg-voice-meta">— ${this.escapeHtml(m.nickname || '探索者')} ${this.escapeHtml(ts)}</div>
                </div>`;
            }).join('');
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
                const audioUrl = Config.resolveUrl(`/default_audio/${soundFile}`);
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
        if (this.refreshHeaderStats) this.refreshHeaderStats();
    },

    loadMarkers() {
        try {
            const savedMarkers = localStorage.getItem('mapMarkers');
            if (savedMarkers) {
                const markersData = JSON.parse(savedMarkers);
                markersData.forEach(data => {
                    const markerType = Data.markerTypes[data.type] || Data.markerTypes.memory;

                    const MARKER_SIZE = 36;
                const icon = L.divIcon({
                        className: 'user-marker',
                        html: `<div style="
                            width: ${MARKER_SIZE}px;
                            height: ${MARKER_SIZE}px;
                            background: ${markerType.color};
                            border: 2px solid white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: ${MARKER_SIZE / 2}px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            cursor: pointer;
                        ">${markerType.icon}</div>`,
                        iconSize: [MARKER_SIZE, MARKER_SIZE],
                        iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2]
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
