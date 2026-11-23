# 아지트 소품 시트(AI로 만든 도트 그림 한 장에 소품 여러 개) → 소품마다 투명 PNG (2026-11-23)
#
# 받은 것: 가르시아가 준 Gemini 추출 코드(gemini-code-1795437876317.py)를 점검해 고친 판.
# 받은 코드에서 고친 것:
#   1) 네모로만 잘라서 옆 소품 귀퉁이가 같이 들어감(러그에 파란 방석·식기대 끝) → 그 소품 덩어리 밖은 투명으로.
#   2) 바탕 지우기를 왼쪽 위 한 점에서만 시작 → 가장자리에 닿은 흰 바탕을 모두 지움(가운데 흰 털·꽃잎은 그대로).
#   3) 시트는 원래 작은 도트 그림을 10배쯤 키운 것(점 하나 = 약 10px, 경계가 살짝 번짐) → 점 격자를 찾아
#      칸마다 색 하나로 되돌린 '원래 점' PNG(native/)도 같이 만든다. 방에는 이걸 번지지 않게 키워 쓴다.
#      (dot-dog-native.py와 같은 생각 — 큰 그림을 그대로 줄이면 뭉개진다.)
#   4) 시트 두 장 추가(공·터그로프·악세사리 13종, 액자·엽서·화분·가게방석 9종 — 가르시아가 준 목록).
#   5) 잘라 낸 것을 이름표와 함께 한 장에 모은 확인 그림(_check.png) — 이름 순서가 틀렸는지 눈으로 본다.
#   6) 이름 순서를 "위 끝 220px 단위 줄"에서 "가운데 높이가 가까운 것끼리 한 줄"로 — 소품·트로피 시트에서 키 큰 걸이 화분이
#      배너보다 앞줄로 잡혀 이름이 밀렸다. 같은 줄은 왼쪽 → 오른쪽. 시트 배치가 바뀌면 _check.png로 확인.
#   7) 창문 시트(낮·밤·비·눈) — 그림마다 뒤에 벽 조각이 붙어 있어 strip_wall로 떼어 낸다(WALL_CHUNK).
# 방에 놓을 크기 맞추기는 다음 단계 _dev/azit-fit.py.
#
# 쓰는 법(pip pillow numpy opencv-python-headless):
#   python3 _dev/azit-sheet-slice.py <시트 폴더> <내보낼 폴더>
#   → <내보낼 폴더>/sliced_pngs/*.png(큰 그림, 투명 바탕) · native/*.png(점 하나 = 한 픽셀) · empty_room_bg.png ·
#     _check.png · walson_assets.zip
import os, sys, zipfile
import cv2
import numpy as np
from PIL import Image, ImageDraw

