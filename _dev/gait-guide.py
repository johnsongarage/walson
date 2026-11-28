# 그림 공장 걷기 자세 안내 그림(2026-11-28) — Gemini에 강아지 사진과 같이 보내는 두 번째 그림.
# 글로 "왼 앞다리" 하면 못 알아들어서(라운드 a) 자세를 그림으로 보여 준다: 회색 마네킹 두 장(걷기 A · 걷기 B).
# 가까운 다리 = 밝은 회색, 먼 다리 = 어두운 회색. 앞다리끼리·뒷다리끼리 서로 엇갈리고(X자), 대각선 짝(가까운 앞 + 먼 뒤)이 같이 움직인다.
# 글자는 넣지 않는다(그림 모델이 글자를 따라 그릴 수 있어서). 만든 것: sian-ref/dog-sheet/gait-guide.png
from PIL import Image, ImageDraw
import os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CW, CH = 560, 420
NEAR, FAR, BODY, LINE = (200, 200, 200), (95, 95, 95), (200, 200, 200), (40, 40, 40)
T = 30   # 다리 굵기

def leg(d, pts, col):
    for w, c in ((T + 8, LINE), (T, col)):
        d.line(pts, fill=c, width=w, joint='curve')
        for x, y in (pts[0], pts[-1]):
            d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=c)
    px, py = pts[-1]   # 발
    d.ellipse((px - 20, py - 12, px + 24, py + 10), fill=LINE); d.ellipse((px - 16, py - 9, px + 20, py + 6), fill=col)

def front(sx, sy, dx, g):   # 어깨 → 팔꿈치 → 손목(뒤로 살짝) → 발
    return [(sx, sy), (sx + dx * 0.35, g - 95), (sx + dx * 0.85, g - 30), (sx + dx, g)]

def hind(hx, hy, dx, g):    # 엉덩이 → 무릎(앞) → 발목(뒤로 튀어나옴) → 발
    return [(hx, hy), (hx + dx * 0.3 + 38, g - 115), (hx + dx * 0.8 - 30, g - 62), (hx + dx, g)]

def dog(d, ox, legs):
    g = 380; S = (ox + 360, 215); Hp = (ox + 175, 215)
    nf, ff, nh, fh = legs
    leg(d, front(S[0] - 18, S[1], ff, g), FAR)      # 먼 다리 먼저
    leg(d, hind(Hp[0] + 18, Hp[1], fh, g), FAR)
    d.line([(ox + 140, 190), (ox + 95, 120)], fill=LINE, width=T + 6); d.line([(ox + 140, 190), (ox + 95, 120)], fill=BODY, width=T - 2)   # 꼬리
    d.rounded_rectangle((ox + 125, 150, ox + 400, 265), radius=55, fill=BODY, outline=LINE, width=4)   # 몸
    d.ellipse((ox + 365, 80, ox + 475, 190), fill=BODY, outline=LINE, width=4)    # 머리
    d.ellipse((ox + 440, 130, ox + 515, 180), fill=BODY, outline=LINE, width=4)   # 주둥이
    d.ellipse((ox + 500, 138, ox + 516, 154), fill=LINE)                          # 코
    d.ellipse((ox + 440, 112, ox + 454, 126), fill=LINE)                          # 눈
    d.ellipse((ox + 375, 95, ox + 420, 175), fill=(170, 170, 170), outline=LINE, width=4)   # 귀
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
    d.line([(ox + 140, 190), (ox + 95, 120)], fill=LINE, width=T + 6); d.line([(ox + 140, 190), (ox + 95, 120)], fill=BODY, width=T - 2)
    d.rounded_rectangle((ox + 125, 150, ox + 400, 265), radius=55, fill=BODY, outline=LINE, width=4)
    d.ellipse((ox + 365, 80, ox + 475, 190), fill=BODY, outline=LINE, width=4)
    d.ellipse((ox + 440, 130, ox + 515, 180), fill=BODY, outline=LINE, width=4)
    d.ellipse((ox + 500, 138, ox + 516, 154), fill=LINE)
    d.ellipse((ox + 440, 112, ox + 454, 126), fill=LINE)
    d.ellipse((ox + 375, 95, ox + 420, 175), fill=(170, 170, 170), outline=LINE, width=4)

def dog_belly(d, ox):
    # 배뒤집기: 등이 바닥 선에 닿고 배가 위, 네 발은 살짝 굽혀 하늘로. 머리는 오른쪽 바닥에 옆으로 — 보는 사람을 봄.
    g = 380
    for pts in ([(ox + 330, 300), (ox + 350, 235), (ox + 330, 205)], [(ox + 200, 300), (ox + 215, 235), (ox + 195, 210)]):
        leg(d, pts, FAR)   # 먼 다리
    d.line([(ox + 125, 350), (ox + 60, 370)], fill=LINE, width=T + 6); d.line([(ox + 125, 350), (ox + 60, 370)], fill=BODY, width=T - 2)   # 꼬리(바닥)
    d.rounded_rectangle((ox + 115, 265, ox + 400, g), radius=55, fill=BODY, outline=LINE, width=4)   # 몸(등이 바닥)
    d.ellipse((ox + 170, 280, ox + 360, 330), fill=(225, 225, 225))   # 배
    for pts in ([(ox + 360, 290), (ox + 395, 220), (ox + 370, 185)], [(ox + 230, 290), (ox + 250, 215), (ox + 225, 180)]):
        leg(d, pts, NEAR)  # 가까운 다리
    d.ellipse((ox + 385, 270, ox + 495, g), fill=BODY, outline=LINE, width=4)   # 머리(옆으로 누움)
    d.ellipse((ox + 400, 300, ox + 440, 370), fill=(170, 170, 170), outline=LINE, width=4)   # 귀
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
