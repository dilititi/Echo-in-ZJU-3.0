// level-system.js — 关卡、欢迎、成就、进度、图书馆挑战
Object.assign(App, {

    showWelcomeOverlay() {
        const overlay = document.getElementById('welcomeOverlay');
        if (overlay) overlay.style.display = 'flex';
    },

    hideWelcomeOverlay() {
        const overlay = document.getElementById('welcomeOverlay');
        if (overlay) overlay.style.display = 'none';
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
                if (el) el.classList.add('recommended-highlight');
            }
        });

        const hint = document.getElementById('recommendHint');
        if (hint) {
            hint.style.display = 'block';
            setTimeout(() => { hint.style.display = 'none'; }, 5000);
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
            if (firstMarker) this.state.map.setView(firstMarker.getLatLng(), 1);
        }
    },

    showLevelInfo(level) {
        if (!this.state.allowShowLevelInfo) {
            return;
        }
        if (!level) {
            level = Data.levels.find(l => l.id === Storage.userProgress.currentLevel);
        }
        if (!level) return;

        const existingDiv = document.getElementById('level-info');
        if (existingDiv) existingDiv.remove();

        const levelGuides = {
            1: { icon: '🗺️', action: '点击地图上的建筑图标，探索校园地标' },
            2: { icon: '🔒', action: '在右侧声音面板里，播放声音谜题音频并猜测答案' },
            3: { icon: '🎤', action: '在右侧面板录制或上传一段你的声音' },
            4: { icon: '📌', action: '先在面板选择音频，再按 N 键在地图上放置绑定标记' },
            5: { icon: '🏛️', action: '点击闪烁的地标，播放谜题音频解锁校园故事' },
            6: { icon: '🎉', action: '自由探索校园，解锁更多隐藏彩蛋与社交互动' },
        };
        const guide = levelGuides[level.id] || {};

        const infoDiv = document.createElement('div');
        infoDiv.id = 'level-info';
        infoDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%);
            border: 2px solid var(--art-deco-gold);
            padding: 20px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            z-index: 4000;
            text-align: center;
            max-width: 480px;
            color: #f5f0e1;
        `;
        infoDiv.innerHTML = `
            <h3 style="margin:0 0 8px 0;color:var(--art-deco-gold);font-family:var(--font-display);letter-spacing:2px;">
                第 ${level.id} 关：${level.title}
            </h3>
            <p style="margin:0 0 10px 0;color:#ccc;font-size:13px;">${level.description}</p>
            <div style="background:rgba(212,175,55,0.08);border-left:3px solid var(--art-deco-gold);padding:10px 14px;border-radius:0 6px 6px 0;text-align:left;margin-bottom:12px;">
                <p style="margin:0 0 4px 0;font-size:12px;color:#f4d35e;">🎯 本关目标</p>
                <p style="margin:0;font-size:13px;font-weight:bold;color:#f5f0e1;">${level.target}</p>
            </div>
            ${guide.action ? `<div style="background:rgba(255,255,255,0.04);border-radius:6px;padding:10px 14px;text-align:left;margin-bottom:12px;">
                <p style="margin:0;font-size:13px;color:#e0e0e0;">${guide.icon} <strong>操作：</strong>${guide.action}</p>
            </div>` : ''}
            <button id="closeLevelInfoBtn" style="padding:8px 24px;background:linear-gradient(135deg,var(--art-deco-gold),var(--art-deco-gold-light));color:#1b263b;border:none;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;">知道了</button>
        `;
        document.body.appendChild(infoDiv);

        document.getElementById('closeLevelInfoBtn').addEventListener('click', () => {
            const div = document.getElementById('level-info');
            if (div) div.remove();
        });

        if (level.id === 5) {
            this.startLevel5Highlight();
        } else {
            this.stopLevel5Highlight();
        }
    },

    startLibraryChallenge() {
        const existing = document.getElementById('libraryChallengePop');
        if (existing) existing.remove();

        fetch(`${Config.serverUrl}/soundtrack_list`)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                if (data.error) { alert('暂无音乐文件：' + data.error); return; }
                const libs = Object.keys(data);
                if (!libs.length) { alert('暂无音乐文件'); return; }

                const lib = libs[Math.floor(Math.random() * libs.length)];
                const files = data[lib];
                const filename = files[Math.floor(Math.random() * files.length)];
                const audioUrl = `${Config.serverUrl}/soundtrack/${encodeURIComponent(lib)}/${encodeURIComponent(filename)}`;

                let challengeAudio = null;

                const pop = document.createElement('div');
                pop.id = 'libraryChallengePop';
                pop.style.cssText = `
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%);
                    border: 2px solid var(--art-deco-gold);
                    padding: 28px; max-width: 420px; width: 90%;
                    border-radius: 10px; z-index: 6500;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
                    color: #f5f0e1; text-align: center;
                `;
                pop.innerHTML = `
                    <h3 style="margin:0 0 6px 0;color:var(--art-deco-gold);font-family:var(--font-display);letter-spacing:2px;">🎵 图书馆闭馆音乐挑战</h3>
                    <p style="font-size:12px;color:#aaa;margin:0 0 16px 0;">聆听音乐，猜猜是哪个图书馆的闭馆曲？</p>
                    <button id="lcPlayBtn" style="background:linear-gradient(135deg,#1a6b3a,#2d9e5f);color:#fff;border:none;padding:9px 24px;border-radius:5px;cursor:pointer;font-size:14px;margin-bottom:14px;">▶ 播放音乐</button>
                    <div id="lcGuessArea" style="display:none;">
                        <p style="font-size:13px;color:#e0e0e0;margin:0 0 8px 0;">你猜是哪个图书馆？</p>
                        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px;">
                            <button class="lc-choice" data-val="基图" style="padding:7px 18px;background:rgba(212,175,55,0.12);color:#f4d35e;border:1px solid #d4af37;border-radius:4px;cursor:pointer;font-size:13px;">基图</button>
                            <button class="lc-choice" data-val="主图" style="padding:7px 18px;background:rgba(212,175,55,0.12);color:#f4d35e;border:1px solid #d4af37;border-radius:4px;cursor:pointer;font-size:13px;">主图</button>
                            <button class="lc-choice" data-val="医图" style="padding:7px 18px;background:rgba(212,175,55,0.12);color:#f4d35e;border:1px solid #d4af37;border-radius:4px;cursor:pointer;font-size:13px;">医图</button>
                        </div>
                        <div style="display:flex;gap:8px;justify-content:center;align-items:center;">
                            <button id="lcRevealBtn" style="background:rgba(212,175,55,0.15);color:#f4d35e;border:1px solid #d4af37;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;">显示答案</button>
                            <span id="lcAnswer" style="display:none;color:#f4d35e;font-weight:bold;font-size:14px;"></span>
                        </div>
                        <div id="lcResult" style="margin-top:10px;font-size:13px;min-height:20px;"></div>
                    </div>
                    <br>
                    <button id="lcCloseBtn" style="margin-top:8px;background:rgba(255,255,255,0.08);color:#ccc;border:1px solid #555;padding:6px 18px;border-radius:4px;cursor:pointer;font-size:12px;">关闭</button>
                `;
                document.body.appendChild(pop);

                document.getElementById('lcPlayBtn').onclick = () => {
                    if (challengeAudio) { challengeAudio.pause(); challengeAudio.currentTime = 0; }
                    challengeAudio = new Audio(audioUrl);
                    challengeAudio.volume = 0.8;
                    challengeAudio.play().catch(() => {});
                    document.getElementById('lcGuessArea').style.display = 'block';
                    document.getElementById('lcPlayBtn').textContent = '▶ 重新播放';
                };

                pop.querySelectorAll('.lc-choice').forEach(btn => {
                    btn.onclick = () => {
                        const chosen = btn.dataset.val;
                        const resultEl = document.getElementById('lcResult');
                        if (chosen === lib) {
                            resultEl.style.color = '#2ecc71';
                            resultEl.textContent = '✅ 回答正确！';
                        } else {
                            resultEl.style.color = '#e74c3c';
                            resultEl.textContent = `❌ 答错了，正确答案是：${lib}`;
                        }
                        pop.querySelectorAll('.lc-choice').forEach(b => b.disabled = true);
                    };
                });

                document.getElementById('lcRevealBtn').onclick = () => {
                    document.getElementById('lcAnswer').textContent = `答案：${lib}`;
                    document.getElementById('lcAnswer').style.display = 'inline';
                    document.getElementById('lcRevealBtn').style.display = 'none';
                };

                document.getElementById('lcCloseBtn').onclick = () => {
                    if (challengeAudio) { challengeAudio.pause(); challengeAudio = null; }
                    pop.remove();
                };
            })
            .catch(() => alert('加载音乐列表失败，请检查服务器'));
    },

    showLevelBuildings(level) {
        Object.values(this.state.buildingMarkers || {}).forEach(marker => {
            if (marker && this.state.map) this.state.map.removeLayer(marker);
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
        this.updateAchievementIcons();
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
            background: #3a3a3a;
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

        setTimeout(() => {
            popup.style.animation = 'achievementPop 0.3s ease-in reverse';
            setTimeout(() => popup.remove(), 300);
        }, 3000);
    },

    showLevelElements(level) {
        const allElements = ['iconSelector', 'audioPanel', 'puzzleList', 'socialPanel'];
        let elementsToShow = level.elements.includes('all') ? allElements : level.elements;

        document.querySelectorAll('.element-panel').forEach(el => { el.style.display = 'none'; });
        elementsToShow.forEach(elementId => {
            const element = document.getElementById(elementId + '-panel');
            if (element) element.style.display = 'block';
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

    toggleAudioPanel() {
        if (this.elements.audioPanel) {
            this.elements.audioPanel.classList.toggle('collapsed');
            setTimeout(() => {
                if (this.state.map) this.state.map.invalidateSize();
            }, 350);
        }
    },

    completeLevel() {
        if (!this.state.allowCompleteLevel) return;
        if (this.state.isCompletingLevel) return;
        this.state.isCompletingLevel = true;

        const currentLevel = Data.levels.find(l => l.id === Storage.userProgress.currentLevel);
        if (!currentLevel) { this.state.isCompletingLevel = false; return; }

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
        this.state.isCompletingLevel = false;
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
});
