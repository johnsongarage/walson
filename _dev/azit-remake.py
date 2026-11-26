# 아지트 남은 소품 다시 받은 그림 넣기 (2026-11-26)
#
# 가르시아 11/26 "나머지 이미지들 새로 생성하려고 해, 아예 이미지별로 새로 만드는 게 맞는 것 같아" → Claude 프롬프트 페이지(카드 44장,
# hq notes/petwalk-azit-assets.md) → Gemini로 받은 그림(한 장에 1~4개, 흰 바탕) = sian-ref/azit-remake/r01~r18.webp(받은 그대로 보관).
#
# 하는 일(azit-hq-items.py·azit-redo-items.py의 자르기·그림자 벗기기·좌우 맞추기를 그대로 씀):
#   1) 시트마다 소품 덩어리를 왼쪽부터 나눠(boxes_of) 이름을 붙이고 흰 바탕을 지운다.
#      갇힌 흰 부분(뼈다귀 무늬·반짝임·데이지 꽃잎·흰 띠)은 그림이라 지우지 않는다(holes=0) — 줄·다리 사이처럼 진짜 바탕이 갇힌
#      것만 HOLES로 지운다(풍선 줄·파라솔 의자·포장마차 바퀴·걸이 화분 줄·족자 걸이 끈·왕관 안쪽·바리케이드 다리 사이).
#   2) 예전 방 그림(icons/azit-room)과 모양을 겹쳐 보아 좌우가 반대면 뒤집는다(그림 방향 face가 그대로 맞게).
#   3) 고해상도판 = 예전 방 그림 칸 × 4.5 안에(가로·세로 중 빡빡한 쪽, 반투명 가장자리 그대로) → sian-ref/azit-hd/items/<이름>.webp
#      (앱은 _dev/azit-hd-app.py가 icons/azit-hd로 복사, azit.html HD_NAMES).
#   4) 글자 판 9개는 빈 판으로 받았다 → 글씨는 5)에서 써 넣는다(azit-remake-letter 부분).
#   크리스마스 넷(r18 — 트리·벙어리장갑·양말·지팡이 사탕)은 목록에 없던 새 소품이라 자르기만 해 두고(sian-ref/azit-remake/xmas) 앱엔 아직 안 넣는다.
#
# 쓰는 법(pip pillow numpy opencv-python-headless): python3 _dev/azit-remake.py 글꼴/Pretendard-ExtraBold.ttf
#   (글꼴: npm pack pretendard@1.3.9 → package/dist/public/static/alternative/Pretendard-ExtraBold.ttf, SIL OFL — 그림에 찍어 넣은 글씨라 저장소엔 글꼴 파일을 넣지 않는다)
import importlib.util, os, sys
import numpy as np
import cv2
from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(here, "..")
SRC = os.path.join(ROOT, "sian-ref", "azit-remake")
OUT = os.path.join(ROOT, "sian-ref", "azit-hd", "items")
XMAS = os.path.join(SRC, "xmas")
ROOM1X = os.path.join(ROOT, "icons", "azit-room")
S = 4.5


def load_mod(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(here, file))
    m = importlib.util.module_from_spec(spec)
    keep = sys.argv; sys.argv = [sys.argv[0]]
    spec.loader.exec_module(m)
    sys.argv = keep
    return m


hq = load_mod("hq", "azit-hq-items.py")   # boxes_of · peel_shadow · crop_alpha · facing · redo(cut)

