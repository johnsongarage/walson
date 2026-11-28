# 모델하우스 배치 JSON → showrooms-data.js (2026-11-28)
# 관리자 편집(azit.html?house=edit)이 저장할 때 같은 모양으로 쓴다(spot-github.js putFile). 손으로 만들 때만 이 스크립트.
# 쓰는 법: python3 _dev/showrooms-write.py rooms.json
import json, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rooms = json.load(open(sys.argv[1]))
head = ('// 왈슨 모델하우스(예시 방) 배치 — 자동 생성 파일.\n'
        '// 관리자 편집(azit.html?house=edit — GitHub 토큰이 있는 운영자 기기에서만 편집 막대가 뜸)이 이 파일을 통째로 다시 쓴다.\n'
        '// 자리: {i, j} 바닥(i = 오른쪽 벽 따라, j = 왼쪽 벽 따라) · {wall: R|L, u, h} 벽 · {shelf: 0~5} 선반 · {corner: 1} 가랜드.\n'
        '// 이 파일이 없거나 깨졌으면 azit-room.js 안의 기본 배치를 쓴다.\n'
        'window.WALSON_SHOWROOMS = [\n')
body = ',\n'.join('  ' + json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in rooms)
open(os.path.join(ROOT, 'showrooms-data.js'), 'w').write(head + body + '\n];\n')
print('showrooms-data.js', len(rooms), 'rooms')
