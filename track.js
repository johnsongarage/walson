// 사용 통계(2026-11-15 가르시아 "그렇게 해") — 운영자의 구글 시트(Apps Script)로 익명 이벤트를 보낸다. 전역 window.WalsonTrack.
// 목적: 방문 → 주민증(등록) → 산책(활동) → 다시 옴(재사용)을 세고, 어느 홍보 통로가 통했는지 보기.
//
// 보내는 것: 무작위 기기 번호(이 휴대폰에서 만든 것, 이름·전화번호와 연결 안 됨), 시각, 이벤트 이름, 화면 이름,
//           유입 코드(?from=), 홈 화면 앱인지, 샘플 모드·운영자 기기 표시, 이벤트별 작은 값(아래 ALLOWED).
// 보내지 않는 것: 위치·좌표·경로, 발도장 장소 이름, 강아지 이름·사진, 견주 정보, 메모.
// (가게 체크인 QR을 직접 찍은 경우에만 그 가게의 스팟 번호를 보낸다 — GPS가 아니라 손님이 찍은 QR)
// 받는 곳: site-config.js의 trackUrl(운영자가 배포한 Apps Script). 비어 있으면 아무것도 보내지 않는다.
// 고지·거부 방식(2026-11-15 가르시아 결정): 처음부터 보내되, 개인정보 안내 화면에서 "보내지 않기"를 고른 사람과
//   브라우저의 "추적하지 마세요(GPC)" 신호를 켠 사람은 보내지 않는다. 동의는 나중에 가입 단계에서 한꺼번에 받는다.
//   (처음엔 동의제였으나 동의해도 사용자에게 이점이 없어 대부분 거부할 것이라 바꿈 — 개인정보 안내에 변경 이력)
(function () {
  var ID_KEY = 'walson_device';
  var CONSENT_KEY = 'walson_track_consent';   // 'no' = 보내지 않기를 고름, 'yes' = 보내기를 고름(GPC보다 우선), 없음 = 기본(보냄)
  var FIRST_FROM_KEY = 'walson_from_first';
  var LAST_FROM_KEY = 'walson_from_last';

  // 이벤트별로 보낼 수 있는 값 — 여기에 없는 값은 버린다(실수로 위치 같은 걸 보내지 않게)
  var ALLOWED = {
    page_view: [],
    card_made: ['signal', 'size'],
    card_saved: ['what', 'format', 'how'],   // how: save(저장)·share(공유) — 2026-11-16 저장과 공유를 나눔
    walk_start: ['mode'],
    walk_complete: ['mode', 'min_bucket', 'eligible'],
    stamp_new: ['count'],
    keyring_given: [],
    walk_type_done: ['type'],
    share_click: ['what', 'via'],  // via: 어느 화면에서 보냈는지(응가 캐릭터를 산책 끝 화면에서 만들면 walk_end, 2026-11-16)
    store_visit: ['shop'],         // 가게 카운터 체크인 QR(visit.html) — 스팟 번호만, 하루 한 번
    shop_list_open: []             // [동네]에서 동반 가게 목록을 열었음(2026-11-16) — 지도가 실제로 쓰이는지 보려고, 값 없음
  };

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 못 해도 진행 */ } }

  function deviceId() {
    var id = get(ID_KEY);
    if (!id) {
      var rnd = (window.crypto && crypto.getRandomValues) ? Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(8)), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('')
        : Math.random().toString(16).slice(2, 18);
      id = 'w' + rnd;
      set(ID_KEY, id);
    }
    return id;
  }

  // 유입 코드: ?from=poster 또는 ?utm_source=instagram. 처음 온 경로는 따로 기억한다.
  (function readFrom() {
    var m = location.search.match(/[?&](?:from|utm_source)=([^&#]+)/);
    if (!m) return;
    var code = decodeURIComponent(m[1]).replace(/[^0-9A-Za-z_\-가-힣]/g, '').slice(0, 30);
    if (!code) return;
    if (!get(FIRST_FROM_KEY)) set(FIRST_FROM_KEY, code);
    set(LAST_FROM_KEY, code);
  })();

  function consent() { return get(CONSENT_KEY); }
  function gpc() { return navigator.globalPrivacyControl === true; }
  function isOff() { var c = consent(); return c === 'no' || (c !== 'yes' && gpc()); }
  function endpoint() { return (window.WALSON_CONFIG && WALSON_CONFIG.trackUrl) || ''; }
  function pageName() {
    var p = location.pathname.split('/').pop() || 'index.html';
    return p.replace(/\.html$/, '') || 'index';
  }
  function standalone() {
    return !!((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone);
  }

  // 내 컴퓨터에서 띄워 본 화면(localhost·파일로 열기)은 보내지 않는다 — 개발 중 클릭이 시트에 섞이지 않게
  function isLocal() {
    var h = location.hostname;
    return location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '';
  }

  function send(event, props) {
    var url = endpoint();
    // 카톡 창에서 바깥 브라우저로 넘기는 중이거나(inapp.js) 옮기기 주소로 막 열린 경우엔 보내지 않는다 — 한 사람이 두 기기로 세어지지 않게
    if (!url || !ALLOWED[event] || isOff() || isLocal() || window.WALSON_TRACK_SKIP) return;
    var extra = {};
    (ALLOWED[event] || []).forEach(function (k) {
      if (props && props[k] != null) extra[k] = String(props[k]).slice(0, 20);
    });
    var body = JSON.stringify({
      d: deviceId(), t: new Date().toISOString(), e: event, p: pageName(),
      f: get(LAST_FROM_KEY) || '', ff: get(FIRST_FROM_KEY) || '',
      app: standalone() ? 1 : 0,
      s: get('petwalk_sample_mode') === '1' ? 1 : 0,     // 샘플 모드 — 대시보드에서 뺀다
      a: get('petwalk_admin_token') ? 1 : 0,             // 운영자 기기 — 대시보드에서 뺀다(토큰 값은 보내지 않음)
      x: extra
    });
    deliver(url, body);
  }
  function deliver(url, body) {
    // text/plain으로 보내야 Apps Script가 추가 확인(preflight) 없이 받는다. 응답은 기다리지 않는다.
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))) return;
    } catch (e) { /* 아래로 */ }
    try { fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body: body }); } catch (e) { /* 통계는 실패해도 앱은 그대로 */ }
  }

  // 걸은 분을 구간으로만(정확한 값 대신)
  function minBucket(min) { return min < 10 ? '<10' : min < 30 ? '10-30' : min < 60 ? '30-60' : '60+'; }

  function setConsent(v) { set(CONSENT_KEY, v); }
  // 예전 동의제 때 모아 두던 것은 버린다
  try { sessionStorage.removeItem('walson_track_queue'); } catch (e) { /* 무시 */ }

  window.WalsonTrack = {
    send: send, minBucket: minBucket,
    consent: consent, isOff: isOff, gpc: gpc,
    setConsent: setConsent,
    enabled: function () { return !!endpoint(); }
  };

  send('page_view');
})();
