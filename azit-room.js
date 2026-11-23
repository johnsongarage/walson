// 산책 아지트 데이터(2026-11-23 개방명록 2단계 — 가르시아 "아지트는 탭 하나 더 두던가" → "2단계로 가자"). 전역 window.WalsonAzit.
// [아지트] 탭(azit.html)과 도감 화면 QR(dex.html)이 같이 쓴다. 그리는 것은 azit.html(시안 azit-sian-b.html에서 옮김).
//
// - 내 방: 이 휴대폰 산책 기록으로 "생긴" 소품만 놓는다(포인트로 사는 상점 X — 9/24 보상 폐지 이후 원칙).
//   고른 도트 강아지·벽지·머리 장식·빼 둔 소품·옮긴 자리·오늘 기분은 petwalk_azit(이 휴대폰에만).
// - 친구 방(마실): 단짝이 그 자리에서 띄운 화면 QR에 실려 온 "방 모습" 몇 글자(r) — 도감 항목의 room. 서버 없음.
//   방 모습 = 도트 강아지 · 벽지 · 머리 장식 · 산책 등급 · 놓은 소품(있다/없다만).
//   놓은 자리 · 산책 횟수 · 날짜 · 장소 이름 · 발도장을 어디서 받았는지는 담지 않는다.
//   키링 QR·카드 주소 보내기(시각 없는 주소)에는 안 싣는다 — 인쇄해 두는 것이라.
// 이 파일보다 store.js · spots-data.js · reward-rules.js를 먼저 불러야 한다(산책 기록 → 생긴 소품).
(function () {
  var KEY = (window.WalsonStore && WalsonStore.KEYS && WalsonStore.KEYS.azit) || 'petwalk_azit';

  // 도트 강아지 8마리(받은 그림 icons/dot-dogs — 도트 강아지 시안과 같은 그림). 방 모습에 번호로 실려 가니
  // 순서를 바꾸거나 지우지 말 것 — 새 강아지는 맨 뒤에. fur = 털 대표 색(그림의 털 부분 평균, 2026-11-23 계산),
  // sizes = 이 크기 강아지를 대신 보여 줄 때 후보(방 모습이 없는 친구 — 털색·크기로 가장 비슷한 것).
  var DOGS = [
    { id: 'pom',       breed: '포메',     fur: '#e6dcd4', sizes: 's' },
    { id: 'poodle',    breed: '푸들',     fur: '#a75c31', sizes: 'sm' },
    { id: 'maltese',   breed: '말티즈',   fur: '#e8e6df', sizes: 's' },
    { id: 'knit',      breed: '파란 니트', fur: '',        sizes: '' },    // 니트를 입은 그림이라 대신 보여 주기엔 안 씀(고르기만)
    { id: 'chihuahua', breed: '치와와',   fur: '#d6a874', sizes: 's' },
    { id: 'dachs',     breed: '닥스훈트', fur: '#8a4a1c', sizes: 'sm' },
    { id: 'jindo',     breed: '진돗개',   fur: '#f0e6d6', sizes: 'ml' },
    { id: 'shiba',     breed: '시바',     fur: '#e2a464', sizes: 'ml' }
  ];
  // 프로필 견종 글자 → 도트 강아지(처음 한 번 — 아지트에서 언제든 바꿀 수 있다). 위에서부터 먼저 맞는 것
  var BREED_RULES = [
    [/말티푸|maltipoo/i, 'poodle'], [/포메|pomeranian/i, 'pom'], [/푸들|poodle/i, 'poodle'],
    [/말티|maltese|비숑|bichon/i, 'maltese'], [/치와와|chihuahua/i, 'chihuahua'], [/닥스|dachs/i, 'dachs'],
    [/진돗|진도|jindo/i, 'jindo'], [/시바|shiba/i, 'shiba']
  ];
  var THEMES = ['jelly', 'lilac', 'night'];      // 벽지(그림 색은 azit.html). 방 모습에는 첫 글자 j·l·n

  // 소품 — 순서 고정(방 모습에 자리 번호로 실려 간다). 새 소품은 맨 뒤에.
  // need: 생기는 조건 — walks 산책 횟수(워킹패스 성장과 같은 셈, 5분 이상) · level 산책 등급(1 산책 러버 · 2 프로 산책러 · 3 핑크 앰배서더)
  //       stamps 받은 발도장 장소 수 · shop 가게 QR을 찍은 적 · steady 꾸준함 도장을 받은 주 수. 비어 있으면 처음부터.
  // 바닥 소품은 (i, j)칸, 벽 소품은 (벽 R·L, u칸, 높이 h) — 처음 자리(내 방은 옮길 수 있다, 친구 방은 늘 이 자리)
  var ITEMS = [
    { id: 'frame',  spr: 'frame',  wall: 'R', u: 2.6, h: 40, name: '등급 액자',     need: { level: 1 } },
    { id: 'card0',  spr: 'card',   wall: 'R', u: 4.8, h: 38, name: '엽서',          need: { stamps: 1 } },
    { id: 'card1',  spr: 'card',   wall: 'L', u: 5.6, h: 40, name: '엽서',          need: { stamps: 2 } },
    { id: 'bed',    spr: 'bed',    i: 3.0, j: 1.2,           name: '가게 방석',     need: { shop: 1 } },
    { id: 'trophy', spr: 'trophy', i: 0.9, j: 0.9,           name: '트로피',        need: { steady: 3 } },
    { id: 'plant',  spr: 'plant',  i: 1.0, j: 6.4,           name: '화분',          need: { walks: 10 } },
    { id: 'bowl',   spr: 'bowl',   i: 7.0, j: 2.6,           name: '밥그릇',        need: {} },
    { id: 'bone',   spr: 'bone',   i: 5.6, j: 2.4,           name: '뼈다귀',        need: { walks: 1 } },
    { id: 'carrot', spr: 'carrot', i: 6.4, j: 3.2,           name: '당근 인형',     need: { walks: 5 } },
    { id: 'ball',   spr: 'ball',   i: 6.8, j: 6.6,           name: '공',            need: {} },
    { id: 'flag',   spr: 'flag',   i: 1.6, j: 3.6,           name: '앰배서더 깃발', need: { level: 3 } }
  ];
  // 머리 위 장식 — 순서 고정(방 모습에 1부터 번호, 0 = 없음)
  var ACCS = [
    { id: 'ribbon', name: '리본',      need: {} },
    { id: 'cap',    name: '산책 모자', need: { steady: 3 } },
    { id: 'crown',  name: '왕관',      need: { level: 2 } }
  ];
  var MOODS = ['신나요', '간식 생각', '산책 가고 싶어', '졸려요', '킁킁 탐색 중'];

  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function indexOf(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return i; return -1; }
  function hexRgb(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function todayKey() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  // ── 산책 기록 → 생긴 것 ──
  var RANK_NAMES = ['산책 입문자', '산책 러버', '프로 산책러', '핑크 앰배서더'];
  function rankName(level) {
    var RR = window.RewardRules, r = RR && RR.RANKS && RR.RANKS[level];
    return r ? r.name : (RANK_NAMES[level] || RANK_NAMES[0]);
  }
  function rankMin(level) {
    var RR = window.RewardRules, r = RR && RR.RANKS && RR.RANKS[level];
    return r ? r.minWalks : [0, 5, 15, 30][level] || 0;
  }
  function progress() {
    var RR = window.RewardRules, walks = WalsonStore.walks(), p = null, st = null;
    try { p = RR ? RR.computeProgress(walks) : null; } catch (e) { p = null; }
    try { st = RR ? RR.steady(walks) : null; } catch (e) { st = null; }
    var n = (p && p.walks) || 0, level = 0;
    for (var l = 1; l < 4; l++) if (n >= rankMin(l)) level = l;
    return {
      walks: n,
      stamps: p && p.visited ? Object.keys(p.visited).length : 0,
      shop: WalsonStore.visits().length,
      steady: (st && st.total) || 0,
      level: level, rank: rankName(level)
    };
  }
  function met(need, p) {
    need = need || {};
    return (!need.walks || p.walks >= need.walks) && (!need.level || p.level >= need.level) &&
      (!need.stamps || p.stamps >= need.stamps) && (!need.shop || p.shop >= need.shop) && (!need.steady || p.steady >= need.steady);
  }
  // 소품을 누르면 뜨는 글(모델하우스·친구 방) — how: 어떻게 생기는지, mine: 나는 어떤지
  function howText(need, p) {
    need = need || {};
    var how;
    if (need.level) { var rn = rankName(need.level), c = rn.charCodeAt(rn.length - 1); how = rn + ((c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? '이' : '가') + ' 되면 생겨요'; }
    else if (need.walks) how = '산책 ' + need.walks + '번 하면 생겨요';
    else if (need.stamps) how = '발도장 ' + need.stamps + '곳 받으면 생겨요';
    else if (need.shop) how = '가게 QR을 찍으면 생겨요';
    else if (need.steady) how = '꾸준함 도장 ' + need.steady + '주 받으면 생겨요';
    else how = '처음부터 있어요';
    return { how: how, mine: met(need, p) ? '나도 있어요' : (need.shop ? '나는 아직 없어요' : '나는 ' + needText(need, p)) };
  }
  // 소품 칸 아래 작은 글씨 — 생겼으면 어떻게 생겼는지, 아니면 얼마나 남았는지
  function needText(need, p) {
    need = need || {};
    var ok = met(need, p);
    if (need.level) return ok ? rankName(need.level) : '산책 ' + (rankMin(need.level) - p.walks) + '번 더';
    if (need.walks) return ok ? (need.walks === 1 ? '첫 산책' : '산책 ' + need.walks + '번') : '산책 ' + (need.walks - p.walks) + '번 더';
    if (need.stamps) return ok ? '발도장 ' + need.stamps + '곳' : '발도장 ' + (need.stamps - p.stamps) + '곳 더';
    if (need.shop) return ok ? '가게 QR' : '가게 QR 찍으면';
    if (need.steady) return ok ? '꾸준함 ' + need.steady + '주' : '꾸준함 도장 ' + (need.steady - p.steady) + '주 더';
    return '처음부터';
  }

  // ── 도트 강아지 고르기 ──
  var SIZE_CODE = { small: 's', medium: 'm', large: 'l', s: 's', m: 'm', l: 'l' };
  // 크기·털색으로 가장 비슷한 도트 강아지(방 모습이 없는 친구, 견종을 안 적은 우리 개) — 털색은 프로필 사진 가운데 색이라 대강
  function guessDog(size, color) {
    var sc = SIZE_CODE[size] || 'm';
    var pool = DOGS.filter(function (d) { return d.sizes.indexOf(sc) >= 0; });
    if (!pool.length) pool = DOGS.filter(function (d) { return d.fur; });
    if (!/^#[0-9a-f]{6}$/i.test(color || '')) return pool[0].id;
    var c = hexRgb(color), best = pool[0].id, bd = Infinity;
    pool.forEach(function (d) {
      var f = hexRgb(d.fur), dr = c[0] - f[0], dg = c[1] - f[1], db = c[2] - f[2];
      var dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;   // 사람 눈에 가깝게 초록을 무겁게
      if (dist < bd) { bd = dist; best = d.id; }
    });
    return best;
  }
  function dogFromBreed(breed) {
    var b = String(breed || '');
    for (var i = 0; i < BREED_RULES.length; i++) if (BREED_RULES[i][0].test(b)) return BREED_RULES[i][1];
    return null;
  }

  // ── 왈슨 모델하우스(2026-11-23 가르시아 "정성들여 꾸민 버전을 샘플로 보여주는 것도 있어야 해" → "추천대로 만들어",
  //    hq notes/petwalk-azit-showroom.md) — 앱 캐릭터 왈슨(치와와)이 꾸민 예시 방. 진짜 사람·강아지 방이 아니라 구경용(늘 "예시" 표지).
  //    소품은 모두 산책으로 생기는 것만(사는 것 X). 자리는 손으로 하나하나 — 벽 소품은 두 벽에 나눠 걸고, 바닥은 이야기 있게
  //    (트로피·깃발은 안쪽 구석, 방석 옆 밥그릇·뼈다귀, 창가 화분, 앞쪽 놀이 자리), 강아지가 다니는 가운데는 비운다.
  //    1단계는 한 채(지금 소품 전부 = 산책 30번 목표 그림). 2·3번 방(밤산책 라운지·공원 피크닉)은 새 소품을 그린 뒤.
  var CURATED_POS = {
    frame:  { wall: 'R', u: 2.5, h: 41 }, card0: { wall: 'R', u: 4.4, h: 44 }, card1: { wall: 'L', u: 4.9, h: 40 },
    trophy: { i: 0.9, j: 0.9 }, flag: { i: 2.1, j: 0.7 },
    bed: { i: 5.3, j: 1.3 }, bowl: { i: 7.1, j: 1.4 }, bone: { i: 6.0, j: 2.6 },
    plant: { i: 0.8, j: 3.3 },
    ball: { i: 5.0, j: 6.4 }, carrot: { i: 5.8, j: 6.0 }
  };
  function copyPos() { var o = {}; Object.keys(CURATED_POS).forEach(function (k) { var p = CURATED_POS[k], c = {}; for (var f in p) c[f] = p[f]; o[k] = c; }); return o; }
  var SHOWROOMS = [
    { id: 'pink', name: '핑크 앰배서더의 방', owner: '왈슨', dog: 'chihuahua', theme: 'jelly', acc: 'crown', level: 3,
      items: ITEMS.map(function (it) { return it.id; }), pos: CURATED_POS, line: '산책 30번이면 이렇게 돼요' }
  ];
  // 샘플 모드의 내 방(공원 시연·처음 온 사람) — 샘플 강아지 왈슨이 지금 가진 소품을 같은 손 배치로. 벽지는 모델하우스와 다르게 라일락.
  // 샘플을 끄면 원래대로(sample-data.js가 petwalk_azit을 보관했다 되돌린다). sample: true = 이 상태가 샘플용이라는 표시
  function sampleState() {
    var all = ITEMS.map(function (it) { return it.id; }).concat(ACCS.map(function (a) { return a.id; }));
    return { sample: true, dog: 'chihuahua', dogAuto: false, theme: 'lilac', acc: 'crown', hidden: [], pos: copyPos(), seen: all,
      mood: '산책 가고 싶어', moodDay: todayKey() };
  }

  // ── 내 방 상태(petwalk_azit) ──
  // {dog, dogAuto(우리가 골라 준 것 — 사용자가 고르면 false), theme, acc, hidden[빼 둔 소품], pos{소품: 옮긴 자리}, seen[본 적 있는 소품], mood, moodDay, sample}
  // 샘플 모드인데 샘플용 상태가 아니면(샘플을 막 켰거나, 이 규칙 전에 샘플로 연 아지트) 샘플 방으로 시작한다
  function loadState() {
    var s = WalsonStore.object(KEY) || {};
    if (WalsonStore.sampleOn && WalsonStore.sampleOn() && s.sample !== true) return sampleState();
    var pos = {};
    if (s.pos && typeof s.pos === 'object') Object.keys(s.pos).forEach(function (id) {
      var p = s.pos[id], it = byId(ITEMS, id);
      if (!it || !p || typeof p !== 'object') return;
      if (it.wall && (p.wall === 'R' || p.wall === 'L') && isFinite(p.u) && isFinite(p.h)) pos[id] = { wall: p.wall, u: +p.u, h: +p.h };
      else if (!it.wall && isFinite(p.i) && isFinite(p.j)) pos[id] = { i: +p.i, j: +p.j };
    });
    return {
      dog: byId(DOGS, s.dog) ? s.dog : null,
      dogAuto: s.dogAuto !== false,
      theme: THEMES.indexOf(s.theme) >= 0 ? s.theme : 'jelly',
      acc: (s.acc === '' || byId(ACCS, s.acc)) ? s.acc : 'ribbon',
      hidden: Array.isArray(s.hidden) ? s.hidden.filter(function (id) { return !!byId(ITEMS, id); }) : [],
      pos: pos,
      seen: Array.isArray(s.seen) ? s.seen.filter(function (id) { return !!byId(ITEMS, id) || !!byId(ACCS, id); }) : null,   // null = 아지트를 처음 연다
      mood: (s.moodDay === todayKey() && MOODS.indexOf(s.mood) >= 0) ? s.mood : '',   // 오늘 기분은 그날만
      moodDay: s.moodDay === todayKey() ? s.moodDay : '',
      sample: s.sample === true
    };
  }
  function saveState(st) {
    var o = { dog: st.dog, dogAuto: !!st.dogAuto, theme: st.theme, acc: st.acc, hidden: st.hidden, pos: st.pos, seen: st.seen || [], mood: st.mood, moodDay: st.moodDay };
    if (st.sample) o.sample = true;
    return WalsonStore.setJSON(KEY, o);
  }
  // 우리 개 도트 강아지 — 직접 고른 것 → 견종 → 털색(color가 있으면 크기와 함께) → 지난번에 털색으로 골라 둔 것 → 크기 → 워킹패스가 없으면 포메(시안 B안 기본).
  // 직접 고르기 전(dogAuto)에는 열 때마다 다시 고른다 — 나중에 견종을 적거나 바꾸면 따라가게(11/23 빈틈)
  function myDog(st, color) {
    if (st && st.dog && st.dogAuto === false) return st.dog;
    var p = WalsonStore.profile() || {};
    var b = dogFromBreed(p.breed);
    if (b) return b;
    if (color) return guessDog(p.size, color);
    if (st && st.dog) return st.dog;
    return p.size ? guessDog(p.size, null) : 'pom';
  }
  function unlockedItems(p) { return ITEMS.filter(function (it) { return met(it.need, p); }).map(function (it) { return it.id; }); }
  function placedItems(st, p) { return unlockedItems(p).filter(function (id) { return st.hidden.indexOf(id) < 0; }); }
  function accOn(st, p) { var a = byId(ACCS, st.acc); return a && met(a.need, p) ? a.id : ''; }

  // ── 방 모습 몇 글자(화면 QR의 r) ── [강아지 번호][벽지 j·l·n][머리 장식 0~][산책 등급 0~3][놓은 소품 16진수]
  // 예: "0j1" + "1" + "2c4". 받은 쪽은 모르는 번호·자리는 버리고 읽는다(나중에 강아지·소품이 늘어도 예전 앱이 깨지지 않게).
  function snapshot(st, p, color) {
    var bits = 0;
    placedItems(st, p).forEach(function (id) { bits |= 1 << indexOf(ITEMS, id); });
    var di = indexOf(DOGS, myDog(st, color)), ai = indexOf(ACCS, accOn(st, p));
    return (di < 0 ? 0 : di).toString(36) + st.theme.charAt(0) + (ai + 1).toString(36) + String(Math.max(0, Math.min(3, p.level))) + bits.toString(16);
  }
  function mySnapshot(color) { try { return snapshot(loadState(), progress(), color); } catch (e) { return null; } }
  // 남이 만든 QR일 수 있으니 모양을 꼼꼼히 — 맞으면 {dog(모르면 null), theme, acc, level, items[]}, 아니면 null
  // 소품 자리는 16진수 8글자(소품 32개)까지 읽는다 — 소품을 늘리기 전에 읽는 쪽부터 넓혀 둔 것(11/23, 처음엔 4글자 = 16개)
  function parseRoom(r) {
    var m = /^([0-9a-z])([a-z])([0-9a-z])([0-9])([0-9a-f]{1,8})$/.exec(typeof r === 'string' ? r : '');
    if (!m) return null;
    var d = DOGS[parseInt(m[1], 36)], th = THEMES.filter(function (t) { return t.charAt(0) === m[2]; })[0] || 'jelly';
    var a = ACCS[parseInt(m[3], 36) - 1], bits = parseInt(m[5], 16);
    return {
      dog: d ? d.id : null, theme: th, acc: a ? a.id : '', level: Math.min(3, parseInt(m[4], 10)),
      items: ITEMS.filter(function (it, i) { return bits & (1 << i); }).map(function (it) { return it.id; })
    };
  }

  window.WalsonAzit = {
    KEY: KEY, DOGS: DOGS, ITEMS: ITEMS, ACCS: ACCS, THEMES: THEMES, MOODS: MOODS,
    byId: byId, progress: progress, met: met, needText: needText, howText: howText, rankName: rankName,
    SHOWROOMS: SHOWROOMS, sampleState: sampleState,
    guessDog: guessDog, dogFromBreed: dogFromBreed, myDog: myDog,
    loadState: loadState, saveState: saveState, unlockedItems: unlockedItems, placedItems: placedItems, accOn: accOn,
    snapshot: snapshot, mySnapshot: mySnapshot, parseRoom: parseRoom, todayKey: todayKey,
    dogSrc: function (id) { return 'icons/dot-dogs/' + id + '.webp?v=1'; },
    dogPxSrc: function (id) { return 'icons/dot-dogs/px/' + id + '.png?v=1'; }   // 원래 점 격자 그대로(점 하나 = 한 픽셀) — _dev/dot-dog-native.py
  };
})();
