# 블랙 핑크 테마(2026-11-19) — 화면마다 <style>에 박힌 밝은 색을 블랙일 때만 어둡게 덮어쓰는 theme-black.css를 만든다.
#
# 왜 필요한가: 화면 색(theme.js)은 CSS 변수(--bg·--panel·--ink …)만 바꾸는데, 화면들에는 #fff 같은 색이 직접 박힌 곳이 수백 군데 있다.
# 밝은 색 세트(젤리 핑크·노랑·바다·딸기우유)에서는 문제없지만 블랙에서는 흰 칸에 흰 글씨가 된다. 그 칸들을 블랙일 때만 덮어쓴다.
#
# 쓰는 법: 화면 <style>의 색을 고쳤거나 새 화면을 만들면 저장소 맨 위에서
#   python3 _dev/theme-black.py      (pip tinycss2)
# 를 돌려 theme-black.css를 다시 만들고, 블랙으로 그 화면을 열어 본다. theme-black.css의 "손으로 고친 것" 아래는 그대로 남는다
# (JS가 직접 넣는 스타일, 자동으로 못 고치는 칸은 거기에 손으로 적는다). 새 화면은 처음부터 색을 변수로 쓰면 여기 걸릴 일이 없다.
import os, re, colorsys
import tinycss2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'theme-black.css')
MARK = '/* ===== 손으로 고친 것 — 아래는 다시 만들어도 그대로 남는다 ===== */'
P = 'html[data-palette="black"]'

THEME_VARS = {'--bg', '--panel', '--panel-border', '--ink', '--ink-soft', '--accent', '--accent-ink', '--accent-tint',
              '--hl', '--hl-ink', '--line', '--shadow-rgb'}
PANEL = (0x1e, 0x1e, 0x24)
BG = (0x12, 0x12, 0x15)
COLOR_RE = re.compile(r'#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)')

def parse(c):
    c = c.strip()
    if c.startswith('#'):
        h = c[1:]
        if len(h) in (3, 4): h = ''.join(ch * 2 for ch in h)
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        a = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
        return r, g, b, a
    nums = re.findall(r'[\d.]+%?', c)
    r, g, b = (float(n) for n in nums[:3])
    a = float(nums[3].rstrip('%')) / (100 if nums[3].endswith('%') else 1) if len(nums) > 3 else 1.0
    return int(r), int(g), int(b), a

def hexs(rgb): return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(v)))) for v in rgb)
def lum(rgb):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)
def hls(rgb): return colorsys.rgb_to_hls(*(v / 255 for v in rgb))
def from_hls(h, l, s): return tuple(v * 255 for v in colorsys.hls_to_rgb(h, l, s))

def lighten_for(rgb, against, need):
    h, l, s = hls(rgb)
    out = rgb
    while contrast(out, against) < need and l < 0.95:
        l += 0.02
        out = from_hls(h, l, s)
    return out

def map_surface(c):
    r, g, b, a = parse(c)
    h, l, s = hls((r, g, b))
    if a < 1:
        if l > 0.6: return 'rgba(255, 255, 255, %.2f)' % min(a, 0.12)   # 흰 하이라이트는 아주 옅게
        return None                                                     # 그림자·어두운 덧칠은 그대로
    chroma = max(r, g, b) - min(r, g, b)
    if l >= 0.9 and chroma < 24: return 'var(--panel)'
    if l >= 0.72:
        if 20 <= h * 360 <= 48 and chroma < 50: return '#26262e'        # 예전 종이색(베이지)은 색 없는 어두운 칸으로
        return hexs(from_hls(h, 0.17, min(s, 0.55) * 0.55))            # 연한 색 칸(초록·분홍 등) → 같은 색조의 어두운 칸
    if l <= 0.3 and s < 0.35: return '#2e2e38'                         # 진한 갈색·검정 칸 → 한 단계 밝은 차콜
    return None                                                         # 의미 있는 색(초록·빨강 등)은 그대로

def map_text(c):
    r, g, b, a = parse(c)
    h, l, s = hls((r, g, b))
    if l >= 0.8: return None                                            # 흰 글씨는 그대로
    if s < 0.35 or l < 0.2:
        return 'var(--ink)' if l < 0.28 else 'var(--ink-soft)'
    out = lighten_for((r, g, b), PANEL, 4.5)                             # 색 있는 글씨는 밝혀서 4.5:1
    return None if out == (r, g, b) else hexs(out)

def map_border(c):
    r, g, b, a = parse(c)
    h, l, s = hls((r, g, b))
    if a < 1: return None
    if l >= 0.72: return 'var(--panel-border)'
    if l <= 0.3 and s < 0.35: return '#4a4a56'
    out = lighten_for((r, g, b), BG, 3)
    return None if out == (r, g, b) else hexs(out)

