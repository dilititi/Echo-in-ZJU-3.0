// bootstrap.js — 最后加载，启动 App（此时所有模块已挂载完毕）
//
// 在 App.init() 之前用 WGS84 footprint 自动适配覆写 Data.buildings.<id>.position。
// 不复用 coordinate_system.wgs84ToPixel：它的 REF 只有 2 个锚点
// （south_gate + qizhen_hotel），校园南北端建筑会落在 [0,1000] 画布之外。
// 这里做包围盒 fit + cos(lat) 修正以保留真实宽高比。
// position 写回 Leaflet CRS.Simple latLng 习惯 [y, x]，y 朝北。

(function fitBuildingPositions() {
  const buildings = Object.values(Data.buildings);

  let minLng =  Infinity, maxLng = -Infinity;
  let minLat =  Infinity, maxLat = -Infinity;
  for (const b of buildings) {
    if (!Array.isArray(b.footprint)) continue;
    for (const p of b.footprint) {
      if (p[0] < minLng) minLng = p[0];
      if (p[0] > maxLng) maxLng = p[0];
      if (p[1] < minLat) minLat = p[1];
      if (p[1] > maxLat) maxLat = p[1];
    }
  }
  if (!isFinite(minLng)) return;

  const CANVAS = 1000;
  const PAD = 50;
  const SIZE = CANVAS - 2 * PAD;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const cosLat = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  // Treat lng as lng*cosLat so 1° east ≈ same physical distance as 1° north
  const effLngSpan = lngSpan * cosLat;
  const scale = SIZE / Math.max(latSpan, effLngSpan);
  const offsetY = PAD + (SIZE - latSpan * scale) / 2;
  const offsetX = PAD + (SIZE - effLngSpan * scale) / 2;

  for (const b of buildings) {
    if (!Array.isArray(b.footprint) || b.footprint.length < 3) continue;
    const fp = b.footprint;
    const pts = fp[0] === fp[fp.length - 1] ? fp.slice(0, -1) : fp;
    let sLng = 0, sLat = 0;
    for (const p of pts) { sLng += p[0]; sLat += p[1]; }
    const cLng = sLng / pts.length;
    const cLat = sLat / pts.length;
    b.position = [
      offsetY + (cLat - minLat) * scale,
      offsetX + (cLng - minLng) * cosLat * scale,
    ];
  }
})();

App.init();

if (typeof IllustratedLayer !== 'undefined') IllustratedLayer.init();
