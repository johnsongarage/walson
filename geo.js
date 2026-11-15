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
  function locate(ok, onFail) {
    if (!navigator.geolocation) { onFail({ code: -1, message: '이 브라우저에서는 위치 기능을 쓸 수 없어요.' }); return; }
    if (window.isSecureContext === false) { onFail({ code: -2, message: '보안 연결(https)에서만 위치를 쓸 수 있어요.' }); return; }
    navigator.geolocation.getCurrentPosition(ok, function (err) {
      if (err && err.code === 1) { fail(onFail, err); return; }   // 권한 거부는 다시 물어도 같다
      navigator.geolocation.getCurrentPosition(ok, function (err2) { fail(onFail, err2); },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 });
  }
  window.WalsonGeo = { locate: locate, MESSAGES: MESSAGES };
})();
