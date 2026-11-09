"""Generates the raster textures used by the site. Run: python3 tools/make-textures.py"""
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

random.seed(7); np.random.seed(7)
OUT = "assets/img/textures/"

def tile_blur(arr, radius):
    """Gaussian blur that wraps around, so the result tiles seamlessly."""
    h, w = arr.shape
    big = np.tile(arr, (3, 3))
    im = Image.fromarray(np.clip(big, 0, 255).astype("uint8")).filter(ImageFilter.GaussianBlur(radius))
    return np.asarray(im, dtype="float32")[h:2*h, w:2*w]

# ---- paper: warm base + multi-scale grain + fibres (tileable) ----------------
S = 900
base = np.zeros((S, S), dtype="float32") + 128
for radius, amp in ((1.2, 30), (4, 34), (18, 16), (60, 6)):
    n = np.random.rand(S, S).astype("float32") * 255
    b = tile_blur(n, radius)
    b = (b - b.mean()) / (b.std() + 1e-6)
    base += b * amp * 0.35
fib = Image.new("L", (S * 3, S * 3), 0)
d = ImageDraw.Draw(fib)
for _ in range(2600):
    x, y = random.uniform(0, S * 3), random.uniform(0, S * 3)
    a, l = random.uniform(0, math.pi), random.uniform(10, 38)
    d.line([x, y, x + math.cos(a) * l, y + math.sin(a) * l], fill=random.randint(40, 120), width=1)
fib = np.asarray(fib.filter(ImageFilter.GaussianBlur(0.6)), dtype="float32")[S:2*S, S:2*S]
base += fib * 0.22
base = np.clip(base, 0, 255) / 255.0
paper = np.zeros((S, S, 3), dtype="float32")
tone = np.array([245, 239, 228], dtype="float32")
z = (base - base.mean()) / (base.std() + 1e-6)
paper[:] = tone + z[..., None] * np.array([7, 7.5, 9], dtype="float32")
paper = np.clip(paper, 0, 255).astype("uint8")
Image.fromarray(paper).save(OUT + "paper.webp", quality=78, method=6)

# ---- noise: fine monochrome grain, tileable PNG with alpha -----------------
N = 256
g = np.random.normal(128, 55, (N, N)).clip(0, 255).astype("uint8")
noise = Image.merge("LA", (Image.fromarray(g), Image.fromarray(np.full((N, N), 255, "uint8"))))
noise.save(OUT + "noise.png", optimize=True)

# ---- brush: dry-brush strokes as a white alpha mask (colour it with CSS) ----
W, H = 1600, 260
brush = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(brush)
def stroke(y0, thick, x0, x1, wob):
    bristles = int(thick * 1.6)
    for i in range(bristles):
        off = (i / bristles - 0.5) * thick
        a = random.randint(150, 255)
        sx = x0 + random.uniform(0, 60) + abs(off) * random.uniform(0, 2.2)
        ex = x1 - random.uniform(0, 140) - abs(off) * random.uniform(0, 3.0)
        pts, ph = [], random.uniform(0, 6.28)
        x = sx
        while x < ex:
            y = y0 + off + math.sin(x / 210 + ph * 0.1) * wob + math.sin(x / 47 + ph) * 1.6
            pts.append((x, y)); x += 12
        if len(pts) < 2: continue
        # dry-brush gaps: break the line into pieces
        cut = 0
        while cut < len(pts) - 2:
            ln = random.randint(8, 60)
            seg = pts[cut:cut + ln]
            if len(seg) > 1 and random.random() > 0.12:
                d.line(seg, fill=a, width=random.randint(2, 4))
            cut += ln + random.randint(0, 2)
stroke(78, 70, 30, W - 30, 14)
stroke(168, 56, 80, W - 60, -10)
brush = brush.filter(ImageFilter.GaussianBlur(0.7))
mask = Image.new("LA", (W, H), (255, 0)); mask.putalpha(brush)
mask.save(OUT + "brush.webp", quality=80, method=6, lossless=False)

print("ok")
