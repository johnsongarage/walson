# 아지트 기본 벽지·바닥 바꾸기(2026-11-24 가르시아 "이걸 가지고 지금 기본이 되고 있는 벽지와 타일을 교체")
# 받은 그림(크림 발바닥 벽지 + 크림 판넬 징두리 + 밝은 나무 마루, 아이소 방)에서 벽지·징두리·바닥 무늬만 떠서
# 지금 빈 방(room.png 394×220 — 선반·왼쪽 계단·바닥 끝 띠·자리 맞춤은 그대로)의 벽·바닥 칸에만 다시 입힌다.
#  - 방 자리: 두 벽 모서리 바닥 (199,74), 벽 바닥 줄은 가로 2점에 세로 1점(azit.html P·W와 같음)
#  - 받은 그림 자리(실측): 모서리 (1379,736), 왼쪽 벽 바닥 줄 기울기 0.4325 · 오른쪽 0.398, 징두리 높이 194점 → 방 36점(한 점 = 5.4점)
#  - 왼쪽 벽 = 발바닥 벽지(받은 그림 왼쪽 벽), 오른쪽 벽 = 무늬 없는 크림(받은 그림처럼), 징두리는 두 벽 다 판넬.
#    받은 그림의 문·선반·창은 피해서 깨끗한 곳만 되풀이해 뜬다.
#  - 선반·계단·띠 같은 진한 색 칸은 그대로 둔다(벽 칸 중 밝은 점만 바꿈)
# 쓰는 법: python3 _dev/azit-cream-room.py 받은그림.png [옛 room.png] [내보낼 room.png]
import sys
import numpy as np
from PIL import Image

SRC = sys.argv[1]
OLD = sys.argv[2] if len(sys.argv) > 2 else "icons/azit-room/room.png"
OUT = sys.argv[3] if len(sys.argv) > 3 else OLD
K = 5.4                                  # 받은 그림 점 / 방 점
SC, SY = 1379.0, 736.0                   # 받은 그림 두 벽 모서리(바닥)
SL, SR = 0.4325, 0.398                   # 받은 그림 벽 바닥 줄 기울기(왼쪽·오른쪽)
CX, CY = 199, 74                         # 방 모서리
WAIN = 33.5                              # 방 징두리 위 끝(벽 바닥 줄에서 위로)
RAIL0, RAIL1 = 94.5, 103.5               # 방 위쪽 몰딩 띠(두 진한 줄 사이)

src = Image.open(SRC).convert("RGB")
small = np.asarray(src.resize((round(src.width / K), round(src.height / K)), Image.BOX)).astype(float)
old = np.asarray(Image.open(OLD).convert("RGBA")).copy()
H, W = old.shape[:2]


def samp(xs, ys):   # 받은 그림 좌표(원래 크기) → 줄인 그림에서 쌍선형으로
    x, y = xs / K - 0.5, ys / K - 0.5
    x0, y0 = int(np.floor(x)), int(np.floor(y)); fx, fy = x - x0, y - y0
    def g(a, b):
        return small[min(max(b, 0), small.shape[0] - 1), min(max(a, 0), small.shape[1] - 1)]
    return (g(x0, y0) * (1 - fx) * (1 - fy) + g(x0 + 1, y0) * fx * (1 - fy) + g(x0, y0 + 1) * (1 - fx) * fy + g(x0 + 1, y0 + 1) * fx * fy)


def wrap(U, lo, hi):   # 깨끗한 칸 [lo, hi) 안에서 되풀이
    return lo + (U - lo) % (hi - lo)


# 받은 그림에서 깨끗한 칸(문·선반·창 피함) — 왼쪽 벽 U(모서리에서 가로 점) 30~534: 판넬 4칸(한 칸 약 168점)·발바닥 줄이 맞게
LW0, LW1 = 30.0, 534.0
PLAIN = np.array([240.0, 233.0, 218.0])   # 오른쪽 벽 무늬 없는 크림(받은 그림 오른쪽 벽에서 잰 색)


def left_wall(Uw, v):   # 받은 그림 왼쪽 벽: 모서리에서 가로 Uw점, 바닥 줄에서 v점 위(둘 다 받은 그림 점)
    Uw = wrap(Uw, LW0, LW1)
    return samp(SC - Uw, SY + Uw * SL - v)


def is_light(c):
    return c[0] > 215 and c[1] > 175 and c[2] > 165


def is_wood(c):   # 붙박이 선반(나무) — 분홍·크림은 g≈b, 나무는 g가 b보다 꽤 큼
    return int(c[1]) - int(c[2]) > 18 and int(c[0]) < 245


def is_floorish(c):   # 옛 마루(주황 나무) — 끝 띠(진한 보라)·계단(분홍)은 빼고
    r, g, b = c[:3]
    return r > 140 and r - b > 70 and g > 70 and g < 160 and r - g > 40


