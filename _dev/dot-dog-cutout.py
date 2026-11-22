# 도트 강아지 그림 → 흰 바탕 지우고 키를 맞춘 투명 WebP (2026-11-22, mini-dog-sample.html의 icons/dot-dogs/*.webp를 만든 것)
#
# 왜: 받은 도트 그림은 흰 바탕에 강아지 크기가 제각각이다. 견본에 나란히 놓으려면 바탕을 지우고 강아지 키를 똑같이 맞춰야 한다.
#
# 쓰는 법(저장소 맨 위에서, pip pillow numpy scipy):
#   python3 _dev/dot-dog-cutout.py 받은그림.webp pom
#   → icons/dot-dogs/pom.webp (강아지 키 768px + 둘레 16px 여백, 바탕 투명)
#   → 이어서 _dev/dot-dog-native.py가 저절로 돌아 icons/dot-dogs/px/pom.png(원래 점 격자 그대로, 산책 아지트 B안이 씀)도 만든다
#
# 바탕 찾는 법: 밝은 칸(RGB 가장 어두운 값 200 이상)을 4방향으로 이어 덩어리를 만들고, 그림 가장자리에 닿은 덩어리 중
# "거의 흰색(평균 252 이상)·고른 색(표준편차 3.5 미만)"만 바탕으로 본다. 도트 그림은 강아지 둘레에 검은 선이 있어서 털 안으로 번지지 않고,
# 그림 밖으로 잘린 털(꼬리·다리)은 가장자리에 닿아도 색이 고르지 않아 남는다. 그다음 검은 선 바깥의 옅은 회색 번짐 1px을 지운다.
import os, sys, subprocess
from PIL import Image
import numpy as np
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'icons', 'dot-dogs')
H = 768    # 강아지 키(모두 같게)
PAD = 16   # 둘레 여백(모두 같게)


def cutout(path):
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    mn = rgb.min(2)
    lab, k = ndi.label(mn >= 200)                      # 4방향으로 이어진 밝은 덩어리
    idx = np.arange(1, k + 1)
    means = np.stack([ndi.mean(rgb[..., c], lab, idx) for c in range(3)], 1)
    sq = np.stack([ndi.mean(rgb[..., c].astype(np.int32) ** 2, lab, idx) for c in range(3)], 1)
    std = np.sqrt(np.maximum(sq - means ** 2, 0))
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, [b for b in edge if means[b - 1].min() >= 252 and std[b - 1].max() < 3.5])
    bg |= ndi.binary_dilation(bg) & ~bg & (mn >= 150)  # 선 바깥 옅은 번짐 1px
    a = np.where(bg, 0, 255).astype(np.uint8)
    ys, xs = np.where(a > 0)
    im = Image.fromarray(np.dstack([rgb.astype(np.uint8), a]), 'RGBA')
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def main():
    if len(sys.argv) != 3:
        print('쓰는 법: python3 _dev/dot-dog-cutout.py 받은그림.webp 이름(영문)')
        sys.exit(1)
    im = cutout(sys.argv[1])
    w, h = im.size
    s = H / h
    nw = round(w * s)
    # 미리 곱한 알파로 줄여야 가장자리에 흰 테가 안 생긴다
    sm = im.convert('RGBa').resize((nw, H), Image.BOX if s < 1 else Image.NEAREST).convert('RGBA')
    out = Image.new('RGBA', (nw + PAD * 2, H + PAD * 2), (0, 0, 0, 0))
    out.alpha_composite(sm, (PAD, PAD))
    os.makedirs(OUT, exist_ok=True)
    dst = os.path.join(OUT, sys.argv[2] + '.webp')
    out.save(dst, 'WEBP', quality=92, method=6, alpha_quality=100)
    print(f'{dst}: 강아지 {w}x{h} → x{s:.3f} → 그림 {out.size[0]}x{out.size[1]}, {os.path.getsize(dst) // 1024}KB')
    subprocess.run([sys.executable, os.path.join(ROOT, '_dev', 'dot-dog-native.py'), sys.argv[2]], check=True)


if __name__ == '__main__':
    main()