SHEET_CONFIG = {
    "b2b08406.jpeg": [  # 가구·식기 (8)
        "sofa_bed", "cushion_yellow", "cushion_pink", "cushion_blue",
        "rug_pattern", "feeder_wood_2bowl", "feeder_blue_2bowl", "water_bowl_blue"],
    "efce6880.jpeg": [  # 소품·트로피 (9)
        "basket_wicker_carrot", "basket_blue_carrot", "trophy_shelf",
        "banner_flag_blue", "toy_bone", "plant_pot",
        "plant_hanging", "garland_bunting", "frame_dog"],
    "1107d6a6.jpeg": [  # 강아지·동물 (6)
        "dog_chihuahua", "dog_maltese", "dog_brown",
        "dog_cream_poodle", "cat_calico", "rabbit_brown"],
    "toy_acc_sheet.jpg": [  # 공·터그로프·산책 악세사리 (13)
        "ball_yellow", "ball_watermelon", "ball_pastel", "ball_tennis", "ball_spiky_pink_1",
        "ball_spiky_pink_2", "toy_rope_blue", "acc_horn_green_1", "acc_arrow_red",
        "acc_horn_green_2", "acc_horn_pink", "acc_arrow_double_red", "acc_arrow_blue"],
    "frame_plant_cafe_sheet.jpg": [  # 액자·엽서·화분·가게방석 (9)
        "frame_gold", "frame_jelly_pink", "board_postcard",
        "postcard_paw", "plant_cherry_blossom", "plant_cactus",
        "plant_daisy", "cushion_cafe_beige", "cushion_cafe_mint"],
    "window_sheet.png": [  # 창문 — 낮·밤·비·눈 (4, 11/23 추가 — 오른쪽 벽 방향)
        "window_day", "window_night", "window_rain", "window_snow"],
    # 11/23 밤 가르시아 "에셋을 추가해봤어 같은 느낌으로 실제로 추가해줘" — 세 장. 앞 둘은 그림 아래 한글 이름표가 있어서
    # 순서 대신 그림 가운데 자리(시트 점 좌표)로 이름을 붙인다(NAMED_AT — 이름 없는 덩어리 = 이름표라 건너뜀).
    "text_sheet.png": [],        # 글자 소품(말풍선·팻말·족자·스탬프·판넬) — Gemini_Generated_Image_ql7bev…
    "fun_sheet.png": [],         # 풍선·삑삑이·노즈워크·카페 컵·네온·황금 똥·파라솔·라바콘·붕어빵 — Gemini_Generated_Image_oxuvbo…
    "supplies_sheet.jpg": [],    # 생활용품(배변판·봉투 디스펜서·계단·유모차·리드줄 걸이·우비·사료통·간식통·미용 바구니·넥 쿠션) — Pixel_art_dog_supplies…
}
NAMED_AT = {   # 시트: [(이름, 그림 가운데 x, y)] — 가장 가까운 덩어리(160px 안)에 그 이름
    "text_sheet.png": [("sign_snack", 975, 295), ("bubble_interior", 1594, 292), ("bubble_chihuahua", 2292, 307),
                       ("bubble_visited", 387, 323), ("scroll_dogslife", 370, 994), ("board_refuse", 951, 1015),
                       ("stamp_regular", 1849, 756), ("sign_meetup", 1402, 1132), ("panel_guestbook", 2406, 1163),
                       ("bubble_poop", 1852, 1189)],
    "fun_sheet.png": [("balloons", 303, 342), ("neon_chihuahua", 2043, 350), ("toy_chicken", 718, 409),
                      ("nosework_mat", 1222, 401), ("cafe_cup", 1667, 405), ("trophy_poop", 2472, 433),
                      ("parasol_set", 1327, 1089), ("sign_refuse", 782, 1141), ("cone_barricade", 1898, 1183),
                      ("cart_bungeoppang", 2411, 1180)],
    "supplies_sheet.jpg": [("pet_stairs", 1686, 367), ("pee_pad", 432, 361), ("bag_dispenser", 1072, 338),
                           ("stroller", 381, 1004), ("leash_hook", 1070, 1027), ("raincoat_rack", 1716, 1065),
                           ("food_box", 365, 1688), ("treat_jar", 834, 1745), ("grooming_basket", 1244, 1755),
                           ("donut_cushion", 1736, 1747)],
}
# 점 간격을 직접 정한 시트 — 자동 추정이 몇 배 큰 값을 잡아서(격자를 겹쳐 보고 정함, 11/23 밤)
PITCH = {"text_sheet.png": 5.75, "fun_sheet.png": 7.35, "supplies_sheet.jpg": 5.125}
WALL_CHUNK = {"window_sheet.png"}   # 소품 뒤에 벽 조각이 같이 그려진 시트 — 벽 조각을 떼어 낸다(strip_wall)
# 손으로 지울 곳(벽 떼기 뒤 원래 점 좌표, x0·y0·x1·y1 끝 포함) — 걸레받이 띠가 두 줄 테두리 사이에 끼어 자동으로 안 떨어진 곳.
# 이 시트 파일(Gemini_Generated_Image_hu9k4z…)에만 맞는 값. 시트를 새로 받으면 _check.png를 보고 다시 잡는다.
HAND_ERASE = {
    "window_night": [(0, 48, 9, 68)],     # 왼쪽 커튼 밖 걸레받이
    "window_rain": [(67, 84, 80, 101)],   # 오른쪽 커튼 밖 걸레받이
}
BG_IMAGE = "f87e4656.jpeg"   # 빈 방 배경


