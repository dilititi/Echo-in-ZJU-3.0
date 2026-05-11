// 在 scene3d.js 顶部加这个函数
function makeWindowTexture(color, rows = 6, cols = 4) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 外墙底色
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 256);

    // 窗户
    const winW = 20, winH = 28;
    const padX = (128 - cols * winW) / (cols + 1);
    const padY = (256 - rows * winH) / (rows + 1);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = padX + c * (winW + padX);
            const y = padY + r * (winH + padY);
            // 随机亮/暗窗（夜晚感）
            const lit = Math.random() > 0.35;
            ctx.fillStyle = lit ? '#ffe87a' : '#1a2a3a';
            ctx.fillRect(x, y, winW, winH);
            // 窗框
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, winW, winH);
        }
    }

    return new THREE.CanvasTexture(canvas);
}

// ── scene3d.js：3D 场景全部逻辑 ─────────────────────────────────

let scene, camera, renderer, controls3d;
let buildingMeshes = [];
let selectedBuilding3D = null;
let scene3dReady = false;
let viewMode3D = 0;

// ── Fix: audioPattern → 磁盘实际文件名 映射表 ───────────────────
// 修复 8 个少"声"字 + 2 个名称完全不同的不匹配
const AUDIO_PATTERN_MAP = {
    '踩石子声':   '踩石子.mp3',
    '走楼梯声':   '走楼梯.mp3',
    '蝉鸣声':     '蝉鸣.mp3',
    '敲键盘声':   '敲键盘.mp3',
    '踩树叶声':   '踩树叶.mp3',
    '摇晃水杯声': '摇晃水杯.mp3',
    '走路声':     '木板走路声.mp3',
    '踩木地板声': '木板走路声.mp3',
    '食堂声':     '食堂后堂声.mp3',
    '蛙鸣声':     '蛙叫（纯净）.mp3',
    '翻书声':     '翻书声.mp3',
    '电梯声':     '电梯声.mp3',
};

function resolveAudioUrl(audioPattern) {
    if (!audioPattern) return null;
    const filename = AUDIO_PATTERN_MAP[audioPattern] || audioPattern + '.mp3';
    return `/default_audio/${encodeURIComponent(filename)}`;
}

// ── 切换函数（供 index.html 调用）────────────────────────────────
function switchTo3D() {
    document.getElementById('map').style.display = 'none';
    document.getElementById('controlPanel').style.display = 'none';
    document.getElementById('layerControl').style.display = 'none';
    document.getElementById('sidePanel').style.display = 'none';
    document.getElementById('topToolbar').style.display = 'none';
    document.getElementById('hamburgerMenu').style.display = 'none';
    document.getElementById('scene-3d').style.display = 'block';
    if (!scene3dReady) init3D();
}

function switchTo2D() {
    document.getElementById('scene-3d').style.display = 'none';
    document.getElementById('map').style.display = '';
    document.getElementById('controlPanel').style.display = '';
    document.getElementById('layerControl').style.display = '';
    document.getElementById('sidePanel').style.display = '';
    document.getElementById('topToolbar').style.display = '';
    stop3DAudio();
}

// ── 初始化 ────────────────────────────────────────────────────────
function init3D() {
    if (typeof THREE === 'undefined') {
        show3DError('Three.js 加载失败，请检查网络连接'); return;
    }
    if (typeof THREE.OrbitControls === 'undefined') {
        show3DError('OrbitControls 加载失败'); return;
    }
    if (typeof CoordinateSystem === 'undefined') {
        show3DError('坐标系统加载失败'); return;
    }
    if (typeof Data === 'undefined') {
        show3DError('数据加载失败'); return;
    }

    try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d1b2a);
        scene.fog = new THREE.Fog(0x0d1b2a, 200, 500);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        controls3d = new THREE.OrbitControls(camera, renderer.domElement);
        controls3d.enableDamping = true;
        controls3d.dampingFactor = 0.05;
        controls3d.maxPolarAngle = Math.PI / 2.2;

        add3DLighting();
        preloadTextures();
        create3DBuildings();
        setup3DInteraction();
        window.addEventListener('resize', on3DResize);

        document.getElementById('3d-loading').style.display = 'none';
        scene3dReady = true;
        animate3D();
    } catch (e) {
        show3DError('初始化失败: ' + e.message);
        console.error(e);
    }
}

function show3DError(msg) {
    document.getElementById('3d-loading').style.display = 'none';
    document.getElementById('3d-error').style.display = 'block';
    document.getElementById('3d-error-msg').textContent = msg;
}

