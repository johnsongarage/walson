// 월간 리포트 한 장(2026-11-15, hq 개발 후보 2번 — 댕댕캐치 "월간 발자국" 참고). 전역 window.MonthReport.
// [기록]에서 한 달의 산책을 한 장 이미지로: 산책 횟수·시간·산책한 날·거리, 달력(산책한 날·응가), 가장 긴 산책,
// 가장 긴 연속, 새로 모은 발도장 "개수", 그 달의 대표 사진(가장 최근 "오늘의 한 장").
// 위치·산책 길·발도장 장소 이름은 넣지 않는다. 그리기는 이 휴대폰 안에서만.
//   MonthReport.open({ walks, profile })  — 기본은 이번 달. 2026-11-16부터 한 화면 편집기(image-editor.js)에서 연다:
//   [모양] 피드·스토리 · [달] 지난달로 넘기기 · [사진] 대표 사진 끌기·두 손가락 확대 · [글자 붙이기]
(function () {
  var FORMATS = { feed: { w: 1080, h: 1350 }, story: { w: 1080, h: 1920 } };
  var SIGNAL = { green: '#3f9b5b', yellow: '#dfa21f', red: '#d2493f' };
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];

  function font(w, s) { return w + ' ' + s + 'px Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'; }
  function bigFont(s) { return s + 'px "Black Han Sans", Pretendard, sans-serif'; }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function josaUi(name) {   // 초코의 / 봄이의 — "의"는 받침과 무관
    return name ? name + '의 ' : '';
  }
  function loadImg(src) {
    return new Promise(function (res) { if (!src) return res(null); var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; });
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ── 한 달 집계 ──
  function summarize(walks, y, m) {
    var prefix = y + '-' + pad2(m + 1);
    var list = (walks || []).filter(function (w) { return w && w.date && w.date.slice(0, 7) === prefix; });
    var days = {}, poop = {}, totalMin = 0, km = 0, longest = 0, lastPhoto = null, lastPhotoDate = '';
    list.forEach(function (w) {
      days[w.date] = (days[w.date] || 0) + 1;
      if (typeof w.poop === 'number') poop[w.date] = Math.max(poop[w.date] || 0, w.poop);
      totalMin += w.durationMin || 0;
      km += w.distanceKm || 0;
      longest = Math.max(longest, w.durationMin || 0);
      if (w.photoKey && w.date >= lastPhotoDate) { lastPhoto = w.photoKey; lastPhotoDate = w.date; }
    });
    // 가장 긴 연속(이 달 안에서)
    var dim = new Date(y, m + 1, 0).getDate(), run = 0, best = 0;
    for (var d = 1; d <= dim; d++) { if (days[prefix + '-' + pad2(d)]) { run++; best = Math.max(best, run); } else run = 0; }
    // 이 달에 새로 찍힌 발도장 개수 — 이 달 첫날까지의 기록과 이 달 끝까지의 기록을 비교(장소 이름은 쓰지 않는다)
    var stamps = 0;
    if (window.RewardRules) {
      var before = RewardRules.computeProgress((walks || []).filter(function (w) { return w && w.date && w.date < prefix + '-01'; }));
      var after = RewardRules.computeProgress((walks || []).filter(function (w) { return w && w.date && w.date <= prefix + '-31'; }));
      stamps = Object.keys(after.visited).filter(function (k) { return !before.visited[k]; }).length;
    }
    return { y: y, m: m, count: list.length, days: days, dayCount: Object.keys(days).length, poop: poop,
      totalMin: totalMin, km: km, longest: longest, streak: best, stamps: stamps, photoKey: lastPhoto };
  }
  function minText(min) { return min >= 60 ? Math.floor(min / 60) + '시간 ' + (min % 60 ? (min % 60) + '분' : '') : min + '분'; }

  // po(2026-11-16 편집기): { zoom, x, y, layout } — 대표 사진을 동그라미 안에서 키우고 옮긴다. layout을 넘기면 사진 칸 { x, y, w, h }를 채운다
  function draw(r, photo, logo, profile, fmt, target, po) {
    po = po || {};
    var F = FORMATS[fmt] || FORMATS.feed, W = F.w, H = F.h;
    var c = target || document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    var ink = '#3a2e24', soft = '#6b5d4e', accent = '#b8563a', paper = '#f7ede2', card = '#fffaf3';
    ctx.fillStyle = paper; ctx.fillRect(0, 0, W, H);
    // 스토리(9:16)는 내용 묶음을 세로 가운데로(머리 240 + 숫자 408 + 달력 640+54 + 요약 40 ≈ 1382)
    var pad = 64, y = fmt === 'story' ? Math.round((H - 1382) / 2) - 20 : 70;
    var name = (profile && profile.name) || '';

    // 머리: 대표 사진(동그라미/네모) + 제목
    var ph = 190, px = pad, py = y;
    ctx.save();
    ctx.beginPath(); ctx.arc(px + ph / 2, py + ph / 2, ph / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#F2B833'; ctx.fillRect(px, py, ph, ph);
    var img = photo || logo;
    if (img) {
      var s = Math.max(ph / img.width, ph / img.height) * (photo ? Math.max(1, po.zoom || 1) : 1), iw = img.width * s, ih = img.height * s;
      var qx = photo && po.x != null ? po.x : 0.5, qy = photo && po.y != null ? po.y : 0.5;
      ctx.drawImage(img, px - (iw - ph) * qx, py - (ih - ph) * qy, iw, ih);
    }
    ctx.restore();
    if (po.layout) { po.layout.x = px; po.layout.y = py; po.layout.w = ph; po.layout.h = ph; }
    ctx.lineWidth = 8; ctx.strokeStyle = (SIGNAL[profile && profile.signal] || accent);
    ctx.beginPath(); ctx.arc(px + ph / 2, py + ph / 2, ph / 2, 0, Math.PI * 2); ctx.stroke();
    var tx = px + ph + 40;
    ctx.fillStyle = soft; ctx.font = font(800, 38); ctx.textBaseline = 'alphabetic';
    ctx.fillText(r.y + '년 ' + (r.m + 1) + '월', tx, py + 62);
    ctx.fillStyle = ink; ctx.font = bigFont(78);
    ctx.fillText((name ? josaUi(name) : '우리 ') + '산책', tx, py + 140);
    ctx.font = font(800, 34); ctx.fillStyle = accent;
    ctx.fillText('월간 리포트', tx, py + 188);
    y = py + ph + 50;

    // 숫자 4칸
    var stats = [
      [String(r.count), '번 산책'],
      [minText(r.totalMin), '함께 걸은 시간'],
      [String(r.dayCount), '일 나갔어요'],
      [r.km ? r.km.toFixed(1) : String(r.longest), r.km ? 'km 걸었어요' : '분 가장 긴 산책']
    ];
    var gw = (W - pad * 2 - 24) / 2, gh = 170;
    stats.forEach(function (st, i) {
      var gx = pad + (i % 2) * (gw + 24), gy = y + Math.floor(i / 2) * (gh + 24);
      ctx.fillStyle = card; roundRect(ctx, gx, gy, gw, gh, 28); ctx.fill();
      ctx.fillStyle = accent; ctx.font = bigFont(st[0].length > 6 ? 62 : 84);
      ctx.fillText(st[0], gx + 34, gy + 104);
      ctx.fillStyle = soft; ctx.font = font(800, 32);
      ctx.fillText(st[1], gx + 34, gy + 148);
    });
    y += gh * 2 + 24 + 44;

    // 달력
    var calH = fmt === 'story' ? 640 : 470;
    var cw = W - pad * 2;
    ctx.fillStyle = card; roundRect(ctx, pad, y, cw, calH, 28); ctx.fill();
    var cellW = (cw - 40) / 7, top = y + 64;
    ctx.textAlign = 'center';
    ctx.font = font(800, 26); ctx.fillStyle = soft;
    DOW.forEach(function (d, i) { ctx.fillText(d, pad + 20 + cellW * i + cellW / 2, top); });
    var first = new Date(r.y, r.m, 1).getDay(), dim = new Date(r.y, r.m + 1, 0).getDate();
    var rows = Math.ceil((first + dim) / 7), cellH = (calH - 100) / rows;
    for (var d = 1; d <= dim; d++) {
      var idx = first + d - 1, col = idx % 7, row = Math.floor(idx / 7);
      var cx = pad + 20 + cellW * col + cellW / 2, cy = top + 30 + cellH * row + cellH / 2;
      var key = r.y + '-' + pad2(r.m + 1) + '-' + pad2(d), walked = !!r.days[key];
      if (walked) {
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(cx, cy, Math.min(cellW, cellH) * 0.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = walked ? '#fff' : '#b9a998';
      ctx.font = font(walked ? 900 : 600, 30); ctx.textBaseline = 'middle';
      ctx.fillText(String(d), cx, cy - (r.poop[key] ? 8 : 0));
      if (r.poop[key]) {   // 응가 점(1번 · 2번 이상)
        ctx.fillStyle = walked ? '#fff' : '#8a5a2b';
        var n = Math.min(2, r.poop[key]);
        for (var k = 0; k < n; k++) { ctx.beginPath(); ctx.arc(cx + (n === 2 ? (k ? 8 : -8) : 0), cy + 22, 5, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.textBaseline = 'alphabetic';
    }
    ctx.textAlign = 'left';
    y += calH + 54;

    // 한 줄 요약 + 주소
    var bits = [];
    if (r.longest) bits.push('가장 긴 산책 ' + r.longest + '분');
    if (r.streak > 1) bits.push('최장 연속 ' + r.streak + '일');
    if (r.stamps) bits.push('새 발도장 ' + r.stamps + '곳');
    var poopDays = Object.keys(r.poop).filter(function (k) { return r.poop[k] > 0; }).length;
    if (poopDays) bits.push('응가한 날 ' + poopDays + '일');
    ctx.fillStyle = ink; ctx.font = font(800, 34);
    ctx.fillText(bits.join(' · ') || '다음 달엔 더 많이 걸어요!', pad, y);
    ctx.fillStyle = soft; ctx.font = font(700, 28);
    ctx.fillText('왈슨 · 다산동 강아지 산책 앱 · johnsongarage.co.kr/walson', pad, H - (fmt === 'story' ? 110 : 60));
    return c;
  }

  // ── 열기: 한 화면 편집기(image-editor.js) ──
  function loadPhoto(key) {
    if (!key || !window.WalkPhotos) return Promise.resolve(null);
    return WalkPhotos.get(key).then(function (blob) {
      if (!blob) return null;
      var u = URL.createObjectURL(blob);
      return loadImg(u).then(function (im) { setTimeout(function () { URL.revokeObjectURL(u); }, 1000); return im; });
    }).catch(function () { return null; });
  }
  function open(opts) {
    if (!window.WalsonEditor) return;
    var walks = opts.walks || [], profile = opts.profile || {};
    var now = new Date();
    var firstDate = walks.reduce(function (a, w) { return w && w.date && w.date < a ? w.date : a; }, now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-01');
    var minY = Number(firstDate.slice(0, 4)), minM = Number(firstDate.slice(5, 7)) - 1;
    var fontsReady = (document.fonts && document.fonts.load)
      ? Promise.all([document.fonts.load('84px "Black Han Sans"'), document.fonts.load('800 34px Pretendard')]).catch(function () {}) : Promise.resolve();
    var photos = {};   // 사진 열쇠 → 그림(불러오는 동안은 없음 — 앱 그림으로 그렸다가 오면 다시 그린다)
    var ed = null;
    function ensurePhoto(key) {
      if (!key || key in photos) return;
      photos[key] = null;
      loadPhoto(key).then(function (im) { photos[key] = im; if (ed) { ed.redraw(); ed.rebuild(); } });
    }
    function isFirst(e) { return e.y < minY || (e.y === minY && e.m <= minM); }
    function isLast(e) { return e.y === now.getFullYear() && e.m === now.getMonth(); }
    var monthTab = {
      id: 'month', label: '달', icon: 'month', first: true,
      rows: function (st) {
        var e = st.extra;
        return [
          { chips: [{ text: '‹ 지난달', value: 'prev', disabled: isFirst(e) }, { text: e.y + '년 ' + (e.m + 1) + '월', value: 'now', on: true }, { text: '다음 달 ›', value: 'next', disabled: isLast(e) }] },
          { tip: '횟수·시간·달력만 들어가고 위치·산책 길·장소 이름은 들어가지 않아요.' }
        ];
      },
      onPick: function (v, st) {
        var e = st.extra;
        if (v === 'prev' && !isFirst(e)) { e.m--; if (e.m < 0) { e.m = 11; e.y--; } }
        else if (v === 'next' && !isLast(e)) { e.m++; if (e.m > 11) { e.m = 0; e.y++; } }
        else return;
        e.r = summarize(walks, e.y, e.m);
        ensurePhoto(e.r.photoKey);
        st.photo.zoom = 1; st.photo.x = 0.5; st.photo.y = 0.5;   // 달마다 사진이 달라서 처음대로
      }
    };
    Promise.all([loadImg('icons/walson-logo.webp'), fontsReady]).then(function (a) {
      var logo = a[0], y = now.getFullYear(), m = now.getMonth(), r = summarize(walks, y, m);
      ensurePhoto(r.photoKey);
      ed = WalsonEditor.open({
        title: '월간 리포트',
        formats: [['feed', '피드 4:5'], ['story', '스토리 9:16']], fmt: 'feed',
        tabs: [monthTab], tab: 'month',
        photo: { sources: [['photo', '그 달 사진'], ['logo', '왈슨 그림']], fixed: ['logo'], src: 'photo', zoom: 1, x: 0.5, y: 0.5, home: { x: 0.5, y: 0.5 } },
        extra: { y: y, m: m, r: r },
        hint: '동그라미 사진은 끌어서 옮기고, 두 손가락으로 키워요',
        draw: function (cv, st) {
          var e = st.extra, img = st.photo.src === 'photo' ? (photos[e.r.photoKey] || null) : null, L = {};
          draw(e.r, img, logo, profile, st.fmt, cv, { zoom: st.photo.zoom, x: st.photo.x, y: st.photo.y, layout: L });
          return { x: L.x, y: L.y, w: L.w, h: L.h, img: img };
        },
        fileName: function (st) { return 'walson-' + st.extra.y + '-' + pad2(st.extra.m + 1) + '-' + st.fmt + '.png'; },
        onSave: function (st, how) { if (window.WalsonTrack) WalsonTrack.send('card_saved', { what: 'month_report', format: st.fmt, how: how }); }
      });
    });
  }

  window.MonthReport = { open: open, summarize: summarize, draw: draw };
})();
