// 산책 별자리(2026-11-27 가르시아 "5번과 4번 2번 진행해" — 첫 경험 기획안 ②·④·⑤). 시안: constellation-sian.html.
// 규칙(11/27 가르시아 "켜고 걸은 사람에게 이 정도 메리트는 있어야지" · "한 달 기준은 보름 이상으로" · "한 달 내내 걸은 가치도 인정"):
//   [산책 시작]을 누르고 5분 넘게 걸은 날 = 별 1개(다녀와서 적은 산책은 별 없음 — 11/27까지 이미 뜬 별은 남김 AFTER_KEEP).
//   같은 날 또 걸으면 새 별 대신 그 별이 밝아진다(걸은 분을 더함). 보름(15일)이면 우리 개 머리 모양 별자리 완성 —
//   윤곽 12 → 코 → 왼눈 → 오른눈(마지막 둘이 눈이라 다 채우면 "눈을 떠요"). 16일째부터는 별가루, 25일이면 은하수, 하루도 안 빠지면 보름달
//   (달은 걸은 날만큼 차오른다). 크기 = 그날 걸은 분, 색 = 시간대(아침·낮·저녁·밤).
//   별을 누르면 그날의 "산책 별" 카드(dayCard — 11/27 "별을 누르면 영수증인데 이런 형태여야겠다, 영수증 너무 숫자야").
// "우리가 만난 날 별"(④ 처음 온 날도 하늘이 비어 있지 않게): 이 기기에서 별자리를 처음 본 날 하나 — 산책 별 수에 세지 않는다.
// 쓰는 곳: [아지트] 창가 줄·큰 하늘(azit.html), 산책 끝 "별 하나 떴어요"(walk-end.html).
// 저장: 별은 산책 기록(WalsonStore.walks)에서 그때그때 센다 — 따로 저장하는 건 만난 날(localStorage) 하나. 밖으로 보내는 것 없음.
//
//   WalsonStars.month(walks?, ym?)   → { ym, stars:[{date, min, h}], over:[…별가루], full, dayCapped }
//   WalsonStars.lastWalkStar(walks?) → 마지막 산책이 이번 달 별이 됐는지 { got, index, month, reason }
//   WalsonStars.thumb(canvas)        → 작은 창가 하늘(아지트 줄)
//   WalsonStars.open({ fresh, room }) → 큰 하늘 판(저장·공유). fresh면 마지막 별이 날아와 앉는다. room = 아지트 방 캔버스(공유 그림에 같이)
//   WalsonStars.sky(opts?)           → 1년 하늘 { dog, name, months:[{back, ym, stars:[{min,h}], over}] } — 이 기기 기록(3D 하늘 sky.html)
//   WalsonStars.encode(sky, { name, color }) / decode(text) → 공유 링크 글자(2026-11-27 "3D 하늘 공유" 1단계).
//     링크에 싣는 것: 도트 강아지 · (고르면) 이름 · 달마다 별의 크기 4단계와 시간대 4가지(고르면 모두 흰 별) · 별가루 수.
//     싣지 않는 것: 날짜·시각·걸은 분·위치. 주소 # 뒤에 있어서 서버로 가지 않는다.
(function () {
  'use strict';
  var GOAL = 15, PER_DAY = 1, MIN = 5, MILKY = 25, AFTER_KEEP = '2026-11-27', MET_KEY = 'walson_sky_met';   // 보름 · 하루 1칸 · 5분 · 은하수 25일
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function cfg() { return window.WALSON_CONFIG || {}; }
  function brand() { return cfg().brand || { name: 'WALSON', nameKo: '왈슨', tagline: '당신과 강아지의 유의미한 산책' }; }
  function appUrl() { return cfg().appUrl || 'https://johnsongarage.co.kr/walson'; }

  // ── 별자리 자리(시안 DOGS — _dev/constellation-points.py가 icons/dot-dogs/px 그림에서 뽑은 것) ──
  var DOGS = {
    chihuahua: { line: [[10, 57], [12, 33], [5, 25], [0, 8], [7, 1], [19, 13], [40, 16], [53, 3], [61, 2], [56, 25], [48, 34], [51, 57]], face: [[20, 32.5], [42, 32.5], [30.5, 39]] },
    pom: { line: [[1, 55], [5, 47], [7, 31], [4, 24], [11, 8], [17, 0], [37, 4], [55, 3], [59, 7], [63, 23], [60, 43], [52, 55]], face: [[25, 30], [44, 31.5], [34.5, 38.5]] },
    maltese: { line: [[19, 49], [28, 35], [20, 27], [16, 18], [27, 6], [39, 1], [47, 0], [60, 4], [70, 12], [67, 26], [59, 36], [63, 49]], face: [[38, 21.5], [54, 21.5], [48, 29.5]] },
    shiba: { line: [[48, 73], [49, 51], [53, 31], [50, 6], [67, 13], [90, 11], [100, 0], [108, 6], [107, 26], [113, 38], [108, 62], [112, 73]], face: [[71, 35.5], [92.5, 35.5], [82, 50]] },
    poodle: { line: [[13, 45], [14, 36], [8, 39], [0, 30], [6, 16], [19, 3], [33, 0], [43, 3], [56, 16], [62, 30], [53, 31], [51, 45]], face: [[23.5, 24], [39, 23.3], [31, 31]] },
    dachs: { line: [[13, 37], [3, 29], [0, 17], [12, 4], [22, 0], [30, 0], [40, 4], [52, 17], [48, 31], [42, 33], [37, 25], [39, 37]], face: [[18.3, 15.8], [34.2, 15.8], [26.3, 25.8]] },
    jindo: { line: [[9, 59], [8, 32], [3, 6], [11, 1], [23, 14], [37, 14], [50, 1], [56, 1], [57, 18], [52, 32], [54, 53], [59, 59]], face: [[20, 31.5], [40, 31.5], [30.4, 43]] },
    knit: { close: true, line: [[25, 70], [20, 60], [7, 56], [4, 64], [0, 61], [0, 47], [5, 37], [0, 33], [13, 4], [19, 0], [26, 4], [36, 33]], face: [[11, 47], [20.5, 50], [14, 52]] },
    // 11/27 새 견종 — _dev/constellation-points.py
    spitz: { line: [[2,47],[0,35],[5,19],[8,13],[8,5],[14,0],[24,9],[32,9],[42,0],[46,2],[52,27],[52,47]], face: [[19.8,25.6],[36.3,25.6],[27.5,33]] },
    cocker: { line: [[34,65],[31,57],[33,45],[40,36],[46,16],[68,0],[83,0],[102,13],[111,36],[118,45],[120,57],[117,65]], face: [[64.2,23.9],[86.9,23.9],[75.3,32]] },
    chihuahua_long: { line: [[7,49],[6,33],[0,14],[1,2],[10,1],[23,9],[35,9],[51,0],[57,2],[57,21],[49,34],[49,49]], face: [[19.1,27.5],[38,27.5],[28.3,32.7]] },
    bichon: { line: [[14,51],[16,45],[1,36],[0,28],[14,8],[26,0],[42,1],[63,22],[66,34],[62,39],[52,39],[51,51]], face: [[24.2,27.4],[41.9,27.4],[33,33]] },
    golden: { line: [[45,55],[49,41],[39,24],[40,19],[53,4],[65,0],[82,0],[94,4],[108,21],[106,28],[98,41],[102,55]], face: [[63.2,19.6],[83.8,19.6],[73,30]] }
  };
  var TOD = [
    { name: '아침', c: [255, 226, 150], from: 5, to: 11 }, { name: '낮', c: [255, 255, 255], from: 11, to: 17 },
    { name: '저녁', c: [255, 182, 212], from: 17, to: 20 }, { name: '밤', c: [172, 212, 255], from: 20, to: 29 }
  ];
  var MET_C = [255, 150, 200];   // 만난 날 별 — 분홍
  function todOf(h) { for (var i = 0; i < 3; i++) if (h >= TOD[i].from && h < TOD[i].to) return TOD[i]; return TOD[3]; }
  function starSize(min) { return Math.max(0, Math.min(1, (min - 10) / 50)); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { v = clamp01(v); return 1 - Math.pow(1 - v, 3); }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + clamp01(a).toFixed(3) + ')'; }
  function rng(seed) {
    var a = seed >>> 0;
    return function () { a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dateKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function ymOf(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1); }

  // ── 별 세기 ──
  function allWalks() { try { return (window.WalsonStore && WalsonStore.walks()) || []; } catch (e) { return []; } }
  function hourOf(w) {
    var t = w.startedAt || w.endedAt;
    if (t) { var d = new Date(t); if (!isNaN(d)) return d.getHours() + d.getMinutes() / 60; }
    return 18;   // 시간을 모르는 기록(예전 기록)은 저녁 별
  }
  // 별을 받나 — reward-rules.js WALK_REWARDS(산책 보상표)의 live.stars · after.stars(베타면 덮은 값)
  function rewardCfg() { try { var RR = window.RewardRules; return RR && RR.walkRewards ? RR.walkRewards() : null; } catch (e) { return null; } }
  function starsPerDay() { return PER_DAY; }   // 하루 1칸(예전 화면이 부르는 이름 그대로)
  function countable(w) { return w && typeof w.date === 'string' && (Number(w.durationMin) || 0) >= MIN; }
  function starWalk(w, cfg) {
    if (!countable(w)) return false;
    if (w.logged !== 'after') return !cfg || !!cfg.live.stars;
    if (!cfg || cfg.after.stars) return true;
    return w.date <= AFTER_KEEP;   // 다녀와서 적은 산책으로 이미 뜬 별(11/27까지)은 남긴다
  }
  function daysIn(ym) { return new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(); }
  // 그 달 별 — 걸은 날마다 하나, 날짜 순. 같은 날 여러 번이면 한 별에 걸은 분·거리·횟수를 모은다. ym 'YYYY-MM'
  //   → { stars(보름까지), over(별가루), days, dim(그 달 날 수), full(보름), milky(25일), allDays(하루도 안 빠짐), moon(0~1) }
  function month(walks, ym) {
    walks = walks || allWalks(); ym = ym || ymOf(new Date());
    var cfg = rewardCfg(), byDay = {}, keys = [];
    walks.forEach(function (w) {
      if (!w || typeof w.date !== 'string' || w.date.slice(0, 7) !== ym || !starWalk(w, cfg)) return;
      var d = byDay[w.date];
      if (!d) { d = byDay[w.date] = { date: w.date, min: 0, km: 0, n: 0, h: hourOf(w) }; keys.push(w.date); }
      d.min += Math.round(Number(w.durationMin) || 0); d.km += Number(w.distanceKm) || 0; d.n++;
    });
    keys.sort();
    var all = keys.map(function (k) { return byDay[k]; }), n = all.length, dim = daysIn(ym);
    return { ym: ym, stars: all.slice(0, GOAL), over: all.slice(GOAL), days: n, dim: dim,
      full: n >= GOAL, milky: n >= MILKY, allDays: n >= dim, moon: Math.min(1, n / dim), dayCapped: false };
  }
  // ── 1년 하늘 + 공유 링크 글자 ──
  var DOG_IDS = ['pom', 'poodle', 'maltese', 'chihuahua', 'dachs', 'jindo', 'shiba', 'knit', 'spitz', 'cocker', 'chihuahua_long', 'bichon', 'golden'];   // 링크에 번호로 실린다 — 순서 바꾸지 말 것(새 것은 뒤에)
  var SIZE_MIN = [10, 22, 37, 60], TOD_H = [8, 13, 18, 21];   // 크기 4단계·시간대 4가지 → 그리기용 분·시
  function sizeIdx(min) { return min < 15 ? 0 : min < 30 ? 1 : min < 45 ? 2 : 3; }
  function todIdx(h) { var t = todOf(h); return TOD.indexOf(t); }
  function ymBack(ym, back) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 - back; while (m < 0) { m += 12; y--; } return y + '-' + pad2(m + 1); }
  // 이 기기 1년 하늘 — 이번 달(별 0개여도)과 지난 11달 중 별이 있는 달
  function sky() {
    var walks = allWalks(), now = ymOf(new Date()), out = [];
    for (var b = 0; b < 12; b++) {
      var ym = ymBack(now, b), m = month(walks, ym);
      if (b && !m.stars.length) continue;
      out.push({ back: b, ym: ym, stars: m.stars.map(function (s) { return { min: s.min, h: s.h }; }), over: m.over.length });
    }
    return { dog: dogId(), name: dogName(), months: out, mine: true };
  }
  // 1.{강아지 번호}.{YYYYMM}.{이름}.{달들} — 달 = {몇 달 전 36진수 1자}{별마다 16진수 1자(크기×4 + 시간대)}[~별가루 36진수]
  function encode(s, o) {
    o = o || {};
    var nm = o.name && s.name ? encodeURIComponent(s.name).replace(/\./g, '%2E') : '';
    var segs = s.months.map(function (m) {
      var t = m.back.toString(36) + m.stars.slice(0, GOAL).map(function (x) { return (sizeIdx(x.min) * 4 + (o.color === false ? 1 : todIdx(x.h))).toString(16); }).join('');
      return t + (m.over ? '~' + Math.min(35, m.over).toString(36) : '');
    });
    return ['1', Math.max(0, DOG_IDS.indexOf(s.dog)), s.months.length ? s.months[0].ym.replace('-', '') : ymOf(new Date()).replace('-', ''), nm, segs.join('_')].join('.');
  }
  function decode(text) {
    var p = String(text || '').replace(/^#/, '').split('.');
    if (p.length !== 5 || p[0] !== '1' || !/^[0-7]$/.test(p[1]) || !/^\d{6}$/.test(p[2]) || p[4].length > 260) return null;
    var y = +p[2].slice(0, 4), mo = +p[2].slice(4, 6);
    if (y < 2025 || y > 2100 || mo < 1 || mo > 12) return null;
    var name = '';
    try { name = decodeURIComponent(p[3]).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 8); } catch (e) { name = ''; }
    var ym = y + '-' + pad2(mo), months = [], seen = {};
    var segs = p[4] ? p[4].split('_') : [];
    for (var i = 0; i < segs.length && i < 12; i++) {
      var m = /^([0-9b])([0-9a-f]{0,15})(?:~([0-9a-z]))?$/.exec(segs[i]);
      if (!m) return null;
      var back = parseInt(m[1], 36);
      if (seen[back]) continue; seen[back] = 1;
      months.push({ back: back, ym: ymBack(ym, back), over: m[3] ? parseInt(m[3], 36) : 0,
        stars: m[2].split('').filter(Boolean).map(function (c) { var v = parseInt(c, 16); return { min: SIZE_MIN[v >> 2], h: TOD_H[v & 3] }; }) });
    }
    months.sort(function (a, b) { return a.back - b.back; });
    return { dog: DOG_IDS[+p[1]], name: name, months: months, mine: false };
  }
  function shareUrl(code) { return appUrl() + '/sky.html?from=sky#' + code; }

  // 마지막 산책이 별이 됐나(산책 끝 화면) — 기록이 저장된 뒤 부른다
  //   → { got(새 별), index(그달 몇 번째 — 0부터), date, month, dust(16일째부터) } · got이 아니면 reason: 'brighter'(오늘 별이 더 밝아짐) · 'after'(다녀와서 적은 산책) · 'short'(5분 미만)
  function lastWalkStar(walks) {
    walks = walks || allWalks();
    var w = walks[walks.length - 1];
    if (!w) return { got: false, reason: 'none' };
    var ym = w.date ? w.date.slice(0, 7) : ymOf(new Date());
    var now = month(walks, ym), before = month(walks.slice(0, -1), ym);
    var all = now.stars.concat(now.over), idx = -1;
    for (var i = 0; i < all.length; i++) if (all[i].date === w.date) idx = i;
    if (now.days > before.days && idx >= 0) return { got: true, index: idx, date: w.date, month: now, dust: idx >= GOAL };
    if (idx >= 0 && starWalk(w, rewardCfg())) return { got: false, reason: 'brighter', index: idx, date: w.date, month: now };
    if (!countable(w)) return { got: false, reason: 'short', month: now };
    if (w.logged === 'after') return { got: false, reason: 'after', month: now };
    return { got: false, reason: 'none', month: now };
  }
  // 만난 날 — 이 기기의 첫 산책 날(기록이 없으면 처음 별자리를 본 날)
  function metDay() {
    var v = '';
    try { v = localStorage.getItem(MET_KEY) || ''; } catch (e) { v = ''; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      v = dateKey(new Date());   // 이미 산책 기록이 있던 사람은 첫 산책 날이 만난 날
      allWalks().forEach(function (w) { if (w && /^\d{4}-\d{2}-\d{2}$/.test(w.date) && w.date < v) v = w.date; });
      try { localStorage.setItem(MET_KEY, v); } catch (e) { /* 저장 안 되는 브라우저면 오늘로만 */ }
    }
    return v;
  }
  function dogId() {
    var id = 'pom';
    try { if (window.WalsonAzit) id = WalsonAzit.myDog(WalsonAzit.loadState()) || 'pom'; } catch (e) { id = 'pom'; }
    return DOGS[id] ? id : 'pom';
  }
  function dogName() {
    var p = {};
    try { p = (window.WalsonStore && WalsonStore.profile()) || {}; } catch (e) { p = {}; }
    return String(p.name || '').trim().slice(0, 8);
  }
  function starName() { var n = dogName(); return n ? n + '자리' : '우리 개 별자리'; }

  // ── 하늘 그리기 ──
  // 별 자리: 0~11 윤곽 · 12 코 · 13 왼눈 · 14 오른눈
  function shapePoints(id) {
    var d = DOGS[id] || DOGS.pom;
    return d.line.concat([d.face[2], d.face[0], d.face[1]]).map(function (p, i) { return { x: p[0], y: p[1], eye: i >= 13, outline: i < 12 }; });
  }
  function shapeEdges(id) {
    var d = DOGS[id] || DOGS.pom, e = [];
    for (var k = 1; k < d.line.length; k++) e.push([k - 1, k]);
    if (d.close) e.push([d.line.length - 1, 0]);
    return e;
  }
  // 바탕(밤하늘 + 은하수 + 작은 별 + 초승달) — 한 번 그려 두고 다시 씀
  // o = { milky: 25일 은하수, moon: 0(초승달)~1(보름달 — 한 달 하루도 안 빠짐) }
  function paintNight(g, w, h, u, seed, o) {
    o = o || {};
    var r = rng(seed), i;
    var grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, 'hsl(238, 62%, 7%)'); grd.addColorStop(0.6, 'hsl(246, 50%, 13%)'); grd.addColorStop(1, 'hsl(262, 46%, 22%)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (i = 0; i < 20; i++) {
      var t = r(), x = w * (-0.1 + 1.2 * t), y = h * (0.85 - 0.7 * t) + (r() - 0.5) * h * 0.1, rad = (0.07 + r() * 0.13) * Math.max(w, h);
      var hue = 235 + r() * 75, gg = g.createRadialGradient(x, y, 0, x, y, rad);
      gg.addColorStop(0, 'hsla(' + hue.toFixed(0) + ', 70%, 70%, ' + (0.03 + r() * 0.03).toFixed(3) + ')'); gg.addColorStop(1, 'hsla(' + hue.toFixed(0) + ', 70%, 60%, 0)');
      g.fillStyle = gg; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
    }
    g.restore();
    if (o.milky) {   // 25일 — 같은 대각선을 따라 은하수가 짙게(빛 덩이 + 촘촘한 잔별)
      var rm = rng(seed + 11);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (i = 0; i < 46; i++) {
        var tm = rm(), mx2 = w * (-0.1 + 1.2 * tm), my2 = h * (0.85 - 0.7 * tm) + (rm() - 0.5) * h * 0.08, rad2 = (0.05 + rm() * 0.1) * Math.max(w, h);
        var hue2 = 250 + rm() * 70, g2 = g.createRadialGradient(mx2, my2, 0, mx2, my2, rad2);
        g2.addColorStop(0, 'hsla(' + hue2.toFixed(0) + ', 80%, 82%, ' + (0.07 + rm() * 0.06).toFixed(3) + ')'); g2.addColorStop(1, 'hsla(' + hue2.toFixed(0) + ', 80%, 70%, 0)');
        g.fillStyle = g2; g.beginPath(); g.arc(mx2, my2, rad2, 0, 7); g.fill();
      }
      var nm = (w / u) * (h / u) / 260;
      for (i = 0; i < nm; i++) {
        var tq = rm(), qx = w * (-0.1 + 1.2 * tq) + (rm() - 0.5) * w * 0.08, qy = h * (0.85 - 0.7 * tq) + (rm() - 0.5) * h * 0.14;
        g.fillStyle = 'hsla(' + (215 + rm() * 80).toFixed(0) + ', 90%, 92%, ' + (0.25 + rm() * 0.5).toFixed(3) + ')';
        g.beginPath(); g.arc(qx, qy, (0.3 + rm() * 0.7) * u, 0, 7); g.fill();
      }
      g.restore();
    }
    var n = (w / u) * (h / u) / 900;
    for (i = 0; i < n; i++) {
      var sx = r() * w, sy = r() * h, s = Math.pow(r(), 3);
      g.fillStyle = 'hsla(' + (205 + r() * 70).toFixed(0) + ', 80%, ' + (86 + r() * 14).toFixed(0) + '%, ' + (0.2 + 0.6 * s).toFixed(3) + ')';
      g.beginPath(); g.arc(sx, sy, (0.35 + s * 1.05) * u, 0, 7); g.fill();
    }
    // 달 — 걸은 날만큼 차오른다(초승달 → 하루도 안 빠지면 보름달, 둘레 빛도 커짐)
    var ph = clamp01(o.moon || 0), mx = w * 0.87, my = h * 0.1, mr = Math.max(4, Math.min(w, h) * 0.035) * (1 + 0.2 * ph);
    var mg = g.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * (3.4 + 1.6 * ph));
    mg.addColorStop(0, 'hsla(48, 100%, 86%, ' + (0.22 + 0.2 * ph).toFixed(3) + ')'); mg.addColorStop(1, 'hsla(48, 100%, 86%, 0)');
    g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr * (3.4 + 1.6 * ph), 0, 7); g.fill();
    var mc = document.createElement('canvas'); mc.width = mc.height = Math.ceil(mr * 2 + 4);
    var m = mc.getContext('2d'), c0 = mc.width / 2;
    m.fillStyle = 'hsl(48, 100%, 90%)'; m.beginPath(); m.arc(c0, c0, mr, 0, 7); m.fill();
    if (ph < 1) { m.globalCompositeOperation = 'destination-out'; m.beginPath(); m.arc(c0 + mr * (0.45 + 1.8 * ph), c0 - mr * 0.25 * (1 - ph), mr * 0.88, 0, 7); m.fill(); }
    g.drawImage(mc, mx - c0, my - c0);
  }
  function drawStar(g, x, y, r, c, a, flare) {
    if (a <= 0.003 || r <= 0) return;
    var R4 = r * 4.4, gr = g.createRadialGradient(x, y, 0, x, y, R4);
    gr.addColorStop(0, rgba(c, 0.95 * a)); gr.addColorStop(0.22, rgba(c, 0.38 * a)); gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, R4, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,' + clamp01(a).toFixed(3) + ')'; g.beginPath(); g.arc(x, y, r * 0.62, 0, 7); g.fill();
    if (flare > 0.01) {
      var L = r * (3.2 + 5.5 * flare);
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineWidth = Math.max(0.6, r * 0.28);
      var lg = g.createLinearGradient(x - L, y, x + L, y);
      lg.addColorStop(0, rgba(c, 0)); lg.addColorStop(0.5, rgba(c, 0.75 * a * flare)); lg.addColorStop(1, rgba(c, 0));
      g.strokeStyle = lg; g.beginPath(); g.moveTo(x - L, y); g.lineTo(x + L, y); g.stroke();
      var vg = g.createLinearGradient(x, y - L, x, y + L);
      vg.addColorStop(0, rgba(c, 0)); vg.addColorStop(0.5, rgba(c, 0.75 * a * flare)); vg.addColorStop(1, rgba(c, 0));
      g.strokeStyle = vg; g.beginPath(); g.moveTo(x, y - L); g.lineTo(x, y + L); g.stroke();
      g.restore();
    }
  }

  // 하늘 하나(캔버스 픽셀 단위) — box 안에 별자리, 만난 날 별은 왼쪽 위.
  // st = { dog, stars, over, fresh(마지막 별 애니메이션 시작 ms) }
  function Sky(w, h, u, st, box) {
    var bg = document.createElement('canvas'); bg.width = w; bg.height = h;
    paintNight(bg.getContext('2d'), w, h, u, 7, { milky: st.milky, moon: st.moon });
    var pts = shapePoints(st.dog), x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(function (p) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); });
    var bx = box || { x: w * 0.16, y: h * 0.17, w: w * 0.68, h: h * 0.7 };   // 별자리 놓을 칸(공유 그림은 오른쪽에)
    var s = Math.min(bx.w / Math.max(1, x1 - x0), bx.h / Math.max(1, y1 - y0));
    var ox = bx.x + (bx.w - (x1 - x0) * s) / 2 - x0 * s, oy = bx.y + (bx.h - (y1 - y0) * s) / 2 - y0 * s;
    var P = pts.map(function (p) { return { x: ox + p.x * s, y: oy + p.y * s, eye: p.eye, outline: p.outline }; });
    var E = shapeEdges(st.dog);
    var met = { x: w * 0.1, y: h * 0.1 };
    // 별가루 자리 — 별자리 둘레
    var rr = rng(97), cx = bx.x + bx.w / 2, cy = bx.y + bx.h / 2, span = Math.max(bx.w, bx.h), dust = [];
    for (var k = 0; k < 40; k++) {
      var best = null;
      for (var tries = 0; tries < 14 && !best; tries++) {
        var a = rr() * Math.PI * 2, d = (0.5 + rr() * 0.3) * span, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.9;
        if (x < 12 * u || x > w - 12 * u || y < 12 * u || y > h - 12 * u) continue;
        if (P.some(function (p) { return Math.hypot(p.x - x, p.y - y) < 14 * u; })) continue;
        best = { x: x, y: y };
      }
      dust.push(best || { x: 12 * u + rr() * (w - 24 * u), y: 12 * u + rr() * h * 0.3 });
    }
    var tw = [], r2 = rng(31);
    for (var i = 0; i < 12; i++) tw.push({ x: r2() * w, y: r2() * h, r: (0.7 + r2() * 0.8) * u, sp: 0.6 + r2() * 1.2, ph: r2() * 7 });
    var SHOOT = 520, POP = 460;
    var unit = w / 360;   // 별 크기는 하늘 폭 기준(시안과 같은 느낌)

    function look(sx) { return { r: (1.5 + 2.4 * starSize(sx.min)) * unit, c: todOf(sx.h).c }; }
    function pos(i) { return i < GOAL ? P[i] : dust[(i - GOAL) % dust.length]; }

    this.met = met; this.P = P; this.pos = pos; this.w = w; this.h = h;
    this.draw = function (g, now) {
      var all = st.stars.concat(st.over), n = all.length, lit = Math.min(n, GOAL), full = n >= GOAL;
      var fi = st.fresh ? n - 1 : -1, at = st.fresh ? now - st.fresh : 1e9;
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(bg, 0, 0);
      tw.forEach(function (t) { drawStar(g, t.x, t.y, t.r, [220, 228, 255], 0.22 + 0.28 * (0.5 + 0.5 * Math.sin(now / 1000 * t.sp + t.ph)), 0); });
      // 만난 날 별(분홍, 은은히 반짝)
      drawStar(g, met.x, met.y, 2.6 * unit, MET_C, 0.95, 0.35 + 0.15 * Math.sin(now / 900));
      // 아직 안 뜬 윤곽(흐린 점) — 눈·코는 숨김
      for (i = lit; i < GOAL; i++) {
        if (!P[i].outline || i === fi) continue;
        g.fillStyle = 'hsla(235, 60%, 85%, 0.22)'; g.beginPath(); g.arc(P[i].x, P[i].y, 1.2 * unit, 0, 7); g.fill();
      }
      // 선 — 두 별이 다 뜨면, 새 별 쪽으로 자람
      g.save(); g.lineCap = 'round';
      E.forEach(function (e) {
        var last = Math.max(e[0], e[1]);
        if (last >= lit) return;
        var p0 = P[Math.min(e[0], e[1])], p1 = P[last], prog = 1;
        if (last === fi) prog = clamp01((at - SHOOT) / (POP + 120));
        if (prog <= 0) return;
        var xx = p0.x + (p1.x - p0.x) * prog, yy = p0.y + (p1.y - p0.y) * prog, al = full ? 0.7 : 0.5;
        g.strokeStyle = 'hsla(225, 100%, 88%, ' + (al * 0.22).toFixed(3) + ')'; g.lineWidth = 4 * unit;
        g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(xx, yy); g.stroke();
        g.strokeStyle = 'hsla(225, 100%, 90%, ' + al.toFixed(3) + ')'; g.lineWidth = 1.2 * unit;
        g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(xx, yy); g.stroke();
      });
      g.restore();
      // 별
      for (i = 0; i < n; i++) {
        var L = look(all[i]), sc = 1, flare = L.r > 3 * unit ? 0.25 : 0, p = pos(i);
        if (i === fi) {
          if (at < SHOOT) continue;
          var tp = (at - SHOOT) / POP;
          sc = tp < 1 ? (tp < 0.55 ? 1.7 * ease(tp / 0.55) : 1.7 - 0.7 * ease((tp - 0.55) / 0.45)) : 1;
          flare = Math.max(flare, 1 - clamp01(tp));
        }
        if (i < GOAL && P[i].eye) { L = { r: L.r * 1.15, c: [255, 214, 236] }; if (full) flare = Math.max(flare, 0.32 + 0.12 * Math.sin(now / 700 + i)); }
        if (i >= GOAL) flare = Math.max(flare, 0.4);
        var twk = 0.88 + 0.12 * Math.sin(now / 900 * (0.8 + (i % 5) * 0.23) + i * 1.7);
        drawStar(g, p.x, p.y, L.r * sc, L.c, twk, flare);
      }
      // 새 별 — 만난 날 별 쪽에서 별똥별이 날아와 자리 잡고 고리가 퍼짐
      if (fi >= 0 && at < SHOOT + POP + 500) {
        var tg = pos(fi), f = { x: w * 0.96, y: h * 0.02 };
        if (at < SHOOT) {
          var q = ease(at / SHOOT), hx = f.x + (tg.x - f.x) * q, hy = f.y + (tg.y - f.y) * q, q2 = ease(Math.max(0, at / SHOOT - 0.28));
          var tx = f.x + (tg.x - f.x) * q2, ty = f.y + (tg.y - f.y) * q2, sgd = g.createLinearGradient(tx, ty, hx, hy);
          sgd.addColorStop(0, 'hsla(220, 100%, 92%, 0)'); sgd.addColorStop(1, 'hsla(220, 100%, 96%, 0.95)');
          g.strokeStyle = sgd; g.lineWidth = 1.8 * unit; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke();
          drawStar(g, hx, hy, 1.8 * unit, [235, 240, 255], 1, 0.3);
        } else {
          var rq = clamp01((at - SHOOT) / (POP + 500));
          g.strokeStyle = 'hsla(330, 100%, 86%, ' + (0.7 * (1 - rq)).toFixed(3) + ')'; g.lineWidth = 1.5 * unit;
          g.beginPath(); g.arc(tg.x, tg.y, (3 + 24 * ease(rq)) * unit, 0, 7); g.stroke();
        }
      }
      return fi >= 0 && at < SHOOT + POP + 500;   // 아직 움직이는 중
    };
  }
  function stateNow(fresh) {
    var m = month();
    return { dog: dogId(), stars: m.stars, over: m.over, milky: m.milky, moon: m.moon, fresh: fresh && !REDUCE && (m.stars.length + m.over.length) ? performance.now() + 350 : 0, m: m };
  }
  function countText(m) {
    var n = m.stars.length, days = m.days != null ? m.days : n + m.over.length;
    return '별 ' + n + ' / ' + GOAL + (days > GOAL ? ' · ' + days + '일' : '');
  }
  function milestone(m) { return m.allDays ? '보름달이 떴어요' : m.milky ? '은하수가 흘러요' : m.full ? '눈을 떴어요' : ''; }
  function monthLabel(ym) { return Number(ym.slice(5, 7)) + '월'; }

  // ── 아지트 창가 작은 하늘 ──
  function thumb(cv) {
    if (!cv) return;
    var dpr = Math.min(3, window.devicePixelRatio || 1), cw = cv.clientWidth || 56, ch = cv.clientHeight || 56;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    metDay();
    var st = stateNow(false), sky = new Sky(cv.width, cv.height, dpr * 0.6, st);
    sky.draw(cv.getContext('2d'), 0);
  }

  // ── 큰 하늘 판 ──
  var CSS = '.wst-back{position:fixed;inset:0;z-index:1150;background:rgba(10,8,30,.55);display:flex;align-items:flex-end;justify-content:center}' +
    '.wst-sheet{width:100%;max-width:440px;max-height:96vh;overflow:auto;background:var(--panel,#fff);color:var(--ink,#222);border-radius:20px 20px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));box-sizing:border-box}' +
    '.wst-h{display:flex;align-items:baseline;gap:8px;margin:0 0 2px}.wst-h b{font-size:18px;font-weight:900}.wst-h span{margin-left:auto;font-size:13px;font-weight:800;color:var(--accent,#e0457b)}' +
    '.wst-sub{margin:0 0 10px;font-size:13px;color:var(--ink-soft,#666);line-height:1.45}' +
    '.wst-sky{position:relative;border-radius:14px;overflow:hidden;background:#0b0a24}.wst-sky canvas{display:block;width:100%}' +
    '.wst-tag{position:absolute;left:10px;bottom:8px;font-size:11px;font-weight:800;color:#ffd1e6;background:rgba(20,16,50,.55);padding:3px 7px;border-radius:999px;pointer-events:none}' +
    '.wst-pop{position:absolute;max-width:200px;font-size:12px;line-height:1.4;color:#fff;background:rgba(20,16,50,.86);border:1px solid rgba(255,255,255,.18);padding:6px 9px;border-radius:10px;pointer-events:none}' +
    '.wst-empty{margin:10px 0 0;font-size:13px;line-height:1.5;color:var(--ink,#222);background:var(--hl,#fff0f6);padding:10px 12px;border-radius:12px}' +
    '.wst-rule{margin:10px 0 0;font-size:12px;color:var(--ink-soft,#666);line-height:1.5}' +
    '.wst-3d{display:block;margin-top:12px;padding:12px 14px;border-radius:12px;background:#17123f;color:#ffd1e6;font-weight:900;font-size:15px;text-decoration:none;text-align:center}' +
    '.wst-btns{display:flex;gap:8px;margin-top:12px}.wst-btns button{flex:1;min-height:46px;border-radius:12px;border:1px solid var(--line,#ddd);background:var(--bg,#fafafa);color:var(--ink,#222);font:inherit;font-size:15px;font-weight:800}' +
    '.wst-btns button.main{background:var(--accent,#e0457b);border-color:var(--accent,#e0457b);color:#fff}';
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDay(k) { return Number(k.slice(5, 7)) + '월 ' + Number(k.slice(8, 10)) + '일'; }

  // 이번 달 어디까지 왔나 — 보름 → 25일 은하수 → 하루도 안 빠지면 보름달
  function goalText(m) {
    var who = dogName() || '우리 개';
    if (m.allDays) return '한 달 내내 함께 걸었어요. 하늘에 보름달이 떴어요.';
    if (m.milky) return m.days + '일 걸어 은하수가 흘러요. 하루도 안 빠지면 보름달이 떠요.';
    if (m.full) return '보름을 채워 ' + who + ' 별자리가 눈을 떴어요. 25일이면 은하수가 흘러요.';
    return '[산책 시작]을 누르고 걸은 날마다 별이 하나씩 떠서 보름이면 ' + who + ' 얼굴이 돼요. ' + (GOAL - m.days) + '일 남았어요.';
  }

  // ── 그날의 산책 별 카드(1번 — 11/27 가르시아가 보낸 "오늘의 산책 별" 그림 모양) — 1080×1350, 저장·공유도 이 그림 ──
  // 큰 별(색 = 시간대, 반짝이·둘레 빛 = 걸은 분) · 날짜 · 걸은 시간 · 거리(시간만 잰 날은 시간대) · 그날 산책 횟수 · 우리 개 한마디 · 홍보 두 줄
  var CARD_STAR = [   // 시간대(TOD 순서)별 별 색 — 밝은 곳 · 몸 · 가장자리 · 테두리
    ['#fff6c4', '#ffd24a', '#f2a93b', '#e0822f'], ['#ffffff', '#ffe58a', '#f5c64a', '#e2a13a'],
    ['#ffe6f1', '#ff9cc6', '#f06ea6', '#d24a85'], ['#eef6ff', '#a7cdff', '#6aa6f0', '#477fd2']
  ];
  var THANKS = ['오늘도 함께 걸어 줘서 고마워.', '같이 걸어서 좋았어. 내일도 가자!', '오늘 냄새 최고였어. 킁킁.', '너랑 걷는 시간이 제일 좋아.', '발바닥이 신났어. 또 나가자!'];
  function dayStar(date) {
    var m = month(null, date.slice(0, 7)), all = m.stars.concat(m.over);
    for (var i = 0; i < all.length; i++) if (all[i].date === date) return { s: all[i], index: i, m: m };
    return null;
  }
  function starPath(g, cx, cy, R, r, rot) {
    g.beginPath();
    for (var i = 0; i < 10; i++) { var a = rot + i * Math.PI / 5, rr = i % 2 ? r : R; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    g.closePath();
  }
  function sparkle(g, x, y, R, col) {   // 네 갈래 반짝이
    g.fillStyle = col; g.beginPath();
    g.moveTo(x, y - R); g.quadraticCurveTo(x + R * 0.16, y - R * 0.16, x + R, y); g.quadraticCurveTo(x + R * 0.16, y + R * 0.16, x, y + R);
    g.quadraticCurveTo(x - R * 0.16, y + R * 0.16, x - R, y); g.quadraticCurveTo(x - R * 0.16, y - R * 0.16, x, y - R); g.fill();
  }
  function rrect(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
  function dayCard(date) {
    var hit = dayStar(date); if (!hit) return null;
    var st = hit.s, W = 1080, H = 1350, b = brand(), today = dateKey(new Date());
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'), font = 'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    var tod = todOf(st.h), col = CARD_STAR[TOD.indexOf(tod)] || CARD_STAR[0], tier = sizeIdx(st.min), r = rng(parseInt(date.replace(/-/g, ''), 10) || 7);
    g.fillStyle = '#111a33'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillStyle = '#ffd38a'; g.font = '900 52px ' + font;
    g.fillText(date === today ? '오늘의 산책 별' : fmtDay(date) + '의 산책 별', W / 2, 100);
    // 하늘 칸 — 가운데 보랏빛 + 빛살 + 잔별
    var sx = 48, sy = 140, sw = W - 96, sh = 700, cx = W / 2, cy = sy + sh / 2;
    g.save(); rrect(g, sx, sy, sw, sh, 40); g.clip();
    var bgd = g.createLinearGradient(0, sy, 0, sy + sh); bgd.addColorStop(0, '#0a0b26'); bgd.addColorStop(1, '#151240'); g.fillStyle = bgd; g.fillRect(sx, sy, sw, sh);
    var glow = g.createRadialGradient(cx, cy, 0, cx, cy, sh * 0.62); glow.addColorStop(0, 'rgba(98, 84, 200, ' + (0.55 + 0.1 * tier) + ')'); glow.addColorStop(1, 'rgba(60, 50, 150, 0)');
    g.fillStyle = glow; g.fillRect(sx, sy, sw, sh);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (var k = 0; k < 18; k++) {   // 빛살
      var a0 = k * Math.PI / 9 + 0.1, a1 = a0 + Math.PI / 30 + r() * 0.04, L = sh * 0.95;
      g.fillStyle = 'rgba(140, 125, 255, ' + (0.05 + 0.02 * tier).toFixed(3) + ')';
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * L, cy + Math.sin(a0) * L); g.lineTo(cx + Math.cos(a1) * L, cy + Math.sin(a1) * L); g.closePath(); g.fill();
    }
    g.restore();
    for (k = 0; k < 170; k++) {   // 잔별
      var px = sx + r() * sw, py = sy + r() * sh, ps = Math.pow(r(), 3);
      if (Math.hypot(px - cx, py - cy) < 240) continue;
      g.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.6 * ps).toFixed(3) + ')'; g.beginPath(); g.arc(px, py, 1.4 + ps * 3.2, 0, 7); g.fill();
    }
    // 큰 별 — 둘레 빛 → 테두리 → 몸(둥근 끝) → 윗면 빛
    var R = 168 + tier * 12, ri = R * 0.5, rot = -Math.PI / 2;
    var halo = g.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * (1.9 + 0.2 * tier)); halo.addColorStop(0, col[1] + 'aa'); halo.addColorStop(1, col[1] + '00');
    g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, R * (1.9 + 0.2 * tier), 0, 7); g.fill();
    g.lineJoin = 'round';
    starPath(g, cx, cy + 6, R, ri, rot); g.strokeStyle = col[3]; g.lineWidth = 34; g.stroke();
    var body = g.createRadialGradient(cx - R * 0.25, cy - R * 0.35, R * 0.05, cx, cy, R * 1.05);
    body.addColorStop(0, col[0]); body.addColorStop(0.45, col[1]); body.addColorStop(1, col[2]);
    starPath(g, cx, cy, R, ri, rot); g.strokeStyle = col[1]; g.lineWidth = 22; g.stroke(); g.fillStyle = body; g.fill();
    g.save(); starPath(g, cx, cy, R * 0.62, ri * 0.62, rot); g.clip();
    var shine = g.createLinearGradient(cx, cy - R * 0.7, cx, cy + R * 0.2); shine.addColorStop(0, 'rgba(255,255,255,0.55)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = shine; g.fillRect(cx - R, cy - R, R * 2, R * 1.2); g.restore();
    // 반짝이 — 오래 걸을수록 많이
    var spots = [[-1.25, -0.85, 0.42], [1.05, -0.95, 0.28], [1.42, 0.35, 0.36], [-1.4, 0.45, 0.24], [-0.2, 1.3, 0.24], [0.55, 1.25, 0.18]];
    for (k = 0; k < 2 + tier && k < spots.length; k++) sparkle(g, cx + spots[k][0] * R, cy + spots[k][1] * R, spots[k][2] * R, 'rgba(255, 246, 214, 0.95)');
    g.restore();
    // 하늘 칸 왼쪽 위 — 이달 몇 번째 별
    var mm = hit.m, nth = hit.index + 1;
    var tag = monthLabel(date.slice(0, 7)) + ' · ' + nth + '일째 별' + (mm.allDays && nth === mm.dim ? ' · 보름달' : nth === MILKY ? ' · 은하수' : nth === GOAL ? ' · 눈 뜬 별' : '');
    g.font = '800 30px ' + font; var tw = g.measureText(tag).width + 40;
    g.fillStyle = 'rgba(255,255,255,0.14)'; rrect(g, sx + 26, sy + 24, tw, 52, 26); g.fill();
    g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.fillText(tag, sx + 46, sy + 61); g.textAlign = 'center';
    // 날짜 · 숫자 셋 · 한마디
    var d = date.split('-');
    g.fillStyle = '#ffd38a'; g.font = '900 64px ' + font; g.fillText(d[0] + '년 ' + Number(d[1]) + '월 ' + Number(d[2]) + '일', W / 2, 940);
    var hm = st.min >= 60 ? Math.floor(st.min / 60) + '시간' + (st.min % 60 ? ' ' + st.min % 60 + '분' : '') : st.min + '분';
    var cols = [[hm, '산책 시간'], st.km >= 0.05 ? [(Math.round(st.km * 10) / 10) + 'km', '산책 거리'] : [tod.name, '산책 시간대'], [st.n + '회', '산책 횟수']];
    cols.forEach(function (cc, i) {
      var x = W / 2 + (i - 1) * 330;
      g.fillStyle = '#ffd38a'; g.font = '900 52px ' + font; g.fillText(cc[0], x, 1040);
      g.fillStyle = '#c3cbe2'; g.font = '700 32px ' + font; g.fillText(cc[1], x, 1092);
    });
    var who = dogName(), line = THANKS[Math.floor(r() * THANKS.length)];
    g.fillStyle = '#eef1fb'; g.font = '700 38px ' + font; g.fillText((who ? who + ': ' : '') + line, W / 2, 1176);
    // 홍보 두 줄(밖에 나가는 그림 — site-config.js brand)
    g.fillStyle = '#ff8fbf'; g.font = '900 40px ' + font; g.fillText(b.name, W / 2, 1262);
    g.fillStyle = '#9aa6c4'; g.font = '700 28px ' + font; g.fillText(b.tagline, W / 2, 1306);
    g.textAlign = 'left';
    return c;
  }
  // 큰 그림을 화면 크기로 곱게(반씩 줄여 — canvas-view.js와 같은 셈, 이 파일만 읽는 화면에서도)
  function fitTo(big, w, h) {
    var cur = big;
    while (cur.width / 2 >= w && cur.height / 2 >= h) {
      var t = document.createElement('canvas'); t.width = Math.round(cur.width / 2); t.height = Math.round(cur.height / 2);
      var tg = t.getContext('2d'); tg.imageSmoothingQuality = 'high'; tg.drawImage(cur, 0, 0, t.width, t.height); cur = t;
    }
    var v = document.createElement('canvas'); v.width = w; v.height = h;
    var vg = v.getContext('2d'); vg.imageSmoothingQuality = 'high'; vg.drawImage(cur, 0, 0, w, h);
    return v;
  }
  var CARD_CSS = '.wsc-back{position:fixed;inset:0;z-index:1160;background:rgba(6,6,22,.92);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}' +
    '.wsc-box{position:relative;width:100%;max-width:400px}.wsc-view{border-radius:18px;overflow:hidden;line-height:0;background:#111a33}.wsc-view canvas{display:block;width:100%;height:auto}' +
    '.wsc-x{position:absolute;right:8px;top:8px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;font:inherit;font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
    '.wsc-btns{display:flex;gap:8px;margin-top:10px}.wsc-btns button,.wsc-btns a{flex:1;min-height:46px;display:flex;align-items:center;justify-content:center;border-radius:12px;border:0;background:#2b3358;color:#fff;font:inherit;font-size:15px;font-weight:800;text-decoration:none;white-space:nowrap;cursor:pointer}' +
    '.wsc-btns .main{background:#ff5c9d}';
  // openDay('YYYY-MM-DD', { skyLink: 아지트 창가로 가는 주소 }) — 그날 별이 없으면 null
  function openDay(date, opts) {
    opts = opts || {};
    if (!dayStar(date)) return null;
    if (!document.getElementById('wsc-css')) { var stl = document.createElement('style'); stl.id = 'wsc-css'; stl.textContent = CARD_CSS; document.head.appendChild(stl); }
    var back = document.createElement('div'); back.className = 'wsc-back';
    back.innerHTML = '<div class="wsc-box" role="dialog" aria-modal="true" aria-label="' + esc(fmtDay(date)) + '의 산책 별"><div class="wsc-view"></div>' +
      '<button type="button" class="wsc-x" data-a="close" aria-label="닫기">✕</button>' +
      '<div class="wsc-btns"><button type="button" data-a="save">저장</button><button type="button" data-a="share" class="main">공유</button>' +
      (opts.skyLink ? '<a href="' + esc(opts.skyLink) + '">하늘에서 보기</a>' : '') + '</div></div>';
    document.body.appendChild(back);
    var view = back.querySelector('.wsc-view'), big = null;
    function paint() {
      big = dayCard(date); if (!big) return;
      var cw = view.clientWidth || 360, dpr = Math.min(3, window.devicePixelRatio || 1), vw = Math.round(cw * dpr), vh = Math.round(vw * big.height / big.width);
      var v = fitTo(big, vw, vh); v.setAttribute('role', 'img'); v.setAttribute('aria-label', fmtDay(date) + ' 산책 별 — ' + dayStar(date).s.min + '분');
      view.textContent = ''; view.appendChild(v);
    }
    paint();
    if (document.fonts && document.fonts.load) document.fonts.load('900 52px Pretendard').then(function () { if (back.parentNode) paint(); }, function () {});
    function close() { back.remove(); document.removeEventListener('keydown', onKey, true); }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    document.addEventListener('keydown', onKey, true);
    back.addEventListener('click', function (e) {
      if (e.target === back) { close(); return; }
      var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'close') close();
      else if ((a === 'save' || a === 'share') && big && window.WalsonSave) {
        var file = 'walson-star-' + date + '.png';
        if (a === 'save') WalsonSave.save(big, file);
        else WalsonSave.share(big, file, (dogName() || '우리 개') + '와 ' + fmtDay(date) + ' 산책 별 ✦\n' + brand().name + ' — ' + brand().tagline + '\n' + appUrl());
      }
    });
    return { close: close };
  }

  function open(opts) {
    opts = opts || {};
    if (!document.getElementById('wst-css')) { var stl = document.createElement('style'); stl.id = 'wst-css'; stl.textContent = CSS; document.head.appendChild(stl); }
    var met = metDay(), st = stateNow(!!opts.fresh), m = st.m, nm = starName(), n = m.stars.length + m.over.length;
    var back = document.createElement('div'); back.className = 'wst-back';
    back.innerHTML = '<div class="wst-sheet" role="dialog" aria-modal="true" aria-label="창가 별자리">' +
      '<p class="wst-h"><b>' + esc(monthLabel(m.ym)) + ' 하늘 · ' + esc(nm) + '</b><span>' + esc(countText(m)) + '</span></p>' +
      '<p class="wst-sub">' + esc(goalText(m)) + '</p>' +
      '<div class="wst-sky"><canvas aria-label="이번 달 별자리 하늘"></canvas><span class="wst-tag">분홍 별 · 우리가 만난 날 ' + esc(fmtDay(met)) + '</span></div>' +
      (n ? '' : '<p class="wst-empty">분홍 별은 우리가 만난 날 별이에요. 5분 넘게 산책하고 오면 창밖에 첫 별이 떠요.</p>') +
      '<p class="wst-rule">[산책 시작]을 누르고 5분 넘게 걸은 날 = 별 1개(같은 날 또 걸으면 그 별이 밝아져요) · 보름(15일)이면 별자리 완성 · 25일이면 은하수 · 하루도 안 빠지면 보름달 · 별을 누르면 그날의 산책 별</p>' +
      // 별이 아직 없으면 공유는 숨긴다 — 처음 온 사람에게 "보내기"부터 보이지 않게(11/27). 3D는 앞으로 생길 얼굴 윤곽이 보여서 둔다
      '<a class="wst-3d" href="sky.html">✦ 하늘을 3D로 둘러보기 ›</a>' +
      '<div class="wst-btns">' + (n ? '<button type="button" data-a="save">저장</button><button type="button" data-a="share" class="main">공유</button>' : '') +
      '<button type="button" data-a="close">닫기</button></div></div>';
    document.body.appendChild(back);
    var box = back.querySelector('.wst-sky'), cv = box.querySelector('canvas');
    var dpr = Math.min(3, window.devicePixelRatio || 1), cw = box.clientWidth || 340, chh = Math.round(cw * 0.95);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(chh * dpr); cv.style.height = chh + 'px';
    var sky = new Sky(cv.width, cv.height, dpr, st), g = cv.getContext('2d'), raf = 0, alive = true, popEl = null;
    function frame(now) { raf = 0; if (!alive) return; sky.draw(g, now); if (!REDUCE) raf = requestAnimationFrame(frame); }
    if (REDUCE) sky.draw(g, 0); else raf = requestAnimationFrame(frame);
    function close() { alive = false; if (raf) cancelAnimationFrame(raf); back.remove(); document.removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    // 별 누르기 → 그날 산책
    cv.addEventListener('click', function (e) {
      var rc = cv.getBoundingClientRect(), x = (e.clientX - rc.left) * cv.width / rc.width, y = (e.clientY - rc.top) * cv.height / rc.height;
      var all = st.stars.concat(st.over), best = -2, bd = 26 * dpr;
      if (Math.hypot(sky.met.x - x, sky.met.y - y) < bd) { best = -1; bd = Math.hypot(sky.met.x - x, sky.met.y - y); }
      for (var i = 0; i < all.length; i++) { var p = sky.pos(i), d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = i; } }
      if (popEl) { popEl.remove(); popEl = null; }
      if (best < -1) return;
      if (best >= 0) { openDay(all[best].date); return; }   // 11/27 별을 누르면 그날의 산책 별 카드
      var html = '<b>우리가 만난 날 별</b><br>' + fmtDay(met) + ' — 왈슨에서 처음 만난 날', at = sky.met;
      popEl = document.createElement('div'); popEl.className = 'wst-pop'; popEl.innerHTML = html; box.appendChild(popEl);
      var left = at.x / dpr - 90, top = at.y / dpr + 14;
      popEl.style.left = Math.max(6, Math.min(cw - 206, left)) + 'px';
      popEl.style.top = (top + 60 > chh ? Math.max(6, at.y / dpr - 64) : top) + 'px';
    });
    back.addEventListener('click', function (e) {
      if (e.target === back) { close(); return; }
      var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'close') close();
      else if (a === 'save' || a === 'share') {
        var c = card({ room: opts.room, st: st });
        var file = 'walson-sky-' + m.ym + '.png';
        if (a === 'save') { if (window.WalsonSave) WalsonSave.save(c, file); }
        else if (window.WalsonSave) WalsonSave.share(c, file, shareText(m));
      }
    });
    return { close: close };
  }
  function shareText(m) {
    var b = brand();
    return (dogName() || '우리 개') + '와 ' + monthLabel(m.ym) + ' 산책 별자리 ' + m.stars.length + '/' + GOAL + ' ✦\n' + b.name + ' — ' + b.tagline + '\n' + appUrl();
  }

  // ── 한 장 그림(⑤) — 1080×1350: 하늘 + (있으면) 아지트 방 + 제목 + 홍보 두 줄 + 앱 주소(글자, QR 아님) ──
  function card(o) {
    o = o || {};
    var st = o.st || stateNow(false), m = st.m || month(), W = 1080, H = 1350, b = brand();
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d');
    var room = o.room && o.room.width ? o.room : null;
    // 방이 있으면: 하늘(위 590) → 방(가로 꽉) → 홍보 두 줄·주소. 없으면 하늘을 크게. 별자리는 오른쪽, 제목은 왼쪽 아래(겹치지 않게)
    var skyH = room ? 590 : 1010;
    var box = room ? { x: W * 0.42, y: skyH * 0.2, w: W * 0.46, h: skyH * 0.72 } : null;
    var sky = new Sky(W, skyH, 2.6, { dog: st.dog, stars: st.stars, over: st.over, milky: st.milky, moon: st.moon, fresh: 0 }, box);
    sky.draw(g, 1200);
    g.setTransform(1, 0, 0, 1, 0, 0);
    var font = 'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    // 하늘 위 글자
    g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(255,255,255,.96)'; g.font = '900 64px ' + font;
    g.fillText(monthLabel(m.ym) + ' 하늘', 56, skyH - 150);
    g.font = '900 48px ' + font; g.fillText(starName(), 56, skyH - 88);
    g.fillStyle = 'rgba(255,209,230,.95)'; g.font = '800 32px ' + font;
    g.fillText(countText(m) + (milestone(m) ? ' · ' + milestone(m) : ''), 56, skyH - 38);
    // 아래 판
    g.fillStyle = '#fff6fa'; g.fillRect(0, skyH, W, H - skyH);
    if (room) {
      var rw = W - 64, rh = Math.round(rw * room.height / room.width), maxH = H - skyH - 200;
      if (rh > maxH) { rh = maxH; rw = Math.round(rh * room.width / room.height); }
      var rx = (W - rw) / 2, ry = skyH + 28;
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.save(); g.beginPath(); if (g.roundRect) g.roundRect(rx, ry, rw, rh, 24); else g.rect(rx, ry, rw, rh); g.clip();
      g.drawImage(room, rx, ry, rw, rh); g.restore();
    }
    // 홍보 두 줄 + 주소(글자)
    g.textAlign = 'center';
    g.fillStyle = '#e0457b'; g.font = '900 60px ' + font; g.fillText(b.name, W / 2, H - 112);
    g.fillStyle = '#3a2a33'; g.font = '800 34px ' + font; g.fillText(b.tagline, W / 2, H - 64);
    g.fillStyle = '#8a7480'; g.font = '700 26px ' + font; g.fillText(appUrl().replace(/^https?:\/\//, ''), W / 2, H - 26);
    g.textAlign = 'left';
    return c;
  }

  window.WalsonStars = { GOAL: GOAL, PER_DAY: PER_DAY, perDay: starsPerDay, MIN: MIN, MILKY: MILKY, month: month, lastWalkStar: lastWalkStar, metDay: metDay,
    starName: starName, countText: countText, goalText: goalText, thumb: thumb, open: open, card: card, todOf: todOf,
    dayCard: dayCard, openDay: openDay, dogId: dogId, dogName: dogName, fmtDay: fmtDay, milestone: milestone,
    // 3D 하늘(sky.html)이 같이 쓰는 것
    sky: sky, encode: encode, decode: decode, shareUrl: shareUrl, shapePoints: shapePoints, shapeEdges: shapeEdges, starSize: starSize,
    rng: rng, SkyCanvas: Sky, MET_C: MET_C, brand: brand, appUrl: appUrl };
})();