// ── 光照 ──────────────────────────────────────────────────────────
function add3DLighting() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(50, 100, 50);
    dir.castShadow = true;
    dir.shadow.mapSize.width = dir.shadow.mapSize.height = 2048;
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xd4af37, 0.3);
    fill.position.set(-50, 50, -50);
    scene.add(fill);
}

// ── 纹理预加载 ────────────────────────────────────────────────────
const textureLoader = new THREE.TextureLoader();
const buildingTextures = {};

function preloadTextures() {
    for (const [key, b] of Object.entries(Data.buildings)) {
        if (b.image) {
            // Fix: 用绝对路径，加 / 前缀
            const url = b.image.startsWith('/') ? b.image : '/' + b.image;
            buildingTextures[key] = textureLoader.load(
                url,
                undefined,
                undefined,
                () => { buildingTextures[key] = null; } // 加载失败静默处理
            );
        }
    }
}

// ── 建筑 ──────────────────────────────────────────────────────────
function create3DBuildings() {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    for (const [, b] of Object.entries(Data.buildings)) {
        if (b.footprint) {
            for (const [lng, lat] of b.footprint) {
                const [x,,z] = CoordinateSystem.wgs84To3D(lng, lat, 0);
                minX = Math.min(minX,x); maxX = Math.max(maxX,x);
                minZ = Math.min(minZ,z); maxZ = Math.max(maxZ,z);
            }
        } else if (b.position) {
            const [x,,z] = CoordinateSystem.pixelTo3D(b.position[0], b.position[1], 0);
            minX = Math.min(minX,x); maxX = Math.max(maxX,x);
            minZ = Math.min(minZ,z); maxZ = Math.max(maxZ,z);
        }
    }

    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxZ - minZ);
    update3DGround(span * 1.3, cx, cz);

    controls3d.target.set(cx, 0, cz);
    controls3d.update();
    camera.position.set(cx - 80, 60, cz + 120);

    for (const [key, b] of Object.entries(Data.buildings)) {
        try {
            if (b.footprint && b.footprint.length >= 3) createFootprintMesh(key, b);
            else if (b.position) createBoxMesh(key, b);
        } catch(e) { console.warn('建筑失败:', key, e); }
    }

    console.log(`✅ 建筑创建完成，轮廓: ${buildingMeshes.filter(m=>m.userData.hasFootprint).length}，方盒: ${buildingMeshes.filter(m=>!m.userData.hasFootprint).length}`);
}

function update3DGround(size, cx, cz) {
    scene.children.filter(o => o.userData.isGround).forEach(o => scene.remove(o));
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshStandardMaterial({ color: 0x1a4a3a, roughness: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(cx, 0, cz);
    ground.receiveShadow = true;
    ground.userData.isGround = true;
    scene.add(ground);
    const grid = new THREE.GridHelper(size, Math.floor(size/2), 0x3a5a4a, 0x2a3a2a);
    grid.position.set(cx, 0.01, cz);
    grid.userData.isGround = true;
    scene.add(grid);
}

function createFootprintMesh(key, b) {
    const height = b.height || 12;
    const pts = b.footprint.map(([lng, lat]) => {
        const [x,,z] = CoordinateSystem.wgs84To3D(lng, lat, 0);
        return new THREE.Vector2(x, z);
    });

        // createFootprintMesh 里
    const wallTex = makeWindowTexture('#8b7a6a', 8, 3);
    const sideMat = new THREE.MeshStandardMaterial({
        map: wallTex,
        roughness: 0.8,
    });

    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
        depth: height, bevelEnabled: false
    });
    geo.rotateX(-Math.PI / 2);

    function addRooftopDetails(mesh, width, depth, height) {
        const group = new THREE.Group();

        // 女儿墙（顶部一圈矮墙）
        const parapet = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.5, 0.8, depth + 0.5),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
        );
        parapet.position.y = height / 2 + 0.4;
        group.add(parapet);

        // 水箱
        const tank = new THREE.Mesh(
            new THREE.BoxGeometry(width * 0.2, height * 0.1, depth * 0.2),
            new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.5 })
        );
        tank.position.set(width * 0.2, height / 2 + height * 0.05 + 0.8, 0);
        group.add(tank);

        mesh.add(group);
    }

    // 选中建筑时调用
    function highlightWindows(mesh) {
        const emissiveTex = makeWindowTexture('#ffe87a', 8, 3);
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach(m => {
            m.emissiveMap = emissiveTex;
            m.emissive = new THREE.Color(0xd4af37);
            m.emissiveIntensity = 0.3;
            m.needsUpdate = true;
        });
    }

    // 在 data.js 里已有 height 字段的建筑：
    // 蒙民伟楼 height:20，行政楼 height:56（18层）
    // 对没有的建筑按类型估算：
    function estimateHeight(name, osmHeight) {
        if (osmHeight) return osmHeight;
        if (name.includes('图书馆')) return 24;
        if (name.includes('体育馆')) return 18;
        if (name.includes('酒店'))   return 60;
        if (name.includes('学院'))   return 18;
        if (name.includes('舍'))     return 20;
        return 12;
    }

    // Fix: 侧面纯色 + 顶面纹理（如果有）
    const tex = buildingTextures[key];
    const sideMat = new THREE.MeshStandardMaterial({
        color: get3DBuildingColor(b.name), roughness: 0.7, metalness: 0.1
    });
    const topMat = new THREE.MeshStandardMaterial({
        map: tex || null,
        color: tex ? 0xffffff : get3DBuildingColor(b.name),
        roughness: 0.8
    });

    const mesh = new THREE.Mesh(geo, [sideMat, topMat]);
    mesh.castShadow = mesh.receiveShadow = true;

    // Fix: userData 包含完整建筑数据 + puzzleEvent
    const puzzleKey = key + '_puzzle';
    mesh.userData = {
        id: key,
        name: b.name,
        description: b.description,
        buildingData: b,                              // 完整建筑对象
        puzzleEvent: Data.puzzleEvents?.[puzzleKey],  // 对应的谜题（含audioPattern）
        hasFootprint: true,
    };

    scene.add(mesh);
    buildingMeshes.push(mesh);
}

