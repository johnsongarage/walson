# 가르시아가 준 강아지 아이콘 그림(세로로 5개씩, 5벌)에서 아이콘을 하나씩 떼어 벡터(SVG 경로)로 바꾼다
# 선 덩어리(이어진 검은 픽셀) 단위로 묶어서 떼어 낸다 — 옆 아이콘의 조각이 섞이지 않게
import sys, json, os
import numpy as np
from PIL import Image
import potrace

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
SCALE = 4

def components(mask):
    H, W = mask.shape
    lab = np.zeros((H, W), np.int32)
    comps = {}
    ys, xs = np.nonzero(mask)
    cur = 0
    for y0, x0 in zip(ys.tolist(), xs.tolist()):
        if lab[y0, x0]: continue
        cur += 1
        lab[y0, x0] = cur
        stack = [(y0, x0)]
        y_min = y_max = y0; x_min = x_max = x0; n = 0
        while stack:
            y, x = stack.pop(); n += 1
            if y < y_min: y_min = y
            if y > y_max: y_max = y
            if x < x_min: x_min = x
            if x > x_max: x_max = x
            for dy in (-1, 0, 1):
                ny = y + dy
                if ny < 0 or ny >= H: continue
                for dx in (-1, 0, 1):
                    nx = x + dx
                    if 0 <= nx < W and mask[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = cur; stack.append((ny, nx))
        comps[cur] = (y_min, y_max, x_min, x_max, n)
    return lab, comps

def trace_svg_path(filled):
    bm = potrace.Bitmap(~filled)          # potracer는 False 쪽을 채움으로 본다
    plist = bm.trace(turdsize=30, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0, opticurve=True, opttolerance=0.4)
    parts = []
    f = lambda x, y: '%.1f %.1f' % (x / SCALE, y / SCALE)
    for curve in plist:
        s = curve.start_point
        d = ['M' + f(s.x, s.y)]
        for seg in curve.segments:
            if seg.is_corner:
                d.append('L' + f(seg.c.x, seg.c.y) + 'L' + f(seg.end_point.x, seg.end_point.y))
            else:
                d.append('C' + f(seg.c1.x, seg.c1.y) + ' ' + f(seg.c2.x, seg.c2.y) + ' ' + f(seg.end_point.x, seg.end_point.y))
        d.append('Z')
        parts.append(''.join(d))
    return ''.join(parts)

meta = {}
for n in range(1, 6):
    im = Image.open(os.path.join(SRC, '%d.webp' % n)).convert('L')
    a = np.array(im)
    mask = a < 120
    lab, comps = components(mask)
    items = sorted([(v[0], v[1], k) for k, v in comps.items() if v[4] >= 15])
    groups = []
    for y0, y1, k in items:                # 세로로 겹치거나 2px 안에 붙은 덩어리끼리 한 아이콘
        if groups and y0 <= groups[-1]['y1'] + 2:
            g = groups[-1]; g['ids'].append(k); g['y1'] = max(g['y1'], y1)
        else:
            groups.append({'y0': y0, 'y1': y1, 'ids': [k]})
    # 너무 긴 묶음(아이콘 두 개가 겹쳐 잡힘)은 덩어리들의 세로 중심 사이 빈틈이 가장 큰 곳에서 나눈다
    split = []
    for g in groups:
        if g['y1'] - g['y0'] > 230 and len(g['ids']) > 1:
            cs = sorted(g['ids'], key=lambda k: (comps[k][0] + comps[k][1]) / 2)
            centers = [(comps[k][0] + comps[k][1]) / 2 for k in cs]
            gaps = [centers[i + 1] - centers[i] for i in range(len(centers) - 1)]
            cut = gaps.index(max(gaps)) + 1
            for part in (cs[:cut], cs[cut:]):
                split.append({'y0': min(comps[k][0] for k in part), 'y1': max(comps[k][1] for k in part), 'ids': part})
        else:
            split.append(g)
    groups = split
    icons = []
    for gi, g in enumerate(groups):
        ids = g['ids']
        ys0 = min(comps[k][0] for k in ids); ys1 = max(comps[k][1] for k in ids)
        xs0 = min(comps[k][2] for k in ids); xs1 = max(comps[k][3] for k in ids)
        pad = 5
        r0, r1, c0, c1 = max(0, ys0 - pad), min(a.shape[0], ys1 + pad + 1), max(0, xs0 - pad), min(a.shape[1], xs1 + pad + 1)
        sub = a[r0:r1, c0:c1].astype(np.float32)
        own = np.isin(lab[r0:r1, c0:c1], ids)
        # 이 아이콘 덩어리가 아닌 검은 픽셀(옆 아이콘 조각)은 바탕으로 지운다 — 경계의 흐린 픽셀도 같이
        other = (lab[r0:r1, c0:c1] > 0) & ~own
        if other.any():
            o = np.pad(other, 2)
            grow = np.zeros_like(other)
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    grow |= o[2 + dy:2 + dy + other.shape[0], 2 + dx:2 + dx + other.shape[1]]
            sub[grow & ~own] = 240
        crop = Image.fromarray(sub.clip(0, 255).astype(np.uint8))
        big = crop.resize((crop.width * SCALE, crop.height * SCALE), Image.LANCZOS)
        filled = np.array(big) < 128
        path = trace_svg_path(filled)
        w, h = crop.width, crop.height
        name = 'set%d-%d' % (n, gi + 1)
        svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d"><path fill="#2b2118" fill-rule="evenodd" d="%s"/></svg>' % (w, h, w, h, path)
        open(os.path.join(OUT, name + '.svg'), 'w').write(svg)
        icons.append({'name': name, 'w': w, 'h': h, 'bytes': len(path)})
    meta[n] = icons
json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
for n, icons in meta.items():
    print(n, [(i['name'], i['w'], i['h'], i['bytes']) for i in icons])
