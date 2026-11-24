# 아지트 소품 다시 그리기(2026-11-24 가르시아 — Claude가 "줄이다가 뭉개진 것·화풍이 다른 것" 11개를 골라 이미지로 보여 줌 →
# 가르시아가 새로 받은 그림 셋: 소품 시트(9개 + 액자·단순 조명은 안 씀), 격자무늬 갓 스탠드 꺼짐·켜짐 한 장, 종이 엽서 한 장).
# 받은 그림은 sian-ref/azit-redo/(원본 그대로 보관 — 나중에 화질을 올릴 때 다시 씀).
#
# 하는 일: 흰 바탕(가장자리에 닿은 흰 점·회색 그림자)을 지우고 → 소품마다 색을 24가지로 모은 뒤 →
# azit-fit.py의 downscale(새 점이 덮는 원래 점들의 색 투표 + 어두운 테두리 가중 + 한 점 테두리 다시 두르기)로 방 크기로 줄인다.
# 방 크기(점) = 예전 소품 자리·크기에 맞춤(벽 소품은 그려진 벽 방향이 예전과 같다 — face 그대로).
# 켜진 조명은 둘레 빛 번짐이 흰 바탕에 섞여 오려 낼 수 없어서, 꺼진 조명의 모양(알파)을 그대로 써서 몸통만 오린다.
# 빛은 앱이 그린다(azit.html lampGlow).
#
# 쓰는 법(pip pillow numpy opencv-python-headless): python3 _dev/azit-redo-items.py [sian-ref/azit-redo] [icons/azit-room]
import importlib.util, os, sys
import numpy as np
import cv2
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "sian-ref/azit-redo"
OUT = sys.argv[2] if len(sys.argv) > 2 else "icons/azit-room"
spec = importlib.util.spec_from_file_location("azfit", os.path.join(os.path.dirname(__file__), "azit-fit.py"))
azfit = importlib.util.module_from_spec(spec); spec.loader.exec_module(azfit)

# 소품 시트 — 왼쪽 위부터 줄마다(가운데 높이가 가까운 것끼리 한 줄, 줄 안은 왼쪽 → 오른쪽). None = 안 씀
SHEET = ["neon_chihuahua", "bag_dispenser", "leash_hook",
         "grooming_basket", "cafe_cup", None,            # 셋째(나무 액자 그림)는 엽서가 아니라서 — 엽서는 따로 받은 종이 엽서
         "carrot_plush", "keyhook_rail", "flag_stand",
         None, "picnic_mat"]                            # 단순 조명은 따로 받은 격자무늬 갓 조명으로
CLOSE = {"grooming_basket": 9, "cafe_cup": 7, "postcard_paw": 9}   # 흰 부분이 바탕에 닿아 있는 것
# 방 크기 — ('h', 높이) 또는 ('w', 폭), 점
SIZE = {"neon_chihuahua": ("h", 38), "bag_dispenser": ("w", 26), "leash_hook": ("h", 44), "grooming_basket": ("w", 30),
        "cafe_cup": ("h", 25), "carrot_plush": ("h", 24), "keyhook_rail": ("w", 30), "flag_stand": ("h", 47),
        "picnic_mat": ("w", 100), "lamp_stand": ("h", 51), "postcard_paw": ("h", 26)}


def comps(rgb, min_area=3000):
    fg = (rgb.min(axis=2) < 225).astype(np.uint8)
    fg = cv2.dilate(fg, np.ones((15, 15), np.uint8))
    k, lab, st, cen = cv2.connectedComponentsWithStats(fg, 8)
    cs = [(st[i][:4].tolist(), cen[i]) for i in range(1, k) if st[i][4] > min_area]
    cs.sort(key=lambda c: (round(c[1][1] / 300), c[1][0]))
    return [c[0] for c in cs]


def cut(rgb, box, pad=6, close=0):
    x, y, w, h = box
    x0, y0 = max(0, x - pad), max(0, y - pad)
    x1, y1 = min(rgb.shape[1], x + w + pad), min(rgb.shape[0], y + h + pad)
    c = rgb[y0:y1, x0:x1]
    # 바탕 = 가장자리에 닿은 "흰 점 또는 옅은 회색 그림자" 덩어리
    mn, mx = c.min(axis=2).astype(int), c.max(axis=2).astype(int)
    lum = c.astype(int).mean(axis=2)
    bgish = ((mn >= 234) | (((mx - mn) < 16) & (lum > 120) & (lum < 226))).astype(np.uint8)   # 흰 바탕 · 회색 그림자(크림 종이처럼 아주 밝은 건 그림자 아님)
    # 그림 안의 흰 부분(빗·가위·종이)이 바탕과 이어져 지워지지 않게, 그림 쪽을 닫기(CLOSE)로 틈을 막은 뒤 바깥만 바탕으로
    fg = (1 - bgish).astype(np.uint8)
    if close:   # 걸이처럼 줄 사이가 비어야 하는 것은 닫지 않는다(CLOSE에 든 것만)
        fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((close, close), np.uint8))
    out = (1 - fg).astype(np.uint8)
    k, lab = cv2.connectedComponents(out, connectivity=4)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge)) & (out == 1)
    a = (~bg).astype(np.uint8)
    a = cv2.morphologyEx(a, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))   # 바탕 가장자리 부스러기
    return c, a, (x0, y0)


