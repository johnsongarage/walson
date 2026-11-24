# 아지트 글자 소품의 글씨를 한글 도트 글꼴로 다시 쓰기 (2026-11-24)
#
# 가르시아(11/23 밤) "팻말들의 글씨가 깨져서 보이는데 이거 개선이 어려운건지 알려주고" → (11/24) "팻말 글씨도 다시 써 줘".
# 원인: 받은 시트(11/23 밤 그림 세 장)의 매끈한 글씨를 방 크기로 줄이면서(azit-fit.py, 글자 높이 7~10점) 획이 뭉개졌다.
# 고친 법: 글씨만 지우고(둘레 색으로 메움) 한글 도트 글꼴로 점 하나하나 다시 쓴다. 판·말풍선과 그림(발바닥·하트·응가·
#   치와와 얼굴·연필·우표 등)은 그대로 — 글씨가 길어져 자리가 모자란 곳만 그림을 몇 점 옮기거나(하트·불꽃·발바닥)
#   우표 소인(파란 물결)을 지웠다.
#   - 글꼴: 갈무리 9(한글 9점). 자리가 좁은 셋(오늘도 똥줍 말풍선·산책길 조우 팻말·안가 안걸어 대자보)은 갈무리 7(한글 7점).
#     Galmuri © Lee Minseo(quiple), SIL Open Font License 1.1 — npm galmuri@2.40.3 dist/Galmuri9.ttf·Galmuri7.ttf.
#     그림에 찍어 넣은 글씨라 앱에는 글꼴 파일이 들어가지 않는다(저장소에도 넣지 않음).
#   - 음절은 늘 똑바로(글꼴 점 그대로) 두고, 음절 자리만 판·벽 기울기대로 통째로 내린다. 점째 기울이면(2:1로 눕히기) 9점 한글의
#     가로획이 계단이 되어 다시 깨져 보였다(11/24 휴대폰 크기 3배 비교) — 그 방식도 lay(upright=False)로 남겨 둠.
#   - 벽에 거는 것(말풍선·판넬·스탬프·족자)과 대자보(판이 2:1로 기울어 있음): 그림을 정면으로 되돌려(세로줄 x마다 x//2점 올림)
#     지우고 그림을 옮긴 뒤 다시 눕히고, 글씨는 음절 가운데 세로줄의 기울기만큼 내려 찍는다(두 줄이면 둘째 줄을 첫 줄 끝 아래에 —
#     계단이 엇갈려 읽히지 않게). 왼쪽 벽용(이름_L, azit-room.js both: true)도 같은 정면 그림에서 반대 기울기로 다시 만든다.
#   - 바닥 팻말 둘(간식 내놔라·산책길 조우)은 판이 살짝(0.27·0.3) 기울어 있어 그 기울기대로 음절 자리를 내린다.
#   - 다시 쓴 그림에는 PNG 글 칸(walson-letter)을 남긴다. 한 번 쓴 그림에 또 돌리면 건너뛴다(그림을 옮긴 것이 두 번 옮겨지지 않게)
#     — 처음부터 다시 하려면 azit-fit.py부터.
#   좌표는 정면 그림(벽 그림을 되돌려 빈 둘레를 잘라 낸 것) 또는 바닥 그림 그대로의 점 좌표(x, y), 네모는 (x0, y0, x1, y1) 양 끝 포함.
#
# 쓰는 법(pip pillow numpy):
#   npm pack galmuri@2.40.3 && tar xf galmuri-2.40.3.tgz            → package/dist/Galmuri9.ttf·Galmuri7.ttf
#   python3 _dev/azit-letter.py package/dist [icons/azit-room] [--out 다른 폴더] [--sheet 비교.png]
#   azit-fit.py(→ azit-extra.py) 다음에 돌린다. 그림을 바꾸면 azit.html의 LETTER_V2·picV(그림 주소 ?v=)를 올린다.
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from PIL.PngImagePlugin import PngInfo

MARK = "walson-letter"
FONTS = {9: ("Galmuri9.ttf", 10, 3), 7: ("Galmuri7.ttf", 8, 2)}   # 한글 높이: (파일, 점 크기, 띄어쓰기 폭)

