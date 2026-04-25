/**
 * localStorage迁移脚本
 * 用于处理旧版本数据迁移到新版本
 */
const Migration = {
    version: '1.0.0',
    
    oldKeys: {
        userProgress: 'userProgress',
        socialData: 'socialData',
        userEvents: 'userEvents',
        audioEventBindings: 'audioEventBindings',
        audioNotes: 'audioNotes',
        userMarkers: 'userMarkers',
        mapUserState: 'mapUserState',
        mapMarkers: 'mapMarkers'
    },
    
    newKeys: {
        userProgress: 'zju_map_userProgress_v1',
        socialData: 'zju_map_socialData_v1',
        userEvents: 'zju_map_userEvents_v1',
        audioEventBindings: 'zju_map_audioEventBindings_v1',
        audioNotes: 'zju_map_audioNotes_v1',
        userMarkers: 'zju_map_userMarkers_v1',
        mapUserState: 'zju_map_mapUserState_v1',
        mapMarkers: 'zju_map_mapMarkers_v1'
    },
    
    run() {
        console.log('开始迁移localStorage数据...');
        let migrated = 0;
        
        Object.keys(this.oldKeys).forEach(key => {
            const oldKey = this.oldKeys[key];
            const newKey = this.newKeys[key];
            
            const oldData = localStorage.getItem(oldKey);
            const newData = localStorage.getItem(newKey);
            
            if (oldData && !newData) {
                try {
                    localStorage.setItem(newKey, oldData);
                    localStorage.removeItem(oldKey);
                    console.log(`迁移成功: ${oldKey} -> ${newKey}`);
                    migrated++;
                } catch (e) {
                    console.error(`迁移失败: ${oldKey}`, e);
                }
            }
        });
        
        console.log(`迁移完成，共迁移 ${migrated} 个数据项`);
        return migrated;
    },
    
    checkVersion() {
        const savedVersion = localStorage.getItem('zju_map_version');
        if (!savedVersion || savedVersion !== this.version) {
            console.log('检测到新版本，执行迁移...');
            this.run();
            localStorage.setItem('zju_map_version', this.version);
        }
    },
    
    cleanOldData() {
        console.log('清理旧数据...');
        Object.values(this.oldKeys).forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`已删除: ${key}`);
            }
        });
    },
    
    getStatus() {
        const status = {};
        Object.keys(this.newKeys).forEach(key => {
            const data = localStorage.getItem(this.newKeys[key]);
            status[key] = {
                exists: !!data,
                size: data ? data.length : 0
            };
        });
        return status;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Migration;
}
