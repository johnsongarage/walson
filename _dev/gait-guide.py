# 그림 공장 걷기 자세 안내 그림(2026-11-28) — Gemini에 강아지 사진과 같이 보내는 두 번째 그림.
# 글로 "왼 앞다리" 하면 못 알아들어서(라운드 a) 자세를 그림으로 보여 준다: 회색 마네킹 두 장(걷기 A · 걷기 B).
# 가까운 다리 = 밝은 회색, 먼 다리 = 어두운 회색. 앞다리끼리·뒷다리끼리 서로 엇갈리고(X자), 대각선 짝(가까운 앞 + 먼 뒤)이 같이 움직인다.
# 글자는 넣지 않는다(그림 모델이 글자를 따라 그릴 수 있어서). 만든 것: sian-ref/dog-sheet/gait-guide.png
from PIL import Image, ImageDraw
import os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CW, CH = 560, 420
# 11/28 라운드 c 뒤 가르시아 "다리 질감이 마네킹처럼, 꼬리도 일자" → 굵은 회색 마네킹 대신 막대 뼈대(선 + 관절 점), 꼬리는 아예 안 그림.
# 가까운 다리 = 검은 굵은 선, 먼 다리 = 옅은 회색 가는 선. 몸·머리는 테두리만.
NEAR, FAR, BODY, LINE = (25, 25, 25), (165, 165, 165), (255, 255, 255), (60, 60, 60)
T = 30   # 다리 굵기

def leg(d, pts, col):
    w = 10 if col == NEAR else 7
    d.line(pts, fill=col, width=w, joint='curve')
    for x, y in pts[1:-1]:   # 관절
        d.ellipse((x - 8, y - 8, x + 8, y + 8), fill=(255, 255, 255), outline=col, width=4)
    px, py = pts[-1]          # 발 — 작은 점
    d.ellipse((px - 9, py - 6, px + 11, py + 4), fill=col)

def front(sx, sy, dx, g):   # 어깨 → 팔꿈치 → 손목(뒤로 살짝) → 발
    return [(sx, sy), (sx + dx * 0.35, g - 95), (sx + dx * 0.85, g - 30), (sx + dx, g)]

def hind(hx, hy, dx, g):    # 엉덩이 → 무릎(앞) → 발목(뒤로 튀어나옴) → 발
    return [(hx, hy), (hx + dx * 0.3 + 38, g - 115), (hx + dx * 0.8 - 30, g - 62), (hx + dx, g)]

def dog(d, ox, legs):
    g = 380; S = (ox + 360, 215); Hp = (ox + 175, 215)
    nf, ff, nh, fh = legs
    leg(d, front(S[0] - 18, S[1], ff, g), FAR)      # 먼 다리 먼저
    leg(d, hind(Hp[0] + 18, Hp[1], fh, g), FAR)
    d.rounded_rectangle((ox + 125, 150, ox + 400, 265), radius=55, fill=None, outline=LINE, width=4)   # 몸
    d.ellipse((ox + 365, 80, ox + 475, 190), fill=None, outline=LINE, width=4)    # 머리
    d.ellipse((ox + 440, 130, ox + 515, 180), fill=None, outline=LINE, width=4)   # 주둥이
    d.ellipse((ox + 500, 138, ox + 516, 154), fill=LINE)                          # 코
    d.ellipse((ox + 440, 112, ox + 454, 126), fill=LINE)                          # 눈
    d.ellipse((ox + 375, 95, ox + 420, 175), fill=None, outline=LINE, width=3)   # 귀
    leg(d, front(*S, nf, g), NEAR)                  # 가까운 다리 나중
    leg(d, hind(*Hp, nh, g), NEAR)

def front_up(sx, sy, dx, g):   # 들어 올린 앞다리 — 손목을 접어 발이 뒤로
    return [(sx, sy), (sx + dx * 0.4, g - 100), (sx + dx * 0.8 + 10, g - 62), (sx + dx - 14, g - 42)]

