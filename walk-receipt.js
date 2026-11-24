// 산책 영수증 그리기(2026-11-15) — 전역 window.WalkReceipt. [기록] 탭(walk-history.html — 11/16 [영수증] 탭을 합침)이 쓴다.
// 가르시아 "영수증 관련 탭을 새로 넣어 봐". 산책 한 번 = 영수증 한 장. 견주들이 산책을 "숙제·빚"이라 부르는 말(RESEARCH_YOUTUBE.md
// "오늘 저녁도 부채 갚으러 갑니다")을 영수증 서류로 비튼 것 — 게임 문법(등급·뽑기·수치) 대신 생활 서류 패러디.
//
// 2026-11-23 개편(가르시아 "너무 글씨가 빽빽해서 안 보여" → 시안 3개 중 "일단 2번으로, 숫자만 키우고 분·km 사이즈 내리고"):
//   사진을 꽉 채우고, 아래에 영수증 조각 한 장만 붙인다(docs/receipt-drafts 시안 2). 예전엔 줄이 20개 안팎이라 종이를 줄여 그려서
//   [기록] 미리 보기에서 본문이 8px쯤이었다. 조각에는 큰 숫자(분·km는 작게), 알약 몇 개, 특이 사항, 브랜드 줄만 둔다.
//   도장(상환 완료·응가 "오늘도 해냈다")은 조각 모서리에 스티커처럼 걸친다. 산책 빚 줄·농담 줄·품목표는 뺐다.
// 2026-11-24 가르시아 "세로를 좀 더 줄여 봐, 위에 사진이 더 많이 나오게 · 날짜와 몇 분 사이 여백·몇 분 글씨 줄이고 ·
//   홈페이지 주소 대신 산책 뒤에 왈슨": 조각 키를 줄이고(피드 590→480px쯤), 아래 줄은 문구 뒤에 이름 한 줄.
//   → 같은 날 "영수증에 영어 말고 한글로 왈슨 적어 줘": "당신과 강아지의 유의미한 산책 · 왈슨"(site-config.js brand.nameKo).
//
// 넣는 것: 사진, 강아지 이름, 날짜(요일까지), 몇 번째 산책인지, 걸은 시간, 거리(길 기록만), 응가·킁킁·발도장(또는 꾸준함)·오늘 목표 달성 알약,
//         특이 사항, 상환 도장(충분했나), 응가 도장. 다녀와서 적은 산책은 "자진 신고"라고 숨기지 않는다.
// 넣지 않는 것: 위치·경로·지도, 발도장 장소 이름, 가게 이름, 산책한 시각(시·분) —
//   매일 올리는 이미지라 쌓이면 집 근처 동선·생활 패턴이 드러난다(CLAUDE.md "개인정보 취급").
// 그리기는 이 휴대폰 안에서만 하고 어디로도 보내지 않는다(저장·공유는 사용자가 고른 앱으로).
//
//   WalkReceipt.draw(canvas, data, photo, { fmt: 'feed'|'story', photoY: 0~1, photoX: 0~1, photoZoom: 1~, logo, layout })
//     사진은 그림 전체에 꽉 차게(photoX·photoY로 옮기고 photoZoom으로 키운다). 사진이 없으면 앱 그림(logo)을 노란 바탕에.
//     layout: 빈 객체를 넘기면 { W, H, photoH, note: { y, h }, paper: { x, w } }를 채워 준다
//             (편집기가 사진을 끄는 칸(이제 그림 전체)과, [특이 사항] 탭에서 크게 보여 줄 줄을 알게).
//   data = { no, date, demo, mode: 'time'|'gps', after(다녀와서 적은 산책), durationMin, distanceKm, feel, sniff, poop,
//            stamps: { hit, fresh } | null, steady: { days, got }, goal: { target, total, reached } | null, note, name }
(function () {
  var FORMATS = {
    feed:  { w: 1080, h: 1350, label: '피드 4:5' },
    story: { w: 1080, h: 1920, label: '스토리 9:16' }
  };
  // 형식별 크기 — 휴대폰에서 1080px 그림이 3분의 1쯤으로 보이니 본문 44~50px(화면 15px 안팎), 숫자 110~130px
  // 2026-11-24 가르시아 "세로를 좀 더 줄여, 위에 사진이 더 나오게 · 날짜와 몇 분 사이 여백 줄이고 몇 분 글씨 줄여":
  //   숫자 128→108(스토리 150→126)·단위도 같이, 큰 숫자 칸은 숫자 키(재 본 값)에 맞춰서 위아래로 남던 자리를 없앴다.
  //   top: 톱니 아래 → 날짜 줄, metaGap: 날짜 줄 → 숫자 윗선(가운데에 점선), heroBot: 숫자 바닥선 → 알약, end: 브랜드 줄 → 톱니
  var SIZES = {
    story: { pw: 860, pad: 50, tooth: 14, toothW: 28, bottom: 120, top: 26, meta: 38, metaGap: 46, num: 126, unit: 52, sep: 54, heroBot: 24,
             pill: 36, pillH: 66, pillGap: 18, note: 50, noteLine: 66, bar: 40, barW: 380, brand: 28, end: 26,
             stampR: 118, title: 36, titleX: 56, titleY: 72, minPhoto: 0.40 },
    feed:  { pw: 840, pad: 44, tooth: 13, toothW: 26, bottom: 64, top: 24, meta: 34, metaGap: 40, num: 108, unit: 44, sep: 46, heroBot: 20,
             pill: 32, pillH: 58, pillGap: 14, note: 44, noteLine: 58, bar: 34, barW: 340, brand: 26, end: 24,
             stampR: 100, title: 32, titleX: 48, titleY: 52, minPhoto: 0.38 }
  };
  // 글꼴: 숫자·도장 = 블랙한산스, 날짜·브랜드 줄 = 나눔고딕코딩(영수증 고정폭), 알약·특이 사항 = 프리텐다드(작아도 잘 읽힌다).
  // walk-history.html이 불러 둔다. 못 불러오면 기기 글꼴로.
  var MONO = '"Nanum Gothic Coding", ui-monospace, Menlo, Consolas, monospace';
  var BIG = '"Black Han Sans", Pretendard, sans-serif';
  var SANS = 'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  var INK = '#26211d', SOFT_INK = '#7a7068', STAMP = '#d6453a', PAPER = '#fffdf8', PILL = '#f3ece3', RULE = '#bdb2a6';
  var GOAL_PILL = '#fde4df';   // 오늘 목표 달성 알약 바탕(글씨는 도장 빨강)
  var POOP_INK = '#7a4a26';   // 응가 도장 — 빨간 도장(상환)과 갈리게 갈색 한 색
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var SHOP = '동네 산책 상회';   // 2026-11-17 가르시아 "다산동 산책 상회로 가 일단" → 11/24 전국판이라 "동네 산책 상회"(가르시아 "다산동 들어간 건 빼 줘"). 앱 이름은 아래 브랜드 줄(site-config.js brand)로
  // 아래 홈페이지 주소 줄(johnsongarage.co.kr/walson)은 뺐다 — 2026-11-24 가르시아 "홈페이지 주소 대신 산책 뒤에 왈슨 붙여 줘"

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

  // ── 조각에 들어갈 글 ──
  function parts(d) {
    var name = d.name || '우리 강아지';
    var meta = name + ' · ' + dateText(d.date) + (d.after ? ' · 자진 신고' : '') + ' · No.' + pad4(d.no) + (d.demo ? ' (데모)' : '');
    // 큰 숫자: 숫자는 크게, 단위(분·km)는 작게(11/23 가르시아)
    var hero = [{ t: String(Math.max(0, d.durationMin | 0)), num: true }, { t: '분' }];
    if (d.mode !== 'time' && d.distanceKm) hero.push({ t: '·', sep: true }, { t: km(d.distanceKm), num: true }, { t: 'km' });
    // 알약: 적은 것만 — 응가 · 킁킁 · 발도장(없으면 이번 주 꾸준함) · 오늘 목표 달성(11/23 가르시아 "오늘 목표 달성도 알약으로", 빨간 글씨)
    var pills = [];
    if (typeof d.poop === 'number') pills.push({ t: '응가 ' + (d.poop >= 2 ? '2건+' : d.poop + '건') });
    if (d.sniff) pills.push({ t: '킁킁 ' + Math.max(1, Math.min(5, d.sniff | 0)) + '/5' });
    if (d.stamps && d.stamps.hit) pills.push({ t: '발도장 ' + d.stamps.hit + '곳' });
    else if (d.steady && d.steady.days) pills.push({ t: '꾸준함 ' + d.steady.days + '일째' });
    if (d.goal && d.goal.target && d.goal.reached) pills.push({ t: '오늘 목표 달성', goal: true });
    var B = window.WALSON_CONFIG && WALSON_CONFIG.brand;
    return {
      meta: meta, hero: hero, pills: pills, note: d.note || '', noteEmpty: '평화로운 산책',
      // "충분했어요"·답 없음 = 상환 완료, "조금 아쉬워요" = 일부 상환(연체가 아니라 이월 — 죄책감을 키우지 않게)
      stamp: d.feel === 'short' ? ['일부', '상환'] : ['상환', '완료'],
      poop: typeof d.poop === 'number' ? d.poop : 0,
      // 브랜드 줄: 문구 뒤에 한글 이름 — "당신과 강아지의 유의미한 산책 · 왈슨"(11/24 가르시아 "산책 뒤에 왈슨" → "영어 말고 한글로 왈슨").
      // 글자는 site-config.js에서(nameKo가 없으면 영문 name). 영수증은 홍보물 두 줄 규칙("WALSON" 글자 그대로)에서 뺀 곳
      brand: B && (B.nameKo || B.name) ? (B.tagline ? B.tagline + ' · ' : '') + (B.nameKo || B.name) : '',
      seed: hash(String(d.no) + '#' + d.date)
    };
  }

  // 글꼴을 미리 불러올 때 쓰는 글자 모음 — 한글 글꼴은 글자 묶음별로 나뉘어 있어서, 그릴 글자를 같이 넘겨야 받아 온다
  function textOf(d) {
    var p = parts(d);
    return [SHOP, p.meta, p.note, p.noteEmpty, p.brand].concat(p.pills.map(function (x) { return x.t; }), p.stamp).join('') +
      p.hero.map(function (h) { return h.t; }).join('') + '0123456789.·/분km건곳일째응가킁킁발도장꾸준함오늘도해냈다×2+';
  }
  function ensureFonts(text) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var t = text || SHOP;
    var all = Promise.all([
      document.fonts.load('400 30px "Nanum Gothic Coding"', t),
      document.fonts.load('700 30px "Nanum Gothic Coding"', t),
      document.fonts.load('60px "Black Han Sans"', t),
      document.fonts.load('800 40px Pretendard', t)
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
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function dashed(ctx, x1, x2, y) {
    ctx.save(); ctx.strokeStyle = RULE; ctx.lineWidth = 3; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); ctx.restore();
  }

  // 큰 숫자 줄 — 숫자는 크게, 단위·가운뎃점은 작게, 바닥선을 맞춘다. 폭을 넘으면(긴 산책) 같이 줄인다
  function heroLayout(ctx, hero, S, maxW) {
    var k = 1, items, total;
    function fontOf(h, kk) { return Math.round((h.num ? S.num : h.sep ? S.sep : S.unit) * kk) + 'px ' + BIG; }
    function measure(kk) {
      total = 0;
      items = hero.map(function (h, i) {
        ctx.font = fontOf(h, kk);
        var w = ctx.measureText(h.t).width;
        // 숫자와 단위는 붙이고, 가운뎃점 앞뒤는 띄운다
        var gap = i === 0 ? 0 : h.sep || (hero[i - 1] && hero[i - 1].sep) ? S.num * 0.2 * kk : h.num ? S.num * 0.06 * kk : S.num * 0.03 * kk;
        total += gap + w;
        return { h: h, w: w, gap: gap, font: fontOf(h, kk) };
      });
    }
    measure(k);
    while (total > maxW && k > 0.55) { k -= 0.04; measure(k); }
    // 숫자 윗선까지 높이 — 글꼴마다 달라서 재 본다(블랙한산스는 글자 크기의 0.64쯤). 못 재면 0.7로
    var asc = 0;
    items.forEach(function (it) {
      if (!it.h.num) return;
      ctx.font = it.font;
      asc = Math.max(asc, ctx.measureText(it.h.t).actualBoundingBoxAscent || 0);
    });
    return { items: items, total: total, asc: asc || S.num * k * 0.7 };
  }
  function drawHero(ctx, L, cx, baseline, S) {
    var x = cx - L.total / 2;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    L.items.forEach(function (it) {
      x += it.gap;
      ctx.font = it.font; ctx.fillStyle = it.h.sep ? SOFT_INK : INK;
      // 가운뎃점은 숫자 가운데 높이쯤으로 올린다
      ctx.fillText(it.h.t, x, it.h.sep ? baseline - S.num * 0.22 : baseline);
      x += it.w;
    });
  }

  // 알약 줄: 한 줄에 다 들어가면 한 줄, 아니면 앞에서부터 채워 두 줄(줄마다 가운데). 그래도 넘치면 글씨를 조금 줄인다
  function pillRows(ctx, pills, S, inner) {
    if (!pills.length) return { rows: [], fs: S.pill };
    for (var fs = S.pill; ; fs -= 1) {
      ctx.font = '800 ' + fs + 'px ' + SANS;
      var ws = pills.map(function (p) { return ctx.measureText(p.t).width + fs * 1.2; });
      var rows = [], cur = [], cw = 0;
      pills.forEach(function (p, i) {
        var add = (cur.length ? S.pillGap : 0) + ws[i];
        if (cur.length && cw + add > inner) { rows.push(cur); cur = []; cw = 0; add = ws[i]; }
        cur.push({ p: p, w: ws[i] }); cw += add;
      });
      if (cur.length) rows.push(cur);
      var fits = rows.length <= 2 && rows.every(function (r) { return r.reduce(function (a, x, k) { return a + x.w + (k ? S.pillGap : 0); }, 0) <= inner; });
      if (fits || fs <= S.pill * 0.7) return { rows: rows.slice(0, 2), fs: fs };
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

  // 응가 도장 — 눈알 달린 응가 + "오늘도 / 해냈다"(2건 이상이면 "해냈다 ×2"). right·cy: 도장 오른쪽 끝과 세로 가운데, R0: 크기 기준
  // 사진 위에 걸치므로 종이색 받침을 깔아 스티커처럼(11/23)
  var POOP_PATH = 'M4 22c-3-1-2-5 1-5-1-3 1-6 5-5 0-4 4-6 7-4 2-3 7-2 7 2 3 0 5 3 3 6 3 1 3 5 0 6z';   // 30×24 칸(응가 달력과 같은 그림)
  function drawPoopStamp(ctx, right, cy, R0, count) {
    var l1 = '오늘도', l2 = count >= 2 ? '해냈다 ×2' : '해냈다';
    ctx.save();
    var tf = Math.round(R0 * 0.34);
    ctx.font = tf + 'px ' + BIG;
    var tw = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width);
    var sh = R0 * 0.98, ih = sh * 0.6, iw = ih * 30 / 24, padX = R0 * 0.13, gap = R0 * 0.09;
    var sw = padX + iw + gap + tw + padX, r = R0 * 0.12;
    ctx.translate(right - sw / 2, cy);
    ctx.rotate(7 * Math.PI / 180);
    var x0 = -sw / 2, y0 = -sh / 2;
    // 받침
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5;
    ctx.fillStyle = PAPER; rr(ctx, x0 - R0 * 0.08, y0 - R0 * 0.08, sw + R0 * 0.16, sh + R0 * 0.16, r * 1.6); ctx.fill(); ctx.restore();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = POOP_INK; ctx.fillStyle = POOP_INK; ctx.lineWidth = Math.max(3, R0 * 0.05);
    rr(ctx, x0, y0, sw, sh, r); ctx.stroke();
    if (typeof Path2D === 'function') {
      ctx.save();
      ctx.translate(x0 + padX, -ih / 2);
      ctx.scale(ih / 24, ih / 24);
      ctx.fill(new Path2D(POOP_PATH));
      ctx.fillStyle = PAPER;
      ctx.beginPath(); ctx.arc(11, 15.5, 2.7, 0, Math.PI * 2); ctx.arc(18.5, 15.5, 2.7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = POOP_INK;
      ctx.beginPath(); ctx.arc(11.6, 16, 1.25, 0, Math.PI * 2); ctx.arc(19.1, 16, 1.25, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.font = tf + 'px ' + BIG; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    var tx = x0 + padX + iw + gap;
    ctx.fillText(l1, tx, -tf * 0.56);
    ctx.fillText(l2, tx, tf * 0.62);
    ctx.restore();
    return sw;
  }

  // 빨간 도장 — 잉크가 덜 묻은 자국까지(같은 산책이면 같은 모양). 사진 위에 걸치므로 종이색 받침(11/23)
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
    ctx.translate(x, y);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(0, 0, R * 1.12, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.rotate(-14 * Math.PI / 180);
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
    ctx.shadowColor = 'rgba(40, 20, 10, 0.32)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 14;
    paperPath(ctx, S.pw, PH, S.tooth, S.toothW); ctx.fillStyle = PAPER; ctx.fill();
    ctx.restore();
  }

  // 사진: 그림 전체에 꽉 차게(posX·posY 0~1로 옮기고 zoom으로 키운다). 사진이 없으면 노란 바탕에 앱 그림(성난 치와와)을
  // 조각에 가리지 않는 위쪽(visibleH)에
  function drawPhoto(ctx, img, W, h, posY, logo, posX, zoom, visibleH) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, h); ctx.clip();
    if (img && img.width) {
      var s = Math.max(W / img.width, h / img.height) * Math.max(1, zoom || 1);
      var pw = img.width * s, ph = img.height * s;
      var p = posY == null ? 0.4 : Math.max(0, Math.min(1, posY));
      var q = posX == null ? 0.5 : Math.max(0, Math.min(1, posX));
      ctx.drawImage(img, -(pw - W) * q, -(ph - h) * p, pw, ph);
      // 아래쪽을 살짝 어둡게 — 조각이 떠 보이게
      var g = ctx.createLinearGradient(0, h * 0.45, 0, h);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.32)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, h);
    } else {
      ctx.fillStyle = '#f1b732';   // 앱 그림(walson-logo.webp) 바탕과 같은 노랑 — 다르면 그림 둘레에 네모가 비친다
      ctx.fillRect(0, 0, W, h);
      if (logo && logo.width) {
        var vh = visibleH || h, lh = Math.min(vh * 0.7, 760), lw = lh * logo.width / logo.height;
        ctx.drawImage(logo, (W - lw) / 2, Math.max(24, (vh - lh) / 2 + 40), lw, lh);
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

    var P = parts(d), inner = S.pw - S.pad * 2;
    // ── 조각 높이 먼저 ──
    var hero = heroLayout(ctx, P.hero, S, inner);
    ctx.font = '800 ' + S.note + 'px ' + SANS;
    var noteLines = wrap(ctx, P.note || P.noteEmpty, inner, 2);
    var PR = pillRows(ctx, P.pills, S, inner);
    var pillsH = PR.rows.length ? PR.rows.length * S.pillH + (PR.rows.length - 1) * 12 + 22 : 0;
    var heroH = S.metaGap + hero.asc + S.heroBot;   // 날짜 줄 아래 → 숫자 바닥선 아래 여백까지
    var PH = S.tooth + S.top + S.meta + heroH + pillsH + noteLines.length * S.noteLine + 14 + 18 + S.bar + 12 + S.brand + S.end + S.tooth;
    // 사진이 너무 가려지면(특이 사항 두 줄 등) 조각을 줄인다
    var maxPH = H - S.bottom - H * S.minPhoto, scale = PH > maxPH ? maxPH / PH : 1;
    var stubTop = H - S.bottom - PH * scale;

    // ── 사진(전체) ──
    ctx.fillStyle = '#2b231e'; ctx.fillRect(0, 0, W, H);
    drawPhoto(ctx, photo, W, H, opts.photoY, opts.logo, opts.photoX, opts.photoZoom, stubTop);
    if (opts.layout) { opts.layout.W = W; opts.layout.H = H; opts.layout.photoH = H; }

    // ── 왼쪽 위 가게 이름 딱지 ──
    ctx.font = '800 ' + S.title + 'px ' + SANS;
    var tw = ctx.measureText(SHOP).width + S.title * 1.6, th = S.title * 2;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
    ctx.fillStyle = 'rgba(255,253,248,0.94)'; rr(ctx, S.titleX, S.titleY, tw, th, th / 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(SHOP, S.titleX + S.title * 0.8, S.titleY + th / 2 + 1);

    // ── 영수증 조각 — 아래 가운데를 기준으로 살짝 기울여 사진 위에 올린다 ──
    ctx.save();
    ctx.translate(W / 2, H - S.bottom);
    ctx.rotate(-2.5 * Math.PI / 180);
    ctx.scale(scale, scale);
    ctx.translate(-S.pw / 2, -PH);
    drawPaper(ctx, S, PH);
    var L = S.pad, R = S.pw - S.pad, C = S.pw / 2, y = S.tooth + S.top;
    // 이름 · 날짜 · 번호
    ctx.fillStyle = SOFT_INK; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    var ms = S.meta;
    ctx.font = '700 ' + ms + 'px ' + MONO;
    while (ms > S.meta * 0.7 && ctx.measureText(P.meta).width > inner) { ms -= 1; ctx.font = '700 ' + ms + 'px ' + MONO; }
    ctx.fillText(P.meta, L, y + S.meta * 0.92);
    y += S.meta;
    // 점선은 날짜 줄과 숫자 사이 가운데쯤(날짜 줄 글자 아래 끝이 칸 밑으로 조금 내려오는 만큼 아래로)
    dashed(ctx, L, R, y + S.metaGap * 0.45);
    // 큰 숫자 — 숫자 윗선이 날짜 줄에서 metaGap만큼 아래
    drawHero(ctx, hero, C, y + S.metaGap + hero.asc, S);
    y += heroH;
    // 알약(한 줄 또는 두 줄)
    if (PR.rows.length) {
      ctx.font = '800 ' + PR.fs + 'px ' + SANS; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      PR.rows.forEach(function (row, ri) {
        var total = row.reduce(function (a, x, k) { return a + x.w + (k ? S.pillGap : 0); }, 0), px = C - total / 2;
        row.forEach(function (x) {
          ctx.fillStyle = x.p.goal ? GOAL_PILL : PILL; rr(ctx, px, y, x.w, S.pillH, S.pillH / 2); ctx.fill();
          ctx.fillStyle = x.p.goal ? STAMP : INK; ctx.fillText(x.p.t, px + x.w / 2, y + S.pillH / 2 + 1);
          px += x.w + S.pillGap;
        });
        y += S.pillH + (ri < PR.rows.length - 1 ? 12 : 22);
      });
    }
    // 특이 사항
    var n0 = y;
    ctx.font = '800 ' + S.note + 'px ' + SANS; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = P.note ? INK : SOFT_INK;
    noteLines.forEach(function (t) { ctx.fillText(t, C, y + S.note * 0.95); y += S.noteLine; });
    var n1 = y;
    y += 14;
    dashed(ctx, L, R, y + 6); y += 18;
    // 바코드 · 브랜드 줄(site-config.js brand — "문구 · 왈슨"). 홈페이지 주소 줄은 11/24에 뺐다
    drawBarcode(ctx, C - S.barW / 2, y, S.barW, S.bar, P.seed); y += S.bar + 12;
    ctx.fillStyle = INK; ctx.font = '700 ' + S.brand + 'px ' + MONO; ctx.textAlign = 'center';
    if (P.brand) ctx.fillText(P.brand, C, y + S.brand * 0.9);
    // 도장 — 조각 오른쪽 위 모서리에 스티커처럼 걸친다(응가를 적은 날은 갈색 응가 도장도). 받침 아래 끝이 조각 위 여백까지만
    // 내려오게 해서 이름·날짜 줄을 가리지 않는다
    var edge = S.tooth + 16, sx = S.pw - S.stampR * 0.62, sy = edge - S.stampR * 1.12;
    drawStamp(ctx, sx, sy, S.stampR, P.stamp, P.seed);
    if (P.poop >= 1) { var R0 = S.stampR * 0.78; drawPoopStamp(ctx, sx - S.stampR * 1.22, edge - R0 * 0.6, R0, P.poop); }
    ctx.restore();

    // 특이 사항 줄이 그림의 어디에 있는지(조각은 2.5도 기울었지만 무시) — 편집기 [특이 사항] 탭이 이 줄을 크게 보여 준다
    if (opts.layout) {
      opts.layout.note = { y: H - S.bottom + (n0 - PH) * scale, h: (n1 - n0) * scale };
      opts.layout.paper = { x: W / 2 - S.pw * scale / 2, w: S.pw * scale };
    }
    return canvas;
  }

  window.WalkReceipt = {
    FORMATS: FORMATS,
    draw: draw,
    textOf: function (d) { return textOf(d); },
    ensureFonts: ensureFonts
  };
})();
