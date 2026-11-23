# 아지트 소품을 방에 놓을 크기로 맞추기 + 방에 놓아 본 미리보기 (2026-11-23)
#
# azit-sheet-slice.py 다음 단계. 가르시아 "창문까지 포함해서 방안에다 전시했을 때 어색하지 않도록 배율을 맞추는 단계를 해봐,
# 최대한 품질을 유지해줘".
#
# 재 본 것(분홍 빈 방 원래 점 394×220 — 그림 한 점이 시트에서 7px):
#   벽 높이 98점 ≈ 2.5m, 징두리(아래 판벽) 35점 ≈ 0.9m → 1점 ≈ 2.6cm. 붙박이 창(커튼 포함) 61×88, 붙박이 선반 25~42점.
#   소품 시트는 시트마다 점 크기가 다르다(가구·액자·강아지 10.25px, 공 11.5px — 공은 테두리가 2점, 창문 8.5px).
#   원래 점으로 되돌려 두었으니(azit-sheet-slice.py native/) 여기서는 "원래 점 몇 개로 놓을지"만 정한다.
#
# 크기 원칙(품질 우선):
#   1) 점 크기는 하나 — 소품 한 점 = 방 한 점. 키우지 않는다(키우면 그 소품만 점이 굵어 보여 섞인다).
#   2) 원래 크기가 어울리면 그대로 둔다(손대지 않음 = 품질 그대로).
#   3) 너무 크면 단순한 비율(5/6·3/4·2/3·1/2)로만 줄인다 — 비율이 단순해야 줄·무늬가 고르게 남는다.
#   4) 줄이는 법: 새 점이 덮는 원래 점 넓이만큼 그 색에 표를 주고 가장 많은 색을 고른다. 색을 섞지 않으니 원래 그림에
#      없던 색이 생기지 않는다(번짐 없음). 어두운 색(테두리·눈·코)은 표를 1.8배로 쳐서 가는 선이 살아남게 하고,
#      줄인 뒤 바깥 둘레를 원래 그림의 테두리 색으로 다시 둘러 한 점 테두리를 지킨다.
#   크기 기준(게임처럼 과장): 강아지 키 33~41점(벽 높이의 35~40% — 싸이월드 미니미와 비슷한 비율), 가구는 실제의 1.5~2배,
#   작은 장난감은 눈에 읽히게 3~5배. 같은 시트 안에서도 그림마다 칸을 꽉 채워 그려져 있어 하나씩 정했다(SCALE).
#
# 쓰는 법(pip pillow numpy):
#   python3 _dev/azit-fit.py <azit-sheet-slice.py 내보낸 폴더> [icons/azit-room]
#   두 번째 폴더를 주면 앱에 쓰는 것만 그리로 복사한다(APP_SKIP 빼고 — 빈 방은 room.png).
#   → <폴더>/fitted/*.png(방에 놓을 크기, 점 하나 = 방 한 점) · fitted/room_empty.png(창·워터마크 뺀 빈 방) ·
#     _fit_compare.png(줄인 것 전·후) · _lineup.png(전부 한 줄 세우기) · _room_scene.png(방에 놓아 본 것, 3배) ·
#     _windows.png(창 4가지를 방에 끼워 본 것)
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

