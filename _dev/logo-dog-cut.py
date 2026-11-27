# 로고 강아지(리드줄 문 치와와) 네 가지를 투명 바탕으로 오리고 색을 맞춘다 (2026-11-27)
# 가르시아 "첫번째에선 가장 왼쪽이 어울리고 두번째는 화난 버전, 색감은 조절해서 맞춰서 — 로고 강아지 총 4가지 버전"
#   src/three-poses.webp(신나서 선 · 앉은 · 엎드려 노는 셋) + src/angry.webp(화난) → 받은 그대로 보관
#   1) 바탕: 가장자리에서 바탕색과 가까운 점을 채워 나가며 지움(진한 테두리에서 멈춤 — 바닥 그림자도 같이) → 가장 큰 덩어리만(움직임 표시·하트·Gemini ✦ 빼기)
#   2) 색: 화난 버전의 털·리드줄 색을 신나서 선 버전(대표)에 맞춤 — 몸 점들의 Lab 평균·퍼짐을 옮김(테두리 어두운 점은 그대로)
#   3) 앱 아이콘용: 대표의 머리 + 리드줄만 크게 자른 정사각 판
# 나온 것: brand/logo-dog-2026-11-27/dog-{stand,sit,play,angry}.png, icon-face.png, 미리 보기 preview.png
# 쓰는 법(pip pillow numpy scipy opencv-python-headless): python3 _dev/logo-dog-cut.py
import os, numpy as np, cv2
from PIL import Image
from scipy import ndimage
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "brand", "logo-dog-2026-11-27")

def cut(rgb, tol=26):
    h, w = rgb.shape[:2]
    bg = np.median(np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3), rgb[:, :8].reshape(-1, 3), rgb[:, -8:].reshape(-1, 3)]), 0)
    near = np.abs(rgb.astype(int) - bg).sum(-1) < tol * 3
    # 바닥 그림자(바탕보다 조금 어두운 베이지)도 바탕으로
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(int); bgl = cv2.cvtColor(bg.reshape(1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2LAB)[0, 0].astype(int)
    shadow = (np.abs(lab[..., 1] - bgl[1]) < 8) & (np.abs(lab[..., 2] - bgl[2]) < 14) & (lab[..., 0] > bgl[0] - 40)
    cand = near | shadow
    l, _ = ndimage.label(cand)
    edge = np.unique(np.concatenate([l[0], l[-1], l[:, 0], l[:, -1]])); edge = edge[edge > 0]
    back = np.isin(l, edge)
    fg = ~back
    l2, n = ndimage.label(fg)
    sz = ndimage.sum(np.ones_like(l2), l2, range(1, n + 1))
    keep = l2 == 1 + int(np.argmax(sz))
    keep = ndimage.binary_fill_holes(keep)
    a = keep.astype(np.float32)
    a = cv2.GaussianBlur(a, (3, 3), 0.7)                       # 가장자리 한 점만 부드럽게
    out = np.dstack([rgb, (a * 255).astype(np.uint8)])
    ys, xs = np.nonzero(keep)
    pad = 6
    return out[max(0, ys.min() - pad):ys.max() + pad, max(0, xs.min() - pad):xs.max() + pad]

def body_stats(img):
    m = (img[..., 3] > 200)
    lab = cv2.cvtColor(img[..., :3], cv2.COLOR_RGB2LAB).astype(float)
    m &= lab[..., 0] > 90                                        # 테두리(어두운 갈색) 빼고 털·리드줄
    return lab, m, lab[m].mean(0), lab[m].std(0)

def match(src, ref):
    lab, m, mu, sd = body_stats(src)
    _, _, mu2, sd2 = body_stats(ref)
    k = np.clip(sd2 / np.maximum(sd, 1e-3), 0.85, 1.15)
    new = (lab - mu) * k + mu2
    out = lab.copy(); out[m] = new[m]
    rgb = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)
    return np.dstack([rgb, src[..., 3]])

def main():
    sheet = np.asarray(Image.open(os.path.join(D, "src", "three-poses.webp")).convert("RGB"))
    W = sheet.shape[1]
    sheet = sheet.copy(); sheet[:235, :82] = sheet[5, 5]                 # 왼쪽 강아지 귀 옆 움직임 표시("놀람" 선)는 귀에 닿아 있어 미리 지움
    parts = {"stand": sheet[:, :int(W * 0.34)], "sit": sheet[:, int(W * 0.34):int(W * 0.645)], "play": sheet[:, int(W * 0.645):]}
    dogs = {k: cut(v) for k, v in parts.items()}
    angry = cut(np.asarray(Image.open(os.path.join(D, "src", "angry.webp")).convert("RGB")), tol=22)
    dogs["angry"] = match(angry, dogs["stand"])
    for k, v in dogs.items():
        Image.fromarray(v).save(os.path.join(D, "dog-%s.png" % k), optimize=True)
        print(k, v.shape[1], "x", v.shape[0])
    # 앱 아이콘용 — 대표(선) 위쪽 머리 + 리드줄, 정사각
    s = dogs["stand"]; h, w = s.shape[:2]
    top = s[:int(h * 0.66)]                                              # 머리 + 물고 있는 리드줄
    th, tw = top.shape[:2]; side = max(th, tw) + 16
    face = np.zeros((side, side, 4), np.uint8)
    face[(side - th) // 2:(side - th) // 2 + th, (side - tw) // 2:(side - tw) // 2 + tw] = top
    Image.fromarray(face).save(os.path.join(D, "icon-face.png"), optimize=True)
    # 미리 보기
    tiles = [Image.fromarray(dogs[k]) for k in ("stand", "sit", "play", "angry")] + [Image.fromarray(face)]
    H = 300; tiles = [t.resize((int(t.width * H / t.height), H), Image.LANCZOS) for t in tiles]
    pv = Image.new("RGBA", (sum(t.width for t in tiles) + 20 * (len(tiles) + 1), H + 40), (255, 253, 253, 255)); x = 20
    for t in tiles: pv.alpha_composite(t, (x, 20)); x += t.width + 20
    pv.save(os.path.join(D, "preview.png"))

if __name__ == "__main__":
    main()
