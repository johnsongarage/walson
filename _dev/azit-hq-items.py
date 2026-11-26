# 아지트 기본 방 소품 14개(★)를 고화질로 다시 그린 것 넣기 (2026-11-25)
#
# 가르시아 "원본 저장소에 없는 소품들 다시 만들게" → Claude가 만든 견본(지금 그림을 흐리게 키운 2×2 칸 4장, 굵은 점을 베끼지 않게) +
# 화풍 견본(sian-ref/azit-redo/sheet3.jpg)을 Gemini에 주고 받은 그림 넷 = sian-ref/azit-hq/star-1~4.webp(원본 그대로 보관).
#   star-1: 강아지 소파 · 가게 방석 / 러그 · 밥그릇        star-2: 장난감 바구니 · 뼈다귀 / 공 · 화분
#   star-3: 트로피 · 등급 액자 / 금색 액자 · 강아지 초상화  star-4: 오늘의 한 장 게시판 · 가랜드
#
# 하는 일(azit-redo-items.py의 자르기·색 줄이기·줄이기·테두리를 그대로 씀):
#   1) 흰 바탕 지우기 + 바닥에 남은 옅은 푸른 회색 그림자 띠 벗기기(바깥에서부터, 진한 테두리에서 멈춤)
#   2) 고화질판 icons/azit-hq/<그림 이름>.webp(투명 바탕, 긴 변 최대 512) — 소품 보기 창·튜토리얼처럼 크게 보여 줄 때
#   3) 방 그림 icons/azit-room/<그림 이름>.png — 예전 방 그림(sian-ref/azit-hq/old-room, 11/25 전 것)과 같은 좌우 방향
#      (모양을 겹쳐 보아 더 맞는 쪽)·그 크기 칸 안에 맞게 줄임. 트로피(새 그림에 벽 선반이 없음)·가랜드(모서리를 가로지르는
#      긴 줄이 아니라 짧은 반원)는 방 그림을 그대로 둔다(고화질판만)
#   4) 금색 액자 → 우리 개 사진 액자(frame_photo) · 강아지 초상화 → 단짝 액자(frame_pal): 속 그림 칸을 찾아(그림 색 덩어리의
#      볼록 껍질 — 강아지·곰이 가장자리에 닿아도 칸 전체) 자홍색으로 칠한 채 같은 길로 줄인 뒤 그 자리를 알파 1(앱이 사진을
#      그려 넣는 칸)로. 예전 azit-extra.py hollow(테두리 4점 고정)는 새 그림 테두리 두께와 달라 그림이 남거나 테두리에 구멍이 났다
#   azit.html picV — 바꾼 그림은 주소 ?v=5(예전 그림이 캐시에 남지 않게)
#
# 쓰는 법(pip pillow numpy opencv-python-headless): python3 _dev/azit-hq-items.py [sian-ref/azit-hq] [icons]
import os, sys, importlib.util
import numpy as np
import cv2
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "sian-ref/azit-hq"
ICONS = sys.argv[2] if len(sys.argv) > 2 else "icons"
ROOM, HQ = os.path.join(ICONS, "azit-room"), os.path.join(ICONS, "azit-hq")
REF = os.path.join(SRC, "old-room")   # 11/25 전 방 그림 — 크기·좌우 기준(다시 돌려도 같은 결과)
here = os.path.dirname(os.path.abspath(__file__))


def load_mod(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(here, file))
    m = importlib.util.module_from_spec(spec)
    sys.argv, keep = [sys.argv[0]], sys.argv   # 그 파일이 sys.argv를 읽어서 잠깐 비움
    spec.loader.exec_module(m)
    sys.argv = keep
    return m


redo = load_mod("redo", "azit-redo-items.py")   # cut · quantize · outline · azfit(downscale)

