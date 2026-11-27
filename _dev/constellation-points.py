# 별자리 시안(constellation-sian.html) 별 자리 뽑기 (2026-11-26)
#
# 가르시아 "별자리를 이어서 뭔가를 만들어내는 감성 어떤데?" → "별자리 시안 만들어줘".
# 산책 한 번 = 별 하나, 한 달 = 우리 개 별자리 하나. 별 자리는 도트 강아지 8마리(icons/dot-dogs/px)의 머리 윤곽에서 뽑는다:
#   1) 머리 쪽만 자른 그림(HEAD — 니트는 거꾸로 매달린 그림이라 몸 전체)의 알파 윤곽
#   2) 꼭짓점 OUTLINE개(Visvalingam — 귀 끝·볼·목이 남는다, 붙은 별은 덜어 냄) — 왼쪽 목에서 시작해 귀·정수리를 지나 오른쪽 목까지(아래는 열어 둠)
#   3) 눈 둘·코 하나는 그림에서 눈으로 읽어 적은 자리(FACE) — 자동으로 찾으면 털 무늬·혀를 눈으로 잡는 강아지가 있어서
#   마지막 세 별(코 → 왼눈 → 오른눈)이 들어오면 "눈을 떠요".
# 나온 것: 화면에 붙여 넣는 JSON 한 줄(좌표는 그림 점 단위, 소수 한 자리 — constellation-sian.html DOGS) + 미리 보기 그림(--png 폴더).
# 쓰는 법(pip pillow numpy opencv-python-headless): python3 _dev/constellation-points.py [--png 폴더]
import sys, json
import numpy as np
import cv2
from PIL import Image, ImageDraw

PX = "icons/dot-dogs/px"
OUTLINE = 12
# 머리 자르기 [위, 아래) — 턱 아래 목까지. None이면 그림 전체
HEAD = {"chihuahua": (0, 58), "pom": (0, 56), "maltese": (0, 50), "shiba": (0, 74),
        "poodle": (0, 46), "dachs": (0, 38), "jindo": (0, 60), "knit": None,
        # 11/27 새 견종(제미나이 초록 바탕 — _dev/dot-dog-green.py)
        "spitz": (0, 48), "cocker": (0, 66), "chihuahua_long": (0, 50), "bichon": (0, 52), "golden": (0, 56),
        "schnauzer": (0, 46), "frenchie": (0, 50), "sheltie": (0, 58), "bedlington": (0, 70), "maltipoo": (0, 46)}
# 머리가 아닌 데를 더 지우는 칸 [x0, y0, x1, y1) — 푸들은 오른쪽 아래 꼬리 방울이 귀 옆에 붙어 있다
CUT = {"poodle": [(53, 32, 99, 99)], "spitz": [(53, 30, 99, 99)], "bichon": [(52, 40, 99, 99)], "chihuahua_long": [(50, 34, 99, 99)],
       "schnauzer": [(50, 38, 99, 99)], "frenchie": [(44, 48, 99, 99)], "maltipoo": [(50, 36, 99, 99)]}
# 눈 둘(왼·오른)·코 — 그림 점 좌표(그림 전체 기준)
FACE = {"chihuahua": [(20, 32.5), (42, 32.5), (30.5, 39)],
        "pom": [(25, 30), (44, 31.5), (34.5, 38.5)],
        "maltese": [(38, 21.5), (54, 21.5), (48, 29.5)],
        "shiba": [(71, 35.5), (92.5, 35.5), (82, 50)],
        "poodle": [(23.5, 24), (39, 23.3), (31, 31)],
        "dachs": [(18.3, 15.8), (34.2, 15.8), (26.3, 25.8)],
        "jindo": [(20, 31.5), (40, 31.5), (30.4, 43)],
        "knit": [(11, 47), (20.5, 50), (14, 52)],
        "spitz": [(18.8, 25.6), (35.3, 25.6), (27, 33)],
        "cocker": [(64.2, 23.9), (86.9, 23.9), (75.3, 32)],
        "chihuahua_long": [(18.1, 27.5), (37, 27.5), (27.5, 32.7)],
        "bichon": [(24.2, 27.4), (41.9, 27.4), (33, 33)],
        "golden": [(63.2, 19.6), (83.8, 19.6), (73, 30)],
        "schnauzer": [(19.1, 20.1), (37.8, 20.1), (28.5, 28)],
        "frenchie": [(13, 27.5), (35, 27.5), (24.5, 31.5)],
        "sheltie": [(64.7, 26.9), (80.2, 26.8), (72.5, 42.3)],
        "bedlington": [(36.4, 30.6), (57.6, 30.6), (45.4, 50.5)],
        "maltipoo": [(22.7, 24.4), (39.4, 24.4), (31, 32.1)]}
ORDER = ["chihuahua", "pom", "maltese", "shiba", "poodle", "dachs", "jindo", "knit", "spitz", "cocker", "chihuahua_long", "bichon", "golden", "schnauzer", "frenchie", "sheltie", "bedlington", "maltipoo"]


