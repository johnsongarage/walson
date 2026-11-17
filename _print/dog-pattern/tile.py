# P1 치와와 무늬(가르시아 11/17 고름)를 색 세 가지로 — 좌표를 정수로 줄여 파일을 가볍게
import json, re, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
meta = {i['name']: i for n in json.load(open(os.path.join(HERE, 'icons/meta.json'))).values() for i in n}
def path_of(name):
    s = open(os.path.join(HERE, 'icons/%s.svg' % name)).read()
    d = re.search(r' d="([^"]+)"', s).group(1)
    return re.sub(r'-?\d+\.\d+', lambda m: str(int(round(float(m.group(0))))), d)
S = 320
P1 = [('set2-2',  70,  62, 70, -8, False), ('set4-5', 230,  58, 66,  7, True),
      ('set4-4', 150, 160, 62, -4, False), ('set2-5',  60, 262, 66, 10, True),
      ('set4-2', 250, 255, 70, -9, True), ('set2-4', 290, 150, 56,  6, True)]
def tile(ink, op, out):
    parts = []
    for name, cx, cy, h, rot, flip in P1:
        m = meta[name]; sc = h / m['h']
        tr = 'translate(%d %d) rotate(%d) scale(%s%.3f %.3f) translate(%d %d)' % (cx, cy, rot, '-' if flip else '', sc, sc, -m['w'] // 2, -m['h'] // 2)
        parts.append('<path transform="%s" d="%s"/>' % (tr, path_of(name)))
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">'
           '<g fill="%s" fill-opacity="%s" fill-rule="evenodd">%s</g></svg>') % (S, S, S, S, ink, op, ''.join(parts))
    open(out, 'w').write(svg)
    print(out, round(len(svg) / 1024, 1), 'KB')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
tile('#3b2a1d', '0.08', os.path.join(OUT, 'dog-pattern-yellow.svg'))
tile('#13233a', '0.07', os.path.join(OUT, 'dog-pattern-sea.svg'))
tile('#2e1c22', '0.07', os.path.join(OUT, 'dog-pattern-pink.svg'))
