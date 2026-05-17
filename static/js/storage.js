const Storage = {
    userProgress: {
        currentLevel: 1,
        completedLevels: [],
        unlockedBuildings: [],
        unlockedFeatures: [],
        unlockedLayers: [],
        exploredBuildings: [],
        achievements: [],
        completedQuizzes: [],
        completedDuoTasks: []
    },

    socialData: {
        userNickname: '探索者',
        deviceId: '',
        messageWall: [],
        emotionRanking: []
    },

    userEvents: {},
    audioEventBindings: {},
    audioNotes: {},
    userMarkers: [],

    // 服务端共享留言缓存
    serverCache: {
        stats: null,
        statsAt: 0,
        messagesByBuilding: {}
    },

    initSocialData() {
        if (!this.socialData.deviceId) {
            this.socialData.deviceId = 'user_' + Date.now();
        }
        const savedNickname = localStorage.getItem('zju_map_nickname_v1');
        if (savedNickname) this.socialData.userNickname = savedNickname;
        this.loadSocialData();
    },

    loadUserProgress() {
        const saved = localStorage.getItem('userProgress');
        if (saved) {
            try {
                this.userProgress = JSON.parse(saved);
                if (!this.userProgress.currentLevel || this.userProgress.currentLevel < 1) {
                    this.userProgress.currentLevel = 1;
                }
                if (!this.userProgress.unlockedLayers) {
                    this.userProgress.unlockedLayers = [];
                }
            } catch (e) {
                console.error('Failed to parse user progress, resetting:', e);
                this.resetUserProgress();
            }
        } else {
            this.resetUserProgress();
        }
        return this.userProgress;
    },

    resetUserProgress() {
        this.userProgress = {
            currentLevel: 1,
            completedLevels: [],
            unlockedBuildings: [],
            unlockedFeatures: [],
            unlockedLayers: []
        };
        this.saveUserProgress();
    },

    saveUserProgress() {
        try {
            localStorage.setItem('userProgress', JSON.stringify(this.userProgress));
        } catch (error) {
            console.error('Failed to save user progress:', error);
        }
    },

    saveUnlockedLayers(layerIds) {
        this.userProgress.unlockedLayers = layerIds;
        this.saveUserProgress();
    },

    loadSocialData() {
        try {
            const savedSocial = localStorage.getItem('socialData');
            if (savedSocial) {
                const saved = JSON.parse(savedSocial);
                this.socialData.messageWall = saved.messageWall || [];
                this.socialData.emotionRanking = saved.emotionRanking || [];
            }
        } catch (error) {
            console.error('Failed to load social data:', error);
        }
    },

    saveSocialData() {
        try {
            const toSave = {
                messageWall: this.socialData.messageWall,
                emotionRanking: this.socialData.emotionRanking
            };
            localStorage.setItem('socialData', JSON.stringify(toSave));
        } catch (error) {
            console.error('Failed to save social data:', error);
        }
    },

    addMessageToWall(message, audioData, options) {
        const opts = options || {};
        const buildingId = opts.buildingId || '';
        const emotion = opts.emotion || '';
        const trimmed = (message || '').substring(0, 140);
        const wallMessage = {
            id: 'local_' + Date.now(),
            buildingId,
            emotion,
            nickname: this.socialData.userNickname,
            message: trimmed,
            audioKey: audioData ? audioData.key : null,
            audioUrl: audioData ? audioData.url : null,
            timestamp: new Date().toLocaleString(),
            _pending: true
        };

        this.socialData.messageWall.unshift(wallMessage);
        if (this.socialData.messageWall.length > 20) {
            this.socialData.messageWall = this.socialData.messageWall.slice(0, 20);
        }
        this.saveSocialData();

        const body = {
            message: trimmed,
            nickname: this.socialData.userNickname,
            building_id: buildingId,
            audio_key: audioData ? audioData.key : '',
            emotion
        };
        const apiUrl = (window.Config && Config.resolveUrl)
            ? Config.resolveUrl('/api/messages') : '/api/messages';
        return fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
            .then(record => {
                wallMessage.id = record.id;
                wallMessage._pending = false;
                wallMessage.serverTimestamp = record.timestamp;
                this.saveSocialData();
                // 失效该建筑缓存
                if (buildingId) {
                    delete this.serverCache.messagesByBuilding[buildingId];
                    this.serverCache.stats = null;
                }
                return record;
            })
            .catch(err => {
                console.warn('addMessageToWall: server post failed, kept local pending', err);
                return null;
            });
    },

    loadServerMessages(buildingId, limit) {
        const id = buildingId || '';
        const cacheKey = id || '__all__';
        const cached = this.serverCache.messagesByBuilding[cacheKey];
        if (cached && (Date.now() - cached.at) < 30000) {
            return Promise.resolve(cached.data);
        }
        const params = new URLSearchParams();
        if (id) params.set('building_id', id);
        if (limit) params.set('limit', String(limit));
        const path = '/api/messages' + (params.toString() ? '?' + params : '');
        const apiUrl = (window.Config && Config.resolveUrl)
            ? Config.resolveUrl(path) : path;
        return fetch(apiUrl)
            .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
            .then(j => {
                const data = j.messages || [];
                this.serverCache.messagesByBuilding[cacheKey] = { at: Date.now(), data };
                return data;
            })
            .catch(err => {
                console.warn('loadServerMessages failed', err);
                return [];
            });
    },

    getMessagesStats(force) {
        if (!force && this.serverCache.stats && (Date.now() - this.serverCache.statsAt) < 30000) {
            return Promise.resolve(this.serverCache.stats);
        }
        const apiUrl = (window.Config && Config.resolveUrl)
            ? Config.resolveUrl('/api/messages/stats') : '/api/messages/stats';
        return fetch(apiUrl)
            .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
            .then(stats => {
                this.serverCache.stats = stats || {};
                this.serverCache.statsAt = Date.now();
                return this.serverCache.stats;
            })
            .catch(err => {
                console.warn('getMessagesStats failed', err);
                return {};
            });
    },

    updateEmotionRanking(buildingId, emotionType) {
        let existing = this.socialData.emotionRanking.find(r => r.buildingId === buildingId);
        if (!existing) {
            existing = {
                buildingId: buildingId,
                emotions: { like: 0, happy: 0, love: 0, sad: 0, cry: 0, angry: 0, surprised: 0, confused: 0 }
            };
            this.socialData.emotionRanking.push(existing);
        }
        
        existing.emotions[emotionType] = (existing.emotions[emotionType] || 0) + 1;
        this.saveSocialData();
    },

    loadUserEvents() {
        try {
            const saved = localStorage.getItem('userEvents');
            if (saved) {
                this.userEvents = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load user events:', error);
        }
    },

    saveUserEvents() {
        try {
            localStorage.setItem('userEvents', JSON.stringify(this.userEvents));
        } catch (error) {
            console.error('Failed to save user events:', error);
        }
    },

    loadAudioEventBindings() {
        try {
            const saved = localStorage.getItem('audioEventBindings');
            if (saved) {
                this.audioEventBindings = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load audio event bindings:', error);
        }
    },

    saveAudioEventBindings() {
        try {
            localStorage.setItem('audioEventBindings', JSON.stringify(this.audioEventBindings));
        } catch (error) {
            console.error('Failed to save audio event bindings:', error);
        }
    },

    loadAudioNotes() {
        try {
            const saved = localStorage.getItem('audioNotes');
            if (saved) {
                this.audioNotes = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load audio notes:', error);
        }
    },

    saveAudioNotes() {
        try {
            localStorage.setItem('audioNotes', JSON.stringify(this.audioNotes));
        } catch (error) {
            console.error('Failed to save audio notes:', error);
        }
    },

    saveUserMarkers(markers) {
        try {
            this.userMarkers = markers;
            localStorage.setItem('userMarkers', JSON.stringify(markers));
        } catch (error) {
            console.error('Failed to save user markers:', error);
        }
    },

    loadUserMarkers() {
        try {
            const saved = localStorage.getItem('userMarkers');
            if (saved) {
                this.userMarkers = JSON.parse(saved);
            }
            return this.userMarkers;
        } catch (error) {
            console.error('Failed to load user markers:', error);
            return [];
        }
    },

    saveUserState(selectedType, selectedAudio) {
        const state = { selectedType, selectedAudio };
        localStorage.setItem('mapUserState', JSON.stringify(state));
    },

    loadUserState() {
        const savedState = localStorage.getItem('mapUserState');
        if (savedState) {
            try {
                return JSON.parse(savedState);
            } catch (error) {
                console.error('Error loading user state:', error);
            }
        }
        return null;
    },

    saveEventReactions(eventId, eventData) {
        try {
            const key = `eventReactions_${eventId}`;
            localStorage.setItem(key, JSON.stringify(eventData));
        } catch (error) {
            console.error('Failed to save event reactions:', error);
        }
    },

    loadEventReactions(puzzleEvents) {
        Object.keys(puzzleEvents).forEach(eventId => {
            try {
                const key = `eventReactions_${eventId}`;
                const savedData = localStorage.getItem(key);
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData) {
                        if (parsedData.reactions) puzzleEvents[eventId].reactions = parsedData.reactions;
                        if (parsedData.userReaction !== undefined) puzzleEvents[eventId].userReaction = parsedData.userReaction;
                        if (parsedData.isUnlocked !== undefined) puzzleEvents[eventId].isUnlocked = parsedData.isUnlocked;
                        if (parsedData.isPlayed !== undefined) puzzleEvents[eventId].isPlayed = parsedData.isPlayed;
                    }
                }
            } catch (error) {
                console.error('Failed to load event reactions:', error);
            }
        });
        return puzzleEvents;
    },

    resetAllPuzzles(puzzleEvents) {
        Object.keys(puzzleEvents).forEach(eventId => {
            puzzleEvents[eventId].isUnlocked = false;
            puzzleEvents[eventId].isPlayed = false;
            const key = `eventReactions_${eventId}`;
            localStorage.removeItem(key);
        });
        localStorage.removeItem('mapMarkers');
    },

    resetAllProgress(puzzleEvents) {
        this.userProgress = {
            currentLevel: 1,
            completedLevels: [],
            unlockedBuildings: ['schoolGate'],
            unlockedFeatures: [],
            unlockedLayers: []
        };
        this.saveUserProgress();
        this.resetAllPuzzles(puzzleEvents);
        this.socialData.messageWall = [];
        this.socialData.emotionRanking = [];
        localStorage.removeItem('socialData');
        this.userEvents = {};
        localStorage.removeItem('userEvents');
        this.audioEventBindings = {};
        localStorage.removeItem('audioEventBindings');
        this.audioNotes = {};
        localStorage.removeItem('audioNotes');
        localStorage.removeItem('mapUserState');
        this.userMarkers = [];
        localStorage.removeItem('userMarkers');
        localStorage.removeItem('mapMarkers');
        this.serverCache = { stats: null, statsAt: 0, messagesByBuilding: {} };
        const apiUrl = (window.Config && Config.resolveUrl)
            ? Config.resolveUrl('/api/messages') : '/api/messages';
        fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'X-API-Key': (window.Config && Config.apiKey) || 'default_api_key'
            }
        }).catch(err => console.warn('Server messages reset failed', err));
    }
};
