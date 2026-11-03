"""Sharpen and compress baked plates: python post.py dusk night storm mask"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter
HERE = Path(__file__).resolve().parent
PLATES = HERE / 'plates'
OUT = HERE.parent.parent / 'site' / 'assets' / 'scene'
for name in sys.argv[1:]:
    src = PLATES / f'{name}.webp'
    im = Image.open(src).convert('RGB')
    if name == 'mask':
        im = im.resize((1280, 720), Image.LANCZOS)
        im.save(OUT / 'mask.webp', quality=88, method=6)
    else:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=85, threshold=1))
        im.save(OUT / f'{name}.webp', quality=90 if name == 'dusk' else 80, method=6)   # dusk is smooth, so 90 still comes out smallest
    print(name, (OUT / f'{name}.webp').stat().st_size // 1024, 'KB')
