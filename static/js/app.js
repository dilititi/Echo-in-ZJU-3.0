// app.js — App 骨架：state、elements、init、核心工具方法
// 业务方法分布在各模块文件，通过 Object.assign(App, {...}) 挂载

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
        soundExploreAttempts: {},
        isCompletingLevel: false
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
        this.updateAudioList();

        this.initMap();
        this.loadMarkers();
        this.initEventListeners();

        this.showAllBuildingMarkers();

        if (window.Markers && Markers.refreshStats) {
            Markers.refreshStats();
        }

        if (this.refreshHeaderStats) this.refreshHeaderStats();

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
            const t = e.target;
            const tag = t && t.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
            if (document.querySelector('.modal[style*="display: flex"], .modal[style*="display: block"], #building-info-popup')) return;
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
            startExploreBtn.addEventListener('click', () => { this.hideWelcomeOverlay(); });
        }

        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                if (this.elements.welcomeModal) this.elements.welcomeModal.style.display = 'flex';
            });
        }

        const closeHelpModal = document.getElementById('closeHelpModal');
        if (closeHelpModal) {
            closeHelpModal.addEventListener('click', () => {
                if (this.elements.welcomeModal) this.elements.welcomeModal.style.display = 'none';
            });
        }

        if (this.elements.audioPanelToggle) {
            this.elements.audioPanelToggle.addEventListener('click', () => this.toggleAudioPanel());
        }

        const libraryChallengeBtn = document.getElementById('libraryChallengeBtn');
        if (libraryChallengeBtn) {
            libraryChallengeBtn.addEventListener('click', () => this.startLibraryChallenge());
        }

        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', () => {
                if (confirm('确定要清除所有标记吗？')) {
                    this.clearAllMarkers();
                }
            });
        }

        const compass = document.querySelector('.map-compass');
        if (compass) {
            const PAN_PX = 220;
            const panByDirection = (dx, dy) => {
                if (this.state.map) this.state.map.panBy([dx, dy], { animate: true });
            };
            const handleCompassClick = (clientX, clientY) => {
                const rect = compass.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = clientX - cx;
                const dy = clientY - cy;
                // Closer to center than half-radius → reset view.
                if (Math.hypot(dx, dy) < rect.width * 0.18) {
                    this.state.map.fitBounds([[0, 0], [1000, 1000]]);
                    return;
                }
                if (Math.abs(dx) > Math.abs(dy)) {
                    panByDirection(dx > 0 ? PAN_PX : -PAN_PX, 0);
                } else {
                    panByDirection(0, dy > 0 ? PAN_PX : -PAN_PX);
                }
            };
            compass.addEventListener('click', (e) => handleCompassClick(e.clientX, e.clientY));
            compass.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const rect = compass.getBoundingClientRect();
                    handleCompassClick(rect.left + rect.width / 2, rect.top);
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
};
