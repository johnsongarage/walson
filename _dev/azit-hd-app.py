# [아지트] 고해상도 — 앱에 쓰는 그림 재료 만들기 (2026-11-26)
#
# 가르시아 "고해상도 시안을 적용해줘" → "실제 [아지트]에 적용"(hq DECISIONS 11/26). 시안(azit-hd-sian.html)과 같은 방 그림·소품 원본을
# 앱 주소(icons/azit-hd)로 옮기고, 원본이 없는 것은 크림 방에서 만든다:
#   1) 방: 받은 크림 방(sian-ref/azit-hd/room.webp, 원본 x 400부터 1930×1536 — 방 한 점 = 4.5픽셀) → room.webp(크림 발바닥 = jelly)
#   2) 벽지 셋(라일락·밤 블랙 핑크·분홍): 원본이 없어 크림 방의 벽(벽지·판벽·벽 윗면)만 색을 바꾼다 — 창·커튼·선반 나무·문은 그대로.
#      밤은 바닥도 보랏빛 어두운 나무로(예전 점 방 room_night과 같은 결, _dev/azit-extra.py room_night). 원본을 받으면 바꾼다
#   3) 방마다 1x 미리보기(방 한 점 = 1픽셀) — 큰 그림을 받는 동안 흐리게 먼저 보인다
#   4) 밤 창: 창유리(하늘·구름·나무)만 밤하늘로 바꾼 덧그림 window_night.webp(+ 자리 WIN_BOX, 방 한 점 단위)
#   5) 소품 원본 33개: sian-ref/azit-hd/items 그대로 복사(받은 시트 18 + 11/25 기본 방 12 + 트로피·가랜드 + 켜진 조명)
#      트로피·가랜드는 앱 방 그림(1x)도 시안용(items-1x)으로 — 트로피는 붙박이 선반 위, 가랜드는 창 위
#   6) 우리 개 사진 액자·단짝 액자: 금색 액자·강아지 초상화 원본에서 속 그림 칸을 투명하게(azit-hq-items.py canvas_of와 같은 색 규칙)
#
# 쓰는 법(pip pillow numpy opencv-python-headless): python3 _dev/azit-hd-app.py
import os, sys, shutil, importlib.util
import numpy as np
from PIL import Image
from scipy import ndimage

here = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(here, "..")
HD_SRC = os.path.join(ROOT, "sian-ref", "azit-hd")
OUT = os.path.join(ROOT, "icons", "azit-hd")
ROOM1X = os.path.join(ROOT, "icons", "azit-room")
S = 4.5   # 방 한 점 = 원본 4.5픽셀

# ── 방 그림 좌표(room.webp 픽셀) ──
CXP, CY = 979, 736                      # 두 벽 모서리 바닥(원본 1379 − 400)
SR, SL = 0.398, 0.4325                  # 오른쪽·왼쪽 벽 바닥 줄 기울기
BG = (212, 195, 176)                    # 방 바깥 바탕
WIN_PARTS = [[(1372, 280), (1796, 452), (1796, 480), (1372, 306)],   # 커튼 봉(양 끝 손잡이까지)
             [(1394, 292), (1481, 328), (1481, 717), (1394, 692)],   # 왼쪽 커튼
             [(1474, 326), (1694, 416), (1694, 764), (1474, 694)],   # 창틀·유리·창턱
             [(1689, 436), (1775, 472), (1775, 822), (1689, 804)]]   # 오른쪽 커튼(아래 벽에 진 커튼 그림자는 벽과 같이 칠함)
SHELF_QUADS = [[(985, 268), (1072, 266), (1322, 370), (1322, 470), (985, 376)],   # 붙박이 선반 둘(나무만 뺀다 — 벽에 진 그림자는 같이 칠함)
               [(985, 396), (1072, 392), (1322, 494), (1322, 592), (985, 502)]]
DOOR = [(158, 1082), (158, 790), (198, 734), (270, 710), (346, 734), (378, 790), (378, 1002)]   # 왼쪽 벽 문
GLASS_BOX = (1470, 350, 1700, 760)      # 창유리를 찾는 칸(창틀 안)


def poly_mask(h, w, pts):
    ys, xs = np.mgrid[0:h, 0:w]
    ok = np.ones((h, w), bool)
    n = len(pts)
    for k in range(n):   # 볼록 다각형(시계 방향) — 모든 변의 같은 쪽
        x1, y1 = pts[k]; x2, y2 = pts[(k + 1) % n]
        ok &= (x2 - x1) * (ys - y1) - (y2 - y1) * (xs - x1) >= 0
    return ok


