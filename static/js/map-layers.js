// map-layers.js — 地图图层 + 主题 + 归因
Object.assign(App, {

    initDayNightMode() {
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour >= 18;
        this.state.isNightMode = isNight;
        this.applyTheme(isNight ? 'night' : 'day');
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
            background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
            border: 2px solid var(--gold);
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
            if (this.state.map) {
                const mapContainer = document.getElementById('map');
                if (mapContainer) mapContainer.style.filter = 'brightness(0.7) saturate(0.8)';
            }
            document.querySelectorAll('.building-marker').forEach(marker => {
                marker.style.boxShadow = '0 0 10px var(--gold)';
            });
        } else {
            root.style.setProperty('--art-deco-bg-main', '#f5f0e6');
            root.style.setProperty('--art-deco-bg-card', '#ffffff');
            root.style.setProperty('--art-deco-text-dark', '#1b263b');
            root.style.setProperty('--art-deco-gold', '#d4af37');
            root.style.setProperty('--art-deco-gold-light', '#f4d35e');
            if (this.state.map) {
                const mapContainer = document.getElementById('map');
                if (mapContainer) mapContainer.style.filter = 'none';
            }
            document.querySelectorAll('.building-marker').forEach(marker => {
                marker.style.boxShadow = 'none';
            });
        }
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

        setTimeout(() => { this.state.map.invalidateSize(); }, 200);
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
            if (opacity >= 1) { opacity = 1; clearInterval(fadeIn); }
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
        if (center) this.state.map.flyTo(center, 0, { duration: 1.5 });
    },

    loadUnlockedLayers() {
        const saved = Storage.userProgress.unlockedLayers || [];
        this.state.unlockedLayers = new Set(saved);
        saved.forEach(layerId => {
            const layer = this.state.mapLayers.get(layerId);
            if (layer) layer.setOpacity(1);
        });
    },

    updateAttribution() {
        if (this.state.attributionControl) {
            this.state.attributionControl.setPrefix('声音校园 - 第 ' + Storage.userProgress.currentLevel + ' 关');
        }
    },
});
