// 사이트 공통 설정(2026-11-15). 값만 바꾸면 여러 화면에 한꺼번에 반영된다.
window.WALSON_CONFIG = {
  // 카카오톡 채널 주소(예: 'https://pf.kakao.com/_abcd'). 비어 있으면 "새 소식 받기" 버튼이 숨는다.
  // 쓰는 곳: [오늘] 아래 링크, 주민증 완료 화면, 키링 받기 화면.
  kakaoChannel: '',
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