# 붙박이 선반 = 나무색·진한 점이 뭉친 곳(5×5 안에 8점 이상). 옛 벽지의 흩어진 분홍 점은 선반이 아니다
solid = np.zeros((H, W), bool)
for y in range(H):
    for x in range(W):
        c = old[y, x, :3]
        solid[y, x] = old[y, x, 3] > 0 and (is_wood(c) or (int(c.astype(int).sum()) < 330 and not (int(c[0]) - int(c[1]) > 65 and int(c[2]) > int(c[1]))))   # 옛 벽 테두리 줄(붉은 분홍)은 선반 아님
wood = np.zeros((H, W), bool)
for y in range(H):
    for x in range(W):
        wood[y, x] = old[y, x, 3] > 0 and is_wood(old[y, x, :3])
shelf = np.zeros((H, W), bool)
for y in range(H):
    for x in range(W):
        if solid[y, x] and solid[max(0, y - 2):y + 3, max(0, x - 2):x + 3].sum() >= 12 and wood[max(0, y - 3):y + 4, max(0, x - 3):x + 4].sum() >= 10:
            shelf[y, x] = True   # 나무 판 가까이의 진한 테두리만(옛 벽 테두리 줄 끝은 빠짐)
# 가는 점선(옛 테두리 줄 끝)은 3×3 안에 이웃이 적다 — 덩어리만 남김
shelf = shelf & np.array([[shelf[max(0, y - 1):y + 2, max(0, x - 1):x + 2].sum() >= 5 for x in range(W)] for y in range(H)])
seen = np.zeros((H, W), bool)   # 이어진 덩어리 중 큰 것(선반 판)만 — 40점 미만 부스러기는 버림
for y0 in range(H):
    for x0 in range(W):
        if shelf[y0, x0] and not seen[y0, x0]:
            st, comp = [(y0, x0)], []
            seen[y0, x0] = True
            while st:
                y, x = st.pop(); comp.append((y, x))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < H and 0 <= xx < W and shelf[yy, xx] and not seen[yy, xx]:
                            seen[yy, xx] = True; st.append((yy, xx))
            if len(comp) < 40:
                for y, x in comp:
                    shelf[y, x] = False


def creamy(c):   # 왼쪽 계단 칸막이·계단(분홍) → 같은 밝기의 크림·베이지
    l = (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255.0
    lo, hi = np.array([150.0, 122.0, 96.0]), np.array([248.0, 240.0, 226.0])
    t = min(1.0, max(0.0, (l - 0.45) / 0.5))
    return lo + (hi - lo) * t


out = old.copy()
for y in range(H):
    for x in range(W):
        if old[y, x, 3] == 0:
            continue
        c = old[y, x, :3].astype(int)
        u = abs(x - CX) / 2.0            # 벽 따라 칸(가로 2점 = 1칸) → 바닥 줄 높이
        base = CY + u
        v = base - y                     # 벽 바닥 줄에서 위로 몇 점
        right = x >= CX
        if x < 46 and not is_floorish(c):
            if sum(c) > 300 and not (c[0] < 140 and c[2] > c[1]):   # 계단 칸막이·계단은 모양 그대로 크림으로(진한 끝 띠는 그대로)
                out[y, x, :3] = creamy(c)
            continue
        if v > -4.5 and x >= 46:         # 벽
            U = abs(x - CX) * K
            if v > RAIL1:                # 몰딩 위 = 벽 윗부분(무늬 없는 크림, 조금 어둡게)
                if not shelf[y, x]:
                    out[y, x, :3] = (PLAIN * 0.97).clip(0, 255)
            elif v >= RAIL0:             # 몰딩 띠: 진한 줄은 따뜻한 갈색, 사이는 흰 몰딩
                out[y, x, :3] = (176, 132, 96) if sum(c) < 400 else (250, 244, 234)
            elif v > WAIN:               # 벽지(붙박이 선반만 남김)
                if not shelf[y, x] or v < WAIN + 4:   # 징두리 위 옛 테두리 줄도 지움
                    out[y, x, :3] = PLAIN if right else left_wall(U, (v - WAIN) * K + 194 + 6).clip(0, 255)
            else:                        # 징두리(두 벽 다 받은 그림 왼쪽 벽 판넬)
                out[y, x, :3] = left_wall(U, max(-14.0, v * K)).clip(0, 255)
        elif c[0] < 140 and c[2] > c[1] and v < -4.5:   # 바닥 끝 띠(진한 보라) → 마루 옆면 같은 진한 나무색(밝기 따라)
            l = (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 70.0
            out[y, x, :3] = (np.array([138.0, 92.0, 60.0]) * min(1.25, max(0.55, l))).clip(0, 255)
        elif is_floorish(c) or (x >= 46 and not (c[0] < 140 and c[2] > c[1])):   # 바닥(벽 밑 옛 테두리 줄·못 자국까지, 진한 끝 띠만 남김): 방 (i,j) → 받은 그림 바닥(되풀이)
            a, b = (x - CX) / 2.0, y - CY
            i, j = (a + b) / 2.0, (b - a) / 2.0
            Ui, Uj = wrap(i * 2 * K, 20, 860), wrap(j * 2 * K, 20, 840)
            out[y, x, :3] = samp(SC + Ui - Uj, SY + Ui * SR + Uj * SL).clip(0, 255)

Image.fromarray(out.astype(np.uint8)).save(OUT, optimize=True)
print("저장:", OUT)
