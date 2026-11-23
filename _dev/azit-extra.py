# 아지트 새 방에 모자란 그림 만들기 (2026-11-23) — azit-fit.py 다음 단계
#
# 가르시아 "탭에 넣기"(산책 아지트 C안을 실제 [아지트] 탭으로). 받은 그림(Gemini 시트)에 없는 것을 같은 화풍으로 만든다:
#   - 코드로 그린 도트(받은 그림처럼 거의 검정 1점 테두리 + 3단 명암): 당근 인형 · 스탠드 조명 · 앰배서더 깃발(바닥에 세움) ·
#     응가 봉투 걸이 · 키링 걸이 · 피크닉 매트(바닥에 비스듬히) · 친구 발자국(털색으로 물들일 흰 그림) · 머리 장식(리본·산책 모자·왕관)
#   - 받은 그림 색 바꾸기(점은 그대로 — 다시 그리지 않으니 품질 그대로):
#     분홍 빈 방 → 라일락 방·밤 블랙 핑크 방(벽지 고르기 셋 — 방 모습 글자 j·l·n은 예전 그대로).
#     밤 방의 분홍 줄은 예전 밤 벽지처럼 판벽 위 띠·천장 몰딩에만(night_accents — 분홍 방 그림 좌표)
#   - 액자 속 그림 비우기: 금 액자(우리 개 사진 액자) · 강아지 액자(단짝 액자) — 비운 칸은 알파 1로 남겨
#     azit.html이 그 칸에 사진·단짝 강아지를 그려 넣는다(액자 테 안쪽 4점, 세로줄마다 몸통 위아래에서).
#
# 쓰는 법(pip pillow numpy): python3 _dev/azit-extra.py [icons/azit-room]   — 그 폴더의 room.png·banner_flag_blue.png·frame_*.png를 읽는다
import os, sys, colorsys
import numpy as np
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else "icons/azit-room"
INK = (13, 10, 16)          # 받은 그림 테두리(거의 검정)와 같게


