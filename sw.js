// "홈 화면에 추가"(설치)용 최소 서비스워커(2026-09-26). 캐싱은 하지 않는다.
//
// 2026-11-18 가르시아 "1, 2로 고쳐줘" — 폰에서 탭 이동이 느렸다. 11/15부터 탭을 옮길 때마다 화면 파일(HTML)을
// 서버에 새로 확인하고(cache: 'no-cache') 그 답을 기다렸기 때문(휴대폰 흉내 측정: 첫 그림까지 0.35초 → 서비스워커 없을 때 0.18초).
//  ① 화면도 스크립트·그림처럼 브라우저 캐시를 그대로 쓴다 — 배포한 화면은 최대 10분(GitHub Pages 캐시 시간) 뒤에 보인다.
//     스크립트는 화면이 ?v= 번호로 부르므로 예전 화면과 새 스크립트가 섞이지 않는다.
//  ② 크롬(123+)에는 설치할 때 "모든 요청은 서비스워커를 거치지 말고 바로 받아라"(정적 길 안내)를 알려 준다 —
//     탭을 옮길 때 서비스워커를 깨우는 시간까지 없앤다. 이 기능이 없는 브라우저(사파리 등)는 아래 fetch 핸들러로 오지만 손대지 않는다.
// fetch 핸들러는 지우지 않는다 — [오늘] "홈 화면에 추가" 버튼(beforeinstallprompt)이 이걸 볼 수 있어서.
// 오프라인 지원이 필요해지면 길 안내와 핸들러를 함께 고친다(CLAUDE.md "PWA" 원칙).
self.addEventListener('install', function (event) {
  if (event.addRoutes && typeof URLPattern === 'function') {
    // 지원하지 않는 조건이면 길 안내 없이 설치만 된다(그래도 아래 핸들러가 손대지 않으니 느려지지 않음)
    event.waitUntil(event.addRoutes([{ condition: { urlPattern: new URLPattern({}) }, source: 'network' }]).catch(function () {}));
  }
  self.skipWaiting();
});
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function (event) {
  // respondWith를 부르지 않는다 — 브라우저가 서비스워커가 없을 때와 똑같이(캐시 포함) 받는다
  if (event.request.method !== 'GET') return;
});