# ── 벽에 거는 것 + 대자보 — 정면 좌표 ──
# erase: 옛 글씨를 지울 네모(그 안에서 바탕색과 다른 점, keep 네모는 빼고) · mode flat = 바탕색과 다르면 지움 / dark = 어두운 점만(무늬 있는 판)
# move: (그림 네모, dx, dy) — 바탕색과 다른 점만 떼어 옮긴다 · text: (글, 글꼴, 왼쪽 x, 위 y) · vtext: 세로쓰기 (글, 글꼴, 줄 왼쪽 x, 위 y)
WALL = {
    # 다녀감 — 발바닥(x39~47)은 그대로, 글씨는 발바닥 왼쪽에 붙여서
    "bubble_visited": dict(both=True, erase=[(12, 4, 38, 14)],
                           text=[("다녀감", 9, 9, 5)]),
    # 인테리어 / 맛집 — 음절이 계단처럼 내려가므로 둘째 줄을 첫 줄 끝(리어) 아래에 맞추고, 하트는 그 왼쪽(인테 아래)으로
    "bubble_interior": dict(both=True, erase=[(8, 15, 41, 35)], move=[((30, 25, 39, 33), -17, 0)],
                            text=[("인테리어", 9, 7, 14), ("맛집", 9, 25, 25)]),
    # 오늘도 똥줍 + 응가(그대로) — 9점 글씨로는 한 줄에 응가까지 안 들어가고(51점 + 응가 11점 > 62점) 두 줄은 말풍선이 낮아
    # 줄이 붙어서, 갈무리 7 한 줄
    "bubble_poop": dict(both=True, erase=[(3, 5, 47, 20)],
                        text=[("오늘도 똥줍", 7, 6, 8)]),
    # 참지않긔 — 글씨가 넓어져(37점) 불꽃을 오른쪽으로 3점
    "bubble_chihuahua": dict(both=True, erase=[(35, 16, 70, 26)], move=[((71, 15, 82, 26), 3, 0)],
                             text=[("참지않긔", 9, 36, 17)]),
    # 집사의 삶 — 판넬 가운데로, 발바닥은 글씨 오른쪽 아래로(연필은 그대로)
    "panel_guestbook": dict(both=True, erase=[(6, 16, 41, 26)], move=[((42, 16, 52, 25), 1, 11)],
                            text=[("집사의 삶", 9, 10, 16)]),
    # 단골 / 인증 — 한 줄로는 안 들어가서 두 줄, 자리를 내려고 우표 왼쪽의 소인(파란 물결)을 지움. 우표·과자는 그대로
    "stamp_regular": dict(both=True, erase=[(3, 3, 24, 23)],
                          text=[("단골", 9, 4, 3), ("인증", 9, 5, 14)]),
    # 개팔자 상팔자 — 족자 종이에 세로로 두 줄(오른쪽 줄부터 읽는 옛 족자처럼: 오른쪽 개팔자, 왼쪽 상팔자)
    "scroll_dogslife": dict(both=True, erase=[(7, 15, 29, 46)],
                            vtext=[("개팔자", 9, 20, 16), ("상팔자", 9, 8, 16)]),
    # 안가 / 안걸어 — 대자보 종이가 좁아(26점) 갈무리 7. 판이 2:1로 기울어 있어 벽 그림처럼 정면으로 되돌려 지우고 쓴다
    "board_refuse": dict(both=False, erase=[(5, 11, 28, 33)], mode="dark",
                         text=[("안가", 7, 10, 14), ("안걸어", 7, 7, 24)]),
}
# ── 바닥 팻말 — 그림 그대로의 좌표. 지우는 곳은 판 기울기를 따른 띠(top + slope·x ≤ y ≤ bottom + slope·x, x0 ≤ x ≤ x1) ──
# step: (글, 글꼴, 가운데 x, 가운데 y) — 음절 가운데가 ref_x에서 멀어질수록 slope만큼 내린다
FLOOR = {
    "sign_snack": dict(band=(2, 30, 4.5, 26.5, 0.27), slope=0.27, ref_x=16,
                       step=[("간식", 9, 16, 13.5), ("내놔라", 9, 16, 24.5)]),
    "sign_meetup": dict(band=(2, 26, 5.5, 23.5, 0.3), slope=0.3, ref_x=14, keep=[(18, 23, 23, 28)],   # 꽃은 그대로
                        step=[("산책길", 7, 14, 12.5), ("조우", 7, 11, 21.5)]),
}


def lum(c):
    c = np.asarray(c, np.float32)
    return c[..., 0] * 0.299 + c[..., 1] * 0.587 + c[..., 2] * 0.114


