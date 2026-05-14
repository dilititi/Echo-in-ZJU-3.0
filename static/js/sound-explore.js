// sound-explore.js — 声音游记、声音探索模式
Object.assign(App, {

    generateSoundJourney() {
        const userMarkers = Storage.loadUserMarkers();
        if (!userMarkers || userMarkers.length === 0) {
            alert('您还没有添加任何音频标记，请先添加一些标记后再生成声音游记。');
            return;
        }

        const sortedMarkers = [...userMarkers].sort((a, b) =>
            new Date(a.createdAt) - new Date(b.createdAt)
        );

        const popup = document.createElement('div');
        popup.id = 'sound-journey-popup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, var(--art-deco-bg-card) 0%, #f0e6d3 100%);
            border: 2px solid var(--art-deco-gold);
            padding: 30px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 6000;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        `;

        const journeyItems = sortedMarkers.map((marker, index) => {
            const markerType = Data.markerTypes[marker.type] || { name: '未知', emoji: '📍' };
            return `
                <div style="display: flex; align-items: center; padding: 10px; background: rgba(212, 175, 55, 0.05); border-radius: 8px; margin-bottom: 10px;">
                    <span style="font-size: 24px; margin-right: 15px;">${markerType.emoji}</span>
                    <div style="flex: 1;">
                        <p style="margin: 0; font-weight: bold; color: var(--art-deco-text-dark);">${marker.name || `标记 ${index + 1}`}</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: var(--art-deco-accent);">${new Date(marker.createdAt).toLocaleString()}</p>
                    </div>
                    <button class="journey-play-btn" data-url="${marker.audioUrl}" style="
                        padding: 8px 15px;
                        background: var(--art-deco-gold);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        color: white;
                    ">▶ 播放</button>
                </div>
            `;
        }).join('');

        popup.innerHTML = `
            <div style="text-align: center;">
                <h2 style="font-family: var(--font-display); color: var(--art-deco-gold); margin: 0 0 20px 0; letter-spacing: 2px;">🎧 我的声音游记</h2>
                <p style="color: var(--art-deco-text-dark); margin-bottom: 20px;">共 ${sortedMarkers.length} 个声音记忆</p>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${journeyItems}
                </div>
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                    <button id="playAllJourney" style="padding: 10px 20px; background: linear-gradient(135deg, var(--art-deco-gold), var(--art-deco-gold-light));">▶ 全部播放</button>
                    <button id="closeJourney" style="padding: 10px 20px;">关闭</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        popup.querySelectorAll('.journey-play-btn').forEach(btn => {
            btn.onclick = () => {
                const url = btn.dataset.url;
                const audio = new Audio(url);
                audio.play();
            };
        });

        document.getElementById('playAllJourney').onclick = () => {
            this.playAllJourneyItems(sortedMarkers);
        };

        document.getElementById('closeJourney').onclick = () => {
            popup.remove();
        };
    },

    playAllJourneyItems(markers) {
        let currentIndex = 0;
        const playNext = () => {
            if (currentIndex >= markers.length) {
                alert('声音游记播放完成！');
                return;
            }
            const marker = markers[currentIndex];
            const audio = new Audio(marker.audioUrl);
            audio.onended = () => { currentIndex++; playNext(); };
            audio.play();
        };
        playNext();
    },

    switchExploreMode(mode) {
        this.state.currentExploreMode = mode;
        localStorage.setItem('exploreMode', mode);

        if (mode === 'normal') {
            this.hideSoundHotspots();
            this.showAllBuildingMarkers();
            this.showProgressiveHint('welcome');
        } else if (mode === 'sound') {
            this.hideAllBuildingMarkers();
            this.showUnlockedBuildingMarkers();
            this.showSoundExploreGuide();
            this.showProgressiveHint('soundMode');
        }
    },

    showSoundExploreGuide() {
        const hasSeenGuide = localStorage.getItem('soundExploreGuideSeen');
        const guideEl = document.getElementById('soundFirstGuide');

        if (guideEl && !hasSeenGuide) {
            guideEl.style.display = 'block';
            const closeBtn = document.getElementById('closeSoundFirstGuide');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    guideEl.style.display = 'none';
                    localStorage.setItem('soundExploreGuideSeen', 'true');
                    this.showSoundHotspots();
                };
            }
        } else if (guideEl) {
            guideEl.style.display = 'none';
            this.showSoundHotspots();
        }

        const unlockedCount = this.state.soundExploreUnlockedBuildings.size;
        const totalBuildings = Object.keys(Data.buildings).length;

        const progressHint = document.createElement('div');
        progressHint.id = 'sound-progress-hint';
        progressHint.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, var(--art-deco-bg-card) 0%, #f0e6d3 100%);
            border: 2px solid var(--art-deco-gold);
            padding: 10px 15px;
            border-radius: 8px;
            z-index: 5000;
            font-size: 14px;
            color: var(--art-deco-text-dark);
        `;
        progressHint.innerHTML = `🎧 声音探索 | 已解锁: <strong>${unlockedCount}</strong>/${totalBuildings}`;
        document.body.appendChild(progressHint);
    },

    showSoundHotspots() {
        if (this.state.currentExploreMode !== 'sound') return;

        const hotspotContainer = document.getElementById('sound-hotspots-container');
        if (hotspotContainer) hotspotContainer.remove();

        const container = document.createElement('div');
        container.id = 'sound-hotspots-container';
        container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 400;
        `;

        const mapContainer = document.getElementById('map');
        if (mapContainer) mapContainer.appendChild(container);

        Object.entries(Data.buildings).forEach(([buildingId, building]) => {
            if (building.position && !this.state.soundExploreUnlockedBuildings.has(buildingId)) {
                const hotspot = document.createElement('div');
                hotspot.className = 'sound-hotspot';
                hotspot.dataset.building = buildingId;

                const point = this.state.map.latLngToContainerPoint([building.position[0], building.position[1]]);

                hotspot.style.cssText = `
                    position: absolute;
                    left: ${point.x - 20}px;
                    top: ${point.y - 20}px;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(0, 123, 168, 0.4) 0%, rgba(0, 123, 168, 0.1) 70%, transparent 100%);
                    cursor: pointer;
                    pointer-events: auto;
                    animation: hotspotPulse 2s ease-in-out infinite;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                hotspot.innerHTML = `<span style="color: #0078A8; font-size: 16px;">🔊</span>`;
                hotspot.title = '点击播放音频';

                hotspot.addEventListener('mouseenter', () => {
                    hotspot.style.background = 'radial-gradient(circle, rgba(0, 123, 168, 0.6) 0%, rgba(0, 123, 168, 0.2) 70%, transparent 100%)';
                    hotspot.style.transform = 'scale(1.2)';
                });

                hotspot.addEventListener('mouseleave', () => {
                    hotspot.style.background = 'radial-gradient(circle, rgba(0, 123, 168, 0.4) 0%, rgba(0, 123, 168, 0.1) 70%, transparent 100%)';
                    hotspot.style.transform = 'scale(1)';
                });

                container.appendChild(hotspot);
            }
        });

        container.addEventListener('click', e => {
            const hotspot = e.target.closest('[data-building]');
            if (!hotspot) return;
            e.stopPropagation();
            const id = hotspot.dataset.building;
            this.startSoundExploreChallenge({ id, building: Data.buildings[id] });
        });

        const MAP_EVENTS = 'zoomend moveend';
        this._hotspotMapEvents = MAP_EVENTS;
        this._hotspotPositionHandler = () => this.updateHotspotPositions();
        this.state.map.on(MAP_EVENTS, this._hotspotPositionHandler);

        if (!document.getElementById('hotspot-animation-style')) {
            const style = document.createElement('style');
            style.id = 'hotspot-animation-style';
            style.textContent = `
                @keyframes hotspotPulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
    },

    updateHotspotPositions() {
        const container = document.getElementById('sound-hotspots-container');
        if (!container) return;

        container.querySelectorAll('.sound-hotspot').forEach(hotspot => {
            const buildingId = hotspot.dataset.building;
            const building = Data.buildings[buildingId];
            if (building && building.position) {
                const point = this.state.map.latLngToContainerPoint([building.position[0], building.position[1]]);
                hotspot.style.left = `${point.x - 20}px`;
                hotspot.style.top = `${point.y - 20}px`;
            }
        });
    },

    hideSoundHotspots() {
        const container = document.getElementById('sound-hotspots-container');
        if (container) container.remove();
        const progressHint = document.getElementById('sound-progress-hint');
        if (progressHint) progressHint.remove();
        if (this._hotspotPositionHandler) {
            this.state.map.off(this._hotspotMapEvents, this._hotspotPositionHandler);
            this._hotspotPositionHandler = null;
            this._hotspotMapEvents = null;
        }
    },

    updateSoundProgressHint() {
        const progressHint = document.getElementById('sound-progress-hint');
        if (progressHint) {
            const unlockedCount = this.state.soundExploreUnlockedBuildings.size;
            const totalBuildings = Object.keys(Data.buildings).length;
            progressHint.innerHTML = `🎧 声音探索 | 已解锁: <strong>${unlockedCount}</strong>/${totalBuildings}`;
        }
    },

    hideAllBuildingMarkers() {
        Object.values(this.state.buildingMarkers || {}).forEach(marker => {
            if (marker && this.state.map) this.state.map.removeLayer(marker);
        });
        this.state.buildingMarkers = {};
    },

    showAllBuildingMarkers() {
        this.hideAllBuildingMarkers();
        Object.entries(Data.buildings).forEach(([buildingId, building]) => {
            if (building && building.position) {
                this.createBuildingMarker(buildingId, building);
            }
        });
    },

    showUnlockedBuildingMarkers() {
        this.state.soundExploreUnlockedBuildings.forEach(buildingId => {
            const building = Data.buildings[buildingId];
            if (building && building.position) {
                this.createBuildingMarker(buildingId, building);
            }
        });
    },

    loadSoundExploreProgress() {
        try {
            const savedMode = localStorage.getItem('exploreMode');
            if (savedMode) this.state.currentExploreMode = savedMode;

            const savedUnlocked = localStorage.getItem('soundExploreUnlocked');
            if (savedUnlocked) {
                this.state.soundExploreUnlockedBuildings = new Set(JSON.parse(savedUnlocked));
            }

            const savedAttempts = localStorage.getItem('soundExploreAttempts');
            if (savedAttempts) {
                this.state.soundExploreAttempts = JSON.parse(savedAttempts);
            }
        } catch (e) {
            console.error('Failed to load sound explore progress:', e);
        }
    },

    saveSoundExploreProgress() {
        try {
            localStorage.setItem('exploreMode', this.state.currentExploreMode);
            localStorage.setItem('soundExploreUnlocked', JSON.stringify([...this.state.soundExploreUnlockedBuildings]));
            localStorage.setItem('soundExploreAttempts', JSON.stringify(this.state.soundExploreAttempts));
        } catch (e) {
            console.error('Failed to save sound explore progress:', e);
        }
    },

    handleSoundExploreClick(e) {
        const clickPos = e.latlng;
        const nearestBuilding = this.findNearestBuilding(clickPos);

        if (nearestBuilding && !this.state.soundExploreUnlockedBuildings.has(nearestBuilding.id)) {
            this.startSoundExploreChallenge(nearestBuilding);
        } else if (nearestBuilding && this.state.soundExploreUnlockedBuildings.has(nearestBuilding.id)) {
            this.showBuildingInfo(nearestBuilding.id, nearestBuilding.building);
        }
    },

    findNearestBuilding(clickPos) {
        let nearest = null;
        let minDistance = Infinity;

        Object.entries(Data.buildings).forEach(([buildingId, building]) => {
            if (building.position) {
                const distance = Math.sqrt(
                    Math.pow(clickPos.lat - building.position[0], 2) +
                    Math.pow(clickPos.lng - building.position[1], 2)
                );
                if (distance < minDistance && distance < 150) {
                    minDistance = distance;
                    nearest = { id: buildingId, building: building, distance: distance };
                }
            }
        });

        return nearest;
    },

    startSoundExploreChallenge(buildingInfo) {
        this.state.soundExploreCurrentBuilding = buildingInfo;

        const puzzleEventId = buildingInfo.id + '_puzzle';
        const puzzleEvent = Data.puzzleEvents[puzzleEventId];

        const modal = document.getElementById('soundExploreModal');
        const hintEl = document.getElementById('soundExploreHint');
        const audioPatternEl = document.getElementById('soundAudioPattern');
        const inputEl = document.getElementById('soundExploreInput');
        const feedbackEl = document.getElementById('soundExploreFeedback');

        if (modal && hintEl && inputEl) {
            modal.style.display = 'flex';
            hintEl.textContent = '正在播放音频，请仔细聆听...';
            audioPatternEl.textContent = puzzleEvent ? puzzleEvent.audioPattern : '环境音';
            inputEl.value = '';
            feedbackEl.innerHTML = '';
            this.playSoundExploreAudio(buildingInfo.id);
        }
    },

    playSoundExploreAudio(buildingId) {
        const puzzleEventId = buildingId + '_puzzle';
        const puzzleEvent = Data.puzzleEvents[puzzleEventId];

        if (puzzleEvent && puzzleEvent.audioPattern) {
            const audioFile = this.getAudioFileByPattern(puzzleEvent.audioPattern);
            if (audioFile) {
                const audio = new Audio(audioFile);
                this.state.soundExploreCurrentAudio = audio;
                audio.volume = 0.7;

                const hintEl = document.getElementById('soundExploreHint');

                audio.play().then(() => {
                    if (hintEl) hintEl.textContent = '正在播放音频，请仔细聆听...';
                }).catch(e => {
                    console.log('Audio autoplay blocked:', e);
                    if (hintEl) hintEl.textContent = '请点击地图任意位置以启用音频播放';
                    this.showAudioPermissionHint();

                    const mapContainer = document.getElementById('map');
                    if (mapContainer) {
                        const enableAudio = () => {
                            audio.play().then(() => {
                                this.hideAudioPermissionHint();
                                if (hintEl) hintEl.textContent = '正在播放音频，请仔细聆听...';
                            }).catch(err => console.warn('Audio play failed:', err));
                            mapContainer.removeEventListener('click', enableAudio);
                        };
                        mapContainer.addEventListener('click', enableAudio, { once: true });
                    }
                });
            }
        }
    },

    showAudioPermissionHint() {
        const hint = document.getElementById('audioPermissionHint');
        if (hint) hint.style.display = 'block';
    },

    hideAudioPermissionHint() {
        const hint = document.getElementById('audioPermissionHint');
        if (hint) hint.style.display = 'none';
    },

    getAudioFileByPattern(pattern) {
        const audioMap = {
            // data.js 中实际使用的 audioPattern 值（精确匹配）
            '木板走路声': '/default_audio/木板走路声.mp3',
            '踩石子': '/default_audio/踩石子.mp3',
            '食堂后堂声': '/default_audio/食堂后堂声.mp3',
            '走楼梯': '/default_audio/走楼梯.mp3',
            '翻书声': '/default_audio/翻书声.mp3',
            '蝉鸣': '/default_audio/蝉鸣.mp3',
            '敲键盘': '/default_audio/敲键盘.mp3',
            '踩树叶': '/default_audio/踩树叶.mp3',
            '电梯声': '/default_audio/电梯声.mp3',
            '蛙叫（纯净）': '/default_audio/蛙叫（纯净）.mp3',
            '摇晃水杯': '/default_audio/摇晃水杯.mp3',
            // 保留旧 key（带"声"后缀），兼容其他调用方
            '走路声': '/default_audio/木板走路声.mp3',
            '踩石子声': '/default_audio/踩石子.mp3',
            '食堂声': '/default_audio/食堂后堂声.mp3',
            '走楼梯声': '/default_audio/走楼梯.mp3',
            '踩木地板声': '/default_audio/木板走路声.mp3',
            '蝉鸣声': '/default_audio/蝉鸣.mp3',
            '敲键盘声': '/default_audio/敲键盘.mp3',
            '踩树叶声': '/default_audio/踩树叶.mp3',
            '蛙鸣声': '/default_audio/蛙叫（纯净）.mp3',
            '摇晃水杯声': '/default_audio/摇晃水杯.mp3',
            '天鹅叫声': '/default_audio/天鹅叫声.mp3',
            '瀑布声': '/default_audio/瀑布声.mp3',
        };
        return audioMap[pattern] || null;
    },

    initSoundExploreModalEvents() {
        const modal = document.getElementById('soundExploreModal');
        const closeBtn = document.getElementById('closeSoundExploreModal');
        const replayBtn = document.getElementById('replaySoundBtn');
        const submitBtn = document.getElementById('submitSoundExploreBtn');
        const inputEl = document.getElementById('soundExploreInput');

        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
                if (this.state.soundExploreCurrentAudio) {
                    this.state.soundExploreCurrentAudio.pause();
                    this.state.soundExploreCurrentAudio = null;
                }
            };
        }

        if (replayBtn) {
            replayBtn.onclick = () => {
                if (this.state.soundExploreCurrentBuilding) {
                    this.playSoundExploreAudio(this.state.soundExploreCurrentBuilding.id);
                }
            };
        }

        if (submitBtn) {
            submitBtn.onclick = () => { this.submitSoundExploreAnswer(); };
        }

        if (inputEl) {
            inputEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.submitSoundExploreAnswer();
            });
        }
    },

    submitSoundExploreAnswer() {
        const inputEl = document.getElementById('soundExploreInput');
        const feedbackEl = document.getElementById('soundExploreFeedback');

        if (!inputEl || !feedbackEl || !this.state.soundExploreCurrentBuilding) return;

        const userInput = inputEl.value.trim().toLowerCase();
        const buildingName = this.state.soundExploreCurrentBuilding.building.name.toLowerCase();
        const buildingId = this.state.soundExploreCurrentBuilding.id;

        if (!userInput) {
            feedbackEl.innerHTML = '<span style="color: #E74C3C;">请输入建筑名称</span>';
            return;
        }

        const isCorrect = buildingName.includes(userInput) || userInput.includes(buildingName.replace(/[（）()]/g, '').split(/[（(]/)[0]);

        if (isCorrect) {
            feedbackEl.innerHTML = '<span style="color: #2ECC71; font-size: 18px;">✓ 回答正确！</span>';

            this.state.soundExploreUnlockedBuildings.add(buildingId);
            this.saveSoundExploreProgress();

            this.createBuildingMarker(buildingId, this.state.soundExploreCurrentBuilding.building);
            this.markBuildingExplored(buildingId);
            this.updateSoundProgressHint();
            this.showSoundHotspots();

            setTimeout(() => {
                const modal = document.getElementById('soundExploreModal');
                if (modal) modal.style.display = 'none';

                this.showUnlockSuccessPopup(this.state.soundExploreCurrentBuilding.building);

                if (this.state.soundExploreCurrentAudio) {
                    this.state.soundExploreCurrentAudio.pause();
                    this.state.soundExploreCurrentAudio = null;
                }
            }, 1000);
        } else {
            const attempts = (this.state.soundExploreAttempts[buildingId] || 0) + 1;
            this.state.soundExploreAttempts[buildingId] = attempts;
            this.saveSoundExploreProgress();

            feedbackEl.innerHTML = `<span style="color: #E74C3C;">✗ 再想想看？可以点击"重听音频"</span>`;
            inputEl.value = '';
            inputEl.focus();
        }
    },

    showUnlockSuccessPopup(building) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, var(--art-deco-bg-card) 0%, #f0e6d3 100%);
            border: 3px solid var(--art-deco-gold);
            padding: 30px 40px;
            border-radius: 15px;
            z-index: 7000;
            text-align: center;
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
            animation: unlockPop 0.5s ease-out;
        `;
        popup.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
            <h2 style="font-family: var(--font-display); color: var(--art-deco-gold); margin: 0 0 10px 0; letter-spacing: 2px;">地标解锁成功！</h2>
            <h3 style="font-family: var(--font-display); color: var(--art-deco-text-dark); margin: 0 0 10px 0;">${building.name}</h3>
            <p style="color: var(--art-deco-text-dark); margin: 0;">该地标已在地图上显示</p>
        `;
        document.body.appendChild(popup);

        if (!document.getElementById('unlock-animation-style')) {
            const style = document.createElement('style');
            style.id = 'unlock-animation-style';
            style.textContent = `
                @keyframes unlockPop {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            popup.style.animation = 'unlockPop 0.3s ease-in reverse';
            setTimeout(() => popup.remove(), 300);
        }, 2000);
    },
});
