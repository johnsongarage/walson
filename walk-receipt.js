// 산책 영수증 그리기(2026-11-15) — 전역 window.WalkReceipt. [기록] 탭(walk-history.html — 11/16 [영수증] 탭을 합침)이 쓴다.
// 가르시아 "영수증 관련 탭을 새로 넣어 봐". 같은 날 다른 기획팀장 검토의 "위쪽 절반은 사진, 아래 절반은 영수증"을 따름.
// 산책 한 번 = 영수증 한 장. 견주들이 산책을 "숙제·빚"이라 부르는 말(RESEARCH_YOUTUBE.md "오늘 저녁도 부채
// 갚으러 갑니다")을 영수증 서류로 비튼 것 — 게임 문법(등급·뽑기·수치) 대신 생활 서류 패러디.
//
// 넣는 것: 사진, 강아지 이름, 날짜(요일까지), 걸은 시간, 거리(길 기록만), 끝 화면 답(충분했나·킁킁·응가),
//         발도장 수(길 기록만, 장소 이름은 빼고), 이번 주 꾸준함 도장, 특이 사항 한 줄, 몇 번째 산책인지.
// 넣지 않는 것: 위치·경로·지도, 발도장 장소 이름, 가게 이름, 산책한 시각(시·분) —
//   매일 올리는 이미지라 쌓이면 집 근처 동선·생활 패턴이 드러난다(CLAUDE.md "개인정보 취급").
// 맨 아래 칸은 나중에 동네 가게 쿠폰 자리 — 제휴 가게가 생기면 길 기록 산책 영수증에만 넣는다(돈이 드는 보상은
//   확인되는 걸음에만 준다는 11/15 결정). 지금은 농담 문구만 둔다.
// 그리기는 이 휴대폰 안에서만 하고 어디로도 보내지 않는다(저장·공유는 사용자가 고른 앱으로).
//
//   WalkReceipt.draw(canvas, data, photo, { fmt: 'feed'|'story', photoY: 0~1, logo })   (화면 테마는 11/16부터 차분 하나뿐)
//   data = { no, date, demo, mode: 'time'|'gps', after(다녀와서 적은 산책), durationMin, distanceKm, feel, sniff, poop,
//            stamps: { hit, fresh } | null, steady: { days, got }, note, name }
(function () {
  var FORMATS = {
    feed:  { w: 1080, h: 1350, label: '피드 4:5' },
    story: { w: 1080, h: 1920, label: '스토리 9:16' }
  };
  // 형식별 크기 — 피드는 줄을 줄이고, 스토리는 몇 줄(품목 머리·결제 수단) 더 넣는다
  var SIZES = {
    feed:  { pw: 860, pad: 46, mono: 30, line: 46, small: 23, smallLine: 34, title: 56, titleLine: 76, rule: 24,
             debt: 36, debtLine: 60, bar: 58, tooth: 12, toothW: 24, margin: 46, stampR: 74, minPhoto: 0.40 },
    story: { pw: 900, pad: 52, mono: 33, line: 52, small: 25, smallLine: 38, title: 64, titleLine: 86, rule: 28,
             debt: 40, debtLine: 68, bar: 70, tooth: 13, toothW: 26, margin: 84, stampR: 84, minPhoto: 0.42 }
  };
  // 영수증 글씨는 고정폭(나눔고딕코딩, 구글 폰트) — walk-history.html이 불러 둔다. 못 불러오면 기기 고정폭 글꼴로.
  var MONO = '"Nanum Gothic Coding", ui-monospace, Menlo, Consolas, monospace';
  var BIG = '"Black Han Sans", Pretendard, sans-serif';
  var INK = '#26211d', SOFT_INK = '#7a7068', STAMP = '#d6453a', PAPER = '#fffdf8';
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var URL_TEXT = 'johnsongarage.co.kr/walson';

  function pad4(n) { var s = String(Math.max(0, n | 0)); while (s.length < 4) s = '0' + s; return s; }
  function dateText(d) {
    var dt = new Date(String(d || '').slice(0, 10) + 'T00:00:00');
    if (isNaN(dt.getTime())) dt = new Date();
    return (dt.getMonth() + 1) + '월 ' + dt.getDate() + '일 (' + DOW[dt.getDay()] + ')';
  }
  function km(v) { return (Math.round((v || 0) * 10) / 10).toFixed(1); }
  // 같은 산책이면 늘 같은 모양(바코드·도장 얼룩)이 나오게 하는 작은 난수
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; };
  }

  // ── 영수증 줄 ──
  function rows(d, fmt) {
    var rich = fmt === 'story';
    var name = d.name || '우리 강아지';
    var seed = hash(String(d.no) + '#' + d.date);
    var noPoop = typeof d.poop !== 'number';
    var timeOnly = d.mode === 'time';
    var out = [];
    out.push({ t: 'title', text: '왈슨 산책 상회' });
    out.push({ t: 'small', align: 'center', text: '대표 ' + name + (rich ? ' · 주소 비공개 (위치는 안 적어요)' : ' · 위치는 안 적어요') });
    out.push({ t: 'rule' });
    out.push({ t: 'pair', l: 'No.' + pad4(d.no) + (d.demo ? ' (데모)' : ''), r: dateText(d.date) });
    out.push({ t: 'rule' });
    if (rich) out.push({ t: 'pair', l: '품목', r: '수량', soft: true });
    // 다녀와서 적은 산책(index.html "다녀왔어요")은 "자진 신고" — 잰 게 아니라 보호자가 적은 것임을 숨기지 않는다
    out.push({ t: 'pair', l: d.after ? '산책 (자진 신고)' : timeOnly ? '산책 (시간만)' : '산책 (길 기록)',
      r: (d.durationMin || 0) + '분' + (!timeOnly && d.distanceKm ? ' · ' + km(d.distanceKm) + 'km' : '') });
    if (d.sniff) out.push({ t: 'dots', l: '킁킁', v: Math.max(1, Math.min(5, d.sniff | 0)) });
    else out.push({ t: 'pair', l: '킁킁', r: '안 적음', soft: true });
    out.push({ t: 'pair', l: '응가', soft: noPoop,
      r: noPoop ? '안 적음' : d.poop === 0 ? '0건 (다음 산책으로)' : d.poop === 1 ? '1건' : '2건 이상' });
    if (d.stamps && d.stamps.hit) out.push({ t: 'pair', l: '발도장', r: d.stamps.hit + '곳' + (d.stamps.fresh ? ' (새로 ' + d.stamps.fresh + ')' : '') });
    if (d.steady && d.steady.days) out.push({ t: 'pair', l: '꾸준함 도장', r: '이번 주 ' + d.steady.days + '일째' + (d.steady.got ? ' · 도장 쾅' : '') });
    out.push({ t: 'rule' });
    out.push({ t: 'label', text: '특이 사항' });
    out.push({ t: 'para', text: d.note || '없음 (평화로운 산책)' });
    out.push({ t: 'rule', double: true });
    // "충분했어요"·답 없음 = 상환 완료, "조금 아쉬워요" = 일부 상환 — 죄책감을 키우지 않게 "연체 아님"을 붙인다
    out.push({ t: 'debt', l: '오늘 산책 빚', r: '1회분', stamp: d.feel === 'short' ? ['일부', '상환'] : ['상환', '완료'], seed: seed });
    // 빚 줄 아래는 모두 왼쪽 정렬·짧게 — 오른쪽 가운데를 도장 자리로 비워 둔다
    if (rich) out.push({ t: 'small', align: 'left', text: '결제: 보호자 다리 (일시불)' });
    out.push({ t: 'small', align: 'left', text: d.feel === 'short' ? '남은 빚은 내일로 이월 (연체 아님)' : '다음 산책 빚은 내일 또 생겨요' });
    out.push({ t: 'small', align: 'left', text: '교환·환불 불가 · 발급 ' + name });
    // (나중에) 동네 가게 쿠폰 칸 — 제휴 가게가 생기면 길 기록 산책 영수증에만. 지금은 없음
    out.push({ t: 'barcode', seed: seed });
    out.push({ t: 'small', align: 'center', text: URL_TEXT });
    return out;
  }

  // 글꼴을 미리 불러올 때 쓰는 글자 모음 — 한글 글꼴은 글자 묶음별로 나뉘어 있어서, 그릴 글자를 같이 넘겨야 받아 온다
  function textOf(list) {
    return list.map(function (r) {
      return [r.text, r.l, r.r].concat(r.stamp || []).filter(Boolean).join('');
    }).join('') + '“”…0123456789.()·';
  }
  function ensureFonts(text) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var t = text || '왈슨 산책 상회';
    var all = Promise.all([
      document.fonts.load('400 30px "Nanum Gothic Coding"', t),
      document.fonts.load('700 30px "Nanum Gothic Coding"', t),
      document.fonts.load('60px "Black Han Sans"', t)
    ]).catch(function () { /* 못 불러와도 기기 글꼴로 그린다 */ });
    var timeout = new Promise(function (res) { setTimeout(res, 3000); });
    return Promise.race([all, timeout]);
  }

  // 한 줄 폭을 넘으면 띄어쓰기에서, 그래도 길면 글자 단위로 자른다. maxLines를 넘으면 말줄임.
  function wrap(ctx, text, maxW, maxLines) {
    var parts = String(text).split(/(\s+)/), lines = [], cur = '';
    for (var i = 0; i < parts.length; i++) {
      var w = parts[i];
      if (!w) continue;
      if (ctx.measureText(cur + w).width <= maxW) { cur += w; continue; }
      if (cur.trim()) lines.push(cur.trim());
      cur = '';
      w = w.replace(/^\s+/, '');
      while (w && ctx.measureText(w).width > maxW) {
        var k = w.length;
        while (k > 1 && ctx.measureText(w.slice(0, k)).width > maxW) k--;
        lines.push(w.slice(0, k));
        w = w.slice(k);
      }
      cur = w;
    }
    if (cur.trim()) lines.push(cur.trim());
    if (!lines.length) lines.push('');
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    return lines;
  }

  function rowHeight(ctx, r, S, inner) {
    switch (r.t) {
      case 'title': return S.titleLine;
      case 'small': return S.smallLine;
      case 'rule': return S.rule;
      case 'pair': case 'dots': return S.line;
      case 'label': return Math.round(S.line * 0.9);
      case 'para':
        ctx.font = '700 ' + S.mono + 'px ' + MONO;
        r.lines = wrap(ctx, r.text, inner - 16, 2);
        return S.line * r.lines.length + 6;
      case 'debt': return S.debtLine;
      case 'barcode': return S.bar + 18;
    }
    return 0;
  }

  function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

  // 오른쪽 값이 칸을 넘으면 글씨를 조금씩 줄인다
  function fitRight(ctx, text, x, y, maxW, weight, size) {
    var s = size;
    ctx.font = weight + ' ' + s + 'px ' + MONO;
    while (s > size * 0.6 && ctx.measureText(text).width > maxW) { s -= 1; ctx.font = weight + ' ' + s + 'px ' + MONO; }
    ctx.textAlign = 'right';
    ctx.fillText(text, x, y);
  }

  function drawRow(ctx, r, S, y, inner) {
    var L = S.pad, R = S.pw - S.pad, mid = y + r.h / 2;
    ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.textBaseline = 'middle';
    switch (r.t) {
      case 'title':
        ctx.font = S.title + 'px ' + BIG; ctx.textAlign = 'center';
        ctx.fillText(r.text, S.pw / 2, mid + 2);
        break;
      case 'small':
        ctx.font = '400 ' + S.small + 'px ' + MONO; ctx.fillStyle = '#4b433c';
        ctx.textAlign = r.align === 'left' ? 'left' : 'center';
        ctx.fillText(r.text, r.align === 'left' ? L : S.pw / 2, mid);
        break;
      case 'rule':
        ctx.lineWidth = 3;
        if (r.double) { line(ctx, L, mid - 4, R, mid - 4); line(ctx, L, mid + 4, R, mid + 4); }
        else { ctx.setLineDash([12, 9]); line(ctx, L, mid, R, mid); ctx.setLineDash([]); }
        break;
      case 'pair':
      case 'debt':
        var big = r.t === 'debt', fs = big ? S.debt : S.mono;
        if (r.soft) ctx.fillStyle = SOFT_INK;
        ctx.font = (big ? '700 ' : '400 ') + fs + 'px ' + MONO; ctx.textAlign = 'left';
        ctx.fillText(r.l, L, mid);
        var lw = ctx.measureText(r.l).width;
        fitRight(ctx, r.r, R, mid, inner - lw - 24, r.soft ? '400' : '700', fs);
        break;
      case 'dots':
        ctx.font = '400 ' + S.mono + 'px ' + MONO; ctx.textAlign = 'left';
        ctx.fillText(r.l, L, mid);
        var rad = S.mono * 0.3, gap = S.mono * 0.86;
        ctx.lineWidth = 2.5;
        for (var i = 0; i < 5; i++) {
          ctx.beginPath(); ctx.arc(R - rad - (4 - i) * gap, mid, rad, 0, Math.PI * 2);
          if (i < r.v) ctx.fill(); else ctx.stroke();
        }
        break;
      case 'label':
        ctx.font = '700 ' + S.mono + 'px ' + MONO; ctx.textAlign = 'left';
        ctx.fillText(r.text, L, mid);
        break;
      case 'para':
        ctx.font = '700 ' + S.mono + 'px ' + MONO; ctx.textAlign = 'left';
        r.lines.forEach(function (ln, k) { ctx.fillText(ln, L + 16, y + S.line * (k + 0.5)); });
        break;
      case 'barcode':
        drawBarcode(ctx, L + 24, y + 10, inner - 48, S.bar, r.seed);
        break;
    }
  }

  function drawBarcode(ctx, x, y, w, h, seed) {
    var rnd = rng(seed || 7), cx = x;
    ctx.fillStyle = INK;
    while (cx < x + w) {
      var bw = 2 + Math.floor(rnd() * 4) * 2;          // 2·4·6·8px
      if (cx + bw > x + w) break;
      ctx.fillRect(cx, y, bw, h);
      cx += bw + 3 + Math.floor(rnd() * 3) * 2;
    }
  }

  // 빨간 도장 — 잉크가 덜 묻은 자국까지(같은 산책이면 같은 모양)
  function drawStamp(ctx, x, y, R, words, seed) {
    var size = Math.ceil(R * 2 + 24), c = document.createElement('canvas');
    c.width = c.height = size;
    var s = c.getContext('2d'), m = size / 2;
    s.strokeStyle = STAMP; s.fillStyle = STAMP;
    s.lineWidth = Math.max(5, R * 0.08); s.beginPath(); s.arc(m, m, R, 0, Math.PI * 2); s.stroke();
    s.lineWidth = Math.max(2, R * 0.03); s.beginPath(); s.arc(m, m, R * 0.8, 0, Math.PI * 2); s.stroke();
    s.textAlign = 'center'; s.textBaseline = 'middle';
    s.font = Math.round(R * 0.46) + 'px ' + BIG;
    s.fillText(words[0], m, m - R * 0.24);
    s.fillText(words[1], m, m + R * 0.28);
    var rnd = rng(seed);
    s.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < 110; i++) {
      s.globalAlpha = 0.3 + rnd() * 0.6;
      s.beginPath(); s.arc(rnd() * size, rnd() * size, 0.8 + rnd() * 2.8, 0, Math.PI * 2); s.fill();
    }
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-14 * Math.PI / 180);
    ctx.globalAlpha = 0.9;
    ctx.drawImage(c, -m, -m);
    ctx.restore();
  }

  function paperPath(ctx, w, h, tooth, toothW) {
    var n = Math.max(4, Math.round(w / toothW)), tw = w / n;
    ctx.beginPath();
    ctx.moveTo(0, tooth);
    for (var i = 0; i < n; i++) { ctx.lineTo(tw * (i + 0.5), 0); ctx.lineTo(tw * (i + 1), tooth); }
    ctx.lineTo(w, h - tooth);
    for (var j = n - 1; j >= 0; j--) { ctx.lineTo(tw * (j + 0.5), h); ctx.lineTo(tw * j, h - tooth); }
    ctx.closePath();
  }
  function drawPaper(ctx, S, PH) {
    ctx.save();
    ctx.shadowColor = 'rgba(60, 38, 22, 0.30)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 14;
    paperPath(ctx, S.pw, PH, S.tooth, S.toothW); ctx.fillStyle = PAPER; ctx.fill();
    ctx.restore();
  }

  // 사진 칸: 꽉 차게 놓고 위·아래 위치(posY 0~1)만 고른다. 사진이 없으면 앱 그림(성난 치와와)
  function drawPhoto(ctx, img, W, h, posY, logo) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, h); ctx.clip();
    if (img && img.width) {
      var s = Math.max(W / img.width, h / img.height);
      var pw = img.width * s, ph = img.height * s;
      var p = posY == null ? 0.4 : Math.max(0, Math.min(1, posY));
      ctx.drawImage(img, (W - pw) / 2, -(ph - h) * p, pw, ph);
    } else {
      ctx.fillStyle = '#f1b732';   // 앱 그림(walson-logo.webp) 바탕과 같은 노랑 — 다르면 그림 둘레에 네모가 비친다
      ctx.fillRect(0, 0, W, h);
      if (logo && logo.width) {
        var lh = Math.min(h * 0.66, 720), lw = lh * logo.width / logo.height;
        ctx.drawImage(logo, (W - lw) / 2, Math.max(24, (h - 90 - lh) / 2), lw, lh);
      }
    }
    ctx.restore();
  }

  function draw(canvas, d, photo, opts) {
    opts = opts || {};
    var fmt = FORMATS[opts.fmt] ? opts.fmt : 'feed';
    var F = FORMATS[fmt], S = SIZES[fmt], W = F.w, H = F.h;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.setLineDash([]);

    var list = rows(d, fmt);
    var inner = S.pw - S.pad * 2, contentH = 0;
    list.forEach(function (r) { r.h = rowHeight(ctx, r, S, inner); contentH += r.h; });
    var top = S.tooth + S.pad - 10;
    var PH = top + contentH + S.pad + S.tooth - 4;
    // 사진 칸이 너무 작아지면(특이 사항이 두 줄 등) 영수증을 줄인다
    var maxPH = H - S.margin - H * S.minPhoto;
    var scale = PH > maxPH ? maxPH / PH : 1;
    var paperTop = H - S.margin - PH * scale;
    var photoH = Math.round(paperTop + 70 * scale);

    ctx.fillStyle = '#f3ddd2';
    ctx.fillRect(0, 0, W, H);
    drawPhoto(ctx, photo, W, photoH, opts.photoY, opts.logo);

    // 영수증 종이 — 아래 가운데를 기준으로 살짝 기울여 사진 위에 올린다
    ctx.save();
    ctx.translate(W / 2, H - S.margin);
    ctx.rotate(-1.2 * Math.PI / 180);
    ctx.scale(scale, scale);
    ctx.translate(-S.pw / 2, -PH);
    drawPaper(ctx, S, PH);
    var y = top, stampAt = null;
    list.forEach(function (r) {
      drawRow(ctx, r, S, y, inner);
      if (r.t === 'debt') stampAt = { y: y + r.h / 2, words: r.stamp, seed: r.seed };
      y += r.h;
    });
    if (stampAt) drawStamp(ctx, S.pw * 0.64, stampAt.y + S.stampR * 0.35, S.stampR, stampAt.words, stampAt.seed);
    ctx.restore();
    return canvas;
  }

  window.WalkReceipt = {
    FORMATS: FORMATS,
    draw: draw,
    rows: rows,
    textOf: function (d, fmt) { return textOf(rows(d, fmt)); },
    ensureFonts: ensureFonts
  };
})();
