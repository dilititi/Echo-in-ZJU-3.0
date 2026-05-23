"""Force-directed marker spread — PoC.

Marker thumbnails render at 120x120 CSS px. Two markers within ~120 px
visually overlap on the 1000x1000 canvas. Real geography puts ~6 buildings
in a single agricultural cluster (~25 px apart), which is unreadable.

Algorithm:
  Each marker has an anchor = footprint centroid (computed by bootstrap.js).
  Forces:
    * REPEL: every pair within MIN_DIST pushes apart, magnitude proportional
             to overlap (MIN_DIST - distance).
    * ANCHOR: every marker pulled toward its anchor (proportional to drift).
  Iterate until total displacement falls below TOL.

Output:
  scripts/spread_layout.png : side-by-side original vs spread
  scripts/spread_offsets.json : { buildingId: [dy, dx] } drift from anchor
"""
import json
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(__file__))
from verify_centroid_positions import parse_buildings, fit_positions, CANVAS, PAD

OUT_PNG = os.path.join(os.path.dirname(__file__), 'spread_layout.png')
OUT_JSON = os.path.join(os.path.dirname(__file__), 'spread_offsets.json')

MIN_DIST = 110          # target separation (px); marker is 120, leave a hair
ANCHOR_PULL = 0.018     # spring constant toward original centroid (weaker = more room to spread)
REPEL_STRENGTH = 0.4    # per-step push factor (smaller = no oscillation)
DAMPING = 0.85          # velocity damping (Verlet-ish)
MAX_ITER = 1500
TOL = 0.04              # stop when max single-step displacement < this


def step(positions, anchors):
    forces = {bid: [0.0, 0.0] for bid in positions}
    ids = list(positions.keys())
    # pairwise repulsion
    for i, a in enumerate(ids):
        ay, ax = positions[a]
        for b in ids[i + 1:]:
            by, bx = positions[b]
            dy = ay - by; dx = ax - bx
            d = math.hypot(dy, dx)
            if d < 1e-3:
                # coincident — nudge in arbitrary direction
                dy, dx = 1.0, 0.0
                d = 1.0
            if d < MIN_DIST:
                overlap = (MIN_DIST - d)
                # unit vector × overlap × strength
                push = REPEL_STRENGTH * overlap / d
                forces[a][0] += dy * push
                forces[a][1] += dx * push
                forces[b][0] -= dy * push
                forces[b][1] -= dx * push
    # anchor pull
    for bid, pos in positions.items():
        ay, ax = anchors[bid]
        forces[bid][0] += (ay - pos[0]) * ANCHOR_PULL
        forces[bid][1] += (ax - pos[1]) * ANCHOR_PULL
    return forces


def relax(anchors):
    positions = {bid: list(a) for bid, a in anchors.items()}
    velocity = {bid: [0.0, 0.0] for bid in anchors}
    for it in range(MAX_ITER):
        forces = step(positions, anchors)
        max_step = 0.0
        for bid, (fy, fx) in forces.items():
            velocity[bid][0] = velocity[bid][0] * DAMPING + fy
            velocity[bid][1] = velocity[bid][1] * DAMPING + fx
            positions[bid][0] += velocity[bid][0]
            positions[bid][1] += velocity[bid][1]
            # clip into canvas
            positions[bid][0] = min(CANVAS - PAD, max(PAD, positions[bid][0]))
            positions[bid][1] = min(CANVAS - PAD, max(PAD, positions[bid][1]))
            max_step = max(max_step, math.hypot(velocity[bid][0], velocity[bid][1]))
        if max_step < TOL:
            print(f'converged at iter {it+1}, max step {max_step:.4f}')
            return positions
    print(f'hit MAX_ITER ({MAX_ITER}), max step {max_step:.4f}')
    return positions


