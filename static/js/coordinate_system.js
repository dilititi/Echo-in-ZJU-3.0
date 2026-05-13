const CoordinateSystem = (() => {
  // 校准点：来自 data.js 的 position + 紫金港实测经纬度
  // 标定方法：在 Leaflet 卫星图上对照建筑轮廓人工点取，精度 ±5m
  // 最后标定时间：2024-05（地图版本 v1.0）
  // 如校园地图重新测绘或更换底图，需重新标定此文件所有 REF 坐标。
  // south_gate:   pixel [220, 920]  ↔  lng/lat [120.0742, 30.3043]
  // qizhen_hotel: pixel [870, 320]  ↔  lng/lat [120.0821, 30.3092]
  const REF = [
    { px: [220, 920], wgs: [120.0742, 30.3043] },
    { px: [870, 320], wgs: [120.0821, 30.3092] },
  ];

  const [p0, p1] = REF;
  const lngPerPx = (p1.wgs[0] - p0.wgs[0]) / (p1.px[0] - p0.px[0]);
  const latPerPy = (p1.wgs[1] - p0.wgs[1]) / (p1.px[1] - p0.px[1]);

  // 地面缩放：让整个校园铺满约 100×100 的 Three.js 单位
  // 像素范围约 650×600，目标约 100 单位 → scale ≈ 100/650
  const PX_RANGE = 650;
  const WORLD_SIZE = 100;
  const SCALE = WORLD_SIZE / PX_RANGE;

  return {
    pixelToWgs84(px, py) {
      return [
        p0.wgs[0] + (px - p0.px[0]) * lngPerPx,
        p0.wgs[1] + (py - p0.px[1]) * latPerPy,
      ];
    },

    wgs84ToPixel(lng, lat) {
      return [
        p0.px[0] + (lng - p0.wgs[0]) / lngPerPx,
        p0.px[1] + (lat - p0.wgs[1]) / latPerPy,
      ];
    },

    // 像素坐标 → Three.js 世界坐标（Y-up，Z向南）
    // 原点 = 像素图正中心，建筑散布在 0 附近
    pixelTo3D(px, py, height = 0) {
      const cx = (p0.px[0] + p1.px[0]) / 2;  // 图像中心 x
      const cy = (p0.px[1] + p1.px[1]) / 2;  // 图像中心 y
      return [
        (px - cx) * SCALE,
        height,
        (py - cy) * SCALE,   // 像素 Y → Three.js Z（不翻转，保持方向一致）
      ];
    },

    wgs84To3D(lng, lat, height = 0) {
      const [px, py] = this.wgs84ToPixel(lng, lat);
      return this.pixelTo3D(px, py, height);
    },

    SCALE,
  };
})();
