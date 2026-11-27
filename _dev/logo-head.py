# 새 로고(리드줄 문 치와와, 2026-11-27) — 앱 아이콘·walson-logo.webp 만들기
# 처음엔 얼굴 그림(head.webp, 아래 1)~4)) → 가르시아 "목줄 가리는 게 별로, 사슴 같아" → 신나서 선 전신(stand_cut)으로 바꿈. 얼굴 판 만드는 길은 아래 주석대로 남겨 둠
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

def stand_cut():
    """11/27 가르시아 "목줄 가리는 게 별로 · 사슴 같아" → 2000px 세 자세 그림의 '신나서 선' 전신(리드줄 고리까지 다 보임) — 귀 옆 놀람 표시만 지움(귀 끝은 남김)"""
    import importlib.util
    spec = importlib.util.spec_from_file_location("cut", os.path.join(R, "_dev/logo-dog-cut.py"))
    c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)
    sh = np.asarray(Image.open(os.path.join(R, "brand/logo-dog-2026-11-27/src/three-poses-2k.webp")).convert("RGB")).copy()
    sh[600:740, 30:151] = sh[10, 10]
    return Image.fromarray(c.cut(sh[:, :int(sh.shape[1] * 0.335)]))

def main():
    cut = stand_cut()
    cut.save(os.path.join(R, "brand/logo-dog-2026-11-27/logo-stand.png"), optimize=True)
    W, H = 900, 732                                                      # walson-logo.webp — 예전과 같은 칸, 가운데·아래 맞춤
    k = min(W / cut.width, H / cut.height)
    c2 = cut.resize((round(cut.width * k), round(cut.height * k)), Image.LANCZOS)
    logo = Image.new("RGBA", (W, H), (0, 0, 0, 0)); logo.alpha_composite(c2, ((W - c2.width) // 2, H - c2.height))
    logo.save(os.path.join(R, "icons/walson-logo.webp"), "WEBP", quality=92, method=6)
    def icon(size, fill):                                                # 크림 바탕 가운데에 전신(fill = 긴 변이 차지하는 비율)
        bgim = Image.new("RGBA", (size, size), CREAM + (255,))
        kk = size * fill / max(cut.size)
        f = cut.resize((round(cut.width * kk), round(cut.height * kk)), Image.LANCZOS)
        bgim.alpha_composite(f, ((size - f.width) // 2, (size - f.height) // 2))
        return bgim
    icon(192, 0.9).save(os.path.join(R, "icons/icon-192.png"), optimize=True)
    icon(512, 0.9).save(os.path.join(R, "icons/icon-512.png"), optimize=True)
    icon(512, 0.72).save(os.path.join(R, "icons/icon-maskable-512.png"), optimize=True)   # 가운데 안전 칸 안
    icon(180, 0.9).convert("RGB").save(os.path.join(R, "icons/apple-touch-icon.png"), optimize=True)
    print("logo", cut.size, "-> walson-logo.webp 900x732 · icons 192/512/maskable/apple")

if __name__ == "__main__":
    main()
