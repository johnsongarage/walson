// 앱 안 QR 찍기(2026-11-16) — 전역 window.WalsonQR. [동네]·산책 화면에서 가게 체크인 QR을, 도감(dex.html)에서 상대 도감 QR을 찍는다.
//
// 왜: 아이폰은 휴대폰 카메라 앱으로 QR을 찍으면 사파리가 열린다. 사파리와 홈 화면 앱은 저장 공간이 따로라
//     가게 방문 도장이 지금 쓰는 앱에 안 남을 수 있다. 앱 안에서 찍으면 지금 쓰는 앱에 바로 남는다.
//     (가르시아 "0번 고치고 1번, 3번도 진행해줘" — 3번 = 장소 QR을 앱 안에서 찍기)
// 카메라 화면에서 QR 글자만 읽고, 사진은 저장하거나 보내지 않는다.
// 크롬 안드로이드는 BarcodeDetector, 없으면(아이폰 등) jsQR(MIT)을 그때 불러온다.
// 화면(덮는 판 · 영상 · 네모 · 안내 · 닫기)은 이 파일이 만든다. 찍히면 진동(device.js — 먼저 불러 둘 것).
// 2026-11-17 리팩토링: 도감(dex.html)에 따로 있던 같은 카메라 코드를 이 파일 하나로 — 도감 글·모양은 아래 선택 사항으로 넘긴다.
//   나중에 앱(Capacitor 등)으로 감싸면 이 파일만 기기 QR 읽기로 바꾸면 된다.
//
// 쓰는 법: WalsonQR.scan({ title, hint, onText: function (text) { return true(닫기) | '안내 문구'(계속 찍기) } })
//   선택 사항(없으면 가게 QR 찍기 그대로):
//   texts: { explain(처음 카메라 설명 — 확인 창), noCamera(카메라를 못 쓰는 브라우저 — 알림 창), denied(권한 꺼짐),
//            failed(카메라를 못 켬), noReader(QR 읽기 도구를 못 불러옴) } — 바꿀 글만
//   onOpen: 카메라 화면을 띄우기 바로 전(설명·카메라 확인을 지난 뒤)에 부른다 — 도감은 겹쳐 뜬 다른 판을 닫는다(이 안에서 close()를 불러도 된다)
//   pauseMs: 안내 문구를 띄운 뒤 다시 읽기까지 쉬는 시간(기본 1500 — 같은 QR을 계속 읽어 안내가 깜빡이지 않게. 도감은 예전처럼 0)
//   sheet: true면 아래에서 올라오는 판 모양(도감 화면에 있던 모양 그대로)
(function () {
  var CAMERA_KEY = 'petwalk_camera_explained';   // 가게 QR·도감이 같이 쓰는 키 — 한 번 설명했으면 다시 묻지 않는다
  // 기본 글(가게 QR 찍기). 도감은 texts로 자기 글을 넘긴다
  var TEXTS = {
    explain: 'QR을 찍으려면 카메라가 필요해요.\n화면에서 QR 글자만 읽고, 사진은 저장하거나 보내지 않아요. 카메라를 켤까요?',
    noCamera: '이 브라우저에서는 카메라를 쓸 수 없어요. 휴대폰 기본 카메라 앱으로 QR을 찍어 주세요.',
    denied: '카메라 권한이 꺼져 있어요. 휴대폰 설정에서 이 앱(또는 브라우저)의 카메라를 허용해 주세요.',
    failed: '카메라를 켜지 못했어요. 휴대폰 기본 카메라 앱으로 QR을 찍어 주세요.',
    noReader: 'QR 읽기 도구를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'
  };
  function textOf(o, k) { return (o && o.texts && o.texts[k]) || TEXTS[k]; }
  // QR 읽기(jsQR 1.4.0, Apache-2.0)는 앱 안에 둔다(2026-11-23 밤 출시 점검 — CDN을 못 받으면 공원에서 QR 교환이 멈춰서). vendor/jsqr/LICENSE
  var JSQR_URL = 'vendor/jsqr/jsQR.js?v=1.4.0';
  // Phosphor Icons(MIT) QrCode regular — 앱의 다른 아이콘과 같은 묶음(@phosphor-icons/core 2.1.1)
  var QR_PATH = 'M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm0,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48ZM200,40H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-64,72V144a8,8,0,0,1,16,0v32a8,8,0,0,1-16,0Zm80-16a8,8,0,0,1-8,8H184v40a8,8,0,0,1-8,8H144a8,8,0,0,1,0-16h24V144a8,8,0,0,1,16,0v8h24A8,8,0,0,1,216,160Zm0,32v16a8,8,0,0,1-16,0V192a8,8,0,0,1,16,0Z';
  function icon(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="' + QR_PATH + '"/></svg>';
  }

  var overlay = null, video, titleEl, hintEl, msgEl;
  var stream = null, scanning = false, detector = null, opts = null, waitUntil = 0, pauseMs = 1500;
  var canvas = null, ctx = null;

  function build() {
    if (overlay) return;
    var css =
      '.wqr{position:fixed;inset:0;z-index:5000;background:rgba(20,16,12,.72);display:flex;align-items:center;justify-content:center;' +
        'padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));' +
        'font-family:Pretendard,-apple-system,"Malgun Gothic",sans-serif;}' +
      '.wqr[hidden]{display:none;}' +
      '.wqr-card{width:min(100%,380px);box-sizing:border-box;padding:18px 18px 14px;text-align:center;word-break:keep-all;' +
        'background:var(--panel,#fffaf3);color:var(--ink,#4a3f35);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);' + '}' +
      '.wqr-title{margin:0;font-size:18px;font-weight:900;}' +
      '.wqr-hint{margin:6px 0 0;font-size:13px;line-height:1.5;color:' + '#6b5d4e' + ';}' +
      '.wqr-box{position:relative;width:min(76vw,300px);aspect-ratio:1/1;margin:12px auto 8px;overflow:hidden;background:#222;' + 'border-radius:18px;' + '}' +
      '.wqr-box video{width:100%;height:100%;object-fit:cover;display:block;}' +
      '.wqr-frame{position:absolute;inset:16%;border:3px solid rgba(255,255,255,.92);box-shadow:0 0 0 999px rgba(0,0,0,.25);' + 'border-radius:14px;' + '}' +
      '.wqr-msg{min-height:20px;margin:0;font-size:13px;font-weight:800;line-height:1.5;color:var(--accent,#b8563a);}' +
      '.wqr-close{margin-top:10px;width:100%;padding:12px;font:inherit;font-size:15px;font-weight:800;cursor:pointer;' +
        'background:#fff;color:var(--ink,#4a3f35);border:1px solid var(--panel-border,#e6d6c1);border-radius:999px;' + '}' +
      // 아래에서 올라오는 판(sheet: true) — 도감(dex.html)의 겹쳐 뜨는 판·버튼과 같은 값
      '.wqr.is-sheet{align-items:flex-end;padding:0;background:rgba(40,32,26,.6);}' +
      '.wqr.is-sheet .wqr-card{width:100%;max-width:480px;max-height:100%;overflow-y:auto;padding:20px 18px calc(20px + env(safe-area-inset-bottom,0px));' +
        'word-break:normal;border-radius:22px 22px 0 0;box-shadow:none;}' +
      '.wqr.is-sheet .wqr-title{margin:10px 0 4px;font-size:22px;}' +
      '.wqr.is-sheet .wqr-hint{margin:0 0 14px;line-height:1.55;}' +
      '.wqr.is-sheet .wqr-box{width:min(84vw,340px);margin:6px auto 10px;}' +
      '.wqr.is-sheet .wqr-frame{border-color:rgba(255,255,255,.9);}' +
      '.wqr.is-sheet .wqr-msg{font-weight:700;line-height:normal;}' +
      '.wqr.is-sheet .wqr-close{display:flex;align-items:center;justify-content:center;margin-top:0;padding:14px 10px;font-size:14px;' +
        'background:var(--panel,#fffaf3);border-radius:14px;}';
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    overlay = document.createElement('div');
    overlay.className = 'wqr';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'wqr-title');
    overlay.innerHTML =
      '<div class="wqr-card">' +
        '<p class="wqr-title" id="wqr-title"></p>' +
        '<p class="wqr-hint"></p>' +
        '<div class="wqr-box"><video playsinline muted></video><div class="wqr-frame"></div></div>' +
        '<p class="wqr-msg" role="status"></p>' +
        '<button type="button" class="wqr-close">닫기</button>' +
      '</div>';
    document.body.appendChild(overlay);
    titleEl = overlay.querySelector('.wqr-title');
    hintEl = overlay.querySelector('.wqr-hint');
    msgEl = overlay.querySelector('.wqr-msg');
    video = overlay.querySelector('video');
    overlay.querySelector('.wqr-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay && !overlay.hidden) close(); });
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  }

  function loadJsQR() {
    if (window.jsQR) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = JSQR_URL;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('jsQR')); };
      document.head.appendChild(s);
    });
  }
  function stopCamera() {
    scanning = false;
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (video) video.srcObject = null;
  }
  function close() {
    stopCamera();
    if (overlay) overlay.hidden = true;
    opts = null;
  }
  function setMsg(t) { if (msgEl) msgEl.textContent = t || ''; }

  function scan(o) {
    o = o || {};
    var explained = false;
    try { explained = localStorage.getItem(CAMERA_KEY) === '1'; } catch (e) { /* 다시 설명 */ }
    if (!explained) {
      if (!confirm(textOf(o, 'explain'))) return;
      try { localStorage.setItem(CAMERA_KEY, '1'); } catch (e) { /* 다음에 다시 설명 */ }
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(textOf(o, 'noCamera'));
      return;
    }
    if (o.onOpen) o.onOpen();
    build();
    stopCamera();
    opts = o;
    waitUntil = 0;
    pauseMs = o.pauseMs != null ? o.pauseMs : 1500;
    overlay.className = 'wqr' + (o.sheet ? ' is-sheet' : '');
    titleEl.textContent = o.title || 'QR 찍기';
    hintEl.textContent = o.hint || '';
    overlay.hidden = false;
    setMsg('카메라를 켜는 중…');
    var mine = o;   // 기다리는 동안 닫았다 다시 열면 앞의 것은 버린다
    var useNative = 'BarcodeDetector' in window;
    var prep = useNative
      ? Promise.resolve(window.BarcodeDetector.getSupportedFormats ? BarcodeDetector.getSupportedFormats() : ['qr_code']).then(function (f) {
          if (f.indexOf('qr_code') < 0) { useNative = false; return loadJsQR(); }
          detector = new BarcodeDetector({ formats: ['qr_code'] });
        })
      : loadJsQR();
    prep.then(function () {
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    }).then(function (s) {
      if (opts !== mine) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s;
      video.srcObject = s;
      return video.play().then(function () {
        if (opts !== mine) return;
        setMsg('');
        scanning = true;
        loop(useNative);
      });
    }).catch(function (err) {
      if (opts !== mine) return;
      stopCamera();
      var denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      setMsg(denied ? textOf(mine, 'denied') : err && err.message === 'jsQR' ? textOf(mine, 'noReader') : textOf(mine, 'failed'));
    });
  }

  function loop(useNative) {
    if (!scanning) return;
    var next = function () { setTimeout(function () { requestAnimationFrame(function () { loop(useNative); }); }, 120); };
    if (video.readyState < 2 || Date.now() < waitUntil) { next(); return; }
    var found = useNative
      ? detector.detect(video).then(function (codes) { return codes.length ? codes[0].rawValue : null; }, function () { return null; })
      : Promise.resolve((function () {
          var w = video.videoWidth, h = video.videoHeight;
          if (!w || !h) return null;
          var scale = Math.min(1, 480 / Math.max(w, h));
          canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          return code ? code.data : null;
        })());
    found.then(function (text) {
      if (!scanning) return;
      if (!text) { next(); return; }
      var r = opts && opts.onText ? opts.onText(text) : true;
      if (r === true) {
        if (window.WalsonDevice) WalsonDevice.vibrate(80);   // 진동 없는 기기는 조용히 넘어간다(device.js)
        close();
        return;
      }
      setMsg(typeof r === 'string' ? r : '');
      waitUntil = Date.now() + pauseMs;   // 같은 QR을 계속 읽어 안내가 깜빡이지 않게 잠깐 쉰다(도감은 0 — 예전처럼 바로 다시)
      next();
    });
  }

  window.WalsonQR = { scan: scan, close: close, icon: icon };
})();
