// 화면 테마(2026-11-15 처음 → 11/16 차분 하나로 줄임 → 11/17 가르시아 "P1 치와와랑 ② 테마로 진행, 색 테마는 고를 수 있게 3가지").
// ② "노랑·갈색·종이": 카드는 종이처럼(흐린 그림자 대신 얇은 선), 주 버튼은 로고처럼(채움 + 진한 테두리 + 아래 그림자),
// 제목·큰 숫자는 Black Han Sans(영수증 제목·도장 글꼴), 바탕에 치와와 무늬(가르시아가 준 그림을 선화로 딴 것 — icons/dog-pattern-*.svg).
// 색만 세 가지에서 고른다(프로필 "화면 색", 이 기기에만 walson_palette). 모양은 하나라 11/16에 없앤 "새 기능마다 두 벌씩 그리기"는
// 다시 생기지 않는다 — 색은 CSS 변수만 바뀐다. 각 화면이 <head>에서 페이지 스타일 뒤에 동기로 불러 덮어쓴다(html[data-palette]로 더 세게).
// 지도 화면·산책 중 화면·인쇄물·운영자 도구에는 무늬를 깔지 않는다. 주민증·영수증처럼 그려서 저장하는 그림은 여기서 안 바뀐다.
// 다른 화면이 쓰던 window.WalsonTheme(name·isBrutal)은 그대로 둔다(name은 늘 'soft', isBrutal은 늘 false).
// 2026-11-19 가르시아(2030 여성 견주 타깃, "크림 화이트 + 젤리핑크 + 소프트 라일락 포인트"): 젤리 핑크를 새 기본 색으로.
// 라일락은 바탕 치와와 무늬에만(icons/dog-pattern-jelly.svg) — 리뉴얼 기획에서 라일락은 '선발대·제보' 표시 몫이라 버튼·글씨엔 안 쓴다.
// 젤리 핑크는 크림 화이트 위에서 2.9:1이라 글씨로 쓰지 않는다 — 면(버튼·고른 것)으로만, 그 위 글씨는 딥 차콜(6.5:1), 핑크 글씨는 진한 핑크(5.8:1).
// 같은 날 가르시아 "블랙과 핑크도 테마로 추가해주고 기존 테마는 고를 수 있게 살려놔": 블랙 핑크(딥 차콜 #121215 + 네온 핑크 #ff4d94 + 핑크 글로우)를
// 더하고, 아침에 젤리 핑크로 바꿨던 딸기우유를 다시 고를 수 있게 살렸다. 블랙은 어두운 색이라 화면마다 박힌 밝은 색(#fff 등)을 theme-black.css가
// 블랙일 때만 덮어쓴다(_dev/theme-black.py로 다시 만듦) — 화면 <style>에 색을 새로 박으면 그 스크립트를 다시 돌리고 블랙으로 확인한다.
(function () {
  var KEY = 'walson_palette';
  try { localStorage.removeItem('walson_theme'); } catch (e) { /* 예전 테마 값(11/15) — 저장소를 못 써도 상관없음 */ }

  // 색 다섯 가지 — 글씨는 바탕·카드 위에서 대비 4.5:1 이상, 버튼 글씨(hlInk)는 버튼 색(hl) 위에서 6:1 이상
  var PALETTES = {
    jelly: { label: '젤리 핑크', desc: '크림 화이트 · 젤리 핑크',
      bg: '#fffdfd', panel: '#ffffff', panelBorder: '#f0d6e2', ink: '#121215', inkSoft: '#6b6b70',
      accent: '#c2185b', accentTint: '#ffe4ef', hl: '#ff5c9d', hlInk: '#121215', line: '#121215', shadowRgb: '18, 18, 21' },
    // 블랙 — line은 진한 테두리 대신 거의 안 보이는 선(버튼은 테두리·그림자 대신 핑크 글로우, 아래 BLACK 규칙)
    black: { label: '블랙 핑크', desc: '딥 차콜 · 네온 핑크', dark: true,
      bg: '#121215', panel: '#1e1e24', panelBorder: '#2e2e38', ink: '#fffdfd', inkSoft: '#a3a3ad',
      accent: '#ff4d94', accentTint: '#3a1f2c', hl: '#ff4d94', hlInk: '#121215', line: '#3a3a46', shadowRgb: '0, 0, 0' },
    yellow: { label: '왈슨 노랑', desc: '노랑 · 진갈색',
      bg: '#f4ead3', panel: '#fffdf7', panelBorder: '#e3d3b4', ink: '#2c2018', inkSoft: '#6b5a46',
      accent: '#8a4a1c', accentTint: '#fbe3a4', hl: '#f2b52f', hlInk: '#2c2018', line: '#2c2018', shadowRgb: '60, 40, 20' },
    sea: { label: '바다', desc: '하늘색 · 남색',
      bg: '#e8eef3', panel: '#fcfdfe', panelBorder: '#cad8e3', ink: '#13233a', inkSoft: '#52657a',
      accent: '#1d5fb5', accentTint: '#d3e5fa', hl: '#6db3f8', hlInk: '#0d1f36', line: '#13233a', shadowRgb: '19, 35, 58' },
    pink: { label: '딸기우유', desc: '분홍 · 자두색',
      bg: '#f8e9ec', panel: '#fffbfc', panelBorder: '#ecd2d8', ink: '#2e1c22', inkSoft: '#75585f',
      accent: '#b02f5b', accentTint: '#fcd7e2', hl: '#ff9ab8', hlInk: '#2e1c22', line: '#2e1c22', shadowRgb: '46, 28, 34' }
  };
  var DEFAULT = 'jelly';
  var key = DEFAULT;
  try { var saved = localStorage.getItem(KEY); if (PALETTES[saved]) key = saved; } catch (e) { /* 기본 색 */ }

  var root = document.documentElement;
  root.setAttribute('data-theme', 'soft');      // 예전 표시(다른 코드가 읽음)
  root.setAttribute('data-palette', key);
  // 어두운 색이면 브라우저 기본 부품(고르기 칸·스크롤바·날짜 칸)도 어둡게
  root.style.colorScheme = PALETTES[key].dark ? 'dark' : 'light';
  // 스크롤바 자리를 늘 비워 둔다 — 내용이 길어져 스크롤바가 생겨도 가운데 정렬·하단 탭이 옆으로 밀리지 않게(2026-11-15)
  root.style.scrollbarGutter = 'stable';

  // 무늬를 깔지 않는 화면 — 지도가 바탕인 화면, 산책 중 큰 시계 화면, 인쇄물, 운영자 도구, 응가 캐릭터(제 그림이 바탕)
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var NO_PATTERN = { 'town.html': 1, 'walk.html': 1, 'poster.html': 1, 'poop-toon.html': 1, 'spot-editor.html': 1,
    'checkin-qr.html': 1, 'visit-kit.html': 1, 'partner-proposal.html': 1, 'simulate.html': 1, 'edit-proto.html': 1,
    'map-sheet-proto.html': 1 };
  if (!NO_PATTERN[page]) root.classList.add('has-pattern');
  // 화면 이름 — theme-black.css가 화면마다 덮어쓸 때 다른 화면의 같은 이름 칸을 건드리지 않게
  root.setAttribute('data-page', page.replace(/\.html$/, ''));

  function vars(p) {
    return '--bg:' + p.bg + ';--panel:' + p.panel + ';--panel-border:' + p.panelBorder + ';--ink:' + p.ink + ';--ink-soft:' + p.inkSoft +
      ';--accent:' + p.accent + ';--accent-ink:' + p.accent + ';--accent-tint:' + p.accentTint + ';--hl:' + p.hl + ';--hl-ink:' + p.hlInk + ';--line:' + p.line +
      ';--shadow-rgb:' + p.shadowRgb + ';';
  }
  var H = 'html[data-palette]';
  var BIG = "'Black Han Sans', Pretendard, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  var css = '';
  Object.keys(PALETTES).forEach(function (k) {
    css += 'html[data-palette="' + k + '"]{' + vars(PALETTES[k]) + '}';
    css += 'html[data-palette="' + k + '"].has-pattern body{background-image:url("icons/dog-pattern-' + k + '.svg?v=1");}';
  });
  css +=
    H + ' body{background-color:var(--bg);}' +
    H + '.has-pattern body{background-size:320px 320px;background-repeat:repeat;}' +
    // 카드 — 종이처럼: 흐린 그림자 대신 얇은 선, 덜 둥근 모서리
    H + ' .panel,' + H + ' .card,' + H + ' .q,' + H + ' .got,' + H + ' .poop-cal,' + H + ' .mode{box-shadow:none !important;border:1.5px solid var(--panel-border) !important;border-radius:12px !important;}' +
    // 주 버튼 — 로고처럼: 채움 + 진한 테두리 + 아래로 떨어진 그림자(누르면 내려앉음)
    H + ' .btn-main,' + H + ' .btn-primary,' + H + ' .btn-save,' + H + ' .report-btn{background:var(--hl) !important;color:var(--hl-ink) !important;border:2px solid var(--line) !important;box-shadow:0 3px 0 var(--line) !important;}' +
    H + ' .btn-main:active,' + H + ' .btn-primary:active,' + H + ' .btn-save:active,' + H + ' .report-btn:active{transform:translateY(2px) !important;box-shadow:0 1px 0 var(--line) !important;}' +
    // 산책 중 화면(walk-screen.css) — 끝내기도 주 버튼 모양, 한 번 누르면(두 번 눌러 끝내기) 진한 색으로
    H + ' .ws-end{background:var(--hl) !important;color:var(--hl-ink) !important;border:2px solid var(--line) !important;box-shadow:0 3px 0 var(--line) !important;}' +
    H + ' .ws-end.is-armed{background:var(--line) !important;color:var(--hl) !important;}' +
    H + ' .ws-tip{background:rgba(var(--shadow-rgb),0.07) !important;}' +
    H + ' .ws-map-btn{border-color:var(--panel-border) !important;}' +
    // 큰 제목·큰 숫자만 Black Han Sans — 굵기가 하나뿐인 두꺼운 글꼴이라 20px 안팎 작은 글씨(이름 줄·카드 제목 h2)는 획이 뭉치고
    // PC 모니터에선 계단처럼 깨져 보여서(2026-11-18 가르시아 캡처 "폰트 깨지는데 맞냐" → "그래라") 그런 것은 본문 글꼴(Pretendard 굵게) 그대로
    // 같은 날 이어서("얘도 이래, 이런 폰트들 다 변경해봐"): 화면 제목(h1, 18~24px)·통계 숫자·끝 화면 요약 줄도 본문 글꼴로 — 이제 [오늘] 큰 숫자(52px)와 산책 중 시계(84~104px)만
    H + ' .today-num,' + H + ' .ws-clock span' +
      '{font-family:' + BIG + ' !important;font-weight:400 !important;letter-spacing:0 !important;}' +
    H + ' .panel>h2,' + H + ' .card>h2{color:var(--ink) !important;}' +
    H + ' .panel>h2,' + H + ' .q>h2,' + H + ' .card>h2,' + H + ' .who-name{font-weight:800 !important;letter-spacing:-0.01em !important;}' +
    // 제목 안의 작은 설명 글씨는 본문 글꼴로 — Black Han Sans는 굵기가 하나뿐이라 굵게 하면 뭉개진다("34분"의 "분"은 같은 글꼴 보통 굵기로)
    H + ' .panel>h2 small,' + H + ' .panel>h2 span,' + H + ' .q>h2 small,' + H + ' .q>h2 span,' + H + ' .card>h2 small,' + H + ' .card>h2 span' +
      '{font-family:Pretendard, -apple-system, \'Apple SD Gothic Neo\', \'Malgun Gothic\', sans-serif;}' +
    H + ' .today-num small,' + H + ' .ws-clock small{font-family:Pretendard, -apple-system, \'Apple SD Gothic Neo\', \'Malgun Gothic\', sans-serif !important;font-weight:700 !important;}' +
    H + ' h1{font-weight:800 !important;letter-spacing:-0.01em !important;}' +
    // 고른 것 — 버튼 색으로
    H + ' .opts button[aria-pressed="true"],' + H + ' .format button[aria-pressed="true"],' + H + ' .theme-opt[aria-pressed="true"]' +
      '{background:var(--hl) !important;color:var(--hl-ink) !important;border-color:var(--line) !important;}' +
    H + ' .theme-opt[aria-pressed="true"] .desc{color:var(--hl-ink) !important;opacity:0.8;}' +
    H + ' .side-toggle button.active{background:var(--line) !important;color:var(--hl) !important;}' +
    // [오늘] 최근 7일 막대·오늘 목표 딱지
    H + ' .week .bar{background:var(--accent-tint) !important;}' +
    H + ' .week .day.is-today .bar{background:var(--hl) !important;box-shadow:inset 0 0 0 1.5px var(--line);}' +
    H + ' .week .day.is-today .lbl{color:var(--ink) !important;}' +
    H + ' .week .day.is-empty .bar{background:var(--panel-border) !important;}' +
    H + ' .today-goal{background:var(--accent-tint) !important;color:var(--ink) !important;}' +
    H + ' .today-goal.is-done{background:var(--line) !important;color:var(--hl) !important;}' +
    // [주민증] 승급 막대·발도장 칩
    H + ' .bar>i{background:var(--hl) !important;box-shadow:inset 0 0 0 1.5px var(--line);}' +
    H + ' .places span.got{border-color:var(--line) !important;background:var(--accent-tint) !important;color:var(--ink) !important;}';

  // 블랙 핑크 — 주 버튼은 진한 테두리·떨어진 그림자 대신 핑크 글로우(한 화면에 주 버튼과 지금 탭 정도만 빛나게).
  // 진한 칸 위 핑크 글씨였던 것(오늘 목표 달성·끝내기 대기·고른 탭)은 블랙에선 핑크 칸 위 검은 글씨로 뒤집는다(대비 6:1).
  var B = 'html[data-palette="black"]', GLOW = '0 0 18px rgba(255, 77, 148, 0.55)';
  css +=
    B + ' .btn-main,' + B + ' .btn-primary,' + B + ' .btn-save,' + B + ' .report-btn,' + B + ' .ws-end' +
      '{border-color:var(--hl) !important;box-shadow:' + GLOW + ' !important;}' +
    B + ' .btn-main:active,' + B + ' .btn-primary:active,' + B + ' .btn-save:active,' + B + ' .report-btn:active' +
      '{box-shadow:0 0 8px rgba(255, 77, 148, 0.45) !important;}' +
    B + ' .ws-end.is-armed{background:var(--ink) !important;color:var(--bg) !important;border-color:var(--ink) !important;box-shadow:none !important;}' +
    B + ' .ws-tip{background:rgba(255, 255, 255, 0.06) !important;}' +
    B + ' .today-goal.is-done,' + B + ' .side-toggle button.active{background:var(--hl) !important;color:var(--hl-ink) !important;}' +
    B + ' .opts button[aria-pressed="true"],' + B + ' .format button[aria-pressed="true"],' + B + ' .theme-opt[aria-pressed="true"]' +
      '{border-color:var(--hl) !important;box-shadow:0 0 12px rgba(255, 77, 148, 0.35) !important;}' +
    B + ' .tabbar a[aria-current="page"]::before{box-shadow:0 0 14px rgba(255, 77, 148, 0.5);}';

  var st = document.createElement('style');
  st.id = 'walson-theme';
  st.textContent = css;
  document.head.appendChild(st);

  // 제목·숫자 글꼴(Black Han Sans) — 화면에 없으면 붙인다
  if (!document.querySelector('link[href*="Black+Han+Sans"]')) {
    var lk = document.createElement('link');
    lk.rel = 'stylesheet';
    lk.href = 'https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap';
    document.head.appendChild(lk);
  }

  function paintMeta(k) {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', PALETTES[k].bg);   // 휴대폰 위쪽 띠 색
  }
  paintMeta(key);

  // 블랙 핑크 밤 지도(11/19 가르시아 "야간에는 길 주변이 노란 색이나 형광색이어야겠는데 너무 어두워"):
  // 지도 그림(OpenStreetMap)에서 길(흰·노랑·주황 — 빨강 값이 땅보다 밝음)만 노랗게 살리고 땅·물·건물은 검게 — theme-black.css가 이 필터를 쓴다.
  // CSS filter의 url()은 같은 문서 안의 SVG만 가리킬 수 있어서 화면마다 숨은 SVG 하나를 넣는다(블랙이 아니면 안 쓰임).
  function addNightFilter() {
    if (document.getElementById('walson-night-svg')) return;
    var d = document.createElement('div');
    d.id = 'walson-night-svg';
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg width="0" height="0" aria-hidden="true"><filter id="walson-night" color-interpolation-filters="sRGB">' +
      '<feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0"/>' +
      '<feComponentTransfer><feFuncR type="linear" slope="40" intercept="-38"/><feFuncG type="linear" slope="40" intercept="-38"/><feFuncB type="linear" slope="40" intercept="-38"/></feComponentTransfer>' +
      '<feComponentTransfer><feFuncR type="linear" slope="0.93" intercept="0.07"/><feFuncG type="linear" slope="0.8" intercept="0.07"/><feFuncB type="linear" slope="0.05" intercept="0.085"/></feComponentTransfer>' +
      '</filter></svg>';
    document.body.appendChild(d);
  }
  if (document.body) addNightFilter(); else document.addEventListener('DOMContentLoaded', addNightFilter);

  window.WalsonTheme = {
    name: 'soft',
    isBrutal: false,
    palette: key,
    palettes: PALETTES,
    themes: { soft: { label: '차분', desc: '', color: PALETTES[key].bg } },
    set: function () { /* 모양 테마는 하나뿐 — 색은 setPalette */ },
    // 화면 색 바꾸기(프로필) — 이 기기에만 저장, 지금 화면에 바로 반영
    setPalette: function (k) {
      if (!PALETTES[k]) return;
      try { localStorage.setItem(KEY, k); } catch (e) { /* 저장 못 해도 지금 화면엔 반영 */ }
      root.setAttribute('data-palette', k);
      root.style.colorScheme = PALETTES[k].dark ? 'dark' : 'light';
      paintMeta(k);
      this.palette = k;
    }
  };
})();
