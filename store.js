// 이 휴대폰 저장소 한 곳(2026-11-17 리팩토링 — 예약 작업 "서버·네이티브 대비", PLATFORM_PLAN.md). 전역 window.WalsonStore.
// - 키 이름과 저장 형식(JSON)은 예전 그대로다. 예전 기록이 그대로 읽혀야 하니 형식을 바꾸지 말 것.
// - 화면·스크립트는 localStorage를 직접 만지지 말고 여기를 거친다. 핵심 기록(산책·진행 중 산책·주민증·방문·핀·도감)부터 옮겼다.
//   아직 직접 만지는 곳은 PLATFORM_PLAN.md 7절에 적어 둔다.
// - 나중에 서버(로그인 뒤 백업)나 네이티브(Capacitor Preferences 등)로 갈 때 이 파일만 바꾸면 되게 한다.
// - 사진은 IndexedDB에 따로 있다: walk-photos.js → window.WalkPhotos(데이터베이스 'petwalk-photos', 저장소 'photos').
(function () {
  // ── 키 목록(무엇·위치에서 나온 정보인지). '위치'는 좌표·경로·장소+시각이 들어 있다는 뜻 ──
  var K = {
    // 핵심 기록
    walks: 'petwalk_walks',               // [산책 기록] date·distanceKm·durationMin·route·stampRoute·rewardEligible·gapMin·startedAt·endedAt·mode·noRoute·logged·loggedAt·feel·sniff·poop·photoKey·poopToon·demo — 위치(경로)
    activeRoute: 'petwalk_active_route',  // 길 기록 중인 산책 {v:1,startedAt,samples:[[lat,lng,t,s]],liveKm,visited,gapMs,savedAt} — 위치(원래 궤적, 가장 민감)
    activeWalk: 'petwalk_active_walk',    // 시간만 재는 중인 산책 {startedAt}
    lastWalk: 'petwalk_last_walk',        // 마지막 산책 요약 {distanceKm,totalDistanceKm,durationMin} — 지금 읽는 곳 없음
    profile: 'petwalk_profile',           // 주민증 {name,size,signal,photo,cardNo,cardIssued,tag, photoOrig·photoFrame(프로필 사진 원본·맞춤 2026-11-18)}
    rewardCard: 'petwalk_reward_card',    // 주민증 특기·특이 사항 {skill,passive}
    keyring: 'petwalk_keyring',           // 키링 받음 {givenAt}
    visits: 'petwalk_visits',             // 가게 방문 도장 [{s:스팟번호,d:날짜}] — 위치(장소+날짜, QR로 찍음)
    pins: 'petwalk_pins',                 // 산책 중 메모 핀 [{id,lat,lng,memo}] — 위치
    dex: 'petwalk_dex',                   // 강아지 도감 [{i,n,s,g,c,first,last,days}]
    dexMe: 'petwalk_dex_me',              // 내 도감 번호(8글자)
    receipts: 'walson_receipts',          // 영수증 꾸미기 {영수증키:{note,custom,photo,pos,px,zoom,stickers}}
    walkType: 'petwalk_walk_type',        // 산책 유형 테스트 결과 {type,at}
    // 설정
    walkLocation: 'petwalk_walk_location',   // 산책에 위치를 쓸지 'on'|'off'
    keepScreen: 'petwalk_keep_screen',       // 산책 중 화면 켜 두기 '1'(11/17부터 기본 켜짐이라 안 씀 — 아래 keepScreenOff)
    keepScreenOff: 'petwalk_keep_screen_off', // 산책 중 화면 켜 두기를 끈 사람 '1'(2026-11-17 가르시아 "앱을 켜고 산책하게" — 기본 켜짐)
    infraFilter: 'petwalk_infra_filter',     // 동네 지도 시설 거르기
    infraShown: 'petwalk_infra_shown',
    receiptFmt: 'walson_receipt_fmt',        // 'story'|'feed'
    toonName: 'petwalk_toon_name',           // 응가 캐릭터 이름(주민증이 없을 때)
    toonEyes: 'petwalk_toon_eyes',           // 응가 캐릭터 눈매
    dogSize: 'petwalk_dog_size',             // 예전 크기 값(샘플이 씀)
    // 한 번 보면 안 띄우는 안내·표시
    locationExplained: 'petwalk_location_explained',
    cameraExplained: 'petwalk_camera_explained',
    toonRecent: 'petwalk_toon_recent',
    importedAt: 'petwalk_imported_at',       // 기록을 불러온 날(키링 중복 막기)
    movedAt: 'petwalk_moved_at',
    // 샘플 보기
    sampleMode: 'petwalk_sample_mode',
    sampleBackup: 'petwalk_sample_backup',   // 샘플을 켜 둔 동안 진짜 기록 보관 — 위치(진짜 산책·핀 사본)
    sampleAutoDone: 'petwalk_sample_auto_done',
    // 통계(track.js)
    device: 'walson_device', trackConsent: 'walson_track_consent', fromFirst: 'walson_from_first', fromLast: 'walson_from_last',
    // 운영자·시험
    adminToken: 'petwalk_admin_token',       // 운영자 GitHub 토큰 — 내보내기·서버로 보내지 않는다
    spotDraft: 'petwalk_spot_draft',
    mockServer: 'petwalk_mock_server', mockDb: 'petwalk_mock_db',
    demoSpeed: 'petwalk_demo_speed', demoPath: 'petwalk_demo_path', demoStart: 'petwalk_demo_start'   // 시연 모드(시작점은 위치일 수 있음)
  };

  var lastError = null;   // 마지막 쓰기 실패의 브라우저 오류(알림에 덧붙이던 글을 그대로 보여 주려고)
  function ls() { try { return window.localStorage; } catch (e) { lastError = e; return null; } }
  // 글자 그대로 읽기·쓰기. 쓰기는 저장 공간이 꽉 찼거나 막혔으면 false(오류는 WalsonStore.lastError())
  function get(key) { var s = ls(); if (!s) return null; try { return s.getItem(key); } catch (e) { return null; } }
  function set(key, value) { var s = ls(); if (!s) return false; try { s.setItem(key, value); lastError = null; return true; } catch (e) { lastError = e; return false; } }
  function remove(key) { var s = ls(); if (!s) return; try { s.removeItem(key); } catch (e) { /* 지우지 못해도 그대로 */ } }
  // JSON. 없거나 깨졌거나 null이면 fallback
  function json(key, fallback) {
    var raw = get(key);
    if (raw == null) return fallback;
    try { var v = JSON.parse(raw); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function setJSON(key, value) { return set(key, JSON.stringify(value)); }
  function list(key) { var v = json(key, null); return Array.isArray(v) ? v : []; }
  function object(key) { var v = json(key, null); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; }
  function flag(key) { return get(key) === '1'; }
  function setFlag(key, on) { if (on) return set(key, '1'); remove(key); return true; }

  // 산책 하나를 가리키는 열쇠(같은 산책을 다른 화면에서 찾을 때) — 끝난 시각 → 적은 시각 → 시작 시각 → 날짜
  function walkId(w) { return w ? String(w.endedAt || w.loggedAt || w.startedAt || w.date || '') : ''; }

  window.WalsonStore = {
    KEYS: K,
    lastError: function () { return lastError; },
    get: get, set: set, remove: remove, json: json, setJSON: setJSON, list: list, object: object, flag: flag, setFlag: setFlag,
    // 산책 기록
    walks: function () { return list(K.walks); },
    saveWalks: function (arr) { return setJSON(K.walks, arr); },
    walkId: walkId,
    lastWalk: function () { return object(K.lastWalk); },
    saveLastWalk: function (o) { return setJSON(K.lastWalk, o); },
    // 진행 중 산책
    activeRoute: function () { return object(K.activeRoute); },
    saveActiveRoute: function (o) { return setJSON(K.activeRoute, o); },
    clearActiveRoute: function () { remove(K.activeRoute); },
    activeWalk: function () { return object(K.activeWalk); },
    saveActiveWalk: function (o) { return setJSON(K.activeWalk, o); },
    clearActiveWalk: function () { remove(K.activeWalk); },
    // 주민증
    profile: function () { return object(K.profile); },
    saveProfile: function (p) { return setJSON(K.profile, p); },
    rewardCard: function () { return object(K.rewardCard); },
    saveRewardCard: function (o) { return setJSON(K.rewardCard, o); },
    keyring: function () { return object(K.keyring); },
    saveKeyring: function (o) { return setJSON(K.keyring, o); },
    // 가게 방문·핀·도감
    visits: function () { return list(K.visits); },
    saveVisits: function (arr) { return setJSON(K.visits, arr); },
    pins: function () { return list(K.pins); },
    savePins: function (arr) { return setJSON(K.pins, arr); },
    dex: function () { return list(K.dex); },
    saveDex: function (arr) { return setJSON(K.dex, arr); },
    // 샘플 보기
    sampleOn: function () { return flag(K.sampleMode); }
  };
})();
