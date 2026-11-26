# 아지트 고해상도 시안용 소품 자르기(2026-11-25 가르시아 "아지트 도트 퀄리티가 첨부한 이미지보다 낮은 게 우려돼" → Claude 제안
# "방을 3배 넘게 촘촘히(원본 그대로)" → "시안부터 만들어 줘").
#
# 지금 앱은 방 한 점에 맞춰 소품을 1/3~1/10로 줄여 쓴다(azit-redo-items.py). 시안은 원본에서 오려서 크게 둔다:
#   방 한 점 = 원본 방 그림(sian-ref/azit-room-cream.webp, 2752×1536)의 4.5픽셀(바닥 한 칸 = 9픽셀 — 그 그림의 바닥이 우리 방 바닥 칸
#   (101×86칸)과 거의 같은 크기가 되는 값). 소품 크기는 지금 앱 그림(icons/azit-room) 크기 × 4.5 — 자리·비율은 앱과 같다.
#   색을 줄이지 않고 곱게 줄인다(가장자리 반투명 — 바탕과 자연스럽게).
# 원본이 있는 18개만(받은 시트 셋·조명·엽서). 나머지 약 50개는 원본이 저장소에 없다.
# 쓰는 법(pip pillow numpy opencv-python-headless): python3 _dev/azit-hd-cut.py [sian-ref/azit-redo] [sian-ref/azit-hd/items]
#   새 고화질판 둘(트로피·가랜드): python3 _dev/azit-hd-cut.py --hq
import importlib.util, os, sys
import numpy as np
from PIL import Image

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]   # --hq: 새 고화질판 둘(트로피·가랜드)만
SRC = ARGS[0] if len(ARGS) > 0 else "sian-ref/azit-redo"
OUT = ARGS[1] if len(ARGS) > 1 else "sian-ref/azit-hd/items"
S = 4.5   # 방 한 점 → 고해상도 픽셀
spec = importlib.util.spec_from_file_location("redo", os.path.join(os.path.dirname(__file__), "azit-redo-items.py"))
R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)
APP = os.path.join(os.path.dirname(__file__), "..", "icons", "azit-room")

# (시트 파일, 차례) — 시트 안 소품 차례는 azit-redo-items.py와 같다(왼쪽 위부터 줄마다)
WHERE = {
    "neon_chihuahua": ("sheet.webp", 0), "leash_hook": ("sheet.webp", 2), "cafe_cup": ("sheet.webp", 4),
    "carrot_plush": ("sheet.webp", 6), "keyhook_rail": ("sheet.webp", 7), "flag_stand": ("sheet.webp", 8), "picnic_mat": ("sheet.webp", 10),
    "pee_pad": ("sheet2.webp", 0), "bag_dispenser": ("sheet2.webp", 1), "pet_stairs": ("sheet2.webp", 2), "raincoat_rack": ("sheet2.webp", 5),
    "food_box": ("sheet2.webp", 6), "treat_jar": ("sheet2.webp", 7), "grooming_basket": ("sheet2.webp", 8), "donut_cushion": ("sheet2.webp", 9),
    "stroller": ("sheet3.jpg", 3),
}
CLOSE = {"grooming_basket": 9, "cafe_cup": 7, "treat_jar": 9, "food_box": 9, "pee_pad": 9, "postcard_paw": 9}
HOLES = {"stroller": 400}


def app_size(name):
    return Image.open(os.path.join(APP, name + ".png")).size


def finish(rgb, alpha, name, out=None):   # out: 내보낼 이름(크기 기준은 name의 앱 그림)
    a = alpha.astype(np.uint8) * 255
    im = Image.fromarray(np.dstack([rgb, a]), "RGBA")
    bb = im.getchannel("A").getbbox(); im = im.crop(bb)
    w1, h1 = app_size(name)
    th = max(1, round(h1 * S)); tw = max(1, round(im.width * th / im.height))
    im = im.convert("RGBa").resize((tw, th), Image.LANCZOS).convert("RGBA")   # 반투명 가장자리가 희게 번지지 않게(곱한 알파로 줄임)
    os.makedirs(OUT, exist_ok=True)
    im.save(os.path.join(OUT, (out or name) + ".webp"), "WEBP", quality=92, method=6)
    print(f"  {out or name}: {tw}×{th}  (앱 {w1}×{h1} × {S})")
    return im


