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
      labels: ['ID', 'NAME', 'TYPE'], kmax: 4.3, lux: 3.1, luy: 3.25, pad: 14, lgap: 8, vgap: 12, vpad: 10,
      dashY: 1255.5, pill: { y: 1314.5, h: 175, u: 12.4, ux: 2.75, uy: 2.9, gap: 14, pad: 20 },
      // 신호등·등급 뱃지 두 줄(알약 아래 ~ 사진 틀 아랫줄까지): 칸 높이 h, 사이 gap, 불 한 칸 lu
      light: { y: 1314.5, h: 78, solo: 150, gap: 16, u: 9.3, lu: 8 }, pillLow: 1513.5 }   // 신호등·등급이 있으면 점선 바로 아래 두 줄, 홍보 알약은 맨 아래(11/24 가르시아 "유의미한 산책을 맨 아래로")
  };
  function photoBox() {
    var F = L.frame;
    return { x: F.ol + 4 * F.ux, y: F.ot + 4 * F.uy, w: F.or - F.ol - 8 * F.ux, h: F.ob - F.ot - 8 * F.uy };
  }

  // 계단 모서리 상자(칸·알약): 모서리 한 칸 깎은 테두리 u, 안은 fills([[x0,x1,색],…])
  function stepBox(out, x, y, w, h, u, fills) {
    fills.forEach(function (f) { rect(out, f[0], y + u, f[1] - f[0], h - 2 * u, f[2]); });
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

  // 홍보 문구를 두 줄로 — 띄어쓰기 자리 중 두 줄 폭이 가장 비슷한 곳에서 나눈다(한 단어면 한 줄)
  function twoLines(s) {
    var words = String(s || '').trim().split(/\s+/), best = [words.join(' '), ''], bw = Infinity;
    for (var i = 1; i < words.length; i++) {
      var a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), w = Math.max(textUnits(a), textUnits(b));
      if (w < bw) { bw = w; best = [a, b]; }
    }
    return best;
  }
  // 키링판 칸: 원본처럼 한 줄 — 왼쪽 분홍(칸 이름) · 오른쪽 흰 칸(값). 분홍 칸은 세 칸이 같은 폭(가장 긴 칸 이름 바로 뒤까지)이라
  // 값이 한 줄로 맞춰 시작한다(길면 칸에 맞게 줄임)
  // 또렷한 한글 글꼴(Black Han Sans) 글줄 폭 어림 — 글자 크기 1에 한글 0.84 · 띄어쓰기 0.3 · 그 밖 0.7(브라우저에서 잰 값)
  function vecEm(str) {
    return Array.from(str).reduce(function (a, c) { return a + (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(c) ? 0.84 : c === ' ' ? 0.3 : 0.7); }, 0);
  }
  // 긴 견종(11/24 가르시아 "타입 칸도 가변적으로, 엄청 길면 두 줄로"): 견종 칸(center === 'fit')만
  //   ① 견종 글씨가 typeMin보다 작아질 만큼 길면 TYPE 글자·분홍 칸을 줄여(최소 typeShrink배) 흰 칸을 넓힌다
  //   ② 그래도 작으면(한글만) 띄어쓰기에서 두 줄로. 보통 길이(포메라니안 등)는 그대로
  function keyringBox(out, label, value, y, center) {
    var FD = L.field, K = L.kr, V = L.value, x = FD.x, w = FD.w, u = FD.u, h = FD.h;
    var v = String(value || '').trim().toUpperCase();
    var lw = Math.max.apply(null, K.labels.map(textUnits)), lx = x + u + K.pad, ls = 1, two = null;
    var vh = 16 * K.kmax * V.uy / V.ux * 0.8, isHan = VEC && /[가-힣]/.test(v);
    if (center === 'fit' && v) {
      var full = x + w - u - (lx + lw * K.lux + K.lgap) - u;   // 지금 흰 칸에서 글씨가 쓸 수 있는 폭(가장자리 반 칸씩 뺌)
      var need = isHan ? vecEm(v) * vh * 1.02 / 0.9 : textUnits(v) * V.ux;   // 제 크기로 쓰려면 필요한 폭
      if (need * K.typeMin > full) {   // 제 크기의 typeMin배보다 작아질 만큼 길면 TYPE 칸을 줄인다
        ls = Math.max(K.typeShrink, 1 - (need * K.typeMin - full) / (lw * K.lux));
        var full2 = full + lw * K.lux * (1 - ls);
        if (isHan && need * K.typeTwo > full2 && /\s/.test(v)) two = twoLines(v);
      }
    }
    var sp = lx + lw * K.lux * ls + K.lgap;
    stepBox(out, x, y, w, h, u, [[x + u, sp, COL.label], [sp, x + w - u, COL.value]]);
    text(out, label, lx, y + (h - 16 * K.luy * ls) / 2, K.lux * ls, K.luy * ls, COL.ink);
    if (!v) return;
    if (two) {   // 두 줄: 한 줄 높이를 칸 안쪽 높이에 맞춰 나눔, 둘 다 같은 크기(긴 줄에 맞춤)
      var cl2 = sp + u * 0.5, cw2 = x + w - u - cl2 - u * 0.5, lh = Math.min(vh, (h - 2 * u - K.twoGap) / 2 * 0.86),
        lw2 = Math.max(vecEm(two[0]), vecEm(two[1])) * 1.02;
      lh = Math.min(lh, cw2 * 0.9 / lw2);
      var ty0 = y + (h - (2 * lh + K.twoGap)) / 2;
      two.forEach(function (s, i) { VEC.push({ s: s, x: cl2, y: ty0 + i * (lh + K.twoGap), w: cw2, h: lh, fill: COL.ink, fit: true }); });
      return;
    }
    // 한글 값은 둥근모꼴 도트라 같은 크기면 영문보다 가늘고 작아 보여서 더 크게(11/24 가르시아 "이름 글씨 잘 안 보이네") — 칸 폭이 허락하는 만큼
    var vmax = /[가-힣]/.test(v) ? K.kmax : V.ux;
    var vx = sp + K.vgap, avail = (x + w - u - K.vpad) - vx, ux = Math.min(vmax, avail / textUnits(v)), uy = ux * V.uy / V.ux;
    if (isHan) {   // 또렷한 한글: 칸 폭 전체를 쓰고 왼쪽 맞춤(긴 견종도 덜 작게 — 글꼴이 도트보다 좁다)
      if (center === 'grow') vh = K.nameH;   // 이름: 크게 + 짧으면 자간을 벌려 칸을 채움(paintText spread)
      if (center) { var cl = sp + u * 0.5, cw = x + w - u - cl - u * 0.5; VEC.push({ s: v, x: cl, y: y + (h - vh) / 2, w: cw, h: vh, fill: COL.ink, fit: true, spread: center === 'grow' ? K.nameFill : 0 }); return; }
      VEC.push({ s: v, x: vx, y: y + (h - vh) / 2, w: avail, h: vh, fill: COL.ink, left: true }); return;
    }
    if (center === 'grow') {   // 영문 이름도: 칸 높이가 허락하는 만큼 크게, 짧으면 글자 사이를 벌려 칸의 nameFill만큼 채움
      var aw = x + w - u - sp - 2 * K.vpad, nu = textUnits(v);
      ux = Math.min(K.nameLatH / 16 * V.ux / V.uy, aw * 0.9 / nu); uy = ux * V.uy / V.ux;   // 도트 영문은 칸 높이 꽉 차 보여서 한글보다 낮게
      var chars = Array.from(v), glyphs = chars.filter(function (c) { return c !== ' '; }).length,
        gapx = glyphs > 1 ? Math.max(0, Math.min(ux * 8, (aw * K.nameFill - nu * ux) / (chars.length - 1))) : 0,
        tw = nu * ux + gapx * (chars.length - 1), cx0 = sp + (x + w - u - sp - tw) / 2, xs = [];
      chars.forEach(function (c) { var gl = glyph(c); if (gl.rows) xs.push(cx0 + gl.lb * ux); cx0 += gl.adv * ux + gapx; });
      text(out, v, 0, y + (h - 16 * uy) / 2, ux, uy, COL.ink, xs); return;
    }
    if (center) vx = sp + (x + w - u - sp - textUnits(v) * ux) / 2;
    text(out, v, vx, y + (h - 16 * uy) / 2, ux, uy, COL.ink);
  }

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
    var LT = L.kr.light, KP = L.kr.pill, u = LT.u, name = GRADES[lv];
    stepBox(out, x, y, w, h, u, [[x + u, x + w - u, GRADE_COL[lv]]]);
    var pu = Math.min(2.6, (h - 2 * u - 20) / 27), pw = 29 * pu, gap = 18,   // 발바닥은 너무 커지지 않게, 글씨는 칸 높이 따라 조금 크게
      tux = Math.min(KP.ux * 1.05 * Math.min(1.35, h / 78), (w - 2 * u - 40 - pw - gap) / textUnits(name)), tuy = tux * KP.uy / KP.ux,
      total = pw + gap + textUnits(name) * tux, sx = x + (w - total) / 2;
    bitmap(out, PAW, { '#': lv === 3 ? COL.divider : COL.paw }, sx, y + (h - 27 * pu) / 2, pu, pu);
    text(out, name, sx + pw + gap, y + (h - 16 * tuy) / 2, tux, tuy, COL.ink);
  }

  // opts: { photo: dataURL(사진 칸 크기 그대로 넣음), id, name, type, qr(주소), tagline(true/false), scene('ref'=바탕·그림자까지 | 'card'=카드만), brand,
  //         keyring(true = 키링판 — 칸 이름 짧게·간격 좁혀 값 자리 넓힘, 아래 알약에 홍보 문구),
  //         signal(0~2)·grade(0~3) — 키링판에서 주면 QR 대신 성향 신호등·산책 등급 뱃지 }
  function render(o) {
    o = o || {};
    var B = o.brand || (window.WALSON_CONFIG && WALSON_CONFIG.brand) || { name: 'WALSON', tagline: '당신과 강아지의 유의미한 산책' };
    var C = L.card, F = L.frame, P = photoBox(), card = o.scene === 'card', out = [], KR = !!o.keyring;
    var vb = card ? [C.x, C.y, C.w, C.h] : [0, 0, REF.w, REF.h];
    VEC = o.hangul ? [] : null;
    api.lastText = VEC ? { list: VEC, vb: vb, font: o.hangul } : null;
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb.join(' ') + '" width="' + vb[2] + '" height="' + vb[3] + '">');
    out.push('<defs><clipPath id="pt-card"><rect x="' + C.x + '" y="' + C.y + '" width="' + C.w + '" height="' + C.h + '" rx="' + C.r + '"/></clipPath>' +
      '<clipPath id="pt-photo"><rect x="' + n(P.x) + '" y="' + n(P.y) + '" width="' + n(P.w) + '" height="' + n(P.h) + '"/></clipPath></defs>');
    if (!card) {
      rect(out, 0, 0, REF.w, REF.h, COL.bg);
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
    // 제목
    L.paws.forEach(function (p) { bitmap(g1, PAW, { '#': COL.paw }, p.x, p.y, L.pawU.x, L.pawU.y); });
    var T1 = L.title1, T2 = L.title2, t1 = String(B.name || 'WALSON').toUpperCase();
    // 제목 1줄은 브랜드 이름 — 원본 이름(WALSON)이면 원본 글자 자리 그대로, 바뀌면 두 발바닥 사이 가운데
    if (t1 === 'WALSON') text(g1, t1, T1.x, T1.y, T1.ux, T1.uy, COL.ink, T1.xs);
    else text(g1, t1, (L.paws[0].x + 83 + L.paws[1].x) / 2 - textUnits(t1) * T1.ux / 2, T1.y, T1.ux, T1.uy, COL.ink);
    text(g1, 'WALKING PASS', T2.x, T2.y, T2.ux, T2.uy, COL.ink, T2.xs);
    // 정보 칸 셋
    var FD = L.field, V = L.value, vals = [o.id == null ? '' : o.id, o.name == null ? 'POM' : o.name, o.type == null ? 'DOG' : o.type];
    FD.ys.forEach(function (fy, i) {
      if (KR) { keyringBox(g1, L.kr.labels[i], vals[i], L.kr.ys[i], i === 1 ? 'grow' : i === 2 ? 'fit' : false); return; }   // NAME·TYPE 값은 흰 칸 가운데(11/24 가르시아)   // 키링판 = 짧은 칸 이름 · 좁힌 간격
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
    // 점선(양 끝은 옅게)
    var D = L.dash, dy = KR ? L.kr.dashY : D.y;
    for (var k = -1; k <= 9; k++) rect(g1, D.x0 + k * D.pitch, dy, D.w, D.h, k < 0 ? COL.dashFaint : (k === 9 ? COL.dashSoft : COL.dash));
    // 알약 — 키링판은 홍보 문구 두 줄(칸 폭 그대로), 아니면 원본처럼 WALSON
    var PL = L.pill, KP = L.kr.pill, tag = o.tagline !== false && B.tagline;
    var rowsOn = KR && (o.signal != null || o.grade != null), pyy = rowsOn ? L.kr.pillLow : KP.y;
    if (KR && tag) {
      stepBox(g1, FD.x, pyy, FD.w, KP.h, KP.u, [[FD.x + KP.u, FD.x + FD.w - KP.u, COL.pill]]);
      var ln = twoLines(B.tagline), lw = Math.max(textUnits(ln[0]), textUnits(ln[1])),
        pux = Math.min(KP.ux, (FD.w - 2 * KP.u - 2 * KP.pad) / lw), puy = pux * KP.uy / KP.ux,
        nl = ln[1] ? 2 : 1, th = nl * 16 * puy + (nl - 1) * KP.gap, ty = pyy + (KP.h - th) / 2;
      ln.forEach(function (s, i) {
        if (s) text(g1, s, FD.x + FD.w / 2 - textUnits(s) * pux / 2, ty + i * (16 * puy + KP.gap), pux, puy, COL.ink);
      });
    } else {
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
        // 등급만 있으면(11/24 "신호등은 톤을 방해" → 뺌) 점선과 홍보 알약 사이 가운데에 조금 크게
        var gh = o.signal != null ? LT.h : LT.solo;
        if (o.signal == null) rowY = (L.kr.dashY + L.dash.h + L.kr.pillLow) / 2 - gh / 2;
        gradeBadge(g1, FD.x, rowY, FD.w, gh, +o.grade);
      }
    } else {
      // QR(흰 판 + 글자) — 11/24부터 링크 아님(site-config.js cardQrText: 카메라로 찍으면 "카카오톡에서 '왈슨' 검색"만 보인다)
      var Q = L.qr, C = window.WALSON_CONFIG;
      rect(g1, Q.x, Q.y, Q.w, Q.h, COL.white);
      qrRects(g1, o.qr || (C && C.cardQrText) || "WALSON · 카카오톡에서 '왈슨' 검색", Q.x + (Q.w - Q.size) / 2, Q.y + (Q.h - Q.size) / 2, Q.size);
    }
    // 홍보 문구(원본엔 없음 — 밖에 나가는 굿즈엔 필수, site-config.js brand): 사진 틀 아래 가운데(키링판은 알약 안에 있어서 뺌)
    if (!KR && tag) {
      var tu = L.tagline.u, tw = textUnits(B.tagline) * tu;
      text(g1, B.tagline, (F.ol + F.or) / 2 - tw / 2, L.tagline.y, tu, tu, COL.ink);
    }
    out.push('<g shape-rendering="crispEdges">' + g1.join('') + '</g>');
    out.push('</svg>');
    VEC = null;
    return out.join('');
  }
  // render(o.hangul) 뒤 그 SVG를 k배로 그린 캔버스에 한글을 덮어 쓴다 — 도트 글자 칸 가운데, 칸 높이만큼(넓으면 칸 폭에 맞게 줄임)
  function paintText(g, k, t) {
    t = t || api.lastText; if (!t) return;
    g.save(); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    t.list.forEach(function (it) {
      var fs = it.h * k * 1.02, font = function () { return fs + 'px ' + t.font; };
      g.font = font();
      var m = g.measureText(it.s), maxw = it.w * k * (it.left || it.fit ? 0.9 : 1.06);
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

  var api = { REF: REF, L: L, COL: COL, FONT: FONT, photoBox: photoBox, render: render, ready: ready, textUnits: textUnits, glyph: glyph, paintText: paintText, lastText: null };
  window.WalsonPassTrace = api;
})();