class Font:
    def __init__(self, path, size, space):
        self.f = ImageFont.truetype(path, size)
        self.space = space
        g = self._raw("가")
        ys = np.nonzero(g.any(1))[0]
        self.top, self.h = int(ys[0]), int(ys[-1] - ys[0] + 1)   # 한글 칸: 받침 있는 글자의 높이(9·7점)

    def _raw(self, ch):
        im = Image.new("L", (40, 30), 0)
        d = ImageDraw.Draw(im)
        d.fontmode = "1"   # 번짐 없이 점 그대로
        d.text((0, 0), ch, font=self.f, fill=255)
        return np.asarray(im) > 127

    def glyph(self, ch):   # 글자 점 배열(높이 = 한글 칸, 폭 = 실제 점 폭)
        g = self._raw(ch)[self.top:self.top + self.h]
        xs = np.nonzero(g.any(0))[0]
        return g[:, xs[0]:xs[-1] + 1]

    def line(self, text, gap=1):
        parts, x = [], 0
        for ch in text:
            if ch == " ":
                x += self.space - gap
                continue
            g = self.glyph(ch)
            parts.append((x, g))
            x += g.shape[1] + gap
        w = x - gap
        out = np.zeros((self.h, w), bool)
        for px, g in parts:
            out[:, px:px + g.shape[1]] |= g
        return out, parts


def put(mask, m, x, y):
    h, w = m.shape
    mask[y:y + h, x:x + w] |= m


def rect_mask(shape, rects):
    m = np.zeros(shape, bool)
    for x0, y0, x1, y1 in rects:
        m[y0:y1 + 1, x0:x1 + 1] = True
    return m


def mode_color(px):
    cols, cnt = np.unique(px.reshape(-1, px.shape[-1]), axis=0, return_counts=True)
    return cols[np.argmax(cnt)]


def base_color(img, region):
    # 바탕색 — 지울 곳의 밝은 점(밝기 100 이상) 중 가장 흔한 색. 글씨가 한 색(거의 검정)이고 바탕은 몇 가지 색이 섞여 있어
    # 그냥 가장 흔한 색을 고르면 글씨색이 나올 수 있다
    px = img[region & (img[:, :, 3] > 0)][:, :3]
    light = px[lum(px) >= 100]
    return mode_color(light if len(light) else px)


def ink_of(img, region):
    # 옛 글씨 색 — 지울 곳의 어두운 점(밝기 70 미만) 중 가장 흔한 색. 없으면 받은 그림 테두리색
    px = img[region & (img[:, :, 3] > 0)]
    dark = px[lum(px[:, :3]) < 70]
    return tuple(mode_color(dark[:, :3])) if len(dark) else (13, 10, 16)


def fill_from_around(img, todo, src_ok, base):
    # 지운 점을 둘레 색으로 메우기 — 메울 점마다 이미 아는 이웃(상하좌우 먼저, 없으면 대각선) 중 바탕으로 쓸 수 있는 점(src_ok —
    # 옆 그림(발바닥·우표·판 테두리)의 색은 안 가져온다)의 가장 흔한 색. 색을 섞지 않으니 판에 없던 색이 생기지 않고,
    # 나뭇결·말풍선의 잔무늬는 옆 결이 이어지듯 메워진다. 끝까지 못 메운 점은 바탕색
    img, todo, ok = img.copy(), todo.copy(), src_ok & ~todo
    h, w = todo.shape
    while todo.any():
        done = []
        for y, x in zip(*np.nonzero(todo)):
            for nb in (((0, -1), (0, 1), (-1, 0), (1, 0)), ((-1, -1), (-1, 1), (1, -1), (1, 1))):
                cs = [tuple(img[y + dy, x + dx]) for dy, dx in nb
                      if 0 <= y + dy < h and 0 <= x + dx < w and ok[y + dy, x + dx]]
                if cs:
                    done.append((y, x, max(set(cs), key=cs.count)))
                    break
        if not done:
            img[todo, :3] = base
            break
        for y, x, c in done:
            img[y, x] = c
            todo[y, x] = False
            ok[y, x] = True
    return img


def erase(img, region, mode):
    base = base_color(img, region)
    L = lum(img[:, :, :3])
    alpha = img[:, :, 3] > 0
    if mode == "dark":   # 무늬 있는 판(나뭇결·종이) — 어두운 점과 그 옆의 번진 점만
        dark = L < 140
        near = np.zeros_like(dark)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                near |= np.roll(np.roll(dark, dy, 0), dx, 1)
        todo = region & (dark | (near & (L < 215)))
        src_ok = alpha & (L >= 140)
    else:
        diff = np.abs(img[:, :, :3].astype(int) - base.astype(int)).sum(-1)
        todo = region & (diff > 12)
        src_ok = alpha & (diff <= 12)
    return fill_from_around(img, todo & alpha, src_ok, base), base


