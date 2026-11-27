# [아지트] 가운데 창살 없는 창(2026-11-27 가르시아 "창문 창살 가운데가 별을 가리니까 없는 버전으로 만들어 줄 테니" → 제미나이 세 칸 그림)
#
# 받은 그림(sian-ref/window/nobar-gemini.webp — 밤 창 · 밤 벽에 낮 창 · 크림 벽에 낮 창)은 방 그림과 각도·크기가 조금 달라서 통째로 붙이지 않고,
# 창유리 속(하늘·나무)만 떼어 지금 방 그림의 창유리 자리(창살 자리 포함)에 비스듬히(아핀 변환) 맞춰 넣는다. 창틀·커튼·벽은 원래 그림 그대로.
#   - 밤: icons/azit-hd/window_night.webp(밤에 창유리를 덮는 그림 — 예전엔 창살 자리가 비어 있어 방 그림의 창살이 보였다)를 새로 —
#         창유리 + 창살 자리를 받은 밤 창(1번 칸)으로 채운다.
#   - 낮: 방 그림 넷(room·room_lilac·room_pink·room_night — 같은 창)의 창유리 + 창살 자리를 받은 낮 창(3번 칸)으로. 미리보기 -1x도 다시.
# 쓰는 법: python3 _dev/azit-window-nobar.py   (원본은 git에 있음)
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HD = os.path.join(ROOT, 'icons', 'azit-hd')
SRC = Image.open(os.path.join(ROOT, 'sian-ref', 'window', 'nobar-gemini.webp')).convert('RGB')
WX, WY = 1470, 350   # 창유리 덮개(230×410)의 방 그림 속 자리(azit.html WIN_BOX × 4.5)

# 덮개 좌표의 창유리 네 귀퉁이(실측: 왼쪽 x 9 위 29·아래 268, 오른쪽 x 220 위 114·아래 356)
D_TL, D_TR, D_BL = (9, 29), (220, 114), (9, 268)
# 받은 그림에서 보이는 창유리 귀퉁이(실측 — 왼쪽 커튼 바로 옆 ~ 오른쪽 커튼 바로 앞)
S_NIGHT = {'TL': (185, 315), 'TR': (460, 410), 'BL': (185, 658)}
S_DAY = {'TL': (1525, 322), 'TR': (1792, 440), 'BL': (1525, 660)}

def affine(src):
    """덮개 좌표(x, y) → 받은 그림 좌표: PIL transform 계수(a, b, c, d, e, f)"""
    (x0, y0), (x1, y1), (x2, y2) = D_TL, D_TR, D_BL
    (u0, v0), (u1, v1), (u2, v2) = src['TL'], src['TR'], src['BL']
    A = np.array([[x0, y0, 1], [x1, y1, 1], [x2, y2, 1]], float)
    a, b, c = np.linalg.solve(A, [u0, u1, u2]); d, e, f = np.linalg.solve(A, [v0, v1, v2])
    return (a, b, c, d, e, f)

def glass(src):   # 받은 그림 창유리를 덮개 크기(230×410)로
    return np.array(SRC.transform((230, 410), Image.AFFINE, affine(src), resample=Image.BICUBIC))

# 채울 곳 = 예전 덮개가 덮던 창유리 + 가운데 창살 자리(열 102~133, 창유리 위·아래 선 사이)
old = np.array(Image.open(os.path.join(HD, 'window_night.webp')).convert('RGBA'))
mask = old[:, :, 3] > 200
def top(x): return 29 + (114 - 29) * (x - 9) / 211.0
def bot(x): return 268 + (356 - 268) * (x - 9) / 211.0
for x in range(102, 134):
    mask[int(round(top(x))) + 1:int(round(bot(x))), x] = True

# 밤 덮개
night = glass(S_NIGHT)
out = np.zeros((410, 230, 4), np.uint8); out[:, :, :3] = night; out[:, :, 3] = np.where(mask, 255, 0)
Image.fromarray(out, 'RGBA').save(os.path.join(HD, 'window_night.webp'), 'WEBP', lossless=True)

# 낮 방 넷
day = glass(S_DAY)
for name in ['room', 'room_lilac', 'room_pink', 'room_night']:
    p = os.path.join(HD, name + '.webp')
    im = np.array(Image.open(p).convert('RGB'))
    sub = im[WY:WY + 410, WX:WX + 230]
    sub[mask] = day[mask]
    # 창살 밑동(아래 창틀 위로 튀어나온 20점쯤) — 왼쪽 40점 옆 창틀(같은 기울기만큼 위)을 옮겨 와 덮는다
    sh = int(round(40 * (356 - 268) / 211.0))
    for x in range(100, 136):
        b = int(round(bot(x)))
        for y in range(b - 1, b + 27):
            sub[y, x] = sub[y - sh, x - 40]
    im[WY:WY + 410, WX:WX + 230] = sub
    big = Image.fromarray(im, 'RGB'); big.save(p, 'WEBP', quality=92, method=6)
    p1 = os.path.join(HD, name + '-1x.webp')
    if os.path.exists(p1):
        w1, h1 = Image.open(p1).size
        big.resize((w1, h1), Image.LANCZOS).save(p1, 'WEBP', quality=92, method=6)
    print(name, 'ok')
print('window_night ok')
