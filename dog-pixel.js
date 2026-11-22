// 도트 강아지 캐릭터(2026-11-22 가르시아 "미니미 느낌으로 강아지 도트 캐릭터 샘플"). 시안 화면은 mini-dog-sample.html.
// 그 시절 미니홈피 캐릭터 "느낌"(큰 머리·작은 몸·앞을 보는 2등신)만 빌리고 그림은 전부 여기서 새로 그린다 — 남의 캐릭터를 따라 그리지 않는다.
// 32×32 칸에 털 모양(머리·몸·귀·꼬리)을 칠하고, 빈 칸 중 털 옆 칸에 테두리를 자동으로 둘러 도트 그림처럼 만든다.
// 견종은 귀(뾰족·늘어진·동그란) · 털결(보통·풍성·곱슬) · 색 · 소품(하네스·리본·반다나)의 조합. 프레임 0/1을 번갈아 그리면 걷는다.
// window.WalsonDogPixel.draw(ctx, opts, frame, x, y, scale) · grid(opts, frame) · PRESETS
(function () {
  var N = 32, OUT = '#3a2b2e', EYE = '#2a1f22', BLUSH = '#f7a1b5', EAR_IN = '#f4b6c6', PINK = '#ec7fa3', GOLD = '#f2c14e';

  function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgb2hex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function shade(h, k) { return rgb2hex(hex2rgb(h).map(function (v) { return v * k; })); }

  var PRESETS = [
    { id: 'pom',    name: '포메',     fur: '#f6e3c4', ear: 'point', coat: 'fluffy', tail: 'curl', acc: 'harness' },
    { id: 'malt',   name: '말티즈',   fur: '#ffffff', ear: 'flop',  coat: 'plain',  tail: 'curl', acc: 'ribbon' },
    { id: 'poodle', name: '푸들',     fur: '#b5713f', ear: 'round', coat: 'curly',  tail: 'puff', acc: 'bandana' },
    { id: 'shiba',  name: '시바',     fur: '#e8913a', muzzle: '#fff4e6', ear: 'point', coat: 'plain', tail: 'curl', acc: 'bandana' },
    { id: 'bichon', name: '비숑',     fur: '#ffffff', ear: 'round', coat: 'curly',  tail: 'puff', acc: 'harness' },
    { id: 'dachs',  name: '닥스훈트', fur: '#9a5530', earColor: '#6b3519', ear: 'flop', coat: 'plain', tail: 'thin', acc: 'none' }
  ];

  // opts: { fur, muzzle?, earColor?, ear('point'|'flop'|'round'), coat('plain'|'fluffy'|'curly'), tail('curl'|'puff'|'thin'), acc('none'|'harness'|'ribbon'|'bandana') }
  function grid(o, frame) {
    var g = [], body = [], x, y;   // body[y][x] = 털(테두리 대상)
    for (y = 0; y < N; y++) { g.push(new Array(N).fill(null)); body.push(new Array(N).fill(false)); }
    var fur = o.fur || '#f6e3c4', dark = shade(fur, 0.86), ear = o.earColor || (o.ear === 'point' ? fur : shade(fur, 0.93));
    if (fur.toLowerCase() === '#ffffff') dark = '#e9e2ea';
    function put(x, y, c, isBody) {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= N || y >= N) return;
      g[y][x] = c; if (isBody !== false) body[y][x] = true;
    }
    function ell(cx, cy, rx, ry, c, sh) {
      for (var yy = 0; yy < N; yy++) for (var xx = 0; xx < N; xx++) {
        var dx = (xx + 0.5 - cx) / rx, dy = (yy + 0.5 - cy) / ry, d = dx * dx + dy * dy;
        if (d <= 1) put(xx, yy, (sh && d > 0.72 && dx + dy > 0.55) ? sh : c);
      }
    }
    function bmp(rows, ox, oy, map, mirror) {
      rows.forEach(function (r, j) {
        for (var i = 0; i < r.length; i++) {
          var ch = r[mirror ? r.length - 1 - i : i];
          if (map[ch]) put(ox + i, oy + j, map[ch]);
        }
      });
    }
    var step = frame % 2;

    // 꼬리(몸 뒤)
    if (o.tail === 'curl') { ell(24.5 + step * 0.6, 20.5, 2.6, 2.6, fur, dark); put(24 + step, 20, dark); }
    else if (o.tail === 'puff') ell(24.5 + step * 0.6, 21, 2.3, 2.3, fur, dark);
    else for (var t = 0; t < 4; t++) put(22 + t, 24 - t - (t > 1 ? step : 0), dark);

    // 몸 + 다리(걸을 때 한쪽 다리를 한 칸 든다)
    ell(16, 23.6, 7, 4, fur, dark);
    var lh = step ? [3, 4] : [4, 3];
    for (y = 0; y < lh[0]; y++) { put(11, 26 + y, fur); put(12, 26 + y, fur); put(13, 26 + y, dark); }
    for (y = 0; y < lh[1]; y++) { put(18, 26 + y, fur); put(19, 26 + y, fur); put(20, 26 + y, dark); }

    // 뾰족 귀는 머리보다 먼저(밑동을 머리가 덮게)
    if (o.ear === 'point') {
      var P = ['X....', 'XX...', 'XpX..', 'XppX.', 'XppXX', 'XXXXX'];
      bmp(P, 6, 2, { X: ear, p: EAR_IN });
      bmp(P, 21, 2, { X: ear, p: EAR_IN }, true);
    }
    // 머리
    var hx = 16, hy = 13, hrx = o.coat === 'fluffy' ? 10.3 : 9.6, hry = 8.2;
    ell(hx, hy, hrx, hry, fur, dark);
    if (o.coat === 'fluffy') {   // 볼 털 · 목 털
      ell(16, 20.5, 8.5, 2.8, fur);
    }
    if (o.coat === 'curly') ell(16, 5.6, 6.2, 3.6, fur, dark);   // 정수리 뭉게 털
    // 머리(목 털 포함) 자리 — 턱 그림자용
    function inE(xx, yy, cx, cy, rx, ry) { var a = (xx + 0.5 - cx) / rx, b = (yy + 0.5 - cy) / ry; return a * a + b * b <= 1; }
    var headMask = body.map(function (r, yy) { return r.map(function (v, xx) {
      return inE(xx, yy, hx, hy, hrx, hry) || (o.coat === 'fluffy' && inE(xx, yy, 16, 20.5, 8.5, 2.8));
    }); });
    if (o.ear === 'flop') { ell(6.6, 14.5, 2.6, 5.2, ear, shade(ear, 0.88)); ell(25.4, 14.5, 2.6, 5.2, ear, shade(ear, 0.88)); }
    if (o.ear === 'round') { ell(6.2, 15.5, 3.2, 4.4, ear, shade(ear, 0.88)); ell(25.8, 15.5, 3.2, 4.4, ear, shade(ear, 0.88)); }
    if (o.coat === 'curly') {   // 곱슬 점(밝은 털 점)
      var curl = fur.toLowerCase() === '#ffffff' ? '#efe8f0' : shade(fur, 1.12);
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (body[y][x] && g[y][x] !== EAR_IN && (x * 7 + y * 5) % 9 === 0 && (y < 9 || y > 20 || x < 8 || x > 23)) g[y][x] = curl;
    }
    // 턱 그림자 — 머리 바로 아래 몸 칸을 한 줄 어둡게(머리와 몸이 붙어 한 덩어리로 보이지 않게)
    for (y = 1; y < N; y++) for (x = 0; x < N; x++) if (headMask[y - 1][x] && !headMask[y][x] && body[y][x] && g[y][x] === fur) g[y][x] = dark;
    if (o.muzzle) { ell(16, 17.2, 5.2, 3.2, o.muzzle); ell(9.5, 15.5, 2, 1.6, o.muzzle); ell(22.5, 15.5, 2, 1.6, o.muzzle); }

    // 테두리 — 털 옆 빈 칸(위아래좌우)
    var outline = [];
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      if (body[y][x]) continue;
      if ((y > 0 && body[y - 1][x]) || (y < N - 1 && body[y + 1][x]) || (x > 0 && body[y][x - 1]) || (x < N - 1 && body[y][x + 1])) outline.push([x, y]);
    }
    outline.forEach(function (p) { g[p[1]][p[0]] = OUT; });

    // 얼굴(테두리 뒤에 — 얼굴 칸은 털 위에 그린다)
    var blink = frame === 3;   // 가끔 눈 감기
    [[10, 12], [19, 12]].forEach(function (e) {
      var i, j;
      if (blink) { for (i = 0; i < 3; i++) put(e[0] + i, e[1] + 2, EYE); return; }
      for (j = 0; j < 3; j++) for (i = 0; i < 3; i++) put(e[0] + i, e[1] + j, EYE);
      put(e[0], e[1], '#ffffff');
    });
    put(15, 16, EYE); put(16, 16, EYE); put(15, 17, EYE); put(16, 17, EYE);
    put(14, 18, EYE); put(15, 19, EYE); put(16, 19, EYE); put(17, 18, EYE);
    if (step) { put(15, 20, PINK); put(16, 20, PINK); }   // 걸을 때 혀
    put(9, 16, BLUSH); put(10, 16, BLUSH); put(21, 16, BLUSH); put(22, 16, BLUSH);

    // 소품
    if (o.acc === 'harness') {
      for (x = 8; x < 25; x++) for (y = 22; y < 24; y++) if (body[y][x] && y < 26) put(x, y, PINK);
      put(16, 22, GOLD);
    } else if (o.acc === 'bandana') {
      var B = ['XXXXXXXXXXXXX', '.XXXXXXXXXXX.', '...XXwXXXX...', '.....XXX.....'];
      bmp(B, 10, 20, { X: '#e2474f', w: '#ffffff' });
    } else if (o.acc === 'ribbon') {
      bmp(['XX.XX', 'XXcXX', 'XX.XX'], 8, 4, { X: PINK, c: '#c9567d' });
    }
    return g;
  }

  function draw(ctx, o, frame, ox, oy, s) {
    var g = grid(o, frame || 0);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (g[y][x]) { ctx.fillStyle = g[y][x]; ctx.fillRect(ox + x * s, oy + y * s, s, s); }
  }

  window.WalsonDogPixel = { N: N, PRESETS: PRESETS, grid: grid, draw: draw };
})();