def load_rgb(path):
    return np.asarray(Image.open(path).convert("RGB"))   # webp·jpeg·png 다 (cv2.imread는 확장자와 내용이 다르면 가끔 실패)


def background_mask(rgb, tol=232):
    # 흰 바탕 = 거의 흰 점 가운데 그림 가장자리에 닿아 있는 덩어리
    white = (rgb.min(axis=2) >= tol).astype(np.uint8)
    n, lab = cv2.connectedComponents(white, connectivity=4)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    return np.isin(lab, list(edge)) & (white == 1)


def grid_of(rgb, fg):
    # 점 간격(피치)과 위상 — 색이 바뀌는 경계를 세로줄·가로줄마다 더해서 주기를 찾는다
    d = rgb.astype(np.int32)
    ex = (np.abs(np.diff(d, axis=1)).sum(2) > 60) & fg[:, 1:]
    ey = (np.abs(np.diff(d, axis=0)).sum(2) > 60) & fg[1:, :]
    px, py = ex.sum(0).astype(float), ey.sum(1).astype(float)
    best = None
    for p in np.arange(6, 40.01, 0.25):
        s = 0
        for prof in (px, py):
            t = np.arange(len(prof))
            s += (np.abs((prof * np.exp(2j * np.pi * t / p)).sum()) / (prof.sum() + 1)) ** 2
        if best is None or s > best[1]:
            best = (p, s)
    p = best[0]

    def phase(prof):   # 경계(diff 자리 k = k와 k+1 사이)가 가장 많이 몰리는 위치
        t = np.arange(len(prof))
        return (np.angle((prof * np.exp(2j * np.pi * t / p)).sum()) / (2 * np.pi) * p + 1) % p
    return p, phase(px), phase(py)


def to_native(rgb, alpha, x0, y0, x1, y1, p, ox, oy, with_origin=False):
    # [x0,x1)×[y0,y1) 를 점 격자대로 칸마다 색 하나(가운데 부분의 중앙값)
    cx0 = int(np.floor((x0 - ox) / p)); cx1 = int(np.ceil((x1 - ox) / p))
    cy0 = int(np.floor((y0 - oy) / p)); cy1 = int(np.ceil((y1 - oy) / p))
    W, H = cx1 - cx0, cy1 - cy0
    out = np.zeros((H, W, 4), np.uint8)
    m = max(1, int(p * 0.25))
    for j in range(H):
        for i in range(W):
            a0 = int(round(ox + (cx0 + i) * p)); b0 = int(round(oy + (cy0 + j) * p))
            a1 = int(round(ox + (cx0 + i + 1) * p)); b1 = int(round(oy + (cy0 + j + 1) * p))
            a0c, a1c, b0c, b1c = max(a0, 0), min(a1, rgb.shape[1]), max(b0, 0), min(b1, rgb.shape[0])
            if a1c <= a0c or b1c <= b0c:
                continue
            if alpha[b0c:b1c, a0c:a1c].mean() < 0.5:
                continue
            ia0, ia1, ib0, ib1 = max(a0 + m, 0), min(a1 - m, rgb.shape[1]), max(b0 + m, 0), min(b1 - m, rgb.shape[0])
            inner = rgb[ib0:ib1, ia0:ia1] if ia1 > ia0 and ib1 > ib0 else rgb[b0c:b1c, a0c:a1c]
            inner_a = alpha[ib0:ib1, ia0:ia1] if ia1 > ia0 and ib1 > ib0 else alpha[b0c:b1c, a0c:a1c]
            px = inner[inner_a > 0] if (inner_a > 0).any() else inner.reshape(-1, 3)
            out[j, i, :3] = np.median(px, axis=0)
            out[j, i, 3] = 255
    ys, xs = np.nonzero(out[:, :, 3])
    org = (cx0, cy0)
    if len(xs):
        out = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        org = (cx0 + xs.min(), cy0 + ys.min())
    return (out, org) if with_origin else out


