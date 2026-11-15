// "홈 화면에 추가"(설치)용 최소 서비스워커(2026-09-26). 브라우저가 설치 가능 조건으로 fetch 핸들러를
// 보기 때문에 두는 것이고, 캐싱은 하지 않는다 — 항상 네트워크에서 받아서 배포하면 바로 반영된다.
// 오프라인 지원이 필요해지면 여기에 캐시를 추가(CLAUDE.md "PWA" 원칙).
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function (event) {
  // 지도 타일·OSRM 같은 외부 요청은 건드리지 않고 브라우저가 직접 처리하게 둔다
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // 화면(HTML)은 HTTP 캐시를 거르지 않고 항상 새로 확인한다 — 홈 화면 앱이 예전 화면을 붙잡고 있지 않게(2026-11-15).
  // 스크립트·그림은 화면이 ?v= 번호로 부르므로 보통대로.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request.url, { cache: 'no-cache', credentials: 'same-origin' }).catch(function () { return fetch(event.request); }));
    return;
  }
  event.respondWith(fetch(event.request));
});
