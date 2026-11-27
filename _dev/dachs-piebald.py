# 닥스훈트 도트 강아지를 검정·흰 얼룩(파이볼드)으로 (2026-11-27 가르시아 "닥스훈트는 검은 흰색이 얼룩지게 해줘")
#
# 갈색 털만 바꾼다 — 혀는 그대로, 테두리·눈·코의 갈색빛은 같은 어둡기의 무채색으로. 털의 밝고 어두움(명암)은 그대로 두고 색만:
#   흰 칸(이마 가운데 줄·주둥이·가슴·앞발·꼬리 끝) = 흰~옅은 회색, 그 밖(귀·눈 둘레·등·옆구리·꼬리) = 검정~짙은 회색,
#   흰 칸 안에 작은 검은 점 몇 개(얼룩). 칸은 점 그림(54×66) 좌표로 정하고, 큰 그림(660×800)은 같은 비율로 써서 두 그림이 같은 무늬.
# 예전 갈색 그림은 sian-ref/dot-dogs-old에 보관. 쓰는 법(pip pillow numpy): python3 _dev/dachs-piebald.py
import os, numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = {"px": os.path.join(ROOT, "sian-ref/dot-dogs-old/dachs-px-brown.png"), "big": os.path.join(ROOT, "sian-ref/dot-dogs-old/dachs-brown.webp")}
DST = {"px": os.path.join(ROOT, "icons/dot-dogs/px/dachs.png"), "big": os.path.join(ROOT, "icons/dot-dogs/dachs.webp")}
PW, PH = 54, 66   # 점 그림 크기 — 무늬 좌표 기준

def ell(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1

# 11/27 가르시아가 보낸 사진 톤("이런 톤으로 다시") — 블랙 앤 탄 대플: 머리·귀는 검정, 눈썹 점·주둥이 양옆·볼은 탄(황갈색),
# 몸은 흰 바탕에 검은 잔점(대플). 무늬는 점 그림 좌표 — 잔점은 늘 같은 자리(seed 고정)
rng = np.random.default_rng(27)
SPOTS = []
for _ in range(70):                                                   # 몸(목 아래)·꼬리의 검은 잔점
    cx, cy = rng.uniform(10, 52), rng.uniform(37, 64)
    SPOTS.append((cx, cy, rng.uniform(0.55, 1.25)))

def part_of(x, y):
    """0 검정 · 1 흰(대플 바탕) · 2 탄 — 점 그림 좌표(실수)"""
    body = (y >= 36.5) | ((y >= 33) & (np.abs(x - 26.5) <= 9))      # 목 아래 몸
    part = np.where(body, 1, 0)
    tan = ell(x, y, 18.3, 10.6, 2.3, 1.7) | ell(x, y, 34.2, 10.6, 2.3, 1.7)          # 눈썹 점
    tan |= (ell(x, y, 26.5, 28.5, 10, 6.5) & ~ell(x, y, 26.5, 22.5, 4.2, 6))        # 주둥이 양옆·턱(콧등은 검정)
    tan |= ell(x, y, 17, 24, 3, 3) | ell(x, y, 36, 24, 3, 3)                         # 볼
    part = np.where(tan & ~body, 2, part)
    spot = np.zeros_like(x, bool)
    for cx, cy, r in SPOTS:
        spot |= ell(x, y, cx, cy, r, r)
    part = np.where(body & spot & ~((y >= 60.5) & (x <= 40)), 0, part)            # 잔점(앞발 끝은 깨끗이)
    return part

def recolor(im):
    a = np.asarray(im.convert("RGBA")).astype(float)
    H, W = a.shape[:2]
    rgb = a[..., :3]; r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    fur = (a[..., 3] > 0) & (r > g + 18) & (g > b + 8) & (lum > 52) & ~(b > 0.6 * g)   # 갈색 털 — 혀·코 반짝이·테두리는 빼고
    ys, xs = np.mgrid[0:H, 0:W]
    x = (xs + 0.5) * PW / W; y = (ys + 0.5) * PH / H
    part = part_of(x, y)
    lo, hi = np.percentile(lum[fur], 3), np.percentile(lum[fur], 97)
    t = np.clip((lum - lo) / max(1, hi - lo), 0, 1)[..., None]
    lerp = lambda c0, c1: np.array(c0) + t * (np.array(c1) - np.array(c0))
    black = lerp([24, 22, 26], [92, 86, 92])          # 윤기 도는 검정(사진처럼 살짝 따뜻하게)
    white = lerp([176, 172, 174], [252, 250, 247])
    tan = lerp([128, 70, 30], [216, 146, 82])
    col = np.where((part == 1)[..., None], white, np.where((part == 2)[..., None], tan, black))
    out = a.copy()
    out[..., :3] = np.where(fur[..., None], col, rgb)
    dark = (a[..., 3] > 0) & (lum <= 52) & (r > g)                   # 갈색빛 테두리·눈·코 → 같은 어둡기의 무채색
    out[dark, :3] = np.stack([lum[dark] * 0.8, lum[dark] * 0.78, lum[dark] * 0.85 + 2], -1)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")

for k in ("px", "big"):
    im = recolor(Image.open(SRC[k]))
    if k == "px":
        im.save(DST[k], optimize=True)
    else:
        im.save(DST[k], "WEBP", quality=92, method=6)
    print(k, im.size, "->", os.path.relpath(DST[k], ROOT))
