// 동네 스팟 데이터 — 자동 생성 파일.
// 운영자의 스팟 편집 페이지(spot-editor.html)가 이 파일을 통째로 다시 쓴다.
// 손으로 고쳐도 되지만 편집 페이지로 반영하면 덮어써진다. 사진은 spots/photos/ 에 있다.
// 공용 시설과 가게만 넣는다 — 개인 집이나 특정인의 위치는 넣지 않는다.
window.PETWALK_SPOTS = [
  {"id":"osm-park-2","cat":"park","name":"다산선형공원","lat":37.6240973,"lng":127.151316,"source":"osm"},
  {"id":"osm-park-4","cat":"park","name":"다산체육공원","lat":37.616545,"lng":127.1487585,"source":"osm"},
  {"id":"osm-park-5","cat":"park","name":"도농생태유수지","lat":37.6127701,"lng":127.150002,"source":"osm"},
  {"id":"osm-park-6","cat":"park","name":"모두랑근린공원","lat":37.6295569,"lng":127.1493806,"source":"osm"},
  {"id":"osm-park-7","cat":"park","name":"남양주자연체험공원","lat":37.6321685,"lng":127.1506601,"source":"osm"},
  {"id":"osm-toilet-1","cat":"toilet","name":"공중화장실","lat":37.6204898,"lng":127.1424382,"source":"osm"},
  {"id":"osm-toilet-2","cat":"toilet","name":"공중화장실","lat":37.6228246,"lng":127.1418633,"source":"osm"},
  {"id":"osm-toilet-3","cat":"toilet","name":"공중화장실","lat":37.6306934,"lng":127.1448747,"source":"osm"},
  {"id":"osm-vet-1","cat":"vet","name":"부영동물병원","lat":37.60844,"lng":127.16264,"note":"진료 시간은 확인 전이에요. 가기 전에 전화로 확인하세요.","source":"osm"},
  {"id":"osm-vet-2","cat":"vet","name":"폭시팻동물병원","lat":37.61297,"lng":127.14099,"note":"진료 시간은 확인 전이에요. 가기 전에 전화로 확인하세요.","source":"osm"},
  {"id":"osm-vet-3","cat":"vet","name":"래플즈동물병원","lat":37.60969,"lng":127.13675,"note":"진료 시간은 확인 전이에요. 가기 전에 전화로 확인하세요.","source":"osm"},
  {"id":"field-1794704265889","cat":"park","name":"계단숲산책로_동","lat":37.6128,"lng":127.15608,"source":"field","verifiedAt":"2026-11-15"},
  {"id":"field-1794704231850","cat":"park","name":"계단숲산책로_서","lat":37.61127,"lng":127.15381,"source":"field","verifiedAt":"2026-11-15"},
  {"id":"field-1794704113098","cat":"park","name":"다산중앙공원_하","lat":37.61912,"lng":127.16097,"source":"field","verifiedAt":"2026-11-15"},
  {"id":"osm-park-1","cat":"park","name":"다산중앙공원_상","lat":37.6231,"lng":127.16141,"source":"field","verifiedAt":"2026-11-15"},
  {"id":"field-1794704450497","cat":"spot","name":"현대프리미엄아울렛","lat":37.61636,"lng":127.15352,"source":"field","verifiedAt":"2026-11-15","tags":["실내OK","대형견OK"],"note":"강아지 동반가능"},
  {"id":"field-1794704545993","cat":"spot","name":"현대프리미어캠퍼스","lat":37.61274,"lng":127.15246,"source":"field","verifiedAt":"2026-11-15","tags":["실내OK","대형견OK"],"note":"매장별 동반 입장 가능 여부 확인필요"},
  {"id":"field-1794732698033","cat":"toilet","name":"공중화장실","lat":37.62016,"lng":127.16043,"source":"field","verifiedAt":"2026-11-15"}
];
// 운영자가 편집 페이지에서 직접 만든 종류 — { key, label, color }. 아이콘은 별표로 같다.
window.PETWALK_SPOT_CATEGORIES = [
];
// 우리 개 발도장 장소 — { id, name, lat, lng, radiusM, kind: park|water|building }. reward-rules.js가 읽는다.
window.PETWALK_STAMP_PLACES = [
  {"id":"campus","name":"프리미어캠퍼스","lat":37.61274,"lng":127.15246,"radiusM":150,"kind":"building"},
  {"id":"outlet","name":"아울렛","lat":37.61633,"lng":127.15268,"radiusM":150,"kind":"building"},
  {"id":"central","name":"다산 중앙공원","lat":37.6233,"lng":127.15962,"radiusM":250,"kind":"park"},
  {"id":"waterside","name":"다산수변공원","lat":37.62396,"lng":127.14529,"radiusM":300,"kind":"water"}
];
// 지도 묶음·우선순위 — { id, label, layers: [{ key, zoom: far|mid|near, off }] }. 위에 있을수록 먼저·위에 보인다. infra-pins.js가 읽는다.
window.PETWALK_MAP_GROUPS = [
  {"id":"go","label":"갈 곳","layers":[{"key":"spot","zoom":"far"},{"key":"park","zoom":"far"}]},
  {"id":"dog","label":"우리 개","layers":[{"key":"stamp","zoom":"far"},{"key":"mine","zoom":"far"}]},
  {"id":"safe","label":"안전","layers":[{"key":"caution","zoom":"far"},{"key":"vet","zoom":"mid","off":true}]},
  {"id":"handy","label":"편의","layers":[{"key":"bag","zoom":"mid"},{"key":"water","zoom":"mid"},{"key":"toilet","zoom":"mid","off":true}]},
  {"id":"deco","label":"꾸밈","layers":[{"key":"deco","zoom":"mid"}]}
];
// 예시 수호견 — 사장님께 보여 드리는 예시 화면(town.html?guardian_demo=1)에만 나온다. 공개 지도·다른 화면은 읽지 않는다.
window.PETWALK_DEMO_GUARDIANS = [
  {"id":"demo-home","cat":"spot","name":"○○ 카페","lat":37.6196,"lng":127.1583,"source":"demo","demo":true,"pet":{"kind":"food","indoor":"no","terrace":true,"water":true},"guardian":{"kind":"home","name":"보리","signal":"green","photo":"demo/guardian-home-ai.jpg","line":"가게엔 안 나가도 사장님 휴대폰 배경은 늘 저예요","style":"photo"}},
  {"id":"demo-work","cat":"spot","name":"○○ 펫샵","lat":37.6206,"lng":127.1626,"source":"demo","demo":true,"pet":{"kind":"pet","indoor":"ok","large":"all","water":true},"guardian":{"kind":"work","name":"콩이","signal":"red","photo":"demo/guardian-work-ai.jpg","line":"미용실 문 앞은 제 구역이에요 · 눈으로만 인사해 주세요","style":"photo"}}
];
