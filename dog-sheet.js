// 3×2·3×3 강아지 동작 그림 자르기 (2026-11-28 그림 공장 — 서버 함수 supabase/functions/dog-sheet가 받아 온 그림을 브라우저에서 자른다)
// 칸(서버 함수 LAYOUTS와 같은 순서): 3x2 = 앉기1 · 걷기A · 걷기B / 자기 · 웃기 · 앉기2
//                                   3x3 = 앉기1 · 앉기2 · 자기 / 걷기A · 걷기 중간 · 걷기B / 웃기 · 으르렁 · 배뒤집기
// 배경은 초록 단색(#00FF00)으로 받는다. 걷기 A = walk1, B = walk2, 중간 = walkmid.
// 하는 일:
//   ① 배경 빼기 — 그림 가장자리부터 초록을 따라 들어가며 지운다(전체에서 초록을 한 번에 지우면 몸 안 색까지 먹을 수 있어서).
//      다리 사이처럼 갇힌 진한 초록도 지우고, 테두리에 번진 초록(JPG)은 빼거나 회색으로 눌러 준다.
//   ② 덩어리 찾기 — 칸을 3등분해 자르지 않고 강아지 덩어리를 찾아 가운데가 놓인 칸으로 나눈다(그림이 칸 선을 조금 넘어도 안 잘림).
//   ③ 한 장 같은 비율 — 칸마다 따로 키우지 않고, 여섯 칸 중 가장 큰 키에 맞춘 한 비율만 쓴다(앉으면 작아지고 서면 커지게).
//   ④ 발 맞추기 — 기준점은 발바닥 가운데. 걷기 두 장은 코끝(오른쪽 끝)을 맞춰 머리가 덜 흔들리게.
// 쓰는 법: WalsonSheet.cut(img, '3x2'|'3x3') → { poses: { sit1, walk1, walk2, … }, maxH, missing, bad(빈 배열이면 통과) }
//   pose = { c: 잘린 캔버스(투명 배경), w, h, ax, ay(기준점 — 캔버스 안 픽셀) }
(function () {
  var LAYOUTS = {
    '3x2': { rows: 2, names: ['sit1', 'walk1', 'walk2', 'sleep', 'happy', 'sit2'] },
    '3x3': { rows: 3, names: ['sit1', 'sit2', 'sleep', 'walk1', 'walkmid', 'walk2', 'happy', 'growl', 'belly'] },
  };

  function cut(img, layout) {
    var LY = LAYOUTS[layout] || LAYOUTS['3x2'], NAMES = LY.names, ROWS = LY.rows;
    var W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    var im = g.getImageData(0, 0, W, H), d = im.data, N = W * H;
    var bg = new Uint8Array(N);
    function greenish(i) { var r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2]; return gg > 90 && gg - r > 40 && gg - b > 40; }

    // ① 가장자리에서 초록 따라 들어가기
    var q = new Int32Array(N), qh = 0, qt = 0, x, y, i;
    function seed(p) { if (!bg[p] && greenish(p)) { bg[p] = 1; q[qt++] = p; } }
    for (x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
    for (y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
    while (qh < qt) {
      var p = q[qh++], px = p % W;
      if (px > 0) seed(p - 1);
      if (px < W - 1) seed(p + 1);
      if (p >= W) seed(p - W);
      if (p < N - W) seed(p + W);
    }
    // 갇힌 진한 초록(다리·꼬리 사이) — 강아지에 이런 초록은 없다
    for (i = 0; i < N; i++) if (!bg[i]) { var r0 = d[i * 4], g0 = d[i * 4 + 1], b0 = d[i * 4 + 2]; if (g0 > 150 && r0 < 120 && b0 < 120) bg[i] = 1; }
    // 칸 선 지우기(라운드 c 포메 — "선 없이"라고 해도 가끔 검은 칸 선을 그린다). 강아지 한 마리는 한 칸(그림의 1/3)을 못 넘으니,
    // 한 줄에 그림 절반 넘게 끊김 없이 이어진 가로·세로 줄은 선이다 — 그 줄의 어두운 점만 지운다.
    var lum = function (p) { return d[p * 4] * 0.3 + d[p * 4 + 1] * 0.59 + d[p * 4 + 2] * 0.11; }, lines = 0;
    // 선 둘레(앞뒤 3줄)의 회색 점도 지운다 — 선 가장자리의 옅은 회색이 강아지에 붙어 걸을 때 격자가 따라다녔다(라운드 c 포메).
    var grayish = function (p) { var r = d[p * 4], gg = d[p * 4 + 1], b = d[p * 4 + 2]; return Math.max(r, gg, b) - Math.min(r, gg, b) < 45 && lum(p) < 215; };
    var lineRows = [], lineCols = [];
    for (y = 0; y < H; y++) {
      var cnt = 0, run = 0; for (x = 0; x < W; x++) { run = bg[y * W + x] ? 0 : run + 1; if (run > cnt) cnt = run; }   // 가장 길게 이어진 길이(강아지 셋이 한 줄에 있어도 안 걸리게)
      if (cnt > W * 0.5) lineRows.push(y);
    }
    for (x = 0; x < W; x++) {
      var cnt2 = 0, run2 = 0; for (y = 0; y < H; y++) { run2 = bg[y * W + x] ? 0 : run2 + 1; if (run2 > cnt2) cnt2 = run2; }
      if (cnt2 > H * 0.5) lineCols.push(x);
    }
    lines = lineRows.length + lineCols.length;
    lineRows.forEach(function (ly) {
      for (var yy = Math.max(0, ly - 3); yy <= Math.min(H - 1, ly + 3); yy++) for (x = 0; x < W; x++) { i = yy * W + x; if (!bg[i] && grayish(i)) bg[i] = 1; }
    });
    lineCols.forEach(function (lx) {
      for (var xx = Math.max(0, lx - 3); xx <= Math.min(W - 1, lx + 3); xx++) for (y = 0; y < H; y++) { i = y * W + xx; if (!bg[i] && grayish(i)) bg[i] = 1; }
    });
    // 테두리에 번진 초록: 진하면 빼고, 옅으면 초록만 눌러 준다(두 겹)
    for (var pass = 0; pass < 2; pass++) {
      var drop = [];
      for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
        i = y * W + x; if (bg[i]) continue;
        var edge = (x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W]);
        if (!edge) continue;
        var R = d[i * 4], G = d[i * 4 + 1], B = d[i * 4 + 2], m = Math.max(R, B), gr = G - m;
        if (gr > 50) drop.push(i); else if (gr > 0) d[i * 4 + 1] = m;
      }
      for (var k = 0; k < drop.length; k++) bg[drop[k]] = 1;
    }
    for (i = 0; i < N; i++) if (bg[i]) d[i * 4 + 3] = 0;
    g.putImageData(im, 0, 0);

    // ② 덩어리 → 칸
    var lab = new Int32Array(N), boxes = [], MIN = Math.max(60, N * 0.0004);
    for (i = 0; i < N; i++) {
      if (bg[i] || lab[i]) continue;
      var id = boxes.length + 1, x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0, sx = 0, sy = 0;
      qh = 0; qt = 0; q[qt++] = i; lab[i] = id;
      while (qh < qt) {
        var p2 = q[qh++], cx = p2 % W, cy = (p2 / W) | 0;
        n++; sx += cx; sy += cy;
        if (cx < x0) x0 = cx; if (cx > x1) x1 = cx; if (cy < y0) y0 = cy; if (cy > y1) y1 = cy;
        if (cx > 0 && !bg[p2 - 1] && !lab[p2 - 1]) { lab[p2 - 1] = id; q[qt++] = p2 - 1; }
        if (cx < W - 1 && !bg[p2 + 1] && !lab[p2 + 1]) { lab[p2 + 1] = id; q[qt++] = p2 + 1; }
        if (cy > 0 && !bg[p2 - W] && !lab[p2 - W]) { lab[p2 - W] = id; q[qt++] = p2 - W; }
        if (cy < H - 1 && !bg[p2 + W] && !lab[p2 + W]) { lab[p2 + W] = id; q[qt++] = p2 + W; }
      }
      boxes.push({ n: n, x0: x0, y0: y0, x1: x1, y1: y1, cx: sx / n, cy: sy / n });
    }
    var cell = NAMES.map(function () { return null; });
    boxes.forEach(function (b) {
      if (b.n < MIN) return;   // 티끌
      var bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
      if (Math.min(bw, bh) <= 10 && Math.max(bw, bh) > 40) return;   // 가늘고 긴 조각 = 선 남은 것
      var col = Math.min(2, Math.floor(b.cx / (W / 3))), row = Math.min(ROWS - 1, Math.floor(b.cy / (H / ROWS))), c = cell[row * 3 + col];
      if (!c) cell[row * 3 + col] = { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, n: b.n };
      else { c.x0 = Math.min(c.x0, b.x0); c.y0 = Math.min(c.y0, b.y0); c.x1 = Math.max(c.x1, b.x1); c.y1 = Math.max(c.y1, b.y1); c.n += b.n; }
    });

    // ③④ 자르고 기준점
    var poses = {}, maxH = 0, missing = [];
    NAMES.forEach(function (nm, k) {
      var c = cell[k];
      if (!c) { missing.push(nm); return; }
      var w = c.x1 - c.x0 + 1, h = c.y1 - c.y0 + 1, o = document.createElement('canvas');
      o.width = w; o.height = h;
      o.getContext('2d').drawImage(cv, c.x0, c.y0, w, h, 0, 0, w, h);
      poses[nm] = { c: o, w: w, h: h, ax: w / 2, ay: h, box: c };
      if (h > maxH) maxH = h;
    });
    // 검사 — 통과 못 하면 사용자에게 보이기 전에 다시 그린다(앱에서). 빠진 칸 · 칸보다 큰 덩어리(칸이 붙음) · 너무 작은 덩어리
    var bad = missing.map(function (nm) { return 'miss:' + nm; });
    NAMES.forEach(function (nm) {
      var p = poses[nm]; if (!p) return;
      if (p.w > W / 3 * 1.1 || p.h > H / ROWS * 1.1) bad.push('big:' + nm);
      else if (p.h < maxH * 0.3) bad.push('small:' + nm);
    });
    var walks = ['walk1', 'walkmid', 'walk2'].filter(function (k) { return poses[k]; });   // 코끝 맞추기
    if (walks.length > 1) {
      var wa = walks.reduce(function (t, k) { return t + poses[k].w; }, 0) / walks.length;
      walks.forEach(function (k) { poses[k].ax = poses[k].w - wa / 2; });
    }
    return { poses: poses, maxH: maxH, W: W, H: H, missing: missing, clean: cv, names: NAMES, bad: bad, lines: lines, layout: layout in LAYOUTS ? layout : '3x2' };
  }

  window.WalsonSheet = { cut: cut, LAYOUTS: LAYOUTS, NAMES: LAYOUTS['3x2'].names };
})();
