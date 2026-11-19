// 홈 화면에 두기(설치) 안내(2026-11-18). 전역 window.WalsonInstall. inapp.js 다음, track.js 앞에 부른다.
// 왜: 크롬이 아무 때나 "앱 설치" 띠를 띄워서 어머니 폰에서 "이게 뭐지" 했다(가르시아 "그렇게 해") — 크롬 자동 안내는 막고,
//     첫 산책을 마친 끝 화면에서 왈슨이 직접 짧게 설명하고 권한다.
// 아이폰(가르시아 "아이폰 저거 되게 해라 — 여성 아이폰 유저 무조건 많이 쓸 거라"): 사파리와 홈 화면 앱은 저장 공간이 따로라
//     그냥 추가하면 빈 왈슨이 열린다. 그래서 ① 사파리에서 기록을 담은 옮기기 주소(backup.js moveLink — 카톡 → 크롬과 같은 것)를
//     복사해 두고 ② 홈 화면에 추가 → ③ 홈 화면 앱을 처음 열면 "사파리에서 쓰던 기록 가져오기"로 붙여넣어 옮겨 담는다.
//     복사한 글은 이 휴대폰 클립보드에만 있고 어디로도 보내지 않는다. 걸은 길·산책 사진은 옮기기 주소에 안 들어간다(사파리엔 남음).
// 안드로이드 크롬: 크롬 안의 왈슨을 아이콘으로 꺼내 놓는 것이라 기록이 그대로 이어진다(옮길 것 없음).
// 카톡·네이버 등 앱 안 브라우저, 아이폰의 사파리 아닌 브라우저에서는 권하지 않는다(카톡은 먼저 "크롬·사파리로 옮기기").
(function () {
  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var inapp = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps/i.test(ua);
  var iosSafari = ios && !inapp && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|Whale|SamsungBrowser|GSA\//i.test(ua);
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var OFFER_KEY = 'walson_install_offer';     // { n: 권한 횟수, at: 마지막으로 권한 때 }
  var IMPORT_KEY = 'walson_install_import';   // 아이폰 홈 화면 앱에서 "기록 가져오기"를 끝냈거나 건너뜀
  var DAY = 86400000;
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 이번만 */ } }

  // ── 안드로이드: 크롬 자동 안내를 막고 들고 있다가 우리 버튼에서 띄운다 ──
  var deferred = null, waiters = [];
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    waiters.splice(0).forEach(function (f) { f(); });
  });
  window.addEventListener('appinstalled', function () { deferred = null; set(OFFER_KEY, JSON.stringify({ n: 9, at: Date.now() })); });

  function hasRecords() { return window.WalsonInApp ? WalsonInApp.hasRecords() : false; }
  // 지금 권할 수 있는지(버튼을 보일지) — 이미 홈 화면 앱이거나 앱 안 브라우저면 아니다
  function canOffer() {
    if (standalone || inapp) return false;
    return ios ? iosSafari : !!deferred;
  }
  function whenReady(cb, waitMs) {   // 안드로이드는 크롬이 '설치 가능'을 알려 줄 때까지 조금 기다린다
    if (canOffer()) { cb(); return; }
    if (ios || standalone || inapp) return;
    var done = false;
    waiters.push(function () { if (!done) { done = true; cb(); } });
    setTimeout(function () { done = true; }, waitMs || 6000);
  }

  // ── 작은 아래 창 ──
  function css() {
    if (document.getElementById('wi-css')) return;
    var s = document.createElement('style');
    s.id = 'wi-css';
    s.textContent =
      '.wi-back{position:fixed;inset:0;z-index:4000;background:rgba(40,32,26,.55);display:flex;align-items:flex-end;justify-content:center;}' +
      '.wi-card{width:100%;max-width:460px;background:var(--panel,#fffaf3);color:var(--ink,#4a3f35);border-radius:22px 22px 0 0;padding:22px 18px calc(18px + env(safe-area-inset-bottom,0px));' +
        'font-family:Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;word-break:keep-all;max-height:88vh;overflow-y:auto;}' +
      '.wi-card h3{margin:0 0 6px;font-size:19px;font-weight:900;}' +
      '.wi-card p{margin:0 0 12px;font-size:14px;line-height:1.6;color:var(--ink-soft,#6b5d4e);}' +
      '.wi-card ol{margin:0 0 14px;padding-left:20px;font-size:14.5px;line-height:1.7;}' +
      '.wi-card ol b{color:var(--ink,#4a3f35);}' +
      '.wi-btn{display:block;width:100%;margin-top:8px;padding:14px;border-radius:999px;font:800 15px Pretendard,-apple-system,sans-serif;cursor:pointer;' +
        'border:2px solid var(--line,#3a2e24);background:var(--hl,#f2b831);color:var(--hl-ink,#3a2e24);}' +
      '.wi-btn.sub{border:1px solid var(--panel-border,#e6d6c1);background:#fff;color:var(--ink,#4a3f35);}' +
      '.wi-btn[disabled]{opacity:.55;}' +
      '.wi-ok{font-size:13px;font-weight:800;color:#3f7d4a;margin:8px 2px 0;min-height:1em;}' +
      '.wi-card textarea{width:100%;height:90px;margin-top:8px;font:13px ui-monospace,monospace;border:1px solid var(--panel-border,#e6d6c1);border-radius:12px;padding:8px;box-sizing:border-box;}' +
      '.wi-ico{display:inline-block;vertical-align:-3px;width:18px;height:18px;}';
    document.head.appendChild(s);
  }
  var SHARE_ICON = '<svg class="wi-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12"/></svg>';
  function sheet(html) {
    css();
    var back = document.createElement('div');
    back.className = 'wi-back';
    back.innerHTML = '<div class="wi-card" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(back);
    back.addEventListener('click', function (e) { if (e.target === back) back.remove(); });
    return back;
  }
  function need(src, test) {   // 이 화면에 없는 스크립트를 필요할 때만 불러온다
    if (test()) return Promise.resolve();
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.onload = function () { test() ? res() : rej(new Error('불러오지 못했어요')); };
      s.onerror = function () { rej(new Error('인터넷 연결을 확인해 주세요.')); };
      document.head.appendChild(s);
    });
  }
  function backupReady() {
    // 옮기기 주소를 만들 때 발도장을 장소 점으로 바꾸려면 장소 목록(reward-rules.js)도 있어야 한다
    return need('spots-data.js', function () { return !!window.PETWALK_SPOTS || !!window.RewardRules; })
      .then(function () { return need('reward-rules.js?v=11', function () { return !!window.RewardRules; }); })
      .then(function () { return need('backup.js?v=7', function () { return !!window.WalsonBackup; }); });
  }

  // ── 권하는 창 ──
  function openAndroid() {
    var b = sheet('<h3>왈슨을 홈 화면에 둘까요?</h3>' +
      '<p>홈 화면 아이콘으로 앱처럼 바로 열려요. 플레이스토어 설치나 가입이 아니고, 지금 기록이 그대로 이어져요.</p>' +
      '<button type="button" class="wi-btn" data-go>홈 화면에 두기</button>' +
      '<button type="button" class="wi-btn sub" data-no>나중에</button>');
    b.querySelector('[data-no]').addEventListener('click', function () { b.remove(); });
    b.querySelector('[data-go]').addEventListener('click', function () {
      b.remove();
      if (!deferred) return;
      var e = deferred; deferred = null;
      e.prompt();
    });
  }
  function openIOS() {
    var link = null;
    var b = sheet('<h3>왈슨을 홈 화면에 둘까요?</h3>' +
      '<p>홈 화면 아이콘으로 앱처럼 바로 열려요. 아이폰은 홈 화면 왈슨이 사파리와 기록을 따로 가져서, 먼저 기록을 복사해 두고 거기서 붙여 넣어요.</p>' +
      '<ol><li><b>기록 복사하기</b>를 눌러요</li>' +
      '<li>사파리 아래 가운데 ' + SHARE_ICON + ' <b>공유</b> → <b>홈 화면에 추가</b> → <b>추가</b></li>' +
      '<li>홈 화면의 왈슨을 열면 <b>기록 가져오기</b>가 떠요 → <b>붙여넣기</b></li></ol>' +
      '<button type="button" class="wi-btn" data-copy disabled>기록 담는 중…</button>' +
      '<p class="wi-ok" data-ok></p>' +
      '<button type="button" class="wi-btn sub" data-no>나중에</button>' +
      '<p style="margin:12px 0 0;font-size:12px;">걸은 길·산책 사진은 옮겨지지 않아요(사파리 왈슨엔 그대로 있어요). 다 옮기려면 프로필 → 기록 옮기기(파일).</p>');
    var copyBtn = b.querySelector('[data-copy]'), ok = b.querySelector('[data-ok]');
    b.querySelector('[data-no]').addEventListener('click', function () { b.remove(); });
    // 복사는 버튼을 누른 그 순간에 해야 해서(아이폰 규칙) 주소를 미리 만들어 둔다
    backupReady().then(function () {
      var base = location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '') + 'index.html';
      return WalsonBackup.moveLink(base);
    }).then(function (r) {
      link = r.url;
      copyBtn.disabled = false;
      copyBtn.textContent = '기록 복사하기' + (r.walks ? '(산책 ' + r.walks + '개)' : '');
    }).catch(function (e) { copyBtn.textContent = '기록을 담지 못했어요'; ok.style.color = '#a33a2f'; ok.textContent = e.message; });
    copyBtn.addEventListener('click', function () {
      if (!link) return;
      var done = function () { ok.textContent = '복사했어요. 이제 ' + '아래 공유 버튼 → 홈 화면에 추가를 눌러 주세요.'; copyBtn.textContent = '다시 복사하기'; };
      var fallback = function () {   // 클립보드를 못 쓰면 글을 띄워 길게 눌러 복사하게
        var ta = document.createElement('textarea'); ta.value = link; ta.readOnly = true;
        ok.textContent = '아래 글을 길게 눌러 전체 선택 → 복사해 주세요.';
        copyBtn.insertAdjacentElement('afterend', ta); ta.focus(); ta.select();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, fallback);
      else fallback();
    });
  }
  function open() {
    if (standalone) { alert('이미 홈 화면 왈슨으로 쓰고 있어요.'); return; }
    if (inapp) { alert('카톡·네이버 같은 앱 안에서는 홈 화면에 둘 수 없어요. 먼저 ' + (ios ? '사파리' : '크롬') + '에서 열어 주세요.'); return; }
    if (ios) { if (iosSafari) openIOS(); else alert('아이폰은 사파리에서 열어야 홈 화면에 둘 수 있어요.'); return; }
    if (deferred) openAndroid();
    else alert('이 브라우저에서는 메뉴(⋮) → "홈 화면에 추가"로 둘 수 있어요.');
  }
  // 저절로 권하기 — 첫 산책을 마친 끝 화면 등. 두 번까지, 한 번 권하면 2주 쉼. 샘플 보기 중엔 안 권함
  function offer() {
    if (get('petwalk_sample_mode') === '1') return;
    var s = {};
    try { s = JSON.parse(get(OFFER_KEY)) || {}; } catch (e) { s = {}; }
    if ((s.n || 0) >= 2 || (s.at && Date.now() - s.at < 14 * DAY)) return;
    whenReady(function () {
      set(OFFER_KEY, JSON.stringify({ n: (s.n || 0) + 1, at: Date.now() }));
      if (ios) openIOS(); else openAndroid();
    });
  }

  // ── 아이폰 홈 화면 앱을 처음 열었을 때: 사파리에서 쓰던 기록 가져오기 ──
  function pendingImport() { return ios && standalone && !get(IMPORT_KEY) && !hasRecords(); }
  var importing = pendingImport();
  if (importing) window.WALSON_TRACK_SKIP = true;   // 기기 번호를 넘겨받은 뒤에 센다(같은 사람이 두 번 세어지지 않게)
  function finishImport(reload) {
    set(IMPORT_KEY, new Date().toISOString().slice(0, 10));
    window.WALSON_TRACK_SKIP = false;
    if (reload) location.replace(location.pathname);
    else if (window.WalsonTrack) WalsonTrack.send('page_view');
  }
  function openImport() {
    var b = sheet('<h3>사파리에서 쓰던 기록 가져오기</h3>' +
      '<p>사파리 왈슨에서 <b>기록 복사하기</b>를 눌렀다면, 아래 버튼으로 붙여 넣어요. 워킹패스·산책 기록이 이어져요.</p>' +
      '<button type="button" class="wi-btn" data-paste>붙여넣어 가져오기</button>' +
      '<p class="wi-ok" data-ok></p>' +
      '<button type="button" class="wi-btn sub" data-new>처음 써요 · 새로 시작</button>');
    var ok = b.querySelector('[data-ok]');
    function take(text) {
      var m = /#walson-move=[A-Za-z0-9_-]+/.exec(text || '');
      if (!m) { ok.style.color = '#a33a2f'; ok.textContent = '복사한 기록이 없어요. 사파리 왈슨에서 [기록 복사하기]를 먼저 눌러 주세요.'; return; }
      ok.style.color = ''; ok.textContent = '옮겨 담는 중…';
      backupReady().then(function () { return WalsonBackup.receiveMove(m[0]); }).then(function (r) {
        alert('사파리에서 쓰던 기록을 옮겨 왔어요(산책 ' + r.walks + '개).');
        finishImport(true);
      }).catch(function (e) { ok.style.color = '#a33a2f'; ok.textContent = e.message; });
    }
    b.querySelector('[data-paste]').addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(take, function () { manual(); });
      } else manual();
    });
    function manual() {   // 클립보드를 못 읽으면 칸에 길게 눌러 붙여넣기
      if (b.querySelector('textarea')) return;
      var ta = document.createElement('textarea'); ta.placeholder = '여기를 길게 눌러 붙여넣기';
      var go = document.createElement('button'); go.type = 'button'; go.className = 'wi-btn'; go.textContent = '가져오기';
      go.addEventListener('click', function () { take(ta.value); });
      ok.insertAdjacentElement('beforebegin', ta); ta.insertAdjacentElement('afterend', go);
      ok.textContent = '아래 칸을 길게 눌러 붙여넣고 [가져오기]를 눌러 주세요.';
    }
    b.querySelector('[data-new]').addEventListener('click', function () { b.remove(); finishImport(true); });
  }
  if (importing) {
    var show = function () { openImport(); };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }

  window.WalsonInstall = {
    ios: ios, iosSafari: iosSafari, standalone: standalone,
    canOffer: canOffer, whenReady: whenReady, open: open, offer: offer, pendingImport: function () { return importing; }
  };
})();