def hind_up(hx, hy, dx, g):    # 들어 올린 뒷다리 — 무릎 앞, 발은 땅에서 뜸
    return [(hx, hy), (hx + dx * 0.3 + 42, g - 118), (hx + dx * 0.7 - 10, g - 72), (hx + dx - 6, g - 40)]

def dog_mid(d, ox):
    # 걷기 중간: A에서 앞에 있던 짝(가까운 앞 + 먼 뒤)은 땅을 딛고 몸 밑에 곧게,
    #           뒤에 있던 짝(먼 앞 + 가까운 뒤)은 들어 올려 앞으로 지나가는 중.
    g = 380; S = (ox + 360, 215); Hp = (ox + 175, 215)
    leg(d, front_up(S[0] - 18, S[1], 12, g), FAR)
    leg(d, hind(Hp[0] + 18, Hp[1], -4, g), FAR)
    body(d, ox)
    leg(d, front(*S, 6, g), NEAR)
    leg(d, hind_up(*Hp, 16, g), NEAR)

def body(d, ox):
    d.rounded_rectangle((ox + 125, 150, ox + 400, 265), radius=55, fill=None, outline=LINE, width=4)
    d.ellipse((ox + 365, 80, ox + 475, 190), fill=None, outline=LINE, width=4)
    d.ellipse((ox + 440, 130, ox + 515, 180), fill=None, outline=LINE, width=4)
    d.ellipse((ox + 500, 138, ox + 516, 154), fill=LINE)
    d.ellipse((ox + 440, 112, ox + 454, 126), fill=LINE)
    d.ellipse((ox + 375, 95, ox + 420, 175), fill=None, outline=LINE, width=3)

def dog_belly(d, ox):
    # 배뒤집기: 등이 바닥 선에 닿고 배가 위, 네 발은 살짝 굽혀 하늘로. 머리는 오른쪽 바닥에 옆으로 — 보는 사람을 봄.
    g = 380
    for pts in ([(ox + 330, 300), (ox + 350, 235), (ox + 330, 205)], [(ox + 200, 300), (ox + 215, 235), (ox + 195, 210)]):
        leg(d, pts, FAR)   # 먼 다리
    d.rounded_rectangle((ox + 115, 265, ox + 400, g), radius=55, fill=None, outline=LINE, width=4)   # 몸(등이 바닥)
    
    for pts in ([(ox + 360, 290), (ox + 395, 220), (ox + 370, 185)], [(ox + 230, 290), (ox + 250, 215), (ox + 225, 180)]):
        leg(d, pts, NEAR)  # 가까운 다리
    d.ellipse((ox + 385, 270, ox + 495, g), fill=None, outline=LINE, width=4)   # 머리(옆으로 누움)
    d.ellipse((ox + 400, 300, ox + 440, 370), fill=None, outline=LINE, width=3)   # 귀
    d.ellipse((ox + 455, 300, ox + 469, 314), fill=LINE); d.ellipse((ox + 470, 335, ox + 486, 351), fill=LINE)   # 눈·코

def save(im, name):
    out = os.path.join(root, 'sian-ref', 'dog-sheet', name)
    im = im.convert('P', palette=Image.ADAPTIVE, colors=16)
    im.save(out, optimize=True)
    print(out, os.path.getsize(out))

A, B = (75, -55, -70, 50), (-55, 75, 50, -70)   # 가까운 앞 · 먼 앞 · 가까운 뒤 · 먼 뒤 (발이 어깨·엉덩이보다 얼마나 앞인가)

# 3×2용: 걷기 A · B
im = Image.new('RGB', (CW * 2 + 40, CH), (255, 255, 255)); d = ImageDraw.Draw(im)
dog(d, 0, A); dog(d, CW + 40, B)
save(im, 'gait-guide.png')

# 3×3용: 걷기 A · 중간 · B · 배뒤집기
im = Image.new('RGB', (CW * 4 + 120, CH), (255, 255, 255)); d = ImageDraw.Draw(im)
dog(d, 0, A); dog_mid(d, CW + 40); dog(d, (CW + 40) * 2, B); dog_belly(d, (CW + 40) * 3)
save(im, 'pose-guide-3x3.png')

