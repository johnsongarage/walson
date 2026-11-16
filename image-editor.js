// 한 화면 이미지 편집기(2026-11-16 가르시아 "적용해" — 시안 edit-proto.html을 공통으로). 전역 window.WalsonEditor.
// 왜: 영수증·월간 리포트·주민증처럼 이미지로 저장하는 화면이 여러 개인데, 미리 보기는 세로로 길고 고치는 도구는 스크롤 아래에 있었다.
// 원칙: 화면 높이에 딱 맞춘다(스크롤 없음) · 미리 보기가 남은 자리 전부(9:16도 한눈에) · 사진은 미리 보기에서 끌고 두 손가락으로 키운다 ·
//       아래 탭은 하나씩만 얇게 · 저장은 늘 오른쪽 위 · 글을 쓸 땐 자판 바로 위 입력 칸(미리 보기는 그 위에 그대로).
// 그림은 이 휴대폰 안에서만 그리고 어디로도 보내지 않는다(저장·공유는 save-image.js — 사용자가 고른 앱으로).
//
// WalsonEditor.open({
//   title: '산책 영수증',
//   formats: [['story', '스토리 9:16'], ['feed', '피드 4:5']], fmt: 'story',        // 둘 이상이면 [모양] 탭
//   photo: { sources: [['walk', '산책 사진'], ['logo', '왈슨 그림']], fixed: ['logo'],  // 있으면 [사진] 탭 + 미리 보기에서 끌기
//            src: 'walk', zoom: 1, x: 0.5, y: 0.4, home: { x: 0.5, y: 0.4 } },
//   tabs: [{ id, label, icon: 'note'|'side'|'month', rows: function (st) → [{ label, chips: [{ text, value, on, cls }] } | { tip }],
//            onPick: function (value, st, api) }],                                   // 콘텐츠마다 다른 탭
//   stickers: [{ text, nx, ny, s, style }],  stickers: false면 [글자 붙이기] 탭을 뺀다
//   draw: function (canvas, st) → 사진 칸 { x, y, w, h, img } 또는 null — 바탕 그림을 그린다(동기). 글자는 편집기가 위에 얹는다
//   hint, fileName: function (st), onSave: function (st), onClose: function (st)
// })  →  api { state, redraw(), rebuild(), prompt({ value, max, placeholder }) → Promise<글|null>, close() }
// st = { fmt, photo: { src, zoom, x, y }, stickers: [...], extra: (부른 쪽 마음대로) }
// WalsonEditor.drawStickers(canvas, stickers) — 저장해 둔 글자를 다른 미리 보기(예: [기록]의 작은 영수증)에 같은 모양으로 얹는다.
(function () {
  var STYLES = [['white', '흰 글씨', '#ffffff'], ['black', '검은 글씨', '#2b2420'], ['bubble', '말풍선', '#ffffff'], ['tag', '띠', '#b8563a']];
  var ICONS = {
    shape: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>',
    note: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    side: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M19 9v9a2 2 0 0 1-2 2H8"/>',
    month: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
  };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function svg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[k] || ICONS.note) + '</svg>'; }

  // ── 붙인 글자 그리기(편집기·다른 미리 보기 공통) — 위치는 그림 크기에 대한 비율(nx·ny)이라 모양을 바꿔도 같은 자리 ──
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawSticker(ctx, W, H, st, selected) {
    if (!st || !st.text) return null;
    var size = Math.round(W * 0.062 * (st.s || 1)), x = (st.nx == null ? 0.5 : st.nx) * W, y = (st.ny == null ? 0.4 : st.ny) * H;
    ctx.save();
    ctx.font = '800 ' + size + 'px Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var w = ctx.measureText(st.text).width, padX = size * 0.5, padY = size * 0.34;
    var bw = w + padX * 2, bh = size + padY * 2, x0 = x - bw / 2, y0 = y - bh / 2;
    if (st.style === 'bubble' || st.style === 'tag') {
      ctx.fillStyle = st.style === 'bubble' ? '#ffffff' : '#b8563a';
      ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = size * 0.35; ctx.shadowOffsetY = size * 0.08;
      roundRect(ctx, x0, y0, bw, bh, st.style === 'bubble' ? bh / 2 : size * 0.16); ctx.fill();
      if (st.style === 'bubble') { ctx.beginPath(); ctx.moveTo(x0 + bw * 0.22, y0 + bh - 2); ctx.lineTo(x0 + bw * 0.16, y0 + bh + size * 0.42); ctx.lineTo(x0 + bw * 0.36, y0 + bh - 2); ctx.closePath(); ctx.fill(); }
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = st.style === 'bubble' ? '#2b2420' : '#ffffff';
      ctx.fillText(st.text, x, y + size * 0.04);
    } else {
      ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.17;
      ctx.strokeStyle = st.style === 'black' ? 'rgba(255,255,255,.95)' : 'rgba(30,22,18,.72)';
      ctx.strokeText(st.text, x, y);
      ctx.fillStyle = st.style === 'black' ? '#2b2420' : '#ffffff';
      ctx.fillText(st.text, x, y);
    }
    if (selected) {   // 고른 글자 테두리 — 미리 보기에만
      ctx.setLineDash([size * 0.25, size * 0.18]); ctx.lineWidth = Math.max(3, size * 0.06); ctx.strokeStyle = '#e2774f';
      roundRect(ctx, x0 - size * 0.18, y0 - size * 0.18, bw + size * 0.36, bh + size * 0.36, size * 0.25); ctx.stroke();
    }
    ctx.restore();
    return { x: x0, y: y0, w: bw, h: bh };
  }
  function drawStickers(canvas, stickers) {
    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    (stickers || []).forEach(function (st) { drawSticker(ctx, canvas.width, canvas.height, st, false); });
  }

  // ── 모양(한 번만 넣음) ──
  var cssAdded = false;
  function addCss() {
    if (cssAdded) return; cssAdded = true;
    var c = document.createElement('style');
    c.textContent = [
      '.we{position:fixed;left:0;top:0;width:100vw;height:100vh;height:100dvh;z-index:5000;display:flex;flex-direction:column;background:#2b231e;color:#fbf4ea;font-family:Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;overscroll-behavior:none;-webkit-tap-highlight-color:transparent;}',
      '.we *{box-sizing:border-box;}',
      '.we button{font:inherit;color:inherit;}',
      '.we [hidden]{display:none!important;}',
      '.we-top{flex:none;display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top) + 8px) 10px 8px;}',
      '.we-x{width:40px;height:40px;border-radius:12px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;}',
      '.we-x svg{width:22px;height:22px;}',
      '.we-title{flex:1;min-width:0;font-weight:800;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.we .we-save{flex:none;border:none;border-radius:999px;padding:10px 18px;background:#e2774f;color:#fff;font-weight:800;font-size:15px;cursor:pointer;}',
      '.we-save:disabled{opacity:.6;}',
      '.we-stage{flex:1;min-height:0;position:relative;display:flex;align-items:center;justify-content:center;background:#1f1915;overflow:hidden;}',
      '.we-stage canvas{display:block;touch-action:none;border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,.45);background:#fff;}',
      '.we-hint{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);max-width:calc(100% - 32px);padding:7px 13px;border-radius:999px;background:rgba(0,0,0,.62);color:#fff;font-size:12.5px;font-weight:700;line-height:1.35;text-align:center;pointer-events:none;transition:opacity .4s;}',
      '.we-hint.gone{opacity:0;}',
      '.we-tray{flex:none;min-height:96px;padding:12px 0 10px;background:#362c26;border-top:1px solid rgba(255,255,255,.1);}',
      '.we-row{display:flex;align-items:center;gap:8px;padding:0 14px;overflow-x:auto;scrollbar-width:none;}',
      '.we-row::-webkit-scrollbar{display:none;}',
      '.we-row+.we-row{margin-top:10px;}',
      '.we-label{flex:none;font-size:12px;font-weight:800;color:#c9b9a6;}',
      '.we-chip{flex:none;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);border-radius:999px;padding:9px 14px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;}',
      '.we-chip[aria-pressed="true"]{background:#fbf4ea;color:#2b231e;border-color:#fbf4ea;}',
      '.we-chip.accent{background:#e2774f;border-color:#e2774f;color:#fff;}',
      '.we-chip.ghost{background:transparent;}',
      '.we-chip:disabled{opacity:.35;cursor:default;}',
      '.we-chip .sw{display:inline-block;width:14px;height:14px;border-radius:4px;vertical-align:-2px;margin-right:6px;border:1px solid rgba(255,255,255,.35);}',
      '.we-range{flex:1;min-width:120px;accent-color:#e2774f;}',
      '.we-tip{padding:0 14px;margin:9px 0 0;font-size:12px;color:#c9b9a6;line-height:1.45;}',
      '.we-tabs{flex:none;display:flex;background:#2b231e;border-top:1px solid rgba(255,255,255,.1);padding-bottom:env(safe-area-inset-bottom);}',
      '.we-tab{flex:1;border:none;background:transparent;padding:8px 0 9px;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11.5px;font-weight:700;color:#c9b9a6;cursor:pointer;}',
      '.we-tab svg{width:22px;height:22px;}',
      '.we-tab[aria-selected="true"]{color:#fbf4ea;}',
      '.we-tab[aria-selected="true"] svg{color:#e2774f;}',
      '.we-sheet{position:fixed;left:0;right:0;bottom:0;z-index:5001;background:#362c26;border-top:1px solid rgba(255,255,255,.1);padding:10px 12px calc(env(safe-area-inset-bottom) + 10px);font-family:Pretendard,-apple-system,sans-serif;color:#fbf4ea;}',
      '.we-sheet-in{display:flex;gap:8px;align-items:center;}',
      '.we-sheet input{flex:1;min-width:0;font:inherit;font-size:16px;padding:11px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#1f1915;color:#fbf4ea;}',
      '.we-sheet .we-chip{font-family:inherit;}',
      '.we-count{font-size:11px;color:#c9b9a6;margin:6px 2px 0;}'
    ].join('\n');
    document.head.appendChild(c);
  }

  function open(cfg) {
    addCss();
    var fmts = cfg.formats || [];
    var P = cfg.photo || null;
    var st = {
      fmt: cfg.fmt || (fmts[0] && fmts[0][0]) || '',
      photo: P ? { src: P.src, zoom: P.zoom || 1, x: P.x != null ? P.x : 0.5, y: P.y != null ? P.y : 0.4 } : null,
      stickers: (cfg.stickers || []).map(function (s) { return { text: s.text, nx: s.nx, ny: s.ny, s: s.s || 1, style: s.style || 'white' }; }),
      extra: cfg.extra || {}
    };
    var allowText = cfg.stickers !== false;
    var tabs = [];
    if (fmts.length > 1) tabs.push({ id: 'shape', label: '모양', icon: 'shape' });
    (cfg.tabs || []).forEach(function (t) { if (t.first) tabs.push(t); });
    if (P) tabs.push({ id: 'photo', label: '사진', icon: 'photo' });
    (cfg.tabs || []).forEach(function (t) { if (!t.first) tabs.push(t); });
    if (allowText) tabs.push({ id: 'text', label: '글자 붙이기', icon: 'text' });
    var tab = cfg.tab || (P ? 'photo' : tabs[0] && tabs[0].id);
    var sel = -1, style = 'white', band = null, boxes = [];

    // ── 화면 ──
    var root = document.createElement('div');
    root.className = 'we';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', (cfg.title || '이미지') + ' 꾸미기');
    root.innerHTML =
      '<div class="we-top"><button type="button" class="we-x" aria-label="닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<div class="we-title"></div><button type="button" class="we-save">저장</button></div>' +
      '<div class="we-stage"><canvas role="img" aria-label="미리 보기"></canvas><div class="we-hint"></div></div>' +
      '<div class="we-tray"></div><div class="we-tabs" role="tablist"></div>';
    var sheet = document.createElement('div');
    sheet.className = 'we-sheet'; sheet.hidden = true;
    sheet.innerHTML = '<div class="we-sheet-in"><input type="text" autocomplete="off" enterkeyhint="done"><button type="button" class="we-chip accent">완료</button></div><p class="we-count"></p>';
    document.body.appendChild(root); document.body.appendChild(sheet);
    var q = function (s) { return root.querySelector(s); };
    var cv = q('canvas'), ctx = cv.getContext('2d'), stage = q('.we-stage'), tray = q('.we-tray'), tabsEl = q('.we-tabs'), hint = q('.we-hint');
    var input = sheet.querySelector('input');
    q('.we-title').textContent = cfg.title || '꾸미기';
    if (window.WalsonSave) q('.we-save').textContent = WalsonSave.isMobile() ? '저장·공유' : '저장';
    hint.textContent = cfg.hint || (P ? '사진은 끌어서 옮기고, 두 손가락으로 키워요' : '글자 붙이기로 한마디 얹어 보세요');
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // ── 그리기 ──
    function render(forSave) {
      band = cfg.draw(cv, st) || null;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      boxes = st.stickers.map(function (s, i) { return drawSticker(ctx, cv.width, cv.height, s, !forSave && i === sel); });
      fit();
    }
    var raf = 0;
    function schedule() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; render(false); }); }
    function fit() {
      var pad = 14, aw = stage.clientWidth - pad * 2, ah = stage.clientHeight - pad * 2;
      if (aw <= 0 || ah <= 0) return;
      var k = Math.min(aw / cv.width, ah / cv.height);
      cv.style.width = Math.floor(cv.width * k) + 'px'; cv.style.height = Math.floor(cv.height * k) + 'px';
    }
    var ro = window.ResizeObserver ? new ResizeObserver(function () { fit(); }) : null;
    if (ro) ro.observe(stage);
    // 자판이 올라오면 보이는 영역에 맞춘다(아이폰은 화면 바닥 고정 칸이 자판에 가려서 직접 옮긴다)
    function fitViewport() {
      var vv = window.visualViewport, h = vv ? vv.height : window.innerHeight;
      root.style.height = h + 'px';
      root.style.top = (vv ? vv.offsetTop : 0) + 'px';
      sheet.style.bottom = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + 'px' : '0px';
      fit();
    }
    if (window.visualViewport) { visualViewport.addEventListener('resize', fitViewport); visualViewport.addEventListener('scroll', fitViewport); }
    window.addEventListener('resize', fitViewport);

    // ── 손으로 바로 고치기 ──
    var ptrs = {}, gesture = null, lastTap = 0;
    function toCanvas(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }
    function hitSticker(p) { var m = cv.width * 0.02; for (var i = boxes.length - 1; i >= 0; i--) { var b = boxes[i]; if (b && p.x >= b.x - m && p.x <= b.x + b.w + m && p.y >= b.y - m && p.y <= b.y + b.h + m) return i; } return -1; }
    function movable() { return P && band && band.img && (P.fixed || []).indexOf(st.photo.src) < 0; }
    function inBand(p) { return movable() && p.x >= band.x && p.x <= band.x + band.w && p.y >= band.y && p.y <= band.y + band.h; }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function hideHint() { hint.classList.add('gone'); }
    function home() { var h = (P && P.home) || {}; st.photo.zoom = 1; st.photo.x = h.x != null ? h.x : 0.5; st.photo.y = h.y != null ? h.y : 0.4; }
    cv.addEventListener('pointerdown', function (e) {
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      ptrs[e.pointerId] = toCanvas(e);
      var ids = Object.keys(ptrs);
      if (ids.length === 1) {
        var p = ptrs[ids[0]], i = hitSticker(p);
        if (i >= 0) { var was = sel === i; sel = i; gesture = { kind: 'sticker', i: i, last: p, start: p, t: Date.now(), was: was }; if (tab !== 'text') openTab('text'); else buildTray(); }
        else if (inBand(p)) { gesture = { kind: 'photo', last: p, start: p, t: Date.now() }; if (sel >= 0) { sel = -1; buildTray(); } }
        else { gesture = null; if (sel >= 0) { sel = -1; buildTray(); } }
        schedule();
      } else if (ids.length === 2 && gesture) {
        gesture.pinch = { d0: dist(ptrs[ids[0]], ptrs[ids[1]]), v0: gesture.kind === 'sticker' ? st.stickers[gesture.i].s : st.photo.zoom };
      }
      hideHint();
    });
    cv.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId] || !gesture) return;
      var p = toCanvas(e); ptrs[e.pointerId] = p;
      var ids = Object.keys(ptrs);
      if (ids.length >= 2 && gesture.pinch) {
        var r = dist(ptrs[ids[0]], ptrs[ids[1]]) / Math.max(1, gesture.pinch.d0);
        if (gesture.kind === 'sticker') st.stickers[gesture.i].s = clamp(gesture.pinch.v0 * r, 0.4, 3.2);
        else { st.photo.zoom = clamp(gesture.pinch.v0 * r, 1, 4); syncZoom(); }
        schedule(); return;
      }
      if (ids.length !== 1) return;
      var dx = p.x - gesture.last.x, dy = p.y - gesture.last.y; gesture.last = p;
      if (gesture.kind === 'sticker') {
        var s = st.stickers[gesture.i];
        s.nx = clamp(s.nx + dx / cv.width, 0, 1); s.ny = clamp(s.ny + dy / cv.height, 0, 1);
      } else if (gesture.kind === 'photo' && band && band.img) {
        var k = Math.max(band.w / band.img.width, band.h / band.img.height) * st.photo.zoom, pw = band.img.width * k, ph = band.img.height * k;
        if (pw - band.w > 1) st.photo.x = clamp(st.photo.x - dx / (pw - band.w), 0, 1);
        if (ph - band.h > 1) st.photo.y = clamp(st.photo.y - dy / (ph - band.h), 0, 1);
      }
      schedule();
    });
    function endPtr(e) {
      var p = ptrs[e.pointerId]; delete ptrs[e.pointerId];
      if (!gesture || !p) return;
      var ids = Object.keys(ptrs);
      if (ids.length) { gesture.pinch = null; gesture.last = ptrs[ids[0]]; return; }
      var tap = dist(p, gesture.start) < cv.width * 0.012 && Date.now() - gesture.t < 350;
      if (tap && gesture.kind === 'sticker' && gesture.was) editSticker();   // 고른 글자를 한 번 더 누르면 고치기
      if (tap && gesture.kind === 'photo') { if (Date.now() - lastTap < 320) { home(); syncZoom(); schedule(); } lastTap = Date.now(); }   // 두 번 톡 = 처음대로
      gesture = null;
    }
    cv.addEventListener('pointerup', endPtr);
    cv.addEventListener('pointercancel', endPtr);
    cv.addEventListener('wheel', function (e) { if (!movable()) return; e.preventDefault(); st.photo.zoom = clamp(st.photo.zoom * (e.deltaY < 0 ? 1.08 : 0.93), 1, 4); syncZoom(); schedule(); }, { passive: false });

    // ── 탭과 도구 칸 ──
    function openTab(k) { tab = k; buildTabs(); buildTray(); }
    function buildTabs() {
      tabsEl.innerHTML = tabs.map(function (t) { return '<button type="button" class="we-tab" role="tab" data-k="' + t.id + '" aria-selected="' + (tab === t.id) + '">' + svg(t.icon) + esc(t.label) + '</button>'; }).join('');
      Array.prototype.forEach.call(tabsEl.children, function (b) { b.addEventListener('click', function () { openTab(b.getAttribute('data-k')); }); });
    }
    function chip(text, on, value, cls, disabled, raw) {
      return '<button type="button" class="we-chip' + (cls ? ' ' + cls : '') + '"' + (on != null ? ' aria-pressed="' + !!on + '"' : '') + ' data-v="' + esc(value) + '"' + (disabled ? ' disabled' : '') + '>' + (raw ? text : esc(text)) + '</button>';
    }
    function rowsHtml(rows) {
      return rows.map(function (r) {
        if (r.tip) return '<p class="we-tip">' + esc(r.tip) + '</p>';
        return '<div class="we-row">' + (r.label ? '<span class="we-label">' + esc(r.label) + '</span>' : '') +
          (r.chips || []).map(function (c) { return chip(c.text, c.on, c.value, c.cls, c.disabled); }).join('') + '</div>';
      }).join('');
    }
    function syncZoom() { var r = tray.querySelector('.we-range'); if (r && st.photo) r.value = Math.round(st.photo.zoom * 100); }
    function custom() { for (var i = 0; i < tabs.length; i++) if (tabs[i].id === tab && tabs[i].rows) return tabs[i]; return null; }
    function buildTray() {
      var h = '', T = custom();
      if (tab === 'shape') {
        h = '<div class="we-row"><span class="we-label">모양</span>' + fmts.map(function (f) { return chip(f[1], st.fmt === f[0], 'fmt:' + f[0]); }).join('') + '</div>' +
          '<p class="we-tip">올릴 곳에 맞춰 골라요 — 스토리는 세로로 길게, 피드·정사각형은 게시물용이에요.</p>';
      } else if (tab === 'photo' && P) {
        h = '<div class="we-row"><span class="we-label">사진</span>' + P.sources.map(function (s) { return chip(s[1], st.photo.src === s[0], 'src:' + s[0]); }).join('') + '</div>' +
          (!movable() ? '<p class="we-tip">' + esc((P.fixed || []).indexOf(st.photo.src) >= 0 ? '이 그림은 옮기거나 키울 수 없어요.' : !band ? (P.noBand || '이 그림은 옮기거나 키울 수 없어요.') : '사진이 없어서 앱 그림이 들어가요.') + '</p>' :
          '<div class="we-row"><span class="we-label">크기</span><input type="range" class="we-range" min="100" max="400" value="' + Math.round(st.photo.zoom * 100) + '" aria-label="사진 크기">' +
            chip('처음대로', null, 'home', 'ghost') + '</div>');
      } else if (tab === 'text') {
        var s = sel >= 0 ? st.stickers[sel] : null, cur = s ? s.style : style;
        h = '<div class="we-row">' + chip('＋ 글자 넣기', null, 'add', 'accent') + (s ? chip('글자 고치기', null, 'edit', 'ghost') + chip('지우기', null, 'del', 'ghost') : '') + '</div>' +
          '<div class="we-row"><span class="we-label">모양</span>' + STYLES.map(function (x) { return chip('<span class="sw" style="background:' + x[2] + '"></span>' + x[1], cur === x[0], 'style:' + x[0], '', false, true); }).join('') + '</div>' +
          '<p class="we-tip">' + (st.stickers.length ? '글자는 끌어서 옮기고 두 손가락으로 키워요. 고른 글자를 한 번 더 누르면 고쳐요.' : '사진 위에 한마디 얹어 보세요. 넣은 뒤 끌어서 자리를 잡아요.') + '</p>';
      } else if (T) h = rowsHtml(T.rows(st));
      tray.innerHTML = h;
      Array.prototype.forEach.call(tray.querySelectorAll('.we-chip'), function (b) { b.addEventListener('click', function () { onChip(b.getAttribute('data-v')); }); });
      var z = tray.querySelector('.we-range');
      if (z) z.addEventListener('input', function () { st.photo.zoom = z.value / 100; hideHint(); schedule(); });
    }
    function onChip(v) {
      var T = custom();
      if (T) { T.onPick(v, st, api); render(false); buildTray(); return; }
      if (v.indexOf('fmt:') === 0) st.fmt = v.slice(4);
      else if (v.indexOf('src:') === 0) { st.photo.src = v.slice(4); }
      else if (v === 'home') home();
      else if (v === 'add') { prompt({ max: 18, placeholder: '사진 위에 얹을 한마디 (18자까지)' }).then(function (t) {
        if (!t) return;
        var ny = band ? (band.y + band.h * 0.5) / cv.height : 0.35;
        st.stickers.push({ text: t, nx: 0.5, ny: clamp(ny, 0.08, 0.92), s: 1, style: style }); sel = st.stickers.length - 1; buildTray(); schedule();
      }); return; }
      else if (v === 'edit') { editSticker(); return; }
      else if (v === 'del' && sel >= 0) { st.stickers.splice(sel, 1); sel = -1; }
      else if (v.indexOf('style:') === 0) { style = v.slice(6); if (sel >= 0) st.stickers[sel].style = style; }
      render(false); buildTray();   // 먼저 그려야 사진 칸(옮길 수 있는지)이 새로 정해진다
    }
    function editSticker() {
      if (sel < 0) return;
      var i = sel, before = st.stickers[i].text;
      prompt({ value: before, max: 18, placeholder: '사진 위에 얹을 한마디 (18자까지)', live: function (t) { st.stickers[i].text = t || before; schedule(); } })
        .then(function (t) { st.stickers[i].text = t || before; buildTray(); schedule(); });
    }

    // ── 글 쓰기 칸(자판 바로 위) ──
    var pending = null;
    function prompt(o) {
      o = o || {};
      if (pending) pending.resolve(null);
      return new Promise(function (resolve) {
        pending = { resolve: resolve, live: o.live };
        input.maxLength = o.max || 28; input.value = o.value || ''; input.placeholder = o.placeholder || '';
        sheet.hidden = false; tray.style.visibility = 'hidden';
        count(); fitViewport();
        setTimeout(function () { input.focus(); }, 30);
      });
    }
    function count() { sheet.querySelector('.we-count').textContent = input.value.length + ' / ' + input.maxLength + '자 · 이 휴대폰 안에서만 그려요'; }
    function finish(ok) {
      if (!pending) return;
      var p = pending; pending = null;
      var v = input.value.trim();
      input.blur(); sheet.hidden = true; tray.style.visibility = '';
      p.resolve(ok ? v : null);
    }
    input.addEventListener('input', function () { count(); if (pending && pending.live) pending.live(input.value.trim()); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); finish(true); } });
    sheet.querySelector('.we-chip').addEventListener('click', function () { finish(true); });

    // ── 저장·닫기 ──
    var closed = false, pushed = false;
    function cleanup() {
      if (closed) return; closed = true;
      if (pending) finish(false);
      if (ro) ro.disconnect();
      if (window.visualViewport) { visualViewport.removeEventListener('resize', fitViewport); visualViewport.removeEventListener('scroll', fitViewport); }
      window.removeEventListener('resize', fitViewport);
      window.removeEventListener('popstate', onPop);
      root.remove(); sheet.remove();
      document.body.style.overflow = prevOverflow;
      if (cfg.onClose) cfg.onClose(st);
    }
    function close() { if (pushed) { pushed = false; history.back(); } else cleanup(); }   // 뒤로 가기(popstate)가 cleanup을 부른다
    function onPop() { pushed = false; cleanup(); }
    // 안드로이드 뒤로 가기·브라우저 뒤로 = 편집기 닫기(앞 화면을 떠나지 않게)
    try { history.pushState({ walsonEditor: 1 }, ''); pushed = true; window.addEventListener('popstate', onPop); } catch (e) { pushed = false; }
    q('.we-x').addEventListener('click', close);
    q('.we-save').addEventListener('click', function () {
      if (pending) finish(true);
      sel = -1; render(true);   // 고른 글자 테두리 없이
      if (cfg.onSave) cfg.onSave(st);
      if (window.WalsonSave) WalsonSave.canvas(cv, cfg.fileName ? cfg.fileName(st) : 'walson.png');
      buildTray(); setTimeout(function () { schedule(); }, 300);
    });

    var api = {
      state: st,
      redraw: schedule,
      rebuild: function () { buildTabs(); buildTray(); },
      prompt: prompt,
      close: close,
      canvas: cv
    };
    render(false); buildTabs(); buildTray(); fitViewport();
    return api;
  }

  window.WalsonEditor = { open: open, drawStickers: drawStickers, STYLES: STYLES };
})();
