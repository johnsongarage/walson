// 내 위치 찾기 공통(2026-11-15). 전역 window.WalsonGeo.
// 문제: 정밀 위치(GPS)만 10초 기다리다 실내·PC에서 시간 초과로 실패하고 "Timeout expired" 같은 영어 오류만 떴다.
// 그래서 ① 정밀 위치를 8초 기다리고(최근 30초 안에 잡힌 값이면 바로 씀) ② 안 되면 대략적인 위치(와이파이·기지국)를
//   12초 더 찾고(최근 10분 값 허용) ③ 그래도 안 되면 이유별 한국어 안내를 돌려준다.
// 위치는 화면에 점을 찍는 데만 쓰고, 이 파일은 어디로도 보내지 않는다.
//   WalsonGeo.locate(function ok(pos) {...}, function fail(info) { info.code, info.message })
(function () {
  var MESSAGES = {
    1: '위치 권한이 꺼져 있어요. 주소창 왼쪽 자물쇠(또는 휴대폰 설정 > 브라우저 > 위치)에서 이 사이트의 위치를 "허용"으로 바꾼 뒤 다시 눌러 주세요.',
    2: '지금 위치를 찾을 수 없어요. 휴대폰의 위치(GPS)와 와이파이를 켜고 다시 눌러 주세요.',
    3: '위치를 찾는 데 시간이 너무 걸려요. 실내라면 창가나 밖에서 다시 눌러 주세요.'
  };
  function fail(cb, err) {
    var code = err && err.code;
    cb({ code: code || 0, message: MESSAGES[code] || '위치를 가져오지 못했어요. 잠시 뒤 다시 눌러 주세요.', raw: err && err.message });
  }
  // 카톡·네이버·인스타 같은 앱 안 브라우저는 위치 요청에 아예 답을 안 할 때가 있다(버튼만 계속 돎).
  // 그래서 브라우저 timeout을 믿지 않고 직접 시계를 잰다: 1단계 9초, 2단계 13초가 지나면 다음으로 넘어간다.
  function isIOS() { var ua = navigator.userAgent || ''; return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); }
  function isAndroid() { return /Android/i.test(navigator.userAgent || ''); }
  function standalone() { return !!((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone); }
  // 홈 화면 앱은 카톡과 달리 사파리·크롬의 위치 권한을 쓴다 — 기기별로 켜는 곳을 알려 준다
  function permissionHelp() {
    if (isIOS()) return '아이폰: 설정 > 개인정보 보호 및 보안 > 위치 서비스 > "Safari 웹사이트"를 "앱을 사용하는 동안"으로, "정확한 위치"도 켜 주세요.' +
      (standalone() ? ' 그래도 안 되면 홈 화면 앱을 지우고 사파리에서 다시 "홈 화면에 추가" 해 주세요.' : '');
    if (isAndroid()) return '안드로이드: 설정 > 애플리케이션 > Chrome > 권한 > 위치를 "앱 사용 중에만 허용"으로, "정확한 위치 사용"도 켜 주세요. 크롬에서 이 사이트 > 사이트 설정 > 위치도 "허용"인지 확인해 주세요.';
    return '';
  }
  function inAppBrowser() { return /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent || ''); }
  function attempt(opts, waitMs, done) {
    var finished = false;
    var timer = setTimeout(function () { if (!finished) { finished = true; done(null, { code: 3, message: 'no answer' }); } }, waitMs);
    try {
      navigator.geolocation.getCurrentPosition(function (pos) {
        if (finished) return; finished = true; clearTimeout(timer); done(pos, null);
      }, function (err) {
        if (finished) return; finished = true; clearTimeout(timer); done(null, err);
      }, opts);
    } catch (e) {
      if (!finished) { finished = true; clearTimeout(timer); done(null, { code: 2, message: String(e) }); }
    }
  }
  function locate(ok, onFail) {
    if (!navigator.geolocation) { onFail({ code: -1, message: '이 브라우저에서는 위치 기능을 쓸 수 없어요.' }); return; }
    if (window.isSecureContext === false) { onFail({ code: -2, message: '보안 연결(https)에서만 위치를 쓸 수 있어요.' }); return; }
    function failWith(err) {
      fail(function (info) {
        if (inAppBrowser() && info.code !== 1) info.message += ' 카톡 등 앱 안에서 열었다면 오른쪽 위 메뉴의 "다른 브라우저로 열기"(크롬·사파리)로 열면 잘 돼요.';
        else { var h = permissionHelp(); if (h) info.message += '\n\n' + h; }
        // 원인 확인용 짧은 표시(운영자에게 알려 줄 때) — 예: [코드 3 · 홈화면앱 · 권한 prompt]
        var tag = function (perm) {
          info.message += '\n\n[코드 ' + info.code + ' · ' + (standalone() ? '홈화면앱' : inAppBrowser() ? '앱안브라우저' : '브라우저') + ' · 권한 ' + (perm || '알수없음') + ']';
          onFail(info);
        };
        try {
          navigator.permissions.query({ name: 'geolocation' }).then(function (p) { tag(p.state); }, function () { tag(); });
        } catch (e) { tag(); }
      }, err);
    }
    attempt({ enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }, 9000, function (pos, err) {
      if (pos) { ok(pos); return; }
      if (err && err.code === 1) { failWith(err); return; }   // 권한 거부는 다시 물어도 같다
      attempt({ enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }, 13000, function (pos2, err2) {
        if (pos2) ok(pos2); else failWith(err2);
      });
    });
  }
  window.WalsonGeo = { locate: locate, MESSAGES: MESSAGES, inAppBrowser: inAppBrowser, standalone: standalone };
})();
