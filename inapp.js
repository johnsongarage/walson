// 카톡 안 브라우저 → 크롬·사파리로 넘기기(2026-11-15). 전역 window.WalsonInApp. track.js보다 먼저 불러야 한다.
// 왜: 카톡 안에서 열린 왈슨과 크롬·사파리(그리고 홈 화면 앱)는 기록 저장 공간이 따로다.
//     카톡에서 한참 쓰다 설치하면 기록이 안 넘어가고, 통계에도 같은 사람이 기기 두 대로 잡힌다.
// 1) 카톡에서 처음 열었고 이 창에 기록이 없으면 → 바로 바깥 브라우저로 연다(카톡 공식 주소 kakaotalk://web/openExternal).
//    잃을 기록이 없을 때만 자동이다. 이 창에서는 통계도 보내지 않는다(넘어간 쪽에서 한 번만 센다).
// 2) 이미 기록이 있으면 자동으로 넘기지 않는다 → [오늘]·[프로필]의 "크롬으로 옮기기" 버튼(backup.js moveLink)으로.
// 3) 옮기기 주소(#walson-move=…)로 열린 쪽은 통계를 잠시 멈춘다 — 기기 번호를 넘겨받은 뒤에 센다(index.html).
// 네이버·인스타 등 다른 앱은 바깥 브라우저로 여는 공식 방법이 없어 안내 문구만 보인다.
(function () {
  var ua = navigator.userAgent || '';
  var kakao = /KAKAOTALK/i.test(ua);
  var name = kakao ? '카톡' : /NAVER\(inapp/i.test(ua) ? '네이버 앱' : /Instagram/i.test(ua) ? '인스타그램' :
    /FBAN|FBAV/i.test(ua) ? '페이스북' : /Line\//i.test(ua) ? '라인' : '';
  var ios = /iPhone|iPad|iPod/i.test(ua);
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function hasRecords() {
    try {
      if (get('petwalk_sample_mode') === '1') return /cardNo|"date"/.test(get('petwalk_sample_backup') || '');
      var p = JSON.parse(get('petwalk_profile') || '{}') || {};
      var w = JSON.parse(get('petwalk_walks') || '[]') || [];
      return !!(p.cardNo || p.name) || w.length > 0 || !!get('petwalk_visits') || !!get('petwalk_active_walk') || !!get('petwalk_active_route');
    } catch (e) { return true; }   // 모르면 넘기지 않는다
  }
  function openExternal(url) {
    var target = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url || location.href);
    if (typeof window.WALSON_TEST_OPEN === 'function') return window.WALSON_TEST_OPEN(target);   // 자동 시험용(실제 카톡에선 없음)
    location.href = target;
  }
  var receiving = location.hash.indexOf('#walson-move=') === 0;
  if (receiving) window.WALSON_TRACK_SKIP = true;

  var escaped = false;
  var tried = false;
  try { tried = sessionStorage.getItem('walson_inapp_tried') === '1'; } catch (e) { tried = false; }
  var adminPage = /simulate|spot-editor|checkin-qr|poster/.test(location.pathname);
  if (kakao && !receiving && !tried && !adminPage && !get('petwalk_admin_token') && !hasRecords()) {
    try { sessionStorage.setItem('walson_inapp_tried', '1'); } catch (e) { /* 무시 */ }
    escaped = true;
    window.WALSON_TRACK_SKIP = true;
    openExternal(location.href);
    // 카톡 창은 그대로 남으니, 무슨 일이 있었는지 알려 준다
    var show = function () {
      var d = document.createElement('div');
      d.id = 'inapp-escape';
      d.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(247,237,226,.97);display:flex;align-items:center;justify-content:center;padding:24px;' +
        'font-family:Pretendard,-apple-system,"Malgun Gothic",sans-serif;color:#4a3f35;text-align:center;';
      d.innerHTML = '<div style="max-width:340px;line-height:1.6;">' +
        '<div style="font-size:20px;font-weight:900;margin-bottom:8px;">' + (ios ? '사파리' : '크롬') + '에서 열었어요</div>' +
        '<div style="font-size:14px;">왈슨은 ' + (ios ? '사파리' : '크롬') + '에서 써야 기록이 안전하게 남고, 홈 화면에 추가해도 그대로 이어져요. 이 카톡 창은 닫아도 돼요.</div>' +
        '<button type="button" id="inapp-retry" style="margin-top:16px;width:100%;padding:13px;border:none;border-radius:999px;background:#b8563a;color:#fff;font:800 15px inherit;">안 열렸으면 다시 열기</button>' +
        '<button type="button" id="inapp-stay" style="margin-top:8px;width:100%;padding:12px;border:1px solid #e6d6c1;border-radius:999px;background:#fff;color:#4a3f35;font:800 14px inherit;">카톡에서 그냥 보기</button>' +
        '</div>';
      document.body.appendChild(d);
      document.getElementById('inapp-retry').addEventListener('click', function () { openExternal(location.href); });
      document.getElementById('inapp-stay').addEventListener('click', function () {
        d.parentNode.removeChild(d);
        window.WALSON_TRACK_SKIP = false;
        if (window.WalsonTrack) WalsonTrack.send('page_view');   // 카톡에 남기로 했으니 여기서부터 센다
      });
    };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }

  window.WalsonInApp = { name: name, kakao: kakao, ios: ios, escaped: escaped, receiving: receiving, openExternal: openExternal, hasRecords: hasRecords };
})();
