// 동네 스팟(시설·가게·주의 구역) — town.html([동네]), walk.html·go.html(산책 중 가게 QR 찍기 — 가게 찾기만), start.html(수호견 카드),
// spot-editor.html(운영자 스팟 편집)이 같이 쓴다. 전역 window.InfraPins.
// 고치면 쓰는 화면들의 `infra-pins.js?v=N` 버전을 같이 올릴 것(card-shared.js와 같은 캐시 문제).
//
// 데이터는 spots-data.js(window.PETWALK_SPOTS)에서 온다 — 이 파일보다 먼저 불러야 한다(2026-11-14).
// spots-data.js는 운영자의 스팟 편집 페이지가 "모두에게 반영"으로 커밋하면 배포된다.
// 예전처럼 휴대폰 안(localStorage)에 따로 고쳐 둔 내용은 더 이상 읽지 않는다.
//
// 개인정보: 공용 시설과 가게 좌표만 둔다. 사용자 위치는 이 파일에서 읽지도 보내지도 않는다.
(function () {

  // 아이콘은 Phosphor Icons(MIT) regular SVG 경로를 그대로 가져온 것.
  var CATEGORIES = [
    // 주의 구역(2026-11-14, 기획표 V1-21): 자전거도로 합류, 진드기 풀숲처럼 '늘 조심할 구간'을 운영자가 현장에서 찍는다.
    // 특정 가게를 위험 구역으로 찍지 않는다 — 음식점 주변 닭뼈 다발지는 일부러 뺐다(가게에 협찬을 부탁하게 되므로, 11/14 결정).
    // 이 종류도 SEED는 비워 둔다. 현장에서 확인하지 않은 위험을 지어내지 않는다.
    { key: 'caution', label: '주의 구역', color: '#d98a1f',
      icon: 'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z' },
    { key: 'bag', label: '배변봉투함', color: '#8a6a3b',
      icon: 'M216,48H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM192,208H64V64H192ZM80,24a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,24Z' },
    { key: 'water', label: '음수대', color: '#3b7dc4',
      icon: 'M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75ZM128,216a72.08,72.08,0,0,1-72-72c0-57.23,55.47-105,72-118,16.53,13,72,60.75,72,118A72.08,72.08,0,0,1,128,216Zm55.89-62.66a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z' },
    { key: 'spot', label: '동반 스팟', color: '#b8563a',
      icon: 'M80,56V24a8,8,0,0,1,16,0V56a8,8,0,0,1-16,0Zm40,8a8,8,0,0,0,8-8V24a8,8,0,0,0-16,0V56A8,8,0,0,0,120,64Zm32,0a8,8,0,0,0,8-8V24a8,8,0,0,0-16,0V56A8,8,0,0,0,152,64Zm96,56v8a40,40,0,0,1-37.51,39.91,96.59,96.59,0,0,1-27,40.09H208a8,8,0,0,1,0,16H32a8,8,0,0,1,0-16H56.54A96.3,96.3,0,0,1,24,136V88a8,8,0,0,1,8-8H208A40,40,0,0,1,248,120ZM200,96H40v40a80.27,80.27,0,0,0,45.12,72h69.76A80.27,80.27,0,0,0,200,136Zm32,24a24,24,0,0,0-16-22.62V136a95.78,95.78,0,0,1-1.2,15A24,24,0,0,0,232,128Z' },
    { key: 'vet', label: '동물병원', color: '#c2453f',
      icon: 'M216,88H168V40a16,16,0,0,0-16-16H104A16,16,0,0,0,88,40V88H40a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16H88v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V168h48a16,16,0,0,0,16-16V104A16,16,0,0,0,216,88Zm0,64H160a8,8,0,0,0-8,8v56H104V160a8,8,0,0,0-8-8H40V104H96a8,8,0,0,0,8-8V40h48V96a8,8,0,0,0,8,8h56Z' },
    { key: 'toilet', label: '화장실', color: '#6b5d9e',
      icon: 'M120,64a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h16A8,8,0,0,1,120,64Zm52.32,133.14,3.52,24.6A16,16,0,0,1,160,240H96a16,16,0,0,1-15.84-18.26l3.52-24.6A96.09,96.09,0,0,1,32,112a8,8,0,0,1,8-8H56V40A16,16,0,0,1,72,24H184a16,16,0,0,1,16,16v64h16a8,8,0,0,1,8,8A96.09,96.09,0,0,1,172.32,197.14ZM72,104H184V40H72Zm85.07,99.5a96.15,96.15,0,0,1-58.14,0L96,224h64ZM207.6,120H48.4a80,80,0,0,0,159.2,0Z' },
    { key: 'park', label: '공원·쉼터', color: '#4f7d4a',
      icon: 'M198.1,62.59a76,76,0,0,0-140.2,0A71.71,71.71,0,0,0,16,127.8C15.9,166,48,199,86.14,200A72.09,72.09,0,0,0,120,192.47V232a8,8,0,0,0,16,0V192.47A72.17,72.17,0,0,0,168,200l1.82,0C208,199,240.11,166,240,127.8A71.71,71.71,0,0,0,198.1,62.59ZM169.45,184a56.08,56.08,0,0,1-33.45-10v-41l43.58-21.78a8,8,0,1,0-7.16-14.32L136,115.06V88a8,8,0,0,0-16,0v51.06L83.58,120.84a8,8,0,1,0-7.16,14.32L120,156.94v17a56,56,0,0,1-33.45,10C56.9,183.23,31.92,157.52,32,127.84A55.77,55.77,0,0,1,67.11,76a8,8,0,0,0,4.53-4.67,60,60,0,0,1,112.72,0A8,8,0,0,0,188.89,76,55.79,55.79,0,0,1,224,127.84C224.08,157.52,199.1,183.23,169.45,184Z' }
  ];

  // ── 운영자가 직접 만든 종류(2026-11-15) ──
  // spots-data.js의 window.PETWALK_SPOT_CATEGORIES = [{ key, label, color }]. 스팟 편집 페이지에서 글자로 추가한다.
  // 아이콘은 모두 같은 별표(Phosphor Star, MIT). 기본 종류와 key가 겹치면 무시한다.
  var CUSTOM_ICON = 'M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Zm-15.34,5.47-48.7,42a8,8,0,0,0-2.56,7.91l14.88,62.8a.37.37,0,0,1-.17.48c-.18.14-.23.11-.38,0l-54.72-33.65a8,8,0,0,0-8.38,0L69.09,215.94c-.15.09-.19.12-.38,0a.37.37,0,0,1-.17-.48l14.88-62.8a8,8,0,0,0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16A8,8,0,0,0,103,91.86l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153,91.86a8,8,0,0,0,6.75,4.92l63.92,5.16c.15,0,.24,0,.33.29S224,102.63,223.84,102.73Z';
  // ── 초안 미리 보기(2026-11-15) ──
  // 운영자 기기에서 town.html?draft=1 로 열면, 스팟 편집에서 아직 "모두에게 반영" 안 한 초안(이 브라우저에만 있음)으로
  // 지도를 그린다 — 묶음·우선순위를 바꾼 결과를 반영 전에 눈으로 확인하려는 것. 다른 사람에게는 아무 영향이 없다.
  var DRAFT_PREVIEW = false;
  if (/[?&]draft=1/.test(location.search) && isAdminDevice()) {
    try {
      var draft = JSON.parse(localStorage.getItem('petwalk_spot_draft'));
      if (draft && Array.isArray(draft.spots)) {
        window.PETWALK_SPOTS = draft.spots;
        if (Array.isArray(draft.categories)) window.PETWALK_SPOT_CATEGORIES = draft.categories;
        if (Array.isArray(draft.groups)) window.PETWALK_MAP_GROUPS = draft.groups;
        DRAFT_PREVIEW = true;
      }
    } catch (e) { /* 초안이 없거나 깨졌으면 서비스 내용 그대로 */ }
  }

  // ── 수호견 예시 화면(2026-11-17 가르시아 "수호견 샘플 두 군데 만들어 보자") ──
  // town.html?guardian_demo=1 로 열 때만 이 화면에 예시 수호견 두 마리를 띄운다. 공개 데이터(spots-data.js)에는 넣지 않는다 —
  // 실제 가게에 가짜 수호견을 붙여 모두에게 보이게 하지 않으려는 것(11/15 "사장님 허락 전 게시 → 내림", 수호견은 사장님 동의 필수).
  // 사장님께 보여 드릴 땐 주소에 가게 이름을 붙인다: &home=카페이름(재택 명예 수호견) &work=펫샵이름(출근 수호견).
  // 가게 이름은 주소로만 받고 어디에도 저장하지 않는다. 그림은 앱의 닮은꼴 그림(demo/guardian-*.jpg) —
  // AI 사진으로 바꾸려면 같은 이름으로 파일만 바꾸면 된다(정사각형, 강아지가 가운데).
  var GUARDIAN_DEMO = /[?&]guardian_demo=1/.test(location.search);
  var DEMO_DISCLAIMER = '예시 화면이에요 · 그림 강아지이고 실제 수호견이 아니에요';
  function demoParam(key, fallback) {
    var m = new RegExp('[?&]' + key + '=([^&#]*)').exec(location.search);
    var v = '';
    try { v = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')).trim().slice(0, 20) : ''; } catch (e) { v = ''; }
    return v || fallback;
  }
  function demoQuery() {   // 예시 화면끼리 넘어갈 때(주민증 보기) 가게 이름을 같이 넘긴다
    return '&guardian_demo=1' + ['home', 'work'].map(function (k) {
      var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search);
      return m ? '&' + k + '=' + m[1] : '';
    }).join('');
  }
  var DEMO_GUARDIANS = [
    { id: 'demo-home', cat: 'spot', name: demoParam('home', '○○ 카페'), lat: 37.6196, lng: 127.1583, source: 'demo',
      pet: { kind: 'food', indoor: 'no', terrace: true, water: true },
      guardian: { kind: 'home', name: '보리', signal: 'green', photo: 'demo/guardian-home.jpg', line: '가게엔 안 나가도 사장님 휴대폰 배경은 늘 저예요' } },
    { id: 'demo-work', cat: 'spot', name: demoParam('work', '○○ 펫샵'), lat: 37.6206, lng: 127.1626, source: 'demo',
      pet: { kind: 'pet', indoor: 'ok', large: 'all', water: true },
      guardian: { kind: 'work', name: '콩이', signal: 'yellow', photo: 'demo/guardian-work.jpg', line: '미용 끝난 친구들 배웅은 제 담당이에요' } }
  ];
  if (GUARDIAN_DEMO) window.PETWALK_SPOTS = (window.PETWALK_SPOTS || []).concat(DEMO_GUARDIANS);

  var BUILTIN_COUNT = CATEGORIES.length;
  function setCustomCategories(list) {
    CATEGORIES.length = BUILTIN_COUNT;
    (list || []).forEach(function (c) {
      if (!c || !c.key || !c.label) return;
      for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].key === c.key) return;
      CATEGORIES.push({ key: c.key, label: c.label, color: c.color || '#7a6a58', icon: CUSTOM_ICON, custom: true });
    });
  }
  setCustomCategories(window.PETWALK_SPOT_CATEGORIES);

  // source: 'osm' = OpenStreetMap에서 가져온 것(현장 확인 전), 'field' = 운영자가 직접 가서 확인한 것.
  // 샘플 모드여도 가게·수호지킴이는 서비스 데이터(spots-data.js) 그대로 보인다(2026-11-15).
  // 예전에는 샘플이 이 휴대폰에 따로 둔 가게 핀으로 서비스 핀을 가려서(replaces), 스팟 편집에서 고쳐도 지도에 안 바뀌었다.
  var SEED = (window.PETWALK_SPOTS || []).filter(function (p) {
    return p && p.id && typeof p.lat === 'number' && typeof p.lng === 'number';
  });
  function all() { return SEED.slice(); }

  function category(key) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].key === key) return CATEGORIES[i];
    return null;
  }

  // ── 지도 묶음·우선순위(2026-11-15 가르시아 "체계적으로 그룹화하고 우선순위를 스팟 편집에서 관리") ──
  // 지도에 올라가는 것을 "레이어"라 부른다: 스팟 종류(CATEGORIES) + 아래 고정 레이어 셋([동네]에만 있음).
  // 레이어를 묶음으로 나누고, 위에 있을수록 우선순위가 높다 — 칩이 앞에 오고, 핀이 겹치면 위에 그려진다.
  // 레이어마다: zoom(얼마나 넓게 볼 때까지 보일지), off(처음엔 꺼 둠 — 사용자가 켜면 보임).
  // 설정은 spots-data.js의 window.PETWALK_MAP_GROUPS = [{ id, label, layers: [{ key, zoom, off }] }].
  // 스팟 편집 페이지가 쓴다. 없으면 DEFAULT_GROUPS.
  var SYSTEM_LAYERS = [
    { key: 'stamp', label: '우리 개 발도장', color: '#b8563a', system: true },
    { key: 'mine', label: '내 핀', color: '#b8563a', system: true },
    { key: 'deco', label: '그림 강아지', color: '#e9c46a', system: true }
  ];
  var ZOOMS = {
    far:  { min: 13, label: '넓게 봐도 보임' },
    mid:  { min: 15, label: '기본 화면부터 보임' },
    near: { min: 16, label: '확대해야 보임' }
  };
  var ETC_GROUP_ID = 'etc';
  var DEFAULT_GROUPS = [
    { id: 'go', label: '갈 곳', layers: [{ key: 'spot', zoom: 'far' }, { key: 'park', zoom: 'far' }] },
    { id: 'dog', label: '우리 개', layers: [{ key: 'stamp', zoom: 'far' }, { key: 'mine', zoom: 'far' }] },
    { id: 'safe', label: '안전', layers: [{ key: 'caution', zoom: 'far' }, { key: 'vet', zoom: 'mid' }] },
    { id: 'handy', label: '편의', layers: [{ key: 'bag', zoom: 'mid' }, { key: 'water', zoom: 'mid' }, { key: 'toilet', zoom: 'mid' }] },
    { id: 'deco', label: '꾸밈', layers: [{ key: 'deco', zoom: 'mid' }] }
  ];
  function layerInfo(key) {
    var c = category(key);
    if (c) return c;
    for (var i = 0; i < SYSTEM_LAYERS.length; i++) if (SYSTEM_LAYERS[i].key === key) return SYSTEM_LAYERS[i];
    return null;
  }
  // 설정을 지금 있는 레이어에 맞춘다: 없어진 종류·겹친 것은 빼고, 어느 묶음에도 없는 레이어(새로 만든 종류)는 '기타' 묶음 끝에.
  // 돌려주는 값은 저장하는 모양 그대로 [{ id, label, layers: [{ key, zoom, off? }] }] — 편집 페이지도 이걸 쓴다.
  function normalizeGroups(groups) {
    var src = Array.isArray(groups) && groups.length ? groups : DEFAULT_GROUPS;
    var seen = {}, ids = {}, out = [];
    src.forEach(function (g) {
      if (!g || !g.id || ids[g.id]) return;
      ids[g.id] = true;
      var layers = [];
      (g.layers || []).forEach(function (l) {
        if (!l || seen[l.key] || !layerInfo(l.key)) return;
        seen[l.key] = true;
        var o = { key: l.key, zoom: ZOOMS[l.zoom] ? l.zoom : 'mid' };
        if (l.off) o.off = true;
        layers.push(o);
      });
      out.push({ id: g.id, label: String(g.label || '묶음').slice(0, 10), layers: layers });
    });
    var missing = CATEGORIES.concat(SYSTEM_LAYERS).filter(function (c) { return !seen[c.key]; });
    if (missing.length) {
      var etc = out.filter(function (g) { return g.id === ETC_GROUP_ID; })[0];
      if (!etc) { etc = { id: ETC_GROUP_ID, label: '기타', layers: [] }; out.push(etc); }
      missing.forEach(function (c) { etc.layers.push({ key: c.key, zoom: 'mid' }); });
    }
    return out;
  }
  // 화면이 쓰는 모양: { groups: [{ id, label, layers: [layer] }], list: [layer], byKey }
  // layer = { key, label, color, system, zoom, minZoom, off, rank(0이 가장 높음), z(Leaflet zIndexOffset 바탕값) }
  function layout(groups) {
    var norm = normalizeGroups(groups === undefined ? window.PETWALK_MAP_GROUPS : groups);
    var list = [], byKey = {};
    var total = norm.reduce(function (n, g) { return n + g.layers.length; }, 0);
    var res = norm.map(function (g) {
      return { id: g.id, label: g.label, layers: g.layers.map(function (l) {
        var info = layerInfo(l.key);
        var layer = {
          key: l.key, label: info.label, color: info.color, system: !!info.system,
          zoom: l.zoom, minZoom: ZOOMS[l.zoom].min, off: !!l.off,
          rank: list.length, z: (total - list.length) * 100
        };
        list.push(layer); byKey[l.key] = layer;
        return layer;
      }) };
    });
    return { groups: res, list: list, byKey: byKey };
  }

  // 사용자가 켜고 끈 상태 — 이 휴대폰에만. town.html이 쓴다(2026-11-16 2단계부터 산책 화면엔 시설 핀이 없다).
  //  petwalk_infra_filter: 사용자가 끈 레이어 / petwalk_infra_shown: "처음엔 꺼 둠"인 레이어 중 사용자가 켠 것
  function filterState(lay) {
    var hidden = {}, shown = {};
    function read(key, into) {
      try { (JSON.parse(localStorage.getItem(key)) || []).forEach(function (k) { into[k] = true; }); } catch (e) { /* 깨졌으면 기본 상태로 */ }
    }
    read('petwalk_infra_filter', hidden);
    read('petwalk_infra_shown', shown);
    function save() {
      try {
        localStorage.setItem('petwalk_infra_filter', JSON.stringify(Object.keys(hidden)));
        localStorage.setItem('petwalk_infra_shown', JSON.stringify(Object.keys(shown)));
      } catch (e) { /* 저장 실패해도 화면엔 반영됨 */ }
    }
    function defaultOff(key) { return !!(lay.byKey[key] && lay.byKey[key].off); }
    function isOff(key) { return !!hidden[key] || (defaultOff(key) && !shown[key]); }
    function set(key, on) {
      if (on) { delete hidden[key]; if (defaultOff(key)) shown[key] = true; }
      else { delete shown[key]; if (!defaultOff(key)) hidden[key] = true; }
      save();
    }
    return { isOff: isOff, set: set, toggle: function (key) { set(key, isOff(key)); } };
  }

  function iconSvg(key, size) {
    var c = category(key);
    if (!c) return '';
    size = size || 16;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="' + c.icon + '"/></svg>';
  }

  // 종류 아이콘만 있는 동그란 마커 HTML. 화면마다 CSS를 복사하지 않으려고 인라인 스타일.
  function markerHtml(key, px) {
    var c = category(key);
    if (!c) return '';
    px = px || 28;
    var shape = 'border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(74,63,53,0.35);';
    return '<div style="width:' + px + 'px;height:' + px + 'px;background:' + c.color +
      ';color:#fff;display:flex;align-items:center;justify-content:center;' + shape + '">' +
      iconSvg(key, Math.round(px * 0.54)) + '</div>';
  }

  function sourceText(pin) {
    if (pin.source === 'demo') return '예시 화면에만 보이는 가게예요 · 실제 지도에는 없어요';
    if (pin.source === 'field') return '직접 확인' + (pin.verifiedAt ? ' · ' + pin.verifiedAt : '');
    return 'OpenStreetMap 기준 · 현장 확인 전';
  }

  // ── 동반 조건(2026-11-15, 기획표 B-22 · 가르시아 "동반 가게 지도 강화부터") ──
  // 동반 스팟(가게)에 pet: { indoor: 'ok'|'carrier'|'no', large: 'all'|'small', terrace: true, water: true }로 붙는다.
  // 빈 칸은 "확인 전"이라 지도에 안 나온다. 운영자가 직접 가서 확인한 것만 스팟 편집에서 넣는다.
  // 예전 데이터는 자유 태그(실내OK·대형견OK)로만 적혀 있어서, 아는 태그는 칸으로 바꿔 읽는다
  // (스팟 편집에서 그 가게를 저장하면 태그가 칸으로 옮겨진다).
  var PET_LABELS = {
    indoor: { ok: '실내 OK', carrier: '실내는 개모차·안고', no: '실내 안 됨' },
    large: { all: '대형견 OK', small: '소형견만' }
  };
  var PET_TAGS = {   // 띄어쓰기를 빼고 소문자로 맞춘 태그 → [칸, 값]
    '실내ok': ['indoor', 'ok'], '실내가능': ['indoor', 'ok'], '실내동반': ['indoor', 'ok'], '실내동반가능': ['indoor', 'ok'],
    '개모차': ['indoor', 'carrier'], '개모차필수': ['indoor', 'carrier'], '안고입장': ['indoor', 'carrier'], '이동장': ['indoor', 'carrier'],
    '실내불가': ['indoor', 'no'], '야외만': ['indoor', 'no'],
    '대형견ok': ['large', 'all'], '대형견가능': ['large', 'all'], '소형견만': ['large', 'small'],
    '테라스': ['terrace', true], '테라스ok': ['terrace', true], '야외석': ['terrace', true],
    '물그릇': ['water', true], '물그릇있음': ['water', true]
  };
  function petTag(t) { return PET_TAGS[String(t).replace(/\s+/g, '').toLowerCase()] || null; }
  // 가게 종류·기준 확인(2026-11-15, 반려동물 동반출입 음식점 제도 — hq notes/petwalk-pet-restaurant-rules.md):
  //   pet.kind: 'food'(음식점·카페·빵집·술집 = 식품접객업) | 'pet'(반려견 업종) | 'other'(음식을 안 파는 가게)
  //   pet.rules: true = 사장님이 "동반출입 음식점 기준(칸막이·표지판·예방접종 확인 등)을 갖췄다"고 확인
  // 음식을 파는 곳은 기준 확인이 없으면 실내 동반 표시를 지도에 내지 않는다 — 기준 없이 강아지를 들이면 사장님이 처분받을 수 있어서.
  // 바깥 자리(테라스)는 그대로 보여 준다. raw=true면 숨기지 않고 입력한 그대로(스팟 편집용).
  var PET_KINDS = { food: '음식·음료를 파는 곳', pet: '반려견 가게', other: '음식을 안 파는 가게' };
  function petInfo(pin, raw) {
    var info = {};
    ((pin && pin.tags) || []).forEach(function (t) { var m = petTag(t); if (m) info[m[0]] = m[1]; });
    var p = pin && pin.pet;
    if (p) {
      if (PET_LABELS.indoor[p.indoor]) info.indoor = p.indoor;
      if (PET_LABELS.large[p.large]) info.large = p.large;
      if (p.terrace) info.terrace = true;
      if (p.water) info.water = true;
      if (PET_KINDS[p.kind]) info.kind = p.kind;
      if (p.rules) info.rules = true;
    }
    if (!raw && info.kind === 'food' && (info.indoor === 'ok' || info.indoor === 'carrier') && !info.rules) {
      info.indoorHeld = info.indoor;   // 기준 확인 전 — 실내 표시는 숨긴다
      delete info.indoor;
    }
    return info;
  }
  // 칸으로 바꿔 읽은 것을 뺀 나머지 태그
  function extraTags(pin) { return ((pin && pin.tags) || []).filter(function (t) { return !petTag(t); }); }
  // 칩으로 보여 줄 것 — tone: ok(된다) · warn(조건 있음) · no(안 된다)
  function petBadges(pin) {
    var i = petInfo(pin), out = [];
    if (i.kind === 'pet') out.push({ key: 'kind', text: '반려견 가게', tone: 'ok' });
    // 음식 파는 곳의 실내 동반은 "사장님 확인"이 붙는다(기준을 갖췄다는 건 사장님 말 — 왈슨이 검사한 게 아님)
    if (i.indoor) out.push({ key: 'indoor', text: PET_LABELS.indoor[i.indoor] + (i.kind === 'food' && i.indoor !== 'no' ? ' (사장님 확인)' : ''), tone: i.indoor === 'ok' ? 'ok' : (i.indoor === 'carrier' ? 'warn' : 'no') });
    if (i.terrace) out.push({ key: 'terrace', text: '바깥 자리에서 함께', tone: 'ok' });
    if (i.large) out.push({ key: 'large', text: PET_LABELS.large[i.large], tone: i.large === 'all' ? 'ok' : 'warn' });
    if (i.water) out.push({ key: 'water', text: '물그릇', tone: 'ok' });
    return out;
  }
  // 우리 개 크기(프로필, 이 휴대폰에만 있음)에 맞지 않거나 아직 모를 때 한 줄로 알려 준다. 맞으면 null.
  function dogSize() {
    try { return (WalsonStore.profile() || {}).size || ''; } catch (e) { return ''; }   // 주민증(store.js)
  }
  function fitNote(pin, size) {
    if (!pin || pin.cat !== 'spot') return null;
    if (size === undefined) size = dogSize();
    var large = petInfo(pin).large;
    if (size === 'large') {
      if (large === 'small') return { tone: 'no', text: '소형견만 받아요 — 대형견은 들어가기 어려워요' };
      if (!large) return { tone: 'warn', text: '대형견도 되는지는 아직 확인 전이에요' };
    }
    if (size === 'medium' && large === 'small') return { tone: 'warn', text: '소형견만 받아요 — 중형견은 가게에 먼저 물어보세요' };
    return null;
  }
  // 직접 확인한 지 오래됐는지(일) — 동반 조건은 금방 바뀌어서(B-22) 90일이 넘으면 알린다
  function daysSinceVerified(pin) {
    if (!pin || !pin.verifiedAt) return null;
    var d = new Date(pin.verifiedAt + 'T00:00:00');
    if (isNaN(d)) return null;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  }
  // ── 동물병원 칸(2026-11-15 가르시아: 화장실·병원은 평소 숨기고 "급할 때"로, 나중에 병원과 협업할 때를 대비) ──
  // 동물병원 핀에 vet: { hours: '평일 9~21시 · 일 휴진', night: true, partner: true }로 붙는다. 스팟 편집에서 넣는다.
  // partner(왈슨 제휴)는 표시만 한다 — "급할 때" 목록의 순서는 제휴와 상관없이 거리 순(급할 때 광고가 앞서면 안 됨).
  // 제휴 문구는 사실만(수의사법 광고 제한: 거짓·치료 효과 오인·다른 병원과 비교 금지 — 기사 기준 확인, 법률 자문 아님).
  function vetInfo(pin) {
    var v = (pin && pin.cat === 'vet' && pin.vet) || {};
    return { hours: v.hours ? String(v.hours) : '', night: !!v.night, partner: !!v.partner };
  }
  var TONES = {
    ok:   { soft: 'background:#e2efdc;color:#2f6b3a;', ink: '#2f6b3a' },
    warn: { soft: 'background:#f8ebcf;color:#8a5a00;', ink: '#8a5a00' },
    no:   { soft: 'background:#f6dcd8;color:#a33a2f;', ink: '#a33a2f' }
  };

  // ── 가게 수호지킴이(2026-11-14 가르시아): 단골 가게를 지키는 강아지 ──
  // 동반 스팟에 guardian: { name, signal, photo, line } 으로 붙는다. photo는 spots/photos/의 파일 경로.
  // 가게 주인이 알려 주고 올려도 된다고 한 것만 운영자가 넣는다.
  var SIGNALS = {
    green:  { label: '초록불', line: '다가와도 좋아요', color: '#3f9b5b' },
    yellow: { label: '노랑불', line: '천천히 인사해요', color: '#dfa21f' },
    red:    { label: '빨강불', line: '눈으로만 예뻐해 주세요', color: '#d2493f' }
  };
  // ── 수호견 v2(2026-11-15) ──
  // 켜고 끄는 스위치는 이것 하나. false면 데이터에 수호견이 있어도 지도·목록·카드 어디에도 안 보인다.
  // 켜기 전에: 사장님 본인 동의, (음식점·카페는) 매장 조리·취식 공간에 두지 않는다는 확인 — 스팟 편집이 등록할 때 받는다.
  var GUARDIANS_ON = GUARDIAN_DEMO;   // 예시 화면(?guardian_demo=1)에서만 켜진다 — 공개 지도에선 꺼 둔 그대로
  // kind: 'home' = 재택 명예 수호견(음식점·카페 — 매장에 없음), 'work' = 출근 수호견(펫샵·미용실 등 비식품 업종)
  var GUARDIAN_KINDS = {
    home: { badge: '재택 명예 수호견', line: '사장님 댁 반려견이에요 · 가게엔 출근 안 하는 재택 명예 수호견' },
    work: { badge: '출근 수호견', line: '가게에서 손님을 맞는 사장님네 강아지예요' }
  };
  var GUARDIAN_DISCLAIMER = '사장님 동의를 받고 올렸어요 · 가게·브랜드와 제휴 관계가 아니에요';
  function guardianDisclaimer(pin) { return pin && pin.source === 'demo' ? DEMO_DISCLAIMER : GUARDIAN_DISCLAIMER; }
  function guardianKind(g) { return GUARDIAN_KINDS[g && g.kind] || GUARDIAN_KINDS.home; }
  function hasGuardianData(pin) { return !!(pin && pin.guardian && pin.guardian.name); }
  function hasGuardian(pin) { return GUARDIANS_ON && hasGuardianData(pin); }
  // 지도에 내세울 사진 — 수호지킴이 사진이 먼저, 없으면 가게 사진
  function mainPhoto(pin) {
    if (hasGuardian(pin) && pin.guardian.photo) return pin.guardian.photo;
    return pin.photo || null;
  }
  function escapeAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function escapeText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // 지도 마커(2026-11-14): 동네 스타(동반 스팟)를 앞에 세운다.
  //  - 사진이 있는 동반 스팟: 큰 동그라미 사진 + 이름표(수호지킴이 이름). 테두리는 신호등 색.
  //  - 사진 없는 동반 스팟: 큰 종류 아이콘.
  //  - 나머지 시설: 작고 옅게 — 배경 정보로 둔다.
  // 돌려주는 값: { icon: L.divIcon 옵션, zIndexOffset }
  // opts.badge: 동반 스팟 마커 오른쪽 위에 붙일 짧은 글자(예: 방문 도장으로 센 단골 "Lv2", 2026-11-15)
  function badgeHtml(text) {
    if (!text) return '';
    return '<div style="position:absolute;right:-8px;top:-8px;z-index:1;white-space:nowrap;padding:0 6px;height:20px;' +
      'font:900 11px/20px Pretendard,-apple-system,sans-serif;' +
      ('background:#4a3f35;color:#fff;border-radius:999px;border:2px solid #fff;line-height:16px;box-shadow:0 2px 6px rgba(74,63,53,0.35);') +
      '">' + escapeText(text) + '</div>';
  }
  function markerFor(pin, opts) {
    var badge = badgeHtml(opts && opts.badge);
    var photo = mainPhoto(pin);
    if (pin.cat === 'spot' && photo) {
      var sig = hasGuardian(pin) ? SIGNALS[pin.guardian.signal] : null;
      var ring = sig ? sig.color : '#b8563a';
      var label = hasGuardian(pin) ? pin.guardian.name : (pin.name || '');
      var html =
        '<div style="position:relative;width:58px;height:58px;">' +
          '<div style="width:58px;height:58px;overflow:hidden;border:4px solid ' + ring + ';box-sizing:border-box;' +
            ('border-radius:50%;background:#f3ddd2;box-shadow:0 4px 12px rgba(74,63,53,0.4);') + '">' +
            '<img src="' + escapeAttr(photo) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">' +
          '</div>' +
          '<div style="position:absolute;left:50%;top:60px;transform:translateX(-50%);white-space:nowrap;' +
            ('background:#fffaf3;color:#4a3f35;border:1px solid #e6d6c1;border-radius:999px;padding:1px 8px;' +
                 'font:800 12px Pretendard,-apple-system,sans-serif;box-shadow:0 2px 6px rgba(74,63,53,0.2);') + '">' +
            escapeText(label) + '</div>' + badge +
        '</div>';
      return { icon: { className: '', html: html, iconSize: [58, 58], iconAnchor: [29, 29], popupAnchor: [0, -28] }, zIndexOffset: 1000 };
    }
    if (pin.cat === 'spot') {
      return { icon: { className: '', html: '<div style="position:relative;width:40px;height:40px;">' + markerHtml('spot', 40) + badge + '</div>', iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -18] }, zIndexOffset: 800 };
    }
    return { icon: { className: '', html: '<div style="opacity:0.82">' + markerHtml(pin.cat, 24) + '</div>', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -10] }, zIndexOffset: 0 };
  }

  // 팝업(2026-11-14): 사진이 있으면 사진을 가운데에 크게 세운다. 지도 화면들이 같이 쓴다.
  // 쓰는 법: L.marker(...).bindPopup(InfraPins.popupEl(pin), InfraPins.POPUP_OPTS)
  // opts.extraEl: 링크 줄 바로 위에 끼울 화면별 칸([동네]의 걸어서 N분·방문 도장, 2026-11-15)
  // 위쪽(제목·칩·편집 버튼)과 아래쪽(동네 스타 줄·탭)에 가리지 않게 여유를 두고 지도를 옮겨 연다
  var POPUP_OPTS = { minWidth: 230, maxWidth: 260, autoPanPaddingTopLeft: [16, 162], autoPanPaddingBottomRight: [16, 190] };
  function el(tag, css, text) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (text != null) e.textContent = text;
    return e;
  }
  function popupEl(pin, opts) {
    var cat = category(pin.cat) || { label: '', color: '#6b5d4e' };
    var wrap = el('div', 'display:flex;flex-direction:column;gap:5px;font:13px/1.45 Pretendard,-apple-system,"Malgun Gothic",sans-serif;color:#4a3f35;');
    var photo = mainPhoto(pin);
    var g = hasGuardian(pin) ? pin.guardian : null;
    var sig = g ? SIGNALS[g.signal] : null;

    if (photo) {
      var frame = el('div', 'position:relative;margin:-2px -2px 4px;overflow:hidden;' +
        ('border-radius:14px;background:#f3ddd2;') +
        'aspect-ratio:4/3;' + (sig ? 'box-shadow:inset 0 -6px 0 ' + sig.color + ';' : ''));
      var img = el('img', 'width:100%;height:100%;object-fit:cover;display:block;');
      img.src = photo;
      img.alt = g ? g.name : (pin.name || '');
      frame.appendChild(img);
      if (g) {
        frame.appendChild(el('div',
          'position:absolute;left:8px;top:8px;background:rgba(255,250,243,0.92);color:#b8563a;' +
            'border-radius:999px;padding:2px 9px;font-size:11px;font-weight:800;', guardianKind(g).badge));
      }
      wrap.appendChild(frame);
    }
    if (g) {
      wrap.appendChild(el('div', 'font-size:20px;font-weight:800;letter-spacing:-0.01em;', g.name));
      if (sig) wrap.appendChild(el('div', 'font-size:12px;font-weight:700;color:' + sig.color + ';', sig.label + ' · ' + sig.line));
      if (g.line) wrap.appendChild(el('div', 'font-size:13px;', '“' + g.line + '”'));
      var shop = el('div', 'font-size:13px;color:#6b5d4e;margin-top:2px;');
      shop.appendChild(el('span', 'font-weight:700;color:' + cat.color + ';', cat.label));
      shop.appendChild(document.createTextNode(' · ' + (pin.name || '')));
      wrap.appendChild(shop);
    } else {
      wrap.appendChild(el('div', 'font-size:11px;font-weight:700;color:' + cat.color + ';', cat.label));
      wrap.appendChild(el('div', 'font-size:' + (photo ? 18 : 14) + 'px;font-weight:800;', pin.name || cat.label));
    }
    // 동반 스팟: 동반 조건 칩(된다·조건 있음·안 된다 색으로) + 나머지 태그. 다른 시설: 태그 그대로.
    var isShop = pin.cat === 'spot';
    var badges = isShop ? petBadges(pin) : [];
    var plainTags = isShop ? extraTags(pin) : (pin.tags || []);
    if (badges.length || plainTags.length) {
      var tags = el('div', 'display:flex;flex-wrap:wrap;gap:4px;');
      badges.forEach(function (b) {
        tags.appendChild(el('span', 'font-size:11px;font-weight:800;padding:1px 7px;' +
          ('border-radius:999px;' + TONES[b.tone].soft), b.text));
      });
      plainTags.forEach(function (t) {
        tags.appendChild(el('span', 'font-size:11px;font-weight:700;padding:1px 7px;border-radius:999px;background:#efe0cd;', t));
      });
      wrap.appendChild(tags);
    }
    if (pin.cat === 'vet') {
      var vi = vetInfo(pin);
      if (vi.night || vi.partner) {
        var vtags = el('div', 'display:flex;flex-wrap:wrap;gap:4px;');
        if (vi.night) vtags.appendChild(el('span', 'font-size:11px;font-weight:800;padding:1px 7px;' + ('border-radius:999px;' + TONES.ok.soft), '야간 진료'));
        if (vi.partner) vtags.appendChild(el('span', 'font-size:11px;font-weight:800;padding:1px 7px;' + ('border-radius:999px;background:#efe0cd;'), '왈슨 제휴'));
        wrap.appendChild(vtags);
      }
      if (vi.hours) wrap.appendChild(el('div', 'font-size:12px;font-weight:700;', '진료 시간 ' + vi.hours));
      if (vi.partner) wrap.appendChild(el('div', 'font-size:11px;color:#6b5d4e;', '왈슨과 제휴한 병원이에요 · 진료 내용과 비용은 병원에 물어보세요'));
    }
    if (isShop) {
      var fit = fitNote(pin);
      if (fit) wrap.appendChild(el('div', 'font-size:12px;font-weight:800;color:' + (TONES[fit.tone].ink) + ';', fit.text));
      if (!badges.length) wrap.appendChild(el('div', 'font-size:12px;color:#6b5d4e;', '동반 조건은 아직 확인 전이에요 — 가기 전에 가게에 물어보세요'));
      var age = daysSinceVerified(pin);
      if (age != null && age > 90) wrap.appendChild(el('div', 'font-size:12px;font-weight:700;color:#8a5a00;', '확인한 지 ' + Math.floor(age / 30) + '달이 지났어요 — 조건이 바뀌었을 수 있어요'));
    }
    // 진료 시간을 넣은 병원은 예전 OSM 안내("진료 시간은 확인 전이에요")를 감춘다 — 서로 어긋나 보이지 않게
    if (pin.note && !(pin.cat === 'vet' && vetInfo(pin).hours && /진료 시간은 확인 전/.test(pin.note))) wrap.appendChild(el('div', '', pin.note));
    // 출처를 항상 보여 준다 — 직접 확인하지 않은 정보를 확인된 것처럼 보이게 하지 않기 위함
    wrap.appendChild(el('div', 'font-size:11px;color:#6b5d4e;', sourceText(pin)));
    // 수호견은 가게·브랜드의 공식 캐릭터가 아니다 — 제휴로 오해하지 않게(2026-11-15, 상표 혼동 방지)
    if (g) {
      wrap.appendChild(el('div', 'font-size:11px;color:#6b5d4e;', guardianKind(g).line));
      wrap.appendChild(el('div', 'font-size:11px;color:#6b5d4e;', guardianDisclaimer(pin)));
    }

    if (opts && opts.extraEl) wrap.appendChild(opts.extraEl);
    var links = el('div', 'display:flex;flex-wrap:wrap;gap:12px;margin-top:2px;');
    var linkCss = 'font-size:12px;font-weight:700;color:#b8563a;text-decoration:none;';
    if (g) {
      var card = el('a', linkCss, '주민증 보기');
      card.href = 'start.html?guardian=' + encodeURIComponent(pin.id) + (pin.source === 'demo' ? demoQuery() : '');
      links.appendChild(card);
    }
    // 길찾기는 카카오맵 웹 링크 — 넘기는 건 이 장소의 이름·좌표뿐이고 내 위치는 넣지 않는다
    var nav = el('a', linkCss, '길찾기');
    nav.href = 'https://map.kakao.com/link/to/' + encodeURIComponent(pin.name || cat.label) + ',' + pin.lat + ',' + pin.lng;
    nav.target = '_blank';
    nav.rel = 'noopener';
    if (pin.source !== 'demo') links.appendChild(nav);   // 예시 가게는 실제 자리가 아니라 길찾기를 걸지 않는다
    if (pin.phone) {
      var tel = el('a', linkCss, '전화 걸기');
      tel.href = 'tel:' + String(pin.phone).replace(/[^0-9+]/g, '');
      links.appendChild(tel);
    }
    wrap.appendChild(links);
    return wrap;
  }

  // 운영자 기기인지 — 스팟 편집 버튼을 보일지(2026-11-15).
  // 스팟 편집 페이지(spot-editor.html)에 GitHub 토큰을 넣은 브라우저만 운영자 기기로 본다.
  // 잠금은 이 판정이 아니라 토큰이다 — 토큰이 없으면 편집 페이지를 열어도 저장소에 쓸 수 없다.
  function isAdminDevice() {
    try { if (localStorage.getItem('petwalk_admin_token')) return true; } catch (e) { /* 무시 */ }
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  }

  window.InfraPins = {
    CATEGORIES: CATEGORIES, SEED: SEED, all: all,
    category: category, iconSvg: iconSvg, markerHtml: markerHtml, markerFor: markerFor, sourceText: sourceText,
    SIGNALS: SIGNALS, hasGuardian: hasGuardian, mainPhoto: mainPhoto,
    popupEl: popupEl, POPUP_OPTS: POPUP_OPTS, isAdminDevice: isAdminDevice,
    setCustomCategories: setCustomCategories, GUARDIAN_DISCLAIMER: GUARDIAN_DISCLAIMER,
    GUARDIANS_ON: GUARDIANS_ON, GUARDIAN_DEMO: GUARDIAN_DEMO, DEMO_GUARDIANS: GUARDIAN_DEMO ? DEMO_GUARDIANS : [], guardianDisclaimer: guardianDisclaimer, GUARDIAN_KINDS: GUARDIAN_KINDS, guardianKind: guardianKind, hasGuardianData: hasGuardianData,
    SYSTEM_LAYERS: SYSTEM_LAYERS, ZOOMS: ZOOMS, DEFAULT_GROUPS: DEFAULT_GROUPS, ETC_GROUP_ID: ETC_GROUP_ID,
    layerInfo: layerInfo, normalizeGroups: normalizeGroups, layout: layout, filterState: filterState,
    PET_LABELS: PET_LABELS, PET_KINDS: PET_KINDS, petTag: petTag, petInfo: petInfo, extraTags: extraTags, petBadges: petBadges,
    fitNote: fitNote, dogSize: dogSize, daysSinceVerified: daysSinceVerified, TONES: TONES, vetInfo: vetInfo,
    DRAFT_PREVIEW: DRAFT_PREVIEW
  };
})();