def main():
    sheets = {}
    for name, (f, k) in WHERE.items():
        if f not in sheets:
            rgb = np.asarray(Image.open(os.path.join(SRC, f)).convert("RGB"))
            sheets[f] = (rgb, R.comps(rgb))
        rgb, boxes = sheets[f]
        c, a, _ = R.cut(rgb, boxes[k], close=CLOSE.get(name, 0), holes=HOLES.get(name, 0))
        finish(c, a, name)
    # 스탠드 꺼짐·켜짐(같은 모양으로 — 켜진 쪽 빛 번짐은 바탕에 섞여 있어 꺼진 쪽 알파로 몸통만)
    lamp = np.asarray(Image.open(os.path.join(SRC, "lamp.webp")).convert("RGB"))
    lb = sorted(R.comps(lamp), key=lambda b: b[0])
    off_c, off_a, (ox, oy) = R.cut(lamp, lb[0])
    def pole_x(img, x0, x1):
        band = img[900:1300, x0:x1].astype(int).sum(axis=2)
        return x0 + int(np.argmin(band.mean(axis=0)))
    def base_y(img, x):
        col = img[:, x - 40:x + 40].astype(int).sum(axis=2).min(axis=1)
        return int(np.nonzero(col < 300)[0].max())
    px0, px1 = pole_x(lamp, lb[0][0], lb[0][0] + lb[0][2]), pole_x(lamp, lb[1][0], lb[1][0] + lb[1][2])
    dx, dy = px1 - px0, base_y(lamp, px1) - base_y(lamp, px0)
    on_c = lamp[oy + dy:oy + dy + off_c.shape[0], ox + dx:ox + dx + off_c.shape[1]]
    finish(off_c, off_a, "lamp_stand")
    finish(on_c, off_a, "lamp_stand", "lamp_stand_on")   # 크기 기준은 꺼진 조명
    post = np.asarray(Image.open(os.path.join(SRC, "postcard.webp")).convert("RGB"))
    pb = R.comps(post)
    c, a, _ = R.cut(post, max(pb, key=lambda b: b[2] * b[3]), close=CLOSE["postcard_paw"])
    finish(c, a, "postcard_paw")


# ── 11/26 새로 받은 고화질판(icons/azit-hq, 다른 세션 _dev/azit-hq-items.py) 중 앱 방 그림과 모양이 다른 둘 ──
# 트로피: 새 그림엔 벽 선반이 없다 → 받은 방 그림의 붙박이 선반 위에 놓는다(키 32점).
# 가랜드: 모서리를 가로지르던 긴 줄이 아니라 짧은 반원(정면) → 오른쪽 벽 창 위에 걸게 벽 기울기(0.398)만큼 비스듬히 민다(폭 72점).
# 둘 다 "지금 앱" 보기용 방 점 그림(items-1x)도 같은 길(azit-hq-items.py to_room — 색 줄이기·테두리)로 만든다.
HQ_DIR = os.path.join(os.path.dirname(__file__), "..", "icons", "azit-hq")
SHEAR_R = 0.398   # 받은 방 그림 오른쪽 벽 바닥 줄 기울기


def hq_extra():
    spec2 = importlib.util.spec_from_file_location("hq", os.path.join(os.path.dirname(__file__), "azit-hq-items.py"))
    hq = importlib.util.module_from_spec(spec2)
    keep = sys.argv; sys.argv = [sys.argv[0]]; spec2.loader.exec_module(hq); sys.argv = keep
    out1 = os.path.join(os.path.dirname(OUT), "items-1x"); os.makedirs(out1, exist_ok=True)

    def save(full, name, pts_h=None, pts_w=None):   # full: 원본 크기 RGBA 배열 → 고화질판(×S) + 방 점 그림
        h0, w0 = full.shape[:2]
        f1 = (pts_h / h0) if pts_h else (pts_w / w0)          # 원본 → 방 점
        im = Image.fromarray(full)
        hd = im.convert("RGBa").resize((max(1, round(w0 * f1 * S)), max(1, round(h0 * f1 * S))), Image.LANCZOS).convert("RGBA")
        hd.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=92, method=6)
        one = Image.fromarray(hq.to_room(full, f1))
        one.save(os.path.join(out1, name + ".png"), optimize=True)
        print(f"  {name}: 고화질 {hd.width}×{hd.height} · 방 점 {one.width}×{one.height}")

    tro = np.asarray(Image.open(os.path.join(HQ_DIR, "trophy_shelf.webp")).convert("RGBA"))
    save(hq.crop_alpha(tro), "trophy", pts_h=32)
    gar = Image.open(os.path.join(HQ_DIR, "garland_bunting.webp")).convert("RGBA")
    w, h = gar.size
    al = np.asarray(gar)[..., 3] > 128
    xs = np.nonzero(al.any(axis=0))[0]
    end = (np.nonzero(al[:, xs[-1]])[0].min() - np.nonzero(al[:, xs[0]])[0].min()) / max(1, xs[-1] - xs[0])   # 그림 자체가 이미 기운 만큼(0.14)
    k = SHEAR_R - end   # 두 끝 고리가 벽을 따라 같은 높이가 되게 더 미는 만큼
    sh = gar.convert("RGBa").transform((w, int(np.ceil(h + k * w))), Image.AFFINE, (1, 0, 0, -k, 1, 0), resample=Image.BICUBIC).convert("RGBA")
    print(f"  가랜드 끝 기울기 {end:.3f} → {k:.3f}만큼 더 밂")
    save(hq.crop_alpha(np.asarray(sh)), "garland_R", pts_w=72)


if __name__ == "__main__":
    main() if "--hq" not in sys.argv else hq_extra()
