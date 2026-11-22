// 도트 워킹패스(키링·굿즈 앞면) 시안 — 2026-11-22 가르시아가 보여 준 도트 아크릴 키링("WALSON WALKING PASS", 분홍 머리띠,
// 뼈다귀 귀퉁이 사진 틀, 오른쪽 칸 ID·NAME·TYPE, 아래 WALSON 알약 + QR)을 틀로 옮긴 것. 시안 화면은 pass-pixel-sample.html.
// 원래 그림과 다른 점: 칸 이름은 한국어(번호·이름·견종), 성향 띠(안전 표시)·산책 등급 칸을 넣었고, 맨 아래 홍보물 문구 두 줄(site-config.js brand).
// 모든 선·칸은 U(6px) 칸에 맞춰 그리고, 글자는 둥근모꼴(DungGeunMo — 도트 지도 이름 글자와 같은 글꼴).
// 사진: mode 'photo' = 원래 사진 그대로, 'dot' = cols칸으로 줄이고 색을 palette개로 줄여 도트로(이 휴대폰 안에서만, 어디로도 안 보냄).
// 크기 1200×1500(4:5). 인쇄 규격은 정해지면 바꾼다. window.WalsonPassPixel.draw(canvas, data)
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
    var fx = 54, fy = 354, fw = 552, fh = 672;
    box(ctx, fx, fy, fw, fh, INK);
    box(ctx, fx + U, fy + U, fw - 2 * U, fh - 2 * U, PINK);
    box(ctx, fx + 4 * U, fy + 4 * U, fw - 8 * U, fh - 8 * U, INK);
    var px = fx + 5 * U, py = fy + 5 * U, pw = fw - 10 * U, ph = fh - 10 * U;
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
    var sig = SIGNALS[data.signal] || SIGNALS.green, sy = 780, sh = 246;
    stepBox(ctx, rx, sy, rw, sh, sig.color, INK, PINK);
    // 신호등 불 셋(켜진 것만 밝게)
    ['green', 'yellow', 'red'].forEach(function (k, i) {
      var lx = rx + 5 * U + i * 9 * U, ly = sy + 4 * U;
      box(ctx, lx, ly, 7 * U, 7 * U, INK);
      box(ctx, lx + U, ly + U, 5 * U, 5 * U, k === (data.signal || 'green') ? SIGNALS[k].color : '#7a6670');
      if (k === (data.signal || 'green')) box(ctx, lx + 2 * U, ly + 2 * U, U, U, WHITE);
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

  window.WalsonPassPixel = { W: W, H: H, SIGNALS: SIGNALS, draw: draw, dotPhoto: dotPhoto, fontsReady: fontsReady };
})();
