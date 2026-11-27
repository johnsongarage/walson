# 제미나이 초록 바탕(#CFE3CF 근처) 도트 강아지 → 바탕 투명·키 맞춘 WebP + 점 격자 PNG (2026-11-27)
#
# 왜: 새 견종은 흰 강아지가 바탕에 묻히지 않게 연한 초록 바탕으로 받는다(sian-ref/dot-dogs-new/PROMPTS.md).
# 제미나이가 오른쪽 아래에 반짝이·"AI" 표시를 찍는다 — 이것도 바탕으로 지운다.
#
# 쓰는 법(저장소 맨 위에서, pip pillow numpy scipy):
#   python3 _dev/dot-dog-green.py 받은그림.webp bichon
#   → 원본은 sian-ref/dot-dogs-new/src/bichon.webp에 보관, icons/dot-dogs/bichon.webp · px/bichon.png
#
# 바탕 찾는 법: 가장자리 색(초록)과 가까운 칸을 가장자리에서 채우고, 남은 것 중 가장 큰 덩어리만 강아지로(구멍은 메움).
# (처음엔 진한 외곽선을 벽으로 채웠는데 선이 끊긴 틈으로 흰 털 안까지 번졌다 — 11/27)
import os, sys, shutil, subprocess
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    if len(sys.argv) != 3:
        print('쓰는 법: python3 _dev/dot-dog-green.py 받은그림.webp 이름(영문)')
        sys.exit(1)
    src, name = sys.argv[1], sys.argv[2]
    keep = os.path.join(ROOT, 'sian-ref', 'dot-dogs-new', 'src')
    os.makedirs(keep, exist_ok=True)
    shutil.copy(src, os.path.join(keep, name + os.path.splitext(src)[1]))
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.int16)
    # 바탕색 = 그림 가장자리 칸의 가운데값. 그 색과 가까운(거리 < 34) 칸을 가장자리에서 4방향으로 채운 것이 바탕
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bgc = np.median(border, 0)
    near = np.sqrt(((rgb - bgc) ** 2).sum(2)) < 34
    lab, k = ndi.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    # 강아지 = 바탕 아닌 칸 중 가장 큰 덩어리(8방향). 반짝이·"AI" 표시 같은 작은 조각은 바탕으로
    fl, fk = ndi.label(~bg, structure=np.ones((3, 3)))
    sizes = ndi.sum(np.ones_like(fl), fl, np.arange(1, fk + 1))
    dog = fl == (int(np.argmax(sizes)) + 1)
    # 다리·꼬리 사이에 갇힌 바탕(11/27 프렌치불독·스피츠): 바탕색에 아주 가까운(거리 < 12) 덩어리 중 150칸 넘는 것은 바탕 — 흰 털의 초록빛 그림자는 거리 20쯤이라 남는다(24로 했다가 슈나우저·스피츠 털에 구멍).
    # 그보다 작은 구멍만 메운다(눈 반짝임 등).  
    tight = np.sqrt(((rgb - bgc) ** 2).sum(2)) < 12
    tl, tk = ndi.label(tight & dog)
    if tk:
        ts = ndi.sum(np.ones_like(tl), tl, np.arange(1, tk + 1))
        dog &= ~np.isin(tl, [i + 1 for i, v in enumerate(ts) if v > 150])
    holes = ndi.binary_fill_holes(dog) & ~dog
    hl, hk = ndi.label(holes)
    if hk:
        hs = ndi.sum(np.ones_like(hl), hl, np.arange(1, hk + 1))
        dog |= np.isin(hl, [i + 1 for i, v in enumerate(hs) if v <= 150])
    bg = ~dog
    # 바탕은 여기서 바로 투명으로(11/27 베들링턴 — 흰 털이 흰 바탕과 이어져 dot-dog-cutout.py가 못 지웠다).
    # 자르기·키 맞추기·저장은 dot-dog-cutout.py와 같게(키 768px, 여백 16px) → dot-dog-native.py
    a = np.where(bg, 0, 255).astype(np.uint8)
    ys, xs = np.where(a > 0)
    im = Image.fromarray(np.dstack([rgb.astype(np.uint8), a]), 'RGBA').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    H, PAD = 768, 16
    w, h = im.size
    s = H / h
    nw = round(w * s)
    sm = im.convert('RGBa').resize((nw, H), Image.BOX if s < 1 else Image.NEAREST).convert('RGBA')
    out = Image.new('RGBA', (nw + PAD * 2, H + PAD * 2), (0, 0, 0, 0))
    out.alpha_composite(sm, (PAD, PAD))
    dst = os.path.join(ROOT, 'icons', 'dot-dogs', name + '.webp')
    out.save(dst, 'WEBP', quality=92, method=6, alpha_quality=100)
    print(f'{dst}: 강아지 {w}x{h} → x{s:.3f} → 그림 {out.size[0]}x{out.size[1]}, {os.path.getsize(dst) // 1024}KB')
    subprocess.run([sys.executable, os.path.join(ROOT, '_dev', 'dot-dog-native.py'), name], check=True)

if __name__ == '__main__':
    main()
