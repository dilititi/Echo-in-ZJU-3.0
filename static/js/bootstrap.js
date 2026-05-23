// bootstrap.js — 最后加载，启动 App
// 用 CoordinateSystem.BOUNDS（卫星图实际范围）做线性映射
// 与 index.html imageOverlay 的 [[south,west],[north,east]] 完全一致

(function fitBuildingPositions() {
    const buildings = Object.values(Data.buildings);
    const { BOUNDS } = CoordinateSystem;
    if (!BOUNDS) return;

    const CANVAS = 1000;

    for (const b of buildings) {
        if (!Array.isArray(b.footprint) || b.footprint.length < 3) continue;

        const fp = b.footprint;
        const pts = fp[0] === fp[fp.length - 1] ? fp.slice(0, -1) : fp;

        // footprint 中心经纬度
        let sLng = 0, sLat = 0;
        for (const p of pts) { sLng += p[0]; sLat += p[1]; }
        const cLng = sLng / pts.length;
        const cLat = sLat / pts.length;

        // 线性映射到 [0, 1000]，Y 轴向下（纬度越大越靠上 → py 越小）
        // Leaflet CRS.Simple position = [y, x]
        const px = (cLng - BOUNDS.west)  / (BOUNDS.east  - BOUNDS.west)  * CANVAS;
        const py = (BOUNDS.north - cLat) / (BOUNDS.north - BOUNDS.south) * CANVAS;
        b.position = [py, px];
    }

    // spread offsets
    const spread = window.MarkerSpreadOffsets;
    const params = new URLSearchParams(window.location.search);
    if (spread && params.get('spread') !== '0') {
        for (const [id, b] of Object.entries(Data.buildings)) {
            const off = spread[id];
            if (!off || !Array.isArray(b.position)) continue;
            b.position = [b.position[0] + off[0], b.position[1] + off[1]];
        }
    }

    // position overrides
    const overrides = window.MarkerPositionOverrides;
    if (overrides && params.get('calibrate') !== 'markers') {
        for (const [id, pos] of Object.entries(overrides)) {
            if (!Array.isArray(pos) || pos.length !== 2) continue;
            if (Data.buildings[id]) Data.buildings[id].position = [pos[0], pos[1]];
        }
    }
})();

App.init();

if (typeof IllustratedLayer !== 'undefined') IllustratedLayer.init();