# 받은 그림(왼쪽부터) → 소품 이름. None = 쓰지 않음
SHEETS = {
    "r01-mint-feeder-water.webp": ["cushion_cafe_mint", "feeder_blue_2bowl", "water_bowl_blue"],
    "r02-cushions.webp": ["cushion_yellow", "cushion_blue", "cushion_pink"],
    "r03-rope-tennis-watermelon.webp": ["toy_rope_blue", "ball_tennis", "ball_watermelon"],
    "r04-banner-basket-hanging.webp": ["banner_flag_blue", "basket_wicker_carrot", "plant_hanging"],
    "r05-pastel-spiky-chicken.webp": ["ball_pastel", "ball_spiky_pink_1", "toy_chicken"],
    "r06-bonsai-cactus-daisy.webp": ["plant_cherry_blossom", "plant_cactus", "plant_daisy"],
    "r07-visited-interior-panel.webp": ["bubble_visited", "bubble_interior", "panel_guestbook"],
    "r08-stamp-poop-chihuahua.webp": ["stamp_regular", "bubble_poop", "bubble_chihuahua"],
    "r09-scroll.webp": ["scroll_dogslife"],
    "r10-board-refuse.webp": ["board_refuse"],
    "r11-trophy-poop.webp": ["trophy_poop"],
    "r12-balloons.webp": ["balloons"],
    "r13-sign-snack.webp": ["sign_snack"],
    "r14-nosework.webp": ["nosework_mat"],
    "r15-parasol-cone-cart.webp": ["parasol_set", "cone_barricade", "cart_bungeoppang"],
    "r16-ribbon-cap-crown.webp": ["acc_ribbon", None, "acc_crown"],   # 가운데 옆모습 모자 대신 r17 정면 모자(예전 모자 그림처럼 정면)
    "r17-cap-front.webp": ["acc_cap"],
    "r18-xmas.webp": ["xmas_tree", "xmas_mitten", "xmas_stocking", "xmas_candy_cane"],
}
# 갇힌 바탕(거의 흰 점이 이만큼 넘게 이어진 것)을 투명하게 — 나머지는 0(갇힌 흰 부분은 그림)
HOLES = {"balloons": 600, "parasol_set": 1500, "cart_bungeoppang": 600, "plant_hanging": 250, "scroll_dogslife": 250, "acc_crown": 800,
         "cone_barricade": 1500, "xmas_candy_cane": 400}
ONLY_BIGGEST = {"toy_rope_blue"}   # 밧줄 옆에 받은 그림의 잡티(핀·끈·흰 번짐)가 따로 붙어 나왔다 — 가장 큰 덩어리만
LAY_FLAT = {"toy_rope_blue"}       # 대각선으로 그려 왔다 — 긴 쪽이 가로가 되게 눕힌다(예전 방 그림처럼 가로로 누운 밧줄)
TEXT = ["bubble_visited", "bubble_interior", "panel_guestbook", "stamp_regular", "bubble_poop", "bubble_chihuahua", "scroll_dogslife",
        "sign_snack", "board_refuse"]


def keep_main(full, min_frac=0.02):
    """떨어진 잡티(받은 그림에 섞여 나온 작은 조각)를 뗀다 — 가장 큰 덩어리의 min_frac보다 작은 조각"""
    a = (full[..., 3] > 0).astype(np.uint8)
    k, lab, st, _ = cv2.connectedComponentsWithStats(a, 8)
    if k <= 2:
        return full
    big = st[1:, 4].max()
    out = full.copy()
    for i in range(1, k):
        if st[i, 4] < big * min_frac:
            out[lab == i] = 0
    return hq.crop_alpha(out)


def lay_flat(full):
    """긴 쪽(알파 덩어리의 주축)이 가로가 되게 돌린다"""
    ys, xs = np.nonzero(full[..., 3] > 0)
    pts = np.column_stack([xs, ys]).astype(np.float64); pts -= pts.mean(0)
    vx, vy = np.linalg.eigh(np.cov(pts.T))[1][:, -1]
    ang = np.degrees(np.arctan2(vy, vx))
    if ang > 90: ang -= 180
    if ang < -90: ang += 180
    im = Image.fromarray(full).convert("RGBa").rotate(ang, resample=Image.BICUBIC, expand=True).convert("RGBA")
    return hq.crop_alpha(np.asarray(im))