def hls(img):
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    mx, mn = img.max(-1), img.min(-1)
    L = (mx + mn) / 2; d = mx - mn
    Sx = np.where(d == 0, 0, d / np.where(L < 0.5, mx + mn + 1e-9, 2 - mx - mn + 1e-9))
    h = np.zeros_like(L); m = d > 1e-6
    rr = (mx == r) & m; gg = (mx == g) & m & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6; h[gg] = (b - r)[gg] / d[gg] + 2; h[bb] = (r - g)[bb] / d[bb] + 4
    return h * 60, L, Sx


def rgb_of(h, l, s):
    def f(n):
        k = (n + h / 30) % 12
        a = s * np.minimum(l, 1 - l)
        return l - a * np.maximum(-1, np.minimum(np.minimum(k - 3, 9 - k), 1))
    return np.stack([f(0), f(8), f(4)], -1)


def regions(img):
    """벽(칠할 곳) · 바닥 · 그 밖 — 방 그림 좌표로"""
    H, W = img.shape[:2]
    ys, xs = np.mgrid[0:H, 0:W]
    floor_y = np.where(xs >= CXP, CY + SR * (xs - CXP), CY + SL * (CXP - xs))
    near = np.abs(img * 255 - np.array(BG)).sum(-1) < 14      # 판벽 속 칸도 바탕과 거의 같은 색이라 — 그림 가장자리에 닿은 덩어리만 바탕
    lab, _ = ndimage.label(near)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0])
    wall = (ys < floor_y - 2) & ~bg
    floor = (ys >= floor_y - 2) & ~bg
    _, L, _ = hls(img)
    chroma = img.max(-1) - img.min(-1)                       # 나무·문은 색이 진하고(채도 대신 — 밝은 크림도 채도는 높게 나와서) 테두리는 어둡다
    woody = (chroma > 0.25) | (L < 0.36)                     # 벽에 진 그림자(채도 0.18쯤)는 벽으로
    keep = np.zeros((H, W), bool)
    for k, q in enumerate(WIN_PARTS):
        m = poly_mask(H, W, q)
        if k != 2:   # 봉·커튼 칸 둘레에 걸린 맨 벽은 칠한다(커튼은 더 누렇다 — 파랑 192~206). 창유리 칸은 그대로(흰 구름이 벽처럼 보여서)
            px = img * 255
            m &= ~((px[..., 2] >= 210) & (px[..., 0] - px[..., 2] <= 26) & (chroma < 0.12))
        keep |= m
    keep |= (poly_mask(H, W, SHELF_QUADS[0]) | poly_mask(H, W, SHELF_QUADS[1]) | poly_mask(H, W, DOOR)) & woody   # 선반·문 나무(벽에 진 그림자는 칠함)
    return wall & ~keep, floor


def theme_room(img, name):
    wall, floor = regions(img)
    h, L, Sx = hls(img)
    out = img.copy()
    Lw, Sw = L[wall], Sx[wall]
    if name == "lilac":
        out[wall] = rgb_of(np.full_like(Lw, 272), np.clip(Lw - 0.01, 0, 1), np.clip(0.22 + Sw * 0.75, 0, 0.62))
    elif name == "pink":
        out[wall] = rgb_of(np.full_like(Lw, 350), np.clip(Lw - 0.03, 0, 1), np.clip(0.42 + Sw * 0.8, 0, 0.9))
    elif name == "night":
        out[wall] = rgb_of(np.full_like(Lw, 305), np.clip(0.10 + (Lw - 0.5) * 0.48, 0.04, 0.36), np.full_like(Lw, 0.24))
        Lf, Sf = L[floor], Sx[floor]
        out[floor] = rgb_of(np.full_like(Lf, 282), 0.07 + Lf * 0.27, np.clip(0.14 + Sf * 0.08, 0, 1))
    return out