def dog_mid2(d, ox):
    # 걷기 중간2(B → A 사이): B에서 앞에 있던 짝(먼 앞 + 가까운 뒤)이 땅을 딛고 곧게, 다른 짝(가까운 앞 + 먼 뒤)은 들어 올려 지나감
    g = 380; S = (ox + 360, 215); Hp = (ox + 175, 215)
    leg(d, front(S[0] - 18, S[1], 6, g), FAR)
    leg(d, hind_up(Hp[0] + 18, Hp[1], 16, g), FAR)
    body(d, ox)
    leg(d, front_up(*S, 12, g), NEAR)
    leg(d, hind(*Hp, -4, g), NEAR)

# 걷기 2×2용(11/28 가르시아 "걷기 모션만 2x2로 빼는 게 맞겠네, 나머지는 2x3"): 칸 배치 그대로
#   위 줄 A · 중간1 / 아래 줄 B · 중간2 — 돌리는 순서는 A → 중간1 → B → 중간2
GAP = 40
im = Image.new('RGB', (CW * 2 + GAP, CH * 2 + GAP), (255, 255, 255)); d = ImageDraw.Draw(im)
tile = Image.new('RGB', (CW, CH), (255, 255, 255))
for k, fn in enumerate([lambda dd: dog(dd, 0, A), lambda dd: dog_mid(dd, 0), lambda dd: dog(dd, 0, B), lambda dd: dog_mid2(dd, 0)]):
    t = tile.copy(); fn(ImageDraw.Draw(t))
    im.paste(t, ((k % 2) * (CW + GAP), (k // 2) * (CH + GAP)))
save(im, 'walk-guide-2x2.png')

def dog_poop(d, ox):
    # 똥 자세(11/28 "3×3 한 장으로" — 남는 칸): 등을 둥글게 말고 엉덩이를 바닥 가까이, 뒷다리는 굽혀 몸 밑 앞으로, 앞다리는 곧게.
    g = 380
    S = (ox + 370, 215); Hp = (ox + 205, 300)
    leg(d, [(S[0] - 18, S[1]), (S[0] - 14, g - 90), (S[0] - 8, g - 28), (S[0] - 4, g)], FAR)
    leg(d, [(Hp[0] + 14, Hp[1]), (Hp[0] + 80, g - 40), (Hp[0] + 30, g - 12), (Hp[0] + 62, g)], FAR)
    # 몸: 어깨는 높고 엉덩이는 낮게 기운 둥근 몸(테두리만)
    t = Image.new('RGBA', (360, 200), (0, 0, 0, 0)); td = ImageDraw.Draw(t)
    td.rounded_rectangle((20, 45, 300, 150), radius=52, outline=LINE + (255,), width=4)
    t = t.rotate(22, resample=Image.BICUBIC, expand=True)
    d._image.paste(t, (ox + 140, 92), t)
    d.ellipse((ox + 375, 80, ox + 485, 190), fill=None, outline=LINE, width=4)
    d.ellipse((ox + 450, 130, ox + 525, 180), fill=None, outline=LINE, width=4)
    d.ellipse((ox + 510, 138, ox + 526, 154), fill=LINE)
    d.ellipse((ox + 450, 112, ox + 464, 126), fill=LINE)
    d.ellipse((ox + 385, 95, ox + 430, 175), fill=None, outline=LINE, width=3)
    leg(d, [S, (S[0] + 4, g - 90), (S[0] + 10, g - 28), (S[0] + 14, g)], NEAR)
    leg(d, [Hp, (Hp[0] + 70, g - 45), (Hp[0] + 18, g - 14), (Hp[0] + 52, g)], NEAR)

# 3×3 한 장용(11/28): 걷기 A · 걷기 중간 · 똥 자세 — 3×3 둘째 줄과 같은 차례
im = Image.new('RGB', (CW * 3 + 80, CH), (255, 255, 255)); d = ImageDraw.Draw(im)
dog(d, 0, A); dog_mid(d, CW + 40); dog_poop(d, (CW + 40) * 2)
save(im, 'pose-guide-3x3.png')