F56, F34, F23, F12 = 5 / 6, 3 / 4, 2 / 3, 1 / 2
# 이름: (줄이는 비율, 놓는 곳) — 놓는 곳 floor 바닥 · wall_R/wall_L 그 벽 방향으로 그린 벽 소품 · hang 천장에 매달기 · small 작은 것
SCALE = {
    # 가구·식기 시트 — 방석·러그·소파는 원래 크기가 방과 맞는다(소파 72점 ≈ 강아지 소파 70cm의 1.6배).
    "sofa_bed": (1, "floor"), "cushion_yellow": (1, "floor"), "cushion_pink": (1, "floor"), "cushion_blue": (1, "floor"),
    "rug_pattern": (1, "floor"),
    "feeder_wood_2bowl": (F34, "floor"),   # 원래 51점 — 강아지(41)보다 커서
    "feeder_blue_2bowl": (F34, "floor"), "water_bowl_blue": (F34, "floor"),   # 밥그릇끼리 같은 비율
    # 소품·트로피 시트
    "basket_wicker_carrot": (F34, "floor"), "basket_blue_carrot": (F34, "floor"),   # 원래 57점 — 소파(72)와 거의 같아서
    "trophy_shelf": (1, "wall_R"),          # 붙박이 선반(42점)과 같은 크기
    "banner_flag_blue": (1, "wall_R"), "toy_bone": (1, "floor"), "plant_pot": (1, "floor"),
    "plant_hanging": (F23, "hang"),         # 원래 93점 — 벽 높이(98)만큼 길어서
    "garland_bunting": (1, "corner"), "frame_dog": (1, "wall_R"),
    # 강아지·동물 — 시트 안에서도 치와와만 크게 그려져 있다. 키 33~41점으로 맞춤
    "dog_chihuahua": (F23, "floor"), "dog_maltese": (F34, "floor"),
    "dog_brown": (1, "floor"), "dog_cream_poodle": (1, "floor"), "cat_calico": (1, "floor"), "rabbit_brown": (1, "floor"),
    # 공·장난감 시트 — 테두리가 2점이라 반으로 줄이면 다른 소품처럼 1점 테두리
    **{n: (F12, "small") for n in ("ball_yellow", "ball_watermelon", "ball_pastel", "ball_tennis", "ball_spiky_pink_1",
                                   "ball_spiky_pink_2", "toy_rope_blue", "acc_horn_green_1", "acc_arrow_red",
                                   "acc_horn_green_2", "acc_horn_pink", "acc_arrow_double_red")},
    "acc_arrow_blue": (F23, "small"),       # 반으로 하면 6×6이 되어 모양이 뭉개진다
    # 액자·엽서·화분·가게방석 시트 — 그림마다 칸을 꽉 채워 그려져 있어 액자·화분이 크다
    "frame_gold": (F23, "wall_L"), "frame_jelly_pink": (F23, "wall_L"), "board_postcard": (F34, "wall_R"),
    "postcard_paw": (F12, "wall_L"), "plant_cherry_blossom": (F23, "floor"), "plant_cactus": (F12, "floor"),
    "plant_daisy": (F12, "floor"), "cushion_cafe_beige": (1, "floor"), "cushion_cafe_mint": (1, "floor"),
    # 창문 — 원래 72×104라 벽(98)보다 크다. 붙박이 창(61×88) 자리에 맞게
    **{n: (F56, "wall_R") for n in ("window_day", "window_night", "window_rain", "window_snow")},
}
DARK = 90   # 이보다 어두운 색 = 테두리·눈·코 — 줄일 때 표를 1.8배
# 앱(icons/azit-room)에 넣지 않는 것 — 강아지는 가르시아가 따로 만든 도트 강아지(icons/dot-dogs)를 그대로 쓴다
# (11/23 가르시아 "여기 있던 강아지는 빼, 내가 따로 만든 강아지들 그대로 유지하자"). 같은 시트의 고양이·토끼도 그림체가
# 달라 같이 뺐다. 고깔·화살표(acc_*)는 아직 쓸 자리가 없어서 뺐다.
APP_SKIP = {"dog_chihuahua", "dog_maltese", "dog_brown", "dog_cream_poodle", "cat_calico", "rabbit_brown",
            "acc_horn_green_1", "acc_arrow_red", "acc_horn_green_2", "acc_horn_pink", "acc_arrow_double_red", "acc_arrow_blue"}


def luma(rgb):
    rgb = rgb.astype(np.float32)
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def edge_of(a):
    pad = np.pad(a, 1)
    return a & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])


def outline_color(img):
    # 바깥 둘레 점의 60% 넘게 어두우면 "테두리 있는 그림" — 그 가장 흔한 어두운 색
    a = img[:, :, 3] > 0
    e = edge_of(a)
    L = luma(img[:, :, :3])
    dark = e & (L < 100)
    if e.sum() == 0 or dark.sum() / e.sum() < 0.6:
        return None
    cols, cnt = np.unique(img[dark][:, :3], axis=0, return_counts=True)
    return cols[np.argmax(cnt)]


