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
# 쓰는 법(pip pillow numpy opencv-python-headless): python3 _dev/azit-remake.py 글꼴/Galmuri11-Bold.ttf
#   (글꼴: npm pack galmuri@2.40.3 → package/dist/Galmuri11-Bold.ttf, SIL OFL — 그림에 찍어 넣은 글씨라 저장소엔 글꼴 파일을 더 넣지 않는다)
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


# ── 5) 글자 판에 글씨 쓰기 — 앱 도트 글씨(갈무리11 굵게)로, 예전 판(azit-letter.py)과 같은 말 ──
# 판 앞면(가장 많은 색)의 세로줄마다 위·아래 가운데를 이어 판 기울기·가운데를 잰다. 글씨는 갈무리11을 12px(점 하나 = 1px)로 한 줄씩 찍고
# 점 세로줄을 가로 2점에 세로 1점씩 내려(아이소 도트 그림의 2:1 비탈) 판 기울기에 맞춘 뒤, 점 크기(dot)만큼 점째 키워 판에 얹는다.
# (음절을 똑바로 세워 자리만 내리던 azit-letter.py 방식은 고해상도 판에선 두 줄이 계단처럼 엇갈려 읽기 어려웠다 — 11/26 비교)
# 벽에 거는 것(both)은 왼쪽 벽용 이름_L도 — 빈 판을 좌우로 뒤집어 다시 재고 같은 글씨를 반대 비탈로(거울 글씨 X).
# dx·dy: 글씨 가운데를 판 앞면 가운데에서 옮길 비율(판 폭·두께 기준 — 발바닥·우표·응가·치와와 그림을 피해서) · lh: 줄 간격(점)
INK = (42, 32, 38, 255)
LETTER = {
    "bubble_visited": dict(lines=["다녀감"], dx=0.06, dy=-0.04, both=True),
    "bubble_interior": dict(lines=["인테리어", "맛집"], dx=-0.04, dy=-0.06, both=True),
    "panel_guestbook": dict(lines=["집사의 삶"], dx=0.02, dy=0.0, both=True, wmax=0.86),
    "stamp_regular": dict(lines=["단골", "인증"], dx=0.10, dy=0.06, both=True, lh=15, hmax=0.98),
    "bubble_poop": dict(lines=["오늘도 똥줍"], dx=0.09, dy=-0.04, both=True),
    "bubble_chihuahua": dict(lines=["참지않긔"], dx=-0.05, dy=-0.02, both=True),
    "scroll_dogslife": dict(cols=["개팔자", "상팔자"], dx=0.0, dy=0.03, both=True, wmax=0.96),   # 세로 두 줄 — 오른쪽 줄부터(옛 족자처럼)
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


def text_dots(font, lines, vertical=False, lh=14):
    """갈무리11 12px로 찍은 글씨 점(참·거짓 배열) — 가로는 줄마다 가운데 맞춤, 세로는 열마다(오른쪽 열부터)"""
    from PIL import ImageDraw

    def one(t):
        w = int(sum(font.getlength(ch) * (0.5 if ch == " " else 1) for ch in t)) + 4
        im = Image.new("L", (w, 16), 0); g = ImageDraw.Draw(im); g.fontmode = "1"
        x = 1
        for ch in t:
            if ch != " ":
                g.text((x, 1), ch, font=font, fill=255)
            x += font.getlength(ch) * (0.5 if ch == " " else 1)
        a = np.asarray(im) > 127
        ys, xs = np.nonzero(a)
        return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    if vertical:   # 열마다 음절을 위에서 아래로
        cols = []
        for t in lines:
            gl = [one(ch) for ch in t]
            cw = max(g.shape[1] for g in gl)
            col = np.zeros((lh * len(gl), cw), bool)
            for k, g in enumerate(gl):
                col[k * lh:k * lh + g.shape[0], (cw - g.shape[1]) // 2:(cw - g.shape[1]) // 2 + g.shape[1]] = g
            cols.append(col)
        gap = 3; H = max(c.shape[0] for c in cols); W = sum(c.shape[1] for c in cols) + gap * (len(cols) - 1)
        out = np.zeros((H, W), bool); x = W
        for c in cols:   # 첫 열이 오른쪽
            x -= c.shape[1]; out[:c.shape[0], x:x + c.shape[1]] = c; x -= gap
        return out
    rows = [one(t) for t in lines]
    W = max(r.shape[1] for r in rows); out = np.zeros((lh * (len(rows) - 1) + max(r.shape[0] for r in rows), W), bool)
    for j, r in enumerate(rows):
        x = (W - r.shape[1]) // 2; out[j * lh:j * lh + r.shape[0], x:x + r.shape[1]] = r
    return out


def slant(a, down):
    """점 세로줄을 가로 2점에 세로 1점씩 내림(down=True: 오른쪽이 아래 — 오른쪽 벽) / 올림(왼쪽 벽)"""
    h, w = a.shape
    sh = [(x // 2) if down else ((w - 1 - x) // 2) for x in range(w)]
    out = np.zeros((h + max(sh), w), bool)
    for x in range(w):
        out[sh[x]:sh[x] + h, x] = a[:, x]
    return out


def write_on(im, spec, font_path):
    """빈 판 그림(PIL RGBA)에 글씨 — (새 그림, 점 크기, 판 기울기)"""
    from PIL import ImageFont
    f12 = ImageFont.truetype(font_path, 12)
    mask, m, c, x0, x1 = face_of(im)
    W = x1 - x0
    hh = [np.ptp(np.nonzero(mask[:, x])[0]) for x in range(int(x0), int(x1) + 1) if mask[:, x].any()]
    face_h = float(np.median(hh))                                # 판 앞면 세로 두께(비탈 빼고)
    cxc = (x0 + x1) / 2 + spec["dx"] * W
    cyc = m * cxc + c + spec["dy"] * face_h
    vertical = "cols" in spec
    dots = text_dots(f12, spec.get("cols") or spec["lines"], vertical, spec.get("lh", 14))
    sl = slant(dots, m > 0)
    for dot in (4, 3, 2):
        tw, th = sl.shape[1] * dot, dots.shape[0] * dot
        if tw > W * spec.get("wmax", 0.8) or th > face_h * spec.get("hmax", 0.86):
            continue
        big = np.kron(sl, np.ones((dot, dot), bool))
        X0 = int(round((cxc - big.shape[1] / 2) / dot) * dot)
        Y0 = int(round((cyc - big.shape[0] / 2) / dot) * dot)
        px = np.array(im.convert("RGBA"))
        ys, xs = np.nonzero(big); yy, xx = ys + Y0, xs + X0
        ok = (yy >= 0) & (yy < px.shape[0]) & (xx >= 0) & (xx < px.shape[1])
        px[yy[ok], xx[ok]] = INK
        return Image.fromarray(px), dot, m
    raise RuntimeError("글씨가 판에 안 들어감")


def letter_all(blanks, font_path):
    for name, (full, hd) in blanks.items():
        spec = LETTER[name]
        im, size, m = write_on(hd, spec, font_path)
        im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=92, method=6)
        msg = f"  {name}: 글씨 점 {size}px · 판 기울기 {m:+.2f}"
        if spec["both"]:
            imL, sizeL, mL = write_on(hd.transpose(Image.FLIP_LEFT_RIGHT), spec_mirror(spec), font_path)
            imL.save(os.path.join(OUT, name + "_L.webp"), "WEBP", quality=92, method=6)
            msg += f" · 왼쪽 벽용 점 {sizeL}px {mL:+.2f}"
        print(msg)


def spec_mirror(spec):
    s = dict(spec); s["dx"] = -spec["dx"]
    return s


if __name__ == "__main__":
    font = next((a for a in sys.argv[1:] if a.endswith(".ttf")), None)
    bl = main()
    if font:
        letter_all(bl, font)
    else:
        print("글자 판 9개는 빈 판 — 글씨를 쓰려면 Galmuri11-Bold.ttf 주소를 같이: npm pack galmuri@2.40.3 → package/dist/Galmuri11-Bold.ttf")
