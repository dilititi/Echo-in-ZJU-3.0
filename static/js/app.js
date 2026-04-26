const App = {
    state: {
        map: null,
        markers: new Map(),
        selectedIcon: null,
        selectedAudio: null,
        currentAudio: null,
        isPlaying: false,
        currentPlayButton: null,
        mediaRecorder: null,
        audioChunks: [],
        riddleCounter: 0,
        defaultAudioMarkers: [],
        markerCount: 0,
        isUpdatingAudioList: false,
        audioPool: new Map(),
        lastMousePosition: null,
        selectedMarker: null,
        audioListCache: null,
        audioListCacheTime: 0,
        temporaryIcon: null,
        mapInitializing: true,
        buildingMarkers: {},
        level1Completed: false,
        level5Completed: false,
        allowLevel1Trigger: false,
        allowShowLevelInfo: false,
        allowCompleteLevel: false,
        level4AudioSelected: false,
        level4MarkerPlaced: false,
        mapLayers: new Map(),
        unlockedLayers: new Set(),
        layerConfig: {},
        currentExploreMode: 'normal',
        soundExploreCurrentBuilding: null,
        soundExploreCurrentAudio: null,
        soundExploreUnlockedBuildings: new Set(),
        soundExploreAttempts: {}
    },

    elements: {},

    init() {
        if (!Storage || !Data || !Config || !Utils) {
            alert('缺少必要的依赖对象，请检查代码');
            return;
        }
        
        this.initElements();
        this.loadUserState();
        
        Storage.initSocialData();
        Data.puzzleEvents = Storage.loadEventReactions(Data.puzzleEvents);
        
        this.parseShareLink();
        this.loadMarkers();
        this.updateAudioList();
        
        this.initMap();
        this.initEventListeners();
        
        this.showAllBuildingMarkers();
        
        const hasVisited = localStorage.getItem('hasVisitedBefore');
        if (!hasVisited) {
            this.showWelcomeOverlay();
        } else {
            this.highlightRecommendedBuildings();
        }
        
        window.addEventListener('beforeunload', () => {
            this.state.audioPool.forEach(audio => audio.pause());
            this.state.audioPool.clear();
        });
    },
    
    showWelcomeOverlay() {
        const overlay = document.getElementById('welcomeOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    },
    
    hideWelcomeOverlay() {
        const overlay = document.getElementById('welcomeOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        localStorage.setItem('hasVisitedBefore', 'true');
        this.state.allowLevel1Trigger = true;
        this.state.allowShowLevelInfo = true;
        this.state.allowCompleteLevel = true;
        this.showLevelInfo(Data.levels.find(l => l.id === Storage.userProgress.currentLevel));
        this.highlightRecommendedBuildings();
    },
    
    highlightRecommendedBuildings() {
        const recommended = ['qizhen_lake', 'qiushi_auditorium', 'zju_library'];
        
        recommended.forEach(buildingId => {
            const marker = this.state.buildingMarkers[buildingId];
            if (marker) {
                const el = marker.getElement();
                if (el) {
                    el.classList.add('recommended-highlight');
                }
            }
        });
        
        const hint = document.getElementById('recommendHint');
        if (hint) {
            hint.style.display = 'block';
            setTimeout(() => {
                hint.style.display = 'none';
            }, 5000);
        }
    },
    
    checkDuoTasks() {
        if (!Storage.userProgress.exploredBuildings) return;
        
        Data.duoTasks.forEach(task => {
            const allExplored = task.buildings.every(b => 
                Storage.userProgress.exploredBuildings.includes(b)
            );
            
            if (allExplored && !Storage.userProgress.completedDuoTasks?.includes(task.id)) {
                if (!Storage.userProgress.completedDuoTasks) {
                    Storage.userProgress.completedDuoTasks = [];
                }
                Storage.userProgress.completedDuoTasks.push(task.id);
                Storage.saveUserProgress();
                
                // 显示任务完成提示
                this.showDuoTaskComplete(task);
            }
        });
    },
    
    showDuoTaskComplete(task) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, var(--art-deco-bg-card) 0%, #f0e6d3 100%);
            border: 3px solid var(--art-deco-gold);
            padding: 30px 40px;
            border-radius: 10px;
            z-index: 7000;
            text-align: center;
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
        `;
        
        popup.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">🤝</div>
            <h2 style="font-family: var(--font-display); color: var(--art-deco-gold); margin: 0 0 10px 0; letter-spacing: 2px;">结伴任务完成！</h2>
            <h3 style="font-family: var(--font-display); color: var(--art-deco-text-dark); margin: 0 0 10px 0;">${task.title}</h3>
            <p style="color: var(--art-deco-text-dark); margin: 0 0 15px 0;">${task.description}</p>
            <div style="padding: 10px; background: rgba(212, 175, 55, 0.1); border-radius: 8px;">
                <p style="margin: 0; color: var(--art-deco-gold);">🎁 奖励：${task.reward}</p>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transition = 'opacity 0.3s ease';
            setTimeout(() => popup.remove(), 300);
        }, 3000);
    },
    
    generateSoundJourney() {
        const userMarkers = Storage.loadUserMarkers();
        if (!userMarkers || userMarkers.length === 0) {
            alert('您还没有添加任何音频标记，请先添加一些标记后再生成声音游记。');
            return;
        }
        
        // 按时间排序
        const sortedMarkers = [...userMarkers].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        // 创建游记弹窗
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
        
        // 绑定播放按钮事件
        popup.querySelectorAll('.journey-play-btn').forEach(btn => {
            btn.onclick = () => {
                const url = btn.dataset.url;
                const audio = new Audio(url);
                audio.play();
            };
        });
        
        // 全部播放
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
            
            audio.onended = () => {
                currentIndex++;
                playNext();
            };
            
            audio.play();
        };
        
        playNext();
    },
    
    initDayNightMode() {
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour >= 18;
        
        this.state.isNightMode = isNight;
        this.applyTheme(isNight ? 'night' : 'day');
        
        // 添加主题切换按钮
        this.addThemeToggleButton();
    },
    
    addThemeToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'themeToggle';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            background: linear-gradient(135deg, var(--art-deco-bg-card) 0%, #f0e6d3 100%);
            border: 2px solid var(--art-deco-gold);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        toggleBtn.innerHTML = this.state.isNightMode ? '🌙' : '☀️';
        toggleBtn.title = this.state.isNightMode ? '切换到日间模式' : '切换到夜间模式';
        
        toggleBtn.onclick = () => {
            this.state.isNightMode = !this.state.isNightMode;
            this.applyTheme(this.state.isNightMode ? 'night' : 'day');
            toggleBtn.innerHTML = this.state.isNightMode ? '🌙' : '☀️';
            toggleBtn.title = this.state.isNightMode ? '切换到日间模式' : '切换到夜间模式';
        };
        
        document.body.appendChild(toggleBtn);
    },
    
    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'night') {
            root.style.setProperty('--art-deco-bg-main', '#1a1a2e');
            root.style.setProperty('--art-deco-bg-card', '#16213e');
            root.style.setProperty('--art-deco-text-dark', '#e0e0e0');
            root.style.setProperty('--art-deco-gold', '#ffd700');
            root.style.setProperty('--art-deco-gold-light', '#ffed4a');
            
            // 夜间模式地图滤镜
            if (this.state.map) {
                const mapContainer = document.getElementById('map');
                if (mapContainer) {
                    mapContainer.style.filter = 'brightness(0.7) saturate(0.8)';
                }
            }
            
            // 建筑标记发光效果
            document.querySelectorAll('.building-marker').forEach(marker => {
                marker.style.boxShadow = '0 0 10px var(--art-deco-gold)';
            });
        } else {
            root.style.setProperty('--art-deco-bg-main', '#f5f0e6');
            root.style.setProperty('--art-deco-bg-card', '#ffffff');
            root.style.setProperty('--art-deco-text-dark', '#1b263b');
            root.style.setProperty('--art-deco-gold', '#d4af37');
            root.style.setProperty('--art-deco-gold-light', '#f4d35e');
            
            // 日间模式地图正常
            if (this.state.map) {
                const mapContainer = document.getElementById('map');
                if (mapContainer) {
                    mapContainer.style.filter = 'none';
                }
            }
            
            // 建筑标记正常效果
            document.querySelectorAll('.building-marker').forEach(marker => {
                marker.style.boxShadow = 'none';
            });
        }
    },

    initElements() {
        this.elements.recordButton = document.getElementById('recordButton');
        this.elements.stopButton = document.getElementById('stopButton');
        this.elements.audioNameInput = document.getElementById('audioName');
        this.elements.recordingStatus = document.getElementById('recordingStatus');
        this.elements.audioFiles = document.getElementById('audioFiles');
        this.elements.defaultAudioFiles = document.getElementById('defaultAudioFiles');
        this.elements.uploadButton = document.getElementById('uploadButton');
        this.elements.uploadAudioNameInput = document.getElementById('uploadAudioName');
        this.elements.audioFileInput = document.getElementById('audioFileInput');
        this.elements.closeModal = document.getElementById('closeModal');
        this.elements.welcomeModal = document.getElementById('welcomeModal');
        this.elements.resetAllButton = document.getElementById('resetAllButton');
        this.elements.resetButton = document.getElementById('resetButton');
        this.elements.audioPanel = document.getElementById('audioPanel');
        this.elements.audioPanelToggle = document.getElementById('audioPanelToggle');
    },

    initMap() {
        this.state.map = L.map('map', {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 3,
            zoomControl: false,
            dragging: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            touchZoom: true
        });

        const bounds = [[0, 0], [1000, 1000]];
        
        this.state.map.fitBounds(bounds);

        document.getElementById('map').style.backgroundColor = '#f5f5f5';
        
        L.rectangle(bounds, {
            color: '#d4af37',
            weight: 3,
            fill: false,
            dashArray: '10, 5'
        }).addTo(this.state.map);
        
        this.state.buildingMarkers = {};
        Storage.loadUserProgress();
        
        this.applyLevelRestrictionsWithoutPopup();
        
        this.state.attributionControl = L.control.attribution({
            prefix: '声音校园 - 第 ' + Storage.userProgress.currentLevel + ' 关'
        }).addTo(this.state.map);
        
        setTimeout(() => {
            this.state.map.invalidateSize();
        }, 200);
        
        this.initMapLayers();
    },

    initMapLayers() {
        const mapBounds = [[0, 0], [1000, 1000]];
        Object.entries(this.state.layerConfig).forEach(([layerId, config]) => {
            try {
                const layer = L.imageOverlay(config.url, mapBounds, {
                    zIndex: config.zIndex,
                    opacity: 0,
                    interactive: false
                });
                layer.addTo(this.state.map);
                this.state.mapLayers.set(layerId, layer);
            } catch (error) {
                console.error(`Failed to create layer ${layerId}:`, error);
            }
        });
        this.loadUnlockedLayers();
    },

    showLayer(layerId) {
        const layer = this.state.mapLayers.get(layerId);
        const config = this.state.layerConfig[layerId];
        if (!layer || !config) return;

        if (this.state.unlockedLayers.has(layerId)) return;

        let opacity = 0;
        const fadeIn = setInterval(() => {
            opacity += 0.05;
            if (opacity >= 1) {
                opacity = 1;
                clearInterval(fadeIn);
            }
            layer.setOpacity(opacity);
        }, 30);

        this.state.unlockedLayers.add(layerId);
        Storage.saveUnlockedLayers(Array.from(this.state.unlockedLayers));
        this.flyToLayerCenter(layerId);
    },

    unlockLayersByLevel(levelId) {
        Object.entries(this.state.layerConfig).forEach(([layerId, config]) => {
            const condition = config.unlockCondition;
            if (condition.type === 'level' && condition.value === levelId && !this.state.unlockedLayers.has(layerId)) {
                this.showLayer(layerId);
            }
        });
    },

    flyToLayerCenter(layerId) {
        const centerMap = {
            base: [500, 500],
            teaching: [300, 300],
            living: [700, 700],
            sports: [200, 800],
            full_detail: [500, 500]
        };
        const center = centerMap[layerId];
        if (center) {
            this.state.map.flyTo(center, 0, { duration: 1.5 });
        }
    },

    loadUnlockedLayers() {
        const saved = Storage.userProgress.unlockedLayers || [];
        this.state.unlockedLayers = new Set(saved);
        saved.forEach(layerId => {
            const layer = this.state.mapLayers.get(layerId);
            if (layer) {
                layer.setOpacity(1);
            }
        });
    },

    loadUserState() {
        const savedState = Storage.loadUserState();
        if (savedState) {
            this.state.selectedType = savedState.selectedType;
            this.state.selectedAudio = savedState.selectedAudio;
            
            if (this.state.selectedType) {
                document.querySelectorAll('.icon-option').forEach(opt => {
                    if (opt.dataset.type === this.state.selectedType) {
                        opt.classList.add('selected');
                    }
                });
            }
        }
    },

    getFetchOptions(method = 'GET', body = null) {
        const options = {
            method: method,
            headers: { 'X-API-Key': Config.apiKey }
        };
        
        if (body && method !== 'GET') {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        
        return options;
    },

    getFormDataOptions(method = 'POST', formData = null) {
        const options = {
            method: method,
            headers: { 'X-API-Key': Config.apiKey }
        };
        
        if (formData && method !== 'GET') {
            options.body = formData;
        }
        
        return options;
    },

    initEventListeners() {
        const iconOptions = document.querySelectorAll('.icon-option');
        iconOptions.forEach(option => {
            option.addEventListener('click', (e) => this.handleIconSelect(e));
        });
        
        this.elements.recordButton.addEventListener('click', () => this.startRecording());
        this.elements.stopButton.addEventListener('click', () => this.stopRecording());
        
        this.state.map.on('mousemove', (e) => {
            this.state.lastMousePosition = e.latlng;
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'n') {
                this.handleKeyPress(e);
            } else if (e.key === 'Backspace') {
                if (this.state.selectedMarker) {
                    this.state.map.removeLayer(this.state.selectedMarker);
                    this.state.markers.delete(this.state.selectedMarker);
                    this.state.selectedMarker = null;
                    this.saveMarkers();
                }
            }
        });
        
        const startExploreBtn = document.getElementById('startExploreBtn');
        if (startExploreBtn) {
            startExploreBtn.addEventListener('click', () => {
                this.hideWelcomeOverlay();
            });
        }
        
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                if (this.elements.welcomeModal) {
                    this.elements.welcomeModal.style.display = 'flex';
                }
            });
        }
        
        const closeHelpModal = document.getElementById('closeHelpModal');
        if (closeHelpModal) {
            closeHelpModal.addEventListener('click', () => {
                if (this.elements.welcomeModal) {
                    this.elements.welcomeModal.style.display = 'none';
                }
            });
        }
        
        if (this.elements.audioPanelToggle) {
            this.elements.audioPanelToggle.addEventListener('click', () => this.toggleAudioPanel());
        }
        
        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', () => {
                if (confirm('确定要清除所有标记吗？')) {
                    this.clearAllMarkers();
                }
            });
        }
    },
    
    clearAllMarkers() {
        this.state.markers.forEach(marker => {
            this.state.map.removeLayer(marker);
        });
        this.state.markers.clear();
        this.state.markerCount = 0;
        this.saveMarkers();
    },

    applyLevelRestrictionsWithoutPopup() {
        const currentLevel = Data.levels.find(l => l.id === Storage.userProgress.currentLevel);
        if (!currentLevel) return;
        
        this.showLevelBuildings(currentLevel);
        this.showLevelElements(currentLevel);
        this.enableLevelMapControls(currentLevel);
        this.updateAttribution();
        
        if (Object.keys(this.state.buildingMarkers).length > 0) {
            const firstBuildingId = Object.keys(this.state.buildingMarkers)[0];
            const firstMarker = this.state.buildingMarkers[firstBuildingId];
            if (firstMarker) {
                this.state.map.setView(firstMarker.getLatLng(), 1);
            }
        }
    },

    showLevelInfo(level) {
        if (!this.state.allowShowLevelInfo) {
            console.log('showLevelInfo() 被拦截（欢迎弹窗未关闭）');
            return;
        }
        
        const existingDiv = document.getElementById('level-info');
        if (existingDiv) existingDiv.remove();
        
        let tips = '';
        if (level.id === 2) {
            tips = '<p style="margin-top: 10px; color: #ff6600; font-weight: bold;">💡 提示：按 N 键在鼠标位置放置标记，Backspace 删除选中标记</p>';
        } else if (level.id === 3) {
            tips = '<p style="margin-top: 10px; color: #ff6600; font-weight: bold;">💡 提示：可以录制或上传音频</p>';
        } else if (level.id === 4) {
            tips = '<p style="margin-top: 10px; color: #ff6600; font-weight: bold;">💡 提示：1. 先在下方选择一个音频 2. 按 N 键在地图上放置标记（自动绑定）</p>';
        } else if (level.id === 5) {
            tips = '<p style="margin-top: 10px; color: #ff6600; font-weight: bold;">💡 提示：点击播放谜题音频解锁故事</p>';
        }
        
        const infoDiv = document.createElement('div');
        infoDiv.id = 'level-info';
        infoDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 15px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 4000;
            text-align: center;
            max-width: 500px;
        `;
        infoDiv.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #0078A8;">第 ${level.id} 关：${level.title}</h3>
            <p style="margin: 0; color: #666;">${level.description}</p>
            <p style="margin: 10px 0 0 0; font-weight: bold; color: #333;">目标：${level.target}</p>
            ${tips}
            <button id="closeLevelInfoBtn" style="margin-top: 15px; padding: 8px 20px; background: #0078A8; color: white; border: none; border-radius: 5px; cursor: pointer;">知道了</button>
        `;
        document.body.appendChild(infoDiv);
        
        const closeBtn = document.getElementById('closeLevelInfoBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const div = document.getElementById('level-info');
                if (div) div.remove();
            });
        }
        
        if (level.id === 5) {
            this.startLevel5Highlight();
        } else {
            this.stopLevel5Highlight();
        }
    },

    showLevelBuildings(level) {
        Object.values(this.state.buildingMarkers || {}).forEach(marker => {
            if (marker && this.state.map) {
                this.state.map.removeLayer(marker);
            }
        });
        this.state.buildingMarkers = {};
        
        let buildingsToShow = [];
        if (level.buildings.includes('all')) {
            buildingsToShow = Object.keys(Data.buildings);
        } else {
            buildingsToShow = level.buildings;
        }
        
        buildingsToShow.forEach(buildingId => {
            const building = Data.buildings[buildingId];
            if (building && building.position) {
                this.createBuildingMarker(buildingId, building);
            }
        });
    },

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
        
        marker.on('click', () => {
            this.showBuildingInfo(buildingId, building);
        });
        
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
        const showPuzzle = Storage.userProgress.currentLevel >= 5 && puzzleEvent;
        
        // 检查是否有答题
        const quiz = Data.quizQuestions.find(q => q.buildingId === buildingId);
        
        // 隐藏谜题随机触发逻辑（20%概率）
        let displayEvent = puzzleEvent;
        let isHiddenTriggered = false;
        
        if (showPuzzle && puzzleEvent && puzzleEvent.hidden) {
            // 隐藏谜题有20%概率触发
            isHiddenTriggered = Math.random() < 0.2;
            if (!isHiddenTriggered) {
                // 未触发隐藏谜题时，显示普通谜题
                displayEvent = null;
            }
        }
        
        // 播放区域环境音
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
        
        // 如果有答题且未完成，显示答题界面
        if (quiz && !Storage.userProgress.completedQuizzes?.includes(quiz.id)) {
            content = this.renderQuizContent(quiz, building);
        } else if (showPuzzle && displayEvent) {
            // 获取建筑情绪热榜
            const emotionTag = this.getBuildingEmotionTag(buildingId);
            const hiddenBadge = displayEvent.hidden ? '<span style="background: linear-gradient(135deg, #d4af37, #f4d35e); color: #1b263b; padding: 2px 8px; border-radius: 4px; font-size: 10px; margin-left: 8px;">🎭 隐藏彩蛋</span>' : '';
            
            content = `
                <div style="text-align: center;">
                    <img src="${building.image}" style="max-width: 100%; max-height: 200px; border: 1px solid var(--art-deco-gold); margin-bottom: 15px;">
                    <h3 style="font-family: var(--font-display); color: #f5f0e1; margin: 0 0 10px 0; letter-spacing: 2px;">${displayEvent.title}${hiddenBadge}</h3>
                    <div style="color: #e0e0e0; line-height: 1.8; margin-bottom: 15px; text-align: left; white-space: pre-line;">${displayEvent.description}</div>
                    <div style="margin-top: 15px; padding: 10px; background: rgba(212, 175, 55, 0.1); border-left: 3px solid var(--art-deco-gold);">
                        <p style="margin: 0; font-size: 12px; color: #f4d35e;">🎵 音频：${displayEvent.audioPattern}</p>
                    </div>
                    ${emotionTag ? `<div style="margin-top: 10px; padding: 8px; background: rgba(255, 107, 155, 0.1); border-radius: 4px;">
                        <p style="margin: 0; font-size: 12px; color: #FF6B9B;">${emotionTag}</p>
                    </div>` : ''}
                    ${quiz ? '<button id="startQuizBtn" style="margin-top: 15px; background: linear-gradient(135deg, var(--art-deco-gold), var(--art-deco-gold-light));">📝 参与答题</button>' : ''}
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
                    ${quiz ? '<button id="startQuizBtn" style="margin-top: 15px; background: linear-gradient(135deg, var(--art-deco-gold), var(--art-deco-gold-light));">📝 参与答题</button>' : ''}
                    <button id="closeBuildingInfo" style="margin-top: 10px;">关闭</button>
                </div>
            `;
        }
        
        popup.innerHTML = content;
        document.body.appendChild(popup);
        
        // 绑定答题按钮事件
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
        
        // 记录建筑已探索
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
                
                // 禁用所有选项
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
                
                // 显示结果
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
                
                // 记录答题完成
                if (!Storage.userProgress.completedQuizzes) {
                    Storage.userProgress.completedQuizzes = [];
                }
                if (!Storage.userProgress.completedQuizzes.includes(quiz.id)) {
                    Storage.userProgress.completedQuizzes.push(quiz.id);
                    Storage.saveUserProgress();
                }
                
                // 绑定关闭按钮
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
        // 区域环境音映射
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
                if (this.state.ambientAudio) {
                    this.state.ambientAudio.pause();
                }
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
    
    updateExplorationProgress() {
        const totalBuildings = Object.keys(Data.buildings).length;
        const exploredCount = Storage.userProgress.exploredBuildings ? 
            Storage.userProgress.exploredBuildings.length : 0;
        
        const progressElement = document.getElementById('exploration-progress');
        if (progressElement) {
            progressElement.textContent = `${exploredCount}/${totalBuildings}`;
            const progressBar = document.getElementById('exploration-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${(exploredCount / totalBuildings) * 100}%`;
            }
        }
        
        // 检查成就
        this.checkAchievements('explored', exploredCount);
    },
    
    checkAchievements(type, count) {
        if (!Storage.userProgress.achievements) {
            Storage.userProgress.achievements = [];
        }
        
        Data.achievements.forEach(achievement => {
            if (achievement.condition.type === type && 
                count >= achievement.condition.count &&
                !Storage.userProgress.achievements.includes(achievement.id)) {
                this.unlockAchievement(achievement);
            }
        });
    },
    
    unlockAchievement(achievement) {
        Storage.userProgress.achievements.push(achievement.id);
        Storage.saveUserProgress();
        
        // 更新成就图标显示
        this.updateAchievementIcons();
        
        // 显示成就解锁动画
        this.showAchievementPopup(achievement);
    },
    
    updateAchievementIcons() {
        const achievements = Storage.userProgress.achievements || [];
        const iconsContainer = document.getElementById('achievement-icons');
        const countElement = document.getElementById('achievement-count');
        
        if (iconsContainer) {
            const icons = iconsContainer.querySelectorAll('span');
            icons.forEach((icon, index) => {
                const achievement = Data.achievements[index];
                if (achievement && achievements.includes(achievement.id)) {
                    icon.style.opacity = '1';
                    icon.style.filter = 'drop-shadow(0 0 3px var(--art-deco-gold))';
                } else {
                    icon.style.opacity = '0.3';
                    icon.style.filter = 'none';
                }
            });
        }
        
        if (countElement) {
            countElement.textContent = `${achievements.length}/${Data.achievements.length}`;
        }
    },
    
    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, var(--art-deco-bg-card) 0%, #f0e6d3 100%);
            border: 3px solid var(--art-deco-gold);
            padding: 30px 40px;
            border-radius: 10px;
            z-index: 7000;
            text-align: center;
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
            animation: achievementPop 0.5s ease-out;
        `;
        
        popup.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">${achievement.icon}</div>
            <h2 style="font-family: var(--font-display); color: var(--art-deco-gold); margin: 0 0 10px 0; letter-spacing: 2px;">成就解锁！</h2>
            <h3 style="font-family: var(--font-display); color: var(--art-deco-text-dark); margin: 0 0 10px 0;">${achievement.title}</h3>
            <p style="color: var(--art-deco-text-dark); margin: 0;">${achievement.description}</p>
        `;
        
        document.body.appendChild(popup);
        
        // 添加动画样式
        if (!document.getElementById('achievement-animation-style')) {
            const style = document.createElement('style');
            style.id = 'achievement-animation-style';
            style.textContent = `
                @keyframes achievementPop {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 3秒后自动关闭
        setTimeout(() => {
            popup.style.animation = 'achievementPop 0.3s ease-in reverse';
            setTimeout(() => popup.remove(), 300);
        }, 3000);
    },

    showLevelElements(level) {
        const allElements = ['iconSelector', 'audioPanel', 'puzzleList', 'socialPanel'];
        
        let elementsToShow = [];
        if (level.elements.includes('all')) {
            elementsToShow = allElements;
        } else {
            elementsToShow = level.elements;
        }
        
        document.querySelectorAll('.element-panel').forEach(el => {
            el.style.display = 'none';
        });
        
        elementsToShow.forEach(elementId => {
            const element = document.getElementById(elementId + '-panel');
            if (element) {
                element.style.display = 'block';
            }
        });
    },

    enableLevelMapControls(level) {
        if (!this.state.map) return;
        
        this.state.map.dragging.enable();
        this.state.map.scrollWheelZoom.enable();
        this.state.map.doubleClickZoom.enable();
        this.state.map.boxZoom.enable();
        this.state.map.keyboard.enable();
        this.state.map.touchZoom.enable();
    },

    updateAttribution() {
        if (this.state.attributionControl) {
            this.state.attributionControl.setPrefix('声音校园 - 第 ' + Storage.userProgress.currentLevel + ' 关');
        }
    },

    toggleAudioPanel() {
        if (this.elements.audioPanel) {
            this.elements.audioPanel.classList.toggle('collapsed');
            setTimeout(() => {
                if (this.state.map) {
                    this.state.map.invalidateSize();
                }
            }, 350);
        }
    },

    completeLevel() {
        console.trace('completeLevel() 被调用了！调用者如下：');
        
        if (!this.state.allowCompleteLevel) {
            console.log('completeLevel() 被拦截（未解锁）');
            return;
        }
        
        const currentLevel = Data.levels.find(l => l.id === Storage.userProgress.currentLevel);
        if (!currentLevel) return;
        
        if (!Storage.userProgress.completedLevels.includes(currentLevel.id)) {
            Storage.userProgress.completedLevels.push(currentLevel.id);
        }
        
        currentLevel.buildings.forEach(buildingId => {
            if (buildingId !== 'all' && !Storage.userProgress.unlockedBuildings.includes(buildingId)) {
                Storage.userProgress.unlockedBuildings.push(buildingId);
            }
        });
        
        currentLevel.unlockFeatures.forEach(feature => {
            if (!Storage.userProgress.unlockedFeatures.includes(feature)) {
                Storage.userProgress.unlockedFeatures.push(feature);
            }
        });
        
        Storage.saveUserProgress();
        
        this.unlockLayersByLevel(currentLevel.id);
        
        this.showLevelCompleteModal(currentLevel);
    },

    showLevelCompleteModal(level) {
        const existingModal = document.querySelector('.level-complete-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'level-complete-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.7); display: flex;
            align-items: center; justify-content: center; z-index: 5000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white; padding: 40px; border-radius: 15px;
            text-align: center; max-width: 400px;
        `;
        content.innerHTML = `
            <h2>🎉 恭喜！</h2>
            <p>你已完成「${level.title}」关卡！</p>
            <p style="margin-top: 10px; color: #666;">已解锁: ${level.unlockFeatures.join(', ')}</p>
        `;
        
        const nextBtn = document.createElement('button');
        nextBtn.style.cssText = `
            margin-top: 20px; padding: 10px 30px; background: #0078A8; color: white; 
            border: none; border-radius: 5px; cursor: pointer; font-size: 16px;
        `;
        
        if (level.id < Data.levels.length) {
            nextBtn.textContent = `进入第 ${level.id + 1} 关`;
            nextBtn.onclick = () => {
                modal.remove();
                Storage.userProgress.currentLevel = level.id + 1;
                Storage.saveUserProgress();
                this.applyLevelRestrictionsWithoutPopup();
                this.state.allowShowLevelInfo = true;
                this.showLevelInfo(Data.levels.find(l => l.id === Storage.userProgress.currentLevel));
            };
        } else {
            nextBtn.textContent = '完成所有关卡！';
            nextBtn.onclick = () => modal.remove();
        }
        
        content.appendChild(nextBtn);
        modal.appendChild(content);
        document.body.appendChild(modal);
    },

    checkLevel4Complete() {
        if (this.state.level4AudioSelected && this.state.level4MarkerPlaced) {
            this.completeLevel();
        }
    },

    startLevel5Highlight() {
        const audioList = this.elements.defaultAudioFiles;

        if (audioList) {
            audioList.style.transition = 'all 0.3s ease';
            audioList.style.boxShadow = '0 0 0 4px rgba(255, 102, 0, 0.3), 0 0 20px rgba(255, 102, 0, 0.5)';
            audioList.style.border = '2px solid #ff6600';
            audioList.style.borderRadius = '8px';
            
            audioList.scrollIntoView({ behavior: 'smooth', block: 'center' });

            this.addHighlightArrow(audioList);
        }
    },

    stopLevel5Highlight() {
        const audioList = this.elements.defaultAudioFiles;
        if (audioList) {
            audioList.style.boxShadow = '';
            audioList.style.border = '';
            this.removeHighlightArrow();
        }
    },

    addHighlightArrow(targetElement) {
        if (document.getElementById('highlight-arrow')) return;

        const arrow = document.createElement('div');
        arrow.id = 'highlight-arrow';
        arrow.innerHTML = '👆 点击播放这里的谜题音频';
        arrow.style.cssText = `
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff6600;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 14px;
            white-space: nowrap;
            animation: bounce 0.8s infinite alternate;
            z-index: 1000;
        `;

        targetElement.style.position = 'relative';
        targetElement.insertBefore(arrow, targetElement.firstChild);

        if (!document.getElementById('highlight-animation-style')) {
            const style = document.createElement('style');
            style.id = 'highlight-animation-style';
            style.textContent = `
                @keyframes bounce {
                    from { transform: translateX(-50%) translateY(0); }
                    to { transform: translateX(-50%) translateY(-5px); }
                }
            `;
            document.head.appendChild(style);
        }
    },

    removeHighlightArrow() {
        const arrow = document.getElementById('highlight-arrow');
        if (arrow) arrow.remove();
    },

    handleIconSelect(e) {
        const iconOptions = document.querySelectorAll('.icon-option');
        iconOptions.forEach(opt => opt.classList.remove('selected'));
        e.target.classList.add('selected');
        this.state.selectedType = e.target.dataset.type;
        Storage.saveUserState(this.state.selectedType, this.state.selectedAudio);
    },

    handleKeyPress(e) {
        e.preventDefault();
        
        if (this.state.markerCount >= Config.maxMarkers) {
            alert('地图标记数量已达到上限');
            return;
        }
        
        if (!this.state.lastMousePosition) {
            alert('请先将鼠标移动到地图上要放置标记的位置');
            return;
        }
        
        const mousePos = this.state.lastMousePosition;
        const markerType = Data.markerTypes[this.state.selectedType];
        
        if (!markerType) {
            alert('请先选择一个标记类型');
            return;
        }

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
            const limitedDefaultFiles = defaultFiles.slice(0, Config.maxDefaultAudioMarkers);
            limitedDefaultFiles.forEach(file => this.createAudioItem(file, this.elements.defaultAudioFiles, false));
        }
        
        if (userFiles.length === 0) {
            this.elements.audioFiles.innerHTML = '<p>没有上传的音频文件</p>';
        } else {
            userFiles.forEach(file => this.createAudioItem(file, this.elements.audioFiles, true));
        }
    },

    createAudioItem(file, container, showDeleteButton) {
        const audioItem = document.createElement('div');
        audioItem.className = 'audio-item';
        
        let filename = Utils.escapeHtml(file.key.split('/').pop());
        if (filename.includes('_')) {
            const parts = filename.split('_');
            if (parts.length > 2) {
                const lastPart = parts[parts.length - 1];
                if (lastPart.includes('.')) {
                    const nameWithoutExt = lastPart.split('.')[0];
                    if (nameWithoutExt.length > 0) {
                        filename = nameWithoutExt;
                    }
                }
            }
        }
        
        if (!Utils.validateUrl(file.url)) {
            console.error('Invalid audio URL:', file.url);
            return;
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
        
        container.appendChild(audioItem);
    },

    playAudio(url, button, isDefaultAudio = false) {
        if (!Utils.validateUrl(url)) {
            console.error('Invalid audio URL:', url);
            alert('音频URL无效，无法播放');
            return;
        }
        
        if (url.startsWith('/')) {
            url = Config.serverUrl + url;
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
            audio.currentTime = 0;
        } else {
            audio = new Audio(url);
            this.state.audioPool.set(url, audio);
        }
        
        this.state.currentAudio = audio;
        this.state.currentPlayButton = button;
        this.state.isPlaying = true;
        
        if (button) {
            button.textContent = '暂停';
            button.dataset.playing = 'true';
        }
        
        audio.addEventListener('ended', () => {
            this.handleAudioEnded(button);
            if (isDefaultAudio && Storage.userProgress.currentLevel === 5 && !this.state.level5Completed) {
                this.state.level5Completed = true;
                this.stopLevel5Highlight();
                this.completeLevel();
            }
        }, { once: true });
        
        audio.addEventListener('error', (e) => this.handleAudioError(button, e), { once: true });
        
        audio.play().catch(error => {
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
        if (button && button.progressInterval) {
            clearInterval(button.progressInterval);
            button.progressInterval = null;
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
        
        button.progressInterval = setInterval(() => {
            if (audio.duration && !isNaN(audio.duration) && button.progressFill) {
                const progress = (audio.currentTime / audio.duration) * 100;
                button.progressFill.style.width = `${progress}%`;
            }
        }, 100);
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
            if (existingName === name) {
                return true;
            }
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

    checkAndShowProgressOption() {
        const savedProgress = localStorage.getItem('userProgress');
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);
                if (progress.currentLevel && progress.currentLevel > 1) {
                    const progressInfo = document.createElement('div');
                    progressInfo.id = 'progress-info';
                    progressInfo.style.cssText = `
                        margin-top: 20px;
                        padding: 15px;
                        background: #fff3cd;
                        border-radius: 8px;
                        border-left: 4px solid #ffc107;
                    `;
                    progressInfo.innerHTML = `
                        <p style="margin: 0 0 10px 0; font-weight: bold;">检测到之前的进度</p>
                        <p style="margin: 0 0 10px 0;">当前关卡: 第 ${progress.currentLevel} 关</p>
                        <div style="display: flex; gap: 10px;">
                            <button id="continueProgressBtn" style="flex: 1; padding: 8px 15px; background: #0078A8; color: white; border: none; border-radius: 4px; cursor: pointer;">继续</button>
                            <button id="resetProgressBtn" style="flex: 1; padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">从头开始</button>
                        </div>
                    `;
                    
                    const modalBody = document.querySelector('#welcomeModal .modal-body');
                    if (modalBody) {
                        modalBody.appendChild(progressInfo);
                        
                        document.getElementById('continueProgressBtn').onclick = () => {
                            if (this.elements.welcomeModal) this.elements.welcomeModal.style.display = 'none';
                            progressInfo.remove();
                            this.state.allowLevel1Trigger = true;
                            this.state.allowShowLevelInfo = true;
                            this.state.allowCompleteLevel = true;
                            this.showLevelInfo(Data.levels.find(l => l.id === Storage.userProgress.currentLevel));
                        };
                        
                        document.getElementById('resetProgressBtn').onclick = () => {
                            Storage.resetAllProgress(Data.puzzleEvents);
                            location.reload();
                        };
                    }
                }
            } catch (e) {
                console.error('Error checking saved progress:', e);
            }
        }
    },

    getAllEvents() {
        return { ...Data.puzzleEvents, ...Storage.userEvents };
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
        if (hotspotContainer) {
            hotspotContainer.remove();
        }
        
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
        if (mapContainer) {
            mapContainer.appendChild(container);
        }
        
        Object.entries(Data.buildings).forEach(([buildingId, building]) => {
            if (building.position && !this.state.soundExploreUnlockedBuildings.has(buildingId)) {
                const hotspot = document.createElement('div');
                hotspot.className = 'sound-hotspot';
                hotspot.dataset.buildingId = buildingId;
                
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
                
                hotspot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.startSoundExploreChallenge({ id: buildingId, building: building });
                });
                
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
        
        this.state.map.on('zoomend moveend', () => {
            this.updateHotspotPositions();
        });
        
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
            const buildingId = hotspot.dataset.buildingId;
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
        if (container) {
            container.remove();
        }
        
        const progressHint = document.getElementById('sound-progress-hint');
        if (progressHint) {
            progressHint.remove();
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
            if (marker && this.state.map) {
                this.state.map.removeLayer(marker);
            }
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
            if (savedMode) {
                this.state.currentExploreMode = savedMode;
            }
            
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
                    if (hintEl) {
                        hintEl.textContent = '正在播放音频，请仔细聆听...';
                    }
                }).catch(e => {
                    console.log('Audio autoplay blocked:', e);
                    if (hintEl) {
                        hintEl.textContent = '请点击地图任意位置以启用音频播放';
                    }
                    this.showAudioPermissionHint();
                    
                    const mapContainer = document.getElementById('map');
                    if (mapContainer) {
                        const enableAudio = () => {
                            audio.play().then(() => {
                                this.hideAudioPermissionHint();
                                if (hintEl) {
                                    hintEl.textContent = '正在播放音频，请仔细聆听...';
                                }
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
        if (hint) {
            hint.style.display = 'block';
        }
    },
    
    hideAudioPermissionHint() {
        const hint = document.getElementById('audioPermissionHint');
        if (hint) {
            hint.style.display = 'none';
        }
    },
    
    getAudioFileByPattern(pattern) {
        const audioMap = {
            '脚步声': '/default_audio/脚步声.mp3',
            '风声': '/default_audio/风声.mp3',
            '掌声': '/default_audio/掌声.mp3',
            '钟声': '/default_audio/钟声.mp3',
            '哨声': '/default_audio/哨声.mp3',
            '翻书声': '/default_audio/翻书声.mp3',
            '鸟鸣声': '/default_audio/鸟鸣声.mp3',
            '古琴声': '/default_audio/古琴声.mp3',
            '水声': '/default_audio/水声.mp3',
            '车流声': '/default_audio/车流声.mp3',
            '心跳声': '/default_audio/心跳声.mp3',
            '显微镜调焦声': '/default_audio/显微镜调焦声.mp3',
            '机器轰鸣声': '/default_audio/机器轰鸣声.mp3',
            '玻璃器皿碰撞声': '/default_audio/玻璃器皿碰撞声.mp3',
            '绘图声': '/default_audio/绘图声.mp3',
            '海浪声': '/default_audio/海浪声.mp3',
            '篮球弹跳声': '/default_audio/篮球弹跳声.mp3',
            '谈笑声': '/default_audio/谈笑声.mp3',
            '自行车铃声': '/default_audio/自行车铃声.mp3',
            '蛙鸣声': '/default_audio/蛙叫（纯净）.mp3',
            '闹钟声': '/default_audio/闹钟声.mp3',
            '溪水声': '/default_audio/溪水声.mp3',
            '树叶沙沙声': '/default_audio/树叶沙沙声.mp3',
            '读书声': '/default_audio/读书声.mp3',
            '多语言交谈声': '/default_audio/多语言交谈声.mp3',
            '门铃声': '/default_audio/门铃声.mp3',
            '天鹅叫声': '/default_audio/天鹅叫声.mp3',
            '音乐声': '/default_audio/音乐声.mp3',
            '上课铃声': '/default_audio/上课铃声.mp3',
            '古筝声': '/default_audio/古筝声.mp3',
            '药片摇晃声': '/default_audio/药片摇晃声.mp3',
            'DNA螺旋声': '/default_audio/DNA螺旋声.mp3',
            '田野风声': '/default_audio/田野风声.mp3',
            '动物叫声': '/default_audio/动物叫声.mp3',
            '搅拌声': '/default_audio/搅拌声.mp3',
            '打印机声': '/default_audio/打印机声.mp3',
            '投影仪声': '/default_audio/投影仪声.mp3',
            '敲键盘声': '/default_audio/敲键盘声.mp3',
            '多语言朗读声': '/default_audio/多语言朗读声.mp3',
            '电梯声': '/default_audio/电梯声.mp3',
            '月光曲': '/default_audio/月光曲.mp3'
        };
        
        return audioMap[pattern] || '/default_audio/鸟鸣声.mp3';
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
            submitBtn.onclick = () => {
                this.submitSoundExploreAnswer();
            };
        }
        
        if (inputEl) {
            inputEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitSoundExploreAnswer();
                }
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
    }
};

let isAppInitialized = false;

function initAppOnce() {
    if (isAppInitialized) return;
    isAppInitialized = true;
    console.log('App.init() 开始执行（仅一次）');
    App.init();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initAppOnce();
} else {
    document.addEventListener('DOMContentLoaded', initAppOnce);
}
