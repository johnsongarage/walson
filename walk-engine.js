// 길 기록 산책 엔진(화면 없음) — 전역 window.WalkEngine.
// 2026-11-17 리팩토링(예약 작업 "서버·네이티브 대비", 저장을 store.js로 모은 다음 단계): walk.html 한 덩어리를
// "그림이 아닌 것"(이 파일)과 화면(walk.html)으로 나눴다. 동작·시각·저장 형식·주소·알림 창 글·통계는 나누기 전과 같다(옮기기만 함).
//
// 여기 있는 것: 위치 받기(watchPosition · 다시 열 때 바로 읽기 freshFix), 정확도·이미 받은 위치 거르기, 제자리 흔들림·튀는 점 거르기
//   (JITTER · dropSpike), 끊김(GAP_MS · seenT), 걸은 거리(liveKm), 산책 끝 판정(analyzeWalk)·길 줄이기·멈춘 시각 어림·빠른 구간,
//   미션·발도장 바로 판정, 진행 중 산책 저장(10초에 한 번)·이어 하기(오래된 산책 묻기 포함), 시작·끝내기(기록·통계·"끝내기를 깜빡하셨나요?"),
//   위치 거부 → 시간만 재기로, 화면이 숨겨지면 저장·다시 보이면 위치 바로 읽기, ?start=1 바로 시작, 산책 중이 아니면 산책 나가기로.
//   알림 창(confirm·alert)과 화면 넘기기(location.replace)도 예전 자리 그대로 여기서 한다.
// walk.html에 남은 것(화면): 큰 시간·미션 카드·알림 띠(+진동)·메뉴·끝내기 두 번·지도 보기·핀·화면 켜 두기(Wake Lock)·시연 모드 버튼·가게 QR.
//   진동·화면 켜 두기 같은 기기 기능은 다음 단계에서 device.js로 옮긴다.
//
// 쓰는 법 — walk.html이 화면을 다 준비한 뒤:
//   WalkEngine.init({
//     onState(state, why)   — 산책 중/아님이 바뀜. why: 'start' 새로 시작 · 'resume' 이어 하기 · 'stop' 끝냄 ·
//                             'fallback' 위치 거부로 시간만 재기로 · 'discard' 저장하지 않고 버림(시연 모드 바꾸기)
//                             → 화면: 산책 중이면 화면 켜 두기·출발 시각·시계(새로 시작이면 주머니 안내), 아니면 화면 켜 두기 풀기
//     onFix(state, mapToo)  — 위치가 들어와(또는 시작·이어 하기로) 지금 위치·길·거리·발도장이 바뀜 → 화면: 미션 카드를 다시 그림,
//                             mapToo이고 지도를 펼쳐 둔 중이면 지도도. 이미 받은 시각의 위치일 때만 mapToo가 false(예전 그대로 지도는 둠)
//     onStamp(place, kind)  — 바로 판정한 발도장(place는 RewardRules.PLACES의 장소). kind 'got' 받음 → 알림 띠·진동 /
//                             'pending' 도착했지만 5분·200m 전 → 안내(기준을 넘는 순간 같은 장소로 'got'이 온다)
//     onNotice(text, kind)  — 엔진이 보여 달라는 안내 글(끊겼다 다시 이어서 기록 · 이어 하기). kind 'info' · 'warn'
//   });                       // init은 화면 숨김(visibilitychange)·떠남(pagehide) 듣기를 한 번만 건다 — 화면 쪽 듣기는 그 전에 걸어 둔다
//   WalkEngine.resume();      // 앱이 닫혔다 다시 열렸으면 이어 하기
//   WalkEngine.autoStart();   // ?start=1 이면 바로 시작
//   WalkEngine.exitIfIdle();  // 그래도 산책 중이 아니면 산책 나가기(go.html)로
//   그 밖: start() 시작 · stop(opts) 끝내기(opts.endMs: 끝난 시각을 정할 때) · discard() 저장하지 않고 멈춤(화면이 먼저 묻는다)
//   읽기: state() → { walking, leaving, startedAt, routeSamples:[{c:[lat,lng], t, s?}], routeCoords:[[lat,lng]], lastFix:[lat,lng]|null,
//           liveKm, liveVisited:{장소id:'got'|'pending'|'old'}, gapMs } — 배열·객체는 엔진이 쓰는 것 그대로라 읽기만 한다
//         missionProgress() · missionNow() → { all, now } | null · isDemo() · now()(시연 모드면 배속 시계)
//   규칙·도우미: RULES · GAP_MS · JITTER · seenT(sample) · haversineKm · bearingDeg · kmText · pad2 ·
//               isFastSegment · analyzeWalk · simplifyRoute · estimateRestStart
// 먼저 불러야 하는 것: store.js · spots-data.js → reward-rules.js · demo-geo.js · track.js · sample-data.js(모두 쓸 때 찾으므로 이 파일보다 앞이면 된다).
// 위치는 이 휴대폰 안에서만 쓴다 — 저장은 WalsonStore(이 기기), 통계(track.js)에는 좌표·장소를 보내지 않는다(CLAUDE.md 개인정보 취급).
(function () {
  // 산책 기록·마지막 산책 요약·진행 중 산책은 store.js(WalsonStore)로 읽고 쓴다
  var LOCATION_EXPLAINED_KEY = 'petwalk_location_explained';

  // 최소한의 조작 방지(2026-09-25) — 완벽히 막는 게 아니라 "명백히 산책이 아닌 것"만 거른다.
  var WALK_RULES = {
    maxAccuracyM: 50,      // 이보다 부정확한 GPS 점은 버림(튀는 점 때문에 거리가 부풀려지는 것 방지)
    maxWalkSpeedKmh: 15,   // 이보다 빠른 구간(차/자전거)은 산책 거리·발도장에서 뺌
    minRewardMinutes: 5,   // 이보다 짧은 산책은 기록만 남고 보상 횟수엔 안 들어감
    minRewardKm: 0.2
  };
  // 화면 꺼짐(2026-09-26) · 주머니 산책(2026-11-16): 모바일 브라우저는 화면이 꺼지거나 다른 앱으로 가면 위치를 못 받는다.
  // 끊긴 구간은 앞뒤 점을 직선으로 잇고, 걷는 속도면 거리·바로 판정에 넣는다(산책 끝 판정 analyzeWalk와 같은 기준).
  // 2026-11-16 가르시아 실사용 캡처: 30~50초 꺼졌던 곳이 실선 직선으로 나와 걸은 길처럼 보였다 → 30초로 낮춤
  var GAP_MS = 30 * 1000;
  // GPS 흔들림 거르기(2026-11-16 같은 캡처 — 건물 앞 작은 삼각형·갈고리 모양):
  //  ① 제자리 흔들림: 마지막으로 남긴 점에서 몇 m도 안 움직인 점은 길에 넣지 않는다(그 점의 '마지막으로 본 시각' s만 늘린다 — 서 있던 동안을 끊김으로 착각하지 않게)
  //  ② 튀었다 돌아온 점: A→B→C에서 B만 혼자 멀리 튀고 C가 A 근처로 돌아왔는데, 짧은 시간에 걷기로는 어려운 거리면 B를 지운다
  var JITTER = { minStepM: 5, maxStepM: 15, accFactor: 0.8, spikeMinM: 8, spikeMaxMs: 12000, spikeBackRatio: 0.35 };
  function seenT(p) { return p.s || p.t; }   // 그 자리에서 위치를 마지막으로 받은 시각(제자리 흔들림을 건너뛴 동안 늘어난다)
  // 앱이 아예 닫혀도(아이폰이 숨겨 둔 앱을 정리) 이어지게 진행 중인 산책을 이 휴대폰에만 저장한다. 시연 모드 산책은 저장 안 함.
  // 저장 모양(store.js activeRoute): { v:1, startedAt, samples:[[lat,lng,ms]], liveKm, visited, gapMs, savedAt }
  var ROUTE_STALE_MS = 3 * 60 * 60 * 1000;
  var REST_RADIUS_KM = 0.05, REST_ASK_MS = 20 * 60 * 1000;

  function isDemo() { return !!(window.PetwalkDemoGeo && PetwalkDemoGeo.on); }
  function nowMs() { return isDemo() ? PetwalkDemoGeo.now() : Date.now(); }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function dateKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function loadWalks() { return WalsonStore.walks(); }
  function haversineKm(a, b) {
    var R = 6371, t = Math.PI / 180;
    var dLat = (b[0] - a[0]) * t, dLng = (b[1] - a[1]) * t;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function bearingDeg(a, b) {
    var t = Math.PI / 180, y = Math.sin((b[1] - a[1]) * t) * Math.cos(b[0] * t);
    var x = Math.cos(a[0] * t) * Math.sin(b[0] * t) - Math.sin(a[0] * t) * Math.cos(b[0] * t) * Math.cos((b[1] - a[1]) * t);
    return (Math.atan2(y, x) / t + 360) % 360;
  }
  function kmText(km) { return km < 1 ? Math.round(km * 100) * 10 + 'm' : km.toFixed(1) + 'km'; }
  function isFastSegment(a, b) {
    var hours = (b.t - a.t) / 3600000;
    return hours > 0 && haversineKm(a.c, b.c) / hours > WALK_RULES.maxWalkSpeedKmh;
  }
  // samples: [{ c: [lat,lng], t: ms }] → 걷는 속도 구간만 합친 거리와 그 구간의 점들(발도장 판정용)
  function analyzeWalk(samples) {
    var walkKm = 0, fastKm = 0, walkingPoints = [];
    for (var i = 1; i < samples.length; i++) {
      var a = samples[i - 1], b = samples[i];
      var km = haversineKm(a.c, b.c), hours = (b.t - a.t) / 3600000;
      if (hours <= 0) continue;
      if (km / hours > WALK_RULES.maxWalkSpeedKmh) fastKm += km;
      else { walkKm += km; walkingPoints.push(a.c, b.c); }
    }
    return { walkKm: walkKm, fastKm: fastKm, walkingPoints: walkingPoints };
  }
  // [기록] 썸네일용으로 듬성듬성 줄인다(최대 60개 점)
  function simplifyRoute(coords, maxPoints) {
    if (coords.length <= maxPoints) return coords.slice();
    var step = Math.ceil(coords.length / maxPoints), out = [];
    for (var i = 0; i < coords.length; i += step) out.push(coords[i]);
    var last = coords[coords.length - 1];
    if (out[out.length - 1][0] !== last[0] || out[out.length - 1][1] !== last[1]) out.push(last);
    return out;
  }
  // 마지막 점에서 REST_RADIUS_KM 안에 처음 들어온 시각 = 멈춰 선 시각. 한 번도 그 밖에 나간 적이 없으면 null
  function estimateRestStart(samples) {
    if (!samples || samples.length < 2) return null;
    var last = samples[samples.length - 1].c;
    for (var i = samples.length - 2; i >= 0; i--) {
      if (haversineKm(samples[i].c, last) > REST_RADIUS_KM) return samples[i + 1].t;
    }
    return null;
  }

  // ── 상태 ──
  var walking = false, leaving = false, walkStartTime = null, watchId = null;
  var routeCoords = [], routeSamples = [], liveKm = 0, liveVisited = {}, walkGapMs = 0, lastFix = null;
  var routeSavedAt = 0;
  var locationExplained = false;

  // ── 화면에 알리기(init으로 받은 것) ──
  var cb = {};
  function emit(name, a, b) { if (typeof cb[name] === 'function') cb[name](a, b); }
  // 지금 상태 — 배열·객체는 엔진 것 그대로(읽기만)
  function state() {
    return {
      walking: walking, leaving: leaving, startedAt: walkStartTime,
      routeSamples: routeSamples, routeCoords: routeCoords, lastFix: lastFix,
      liveKm: liveKm, liveVisited: liveVisited, gapMs: walkGapMs
    };
  }
  // 위치가 들어와 바뀐 것을 화면에(미션 카드 · mapToo면 펼친 지도도)
  function notifyFix(mapToo) { emit('onFix', state(), mapToo); }

  // ── 미션(2026-11-15 지도 미션) ── 다음 미션 = 발도장 장소 중 순서대로 안 간 첫 곳(reward-rules.js)
  // 지난 산책들의 진행도는 산책 중에 바뀌지 않으니 한 번만 센다(위치를 받을 때마다 기록 전체를 다시 훑지 않게)
  var baseProgress = null;
  function missionProgress() {
    if (!baseProgress) baseProgress = window.RewardRules.computeProgress(loadWalks());
    var visited = {};
    Object.keys(baseProgress.visited).forEach(function (id) { visited[id] = true; });
    Object.keys(liveVisited).forEach(function (id) { if (liveVisited[id] === 'got') visited[id] = true; });
    return { walks: baseProgress.walks, km: baseProgress.km, visited: visited };
  }
  function missionNow() {
    var R = window.RewardRules;
    if (!R || !R.missions) return null;
    var p = missionProgress();
    return { all: R.missions(p), now: R.currentMission(p) };
  }

  // 걷는 속도로 들어온 점 하나를 보고 발도장 장소 안이면 알린다. eligible: 지금까지 5분·200m를 넘었는지
  function checkLiveStamp(coord, eligible) {
    var R = window.RewardRules;
    if (!R || !R.placeAt) return;
    Object.keys(liveVisited).forEach(function (id) {   // 도착했지만 5분·200m 전이라 미뤄 둔 도장 — 기준을 넘는 순간 받는다
      if (liveVisited[id] === 'pending' && eligible) { liveVisited[id] = 'got'; announceStamp(id); }
    });
    var pl = R.placeAt(coord);
    if (!pl || liveVisited[pl.id]) return;
    if (missionProgress().visited[pl.id]) { liveVisited[pl.id] = 'old'; return; }   // 예전에 이미 받은 곳
    if (eligible) { liveVisited[pl.id] = 'got'; announceStamp(pl.id); }
    else {
      liveVisited[pl.id] = 'pending';
      emit('onStamp', pl, 'pending');   // 화면: "○○ 도착! 5분·200m 넘게 걸으면 발도장이 찍혀요."
    }
  }
  // 받은 발도장을 화면에(알림 띠·진동) — 장소 목록에 없는 id(지워진 장소 등)는 조용히 넘어간다
  function announceStamp(id) {
    var R = window.RewardRules;
    var pl = R.PLACES.filter(function (x) { return x.id === id; })[0];
    if (!pl) return;
    emit('onStamp', pl, 'got');
  }

  // ── 진행 중인 산책 저장(이어 하기) ──
  function saveActiveRoute(now) {
    if (!walking || leaving || isDemo()) return;   // 끝내거나 버리고 떠나는 중이면 다시 저장하지 않는다
    var t = Date.now();
    if (!now && t - routeSavedAt < 10000) return;   // 위치를 받을 때마다 쓰지 않고 10초에 한 번(숨겨질 때는 바로)
    routeSavedAt = t;
    var samples = routeSamples.map(function (p) { var r = [Math.round(p.c[0] * 1e6) / 1e6, Math.round(p.c[1] * 1e6) / 1e6, p.t]; if (p.s) r.push(p.s); return r; });
    // 저장 공간이 모자라도 산책은 계속된다 — 이어 하기만 안 될 뿐
    WalsonStore.saveActiveRoute({
      v: 1, startedAt: walkStartTime, samples: samples, liveKm: liveKm, visited: liveVisited, gapMs: walkGapMs, savedAt: t
    });
  }
  function loadActiveRoute() {
    var a = WalsonStore.activeRoute();
    return a && a.v === 1 && typeof a.startedAt === 'number' ? a : null;
  }
  function clearActiveRoute() { WalsonStore.clearActiveRoute(); }

  // ── 위치 받기 ──
  // why: 'start' | 'resume' — 화면이 화면 켜 두기·출발 시각·시계를 맞춘다(새로 시작이면 주머니 안내도)
  function enterWalking(why) {
    walking = true;
    emit('onState', state(), why);
    watchId = navigator.geolocation.watchPosition(onWalkFix, function (err) {
      // 위치 권한이 꺼져 있고 아직 한 점도 못 받았으면 시간만 재기로 이어 간다(1단계 — 출발 시각 그대로)
      if (err && err.code === 1 && walking && !routeSamples.length && !isDemo()) { fallbackToTime(); return; }
    }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 });
  }
  function fallbackToTime() {
    var started = Math.round(walkStartTime || Date.now());
    walking = false;
    leaving = true;
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
    emit('onState', state(), 'fallback');   // 화면: 화면 켜 두기 풀기
    clearActiveRoute();
    location.replace('go.html?fallback=' + started);
  }
  // 위치 한 점 — watchPosition과, 다시 열었을 때 바로 읽는 위치(freshFix)가 같이 쓴다
  function onWalkFix(pos) {
    if (!walking) return;
    var coord = [pos.coords.latitude, pos.coords.longitude];
    lastFix = coord;   // 정확도가 낮은 점도 지금 위치·미션 거리에는 쓰되, 길(선)에는 넣지 않는다
    if (pos.coords.accuracy > WALK_RULES.maxAccuracyM) { notifyFix(true); return; }
    var t = pos.timestamp || Date.now();
    var last = routeSamples[routeSamples.length - 1];
    if (last && t <= seenT(last)) { notifyFix(false); return; }   // 이미 받은 시각의 위치(브라우저가 기억해 둔 것)는 길에 넣지 않는다(화면은 미션 카드만)
    // ① 제자리 흔들림 — 끊김(GAP_MS) 뒤가 아니고, 마지막 점에서 정확도만큼도 안 움직였으면 길에 안 넣고 시각만 늘린다
    if (last && t - seenT(last) <= GAP_MS) {
      var stepM = Math.min(JITTER.maxStepM, Math.max(JITTER.minStepM, (pos.coords.accuracy || 0) * JITTER.accFactor));
      if (haversineKm(last.c, coord) * 1000 < stepM) { last.s = t; notifyFix(true); saveActiveRoute(false); return; }
    }
    routeCoords.push(coord);
    routeSamples.push({ c: coord, t: t });
    // ② 튀었다 돌아온 점 지우기
    if (dropSpike()) { notifyFix(true); saveActiveRoute(false); return; }
    if (routeSamples.length >= 2) {
      var prev = routeSamples[routeSamples.length - 2], cur = routeSamples[routeSamples.length - 1];
      var gap = cur.t - seenT(prev), fast = isFastSegment(prev, cur), segKm = haversineKm(prev.c, cur.c);
      if (gap > GAP_MS) {
        walkGapMs += gap;
        var gapMin = Math.max(1, Math.round(gap / 60000));
        emit('onNotice', fast
          ? '다시 이어서 기록해요 · 그 사이 ' + gapMin + '분은 걷는 속도보다 빨라서 거리에서 뺐어요.'
          : '다시 이어서 기록해요 · 그 사이 ' + gapMin + '분(' + kmText(segKm) + ')은 직선으로 셌어요.', fast ? 'warn' : 'info');
      }
      // 산책 중 바로 판정 — 차·자전거 속도 구간만 뺀다. 끊긴 구간도 걷는 속도면 직선으로 넣는다(주머니 산책)
      if (!fast) {
        liveKm += segKm;
        var eligibleNow = (nowMs() - walkStartTime) / 60000 >= WALK_RULES.minRewardMinutes && liveKm >= WALK_RULES.minRewardKm;
        checkLiveStamp(coord, eligibleNow);
      }
    }
    notifyFix(true);
    saveActiveRoute(false);
  }
  // 마지막 세 점 A·B·C에서 B만 튀었다 돌아왔으면 B를 지우고 true. 걸은 거리(liveKm)는 남은 점으로 다시 센다
  function dropSpike() {
    var n = routeSamples.length;
    if (n < 3) return false;
    var A = routeSamples[n - 3], B = routeSamples[n - 2], C = routeSamples[n - 1];
    if (B.t - seenT(A) > GAP_MS || C.t - seenT(B) > GAP_MS) return false;   // 끊김을 사이에 둔 점은 건드리지 않는다
    if (C.t - seenT(A) > JITTER.spikeMaxMs) return false;                  // 천천히 다녀온 건 진짜 왕복일 수 있다
    var ab = haversineKm(A.c, B.c) * 1000, bc = haversineKm(B.c, C.c) * 1000, ac = haversineKm(A.c, C.c) * 1000;
    if (Math.min(ab, bc) < JITTER.spikeMinM || ac > JITTER.spikeBackRatio * Math.min(ab, bc)) return false;
    routeSamples.splice(n - 2, 1);
    routeCoords.splice(n - 2, 1);
    liveKm = analyzeWalk(routeSamples).walkKm;
    return true;
  }
  function freshFix() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(onWalkFix, function () { /* 못 읽으면 watchPosition이 이어서 준다 */ },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  }
  // 화면이 숨겨지고 다시 보일 때(엔진 쪽 — 화면 켜 두기·시계는 walk.html이 따로 맞춘다)
  function onVisibilityChange() {
    if (!walking) return;
    if (document.visibilityState === 'visible') {
      freshFix();   // 주머니에서 꺼내 열었을 때 — 기다리지 않고 지금 위치를 바로 읽어 발도장을 판정한다
    } else {
      saveActiveRoute(true);   // 숨겨지는 순간 저장 — 이대로 앱이 닫혀도 다시 열면 이어진다
    }
  }

  // ── 기록 저장 · 끝내기 ──
  // endMs: 끝난 시각을 따로 정할 때(이어 하기에서 지난 산책을 정리할 때) — 없으면 지금
  function saveWalkRecord(distanceKm, durationMin, route, stampRoute, rewardEligible, gapMin, endMs) {
    var walks = loadWalks();
    var ended = endMs ? new Date(endMs) : new Date();
    walks.push({
      date: dateKey(ended), distanceKm: distanceKm, durationMin: durationMin,
      route: simplifyRoute(route, 60),
      stampRoute: stampRoute.length ? simplifyRoute(stampRoute, 60) : [],
      rewardEligible: rewardEligible,
      gapMin: gapMin || 0,
      endedAt: ended.getTime(),  // 서버 가정 시험판(mock-server.js)이 시간대만 뽑아 쓴다. 이 폰 안에만 있다
      startedAt: walkStartTime   // 끝 화면의 "○시 ○분 출발"(2026-11-16 2단계). 이 폰 안에만 있다
    });
    if (isDemo()) walks[walks.length - 1].demo = true;   // 시연 모드 산책 — 키링(실제 보상)과 통계에서 뺀다
    // 저장하지 못하면(저장 공간이 꽉 참) 예전처럼 여기서 멈춘다 — 알림은 따로 띄우지 않는다
    if (!WalsonStore.saveWalks(walks)) throw new Error('산책 기록을 저장하지 못했어요');
    var total = walks.reduce(function (sum, w) { return sum + (w.distanceKm || 0); }, 0);
    WalsonStore.saveLastWalk({ distanceKm: distanceKm, totalDistanceKm: total, durationMin: durationMin });   // 못 해도 무시
  }
  // opts.endMs: 끝난 시각을 정해 저장할 때(오래된 산책 정리 — 마지막 위치 시각)
  function stopWalk(opts) {
    opts = opts || {};
    walking = false;
    leaving = true;
    clearActiveRoute();
    emit('onState', state(), 'stop');   // 화면: 화면 켜 두기 풀기
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
    var endMs = opts.endMs || nowMs();
    if (routeCoords.length < 2) {
      // 길이 안 남았어도(위치를 거의 못 받음 — 실내·높은 건물 사이) 걸은 시간은 남긴다.
      // 시간만 잰 산책과 같은 모양(보상 제외)에 noRoute를 붙여 끝 화면이 왜 길이 없는지 알려 준다
      var mins = Math.round((endMs - walkStartTime) / 60000);
      if (mins < 1) { alert('1분이 안 된 산책이라 저장하지 않았어요.'); location.replace('go.html'); return; }
      var walks = loadWalks(), ended = new Date(opts.endMs || Date.now());
      walks.push({ date: dateKey(ended), distanceKm: 0, durationMin: mins, route: [], stampRoute: [], rewardEligible: false, gapMin: 0, mode: 'time', noRoute: true, endedAt: ended.getTime(), startedAt: walkStartTime });
      if (isDemo()) walks[walks.length - 1].demo = true;
      if (!WalsonStore.saveWalks(walks)) alert('기록을 저장하지 못했어요. 저장 공간을 확인해 주세요.');
      if (window.WalsonTrack && !isDemo()) WalsonTrack.send('walk_complete', { mode: 'time', min_bucket: WalsonTrack.minBucket(mins), eligible: 0 });
      location.replace('walk-end.html');
      return;
    }
    var progressBefore = window.RewardRules.computeProgress(loadWalks());
    var analysis = analyzeWalk(routeSamples);
    var distanceKm = analysis.walkKm;
    var durationMin = Math.max(1, Math.round((endMs - walkStartTime) / 60000));
    // 끝내기를 깜빡했을 때(2026-11-15): 마지막으로 움직인 뒤 한 자리에 오래 머물렀으면 그때 끝난 걸로 할지 묻는다
    var restEnd = opts.endMs ? null : estimateRestStart(routeSamples);
    if (restEnd && nowMs() - restEnd >= REST_ASK_MS) {
      var movedMin = Math.max(1, Math.round((restEnd - walkStartTime) / 60000));
      var t = new Date(restEnd);
      if (confirm('끝내기를 깜빡하셨나요?\n' + t.getHours() + '시 ' + pad2(t.getMinutes()) + '분부터 ' +
          Math.round((nowMs() - restEnd) / 60000) + '분 동안 같은 자리에 있었어요.\n\n' +
          '확인: 그때 끝난 걸로 저장(' + movedMin + '분)\n취소: 지금까지(' + durationMin + '분) 그대로 저장')) {
        durationMin = movedMin;
      }
    }
    var rewardEligible = durationMin >= WALK_RULES.minRewardMinutes && distanceKm >= WALK_RULES.minRewardKm;
    saveWalkRecord(distanceKm, durationMin, routeCoords, analysis.walkingPoints, rewardEligible, Math.round(walkGapMs / 60000), opts.endMs);
    // 통계: 걸은 시간은 구간만, 발도장은 새로 찍힌 개수만(어느 장소인지는 보내지 않는다)
    if (window.WalsonTrack && !isDemo()) {
      WalsonTrack.send('walk_complete', { mode: 'gps', min_bucket: WalsonTrack.minBucket(durationMin), eligible: rewardEligible ? 1 : 0 });
      var progressAfter = window.RewardRules.computeProgress(loadWalks());
      var newStamps = Object.keys(progressAfter.visited).filter(function (k) { return !progressBefore.visited[k]; }).length;
      if (newStamps) WalsonTrack.send('stamp_new', { count: newStamps });
    }
    // 끝 화면 하나로(2단계) — 보상(새 발도장·카드 성장·다음 미션)은 끝 화면에서 보여 준다
    location.replace('walk-end.html');
  }
  // 시연 모드를 바꿀 때(화면이 먼저 묻고 부른다) — 지금 산책은 저장하지 않고 멈춘다.
  // 버린 산책을 다음에 열 때 이어 하지 않게 — 먼저 산책을 멈춰야 화면이 넘어가는 순간(pagehide) 다시 저장되지 않는다
  function discard() {
    if (walking) {
      walking = false;
      if (watchId !== null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
      emit('onState', state(), 'discard');   // 화면: 화면 켜 두기 풀기
      clearActiveRoute();
    }
    leaving = true;
  }

  // ── 시작 ──
  function startWalk() {
    if (!navigator.geolocation) { alert('이 브라우저에서는 위치 정보를 사용할 수 없어요.'); leaving = true; location.replace('go.html'); return; }
    if (!isDemo()) window.WalsonTrack && WalsonTrack.send('walk_start', { mode: 'gps' });
    routeCoords = []; routeSamples = []; liveVisited = {}; liveKm = 0; walkGapMs = 0;
    walkStartTime = nowMs();
    enterWalking('start');   // 화면: 화면 켜 두기·출발 시각·시계·주머니 안내
    notifyFix(false);        // 화면: 미션 카드
    saveActiveRoute(true);
  }

  // ── 앱이 닫혔다 다시 열렸을 때 이어 하기 ──
  function resumeActiveRoute() {
    var a = loadActiveRoute();
    if (!a) return;
    if (isDemo()) {
      // 시연 모드 중엔 진짜 산책을 건드리지 않는다 — 끄고 이어 갈지 묻는다
      // (여기서 산책 나가기로 보내면 산책 나가기가 진행 중인 산책을 보고 다시 여기로 보내서 멈추지 않는다)
      leaving = true;
      if (confirm('길 기록 중인 진짜 산책이 있어요.\n시연 모드를 끄고 이어서 기록할까요?\n\n취소: 시연 모드를 그대로 두고 [오늘]로')) PetwalkDemoGeo.disable();
      else location.replace('index.html');
      return;
    }
    var samples = (Array.isArray(a.samples) ? a.samples : []).filter(function (p) {
      return Array.isArray(p) && isFinite(p[0]) && isFinite(p[1]) && isFinite(p[2]);
    }).map(function (p) { var o = { c: [p[0], p[1]], t: p[2] }; if (isFinite(p[3]) && p[3] > p[2]) o.s = p[3]; return o; });
    var lastT = samples.length ? seenT(samples[samples.length - 1]) : a.startedAt;
    routeSamples = samples;
    routeCoords = samples.map(function (p) { return p.c; });
    lastFix = routeCoords.length ? routeCoords[routeCoords.length - 1] : null;
    liveKm = +a.liveKm || 0;
    liveVisited = a.visited && typeof a.visited === 'object' ? a.visited : {};
    walkGapMs = +a.gapMs || 0;
    walkStartTime = a.startedAt;
    // 마지막 위치 뒤로 오래 지났으면(끝내기를 잊은 산책) 이어 하지 않고, 그때 끝난 걸로 저장할지 묻는다
    if (Date.now() - Math.max(lastT, a.savedAt || 0) > ROUTE_STALE_MS) {
      if (routeSamples.length < 2) { clearActiveRoute(); return; }
      var t = new Date(lastT);
      var when = (t.getMonth() + 1) + '월 ' + t.getDate() + '일 ' + t.getHours() + '시 ' + pad2(t.getMinutes()) + '분';
      if (confirm('끝내지 않은 길 기록 산책이 있어요.\n마지막으로 위치를 받은 ' + when + '에 끝난 걸로 저장할까요?\n\n' +
          '확인: 그때 끝난 걸로 저장\n취소: 저장하지 않고 지우기')) {
        walking = true;
        stopWalk({ endMs: lastT });
      } else {
        clearActiveRoute();
      }
      return;
    }
    enterWalking('resume');   // 화면: 화면 켜 두기·출발 시각·시계
    freshFix();
    notifyFix(false);         // 화면: 미션 카드
    emit('onNotice', '산책을 이어서 기록해요. 닫혀 있던 동안은 직선으로 이어져요.', 'info');
    saveActiveRoute(true);
  }

  // ── 산책 나가기의 "산책 시작"(위치 사용)이나 [동네] 미션 카드로 왔으면 바로 시작(?start=1, 1단계) ──
  function autoStart() {
    if (walking || leaving || !/[?&]start=1/.test(location.search)) return;
    try { history.replaceState(null, '', location.pathname); } catch (e) { /* 새로 고침하면 산책 나가기로 간다 */ }
    if (window.PetwalkSample && PetwalkSample.isOn()) return;   // 샘플을 보는 중이면 산책 나가기에서 끄기를 먼저 묻는다
    if (!locationExplained && !isDemo()) {   // 시연 모드는 가짜 위치라 권한을 묻지 않는다(2026-11-16)
      // CLAUDE.md — 위치 권한을 묻기 전에 왜 필요한지 먼저 설명한다(산책 나가기를 거치지 않고 온 경우)
      if (!confirm('길을 기록하려면 위치 정보가 필요해요.\n위치는 이 휴대폰 안에서만 쓰고 어디로도 보내지 않아요. 허용할까요?')) return;
      locationExplained = true;
      try { localStorage.setItem(LOCATION_EXPLAINED_KEY, '1'); } catch (e) { /* 다음에 다시 묻는다 */ }
    }
    startWalk();
  }

  // 산책 중이 아니면 이 화면은 할 일이 없다 — 산책 나가기로(시작은 거기서 한다)
  function exitIfIdle() {
    if (!walking && !leaving) { leaving = true; location.replace('go.html'); }
  }

  // ── 켜기: 화면이 받을 알림을 정하고, 숨겨질 때·떠날 때 저장하는 것을 건다(한 번만) ──
  var inited = false;
  function init(callbacks) {
    cb = callbacks || {};
    if (inited) return;
    inited = true;
    try { locationExplained = localStorage.getItem(LOCATION_EXPLAINED_KEY) === '1'; } catch (e) { /* 다시 묻는다 */ }
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', function () { if (walking) saveActiveRoute(true); });
  }

  window.WalkEngine = {
    init: init, resume: resumeActiveRoute, autoStart: autoStart, exitIfIdle: exitIfIdle,
    start: startWalk, stop: stopWalk, discard: discard,
    state: state, missionProgress: missionProgress, missionNow: missionNow, isDemo: isDemo, now: nowMs,
    RULES: WALK_RULES, GAP_MS: GAP_MS, JITTER: JITTER, seenT: seenT,
    haversineKm: haversineKm, bearingDeg: bearingDeg, kmText: kmText, pad2: pad2,
    isFastSegment: isFastSegment, analyzeWalk: analyzeWalk, simplifyRoute: simplifyRoute, estimateRestStart: estimateRestStart
  };
})();
