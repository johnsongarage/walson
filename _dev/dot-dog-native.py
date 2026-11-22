# 도트 강아지 그림 → 원래 점 격자 그대로(점 하나 = 한 픽셀) PNG (2026-11-23, azit-sian-b.html의 icons/dot-dogs/px/*.png를 만든 것)
#
# 왜: 받은 도트 그림은 강아지마다 점 크기가 다르다(키 65점 ~ 188점). dot-dog-cutout.py가 키를 768px로 맞추면서 점 하나가
# 4~12px의 소수 크기가 됐고 경계도 살짝 번졌다. 방에 작게 놓을 때 이 그림을 그냥 줄이면 번져 보이고(11/22 "너무 고퀄"),
# 칸 수를 줄여 다시 찍으면 얼굴이 뭉개진다(11/23 "뭉개지는데 그대로 못 살리냐"). 그래서 원래 점 격자를 찾아 점마다 색 하나로
# 되돌려 두고, 화면에서는 이 점들을 번지지 않게(가장 가까운 점으로) 키워 그린다.
#
# 쓰는 법(저장소 맨 위에서, pip pillow numpy):
#   python3 _dev/dot-dog-native.py            → icons/dot-dogs/*.webp 전부
#   python3 _dev/dot-dog-native.py pom shiba  → 그 강아지만
#   → icons/dot-dogs/px/<이름>.png (투명 바탕, 점 하나 = 한 픽셀)
#   dot-dog-cutout.py로 새 강아지를 넣으면 이것도 저절로 돈다.
#
# 찾는 법: 색이 바뀌는 경계의 세기를 세로줄·가로줄마다 더한 값으로
#   1) 점 간격(피치) = 자기상관의 첫 봉우리(소수점까지), 2) 위상 = 그 간격의 고른 격자를 경계 세기 합이 가장 큰 곳에,
#   3) 경계마다 ±30% 안에서 가장 센 곳으로 살짝 옮김(그림이 아주 고르지 않을 때), 4) 점마다 가운데 절반만 보고
#   불투명이 절반 넘으면 그 가운데값 색. 되돌린 그림을 다시 키워 원래 그림과 나란히 놓고 눈으로 맞춰 봤다(8마리 모두 같음).
import os, sys, glob
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'icons', 'dot-dogs')
OUT = os.path.join(SRC, 'px')


def edge_profile(a, axis):
    rgb = a[..., :3].astype(np.float32)
    al = a[..., 3].astype(np.float32) / 255
    if axis == 1:   # x-1과 x 사이의 경계 → 자리 x
        d = np.abs(np.diff(rgb, axis=1)).sum(2) + 255 * np.abs(np.diff(al, axis=1))
        return np.concatenate([[0], d.sum(0)])
    d = np.abs(np.diff(rgb, axis=0)).sum(2) + 255 * np.abs(np.diff(al, axis=0))
    return np.concatenate([[0], d.sum(1)])


def find_pitch(p):
    q = p - np.convolve(p, np.ones(31) / 31, mode='same')   # 큰 흐름 빼기
    ac = np.correlate(q, q, mode='full')[len(q) - 1:]
    ac /= ac[0]
    best = None
    for L in range(3, 40):
        if ac[L] > ac[L - 1] and ac[L] >= ac[L + 1]:
            y0, y1, y2 = ac[L - 1], ac[L], ac[L + 1]
            den = y0 - 2 * y1 + y2
            off = 0.5 * (y0 - y2) / den if den else 0
            if best is None or ac[L] > best[1]:
                best = (L + off, ac[L])
            if ac[L] > 0.15:
                break
    if best is None:
        raise ValueError('점 간격을 못 찾음 — 도트 그림이 맞나요?')
    return best[0]


def find_cuts(p, pitch):
    n = len(p)
    xs = np.arange(n)
    best = (-1.0, 0.0)
    for ph in np.arange(0, pitch, 0.25):
        sc = np.interp(np.arange(ph, n, pitch), xs, p).sum()
        if sc > best[0]:
            best = (sc, ph)
    r = max(1, int(round(pitch * 0.3)))
    out = []
    for c in np.arange(best[1], n, pitch):
        c0 = int(round(c))
        lo, hi = max(0, c0 - r), min(n - 1, c0 + r)
        c1 = lo + int(np.argmax(p[lo:hi + 1])) if hi >= lo else c0
        if p[c1] <= 0 or (out and c1 - out[-1] < pitch * 0.5):
            c1 = c0
        if out and c1 <= out[-1]:
            continue
        out.append(c1)
    if out[0] > 0:
        out = [0] + out if out[0] > pitch * 0.5 else [0] + out[1:]
    if out[-1] < n:
        out.append(n)
    return np.array(out)


def to_native(a):
    ys, xs = np.where(a[..., 3] > 0)
    a = a[max(0, ys.min() - 2):ys.max() + 3, max(0, xs.min() - 2):xs.max() + 3]
    pitch = (find_pitch(edge_profile(a, 1)) + find_pitch(edge_profile(a, 0))) / 2
    cx, cy = find_cuts(edge_profile(a, 1), pitch), find_cuts(edge_profile(a, 0), pitch)
    out = np.zeros((len(cy) - 1, len(cx) - 1, 4), np.uint8)
    for j in range(len(cy) - 1):
        y0, y1 = cy[j], cy[j + 1]
        my0, my1 = y0 + (y1 - y0) // 4, y1 - (y1 - y0) // 4
        for i in range(len(cx) - 1):
            x0, x1 = cx[i], cx[i + 1]
            mx0, mx1 = x0 + (x1 - x0) // 4, x1 - (x1 - x0) // 4
            blk = a[my0:max(my1, my0 + 1), mx0:max(mx1, mx0 + 1)].reshape(-1, 4)
            op = blk[:, 3] > 127
            if op.mean() < 0.5:
                continue
            out[j, i, :3] = np.median(blk[op, :3], 0)
            out[j, i, 3] = 255
    ys, xs = np.where(out[..., 3] > 0)
    return out[ys.min():ys.max() + 1, xs.min():xs.max() + 1], pitch


def main():
    names = sys.argv[1:] or sorted(os.path.basename(f)[:-5] for f in glob.glob(os.path.join(SRC, '*.webp')))
    os.makedirs(OUT, exist_ok=True)
    for n in names:
        a = np.asarray(Image.open(os.path.join(SRC, n + '.webp')).convert('RGBA'))
        nat, pitch = to_native(a)
        dst = os.path.join(OUT, n + '.png')
        Image.fromarray(nat, 'RGBA').save(dst, optimize=True)
        print(f'{dst}: 점 간격 {pitch:.2f}px → {nat.shape[1]}x{nat.shape[0]}점, {os.path.getsize(dst) // 1024}KB')


if __name__ == '__main__':
    main()
