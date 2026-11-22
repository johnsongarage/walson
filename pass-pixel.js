// 도트 워킹패스(키링·굿즈 앞면) 시안 — 2026-11-22 가르시아가 보여 준 도트 아크릴 키링("WALSON WALKING PASS", 분홍 머리띠,
// 뼈다귀 귀퉁이 사진 틀, 오른쪽 칸 ID·NAME·TYPE, 아래 WALSON 알약 + QR)을 틀로 옮긴 것. 시안 화면은 pass-pixel-sample.html.
// 원래 그림과 다른 점: 칸 이름은 한국어(번호·이름·견종), 성향 띠(안전 표시)·산책 등급 칸을 넣었고, 맨 아래 홍보물 문구 두 줄(site-config.js brand).
// 모든 선·칸은 U(6px) 칸에 맞춰 그리고, 글자는 둥근모꼴(DungGeunMo — 도트 지도 이름 글자와 같은 글꼴).
// 사진: mode 'photo' = 원래 사진 그대로, 'dot' = cols칸으로 줄이고 색을 palette개로 줄여 도트로(이 휴대폰 안에서만, 어디로도 안 보냄).
// 크기 1200×1500(4:5). 인쇄 규격은 정해지면 바꾼다. window.WalsonPassPixel.draw(canvas, data)
// 쓰는 곳: 시안 화면 pass-pixel-sample.html, [워킹패스] my-card.html의 [도트 카드](2026-11-22)
(function () {
  var W = 1200, H = 1500, U = 6;
  var PIX = "'DungGeunMo', 'Galmuri11', monospace";
  var INK = '#4a3340', PINK = '#f4a6c0', PINK_D = '#d97f9f', LABEL = '#a8566f', PINK_L = '#fde8ef', PAPER = '#fff7fa', WHITE = '#ffffff';
  var SIGNALS = {
    green:  { line: '다가와도 좋아요', color: '#3f9b5b' },
    yellow: { line: '천천히 인사해요', color: '#dfa21f' },
    red:    { line: '눈으로만 예뻐해 주세요', color: '#d2493f' }
  };
  // 발바닥 7×6
  var PAW = ['.X...X.', 'X.X.X.X', '.......', '..XXX..', '.XXXXX.', '.XX.XX.'];
  // 사진 틀(뼈다귀 귀퉁이)과 그 안 사진 칸 — 시안 화면이 사진 칸 위에 '끌어서 옮기기·확대' 칸을 얹으려고 PHOTO를 밖으로 알려 준다(2026-11-22)
  var FRAME = { x: 54, y: 354, w: 552, h: 672 };
  var PHOTO = { x: FRAME.x + 5 * U, y: FRAME.y + 5 * U, w: FRAME.w - 10 * U, h: FRAME.h - 10 * U };

  function snap(v) { return Math.round(v / U) * U; }
  function box(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(snap(x), snap(y), snap(w), snap(h)); }
  // 귀퉁이를 한 칸 깎은 도트 상자(테두리 b칸) + 오른쪽 아래 그림자
  function stepBox(ctx, x, y, w, h, fill, border, shadow) {
    x = snap(x); y = snap(y); w = snap(w); h = snap(h);
    if (shadow) { ctx.fillStyle = shadow; ctx.fillRect(x + 2 * U, y + 2 * U, w - U, h - U); ctx.fillRect(x + U, y + 3 * U, w, h - 3 * U); }
    ctx.fillStyle = border || INK;
    ctx.fillRect(x + U, y, w - 2 * U, h); ctx.fillRect(x, y + U, w, h - 2 * U);
    ctx.fillStyle = fill;
    ctx.fillRect(x + 2 * U, y + U, w - 4 * U, h - 2 * U); ctx.fillRect(x + U, y + 2 * U, w - 2 * U, h - 4 * U);
  }
  function sprite(ctx, rows, x, y, s, color) {
    ctx.fillStyle = color;
    rows.forEach(function (r, j) { for (var i = 0; i < r.length; i++) if (r[i] === 'X') ctx.fillRect(x + i * s, y + j * s, s, s); });
  }
  function dashes(ctx, x1, x2, y, c) { for (var x = x1; x + 3 * U <= x2; x += 5 * U) box(ctx, x, y, 3 * U, U, c); }
  function font(size) { return size + 'px ' + PIX; }
  function fit(ctx, text, maxW, size, min) {
    var s = size;
    while (s > (min || 24)) { ctx.font = font(s); if (ctx.measureText(text).width <= maxW) break; s -= 6; }
    ctx.font = font(s);
    return s;
  }
  // 띄어쓰기에서 두 줄로(가운데에 가까운 곳)
  function split2(text) {
    var mid = text.length / 2, best = -1;
    for (var i = 0; i < text.length; i++) if (text[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    return best > 0 ? [text.slice(0, best), text.slice(best + 1)] : [text];
  }

  // ── 사진을 도트로 ──
  // 사진 칸(bw×bh)을 cols칸으로 줄이고, 색을 k개로 줄인다(k-평균). 채도를 조금 올려 그림처럼.
  function dotPhoto(img, bw, bh, cols, k, zoom, qx, qy) {
    var rows = Math.max(1, Math.round(cols * bh / bw));
    var c = document.createElement('canvas'); c.width = cols; c.height = rows;
    var g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.fillStyle = PINK_L; g.fillRect(0, 0, cols, rows);   // 줌아웃해서 사진이 칸보다 작으면 남는 곳은 사진 칸 바탕색(검정 도트가 되지 않게)
    var s = Math.max(cols / img.width, rows / img.height) * (zoom || 1);
    var iw = img.width * s, ih = img.height * s;
    g.drawImage(img, (cols - iw) * (qx == null ? 0.5 : qx), (rows - ih) * (qy == null ? 0.5 : qy), iw, ih);
    var d = g.getImageData(0, 0, cols, rows), p = d.data, n = cols * rows, i, j;
    for (i = 0; i < n; i++) {   // 채도 1.25배
      var r = p[i * 4], gg = p[i * 4 + 1], b = p[i * 4 + 2], l = 0.3 * r + 0.59 * gg + 0.11 * b;
      p[i * 4] = Math.max(0, Math.min(255, l + (r - l) * 1.25));
      p[i * 4 + 1] = Math.max(0, Math.min(255, l + (gg - l) * 1.25));
      p[i * 4 + 2] = Math.max(0, Math.min(255, l + (b - l) * 1.25));
    }
    // k-평균: 밝기 순으로 고르게 뽑은 점에서 시작
    var order = []; for (i = 0; i < n; i++) order.push(i);
    order.sort(function (a, b2) { return (p[a * 4] + p[a * 4 + 1] + p[a * 4 + 2]) - (p[b2 * 4] + p[b2 * 4 + 1] + p[b2 * 4 + 2]); });
    var cent = [];
    for (j = 0; j < k; j++) { var o = order[Math.floor((j + 0.5) / k * n)] * 4; cent.push([p[o], p[o + 1], p[o + 2]]); }
    var lab = new Int16Array(n);
    for (var it = 0; it < 10; it++) {
      var sum = cent.map(function () { return [0, 0, 0, 0]; });
      for (i = 0; i < n; i++) {
        var bi = 0, bd = 1e9;
        for (j = 0; j < k; j++) {
          var dr = p[i * 4] - cent[j][0], dg = p[i * 4 + 1] - cent[j][1], db = p[i * 4 + 2] - cent[j][2], dd = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
          if (dd < bd) { bd = dd; bi = j; }
        }
        lab[i] = bi; sum[bi][0] += p[i * 4]; sum[bi][1] += p[i * 4 + 1]; sum[bi][2] += p[i * 4 + 2]; sum[bi][3]++;
      }
      for (j = 0; j < k; j++) if (sum[j][3]) cent[j] = [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]];
    }
    for (i = 0; i < n; i++) { var cc = cent[lab[i]]; p[i * 4] = cc[0]; p[i * 4 + 1] = cc[1]; p[i * 4 + 2] = cc[2]; p[i * 4 + 3] = 255; }
    g.putImageData(d, 0, 0);
    return c;
  }

  function drawQr(ctx, text, x, y, size) {
    box(ctx, x, y, size, size, WHITE);
    if (!window.qrcode || !text) return;
    var qr = window.qrcode(0, 'M'); qr.addData(text); qr.make();
    var m = qr.getModuleCount(), pad = 2 * U, cell = Math.floor((size - 2 * pad) / m), off = Math.floor((size - cell * m) / 2);
    ctx.fillStyle = INK;
    for (var r = 0; r < m; r++) for (var c = 0; c < m; c++) if (qr.isDark(r, c)) ctx.fillRect(x + off + c * cell, y + off + r * cell, cell, cell);
  }

  // data: { name, breed, sex, signal, rankName, rankFrac(0~1), cardNo, photo, mode('photo'|'dot'), cols, colors, qr, zoom, qx, qy }
  // zoom: 사진 칸을 꽉 채운 크기의 배수(1 = 꽉 채움, 1보다 작으면 줌아웃 — 남는 곳은 바탕색). qx·qy: 0~1, 사진이 칸 안에서 놓인 자리(0.5 = 가운데)
  function draw(canvas, data) {
    data = data || {};
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';

    // 판 + 테두리
    stepBox(ctx, 0, 0, W, H, PAPER, INK);
    box(ctx, 2 * U, 2 * U, W - 4 * U, 300 - 2 * U, PINK);          // 머리띠
    box(ctx, 2 * U, 300, W - 4 * U, U, INK);
    box(ctx, 2 * U, 300 + U, W - 4 * U, U, PINK_D);
    // 고리 구멍(도트 원)
    var hx = W / 2, hy = 66;
    for (var yy = -5; yy <= 5; yy++) for (var xx = -5; xx <= 5; xx++) {
      var d2 = xx * xx + yy * yy;
      if (d2 <= 30) box(ctx, hx + xx * U - U / 2, hy + yy * U, U, U, d2 >= 20 ? INK : PAPER);
    }

    // 제목
    ctx.fillStyle = INK; ctx.textAlign = 'center';
    ctx.font = font(120); ctx.fillText('WALSON', W / 2, 204);
    ctx.font = font(66); ctx.fillText('WALKING PASS', W / 2, 276);
    var tw = (ctx.font = font(120), ctx.measureText('WALSON').width);
    sprite(ctx, PAW, W / 2 - tw / 2 - 16 * U, 120, 2 * U, INK);
    sprite(ctx, PAW, W / 2 + tw / 2 + 2 * U, 120, 2 * U, INK);

    // 사진 틀(뼈다귀 귀퉁이)
    var fx = FRAME.x, fy = FRAME.y, fw = FRAME.w, fh = FRAME.h;
    box(ctx, fx, fy, fw, fh, INK);
    box(ctx, fx + U, fy + U, fw - 2 * U, fh - 2 * U, PINK);
    box(ctx, fx + 4 * U, fy + 4 * U, fw - 8 * U, fh - 8 * U, INK);
    var px = PHOTO.x, py = PHOTO.y, pw = PHOTO.w, ph = PHOTO.h;
    box(ctx, px, py, pw, ph, PINK_L);
    var img = data.photo;
    if (img) {
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
      if (data.mode === 'dot') {
        var small = dotPhoto(img, pw, ph, data.cols || 48, data.colors || 12, data.zoom, data.qx, data.qy);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(small, px, py, pw, ph);
      } else {
        ctx.imageSmoothingEnabled = true;
        var s = Math.max(pw / img.width, ph / img.height) * (data.zoom || 1), iw = img.width * s, ih = img.height * s;
        ctx.drawImage(img, px + (pw - iw) * (data.qx == null ? 0.5 : data.qx), py + (ph - ih) * (data.qy == null ? 0.5 : data.qy), iw, ih);
        ctx.imageSmoothingEnabled = false;
      }
      ctx.restore();
    } else {
      ctx.fillStyle = PINK_D; ctx.font = font(36); ctx.fillText('사진을 넣어 주세요', px + pw / 2, py + ph / 2);
    }
    // 귀퉁이 뼈다귀 칸
    [[fx - 3 * U, fy - 3 * U], [fx + fw - 6 * U, fy - 3 * U], [fx - 3 * U, fy + fh - 6 * U], [fx + fw - 6 * U, fy + fh - 6 * U]].forEach(function (q) {
      box(ctx, q[0], q[1], 9 * U, 9 * U, INK);
      box(ctx, q[0] + U, q[1] + U, 7 * U, 7 * U, PINK);
      box(ctx, q[0] + 3 * U, q[1] + 3 * U, 3 * U, 3 * U, PINK_L);
    });

    // 오른쪽 칸 — 번호 · 이름 · 견종
    var rx = 654, rw = W - 54 - rx, ry = 354;
    var bits = [];
    if (data.sex === 'female') bits.push('암컷'); else if (data.sex === 'male') bits.push('수컷');
    if (data.breed) bits.push(data.breed);
    var rowsInfo = [['번호', data.cardNo || '0001'], ['이름', data.name || '우리 강아지'], ['견종', bits.join(' · ') || '-']];
    ctx.textAlign = 'left';
    rowsInfo.forEach(function (row, i) {
      var y = ry + i * 126;
      stepBox(ctx, rx, y, rw, 102, WHITE, INK, PINK);
      ctx.fillStyle = LABEL; ctx.font = font(36); ctx.fillText(row[0], rx + 5 * U, y + 64);
      ctx.fillStyle = INK; fit(ctx, row[1], rw - 27 * U, 48, 24); ctx.fillText(row[1], rx + 21 * U, y + 68);
    });
    dashes(ctx, rx, rx + rw, 744, PINK_D);

    // 성향 띠(안전 표시 — 원래 주민증과 같은 문구·색)
    // 성향이 없거나 모르는 값이면 초록으로 그리지 않는다(안전 표시라 잘못 알려 주면 안 됨) — 지킴이 카드처럼 문구·색을 받으면 그것으로
    var known = SIGNALS[data.signal] ? data.signal : '';
    var sig = SIGNALS[data.signal] || { line: data.signalLine || '성향을 골라 주세요', color: data.signalColor || '#8d7a86' }, sy = 780, sh = 246;
    stepBox(ctx, rx, sy, rw, sh, sig.color, INK, PINK);
    // 신호등 불 셋(켜진 것만 밝게)
    ['green', 'yellow', 'red'].forEach(function (k, i) {
      var lx = rx + 5 * U + i * 9 * U, ly = sy + 4 * U;
      box(ctx, lx, ly, 7 * U, 7 * U, INK);
      box(ctx, lx + U, ly + U, 5 * U, 5 * U, k === known ? SIGNALS[k].color : '#7a6670');
      if (k === known) box(ctx, lx + 2 * U, ly + 2 * U, U, U, WHITE);
    });
    ctx.fillStyle = WHITE;
    // 한 줄에 48로 들어가면 한 줄, 아니면 띄어쓰기에서 두 줄
    var lines = [sig.line], lsz = 54;
    ctx.font = font(lsz);
    if (ctx.measureText(sig.line).width > rw - 10 * U) {
      lines = split2(sig.line); lsz = 54;
      lines.forEach(function (l) { lsz = Math.min(lsz, fit(ctx, l, rw - 10 * U, 54, 30)); });
    }
    ctx.font = font(lsz);
    lines.forEach(function (l, i) { ctx.fillText(l, rx + 5 * U, sy + 150 + (i - (lines.length - 1) / 2) * (lsz + 12)); });

    // 아래 — 산책 등급 게이지
    var by = 1080, L = 54, R = W - 54;
    ctx.fillStyle = LABEL; ctx.font = font(36); ctx.fillText('산책 등급', L, by + 30);
    ctx.fillStyle = INK; ctx.font = font(48); ctx.fillText(data.rankName || '산책 입문자', L + 32 * U, by + 34);
    var frac = Math.max(0, Math.min(1, data.rankFrac == null ? 0.3 : data.rankFrac));
    var on = frac >= 1 ? 10 : Math.min(9, Math.max(frac > 0 ? 1 : 0, Math.round(frac * 10)));
    var gw = 12 * U;
    for (var gi = 0; gi < 10; gi++) {
      var gx = L + gi * (gw + 2 * U);
      box(ctx, gx, by + 66, gw, 8 * U, INK);
      box(ctx, gx + U, by + 66 + U, gw - 2 * U, 6 * U, gi < on ? PINK : WHITE);
    }

    // WALSON 알약 + 문구 · QR(나도 만들기 — 원래 주민증과 같은 주소)
    var B = (window.WALSON_CONFIG && window.WALSON_CONFIG.brand) || { name: 'WALSON', tagline: '당신과 강아지의 유의미한 산책' };
    var qs = 246, qx = R - qs, qy = 1200;
    stepBox(ctx, L, 1236, 474, 108, PINK, INK, PINK_D);
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.font = font(66);
    ctx.fillText(B.name || 'WALSON', L + 237, 1312);
    ctx.textAlign = 'left'; ctx.font = font(fit(ctx, B.tagline || '', qx - L - 6 * U, 36, 24));
    ctx.fillText(B.tagline || '', L, 1410);
    stepBox(ctx, qx - U, qy - U, qs + 2 * U, qs + 2 * U, WHITE, INK);
    drawQr(ctx, data.qr, qx + U, qy + U, qs - 2 * U);
    ctx.textAlign = 'left';
    return canvas;
  }

  function fontsReady() {
    if (!document.getElementById('dunggeunmo-face')) {
      var st = document.createElement('style'); st.id = 'dunggeunmo-face';
      st.textContent = "@font-face{font-family:'DungGeunMo';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/DungGeunMo.woff') format('woff');}";
      document.head.appendChild(st);
    }
    return (document.fonts && document.fonts.load) ? document.fonts.load("48px 'DungGeunMo'", '워킹패스 WALSON').catch(function () {}) : Promise.resolve();
  }

  // ── 사진 맞추기(2026-11-22) — 시안 화면(pass-pixel-sample.html)과 [워킹패스](my-card.html)가 같이 쓴다 ──
  // 맞춤 fit = { zoom, qx, qy } — zoom: 사진 칸을 꽉 채운 크기의 배수(1 = 꽉 채움, 1보다 작으면 줌아웃), qx·qy: 0~1 사진이 칸 안에 놓인 자리.
  // 사진 칸 위에 얹은 칸(el)에 끌어서 옮기기 · 두 손가락 · 마우스 휠 · 방향키와 +/− 키를 붙인다. 그 칸만 touch-action: none이라
  // 나머지 곳에서는 화면이 그대로 스크롤된다. 사진은 이 휴대폰 안에서만 다룬다.
  var FIT = { MIN: 0.5, MAX: 4, DEFAULT: { zoom: 1, qx: 0.5, qy: 0.5 } };
  function clampN(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fitMath(photo) {
    // 이 크기에서 사진이 사진 칸 안에 그려지는 너비·높이(판 단위) — draw()와 같은 셈(꽉 채움 × zoom)
    function imgSize(z) {
      var w0 = photo ? (photo.naturalWidth || photo.width) : PHOTO.w, h0 = photo ? (photo.naturalHeight || photo.height) : PHOTO.h;
      var sc = Math.max(PHOTO.w / w0, PHOTO.h / h0) * z;
      return { w: w0 * sc, h: h0 * sc };
    }
    // 사진 왼쪽 위가 사진 칸 왼쪽 위에서 떨어진 거리(판 단위) ↔ qx·qy
    function offsetOf(st) { var m = imgSize(st.zoom); return { x: (PHOTO.w - m.w) * st.qx, y: (PHOTO.h - m.h) * st.qy, w: m.w, h: m.h }; }
    // 크기와 떨어진 거리로 qx·qy를 다시 셈 — 0~1로 묶어 사진이 칸 밖으로 빠져 빈 곳이 생기지 않게(줌아웃이면 칸 안에서만 움직임)
    function placeAt(z, ox, oy) {
      z = clampN(z, FIT.MIN, FIT.MAX);
      var m = imgSize(z), sx = PHOTO.w - m.w, sy = PHOTO.h - m.h;
      return { zoom: z, qx: Math.abs(sx) < 0.5 ? 0.5 : clampN(ox / sx, 0, 1), qy: Math.abs(sy) < 0.5 ? 0.5 : clampN(oy / sy, 0, 1) };
    }
    // 사진 칸의 한 점(fx, fy)을 붙잡은 채 크기를 바꾼다 — 그 점은 (tx, ty)로 간다(두 손가락 사이·휠 자리·칸 가운데)
    function zoomAround(base, z, fx, fy, tx, ty) {
      var o = offsetOf(base), u = (fx - o.x) / o.w, v = (fy - o.y) / o.h, m = imgSize(clampN(z, FIT.MIN, FIT.MAX));
      return placeAt(z, (tx == null ? fx : tx) - u * m.w, (ty == null ? fy : ty) - v * m.h);
    }
    return { imgSize: imgSize, offsetOf: offsetOf, placeAt: placeAt, zoomAround: zoomAround };
  }
  // 지금 맞춤에서 칸 가운데를 붙잡고 크기만 바꾸기(막대·[−][+] 버튼)
  function zoomCenter(photo, fit, z) { return fitMath(photo).zoomAround(fit, z, PHOTO.w / 2, PHOTO.h / 2); }
  // o: { photo(): 지금 사진, get(): 지금 맞춤, set(fit): 바꾼 맞춤 }
  function bindFit(el, o) {
    el.style.left = (PHOTO.x / W * 100) + '%'; el.style.top = (PHOTO.y / H * 100) + '%';
    el.style.width = (PHOTO.w / W * 100) + '%'; el.style.height = (PHOTO.h / H * 100) + '%';
    var ptrs = {}, g = null;
    function toFrame(cx, cy) { var r = el.getBoundingClientRect(), k = PHOTO.w / (r.width || 1); return { x: (cx - r.left) * k, y: (cy - r.top) * k }; }
    function list() { return Object.keys(ptrs).map(function (id) { return ptrs[id]; }); }
    // 손가락 수가 바뀔 때마다 지금 상태에서 새로 시작(한 손가락 = 옮기기, 두 손가락 = 크기 + 옮기기)
    function begin() {
      var ps = list();
      if (ps.length === 1) g = { kind: 'drag', p0: toFrame(ps[0].x, ps[0].y), base: o.get() };
      else if (ps.length >= 2) {
        var a = toFrame(ps[0].x, ps[0].y), b = toFrame(ps[1].x, ps[1].y);
        g = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, m0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, base: o.get() };
      } else g = null;
      el.classList.toggle('on', !!g);
    }
    el.addEventListener('pointerdown', function (e) {
      if (!o.photo() || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault(); e.stopPropagation();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* 붙잡지 못해도 움직임은 받음 */ }
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      begin();
    });
    el.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId] || !g) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ps = list(), fm = fitMath(o.photo());
      if (g.kind === 'drag' && ps.length === 1) {
        var p = toFrame(ps[0].x, ps[0].y), q = fm.offsetOf(g.base);
        o.set(fm.placeAt(g.base.zoom, q.x + p.x - g.p0.x, q.y + p.y - g.p0.y));
      } else if (g.kind === 'pinch' && ps.length >= 2) {
        var a = toFrame(ps[0].x, ps[0].y), b = toFrame(ps[1].x, ps[1].y);
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        o.set(fm.zoomAround(g.base, g.base.zoom * d / g.d0, g.m0.x, g.m0.y, (a.x + b.x) / 2, (a.y + b.y) / 2));
      }
    });
    function end(e) { if (!ptrs[e.pointerId]) return; delete ptrs[e.pointerId]; begin(); }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('click', function (e) { e.stopPropagation(); });   // 밑의 카드(뒤집기 등)까지 눌리지 않게
    el.addEventListener('wheel', function (e) {
      if (!o.photo()) return;
      e.preventDefault();   // 사진 칸 위에서만 휠이 확대·축소 — 다른 곳에서는 그대로 스크롤
      var p = toFrame(e.clientX, e.clientY), cur = o.get();
      o.set(fitMath(o.photo()).zoomAround(cur, cur.zoom * Math.exp(-e.deltaY * 0.0015), p.x, p.y));
    }, { passive: false });
    el.addEventListener('keydown', function (e) {
      if (!o.photo()) return;
      var cur = o.get(), fm = fitMath(o.photo()), q = fm.offsetOf(cur), step = 18, k = e.key;
      if (k === 'ArrowLeft') o.set(fm.placeAt(cur.zoom, q.x - step, q.y));
      else if (k === 'ArrowRight') o.set(fm.placeAt(cur.zoom, q.x + step, q.y));
      else if (k === 'ArrowUp') o.set(fm.placeAt(cur.zoom, q.x, q.y - step));
      else if (k === 'ArrowDown') o.set(fm.placeAt(cur.zoom, q.x, q.y + step));
      else if (k === '+' || k === '=') o.set(zoomCenter(o.photo(), cur, cur.zoom * 1.2));
      else if (k === '-' || k === '_') o.set(zoomCenter(o.photo(), cur, cur.zoom / 1.2));
      else return;
      e.preventDefault();
    });
  }

  window.WalsonPassPixel = { W: W, H: H, PHOTO: PHOTO, SIGNALS: SIGNALS, draw: draw, dotPhoto: dotPhoto, fontsReady: fontsReady,
    FIT: FIT, fitMath: fitMath, zoomCenter: zoomCenter, bindFit: bindFit };
})();