def mask_of(name):
    a = np.asarray(Image.open(f"{PX}/{name}.png").convert("RGBA"))[..., 3] > 0
    H = a.shape[0]
    y0, y1 = HEAD[name] or (0, H)
    m = np.zeros_like(a); m[y0:y1] = a[y0:y1]
    for x0, cy0, x1, cy1 in CUT.get(name, []): m[cy0:cy1, x0:x1] = False
    m = m.astype(np.uint8)
    # 가장 큰 덩어리 + 구멍 메우기
    k, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    big = 1 + int(np.argmax(st[1:, 4]))
    m = (lab == big).astype(np.uint8)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    filled = np.zeros_like(m); cv2.drawContours(filled, cs, -1, 1, -1)
    return filled, y0, y1


def tri(a, b, c):
    return abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2


def outline_pts(m, y1, n=OUTLINE):
    """윤곽 꼭짓점 n개 — 잔 톱니를 DP(0.8)로 먼저 걷고, Visvalingam(빼도 모양이 덜 변하는 점부터 뺌)으로 n개까지.
    이웃 별이 너무 붙으면(그림 크기의 7% 안) 둘 중 덜 중요한 쪽을 먼저 뺀다 — 귀와 볼 사이 홈에 별이 몰리지 않게"""
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    p = [tuple(map(float, q)) for q in cv2.approxPolyDP(c, 0.8, True)[:, 0, :]]
    ys, xs = np.nonzero(m)
    dmin = 0.07 * max(xs.max() - xs.min(), ys.max() - ys.min())
    while len(p) > n:
        L = len(p)
        area = [tri(p[i - 1], p[i], p[(i + 1) % L]) for i in range(L)]
        close = [i for i in range(L) if np.hypot(p[i][0] - p[(i + 1) % L][0], p[i][1] - p[(i + 1) % L][1]) < dmin]
        if close:
            i = close[0]; j = (i + 1) % L
            k = i if area[i] < area[j] else j
        else:
            k = int(np.argmin(area))
        p.pop(k)
    p = np.array(p)
    # 시계 방향(화면에서 위로 올라가 오른쪽으로): 넓이 부호로 맞춤
    a2 = 0.5 * np.sum(p[:, 0] * np.roll(p[:, 1], -1) - np.roll(p[:, 0], -1) * p[:, 1])
    if a2 < 0: p = p[::-1]
    # 시작 = 왼쪽 아래(아래쪽 가장자리 중 가장 왼쪽) — 거기서 왼쪽 옆을 타고 올라감
    yb = p[:, 1].max()
    low = [i for i in range(len(p)) if p[i, 1] >= yb - 2.5]
    s = min(low, key=lambda i: p[i, 0])
    p = np.roll(p, -s, axis=0)
    if p[1, 0] > p[-1, 0]:   # 두 번째 별이 마지막 별보다 오른쪽이면 반대로 도는 것
        p = np.roll(p[::-1], 1, axis=0)
    return p


def main():
    out, png = {}, None
    if "--png" in sys.argv: png = sys.argv[sys.argv.index("--png") + 1]
    tiles = []
    for name in ORDER:
        im = Image.open(f"{PX}/{name}.png").convert("RGBA")
        m, y0, y1 = mask_of(name)
        p = outline_pts(m, y1)
        face = FACE[name]
        out[name] = {"w": im.width, "h": im.height, "crop": [y0, y1],
                     "line": [[round(x, 1), round(y, 1)] for x, y in p],
                     "face": [[x, y] for x, y in face]}
        if HEAD[name] is None:
            out[name]["close"] = True   # 몸 전체(니트)는 윤곽을 닫는다 — 머리만 자른 것은 아래(목)를 열어 둠
        if png:
            Z = 5
            t = Image.new("RGBA", (im.width * Z + 40, im.height * Z + 40), (14, 16, 36, 255))
            ghost = im.resize((im.width * Z, im.height * Z), Image.NEAREST)
            g = np.asarray(ghost).copy(); g[..., 3] = (g[..., 3] * 0.25).astype(np.uint8)
            t.alpha_composite(Image.fromarray(g), (20, 20))
            d = ImageDraw.Draw(t)
            P = [(20 + x * Z, 20 + y * Z) for x, y in p]
            d.line(P, fill=(200, 210, 255, 255), width=2)
            for i, (x, y) in enumerate(P):
                d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(255, 245, 200, 255)); d.text((x + 6, y - 6), str(i + 1), fill=(255, 200, 120, 255))
            for i, (x, y) in enumerate(face):
                X, Y = 20 + x * Z, 20 + y * Z
                d.ellipse([X - 6, Y - 6, X + 6, Y + 6], fill=(255, 150, 200, 255))
            d.text((24, 24), name, fill=(255, 255, 255, 255))
            tiles.append(t)
    if png:
        W = sum(t.width for t in tiles); H = max(t.height for t in tiles)
        sheet = Image.new("RGBA", (W, H), (14, 16, 36, 255)); x = 0
        for t in tiles: sheet.alpha_composite(t, (x, 0)); x += t.width
        sheet.save(f"{png}/constellations.png")
    print(json.dumps(out, ensure_ascii=False, separators=(",", ":")))


if __name__ == "__main__":
    main()