def strip_wall(nat, big_luma=None, grid=None, org=None):
    # 창문 시트처럼 소품 뒤에 벽 조각이 같이 그려진 것 — 바깥(투명)에서부터 벽처럼 밝은 점만 따라 들어가 지운다.
    # 커튼·창틀·봉은 벽보다 확실히 어두운 테두리로 둘러싸여 있어서 거기서 멈춘다(커튼 안쪽이 벽과 비슷한 색이어도 안전).
    # 테두리가 원래 점 칸의 반이 안 되게 걸친 곳은 원래 점(가운데값)에선 끊겨 보인다(눈 창 왼쪽 커튼) —
    # 그래서 막힘은 큰 그림에서 칸마다 어두운 점이 30% 넘는지로 본다(big_luma·grid·org가 있을 때).
    rgb = nat[:, :, :3].astype(np.int32)
    op = nat[:, :, 3] > 0
    luma = rgb[:, :, 0] * 0.299 + rgb[:, :, 1] * 0.587 + rgb[:, :, 2] * 0.114
    H, W = op.shape
    pad = np.pad(~op, 1, constant_values=True)
    touch = op & (pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:])
    wall_l = np.percentile(luma[touch], 70)                       # 바깥에 닿은 점 가운데 밝은 쪽 = 벽
    passable = luma >= wall_l - 45
    if big_luma is not None:
        p, ox, oy = grid
        for j in range(H):
            for i in range(W):
                x0 = int(round(ox + (org[0] + i) * p)); x1 = int(round(ox + (org[0] + i + 1) * p))
                y0 = int(round(oy + (org[1] + j) * p)); y1 = int(round(oy + (org[1] + j + 1) * p))
                cell = big_luma[max(y0, 0):max(y1, 0), max(x0, 0):max(x1, 0)]
                if cell.size and (cell < wall_l - 45).mean() >= 0.3:
                    passable[j, i] = False
    out = nat.copy()
    # 지우기 → 남은 한 점 굵기 선(걸레받이 줄) 끝에서부터 깎기 → 선 뒤에 갇혀 있던 벽 조각을 다시 지우기 … 바뀌지 않을 때까지
    for _round in range(6):
        a = out[:, :, 3] > 0
        seen = ~a
        frontier = list(zip(*np.nonzero(~a)))
        gone = np.zeros_like(a)
        while frontier:
            nxt = []
            for y, x in frontier:
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and not seen[yy, xx] and passable[yy, xx]:
                        seen[yy, xx] = True; gone[yy, xx] = True; nxt.append((yy, xx))
            frontier = nxt
        out[gone, 3] = 0
        pruned = 0
        for _ in range(40):
            a = out[:, :, 3] > 0
            pa = np.pad(a, 1)
            nb = pa[:-2, 1:-1].astype(int) + pa[2:, 1:-1] + pa[1:-1, :-2] + pa[1:-1, 2:]
            tip = a & (nb <= 1)
            if not tip.any():
                break
            out[tip, 3] = 0; pruned += int(tip.sum())
        if not gone.any() and not pruned:
            break
    keep = out[:, :, 3] > 0                                      # 떨어져 남은 작은 벽 부스러기 지우기
    n, lab, st, _ = cv2.connectedComponentsWithStats(keep.astype(np.uint8), connectivity=8)
    if n > 2:
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        for i in range(1, n):
            if i != big and st[i, cv2.CC_STAT_AREA] < 40:
                out[lab == i, 3] = 0
    ys, xs = np.nonzero(out[:, :, 3])
    return out[ys.min():ys.max() + 1, xs.min():xs.max() + 1], (xs.min(), ys.min())