def map_var(name, c):
    r, g, b, a = parse(c)
    h, l, s = hls((r, g, b))
    if name.endswith('-tint'): return map_surface(c)
    if name in ('--bg-deep',): return '#16161b'
    if name in ('--soft', '--muted'): return 'var(--ink-soft)'
    if l >= 0.72: return map_surface(c)
    out = lighten_for((r, g, b), PANEL, 4.5)                             # 초록·빨강·노랑 같은 의미 색은 밝혀서
    return None if out == (r, g, b) else hexs(out)

def strip_var(v):
    return re.sub(r'var\([^()]*(\([^()]*\))*[^()]*\)', ' VAR ', v)

def map_value(prop, val):
    if 'url(' in val: return None
    if prop.startswith('--'):
        if prop in THEME_VARS: return None
        m = COLOR_RE.fullmatch(val.strip())
        return map_var(prop, val) if m else None
    if prop in ('background', 'background-color', 'background-image'): fn = map_surface
    elif prop in ('color', 'fill', 'stroke', 'caret-color', '-webkit-text-fill-color', 'text-decoration-color'): fn = map_text
    elif prop.startswith('border') or prop.startswith('outline'): fn = map_border
    else: return None
    plain = strip_var(val)
    if not COLOR_RE.search(plain): return None
    changed = False
    def rep(m):
        nonlocal changed
        new = fn(m.group(0))
        if new is None: return m.group(0)
        changed = True
        return new
    # var(...) 안의 기본값은 건드리지 않는다
    parts = re.split(r'(var\([^()]*(?:\([^()]*\))*[^()]*\))', val)
    out = ''.join(p if p.startswith('var(') else COLOR_RE.sub(rep, p) for p in parts)
    return out if changed else None

def scope(sel, page):
    pre = P + ('[data-page="%s"]' % page if page else '')
    out = []
    for s in sel.split(','):
        s = s.strip()
        if s in (':root', 'html'): out.append(pre)
        elif s.startswith(':root'): out.append(pre + s[5:])
        elif s.startswith('html'): out.append(pre + s[4:])
        else: out.append(pre + ' ' + s)
    return ', '.join(out)

def walk(rules, media=None):
    for r in rules:
        if r.type == 'qualified-rule':
            sel = tinycss2.serialize(r.prelude).strip()
            for d in tinycss2.parse_declaration_list(r.content, skip_comments=True, skip_whitespace=True):
                if d.type == 'declaration':
                    yield media, sel, d.lower_name, tinycss2.serialize(d.value).strip()
        elif r.type == 'at-rule' and r.lower_at_keyword in ('media', 'supports') and r.content:
            inner = tinycss2.parse_rule_list(r.content, skip_comments=True, skip_whitespace=True)
            yield from walk(inner, '@' + r.lower_at_keyword + ' ' + tinycss2.serialize(r.prelude).strip())

def collect(css, page):
    blocks = {}
    for media, sel, prop, val in walk(tinycss2.parse_stylesheet(css, skip_comments=True, skip_whitespace=True)):
        new = map_value(prop, val)
        if new is None: continue
        key = (media, scope(sel, page))
        blocks.setdefault(key, []).append('%s: %s !important' % (prop, new) if not prop.startswith('--') else '%s: %s' % (prop, new))
    return blocks

def main():
    pages = sorted(f for f in os.listdir(ROOT) if f.endswith('.html') and 'theme.js?v=' in open(os.path.join(ROOT, f), encoding='utf-8').read())
    out = ['/* 블랙 핑크 테마(theme.js "black")일 때만 — 화면마다 박힌 밝은 색을 어둡게 덮어쓴다.',
           '   위쪽은 _dev/theme-black.py가 만든다(손대지 말고 다시 만들기). 손으로 고칠 것은 맨 아래 표시 밑에. */', '']
    count = 0
    for f in pages + ['walk-screen.css', 'pet-signs.css']:
        text = open(os.path.join(ROOT, f), encoding='utf-8').read()
        page = f[:-5] if f.endswith('.html') else None
        css = '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', text, flags=re.S)) if f.endswith('.html') else text
        blocks = collect(css, page)
        if not blocks: continue
        out.append('/* ' + f + ' */')
        for (media, sel), decls in blocks.items():
            rule = '%s { %s; }' % (sel, '; '.join(decls))
            out.append('%s { %s }' % (media, rule) if media else rule)
            count += len(decls)
        out.append('')
    manual = ''
    if os.path.exists(OUT):
        old = open(OUT, encoding='utf-8').read()
        if MARK in old: manual = old.split(MARK, 1)[1]
    open(OUT, 'w', encoding='utf-8').write('\n'.join(out) + '\n' + MARK + (manual if manual else '\n'))
    print('theme-black.css:', count, 'declarations from', len(pages), 'pages')

if __name__ == '__main__':
    main()
