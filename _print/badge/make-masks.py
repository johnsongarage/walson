# 뱃지용 그림 판 만들기(2026-11-18). 새 로고(../logo/walson-face.png)를 두 가지 색 뱃지에 쓰도록 나눈다.
#  face-ink.png   — 진한 부분(테두리·귀·코·입·눈동자)만, 검정 + 부드러운 가장자리. 화면에서 원하는 색으로 칠한다(CSS mask).
#  face-cream.png — 크림 부분(눈 흰자·이빨·코 빛)만. "세 색" 판에서만 쓴다.
# 나머지(얼굴 노랑·혀)는 뱃지 바탕색이 비쳐 보이게 비워 둔다 — 두 가지 색 뱃지(바탕 + 그림 한 색, 11/16 가르시아)와 같은 방식.
# 실행: python3 _print/badge/make-masks.py (저장소 맨 위에서)
import os
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
face = np.asarray(Image.open(os.path.join(HERE, '..', 'logo', 'walson-face.png')).convert('RGBA')).astype(np.float32)
rgb, a = face[..., :3], face[..., 3] / 255.0
lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
# 진한 갈색(밝기 ~35) → 1, 노랑(~175) → 0, 사이는 부드럽게
ink = np.clip((135.0 - lum) / 70.0, 0, 1) * a
# 크림(밝기 ~228, 노랑보다 밝음) → 1
cream = np.clip((lum - 200.0) / 18.0, 0, 1) * a
def save(alpha, name):
    out = np.zeros(alpha.shape + (4,), np.uint8)
    out[..., 3] = (alpha * 255).round().astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(os.path.join(HERE, name), optimize=True)
save(ink, 'face-ink.png')
save(cream, 'face-cream.png')
print('ok', face.shape[1], face.shape[0], 'ink', round(float(ink.mean()), 3), 'cream', round(float(cream.mean()), 3))