def spans(n, s, N):
    out = []
    for u in range(n):
        lo, hi = u * s, (u + 1) * s
        row = []
        for i in range(int(np.floor(lo)), min(N, int(np.ceil(hi)))):
            w = min(i + 1, hi) - max(i, lo)
            if w > 1e-6:
                row.append((i, w))
        out.append(row)
    return out


def downscale(img, f):
    if f >= 0.999:
        return img.copy()
    H, W = img.shape[:2]
    TW, TH = max(1, int(round(W * f))), max(1, int(round(H * f)))
    rgb = img[:, :, :3].astype(np.int64)
    a = img[:, :, 3] > 0
    key = (rgb[:, :, 0] << 16) | (rgb[:, :, 1] << 8) | rgb[:, :, 2]
    boost = np.where(luma(img[:, :, :3]) < DARK, 1.8, 1.0)
    xs, ys = spans(TW, W / TW, W), spans(TH, H / TH, H)
    out = np.zeros((TH, TW, 4), np.uint8)
    for v in range(TH):
        for u in range(TW):
            tot = opw = 0.0
            votes = {}
            for j, wy in ys[v]:
                for i, wx in xs[u]:
                    w = wx * wy
                    tot += w
                    if a[j, i]:
                        opw += w
                        k = int(key[j, i])
                        votes[k] = votes.get(k, 0.0) + w * boost[j, i]
            if votes and opw / tot >= 0.5:
                k = max(votes, key=votes.get)
                out[v, u] = ((k >> 16) & 255, (k >> 8) & 255, k & 255, 255)
    oc = outline_color(img)
    if oc is not None:                                    # 한 점 테두리 다시 두르기
        e = edge_of(out[:, :, 3] > 0)
        fix = e & (luma(out[:, :, :3]) >= 100)
        out[fix, :3] = oc
    ys_, xs_ = np.nonzero(out[:, :, 3])
    return out[ys_.min():ys_.max() + 1, xs_.min():xs_.max() + 1]


# ── 분홍 빈 방 손질(이 방 그림 전용 좌표) ──
def floor_y(x):          # 오른쪽 벽과 바닥이 만나는 줄(모서리 199,74에서 오른쪽으로 2:1)
    return 74 + (x - 199) / 2


def fix_watermark(room):
    # 오른쪽 아래 Gemini 반짝이 — 바닥 두께 띠 방향(왼쪽 아래로 2:1)을 따라 옆 점을 끌어와 메운다
    r = room.copy()
    rgb = r[:, :, :3].astype(int)
    L = luma(r[:, :, :3])
    star = np.zeros(L.shape, bool)
    y0, y1, x0, x1 = 192, 216, 366, 390
    sub = rgb[y0:y1, x0:x1]
    rb = sub[:, :, 0] - sub[:, :, 2]
    star[y0:y1, x0:x1] = ((L[y0:y1, x0:x1] > 150) & (rb < 100)) | ((rb < 40) & (L[y0:y1, x0:x1] > 110)) | \
        (L[y0:y1, x0:x1] > 155)                         # 바닥(주황, 밝기 142)에 번진 옅은 빛 테두리
    for y, x in zip(*np.nonzero(star)):
        for k in range(1, 30):
            for sx, sy in ((x - 2 * k, y + k), (x + 2 * k, y - k)):
                if 0 <= sx < r.shape[1] and 0 <= sy < r.shape[0] and not star[sy, sx]:
                    r[y, x] = room[sy, sx]
                    break
            else:
                continue
            break
    return r


