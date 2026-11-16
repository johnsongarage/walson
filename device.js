// 기기 기능 한곳(2026-11-17 리팩토링 — 예약 작업 "서버·네이티브 대비", store.js·walk-engine.js 다음 단계). 전역 window.WalsonDevice.
// 브라우저(PWA)에서 쓰는 기기 기능을 여기 모았다 — 나중에 앱(Capacitor 등)으로 감쌀 때 이 파일만 바꾸면 되게:
//   화면 켜 두기(Wake Lock) · 진동 · 공유 창(Web Share) · 기기 종류(휴대폰인지·아이폰인지 — 저장·공유 방식을 고를 때)
// 여기는 "기능"만 한다. 언제 켜 두고 언제 울릴지(정책), 안 될 때 무엇을 할지(내려받기·주소 복사·안내 글)는 부르는 화면이 정한다.
// 동작은 옮기기 전과 같다(각 화면에 있던 코드를 그대로 옮김). 아무것도 저장하거나 어디로 보내지 않는다.
// 다른 기기 기능: 카메라로 QR 찍기는 qr-scan.js(WalsonQR — 찍히면 여기 진동을 씀) · 위치는 walk-engine.js·geo.js · 저장은 store.js.
//
// 쓰는 법(먼저 불러야 하는 것 없음 — 이 파일을 쓰는 스크립트보다 앞에 둔다):
//   WalsonDevice.keepAwake.request() → Promise<true|false>  화면이 저절로 꺼지지 않게 잡는다. 안 되는 기기·거절이면 false.
//                                       잡혀 있어도 또 요청한다(예전 그대로 — 다시 잡을지는 부르는 쪽이 held()로 가린다)
//   WalsonDevice.keepAwake.release()   푼다(잡혀 있지 않으면 아무것도 안 함)
//   WalsonDevice.keepAwake.held()      지금 잡혀 있는지 — 화면이 숨겨지면 브라우저가 저절로 풀어 false가 된다
//   WalsonDevice.vibrate(pattern, { onlyAfterTap })  진동(밀리초 하나 또는 [울림, 쉼, 울림…]). 진동이 없는 기기(아이폰 등)는 조용히 false.
//                                       onlyAfterTap: 이 화면을 한 번이라도 누른 뒤에만 — 누르기 전엔 브라우저가 막는다(주머니에서 막 꺼내 연 화면)
//   WalsonDevice.canShare()            공유 창(카톡·인스타 등을 고르는 휴대폰 창)이 있는지 — 주소·글 보내기
//   WalsonDevice.canShare(data)        이 내용(그림 파일 등)을 공유 창에 넘길 수 있는지: true 된다 · false 안 된다 ·
//                                       null 공유 창은 있는데 브라우저가 미리 답하지 못한다(물어볼 길(canShare)이 없는 예전 브라우저)
//                                       → 그림 공유는 true일 때만(if 문 그대로) 하고, "해 보고 안 되면 안내"하는 곳만 null도 해 본다(!== false)
//   WalsonDevice.share(data)           공유 창을 연다 — navigator.share 그대로(Promise: 보내면 이행, 그냥 닫으면 AbortError로 거절).
//                                       누른 그 자리에서 바로 부를 것(기다렸다 부르면 아이폰이 막는다). 공유 창이 없으면(canShare() false) 부르지 말 것
//   WalsonDevice.isMobile()            휴대폰·태블릿인지(공유 창을 쓸지, 버튼 글 "저장·공유"/"이미지 저장") — save-image.js에서 옮김
//   WalsonDevice.isIOS()               아이폰·아이패드인지(내려받으면 사진 앱이 아니라 '파일' 앱으로 가서 길게 눌러 저장을 안내) — save-image.js에서 옮김
(function () {
  // ── 화면 켜 두기(Wake Lock) — 예전 walk.html requestWakeLock·releaseWakeLock 그대로 ──
  var lock = null;
  function requestKeepAwake() {
    if (!('wakeLock' in navigator)) return Promise.resolve(false);
    return navigator.wakeLock.request('screen').then(function (l) {
      lock = l;
      // 브라우저가 풀면(화면이 숨겨짐 등) 잡혀 있지 않은 것으로
      l.addEventListener('release', function () { if (lock === l) lock = null; });
      return true;
    }).catch(function () { return false; });
  }
  function releaseKeepAwake() {
    if (lock) lock.release().catch(function () {});
    lock = null;
  }

  // ── 진동 ── 예전 walk.html(발도장 알림, 누른 뒤에만)·qr-scan.js·dex.html(찍힘) 그대로
  function vibrate(pattern, opts) {
    try {
      if (!navigator.vibrate) return false;
      if (opts && opts.onlyAfterTap && navigator.userActivation && !navigator.userActivation.hasBeenActive) return false;
      return navigator.vibrate(pattern);
    } catch (e) { return false; }   // 진동 없는 기기(아이폰 등)
  }

  // ── 공유 창(Web Share) ── 예전 save-image.js·poop-toon.html(그림 파일)·dex.html·walk-type.html(주소)의 확인을 그대로 나눈다
  function canShare(data) {
    if (data == null) return !!navigator.share;
    if (!navigator.canShare) return navigator.share ? null : false;
    try { return !!navigator.canShare(data); } catch (e) { return false; }
  }
  function share(data) { return navigator.share(data); }   // 감싸지 않는다 — 누른 직후(사용자 동작) 그대로 부르고 같은 Promise를 돌려준다

  // ── 기기 종류 ── 예전 save-image.js 그대로
  function isMobile() {
    var ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
    // 아이패드 사파리는 맥처럼 보인다 — 터치가 있으면 휴대 기기로 본다
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
    return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches);
  }
  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  }

  window.WalsonDevice = {
    keepAwake: { request: requestKeepAwake, release: releaseKeepAwake, held: function () { return !!lock; } },
    vibrate: vibrate,
    canShare: canShare,
    share: share,
    isMobile: isMobile,
    isIOS: isIOS
  };
})();
