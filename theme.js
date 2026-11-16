// 화면 테마(2026-11-15 처음 만듦 → 2026-11-16 차분 하나로 줄임, 가르시아 "서비스 줄이기 6번").
// 뉴브루탈(brutal.css)은 지웠다 — 새 기능마다 두 벌씩 그리던 일을 없애려고. 예전에 뉴브루탈을 고른 기기도 차분으로 보인다.
// 다른 화면이 쓰던 window.WalsonTheme(name·isBrutal)은 그대로 둔다(isBrutal은 늘 false) — 새 코드는 테마를 따질 필요 없음.
// 각 화면 <head>에서 동기로 불러 data-theme 표시와 스크롤바 자리만 잡는다.
(function () {
  var KEY = 'walson_theme';
  // 예전에 고른 값이 남아 있으면 지운다(이 기기에만 있던 값)
  try { localStorage.removeItem(KEY); } catch (e) { /* 저장소를 못 써도 상관없음 */ }

  document.documentElement.setAttribute('data-theme', 'soft');
  // 스크롤바 자리를 늘 비워 둔다 — 내용이 길어져 스크롤바가 생겨도 가운데 정렬·하단 탭이 옆으로 밀리지 않게(2026-11-15)
  document.documentElement.style.scrollbarGutter = 'stable';

  window.WalsonTheme = {
    name: 'soft',
    isBrutal: false,
    themes: { soft: { label: '차분', desc: '크림색 바탕, 둥근 모서리, 부드러운 그림자', color: '#f7ede2' } },
    set: function () { /* 테마는 하나뿐 */ }
  };
})();
