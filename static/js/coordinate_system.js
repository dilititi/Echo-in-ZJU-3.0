// coordinate_system.js — 自动生成，基于新 OSM 数据
// 卫星图边界：北30.31317 南30.29752 东120.08756 西120.06529

const CoordinateSystem = (() => {

    const BOUNDS = {
        north:  30.31317,
        south:  30.29752,
        east:  120.08756,
        west:  120.06529,
    };

    const CANVAS = 1000;

    // 经纬度 → 像素（与卫星图 imageOverlay 完全一致的线性映射）
    function wgs84ToPixel(lng, lat) {
        const x = (lng - BOUNDS.west)  / (BOUNDS.east  - BOUNDS.west)  * CANVAS;
        const y = (BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south) * CANVAS;
        return [x, y];
    }

    // 像素 → 经纬度
    function pixelToWgs84(px, py) {
        const lng = BOUNDS.west  + (px / CANVAS) * (BOUNDS.east  - BOUNDS.west);
        const lat = BOUNDS.north - (py / CANVAS) * (BOUNDS.north - BOUNDS.south);
        return [lng, lat];
    }

    // 经纬度 → Three.js 3D（原点在校园中心）
    const SCALE = 0.1;
    const MID_LAT = (BOUNDS.south + BOUNDS.north) / 2;
    const MID_LNG = (BOUNDS.west  + BOUNDS.east)  / 2;
    const M_PER_DEG_LNG = 111320 * Math.cos(MID_LAT * Math.PI / 180);
    const M_PER_DEG_LAT = 110540;

    function wgs84To3D(lng, lat, height = 0) {
        const x =  (lng - MID_LNG) * M_PER_DEG_LNG * SCALE;
        const z = -(lat - MID_LAT) * M_PER_DEG_LAT * SCALE;
        return [x, height, z];
    }

    function pixelTo3D(px, py, height = 0) {
        const [lng, lat] = pixelToWgs84(px, py);
        return wgs84To3D(lng, lat, height);
    }

    return { wgs84ToPixel, pixelToWgs84, wgs84To3D, pixelTo3D, BOUNDS, SCALE };

})();
