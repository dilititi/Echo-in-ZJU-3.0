/* marker-position-overrides.js
 * Per-building [y, x] position overrides applied by bootstrap.js AFTER
 * the footprint centroid fit + force-directed spread offsets.
 *
 * Use this when a building's footprint data is wrong but the satellite
 * image is right: open ?calibrate=markers, drag the marker to the
 * correct spot on the satellite, click "复制 overrides", paste the
 * resulting object into the empty {} below.
 *
 * Empty by default — bootstrap.js is a no-op when no entries here.
 * Keys must match Data.buildings ids verbatim.
 */
window.MarkerPositionOverrides = {
  // example:
  // zju_library: [512.3, 488.7],
};
