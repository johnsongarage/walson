// 주민증 테두리 색 고르기(2026-11-18 가르시아 "주민증 처음 만들 때 테두리 색상 고르게 해 주고, 색상 고를 수 있게 바를 줘").
// 주민증 만들기(start.html 3단계 — 카드가 나온 바로 아래)와 [주민증] 탭(my-card.html)이 같이 쓴다. 전역 window.WalsonCardColor.
// 고르는 법 두 가지:
//   ① 이름 붙은 색 — 모카(기본)·모래·먹색·하늘·분홍·성향 색(id-card.js CARD_COLORS, 11/18 결정)
//   ② 색 막대 — 무지개 막대를 누르거나 끌어서 아무 색이나. '#rrggbb' 그대로 프로필 cardColor에 저장(id-card.js cardColor가 읽음)
// 테두리·저장 바탕·키링 뒷면 판만 바뀌고, 성향 띠·불은 성향 색 그대로다(안전 표시). 이 휴대폰 프로필에만 저장한다.
// id-card.js를 먼저 불러야 한다.
//
//   var picker = WalsonCardColor.mount(el, {
//     profile: function () { return profile; },          // 지금 프로필(고른 값을 읽어 표시)
//     onPick: function (value, done) { ... }              // value = 색 id 또는 '#rrggbb'
//   });                                                    // done = 손을 뗐을 때 true(이때 저장), 끄는 동안은 false(그림만 다시)
//   picker.refresh();                                      // 프로필이 바뀌었을 때 다시 표시
(function () {
  // 막대 색의 채도·밝기 — 테두리로 쓸 만한 중간 톤(형광처럼 쨍하거나 바탕과 안 보일 만큼 옅은 색은 피함)
  var SAT = 50, LIGHT = 52, DEFAULT_HUE = 28;
  var STYLE_ID = 'walson-card-color';
  var CSS =
    '.cc{margin-top:12px;}' +
    '.cc-row{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;}' +
    '.cc-row button{display:flex;align-items:center;gap:5px;padding:5px 10px 5px 5px;border-radius:999px;cursor:pointer;' +
      'border:1px solid var(--panel-border,#e6d6c1);background:var(--panel,#fffaf3);color:var(--ink,#4a3f35);font-family:inherit;font-size:12.5px;font-weight:700;}' +
    '.cc-row button i{width:20px;height:20px;border-radius:50%;border:1px solid rgba(0,0,0,0.12);}' +
    '.cc-row button[aria-checked="true"]{border-color:var(--ink,#4a3f35);box-shadow:0 0 0 1px var(--ink,#4a3f35);}' +
    '.cc-free{display:flex;align-items:center;gap:10px;margin:10px auto 0;max-width:420px;padding:8px 12px;border-radius:999px;' +
      'border:1px solid var(--panel-border,#e6d6c1);background:var(--panel,#fffaf3);}' +
    '.cc-free.is-on{border-color:var(--ink,#4a3f35);box-shadow:0 0 0 1px var(--ink,#4a3f35);}' +
    '.cc-free-label{flex-shrink:0;display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--ink,#4a3f35);}' +
    '.cc-free-label i{width:20px;height:20px;border-radius:50%;border:1px solid rgba(0,0,0,0.12);background:#ddd;}' +
    '.cc-bar{position:relative;flex:1;height:32px;cursor:pointer;touch-action:pan-y;outline:none;-webkit-tap-highlight-color:transparent;}' +
    '.cc-bar::before{content:"";position:absolute;left:0;right:0;top:9px;height:14px;border-radius:7px;background:var(--cc-track);' +
      'box-shadow:inset 0 0 0 1px rgba(0,0,0,0.12);}' +
    '.cc-knob{position:absolute;top:2px;width:28px;height:28px;margin-left:-14px;border-radius:50%;box-sizing:border-box;' +
      'border:3px solid #fff;box-shadow:0 0 0 1.5px var(--ink,#4a3f35),0 2px 6px rgba(0,0,0,0.25);pointer-events:none;}' +
    '.cc-free:not(.is-on) .cc-knob{opacity:0.55;}' +
    '.cc-bar:focus-visible .cc-knob{box-shadow:0 0 0 3px var(--accent,#b8563a),0 2px 6px rgba(0,0,0,0.25);}';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  function hex2(n) { var h = Math.round(Math.max(0, Math.min(255, n))).toString(16); return h.length < 2 ? '0' + h : h; }
  function hueHex(h) {
    var s = SAT / 100, l = LIGHT / 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, hp = ((h % 360) + 360) % 360 / 60, x = c * (1 - Math.abs(hp % 2 - 1)), m = l - c / 2;
    var rgb = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
    return '#' + hex2((rgb[0] + m) * 255) + hex2((rgb[1] + m) * 255) + hex2((rgb[2] + m) * 255);
  }
  function hexHue(hex) {
    var v = String(hex).replace('#', '');
    var r = parseInt(v.substr(0, 2), 16) / 255, g = parseInt(v.substr(2, 2), 16) / 255, b = parseInt(v.substr(4, 2), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (!d) return DEFAULT_HUE;
    var h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return Math.round((h * 60 + 360) % 360);
  }
  function isHex(v) { return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v); }
  // 막대 무지개 — 막대에서 고르는 색과 똑같은 채도·밝기로
  var TRACK = (function () {
    var stops = [];
    for (var h = 0; h <= 360; h += 30) stops.push(hueHex(h) + ' ' + (h / 360 * 100).toFixed(1) + '%');
    return 'linear-gradient(to right, ' + stops.join(', ') + ')';
  })();

  function mount(el, o) {
    var IC = window.WalsonIdCard;
    if (!el || !IC) return { refresh: function () {} };
    ensureStyle();
    var getProfile = o.profile, onPick = o.onPick || function () {};
    el.innerHTML = '';
    var root = document.createElement('div');
    root.className = 'cc';
    var row = document.createElement('div');
    row.className = 'cc-row';
    row.setAttribute('role', 'radiogroup');
    row.setAttribute('aria-label', '테두리 색');
    var free = document.createElement('div');
    free.className = 'cc-free';
    var label = document.createElement('span');
    label.className = 'cc-free-label';
    var dot = document.createElement('i');
    label.appendChild(dot);
    label.appendChild(document.createTextNode('직접 고르기'));
    var bar = document.createElement('div');
    bar.className = 'cc-bar';
    bar.tabIndex = 0;
    bar.setAttribute('role', 'slider');
    bar.setAttribute('aria-label', '테두리 색 직접 고르기 — 색 막대를 누르거나 끌어요');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '359');
    bar.style.setProperty('--cc-track', TRACK);
    var knob = document.createElement('span');
    knob.className = 'cc-knob';
    bar.appendChild(knob);
    free.appendChild(label);
    free.appendChild(bar);
    root.appendChild(row);
    root.appendChild(free);
    el.appendChild(root);

    var hue = DEFAULT_HUE;
    function current() { var p = getProfile() || {}; return p.cardColor; }
    function placeKnob() {
      var col = hueHex(hue);
      knob.style.left = (hue / 359 * 100) + '%';
      knob.style.background = col;
      bar.setAttribute('aria-valuenow', String(hue));
    }
    function paint() {
      var p = getProfile() || {}, cur = p.cardColor, custom = isHex(cur);
      var known = IC.CARD_COLORS.some(function (c) { return c.id === cur; });
      var picked = custom ? null : (known ? cur : 'mocha');   // 모르는 값·없음은 모카(기본)
      if (custom) hue = hexHue(cur);
      row.innerHTML = '';
      IC.CARD_COLORS.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', picked === c.id ? 'true' : 'false');
        var d = document.createElement('i');
        d.style.background = c.color || (IC.SIGNALS[p.signal] || IC.SIGNALS.none).color;
        b.appendChild(d);
        b.appendChild(document.createTextNode(c.label + (c.id === 'mocha' ? '(기본)' : '')));
        b.addEventListener('click', function () { onPick(c.id, true); paint(); });
        row.appendChild(b);
      });
      free.classList.toggle('is-on', custom);
      dot.style.background = custom ? cur : '#ddd';
      placeKnob();
    }

    // 막대: 누른 자리 색으로 바로, 끄는 동안 그림은 한 장면에 한 번만 다시(손을 떼면 저장)
    var dragging = false, queued = false;
    function hueAt(clientX) {
      var r = bar.getBoundingClientRect();
      var f = r.width ? (clientX - r.left) / r.width : 0;
      return Math.round(Math.max(0, Math.min(1, f)) * 359);
    }
    function live() {
      free.classList.add('is-on');
      dot.style.background = hueHex(hue);
      placeKnob();
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; onPick(hueHex(hue), false); });
    }
    function finish() {
      onPick(hueHex(hue), true);
      paint();
    }
    bar.addEventListener('pointerdown', function (e) {
      dragging = true;
      try { bar.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      hue = hueAt(e.clientX);
      live();
    });
    bar.addEventListener('pointermove', function (e) { if (!dragging) return; hue = hueAt(e.clientX); live(); });
    function end() { if (!dragging) return; dragging = false; finish(); }
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
    bar.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 30 : 6, k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowUp') hue = Math.min(359, hue + step);
      else if (k === 'ArrowLeft' || k === 'ArrowDown') hue = Math.max(0, hue - step);
      else if (k === 'Home') hue = 0;
      else if (k === 'End') hue = 359;
      else return;
      e.preventDefault();
      finish();
    });

    paint();
    return { refresh: paint, current: current };
  }

  window.WalsonCardColor = { mount: mount, hueHex: hueHex, hexHue: hexHue };
})();
