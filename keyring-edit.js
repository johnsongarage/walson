// 키링 글자 편집 창(2026-11-24 밤 가르시아 "키링 맨 아래 칸에 유의미한 산책 빼고 특기를 골라서 넣는 걸로 해, 또는 직접 적어 넣기 되게
// 편집 가능한 옵션도 주고. 폰에서 키링 편집할 때 키링 보면서 편집할 수 있도록 해 주고. 키링에 입력하는 텍스트는 뚜렷한 글씨체로 하고.
// 글씨 크기 조절도"). [워킹패스] 키링 카드(my-card.html)와 3D 키링 시안(keyring-3d-sample.html)이 같이 쓴다 — 그림은 pass-trace.js 키링판.
// 화면: 위 = 키링 미리 보기 · 아래 = 특기(목록에서 고르기·직접 쓰기) · 이름·견종·번호 · 칸마다 글씨 크기(−/+) · 글씨체(또렷하게·굵게·도트).
//  - 휴대폰 자판이 올라오면 창을 보이는 영역(visualViewport)에 맞춰서 미리 보기가 늘 위에 보인다(image-editor.js와 같은 방식).
//  - 미리 보기는 처음엔 키링 전체, 칸을 고치기 시작하면 그 칸을 크게(휴대폰에서 전체 그림은 글씨가 너무 작다) — [전체 보기]·[크게 보기]로 바꾼다.
//    크게 보기는 그 칸 둘레만 SVG에서 화면 픽셀 그대로 다시 그려서 또렷하다.
//  - 글씨 크기 −/+는 눌러도 입력 칸 초점이 그대로라 자판이 안 내려간다.
//  - 안드로이드 뒤로 가기 = 창 닫기.
// 고친 것은 바로 onChange로 넘긴다(부른 화면이 이 휴대폰에 기억하고 다시 그림). 그림은 이 휴대폰 안에서만 그리고 어디로도 보내지 않는다.
//
// WalsonKeyringEdit.open(cfg)
//   cfg.state    { id, name, type, skill, sizes: { id, name, type, skill }, font: 'clear'|'bold'|'dot' }
//   cfg.defaults { id, name, type, skill } — 입력 칸의 회색 글씨(이름·견종은 비우면 이것으로 그린다) · [내 기록대로]
//   cfg.skills   [{ title, category }] — 특기 목록(없으면 skillList())
//   cfg.opts(state) → pass-trace render 옵션(크게 보기) · cfg.draw(state) → Promise<카드 전체 캔버스>(전체 보기 — 사진까지)
//   cfg.onChange(state) · cfg.onClose(state) · cfg.focus(처음부터 크게 볼 칸 'skill'|'name'|'type'|'id') · cfg.title · cfg.resetLabel · cfg.namesNote
// WalsonKeyringEdit.skillList(CardShared) — 키링 특기 목록: 특기(괄호 속 게임 수치는 빼고) + 칭호
// WalsonKeyringEdit.shortSkill(title) — 키링에 넣을 짧은 특기
(function () {
  'use strict';
  if (window.WalsonKeyringEdit) return;

  var STEPS = [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.35, 1.5];   // 글씨 크기 배수(1 = 칸에 맞춘 기본)
  var ROWS = [
    { k: 'name', ko: '이름', en: 'NAME', max: 12 },
    { k: 'type', ko: '견종', en: 'TYPE', max: 20 },
    { k: 'id', ko: '번호', en: 'ID No.', max: 8 }
  ];
  var KO = { skill: '특기', name: '이름', type: '견종', id: '번호' };
  var FONTS = [{ id: 'clear', label: '또렷하게' }, { id: 'bold', label: '굵게' }, { id: 'dot', label: '도트' }];

  // 특기 문구 끝 괄호(게임 수치 농담 "(소모 HP: 0)")는 키링엔 길어서 뺀다 — 칭호의 "(자칭)"처럼 짧은 건 그대로
  function shortSkill(t) {
    var s = String(t || '').trim(), m = s.match(/^(.*\S)\s*\(([^)]*)\)$/);
    return m && m[2].length > 4 ? m[1] : s;
  }
  function skillList(CS) {
    CS = CS || window.CardShared || {};
    var out = [], seen = {};
    function add(t, c) { if (!t || seen[t]) return; seen[t] = 1; out.push({ title: t, category: c || '특기' }); }
    (CS.SKILLS || []).forEach(function (s) { add(shortSkill(s.title), s.category); });
    (CS.TITLES || []).forEach(function (s) { add(shortSkill(s.title), s.category); });
    return out;
  }
  function catLabel(c) { return String(c || '').replace(/ 계열$/, '').replace(/ & /g, '·'); }   // '생존 & 간식 계열' → '생존·간식'

  var CSS = [
    '.kre{position:fixed;left:0;right:0;top:0;height:100%;z-index:10050;display:flex;flex-direction:column;background:var(--bg,#fffdfd);color:var(--ink,#2a2026);',
    'font-family:Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;overscroll-behavior:contain;-webkit-tap-highlight-color:transparent;}',
    '@media (min-width:640px){.kre{left:50%;width:520px;margin-left:-260px;box-shadow:0 0 0 100vmax rgba(0,0,0,.4);}}',
    '.kre-top{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 14px 8px;}',
    '.kre-top b{font-size:17px;font-weight:900;letter-spacing:-0.01em;}',
    '.kre-done{flex:none;min-height:38px;padding:0 18px;border:0;border-radius:999px;background:var(--hl,var(--accent));color:var(--hl-ink,#fff);font:inherit;font-size:15px;font-weight:800;cursor:pointer;}',
    '.kre-stage{flex:none;position:relative;margin:0 12px;border-radius:16px;background:var(--accent-tint);border:1px solid var(--panel-border);overflow:hidden;}',
    '.kre-stage canvas{position:absolute;display:block;}',
    '.kre-zoom{position:absolute;right:8px;top:8px;min-height:30px;padding:0 11px;border-radius:999px;border:1px solid var(--panel-border);',
    'background:var(--panel);color:var(--ink);font:inherit;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.12);}',
    '.kre-tag{position:absolute;left:8px;top:8px;padding:3px 9px;border-radius:999px;background:var(--panel);color:var(--ink-soft);font-size:11px;font-weight:800;pointer-events:none;}',
    '.kre-tag[hidden],.kre-zoom[hidden]{display:none;}',
    '.kre-form{flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:12px 14px calc(env(safe-area-inset-bottom,0px) + 28px);}',
    '.kre-sec + .kre-sec{margin-top:16px;padding-top:14px;border-top:1px solid var(--panel-border);}',
    '.kre-h{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 8px;margin:0 0 8px;}',
    '.kre-h b{font-size:15px;font-weight:900;}',
    '.kre-h small{font-size:12px;font-weight:700;color:var(--ink-soft);}',
    '.kre-row{display:flex;align-items:center;gap:6px;}',
    '.kre-row + .kre-row{margin-top:8px;}',
    '.kre-lab{flex:none;width:44px;display:flex;flex-direction:column;line-height:1.15;cursor:pointer;}',
    '.kre-lab b{font-size:13px;font-weight:900;}',
    '.kre-lab small{font-size:10px;font-weight:800;color:var(--ink-soft);letter-spacing:.04em;}',
    '.kre-row input,.kre-row textarea{flex:1 1 auto;min-width:0;font:inherit;font-size:16px;font-weight:700;color:var(--ink);padding:9px 10px;border-radius:12px;',
    'border:1.5px solid var(--panel-border);background:var(--panel);}',
    '.kre-row textarea{display:block;resize:none;overflow:hidden;line-height:1.35;}',
    '.kre-row input:focus,.kre-row textarea:focus{outline:2px solid var(--accent);outline-offset:1px;}',
    '.kre-row input::placeholder,.kre-row textarea::placeholder{color:var(--ink-soft);opacity:.6;font-weight:600;}',
    '.kre-sz{flex:none;display:flex;align-items:center;border:1.5px solid var(--panel-border);border-radius:12px;background:var(--panel);}',
    '.kre-sz button{width:34px;height:38px;border:0;background:transparent;color:var(--ink);font:inherit;font-size:19px;font-weight:900;line-height:1;cursor:pointer;}',
    '.kre-sz button:disabled{opacity:.28;cursor:default;}',
    '.kre-sz output{min-width:38px;text-align:center;font-size:12px;font-weight:800;color:var(--ink-soft);}',
    '.kre-tabs{display:flex;gap:6px;overflow-x:auto;margin:10px -14px 0;padding:0 14px 2px;scrollbar-width:none;}',
    '.kre-tabs::-webkit-scrollbar{display:none;}',
    '.kre-tabs button{flex:none;min-height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--panel-border);background:var(--panel);',
    'color:var(--ink-soft);font:inherit;font-size:12.5px;font-weight:800;cursor:pointer;white-space:nowrap;}',
    '.kre-tabs button[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--bg);}',
    '.kre-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}',
    '.kre-chips button{min-height:36px;padding:6px 12px;border-radius:12px;border:1.5px solid var(--panel-border);background:var(--panel);color:var(--ink);',
    'font:inherit;font-size:14px;font-weight:700;text-align:left;cursor:pointer;word-break:keep-all;}',
    '.kre-chips button[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-tint);}',
    '.kre-fonts{display:flex;flex-wrap:wrap;gap:6px;}',
    '.kre-fonts button{min-height:38px;padding:0 16px;border-radius:999px;border:1.5px solid var(--panel-border);background:var(--panel);color:var(--ink);',
    'font:inherit;font-size:15px;font-weight:800;cursor:pointer;}',
    '.kre-fonts button[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-tint);box-shadow:inset 0 0 0 1px var(--accent);}',
    '.kre-note{margin:8px 0 0;font-size:12px;line-height:1.55;color:var(--ink-soft);word-break:keep-all;}',
    '.kre-foot{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}',
    '.kre-foot button{min-height:38px;padding:0 14px;border-radius:12px;border:1px solid var(--panel-border);background:var(--panel);color:var(--ink);',
    'font:inherit;font-size:13px;font-weight:800;cursor:pointer;}'
  ].join('');
  function injectCss() {
    if (document.getElementById('kre-css')) return;
    var st = document.createElement('style'); st.id = 'kre-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function button(text, label) {
    var b = el('button', null, text); b.type = 'button';
    if (label) b.setAttribute('aria-label', label);
    return b;
  }
  // 누를 때 입력 칸 초점을 뺏지 않게(자판이 안 내려감) — 크기 −/+
  function keepFocus(b) { b.addEventListener('mousedown', function (e) { e.preventDefault(); }); }
  // 두 줄 칸(견종·특기) 높이를 글 줄 수에 맞게
  function grow(ta) {
    if (!ta || ta.tagName !== 'TEXTAREA') return;
    ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px';
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function stepIndex(v) {
    var best = 0;
    STEPS.forEach(function (s, i) { if (Math.abs(s - v) < Math.abs(STEPS[best] - v)) best = i; });
    return best;
  }
  function copyState(s) {
    s = s || {};
    var z = s.sizes || {};
    return { id: s.id == null ? '' : String(s.id), name: s.name == null ? '' : String(s.name), type: s.type == null ? '' : String(s.type),
      skill: s.skill == null ? '' : String(s.skill), font: s.font || 'clear',
      sizes: { id: z.id || 1, name: z.name || 1, type: z.type || 1, skill: z.skill || 1 } };
  }

  // SVG 문자열에서 카드의 한 부분(vb 좌표 [x, y, w, h])만 outW×outH 픽셀로 — 브라우저가 그 크기로 다시 그려서 또렷하다
  function regionSvg(svg, vb, outW, outH) {
    return svg.replace(/^<svg([^>]*)>/, function (m, a) {
      return '<svg' + a.replace(/viewBox="[^"]*"/, 'viewBox="' + vb.join(' ') + '"').replace(/width="[^"]*"/, 'width="' + outW + '"')
        .replace(/height="[^"]*"/, 'height="' + outH + '"') + '>';
    });
  }
  function svgImage(svg) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); res(im); };
      im.onerror = function (e) { URL.revokeObjectURL(url); rej(e); };
      im.src = url;
    });
  }

  function open(cfg) {
    cfg = cfg || {};
    injectCss();
    var PT = window.WalsonPassTrace;
    var st = copyState(cfg.state), D = cfg.defaults || {}, list = cfg.skills || skillList();
    var active = cfg.focus || 'skill', zoomed = !!cfg.focus, closed = false, opener = document.activeElement;
    var ctl = {};

    var root = el('div', 'kre');
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', cfg.title || '키링 글자 편집');
    var top = el('div', 'kre-top'), done = button('완료');
    done.className = 'kre-done';
    top.appendChild(el('b', null, cfg.title || '키링 글자 편집')); top.appendChild(done);
    var stage = el('div', 'kre-stage'), cv = el('canvas'), tag = el('span', 'kre-tag'), zbtn = button('');
    cv.setAttribute('aria-hidden', 'true'); zbtn.className = 'kre-zoom'; tag.hidden = true;
    stage.appendChild(cv); stage.appendChild(tag); stage.appendChild(zbtn);
    var form = el('div', 'kre-form');
    root.appendChild(top); root.appendChild(stage); root.appendChild(form);

    // ── 입력 줄(이름표 · 입력 칸 · 글씨 크기 −/+) ──
    // 견종·특기는 두 줄까지(11/24 밤 가르시아 "견종 줄바꿈 가능하게 해 줄래?") — 엔터로 줄을 나누고, 이미 두 줄이면 엔터 = 다 씀.
    // 줄바꿈을 더 넣으면(붙여 넣기 등) 띄어쓰기로. 키링 그림은 사용자가 나눈 자리 그대로 두 줄(pass-trace.js splitText)
    function row(k, ko, en, max, ph) {
      var multi = k === 'type' || k === 'skill';
      var r = el('div', 'kre-row'), lab = el('label', 'kre-lab'), inp = el(multi ? 'textarea' : 'input'), sz = el('div', 'kre-sz');
      lab.appendChild(el('b', null, ko)); lab.appendChild(el('small', null, en));
      if (multi) { inp.rows = 1; inp.setAttribute('enterkeyhint', 'enter'); } else { inp.type = 'text'; inp.setAttribute('enterkeyhint', 'done'); }
      inp.maxLength = max + (multi ? 1 : 0); inp.autocomplete = 'off'; inp.spellcheck = false; inp.id = 'kre-' + k;
      inp.value = st[k]; inp.placeholder = ph || '';
      lab.htmlFor = inp.id;
      inp.addEventListener('focus', function () { touch(k); });
      inp.addEventListener('input', function () {
        if (multi) {
          var v = inp.value.replace(/\r/g, ''), i = v.indexOf('\n');
          if (v !== inp.value || (i >= 0 && v.indexOf('\n', i + 1) >= 0)) {
            var pos = inp.selectionStart;
            inp.value = i >= 0 ? v.slice(0, i + 1) + v.slice(i + 1).replace(/\n/g, ' ') : v;
            try { inp.setSelectionRange(pos, pos); } catch (e) { /* 커서는 끝으로 */ }
          }
          grow(inp);
        }
        st[k] = inp.value; touch(k); changed(); if (k === 'skill') paintChips();
      });
      if (multi) inp.addEventListener('beforeinput', function (e) {   // 이미 두 줄인데 또 줄바꿈 = 다 씀(휴대폰 자판은 keydown이 엔터로 안 올 때가 있다)
        if ((e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph') && inp.value.indexOf('\n') >= 0) { e.preventDefault(); inp.blur(); }
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;   // 한글 조합 중 엔터는 글자 마치기
        if (multi && inp.value.indexOf('\n') < 0) return;   // 첫 엔터 = 줄바꿈
        e.preventDefault(); inp.blur();
      });
      sz.setAttribute('role', 'group'); sz.setAttribute('aria-label', ko + ' 글씨 크기');
      var minus = button('−', ko + ' 글씨 작게'), out = el('output'), plus = button('+', ko + ' 글씨 크게');
      [minus, plus].forEach(function (b, i) {
        keepFocus(b);
        b.addEventListener('click', function () { stepSize(k, i ? 1 : -1); });
      });
      sz.appendChild(minus); sz.appendChild(out); sz.appendChild(plus);
      r.appendChild(lab); r.appendChild(inp); r.appendChild(sz);
      ctl[k] = { input: inp, out: out, minus: minus, plus: plus };
      return r;
    }
    function stepSize(k, d) {
      var i = clamp(stepIndex(st.sizes[k] || 1) + d, 0, STEPS.length - 1);
      st.sizes[k] = STEPS[i];
      touch(k); syncSize(k); changed();
    }
    function syncSize(k) {
      var c = ctl[k], i = stepIndex(st.sizes[k] || 1);
      c.out.textContent = Math.round(STEPS[i] * 100) + '%';
      c.minus.disabled = i === 0; c.plus.disabled = i === STEPS.length - 1;
    }

    // 특기 — 직접 쓰기 줄 + 묶음 탭 + 목록
    var s1 = el('section', 'kre-sec'), h1 = el('div', 'kre-h');
    h1.appendChild(el('b', null, '특기')); h1.appendChild(el('small', null, '목록에서 고르거나 직접 써요 · 엔터로 줄 나누기'));
    s1.appendChild(h1);
    s1.appendChild(row('skill', '특기', 'SKILL', 20, '직접 쓰기(예: 간식 앞 1초 앉아)'));
    var tabs = el('div', 'kre-tabs'), chips = el('div', 'kre-chips');
    tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', '특기 묶음');
    chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', '특기 목록');
    s1.appendChild(tabs); s1.appendChild(chips);
    var cats = [];
    list.forEach(function (it) { if (cats.indexOf(it.category) < 0) cats.push(it.category); });
    function catOfValue(v) { for (var i = 0; i < list.length; i++) if (list[i].title === v) return list[i].category; return null; }
    var cur = catOfValue(st.skill.trim()) || cats[0];
    function paintTabs() {
      tabs.innerHTML = '';
      cats.forEach(function (c) {
        var b = button(catLabel(c));
        b.setAttribute('aria-pressed', String(c === cur));
        b.addEventListener('click', function () { cur = c; paintTabs(); paintChips(); });
        tabs.appendChild(b);
      });
    }
    function paintChips() {
      chips.innerHTML = '';
      var v = st.skill.trim();
      list.forEach(function (it) {
        if (it.category !== cur) return;
        var b = button(it.title);
        b.setAttribute('aria-pressed', String(it.title === v));
        b.addEventListener('click', function () {
          st.skill = it.title; ctl.skill.input.value = it.title; grow(ctl.skill.input);
          touch('skill'); changed(); paintChips();
        });
        chips.appendChild(b);
      });
    }
    form.appendChild(s1);

    // 이름 · 견종 · 번호
    var s2 = el('section', 'kre-sec'), h2 = el('div', 'kre-h');
    h2.appendChild(el('b', null, '이름 · 견종 · 번호')); h2.appendChild(el('small', null, cfg.namesNote || '이름·견종은 비우면 내 기록대로'));
    s2.appendChild(h2);
    ROWS.forEach(function (R) { s2.appendChild(row(R.k, R.ko, R.en, R.max, R.k === 'id' ? '비워도 돼요' : (D[R.k] || ''))); });   // 번호는 비우면 빈칸
    s2.appendChild(el('p', 'kre-note', '견종은 엔터로 줄을 나누면 키링에서도 그 자리에서 두 줄이 돼요(두 줄까지).'));
    form.appendChild(s2);

    // 글씨체(칸에 쓰는 글자 모두)
    var s3 = el('section', 'kre-sec'), h3 = el('div', 'kre-h'), fonts = el('div', 'kre-fonts');
    h3.appendChild(el('b', null, '글씨체')); h3.appendChild(el('small', null, '칸에 쓰는 글자 모두'));
    fonts.setAttribute('role', 'group'); fonts.setAttribute('aria-label', '글씨체');
    ((PT && PT.VFONTS) || FONTS).forEach(function (f) {
      var b = button(f.label);
      b.setAttribute('data-f', f.id);
      if (f.id === 'clear') { b.style.fontFamily = 'Pretendard, sans-serif'; b.style.fontWeight = '800'; }
      if (f.id === 'bold') { b.style.fontFamily = "'Black Han Sans', Pretendard, sans-serif"; b.style.fontWeight = '400'; }
      b.addEventListener('click', function () { st.font = f.id; syncFonts(); touchFont(); changed(); });
      fonts.appendChild(b);
    });
    function syncFonts() {
      Array.prototype.forEach.call(fonts.children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === st.font)); });
    }
    s3.appendChild(h3); s3.appendChild(fonts);
    s3.appendChild(el('p', 'kre-note', '또렷하게가 작은 키링에서도 잘 읽혀요. 도트는 영어·숫자만 도트 글씨(대문자)이고 한글은 굵게와 같아요. ' +
      '글씨 크기 −/+는 칸마다 따로예요 — 칸보다 커지지는 않고, 길면 칸에 맞게 작아져요.'));
    form.appendChild(s3);

    // 처음대로
    var foot = el('div', 'kre-foot'), reset = button(cfg.resetLabel || '내 기록대로'), resetSz = button('글씨 크기 처음대로');
    reset.addEventListener('click', function () {
      ['id', 'name', 'type', 'skill'].forEach(function (k) { st[k] = D[k] == null ? '' : String(D[k]); ctl[k].input.value = st[k]; grow(ctl[k].input); });
      cur = catOfValue(st.skill.trim()) || cur; paintTabs(); paintChips();
      zoomed = false; syncZoomUi(); changed();
    });
    resetSz.addEventListener('click', function () {
      ['id', 'name', 'type', 'skill'].forEach(function (k) { st.sizes[k] = 1; syncSize(k); });
      changed();
    });
    foot.appendChild(reset); foot.appendChild(resetSz);
    form.appendChild(foot);

    // ── 미리 보기 ──
    var full = null, zoomImg = null, seq = 0, timer = 0;
    function touch(k) {
      var was = zoomed && active === k;
      active = k; zoomed = true;
      if (!was) { syncZoomUi(); schedule(true); }
    }
    function touchFont() { if (!zoomed) return; schedule(true); }
    function syncZoomUi() {
      zbtn.textContent = zoomed ? '전체 보기' : '크게 보기';
      zbtn.setAttribute('aria-label', zoomed ? '키링 전체 보기' : KO[active] + ' 칸 크게 보기');
      tag.textContent = KO[active] + ' 칸 크게 · 저장은 전체 그대로';
      tag.hidden = !zoomed || stage.clientHeight < 130;
    }
    zbtn.addEventListener('click', function () { zoomed = !zoomed; syncZoomUi(); schedule(true); });
    function changed() {
      if (cfg.onChange) { try { cfg.onChange(copyState(st)); } catch (e) { /* 부른 화면 쪽 문제는 창을 막지 않게 */ } }
      schedule(false);
    }
    function schedule(now) { clearTimeout(timer); timer = setTimeout(redraw, now ? 0 : 110); }
    function redraw() {
      if (closed) return;
      var my = ++seq;
      if (zoomed && PT && cfg.opts) {
        renderZoom().then(function (z) { if (my !== seq || closed || !z) return; zoomImg = z; paint(); }, function () {});
        return;
      }
      Promise.resolve(cfg.draw ? cfg.draw(copyState(st)) : null).then(function (c) {
        if (my !== seq || closed || !c) return;
        full = c; paint();
      }, function () {});
    }
    // 고치는 칸 둘레를 무대 비율로 넓혀(카드 밖으로는 안 나가게) 화면 픽셀 크기로 다시 그린다
    function renderZoom() {
      var sw = stage.clientWidth, sh = stage.clientHeight, dpr = Math.max(1, window.devicePixelRatio || 1);
      if (!sw || !sh) return Promise.resolve(null);
      var o = cfg.opts(copyState(st)), B = PT.boxes(o), r = B[active] || B.skill, cw = B.card[0], ch = B.card[1];
      var m = Math.max(14, r[2] * 0.06), R = [r[0] - m, r[1] - m, r[2] + 2 * m, r[3] + 2 * m], asp = sw / sh;
      if (R[2] / R[3] < asp) { var nw = R[3] * asp; R[0] -= (nw - R[2]) / 2; R[2] = nw; } else { var nh = R[2] / asp; R[1] -= (nh - R[3]) / 2; R[3] = nh; }
      R[0] = R[2] >= cw ? (cw - R[2]) / 2 : clamp(R[0], 0, cw - R[2]);
      R[1] = R[3] >= ch ? (ch - R[3]) / 2 : clamp(R[1], 0, ch - R[3]);
      var svg = PT.render(o), txt = PT.lastText, vb0 = txt ? txt.vb : [0, 0, cw, ch];
      var ready = txt && PT.fontsReady ? PT.fontsReady(txt) : Promise.resolve();
      return ready.then(function () {
        if (txt && txt.est) { svg = PT.render(o); txt = PT.lastText; return PT.fontsReady(txt); }   // 글꼴을 받은 뒤 정확한 폭으로 다시
      }).then(function () {
        var outW = Math.round(sw * dpr), outH = Math.round(sh * dpr), vb = [vb0[0] + R[0], vb0[1] + R[1], R[2], R[3]];
        return svgImage(regionSvg(svg, vb, outW, outH)).then(function (im) {
          var c = document.createElement('canvas'); c.width = outW; c.height = outH;
          var g = c.getContext('2d');
          g.drawImage(im, 0, 0, outW, outH);
          if (txt && PT.paintText) PT.paintText(g, outW / R[2], { list: txt.list, vb: vb, font: txt.font });
          return { c: c, sw: sw, sh: sh };
        });
      });
    }
    function paint() {
      var sw = stage.clientWidth, sh = stage.clientHeight;
      if (!sw || !sh) return;
      if (zoomed && zoomImg) {
        if (Math.abs(zoomImg.sw - sw) > 1 || Math.abs(zoomImg.sh - sh) > 1) schedule(true);   // 무대 크기가 바뀌었으면 다시 그림(그동안은 늘려 보임)
        cv.style.left = '0px'; cv.style.top = '0px'; cv.style.width = sw + 'px'; cv.style.height = sh + 'px';
        if (cv.width !== zoomImg.c.width || cv.height !== zoomImg.c.height) { cv.width = zoomImg.c.width; cv.height = zoomImg.c.height; }
        var zg = cv.getContext('2d'); zg.clearRect(0, 0, cv.width, cv.height); zg.drawImage(zoomImg.c, 0, 0);
        return;
      }
      if (zoomed || !full) return;   // 크게 보기 그림을 기다리는 중 — 지금 그림 그대로
      var pad = 10, k = Math.min((sw - 2 * pad) / full.width, (sh - 2 * pad) / full.height),
        w = Math.max(1, Math.floor(full.width * k)), h = Math.max(1, Math.floor(full.height * k));
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      cv.style.left = Math.round((sw - w) / 2) + 'px'; cv.style.top = Math.round((sh - h) / 2) + 'px';
      if (window.WalsonView && WalsonView.paint) { WalsonView.paint(cv, full, w, h); return; }
      var dpr = Math.max(1, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      var g = cv.getContext('2d');
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.clearRect(0, 0, cv.width, cv.height); g.drawImage(full, 0, 0, cv.width, cv.height);
    }

    // ── 창 크기: 보이는 영역(자판 위)에 맞추고, 미리 보기는 카드가 다 보이는 만큼(화면 높이의 42%까지) ──
    function cardAspect() {
      if (full) return full.width / full.height;
      try { var B = PT.boxes(cfg.opts(copyState(st))); return B.card[0] / B.card[1]; } catch (e) { return 0.75; }
    }
    function fitView() {
      if (closed) return;
      var vv = window.visualViewport, H = vv ? vv.height : window.innerHeight;
      root.style.height = H + 'px';
      root.style.top = (vv ? vv.offsetTop : 0) + 'px';
      var W = Math.max(100, root.clientWidth - 24), want = Math.min(H * 0.42, W / cardAspect());
      stage.style.height = Math.round(clamp(want, 110, 440)) + 'px';
      syncZoomUi();
      paint();
    }
    var ro = window.ResizeObserver ? new ResizeObserver(function () { paint(); }) : null;
    if (ro) ro.observe(stage);
    if (window.visualViewport) { visualViewport.addEventListener('resize', fitView); visualViewport.addEventListener('scroll', fitView); }
    window.addEventListener('resize', fitView);
    // 입력 칸을 누르면 자판에 가리지 않게 그 줄이 보이도록(창이 줄어든 뒤)
    form.addEventListener('focusin', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'INPUT') return;
      setTimeout(function () { if (!closed && document.activeElement === t && t.scrollIntoView) t.scrollIntoView({ block: 'nearest' }); }, 320);
    });

    // ── 열기·닫기 ──
    var prevHtml = document.documentElement.style.overflow, prevBody = document.body.style.overflow, pushed = false;
    function cleanup() {
      if (closed) return;
      closed = true; clearTimeout(timer);
      if (ro) ro.disconnect();
      if (window.visualViewport) { visualViewport.removeEventListener('resize', fitView); visualViewport.removeEventListener('scroll', fitView); }
      window.removeEventListener('resize', fitView);
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('keydown', onKey);
      root.remove();
      document.documentElement.style.overflow = prevHtml; document.body.style.overflow = prevBody;
      if (cfg.onClose) { try { cfg.onClose(copyState(st)); } catch (e) { /* 그대로 닫힘 */ } }
      if (opener && opener.focus && opener.isConnected) { try { opener.focus({ preventScroll: true }); } catch (e) { /* 초점은 못 돌려도 됨 */ } }
    }
    function close() { if (pushed) { pushed = false; history.back(); } else cleanup(); }   // 뒤로 가기(popstate)가 cleanup을 부른다
    function onPop() { pushed = false; cleanup(); }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
    done.addEventListener('click', function () { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); close(); });
    document.addEventListener('keydown', onKey);

    document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';
    document.body.appendChild(root);
    try { history.pushState({ walsonKeyringEdit: 1 }, ''); pushed = true; window.addEventListener('popstate', onPop); } catch (e) { pushed = false; }
    ['skill', 'name', 'type', 'id'].forEach(syncSize);
    syncFonts(); paintTabs(); paintChips();
    grow(ctl.type.input); grow(ctl.skill.input);   // 창에 붙은 뒤에야 높이를 잴 수 있다
    fitView();
    schedule(true);
    if (zoomed && ctl[active]) ctl[active].input.closest('.kre-row').scrollIntoView({ block: 'nearest' });
    try { done.focus({ preventScroll: true }); } catch (e) { /* 초점 없이 */ }
    return { close: close };
  }

  window.WalsonKeyringEdit = { open: open, skillList: skillList, shortSkill: shortSkill, STEPS: STEPS };
})();