SHEETS = {
    "star-1.webp": ["sofa_bed", "cushion_cafe_beige", "rug_pattern", "feeder_wood_2bowl"],
    "star-2.webp": ["basket_blue_carrot", "toy_bone", "ball_yellow", "plant_pot"],
    "star-3.webp": ["trophy_shelf", "frame_jelly_pink", "frame_gold", "frame_dog"],
    "star-4.webp": ["board_postcard", "garland_bunting"],
}
KEEP_ROOM = {"trophy_shelf", "garland_bunting"}   # 트로피: 새 그림에 벽 선반이 없음 · 가랜드: 방 모서리를 가로지르는 긴 줄인데 새 그림은 짧은 반원 — 방에선 예전 그림
HOLLOW = {"frame_gold": "frame_photo", "frame_dog": "frame_pal"}
PAINT = {   # 액자 속 그림 칸의 색 — 금색 액자: 숲 그림(초록·청록·하늘) · 강아지 초상화: 크림 바탕
    "frame_gold": lambda r, g, b: (g > r + 8) | (b > r + 20),
    "frame_dog": lambda r, g, b: (r > 200) & (g > 185) & (b > 140) & (r - b < 80),
}


def boxes_of(rgb):
    """소품 덩어리 [x, y, w, h] — 줄(가운데 높이가 가까운 것끼리) → 줄 안은 왼쪽부터"""
    fg = (rgb.min(axis=2) < 225).astype(np.uint8)
    fg = cv2.dilate(fg, np.ones((15, 15), np.uint8))
    k, lab, st, cen = cv2.connectedComponentsWithStats(fg, 8)
    cs = [(st[i][:4].tolist(), cen[i]) for i in range(1, k) if st[i][4] > 2500]
    cs.sort(key=lambda c: c[1][1])
    rows, cur = [], []
    for c in cs:
        if cur and abs(c[1][1] - np.mean([d[1][1] for d in cur])) > 180:
            rows.append(cur); cur = []
        cur.append(c)
    if cur:
        rows.append(cur)
    return [c[0] for r in rows for c in sorted(r, key=lambda c: c[1][0])]


def iou(a, b):
    return (a & b).sum() / max(1, (a | b).sum())


def facing(new_rgba, old_rgba):
    """새 그림을 예전 그림 크기로 줄여 모양을 겹쳐 보고, 좌우를 뒤집는 편이 더 맞으면 True"""
    h, w = old_rgba.shape[:2]
    m = cv2.resize((new_rgba[..., 3] > 0).astype(np.uint8), (w, h), interpolation=cv2.INTER_AREA) > 0
    o = old_rgba[..., 3] > 0
    return iou(m[:, ::-1], o) > iou(m, o) + 0.02, iou(m, o), iou(m[:, ::-1], o)


