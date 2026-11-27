# [밤하늘] 순찰대 로켓(2026-11-27 가르시아가 받은 그림 "추가하고 배포") — 흰 바탕을 오려 내고, 유리 돔 속을 반투명으로(앱이 그 뒤에 우리 개를 그려 돔 안에 탄 것처럼),
# 돔 자리·불꽃 자리를 그림 비율로 적어 둔다(night-extras.js ROCKET).
# 쓰는 법: python3 _dev/night-rocket.py  (sian-ref/night/rocket-original.webp → icons/night/rocket.webp)
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = 'sian-ref/night/rocket-original.webp'
OUT = 'icons/night/rocket.webp'
W_OUT = 560

im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float64)
H, W = im.shape[:2]
r, g, b = im[..., 0], im[..., 1], im[..., 2]
mx, mn = im.max(2), im.min(2)
L = 0.299 * r + 0.587 * g + 0.114 * b
# 1) 바탕 = 가장자리에서 이어진 흰 칸(제미나이 반짝이 표시도 여기에 들어가 같이 지워짐)
whiteish = (mn >= 232) & (mx - mn <= 28)
lab, n = ndi.label(whiteish)
edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(edge))
alpha = np.where(bg, 0.0, 1.0)
# 2) 바탕 둘레 3픽셀 — 흰 바탕에 섞인 테두리 색을 되살림(흰 테두리 띠가 밤하늘에 안 남게)
dark = L < 90
oc = im[dark].mean(0)                     # 테두리 남색
Lo = 0.299 * oc[0] + 0.587 * oc[1] + 0.114 * oc[2]
near = ndi.binary_dilation(bg, iterations=3) & ~bg
a_f = np.clip((255 - L) / (255 - Lo), 0, 1)
alpha = np.where(near, np.minimum(alpha, a_f), alpha)
rgb = im.copy()
rgb[near] = oc
# 3) 유리 돔 속 — 테두리로 닫힌 밝은 칸 중 돔 가운데 점을 품은 것
light = (L >= 120) & ~bg
lab2, n2 = ndi.label(light)
cxy = (int(700 * 1.035), int(1012 * 1.035))   # (y, x) 돔 가운데쯤
dome_id = lab2[cxy]
dome = lab2 == dome_id
ys, xs = np.nonzero(dome)
dy0, dy1, dx0, dx1 = ys.min(), ys.max(), xs.min(), xs.max()
dcx, dcy, dR = (dx0 + dx1) / 2, (dy0 + dy1) / 2, (dx1 - dx0) / 2
dist = np.hypot(np.arange(W)[None, :] - dcx, np.arange(H)[:, None] - dcy) / dR
shine = dome & (L >= 246) & (dist > 0.55) & (np.arange(H)[:, None] < dcy)   # 위쪽 가장자리 빛줄기만 진하게(아래 테 반사는 끊겨 보여서 뺌)
a_dome = np.where(shine, 0.9, 0.3)
alpha = np.where(dome, a_dome, alpha)
print('dome px', dome.sum(), 'bbox', (dx0, dy0, dx1, dy1), 'shine', shine.sum())
# 4) 불꽃 자리(주황) — 깜빡이는 빛을 그 뒤에
orange = (r > 200) & (g > 80) & (g < 210) & (b < 120) & ~bg
lab3, n3 = ndi.label(orange)
sizes = ndi.sum(orange, lab3, range(1, n3 + 1))
fl = lab3 == (int(np.argmax(sizes)) + 1)
fys, fxs = np.nonzero(fl)
# 5) 자르기 · 줄이기
A = (alpha * 255).astype(np.uint8)
ys, xs = np.nonzero(A > 8)
pad = 6
y0, y1, x0, x1 = max(0, ys.min() - pad), min(H, ys.max() + pad + 1), max(0, xs.min() - pad), min(W, xs.max() + pad + 1)
crop_rgb = rgb[y0:y1, x0:x1]; crop_a = alpha[y0:y1, x0:x1]
ch, cw = crop_a.shape
h_out = round(ch * W_OUT / cw)
pre = np.dstack([crop_rgb * crop_a[..., None], crop_a * 255])
chs = [np.asarray(Image.fromarray(pre[..., i].astype(np.float32), 'F').resize((W_OUT, h_out), Image.LANCZOS)) for i in range(4)]
a2 = np.clip(chs[3] / 255, 0, 1)
out = np.zeros((h_out, W_OUT, 4))
for i in range(3): out[..., i] = np.where(a2 > 1e-3, np.clip(chs[i] / np.maximum(a2, 1e-3), 0, 255), 0)
out[..., 3] = a2 * 255
Image.fromarray(out.round().astype(np.uint8), 'RGBA').save(OUT, 'WEBP', quality=92, method=6)
def nx(x): return round((x - x0) / cw, 4)
def ny(y): return round((y - y0) / ch, 4)
geo = {'aspect': round(cw / ch, 4), 'dome': {'cx': nx(dcx), 'top': ny(dy0), 'base': ny(dy1), 'w': round((dx1 - dx0) / cw, 4)},
       'flame': {'x': nx(fxs.mean()), 'y': ny(fys.mean()), 'r': round((fxs.max() - fxs.min()) / cw / 2, 4)}}
print(OUT, (W_OUT, h_out)); print('ROCKET =', json.dumps(geo))
