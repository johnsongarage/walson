#!/usr/bin/env python3
# 용어 바꾸기(2026-11-19 가르시아 "타겟을 정해서 용어 정리" → "과하게 적용된 부분 체크 후 반영").
# 화면에 보이는 글자만 바꾼다 — 주석 줄(//, /*, *, <!--, 블록 주석 안)은 그대로 둔다(예전 결정·인용이 남아 있어야 해서).
# 받침이 바뀌면 조사도 맞춘다(주민증이 → 워킹패스가, 수호견을 → 지킴이를).
# 다시 돌려도 안전하다(이미 바뀐 글자는 다시 안 걸린다). 용어 목록: docs/TERMS.md
#   python3 _dev/terms.py          바꾸기
#   python3 _dev/terms.py --dry    바뀔 줄만 보기
import re, sys, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY = '--dry' in sys.argv

# (옛 말, 새 말, 옛 말 끝에 받침 있음, 새 말 끝에 받침 있음)
TERMS = [
    ('재택 명예수호견', '재택 명예 지킴이', True, False),
    ('수호견', '지킴이', True, False),
    ('주민증', '워킹패스', True, False),
    ('주민 등급', '산책 등급', True, True),
    ('산책 주민', '산책 메이트', True, False),
]

# 받침 있는 말 뒤 조사 → 받침 없는 말 뒤 조사 (긴 것부터)
TO_VOWEL = [('이에요', '예요'), ('이었', '였'), ('이라', '라'), ('이랑', '랑'), ('이나', '나'), ('이면', '면'),
            ('이고', '고'), ('이죠', '죠'), ('이지', '지'), ('이야', '야'), ('으로', '로'), ('이', '가'),
            ('을', '를'), ('은', '는'), ('과', '와')]

def convert(line):
    for old, new, old_b, new_b in TERMS:
        if old not in line:
            continue
        if old_b and not new_b:
            def rep(m):
                p = m.group(1) or ''
                for a, b in TO_VOWEL:
                    if p == a:
                        return new + b
                return new + p
            alts = '|'.join(re.escape(a) for a, _ in TO_VOWEL)
            line = re.sub(re.escape(old) + '(' + alts + ')?', rep, line)
        else:
            line = line.replace(old, new)
    return line

def process(path):
    src = open(path, encoding='utf-8').read().split('\n')
    out, changed, in_block, in_html_c = [], [], False, False
    for i, line in enumerate(src):
        s = line.strip()
        skip = False
        if in_block or in_html_c:
            skip = True
        elif s.startswith('//') or s.startswith('/*') or s.startswith('*') or s.startswith('<!--'):
            skip = True
        # 블록 주석 상태 따라가기(줄 단위로 대충 — 이 저장소 모양에 맞춤)
        if not in_html_c and '<!--' in line and '-->' not in line.split('<!--', 1)[1]:
            in_html_c = True
        elif in_html_c and '-->' in line:
            in_html_c = False
        if not in_block and s.startswith('/*') and '*/' not in s:
            in_block = True
        elif in_block and '*/' in line:
            in_block = False
        if skip:
            out.append(line); continue
        # 줄 끝 // 주석은 그대로(문자열 안의 https:// 는 건드리지 않게 ' //' 앞만)
        code, tail = line, ''
        m = re.search(r'\s//\s', line)
        if m and path.endswith('.js'):
            code, tail = line[:m.start()], line[m.start():]
        new = convert(code) + tail
        if new != line:
            changed.append((i + 1, line.strip()[:110], new.strip()[:110]))
        out.append(new)
    if changed:
        rel = os.path.relpath(path, ROOT)
        print('==', rel, len(changed))
        if DRY:
            for n, a, b in changed:
                print('  %d: %s\n   -> %s' % (n, a, b))
        else:
            open(path, 'w', encoding='utf-8').write('\n'.join(out))
    return len(changed)

files = sorted(glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, '*.js')))
total = sum(process(f) for f in files)
print('total lines:', total)