# ── 정면 ↔ 벽 기울기 (점을 세로줄째 옮기기만 해서 그림이 그대로 돌아온다) ──
def to_front(img):
    h, w = img.shape[:2]
    pad = (w - 1) // 2
    out = np.zeros((h + pad, w, 4), np.uint8)
    for x in range(w):
        out[pad - x // 2:pad - x // 2 + h, x] = img[:, x]
    ys, xs = np.nonzero(out[:, :, 3])
    return out, pad, (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1)


def from_front(full, pad, h):
    w = full.shape[1]
    out = np.zeros((h, w, 4), np.uint8)
    for x in range(w):
        out[:, x] = full[pad - x // 2:pad - x // 2 + h, x]
    return out


def skew_l(img):   # 왼쪽 벽 기울기 — azit-fit.py와 같은 식
    h, w = img.shape[:2]
    out = np.zeros((h + (w - 1) // 2, w, 4), np.uint8)
    for x in range(w):
        s = (w - 1 - x) // 2
        out[s:s + h, x] = img[:, x]
    return out


def shear_ink(mask, dy_of):
    # 글씨 점을 세로줄마다 dy_of(x)만큼 내린다. 이웃한 두 점이 눕힌 뒤 떨어지면(대각선 획이 계단 사이에서 끊김) 그 사이를 한 점 메운다
    pts = set()
    ys, xs = np.nonzero(mask)
    on = set(zip(xs.tolist(), ys.tolist()))
    for x, y in on:
        X, Y = x, y + dy_of(x)
        pts.add((X, Y))
        for dx, dy in ((1, 1), (1, -1)):   # 대각선 이웃만 끊길 수 있다(가로·세로 이웃은 눕혀도 붙어 있음) — 한 쌍을 한 번씩만
            if (x + dx, y + dy) in on:
                Y2 = y + dy + dy_of(x + dx)
                if abs(Y2 - Y) > 1:
                    pts.add((X, Y + (1 if Y2 > Y else -1)))
    return pts


def text_pieces(spec, fonts):
    # 글자(음절) 조각 목록 [(점 배열, 왼쪽 x, 위 y)] — 정면 좌표
    out = []
    for t, size, x, y in spec.get("text", []):
        for px, g in fonts[size].line(t)[1]:
            out.append((g, x + px, y))
    for t, size, x, y in spec.get("vtext", []):   # 세로쓰기 — 글자마다 줄 폭(한글 칸 폭) 가운데에, 글자 사이 2점
        f = fonts[size]
        cw = max(f.glyph(ch).shape[1] for ch in t)
        for k, ch in enumerate(t):
            g = f.glyph(ch)
            out.append((g, x + (cw - g.shape[1]) // 2, y + k * (f.h + 2)))
    return out


def lay(pieces, shape, dy_of, upright):
    # 정면 글씨를 눕힌 그림의 점 자리로. upright = 음절은 똑바로 두고 음절 가운데 세로줄의 기울기만큼 통째로 내림(획이 안 휨)
    if upright:
        pts = set()
        for g, x, y in pieces:
            dy = dy_of(x + g.shape[1] // 2)
            ys, xs = np.nonzero(g)
            pts.update(zip((x + xs).tolist(), (y + ys + dy).tolist()))
        return pts
    m = np.zeros(shape, bool)
    for g, x, y in pieces:
        put(m, g, x, y)
    return shear_ink(m, dy_of)


def letter_wall(name, spec, src, fonts):
    R = src[name]
    full, pad, (y0, y1, x0, x1) = to_front(R)
    F = full[y0:y1, x0:x1].copy()
    region = rect_mask(F.shape[:2], spec["erase"]) & ~rect_mask(F.shape[:2], spec.get("keep", []))
    ink = ink_of(F, region)
    base = base_color(F, region)
    moved = []
    for (mx0, my0, mx1, my1), dx, dy in spec.get("move", []):   # 떼어 낼 그림 — 바탕색과 다른 점
        for y in range(my0, my1 + 1):
            for x in range(mx0, mx1 + 1):
                if F[y, x, 3] and np.abs(F[y, x, :3].astype(int) - base.astype(int)).sum() > 12:
                    moved.append((x + dx, y + dy, F[y, x].copy()))
        region |= rect_mask(F.shape[:2], [(mx0, my0, mx1, my1)])
    F, _ = erase(F, region, spec.get("mode", "flat"))
    for x, y, c in moved:
        F[y, x] = c
    pieces, up = text_pieces(spec, fonts), spec.get("upright", True)
    full[y0:y1, x0:x1] = F
    out = {name: from_front(full, pad, R.shape[0])}
    # 오른쪽 벽: 정면 (x, y) → 그림 (x0 + x, y0 + y - pad + (x0 + x)//2)
    for X, Y in lay(pieces, F.shape[:2], lambda x: y0 - pad + (x + x0) // 2, up):
        out[name][Y, x0 + X, :3] = ink
        out[name][Y, x0 + X, 3] = 255
    if spec["both"]:
        w = F.shape[1]
        L = skew_l(F)
        for X, Y in lay(pieces, F.shape[:2], lambda x: (w - 1 - x) // 2, up):
            L[Y, X, :3] = ink
            L[Y, X, 3] = 255
        out[name + "_L"] = L
    return out


def letter_floor(name, spec, src, fonts):
    img = src[name].copy()
    h, w = img.shape[:2]
    x0, x1, top, bot, sl = spec["band"]
    yy, xx = np.mgrid[0:h, 0:w]
    region = (xx >= x0) & (xx <= x1) & (yy >= top + sl * xx) & (yy <= bot + sl * xx)
    region &= ~rect_mask((h, w), spec.get("keep", []))
    ink = ink_of(img, region)
    img, _ = erase(img, region, "dark")
    for t, size, cx, cy in spec["step"]:
        f = fonts[size]
        m, parts = f.line(t)
        left, ty = int(round(cx - m.shape[1] / 2)), int(round(cy - f.h / 2))
        for px, g in parts:   # 음절은 똑바로, 자리만 판 기울기대로
            mid = left + px + g.shape[1] / 2
            dy = int(round(spec["slope"] * (mid - spec["ref_x"])))
            ys, xs = np.nonzero(g)
            img[ty + dy + ys, left + px + xs, :3] = ink
            img[ty + dy + ys, left + px + xs, 3] = 255
    return {name: img}


def big(img, k):
    return Image.fromarray(img).resize((img.shape[1] * k, img.shape[0] * k), Image.NEAREST)


def sheet(before, after, path):
    # 전·후 비교(6배) — 왼쪽이 전, 오른쪽이 후
    names = list(after)
    k, padd = 6, 10
    rows = []
    for n in names:
        a, b = before.get(n), after[n]
        ww = (a.shape[1] if a is not None else 0) * k + b.shape[1] * k + padd * 3
        hh = max(a.shape[0] if a is not None else 0, b.shape[0]) * k + padd * 2
        r = Image.new("RGBA", (ww, hh), (244, 238, 242, 255))
        if a is not None:
            r.alpha_composite(big(a, k), (padd, padd))
        r.alpha_composite(big(b, k), ((a.shape[1] if a is not None else 0) * k + padd * 2, padd))
        rows.append(r)
    W = 1800
    x = y = rh = 0
    pos = []
    for r in rows:
        if x + r.size[0] > W:
            x, y, rh = 0, y + rh + 8, 0
        pos.append((x, y))
        x += r.size[0] + 8
        rh = max(rh, r.size[1])
    out = Image.new("RGBA", (W, y + rh), (255, 255, 255, 255))
    for r, p in zip(rows, pos):
        out.alpha_composite(r, p)
    out.save(path)


def main():
    args = [a for a in sys.argv[1:]]
    opt = {}
    for key in ("--out", "--sheet"):
        if key in args:
            i = args.index(key)
            opt[key] = args[i + 1]
            del args[i:i + 2]
    font_dir = args[0]
    src_dir = args[1] if len(args) > 1 else "icons/azit-room"
    out_dir = opt.get("--out", src_dir)
    fonts = {k: Font(os.path.join(font_dir, fn), size, sp) for k, (fn, size, sp) in FONTS.items()}
    src, done = {}, set()
    for name in list(WALL) + list(FLOOR):
        for n in (name, name + "_L"):
            p = os.path.join(src_dir, n + ".png")
            if os.path.exists(p):
                im = Image.open(p)
                if im.info.get(MARK):
                    done.add(name)
                src[n] = np.asarray(im.convert("RGBA")).copy()
    os.makedirs(out_dir, exist_ok=True)
    after = {}
    for name, spec in list(WALL.items()) + list(FLOOR.items()):
        if name in done:
            print("건너뜀(이미 다시 쓴 그림):", name)
            continue
        res = letter_wall(name, spec, src, fonts) if name in WALL else letter_floor(name, spec, src, fonts)
        for n, img in res.items():
            info = PngInfo()
            info.add_text(MARK, "Galmuri 2.40.3 (OFL) — _dev/azit-letter.py 2026-11-24")
            Image.fromarray(img).save(os.path.join(out_dir, n + ".png"), pnginfo=info, optimize=True)
            after[n] = img
            print(n, "%dx%d" % (img.shape[1], img.shape[0]))
    if "--sheet" in opt and after:
        sheet(src, after, opt["--sheet"])


if __name__ == "__main__":
    main()