def quantize(c, a, n=24):
    im = Image.fromarray(c)
    q = np.asarray(im.quantize(colors=n, method=Image.Quantize.MEDIANCUT).convert("RGB"))
    out = np.zeros(c.shape[:2] + (4,), np.uint8)
    out[..., :3] = q
    out[..., 3] = a * 255
    return out


def fit(img, name):
    ys, xs = np.nonzero(img[..., 3])
    img = img[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    kind, n = SIZE[name]
    f = n / (img.shape[0] if kind == "h" else img.shape[1])
    return azfit.downscale(img, f)


def outline(arr):
    # 다른 소품처럼 한 점 진한 테두리 — 받은 그림은 테두리가 옅어서 줄이면 사라진다. 테두리 점을 그 색의 어두운 판(0.45배)으로
    a = arr[..., 3] > 0
    e = azfit.edge_of(a)
    out = arr.copy()
    lum = azfit.luma(arr[..., :3])
    fix = e & (lum > 70)
    out[fix, :3] = (arr[fix, :3].astype(float) * 0.45).astype(np.uint8)
    return out


def save(name, arr):
    arr = outline(arr)
    Image.fromarray(arr).save(os.path.join(OUT, name + ".png"), optimize=True)
    print(f"  {name}: {arr.shape[1]}×{arr.shape[0]}")


def main():
    sheet = np.asarray(Image.open(os.path.join(SRC, "sheet.webp")).convert("RGB"))
    boxes = comps(sheet)
    assert len(boxes) == len(SHEET), f"시트 소품 수가 다름: {len(boxes)}"
    for name, box in zip(SHEET, boxes):
        if not name:
            continue
        c, a, _ = cut(sheet, box, close=CLOSE.get(name, 0))
        save(name, fit(quantize(c, a), name))

    # 조명: 왼쪽 = 꺼짐, 오른쪽 = 켜짐. 켜진 쪽은 꺼진 쪽 모양(알파)을 같은 자리에 씌워 몸통만
    lamp = np.asarray(Image.open(os.path.join(SRC, "lamp.webp")).convert("RGB"))
    lb = comps(lamp)
    lb.sort(key=lambda b: b[0])
    off_c, off_a, (ox, oy) = cut(lamp, lb[0])
    # 켜진 조명 자리 = 꺼진 조명과 기둥(가장 어두운 세로줄)이 맞도록 가로로 옮긴 같은 크기 칸
    def pole_x(img, x0, x1):
        band = img[900:1300, x0:x1].astype(int).sum(axis=2)
        return x0 + int(np.argmin(band.mean(axis=0)))
    px_off = pole_x(lamp, lb[0][0], lb[0][0] + lb[0][2])
    px_on = pole_x(lamp, lb[1][0], lb[1][0] + lb[1][2])
    def base_y(img, x):   # 기둥 아래 받침의 맨 아래 줄(가장 어두운 갈색이 끝나는 곳)
        col = img[:, x - 40:x + 40].astype(int).sum(axis=2).min(axis=1)
        return int(np.nonzero(col < 300)[0].max())
    dx = px_on - px_off
    dy = base_y(lamp, px_on) - base_y(lamp, px_off)
    on_c = lamp[oy + dy:oy + dy + off_c.shape[0], ox + dx:ox + dx + off_c.shape[1]]
    pal_img = np.concatenate([off_c, on_c], axis=1)   # 두 장을 같은 색 24가지로 — 줄였을 때 모양이 같게
    q = np.asarray(Image.fromarray(pal_img).quantize(colors=32, method=Image.Quantize.MEDIANCUT).convert("RGB"))
    w = off_c.shape[1]
    for name, part in (("lamp_stand", q[:, :w]), ("lamp_stand_on", q[:, w:])):
        img = np.zeros(part.shape[:2] + (4,), np.uint8); img[..., :3] = part; img[..., 3] = off_a * 255
        SIZE["lamp_stand_on"] = SIZE["lamp_stand"]
        save(name, fit(img, name))

    post = np.asarray(Image.open(os.path.join(SRC, "postcard.webp")).convert("RGB"))
    pb = comps(post)
    c, a, _ = cut(post, max(pb, key=lambda b: b[2] * b[3]), close=CLOSE["postcard_paw"])
    save("postcard_paw", fit(quantize(c, a), "postcard_paw"))


if __name__ == "__main__":
    main()