def cut_sheet(fname, names):
    rgb = np.asarray(Image.open(os.path.join(SRC, fname)).convert("RGB"))
    bx = hq.boxes_of(rgb)
    assert len(bx) == len(names), f"{fname}: 소품 {len(bx)}개(기대 {len(names)})"
    res = {}
    for name, box in zip(names, bx):
        if not name:
            continue
        c, a, _ = hq.redo.cut(rgb, box, holes=HOLES.get(name, 0))
        full = np.zeros(c.shape[:2] + (4,), np.uint8); full[..., :3] = c; full[..., 3] = a * 255
        full, peeled = hq.peel_shadow(hq.crop_alpha(full))
        full = keep_main(full, 0.5 if name in ONLY_BIGGEST else 0.02)
        if name in LAY_FLAT:
            full = lay_flat(full)
        res[name] = full
    return res


def to_hd(full, name):
    """예전 방 그림 칸 × 4.5 안에(좌우는 예전 그림에 맞춤) — 반투명 가장자리 그대로 곱게 줄이기"""
    old = hq.crop_alpha(np.asarray(Image.open(os.path.join(ROOM1X, name + ".png")).convert("RGBA")))
    flip, i0, i1 = hq.facing(full, old)
    if flip:
        full = full[:, ::-1].copy()
    w1, h1 = Image.open(os.path.join(ROOM1X, name + ".png")).size
    im = Image.fromarray(full)
    k = min(w1 * S / im.width, h1 * S / im.height)
    hd = im.convert("RGBa").resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS).convert("RGBA")
    return hd, flip


def main(only=None):
    os.makedirs(OUT, exist_ok=True); os.makedirs(XMAS, exist_ok=True)
    blanks = {}
    for fname, names in SHEETS.items():
        for name, full in cut_sheet(fname, names).items():
            if only and name not in only:
                continue
            if name.startswith("xmas_"):
                Image.fromarray(full).save(os.path.join(XMAS, name + ".webp"), "WEBP", quality=92, method=6)
                print(f"  {name}: 새 소품(앱엔 아직) {full.shape[1]}×{full.shape[0]}")
                continue
            hd, flip = to_hd(full, name)
            if name in TEXT:
                blanks[name] = (full if not flip else full[:, ::-1].copy(), hd)
                print(f"  {name}: 빈 판 {hd.width}×{hd.height}{' 뒤집음' if flip else ''} — 글씨는 다음 단계")
                continue
            hd.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=92, method=6)
            print(f"  {name}: {hd.width}×{hd.height}{' 뒤집음' if flip else ''}")
    return blanks


