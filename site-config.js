// 사이트 공통 설정(2026-11-15). 값만 바꾸면 여러 화면에 한꺼번에 반영된다.
window.WALSON_CONFIG = {
  // 홍보물 필수 문구(2026-11-17 가르시아 "이 문구가 앞으로 홍보 전단에 반드시 들어가야 해") — 글자 그대로, 고칠 땐 여기 한 곳만.
  // 쓰는 곳: 공원 포스터·전단(poster.html), 방문 키트 안내지·명함(visit-kit.html), 제휴 제안서(partner-proposal.html),
  //         카운터 체크인 QR(checkin-qr.html), 산책 영수증 아래 줄(walk-receipt.js). 새 홍보물을 만들면 꼭 넣는다(CLAUDE.md 텍스트 규칙).
  // 11/18 가르시아 "APP 문구 빼는 걸로 통일" — 'APP WALSON' → 'WALSON'(사업자 정보 서비스명 '왈슨(WALSON)'과 같은 이름)
  // nameKo: 한글 이름(11/18 가르시아 "전단에 한글 왈슨도 추가해줘") — 필수 두 줄은 아니고 곁에 붙이는 이름. 쓰는 곳: 공원 포스터·전단(poster.html)
  brand: { name: 'WALSON', nameKo: '왈슨', tagline: '당신과 강아지의 유의미한 산책' },
  // 운영자(사업자) 정보(2026-11-17 가르시아) — 카카오톡 채널 비즈니스 심사가 반려돼서: 홈페이지에서 서비스명(왈슨)과
  // 하단 사업자 정보가 같이 보여야 한다(카카오 '사업자-채널 연관성 확인 방법'). 사업자등록증 그대로 적는다.
  // 쓰는 곳: 왈슨 소개(about.html)·개인정보 안내(privacy.html) 맨 아래(아래 WalsonBizInfo). 심사가 11/18 승인돼서
  // [오늘]·주민증 만들기 하단 한 줄과 [동네] 시트의 줄은 뺐다(가르시아 "이미 승인났으니까 소개 페이지면 충분").
  // 주소·전화번호는 일부러 안 적는다 — 문의는 카카오톡 채널.
  // service: 사업자 정보에 적는 서비스명(가르시아 "(WALSON)으로 해 줘, APP은 굳이") — 홍보물 문구(brand)와는 따로
  business: { service: '왈슨(WALSON)', name: '존슨거라지(Johnson Garage)', owner: '강훈민', regNo: '778-17-02429' },
  // 카카오톡 채널 주소(예: 'https://pf.kakao.com/_abcd'). 비어 있으면 "새 소식 받기" 버튼이 숨는다.
  // 쓰는 곳: [오늘] 아래 링크, 주민증 완료 화면, 키링 받기 화면.
  kakaoChannel: 'https://pf.kakao.com/_IxocNX',   // 2026-11-17 채널 '왈슨' 개설(비즈니스 심사 중). 1:1 채팅은 이 주소 + /chat
  // 사용 통계를 받을 Apps Script 웹 앱 주소(docs/TRACKING.md). 비어 있으면 통계를 보내지 않는다(track.js).
  trackUrl: 'https://script.google.com/macros/s/AKfycbyok_QqmfxYkBO48P7YciODmE7awhL52LzIc_x3bG-oU6T0nz9oNo-hoF4Hf76VNo7P/exec',
  // 지도 그림(타일)을 받아 오는 곳(2026-11-16 한곳에 모음). 지도 화면([산책]·[동네]·스팟 편집)이 모두 이 값을 쓴다.
  // 지금: OpenStreetMap 공용 서버 — 가입·키·요금 없음. 대신 사용량이 많아지면 차단될 수 있고(이용 정책), 속도·가동 보장이 없고,
  //       한국 지도는 네이버·카카오보다 덜 자세하다. 출처 표시(© OpenStreetMap)는 의무라 지우지 않는다.
  // 갈아탈 때: url·attribution(·필요하면 maxZoom)만 바꾸면 된다 — 예: 국토부 브이월드, MapTiler 같은 타일 서비스(키가 들어가면 그 서비스의 도메인 제한을 꼭 건다).
  //           카카오맵·네이버 지도는 타일 주소만 바꾸는 방식이 아니라 각자 SDK를 써야 해서 지도 코드를 고쳐야 한다.
  mapTiles: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19
  }
};
// Leaflet 지도에 위 지도 그림을 붙인다. 설정이 없거나 깨져 있어도 지도가 뜨도록 OpenStreetMap을 기본으로 둔다.
window.WalsonMapTiles = function (map) {
  var t = (window.WALSON_CONFIG && window.WALSON_CONFIG.mapTiles) || {};
  return L.tileLayer(t.url || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: t.maxZoom || 19,
    attribution: t.attribution || '&copy; OpenStreetMap'
  }).addTo(map);
};
// 사업자 정보를 el 안에 그린다. long이면 개인정보 안내용 여러 줄(서비스명·문의 포함), 아니면 화면 하단 한 줄.
window.WalsonBizInfo = function (el, long) {
  var C = window.WALSON_CONFIG || {}, B = C.business;
  if (!el || !B || !B.name) return;
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  if (!long) {
    el.innerHTML = '왈슨 운영 · 상호 ' + esc(B.name) + ' · 대표 ' + esc(B.owner) + ' · 사업자등록번호 ' + esc(B.regNo);
  } else {
    var ch = C.kakaoChannel ? '<a href="' + esc(C.kakaoChannel) + '" target="_blank" rel="noopener">카카오톡 채널 \'왈슨\'</a>' : '';
    el.innerHTML = '<b>운영자(사업자) 정보</b><br>' +
      '서비스명: ' + esc(B.service || '왈슨') + '<br>' +
      '상호: ' + esc(B.name) + '<br>대표자: ' + esc(B.owner) + '<br>사업자등록번호: ' + esc(B.regNo) +
      (ch ? '<br>문의: ' + ch : '');
  }
  el.hidden = false;
};
