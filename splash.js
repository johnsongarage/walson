// 왈슨 시작 화면(2026-11-14) — #splash를 2초 보여 주고 서서히 지운다. 누르면 바로 넘어간다.
// 같은 세션에서 두 번째로 열 때는 <head>의 한 줄짜리 스크립트가 .no-splash를 붙여 처음부터 안 보인다.
// 쓰는 화면: index.html([오늘]), town.html([동네], 앱 첫 화면), start.html(공원 QR 첫 화면). 모두 같은 세션 표시를 써서 한 번만.
// 홈 화면에 설치한 앱으로 열면 각 화면 <head> 한 줄이 .no-splash를 붙여 안 보인다(휴대폰 시작 화면과 두 번이 되지 않게, 11/18).
(function () {
  var KEY = 'walson_splash_shown';
  var SHOW_MS = 2000;
  var el = document.getElementById('splash');
  if (!el) return;
  if (document.documentElement.classList.contains('no-splash')) { el.remove(); return; }
  var done = false;
  function leave() {
    if (done) return;
    done = true;
    // '이번에 봤음'은 다 보여 준 뒤에 남긴다(11/18) — 처음 온 사람은 [동네]가 샘플을 켜며 한 번 새로 열리는데,
    // 시작할 때 남기면 새로 열린 화면에선 시작 화면이 0.4초 만에 끊겼다
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* 다음에 또 보일 뿐 */ }
    el.classList.add('is-leaving');
    // 시작 화면을 띄울 땐 그 전 빈 화면도 같은 크림으로 칠해 둔다(각 화면 <head> 한 줄) — 다 지운 뒤 원래 바탕으로
    setTimeout(function () { el.remove(); document.documentElement.style.background = ''; }, 500);
  }
  el.addEventListener('click', leave);
  setTimeout(leave, SHOW_MS);
})();
