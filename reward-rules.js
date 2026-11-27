// 산책 보상 규칙 — my-card.html([주민증] 자라는 주민증)·walk.html(산책 중 미션·발도장)·walk-end.html(이번 산책으로 받은 것)·[기록] 영수증 등이 같이 쓴다.
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
  var SLOT_RULES = { skill: 1, passive: 3 }; // 칸이 열리는 누적 산책 횟수(주민증 뒷면 특기·특이 사항)
  var RECORD_MIN_MINUTES = 5;   // 주민증 성장에 세는 산책의 최소 시간 — 꾸준함 도장과 같은 기준(2026-11-17)

  // ── 주민 등급(2026-11-16 가르시아 "자라는 카드를 주민증에 합쳐") ──
  // 예전 테두리(종이 0 · 나무 5 · 은 15 · 금 30)와 같은 숫자. 11/17부터 어떻게 기록했든 5분 이상 산책을 센다
  // (11/15 "길 기록 산책만"을 번복 — 짤은 인질로 잡지 않는다, 아래 computeProgress).
  // 주민증 부제가 "남양주 다산동 ○○"로 바뀌고, 정착 주민부터 사진 귀퉁이에 승급 도장이 찍힌다(id-card.js).
  // FRAME_TIERS는 예전 카드 그림용으로 남겨 둔다(옛 화면이 캐시에 남아 있어도 깨지지 않게).
  var RANKS = [
    // 2026-11-19 이름 바꿈(가르시아 용어 정리, 2030 여성 견주 타깃): 새내기 주민 → 산책 입문자, 정착 주민 → 산책 러버,
    // 토박이 → 프로 산책러, 터줏대감 → 핑크 앰배서더. 숫자(0·5·15·30)는 그대로. seal = 카드 도장에 찍는 짧은 글자(원 안에 들어가게)
    { level: 0, name: '산책 입문자',   short: '입문자',   seal: '입문',     to: '산책 입문자로',   be: '산책 입문자가 돼요',   minWalks: 0 },
    { level: 1, name: '산책 러버',     short: '러버',     seal: '산책러버', to: '산책 러버로',     be: '산책 러버가 돼요',     minWalks: 5 },
    { level: 2, name: '프로 산책러',   short: '프로',     seal: '프로',     to: '프로 산책러로',   be: '프로 산책러가 돼요',   minWalks: 15 },
    { level: 3, name: '핑크 앰배서더', short: '앰배서더', seal: '앰배서더', to: '핑크 앰배서더로', be: '핑크 앰배서더가 돼요', minWalks: 30 }
  ];

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
  // 11/24 전국판(가르시아 "남양주 다산동 들어간 건 빼 줘, 전국 버전으로" → "추천대로"): 다산동 발도장 장소 세 곳은 데이터로만 남기고
  // 화면·판정에선 뺀다 — PLACES는 빈 목록이라 미션·발도장 모음판·워킹패스 뒷면 발도장·산책 중 도착 알림·[오늘] 발도장 칸이 같이 꺼진다.
  // 예전 장소(스팟 편집이 고친 것 포함)는 LOCAL_PLACES. 걸은 길은 그대로라 STAMPS_ON을 켜면 예전 발도장도 다시 셈해진다.
  // 전국용 발도장("어느 동네든 공원에 가면" 등)은 다시 기획(hq DECISIONS 11/24).
  var STAMPS_ON = false;
  var LOCAL_PLACES = (Array.isArray(window.PETWALK_STAMP_PLACES) && window.PETWALK_STAMP_PLACES.length)
    ? fromData(window.PETWALK_STAMP_PLACES) : DEFAULT_PLACES;
  var PLACES = STAMPS_ON ? LOCAL_PLACES : [];

  // 키링 나눔(2026-11-15, keyring.html). 조건·수량·받는 날은 가르시아가 정한다(hq 남은 일) — 정하기 전에는
  // open: false로 두어 앱 어디에도 약속하지 않는다(카드 탭의 "키링 받기" 링크도 숨김). 운영자는 keyring.html?preview=1로 미리 본다.
  // minWalks는 제안값. 키링은 돈 드는 보상이라 실시간 산책 수(liveWalks — [시작]·[끝]을 눌러 잰 5분 이상, 길 기록·시간만 재기)로 센다.
  // 11/27 가르시아: 거리 200m 조건은 뺌(웹앱은 화면이 꺼지면 길이 끊김) — 키링은 어차피 현장에서 강아지를 보고 준다.
  // mode(11/15 가르시아 임시 결정 "탐방형 3곳"):
  //   'stamps' = 발도장 장소 minStamps곳 / 'walks' = 산책 minWalks번 / 'either' = 둘 중 하나 / 'both' = 둘 다
  // 발도장은 길 기록 산책(5분·200m 이상)만, 산책 횟수는 실시간 산책(5분 이상 — 시간만 재기 포함, 다녀왔어요 빼고)만 센다(11/27).
  var KEYRING = {
    open: false,
    mode: 'walks',   // 11/24 전국판 — 발도장 장소가 없어서 'stamps' → 'walks'(11/23 결정 조건은 "산책한 날 5칸 + 결산 영수증 1번", 키링 화면을 열 때 다시)
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

  // walks: localStorage petwalk_walks 배열. 길 기록 산책은 5분/200m 미만이면 rewardEligible: false로
  // 저장된다 — 조작 방지 도입(2026-09-25) 전 기록엔 이 값이 없어서 그대로 보상에 넣는다. 발도장은
  // 걷는 속도 구간의 점(stampRoute)으로만 판정하고, stampRoute가 없는 예전 기록만 전체 경로를 쓴다.
  //
  // 짤은 인질로 잡지 않는다(2026-11-17 가르시아 "공원 전에 해", hq DECISIONS 11/17):
  //   - 주민증 성장(승급·특기·특이 사항)은 어떻게 기록했든 5분 이상 산책이면 센다 — 시간만 재기·다녀왔어요 포함.
  //     돈이 안 드는 짤이라 위치를 조작해 채워도 남에게 손해가 없다. 예전에 세던 산책(길 기록 5분·200m)은 그대로 센다.
  //   - 발도장·미션은 위치가 있어야 하니 그대로 길 기록 산책만(eligible).
  //   - 돈 드는 보상(키링)은 현장에서 강아지를 보고 준다 — 키링 화면의 산책 횟수 조건은 실시간 산책만(liveWalks, 11/27 — 예전엔 길 기록만 gpsWalks).
  function countsForCard(w) {
    return !!w && (w.rewardEligible !== false || w.durationMin >= RECORD_MIN_MINUTES);
  }
  // 실시간 산책(11/27 가르시아): [시작]·[끝]을 눌러 잰 산책 — 길 기록·시간만 재기. 다녀와서 몇 분만 적은 것은 아님.
  // 웹앱은 화면이 꺼지면 길이 끊겨 거리가 짧게 나오니, 키링 조건은 거리(200m) 없이 시간(5분)만 본다.
  function isLive(w) { return !!w && w.logged !== 'after' && (Number(w.durationMin) || 0) >= RECORD_MIN_MINUTES; }
  function computeProgress(walks) {
    var eligible = (walks || []).filter(function (w) { return w && w.rewardEligible !== false; });
    var records = (walks || []).filter(countsForCard);
    var visited = {}, visitedAt = {};   // visitedAt: 처음 찍은 산책의 날짜(주민증 뒷면 발도장 기록)
    eligible.forEach(function (w) {
      (w.stampRoute || w.route || []).forEach(function (p) {
        PLACES.forEach(function (pl) {
          if (!pl.pending && !visited[pl.id] && distanceKm(p, pl.center) <= pl.radiusKm) { visited[pl.id] = true; visitedAt[pl.id] = w.date || ''; }
        });
      });
    });
    var km = eligible.reduce(function (s, w) { return s + (w.distanceKm || 0); }, 0);
    // rankDates: 그 등급이 된 날 = 그 횟수째 센 산책을 한 날(새내기는 없음 — 주민증 발급일을 쓴다)
    var rankDates = RANKS.map(function (r) { var w = r.minWalks ? records[r.minWalks - 1] : null; return w ? (w.date || '') : null; });
    // firstDate: 처음 센 산책 날(주민증 뒷면 "전입" — 주민증 발급일과 둘 중 이른 날)
    // walks: 주민증 성장에 센 산책 수 · gpsWalks: 그중 길 기록 산책(5분·200m) 수 · liveWalks: 실시간 산책(5분) 수 — 키링 조건용(11/27)
    return { walks: records.length, gpsWalks: eligible.length, liveWalks: (walks || []).filter(isLive).length, km: km, visited: visited, visitedAt: visitedAt, rankDates: rankDates, firstDate: records.reduce(function (m, w) { return w.date && (!m || w.date < m) ? w.date : m; }, null) };
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

  function rankFor(walks) {
    var r = RANKS[0];
    RANKS.forEach(function (x) { if (walks >= x.minWalks) r = x; });
    return r;
  }
  function nextRank(walks) {
    for (var i = 0; i < RANKS.length; i++) if (RANKS[i].minWalks > walks) return RANKS[i];
    return null;
  }

  // 말은 주민증 말(2026-11-16) — 예전 "스킬 칸·특성 칸·○ 테두리" 대신 특기·특이 사항·승급
  function nextGoalText(p) {
    var goals = [];
    if (p.walks < SLOT_RULES.skill) goals.push({ left: SLOT_RULES.skill - p.walks, what: '워킹패스에 특기가 생겨요' });
    if (p.walks < SLOT_RULES.passive) goals.push({ left: SLOT_RULES.passive - p.walks, what: '워킹패스에 특이 사항이 생겨요' });
    var nr = nextRank(p.walks);
    if (nr) goals.push({ left: nr.minWalks - p.walks, what: nr.be });
    goals.sort(function (a, b) { return a.left - b.left; });
    if (goals.length) return '산책 ' + goals[0].left + '회 더 하면 ' + goals[0].what;
    var remaining = PLACES.filter(function (pl) { return !pl.pending && !p.visited[pl.id]; });
    if (remaining.length) return remaining[0].name + '에 가면 새 발도장을 받아요';
    return '모든 보상을 모았어요';
  }

  // 산책 한 번 전후의 진행도를 비교해서 이번에 새로 얻은 보상 문구 목록을 돌려준다.
  function newUnlocks(before, after) {
    var out = [];
    if (before.walks < SLOT_RULES.skill && after.walks >= SLOT_RULES.skill) out.push('특기가 생겼어요');
    if (before.walks < SLOT_RULES.passive && after.walks >= SLOT_RULES.passive) out.push('특이 사항이 생겼어요');
    var br = rankFor(before.walks), ar = rankFor(after.walks);
    if (ar !== br) out.push(ar.to + ' 승급했어요');
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
  // 시간만 잰 산책은 발도장·미션·키링에서 빠지지만(주민증 성장엔 11/17부터 5분 이상이면 들어감), 이 도장은 모든 산책을 센다 —
  // 돈이 안 드는 보상이라 버튼만 눌러 채워도 비용이 0이다(hq notes/petwalk-time-only-rewards.md).
  // 한 주(월~일)에 산책한 날 수로 찍는다: 3일 · 5일 · 7일. 주마다 새로 시작하고 연속 주는 세지 않는다
  // (9/2 결정: 연속 기록은 압박 없는 통계로만). 5분 미만 산책은 세지 않는다.
  var STEADY_STEPS = [3, 5, 7];
  var STEADY_MIN_MINUTES = RECORD_MIN_MINUTES;
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

  // ── 오늘 목표(2026-11-16 가르시아 "그렇게 진행해줘" — 목표 달성 도장, 보상 체감 재검토 제안 2) ──
  // 크기별 하루 산책 목표(분) — 11/12 기획서 제안값(소 30 · 중 60 · 대 90). 크기를 모르면 중형으로 본다.
  // 끝난 뒤 확인하는 용도 — 모자라도 혼내지 않는다(10/28 조사: 견주가 원하는 건 "오늘 할 만큼 했다"는 확인).
  // 모든 산책(시간만 재기·다녀왔어요·길 기록)이 같이 들어간다 — 돈이 드는 보상이 아니라서 판정을 따지지 않는다.
  var GOAL_MINUTES = { small: 30, medium: 60, large: 90 };
  function dogSize() {
    try { var p = WalsonStore.profile() || {}; if (GOAL_MINUTES[p.size]) return p.size; } catch (e) { /* 무시 */ }   // 주민증(store.js)
    try { var s = localStorage.getItem('petwalk_dog_size'); if (GOAL_MINUTES[s]) return s; } catch (e) { /* 무시 */ }
    return 'medium';
  }
  function goalMinutes(size) { return GOAL_MINUTES[size || dogSize()] || 60; }
  // 그날(date) 산책 시간 합계와 목표. uptoIndex를 주면 기록 순서로 그 산책까지만 센다(영수증 — 그 산책을 마친 때의 상태)
  function dayGoal(walks, date, uptoIndex, size) {
    var target = goalMinutes(size), total = 0;
    (walks || []).forEach(function (w, i) {
      if (!w || w.date !== date) return;
      if (uptoIndex != null && i > uptoIndex) return;
      total += w.durationMin || 0;
    });
    return { target: target, total: total, reached: total >= target, left: Math.max(0, target - total) };
  }

  // ── 산책 보상표(2026-11-27 가르시아 "산책 보상 테이블을 변경할 수 있게 해 두자") ──
  // 잰 산책(길 기록·시간만 재기)과 다녀와서 적은 산책이 무엇을 받는지 — 숫자는 여기 한 곳만 고친다.
  // 셈: [아지트] 소품 azit-room.js progress · 창가 별 walk-stars.js · 유저용 표 rewards.html(이 값으로 그린다).
  //   dayCap   하루에 세는 산책 수(아지트 소품). 다녀와서 적은 산책은 그 안에서 after.dayCap까지
  //   special  특별 소품(밤·40분 긴 산책·킁킁·오늘의 한 장·응가)을 받나
  //   stars    창가 별을 받나 · starsPerDay 하루 별 수
  //   needScale 소품 조건(산책 n번·밤 n번 …)에 곱하는 수 — 1이면 그대로, 0.5면 절반(올림, 최소 1)
  // beta: 오픈 초기 베타(제안 — 가르시아가 켜기 전까지 on: false). on이고 until(그날까지, 'YYYY-MM-DD')이 안 지났으면 위 값을 덮는다.
  //   베타 동안 받은 소품은 끝나도 그대로 남는다(azit-room.js keptItems).
  var WALK_REWARDS = {
    live:  { dayCap: 2, special: true, stars: true },
    after: { dayCap: 1, special: false, stars: true },
    starsPerDay: 2,
    needScale: 1,
    beta: {
      on: false, until: '', label: '베타 기간',
      live:  { dayCap: 3 },
      after: { dayCap: 2, special: true },
      starsPerDay: 3,
      needScale: 0.5
    }
  };
  function dayKeyOf(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  // 지금 쓰는 보상표(베타가 켜져 있으면 덮은 값). betaOn·betaUntil·betaLabel도 같이
  function walkRewards(now) {
    var b = WALK_REWARDS.beta || {}, on = !!b.on && (!b.until || dayKeyOf(now || new Date()) <= b.until);
    function pick(k, sub) {
      var base = sub ? WALK_REWARDS[k][sub] : WALK_REWARDS[k];
      if (!on) return base;
      var v = sub ? (b[k] || {})[sub] : b[k];
      return v === undefined ? base : v;
    }
    return {
      live:  { dayCap: pick('live', 'dayCap'), special: pick('live', 'special'), stars: pick('live', 'stars') },
      after: { dayCap: pick('after', 'dayCap'), special: pick('after', 'special'), stars: pick('after', 'stars') },
      starsPerDay: pick('starsPerDay'), needScale: pick('needScale'), minMinutes: RECORD_MIN_MINUTES,
      betaOn: on, betaUntil: on ? (b.until || '') : '', betaLabel: b.label || '베타 기간'
    };
  }

  window.RewardRules = {
    WALK_REWARDS: WALK_REWARDS,
    walkRewards: walkRewards,
    isLive: isLive,
    FRAME_TIERS: FRAME_TIERS,
    RANKS: RANKS,
    rankFor: rankFor,
    nextRank: nextRank,
    KEYRING: KEYRING,
    SLOT_RULES: SLOT_RULES,
    RECORD_MIN_MINUTES: RECORD_MIN_MINUTES,
    PLACES: PLACES,
    STAMPS_ON: STAMPS_ON,
    LOCAL_PLACES: LOCAL_PLACES,
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
    steadyLevel: steadyLevel,
    GOAL_MINUTES: GOAL_MINUTES,
    dogSize: dogSize,
    goalMinutes: goalMinutes,
    dayGoal: dayGoal
  };
})();