# ── 5) 글자 판에 글씨 쓰기 — 매끈한 굵은 글씨(Pretendard ExtraBold)로, 예전 판(azit-letter.py)과 같은 말 ──
# 11/26 가르시아 "글씨도 매끄럽게 해, 안 보여서": 처음엔 앱 도트 글씨(갈무리11)를 점째 2:1로 기울였는데 휴대폰 크기에선 점이 뭉개져 안 읽혔다
#   → 앱 기본 글씨 Pretendard ExtraBold(SIL OFL — 그림에 찍어 넣은 글씨라 저장소엔 글꼴 파일을 넣지 않음)를 4배로 곱게 찍고,
#   판 기울기만큼 세로로 밀어(세로획은 곧게, 가로획만 판을 따라) 4분의 1로 줄여 얹는다. 판에 들어가는 만큼 크게(폭·두께 비율 wmax·hmax).
# 판 앞면(가장 많은 색)의 세로줄마다 위·아래 가운데를 이어 판 기울기·가운데를 잰다.
# 벽에 거는 것(both)은 왼쪽 벽용 이름_L도 — 빈 판을 좌우로 뒤집어 다시 재고 같은 글씨를 반대 비탈로(거울 글씨 X).
# dx·dy: 글씨 가운데를 판 앞면 가운데에서 옮길 비율(판 폭·두께 기준 — 발바닥·우표·응가·치와와 그림을 피해서)
INK = (42, 32, 38, 255)
LETTER = {
    "bubble_visited": dict(lines=["다녀감"], dx=0.06, dy=-0.04, both=True),
    "bubble_interior": dict(lines=["인테리어", "맛집"], dx=-0.04, dy=-0.04, both=True, wmax=0.68),   # 타원이라 위아래로 갈수록 좁다
    "panel_guestbook": dict(lines=["집사의 삶"], dx=0.02, dy=0.0, both=True, wmax=0.8),
    "stamp_regular": dict(lines=["단골", "인증"], dx=0.13, dy=0.08, both=True, hmax=0.84),
    "bubble_poop": dict(lines=["오늘도 똥줍"], dx=0.10, dy=-0.04, both=True, wmax=0.74),
    "bubble_chihuahua": dict(lines=["참지않긔"], dx=-0.10, dy=-0.02, both=True, wmax=0.62),
    "scroll_dogslife": dict(cols=["개팔자", "상팔자"], dx=0.0, dy=0.03, both=True, wmax=0.92, hmax=0.86),   # 세로 두 줄 — 오른쪽 줄부터(옛 족자처럼)
    "board_refuse": dict(lines=["안가", "안걸어"], dx=0.0, dy=0.02, both=False),
    "sign_snack": dict(lines=["간식", "내놔라"], dx=0.0, dy=0.0, both=False),
}


