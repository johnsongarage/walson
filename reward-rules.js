// 산책 보상 규칙 — card-reward.html(카드 그리기)과 index.html(산책 종료 알림)이 같이 쓴다.
// 숫자를 조정할 땐 이 파일만 고치면 된다. (2026-09-24 보상 재도입, PROJECT_CONTEXT.md "결정 번복" 참고)
// 빌드 도구 없이 <script src="reward-rules.js?v=1">로 불러오고 전역 window.RewardRules로 쓴다.
// 이 파일을 고치면 ?v= 번호를 올리고 두 HTML 파일에서 같이 올릴 것(card-shared.js와 같은 캐시 문제).
(function () {
  var FRAME_TIERS = [
    { name: '종이', minWalks: 0,  stops: ['#cbbba5', '#e6dac8', '#cbbba5'], width: 8,  ring: '#d8cbb8' },
    { name: '나무', minWalks: 5,  stops: ['#6f4a2a', '#b98a55', '#8a5f36'], width: 12, ring: '#a0703f' },
    { name: '은',   minWalks: 15, stops: ['#7d858c', '#e3e7ea', '#ffffff', '#e3e7ea', '#7d858c'], width: 14, ring: '#b8c0c6' },
    { name: '금',   minWalks: 30, stops: ['#c99a3a', '#f0cf7a', '#fff6d9', '#f0cf7a', '#c99a3a'], width: 16, ring: '#e2b45a' }
  ];
  var SLOT_RULES = { skill: 1, passive: 3 }; // 칸이 열리는 누적 산책 횟수

  // 공원 두 곳은 OSM 공원 중심 좌표(2026-09-25 확인). 공원 경계를 못 받아와서 반경은 넉넉히 잡음 —
  // 수변공원은 왕숙천을 따라 길게 뻗어 있어 가장자리를 걸으면 놓칠 수 있다.
  // 아울렛은 OSM에 없어서 사용자가 준 네이버 지도 장소(현대프리미엄아울렛 스페이스원, 다산순환로 50) 좌표.
  // pending: true인 장소는 위치가 확정되기 전이라 도장 판정에서 빠진다.
  // 산책 경로 점 중 하나라도 radiusKm 안에 들어오면 방문으로 친다.
  // 기본 세 곳. 운영자가 스팟 편집에서 바꾸면 spots-data.js의 PETWALK_STAMP_PLACES가 대신 쓰인다(2026-11-15) —
  // 그래서 이 파일보다 spots-data.js를 먼저 불러야 한다. 발도장 카드 뒷면은 장소 5곳 안팎을 기준으로 그려져 있다.
  var DEFAULT_PLACES = [
    { id: 'outlet',    name: '아울렛',       badge: '#아울렛_발도장',   center: [37.61633, 127.15268], radiusKm: 0.15, kind: 'building' },
    { id: 'central',   name: '다산 중앙공원', badge: '#중앙공원_발도장', center: [37.62330, 127.15962], radiusKm: 0.25, kind: 'park' },
    { id: 'waterside', name: '다산수변공원',  badge: '#수변공원_발도장', center: [37.62396, 127.14529], radiusKm: 0.3,  kind: 'water' }
  ];
  function fromData(list) {
    return list.filter(function (p) { return p && p.id && typeof p.lat === 'number' && typeof p.lng === 'number'; }).map(function (p) {
      return {
        id: p.id, name: p.name || '발도장', badge: '#' + String(p.name || '발도장').replace(/\s+/g, '') + '_발도장',
        center: [p.lat, p.lng], radiusKm: (p.radiusM || 200) / 1000,
        kind: p.kind === 'water' || p.kind === 'building' ? p.kind : 'park', pending: !!p.pending
      };
    });
  }
  var PLACES = (Array.isArray(window.PETWALK_STAMP_PLACES) && window.PETWALK_STAMP_PLACES.length)
    ? fromData(window.PETWALK_STAMP_PLACES) : DEFAULT_PLACES;

  // 키링 나눔(2026-11-15, keyring.html). 조건·수량·받는 날은 가르시아가 정한다(hq 남은 일) — 정하기 전에는
  // open: false로 두어 앱 어디에도 약속하지 않는다(카드 탭의 "키링 받기" 링크도 숨김). 운영자는 keyring.html?preview=1로 미리 본다.
  // minWalks는 제안값: 길 기록 산책(5분·200m 이상) 5회 = 나무 테두리와 같은 때.
  // mode(11/15 가르시아 임시 결정 "탐방형 3곳"):
  //   'stamps' = 발도장 장소 minStamps곳 / 'walks' = 산책 minWalks번 / 'either' = 둘 중 하나 / 'both' = 둘 다
  // 발도장·산책 횟수 모두 길 기록 산책(5분·200m 이상)만 센다 — 시간만 잰 산책은 안 들어감.
  var KEYRING = {
    open: false,
    mode: 'stamps',
    minStamps: 3,
    minWalks: 5,
    where: '',   // 예: '다산중앙공원 놀이터 옆'
    when: ''     // 예: '11월 토요일 오후 2~4시'
  };

  function distanceKm(a, b) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (b[0] - a[0]) * toRad, dLng = (b[1] - a[1]) * toRad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a[0] * toRad) * Math.cos(b[0] * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // walks: localStorage petwalk_walks 배열. index.html이 5분/200m 미만 산책을 rewardEligible: false로
  // 저장한다 — 조작 방지 도입(2026-09-25) 전 기록엔 이 값이 없어서 그대로 보상에 넣는다. 발도장은
  // 걷는 속도 구간의 점(stampRoute)으로만 판정하고, stampRoute가 없는 예전 기록만 전체 경로를 쓴다.
  function computeProgress(walks) {
    var eligible = (walks || []).filter(function (w) { return w.rewardEligible !== false; });
    var visited = {};
    eligible.forEach(function (w) {
      (w.stampRoute || w.route || []).forEach(function (p) {
        PLACES.forEach(function (pl) {
          if (!pl.pending && !visited[pl.id] && distanceKm(p, pl.center) <= pl.radiusKm) visited[pl.id] = true;
        });
      });
    });
    var km = eligible.reduce(function (s, w) { return s + (w.distanceKm || 0); }, 0);
    return { walks: eligible.length, km: km, visited: visited };
  }

  function tierFor(walks) {
    var t = FRAME_TIERS[0];
    FRAME_TIERS.forEach(function (tier) { if (walks >= tier.minWalks) t = tier; });
    return t;
  }

  function nextTier(walks) {
    for (var i = 0; i < FRAME_TIERS.length; i++) if (FRAME_TIERS[i].minWalks > walks) return FRAME_TIERS[i];
    return null;
  }

  function nextGoalText(p) {
    var goals = [];
    if (p.walks < SLOT_RULES.skill) goals.push({ left: SLOT_RULES.skill - p.walks, what: '스킬 칸이 열려요' });
    if (p.walks < SLOT_RULES.passive) goals.push({ left: SLOT_RULES.passive - p.walks, what: '특성 칸이 열려요' });
    var nt = nextTier(p.walks);
    if (nt) goals.push({ left: nt.minWalks - p.walks, what: nt.name + ' 테두리가 돼요' });
    goals.sort(function (a, b) { return a.left - b.left; });
    if (goals.length) return '산책 ' + goals[0].left + '회 더 하면 ' + goals[0].what;
    var remaining = PLACES.filter(function (pl) { return !pl.pending && !p.visited[pl.id]; });
    if (remaining.length) return remaining[0].name + '에 가면 새 발도장을 받아요';
    return '모든 보상을 모았어요';
  }

  // 산책 한 번 전후의 진행도를 비교해서 이번에 새로 얻은 보상 문구 목록을 돌려준다.
  function newUnlocks(before, after) {
    var out = [];
    if (before.walks < SLOT_RULES.skill && after.walks >= SLOT_RULES.skill) out.push('스킬 칸이 열렸어요');
    if (before.walks < SLOT_RULES.passive && after.walks >= SLOT_RULES.passive) out.push('특성 칸이 열렸어요');
    var bt = tierFor(before.walks), at = tierFor(after.walks);
    if (at !== bt) out.push(at.name + ' 테두리로 올라갔어요');
    PLACES.forEach(function (pl) {
      if (after.visited[pl.id] && !before.visited[pl.id]) out.push(pl.name + ' 발도장을 받았어요');
    });
    return out;
  }

  // ── 지도 미션(2026-11-15 가르시아: "어디 가야 하는지 목표·미션을 알려 주자", 첫 미션은 프리미어캠퍼스) ──
  // 미션 = 발도장 장소를 놓인 순서대로 하나씩 안내하는 것. 순서는 스팟 편집의 발도장 장소 목록 순서(1번이 첫 미션).
  // 안 간 곳 중 맨 앞이 "지금 미션". 판정은 발도장과 똑같다(길 기록 산책의 걷는 속도 점이 반경 안에 들어옴).
  // 진행은 이 휴대폰의 산책 기록으로만 계산하고 어디로도 보내지 않는다.
  function missions(progress) {
    var visited = (progress && progress.visited) || {};
    return PLACES.filter(function (pl) { return !pl.pending; })
      .map(function (pl, i) { return { no: i + 1, place: pl, done: !!visited[pl.id] }; });
  }
  function currentMission(progress) {
    return missions(progress).filter(function (m) { return !m.done; })[0] || null;
  }
  // 점 [lat, lng]이 들어 있는 발도장 장소(없으면 null) — 산책 중 바로 판정에 쓴다
  function placeAt(point) {
    for (var i = 0; i < PLACES.length; i++) {
      var pl = PLACES[i];
      if (!pl.pending && distanceKm(point, pl.center) <= pl.radiusKm) return pl;
    }
    return null;
  }

  // ── 꾸준함 도장(2026-11-15 가르시아 "꾸준함 도장도 만들어줘") ──
  // 시간만 잰 산책은 카드 성장·발도장·미션·키링에서 빠지는 대신, 이 도장은 모든 산책을 센다 —
  // 돈이 안 드는 보상이라 버튼만 눌러 채워도 비용이 0이다(hq notes/petwalk-time-only-rewards.md).
  // 한 주(월~일)에 산책한 날 수로 찍는다: 3일 · 5일 · 7일. 주마다 새로 시작하고 연속 주는 세지 않는다
  // (9/2 결정: 연속 기록은 압박 없는 통계로만). 5분 미만 산책은 세지 않는다.
  var STEADY_STEPS = [3, 5, 7];
  var STEADY_MIN_MINUTES = 5;
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function dayKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function fromKey(k) { var p = String(k).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function mondayOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function steadyLevel(days) {
    var lv = 0;
    STEADY_STEPS.forEach(function (s, i) { if (days >= s) lv = i + 1; });
    return lv;
  }
  // 돌려주는 값: { thisWeek: { start, days, level, walked[7](월~일), todayIndex, next, left },
  //               weeks: [{ start, days, level }](오래된 순), total: 도장 받은 주 수, byLevel: [3일, 5일, 7일] }
  function steady(walks, today) {
    today = today || new Date();
    var byWeek = {};
    (walks || []).forEach(function (w) {
      if (!w || !w.date || !(w.durationMin >= STEADY_MIN_MINUTES)) return;
      var d = fromKey(w.date);
      if (isNaN(d.getTime())) return;
      var wk = dayKey(mondayOf(d));
      (byWeek[wk] || (byWeek[wk] = {}))[w.date] = true;
    });
    var start = mondayOf(today), startKey = dayKey(start), cur = byWeek[startKey] || {};
    var walked = [];
    for (var i = 0; i < 7; i++) { var d = new Date(start); d.setDate(start.getDate() + i); walked.push(!!cur[dayKey(d)]); }
    var days = Object.keys(cur).length, next = null;
    for (var j = 0; j < STEADY_STEPS.length; j++) if (STEADY_STEPS[j] > days) { next = STEADY_STEPS[j]; break; }
    var weeks = Object.keys(byWeek).sort().map(function (k) {
      var n = Object.keys(byWeek[k]).length;
      return { start: k, days: n, level: steadyLevel(n) };
    });
    var byLevel = [0, 0, 0], total = 0;
    weeks.forEach(function (w) { if (w.level) { byLevel[w.level - 1]++; total++; } });
    return {
      thisWeek: { start: startKey, days: days, level: steadyLevel(days), walked: walked, todayIndex: (today.getDay() + 6) % 7, next: next, left: next ? next - days : 0 },
      weeks: weeks, total: total, byLevel: byLevel
    };
  }

  window.RewardRules = {
    FRAME_TIERS: FRAME_TIERS,
    KEYRING: KEYRING,
    SLOT_RULES: SLOT_RULES,
    PLACES: PLACES,
    DEFAULT_PLACES: DEFAULT_PLACES,
    computeProgress: computeProgress,
    tierFor: tierFor,
    nextTier: nextTier,
    nextGoalText: nextGoalText,
    newUnlocks: newUnlocks,
    missions: missions,
    currentMission: currentMission,
    placeAt: placeAt,
    distanceKm: distanceKm,
    STEADY_STEPS: STEADY_STEPS,
    STEADY_MIN_MINUTES: STEADY_MIN_MINUTES,
    steady: steady,
    steadyLevel: steadyLevel
  };
})();