def extract(path, names, out_big, out_native, made):
    if not os.path.exists(path):
        print(f"시트가 없어서 건너뜀: {path}")
        return
    rgb = load_rgb(path)
    h, w, _ = rgb.shape
    bg = background_mask(rgb)
    fg = ~bg
    blobs = cv2.morphologyEx(fg.astype(np.uint8) * 255, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    blobs = cv2.dilate(blobs, np.ones((9, 9), np.uint8), iterations=1)
    contours, _ = cv2.findContours(blobs, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    items = []
    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        if bw < 45 or bh < 45:
            continue
        if x > w - 130 and y > h - 130 and bw < 110 and bh < 110:   # 오른쪽 아래 워터마크
            continue
        items.append((x, y, bw, bh, cnt))
    # 줄 나누기: 가운데 높이 순으로 놓고, 바로 앞 것과 200px 넘게 떨어지면 새 줄 — 줄 안은 왼쪽부터
    # (받은 코드의 "위 끝 220px 단위"는 키 큰 소품(걸이 화분)이 한 줄 위로 가서 이름이 밀렸다)
    items.sort(key=lambda b: b[1] + b[3] / 2)
    rows, prev = [], None
    for it in items:
        c = it[1] + it[3] / 2
        if prev is None or c - prev > 200:
            rows.append([])
        rows[-1].append(it); prev = c
    items = [it for r in rows for it in sorted(r, key=lambda b: b[0])]
    base = os.path.basename(path)
    if base in NAMED_AT:                                         # 자리로 이름 붙이기(이름표 덩어리는 버림)
        named, names = [], []
        for nm, cx, cy in NAMED_AT[base]:
            best = min(items, key=lambda b: (b[0] + b[2] / 2 - cx) ** 2 + (b[1] + b[3] / 2 - cy) ** 2)
            if (best[0] + best[2] / 2 - cx) ** 2 + (best[1] + best[3] / 2 - cy) ** 2 <= 160 ** 2:
                named.append(best); names.append(nm)
            else:
                print(f"  ! {nm}: 그 자리에 그림이 없음")
        items = named
    p, ox, oy = grid_of(rgb, fg)
    if base in PITCH:                                            # 직접 정한 간격 — 위상만 찾는다
        p = PITCH[base]
        d = rgb.astype(np.int32)
        ex = (np.abs(np.diff(d, axis=1)).sum(2) > 60) & fg[:, 1:]
        ey = (np.abs(np.diff(d, axis=0)).sum(2) > 60) & fg[1:, :]
        ph = lambda prof: (np.angle((prof * np.exp(2j * np.pi * np.arange(len(prof)) / p)).sum()) / (2 * np.pi) * p + 1) % p
        ox, oy = ph(ex.sum(0).astype(float)), ph(ey.sum(1).astype(float))
    print(f"{os.path.basename(path)}: 소품 {len(items)}개 (이름 {len(names)}개), 점 간격 {p:.2f}px")
    if len(items) != len(names):
        print(f"  ! 개수가 다름 — _check.png로 이름이 맞는지 꼭 보기")
    for idx, (x, y, bw, bh, cnt) in enumerate(items):
        name = names[idx] if idx < len(names) else f"extra_{idx + 1:02d}"
        own = np.zeros((h, w), np.uint8)
        cv2.drawContours(own, [cnt], -1, 1, thickness=cv2.FILLED)
        alpha = (own.astype(bool) & fg).astype(np.uint8)            # 이 덩어리 안의 그림만
        x0, y0, x1, y1 = max(0, x - 6), max(0, y - 6), min(w, x + bw + 6), min(h, y + bh + 6)
        nat, org = to_native(rgb, alpha, x0, y0, x1, y1, p, ox, oy, with_origin=True)
        if os.path.basename(path) in WALL_CHUNK:
            big_luma = rgb[:, :, 0] * 0.299 + rgb[:, :, 1] * 0.587 + rgb[:, :, 2] * 0.114
            nat, (sx, sy) = strip_wall(nat, big_luma, (p, ox, oy), org)
            org = (org[0] + sx, org[1] + sy)
            if name in HAND_ERASE:
                nat = nat.copy()
                for (ex0, ey0, ex1, ey1) in HAND_ERASE[name]:
                    nat[ey0:ey1 + 1, ex0:ex1 + 1, 3] = 0
                ys2, xs2 = np.nonzero(nat[:, :, 3])
                nat = nat[ys2.min():ys2.max() + 1, xs2.min():xs2.max() + 1]
                org = (org[0] + xs2.min(), org[1] + ys2.min())
            # 큰 그림도 같은 칸을 지운다(큰 그림 점 → 원래 점 칸)
            X, Y = np.meshgrid(np.arange(x0, x1), np.arange(y0, y1))
            ci = np.floor((X - ox) / p).astype(int) - org[0]
            cj = np.floor((Y - oy) / p).astype(int) - org[1]
            inside = (ci >= 0) & (ci < nat.shape[1]) & (cj >= 0) & (cj < nat.shape[0])
            keepc = np.zeros(ci.shape, bool)
            keepc[inside] = nat[cj[inside], ci[inside], 3] > 0
            alpha[y0:y1, x0:x1] &= keepc.astype(np.uint8)
        big = np.dstack([rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1] * 255]).astype(np.uint8)
        Image.fromarray(big).save(os.path.join(out_big, f"{name}.png"))
        Image.fromarray(nat).save(os.path.join(out_native, f"{name}.png"))
        made.append((name, big, nat))
        print(f"  {name}: {bw}x{bh} → 원래 점 {nat.shape[1]}x{nat.shape[0]}")


def check_sheet(made, path):
    cell, cols = 200, 6
    rows = (len(made) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell, rows * (cell + 16)), (255, 120, 200))   # 분홍 = 투명인 곳
    dr = ImageDraw.Draw(sheet)
    for n, (name, _, nat) in enumerate(made):
        im = Image.fromarray(nat)
        k = max(1, min((cell - 8) // im.width, (cell - 8) // im.height))
        im = im.resize((im.width * k, im.height * k), Image.NEAREST)
        x, y = (n % cols) * cell, (n // cols) * (cell + 16)
        sheet.paste(im, (x + 4, y + 4), im)
        dr.text((x + 4, y + cell), f"{name} {nat.shape[1]}x{nat.shape[0]}", fill=(0, 0, 0))
    sheet.save(path)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "."
    out = sys.argv[2] if len(sys.argv) > 2 else "walson_assets"
    out_big, out_native = os.path.join(out, "sliced_pngs"), os.path.join(out, "native")
    os.makedirs(out_big, exist_ok=True); os.makedirs(out_native, exist_ok=True)
    made = []
    for sheet, names in SHEET_CONFIG.items():
        extract(os.path.join(src, sheet), names, out_big, out_native, made)
    bgp = os.path.join(src, BG_IMAGE)
    if os.path.exists(bgp):
        rgb = load_rgb(bgp)
        Image.fromarray(rgb).save(os.path.join(out, "empty_room_bg.png"))
        p, ox, oy = grid_of(rgb, np.ones(rgb.shape[:2], bool))
        nat = to_native(rgb, np.ones(rgb.shape[:2], np.uint8), 0, 0, rgb.shape[1], rgb.shape[0], p, ox, oy)
        Image.fromarray(nat).save(os.path.join(out, "empty_room_bg_native.png"))
        print(f"빈 방 배경: 점 간격 {p:.2f}px → 원래 점 {nat.shape[1]}x{nat.shape[0]}")
    check_sheet(made, os.path.join(out, "_check.png"))
    zp = os.path.join(out, "walson_assets.zip")
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(out):
            for f in sorted(files):
                if f.endswith(".zip"):
                    continue
                full = os.path.join(root, f)
                zf.write(full, os.path.relpath(full, out))
    print(f"\n끝: {len(made)}개 → {zp}")


if __name__ == "__main__":
    main()
