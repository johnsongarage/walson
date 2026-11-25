// 도트 워킹패스 — 트레이싱판(2026-11-23 가르시아 "이 시안을 html로 뽑으라니까 못 뽑더라" → "트레이싱으로 다시 짜 봐, 정교하게").
// 받은 시안 그림(sian-ref/walking-pass-pom.webp, 1493×2000)을 실측해서 같은 자리·같은 크기로 다시 그린 것.
// 좌표는 전부 그 그림의 픽셀 좌표 — 그래서 시안 그림을 그대로 겹치면 맞는다(pass-trace.html의 겹쳐 보기·밀어 보기·차이 보기).
// 실측해서 알아낸 것:
//  - 글자는 전부 한 글꼴: 12×16칸 도트, 획 3칸, 둥근 귀퉁이는 2×2칸 깎기, 글자 간격 14칸(W 15, 띄어쓰기 6).
//    제목 1줄 한 칸 5.9px · 2줄 5.06px · 칸 이름·값·알약 글자 3.1~3.2px로 크기만 다르다. 그림에 없는 글자(B C F H J Q R U V X Z·숫자)는
//    같은 규칙으로 새로 그렸고, 한글(이름 등)은 둥근모꼴 16px 도트를 2×2로 굵혀서 같은 높이로 쓴다.
//  - 사진 틀: 12.4px 칸 — 바깥 테두리 · 진한 분홍 띠 · 연한 분홍 띠 · 안쪽 테두리 · 사진(각 한 칸씩 안으로). 네 귀퉁이는 뼈다귀 마디
//    (큰 마디 + 위·옆 작은 혹, 안에 주황 발바닥) — 왼쪽 위를 따서 나머지는 뒤집어 쓴다.
//  - 칸·알약: 12.5px 칸, 모서리를 한 칸 깎은 계단 테두리. 칸 이름 쪽은 분홍, 값 쪽은 흰색.
//  - 원본은 AI 그림이라 칸 크기가 곳곳에서 1~3px씩 흔들린다 — 같은 칸 크기로 반듯하게 맞추고, 차이는 겹쳐 보기에서 눈으로 확인.
// 그림은 이 휴대폰 안에서만 그리고 어디로도 보내지 않는다. window.WalsonPassTrace.render(opts) → SVG 문자열
// 11/24 밤: 키링판에 가로판(opts.landscape — 가로 사진용, 같은 칸 크기를 다시 배치)과 카드 색(opts.color — 기본 핑크, TINTS)
// 같은 날 밤 가르시아 "키링 맨 아래 칸에 유의미한 산책 빼고 특기를 골라서, 또는 직접 적어 넣기 · 입력하는 텍스트는 뚜렷한 글씨체로 · 글씨 크기 조절":
//   opts.skill(특기 — 홍보 문구 알약 대신, 같은 날 "4안으로" 등급 뱃지와 한 상자) · opts.vfont(칸 값 글씨체 'clear' 또렷하게 · 'bold' 굵게 · 'dot' 도트) · opts.sizes(칸마다 글씨 크기 배수).
//   편집 창은 keyring-edit.js
// 같은 날 밤 가르시아 "키링 카드 상단에 핑크 남는 영역 가운데 구멍 내 줘 · 맨 아래 공간 내서 당신과 강아지의 유의미한 산책 넣어 줘 ·
//   가로 버전에서 상단에 구멍 낼 여유 공간 만들어 주고 구멍 내 줘": 키링판(특기를 주는 것 — [워킹패스] 키링 카드·3D 키링)은
//   머리띠 제목 위 빈 분홍 가운데에 고리 구멍(도트 동그라미 테두리, 안은 투명 — 3D에선 그 자리를 뚫음, geom().hole) +
//   사진 틀 아래를 늘려 홍보 한 줄(site-config.js brand.tagline). 세로판은 아래만 늘리고(LK), 가로판은 위·아래 둘 다 늘림(LL)
(function () {
  'use strict';
  var REF = { w: 1493, h: 2000 };
  var COL = {
    bg: '#f3e8e7', shadow: '#d7c2c2', head: '#feafc7', divider: '#db6f8f', body: '#fdefe4',
    ink: '#451b17', paw: '#693230', frameP: '#e9a09f', frameL: '#facec4', knob: '#f9c3ba', bump: '#e9a7a4', opaw: '#f87a47',
    label: '#fdcfd3', value: '#ffffff', pill: '#fbb8bf', dash: '#f0a3b3', dashSoft: '#fbc1c7', dashFaint: '#fde0dc', white: '#ffffff', qr: '#000000'
  };

  // ── 글꼴(12×16칸) ── '#' = 칠함. rep(n, s) = 같은 줄 n번
  function rep(n, s) { var a = []; for (var i = 0; i < n; i++) a.push(s); return a; }
  function g() { var a = []; for (var i = 0; i < arguments.length; i++) a = a.concat(arguments[i]); return a; }
  var TOP = ['..########..', '..########..', '############'], BOT = ['############', '..########..', '..########..'];
  var FONT = {
    A: g(TOP, rep(5, '###......###'), rep(3, '############'), rep(5, '###......###')),   // 가로획은 원본대로 8~10줄(위아래 빈칸 5줄씩)
    B: g(['##########..', '##########..', '############'], rep(3, '###......###'), rep(3, '##########..'), rep(4, '###......###'), ['############', '##########..', '##########..']),
    C: g(['..#########.', '..#########.', '###########.'], rep(10, '###.........'), ['###########.', '..#########.', '..#########.']),
    D: g(['##########..', '##########..', '############'], rep(10, '###......###'), ['############', '##########..', '##########..']),
    E: g(rep(3, '###########'), rep(3, '###........'), rep(3, '##########.'), rep(4, '###........'), rep(3, '###########')),
    F: g(rep(3, '###########'), rep(3, '###........'), rep(3, '##########.'), rep(7, '###........')),
    G: g(['..#########.', '..#########.', '###########.'], rep(3, '###.........'), rep(3, '###...######'), rep(4, '###......###'), BOT),
    H: g(rep(6, '###......###'), rep(3, '############'), rep(7, '###......###')),
    I: g(rep(3, '#########'), rep(10, '...###...'), rep(3, '#########')),
    J: g(rep(9, '.........###'), rep(4, '###......###'), BOT),
    K: ['###......###', '###......###', '###....#####', '###....###..', '###..#####..', '###..###....', '########....', '#######.....',
        '#######.....', '###..###....', '###..###....', '###..#####..', '###....###..', '###....#####', '###......###', '###......###'],
    L: g(rep(13, '###.........'), rep(3, '############')),
    M: g(rep(2, '###......###'), rep(3, '#####..#####'), rep(2, '############'), rep(2, '###..##..###'), rep(7, '###......###')),
    N: g(rep(2, '###......###'), rep(2, '#####....###'), rep(2, '#######..###'), ['############'], rep(2, '###..#######'), rep(2, '###....#####'), rep(5, '###......###')),
    O: g(TOP, rep(10, '###......###'), BOT),
    P: g(['##########..', '##########..', '############'], rep(4, '###......###'), ['############', '##########..', '##########..'], rep(6, '###.........')),
    Q: g(TOP, rep(7, '###......###'), ['###...##.###', '###....#####', '###.....####', '############', '..##########', '..##########']),
    R: g(['##########..', '##########..', '############'], rep(4, '###......###'), ['############', '##########..', '##########..'],
        ['###..###....', '###..#####..', '###....###..', '###....#####', '###......###', '###......###']),
    S: g(TOP, ['###......###', '###......###', '###.........', '##########..', '##########..', '..##########', '.........###', '.........###',
        '###......###', '###......###'], BOT),
    T: g(rep(3, '###########'), rep(13, '....###....')),
    U: g(rep(13, '###......###'), ['############', '..########..', '..########..']),
    V: g(rep(7, '###......###'), rep(2, '.###....###.'), rep(2, '..###..###..'), rep(2, '...######...'), rep(3, '....####....')),
    W: g(rep(6, '###.......###'), rep(6, '###..###..###'), rep(2, '#############'), rep(2, '..###...###..')),
    X: g(rep(3, '###......###'), rep(2, '.###....###.'), rep(2, '..###..###..'), rep(2, '...######...'), rep(2, '..###..###..'), rep(2, '.###....###.'), rep(3, '###......###')),
    Y: g(rep(5, '###.....###'), ['####...####', '.###...###.', '..#######..', '...#####...'], rep(7, '....###....')),
    Z: g(rep(3, '############'), ['.........###', '........###.', '.......###..', '......###...', '.....###....', '....###.....', '...###......', '..###.......', '.###........', '###.........'], rep(3, '############')),
    '0': null,   // O와 같음(아래에서 채움)
    '1': g(['...###...', '..####...', '######...'], rep(10, '...###...'), rep(3, '#########')),
    '2': g(TOP, ['###......###', '###......###', '.........###', '.........###', '..##########', '############', '##########..'], rep(3, '###.........'), rep(3, '############')),
    '3': g(['##########..', '##########..', '############'], rep(3, '.........###'), ['...########.', '...#########', '...########.'], rep(4, '.........###'), ['############', '##########..', '##########..']),
    '4': g(rep(8, '###......###'), rep(3, '############'), rep(5, '.........###')),
    '5': g(rep(3, '############'), rep(3, '###.........'), ['##########..', '###########.', '############'], rep(3, '.........###'), ['###......###'], BOT),
    '6': g(['..#########.', '..#########.', '###########.'], rep(3, '###.........'), ['##########..', '###########.', '############'], rep(4, '###......###'), BOT),
    '7': g(rep(3, '############'), rep(2, '.........###'), rep(2, '........###.'), rep(2, '.......###..'), rep(2, '......###...'), rep(5, '.....###....')),
    '8': g(TOP, rep(3, '###......###'), ['.##########.', '..########..', '.##########.'], rep(4, '###......###'), BOT),
    '9': g(TOP, rep(4, '###......###'), ['############', '.###########', '..##########'], rep(3, '.........###'), ['.###########', '.#########..', '.#########..']),
    '.': g(rep(13, '...'), rep(3, '###')),
    ':': g(rep(3, '...'), rep(3, '###'), rep(5, '...'), rep(3, '###'), rep(2, '...')),
    '-': g(rep(6, '........'), rep(3, '########'), rep(7, '........')),
    '!': g(rep(11, '###'), rep(2, '...'), rep(3, '###')),
    "'": g(rep(5, '###'), rep(11, '...')),
    '/': ['......###', '......###', '.....###.', '.....###.', '....###..', '....###..', '...###...', '...###...', '...###...', '..###....', '..###....',
          '.###.....', '.###.....', '###......', '###......', '###......'],
    '?': g(TOP, ['###......###', '.........###', '.......#####', '......####..', '......###...', '......###...'], rep(3, '............'), rep(3, '......###...'), ['............']),
    '·': g(rep(7, '...'), rep(3, '###'), rep(6, '...')),
    o: g(rep(4, '...........'), ['..#######..', '..#######..', '###########'], rep(6, '###.....###'), ['###########', '..#######..', '..#######..'])
  };
  FONT['0'] = FONT.O;
  // 글자 사이(칸 수): 기본 14(글자 12 + 사이 2). 왼쪽 띄움(lb): 좁은 글자는 가운데로
  var ADV = { W: 15, ' ': 6, '.': 5, ':': 5, '!': 5, "'": 5, '·': 5, '-': 10 };
  var LB = { I: 2.5, E: 0.5, F: 0.5, T: 0.5, Y: 0.5, '1': 1.5 };

  // ── 한글 등(글꼴에 없는 글자): 둥근모꼴 16px을 도트로 떠서 2×2로 굵게 — 같은 16칸 높이 ──
  var hcache = {};
  function fallbackGlyph(ch) {
    if (hcache[ch]) return hcache[ch];
    // 둥근모꼴을 2배(32px)로 그려서 2×2 덩어리마다 한 칸으로 떠낸다 — 16px로 바로 뜨면 흐린 가장자리 때문에 칸이 번진다
    var S = 72, K = 2, c = document.createElement('canvas'); c.width = S; c.height = S;
    var x = c.getContext('2d');
    x.fillStyle = '#000'; x.textBaseline = 'alphabetic'; x.font = (16 * K) + "px 'DungGeunMo'";
    x.fillText(ch, 8, 52);
    var d = x.getImageData(0, 0, S, S).data, y, i, x0 = S, x1 = -1, y0 = S, y1 = -1;
    function al(px, py) { return (px < 0 || py < 0 || px >= S || py >= S) ? 0 : d[(py * S + px) * 4 + 3]; }
    for (y = 0; y < S; y++) for (i = 0; i < S; i++) if (al(i, y) > 60) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (x1 < 0) return (hcache[ch] = { rows: rep(16, '......'), lb: 0, adv: 6 });
    // 덩어리 경계(짝/홀) 중 칸이 또렷하게 갈리는 쪽으로
    var best = null;
    [0, 1].forEach(function (px) {
      [0, 1].forEach(function (py) {
        var bx0 = x0 - px, by0 = y0 - py, w = Math.ceil((x1 - bx0 + 1) / K), h = Math.ceil((y1 - by0 + 1) / K), sharp = 0, bits = [];
        for (var r = 0; r < h; r++) {
          bits.push([]);
          for (var q = 0; q < w; q++) {
            var a = (al(bx0 + q * K, by0 + r * K) + al(bx0 + q * K + 1, by0 + r * K) + al(bx0 + q * K, by0 + r * K + 1) + al(bx0 + q * K + 1, by0 + r * K + 1)) / 4;
            sharp += Math.abs(a - 127.5); bits[r].push(a > 127);
          }
        }
        if (!best || sharp > best.sharp) best = { sharp: sharp, bits: bits, w: w, h: h };
      });
    });
    // 굵게: 칸마다 오른쪽·아래로 한 칸씩 더 칠하되, 획 사이 한 칸 틈은 메우지 않는다(ㅋ·ㅌ처럼 촘촘한 글자가 뭉개지지 않게).
    // 라틴 글자(획 3칸)와 무게를 비슷하게. 16칸 높이 가운데에 둔다
    var b = best.bits, H = best.h + 1, Wd = best.w + 1, top = Math.round((16 - H) / 2), rows = [];
    function on(r, q) { return r >= 0 && q >= 0 && r < best.h && q < best.w && b[r][q]; }
    function bold(r, q) {
      return on(r, q) || (on(r, q - 1) && !on(r, q + 1)) || (on(r - 1, q) && !on(r + 1, q)) ||
        (on(r - 1, q - 1) && !on(r + 1, q - 1) && !on(r - 1, q + 1));
    }
    for (y = 0; y < 16; y++) {
      var s = '', r0 = y - top;
      for (i = 0; i < Wd; i++) s += bold(r0, i) ? '#' : '.';
      rows.push(s);
    }
    return (hcache[ch] = { rows: rows, lb: 0, adv: Wd + 2 });
  }
  function glyph(ch) {
    if (ch === ' ') return { rows: null, lb: 0, adv: ADV[' '] };
    var rows = FONT[ch] || (/[a-z]/.test(ch) && FONT[ch.toUpperCase()]);
    if (rows) return { rows: rows, lb: LB[ch] || 0, adv: ADV[ch] || 14 };
    return fallbackGlyph(ch);
  }
  // 글줄 폭(칸) — 마지막 글자는 글자 폭까지만(뒤 사이 빼고)
  function textUnits(str) {
    var u = 0, chars = Array.from(String(str || ''));
    chars.forEach(function (ch, i) {
      var gl = glyph(ch);
      u += i === chars.length - 1 ? (gl.rows ? gl.lb + gl.rows[0].length : 0) : gl.adv;
    });
    return u;
  }

  // ── 그리기(SVG 문자열 모으기) ──
  // 칸을 사각형 여러 개로 따로 그리면 맞닿은 줄 사이에 가는 틈(밝은 줄)이 생긴다(칸 크기가 정수 픽셀이 아니라서).
  // 그래서 같은 색 칸은 경로(path) 하나로 합쳐 그린다 — 한 경로 안에서 맞닿은 칸은 틈 없이 한 덩어리로 칠해진다.
  function n(v) { return Math.round(v * 100) / 100; }
  function sq(x0, y0, x1, y1) { return 'M' + n(x0) + ' ' + n(y0) + 'H' + n(x1) + 'V' + n(y1) + 'H' + n(x0) + 'Z'; }
  function rect(out, x, y, w, h, fill) { out.push('<path fill="' + fill + '" d="' + sq(x, y, x + w, y + h) + '"/>'); }
  // 둥근 네모 경로(카드 판 자르기 — 고리 구멍을 even-odd로 빼려고 rect 대신 경로로)
  function rrPath(x, y, w, h, r) {
    var a = 'A' + r + ' ' + r + ' 0 0 1 ';
    return 'M' + n(x + r) + ' ' + n(y) + 'H' + n(x + w - r) + a + n(x + w) + ' ' + n(y + r) + 'V' + n(y + h - r) + a + n(x + w - r) + ' ' + n(y + h) +
      'H' + n(x + r) + a + n(x) + ' ' + n(y + h - r) + 'V' + n(y + r) + a + n(x + r) + ' ' + n(y) + 'Z';
  }
  function paths(out, byCol, order) { order.forEach(function (col) { out.push('<path fill="' + col + '" d="' + byCol[col].join('') + '"/>'); }); }
  // 도트 그림: rows(글자 지도) + map(글자→색), 한 칸 ux×uy. 가로로 이어진 같은 색 칸은 한 칸으로, 색마다 경로 하나
  function bitmap(out, rows, map, x, y, ux, uy, flipX, flipY) {
    var h = rows.length, byCol = {}, order = [];
    for (var r = 0; r < h; r++) {
      var row = rows[flipY ? h - 1 - r : r], w = row.length, c = 0;
      while (c < w) {
        var ch = row[flipX ? w - 1 - c : c], col = map[ch];
        if (!col) { c++; continue; }
        var s = c;
        while (c < w && row[flipX ? w - 1 - c : c] === ch) c++;
        if (!byCol[col]) { byCol[col] = []; order.push(col); }
        // 맞닿은 칸의 경계는 같은 식으로 계산해서 숫자가 똑같이 나오게
        byCol[col].push(sq(x + s * ux, y + r * uy, x + c * ux, y + (r + 1) * uy));
      }
    }
    paths(out, byCol, order);
  }
  // 한글 또렷하게(11/24 가르시아 "한글은 도트 말고 또렷하게, 느낌은 비슷한 글씨체로"): render(o.hangul = '글꼴')이면
  // 한글이 든 글줄은 도트로 그리지 않고 자리만 적어 둔다(VEC) → paintText()가 캔버스에 그 글꼴로 덮어 쓴다.
  // SVG를 그림(Image)으로 그리면 웹 글꼴을 못 써서 캔버스에서 따로 그린다. 자리·크기는 도트 글자와 같은 칸.
  var VEC = null;
  // ── 칸 값 글씨체(11/24 밤 가르시아 "키링에 입력하는 텍스트는 뚜렷한 글씨체로") ──
  // render(o.vfont): 'clear' 또렷하게(Pretendard 800) · 'bold' 굵게(Black Han Sans) · 'dot'·없음 = 예전대로(영어·숫자는 도트, 한글은 o.hangul).
  // clear·bold면 칸 값(ID·NAME·TYPE·SKILL)은 영어·숫자까지 그 글꼴로 캔버스에 덮어 쓰고(VEC), 영어를 대문자로 바꾸지 않는다.
  // em: 글자 크기 1에 글자 폭(브라우저에서 잰 값 — 글꼴을 받기 전 어림용), fk: 같은 칸 높이에서 한글 높이가 Black Han Sans와 비슷하게 보이도록 줄이는 배수
  var VFONTS = {
    clear: { label: '또렷하게', family: "Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif", weight: 800, fk: 0.86,
      em: { han: 0.864, up: 0.683, low: 0.551, dig: 0.626, sp: 0.224, etc: 0.6 } },
    bold: { label: '굵게', family: "'Black Han Sans', Pretendard, sans-serif", weight: 0, fk: 1,
      em: { han: 0.834, up: 0.696, low: 0.634, dig: 0.6, sp: 0.3, etc: 0.6 } }
  };
  var VF = null, SZ = {}, EST = false;   // 지금 그리는 칸 값 글씨체 · 칸마다 글씨 크기 배수 · 글꼴을 못 받아 어림으로 잰 적 있음
  var HAN = /[가-힣ㄱ-ㅎㅏ-ㅣ]/, mctx = null;
  function fontSpec(F, px) { return (F.weight ? F.weight + ' ' : '') + px + 'px ' + F.family; }
  // 글줄 폭(글자 크기 1 기준) — 글꼴을 받아 뒀으면 재고, 아니면 어림
  function emOf(str, F) {
    str = String(str || '');
    try {
      if (document.fonts && document.fonts.check(fontSpec(F, 100), str)) {
        mctx = mctx || document.createElement('canvas').getContext('2d');
        mctx.font = fontSpec(F, 100);
        return mctx.measureText(str).width / 100;
      }
    } catch (e) { /* 어림으로 */ }
    EST = true;
    var m = F.em;
    return Array.from(str).reduce(function (a, c) {
      return a + (HAN.test(c) ? m.han : c === ' ' ? m.sp : /[A-Z]/.test(c) ? m.up : /[a-z]/.test(c) ? m.low : /[0-9]/.test(c) ? m.dig : m.etc);
    }, 0);
  }
  // 칸 값 글줄을 VEC에 — 지금 글씨체(VF)를 붙인다(paintText가 그 글꼴로 그림)
  function vpush(it) {
    if (VF) { it.font = VF.family; it.weight = VF.weight; it.fk = VF.fk; }
    VEC.push(it);
  }
  function text(out, str, x, y, ux, uy, fill, xs) {
    if (VEC && /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(String(str || ''))) { VEC.push({ s: String(str), x: x, y: y, w: textUnits(str) * ux, h: 16 * uy, fill: fill }); return; }
    // xs: 원본에서 잰 글자별 왼쪽 끝(띄어쓰기 빼고) — 원본 글자 자리를 그대로 따를 때. 없으면 글자 간격 14칸으로
    var cx = x, k = 0;
    Array.from(String(str || '')).forEach(function (ch) {
      var gl = glyph(ch);
      if (gl.rows) {
        var gx = (xs && xs[k] != null) ? xs[k] : cx + gl.lb * ux;
        bitmap(out, gl.rows, { '#': fill }, gx, y, ux, uy);
        k++;
      }
      cx += gl.adv * ux;
    });
  }

  // ── 제목 양옆 발바닥(29×27칸) ──
  var PAW = (function () {
    var W = 29, H = 27, m = [], r, c;
    for (r = 0; r < H; r++) { m.push([]); for (c = 0; c < W; c++) m[r].push('.'); }
    function fill(c0, c1, r0, r1, cut) {
      for (r = r0; r <= r1; r++) for (c = c0; c <= c1; c++) {
        if (cut && (r === r0 || r === r1) && (c === c0 || c === c1)) continue;   // 발가락 귀퉁이 한 칸 깎기
        m[r][c] = '#';
      }
    }
    fill(6, 11, 0, 6, true); fill(17, 22, 0, 6, true);      // 위 발가락
    fill(0, 5, 6, 12, true); fill(23, 28, 6, 12, true);     // 옆 발가락
    fill(10, 18, 10, 12); fill(8, 20, 13, 14); fill(5, 23, 15, 22); fill(8, 20, 23, 23); fill(10, 18, 24, 26);   // 발바닥
    return m.map(function (a) { return a.join(''); });
  })();
  // ── 사진 틀 귀퉁이(왼쪽 위, 9×9칸 · 한 칸 12.4px) ── D 테두리 · K 큰 마디 · B 작은 혹 · P 진한 띠 · L 연한 띠 · '.' 비움(아래 틀·사진이 보임)
  var KNOT = ['..DDD.DD.', '.DKKKDBBD', 'DKKKKKPPP', 'DKKKKKLLL', 'DKKKKKDDD', 'DKKKKD...', '.DPKKD...', 'DBPLD....', 'DBPLD....'];
  var OPAW = ['...##.##...', '...##.##...', '.##.....##.', '.##.###.##.', '...#####...', '..#######..', '..#######..', '..#######..', '...#####...'];

  // ── 자리(원본 픽셀) ── 한곳에 모아 둠(실측값 → 원본과 겹쳐서 가장 잘 맞는 값으로 다듬음)
  var L = {
    card: { x: 153.5, y: 171, w: 1214, h: 1618.5, r: 74 }, shadow: { dx: -29, dy: 39 },
    headB: 609.5, divB: 624.5,
    frame: { ol: 202.5, or: 862.5, ot: 688.5, ob: 1688.5, ux: 11.6, uy: 12.3 },    // 사진 틀 바깥 테두리의 바깥 끝 + 한 칸 크기(원본은 가로·세로 칸이 조금 달라서 따로). 귀퉁이 마디는 한 칸 더 바깥까지
    knot: { tl: [-2, -2], tr: [0.5, -2], bl: [0.5, 2], br: [0, 2] },             // 귀퉁이 마디별 미세 이동(원본이 귀퉁이마다 조금씩 다름)
    opaw: { x: 236.5, y: 723.5, u: 3.3 },                                  // 귀퉁이 주황 발바닥 가운데(왼쪽 위 기준, 나머지는 뒤집어서)
    field: { x: 896, w: 439.5, h: 150, u: 12.7, ys: [702.5, 893.5, 1083.5], splits: [1153.5, 1117.5, 1112.5] },
    labels: [   // 칸 이름 — 원본 글자 자리(xs = 글자별 왼쪽 끝)
      { t: 'ID No.', x: 926, y: 753, ux: 3.15, uy: 3.25, xs: [934, 970, 1033, 1079, 1122] },
      { t: 'NAME:', x: 926, y: 944, ux: 3.1, uy: 3.25, xs: [926, 971, 1016, 1062, 1105] },
      { t: 'TYPE:', x: 926, y: 1134, ux: 3.16, uy: 3.25, xs: [926, 969, 1013, 1056, 1100] }
    ],
    value: { gap: 21, ux: 3.2, uy: 3.25, right: 1312 },
    dash: { y: 1294.5, h: 15.5, x0: 928.5, pitch: 41.9, w: 26.5 },
    pill: { x: 949, y: 1365, w: 335, h: 125.5, u: 12.4, tx: 987, ty: 1402.5, tux: 3.03, tuy: 3.2, xs: [987, 1035, 1079, 1120, 1165, 1210] },
    qr: { x: 1108, y: 1532.5, w: 190, h: 205, size: 160 },
    title1: { x: 513.8, y: 370, ux: 5.877, uy: 5.835, xs: [513, 603, 688, 766, 850, 935] },
    title2: { x: 346, y: 502.5, ux: 5.06, uy: 4.96, xs: [346, 424, 499, 567, 642, 703, 776, 876, 946, 1019, 1090] },
    paws: [{ x: 393, y: 380.5 }, { x: 1044.5, y: 380.5 }], pawU: { x: 83 / 29, y: 80 / 27 },
    tagline: { y: 1725, u: 2.4 },
    // 키링판(11/24 가르시아 "샘플로 키링 무료 제작 의뢰 — 이름·견종 란을 편집할 수 있게, 사이즈 아담하니 좋아 대신 입력할 칸을 좀 바꿔야겠어,
    // 밑에 WALSON만 적혀 있는데 중복되니 좀만 개편" → 같은 날 "ID.만 쓰자, NAME이 왼쪽에 오는 게 맞아, 타입도, 간격을 조금 줄여서 배치"):
    // 칸은 원본처럼 한 줄(왼쪽 분홍에 칸 이름 · 오른쪽 흰 칸에 값), 칸 이름은 짧게(ID · NAME · TYPE — 콜론 뺌), 칸 이름 바로 뒤에서 나누고
    // 값 앞뒤 여백도 좁혀 값 자리를 넓힘(원본 174 → 204점, "포메라니안"이 덜 작아짐). 칸끼리 간격도 40 → 30점.
    // 이어서 "ID로 해. 밑에 NAME만큼 배경 간격 늘려" → 칸 이름은 "ID"(점 뺌), 분홍 칸은 세 칸 모두 가장 긴 칸 이름(NAME·TYPE)에 맞춰 같은 폭(값이 한 줄로 맞춰 시작)
    // 점선 아래 알약은 제목과 겹치는 WALSON 대신 홍보 문구 두 줄(사진 아래 한 줄은 뺌)
    kr: { nameH: 84, nameLatH: 62, nameFill: 0.74, typeMin: 0.8, typeShrink: 0.62, typeTwo: 0.62, twoGap: 8, ys: [702.5, 882.5, 1062.5],   // nameH·nameFill: 이름 글씨 높이·짧은 이름이 채울 칸 폭 비율(11/24 "두 글자면 더 차게, 자간 벌려")
      labels: ['ID No', 'NAME', 'TYPE'], lcol: ['NAME', 'TYPE'], kmax: 4.3, lux: 3.1, luy: 3.25, pad: 14, lgap: 8, vgap: 12, vpad: 10,
      dashY: 1255.5, pill: { y: 1314.5, h: 175, u: 12.4, ux: 2.75, uy: 2.9, gap: 14, pad: 20 },
      // 신호등·등급 뱃지 두 줄(알약 아래 ~ 사진 틀 아랫줄까지): 칸 높이 h, 사이 gap, 불 한 칸 lu
      light: { y: 1314.5, h: 78, solo: 150, gap: 16, u: 9.3, lu: 8 }, pillLow: 1513.5,   // 신호등·등급이 있으면 점선 바로 아래 두 줄, 홍보 알약은 맨 아래(11/24 가르시아 "유의미한 산책을 맨 아래로")
      // 특기 칸(11/24 밤 — 홍보 알약 자리를 사진 틀 아랫줄까지 키움, 등급 뱃지는 점선과 이 칸 사이 가운데): 위 분홍 띠(head)에 SKILL(hu = 글자 한 칸),
      // 아래 흰 칸에 특기 — base는 한 줄일 때 글씨 높이(글씨 크기 배수 1), 두 줄이면 사이 gap. idH = 또렷하게·굵게일 때 ID 숫자 높이
      skill: { top: 1473, bottom: 1688.5, head: 50, hu: 1.85, base: 72, gap: 10 }, idH: 76,
      // 특기 자리(11/24 밤 가르시아 "skill 이 배치가 조금 아쉬운데 다른 방법 없니?" → 시안 넷 중 "4안으로"): 등급 뱃지와 한 상자 —
      // combo = 점선 아래 간격 · 위 등급 띠 높이 · 특기 글씨 base(한 줄일 때 높이) · 두 줄 사이 gap2. 위 skill(띠 상자)은 등급이 없거나 신호등 줄이 있을 때만
      combo: { gap: 30, band: 128, base: 70, gap2: 10 } }
  };
  var LP = L;   // 세로판(원본 자리) — render가 opts.landscape면 잠깐 가로판(LL)으로 바꿔 그린다

  // ── 고리 구멍(11/24 밤 가르시아 "키링 카드 상단에 핑크 남는 영역 가운데 구멍 내 줘") ──
  // 12×12칸 도트 동그라미 — 테두리 한 칸(진한 갈색), 안은 비움(카드 판을 그 자리만 잘라 투명: 저장 그림에도 구멍으로 남고,
  // 3D 키링은 그 안 동그라미(holeGeo r)를 실제로 뚫는다). 한 칸 크기는 판마다 hole.u(세로 11 · 가로 12.6 — 실물 지름이 같게)
  var HOLE = ['....####....', '..##....##..', '.#........#.', '.#........#.', '#..........#', '#..........#', '#..........#', '#..........#',
    '.#........#.', '.#........#.', '..##....##..', '....####....'];
  var HOLE_IN = HOLE.map(function (row) {   // 테두리 안쪽 칸만 '#'
    var a = row.indexOf('#'), b = row.lastIndexOf('#'), s = '';
    for (var i = 0; i < row.length; i++) s += (i > a && i < b && row[i] === '.') ? '#' : '.';
    return s;
  });
  // 구멍 자리(원본 좌표) — x·y 가운데, r = 테두리 안에 들어가는 동그라미 반지름(3D가 뚫는 크기), s = 바깥 반 폭
  function holeGeo(H) {
    var u = H.u, r = Infinity;
    HOLE.forEach(function (row, j) {
      for (var i = 0; i < row.length; i++) if (row[i] === '#') {
        var dx = Math.max(i * u - 6 * u, 0, 6 * u - (i + 1) * u), dy = Math.max(j * u - 6 * u, 0, 6 * u - (j + 1) * u);
        r = Math.min(r, Math.sqrt(dx * dx + dy * dy));
      }
    });
    return { x: H.cx, y: H.cy, r: r, s: 6 * u };
  }
  // ── 키링 세로판(11/24 밤) — 원본 자리(LP) 그대로에 고리 구멍·맨 아래 홍보 한 줄만 더함 ──
  // 구멍: 카드 위 끝 ~ 제목 WALSON 위 사이 빈 분홍의 가운데. 홍보 한 줄: 카드를 아래로 FOOT만큼 늘려 사진 틀 아래 ~ 카드 아래 끝 가운데
  var FOOT = 56;
  var LK = Object.assign({}, LP, {
    card: Object.assign({}, LP.card, { h: LP.card.h + FOOT }),
    ref: { w: REF.w, h: REF.h + FOOT },
    hole: { cx: LP.card.x + LP.card.w / 2, cy: (LP.card.y + LP.title1.y) / 2, u: 8 },   // 11/25 가르시아 "키링 구멍 크기 좀 줄여 줘" 11 → 8
    foot: { h: 60 }   // 홍보 한 줄 글씨 높이
  });

  // ── 가로 키링판(11/24 가르시아 "사진을 첨부할 때 가로 버전도 있을 수 있어서 가로 버전 키링도 변형해서 만들자") ──
  // 같은 칸 크기·글꼴을 다시 배치: 위 머리띠(제목 두 줄을 0.9배로) · 왼쪽 가로 사진 틀(사진 칸 4:3 — 휴대폰 가로 사진 비율) ·
  // 오른쪽 ID·NAME·TYPE 칸(세로판의 0.93배 높이) + 점선 + 등급 뱃지 + 홍보 알약(한 줄). 카드 1700×1150(세로판 1214×1618.5) → 아래 구멍·홍보 한 줄 자리를 더해 1700×약 1427.
  // 원점(카드 왼쪽 위 153.5, 171)은 세로판과 같아서 바탕·그림자 장면도 그대로. 키링판에서만 쓴다(원본 칸·QR 자리는 없음)
  // 11/24 밤 가르시아 "가로 버전에서 상단에 구멍 낼 여유 공간 만들어 주고 구멍 내 줘" + "맨 아래 공간 내서 유의미한 산책": 머리띠 위에 구멍 자리(holeA —
  // 구멍 테두리 + 위아래 33점, 세로판과 같은 여백)를 더하고, 사진 틀 아래 여백을 50 → footA(홍보 한 줄 자리)로. 그 사이(사진 틀·칸)는 그 전 그대로
  var LL = (function () {
    var x0 = 153.5, y0 = 171, W = 1700, s = 0.9, div = 15;
    var t1v = 5.835 * s, t2v = 4.96 * s, tgap = 39 * s, titH = 16 * t1v + tgap + 16 * t2v, tpad = (270 - titH) / 2;   // 그 전 머리띠(270) 안 제목 위아래 여백
    var holeU = 12.6, holeA = 12 * holeU + 66, headH = holeA + titH + tpad, bodyH = 830, footA = 150, H = headH + bodyH + footA;
    var top = y0 + headH + div + 44, bot = y0 + headH + bodyH, ux = 11.6, uy = 12.3;
    var ph = bot - top - 8 * uy, fw = ph * 4 / 3 + 8 * ux, ol = x0 + 49, or = ol + fw, fx = or + 33.5, fw2 = x0 + W - 32 - fx;
    var ty1 = y0 + holeA;
    var rowH = 140, rowGap = 24, fs = rowH / 150, ys = [top, top + rowH + rowGap, top + 2 * (rowH + rowGap)];
    var dashY = ys[2] + rowH + 20, pillH = 118, pillLow = bot - pillH;
    return {
      ref: { w: W + 2 * x0, h: y0 + H + 210.5 },
      card: { x: x0, y: y0, w: W, h: H, r: 74 }, shadow: { dx: -29, dy: 39 },
      headB: y0 + headH, divB: y0 + headH + div,
      hole: { cx: x0 + W / 2, cy: y0 + holeA / 2, u: holeU * 8 / 11 },   // 구멍만 줄임(11/25), 위 자리 높이는 그대로 foot: { h: 62 },
      frame: { ol: ol, or: or, ot: top, ob: bot, ux: ux, uy: uy },
      knot: { tl: [0, 0], tr: [0, 0], bl: [0, 0], br: [0, 0] },
      opaw: { x: ol + 34, y: top + 35, u: 3.3 },
      field: { x: fx, w: fw2, h: rowH, u: 12.7, ys: ys },
      value: { gap: 21, ux: 3.2 * fs, uy: 3.25 * fs },
      dash: { h: 15.5, x0: fx + 32.5, pitch: 41.9, w: 26.5, n: Math.floor((fw2 - 3.4 - 32.5 - 26.5) / 41.9) },
      // 제목은 카드 가운데에(발바닥은 제목 양옆 gap만큼) — 자리는 render가 브랜드 이름 폭으로 셈
      title1: { y: ty1, ux: 5.877 * s, uy: t1v, center: true }, title2: { y: ty1 + 16 * t1v + tgap, ux: 5.06 * s, uy: t2v, center: true },
      pawU: { x: 83 / 29 * s, y: 80 / 27 * s }, pawGap: 34 * s,
      kr: { nameH: 84 * fs, nameLatH: 62 * fs, nameFill: 0.5,   /* 값 칸이 넓어서 짧은 이름을 덜 벌림 */ typeMin: 0.8, typeShrink: 0.62, typeTwo: 0.62, twoGap: 8 * fs, ys: ys,
        labels: ['ID No', 'NAME', 'TYPE'], lcol: ['NAME', 'TYPE'], kmax: 4.3 * fs, lux: 3.1 * fs, luy: 3.25 * fs, pad: 14, lgap: 8, vgap: 12, vpad: 10,
        dashY: dashY, pill: { y: pillLow, h: pillH, u: 12.4, ux: 2.75, uy: 2.9, gap: 14, pad: 20, one: true },
        light: { y: dashY + 35.5, h: 72, solo: 110, soloSk: 92, gap: 14, u: 9.3, lu: 7 }, pillLow: pillLow,
        // 특기 칸(11/24 밤): 알약(118)보다 높게 사진 틀 아랫줄부터 150 — 등급 뱃지는 그만큼 낮게(soloSk)
        skill: { top: bot - 150, bottom: bot, head: 40, hu: 1.5, base: 56, gap: 6 }, idH: 76 * fs,
        combo: { gap: 18, band: 86, base: 56, gap2: 6 } }
    };
  })();
  function photoBox() {
    var F = L.frame;
    return { x: F.ol + 4 * F.ux, y: F.ot + 4 * F.uy, w: F.or - F.ol - 8 * F.ux, h: F.ob - F.ot - 8 * F.uy };
  }

  // 계단 모서리 상자(칸·알약): 모서리 한 칸 깎은 테두리 u, 안은 fills([[x0,x1,색],…]) — 세로로 나눈 칸. bands([[y0,y1,색],…])는 가로 띠(특기 칸 위 분홍 띠)
  function stepBox(out, x, y, w, h, u, fills, bands) {
    fills.forEach(function (f) { rect(out, f[0], y + u, f[1] - f[0], h - 2 * u, f[2]); });
    (bands || []).forEach(function (b) { rect(out, x + u, b[0], w - 2 * u, b[1] - b[0], b[2]); });
    // 테두리(위·아래·옆 + 귀퉁이 한 칸)를 경로 하나로 — 이음매에 틈이 안 생기게
    var d = sq(x + 2 * u, y, x + w - 2 * u, y + u) + sq(x + 2 * u, y + h - u, x + w - 2 * u, y + h) +
      sq(x, y + 2 * u, x + u, y + h - 2 * u) + sq(x + w - u, y + 2 * u, x + w, y + h - 2 * u) +
      sq(x + u, y + u, x + 2 * u, y + 2 * u) + sq(x + w - 2 * u, y + u, x + w - u, y + 2 * u) +
      sq(x + u, y + h - 2 * u, x + 2 * u, y + h - u) + sq(x + w - 2 * u, y + h - 2 * u, x + w - u, y + h - u);
    out.push('<path fill="' + COL.ink + '" d="' + d + '"/>');
  }
  function qrRects(out, url, x, y, size) {
    if (!window.qrcode || !url) return;
    var q = window.qrcode(0, 'M'); q.addData(url); q.make();
    var m = q.getModuleCount(), cell = size / m, d = '';
    for (var r = 0; r < m; r++) {
      var c = 0;
      while (c < m) {
        if (!q.isDark(r, c)) { c++; continue; }
        var s = c; while (c < m && q.isDark(r, c)) c++;
        d += sq(x + s * cell, y + r * cell, x + c * cell, y + (r + 1) * cell);
      }
    }
    out.push('<path fill="' + COL.qr + '" d="' + d + '"/>');
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  // 홍보 문구를 두 줄로 — 띄어쓰기 자리 중 두 줄 폭이 가장 비슷한 곳에서 나눈다(한 단어면 한 줄). wf = 글줄 폭 재는 법(없으면 도트 칸 수)
  function twoLines(s, wf) {
    wf = wf || textUnits;
    var words = String(s || '').trim().split(/\s+/), best = [words.join(' '), ''], bw = Infinity;
    for (var i = 1; i < words.length; i++) {
      var a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), w = Math.max(wf(a), wf(b));
      if (w <= bw) { bw = w; best = [a, b]; }   // 같으면 윗줄이 긴 쪽("식탁 밑 아련한 / 눈빛 빔")
    }
    return best;
  }
  // 키링판 칸: 원본처럼 한 줄 — 왼쪽 분홍(칸 이름) · 오른쪽 흰 칸(값). 분홍 칸은 세 칸이 같은 폭(가장 긴 칸 이름 바로 뒤까지)이라
  // 값이 한 줄로 맞춰 시작한다(길면 칸에 맞게 줄임)
  // 또렷한 한글 글꼴(Black Han Sans) 글줄 폭 어림 — 글자 크기 1에 한글 0.84 · 띄어쓰기 0.3 · 그 밖 0.7(브라우저에서 잰 값)
  function vecEm(str) {
    return Array.from(str).reduce(function (a, c) { return a + (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(c) ? 0.84 : c === ' ' ? 0.3 : 0.7); }, 0);
  }
  // 칸 글씨 크기(11/24 밤 가르시아 "글씨 크기 조절도 되면 좋겠어"): o.sizes = { id, name, type, skill } 배수(1 = 칸에 맞춘 기본, 0.5~1.6).
  // 칸 높이보다 커지지 않고, 칸 폭보다 길면 칸에 맞게 줄어든다(그래서 아주 긴 글은 키워도 그대로일 수 있다)
  function sizeOf(key) { var s = Number(SZ[key]); return isFinite(s) && s > 0 ? Math.max(0.5, Math.min(1.6, s)) : 1; }
  // 또렷하게·굵게(VF)일 때 글줄 폭 — 글씨 높이 h로 그리면(paintText 글자 크기 = h × 1.02 × fk)
  function vfW(str, h) { return emOf(str, VF) * 1.02 * VF.fk * h; }
  // 긴 견종(11/24 가르시아 "타입 칸도 가변적으로, 엄청 길면 두 줄로"): 견종 칸(center === 'fit')만
  //   ① 견종 글씨가 typeMin보다 작아질 만큼 길면 TYPE 글자·분홍 칸을 줄여(최소 typeShrink배) 흰 칸을 넓힌다
  //   ② 그래도 작으면(한글만 — 또렷하게·굵게면 영어도) 띄어쓰기에서 두 줄로. 보통 길이(포메라니안 등)는 그대로
  // key: 글씨 크기 배수 이름(id·name·type). center: false 왼쪽(ID) · 'grow' 이름 · 'fit' 견종
  // 줄바꿈(11/24 밤 가르시아 "견종 줄바꿈 가능하게"): 견종 칸은 사용자가 나눈 두 줄 그대로(줄바꿈 두 번째부터는 띄어쓰기로), 다른 칸은 한 줄로
  function keyringBox(out, label, value, y, center, key) {
    var FD = L.field, K = L.kr, V = L.value, x = FD.x, w = FD.w, u = FD.u, h = FD.h, sz = sizeOf(key);
    var T = splitText(value), manual = center === 'fit' && Array.isArray(T) ? T : null;
    var v = Array.isArray(T) ? T.join(' ') : T;
    var lw = Math.max.apply(null, (K.lcol || K.labels).map(textUnits)), lx = x + u + K.pad, ls = 1, two = null;   // 분홍 칸 폭 = NAME·TYPE 바로 뒤까지
    // 칸 이름 글자 크기는 세 칸 모두 같게 — 가장 긴 칸 이름(ID No.)이 분홍 칸에 맞는 크기로(11/25 가르시아 "NAME이랑 TYPE을 위 ID No.에 맞게")
    var lf = Math.min(1, lw / Math.max(textUnits(label), Math.max.apply(null, K.labels.map(textUnits))));
    var vh = 16 * K.kmax * V.uy / V.ux * 0.8, isHan = VEC && /[가-힣]/.test(v), vec = !!VF || isHan;
    var hmax = (h - 2 * u) * 0.92;   // 칸 안쪽 높이 — 글씨는 이보다 커지지 않게
    if (vec || manual) vh = Math.min(hmax, vh * sz);
    function wEm(s) { return lineW(s, 1); }   // 글씨 높이 1일 때 폭
    if (center === 'fit' && v) {
      var full = x + w - u - (lx + lw * K.lux + K.lgap) - u;   // 지금 흰 칸에서 글씨가 쓸 수 있는 폭(가장자리 반 칸씩 뺌)
      if (manual) {   // 사용자가 나눈 두 줄 — 두 줄 높이로 재서 넘치면 TYPE 칸을 줄인다
        var lh0 = Math.min(vh, (h - 2 * u - K.twoGap) / 2 * 0.96), needM = Math.max(wEm(manual[0]), wEm(manual[1])) * lh0 / 0.9;
        two = manual;   // 분홍 칸은 줄이지 않는다(11/25 — 세 칸 분홍 폭을 같게), 넘치면 글씨가 칸에 맞게 작아진다
      } else {
        var need = vec ? wEm(v) * vh / 0.9 : textUnits(v) * V.ux * sz;   // 제 크기로 쓰려면 필요한 폭
        // 분홍 칸은 줄이지 않고(11/25 — 세 칸 분홍 폭·칸 이름 크기를 ID No.와 같게), 아주 길면 띄어쓰기에서 두 줄
        if (vec && need * K.typeTwo > full && /\s/.test(v)) two = twoLines(v, wEm);
      }
    }
    var sp = lx + lw * K.lux * ls + K.lgap;
    stepBox(out, x, y, w, h, u, [[x + u, sp, COL.label], [sp, x + w - u, COL.value]]);
    text(out, label, lx, y + (h - 16 * K.luy * ls * lf) / 2, K.lux * ls * lf, K.luy * ls * lf, COL.ink);
    if (!v) return;
    if (two) {   // 두 줄: 한 줄 높이를 칸 안쪽 높이에 맞춰 나눔, 둘 다 같은 크기(긴 줄에 맞춤)
      var cl2 = sp + u * 0.5, cw2 = x + w - u - cl2 - u * 0.5, lh = Math.min(vh, (h - 2 * u - K.twoGap) / 2 * 0.96),
        lw2 = Math.max(wEm(two[0]), wEm(two[1]));
      lh = Math.min(lh, cw2 * 0.9 / lw2);
      var ty0 = y + (h - (2 * lh + K.twoGap)) / 2;
      two.forEach(function (s, i) { lineDraw(out, s, cl2 + cw2 / 2, ty0 + i * (lh + K.twoGap), lh, cw2 * 0.9); });
      return;
    }
    if (VF) {   // 또렷하게·굵게: 영어·숫자도 글꼴로 — 이름은 크게(짧으면 자간을 벌려 칸을 채움), 견종은 흰 칸 가운데, ID는 왼쪽 맞춤
      var vcl = sp + u * 0.5, vcw = x + w - u - vcl - u * 0.5;
      if (center === 'grow') { var nh = Math.min(hmax, K.nameH * sz); vpush({ s: v, x: vcl, y: y + (h - nh) / 2, w: vcw, h: nh, fill: COL.ink, fit: true, spread: K.nameFill }); return; }
      if (center) { vpush({ s: v, x: vcl, y: y + (h - vh) / 2, w: vcw, h: vh, fill: COL.ink, fit: true }); return; }
      var ih = Math.min(hmax, K.idH * sz);   // ID: 흰 칸 가운데(11/24 밤 "숫자도 가운데 정렬로")
      vpush({ s: v, x: vcl, y: y + (h - ih) / 2, w: vcw, h: ih, fill: COL.ink, fit: true }); return;
    }
    // 한글 값은 둥근모꼴 도트라 같은 크기면 영문보다 가늘고 작아 보여서 더 크게(11/24 가르시아 "이름 글씨 잘 안 보이네") — 칸 폭이 허락하는 만큼
    var vmax = /[가-힣]/.test(v) ? K.kmax : V.ux, uxMax = hmax / 16 * V.ux / V.uy;   // 도트 글씨도 칸 높이까지만
    var vx = sp + K.vgap, avail = (x + w - u - K.vpad) - vx, ux = Math.min(vmax * sz, uxMax, avail / textUnits(v)), uy = ux * V.uy / V.ux;
    if (isHan) {   // 또렷한 한글: 칸 폭 전체를 쓰고 왼쪽 맞춤(긴 견종도 덜 작게 — 글꼴이 도트보다 좁다)
      if (center === 'grow') vh = Math.min(hmax, K.nameH * sz);   // 이름: 크게 + 짧으면 자간을 벌려 칸을 채움(paintText spread)
      if (center) { var cl = sp + u * 0.5, cw = x + w - u - cl - u * 0.5; VEC.push({ s: v, x: cl, y: y + (h - vh) / 2, w: cw, h: vh, fill: COL.ink, fit: true, spread: center === 'grow' ? K.nameFill : 0 }); return; }
      var icl = sp + u * 0.5; VEC.push({ s: v, x: icl, y: y + (h - vh) / 2, w: x + w - u - icl - u * 0.5, h: vh, fill: COL.ink, fit: true }); return;   // ID도 가운데
    }
    if (center === 'grow') {   // 영문 이름도: 칸 높이가 허락하는 만큼 크게, 짧으면 글자 사이를 벌려 칸의 nameFill만큼 채움
      var aw = x + w - u - sp - 2 * K.vpad, nu = textUnits(v);
      ux = Math.min(K.nameLatH / 16 * V.ux / V.uy * sz, uxMax, aw * 0.9 / nu); uy = ux * V.uy / V.ux;   // 도트 영문은 칸 높이 꽉 차 보여서 한글보다 낮게
      var chars = Array.from(v), glyphs = chars.filter(function (c) { return c !== ' '; }).length,
        gapx = glyphs > 1 ? Math.max(0, Math.min(ux * 8, (aw * K.nameFill - nu * ux) / (chars.length - 1))) : 0,
        tw = nu * ux + gapx * (chars.length - 1), cx0 = sp + (x + w - u - sp - tw) / 2, xs = [];
      chars.forEach(function (c) { var gl = glyph(c); if (gl.rows) xs.push(cx0 + gl.lb * ux); cx0 += gl.adv * ux + gapx; });
      text(out, v, 0, y + (h - 16 * uy) / 2, ux, uy, COL.ink, xs); return;
    }
    vx = sp + (x + w - u - sp - textUnits(v) * ux) / 2;   // 견종·ID 모두 흰 칸 가운데
    text(out, v, vx, y + (h - 16 * uy) / 2, ux, uy, COL.ink);
  }

  // ── 특기 칸(11/24 밤 가르시아 "키링 맨 아래 칸에 유의미한 산책 빼고 특기를 골라서 넣는 걸로, 또는 직접 적어 넣기") ──
  // (같은 날 "4안으로" 뒤엔 아래 comboBox — 등급 뱃지와 한 상자가 기본. 이 띠 상자는 등급이 없거나 신호등 줄이 있을 때·skillAt 'box')
  // 홍보 문구 알약 자리(사진 틀 아랫줄까지 키움). 위 분홍 띠에 SKILL · 아래 흰 칸에 특기 — 세로판·가로판 같은 모양
  // (가로판도 처음엔 다른 칸처럼 왼쪽에 SKILL을 뒀더니 특기 글씨가 너무 작아서 위 띠로).
  // 특기는 한 줄 — 칸보다 길면 띄어쓰기에서 두 줄(두 줄이 더 크게 보일 때), 그래도 길면 칸에 맞게 줄임. 비우면 빈 흰 칸(ID처럼)
  function skillRect(o) {
    var K = L.kr, FD = L.field, S = K.skill, LT = K.light, top = S.top;
    if (o.signal != null) top = Math.max(top, LT.y + LT.h + (o.grade != null ? LT.gap + LT.h : 0) + 16);   // 신호등 줄까지 있으면 그 아래
    return { x: FD.x, y: top, w: FD.w, h: S.bottom - top };
  }
  // 글줄 하나의 폭(글씨 높이 h로 그릴 때)·그리기 — 또렷하게·굵게(VF) / 한글(o.hangul 글꼴) / 도트 영문
  function lineW(str, h) {
    if (VF) return vfW(str, h);
    if (VEC && HAN.test(str)) return vecEm(str) * 1.02 * h;
    return textUnits(str) * h / 16 * L.value.ux / L.value.uy;
  }
  function lineDraw(out, str, cx, top, h, mw) {
    if (VF || (VEC && HAN.test(str))) { vpush({ s: str, x: cx - mw / 2, y: top, w: mw, h: h, fill: COL.ink, fit: true, mw: mw }); return; }
    var uy = h / 16, ux = uy * L.value.ux / L.value.uy;
    text(out, str, cx - textUnits(str) * ux / 2, top, ux, uy, COL.ink);
  }
  // 칸 글자 — 사용자가 줄을 나눴으면 [윗줄, 아랫줄](두 번째 줄바꿈부터는 띄어쓰기로), 아니면 한 줄. 도트 글꼴이면 대문자
  function splitText(value) {
    var parts = String(value || '').replace(/\r/g, '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!VF) parts = parts.map(function (s) { return s.toUpperCase(); });
    if (!parts.length) return '';
    return parts.length >= 2 ? [parts[0], parts.slice(1).join(' ')] : parts[0];
  }
  // 글줄 맞추기: 가운데(cx, cy)에 W×H 안으로 — 한 줄(칸보다 길면 줄임) 또는 두 줄(띄어쓰기에서, 두 줄이 더 크게 보일 때).
  // v가 [윗줄, 아랫줄]이면 사용자가 나눈 두 줄 그대로. want = 한 줄일 때 글씨 높이(글씨 크기 배수까지 곱한 것), gap = 두 줄 사이
  function drawFit(out, v, cx, cy, W, H, want, gap) {
    var lines, lh;
    if (Array.isArray(v)) {
      lines = v; lh = Math.min(want, (H - gap) / 2);
      var wm = Math.max(lineW(v[0], lh), lineW(v[1], lh));
      if (wm > W) lh *= W / wm;
    } else {
      lines = [v]; lh = Math.min(want, H);
      var w1 = lineW(v, lh);
      if (w1 > W) {
        lh *= W / w1;   // 한 줄로 줄이면 이 높이
        if (/\s/.test(v)) {
          var two = twoLines(v, function (s) { return lineW(s, 1); }), h2 = Math.min(want, (H - gap) / 2),
            w2 = Math.max(lineW(two[0], h2), lineW(two[1], h2));
          if (w2 > W) h2 *= W / w2;
          if (h2 > lh * 1.04) { lines = two; lh = h2; }   // 두 줄이 조금이라도 크면 두 줄(칸이 높아서 두 줄이 꽉 차 보인다)
        }
      }
    }
    var tot = lines.length * lh + (lines.length - 1) * gap, ty = cy - tot / 2;
    lines.forEach(function (s, i) { lineDraw(out, s, cx, ty + i * (lh + gap), lh, W); });
  }
  function skillBox(out, value, R) {
    var K = L.kr, S = K.skill, u = K.pill.u, x = R.x, y = R.y, w = R.w, h = R.h, A;
    var hb = S.head, hy = y + u, hux = S.hu * K.lux / K.luy, v = splitText(value);
    stepBox(out, x, y, w, h, u, [[x + u, x + w - u, COL.value]], [[hy, hy + hb, COL.label]]);
    text(out, 'SKILL', x + w / 2 - textUnits('SKILL') * hux / 2, hy + (hb - 16 * S.hu) / 2, hux, S.hu, COL.ink);
    A = { x: x + u, y: hy + hb, w: w - 2 * u, h: h - 2 * u - hb };
    if (v) drawFit(out, v, A.x + A.w / 2, A.y + A.h / 2, A.w * 0.86, A.h * 0.86, S.base * sizeOf('skill'), S.gap);
  }

  // ── 특기 자리(11/24 밤 가르시아 "skill 이 배치가 조금 아쉬운데 다른 방법 없니?" → 시안 넷 비교 → "4안으로") ──
  // 기본 'badge' = 등급 뱃지와 한 상자: 점선 아래 ~ 사진 틀 아랫줄까지 한 상자, 위 띠에 발바닥 + 산책 등급 · 아래 흰 칸에 특기.
  // 'box' = 그 전 모양(등급 아래 SKILL 띠 상자) — opts.skillAt: 'box'로 고르거나, 등급이 없거나 신호등 줄이 있을 때.
  // 비교한 다른 두 안(TYPE 아래 네 번째 칸 · 사진 아래쪽 이름표)은 커밋 d6528e9에 남아 있다
  function skillMode(o) {
    if (o.signal != null || o.grade == null) return 'box';
    return o.skillAt === 'box' ? 'box' : 'badge';
  }
  // 판 고르기 — 가로판 · 키링 세로판(특기를 주는 것 = [워킹패스] 키링 카드·3D 키링: 구멍·홍보 한 줄) · 원본 자리(트레이싱 비교 시안)
  function layoutFor(o) { return o.landscape ? LL : (o.keyring && o.skill != null ? LK : LP); }
  function comboRect() {
    var K = L.kr, C = K.combo, top = K.dashY + L.dash.h + C.gap;
    return { x: L.field.x, y: top, w: L.field.w, h: L.frame.ob - top };
  }
  function comboBox(out, value, lv) {
    var K = L.kr, C = K.combo, R = comboRect(), u = K.light.u, v = splitText(value);
    lv = Math.max(0, Math.min(3, lv | 0));
    if (!v) {   // 특기를 비우면 등급 뱃지만 — 점선과 사진 틀 아랫줄 사이 가운데(그 전 등급만 있을 때와 같은 크기)
      var gh = K.light.solo, mid = (K.dashY + L.dash.h + L.frame.ob) / 2;
      gradeBadge(out, R.x, mid - gh / 2, R.w, gh, lv);
      return;
    }
    stepBox(out, R.x, R.y, R.w, R.h, u, [[R.x + u, R.x + R.w - u, COL.value]], [[R.y + u, R.y + u + C.band, GRADE_COL[lv]]]);
    badgeInner(out, R.x, R.y, R.w, C.band + 2 * u, lv);
    var A = { x: R.x + u, y: R.y + u + C.band, w: R.w - 2 * u, h: R.h - 2 * u - C.band };
    drawFit(out, v, A.x + A.w / 2, A.y + A.h / 2, A.w * 0.86, A.h * 0.82, C.base * sizeOf('skill'), C.gap2);
  }
  // 편집 창이 크게 볼 특기 자리(카드 좌표)
  function skillSpot(o, m) { return m === 'badge' ? comboRect() : skillRect(o); }

  // 성향 신호등(뒷면 성향 칸과 같은 색 — 0 다가와도 좋아요 초록 · 1 천천히 인사해요 노랑 · 2 눈으로만 빨강): 진한 판에 불 셋, 고른 불만 켬
  var LAMP = ['..###..', '.#####.', '###*###', '#######', '#######', '.#####.', '..###..'];
  var SIG_COL = ['#3f9b5b', '#e8b02a', '#d2493f'], SIG_OFF = '#7a4b45';
  function signalLight(out, x, y, w, h, on) {
    var LT = L.kr.light, u = LT.u, lu = LT.lu, d = 7 * lu;
    stepBox(out, x, y, w, h, u, [[x + u, x + w - u, '#5c2a25']]);
    var inner = w - 2 * u, step = inner / 3;
    for (var i = 0; i < 3; i++) {
      var lx = x + u + step * i + (step - d) / 2, ly = y + (h - d) / 2, lit = i === on;
      bitmap(out, LAMP, { '#': lit ? SIG_COL[i] : SIG_OFF, '*': lit ? SIG_COL[i] : SIG_OFF }, lx, ly, lu, lu);
      if (lit) rect(out, lx + 2 * lu, ly + lu, lu, lu, '#ffffff');   // 반짝 한 칸
    }
  }
  // 산책 등급 뱃지(reward-rules.js RANKS 이름 그대로) — 등급이 오를수록 진한 분홍, 앞에 발바닥
  var GRADES = ['산책 입문자', '산책 러버', '프로 산책러', '핑크 앰배서더'], GRADE_COL = ['#fde0dc', '#fdcfd3', '#fbb8bf', '#feafc7'];
  function gradeBadge(out, x, y, w, h, lv) {
    lv = Math.max(0, Math.min(3, lv | 0));
    var u = L.kr.light.u;
    stepBox(out, x, y, w, h, u, [[x + u, x + w - u, GRADE_COL[lv]]]);
    badgeInner(out, x, y, w, h, lv);
  }
  // 뱃지 안쪽 — (x, y, w, h)는 테두리까지 친 상자 크기
  function badgeInner(out, x, y, w, h, lv) {
    var LT = L.kr.light, KP = L.kr.pill, u = LT.u, name = GRADES[lv];
    var pu = Math.min(2.6, (h - 2 * u - 20) / 27), pw = 29 * pu, gap = 18,   // 발바닥은 너무 커지지 않게, 글씨는 칸 높이 따라 조금 크게
      tux = Math.min(KP.ux * 1.05 * Math.min(1.35, h / 78), (w - 2 * u - 40 - pw - gap) / textUnits(name)), tuy = tux * KP.uy / KP.ux,
      total = pw + gap + textUnits(name) * tux, sx = x + (w - total) / 2;
    bitmap(out, PAW, { '#': lv === 3 ? COL.divider : COL.paw }, sx, y + (h - 27 * pu) / 2, pu, pu);
    text(out, name, sx + pw + gap, y + (h - 16 * tuy) / 2, tux, tuy, COL.ink);
  }

  // ── 카드 색(11/24 가르시아 "기본은 핑크고 저 색깔 변경 가능하게 기능 추가해 줘") ──
  // 분홍 계열 칸만 다른 색 계열로 옮긴다: 머리띠·아래 줄·사진 틀 띠·귀퉁이 마디·칸 이름·알약·점선·등급 뱃지(바탕 장면의 바탕·그림자도).
  // 크림 바탕·진한 갈색 글씨·흰 값 칸·귀퉁이 주황 발바닥은 그대로. 분홍 하나하나의 밝기는 두고 색상(hue)만 옮기고(분홍끼리의 차이는 spread배),
  // 계열마다 채도를 맞춘다(sat배) — 그래서 어느 색이든 원본 분홍과 같은 짜임으로 보인다
  var TINTS = [
    { id: 'pink', label: '핑크' },
    { id: 'mint', label: '민트', hue: 158, sat: 0.62, spread: 0.8 },
    { id: 'sky', label: '하늘', hue: 207, sat: 0.8, spread: 0.7 },
    { id: 'lemon', label: '레몬', hue: 48, sat: 0.95, spread: 0.35 },
    { id: 'lavender', label: '라벤더', hue: 266, sat: 0.62, spread: 0.7 },
    { id: 'gray', label: '그레이', hue: 220, sat: 0.1, spread: 0 }
  ];
  var TINT_KEYS = ['bg', 'shadow', 'head', 'divider', 'frameP', 'frameL', 'knob', 'bump', 'label', 'pill', 'dash', 'dashSoft', 'dashFaint'];
  var BASE_COL = COL, BASE_GRADE = GRADE_COL, tintCache = {};
  function toHsl(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return [h, s, l];
  }
  function toHex(h, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return '#' + [r, g, b].map(function (v) { return ('0' + Math.round(Math.max(0, Math.min(1, v + m)) * 255).toString(16)).slice(-2); }).join('');
  }
  function tintHex(hex, t) {
    var a = toHsl(hex), dh = ((a[0] - 355 + 540) % 360) - 180;   // 분홍 기준(355°)에서 떨어진 만큼(−180~180)
    return toHex((((t.hue + dh * (t.spread == null ? 1 : t.spread)) % 360) + 360) % 360, Math.min(1, a[1] * t.sat), a[2]);
  }
  function colorsFor(id) {
    var t = null;
    TINTS.forEach(function (x) { if (x.id === id) t = x; });
    if (!t || t.hue == null) return { col: BASE_COL, grade: BASE_GRADE };
    if (tintCache[id]) return tintCache[id];
    var col = {};
    Object.keys(BASE_COL).forEach(function (k) { col[k] = TINT_KEYS.indexOf(k) >= 0 ? tintHex(BASE_COL[k], t) : BASE_COL[k]; });
    return (tintCache[id] = { col: col, grade: BASE_GRADE.map(function (c) { return tintHex(c, t); }) });
  }

  // opts: { photo: dataURL(사진 칸 크기 그대로 넣음), id, name, type, qr(주소), tagline(true/false), scene('ref'=바탕·그림자까지 | 'card'=카드만), brand,
  //         keyring(true = 키링판 — 칸 이름 짧게·간격 좁혀 값 자리 넓힘, 아래 알약에 홍보 문구),
  //         signal(0~2)·grade(0~3) — 키링판에서 주면 QR 대신 성향 신호등·산책 등급 뱃지,
  //         landscape(true = 가로판, 키링판으로 그림) · color(TINTS id — 없으면 핑크),
  //         skill(키링판 특기 — 주면 홍보 문구 알약 대신 등급 뱃지와 한 상자로, 비우면 등급 뱃지만 · 줄바꿈 하나는 두 줄) ·
  //         skillAt('box' — 그 전 등급 아래 SKILL 띠 상자) · vfont('clear'|'bold'|'dot' 칸 값 글씨체) ·
  //         sizes({ id, name, type, skill } 칸마다 글씨 크기 배수) }
  // 그리는 동안만 자리(L)·색(COL·GRADE_COL)·글씨체(VF)·크기(SZ)를 바꿨다가 되돌린다(아래 도구들이 그대로 읽는다)
  function render(o) {
    o = o || {};
    var keepL = L, keepC = COL, keepG = GRADE_COL, pc = colorsFor(o.color);
    L = layoutFor(o); COL = pc.col; GRADE_COL = pc.grade;
    VF = VFONTS[o.vfont] || null; SZ = o.sizes || {}; EST = false;
    try { return renderNow(o); } finally { L = keepL; COL = keepC; GRADE_COL = keepG; VEC = null; VF = null; SZ = {}; }
  }
  function renderNow(o) {
    var B = o.brand || (window.WALSON_CONFIG && WALSON_CONFIG.brand) || { name: 'WALSON', tagline: '당신과 강아지의 유의미한 산책' };
    var R = L.ref || REF, C = L.card, F = L.frame, P = photoBox(), card = o.scene === 'card', out = [], KR = !!o.keyring || !!o.landscape;
    var vb = card ? [C.x, C.y, C.w, C.h] : [0, 0, R.w, R.h];
    VEC = (o.hangul || VF) ? [] : null;
    // est: 글꼴을 받기 전이라 글줄 폭을 어림으로 잰 적 있음 — 쓰는 쪽은 fontsReady 뒤에 한 번 더 그리면 줄 나눔까지 정확하다
    api.lastText = VEC ? { list: VEC, vb: vb, font: o.hangul || VF.family, est: false } : null;
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb.join(' ') + '" width="' + vb[2] + '" height="' + vb[3] + '">');
    // 고리 구멍(11/24 밤, 키링판) — 카드 판(머리띠)을 구멍 안쪽 칸만큼 잘라 낸다(even-odd: 둥근 네모 + 안쪽 칸 줄 — 그 자리는 투명)
    var HG = KR && L.hole ? holeGeo(L.hole) : null,
      cardClip = '<rect x="' + C.x + '" y="' + C.y + '" width="' + C.w + '" height="' + C.h + '" rx="' + C.r + '"/>';
    if (HG) {
      var hu = L.hole.u, hx0 = HG.x - HG.s, hy0 = HG.y - HG.s, hd = rrPath(C.x, C.y, C.w, C.h, C.r);
      HOLE_IN.forEach(function (row, j) {
        var c = 0;
        while (c < row.length) {
          if (row[c] !== '#') { c++; continue; }
          var s0 = c; while (c < row.length && row[c] === '#') c++;
          hd += sq(hx0 + s0 * hu, hy0 + j * hu, hx0 + c * hu, hy0 + (j + 1) * hu);
        }
      });
      cardClip = '<path clip-rule="evenodd" d="' + hd + '"/>';
    }
    out.push('<defs><clipPath id="pt-card">' + cardClip + '</clipPath>' +
      '<clipPath id="pt-photo"><rect x="' + n(P.x) + '" y="' + n(P.y) + '" width="' + n(P.w) + '" height="' + n(P.h) + '"/></clipPath></defs>');
    if (!card) {
      rect(out, 0, 0, R.w, R.h, COL.bg);
      out.push('<rect x="' + (C.x + L.shadow.dx) + '" y="' + (C.y + L.shadow.dy) + '" width="' + C.w + '" height="' + C.h + '" rx="' + C.r + '" fill="' + COL.shadow + '"/>');
    }
    // 카드 판: 머리띠 · 아래 줄 · 크림 바탕(둥근 모서리로 자름)
    out.push('<g clip-path="url(#pt-card)">');
    rect(out, C.x, C.y, C.w, C.h, COL.body);
    rect(out, C.x, C.y, C.w, L.headB - C.y, COL.head);
    rect(out, C.x, L.headB, C.w, L.divB - L.headB, COL.divider);
    out.push('</g>');

    // 사진 틀(겹 테두리 — 바깥에서 안으로 한 칸씩) + 사진. 귀퉁이 마디는 그 위에 덮는다
    var ux = F.ux, uy = F.uy, px = [];
    function ring(k, col) { rect(px, F.ol + k * ux, F.ot + k * uy, F.or - F.ol - 2 * k * ux, F.ob - F.ot - 2 * k * uy, col); }
    ring(0, COL.ink); ring(1, COL.frameP); ring(2, COL.frameL); ring(3, COL.ink);   // 바깥 테두리 · 진한 띠 · 연한 띠 · 안쪽 테두리
    rect(px, P.x, P.y, P.w, P.h, COL.white);
    out.push('<g shape-rendering="crispEdges">' + px.join('') + '</g>');
    if (o.photo) out.push('<image href="' + esc(o.photo) + '" x="' + n(P.x) + '" y="' + n(P.y) + '" width="' + n(P.w) + '" height="' + n(P.h) +
      '" preserveAspectRatio="none" clip-path="url(#pt-photo)" style="image-rendering:pixelated"/>');

    var g1 = [];
    // 귀퉁이 마디 넷(왼쪽 위를 뒤집어서) + 주황 발바닥
    var KMAP = { D: COL.ink, K: COL.knob, B: COL.bump, P: COL.frameP, L: COL.frameL };
    [['tl', false, false], ['tr', true, false], ['bl', false, true], ['br', true, true]].forEach(function (f) {
      var off = L.knot[f[0]] || [0, 0], kx = (f[1] ? F.or - 8 * ux : F.ol - ux) + off[0], ky = (f[2] ? F.ob - 8 * uy : F.ot - uy) + off[1];
      bitmap(g1, KNOT, KMAP, kx, ky, ux, uy, f[1], f[2]);
      var cx = (f[1] ? F.ol + F.or - L.opaw.x : L.opaw.x) + off[0], cy = (f[2] ? F.ot + F.ob - L.opaw.y : L.opaw.y) + off[1];
      bitmap(g1, OPAW, { '#': COL.opaw }, cx - 11 * L.opaw.u / 2, cy - 9 * L.opaw.u / 2, L.opaw.u, L.opaw.u);
    });
    if (HG) bitmap(g1, HOLE, { '#': COL.ink }, HG.x - HG.s, HG.y - HG.s, L.hole.u, L.hole.u);   // 고리 구멍 테두리(안은 위에서 잘라 냄)
    // 제목
    var T1 = L.title1, T2 = L.title2, t1 = String(B.name || 'WALSON').toUpperCase();
    if (T1.center) {   // 가로판: 카드 가운데 · 발바닥은 제목 양옆
      var mid = C.x + C.w / 2, w1 = textUnits(t1) * T1.ux, pw = 29 * L.pawU.x, py = T1.y + (16 * T1.uy - 27 * L.pawU.y) / 2;
      [mid - w1 / 2 - L.pawGap - pw, mid + w1 / 2 + L.pawGap].forEach(function (x) { bitmap(g1, PAW, { '#': COL.paw }, x, py, L.pawU.x, L.pawU.y); });
      text(g1, t1, mid - w1 / 2, T1.y, T1.ux, T1.uy, COL.ink);
      text(g1, 'WALKING PASS', mid - textUnits('WALKING PASS') * T2.ux / 2, T2.y, T2.ux, T2.uy, COL.ink);
    } else {
      L.paws.forEach(function (p) { bitmap(g1, PAW, { '#': COL.paw }, p.x, p.y, L.pawU.x, L.pawU.y); });
      // 제목 1줄은 브랜드 이름 — 원본 이름(WALSON)이면 원본 글자 자리 그대로, 바뀌면 두 발바닥 사이 가운데
      if (t1 === 'WALSON') text(g1, t1, T1.x, T1.y, T1.ux, T1.uy, COL.ink, T1.xs);
      else text(g1, t1, (L.paws[0].x + 83 + L.paws[1].x) / 2 - textUnits(t1) * T1.ux / 2, T1.y, T1.ux, T1.uy, COL.ink);
      text(g1, 'WALKING PASS', T2.x, T2.y, T2.ux, T2.uy, COL.ink, T2.xs);
    }
    // 정보 칸 셋
    var FD = L.field, V = L.value, vals = [o.id == null ? '' : o.id, o.name == null ? 'POM' : o.name, o.type == null ? 'DOG' : o.type];
    FD.ys.forEach(function (fy, i) {
      if (KR) { keyringBox(g1, L.kr.labels[i], vals[i], L.kr.ys[i], i === 1 ? 'grow' : i === 2 ? 'fit' : false, ['id', 'name', 'type'][i]); return; }   // NAME·TYPE 값은 흰 칸 가운데(11/24 가르시아)   // 키링판 = 짧은 칸 이름 · 좁힌 간격
      var sp = FD.splits[i], fx = FD.x, fu = FD.u;
      stepBox(g1, fx, fy, FD.w, FD.h, fu, [[fx + fu, sp, COL.label], [sp, fx + FD.w - fu, COL.value]]);
      var lb = L.labels[i];
      text(g1, lb.t, lb.x, lb.y, lb.ux, lb.uy, COL.ink, lb.xs);
      var v = String(vals[i] || '').trim().toUpperCase();
      if (v) {
        var vx = sp + V.gap, avail = V.right - vx, un = textUnits(v), ux = Math.min(V.ux, avail / un), uy = ux * V.uy / V.ux;
        text(g1, v, vx, lb.y + (16 * V.uy - 16 * uy) / 2, ux, uy, COL.ink);
      }
    });
    var SK = KR && o.skill != null ? skillMode(o) : null;   // 특기 자리 — 'badge' 등급과 한 상자(기본) · 'box' 등급 아래 띠 상자
    // 점선(양 끝은 옅게)
    var D = L.dash, dy = KR ? L.kr.dashY : D.y, dn = D.n == null ? 9 : D.n;   // 가로판은 칸 폭대로 개수(D.n)
    for (var k = -1; k <= dn; k++) rect(g1, D.x0 + k * D.pitch, dy, D.w, D.h, k < 0 ? COL.dashFaint : (k === dn ? COL.dashSoft : COL.dash));
    // 알약 — 키링판은 특기 칸(o.skill을 주면, 11/24 밤) 또는 홍보 문구 두 줄(칸 폭 그대로), 아니면 원본처럼 WALSON
    var PL = L.pill, KP = L.kr.pill, tag = o.tagline !== false && B.tagline;
    var rowsOn = KR && (o.signal != null || o.grade != null), pyy = rowsOn ? L.kr.pillLow : KP.y;
    var SR = SK === 'box' ? skillRect(o) : null;
    if (SR) skillBox(g1, o.skill, SR);
    else if (SK) { /* badge: 아래 등급 자리에서 같이 */ }
    else if (KR && tag && !L.foot) {   // 맨 아래 홍보 한 줄 자리(L.foot)가 있는 판은 거기에(아래)
      stepBox(g1, FD.x, pyy, FD.w, KP.h, KP.u, [[FD.x + KP.u, FD.x + FD.w - KP.u, COL.pill]]);
      var ln = KP.one ? [B.tagline, ''] : twoLines(B.tagline), lw = Math.max(textUnits(ln[0]), textUnits(ln[1])),   // 가로판은 넓어서 한 줄
        pux = Math.min(KP.ux, (FD.w - 2 * KP.u - 2 * KP.pad) / lw), puy = pux * KP.uy / KP.ux,
        nl = ln[1] ? 2 : 1, th = nl * 16 * puy + (nl - 1) * KP.gap, ty = pyy + (KP.h - th) / 2;
      ln.forEach(function (s, i) {
        if (s) text(g1, s, FD.x + FD.w / 2 - textUnits(s) * pux / 2, ty + i * (16 * puy + KP.gap), pux, puy, COL.ink);
      });
    } else if (PL) {   // 가로판엔 원본 WALSON 알약 자리가 없다
      stepBox(g1, PL.x, PL.y, PL.w, PL.h, PL.u, [[PL.x + PL.u, PL.x + PL.w - PL.u, COL.pill]]);
      var pn = String(B.name || 'WALSON').toUpperCase();
      if (pn === 'WALSON') text(g1, pn, PL.tx, PL.ty, PL.tux, PL.tuy, COL.ink, PL.xs);
      else text(g1, pn, PL.x + PL.w / 2 - textUnits(pn) * PL.tux / 2, PL.ty, PL.tux, PL.tuy, COL.ink);
    }
    // 키링판 앞면 아래(11/24 가르시아 "앞쪽 큐알은 너무 작아 — 빼고 1·2번 둘 다"): QR 대신 성향 신호등 + 산책 등급 뱃지.
    // 뒷면에 큰 QR이 있어서 앞면엔 없어도 된다. signal/grade를 안 주면 예전처럼 QR
    if (rowsOn) {
      var LT = L.kr.light, rowY = LT.y;
      if (o.signal != null) { signalLight(g1, FD.x, rowY, FD.w, LT.h, +o.signal); rowY += LT.h + LT.gap; }
      if (o.grade != null) {
        // 등급만 있으면(11/24 "신호등은 톤을 방해" → 뺌) 점선과 홍보 알약(특기 칸) 사이 가운데에 조금 크게
        if (SK === 'badge') comboBox(g1, o.skill, +o.grade);   // 등급과 특기 한 상자(11/24 밤 "4안으로")
        else {
          var gh = o.signal != null ? LT.h : (SR && LT.soloSk) || LT.solo;
          if (o.signal == null) rowY = (L.kr.dashY + L.dash.h + (SR ? SR.y : L.kr.pillLow)) / 2 - gh / 2;
          gradeBadge(g1, FD.x, rowY, FD.w, gh, +o.grade);
        }
      }
    } else if (L.qr) {   // 가로판은 QR 자리가 없다
      // QR(흰 판 + 글자) — 11/24부터 링크 아님(site-config.js cardQrText: 카메라로 찍으면 "카카오톡에서 '왈슨' 검색"만 보인다)
      var Q = L.qr, C = window.WALSON_CONFIG;
      rect(g1, Q.x, Q.y, Q.w, Q.h, COL.white);
      qrRects(g1, o.qr || (C && C.cardQrText) || "WALSON · 카카오톡에서 '왈슨' 검색", Q.x + (Q.w - Q.size) / 2, Q.y + (Q.h - Q.size) / 2, Q.size);
    }
    // 맨 아래 홍보 한 줄(11/24 밤 가르시아 "키링 카드 맨 아래 공간 내서 당신과 강아지의 유의미한 산책 넣어 줘") — 사진 틀 아래 ~ 카드 아래 끝 가운데,
    // 카드 폭 가운데. 한글은 칸 이름·등급과 같은 굵은 글꼴(o.hangul)로 캔버스에 덮어 쓰고, 글꼴이 없으면 도트로
    if (KR && L.foot && tag) {
      var fh = L.foot.h, fcy = (F.ob + C.y + C.h) / 2, fmw = C.w - 180, ts = String(B.tagline);
      if (VEC) VEC.push({ s: ts, x: C.x + (C.w - fmw) / 2, y: fcy - fh / 2, w: fmw, h: fh, fill: COL.ink, fit: true, mw: fmw });
      else {
        var fu = fh / 16, fw0 = textUnits(ts) * fu;
        if (fw0 > fmw) { fu *= fmw / fw0; fw0 = fmw; }
        text(g1, ts, C.x + (C.w - fw0) / 2, fcy - 8 * fu, fu, fu, COL.ink);
      }
    }
    // 홍보 문구(원본엔 없음 — 밖에 나가는 굿즈엔 필수, site-config.js brand): 사진 틀 아래 가운데(키링판은 알약 안·맨 아래 한 줄이라 뺌)
    if (!KR && tag) {
      var tu = L.tagline.u, tw = textUnits(B.tagline) * tu;
      text(g1, B.tagline, (F.ol + F.or) / 2 - tw / 2, L.tagline.y, tu, tu, COL.ink);
    }
    out.push('<g shape-rendering="crispEdges">' + g1.join('') + '</g>');
    out.push('</svg>');
    if (api.lastText) api.lastText.est = EST;
    return out.join('');
  }
  // render(o.hangul·o.vfont) 뒤 그 SVG를 k배로 그린 캔버스에 글자를 덮어 쓴다 — 칸 가운데, 칸 높이만큼(넓으면 칸 폭에 맞게 줄임).
  // 글줄마다 글꼴(it.font·it.weight — 칸 값 글씨체)이 있으면 그것으로, 없으면 t.font. it.fk = 글씨 높이 배수, it.mw = 이 폭보다 넓으면 줄임
  function paintText(g, k, t) {
    t = t || api.lastText; if (!t) return;
    g.save(); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    t.list.forEach(function (it) {
      var fam = it.font || t.font, fs = it.h * k * 1.02 * (it.fk || 1),
        font = function () { return (it.weight ? it.weight + ' ' : '') + fs + 'px ' + fam; };
      g.font = font();
      var m = g.measureText(it.s), maxw = it.mw != null ? it.mw * k : it.w * k * (it.left || it.fit ? 0.9 : 1.06);
      if (m.width > maxw) { fs *= maxw / m.width; g.font = font(); m = g.measureText(it.s); }
      if (it.spread) {   // 짧으면 글자 사이를 벌려 칸 폭의 spread만큼 채움(글자 폭의 0.8배까지)
        var cs = Array.from(it.s), ws = cs.map(function (c) { return g.measureText(c).width; }), sum = ws.reduce(function (a, b) { return a + b; }, 0),
          gap = cs.length > 1 ? Math.max(0, Math.min(fs * 0.8, (it.w * k * it.spread - sum) / (cs.length - 1))) : 0;
        if (gap > 0) {
          var a2 = m.actualBoundingBoxAscent || fs * 0.8, d2 = m.actualBoundingBoxDescent || 0, tot = sum + gap * (cs.length - 1),
            px = (it.x - t.vb[0] + it.w / 2) * k - tot / 2, py = (it.y - t.vb[1] + it.h / 2) * k + (a2 - d2) / 2;
          g.fillStyle = it.fill;
          cs.forEach(function (c, j) { g.fillText(c, px, py); px += ws[j] + gap; });
          return;
        }
      }
      var asc = m.actualBoundingBoxAscent || fs * 0.8, desc = m.actualBoundingBoxDescent || 0,
        cx = (it.x - t.vb[0] + it.w / 2) * k, cy = (it.y - t.vb[1] + it.h / 2) * k;
      g.fillStyle = it.fill;
      g.fillText(it.s, it.left ? (it.x - t.vb[0]) * k : cx - m.width / 2, cy + (asc - desc) / 2);
    });
    g.restore();
  }

  // 둥근모꼴(한글 대신 그리기용)을 받아 둔다 — 받은 뒤 다시 그리면 한글이 도트로
  function ready() {
    if (!document.getElementById('pt-dgm')) {
      var st = document.createElement('style'); st.id = 'pt-dgm';
      st.textContent = "@font-face{font-family:'DungGeunMo';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/DungGeunMo.woff') format('woff');}";
      document.head.appendChild(st);
    }
    return (document.fonts && document.fonts.load) ? document.fonts.load("16px 'DungGeunMo'", '가나다').then(function () { hcache = {}; }).catch(function () {}) : Promise.resolve();
  }

  // geom(가로판?) — 카드·사진 칸 자리(쓰는 쪽이 사진 칸 위에 끌기 칸을 얹거나 사진을 칸 크기로 만들 때)
  // 키링판(세로는 LK — 구멍·아래 홍보 한 줄 자리까지 든 카드)만. hole = 고리 구멍 { x, y 가운데, r 3D가 뚫는 반지름, s 테두리 바깥 반 폭 }(원본 좌표)
  function geom(land) {
    var keep = L; L = land ? LL : LK;
    var g = { card: L.card, photo: photoBox(), ref: L.ref || REF, hole: L.hole ? holeGeo(L.hole) : null };
    L = keep;
    return g;
  }
  // boxes(opts) — 키링판 칸 자리(카드 왼쪽 위 기준 [x, y, w, h]): id·name·type·skill + card [w, h].
  // 편집 창(keyring-edit.js)이 고치는 칸을 크게 보여 줄 때. opts는 render와 같은 것(landscape·signal·grade만 본다)
  function boxes(o) {
    o = o || {};
    var keep = L; L = layoutFor(o);
    try {
      var C = L.card, FD = L.field, ys = L.kr.ys, S = skillSpot(o, skillMode(o)), res = { card: [C.w, C.h] };
      var r = function (x, y, w, h) { return [x - C.x, y - C.y, w, h]; };
      ['id', 'name', 'type'].forEach(function (k, i) { res[k] = r(FD.x, ys[i], FD.w, FD.h); });
      res.skill = r(S.x, S.y, S.w, S.h);
      return res;
    } finally { L = keep; }
  }
  // fontsReady(lastText) — 덮어 쓸 글자의 글꼴을 다 받은 뒤(웹 글꼴은 글자 묶음별로 나눠 받아서, 그릴 글자를 넘겨 받는다)
  function fontsReady(t) {
    t = t || api.lastText;
    if (!t || !t.list.length || !document.fonts || !document.fonts.load) return Promise.resolve();
    var by = {};
    t.list.forEach(function (it) {
      var spec = (it.weight ? it.weight + ' ' : '') + '48px ' + (it.font || t.font);
      (by[spec] = by[spec] || []).push(it.s);
    });
    return Promise.all(Object.keys(by).map(function (spec) { return document.fonts.load(spec, by[spec].join('')).catch(function () {}); }));
  }
  // 카드 색 고르는 칸용 — { id, label, swatch(머리띠 색) }
  var tintList = TINTS.map(function (x) { return { id: x.id, label: x.label, swatch: colorsFor(x.id).col.head }; });
  // 칸 값 글씨체 고르는 칸용 — 또렷하게(기본) · 굵게 · 도트(영어·숫자만 도트, 한글은 o.hangul)
  var fontList = [{ id: 'clear', label: VFONTS.clear.label }, { id: 'bold', label: VFONTS.bold.label }, { id: 'dot', label: '도트' }];
  var api = { REF: REF, L: L, LL: LL, LK: LK, COL: COL, FONT: FONT, TINTS: tintList, VFONTS: fontList, geom: geom, boxes: boxes, photoBox: photoBox, render: render, ready: ready,
    textUnits: textUnits, glyph: glyph, paintText: paintText, fontsReady: fontsReady, lastText: null };
  window.WalsonPassTrace = api;
})();