function createBoxMesh(key, b) {
    const [x,,z] = CoordinateSystem.pixelTo3D(b.position[0], b.position[1], 0);
    const height = b.height || 12;

    const tex = buildingTextures[key];
    const material = new THREE.MeshStandardMaterial({
        map: tex || null,
        color: tex ? 0xffffff : get3DBuildingColor(b.name),
        roughness: 0.7
    });

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(6, height, 6), material);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;

    const puzzleKey = key + '_puzzle';
    mesh.userData = {
        id: key,
        name: b.name,
        description: b.description,
        buildingData: b,
        puzzleEvent: Data.puzzleEvents?.[puzzleKey],
        hasFootprint: false,
    };

    scene.add(mesh);
    buildingMeshes.push(mesh);
}

function get3DBuildingColor(name) {
    if (name.includes('图书馆'))                           return 0x4a90e2;
    if (name.includes('舍'))                              return 0x90ee90;
    if (name.includes('教学楼'))                           return 0xffd700;
    if (name.includes('体育馆') || name.includes('操场'))  return 0xff6b6b;
    if (name.includes('酒店') || name.includes('宾馆'))    return 0xda70d6;
    return 0x8b7355;
}

// ── 交互 ──────────────────────────────────────────────────────────
function setup3DInteraction() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    renderer.domElement.addEventListener('click', e => {
        mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(buildingMeshes, true);
        if (!hits.length) return;
        let obj = hits[0].object;
        while (obj && !obj.userData.id) obj = obj.parent;
        if (obj) select3DBuilding(obj);
    });
}

function select3DBuilding(mesh) {
    if (selectedBuilding3D) {
        const m = selectedBuilding3D.material;
        if (Array.isArray(m)) m.forEach(mat => mat.emissive?.setHex(0x000000));
        else m.emissive?.setHex(0x000000);
    }
    selectedBuilding3D = mesh;
    const m = mesh.material;
    if (Array.isArray(m)) m.forEach(mat => mat.emissive?.setHex(0xd4af37));
    else m.emissive?.setHex(0xd4af37);

    // 显示建筑信息 + 音频状态
    const puzzle = mesh.userData.puzzleEvent;
    const hasAudio = puzzle && puzzle.audioPattern;
    document.getElementById('3d-building-name').textContent = mesh.userData.name;
    document.getElementById('3d-building-desc').textContent = mesh.userData.description || '暂无描述';
    document.getElementById('3d-audio-hint').textContent = hasAudio
        ? `🎵 谜题音频：${puzzle.audioPattern}`
        : '暂无关联音频';
    document.getElementById('3d-info-panel').style.display = 'block';

    smoothMove3DCamera(
        new THREE.Vector3(mesh.position.x, mesh.position.y + 10, mesh.position.z + 30),
        mesh.position
    );
}

function close3DInfo() {
    document.getElementById('3d-info-panel').style.display = 'none';
    if (selectedBuilding3D) {
        const m = selectedBuilding3D.material;
        if (Array.isArray(m)) m.forEach(mat => mat.emissive?.setHex(0x000000));
        else m.emissive?.setHex(0x000000);
        selectedBuilding3D = null;
    }
    stop3DAudio();
}

