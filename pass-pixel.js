// 도트 워킹패스(아크릴 키링) — 2026-11-22 가르시아가 준 디자인(HTML "WALSON WALKING PASS - 최종 완성형 풀버전")을 캔버스로 그대로 옮긴 것.
// 가르시아 "이 디자인 보고 다시 참고해서 만들어 봐. 타이틀 텍스트 옆에 발바닥, 그리고 사진의 테두리 이런 구성을 다시 적용해.
//          지금 거 없애고 저대로 하고 거기서 변형한다고 생각해라" — 앞의 도트 그림(한국어 칸·성향 띠·등급 게이지)은 지웠다.
// 구성: 바탕(따뜻한 베이지) 위 투명 아크릴 케이스(고리 구멍) · 안쪽 인쇄 카드(분홍 머리띠 + "WALSON" 양옆 도트 발바닥 + "WALKING PASS") ·
//       왼쪽 사진 틀(검정 계단 테두리 + 분홍 안쪽 선 + 네 귀퉁이 꺾쇠·발바닥 장식) · 오른쪽 ID No. / NAME: / TYPE: 두 색 칸 · 분홍 점선 · WALSON 칸 · QR.
// 크기·색은 받은 디자인의 CSS 값 그대로(단위 CSS px, 디자인 424×530을 판 1200×1500으로 키움). 디자인과 다르게 한 것:
//   ① 사진 아래 빈 곳에 홍보물 문구 한 줄(site-config.js brand — 키링도 두 줄 규칙, "WALSON"은 이미 있음)
//   ② QR은 진짜 QR — 11/24부터 링크 아닌 글자(data.qr = id-card.js cardQrText, "카카오톡에서 '왈슨' 검색") ③ 칸 값은 이 휴대폰 기록(번호 끝 네 자리 · 이름 · 견종, 없으면 DOG)
//   ④ 사진은 도트로 바꿀 수 있고(가늘게 56칸 · 굵게 32칸 · 원래 사진) 끌어서 맞춘다 — 처음엔 칸을 꽉 채움(디자인은 통째로 보이기)
// 사진은 이 휴대폰 안에서만 그리고 어디로도 보내지 않는다. window.WalsonPassPixel.draw(canvas, data)
// 쓰는 곳: 시안 화면 pass-pixel-sample.html, [워킹패스] my-card.html 키링 카드의 사진 맞추기·사진 도트(그 화면의 [도트 카드]는 11/24 밤 뺌)
(function () {
  var W = 1200, H = 1500;
  var DW = 424, DH = 530, S = W / DW;   // 디자인 단위(CSS px) → 판
  var DARK = '#221a17', PAW_C = '#4e2732', PINK_HEAD = '#f6a3bf', PINK_LINE = '#e2789c', CARD_BG = '#fff9fb', CARD_LINE = '#f4a4c0',
      FRAME_PINK = '#f7b5cc', LABEL_BG = '#f9dce6', VALUE_BG = '#f4fbfb', DASH = '#f38cb1', GUIDE = '#d896ad';
  var SANS = "Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  var PIX = "'DungGeunMo', 'Galmuri11', monospace";
  function sans(weight, size) { return weight + ' ' + size + 'px ' + SANS; }
  // 성향(원래 주민증과 같은 문구·색) — 이 그림엔 안 그리지만 다른 화면이 같이 쓴다
  var SIGNALS = {
    green:  { line: '다가와도 좋아요', color: '#3f9b5b' },
    yellow: { line: '천천히 인사해요', color: '#dfa21f' },
    red:    { line: '눈으로만 예뻐해 주세요', color: '#d2493f' }
  };

  // ── 자리(받은 디자인을 브라우저로 그려 잰 값, 디자인 단위) ──
  var CASE = { x: 24, y: 24, w: 376, h: 451.2, r: 24 };
  var CX = CASE.x + CASE.w / 2;
  var CARD = { x: CASE.x + 17, y: CASE.y + 35, w: 342, h: 399.2, r: 15 };
  var HEAD = { x: CARD.x + 2, y: CARD.y + 2, w: 338, h: 83.2 };
  var PF = { x: CASE.x + 31, y: CASE.y + 135.2, w: 155.9, h: 244 };          // 사진 틀 바깥(검정 계단 테두리)
  var PI = { x: PF.x + 3.5, y: PF.y + 3.5, w: PF.w - 7, h: PF.h - 7 };          // 사진 틀 안(분홍 안쪽 선 4px)
  var PIMG = { w: PI.w * 0.93, h: PI.h * 0.93 };                                  // 사진 칸(틀 안 93%)
  PIMG.x = PI.x + (PI.w - PIMG.w) / 2; PIMG.y = PI.y + (PI.h - PIMG.h) / 2;
  var INFO = { x: CASE.x + 197.9, y: CASE.y + 135.2, w: 147.1, h: 283 };
  // 사진 칸(판 단위) — 시안 화면·[워킹패스]가 그 위에 '끌어서 옮기기·확대' 칸을 얹는다
  var PHOTO = { x: PIMG.x * S, y: PIMG.y * S, w: PIMG.w * S, h: PIMG.h * S };

  // ── 그리기 도구 ──
  function rrPath(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }
  // 계단 테두리(받은 디자인의 clip-path 그대로): 바깥은 귀퉁이를 두 칸(7px·3.5px), 안쪽은 한 칸(3.5×4px) 깎는다
  function stepOuter(ctx, x, y, w, h) {
    var a = 3.5, b = 7;
    ctx.beginPath();
    ctx.moveTo(x, y + b); ctx.lineTo(x + a, y + b); ctx.lineTo(x + a, y + a); ctx.lineTo(x + b, y + a); ctx.lineTo(x + b, y);
    ctx.lineTo(x + w - b, y); ctx.lineTo(x + w - b, y + a); ctx.lineTo(x + w - a, y + a); ctx.lineTo(x + w - a, y + b); ctx.lineTo(x + w, y + b);
    ctx.lineTo(x + w, y + h - b); ctx.lineTo(x + w - a, y + h - b); ctx.lineTo(x + w - a, y + h - a); ctx.lineTo(x + w - b, y + h - a); ctx.lineTo(x + w - b, y + h);
    ctx.lineTo(x + b, y + h); ctx.lineTo(x + b, y + h - a); ctx.lineTo(x + a, y + h - a); ctx.lineTo(x + a, y + h - b); ctx.lineTo(x, y + h - b);
    ctx.closePath();
  }
  function stepInner(ctx, x, y, w, h) {
    var a = 3.5, b = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + b); ctx.lineTo(x + a, y + b); ctx.lineTo(x + a, y);
    ctx.lineTo(x + w - a, y); ctx.lineTo(x + w - a, y + b); ctx.lineTo(x + w, y + b);
    ctx.lineTo(x + w, y + h - b); ctx.lineTo(x + w - a, y + h - b); ctx.lineTo(x + w - a, y + h);
    ctx.lineTo(x + a, y + h); ctx.lineTo(x + a, y + h - b); ctx.lineTo(x, y + h - b);
    ctx.closePath();
  }
  // 검정 계단 테두리 칸 — 안쪽(3.5px 들어간 곳)은 계단 모양으로 잘라 paint(x, y, w, h)가 칠한다
  function stepBox(ctx, x, y, w, h, paint) {
    ctx.fillStyle = DARK; stepOuter(ctx, x, y, w, h); ctx.fill();
    ctx.save(); stepInner(ctx, x + 3.5, y + 3.5, w - 7, h - 7); ctx.clip();
    paint(x + 3.5, y + 3.5, w - 7, h - 7);
    ctx.restore();
  }
  // CSS letter-spacing처럼 글자마다 간격을 더한다(마지막 글자 뒤 간격도 폭에 넣어 가운데 맞춤이 CSS와 같게)
  function spacedWidth(ctx, text, sp) { var w = 0; for (var i = 0; i < text.length; i++) w += ctx.measureText(text[i]).width + sp; return w; }
  function spacedText(ctx, text, x, y, sp) {
    ctx.textAlign = 'left';
    for (var i = 0; i < text.length; i++) { ctx.fillText(text[i], x, y); x += ctx.measureText(text[i]).width + sp; }
  }
  // 칸에 맞게 글자 크기를 줄이고(최소 min), 그래도 길면 끝을 …으로
  function fitSpaced(ctx, text, maxW, weight, size, min, sp) {
    var s = size;
    ctx.font = sans(weight, s);
    while (s > min && spacedWidth(ctx, text, sp) > maxW) { s -= 0.5; ctx.font = sans(weight, s); }
    if (spacedWidth(ctx, text, sp) <= maxW) return text;
    var t = text;
    while (t.length > 1 && spacedWidth(ctx, t + '…', sp) > maxW) t = t.slice(0, -1);
    return t + '…';
  }
  // 받은 디자인의 도트 발바닥(24×24)과 귀퉁이 꺾쇠·발바닥 장식(16×16 → 22px)
  var PAW_PATH = 'M9 3h3v4H9V3z M4 5h3v4H4V5z M14 5h3v4h-3V5z M18 9h3v4h-3V9z M9 10h5v1h2v2h1v4h-2v2h-2v-1h-3v1H7v-2H5v-4h1v-2h3v-1z';
  var CORNER_DARK = 'M0 0h12v2H2v10H0V0zm4 4h2v2H4V4zm4 0h2v2H8V4zM3 7h2v2H3V7zm6 0h2v2H9V7zM5 8h6v5H5V8z';
  var CORNER_PINK = 'M2 2h9v1H3v8H2V2zm4 7h4v3H6V9z';
  var paths = null;
  function P() { return paths || (paths = { paw: new Path2D(PAW_PATH), cd: new Path2D(CORNER_DARK), cp: new Path2D(CORNER_PINK) }); }
  // 발바닥(가운데 cx·cy, 24px) — 왼쪽은 -10도, 오른쪽은 거울로 뒤집고 -10도(디자인 transform 그대로)
  function paw(ctx, cx, cy, mirror) {
    ctx.save(); ctx.translate(cx, cy);
    if (mirror) ctx.scale(-1, 1);
    ctx.rotate(-10 * Math.PI / 180);
    ctx.translate(-12, -12);
    ctx.fillStyle = PAW_C; ctx.fill(P().paw);
    ctx.restore();
  }
  function corner(ctx, x, y, sx, sy) {
    ctx.save(); ctx.translate(x + 11, y + 11); ctx.scale(sx * 22 / 16, sy * 22 / 16); ctx.translate(-8, -8);
    ctx.fillStyle = DARK; ctx.fill(P().cd);
    ctx.fillStyle = PINK_HEAD; ctx.fill(P().cp);
    ctx.restore();
  }

  // ── 사진을 도트로 ──
  // 사진 칸(bw×bh)을 cols칸으로 줄이고, 색을 k개로 줄인다(k-평균). 채도를 조금 올려 그림처럼.
  // 줌아웃해서 사진이 칸보다 작으면 남는 곳은 bg(사진 칸 바탕색)로 — 검정 도트가 되지 않게
  function dotPhoto(img, bw, bh, cols, k, zoom, qx, qy, bg) {
    var rows = Math.max(1, Math.round(cols * bh / bw));
    var c = document.createElement('canvas'); c.width = cols; c.height = rows;
    var g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.fillStyle = bg || '#ffffff'; g.fillRect(0, 0, cols, rows);
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

  // QR — 한 칸 = 1px로 따로 그려 키운다(칸 사이 이음매 없이 또렷하게). QR 그리는 파일(qrcode-generator)이 없으면 흰 칸만
  function drawQr(ctx, text, x, y, size) {
    if (!window.qrcode || !text) return;
    var qr = window.qrcode(0, 'M'); qr.addData(text); qr.make();
    var m = qr.getModuleCount(), c = document.createElement('canvas'); c.width = c.height = m;
    var g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, m, m); g.fillStyle = DARK;
    for (var r = 0; r < m; r++) for (var q = 0; q < m; q++) if (qr.isDark(r, q)) g.fillRect(q, r, 1, 1);
    var was = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, x, y, size, size);
    ctx.imageSmoothingEnabled = was;
  }

  // data: { name, breed, type, cardNo, idNo, photo, mode('photo'|'dot'), cols, colors, qr, zoom, qx, qy, emptyText }
  // zoom: 사진 칸을 꽉 채운 크기의 배수(1 = 꽉 채움, 1보다 작으면 줌아웃 — 남는 곳은 흰색). qx·qy: 0~1, 사진이 칸 안에서 놓인 자리(0.5 = 가운데)
  function draw(canvas, data) {
    data = data || {};
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.scale(S, S);

    // 바탕 — 받은 디자인의 페이지 바탕(투명 아크릴이 보이게)
    var bgG = ctx.createRadialGradient(DW / 2, DH * 0.25, 0, DW / 2, DH * 0.25, Math.sqrt(DW * DW / 4 + DH * DH * 0.5625));
    bgG.addColorStop(0, '#efe0cf'); bgG.addColorStop(1, '#c8a47e');
    ctx.fillStyle = bgG; ctx.fillRect(0, 0, DW, DH);

    // 아크릴 케이스 그림자 — CSS box-shadow처럼 케이스 밖에만(투명 케이스 안에는 안 비침)
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, DW, DH); rrPath(ctx, CASE.x, CASE.y, CASE.w, CASE.h, CASE.r); ctx.clip('evenodd');
    ctx.fillStyle = 'rgba(175, 192, 204, 0.95)';                   // 아래로 6px — 아크릴 두께
    ctx.beginPath(); rrPath(ctx, CASE.x, CASE.y + 6, CASE.w, CASE.h, CASE.r); ctx.fill();
    ctx.shadowColor = 'rgba(42, 28, 18, 0.32)'; ctx.shadowBlur = 38 * S; ctx.shadowOffsetX = 5000 * S; ctx.shadowOffsetY = 22 * S;
    ctx.fillStyle = '#000';                                          // 그림자만 남기려고 모양은 화면 밖에 그린다
    ctx.beginPath(); rrPath(ctx, CASE.x - 5000, CASE.y, CASE.w, CASE.h, CASE.r); ctx.fill();
    ctx.restore();

    // 아크릴 케이스 — 흰빛 사선 그라데이션 + 흰 테두리 3px + 안쪽 하늘빛 선 2px
    var len = (CASE.w + CASE.h) * Math.SQRT1_2, dd = len / 2 * Math.SQRT1_2, ccx = CASE.x + CASE.w / 2, ccy = CASE.y + CASE.h / 2;
    var acr = ctx.createLinearGradient(ccx - dd, ccy - dd, ccx + dd, ccy + dd);
    acr.addColorStop(0, 'rgba(255, 255, 255, 0.78)'); acr.addColorStop(0.48, 'rgba(255, 255, 255, 0.30)'); acr.addColorStop(1, 'rgba(255, 255, 255, 0.68)');
    ctx.fillStyle = acr; ctx.beginPath(); rrPath(ctx, CASE.x, CASE.y, CASE.w, CASE.h, CASE.r); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath(); rrPath(ctx, CASE.x + 1.5, CASE.y + 1.5, CASE.w - 3, CASE.h - 3, CASE.r - 1.5); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(215, 230, 240, 0.85)';
    ctx.beginPath(); rrPath(ctx, CASE.x + 4, CASE.y + 4, CASE.w - 8, CASE.h - 8, CASE.r - 4); ctx.stroke();
    // 고리 구멍(16px, 흰 테두리 2.5px, 안쪽 그림자)
    var hx = CX, hy = CASE.y + 20;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cbb094'; ctx.beginPath(); ctx.arc(hx, hy, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, 5.5, 0, Math.PI * 2); ctx.clip();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.38)'; ctx.shadowBlur = 3 * S; ctx.shadowOffsetY = 2 * S;
    ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.arc(hx, hy, 8.5, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // 안쪽 인쇄 카드 — 바탕 + 분홍 머리띠(아래 진분홍 3px) + 테두리 2px
    ctx.fillStyle = CARD_BG; ctx.beginPath(); rrPath(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); ctx.fill();
    ctx.save(); ctx.beginPath(); rrPath(ctx, CARD.x + 2, CARD.y + 2, CARD.w - 4, CARD.h - 4, CARD.r - 2); ctx.clip();
    ctx.fillStyle = PINK_HEAD; ctx.fillRect(HEAD.x, HEAD.y, HEAD.w, HEAD.h - 3);
    ctx.fillStyle = PINK_LINE; ctx.fillRect(HEAD.x, HEAD.y + HEAD.h - 3, HEAD.w, 3);
    ctx.restore();
    ctx.lineWidth = 2; ctx.strokeStyle = CARD_LINE; ctx.beginPath(); rrPath(ctx, CARD.x + 1, CARD.y + 1, CARD.w - 2, CARD.h - 2, CARD.r - 1); ctx.stroke();

    // 제목 — 발바닥 · WALSON · 발바닥(9px 사이), 아래 WALKING PASS
    var B = (window.WALSON_CONFIG && window.WALSON_CONFIG.brand) || { name: 'WALSON', tagline: '당신과 강아지의 유의미한 산책' };
    ctx.fillStyle = DARK; ctx.textBaseline = 'middle';
    ctx.font = sans(900, 24);
    var t1 = 'WALSON', w1 = spacedWidth(ctx, t1, 2.5), gw = 24 + 9 + w1 + 9 + 24, gx = CX - gw / 2, ty = CASE.y + 53 + 13.2;
    paw(ctx, gx + 12, ty, false);
    ctx.fillStyle = DARK; spacedText(ctx, t1, gx + 33, ty, 2.5);
    paw(ctx, gx + 33 + w1 + 9 + 12, ty, true);
    ctx.fillStyle = DARK; ctx.font = sans(800, 18);
    var t2 = 'WALKING PASS', w2 = spacedWidth(ctx, t2, 2.2);
    spacedText(ctx, t2, CX - w2 / 2, CASE.y + 83.4 + 9.9, 2.2);

    // 사진 틀 — 검정 계단 테두리 · 분홍 안쪽 선 4px · 흰 바탕 · 사진(93% 칸) · 네 귀퉁이 장식
    var img = data.photo;
    stepBox(ctx, PF.x, PF.y, PF.w, PF.h, function (x, y, w, h) {
      ctx.fillStyle = FRAME_PINK; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      if (img) {
        ctx.save(); ctx.beginPath(); ctx.rect(PIMG.x, PIMG.y, PIMG.w, PIMG.h); ctx.clip();
        if (data.mode === 'dot') {
          var small = dotPhoto(img, PHOTO.w, PHOTO.h, data.cols || 56, data.colors || 12, data.zoom, data.qx, data.qy, '#ffffff');
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(small, PIMG.x, PIMG.y, PIMG.w, PIMG.h);
        } else {
          ctx.imageSmoothingEnabled = true;
          var sc = Math.max(PIMG.w / img.width, PIMG.h / img.height) * (data.zoom || 1), iw = img.width * sc, ih = img.height * sc;
          ctx.drawImage(img, PIMG.x + (PIMG.w - iw) * (data.qx == null ? 0.5 : data.qx), PIMG.y + (PIMG.h - ih) * (data.qy == null ? 0.5 : data.qy), iw, ih);
        }
        ctx.restore();
      } else {
        // 사진이 없을 때 — 디자인의 빈 칸 안내(그림 + 도트 글씨)
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = "24px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
        ctx.fillText('🖼️', PI.x + PI.w / 2, PI.y + PI.h / 2 - 24);
        ctx.fillStyle = GUIDE; ctx.font = '13px ' + PIX;
        String(data.emptyText || '여기를 눌러\n강아지 사진 넣기').split('\n').forEach(function (l, i) { ctx.fillText(l, PI.x + PI.w / 2, PI.y + PI.h / 2 + 8 + i * 18); });
      }
      corner(ctx, PI.x + 4, PI.y + 4, 1, 1);
      corner(ctx, PI.x + PI.w - 26, PI.y + 4, -1, 1);
      corner(ctx, PI.x + 4, PI.y + PI.h - 26, 1, -1);
      corner(ctx, PI.x + PI.w - 26, PI.y + PI.h - 26, -1, -1);
    });

    // 오른쪽 칸 — ID No. / NAME: / TYPE: (이름표 분홍 · 값 민트빛 흰색, 매끈한 굵은 글씨)
    var idNo = data.idNo || String(data.cardNo || '').split('-').pop() || '0000';
    var rows = [['ID No.', idNo], ['NAME:', data.name || '우리 강아지'], ['TYPE:', data.type || data.breed || 'DOG']];
    rows.forEach(function (row, i) {
      stepBox(ctx, INFO.x, INFO.y + i * 50, INFO.w, 43, function (x, y, w, h) {
        ctx.font = sans(800, 15.5);
        var lw = spacedWidth(ctx, row[0], 0.6) + 10 + 6;
        ctx.fillStyle = LABEL_BG; ctx.fillRect(x, y, lw, h);
        ctx.fillStyle = VALUE_BG; ctx.fillRect(x + lw, y, w - lw, h);
        ctx.fillStyle = DARK; ctx.textBaseline = 'middle';
        spacedText(ctx, row[0], x + 10, y + h / 2, 0.6);
        var v = fitSpaced(ctx, String(row[1]), w - lw - 6 - 8, 800, 15.5, 11, 0.6);
        ctx.fillStyle = DARK; spacedText(ctx, v, x + lw + 6, y + h / 2, 0.6);
      });
    });
    // 분홍 점선
    ctx.fillStyle = DASH;
    for (var dx = 0; dx < INFO.w; dx += 11) ctx.fillRect(INFO.x + dx, INFO.y + 152, Math.min(11 * 0.62, INFO.w - dx), 3);
    // WALSON 칸
    stepBox(ctx, INFO.x, INFO.y + 164, INFO.w, 42, function (x, y, w, h) {
      ctx.fillStyle = LABEL_BG; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = DARK; ctx.font = sans(900, 16); ctx.textBaseline = 'middle';
      var nm = B.name || 'WALSON', bw = spacedWidth(ctx, nm, 2);
      spacedText(ctx, nm, x + (w - bw) / 2, y + h / 2, 2);
    });
    // QR(흰 바탕 · 검정 테두리 2.5px · 안쪽 58px) — 링크 아닌 글자(11/24, data.qr)
    var qx0 = INFO.x + 39.6, qy0 = INFO.y + 215;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(qx0, qy0, 68, 68);
    ctx.lineWidth = 2.5; ctx.strokeStyle = DARK; ctx.strokeRect(qx0 + 1.25, qy0 + 1.25, 65.5, 65.5);
    drawQr(ctx, data.qr, qx0 + 5.5, qy0 + 5.5, 58);

    // 홍보물 문구(디자인과 다르게 더한 것) — 사진 틀 아래 빈 곳에 한 줄
    if (B.tagline) {
      var tgY = (PF.y + PF.h + INFO.y + INFO.h) / 2;
      ctx.fillStyle = PAW_C; ctx.textBaseline = 'middle';
      var tg = fitSpaced(ctx, B.tagline, PF.w - 6, 800, 10.5, 8, 0);
      var tw = spacedWidth(ctx, tg, 0);
      spacedText(ctx, tg, PF.x + (PF.w - tw) / 2, tgY, 0);
    }
    ctx.restore();
    return canvas;
  }

  function fontsReady() {
    if (!document.getElementById('dunggeunmo-face')) {
      var st = document.createElement('style'); st.id = 'dunggeunmo-face';
      st.textContent = "@font-face{font-family:'DungGeunMo';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/DungGeunMo.woff') format('woff');}";
      document.head.appendChild(st);
    }
    if (!(document.fonts && document.fonts.load)) return Promise.resolve();
    return Promise.all([
      document.fonts.load('900 24px Pretendard', 'WALSON'), document.fonts.load('800 18px Pretendard', 'WALKING PASS ID No. NAME: TYPE: 당신과 강아지'),
      document.fonts.load("13px 'DungGeunMo'", '강아지 사진')
    ]).catch(function () {});
  }

  // ── 사진 맞추기(2026-11-22) — 시안 화면(pass-pixel-sample.html)과 [워킹패스](my-card.html)가 같이 쓴다 ──
  // 맞춤 fit = { zoom, qx, qy } — zoom: 사진 칸을 꽉 채운 크기의 배수(1 = 꽉 채움, 1보다 작으면 줌아웃), qx·qy: 0~1 사진이 칸 안에 놓인 자리.
  // 사진 칸 위에 얹은 칸(el)에 끌어서 옮기기 · 두 손가락 · 마우스 휠 · 방향키와 +/− 키를 붙인다. 그 칸만 touch-action: none이라
  // 나머지 곳에서는 화면이 그대로 스크롤된다. 사진은 이 휴대폰 안에서만 다룬다.
  var FIT = { MIN: 0.5, MAX: 4, DEFAULT: { zoom: 1, qx: 0.5, qy: 0.5 } };
  function clampN(v, a, b) { return Math.max(a, Math.min(b, v)); }
  // box: 사진 칸 크기 { w, h }(없으면 이 그림의 사진 칸) — [워킹패스] 키링 카드 가로판처럼 다른 칸에서도 같은 맞춤 셈을 쓰려고(11/24)
  function fitMath(photo, box) {
    var PB = box || PHOTO;
    // 이 크기에서 사진이 사진 칸 안에 그려지는 너비·높이(판 단위) — draw()와 같은 셈(꽉 채움 × zoom)
    function imgSize(z) {
      var w0 = photo ? (photo.naturalWidth || photo.width) : PB.w, h0 = photo ? (photo.naturalHeight || photo.height) : PB.h;
      var sc = Math.max(PB.w / w0, PB.h / h0) * z;
      return { w: w0 * sc, h: h0 * sc };
    }
    // 사진 왼쪽 위가 사진 칸 왼쪽 위에서 떨어진 거리(판 단위) ↔ qx·qy
    function offsetOf(st) { var m = imgSize(st.zoom); return { x: (PB.w - m.w) * st.qx, y: (PB.h - m.h) * st.qy, w: m.w, h: m.h }; }
    // 크기와 떨어진 거리로 qx·qy를 다시 셈 — 0~1로 묶어 사진이 칸 밖으로 빠져 빈 곳이 생기지 않게(줌아웃이면 칸 안에서만 움직임)
    function placeAt(z, ox, oy) {
      z = clampN(z, FIT.MIN, FIT.MAX);
      var m = imgSize(z), sx = PB.w - m.w, sy = PB.h - m.h;
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
  function zoomCenter(photo, fit, z, box) { var PB = box || PHOTO; return fitMath(photo, PB).zoomAround(fit, z, PB.w / 2, PB.h / 2); }
  // o: { photo(): 지금 사진, get(): 지금 맞춤, set(fit): 바꾼 맞춤, onEmpty(): 사진이 없을 때 사진 칸을 누르면(사진 넣기),
  //      box(): 지금 사진 칸 크기 { w, h }(없거나 null이면 이 그림의 사진 칸 — 11/24) }
  function bindFit(el, o) {
    el.style.left = (PHOTO.x / W * 100) + '%'; el.style.top = (PHOTO.y / H * 100) + '%';
    el.style.width = (PHOTO.w / W * 100) + '%'; el.style.height = (PHOTO.h / H * 100) + '%';
    var ptrs = {}, g = null;
    function box() { return (o.box && o.box()) || PHOTO; }
    function toFrame(cx, cy) { var r = el.getBoundingClientRect(), k = box().w / (r.width || 1); return { x: (cx - r.left) * k, y: (cy - r.top) * k }; }
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
      var ps = list(), fm = fitMath(o.photo(), box());
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
    el.addEventListener('click', function (e) {
      e.stopPropagation();   // 밑의 카드(뒤집기 등)까지 눌리지 않게
      if (!o.photo() && o.onEmpty) o.onEmpty();   // 디자인의 "여기를 눌러 강아지 사진 넣기"
    });
    el.addEventListener('wheel', function (e) {
      if (!o.photo()) return;
      e.preventDefault();   // 사진 칸 위에서만 휠이 확대·축소 — 다른 곳에서는 그대로 스크롤
      var p = toFrame(e.clientX, e.clientY), cur = o.get();
      o.set(fitMath(o.photo(), box()).zoomAround(cur, cur.zoom * Math.exp(-e.deltaY * 0.0015), p.x, p.y));
    }, { passive: false });
    el.addEventListener('keydown', function (e) {
      if (!o.photo()) return;
      var cur = o.get(), fm = fitMath(o.photo(), box()), q = fm.offsetOf(cur), step = 18, k = e.key;
      if (k === 'ArrowLeft') o.set(fm.placeAt(cur.zoom, q.x - step, q.y));
      else if (k === 'ArrowRight') o.set(fm.placeAt(cur.zoom, q.x + step, q.y));
      else if (k === 'ArrowUp') o.set(fm.placeAt(cur.zoom, q.x, q.y - step));
      else if (k === 'ArrowDown') o.set(fm.placeAt(cur.zoom, q.x, q.y + step));
      else if (k === '+' || k === '=') o.set(zoomCenter(o.photo(), cur, cur.zoom * 1.2, box()));
      else if (k === '-' || k === '_') o.set(zoomCenter(o.photo(), cur, cur.zoom / 1.2, box()));
      else return;
      e.preventDefault();
    });
  }

  window.WalsonPassPixel = { W: W, H: H, PHOTO: PHOTO, SIGNALS: SIGNALS, draw: draw, dotPhoto: dotPhoto, fontsReady: fontsReady,
    FIT: FIT, fitMath: fitMath, zoomCenter: zoomCenter, bindFit: bindFit };
})();
