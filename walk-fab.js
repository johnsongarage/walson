// [동네] 산책 버튼(2026-11-16, 가르시아: 첫 화면을 [동네]로 — "산책 버튼이 없다는 게 흠"). 전역 window.WalsonWalkFab.
// 지도 오른쪽 아래 둥근 [산책] 버튼 하나. 누르면 두 갈래:
//   · 지금 나가기 → go.html(시간 재기 · 길 기록도 고를 수 있음)
//   · 다녀왔어요 → 몇 분인지만 골라 적기([오늘]의 "다녀왔어요"와 같은 기록 모양) → 끝 화면 → 영수증
// 산책이 진행 중이면 버튼이 "산책 중 · N분"으로 바뀌고 그 화면으로 돌아간다(시간 재기 go.html / 길 기록 walk.html).
// 버튼·창은 이 파일이 만들어 붙인다(town.html은 <script> 한 줄만) — 다른 작업과 같은 줄을 고치지 않게 따로 둠.
// 위치는 쓰지 않는다. 기록은 이 휴대폰 안(localStorage petwalk_walks)에만 — store.js(WalsonStore)를 거쳐 읽고 쓰니 그 파일을 먼저 불러야 한다.
(function () {
  var CHOICES = [10, 20, 30, 45, 60, 90];
  var LABEL = { 60: '1시간', 90: '1시간 반' };
  // Phosphor Icons(MIT) regular — 탭바 [오늘]과 같은 발바닥
  var PAW = 'M212,80a28,28,0,1,0,28,28A28,28,0,0,0,212,80Zm0,40a12,12,0,1,1,12-12A12,12,0,0,1,212,120ZM72,108a28,28,0,1,0-28,28A28,28,0,0,0,72,108ZM44,120a12,12,0,1,1,12-12A12,12,0,0,1,44,120ZM92,88A28,28,0,1,0,64,60,28,28,0,0,0,92,88Zm0-40A12,12,0,1,1,80,60,12,12,0,0,1,92,48Zm72,40a28,28,0,1,0-28-28A28,28,0,0,0,164,88Zm0-40a12,12,0,1,1-12,12A12,12,0,0,1,164,48Zm23.12,100.86a35.3,35.3,0,0,1-16.87-21.14,44,44,0,0,0-84.5,0A35.25,35.25,0,0,1,69,148.82,40,40,0,0,0,88,224a39.48,39.48,0,0,0,15.52-3.13,64.09,64.09,0,0,1,48.87,0,40,40,0,0,0,34.73-72ZM168,208a24,24,0,0,1-9.45-1.93,80.14,80.14,0,0,0-61.19,0,24,24,0,0,1-20.71-43.26,51.22,51.22,0,0,0,24.46-30.67,28,28,0,0,1,53.78,0,51.27,51.27,0,0,0,24.53,30.71A24,24,0,0,1,168,208Z';

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function todayKey() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  // 진행 중인 산책: 시간 재기(go.html, petwalk_active_walk) / 길 기록(walk.html, petwalk_active_route — 이어 하기가 들어오면)
  function activeWalk() {
    var t = WalsonStore.activeWalk();
    if (t && typeof t.startedAt === 'number') return { href: 'go.html', label: '산책 중', startedAt: t.startedAt };
    var r = WalsonStore.activeRoute();
    if (r && typeof r.startedAt === 'number') return { href: 'walk.html', label: '길 기록 중', startedAt: r.startedAt };
    return null;
  }

  var css =
    '.wf-fab{position:fixed;right:14px;bottom:calc(var(--tabbar-h,58px) + 16px);z-index:1000;width:68px;height:68px;border-radius:50%;' +
      'border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:0;' +
      'font-family:inherit;-webkit-tap-highlight-color:transparent;}' +
    '.wf-fab[hidden]{display:none;}' +
    '.wf-fab:active{transform:scale(0.95);}' +
    '.wf-fab b{font-size:14px;font-weight:800;line-height:1.1;}' +
    '.wf-fab small{font-size:11px;font-weight:700;line-height:1;}' +
    '.wf-fab.is-on b{font-size:12px;}' +
    '.wf-sheet{position:fixed;inset:0;z-index:2000;background:rgba(40,32,26,0.55);display:flex;align-items:flex-end;justify-content:center;}' +
    '.wf-sheet[hidden]{display:none;}' +
    '.wf-card{width:100%;max-width:460px;padding:22px 18px calc(18px + env(safe-area-inset-bottom,0px));}' +
    '.wf-card h3{margin:0;font-size:20px;font-weight:800;}' +
    '.wf-sub{margin:6px 0 14px;font-size:13px;line-height:1.5;}' +
    '.wf-choice{display:flex;flex-direction:column;align-items:flex-start;gap:3px;width:100%;margin-bottom:10px;padding:16px;text-align:left;' +
      'font-family:inherit;cursor:pointer;text-decoration:none;}' +
    '.wf-choice b{font-size:17px;font-weight:800;}' +
    '.wf-choice span{font-size:13px;}' +
    '.wf-opts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}' +
    '.wf-opts button{padding:13px 2px;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;}' +
    '.wf-custom{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:15px;font-weight:700;}' +
    '.wf-custom[hidden]{display:none;}' +
    '.wf-custom input{flex:1;min-width:0;padding:12px;font:inherit;font-size:16px;}' +
    '.wf-save{display:block;width:100%;margin-top:16px;padding:16px;border:none;font-family:inherit;font-size:17px;font-weight:800;cursor:pointer;}' +
    '.wf-save:disabled{opacity:0.5;}' +
    '.wf-close{display:block;width:100%;margin-top:6px;padding:10px;background:none;border:none;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;}';
  var soft =
    // 색은 화면 테마(theme.js 색 세 가지)를 따른다(2026-11-17) — 버튼은 로고처럼 채움 + 진한 테두리
    '.wf-fab{background:var(--hl,#b8563a);color:var(--hl-ink,#fff);border:2px solid var(--line,#4a3f35);box-shadow:0 3px 0 var(--line,#4a3f35),0 6px 16px rgba(74,63,53,0.25);}' +
    '.wf-card{background:var(--panel,#fffaf3);border-radius:18px 18px 0 0;color:var(--ink,#4a3f35);}' +
    '.wf-sub,.wf-choice span,.wf-close{color:var(--ink-soft,#6b5d4e);}' +
    '.wf-choice{background:#fff;border:2px solid var(--panel-border,#e6d6c1);border-radius:12px;color:var(--ink,#4a3f35);}' +
    '.wf-choice.is-main{background:var(--hl,#b8563a);border-color:var(--line,#b8563a);color:var(--hl-ink,#fff);}.wf-choice.is-main span{color:var(--hl-ink,#fbe3d9);opacity:0.85;}' +
    '.wf-opts button{background:#fff;border:2px solid var(--panel-border,#e6d6c1);border-radius:12px;color:var(--ink,#4a3f35);}' +
    '.wf-opts button[aria-pressed="true"]{background:var(--hl,#b8563a);border-color:var(--line,#b8563a);color:var(--hl-ink,#fff);}' +
    '.wf-custom input{border:2px solid var(--panel-border,#e6d6c1);border-radius:12px;}' +
    '.wf-save{background:var(--hl,#b8563a);color:var(--hl-ink,#fff);border:2px solid var(--line,#4a3f35);box-shadow:0 3px 0 var(--line,#4a3f35);border-radius:999px;}';
  var style = document.createElement('style');
  style.textContent = css + soft;   // 화면 테마는 11/16부터 차분 하나뿐
  document.head.appendChild(style);

  // ── 버튼 ──
  var fab = el('button', 'wf-fab');
  fab.type = 'button';
  fab.setAttribute('aria-label', '산책');
  function paintFab() {
    var a = activeWalk();
    fab.innerHTML = '';
    fab.classList.toggle('is-on', !!a);
    if (a) {
      fab.appendChild(el('b', '', a.label));
      fab.appendChild(el('small', '', Math.max(0, Math.floor((Date.now() - a.startedAt) / 60000)) + '분째'));
      fab.setAttribute('aria-label', a.label + ' — 산책 화면으로');
    } else {
      fab.insertAdjacentHTML('beforeend', '<svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="' + PAW + '"/></svg>');
      fab.appendChild(el('b', '', '산책'));
      fab.setAttribute('aria-label', '산책 — 지금 나가기 또는 다녀왔어요');
    }
  }
  // [동네]의 목록 시트(2026-11-18 — 요약 줄·볼 것·미션 카드) 바로 위에 붙는다. 시트를 반·펼침으로 올리면 숨는다.
  // (예전 화면의 아래쪽 덩어리 #bottom-stack도 그대로 따른다 — 그 덩어리가 숨으면 같이 숨음)
  function anchor() { return document.getElementById('list-sheet') || document.getElementById('bottom-stack'); }
  function place() {
    var stack = anchor();
    if (!stack) return;
    var state = stack.getAttribute('data-state');
    if (stack.hidden || (state && state !== 'peek')) { fab.hidden = true; return; }
    fab.hidden = false;
    var top = stack.getBoundingClientRect().top;
    if (top > 0) fab.style.bottom = Math.round(window.innerHeight - top + 10) + 'px';
  }

  // ── 창: 갈래 고르기 → (다녀왔어요) 몇 분 ──
  var sheet = el('div', 'wf-sheet');
  sheet.hidden = true;
  var card = el('div', 'wf-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  sheet.appendChild(card);
  sheet.addEventListener('click', function (e) { if (e.target === sheet) close(); });
  function close() { sheet.hidden = true; }
  function closeBtn() { var b = el('button', 'wf-close', '닫기'); b.type = 'button'; b.addEventListener('click', close); return b; }

  function showChoices() {
    card.innerHTML = '';
    card.appendChild(el('h3', '', '산책'));
    card.appendChild(el('p', 'wf-sub', '나갈 때 누르면 기록해 주고, 깜빡했으면 다녀와서 적어도 돼요.'));
    var go = el('a', 'wf-choice is-main');
    go.href = 'go.html';
    go.appendChild(el('b', '', '지금 나가기'));
    // 2026-11-16 1단계: 산책 나가기는 "산책 시작" 하나 — 위치를 쓰면 길도 남고, 안 쓰면 시간만(처음 한 번 묻는다)
    go.appendChild(el('span', '', '위치를 쓰면 길·발도장까지, 안 쓰면 시간만 재요'));
    var after = el('button', 'wf-choice');
    after.type = 'button';
    after.appendChild(el('b', '', '다녀왔어요'));
    after.appendChild(el('span', '', '몇 분인지만 적으면 영수증이 나와요'));
    after.addEventListener('click', showMinutes);
    card.appendChild(go);
    card.appendChild(after);
    card.appendChild(closeBtn());
  }

  function typical() {   // 최근 10번 산책 시간의 가운데 값에 가장 가까운 칸(없으면 30분) — [오늘]과 같은 규칙
    var mins = WalsonStore.walks().filter(function (w) { return w && w.durationMin > 0; }).slice(-10)
      .map(function (w) { return w.durationMin; }).sort(function (a, b) { return a - b; });
    if (!mins.length) return 30;
    var mid = mins[Math.floor(mins.length / 2)];
    return CHOICES.reduce(function (best, c) { return Math.abs(c - mid) < Math.abs(best - mid) ? c : best; }, 30);
  }
  function showMinutes() {
    var picked = typical();
    card.innerHTML = '';
    card.appendChild(el('h3', '', '오늘 얼마나 걸었어요?'));
    var today = WalsonStore.walks().filter(function (w) { return w && w.date === todayKey(); });
    var sum = today.reduce(function (s, w) { return s + (w.durationMin || 0); }, 0);
    card.appendChild(el('p', 'wf-sub', today.length
      ? '오늘 이미 ' + today.length + '번(' + sum + '분) 적혀 있어요. 다른 산책이면 더 적어도 돼요.'
      : '대충 골라도 돼요. 오늘 날짜로 적어요.'));
    var opts = el('div', 'wf-opts');
    var custom = el('label', 'wf-custom');
    custom.hidden = true;
    var input = el('input');
    input.type = 'number'; input.inputMode = 'numeric'; input.min = '1'; input.max = '240'; input.placeholder = '예: 25';
    custom.appendChild(input);
    custom.appendChild(document.createTextNode(' 분'));
    var save = el('button', 'wf-save');
    save.type = 'button';
    var buttons = [];
    function minutes() {
      if (picked !== 'custom') return picked;
      var v = parseInt(input.value, 10);
      return v >= 1 && v <= 240 ? v : null;
    }
    function paint() {
      buttons.forEach(function (x) { x.b.setAttribute('aria-pressed', x.v === picked ? 'true' : 'false'); });
      custom.hidden = picked !== 'custom';
      var m = minutes();
      save.disabled = !m;
      save.textContent = m ? (LABEL[m] || m + '분') + ' 적기' : '몇 분인지 적어 주세요(1~240)';
    }
    CHOICES.concat(['custom']).forEach(function (c) {
      var b = el('button', '', c === 'custom' ? '직접' : (LABEL[c] || c + '분'));
      b.type = 'button';
      b.addEventListener('click', function () { picked = c; paint(); if (c === 'custom') input.focus(); });
      buttons.push({ b: b, v: c });
      opts.appendChild(b);
    });
    input.addEventListener('input', paint);
    save.addEventListener('click', function () {
      var m = minutes();
      if (!m) return;
      save.disabled = true;
      record(m).then(function (ok) { if (!ok) paint(); });
    });
    card.appendChild(opts);
    card.appendChild(custom);
    card.appendChild(save);
    card.appendChild(closeBtn());
    paint();
  }

  // 샘플을 보는 중이면 먼저 끄게 한다(다른 기록 화면과 같음). [동네]는 sample-data.js를 늘 싣지 않아서 그때만 불러온다.
  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = resolve;
      document.head.appendChild(s);
    });
  }
  function leaveSample() {
    var on = false;
    try { on = localStorage.getItem('petwalk_sample_mode') === '1'; } catch (e) { on = false; }
    if (!on) return Promise.resolve(true);
    var ready = window.PetwalkSample ? Promise.resolve()
      : (window.WalkPhotos ? Promise.resolve() : loadScript('walk-photos.js?v=1')).then(function () { return loadScript('sample-data.js?v=5'); });
    return ready.then(function () {
      if (!window.PetwalkSample) { alert('샘플을 끄지 못했어요. [오늘]에서 "샘플 끄기"를 누른 뒤 다시 적어 주세요.'); return false; }
      return PetwalkSample.leaveForRealRecord('다녀온 산책을 기록하면');
    });
  }
  function record(m) {
    return leaveSample().then(function (ok) {
      if (!ok) return false;
      var walks = WalsonStore.walks();   // 샘플을 껐으면 원래 기록이 돌아와 있으니 다시 읽는다
      walks.push({
        date: todayKey(), distanceKm: 0, durationMin: m, route: [], stampRoute: [],
        rewardEligible: false, gapMin: 0, mode: 'time', logged: 'after', loggedAt: Date.now()
      });
      if (!WalsonStore.saveWalks(walks)) {
        alert('기록을 저장하지 못했어요. 저장 공간을 확인해 주세요.');
        return false;
      }
      if (window.WalsonTrack) WalsonTrack.send('walk_complete', { mode: 'after', min_bucket: WalsonTrack.minBucket(m), eligible: 0 });
      location.href = 'walk-end.html';
      return true;
    });
  }

  fab.addEventListener('click', function () {
    var a = activeWalk();
    if (a) { location.href = a.href; return; }
    showChoices();
    sheet.hidden = false;
  });

  function mount() {
    document.body.appendChild(fab);
    document.body.appendChild(sheet);
    paintFab();
    place();
    var stack = anchor();
    if (stack) {
      if (window.ResizeObserver) new ResizeObserver(place).observe(stack);
      if (window.MutationObserver) new MutationObserver(place).observe(stack, { attributes: true, attributeFilter: ['hidden', 'data-state'] });
    }
    window.addEventListener('resize', place);
    setInterval(paintFab, 30000);   // "N분째"를 가끔 새로
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  window.WalsonWalkFab = { open: function () { fab.click(); }, place: place };
})();
