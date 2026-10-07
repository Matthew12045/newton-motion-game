"""Turn the character drawings in assets/ into the sprites embedded in index.html.

Cuts the white paper out of each drawing (so Ryuka can stand on the box and fly over the ice),
scales it down to WebP, makes a 180×128 head-and-shoulders portrait for the dialogue bar,
and rewrites the data URIs in index.html's ART and FACE objects in place.

    python3 tools/embed_sprites.py

Needs Pillow, numpy and scipy. If a drawing changes, check its portrait and adjust FACE_CROP.
"""
import base64, io, pathlib, re
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ROOT = pathlib.Path(__file__).resolve().parent.parent
# key in ART/FACE: (file in assets/, outline-gap radius in px, sprite height in px)
SPRITES = {
    'ryuka': ('ryuka.jpg', 12, 400),
    'yuan':  ('Yu-An.jpg', 8, 440),
    'kay':   ('Kay.jpg', 8, 440),
}
# portrait crop (x, y, width) in the cut-out drawing's pixels; height follows the 180:128 box
FACE_CROP = {
    'ryuka': (39, 40, 956),
    'yuan':  (22, 20, 1320),
    'kay':   (49, 30, 1130),
}

def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r

def cutout(path, r):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    mn, mx = a.min(axis=2), a.max(axis=2)
    paper = (mn >= 249) & (mx - mn <= 4)               # untouched paper is pure white; skin is tinted
    ink = ~paper
    lab, n = ndi.label(ink)                             # drop stray specks
    sizes = ndi.sum(ink, lab, range(1, n + 1))
    ink = np.isin(lab, 1 + np.flatnonzero(sizes >= 400))
    closed = ndi.binary_dilation(ink, structure=disk(r))   # bridge gaps in the sketchy outline
    lab, n = ndi.label(~closed)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    for _ in range(r + 2):                              # give the halo back, only through paper
        bg = bg | (ndi.binary_dilation(bg) & paper)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    out = im.copy()
    out.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.0)))
    return out.crop(Image.fromarray(alpha).getbbox())

def webp_uri(img, **kw):
    buf = io.BytesIO()
    img.save(buf, 'WEBP', method=6, **kw)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()

html_path = ROOT / 'index.html'
html = html_path.read_text()
for key, (name, r, h) in SPRITES.items():
    img = cutout(ROOT / 'assets' / name, r)
    sprite = img.resize((round(img.width * h / img.height), h), Image.LANCZOS)
    x0, y0, cw = FACE_CROP[key]
    head = img.crop((x0, y0, x0 + cw, y0 + round(cw * 128 / 180)))
    face = Image.new('RGBA', head.size, 'white')
    face.alpha_composite(head)
    face = face.convert('RGB').resize((360, 256), Image.LANCZOS)
    for block, uri in (('ART', webp_uri(sprite, quality=88)), ('FACE', webp_uri(face, quality=86))):
        pat = re.compile(r"(const %s = \{.*?\n  %s:')[^']*(')" % (block, key), re.S)
        html, n = pat.subn(lambda m: m.group(1) + uri + m.group(2), html, count=1)
        assert n == 1, f'{block}.{key} not found in index.html'
    print(f'{key}: sprite {sprite.size}, portrait 180×128')
html_path.write_text(html)