def face_of(im):
    """판 앞면 = 불투명한 점 중 가장 많은 색(가까운 색까지) — (마스크, 세로줄 가운데 기울기 m, 절편 c, x0, x1)"""
    a = np.asarray(im.convert("RGBA")).astype(int)
    op = a[..., 3] > 200
    rgb = a[..., :3]
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    q = (rgb[op & (lum > 60)] // 12)
    vals, cnt = np.unique(q, axis=0, return_counts=True)
    base = (vals[cnt.argmax()] * 12 + 6).astype(int)
    mask = op & (np.abs(rgb - base).max(-1) < 34)
    mask = cv2.morphologyEx(mask.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    k, lab, st, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    mask = lab == (1 + int(np.argmax(st[1:, 4])))
    xs = np.nonzero(mask.any(0))[0]
    x0, x1 = xs.min(), xs.max()
    cx, cy = [], []
    for x in range(x0 + (x1 - x0) // 6, x1 - (x1 - x0) // 6 + 1):
        col = np.nonzero(mask[:, x])[0]
        if len(col):
            cx.append(x); cy.append((col.min() + col.max()) / 2)
    m, c = np.polyfit(cx, cy, 1)
    return mask, m, c, x0, x1


def text_mask(font, lines, vertical=False, gap=0.16):
    """곱게 찍은 글씨 덩어리(L, 0~255) — 가로는 줄마다 가운데 맞춤, 세로는 열마다 위에서 아래로(첫 열이 오른쪽)"""
    from PIL import ImageDraw
    size = font.size

    def one(t):
        bb = font.getbbox(t)
        im = Image.new("L", (bb[2] - bb[0] + 4, bb[3] - bb[1] + 4), 0)
        ImageDraw.Draw(im).text((2 - bb[0], 2 - bb[1]), t, font=font, fill=255)
        return im
    if vertical:
        cols = []
        for t in lines:
            gl = [one(ch) for ch in t]
            cw = max(g.width for g in gl); step = round(size * 1.06)
            col = Image.new("L", (cw, step * (len(gl) - 1) + gl[-1].height), 0)
            for k, g in enumerate(gl):
                col.paste(g, ((cw - g.width) // 2, k * step))
            cols.append(col)
        sp = round(size * 0.18); W = sum(c.width for c in cols) + sp * (len(cols) - 1); H = max(c.height for c in cols)
        out = Image.new("L", (W, H), 0); x = W
        for c in cols:
            x -= c.width; out.paste(c, (x, 0)); x -= sp
        return out
    rows = [one(t) for t in lines]
    step = round(size * (1 + gap)); W = max(r.width for r in rows)
    out = Image.new("L", (W, step * (len(rows) - 1) + rows[-1].height), 0)
    for k, r in enumerate(rows):
        out.paste(r, ((W - r.width) // 2, k * step))
    return out


def shear(mask, m):
    """세로로 밀기 — 오른쪽으로 갈수록 m만큼 아래로(m<0이면 위로). 세로획은 곧게"""
    w, h = mask.size
    H = int(np.ceil(h + abs(m) * w))
    off = 0 if m >= 0 else abs(m) * w
    return mask.transform((w, H), Image.AFFINE, (1, 0, 0, -m, 1, -off), resample=Image.BICUBIC)


def write_on(im, spec, font_path):
    """빈 판 그림(PIL RGBA)에 글씨 — (새 그림, 글씨 크기 px, 판 기울기)"""
    from PIL import ImageFont
    mask, m, c, x0, x1 = face_of(im)
    W = x1 - x0
    hh = [np.ptp(np.nonzero(mask[:, x])[0]) for x in range(int(x0), int(x1) + 1) if mask[:, x].any()]
    face_h = float(np.median(hh))                                # 판 앞면 세로 두께(비탈 빼고)
    cxc = (x0 + x1) / 2 + spec["dx"] * W
    cyc = m * cxc + c + spec["dy"] * face_h
    vertical = "cols" in spec
    SS = 4   # 4배로 찍어 곱게 줄인다
    for size in range(64, 15, -2):
        f = ImageFont.truetype(font_path, size * SS)
        tm = text_mask(f, spec.get("cols") or spec["lines"], vertical)
        tw, th = tm.width / SS, tm.height / SS
        if tw > W * spec.get("wmax", 0.84) or th > face_h * spec.get("hmax", 0.8):
            continue
        sm = shear(tm, m)
        small = sm.resize((max(1, round(sm.width / SS)), max(1, round(sm.height / SS))), Image.LANCZOS)
        ink = Image.new("RGBA", small.size, INK); ink.putalpha(small)
        out = im.convert("RGBA").copy()
        out.alpha_composite(ink, (int(round(cxc - small.width / 2)), int(round(cyc - small.height / 2))))
        # 판 밖으로 번지지 않게 — 원래 판 알파를 넘지 않게
        a0 = np.asarray(im.convert("RGBA"))[..., 3]; o = np.array(out); o[..., 3] = np.minimum(o[..., 3], a0)
        return Image.fromarray(o), size, m
    raise RuntimeError("글씨가 판에 안 들어감")


def letter_all(blanks, font_path):
    for name, (full, hd) in blanks.items():
        spec = LETTER[name]
        im, size, m = write_on(hd, spec, font_path)
        im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=92, method=6)
        msg = f"  {name}: 글씨 {size}px · 판 기울기 {m:+.2f}"
        if spec["both"]:
            imL, sizeL, mL = write_on(hd.transpose(Image.FLIP_LEFT_RIGHT), spec_mirror(spec), font_path)
            imL.save(os.path.join(OUT, name + "_L.webp"), "WEBP", quality=92, method=6)
            msg += f" · 왼쪽 벽용 {sizeL}px {mL:+.2f}"
        print(msg)


def spec_mirror(spec):
    s = dict(spec); s["dx"] = -spec["dx"]
    return s


if __name__ == "__main__":
    font = next((a for a in sys.argv[1:] if a.endswith((".ttf", ".otf"))), None)
    bl = main()
    if font:
        letter_all(bl, font)
    else:
        print("글자 판 9개는 빈 판 — 글씨를 쓰려면 Pretendard-ExtraBold.ttf 주소를 같이: npm pack pretendard@1.3.9 → package/dist/public/static/alternative/Pretendard-ExtraBold.ttf")
