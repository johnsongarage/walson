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

  // data: { name, nameEn, breed, signal('red'|'yellow'|'green'), level(숫자), rankName, place, cardNo, photo(그림), qr(주소), club, frame(테두리 색, 없으면 성향 색) }
  function draw(canvas, data) {
    data = data || {};
    var v = VARIANTS[data.signal] || VARIANTS.red;
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';

    // 아크릴 테두리 + 크림 판
    rr(ctx, 0, 0, W, H, 64); ctx.fillStyle = data.frame || v.frame; ctx.fill();
    rr(ctx, 30, 30, W - 60, H - 60, 40); ctx.fillStyle = CREAM; ctx.fill();
    // 고리 구멍 자리
    ctx.beginPath(); ctx.arc(W / 2, 78, 24, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();

    // 제목
    var L = 90, R = W - 90;
    ctx.fillStyle = INK;
    ctx.fillRect(L, 150, R - L, 6);
    ctx.textAlign = 'center';
    var club = data.club || 'DASAN WALK CLUB';
    ctx.font = font(400, fit(ctx, club, R - L, 78, 400, BIG), BIG);
    ctx.fillText(club, W / 2, 238);
    ctx.fillRect(L, 262, R - L, 6);
    ctx.font = font(400, fit(ctx, 'WALKING PASS', R - L, 128, 400, BIG), BIG);
    ctx.fillText('WALKING PASS', W / 2, 384);
    ctx.fillRect(L, 404, R - L, 6);
    tape(ctx, L, 420, R - L, 40, v.tape, 30);

    // 사진
    var top = 478, bottom = 1028, img = data.photo;
    if (img) {
      if (isCutout(img)) {
        var tb = trimBox(img) || { x: 0, y: 0, w: img.width, h: img.height };
        // 뒤에 연한 성향 색 원 — 흰 강아지도 크림 바탕에서 떠 보이게
        var mid = W / 2 - 50;   // 오른쪽 등급 글자 자리만큼 왼쪽으로
        ctx.beginPath(); ctx.arc(mid, top + (bottom - top) * 0.55, 260, 0, Math.PI * 2); ctx.fillStyle = v.tint; ctx.fill();
        var maxW = 600, maxH = bottom - top;
        var s = Math.min(maxW / tb.w, maxH / tb.h), dw = tb.w * s, dh = tb.h * s;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
        ctx.drawImage(img, tb.x, tb.y, tb.w, tb.h, mid - dw / 2, bottom - dh, dw, dh);
        ctx.restore();
      } else {
        // 오른쪽 등급 글자와 안 겹치게 조금 왼쪽으로, 폭 540
        var bw = 540, bh = bottom - top - 10, bx = 172;
        ctx.save();
        rr(ctx, bx, top, bw, bh, 36); ctx.clip();
        var s2 = Math.max(bw / img.width, bh / img.height) * (data.zoom || 1);
        var iw = img.width * s2, ih = img.height * s2;
        ctx.drawImage(img, bx - (iw - bw) * (data.qx == null ? 0.5 : data.qx), top - (ih - bh) * (data.qy == null ? 0.5 : data.qy), iw, ih);
        ctx.restore();
        ctx.lineWidth = 8; ctx.strokeStyle = INK; rr(ctx, bx, top, bw, bh, 36); ctx.stroke();
      }
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.06)'; rr(ctx, 172, top, 540, bottom - top - 10, 36); ctx.fill();
      ctx.fillStyle = '#9b8f80'; ctx.font = font(700, 36); ctx.fillText('사진을 넣어 주세요', 442, (top + bottom) / 2);
    }

    // 스티커(오른쪽 위)
    ctx.save();
    ctx.translate(812, 560); ctx.rotate(0.22);
    starburst(ctx, 0, 0, 88, 14, v.stickerBg);
    ctx.fillStyle = v.stickerInk; ctx.textAlign = 'center';
    ctx.font = font(400, 34, BIG);
    ctx.fillText(v.sticker[0], 0, -4); ctx.fillText(v.sticker[1], 0, 34);
    ctx.restore();

    // 왼쪽 세로 글자 · 오른쪽 등급
    ctx.save();
    ctx.translate(122, 900); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'left'; ctx.fillStyle = INK; ctx.font = font(800, 24);
    ctx.fillText('WALSON MATE  ·  NO. ' + (data.cardNo || '0000'), 0, 0);
    ctx.restore();
    ctx.textAlign = 'right'; ctx.fillStyle = INK;
    ctx.font = font(400, 56, BIG); ctx.fillText('Lv.' + (data.level == null ? 1 : data.level), R + 4, 900);
    ctx.font = font(800, 26); ctx.fillText(data.rankName || '산책 입문자', R + 4, 940);
    ctx.font = font(700, 24); ctx.fillStyle = '#5b5148'; ctx.fillText(data.place || '남양주 다산동', R + 4, 976);

    // 이름
    ctx.textAlign = 'center'; ctx.fillStyle = INK;
    var nm = (data.name || '우리 강아지') + (data.nameEn ? ' (' + data.nameEn + ')' : '');
    ctx.font = font(400, fit(ctx, nm, R - L, 118, 400, BIG), BIG);
    ctx.fillText(nm, W / 2, 1150);
    if (data.breed) {
      ctx.font = font(700, fit(ctx, data.breed, R - L, 40, 700)); ctx.fillStyle = '#3f3831';
      ctx.fillText(data.breed, W / 2, 1210);
    }

    // 아래 띠 — 성향 문구 + QR
    var by = 1250, bh2 = 236;
    ctx.fillStyle = v.band; ctx.fillRect(30, by, W - 60, bh2);
    tape(ctx, 30, by, W - 60, 26, v.bandTape, 22);
    tape(ctx, 30, by + bh2 - 26, W - 60, 26, v.bandTape, 22);
    var qs = 168, qx = R - qs + 10, qy = by + (bh2 - qs) / 2;
    drawQr(ctx, data.qr, qx, qy, qs);
    var tx = L - 10, tw = qx - tx - 24, cxm = tx + tw / 2;
    ctx.fillStyle = v.bandInk; ctx.textAlign = 'center';
    var mainText = v.main, iconW = 0;
    var ms = fit(ctx, mainText, tw - (v.icon ? 80 : 0), 72, 900);
    ctx.font = font(900, ms);
    var mw = ctx.measureText(mainText).width;
    if (v.icon) {
      // 경고 세모(빨강만)
      iconW = ms * 0.95 + 14;
      var ix = cxm - (mw + iconW) / 2, iy = by + 132;
      ctx.beginPath(); ctx.moveTo(ix + ms * 0.47, iy - ms * 0.82); ctx.lineTo(ix + ms * 0.95, iy); ctx.lineTo(ix, iy); ctx.closePath();
      ctx.fillStyle = INK; ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = font(900, ms * 0.6); ctx.fillText('!', ix + ms * 0.47, iy - ms * 0.08);
      ctx.fillStyle = v.bandInk; ctx.font = font(900, ms);
      ctx.textAlign = 'left'; ctx.fillText(mainText, ix + iconW, by + 132); ctx.textAlign = 'center';
    } else {
      ctx.fillText(mainText, cxm, by + 132);
    }
    ctx.font = font(800, fit(ctx, v.sub, tw, 40, 800));
    ctx.fillText(v.sub, cxm, by + 188);

    // 맨 아래 — 브랜드 두 줄(홍보물 규칙: site-config.js brand)
    var B = (window.WALSON_CONFIG && window.WALSON_CONFIG.brand) || { name: 'WALSON', tagline: '당신과 강아지의 유의미한 산책' };
    ctx.fillStyle = INK; ctx.textAlign = 'center';
    ctx.font = font(400, 34, BIG); ctx.fillText(B.name || 'WALSON', W / 2, 1522);
    ctx.font = font(700, 24); ctx.fillStyle = '#5b5148';
    ctx.fillText((B.tagline || '') + '  ·  재미로 만든 굿즈', W / 2, 1556);
    ctx.textAlign = 'left';
    return canvas;
  }

  window.WalsonPassV = { W: W, H: H, VARIANTS: VARIANTS, draw: draw, isCutout: isCutout };
})();