def night_window(img):
    """창유리(하늘·구름·나무·풀)만 밤으로 — 밤하늘 남색 + 어두운 숲 + 달·별. 유리 밖은 투명"""
    x0, y0, x1, y1 = GLASS_BOX
    c = img[y0:y1, x0:x1].copy()
    h, L, Sx = hls(c)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    sky = ((b > r + 0.08) & (b >= g - 0.02)) | ((L > 0.86) & (Sx < 0.5) & (b >= r - 0.01))   # 하늘·구름
    green = (g > r + 0.03) & (g >= b - 0.08) & ~sky                                          # 나무·풀
    glass = ndimage.binary_fill_holes(ndimage.binary_closing(sky | green, iterations=2))      # 구름 가장자리까지 유리 칸 전체(창틀은 빠짐)
    sky = glass & ~green
    out = np.zeros(c.shape[:2] + (4,), float)
    hh = c.shape[0]
    t = (np.arange(hh)[:, None] / hh) * np.ones(c.shape[:2])
    nav = np.stack([0.10 + 0.10 * t, 0.12 + 0.12 * t, 0.30 + 0.16 * t], -1)              # 위가 짙은 밤하늘
    cloud = np.clip((L - 0.82) / 0.18, 0, 1)[..., None] * 0.12                             # 구름은 살짝 밝게
    out[..., :3] = np.where(sky[..., None], nav + cloud, 0)
    tree = rgb_of(np.full_like(L, 200), 0.06 + L * 0.18, np.full_like(L, 0.35))
    out[..., :3] = np.where(green[..., None], tree, out[..., :3])
    out[..., 3] = glass
    rng = np.random.default_rng(7)                                                         # 별(하늘에만, 늘 같은 자리)
    for _ in range(26):
        yy, xx = rng.integers(0, hh // 2), rng.integers(0, c.shape[1])
        if sky[yy, xx]:
            out[max(0, yy - 1):yy + 2, max(0, xx - 1):xx + 2, :3] = [1.0, 0.95, 0.8]
    mx_, my_ = int(c.shape[1] * 0.70), int(hh * 0.18)                                      # 달(오른쪽 창 위쪽)
    yy, xx = np.mgrid[0:hh, 0:c.shape[1]]
    moon = ((xx - mx_) ** 2 + (yy - my_) ** 2 <= 15 ** 2) & ~(((xx - mx_ - 7) ** 2 + (yy - my_ + 4) ** 2) <= 13 ** 2) & sky
    out[moon, :3] = [1.0, 0.93, 0.66]
    return out, (x0 / S, y0 / S, (x1 - x0) / S, (y1 - y0) / S)


def save_webp(arr, path, q=88, alpha=False):
    a = (np.clip(arr, 0, 1) * 255).astype(np.uint8)
    im = Image.fromarray(a, "RGBA" if alpha else "RGB")
    im.save(path, "WEBP", quality=q, method=6)
    return im


def hollow_frames():
    """금색 액자 → 우리 개 사진 액자 · 강아지 초상화 → 단짝 액자: 속 그림 칸 투명(azit-hq-items.py의 canvas_of)"""
    spec = importlib.util.spec_from_file_location("hq", os.path.join(here, "azit-hq-items.py"))
    hq = importlib.util.module_from_spec(spec)
    keep = sys.argv; sys.argv = [sys.argv[0]]; spec.loader.exec_module(hq); sys.argv = keep
    for src, dst in (("frame_gold", "frame_photo"), ("frame_dog", "frame_pal")):
        im = np.asarray(Image.open(os.path.join(HD_SRC, "items", src + ".webp")).convert("RGBA")).copy()
        m = hq.canvas_of(im, src)
        im[m, 3] = 0
        Image.fromarray(im).save(os.path.join(OUT, dst + ".webp"), "WEBP", quality=92, method=6)
        print(f"  {dst}: 속 칸 {int(m.sum())}픽셀 투명")


def main():
    os.makedirs(OUT, exist_ok=True)
    img = np.asarray(Image.open(os.path.join(HD_SRC, "room.webp")).convert("RGB")).astype(float) / 255
    for name in ("jelly", "lilac", "night", "pink"):
        arr = img if name == "jelly" else theme_room(img, name)
        fn = "room" if name == "jelly" else "room_" + name
        im = save_webp(arr, os.path.join(OUT, fn + ".webp"))
        one = im.resize((round(im.width / S), round(im.height / S)), Image.LANCZOS)
        one.save(os.path.join(OUT, fn + "-1x.webp"), "WEBP", quality=85, method=6)
        print(f"  {fn}: {im.width}×{im.height} · {os.path.getsize(os.path.join(OUT, fn + '.webp')) // 1024}KB")
    win, box = night_window(img)
    save_webp(win, os.path.join(OUT, "window_night.webp"), q=90, alpha=True)
    print("  window_night: 자리(방 점) x %.2f y %.2f w %.2f h %.2f" % box)
    for f in sorted(os.listdir(os.path.join(HD_SRC, "items"))):
        if f.endswith(".webp"):
            shutil.copyfile(os.path.join(HD_SRC, "items", f), os.path.join(OUT, f))
    for f in ("trophy.png", "garland_R.png"):
        shutil.copyfile(os.path.join(HD_SRC, "items-1x", f), os.path.join(ROOM1X, f))
    print("  소품", len([f for f in os.listdir(os.path.join(HD_SRC, "items")) if f.endswith('.webp')]), "개 복사 · 트로피·가랜드 방 그림(1x)")
    hollow_frames()


if __name__ == "__main__":
    main()
