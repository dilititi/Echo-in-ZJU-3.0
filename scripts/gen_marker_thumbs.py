"""Generate 240x240 thumbnails of static/layers/*.{jpg,png} into static/layers/thumbs/.

Markers render at 120x120 CSS px; 240x240 covers 2x DPR.
Run once whenever new building images are added.
"""
import os
import sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'static', 'layers')
DST_DIR = os.path.join(SRC_DIR, 'thumbs')
SIZE = (240, 240)

os.makedirs(DST_DIR, exist_ok=True)

exts = ('.jpg', '.jpeg', '.png')
sources = [f for f in os.listdir(SRC_DIR)
           if f.lower().endswith(exts) and os.path.isfile(os.path.join(SRC_DIR, f))]

total_src = 0
total_dst = 0
for name in sources:
    src = os.path.join(SRC_DIR, name)
    dst = os.path.join(DST_DIR, name)
    src_size = os.path.getsize(src)
    total_src += src_size
    try:
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)
            im.thumbnail(SIZE, Image.LANCZOS)
            if name.lower().endswith('.png') and im.mode in ('RGBA', 'LA'):
                im.save(dst, optimize=True)
            else:
                if im.mode != 'RGB':
                    im = im.convert('RGB')
                # JPEG at q=72 looks fine at 120x120 display
                jpg_dst = os.path.splitext(dst)[0] + '.jpg'
                im.save(jpg_dst, 'JPEG', quality=72, optimize=True, progressive=True)
                dst = jpg_dst
        dst_size = os.path.getsize(dst)
        total_dst += dst_size
        print(f'{name:40s} {src_size//1024:>5d} KB -> {dst_size//1024:>4d} KB')
    except Exception as e:
        print(f'  ! {name}: {e}', file=sys.stderr)

print(f'\nTotal: {total_src/1024/1024:.2f} MB -> {total_dst/1024/1024:.2f} MB '
      f'({100 * total_dst / total_src:.1f}%)')