def remove_window(room):
    # 붙박이 창 자리를 벽으로 되돌린다 — 판벽(바닥에서 38점 아래)은 6점 간격으로 반복돼서 벽 방향(6,3)으로 옮겨 채우고,
    # 위 벽지는 세로 줄무늬라 같은 세로줄의 창 위쪽 색을 내려 채운다(줄무늬 간격은 들쭉날쭉해서 옮겨 채우면 어긋난다).
    r = room.copy()
    H, W = r.shape[:2]
    poly = [(281, 26), (351, 60), (351, 128), (281, 102)]
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon(poly, fill=1)
    hole = np.asarray(m).astype(bool)
    for y, x in zip(*np.nonzero(hole)):
        h = floor_y(x) - y
        if h <= 38:
            for k in (1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10, 11, -11, 12, -12):
                sx, sy = x + 6 * k, y + 3 * k
                if 250 <= sx < W and 0 <= sy < H and not hole[sy, sx]:
                    r[y, x] = room[sy, sx]
                    break
    # 벽지 색 목록 — 창 양옆 깨끗한 벽지(바닥에서 44점 위 ~ 천장 아래)에서 5번 넘게 나온 색
    pal = []
    for x in list(range(252, 280)) + list(range(353, W)):
        ceil = 2 + (x - 250) * 0.52
        for y in range(int(ceil) + 5, int(floor_y(x) - 44)):
            pal.append(tuple(room[y, x, :3]))
    cs, cnt = np.unique(np.array(pal), axis=0, return_counts=True)
    pal = cs[cnt >= 5].astype(int)

    def wallpaperish(c):
        return np.abs(pal - c.astype(int)).sum(axis=1).min() <= 12

    prev = None
    for x in range(281, 352):
        ceil = 2 + (x - 250) * 0.52
        rows = [y for y in range(int(ceil) + 4, int(np.ceil(floor_y(x) - 38))) if 0 <= y < H]
        # 이 세로줄의 벽지 색 = 구멍 밖(위·아래)에 남은 벽지 색 가운데 가장 많은 것, 없으면 옆 줄 색
        seen = [tuple(room[y, x, :3]) for y in rows if not hole[y, x] and wallpaperish(room[y, x, :3])]
        if seen:
            vals, n = np.unique(np.array(seen), axis=0, return_counts=True)
            prev = vals[np.argmax(n)]
        if prev is None:
            continue
        for y in rows:
            if hole[y, x]:
                r[y, x, :3] = prev
    return r


# ── 놓기 ──
def P(i, j):     # 바닥 위치: 모서리(199,74)에서 오른쪽 벽 따라 i, 왼쪽 벽 따라 j(한 칸 = 가로 2점·세로 1점)
    return 199 + 2 * (i - j), 74 + i + j


def paste(canvas, spr, x, y, flip=False):
    # (x, y) = 그림 아래 가운데
    if flip:
        spr = spr[:, ::-1]
    h, w = spr.shape[:2]
    X, Y = int(round(x - w / 2)), int(round(y - h + 1))
    H, W = canvas.shape[:2]
    for j in range(h):
        yy = Y + j
        if not 0 <= yy < H:
            continue
        for i in range(w):
            xx = X + i
            if 0 <= xx < W and spr[j, i, 3] > 0:
                canvas[yy, xx, :3] = spr[j, i, :3]


