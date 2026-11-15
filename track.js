// 사용 통계(2026-11-15 가르시아 "그렇게 해") — 운영자의 구글 시트(Apps Script)로 익명 이벤트를 보낸다. 전역 window.WalsonTrack.
// 목적: 방문 → 주민증(등록) → 산책(활동) → 다시 옴(재사용)을 세고, 어느 홍보 통로가 통했는지 보기.
//
// 보내는 것: 무작위 기기 번호(이 휴대폰에서 만든 것, 이름·전화번호와 연결 안 됨), 시각, 이벤트 이름, 화면 이름,
//           유입 코드(?from=), 홈 화면 앱인지, 샘플 모드·운영자 기기 표시, 이벤트별 작은 값(아래 ALLOWED).
// 보내지 않는 것: 위치·좌표·경로, 발도장 장소 이름, 강아지 이름·사진, 견주 정보, 메모.
// 받는 곳: site-config.js의 trackUrl(운영자가 배포한 Apps Script). 비어 있으면 아무것도 보내지 않는다.
// 동의(2026-11-15): 개인정보 안내에 "보내는 기능을 넣으면 따로 동의를 받겠다"고 약속했으므로,
//   처음 오면 아래쪽에 짧은 안내를 띄우고 "괜찮아요"를 누른 뒤에만 보낸다. 그 전 이벤트는 이 탭에만 잠시 모아 두었다가
//   동의하면 한꺼번에 보내고, "보내지 않기"면 버린다. 개인정보 안내 화면에서 언제든 바꿀 수 있다.
(function () {
  var ID_KEY = 'walson_device';
  var CONSENT_KEY = 'walson_track_consent';   // 'yes' | 'no' | 없음(아직 안 물어봄)
  var QUEUE_KEY = 'walson_track_queue';       // 동의 전 이벤트(sessionStorage)
  var FIRST_FROM_KEY = 'walson_from_first';
  var LAST_FROM_KEY = 'walson_from_last';

  // 이벤트별로 보낼 수 있는 값 — 여기에 없는 값은 버린다(실수로 위치 같은 걸 보내지 않게)
  var ALLOWED = {
    page_view: [],
    card_made: ['signal'],
    card_saved: ['what', 'format'],
    walk_start: ['mode'],
    walk_complete: ['mode', 'min_bucket', 'eligible'],
    stamp_new: ['count'],
    keyring_given: [],
    walk_type_done: ['type'],
    share_click: ['what']
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
  function isOff() { return consent() !== 'yes'; }
  function endpoint() { return (window.WALSON_CONFIG && WALSON_CONFIG.trackUrl) || ''; }
  function pageName() {
    var p = location.pathname.split('/').pop() || 'index.html';
    return p.replace(/\.html$/, '') || 'index';
  }
  function standalone() {
    return !!((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone);
  }

  function send(event, props) {
    var url = endpoint();
    if (!url || !ALLOWED[event] || consent() === 'no') return;
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
    if (consent() !== 'yes') { queue(body); showBanner(); return; }
    deliver(url, body);
  }
  function queue(body) {
    try {
      var q = JSON.parse(sessionStorage.getItem(QUEUE_KEY) || '[]');
      if (q.length < 30) q.push(body);
      sessionStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (e) { /* 못 모으면 버림 */ }
  }
  function flush() {
    var q = [];
    try { q = JSON.parse(sessionStorage.getItem(QUEUE_KEY) || '[]'); sessionStorage.removeItem(QUEUE_KEY); } catch (e) { q = []; }
    var url = endpoint();
    if (url) q.forEach(function (b) { deliver(url, b); });
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

  // ── 동의 안내(아래쪽 작은 띠) ── 산책 중·끝 화면에서는 가리지 않게 띄우지 않는다
  var NO_BANNER = { go: 1, walk: 1, 'walk-end': 1, privacy: 1 };
  var bannerShown = false;
  function setConsent(v) {
    set(CONSENT_KEY, v);
    if (v === 'yes') flush(); else { try { sessionStorage.removeItem(QUEUE_KEY); } catch (e) { /* 무시 */ } }
    var b = document.getElementById('walson-consent'); if (b) b.remove();
  }
  function showBanner() {
    if (bannerShown || consent() || NO_BANNER[pageName()] || !endpoint()) return;
    bannerShown = true;
    function build() {
      var css = document.createElement('style');
      css.textContent =
        '#walson-consent{position:fixed;left:12px;right:12px;bottom:calc(var(--tabbar-h, 0px) + 12px);z-index:1500;max-width:440px;margin:0 auto;' +
        'background:#fffaf3;color:#4a3f35;border:1px solid #e6d6c1;border-radius:14px;padding:12px 14px;box-shadow:0 6px 20px rgba(74,63,53,0.25);' +
        'font:13px/1.5 Pretendard,-apple-system,"Malgun Gothic",sans-serif;}' +
        '#walson-consent b{display:block;font-size:14px;margin-bottom:2px;}' +
        '#walson-consent a{color:#b8563a;font-weight:700;}' +
        '#walson-consent .row{display:flex;gap:8px;margin-top:8px;}' +
        '#walson-consent button{flex:1;font:800 13px Pretendard,-apple-system,sans-serif;padding:9px;border-radius:10px;border:1px solid #e6d6c1;background:#fff;color:#4a3f35;cursor:pointer;}' +
        '#walson-consent button.yes{background:#b8563a;border-color:#b8563a;color:#fff;}' +
        '[data-theme="brutal"] #walson-consent{border:3px solid #000;border-radius:0;box-shadow:5px 5px 0 #000;color:#000;}' +
        '[data-theme="brutal"] #walson-consent button{border:3px solid #000;border-radius:0;color:#000;}' +
        '[data-theme="brutal"] #walson-consent button.yes{background:#FF6BB5;}';
      document.head.appendChild(css);
      var box = document.createElement('div');
      box.id = 'walson-consent';
      box.setAttribute('role', 'dialog');
      box.innerHTML = '<b>사용 통계를 보내도 될까요?</b>' +
        '어떤 기능을 눌렀는지만 익명 번호로 운영자에게 보내요. 위치·이름·사진은 보내지 않아요. ' +
        '<a href="privacy.html#stats">자세히</a>' +
        '<div class="row"><button type="button" class="no">보내지 않기</button><button type="button" class="yes">괜찮아요</button></div>';
      box.querySelector('.yes').addEventListener('click', function () { setConsent('yes'); });
      box.querySelector('.no').addEventListener('click', function () { setConsent('no'); });
      document.body.appendChild(box);
    }
    if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
  }

  window.WalsonTrack = {
    send: send, minBucket: minBucket,
    consent: consent, isOff: isOff,
    setConsent: setConsent,
    enabled: function () { return !!endpoint(); }
  };

  send('page_view');
})();
