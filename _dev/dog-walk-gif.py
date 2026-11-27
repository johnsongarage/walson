# 걷는 강아지 GIF → [아지트] 걷기 그림표(2026-11-27 가르시아가 제미나이로 만든 푸들 걷기 GIF "gif로 적용해봐")
#
# 제미나이 GIF(흰 바탕, 옆모습, 제자리 걷기, 끝과 처음이 이어지는 것)를 받아
#   1) 칸마다 흰 바탕을 지우고(그림 가장자리에서 이어진 흰 칸만 — 강아지는 진한 테두리가 있어 안으로 안 샌다)
#   2) 모든 칸을 같은 네모로 잘라(발 줄이 칸마다 같게 — 제자리 걷기라 몸이 거의 안 움직인다)
#   3) 오른쪽을 보게 뒤집고(앱 그림 약속: 그대로 = 오른쪽으로 감)
#   4) 키 H픽셀로 곱게 줄여(투명 가장자리가 하얗게 번지지 않게 알파를 곱해서 줄임) 한 줄로 이은 그림표를 만든다.
# 쓰는 법:  python3 _dev/dog-walk-gif.py 받은GIF 견종이름 [키픽셀=132]
#   → icons/dot-dogs/walk/견종이름.webp, 그리고 azit-dog-motion-sian.html WALK에 넣을 한 줄을 찍는다.
import sys, os, json
from collections import deque
import numpy as np
from PIL import Image

src, breed = sys.argv[1], sys.argv[2]
H = int(sys.argv[3]) if len(sys.argv) > 3 else 132
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'icons', 'dot-dogs', 'walk')
os.makedirs(OUT, exist_ok=True)

gif = Image.open(src)
frames, durs = [], []
for k in range(getattr(gif, 'n_frames', 1)):
    gif.seek(k)
    frames.append(np.asarray(gif.convert('RGB'), dtype=np.uint8))
    durs.append(gif.info.get('duration') or 100)

def cut(rgb, tol=226):
    """가장자리에서 이어진 거의 흰 칸 = 바탕 → 알파 0"""
    h, w, _ = rgb.shape
    white = rgb.min(axis=2) >= tol
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if white[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if white[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    a = np.where(bg, 0, 255).astype(np.uint8)
    # 테두리 바깥 한 겹의 연한 번짐(GIF 압축 자국)도 바탕으로
    soft = (rgb.min(axis=2) >= 200) & ~bg
    nb = np.zeros_like(bg)
    nb[1:, :] |= bg[:-1, :]; nb[:-1, :] |= bg[1:, :]; nb[:, 1:] |= bg[:, :-1]; nb[:, :-1] |= bg[:, 1:]
    a[soft & nb] = 0
    return np.dstack([rgb, a])

rgba = [cut(f) for f in frames]
ys, xs = [], []
for f in rgba:
    yy, xx = np.nonzero(f[:, :, 3])
    ys += [yy.min(), yy.max()]; xs += [xx.min(), xx.max()]
y0, y1, x0, x1 = min(ys), max(ys), min(xs), max(xs)
pad = 2
y0, x0 = max(0, y0 - pad), max(0, x0 - pad)
y1, x1 = y1 + pad, x1 + pad
crop = [f[y0:y1 + 1, x0:x1 + 1] for f in rgba]
ch, cw = crop[0].shape[:2]
W = round(cw * H / ch)

def shrink(f):
    """알파를 곱해서 줄이고 되돌린다(흰 바탕 자리가 가장자리로 번지지 않게)"""
    a = f[:, :, 3:4].astype(np.float32) / 255
    pm = np.concatenate([f[:, :, :3].astype(np.float32) * a, a * 255], axis=2)
    chans = [np.asarray(Image.fromarray(pm[:, :, c].astype(np.float32), mode='F').resize((W, H), Image.LANCZOS)) for c in range(4)]
    al = np.clip(chans[3], 0, 255)
    rgb = np.stack(chans[:3], axis=2) / np.maximum(al[:, :, None] / 255, 1e-3)
    out = np.dstack([np.clip(rgb, 0, 255), al]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA').transpose(Image.FLIP_LEFT_RIGHT)   # 오른쪽 보기

small = [shrink(f) for f in crop]
sheet = Image.new('RGBA', (W * len(small), H), (0, 0, 0, 0))
for k, s in enumerate(small): sheet.paste(s, (k * W, 0))
path = os.path.join(OUT, breed + '.webp')
sheet.save(path, 'WEBP', quality=90, method=6)
# 서 있는 칸 = 다리 폭이 가장 좁은 칸(멈췄을 때 잠깐 보이는 모습)
widths = []
for f in crop:
    xx = np.nonzero(f[:, :, 3].max(axis=0))[0]; widths.append(xx.max() - xx.min())
stand = int(np.argmin(widths))
meta = {'n': len(small), 'w': W, 'h': H, 'stand': stand, 'ms': int(np.mean(durs))}
print(os.path.relpath(path, ROOT), os.path.getsize(path), 'bytes', sheet.size)
print("WALK 한 줄:  " + breed + ": " + json.dumps(meta))