// ── 音频播放（Fix: 正确 URL + userData.puzzleEvent）────────────────
function play3DSound() {
    if (!selectedBuilding3D) return;

    const key = selectedBuilding3D.userData.id;
    const puzzleKey = key + '_puzzle';
    const puzzle = Data.puzzleEvents && Data.puzzleEvents[puzzleKey];

    const pos = selectedBuilding3D.position;

    let audioUrl = null;
    if (puzzle && puzzle.audioPattern) {
        audioUrl = `/default_audio/${encodeURIComponent(puzzle.audioPattern)}.mp3`;
    }

    if (audioUrl) {
        play3DSpatialAudio(audioUrl, pos);
    } else {
        alert(`🎵 ${selectedBuilding3D.userData.name} 暂无音频`);
    }
}

// ── 音频空间化系统 ────────────────────────────────────────────────
let audioCtx = null;
let activePanner = null;
let activeSource = null;

function init3DAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function play3DSpatialAudio(audioUrl, buildingPosition) {
    init3DAudio();

    if (activeSource) {
        try { activeSource.stop(); } catch(e) {}
        activeSource = null;
    }
    if (activePanner) {
        activePanner.disconnect();
        activePanner = null;
    }

    fetch(audioUrl)
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.arrayBuffer();
        })
        .then(buf => audioCtx.decodeAudioData(buf))
        .then(decoded => {
            const source = audioCtx.createBufferSource();
            source.buffer = decoded;

            const panner = audioCtx.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 10;
            panner.maxDistance = 200;
            panner.rolloffFactor = 1.5;

            panner.positionX.value = buildingPosition.x || 0;
            panner.positionY.value = buildingPosition.y || 0;
            panner.positionZ.value = buildingPosition.z || 0;

            source.connect(panner);
            panner.connect(audioCtx.destination);
            source.start();

            activeSource = source;
            activePanner = panner;
            startListenerTracking();
        })
        .catch(e => {
            console.warn('空间音频失败，降级播放:', e);
            // 降级：普通 Audio 播放
            const audio = new Audio(audioUrl);
            audio.play().catch(err => {
                alert(`音频加载失败：${audioUrl}\n${err.message}`);
            });
        });
}

let listenerTracking = false;
function startListenerTracking() {
    if (listenerTracking) return;
    listenerTracking = true;
    function tick() {
        if (!audioCtx || !activePanner) { listenerTracking = false; return; }
        const pos = camera.position;
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        const listener = audioCtx.listener;
        if (listener.positionX) {
            listener.positionX.value = pos.x;
            listener.positionY.value = pos.y;
            listener.positionZ.value = pos.z;
            listener.forwardX.value = dir.x;
            listener.forwardY.value = dir.y;
            listener.forwardZ.value = dir.z;
            listener.upX.value = 0;
            listener.upY.value = 1;
            listener.upZ.value = 0;
        }
        requestAnimationFrame(tick);
    }
    tick();
}

function stop3DAudio() {
    if (activeSource) {
        try { activeSource.stop(); } catch(e) {}
        activeSource = null;
    }
    if (activePanner) {
        activePanner.disconnect();
        activePanner = null;
    }
    listenerTracking = false;
}

// ── 相机平滑移动 ──────────────────────────────────────────────────
function smoothMove3DCamera(targetPos, lookAt) {
    const startPos = camera.position.clone();
    const startTarget = controls3d.target.clone();
    const start = performance.now();
    (function tick() {
        const t = Math.min((performance.now() - start) / 1000, 1);
        const e = 1 - Math.pow(1 - t, 3);
        camera.position.lerpVectors(startPos, targetPos, e);
        controls3d.target.lerpVectors(startTarget, lookAt, e);
        if (t < 1) requestAnimationFrame(tick);
    })();
}

function toggleView3D() {
    const cx = controls3d.target.x, cz = controls3d.target.z;
    const views = [
        { pos: [cx - 80, 60,  cz + 120], target: [cx, 0, cz] },
        { pos: [cx,      150, cz],        target: [cx, 0, cz] },
        { pos: [cx - 50, 30,  cz - 50],  target: [cx, 10, cz] }
    ];
    viewMode3D = (viewMode3D + 1) % views.length;
    smoothMove3DCamera(
        new THREE.Vector3(...views[viewMode3D].pos),
        new THREE.Vector3(...views[viewMode3D].target)
    );
}

// ── 窗口 resize ───────────────────────────────────────────────────
function on3DResize() {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ── 动画循环 ──────────────────────────────────────────────────────
function animate3D() {
    requestAnimationFrame(animate3D);
    controls3d.update();
    renderer.render(scene, camera);
}
