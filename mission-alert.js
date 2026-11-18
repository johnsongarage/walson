// 미션 도착 알림 — 화면 가운데 카드(2026-11-18 가르시아 "내가 가야 할 구역을 갔을 때 알림 형식으로 알려 줬으면 해,
// 미션이 진행이 된 거니, 가운데 화면을 띄운다던가"). 전역 window.WalsonMissionAlert.
// 앱이 화면에 켜져 있을 때만 보인다 — 웹앱은 화면이 꺼졌거나 주머니 속일 때 알림을 띄울 방법이 없다(서버 푸시도 없음).
// 정확한 위치가 켜진 폰에서만 도착을 안다(대략적인 위치는 오차가 2km 넘어서 도착이라 하지 않는다 — town.html·walk-engine.js).
//
//   WalsonMissionAlert.show({
//     icon: 'flag' | 'paw',           // 깃발 = 장소에 왔어요, 발바닥 = 발도장 받았어요
//     badge: '미션 1 · 발도장 1/5',    // 맨 위 작은 줄(없어도 됨)
//     title: '발도장 받았어요!',
//     place: '다산 중앙공원',          // 장소 이름(글자로만 넣는다)
//     lines: ['다음 미션: …'],         // 아래 설명 줄들
//     primary: { label: '확인', href: '…' 또는 onClick: fn },   // 없으면 '확인'
//     secondary: { label: '닫기' }     // 없으면 안 보임
//   })
// 바깥(어두운 곳)을 누르거나 Esc를 누르면 닫힌다. 한 번에 하나만 — 새로 띄우면 앞의 것은 닫는다.
(function () {
  var ID = 'walson-mission-alert';
  var CSS =
    '#' + ID + '{position:fixed;inset:0;z-index:12000;display:flex;align-items:center;justify-content:center;padding:24px;' +
      'background:rgba(43,29,20,.48);font-family:Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;' +
      'animation:wma-fade .18s ease-out;}' +
    '#' + ID + ' .wma-card{width:100%;max-width:330px;box-sizing:border-box;padding:26px 22px 18px;border-radius:26px;text-align:center;' +
      'background:var(--panel,#fffaf3);color:var(--ink,#4a3f35);border:2px solid var(--panel-border,#e6d6c1);' +
      'box-shadow:0 18px 50px rgba(43,29,20,.35);animation:wma-pop .32s cubic-bezier(.2,1.4,.4,1);}' +
    '#' + ID + ' .wma-ic{width:72px;height:72px;margin:0 auto 12px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
      'background:var(--accent,#b8563a);color:#fff;box-shadow:0 0 0 8px var(--accent-tint,#f3ddd2);}' +
    '#' + ID + ' .wma-ic.is-paw{background:#3f7d4a;box-shadow:0 0 0 8px #e3f1e5;}' +
    '#' + ID + ' .wma-badge{font-size:12px;font-weight:800;color:var(--accent-ink,#9c4530);margin:0 0 4px;}' +
    '#' + ID + ' .wma-title{font-size:22px;font-weight:900;line-height:1.3;margin:0;letter-spacing:-.01em;word-break:keep-all;}' +
    '#' + ID + ' .wma-place{font-size:17px;font-weight:800;margin:6px 0 0;word-break:keep-all;}' +
    '#' + ID + ' .wma-lines{margin:10px 0 0;font-size:14px;line-height:1.6;color:var(--ink-soft,#6b5d4e);word-break:keep-all;}' +
    '#' + ID + ' .wma-lines p{margin:0;}' +
    '#' + ID + ' .wma-btns{display:grid;gap:8px;margin-top:18px;}' +
    '#' + ID + ' .wma-main{display:flex;align-items:center;justify-content:center;min-height:50px;border:0;border-radius:999px;' +
      'background:var(--hl,var(--accent,#b8563a));color:var(--hl-ink,#fff);font-family:inherit;font-size:16px;font-weight:800;line-height:1;text-decoration:none;cursor:pointer;}' +
    '#' + ID + ' .wma-sub{min-height:42px;border:0;background:none;color:var(--ink-soft,#6b5d4e);font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;}' +
    '@keyframes wma-fade{from{opacity:0}to{opacity:1}}' +
    '@keyframes wma-pop{from{transform:scale(.86);opacity:0}to{transform:scale(1);opacity:1}}' +
    '@media (prefers-reduced-motion:reduce){#' + ID + ',#' + ID + ' .wma-card{animation:none}}';
  var ICONS = {
    flag: '<svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M7 4h11l-2.6 4.2L18 12.4H7z" fill="currentColor"/></svg>',
    paw: '<svg width="36" height="36" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M212,80a28,28,0,1,0,28,28A28,28,0,0,0,212,80ZM72,108a28,28,0,1,0-28,28A28,28,0,0,0,72,108ZM92,88A28,28,0,1,0,64,60,28,28,0,0,0,92,88Zm72,0a28,28,0,1,0-28-28A28,28,0,0,0,164,88Zm23.12,60.86a35.3,35.3,0,0,1-16.87-21.14,44,44,0,0,0-84.5,0A35.25,35.25,0,0,1,69,148.82,40,40,0,0,0,88,224a39.48,39.48,0,0,0,15.52-3.13,64.09,64.09,0,0,1,48.87,0,40,40,0,0,0,34.73-72Z"/></svg>'
  };
  var styled = false, lastFocus = null;

  function ensureStyle() {
    if (styled) return;
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    styled = true;
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function close() {
    var old = document.getElementById(ID);
    if (!old) return;
    old.parentNode.removeChild(old);
    document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { /* 무시 */ } }
    lastFocus = null;
  }
  function button(spec, cls, fallback) {
    var label = (spec && spec.label) || fallback;
    var b;
    if (spec && spec.href) { b = el('a', cls, label); b.href = spec.href; }
    else { b = el('button', cls, label); b.type = 'button'; }
    b.addEventListener('click', function (e) {
      if (spec && typeof spec.onClick === 'function') spec.onClick(e);
      if (!(spec && spec.href)) close();
    });
    return b;
  }
  function show(o) {
    o = o || {};
    close();
    ensureStyle();
    lastFocus = document.activeElement;
    var wrap = el('div');
    wrap.id = ID;
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    var card = el('div', 'wma-card');
    var ic = el('div', 'wma-ic' + (o.icon === 'paw' ? ' is-paw' : ''));
    ic.innerHTML = ICONS[o.icon === 'paw' ? 'paw' : 'flag'];
    card.appendChild(ic);
    if (o.badge) card.appendChild(el('p', 'wma-badge', o.badge));
    var title = el('h2', 'wma-title', o.title || '');
    title.id = ID + '-title';
    wrap.setAttribute('aria-labelledby', title.id);
    card.appendChild(title);
    if (o.place) card.appendChild(el('p', 'wma-place', o.place));
    if (o.lines && o.lines.length) {
      var lines = el('div', 'wma-lines');
      o.lines.forEach(function (t) { if (t) lines.appendChild(el('p', '', t)); });
      card.appendChild(lines);
    }
    var btns = el('div', 'wma-btns');
    var main = button(o.primary, 'wma-main', '확인');
    btns.appendChild(main);
    if (o.secondary) btns.appendChild(button(o.secondary, 'wma-sub', '닫기'));
    card.appendChild(btns);
    wrap.appendChild(card);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });   // 바깥을 누르면 닫힘
    document.body.appendChild(wrap);
    document.addEventListener('keydown', onKey);
    try { main.focus({ preventScroll: true }); } catch (e) { /* 무시 */ }
    return wrap;
  }
  window.WalsonMissionAlert = { show: show, close: close, isOpen: function () { return !!document.getElementById(ID); } };
})();