def crop_alpha(img):
    ys, xs = np.nonzero(img[..., 3])
    return img[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def peel_shadow(img, steps=16):
    """바닥에 남은 옅은 푸른 회색 그림자 띠(예: 195,200,216)를 바깥에 닿은 것부터 한 겹씩 벗긴다 — 진한 테두리에서 멈춤.
    cut()은 회색 그림자(채도 16 미만)만 바탕으로 보는데 이번 그림의 그림자는 조금 푸르러서 남았다"""
    a = img.copy()
    rgb = a[..., :3].astype(int)
    mx, mn = rgb.max(-1), rgb.min(-1)
    sh = (mn > 140) & (mx - mn < 60) & (rgb[..., 2] - rgb[..., 0] >= 6)
    n = 0
    for _ in range(steps):
        op = a[..., 3] > 0
        out = np.pad(~op, 1, constant_values=True)
        near = out[:-2, 1:-1] | out[2:, 1:-1] | out[1:-1, :-2] | out[1:-1, 2:]
        kill = op & near & sh
        if not kill.any():
            break
        a[kill] = 0
        n += int(kill.sum())
    return crop_alpha(a), n


def canvas_of(img, name):
    """액자 속 그림 칸 — 그림 색 덩어리(아주 작은 부스러기 빼고)의 볼록 껍질"""
    rgb = img[..., :3].astype(int)
    m = (PAINT[name](rgb[..., 0], rgb[..., 1], rgb[..., 2]) & (img[..., 3] > 0)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    k, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    big = st[1:, 4].max()
    keep = [i for i in range(1, k) if st[i, 4] >= max(30, big * 0.01)]   # 강아지 몸이 그림을 갈라도(오른쪽 아래 풀밭) 조각까지 — 액자 테두리엔 이 색이 없다
    ys, xs = np.nonzero(np.isin(lab, keep))
    hull = cv2.convexHull(np.column_stack([xs, ys]).astype(np.int32))
    out = np.zeros(m.shape, np.uint8)
    cv2.fillPoly(out, [hull], 1)
    return (out > 0) & (img[..., 3] > 0)


def to_room(full, f):
    q = crop_alpha(redo.quantize(full[..., :3].copy(), (full[..., 3] > 0).astype(np.uint8)))
    return redo.outline(redo.azfit.downscale(q, f))


def hollowed(full, name, f, shape):
    """속 그림 칸을 비운 방 그림 — 칸을 자홍색으로 칠해 같은 길로 줄인 뒤 자홍 자리를 알파 1로"""
    mk = full.copy()
    mk[canvas_of(full, name), :3] = (255, 0, 255)
    small = to_room(mk, f)
    assert small.shape == shape, f"{name}: 속 비운 그림 크기가 다름 {small.shape} != {shape}"
    rgb = small[..., :3].astype(int)
    hole = (small[..., 3] > 0) & (rgb[..., 0] > 170) & (rgb[..., 1] < 100) & (rgb[..., 2] > 170)
    small[hole] = (0, 0, 0, 1)
    return small, int(hole.sum())


def main():
    os.makedirs(HQ, exist_ok=True)
    for fname, names in SHEETS.items():
        rgb = np.asarray(Image.open(os.path.join(SRC, fname)).convert("RGB"))
        bx = boxes_of(rgb)
        assert len(bx) == len(names), f"{fname}: 소품 {len(bx)}개(기대 {len(names)})"
        for name, box in zip(names, bx):
            c, a, _ = redo.cut(rgb, box, holes=1500)
            full = np.zeros(c.shape[:2] + (4,), np.uint8); full[..., :3] = c; full[..., 3] = a * 255
            full, peeled = peel_shadow(crop_alpha(full))
            old = crop_alpha(np.asarray(Image.open(os.path.join(REF, name + ".png")).convert("RGBA")))
            flip, i0, i1 = facing(full, old)
            if flip:
                full = full[:, ::-1].copy()
            # 고화질판
            hq = Image.fromarray(full)
            if max(hq.size) > 512:
                k = 512 / max(hq.size); hq = hq.resize((round(hq.width * k), round(hq.height * k)), Image.LANCZOS)
            hq.save(os.path.join(HQ, name + ".webp"), quality=92, method=6)
            msg = f"{name}: 고화질 {hq.size[0]}×{hq.size[1]} · 그림자 {peeled}점 벗김 · 모양 겹침 {i0:.2f}/{i1:.2f}{' → 뒤집음' if flip else ''}"
            if name in KEEP_ROOM:
                print(msg + " · 방 그림은 그대로"); continue
            # 방 그림 — 예전 그림 칸 안에(가로·세로 중 더 빡빡한 쪽에 맞춤)
            f = min(old.shape[1] / full.shape[1], old.shape[0] / full.shape[0])
            small = to_room(full, f)
            Image.fromarray(small).save(os.path.join(ROOM, name + ".png"), optimize=True)
            print(msg + f" · 방 {small.shape[1]}×{small.shape[0]}(예전 {old.shape[1]}×{old.shape[0]})")
            if name in HOLLOW:
                hol, n = hollowed(full, name, f, small.shape)
                Image.fromarray(hol).save(os.path.join(ROOM, HOLLOW[name] + ".png"), optimize=True)
                print(f"  {HOLLOW[name]}: 그려 넣을 칸 {n}점")


if __name__ == "__main__":
    main()
