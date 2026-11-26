# 아지트 고해상도 시안용 소품 자르기(2026-11-25 가르시아 "아지트 도트 퀄리티가 첨부한 이미지보다 낮은 게 우려돼" → Claude 제안
# "방을 3배 넘게 촘촘히(원본 그대로)" → "시안부터 만들어 줘").
#
# 지금 앱은 방 한 점에 맞춰 소품을 1/3~1/10로 줄여 쓴다(azit-redo-items.py). 시안은 원본에서 오려서 크게 둔다:
#   방 한 점 = 원본 방 그림(sian-ref/azit-room-cream.webp, 2752×1536)의 4.5픽셀(바닥 한 칸 = 9픽셀 — 그 그림의 바닥이 우리 방 바닥 칸
#   (101×86칸)과 거의 같은 크기가 되는 값). 소품 크기는 지금 앱 그림(icons/azit-room) 크기 × 4.5 — 자리·비율은 앱과 같다.
#   색을 줄이지 않고 곱게 줄인다(가장자리 반투명 — 바탕과 자연스럽게).
# 원본이 있는 18개(받은 시트 셋·조명·엽서) + 11/25 다시 받은 기본 방 소품 4개(화분·밥그릇·뼈다귀·공 — azit-hq-items.py가 오리고
# 앱 그림과 좌우를 맞춰 둔 고화질판 icons/azit-hq에서, 11/26 가르시아 "고화질판으로").
# 쓰는 법(pip pillow numpy opencv-python-headless): python3 _dev/azit-hd-cut.py [sian-ref/azit-redo] [sian-ref/azit-hd/items]
import importlib.util, os, sys
import numpy as np
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "sian-ref/azit-redo"
OUT = sys.argv[2] if len(sys.argv) > 2 else "sian-ref/azit-hd/items"
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
FROM_HQ = ["plant_pot", "feeder_wood_2bowl", "toy_bone", "ball_yellow"]   # icons/azit-hq에서(시안에서 "원본 없는 소품"이던 것)
HQ = os.path.join(os.path.dirname(__file__), "..", "icons", "azit-hq")


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
    for name in FROM_HQ:   # 이미 오려 둔 투명 바탕 그림 — 같은 크기 규칙(앱 그림 높이 × 4.5)으로 곱게 줄이기만
        im = np.asarray(Image.open(os.path.join(HQ, name + ".webp")).convert("RGBA"))
        finish(im[..., :3], im[..., 3] > 0, name)


if __name__ == "__main__":
    main()
