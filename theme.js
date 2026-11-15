// 화면 테마 고르기(2026-11-15). 뉴브루탈(brutal.css)이 너무 튀어서 사용자가 고를 수 있게 함.
// - 'soft'(차분, 기본값): 원래 파스텔 화면. brutal.css를 아예 불러오지 않는다.
// - 'brutal'(뉴브루탈): 이 스크립트 바로 뒤에 brutal.css를 끼워 넣어 각 화면의 <style>을 덮어쓴다.
// 각 화면의 <style> 뒤(예전 brutal.css <link> 자리)에서 동기로 불러야 덮어쓰는 순서가 맞다.
// 탭바·지도 핀·카드 그림처럼 JS가 직접 칠하는 곳은 window.WalsonTheme.isBrutal을 보고 갈라 그린다.
// 고른 값은 이 기기 localStorage에만 둔다(서버로 보내지 않음).
(function () {
  var KEY = 'walson_theme';
  var BRUTAL_CSS = 'brutal.css?v=3';
  var THEMES = {
    soft:   { label: '차분',     desc: '크림색 바탕, 둥근 모서리, 부드러운 그림자', color: '#f7ede2' },
    brutal: { label: '뉴브루탈', desc: '노랑 바탕, 굵은 검정 테두리, 각진 모서리',  color: '#F2B833' }
  };
  var DEFAULT = 'soft';

  var name = null;
  try { name = localStorage.getItem(KEY); } catch (e) { /* 저장소를 못 쓰면 기본값 */ }
  if (!THEMES[name]) name = DEFAULT;

  document.documentElement.setAttribute('data-theme', name);
  // 스크롤바 자리를 늘 비워 둔다 — 내용이 길어져 스크롤바가 생겨도 가운데 정렬·하단 탭이 옆으로 밀리지 않게(2026-11-15)
  document.documentElement.style.scrollbarGutter = 'stable';

  if (name === 'brutal') {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = BRUTAL_CSS;
    var me = document.currentScript;
    if (me && me.parentNode) me.parentNode.insertBefore(link, me.nextSibling);
    else document.head.appendChild(link);
  }

  // 주소창·상태바 색도 테마에 맞춘다
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEMES[name].color);

  window.WalsonTheme = {
    name: name,
    isBrutal: name === 'brutal',
    themes: THEMES,
    // 바꾸면 화면을 다시 불러서 CSS·탭바·핀·카드가 한 번에 새 테마로 그려지게 한다
    set: function (next) {
      if (!THEMES[next] || next === name) return;
      try { localStorage.setItem(KEY, next); } catch (e) {
        alert('이 브라우저에서는 테마를 저장할 수 없어요(사생활 보호 모드 등).');
        return;
      }
      location.reload();
    }
  };
})();
