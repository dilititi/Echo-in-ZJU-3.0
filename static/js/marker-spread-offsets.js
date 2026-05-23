// marker-spread-offsets.js — precomputed [dy, dx] offsets applied to each
// building's footprint-centroid pixel position so 120×120 marker thumbnails
// don't overlap. Source: scripts/force_spread_markers.py (force-directed,
// MIN_DIST=110, ANCHOR_PULL=0.018, REPEL=0.4, damped). Mean drift ~40 px,
// max ~92 px in the densest agricultural cluster.
//
// Regenerate via:  python scripts/force_spread_markers.py
// Then copy spread_offsets.json into the table below (round to 1 decimal).
window.MarkerSpreadOffsets = {
  old_management_building:        [ 30.2,  57.1],
  qiushi_plaque:                  [ -9.9,  15.4],
  qiushi_auditorium:              [-82.6,  16.0],
  old_zju_gate:                   [ 33.5, -25.0],
  zju_gymnasium:                  [  0.0,   0.0],
  zju_library:                    [ 56.2,  17.2],
  zju_crescent_building:          [-27.2,  23.2],
  south_gate:                     [-36.6, -13.9],
  medical_college:                [ -6.8,  -5.3],
  architectural_college:          [-17.6,   4.1],
  qizhen_hotel:                   [  0.0,   0.0],
  nanhua_garden:                  [ 10.6, -11.3],
  pharmacy_college:               [-10.8,   9.4],
  life_science_college:           [ 76.5,   7.7],
  agricultural_college:           [ 50.6, -61.9],
  environmental_resource_college: [ -4.9,   5.2],
  animal_science_college:         [-30.7, -87.1],
  bioengineering_food_college:    [-49.1,  21.2],
  nano_building:                  [ 39.3,  61.2],
  foreign_language_college:       [ -6.6,  16.9],
  mengmingwei_building:           [  0.0,   0.0],
  public_administration_college:  [-44.8,  51.1],
  zhu_kezhen_college:             [ 10.8, -67.7],
  humanities_college:             [ -2.8, -30.7],
  education_college:              [-19.3,  14.1],
  art_archaeology_museum:         [ 42.2, -16.7],
};
