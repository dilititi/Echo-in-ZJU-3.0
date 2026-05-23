"""Verify footprint-centroid pixel positions for all 26 buildings.

Replicates the bounding-box-fit logic in static/js/bootstrap.js so we can
visualise where each marker actually lands without booting the page.

Outputs:
  - Console table: id, name, centroid pixel [y,x], in-canvas, nearest neighbour
  - scripts/centroid_layout.png: scatter of all marker centres labelled by id
"""
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_JS = os.path.join(ROOT, 'static', 'js', 'data.js')
OUT_PNG = os.path.join(os.path.dirname(__file__), 'centroid_layout.png')

CANVAS = 1000
PAD = 50
OVERLAP_THRESHOLD_PX = 60  # markers within this distance are flagged


def parse_buildings(text: str) -> dict:
    """Pull {id: {name, footprint, position}} out of data.js with regex."""
    # Find the buildings block: from "buildings: {" to the matching closing brace
    start = text.index('buildings: {')
    depth = 0
    i = text.index('{', start)
    end = i
    for j in range(i, len(text)):
        if text[j] == '{': depth += 1
        elif text[j] == '}':
            depth -= 1
            if depth == 0:
                end = j
                break
    block = text[i + 1:end]

    out = {}
    # Each top-level entry: <id>: { ... },
    # Use a non-greedy match for the body, but lean on matching braces by hand.
    pos = 0
    while pos < len(block):
        m = re.match(r'\s*(\w+):\s*\{', block[pos:])
        if not m:
            pos += 1
            continue
        bid = m.group(1)
        body_start = pos + m.end()
        depth = 1
        k = body_start
        while k < len(block) and depth > 0:
            if block[k] == '{': depth += 1
            elif block[k] == '}': depth -= 1
            k += 1
        body = block[body_start:k - 1]
        out[bid] = body
        pos = k

    parsed = {}
    for bid, body in out.items():
        name_m = re.search(r"name:\s*'([^']+)'", body)
        pos_m = re.search(r'position:\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]', body)
        fp_m = re.search(r'footprint:\s*(\[\[.*?\]\])', body, re.S)
        footprint = []
        if fp_m:
            raw = fp_m.group(1)
            for pair in re.findall(r'\[\s*([0-9.+-]+)\s*,\s*([0-9.+-]+)\s*\]', raw):
                footprint.append((float(pair[0]), float(pair[1])))
        parsed[bid] = {
            'name': name_m.group(1) if name_m else bid,
            'position_orig': [int(pos_m.group(1)), int(pos_m.group(2))] if pos_m else None,
            'footprint': footprint,
        }
    return parsed


def fit_positions(buildings: dict) -> dict:
    """Replicate bootstrap.js fitBuildingPositions(). Returns {id: [py, px]}."""
    all_pts = [p for b in buildings.values() for p in b['footprint']]
    if not all_pts:
        return {}

    min_lng = min(p[0] for p in all_pts)
    max_lng = max(p[0] for p in all_pts)
    min_lat = min(p[1] for p in all_pts)
    max_lat = max(p[1] for p in all_pts)

    size = CANVAS - 2 * PAD
    lat_span = max_lat - min_lat
    lng_span = max_lng - min_lng
    cos_lat = math.cos(((min_lat + max_lat) / 2) * math.pi / 180)
    eff_lng_span = lng_span * cos_lat
    scale = size / max(lat_span, eff_lng_span)
    offset_y = PAD + (size - lat_span * scale) / 2
    offset_x = PAD + (size - eff_lng_span * scale) / 2

    out = {}
    for bid, b in buildings.items():
        fp = b['footprint']
        if len(fp) < 3:
            continue
        pts = fp[:-1] if fp[0] == fp[-1] else fp
        c_lng = sum(p[0] for p in pts) / len(pts)
        c_lat = sum(p[1] for p in pts) / len(pts)
        out[bid] = [
            offset_y + (c_lat - min_lat) * scale,
            offset_x + (c_lng - min_lng) * cos_lat * scale,
        ]
    return out


def nearest_neighbour(bid, pos, all_positions):
    best_id, best_d = None, float('inf')
    for other_id, other in all_positions.items():
        if other_id == bid: continue
        d = math.hypot(pos[0] - other[0], pos[1] - other[1])
        if d < best_d:
            best_d, best_id = d, other_id
    return best_id, best_d


def main():
    with open(DATA_JS, 'r', encoding='utf-8') as f:
        text = f.read()
    buildings = parse_buildings(text)
    positions = fit_positions(buildings)

    print(f'parsed {len(buildings)} buildings, {len(positions)} have footprints')
    print()
    print(f'{"id":34s} {"name":24s} {"y":>5s} {"x":>5s}  in?  nearest (px)')
    print('-' * 88)

    overlaps = []
    out_of_bounds = []
    for bid, b in buildings.items():
        pos = positions.get(bid)
        if pos is None:
            print(f'{bid:34s} {b["name"]:24s}     -    -   --  (no footprint)')
            continue
        in_bounds = 0 <= pos[0] <= CANVAS and 0 <= pos[1] <= CANVAS
        if not in_bounds:
            out_of_bounds.append(bid)
        nb_id, nb_d = nearest_neighbour(bid, pos, positions)
        if nb_d < OVERLAP_THRESHOLD_PX:
            overlaps.append((bid, nb_id, nb_d))
        flag = 'Y' if in_bounds else 'N'
        print(f'{bid:34s} {b["name"]:24s} {pos[0]:5.0f} {pos[1]:5.0f}  {flag}    {nb_id} ({nb_d:.0f})')

    print()
    if out_of_bounds:
        print(f'[!] {len(out_of_bounds)} buildings OUT OF [0,1000]: {out_of_bounds}')
    else:
        print('[ok] all centroids inside canvas')
    if overlaps:
        print(f'[!] {len(overlaps)} pairs within {OVERLAP_THRESHOLD_PX}px (marker overlap risk):')
        seen = set()
        for a, b, d in sorted(overlaps, key=lambda t: t[2]):
            key = tuple(sorted([a, b]))
            if key in seen: continue
            seen.add(key)
            print(f'   {a:30s} <-> {b:30s} {d:.0f} px')
    else:
        print(f'[ok] no marker pairs within {OVERLAP_THRESHOLD_PX}px')

    # Render layout
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        from matplotlib import rcParams
        rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei', 'Arial Unicode MS', 'DejaVu Sans']
        rcParams['axes.unicode_minus'] = False

        fig, ax = plt.subplots(figsize=(10, 10))
        ax.set_xlim(0, CANVAS); ax.set_ylim(0, CANVAS)  # Leaflet CRS.Simple: lat grows up
        ax.set_aspect('equal'); ax.grid(True, alpha=0.2)
        ax.set_title('Footprint centroid layout (bootstrap.js logic) — north is up')

        ax.add_patch(plt.Rectangle((PAD, PAD), CANVAS - 2*PAD, CANVAS - 2*PAD,
                                    fill=False, ec='#d4af37', ls='--', lw=1))
        for bid, pos in positions.items():
            color = 'tab:red' if bid in out_of_bounds else 'tab:blue'
            ax.scatter(pos[1], pos[0], c=color, s=60, zorder=3)
            ax.annotate(bid, (pos[1], pos[0]), xytext=(6, 4),
                        textcoords='offset points', fontsize=7, alpha=0.85)
        plt.tight_layout()
        plt.savefig(OUT_PNG, dpi=120)
        print(f'\n[saved] {OUT_PNG}')
    except ImportError:
        print('\n(matplotlib not installed; skipping PNG render)')


if __name__ == '__main__':
    main()
