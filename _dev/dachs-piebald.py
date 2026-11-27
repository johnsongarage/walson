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

def white_of(x, y):
    """점 그림 좌표(실수)에서 흰 칸인지"""
    w = (np.abs(x - 26.5) <= 3.2) & (y >= 2) & (y <= 24)            # 이마 가운데 흰 줄(블레이즈)
    w |= ell(x, y, 26.5, 28.5, 10.5, 8.5)                            # 주둥이
    w |= ell(x, y, 26.5, 21, 13.5, 10.5) & (y >= 9)                 # 얼굴(눈 둘레까지) — 검은 털 위 까만 눈이 묻혀서(11/27 가르시아 "눈이 까매서 좀 그래")
    w |= ell(x, y, 27, 50, 10.5, 12.5)                               # 가슴·배
    w |= (y >= 58.5) & (x <= 40)                                      # 앞발
    w |= ell(x, y, 51.5, 43, 3.2, 3.2)                                # 꼬리 끝
    w |= ell(x, y, 45, 20, 3.0, 4.0)                                  # 오른쪽 귀 흰 얼룩
    dots = [(22, 47, 2.0, 1.6), (32, 53, 2.4, 1.8), (25, 56, 1.4, 1.2)]   # 흰 칸 안 검은 점
    for cx, cy, rx, ry in dots:
        w &= ~ell(x, y, cx, cy, rx, ry)
    return w

def recolor(im):
    a = np.asarray(im.convert("RGBA")).astype(float)
    H, W = a.shape[:2]
    rgb = a[..., :3]; r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    fur = (a[..., 3] > 0) & (r > g + 18) & (g > b + 8) & (lum > 52) & ~(b > 0.6 * g)   # 갈색 털 — 혀·코 반짝이(파랑이 초록에 가까운 붉은색)·테두리는 빼고
    ys, xs = np.mgrid[0:H, 0:W]
    x = (xs + 0.5) * PW / W; y = (ys + 0.5) * PH / H
    wh = white_of(x, y)
    lo, hi = np.percentile(lum[fur], 3), np.percentile(lum[fur], 97)
    t = np.clip((lum - lo) / max(1, hi - lo), 0, 1)[..., None]
    black = np.array([26, 26, 30]) + t * (np.array([96, 94, 104]) - np.array([26, 26, 30]))
    white = np.array([168, 166, 174]) + t * (np.array([252, 250, 248]) - np.array([168, 166, 174]))
    out = a.copy()
    out[..., :3] = np.where((fur & wh)[..., None], white, np.where(fur[..., None], black, rgb))
    dark = (a[..., 3] > 0) & (lum <= 52) & (r > g)                   # 갈색빛 테두리·눈·코 → 같은 어둡기의 무채색(검은 털과 어울리게)
    out[dark, :3] = np.stack([lum[dark] * 0.85, lum[dark] * 0.85, lum[dark] * 0.95 + 4], -1)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")

for k in ("px", "big"):
    im = recolor(Image.open(SRC[k]))
    if k == "px":
        im.save(DST[k], optimize=True)
    else:
        im.save(DST[k], "WEBP", quality=92, method=6)
    print(k, im.size, "->", os.path.relpath(DST[k], ROOT))