def hexc(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def sprite(w, h, fn):
    # fn(x, y) → 색(#hex 또는 (r,g,b)) 또는 None. 둘레에 1점 테두리를 자동으로 두른다
    grid = [[fn(x, y) for x in range(w)] for y in range(h)]
    out = np.zeros((h + 2, w + 2, 4), np.uint8)
    on = lambda x, y: 0 <= x < w and 0 <= y < h and grid[y][x] is not None
    for y in range(-1, h + 1):
        for x in range(-1, w + 1):
            if on(x, y):
                c = grid[y][x]
                out[y + 1, x + 1] = (*(hexc(c) if isinstance(c, str) else c), 255)
            elif on(x + 1, y) or on(x - 1, y) or on(x, y + 1) or on(x, y - 1):
                out[y + 1, x + 1] = (*INK, 255)
    return out


def skew_r(img):
    # 평평한 그림 → 오른쪽 벽 방향(오른쪽으로 갈수록 반 점씩 내려감, 2:1). 왼쪽 벽은 azit.html이 좌우로 뒤집는다
    h, w = img.shape[:2]
    out = np.zeros((h + (w - 1) // 2, w, 4), np.uint8)
    for x in range(w):
        s = x // 2
        out[s:s + h, x] = img[:, x]
    return out


def ell(x, y, cx, cy, rx, ry):
    a, b = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
    return a * a + b * b <= 1


def save(name, arr):
    Image.fromarray(arr).save(os.path.join(OUT, name + ".png"), optimize=True)
    print(f"{name}: {arr.shape[1]}x{arr.shape[0]}")


# ── 코드로 그린 소품 ──
def carrot_plush():                      # 당근 인형(산책 5번) — 바닥, 키 22점쯤
    def f(x, y):
        if y <= 6:                                                   # 잎 셋
            for cx, cy, rx, ry in ((7, 3.5, 1.6, 3.6), (4.2, 4.5, 1.5, 2.8), (9.8, 4.5, 1.5, 2.8)):
                if ell(x, y, cx, cy, rx, ry):
                    return "#2f7a3d" if abs(x + 0.5 - cx) < 0.5 else ("#8fd694" if x + 0.5 < cx else "#5fb36a")
            return None
        half = 6.5 - (y - 6) * 0.42                                  # 몸통 — 위가 넓고 아래로 뾰족
        if half < 0.6 or abs(x + 0.5 - 7) > half:
            return None
        if y in (10, 15) and abs(x + 0.5 - 7) < half - 1.5:          # 바느질 줄
            return "#c9612a"
        if y == 9 and x in (5, 9):
            return "#3a2b2e"                                         # 눈
        if y == 10 and x in (4, 10):
            return "#ff9cc0"                                         # 볼
        if x + 0.5 < 7 - half + 1.8:
            return "#ffb26b"                                         # 빛 받는 쪽
        if x + 0.5 > 7 + half - 1.8:
            return "#d96a2c"
        return "#f2873a"
    return sprite(14, 21, f)


def lamp_stand():                         # 스탠드 조명(꾸준함 1주) — 바닥, 키 50점쯤
    def f(x, y):
        cx = 9.5
        if y <= 13:                                                  # 갓
            half = 4 + y * 0.42
            if abs(x + 0.5 - cx) > half:
                return None
            if y == 13:
                return "#c98d2e"
            if x + 0.5 < cx - half + 1.8:
                return "#fff6cc"
            if x + 0.5 > cx + half - 1.8:
                return "#e8b04a"
            return "#ffe08a" if (x + y) % 5 else "#ffd86b"
        if y == 14:
            return "#fff0b8" if abs(x + 0.5 - cx) < 3 else None      # 전구 빛
        if y <= 43:                                                  # 기둥
            if abs(x + 0.5 - cx) < 1.1:
                return "#8a6450" if x + 0.5 < cx else "#5a3d2f"
            return None
        if ell(x, y, cx, 46, 7, 2.6):                                # 받침
            return "#9a7058" if y <= 45 else "#5a3d2f"
        return None
    return sprite(19, 49, f)


def flag_stand():                         # 앰배서더 깃발(핑크 앰배서더) — 바닥에 세우는 깃발, 키 46점쯤
    def f(x, y):
        if y <= 2:                                                   # 깃대 끝 금빛 공
            return ("#fff3c4" if x == 3 else "#f5c542") if ell(x, y, 3.5, 1.5, 1.6, 1.6) else None
        if 3 <= y <= 18 and 5 <= x <= 19:                            # 분홍 삼각 깃발(오른쪽으로 갈수록 좁게)
            mid, half = 10.5, 7.5 - (x - 5) * 0.52
            if abs(y + 0.5 - mid) <= half:
                hx, hy = x - 9, y - 7                                # 흰 하트
                heart = (hy == 0 and hx in (0, 1, 3, 4)) or (hy in (1, 2) and 0 <= hx <= 4) or (hy == 3 and 1 <= hx <= 3) or (hy == 4 and hx == 2)
                if heart:
                    return "#ffffff"
                if y + 0.5 < mid - half + 1.6:
                    return "#ff9cc0"
                if y + 0.5 > mid + half - 1.6:
                    return "#c23a74"
                return "#ff5c9d"
        if 3 <= y <= 40 and x in (3, 4):                             # 깃대
            return "#a8714a" if x == 3 else "#6b4428"
        if ell(x, y, 3.8, 42.5, 4.6, 2.2):                           # 받침
            return "#9a7058" if y <= 42 else "#5a3d2f"
        return None
    return sprite(20, 45, f)


def poopbag_holder():                     # 응가 봉투 걸이(응가 치움 10번) — 벽
    def f(x, y):
        if y <= 7:                                                   # 나무 판(둥근 모서리) + 고리
            if (x in (0, 13) and y in (0, 7)):
                return None
            if y == 0:
                return "#e0a868"
            if y == 7:
                return "#8a5a34"
            if 5 <= x <= 8 and 3 <= y <= 4:
                return "#b8c0c6"                                     # 쇠고리
            return "#c9894f"
        if 8 <= y <= 9:
            return "#9aa3aa" if 6 <= x <= 7 else None                # 걸이 쇠
        if 10 <= y <= 19:                                            # 봉투 두루마리
            if not 2 <= x <= 11:
                return None
            if y in (10, 19):
                return "#3f8f4c"
            if x <= 3:
                return "#8fd694"
            if x >= 10:
                return "#3f8f4c"
            if y == 14 and 5 <= x <= 8:
                return "#ffffff"                                     # 발바닥 무늬 대신 흰 줄
            return "#5fb36a"
        if 20 <= y <= 24:                                            # 늘어진 봉투 끝
            return "#5fb36a" if 6 <= x <= 9 - (y - 20) // 2 else None
        return None
    return skew_r(sprite(14, 25, f))


def keyhook_rail():                       # 키링 걸이(키링 받음) — 벽
    def f(x, y):
        if y <= 4:                                                   # 나무 막대
            if y == 0:
                return "#e0a868"
            if y == 4:
                return "#8a5a34"
            return "#c9894f" if (x + y) % 6 else "#b57a43"
        if 5 <= y <= 6:                                              # 못 셋
            return "#9aa3aa" if x in (4, 12, 20) else None
        # 가운데 못에 키링 — 고리 + 분홍 아크릴 + 작은 발바닥
        if 7 <= y <= 9:
            if (y == 7 and x in (11, 13)) or (y in (8, 9) and x in (10, 14)) or (y == 9 and x in (11, 12, 13)):
                return "#b8c0c6"
            return None
        if 10 <= y <= 19 and 8 <= x <= 16:
            if (x in (8, 16) and y in (10, 19)):
                return None
            if (y == 13 and x in (11, 13)) or (y == 15 and 11 <= x <= 13) or (y == 16 and x == 12):
                return "#ffffff"
            if x <= 9 or y == 10:
                return "#ffc0d3"
            if x >= 15 or y == 19:
                return "#d23f7a"
            return "#ff5c9d"
        if 7 <= y <= 15 and x == 4:                                  # 왼쪽 못엔 리드줄 고리
            return "#5aa0e6" if y < 15 else "#3a74b4"
        return None
    return skew_r(sprite(25, 20, f))


def picnic_mat(A=28, B=24):               # 피크닉 매트(공원 발도장) — 바닥에 비스듬히 까는 것, 체크무늬
    w, h = 2 * (A + B), A + B + 1
    out = np.zeros((h + 2, w + 2, 4), np.uint8)
    inside = np.zeros((h, w), bool)
    col = np.zeros((h, w, 3), np.uint8)
    for y in range(h):
        for x in range(w):
            a, b = (x + 0.5 - 2 * B) / 2, y + 0.5                    # 위 꼭짓점(2B, 0)에서 i, j
            i, j = (a + b) / 2, (b - a) / 2
            if not (0 <= i <= A and 0 <= j <= B):
                continue
            inside[y, x] = True
            e = min(i, A - i, j, B - j)
            if e < 1.4:
                c = "#b8322c"                                        # 가장자리 띠
            else:
                chk = (int(i / 4) + int(j / 4)) % 2
                c = "#e2574c" if chk else "#fdf6ec"
                if (i % 4 < 0.6 or j % 4 < 0.6) and chk:
                    c = "#c94a40"                                    # 체크 칸 줄
            col[y, x] = hexc(c)
    for y in range(-1, h + 1):
        for x in range(-1, w + 1):
            if 0 <= y < h and 0 <= x < w and inside[y, x]:
                out[y + 1, x + 1] = (*col[y, x], 255)
            else:
                nb = [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
                if any(0 <= xx < w and 0 <= yy < h and inside[yy, xx] for xx, yy in nb):
                    out[y + 1, x + 1] = (*INK, 255)
    return out


def paw():                                # 친구 발자국 — 흰색(털색으로 물들인다)
    shape = ["..#.#..", ".##.##.", ".......", "..###..", ".#####.", ".#####.", "..###.."]
    h, w = len(shape), len(shape[0])
    out = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        for x in range(w):
            if shape[y][x] == "#":
                out[y, x] = (255, 255, 255, 255)
    return out


def acc_ribbon():                         # 리본 — 머리 위
    def f(x, y):
        l = ell(x, y, 3.2, 3.5, 3.2, 3.2)
        r = ell(x, y, 9.8, 3.5, 3.2, 3.2)
        k = 5 <= x <= 7 and 2 <= y <= 5
        if k:
            return "#c23a74" if y in (2, 5) else "#ff7fae"
        if l or r:
            cx = 3.2 if l else 9.8
            if y <= 2 and x + 0.5 < cx + 1:
                return "#ffc0d3"
            return "#d23f7a" if y >= 5 else "#ff5c9d"
        return None
    return sprite(13, 7, f)


def acc_cap():                            # 산책 모자 — 머리 위
    def f(x, y):
        if y >= 6:                                                   # 챙(앞으로)
            return ("#3a74b4" if y == 7 else "#5aa0e6") if 3 <= x <= 16 else None
        if ell(x, y, 8.5, 6.2, 7.5, 6):
            if 7 <= x <= 9 and 2 <= y <= 3:
                return "#ffffff"                                     # 동그란 표시
            if y <= 1 and x == 8:
                return "#ffffff"
            return "#9cc8f5" if x + 0.5 < 6 and y <= 4 else ("#3a74b4" if x >= 14 else "#5aa0e6")
        return None
    return sprite(17, 8, f)


def acc_crown():                          # 왕관 — 머리 위
    def f(x, y):
        if y >= 5:                                                   # 띠
            if y == 6 and x in (3, 10):
                return "#ff5c9d" if x == 3 else "#5aa0e6"            # 보석
            if y == 6 and x in (6, 7):
                return "#ffffff"
            return "#d99a2b" if y == 8 else ("#fff3c4" if x <= 1 else "#f5c542")
        tips = ((1, 0), (6.5, 0), (12, 0))
        for tx, ty in tips:
            if abs(x + 0.5 - (tx + 0.5)) <= (y - ty) * 0.6 + 0.6 and y >= ty:
                return "#fff3c4" if x + 0.5 < tx + 0.5 else "#f5c542"
        return None
    return sprite(14, 9, f)


# ── 색 바꾸기(점 그대로) ──
def hls(c):
    return colorsys.rgb_to_hls(c[0] / 255, c[1] / 255, c[2] / 255)


def rgb(h, l, s):
    r, g, b = colorsys.hls_to_rgb(h % 1, max(0, min(1, l)), max(0, min(1, s)))
    return (int(round(r * 255)), int(round(g * 255)), int(round(b * 255)))


def remap(img, fn):
    out = img.copy()
    cache = {}
    H, W = img.shape[:2]
    for y in range(H):
        for x in range(W):
            if img.shape[2] == 4 and img[y, x, 3] == 0:
                continue
            k = tuple(int(v) for v in img[y, x, :3])
            if k not in cache:
                cache[k] = fn(k)
            out[y, x, :3] = cache[k]
    return out


def pinkish(h):                            # 분홍~크림 색상(벽지)
    d = h * 360
    return d >= 320 or d <= 35


def room_lilac(c):
    h, l, s = hls(c)
    if l > 0.68 and pinkish(h):            # 벽지·계단(밝은 분홍·크림) → 라일락
        return rgb(272 / 360, l, min(s, 1) * 0.62)
    return c


def room_night(c):
    h, l, s = hls(c)
    d = h * 360
    if l > 0.68 and pinkish(h):            # 벽지 → 어두운 자두색(밝기 차이는 남겨 줄무늬·무늬가 보이게)
        return rgb(305 / 360, 0.13 + (l - 0.68) * 0.62, 0.22)
    if l > 0.22 and (d <= 45 or d >= 335):  # 나무(마루·판벽·선반·이음매) → 보랏빛 어두운 나무
        return rgb(282 / 360, 0.08 + l * 0.27, 0.14 + s * 0.08)
    return rgb(h, l * 0.55, s * 0.6)       # 그 밖(테두리·그늘·계단 그림자)


def night_accents(src, dark):
    # 밤 블랙 핑크의 분홍 줄 — 예전 밤 벽지처럼 판벽 위 띠(바닥에서 30~35점)와 천장 몰딩에만(분홍 방 그림 좌표)
    out = dark.copy()
    H, W = src.shape[:2]
    pink = lambda l: rgb(336 / 360, 0.42 + l * 0.32, 0.9)
    for y in range(H):
        for x in range(46, W):
            r, g, b = (int(v) for v in src[y, x, :3])
            _, l, _ = hls((r, g, b))
            fy = 74 + (x - 199) / 2 if x >= 199 else 74 + (199 - x) / 2   # 그 세로줄 벽과 바닥이 만나는 줄
            hgt = fy - y
            cap = 30 <= hgt <= 35 and l < 0.8                              # 판벽 위 띠(벽지 빼고)
            if x >= 250:
                cy = 2 + (x - 250) * 0.52
            elif x <= 140:
                cy = 53 - (x - 46) * 0.564
            else:
                cy = -99
            crown = 0 <= y - cy <= 4 and l < 0.62                          # 천장 몰딩(어두운 띠)
            if cap or crown:
                out[y, x, :3] = pink(l)
    return out


# ── 액자 속 비우기 ──
def hollow(img, b=4):
    a = img.copy()
    op = a[:, :, 3] > 0
    H, W = op.shape
    runs = []
    for x in range(W):                     # 세로줄마다 가장 긴 불투명 줄 = 액자 몸통(위 걸이 줄은 빼고)
        best, cur, start = (0, -1, -1), 0, None
        for y in range(H + 1):
            if y < H and op[y, x]:
                if start is None:
                    start = y
            elif start is not None:
                if y - start > best[0]:
                    best = (y - start, start, y - 1)
                start = None
        runs.append(best)
    cols = [x for x in range(W) if runs[x][0] > 2 * b + 2]
    x0, x1 = min(cols), max(cols)
    n = 0
    for x in range(x0 + b, x1 - b + 1):
        _, top, bot = runs[x]
        for y in range(top + b, bot - b + 1):
            a[y, x] = (0, 0, 0, 1)         # 알파 1 = 그려 넣을 칸
            n += 1
    return a, n


def main():
    os.makedirs(OUT, exist_ok=True)
    load = lambda n: np.asarray(Image.open(os.path.join(OUT, n + ".png")).convert("RGBA"))
    save("carrot_plush", carrot_plush())
    save("lamp_stand", lamp_stand())
    # 응가 봉투 걸이는 11/23 밤 받은 디스펜서 그림(bag_dispenser)으로 바꿔 poopbag_holder()는 더 내보내지 않는다
    save("keyhook_rail", keyhook_rail())
    save("picnic_mat", picnic_mat())
    save("paw", paw())
    save("acc_ribbon", acc_ribbon())
    save("acc_cap", acc_cap())
    save("acc_crown", acc_crown())
    save("flag_stand", flag_stand())
    room = load("room")
    save("room_lilac", remap(room, room_lilac))
    save("room_night", night_accents(room, remap(room, room_night)))
    for src, dst in (("frame_gold", "frame_photo"), ("frame_dog", "frame_pal")):
        a, n = hollow(load(src))
        save(dst, a)
        print(f"  {dst}: 그려 넣을 칸 {n}점")


if __name__ == "__main__":
    main()