def overlap_pairs(positions, threshold=60):
    ids = list(positions.keys())
    pairs = []
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            d = math.hypot(positions[a][0] - positions[b][0],
                           positions[a][1] - positions[b][1])
            if d < threshold:
                pairs.append((a, b, d))
    return pairs


def main():
    with open(os.path.join(ROOT, 'static', 'js', 'data.js'), 'r', encoding='utf-8') as f:
        text = f.read()
    buildings = parse_buildings(text)
    anchors = fit_positions(buildings)
    spread = relax(anchors)

    # Quality metrics
    before_pairs = overlap_pairs(anchors, MIN_DIST)
    after_pairs  = overlap_pairs(spread, MIN_DIST)
    max_drift = max(
        math.hypot(spread[b][0] - anchors[b][0], spread[b][1] - anchors[b][1])
        for b in anchors
    )
    mean_drift = sum(
        math.hypot(spread[b][0] - anchors[b][0], spread[b][1] - anchors[b][1])
        for b in anchors
    ) / len(anchors)

    print(f'\noverlap pairs < {MIN_DIST}px:  before={len(before_pairs)}  after={len(after_pairs)}')
    print(f'drift from anchor:           max={max_drift:.1f}px  mean={mean_drift:.1f}px')

    if after_pairs:
        print('\nremaining tight pairs:')
        for a, b, d in sorted(after_pairs, key=lambda t: t[2])[:5]:
            print(f'  {a:32s} <-> {b:32s} {d:.0f} px')

    # Save offsets for JS port
    offsets = {
        bid: [spread[bid][0] - anchors[bid][0], spread[bid][1] - anchors[bid][1]]
        for bid in anchors
    }
    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(offsets, f, indent=2)
    print(f'[saved] {OUT_JSON}')

    # Render comparison
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib import rcParams
    rcParams['font.sans-serif'] = ['Microsoft YaHei', 'SimHei', 'Arial Unicode MS', 'DejaVu Sans']
    rcParams['axes.unicode_minus'] = False

    fig, axes = plt.subplots(1, 2, figsize=(20, 10))

    for ax, (positions, title) in zip(
        axes,
        [(anchors, f'BEFORE — {len(before_pairs)} overlap pairs < {MIN_DIST}px'),
         (spread,  f'AFTER  — {len(after_pairs)} overlap pairs < {MIN_DIST}px (mean drift {mean_drift:.0f}px)')],
    ):
        ax.set_xlim(0, CANVAS); ax.set_ylim(0, CANVAS)
        ax.set_aspect('equal'); ax.grid(True, alpha=0.2)
        ax.set_title(title, fontsize=12)
        ax.add_patch(plt.Rectangle((PAD, PAD), CANVAS - 2*PAD, CANVAS - 2*PAD,
                                    fill=False, ec='#d4af37', ls='--', lw=1))
        for bid, pos in positions.items():
            # draw marker hit box (120x120)
            ax.add_patch(plt.Rectangle((pos[1] - 60, pos[0] - 60), 120, 120,
                                        fill=False, ec='#1b263b', alpha=0.25, lw=0.6))
            ax.scatter(pos[1], pos[0], c='#9c3a2e', s=40, zorder=3)
            ax.annotate(bid, (pos[1], pos[0]), xytext=(6, 4),
                        textcoords='offset points', fontsize=7, alpha=0.85)
        # draw drift arrows in AFTER plot
        if positions is spread:
            for bid in anchors:
                if math.hypot(spread[bid][0] - anchors[bid][0],
                              spread[bid][1] - anchors[bid][1]) > 3:
                    ax.annotate('', xy=(spread[bid][1], spread[bid][0]),
                                xytext=(anchors[bid][1], anchors[bid][0]),
                                arrowprops=dict(arrowstyle='->', color='#7a8b6f',
                                                alpha=0.6, lw=0.8))

    plt.tight_layout()
    plt.savefig(OUT_PNG, dpi=110)
    print(f'[saved] {OUT_PNG}')


if __name__ == '__main__':
    main()