def shadow(canvas, x, y, w):
    # 발밑 그림자 — 바닥색을 조금 어둡게(번지지 않게 칸으로)
    w = int(max(6, min(44, w)))
    h = max(3, w // 3)
    cx, cy = x, y - h / 2 + 1
    for yy in range(int(cy - h / 2), int(cy + h / 2) + 1):
        for xx in range(int(cx - w / 2), int(cx + w / 2) + 1):
            if ((xx + 0.5 - cx) / (w / 2)) ** 2 + ((yy + 0.5 - cy) / (h / 2)) ** 2 <= 1:
                if 0 <= yy < canvas.shape[0] and 0 <= xx < canvas.shape[1]:
                    canvas[yy, xx, :3] = (canvas[yy, xx, :3].astype(int) * 0.82).astype(np.uint8)


def compose(room, fit, items, window):
    # items: (이름, x, y, 종류[, 옵션]) — 종류 wall(벽·선반 위·천장, 적은 순서대로) · decal(러그처럼 바닥에 까는 것) ·
    # floor(발 위치 y가 큰 것이 앞). 옵션 flip(반대쪽 벽용 좌우 뒤집기) · shadow(발밑 그림자, 바닥 기본 켬) ·
    # z(앞뒤 순서를 y 대신 — 방석·소파 위에 앉힌 강아지는 받침보다 뒤에 그려야 하니 받침 y보다 크게)
    c = room.copy()
    wx, wy, wname = window
    paste(c, fit[wname], wx, wy)
    norm = [(t[0], t[1], t[2], t[3], t[4] if len(t) > 4 else {}) for t in items]
    for name, x, y, kind, o in norm:
        if kind == "wall":
            paste(c, fit[name], x, y, flip=o.get("flip", False))
    for name, x, y, kind, o in norm:
        if kind == "decal":
            paste(c, fit[name], x, y, flip=o.get("flip", False))
    floors = sorted([t for t in norm if t[3] == "floor"], key=lambda t: (t[4].get("z", t[2]), t[1]))
    for name, x, y, kind, o in floors:
        spr = fit[name]
        if o.get("shadow", True):
            shadow(c, x, y, spr.shape[1] * 0.7)
        paste(c, spr, x, y, flip=o.get("flip", False))
    return c


def up(img, k):
    return Image.fromarray(img).resize((img.shape[1] * k, img.shape[0] * k), Image.NEAREST)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "walson_assets"
    nat_dir, out_dir = os.path.join(src, "native"), os.path.join(src, "fitted")
    os.makedirs(out_dir, exist_ok=True)
    fit, before = {}, {}
    for name, (f, _) in SCALE.items():
        p = os.path.join(nat_dir, name + ".png")
        if not os.path.exists(p):
            print("없음:", name)
            continue
        nat = np.asarray(Image.open(p).convert("RGBA"))
        before[name] = nat
        fit[name] = downscale(nat, f)
        Image.fromarray(fit[name]).save(os.path.join(out_dir, name + ".png"))
        print(f"{name}: {nat.shape[1]}x{nat.shape[0]} → {fit[name].shape[1]}x{fit[name].shape[0]}")

    room = np.asarray(Image.open(os.path.join(src, "empty_room_bg_native.png")).convert("RGBA")).copy()
    room = remove_window(fix_watermark(room))
    Image.fromarray(room).save(os.path.join(out_dir, "room_empty.png"))

    # 줄인 것 전·후(3배) — 품질 확인용
    scaled = [n for n, (f, _) in SCALE.items() if f < 0.999 and n in fit]
    k = 3
    rows = []
    for n in scaled:
        a, b = up(before[n], k), up(fit[n], k)
        rows.append((n, a, b))
    Wc = max(a.width + b.width for _, a, b in rows) + 40
    Hc = sum(max(a.height, b.height) + 18 for _, a, b in rows)
    cols = 3
    per = (len(rows) + cols - 1) // cols
    colw = Wc
    sheet = Image.new("RGB", (colw * cols, 10), (255, 255, 255))
    blocks = [rows[i * per:(i + 1) * per] for i in range(cols)]
    hs = [sum(max(a.height, b.height) + 18 for _, a, b in blk) for blk in blocks]
    sheet = Image.new("RGB", (colw * cols, max(hs)), (255, 236, 244))
    d = ImageDraw.Draw(sheet)
    for ci, blk in enumerate(blocks):
        y = 0
        for n, a, b in blk:
            x = ci * colw + 6
            sheet.paste(a, (x, y + 14), a)
            sheet.paste(b, (x + a.width + 20, y + 14), b)
            d.text((x, y), f"{n}  {SCALE[n][0]:.3g}", fill=(0, 0, 0))
            y += max(a.height, b.height) + 18
    sheet.save(os.path.join(src, "_fit_compare.png"))

    # 전부 한 줄 세우기 — 바닥 띠 위에 같은 배율로(벽 높이·판벽 높이 눈금)
    order = list(SCALE.keys())
    lw, lh = 394 * 2, 0
    rows, row, x = [], [], 8
    for n in order:
        if n not in fit:
            continue
        w = max(fit[n].shape[1], 44)                       # 작은 것도 이름이 겹치지 않게 칸은 44점 이상
        if x + w + 8 > lw:
            rows.append(row); row, x = [], 8
        row.append((n, x, x + (w - fit[n].shape[1]) / 2)); x += w + 10
    rows.append(row)
    heights = [max(fit[n].shape[0] for n, _, _ in r) + 22 for r in rows]
    canvas = np.zeros((sum(heights) + 4, lw, 4), np.uint8)
    canvas[:, :, :3] = (250, 232, 222); canvas[:, :, 3] = 255
    y = 0
    labels = []
    for r, hgt in zip(rows, heights):
        base = y + hgt - 14
        canvas[base + 1:base + 3, :, :3] = (214, 128, 84)
        for n, slot, x in r:
            paste(canvas, fit[n], x + fit[n].shape[1] / 2, base)
            labels.append((n, slot, base + 3))
        # 눈금: 판벽 35점(≈0.9m)
        canvas[base - 35:base + 1, 2, :3] = (120, 60, 60)
        y += hgt
    img = up(canvas, 2)
    d = ImageDraw.Draw(img)
    for n, x, yy in labels:
        d.text((x * 2, yy * 2), n.replace("_", " ")[:16], fill=(90, 40, 40))
    img.save(os.path.join(src, "_lineup.png"))

    # 방에 놓아 보기 — (이름, x, y, 종류[, 옵션]) x·y = 그림 아래 가운데(방 원래 점)
    for key, (wname, items) in SCENES.items():
        scene = compose(room, fit, items, (316, 121, wname))
        Image.fromarray(scene).save(os.path.join(out_dir, f"_room_{key}_1x.png"))
        up(scene, 3).save(os.path.join(src, f"_room_{key}.png"))
    # 창 4가지
    tiles = []
    for wname in ("window_day", "window_night", "window_rain", "window_snow"):
        c = compose(room, fit, [], (316, 121, wname))
        tiles.append(up(c[10:150, 230:394], 3))
    tw, th = tiles[0].size
    win = Image.new("RGB", (tw * 2 + 8, th * 2 + 8), (255, 255, 255))
    for n, t in enumerate(tiles):
        win.paste(t, ((n % 2) * (tw + 8), (n // 2) * (th + 8)))
    win.save(os.path.join(src, "_windows.png"))
    # 자르기 단계가 만든 walson_assets.zip을 맞춘 것까지 넣어 다시 묶는다
    import zipfile
    zp = os.path.join(src, "walson_assets.zip")
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(src):
            for f in sorted(files):
                if f.endswith(".zip"):
                    continue
                full = os.path.join(root, f)
                zf.write(full, os.path.relpath(full, src))
    print("끝:", out_dir, "→", zp)
    if len(sys.argv) > 2:                                  # 앱에 쓰는 것만 복사
        app = sys.argv[2]
        os.makedirs(app, exist_ok=True)
        n = 0
        for name in fit:
            if name not in APP_SKIP:
                Image.fromarray(fit[name]).save(os.path.join(app, name + ".png"), optimize=True)
                n += 1
        Image.fromarray(room).save(os.path.join(app, "room.png"), optimize=True)
        print(f"앱 폴더 {app}: 소품 {n}개 + room.png")


NOSH = {"shadow": False}
FLIP = {"flip": True}
# 방에 놓아 보기 — 방 하나에 다 넣으면 벽이 모자라서 두 장(낮 창 / 밤 창)에 나눠 놓았다. 좌표는 분홍 방 원래 점.
SCENES = {
    "day": ("window_day", [
        # 벽·선반·천장 — 왼쪽 벽 빈칸(x 50~92), 붙박이 선반 둘, 창 오른쪽(x 347~394), 모서리 위
        ("garland_bunting", 199, 30, "wall"),                  # 두 벽 모서리에 걸쳐(양 끝이 같은 높이 = 모서리에서 같은 거리)
        ("trophy_shelf", 258, 73, "wall"),                     # 오른쪽 붙박이 선반을 덮어서
        ("frame_jelly_pink", 371, 112, "wall", FLIP),          # 왼쪽 벽 방향으로 그려진 것 → 뒤집어 오른쪽 벽에
        ("frame_gold", 68, 96, "wall"),
        ("plant_hanging", 22, 64, "wall"),
        ("plant_cactus", 113, 64, "wall"),                     # 왼쪽 붙박이 선반 위
        ("plant_daisy", 170, 42, "wall"),
        # 바닥
        ("rug_pattern", *P(76, 60), "decal"),
        ("plant_pot", *P(3, 3), "floor"),
        ("basket_wicker_carrot", *P(16, 5), "floor"),
        ("plant_cherry_blossom", *P(4, 22), "floor"),
        ("feeder_wood_2bowl", *P(7, 40), "floor"),
        ("water_bowl_blue", *P(6, 56), "floor"),
        ("dog_brown", *P(17, 45), "floor", FLIP),
        ("rabbit_brown", *P(24, 26), "floor"),
        ("sofa_bed", *P(64, 16), "floor", NOSH),               # 그림에 그림자가 있다
        ("dog_cream_poodle", 294, 141, "floor", {"shadow": False, "z": 155}),   # 소파 안
        ("cushion_yellow", *P(40, 58), "floor"),
        ("dog_chihuahua", 163, 162, "floor", {"shadow": False, "z": 173}),      # 노란 방석 위
        ("dog_maltese", *P(60, 50), "floor"),
        ("toy_bone", *P(75, 47), "floor"),
        ("ball_tennis", *P(80, 32), "floor"),
        ("ball_watermelon", *P(56, 70), "floor"),
        ("toy_rope_blue", *P(38, 77), "floor"),
        ("cushion_blue", *P(93, 8), "floor"),
        ("cat_calico", 369, 166, "floor", {"shadow": False, "z": 176}),         # 파란 방석 위
        ("cushion_pink", *P(88, 26), "floor"),
    ]),
    "night": ("window_night", [
        ("banner_flag_blue", 371, 116, "wall"),
        ("frame_dog", 222, 46, "wall"),                        # 모서리 옆 크림색 벽
        ("board_postcard", 71, 98, "wall", FLIP),              # 오른쪽 벽 방향 → 뒤집어 왼쪽 벽에
        ("postcard_paw", 115, 47, "wall"),                     # 왼쪽 선반 위 벽
        ("ball_yellow", 113, 63, "wall"),                      # 선반 위
        ("plant_cactus", 170, 42, "wall"),
        # 바닥
        ("plant_cherry_blossom", *P(3, 3), "floor"),
        ("basket_blue_carrot", *P(22, 4), "floor"),
        ("feeder_blue_2bowl", *P(4, 26), "floor"),
        ("water_bowl_blue", *P(4, 42), "floor"),
        ("dog_brown", *P(23, 27), "floor"),                    # 밥그릇 쪽을 본다
        ("cat_calico", *P(40, 6), "floor"),
        ("cushion_cafe_beige", *P(38, 52), "floor"),
        ("rabbit_brown", 171, 156, "floor", {"shadow": False, "z": 165}),
        ("cushion_cafe_mint", *P(70, 20), "floor"),
        ("dog_cream_poodle", 299, 154, "floor", {"shadow": False, "z": 165}),
        ("plant_daisy", *P(92, 4), "floor"),
        ("dog_maltese", *P(60, 50), "floor"),
        ("ball_pastel", *P(50, 66), "floor"),
        ("dog_chihuahua", *P(86, 32), "floor"),
        ("ball_spiky_pink_1", *P(70, 62), "floor"),
        ("ball_spiky_pink_2", *P(97, 46), "floor"),
        ("toy_rope_blue", *P(30, 70), "floor"),
        ("toy_bone", *P(66, 38), "floor"),
    ]),
}

if __name__ == "__main__":
    main()
