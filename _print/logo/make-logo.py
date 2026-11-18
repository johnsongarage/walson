# 왈슨 로고(2026-11-18 가르시아가 준 짖는 강아지 얼굴) → 앱에서 쓰는 그림들.
# 원본: walson-face-src.png(흰 바탕 2048px). 바깥 흰 바탕만 투명으로 떼고(얼굴 안의 크림색 눈·이빨은 그대로),
# 바깥 테두리 가장자리는 테두리 색으로 칠하고 투명도만 남겨서 어느 바탕에 올려도 흰 띠가 안 남게 한다.
# 실행: python3 _print/logo/make-logo.py  (저장소 맨 위에서) — 결과는 icons/·og/에 바로 쓴다(og는 og.html을 브라우저로 찍음 — README)
import os, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(HERE, 'walson-face-src.png')
OUTLINE = (54, 30, 18)          # 테두리 진갈색 #361e12
CREAM = (255, 246, 226)         # 앱 아이콘 바탕 #fff6e2(2026-11-18 — 멀리서도 얼굴 모양이 또렷하게)
YELLOW = (242, 183, 51)         # 시작 화면·영수증·미리보기 노랑 #f2b733

def cutout():
    im = Image.open(SRC).convert('RGB')
    a = np.asarray(im).astype(np.int32)
    near_white = (a.min(axis=2) > 235)
    m = Image.fromarray(np.where(near_white, 255, 0).astype(np.uint8)).copy()   # copy: 배열과 묶인 그림은 floodfill이 안 칠해진다(Pillow 12)
    ImageDraw.floodfill(m, (0, 0), 128)              # 가장자리에서 이어진 흰 바탕 = 바깥
    outside = (np.asarray(m) == 128)
    # 바깥에서 2px 안쪽 띠 = 테두리의 바깥 가장자리(흰색과 섞인 픽셀)
    grow = outside.copy()
    for _ in range(2):
        g = grow.copy()
        g[1:, :] |= grow[:-1, :]; g[:-1, :] |= grow[1:, :]; g[:, 1:] |= grow[:, :-1]; g[:, :-1] |= grow[:, 1:]
        grow = g
    band = grow & ~outside
    lum = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    lo = 0.299 * OUTLINE[0] + 0.587 * OUTLINE[1] + 0.114 * OUTLINE[2]
    alpha = np.full(lum.shape, 255.0)
    alpha[outside] = 0
    ab = np.clip((255.0 - lum) / (255.0 - lo), 0, 1) * 255
    alpha[band] = ab[band]
    rgb = a.copy()
    rgb[band] = OUTLINE
    out = np.dstack([rgb.astype(np.uint8), alpha.astype(np.uint8)])
    face = Image.fromarray(out, 'RGBA')
    return face.crop(face.getbbox())

def place(face, size, bg, width_ratio, radius=0.0, dy=0.0):
    w, h = size
    im = Image.new('RGBA', size, (0, 0, 0, 0))
    if bg is not None:
        base = Image.new('RGBA', size, bg + (255,))
        if radius:
            mask = Image.new('L', size, 0)
            ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=int(min(w, h) * radius), fill=255)
            im.paste(base, (0, 0), mask)
        else:
            im = base
    fw = int(w * width_ratio); fh = int(fw * face.size[1] / face.size[0])
    if fh > h * 0.94:
        fh = int(h * 0.94); fw = int(fh * face.size[0] / face.size[1])
    f = face.resize((fw, fh), Image.LANCZOS)
    im.alpha_composite(f, ((w - fw) // 2, (h - fh) // 2 + int(h * dy)))
    return im

def main():
    face = cutout()
    face.save(os.path.join(HERE, 'walson-face.png'))                       # 투명 바탕 원본(인쇄·굿즈용)
    icons = os.path.join(ROOT, 'icons')
    # 화면용 로고 — 예전 그림과 같은 900×732 칸(화면들이 이 비율로 자리를 잡아 둠), 투명 바탕
    place(face, (900, 732), None, 0.98).save(os.path.join(icons, 'walson-logo.webp'), 'WEBP', quality=90, method=6)
    # 앱 아이콘 — 크림 바탕 둥근 네모(any), 꽉 찬 네모(maskable·아이폰)
    place(face, (512, 512), CREAM, 0.86, radius=0.22, dy=0.01).save(os.path.join(icons, 'icon-512.png'), optimize=True)
    place(face, (512, 512), CREAM, 0.86, radius=0.22, dy=0.01).resize((192, 192), Image.LANCZOS).save(os.path.join(icons, 'icon-192.png'), optimize=True)
    place(face, (512, 512), CREAM, 0.70, dy=0.01).save(os.path.join(icons, 'icon-maskable-512.png'), optimize=True)   # 안전 영역(가운데 80% 원) 안
    place(face, (180, 180), CREAM, 0.84, dy=0.01).convert('RGB').save(os.path.join(icons, 'apple-touch-icon.png'), optimize=True)
    # 샘플 강아지(왈슨) 사진 — 주민증·[오늘] 동그라미에 들어감
    place(face, (720, 720), CREAM, 0.86, dy=0.02).convert('RGB').save(os.path.join(icons, 'sample-walson.jpg'), quality=88)
    print('ok', face.size)

if __name__ == '__main__':
    main()
