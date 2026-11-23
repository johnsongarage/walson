// 영수증 개편 시안 3개(2026-11-23 가르시아 "너무 글씨가 빽빽해서 안 보여. 새로운 시안 기획으로 3개") — 스토리 9:16(1080×1920)
// 목표: 휴대폰에서 1080px 그림이 360px 안팎으로 보이니(3분의 1) 본문은 그림에서 42px 이상(화면 14px), 큰 숫자는 110px 이상.
// 넣지 않는 것은 지금 영수증과 같다: 위치·경로·지도, 장소 이름, 산책한 시각(시·분).
(function () {
  var MONO = '"Nanum Gothic Coding", ui-monospace, monospace';
  var BIG = '"Black Han Sans", Pretendard, sans-serif';
  var SANS = 'Pretendard, "Apple SD Gothic Neo", sans-serif';
  var INK = '#26211d', SOFT = '#7a7068', STAMP = '#d6453a', PAPER = '#fffdf8', POOP = '#7a4a26';
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  function dateText(d) { var t = new Date(d + 'T00:00:00'); return (t.getMonth() + 1) + '월 ' + t.getDate() + '일 (' + DOW[t.getDay()] + ')'; }
  function pad4(n) { var s = String(n); while (s.length < 4) s = '0' + s; return s; }
  function km(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function walkText(d) { return d.durationMin + '분' + (d.mode !== 'time' && d.distanceKm ? ' · ' + km(d.distanceKm) + 'km' : ''); }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; }; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function cover(ctx, img, x, y, w, h, fx, fy) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    var s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
    ctx.drawImage(img, x - (iw - w) * (fx == null ? 0.5 : fx), y - (ih - h) * (fy == null ? 0.5 : fy), iw, ih);
    ctx.restore();
  }
  function wrap(ctx, text, maxW, maxLines) {
    var words = String(text).split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width <= maxW) { cur = t; return; }
      if (cur) lines.push(cur);
      cur = w;
    });
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] += '…'; }
    return lines;
  }
  function dashed(ctx, x1, x2, y, color, dbl) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    if (dbl) { ctx.beginPath(); ctx.moveTo(x1, y + 9); ctx.lineTo(x2, y + 9); ctx.stroke(); }
    ctx.restore();
  }
  function barcode(ctx, x, y, w, h, seed, color) {
    var r = rng(seed), cx = x;
    ctx.fillStyle = color;
    while (cx < x + w) { var bw = 2 + Math.floor(r() * 4) * 2; if (r() > 0.35) ctx.fillRect(cx, y, bw, h); cx += bw + 3; }
  }
  // 도장: 두 겹 동그라미 + 두 줄 글자, 살짝 기울고 군데군데 빠진 잉크
  function stamp(ctx, cx, cy, R, words, color, rot, seed, plate) {
    var S = Math.ceil(R * 2.3), c = document.createElement('canvas'); c.width = c.height = S;
    var g = c.getContext('2d'); g.translate(S / 2, S / 2);
    g.strokeStyle = color; g.fillStyle = color;
    g.lineWidth = R * 0.075; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.stroke();
    g.lineWidth = R * 0.03; g.beginPath(); g.arc(0, 0, R * 0.84, 0, Math.PI * 2); g.stroke();
    var fs = words.some(function (w) { return w.length > 2; }) ? R * 0.34 : R * 0.44;
    g.font = fs + 'px ' + BIG; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (words.length === 1) g.fillText(words[0], 0, R * 0.02);
    else { g.fillText(words[0], 0, -R * 0.23); g.fillText(words[1], 0, R * 0.27); }
    // 잉크 빠짐(도장 그림에만)
    var r = rng(seed || 7); g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < 60; i++) { var a = r() * Math.PI * 2, d = r() * R * 1.05; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, 1 + r() * R * 0.03, 0, Math.PI * 2); g.fill(); }
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * Math.PI / 180);
    if (plate) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; ctx.fillStyle = 'rgba(255,253,248,.95)'; ctx.beginPath(); ctx.arc(0, 0, R * 1.12, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.globalAlpha = 0.9;
    ctx.drawImage(c, -S / 2, -S / 2); ctx.restore();
  }
  // 영수증 종이(위·아래 톱니)
  function paper(ctx, x, y, w, h, tooth, color, shadow) {
    ctx.save();
    if (shadow) { ctx.shadowColor = 'rgba(40,20,10,.28)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 14; }
    ctx.fillStyle = color; ctx.beginPath();
    var n = Math.round(w / (tooth * 2)), tw = w / n;
    ctx.moveTo(x, y + tooth);
    for (var i = 0; i < n; i++) { ctx.lineTo(x + tw * i + tw / 2, y); ctx.lineTo(x + tw * (i + 1), y + tooth); }
    ctx.lineTo(x + w, y + h - tooth);
    for (var j = n; j > 0; j--) { ctx.lineTo(x + tw * j - tw / 2, y + h); ctx.lineTo(x + tw * (j - 1), y + h - tooth); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function dots(ctx, cx, cy, n, r, color) {
    var gap = r * 2.7, x0 = cx - gap * 2;
    for (var i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.arc(x0 + gap * i, cy, r, 0, Math.PI * 2);
      if (i < n) { ctx.fillStyle = color; ctx.fill(); } else { ctx.lineWidth = r * 0.32; ctx.strokeStyle = color; ctx.stroke(); }
    }
  }
  function brandLine() { var B = (window.WALSON_CONFIG && WALSON_CONFIG.brand) || {}; return (B.name || 'WALSON') + ' · ' + (B.tagline || ''); }
  var URL_TEXT = 'johnsongarage.co.kr/walson';

  // ══ 시안 1 · 정리한 영수증 — 모양은 그대로, 줄은 절반, 글씨는 두 배 ══
  function drawA(cv, d, photo) {
    var W = 1080, H = 1920; cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#f3ddd2'; ctx.fillRect(0, 0, W, H);
    var PW = 960, pad = 54, inner = PW - pad * 2, tooth = 13;
    // 높이 먼저 재기
    ctx.font = '700 52px ' + MONO;
    var note = wrap(ctx, d.note || '없음 (평화로운 산책)', inner, 2);
    var PH = tooth + 40 + 92 + 54 + 30 + 52 + 132 + 26 + 168 + 30 + 50 + note.length * 68 + 26 + 30 + 96 + 24 + 64 + 46 + 40 + 40 + tooth;
    var bottom = H - 64, topY = bottom - PH;
    cover(ctx, photo, 0, 0, W, topY + 90, 0.5, 0.42);
    ctx.save(); ctx.translate(W / 2, bottom); ctx.rotate(-1 * Math.PI / 180); ctx.translate(-PW / 2, -PH);
    paper(ctx, 0, 0, PW, PH, tooth, PAPER, true);
    var y = tooth + 40, L = pad, R = PW - pad, C = PW / 2;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = INK;
    ctx.font = '74px ' + BIG; ctx.fillText('다산동 산책 상회', C, y + 70); y += 92;
    ctx.font = '400 38px ' + MONO; ctx.fillStyle = SOFT; ctx.fillText('대표 ' + d.name + ' · No.' + pad4(d.no) + ' · ' + dateText(d.date), C, y + 38); y += 54;
    dashed(ctx, L, R, y + 14, '#bdb2a6'); y += 30;
    // 산책(가장 큰 줄)
    ctx.font = '700 38px ' + MONO; ctx.fillStyle = SOFT; ctx.textAlign = 'left';
    ctx.fillText(d.after ? '산책 (자진 신고)' : d.mode === 'time' ? '산책 (시간만)' : '산책 (길 기록)', L, y + 38);
    if (d.goal && d.goal.reached) {   // 목표 달성은 작은 빨간 딱지 하나로
      ctx.font = '800 32px ' + SANS; var gw = ctx.measureText('오늘 목표 달성').width + 36;
      ctx.strokeStyle = STAMP; ctx.lineWidth = 3; rr(ctx, R - gw, y + 4, gw, 46, 23); ctx.stroke();
      ctx.fillStyle = STAMP; ctx.textAlign = 'center'; ctx.fillText('오늘 목표 달성', R - gw / 2, y + 38);
    }
    y += 52;
    ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.font = '118px ' + BIG; ctx.fillText(walkText(d), C, y + 112); y += 132;
    y += 26;
    // 칸 셋: 응가 · 킁킁 · 발도장(없으면 꾸준함)
    var cw = (inner - 2 * 20) / 3, ch = 148;
    var cells = [
      { l: '응가', v: typeof d.poop !== 'number' ? '-' : d.poop === 0 ? '0' : d.poop === 1 ? '1건' : '2건+' },
      { l: '킁킁', dots: d.sniff || 0 },
      d.stamps && d.stamps.hit ? { l: '발도장', v: d.stamps.hit + '곳' } : { l: '꾸준함', v: (d.steady && d.steady.days ? d.steady.days : 0) + '일째' }
    ];
    cells.forEach(function (c, i) {
      var x = L + i * (cw + 20);
      ctx.fillStyle = '#f6efe6'; rr(ctx, x, y, cw, ch, 20); ctx.fill();
      ctx.fillStyle = SOFT; ctx.font = '700 34px ' + MONO; ctx.textAlign = 'center'; ctx.fillText(c.l, x + cw / 2, y + 48);
      if (c.dots != null) dots(ctx, x + cw / 2, y + 102, c.dots, 11, INK);
      else { ctx.fillStyle = INK; ctx.font = '56px ' + BIG; ctx.fillText(c.v, x + cw / 2, y + 120); }
    });
    y += ch + 20;
    dashed(ctx, L, R, y + 14, '#bdb2a6'); y += 30;
    ctx.textAlign = 'left'; ctx.fillStyle = SOFT; ctx.font = '700 36px ' + MONO; ctx.fillText('특이 사항', L, y + 36); y += 50;
    ctx.fillStyle = INK; ctx.font = '700 52px ' + MONO;
    note.forEach(function (t) { ctx.fillText(t, L, y + 52); y += 68; });
    y += 26;
    dashed(ctx, L, R, y + 8, INK, true); y += 30;
    ctx.fillStyle = INK; ctx.font = '700 50px ' + MONO; ctx.fillText('오늘 산책 빚 1회분', L, y + 58);
    if (typeof d.poop === 'number' && d.poop >= 1) stamp(ctx, R - 244, y + 70, 76, ['오늘도', '해냈다'], POOP, 8, 5);   // 응가를 적은 날 갈색 도장(11/17 결정)
    stamp(ctx, R - 100, y + 44, 100, d.feel === 'short' ? ['일부', '상환'] : ['상환', '완료'], STAMP, -10, 11);
    y += 96;
    ctx.fillStyle = SOFT; ctx.font = '400 34px ' + MONO; ctx.fillText('결제: 보호자 다리 (일시불)', L, y + 34); y += 24 + 40;
    barcode(ctx, C - inner * 0.34, y, inner * 0.68, 56, 18, INK); y += 56 + 14;
    ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.font = '700 30px ' + MONO; ctx.fillText(brandLine(), C, y + 30); y += 40;
    ctx.fillStyle = SOFT; ctx.font = '400 28px ' + MONO; ctx.fillText(URL_TEXT, C, y + 28);
    ctx.restore();
    return cv;
  }

  // ══ 시안 2 · 사진이 주인공 — 사진을 꽉 채우고 아래에 영수증 조각 한 장 ══
  function drawB(cv, d, photo) {
    var W = 1080, H = 1920; cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    cover(ctx, photo, 0, 0, W, H, 0.5, 0.4);
    var g = ctx.createLinearGradient(0, H * 0.45, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.38)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 왼쪽 위 작은 딱지(가게 이름)
    ctx.font = '800 36px ' + SANS; var tw = ctx.measureText('다산동 산책 상회').width + 56;
    ctx.fillStyle = 'rgba(255,253,248,.92)'; rr(ctx, 56, 72, tw, 72, 36); ctx.fill();
    ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.fillText('다산동 산책 상회', 84, 121);
    // 영수증 조각
    var PW = 860, pad = 52, inner = PW - pad * 2, tooth = 14;
    ctx.font = '800 50px ' + SANS;
    var note = wrap(ctx, d.note || '평화로운 산책', inner, 2);
    var PH = tooth + 36 + 48 + 24 + 150 + 96 + note.length * 64 + 20 + 26 + 54 + 14 + 40 + tooth + 20;
    var bottom = H - 120;
    ctx.save(); ctx.translate(W / 2, bottom); ctx.rotate(-2.5 * Math.PI / 180); ctx.translate(-PW / 2, -PH);
    paper(ctx, 0, 0, PW, PH, tooth, PAPER, true);
    var y = tooth + 36, L = pad, R = PW - pad, C = PW / 2;
    ctx.fillStyle = SOFT; ctx.font = '700 38px ' + MONO;
    ctx.textAlign = 'left'; ctx.fillText(d.name + ' · ' + dateText(d.date) + ' · No.' + pad4(d.no), L, y + 36); y += 48;
    dashed(ctx, L, R, y + 10, '#bdb2a6'); y += 24;
    ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.font = '128px ' + BIG; ctx.fillText(walkText(d), C, y + 124); y += 150;
    // 알약 셋
    var pills = ['응가 ' + (typeof d.poop === 'number' ? d.poop + '건' : '-'), '킁킁 ' + (d.sniff || 0) + '/5', d.stamps && d.stamps.hit ? '발도장 ' + d.stamps.hit + '곳' : '꾸준함 ' + ((d.steady && d.steady.days) || 0) + '일'];
    ctx.font = '800 36px ' + SANS;
    var ws = pills.map(function (p) { return ctx.measureText(p).width + 44; }), total = ws.reduce(function (a, b) { return a + b; }, 0) + 18 * 2, px = C - total / 2;
    pills.forEach(function (p, i) {
      ctx.fillStyle = '#f3ece3'; rr(ctx, px, y, ws[i], 64, 32); ctx.fill();
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(p, px + ws[i] / 2, y + 45); px += ws[i] + 18;
    });
    y += 96;
    ctx.fillStyle = INK; ctx.font = '800 50px ' + SANS;
    note.forEach(function (t) { ctx.fillText(t, C, y + 48); y += 64; });
    y += 20;
    dashed(ctx, L, R, y + 10, '#bdb2a6'); y += 26;
    barcode(ctx, C - 190, y, 380, 44, 18, INK); y += 54;
    ctx.fillStyle = SOFT; ctx.font = '700 28px ' + MONO; ctx.fillText(brandLine(), C, y + 28);
    if (typeof d.poop === 'number' && d.poop >= 1) stamp(ctx, PW - 262, -40, 80, ['오늘도', '해냈다'], POOP, -8, 5, true);
    stamp(ctx, PW - 74, -34, 118, d.feel === 'short' ? ['일부', '상환'] : ['상환', '완료'], STAMP, 14, 11, true);   // 조각 오른쪽 위 모서리에 걸친 스티커 도장
    ctx.restore();
    return cv;
  }

  // ══ 시안 3 · 젤리 핑크 산책 카드 — 리뉴얼 색, 큰 숫자 칸, 영수증은 톱니·도장으로만 ══
  function drawC(cv, d, photo) {
    var W = 1080, H = 1920; cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var PINK = '#FF5C9D', DEEP = '#C2185B', SOFTP = '#FFE4EF', CREAM = '#FFFDFD', LILAC = '#B6A2F2', DARK = '#2b2026', GREY = '#8a7880';
    ctx.fillStyle = '#FFF1F6'; ctx.fillRect(0, 0, W, H);
    // 무늬: 라일락 작은 발바닥 점
    var r0 = rng(3); ctx.fillStyle = 'rgba(182,162,242,.22)';
    for (var i = 0; i < 26; i++) { ctx.beginPath(); ctx.arc(r0() * W, r0() * H, 6 + r0() * 10, 0, Math.PI * 2); ctx.fill(); }
    // 머리
    ctx.textAlign = 'left'; ctx.fillStyle = PINK; ctx.font = '900 34px ' + SANS;
    var lw = ctx.measureText('산책 영수증').width + 44; rr(ctx, 60, 64, lw, 64, 32); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText('산책 영수증', 82, 108);
    ctx.fillStyle = GREY; ctx.font = '700 36px ' + SANS; ctx.textAlign = 'right'; ctx.fillText(dateText(d.date) + ' · No.' + pad4(d.no), W - 60, 108);
    // 사진(둥근 네모 + 흰 테두리)
    var px = 60, py = 160, pw = 960, ph = 800;
    ctx.save(); ctx.shadowColor = 'rgba(194,24,91,.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#fff'; rr(ctx, px - 12, py - 12, pw + 24, ph + 24, 58); ctx.fill(); ctx.restore();
    ctx.save(); rr(ctx, px, py, pw, ph, 48); ctx.clip(); cover(ctx, photo, px, py, pw, ph, 0.5, 0.42); ctx.restore();
    // 이름 딱지(사진 왼쪽 아래)
    ctx.font = '900 44px ' + SANS; var nw = ctx.measureText(d.name + '의 산책').width + 56;
    ctx.fillStyle = 'rgba(255,255,255,.94)'; rr(ctx, px + 28, py + ph - 100, nw, 76, 38); ctx.fill();
    ctx.fillStyle = DEEP; ctx.textAlign = 'left'; ctx.fillText(d.name + '의 산책', px + 56, py + ph - 47);
    // 큰 숫자 칸 셋
    var ty = 1010, tw = 300, th = 230, gap = 30, tx0 = (W - (tw * 3 + gap * 2)) / 2;
    var tiles = [
      { l: '시간', n: String(d.durationMin), u: '분' },
      d.mode !== 'time' && d.distanceKm ? { l: '거리', n: km(d.distanceKm), u: 'km' } : { l: '킁킁', dots: d.sniff || 0 },
      { l: '응가', n: typeof d.poop === 'number' ? String(d.poop) : '-', u: typeof d.poop === 'number' ? '회' : '' }
    ];
    tiles.forEach(function (t, i) {
      var x = tx0 + i * (tw + gap);
      ctx.fillStyle = CREAM; rr(ctx, x, ty, tw, th, 36); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = SOFTP; ctx.stroke();
      ctx.fillStyle = GREY; ctx.font = '800 36px ' + SANS; ctx.textAlign = 'center'; ctx.fillText(t.l, x + tw / 2, ty + 62);
      if (t.dots != null) { dots(ctx, x + tw / 2, ty + 150, t.dots, 13, DEEP); return; }
      ctx.font = '900 104px ' + SANS; var nW = ctx.measureText(t.n).width; ctx.font = '800 42px ' + SANS; var uW = ctx.measureText(t.u).width;
      var sx = x + tw / 2 - (nW + 6 + uW) / 2;
      ctx.textAlign = 'left'; ctx.fillStyle = DEEP; ctx.font = '900 104px ' + SANS; ctx.fillText(t.n, sx, ty + 180);
      ctx.fillStyle = DARK; ctx.font = '800 42px ' + SANS; ctx.fillText(t.u, sx + nW + 6, ty + 180);
    });
    // 특이 사항 말풍선
    var by = ty + th + 50, bx = 60, bw = 960;
    ctx.font = '800 52px ' + SANS;
    var note = wrap(ctx, d.note || '평화로운 산책', bw - 96, 2), bh = 92 + note.length * 70;
    ctx.fillStyle = '#fff'; rr(ctx, bx, by, bw, bh, 40); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PINK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 120, by); ctx.lineTo(bx + 150, by - 34); ctx.lineTo(bx + 186, by); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx + 118, by); ctx.lineTo(bx + 150, by - 36); ctx.lineTo(bx + 188, by); ctx.strokeStyle = PINK; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(bx + 121, by - 3, 64, 7);
    ctx.textAlign = 'left'; ctx.fillStyle = PINK; ctx.font = '900 34px ' + SANS; ctx.fillText('특이 사항', bx + 48, by + 60);
    ctx.fillStyle = DARK; ctx.font = '800 52px ' + SANS; note.forEach(function (t, k) { ctx.fillText(t, bx + 48, by + 128 + k * 70); });
    // 아래: 톱니 띠 + 산책 빚 + 도장
    var fy = by + bh + 60;
    paper(ctx, 60, fy, 960, H - fy - 50, 12, '#fff', false);
    ctx.fillStyle = DARK; ctx.font = '900 50px ' + SANS; ctx.textAlign = 'left'; ctx.fillText('오늘 산책 빚 1회분', 112, fy + 102);
    ctx.fillStyle = GREY; ctx.font = '700 34px ' + SANS; ctx.fillText('결제: 보호자 다리 (일시불)', 112, fy + 156);
    stamp(ctx, 880, fy + 96, 100, d.feel === 'short' ? ['일부', '상환'] : ['상환', '완료'], PINK, -10, 11);
    if (typeof d.poop === 'number' && d.poop >= 1) stamp(ctx, 726, fy + 116, 76, ['오늘도', '해냈다'], POOP, 8, 5);
    ctx.fillStyle = DARK; ctx.font = '800 30px ' + SANS; ctx.textAlign = 'center'; ctx.fillText(brandLine(), W / 2, H - 120);
    ctx.fillStyle = GREY; ctx.font = '600 28px ' + SANS; ctx.fillText(URL_TEXT, W / 2, H - 80);
    return cv;
  }

  window.RcDrafts = { A: drawA, B: drawB, C: drawC };
})();
