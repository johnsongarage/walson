// 세로형 워킹패스(키링·굿즈 앞면) 시안 — 2026-11-19 가르시아 "이 정도로 워킹패스를 꽉 차게" → "저기에 맞는 틀 시안, 사진만 갈아끼우게".
// 가르시아가 보여 준 아크릴 키링 시안(DASAN WALK CLUB / WALKING PASS, 경고 테이프, 큰 사진, 아래 경고 띠 + QR)을 틀로 옮긴 것.
// 성향 셋(red 만지지 마세요 / yellow 천천히 / green 다가와도 좋아요)마다 띠·스티커·문구가 바뀐다 — 경고 테이프는 빨강에만.
// 사진: 배경을 지운 PNG(누끼)면 강아지만 크게 + 뒤에 색 원, 보통 사진이면 둥근 칸에 꽉 차게.
// 크기 1000×1600(5:8). 인쇄 규격은 정해지면 바꾼다. window.WalsonPassV.draw(canvas, data)
(function () {
  var W = 1000, H = 1600;
  var SANS = 'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  var BIG = '"Black Han Sans", ' + SANS;
  var INK = '#1d1a17', CREAM = '#fbf1d6';

  // 성향별 모양 — 문구는 앱 신호등(id-card.js SIGNALS)과 같은 뜻
  var VARIANTS = {
    red: {
      frame: '#e2372f', tape: ['#121215', '#ffcc00'], band: '#e2372f', bandInk: '#ffffff', bandTape: ['#121215', '#e2372f'],
      main: '만지지 마세요', sub: '(눈으로만 예뻐해 주세요)', icon: true, sticker: ['DO NOT', 'TOUCH'], stickerBg: '#e2372f', stickerInk: '#ffffff',
      tint: 'rgba(226, 55, 47, 0.12)'
    },
    yellow: {
      frame: '#f2a900', tape: ['#121215', '#ffcc00'], band: '#ffcc00', bandInk: INK, bandTape: ['#121215', '#ffcc00'],
      main: '천천히 인사해요', sub: '(보호자에게 먼저 물어봐 주세요)', icon: false, sticker: ['SLOW', 'HI'], stickerBg: '#ffcc00', stickerInk: INK,
      tint: 'rgba(242, 169, 0, 0.16)'
    },
    green: {
      frame: '#3f9b5b', tape: ['#3f9b5b', '#fbf1d6'], band: '#3f9b5b', bandInk: '#ffffff', bandTape: ['#ffffff', '#3f9b5b'],
      main: '다가와도 좋아요', sub: '(반갑게 인사해 주세요)', icon: false, sticker: ['SAY', 'HI!'], stickerBg: '#3f9b5b', stickerInk: '#ffffff',
      tint: 'rgba(63, 155, 91, 0.14)'
    }
  };

  function font(w, s, fam) { return w + ' ' + s + 'px ' + (fam || SANS); }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function fit(ctx, text, maxW, size, w, fam) {
    var s = size;
    do { ctx.font = font(w, s, fam); if (ctx.measureText(text).width <= maxW) break; s -= 3; } while (s > 18);
    return s;
  }
  // 빗금 테이프(경고 테이프) — 칸 안에만
  function tape(ctx, x, y, w, h, colors, step) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = colors[1]; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = colors[0];
    step = step || h * 1.4;
    for (var sx = x - h * 2; sx < x + w + h; sx += step * 2) {
      ctx.beginPath();
      ctx.moveTo(sx, y + h); ctx.lineTo(sx + h, y); ctx.lineTo(sx + h + step, y); ctx.lineTo(sx + step, y + h);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // 별 모양 스티커
  function starburst(ctx, cx, cy, r, n, fill) {
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var a = Math.PI * i / n - Math.PI / 2, rad = i % 2 ? r * 0.84 : r;
      ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  }
  // 배경이 지워진 사진인지(가장자리에 투명한 점이 많으면 누끼로 본다)
  function isCutout(img) {
    try {
      var c = document.createElement('canvas'), n = 48;
      c.width = n; c.height = n;
      var g = c.getContext('2d');
      g.drawImage(img, 0, 0, n, n);
      var d = g.getImageData(0, 0, n, n).data, clear = 0, edge = 0;
      for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
        if (x > 2 && x < n - 3 && y > 2 && y < n - 3) continue;
        edge++;
        if (d[(y * n + x) * 4 + 3] < 40) clear++;
      }
      return clear / edge > 0.4;
    } catch (e) { return false; }
  }
  // 누끼 사진의 실제 강아지 영역(투명 아닌 곳)만 잘라 쓰기 — 여백이 많은 PNG도 크게 나오게
  function trimBox(img) {
    try {
      var n = 200, s = Math.min(1, n / Math.max(img.width, img.height));
      var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
      var g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
      var d = g.getImageData(0, 0, c.width, c.height).data, x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (var y = 0; y < c.height; y++) for (var x = 0; x < c.width; x++) {
        if (d[(y * c.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 <= x0 || y1 <= y0) return null;
      return { x: x0 / s, y: y0 / s, w: (x1 - x0 + 1) / s, h: (y1 - y0 + 1) / s };
    } catch (e) { return null; }
  }
  function drawQr(ctx, text, x, y, size) {
    ctx.fillStyle = '#ffffff'; rr(ctx, x, y, size, size, 14); ctx.fill();
    if (!window.qrcode || !text) {
      ctx.fillStyle = '#d8d0c4'; ctx.font = font(700, 26); ctx.textAlign = 'center';
      ctx.fillText('QR', x + size / 2, y + size / 2 + 9); ctx.textAlign = 'left';
      return;
    }
    var qr = qrcode(0, 'M'); qr.addData(text); qr.make();
    var m = qr.getModuleCount(), pad = 12, cell = (size - pad * 2) / m;
    ctx.fillStyle = INK;
    for (var r = 0; r < m; r++) for (var c = 0; c < m; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(x + pad + c * cell, y + pad + r * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }

  // 편집할 수 있는 칸(2026-11-19 가르시아 "디자인 편집할 수 있게 해") — data.design에 같은 이름으로 넣으면 성향 기본값 위에 덮는다.
  //   글자: club, title, main, sub, sticker1, sticker2, side(왼쪽 세로 글자), footer(맨 아래 둘째 줄 끝)
  //   색: frame(테두리), cream(바탕), ink(글자), tapeA·tapeB(제목 아래 테이프), band·bandInk(아래 띠), bandTapeA·bandTapeB, stickerBg·stickerInk, tint(누끼 뒤 원)
  //   켜고 끄기: showSticker, showSide, showRank, showQr, showTitleTape, showBandTape, showHole
  //   사진: photoMode('auto'|'cutout'|'box'), zoom(1~3), qx·qy(0~1, 가운데 0.5)
  var DEFAULTS = {
    club: 'WALSON WALK CLUB', title: 'WALKING PASS', side: 'WALSON MATE', footer: '재미로 만든 굿즈',
    cream: CREAM, ink: INK,
    showSticker: true, showSide: true, showRank: true, showQr: true, showTitleTape: true, showBandTape: true, showHole: true,
    photoMode: 'auto', zoom: 1, qx: 0.5, qy: 0.5
  };
  function designFor(signal, design) {
    var v = VARIANTS[signal] || VARIANTS.red, d = {};
    Object.keys(DEFAULTS).forEach(function (k) { d[k] = DEFAULTS[k]; });
    d.frame = v.frame; d.tapeA = v.tape[0]; d.tapeB = v.tape[1]; d.band = v.band; d.bandInk = v.bandInk;
    d.bandTapeA = v.bandTape[0]; d.bandTapeB = v.bandTape[1]; d.main = v.main; d.sub = v.sub; d.icon = v.icon;
    d.sticker1 = v.sticker[0]; d.sticker2 = v.sticker[1]; d.stickerBg = v.stickerBg; d.stickerInk = v.stickerInk; d.tint = v.tint;
    if (design) Object.keys(design).forEach(function (k) { if (design[k] !== undefined && design[k] !== null && design[k] !== '') d[k] = design[k]; });
    return d;
  }

  // data: { name, nameEn, breed, signal('red'|'yellow'|'green'), level(숫자), rankName, place, cardNo, photo(그림), qr(주소), design(위 칸들) }
  // 그린 뒤 canvas._photoBox = 사진 칸(끌어서 옮기기용)
  function draw(canvas, data) {
    data = data || {};
    var v = designFor(data.signal, data.design), ink = v.ink;
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';

    // 아크릴 테두리 + 바탕 판
    rr(ctx, 0, 0, W, H, 64); ctx.fillStyle = v.frame; ctx.fill();
    rr(ctx, 30, 30, W - 60, H - 60, 40); ctx.fillStyle = v.cream; ctx.fill();
    if (v.showHole) {   // 고리 구멍 자리
      ctx.beginPath(); ctx.arc(W / 2, 78, 24, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
    }

    // 제목
    var L = 90, R = W - 90;
    ctx.fillStyle = ink;
    ctx.fillRect(L, 150, R - L, 6);
    ctx.textAlign = 'center';
    ctx.font = font(400, fit(ctx, v.club, R - L, 78, 400, BIG), BIG);
    ctx.fillText(v.club, W / 2, 238);
    ctx.fillRect(L, 262, R - L, 6);
    ctx.font = font(400, fit(ctx, v.title, R - L, 128, 400, BIG), BIG);
    ctx.fillText(v.title, W / 2, 384);
    ctx.fillRect(L, 404, R - L, 6);
    if (v.showTitleTape) tape(ctx, L, 420, R - L, 40, [v.tapeA, v.tapeB], 30);

    // 사진
    var top = 478, bottom = 1028, img = data.photo, zoom = Math.max(1, Number(v.zoom) || 1);
    var qx = v.qx == null ? 0.5 : Number(v.qx), qy = v.qy == null ? 0.5 : Number(v.qy);
    var narrow = v.showRank;   // 등급 글자가 있으면 사진을 조금 왼쪽·좁게
    canvas._photoBox = null;
    if (img) {
      var cut = v.photoMode === 'cutout' || (v.photoMode === 'auto' && isCutout(img));
      if (cut) {
        var tb = trimBox(img) || { x: 0, y: 0, w: img.width, h: img.height };
        var mid = narrow ? W / 2 - 50 : W / 2;
        // 뒤에 연한 색 원 — 흰 강아지도 바탕에서 떠 보이게
        ctx.beginPath(); ctx.arc(mid, top + (bottom - top) * 0.55, 260, 0, Math.PI * 2); ctx.fillStyle = v.tint; ctx.fill();
        var maxW = narrow ? 600 : 700, maxH = bottom - top;
        var sc = Math.min(maxW / tb.w, maxH / tb.h) * zoom, dw = tb.w * sc, dh = tb.h * sc;
        var dx = mid - dw / 2 + (qx - 0.5) * -400, dy = bottom - dh + (qy - 0.5) * -400;
        ctx.save();
        ctx.beginPath(); ctx.rect(30, 470, W - 60, bottom - 470 + 4); ctx.clip();   // 제목·이름 칸을 넘지 않게
        ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
        ctx.drawImage(img, tb.x, tb.y, tb.w, tb.h, dx, dy, dw, dh);
        ctx.restore();
        canvas._photoBox = { x: 90, y: top, w: W - 180, h: bottom - top, mode: 'cutout' };
      } else {
        var bw = narrow ? 540 : 640, bh = bottom - top - 10, bx = narrow ? 172 : W / 2 - bw / 2;
        ctx.save();
        rr(ctx, bx, top, bw, bh, 36); ctx.clip();
        var s2 = Math.max(bw / img.width, bh / img.height) * zoom;
        var iw = img.width * s2, ih = img.height * s2;
        ctx.drawImage(img, bx - (iw - bw) * qx, top - (ih - bh) * qy, iw, ih);
        ctx.restore();
        ctx.lineWidth = 8; ctx.strokeStyle = ink; rr(ctx, bx, top, bw, bh, 36); ctx.stroke();
        canvas._photoBox = { x: bx, y: top, w: bw, h: bh, mode: 'box' };
      }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.06)'; rr(ctx, 172, top, 540, bottom - top - 10, 36); ctx.fill();
      ctx.fillStyle = '#9b8f80'; ctx.font = font(700, 36); ctx.fillText('사진을 넣어 주세요', 442, (top + bottom) / 2);
    }

    // 스티커(오른쪽 위)
    if (v.showSticker && (v.sticker1 || v.sticker2)) {
      ctx.save();
      ctx.translate(812, 560); ctx.rotate(0.22);
      starburst(ctx, 0, 0, 88, 14, v.stickerBg);
      ctx.fillStyle = v.stickerInk; ctx.textAlign = 'center';
      var two = v.sticker1 && v.sticker2;
      ctx.font = font(400, fit(ctx, String(v.sticker1 || v.sticker2), 140, 34, 400, BIG), BIG);
      if (two) { ctx.fillText(v.sticker1, 0, -4); ctx.font = font(400, fit(ctx, String(v.sticker2), 140, 34, 400, BIG), BIG); ctx.fillText(v.sticker2, 0, 34); }
      else ctx.fillText(v.sticker1 || v.sticker2, 0, 12);
      ctx.restore();
    }

    // 왼쪽 세로 글자 · 오른쪽 등급
    if (v.showSide) {
      ctx.save();
      ctx.translate(122, 900); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'left'; ctx.fillStyle = ink; ctx.font = font(800, 24);
      ctx.fillText(v.side + (data.cardNo ? '  ·  NO. ' + data.cardNo : ''), 0, 0);
      ctx.restore();
    }
    if (v.showRank) {
      ctx.textAlign = 'right'; ctx.fillStyle = ink;
      ctx.font = font(400, 56, BIG); ctx.fillText('Lv.' + (data.level == null ? 1 : data.level), R + 4, 900);
      ctx.font = font(800, 26); ctx.fillText(data.rankName || '산책 입문자', R + 4, 940);
      ctx.font = font(700, 24); ctx.globalAlpha = 0.75; ctx.fillText(data.place || '', R + 4, 976);   // 11/24 전국판 — 동네 이름을 주면만 ctx.globalAlpha = 1;
    }

    // 이름
    ctx.textAlign = 'center'; ctx.fillStyle = ink;
    var nm = (data.name || '우리 강아지') + (data.nameEn ? ' (' + data.nameEn + ')' : '');
    ctx.font = font(400, fit(ctx, nm, R - L, 118, 400, BIG), BIG);
    ctx.fillText(nm, W / 2, 1150);
    if (data.breed) {
      ctx.font = font(700, fit(ctx, data.breed, R - L, 40, 700)); ctx.globalAlpha = 0.85;
      ctx.fillText(data.breed, W / 2, 1210); ctx.globalAlpha = 1;
    }

    // 아래 띠 — 성향 문구 + QR
    var by = 1250, bh2 = 236;
    ctx.fillStyle = v.band; ctx.fillRect(30, by, W - 60, bh2);
    if (v.showBandTape) {
      tape(ctx, 30, by, W - 60, 26, [v.bandTapeA, v.bandTapeB], 22);
      tape(ctx, 30, by + bh2 - 26, W - 60, 26, [v.bandTapeA, v.bandTapeB], 22);
    }
    var qs = 168, qrx = R - qs + 10, qry = by + (bh2 - qs) / 2;
    if (v.showQr) drawQr(ctx, data.qr, qrx, qry, qs);
    var tx = L - 10, tw = (v.showQr ? qrx - 24 : R + 10) - tx, cxm = tx + tw / 2;
    ctx.fillStyle = v.bandInk; ctx.textAlign = 'center';
    var mainText = v.main || '', iconW = 0;
    var ms = fit(ctx, mainText, tw - (v.icon ? 80 : 0), 72, 900);
    ctx.font = font(900, ms);
    var mw = ctx.measureText(mainText).width;
    if (v.icon && mainText) {
      // 경고 세모(빨강만)
      iconW = ms * 0.95 + 14;
      var ix = cxm - (mw + iconW) / 2, iy = by + 132;
      ctx.beginPath(); ctx.moveTo(ix + ms * 0.47, iy - ms * 0.82); ctx.lineTo(ix + ms * 0.95, iy); ctx.lineTo(ix, iy); ctx.closePath();
      ctx.fillStyle = INK; ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = font(900, ms * 0.6); ctx.fillText('!', ix + ms * 0.47, iy - ms * 0.08);
      ctx.fillStyle = v.bandInk; ctx.font = font(900, ms);
      ctx.textAlign = 'left'; ctx.fillText(mainText, ix + iconW, by + 132); ctx.textAlign = 'center';
    } else {
      ctx.fillText(mainText, cxm, v.sub ? by + 132 : by + 148);
    }
    if (v.sub) { ctx.font = font(800, fit(ctx, v.sub, tw, 40, 800)); ctx.fillText(v.sub, cxm, by + 188); }

    // 맨 아래 — 브랜드 두 줄(홍보물 규칙: site-config.js brand — 여기선 못 고친다)
    var B = (window.WALSON_CONFIG && window.WALSON_CONFIG.brand) || { name: 'WALSON', tagline: '당신과 강아지의 유의미한 산책' };
    ctx.fillStyle = ink; ctx.textAlign = 'center';
    ctx.font = font(400, 34, BIG); ctx.fillText(B.name || 'WALSON', W / 2, 1522);
    ctx.font = font(700, 24); ctx.globalAlpha = 0.75;
    ctx.fillText((B.tagline || '') + (v.footer ? '  ·  ' + v.footer : ''), W / 2, 1556);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
    return canvas;
  }

  window.WalsonPassV = { W: W, H: H, VARIANTS: VARIANTS, DEFAULTS: DEFAULTS, designFor: designFor, draw: draw, isCutout: isCutout };
})();
