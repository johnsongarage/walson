// 월간 리포트 한 장(2026-11-15, hq 개발 후보 2번 — 댕댕캐치 "월간 발자국" 참고). 전역 window.MonthReport.
// [기록]에서 한 달의 산책을 한 장 이미지로: 산책 횟수·시간·산책한 날·거리, 달력(산책한 날·응가), 가장 긴 산책,
// 가장 긴 연속, 새로 모은 발도장 "개수", 그 달의 대표 사진(가장 최근 "오늘의 한 장").
// 위치·산책 길·발도장 장소 이름은 넣지 않는다. 그리기는 이 휴대폰 안에서만.
//   MonthReport.open({ walks, profile })  — 기본은 이번 달, 시트에서 지난달로 넘길 수 있다
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

  function draw(r, photo, logo, profile, fmt, target) {
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
    if (img) { var s = Math.max(ph / img.width, ph / img.height); ctx.drawImage(img, px + (ph - img.width * s) / 2, py + (ph - img.height * s) / 2, img.width * s, img.height * s); }
    ctx.restore();
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

  // ── 시트 ──
  var styleAdded = false;
  function addStyle() {
    if (styleAdded) return; styleAdded = true;
    var css = document.createElement('style');
    css.textContent =
      '.mr-back{position:fixed;inset:0;z-index:3000;background:rgba(30,20,12,.6);display:flex;align-items:flex-end;justify-content:center;overflow-y:auto;}' +
      '.mr-sheet{width:100%;max-width:440px;background:#fffaf3;border-radius:20px 20px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));margin-top:auto;font-family:Pretendard,-apple-system,"Malgun Gothic",sans-serif;color:#4a3f35;}' +
      '.mr-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}' +
      '.mr-head h3{margin:0;font-size:16px;font-weight:800;}' +
      '.mr-head button{font:800 16px Pretendard,sans-serif;width:36px;height:36px;border-radius:10px;border:1px solid #e6d6c1;background:#fff;color:#4a3f35;cursor:pointer;}' +
      '.mr-head button:disabled{opacity:.35;cursor:default;}' +
      '.mr-prev{display:block;max-width:100%;max-height:56vh;width:auto;height:auto;margin:0 auto;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.2);}' +
      '.mr-fmt,.mr-row{display:flex;gap:8px;margin-top:12px;}' +
      '.mr-fmt button,.mr-row button{flex:1;font:800 14px Pretendard,-apple-system,sans-serif;padding:11px;border-radius:12px;border:1px solid #e6d6c1;background:#fff;color:#4a3f35;cursor:pointer;}' +
      '.mr-fmt button[aria-pressed="true"]{background:#4a3f35;color:#fff;border-color:#4a3f35;}' +
      '.mr-row .mr-save{background:#b8563a;border-color:#b8563a;color:#fff;flex:2;}' +
      '.mr-note{font-size:12px;color:#6b5d4e;margin:10px 2px 0;line-height:1.5;}';
    document.head.appendChild(css);
  }

  function open(opts) {
    addStyle();
    var walks = opts.walks || [], profile = opts.profile || {};
    var now = new Date(), y = now.getFullYear(), m = now.getMonth(), fmt = 'feed';
    var firstDate = walks.reduce(function (a, w) { return w && w.date && w.date < a ? w.date : a; }, y + '-' + pad2(m + 1) + '-01');
    var minY = Number(firstDate.slice(0, 4)), minM = Number(firstDate.slice(5, 7)) - 1;
    var back = document.createElement('div');
    back.className = 'mr-back';
    back.innerHTML =
      '<div class="mr-sheet" role="dialog" aria-modal="true" aria-label="월간 리포트">' +
        '<div class="mr-head"><button type="button" class="mr-p" aria-label="이전 달">‹</button><h3 class="mr-t"></h3><button type="button" class="mr-n" aria-label="다음 달">›</button></div>' +
        '<canvas class="mr-prev" aria-label="월간 리포트 미리 보기"></canvas>' +
        '<div class="mr-fmt"><button type="button" data-f="feed" aria-pressed="true">피드 4:5</button><button type="button" data-f="story" aria-pressed="false">스토리 9:16</button></div>' +
        '<div class="mr-row"><button type="button" class="mr-close">닫기</button><button type="button" class="mr-save">저장·공유</button></div>' +
        '<p class="mr-note">횟수·시간·달력만 들어가고 위치·산책 길·장소 이름은 들어가지 않아요. 이 휴대폰에서 만들어요.</p>' +
      '</div>';
    document.body.appendChild(back);
    var prev = back.querySelector('.mr-prev');
    if (window.WalsonSave) back.querySelector('.mr-save').textContent = WalsonSave.label();
    function close() { back.remove(); }
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    back.querySelector('.mr-close').addEventListener('click', close);

    var fontsReady = (document.fonts && document.fonts.load)
      ? Promise.all([document.fonts.load('84px "Black Han Sans"'), document.fonts.load('800 34px Pretendard')]).catch(function () {}) : Promise.resolve();
    var logoP = loadImg('icons/walson-logo.webp');
    var photoCache = {};
    function photoFor(key) {
      if (!key || !window.WalkPhotos) return Promise.resolve(null);
      if (photoCache[key]) return photoCache[key];
      photoCache[key] = WalkPhotos.get(key).then(function (blob) {
        if (!blob) return null;
        var u = URL.createObjectURL(blob);
        return loadImg(u).then(function (im) { setTimeout(function () { URL.revokeObjectURL(u); }, 1000); return im; });
      }).catch(function () { return null; });
      return photoCache[key];
    }
    function render() {
      var r = summarize(walks, y, m);
      back.querySelector('.mr-t').textContent = y + '년 ' + (m + 1) + '월 리포트';
      back.querySelector('.mr-p').disabled = (y < minY || (y === minY && m <= minM));
      back.querySelector('.mr-n').disabled = (y === now.getFullYear() && m === now.getMonth());
      Promise.all([photoFor(r.photoKey), logoP, fontsReady]).then(function (a) { draw(r, a[0], a[1], profile, fmt, prev); });
    }
    back.querySelector('.mr-p').addEventListener('click', function () { m--; if (m < 0) { m = 11; y--; } render(); });
    back.querySelector('.mr-n').addEventListener('click', function () { m++; if (m > 11) { m = 0; y++; } render(); });
    Array.prototype.forEach.call(back.querySelectorAll('.mr-fmt button'), function (b) {
      b.addEventListener('click', function () {
        fmt = b.getAttribute('data-f');
        Array.prototype.forEach.call(back.querySelectorAll('.mr-fmt button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
    });
    back.querySelector('.mr-save').addEventListener('click', function () {
      if (window.WalsonTrack) WalsonTrack.send('card_saved', { what: 'month_report', format: fmt });
      var name = 'walson-' + y + '-' + pad2(m + 1) + '-' + fmt + '.png';
      if (window.WalsonSave) WalsonSave.canvas(prev, name);
    });
    render();
  }

  window.MonthReport = { open: open, summarize: summarize, draw: draw };
})();
