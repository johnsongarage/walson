# 새 로고(리드줄 문 치와와 얼굴, 2026-11-27 가르시아 "세번째꺼 로고로" → "그렇게 해줘") — 앱 아이콘·walson-logo.webp 만들기
#   원본: brand/logo-dog-2026-11-27/src/head.webp(2000×2000, 받은 그대로)
#   1) Gemini ✦ 표시(오른쪽 아래)를 바탕색으로 덮음
#   2) 투명 판: 가장자리에서 바탕색과 아주 가까운 점만 채워 나가며 지움(가슴 크림은 바탕보다 노래서 남음) → 가장 큰 덩어리
#      + 목 아래(선 없이 흐려지는 곳)는 아래로 갈수록 스르르 투명하게. 놀람 표시(!)는 떨어진 조각이라 빠짐
#   3) walson-logo.webp: 예전과 같은 900×732 칸(화면들이 width·height를 이 비율로 적어 둠)에 가운데 맞춤
#   4) 아이콘: 크림 바탕(#fff6e2 — 예전 아이콘 바탕) 위에 얼굴 쪽으로 당겨 자른 그림 — 192·512(둥근 모서리 없이 꽉), maskable 512(가운데 80% 안전 칸), apple 180
# 쓰는 법(pip pillow numpy scipy): python3 _dev/logo-head.py
import os, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(R, "brand/logo-dog-2026-11-27/src/head.webp")
CREAM = (255, 246, 226)

def main():
    im = np.asarray(Image.open(SRC).convert("RGB")).copy()
    bg = np.median(np.concatenate([im[:20].reshape(-1, 3), im[:, :20].reshape(-1, 3)]), 0)
    im[1820:, 1780:] = bg                                              # ✦ 표시
    full = Image.fromarray(im)
    d = np.abs(im.astype(int) - bg).sum(-1)
    lab, _ = ndimage.label(d < 15)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); edge = edge[edge > 0]
    fg = ~np.isin(lab, edge)
    l2, n = ndimage.label(fg)
    sz = ndimage.sum(np.ones_like(l2), l2, range(1, n + 1))
    fg = ndimage.binary_fill_holes(l2 == 1 + int(np.argmax(sz)))
    a = np.asarray(Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(float) / 255
    ys = np.arange(im.shape[0])[:, None] * np.ones((1, im.shape[1]))
    a *= np.clip((1640 - ys) / 140, 0, 1) ** 0.8 * (ys > 1300) + (ys <= 1300)   # 목 아래 스르르
    rgba = np.dstack([im, (a * 255).astype(np.uint8)])
    yy, xx = np.nonzero(a > 0.05)
    cut = Image.fromarray(rgba).crop((xx.min() - 10, yy.min() - 10, xx.max() + 10, yy.max() + 10))
    os.makedirs(os.path.join(R, "brand/logo-dog-2026-11-27"), exist_ok=True)
    cut.save(os.path.join(R, "brand/logo-dog-2026-11-27/logo-head.png"), optimize=True)
    # walson-logo.webp — 900×732 칸
    W, H = 900, 732
    k = min(W / cut.width, H / cut.height)
    c2 = cut.resize((round(cut.width * k), round(cut.height * k)), Image.LANCZOS)
    logo = Image.new("RGBA", (W, H), (0, 0, 0, 0)); logo.alpha_composite(c2, ((W - c2.width) // 2, H - c2.height))
    logo.save(os.path.join(R, "icons/walson-logo.webp"), "WEBP", quality=92, method=6)
    # 아이콘 — 얼굴 쪽으로 당겨 자름(놀람 표시는 빠진 투명 판 기준)
    face = full.crop((200, 120, 1840, 1760))
    fa = Image.fromarray(rgba).crop((200, 120, 1840, 1760))
    def icon(size, safe=1.0):
        bgim = Image.new("RGBA", (size, size), CREAM + (255,))
        s = round(size * safe)
        f = fa.resize((s, s), Image.LANCZOS)
        bgim.alpha_composite(f, ((size - s) // 2, size - s if safe == 1.0 else (size - s) // 2))
        return bgim
    icon(192).save(os.path.join(R, "icons/icon-192.png"), optimize=True)
    icon(512).save(os.path.join(R, "icons/icon-512.png"), optimize=True)
    icon(512, 0.8).save(os.path.join(R, "icons/icon-maskable-512.png"), optimize=True)
    icon(180).convert("RGB").save(os.path.join(R, "icons/apple-touch-icon.png"), optimize=True)
    print("logo", cut.size, "-> walson-logo.webp 900x732 · icons 192/512/maskable/apple")

if __name__ == "__main__":
    main()
