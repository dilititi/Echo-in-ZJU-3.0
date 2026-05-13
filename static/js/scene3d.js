// ── scene3d.js：3D 场景全部逻辑 ─────────────────────────────────

let scene, camera, renderer, controls3d, textureLoader;
let buildingMeshes = [];
let selectedBuilding3D = null;
let scene3dReady = false;
let viewMode3D = 0;
let groundMesh = null;
let groundGrid = null;

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
    Audio3D.stopRain();
    document.getElementById('scene-3d').style.display = 'none';
    document.getElementById('map').style.display = '';
    document.getElementById('controlPanel').style.display = '';
    document.getElementById('layerControl').style.display = '';
    document.getElementById('sidePanel').style.display = '';
    document.getElementById('topToolbar').style.display = '';
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
        textureLoader = new THREE.TextureLoader();
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
        Audio3D.init();
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

// ── 建筑 ──────────────────────────────────────────────────────────
function create3DBuildings() {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    for (const [key, b] of Object.entries(Data.buildings)) {
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

        try {
            if (b.footprint && b.footprint.length >= 3) createFootprintMesh(key, b);
            else if (b.position) createBoxMesh(key, b);
        } catch(e) { console.warn('建筑失败:', key, e); }
    }

    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxZ - minZ);
    update3DGround(span * 1.3, cx, cz);

    controls3d.target.set(cx, 0, cz);
    controls3d.update();
    camera.position.set(cx - 80, 60, cz + 120);
}

function update3DGround(size, cx, cz) {
    if (groundMesh) { scene.remove(groundMesh); groundMesh = null; }
    if (groundGrid) { scene.remove(groundGrid); groundGrid = null; }

    // ── 卫星地图纹理 ──────────────────────────────────────────────
    const satTex = textureLoader.load('/assets/紫金港卫星地图.png');
    satTex.wrapS = satTex.wrapT = THREE.ClampToEdgeWrapping;

    // 图片经纬度范围（目视估算，部署后微调 offset）
    // 图片覆盖：lng 120.068~120.092, lat 30.294~30.320
    const imgLngMin = 120.068, imgLngMax = 120.092;
    const imgLatMin = 30.294,  imgLatMax = 30.320;

    // 3D 世界对应的经纬度范围
    const worldLngMin = 120.07420, worldLngMax = 120.08589;
    const worldLatMin = 30.30080,  worldLatMax = 30.31508;

    // 计算 UV offset 和 repeat（让图片只显示校园部分）
    const lngSpan = imgLngMax - imgLngMin;
    const latSpan = imgLatMax - imgLatMin;

    const uOffset = (worldLngMin - imgLngMin) / lngSpan;
    const vOffset = (imgLatMax - worldLatMax) / latSpan;  // V 轴翻转
    const uRepeat = (worldLngMax - worldLngMin) / lngSpan;
    const vRepeat = (worldLatMax - worldLatMin) / latSpan;

    satTex.offset.set(uOffset, vOffset);
    satTex.repeat.set(uRepeat, vRepeat);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshStandardMaterial({
            map: satTex,
            roughness: 0.9,
            metalness: 0.0,
        })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(cx, -0.1, cz);
    ground.receiveShadow = true;
    ground.userData.isGround = true;
    groundMesh = ground;
    scene.add(groundMesh);

    // 网格线（半透明叠加，帮助调试对齐）
    const grid = new THREE.GridHelper(size, Math.floor(size/4), 0x444444, 0x333333);
    grid.material.opacity = 0.15;
    grid.material.transparent = true;
    grid.position.set(cx, 0.01, cz);
    grid.userData.isGround = true;
    groundGrid = grid;
    scene.add(groundGrid);
}

function createFootprintMesh(key, b) {
    const height = b.height || 12;
    const pts = b.footprint.map(([lng, lat]) => {
        const [x,,z] = CoordinateSystem.wgs84To3D(lng, lat, 0);
        return new THREE.Vector2(x, z);
    });
    const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: height, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: get3DBuildingColor(b.name), roughness: 0.7, metalness: 0.1
    }));
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData = { id: key, name: b.name, description: b.description };
    scene.add(mesh);
    buildingMeshes.push(mesh);
}

function createBoxMesh(key, b) {
    const [x,,z] = CoordinateSystem.pixelTo3D(b.position[0], b.position[1], 0);
    const height = b.height || 12;
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(6, height, 6),
        new THREE.MeshStandardMaterial({ color: get3DBuildingColor(b.name), roughness: 0.7 })
    );
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.userData = { id: key, name: b.name, description: b.description };
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
// 计算真实中心
    mesh.geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    mesh.geometry.boundingBox.getCenter(center);

    // 用 center 替代 mesh.position
    smoothMove3DCamera(
        new THREE.Vector3(center.x, center.y + 10, center.z + 30),
        center
    );

    if (selectedBuilding3D) selectedBuilding3D.material.emissive?.setHex(0x000000);
    selectedBuilding3D = mesh;
    mesh.material.emissive?.setHex(0xd4af37);
    document.getElementById('3d-building-name').textContent = mesh.userData.name;
    document.getElementById('3d-building-desc').textContent = mesh.userData.description || '暂无描述';
    document.getElementById('3d-info-panel').style.display = 'block';
    smoothMove3DCamera(
        new THREE.Vector3(mesh.position.x, mesh.position.y + 10, mesh.position.z + 30),
        mesh.position
    );
}

function close3DInfo() {
    document.getElementById('3d-info-panel').style.display = 'none';
    if (selectedBuilding3D) { selectedBuilding3D.material.emissive?.setHex(0x000000); selectedBuilding3D = null; }
}

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
        Audio3D.playSpatialAudio(audioUrl, pos);
    } else {
        alert(`🎵 ${selectedBuilding3D.userData.name} 暂无音频`);
    }
}

function smoothMove3DCamera(targetPos, lookAt) {
    const startPos = camera.position.clone(), startTarget = controls3d.target.clone();
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
    const views = [
        { pos: [0, 80, 80],   target: [0,0,0] },
        { pos: [0, 150, 0],   target: [0,0,0] },
        { pos: [-50, 30, -50], target: [0,10,0] }
    ];
    viewMode3D = (viewMode3D + 1) % views.length;
    smoothMove3DCamera(new THREE.Vector3(...views[viewMode3D].pos), new THREE.Vector3(...views[viewMode3D].target));
}

function on3DResize() {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate3D() {
    requestAnimationFrame(animate3D);
    controls3d.update();
    Audio3D.updateListener(camera);
    renderer.render(scene, camera);
}
