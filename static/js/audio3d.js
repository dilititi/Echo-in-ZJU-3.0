// ── audio3d.js：3D 空间音频系统 ──────────────────────────────────

const Audio3D = (() => {

    let ctx = null;
    let masterGain = null;
    const sources = new Map();   // id → { source, panner, gain }
    const zones   = new Map();   // zoneId → { source, panner, gain }

    // ── 区域定义（Three.js 世界坐标 + 半径）────────────────────────
    // 坐标从 createBuildings() 的边界数据反推，运行后再微调
    const ZONES = [
        {
            id: 'lake',
            label: '求是湖',
            pos: [-30, 0, 45],
            radius: 30,
            sounds: [
            { url: '/default_audio/%E7%80%91%E5%B8%83%E5%A3%B0.mp3', loop: true, volume: 0.3 },
            ],
            ambience: 'water',     // 用程序合成水声
        },
        {
            id: 'teaching',
            label: '教学区',
            pos: [-6, 0, 54],
            radius: 40,
            sounds: [],
            ambience: 'wind',      // 轻风声
        },
        {
            id: 'dorm',
            label: '宿舍区',
            pos: [-13, 0, 15],
            radius: 35,
            sounds: [],
            ambience: 'crowd',     // 低频人声白噪音
        },
        {
            id: 'road',
            label: '主干道',
            pos: [42, 0, -128],
            radius: 25,
            sounds: [],
            ambience: 'traffic',   // 远处车流声
        },
    ];

    // ── 移动声源（鸟/自行车）────────────────────────────────────────
    const MOVING_SOURCES = [
        { id: 'bird1', ambience: 'bird', centerX: -20, centerZ: 40,  speed: 0.008, radius: 40, height: 18 },
        { id: 'bird2', ambience: 'bird', centerX: 80,  centerZ: -95, speed: 0.005, radius: 30, height: 22 },
    ];

    // ── 程序合成白噪音 ───────────────────────────────────────────────
    function synthNoise(type, durationSec = 10) {
        const sampleRate = ctx.sampleRate;
        const frames     = sampleRate * durationSec;
        const buffer     = ctx.createBuffer(2, frames, sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            if (type === 'wind' || type === 'crowd') {
                // 粉噪音（低频多）
                let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
                for (let i = 0; i < frames; i++) {
                    const white = Math.random() * 2 - 1;
                    b0=0.99886*b0+white*0.0555179; b1=0.99332*b1+white*0.0750759;
                    b2=0.96900*b2+white*0.1538520; b3=0.86650*b3+white*0.3104856;
                    b4=0.55000*b4+white*0.5329522; b5=-0.7616*b5-white*0.0168980;
                    data[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362)*0.11;
                    b6 = white * 0.115926;
                }
            } else if (type === 'water') {
                // 白噪音过低通 → 水声感
                for (let i = 0; i < frames; i++) data[i] = (Math.random()*2-1)*0.3;
            } else if (type === 'traffic') {
                // 低频轰鸣
                for (let i = 0; i < frames; i++) {
                    data[i] = Math.sin(i/sampleRate*2*Math.PI*80) * 0.05
                            + (Math.random()*2-1) * 0.08;
                }
            } else if (type === 'bird') {
                // 简单合成鸟鸣：短促频率扫描
                for (let i = 0; i < frames; i++) {
                    const t = i / sampleRate;
                    const burst = Math.sin(t * 20) > 0.95 ? 1 : 0;
                    const freq  = 2000 + 800 * Math.sin(t * 8);
                    data[i] = Math.sin(2*Math.PI*freq*t) * burst * 0.3;
                }
            }
        }
        return buffer;
    }

    // ── 创建空间声源 ─────────────────────────────────────────────────
    function createSpatialSource({ buffer, url, pos, volume=0.5, loop=true, rolloff=1.5, maxDist=80 }) {
        const panner = ctx.createPanner();
        panner.panningModel  = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance   = 8;
        panner.maxDistance   = maxDist;
        panner.rolloffFactor = rolloff;
        panner.positionX.value = pos[0];
        panner.positionY.value = pos[1];
        panner.positionZ.value = pos[2];

        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;

        const play = (buf) => {
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.loop   = loop;
            src.connect(panner);
            panner.connect(gainNode);
            gainNode.connect(masterGain);
            src.start();
            return { source: src, panner, gain: gainNode };
        };

        if (buffer) return Promise.resolve(play(buffer));

        return fetch(Config.resolveUrl(url))
            .then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
            .then(ab => ctx.decodeAudioData(ab))
            .then(buf => play(buf))
            .catch(err => {
                console.warn(`音频加载失败 ${url}:`, err);
                return null;
            });
    }

    // ── 初始化所有区域音频 ───────────────────────────────────────────
    function initZones() {
        ZONES.forEach(zone => {
            const buf = synthNoise(zone.ambience);
            createSpatialSource({
                buffer: buf,
                pos: zone.pos,
                volume: 0.25,
                loop: true,
                maxDist: zone.radius * 1.5,
            }).then(s => { if (s) zones.set(zone.id, s); });

            // 额外的真实音频（如蛙叫）
            zone.sounds.forEach(s => {
                createSpatialSource({ url: s.url, pos: zone.pos, volume: s.volume, loop: s.loop });
            });
        });
    }

    // ── 移动声源（鸟绕场飞行）────────────────────────────────────────
    let birdAngle = 0;
    function tickMovingSources() {
        birdAngle += 0.003;
        MOVING_SOURCES.forEach((ms, i) => {
            const entry = zones.get(ms.id);
            if (!entry) return;
            const angle = birdAngle * ms.speed * 100 + i * Math.PI;
            entry.panner.positionX.value = Math.cos(angle) * ms.radius;
            entry.panner.positionY.value = ms.height + Math.sin(angle * 2) * 3;
            entry.panner.positionZ.value = Math.sin(angle) * ms.radius;
        });
    }

    // ── 初始化鸟鸣移动声源 ──────────────────────────────────────────
    function initBirds() {
        MOVING_SOURCES.forEach(ms => {
            const buf = synthNoise('bird', 8);
            createSpatialSource({
                buffer: buf,
                pos: [ms.radius, ms.height, 0],
                volume: 0.3,
                loop: true,
                maxDist: 60,
            }).then(s => { if (s) zones.set(ms.id, s); });
        });
    }

    // ── 天气系统（雨声）──────────────────────────────────────────────
    let rainSource = null;
    function startRain(intensity = 0.4) {
        if (rainSource) return;
        // 雨声 = 白噪音过高通滤波器
        const sampleRate = ctx.sampleRate;
        const frames = sampleRate * 10;
        const buffer = ctx.createBuffer(2, frames, sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            for (let i = 0; i < frames; i++) data[i] = (Math.random()*2-1) * 0.4;
        }
        // 高通滤波让雨声更"沙"
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;

        const gain = ctx.createGain();
        gain.gain.value = intensity;

        src.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        src.start();
        rainSource = { source: src, gain };
    }

    function stopRain() {
        if (!rainSource) return;
        rainSource.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
        setTimeout(() => {
            try { rainSource.source.stop(); } catch(e) {}
            rainSource = null;
        }, 2100);
    }

    // ── 更新听者位置（每帧由 animate3D 调用）────────────────────────
    function updateListener(camera) {
        if (!ctx) return;
        const pos = camera.position;
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        const listener = ctx.listener;
        if (listener.positionX) {
            listener.positionX.value = pos.x;
            listener.positionY.value = pos.y;
            listener.positionZ.value = pos.z;
            listener.forwardX.value  = dir.x;
            listener.forwardY.value  = dir.y;
            listener.forwardZ.value  = dir.z;
            listener.upX.value = 0;
            listener.upY.value = 1;
            listener.upZ.value = 0;
        }
        tickMovingSources();
    }

    // ── 主音量控制 ───────────────────────────────────────────────────
    function setMasterVolume(v) {
        if (masterGain) masterGain.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.5);
    }

    // ── 建筑点击：单次空间化播放 ─────────────────────────────────────
    function playSpatialAudio(url, pos) {
        if (!ctx) return;
        createSpatialSource({
            url,
            pos: [pos.x, pos.y, pos.z],
            volume: 0.8,
            loop: false,
            rolloff: 2,
            maxDist: 120,
        });
    }

    // ── 公开 API ─────────────────────────────────────────────────────
    function init() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.8;
        masterGain.connect(ctx.destination);

        initZones();
        initBirds();
    }

// 保留 AudioContext、只 ramp masterGain，因为关闭后 init() 早退会重用旧 ctx
let preMuteVolume = 0.8;
function mute() {
    if (!ctx || !masterGain) return;
    stopRain();
    preMuteVolume = masterGain.gain.value;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
}
function unmute() {
    if (!ctx || !masterGain) return;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(preMuteVolume || 0.8, ctx.currentTime + 0.25);
}

return { init, updateListener, startRain, stopRain, setMasterVolume, playSpatialAudio, mute, unmute, tick: tickMovingSources };

})();