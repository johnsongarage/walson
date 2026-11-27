# [아지트] 팻말 왼쪽 벽 쪽 원본(2026-11-27 가르시아 "팻말들을 다녀감 같은 벽에 붙이는 소품처럼 방향 전환" → 글꼴 받기 "그렇게 해줘")
#
# 벽 소품(both)의 이름_L과 같은 방법 — _dev/azit-remake.py: 받아 둔 빈 판(sian-ref/azit-remake r13 간식 팻말·r10 대자보)을
# 고해상도로 맞춘 뒤 좌우로 뒤집고, 같은 글씨를 반대 비탈로 다시 써 넣는다(거울 글씨 X). 받은 그림(오른쪽 벽 쪽)은 건드리지 않는다.
#   → sian-ref/azit-hd/items/이름_L.webp · icons/azit-hd/이름_L.webp(앱) · icons/azit-room/이름_L.png(점 그림 — 크기·누르는 자리 기준, 원본을 같은 칸으로 줄인 것)
# 쓰는 법: python3 _dev/azit-sign-left.py 글꼴/Pretendard-ExtraBold.ttf
#   (글꼴: jsDelivr npm pretendard@1.3.9 dist/public/static/alternative/Pretendard-ExtraBold.ttf, SIL OFL — 그림에 찍기만 하고 저장소엔 안 넣음)
import importlib.util, os, shutil, sys
from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(here, '..')
spec = importlib.util.spec_from_file_location('remake', os.path.join(here, 'azit-remake.py'))
rm = importlib.util.module_from_spec(spec)
keep = sys.argv; sys.argv = [sys.argv[0]]
spec.loader.exec_module(rm)
sys.argv = keep

font = next((a for a in sys.argv[1:] if a.endswith(('.ttf', '.otf'))), None)
if not font:
    sys.exit('글꼴 주소를 같이 주세요: python3 _dev/azit-sign-left.py Pretendard-ExtraBold.ttf')

for fname, name in [('r13-sign-snack.webp', 'sign_snack'), ('r10-board-refuse.webp', 'board_refuse')]:
    full = rm.cut_sheet(fname, [name])[name]
    hd, flip = rm.to_hd(full, name)
    imL, size, m = rm.write_on(hd.transpose(Image.FLIP_LEFT_RIGHT), rm.spec_mirror(rm.LETTER[name]), font)
    out = os.path.join(rm.OUT, name + '_L.webp')
    imL.save(out, 'WEBP', quality=92, method=6)
    shutil.copyfile(out, os.path.join(ROOT, 'icons', 'azit-hd', name + '_L.webp'))
    dot = Image.open(os.path.join(ROOT, 'icons', 'azit-room', name + '.png'))
    w, h = dot.size
    k = min(w / imL.width, h / imL.height)
    small = imL.resize((max(1, round(imL.width * k)), max(1, round(imL.height * k))), Image.LANCZOS)
    canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0)); canvas.paste(small, ((w - small.width) // 2, h - small.height), small)
    canvas.save(os.path.join(ROOT, 'icons', 'azit-room', name + '_L.png'))
    print(f'{name}_L: {imL.width}×{imL.height} · 글씨 {size}px · 판 기울기 {m:+.2f}{" (빈 판 뒤집어 받음)" if flip else ""}')
