# 아지트 방 왼쪽 칸막이의 토끼 귀 모양 입구(계단)를 벽으로 메운다(2026-11-24 가르시아 "토끼 형태의 입구를 없애고 벽으로 만들어 줘").
# 칸막이 앞면(x 0~43)은 세로 줄무늬 벽지 — 같은 줄에서 15점마다 되풀이되니(방 넷 모두), 입구 위쪽 벽지를 아래로 이어 붙이고
# 맨 아래는 벽지를 조금 어둡게 한 걸레받이(3점). 칸막이 아래 끝 = 바닥과 만나는 줄 y = 174 + (44 - x) / 2(라일락 방에서 잰 값).
# 쓰는 법: python3 _dev/azit-close-door.py [icons/azit-room]   — room·room_pink·room_lilac·room_night를 고쳐 씀
import os, sys
import numpy as np
from PIL import Image

DIR = sys.argv[1] if len(sys.argv) > 1 else "icons/azit-room"
PERIOD, SRC0, START, X1 = 15, 30, 80, 44   # 되풀이 칸 · 본뜰 벽지 첫 줄 · 메우기 시작 줄 · 칸막이 오른쪽 끝(이 열부터는 테두리라 그대로)


def close(name):
    p = os.path.join(DIR, name + ".png")
    a = np.asarray(Image.open(p).convert("RGBA")).copy()
    for x in range(0, X1):
        yb = int(round(174 + (44 - x) / 2.0))
        for y in range(START, min(yb, a.shape[0])):
            src = SRC0 + (y - SRC0) % PERIOD
            col = a[src, x, :3].astype(float)
            if y >= yb - 3:
                col = col * 0.8   # 걸레받이
            a[y, x, :3] = col.clip(0, 255).astype(np.uint8)
            a[y, x, 3] = 255
    Image.fromarray(a).save(p, optimize=True)
    print("고침:", p)


for n in ("room", "room_pink", "room_lilac", "room_night"):
    close(n)
