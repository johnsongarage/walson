// 산책 아지트 데이터(2026-11-23 개방명록 2단계 — 가르시아 "아지트는 탭 하나 더 두던가" → "2단계로 가자"). 전역 window.WalsonAzit.
// [아지트] 탭(azit.html)과 도감 화면 QR(dex.html)이 같이 쓴다. 그리는 것은 azit.html(시안 azit-sian-b.html에서 옮김 → 11/23 밤 새 방 azit-sian-c.html).
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
  //   11/23 모델하우스 2단계에 더한 것: pass 워킹패스가 있음 · photos 오늘의 한 장 장수 · poop 산책 끝 "응가 치웠나요"에 답한 치운 횟수(1번·2번 이상)
  //       · keyring 키링을 받음 · park 공원 발도장 장소 수 · steady5 한 주에 5일 넘게 산책한 주 수. 모두 "산 것"이 아니라 "한 것".
  //       (교환 수 — 단짝 몇 마리 — 를 조건으로 거는 건 아직 정하지 않아서 넣지 않았다. 11/23 "교환 횟수엔 돈 되는 보상 X")
  // 11/23 밤 새 방(가르시아 "탭에 넣기" — 산책 아지트 C안): 그림은 icons/azit-room(spr = 파일 이름, 받은 그림을 방 크기에 맞춘 것 +
  // _dev/azit-extra.py로 그린 것). 방은 분홍 빈 방 394×220점 — 바닥 자리는 두 벽 모서리(199,74)에서 오른쪽 벽 따라 i, 왼쪽 벽 따라 j
  // (한 칸 = 가로 2점·세로 1점, 바닥은 대략 i 0~100 · j 0~85), 벽 소품은 (벽 R·L, 모서리에서 u칸, 그림 가운데가 바닥 줄에서 h점 위).
  // face: 벽 소품 그림이 어느 벽 방향으로 그려졌는지 — 다른 벽에 걸면 좌우로 뒤집는다. decal: 바닥에 까는 것(러그·매트, 자리는 그림 가운데).
  // corner: 두 벽 모서리에 걸친 것(가랜드 — 끌지 않는다). 예전 8×8칸 자리는 POS_V가 달라 새 처음 자리로 놓인다.
  // 처음 자리는 다 생긴 방을 그려 보며 손으로(붙박이 선반·창·계단을 피해서, 사진 액자는 왼쪽 선반 위·엽서는 선반 위 벽·트로피는 오른쪽 선반에).
  // 내 방은 옮길 수 있다, 친구 방은 늘 이 자리.
  var ITEMS = [
    { id: 'frame',  spr: 'frame_jelly_pink', face: 'L', wall: 'R', u: 80.5, h: 53.5, name: '등급 액자', need: { level: 1 } },
    { id: 'card0',  spr: 'postcard_paw', face: 'L', wall: 'R', u: 79.5, h: 82.5, name: '엽서', need: { stamps: 1 } },
    { id: 'card1',  spr: 'postcard_paw', face: 'L', wall: 'L', u: 15.5, h: 71.5, name: '엽서', need: { stamps: 2 } },
    { id: 'bed',    spr: 'cushion_cafe_beige', i: 40, j: 58, name: '가게 방석', need: { shop: 1 } },
    { id: 'trophy', spr: 'trophy_shelf', face: 'R', wall: 'R', u: 31.5, h: 56.5, name: '트로피', need: { steady: 3 } },
    { id: 'plant',  spr: 'plant_pot', i: 4, j: 12, name: '화분', need: { walks: 10 } },
    { id: 'bowl',   spr: 'feeder_wood_2bowl', i: 7, j: 48, name: '밥그릇', need: {} },
    { id: 'bone',   spr: 'toy_bone', i: 75, j: 47, name: '뼈다귀', need: { walks: 1 } },
    { id: 'carrot', spr: 'carrot_plush', i: 62, j: 66, name: '당근 인형', need: { walks: 5 } },
    { id: 'ball',   spr: 'ball_yellow', i: 80, j: 32, name: '공', need: {} },
    { id: 'flag',   spr: 'flag_stand', i: 36, j: 6, name: '앰배서더 깃발', need: { level: 3 } },
    // ── 11/23 모델하우스 2단계 ──
    { id: 'rug',     spr: 'rug_pattern', i: 55, j: 39, decal: true, name: '러그', need: { walks: 3 } },
    { id: 'photo',   spr: 'frame_photo', face: 'L', wall: 'L', u: 42, h: 80, name: '우리 개 사진 액자', need: { pass: 1 } },
    { id: 'basket',  spr: 'basket_blue_carrot', i: 16, j: 5, name: '장난감 바구니', need: { walks: 15 } },
    { id: 'house',   spr: 'sofa_bed', i: 64, j: 16, name: '강아지 소파', need: { walks: 20 } },   // 11/23 새 방부터 집 대신 소파
    { id: 'shelf',   spr: 'board_postcard', face: 'R', wall: 'R', u: 11.5, h: 52.5, name: '오늘의 한 장 게시판', need: { photos: 3 } },
    { id: 'poopbag', spr: 'poopbag_holder', face: 'R', wall: 'L', u: 68.5, h: 47.5, name: '응가 봉투 걸이', need: { poop: 10 } },
    { id: 'keyhook', spr: 'keyhook_rail', face: 'R', wall: 'R', u: 92, h: 56, name: '키링 걸이', need: { keyring: 1 } },
    { id: 'lamp',    spr: 'lamp_stand', i: 5, j: 30, name: '스탠드 조명', need: { steady: 1 } },
    { id: 'mat',     spr: 'picnic_mat', i: 20, j: 56, decal: true, name: '피크닉 매트', need: { park: 1 } },
    { id: 'garland', spr: 'garland_bunting', corner: true, name: '가랜드', need: { steady5: 1 } },
    // 단짝 액자(11/23 가르시아 "추천대로" — 교환 수 문턱 보상("단짝 3마리면 가랜드") 대신): 첫 단짝부터 걸리고 최근 단짝 도트 강아지가 들어간다.
    // 숫자를 채우는 보상이 아니라 방이 친구로 채워지는 것(11/23 결정 "방이 채워지는 것 자체가 보상"과 같은 결)
    { id: 'palframe', spr: 'frame_pal', face: 'R', wall: 'L', u: 59.5, h: 56.5, name: '단짝 액자', need: { pals: 1 } }
  ];
  var POS_V = 2;   // 저장한 자리의 좌표 판 — 2 = 11/23 새 방(394×220점). 그 전(8×8칸) 자리는 읽지 않고 새 처음 자리로
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
    var prof = WalsonStore.profile(), visited = (p && p.visited) || {}, poop = 0, photos = 0;
    walks.forEach(function (w) {
      if (!w) return;
      if (w.photoKey) photos++;                                   // 오늘의 한 장을 남긴 산책
      var pp = Number(w.poop); if (pp === 1 || pp === 2) poop += pp;   // "응가 치웠나요" — 1번·2번 이상(2로 셈)
    });
    var park = ((RR && RR.PLACES) || []).filter(function (pl) { return pl.kind === 'park' && visited[pl.id]; }).length;
    var by = (st && st.byLevel) || [0, 0, 0];
    return {
      walks: n,
      stamps: Object.keys(visited).length,
      shop: WalsonStore.visits().length,
      steady: (st && st.total) || 0,
      level: level, rank: rankName(level),
      pass: prof && prof.name ? 1 : 0, photos: photos, poop: poop, keyring: WalsonStore.keyring() ? 1 : 0, park: park,
      steady5: (by[1] || 0) + (by[2] || 0),                       // 5일·7일 도장을 받은 주
      pals: WalsonStore.dex().filter(function (e) { return e && e.pal; }).length   // 도감 단짝 수(그 자리에서 서로 찍은 친구)
    };
  }
  var NEED_KEYS = ['walks', 'level', 'stamps', 'shop', 'steady', 'pass', 'photos', 'poop', 'keyring', 'park', 'steady5', 'pals'];
  function met(need, p) {
    need = need || {};
    for (var k = 0; k < NEED_KEYS.length; k++) { var key = NEED_KEYS[k]; if (need[key] && !((p[key] || 0) >= need[key])) return false; }
    return true;
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
    else if (need.pass) how = '워킹패스를 만들면 생겨요';
    else if (need.photos) how = '오늘의 한 장을 ' + need.photos + '장 남기면 생겨요';
    else if (need.poop) how = '산책 끝에 응가를 ' + need.poop + '번 치우면 생겨요';
    else if (need.keyring) how = '키링을 받으면 생겨요';
    else if (need.park) how = '공원 발도장을 받으면 생겨요';
    else if (need.steady5) how = '한 주에 5일 산책하면 생겨요';
    else if (need.pals) how = '단짝이 생기면 걸려요 — 최근 단짝 강아지가 들어가요';
    else how = '처음부터 있어요';
    var once = need.shop || need.pass || need.keyring || need.park || need.pals;   // 한 번 하면 되는 것은 "아직 없어요"
    return { how: how, mine: met(need, p) ? '나도 있어요' : (once ? '나는 아직 없어요' : '나는 ' + needText(need, p)) };
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
    if (need.pass) return ok ? '워킹패스' : '워킹패스 만들면';
    if (need.photos) return ok ? '오늘의 한 장 ' + need.photos + '장' : '오늘의 한 장 ' + (need.photos - (p.photos || 0)) + '장 더';
    if (need.poop) return ok ? '응가 치움 ' + need.poop + '번' : '응가 치움 ' + (need.poop - (p.poop || 0)) + '번 더';
    if (need.keyring) return ok ? '키링' : '키링 받으면';
    if (need.park) return ok ? '공원 발도장' : '공원 발도장 받으면';
    if (need.steady5) return ok ? '꾸준함 5일' : '한 주 5일 산책하면';
    if (need.pals) return ok ? '단짝' : '단짝이 생기면';
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
  //    1단계(11/23)는 한 채, 2단계(같은 날 "2단계로 가자")에 새 소품 10개를 그리고 세 채로.
  //    방마다 그 방에 놓은 소품과 자리(pos) — 자리는 손으로 하나하나 화면에 띄워 보며 맞춘 것.
  //    11/23 밤 새 방부터는 처음 자리(ITEMS)를 그대로 쓰고 방마다 몇 개만 옮긴다(over) — 세 채를 그려 보며 맞춘 자리.
  //    벽지: 핑크 앰배서더 = 분홍 방, 밤산책 라운지 = 밤 블랙 핑크 방, 공원 피크닉 = 라일락 방.
  function roomPos(ids, over) {
    var pos = {};
    ids.forEach(function (id) {
      var it = byId(ITEMS, id), o = over && over[id];
      if (o) pos[id] = o;
      else if (it.corner) pos[id] = { corner: 1 };
      else if (it.wall) pos[id] = { wall: it.wall, u: it.u, h: it.h };
      else pos[id] = { i: it.i, j: it.j };
    });
    return pos;
  }
  var SHOWROOMS = [
    { id: 'pink', name: '핑크 앰배서더의 방', owner: '왈슨', dog: 'chihuahua', theme: 'jelly', acc: 'crown', level: 3,
      line: '산책 30번이면 이렇게 돼요',   // 등급·꾸준함 — 오른쪽 선반에 트로피·옆에 깃발, 벽엔 액자·엽서와 모서리 가랜드, 왼쪽 선반에 우리 개 사진
      pos: roomPos(['garland', 'frame', 'card0', 'photo', 'card1', 'palframe', 'rug', 'trophy', 'flag', 'bed', 'bowl', 'bone', 'plant', 'house', 'ball', 'carrot']) },
    { id: 'night', name: '밤산책 라운지', owner: '왈슨', dog: 'chihuahua', theme: 'night', acc: 'cap', level: 2,
      line: '꾸준히 걸으면 이렇게 돼요',   // 꾸준함 — 창가 방석 옆 스탠드 조명·러그, 오늘의 한 장 게시판, 키링 걸이
      dogs: { host: [50, 48], guest: [40, 30] },   // 러그 위에(창가 방석·스탠드가 가려지지 않게)
      pos: roomPos(['garland', 'frame', 'shelf', 'keyhook', 'photo', 'rug', 'trophy', 'lamp', 'plant', 'bed', 'bowl', 'basket', 'ball'],
        { bed: { i: 66, j: 18 }, lamp: { i: 84, j: 8 } }) },
    { id: 'picnic', name: '공원 피크닉 방', owner: '왈슨', dog: 'chihuahua', theme: 'lilac', acc: 'ribbon', level: 1,
      line: '공원 발도장을 모으면 이렇게 돼요',   // 공원 — 피크닉 매트에 바구니·공·당근, 벽엔 엽서, 응가 봉투 걸이
      dogs: { host: [34, 30], guest: [44, 22] },   // 매트 뒤에(앞쪽 매트 위 바구니·공이 가려지지 않게)
      pos: roomPos(['garland', 'card0', 'card1', 'photo', 'poopbag', 'palframe', 'mat', 'house', 'bowl', 'bone', 'basket', 'ball', 'carrot', 'plant'],
        { mat: { i: 52, j: 50 }, basket: { i: 50, j: 60 }, ball: { i: 62, j: 60 }, carrot: { i: 58, j: 50 }, bone: { i: 74, j: 44 } }) }
  ];
  // 방마다 놓은 소품 = pos에 자리가 있는 것(소품 순서대로)
  SHOWROOMS.forEach(function (s) { s.items = ITEMS.filter(function (it) { return s.pos[it.id]; }).map(function (it) { return it.id; }); });
  function copyPosOf(pos) { var o = {}; Object.keys(pos).forEach(function (k) { var p = pos[k], c = {}; for (var f in p) c[f] = p[f]; o[k] = c; }); return o; }
  // 샘플 모드의 내 방(공원 시연·처음 온 사람) — 샘플 강아지 왈슨이 지금 가진 소품을 1번 방과 같은 손 배치로. 벽지는 모델하우스와 다르게 라일락.
  // 1번 방에 없는 소품은 빼 둔 걸로(샘플 방이 흐트러지지 않게 — [내 소품]에서 넣을 수 있다).
  // 샘플을 끄면 원래대로(sample-data.js가 petwalk_azit을 보관했다 되돌린다). sample: true = 이 상태가 샘플용이라는 표시
  var SAMPLE_V = 4;   // 샘플 방 모양 번호 — 소품·배치가 바뀌면 올린다(예전 샘플 방은 새로 만든다). 3 = 단짝 액자 더함(11/23), 4 = 새 방(11/23 밤)
  function sampleState() {
    var room = SHOWROOMS[0];
    var all = ITEMS.map(function (it) { return it.id; }).concat(ACCS.map(function (a) { return a.id; }));
    return { sample: true, sampleV: SAMPLE_V, dog: 'chihuahua', dogAuto: false, theme: 'lilac', acc: 'crown',
      hidden: ITEMS.filter(function (it) { return !room.pos[it.id]; }).map(function (it) { return it.id; }),
      pos: copyPosOf(room.pos), seen: all, mood: '산책 가고 싶어', moodDay: todayKey() };
  }

  // ── 내 방 상태(petwalk_azit) ──
  // {dog, dogAuto(우리가 골라 준 것 — 사용자가 고르면 false), theme, acc, hidden[빼 둔 소품], pos{소품: 옮긴 자리}, seen[본 적 있는 소품], mood, moodDay, sample}
  // 샘플 모드인데 샘플용 상태가 아니면(샘플을 막 켰거나, 이 규칙 전에 샘플로 연 아지트) 샘플 방으로 시작한다
  function cleanPos(raw) {
    var pos = {};
    if (raw && typeof raw === 'object') Object.keys(raw).forEach(function (id) {
      var p = raw[id], it = byId(ITEMS, id);
      if (!it || !p || typeof p !== 'object' || it.corner) return;   // 모서리 가랜드는 자리가 없다
      if (it.wall && (p.wall === 'R' || p.wall === 'L') && isFinite(p.u) && isFinite(p.h)) pos[id] = { wall: p.wall, u: +p.u, h: +p.h };
      else if (!it.wall && isFinite(p.i) && isFinite(p.j)) pos[id] = { i: +p.i, j: +p.j };
    });
    return pos;
  }
  function cleanHidden(raw) { return Array.isArray(raw) ? raw.filter(function (id) { return !!byId(ITEMS, id); }) : []; }
  function cleanAcc(a) { return (a === '' || byId(ACCS, a)) ? a : 'ribbon'; }
  function loadState() {
    var s = WalsonStore.object(KEY) || {};
    if (WalsonStore.sampleOn && WalsonStore.sampleOn() && (s.sample !== true || s.sampleV !== SAMPLE_V)) return sampleState();
    var newPos = s.posV === POS_V;   // 예전 방(8×8칸) 자리·되돌리기는 새 방 좌표가 아니라서 읽지 않는다(새 처음 자리로)
    var u = newPos && s.undo && typeof s.undo === 'object' ? s.undo : null;
    return {
      dog: byId(DOGS, s.dog) ? s.dog : null,
      dogAuto: s.dogAuto !== false,
      theme: THEMES.indexOf(s.theme) >= 0 ? s.theme : 'jelly',
      acc: cleanAcc(s.acc),
      hidden: cleanHidden(s.hidden),
      pos: newPos ? cleanPos(s.pos) : {},
      seen: Array.isArray(s.seen) ? s.seen.filter(function (id) { return !!byId(ITEMS, id) || !!byId(ACCS, id); }) : null,   // null = 아지트를 처음 연다
      mood: (s.moodDay === todayKey() && MOODS.indexOf(s.mood) >= 0) ? s.mood : '',   // 오늘 기분은 그날만
      moodDay: s.moodDay === todayKey() ? s.moodDay : '',
      sample: s.sample === true, sampleV: s.sampleV,
      // [이 방처럼 놓기] 전 모습(되돌리기용, 11/23) — 벽지·머리 장식·자리·빼 둔 소품
      undo: u ? { theme: THEMES.indexOf(u.theme) >= 0 ? u.theme : 'jelly', acc: cleanAcc(u.acc), pos: cleanPos(u.pos), hidden: cleanHidden(u.hidden),
        from: typeof u.from === 'string' ? u.from.slice(0, 20) : '' } : null
    };
  }
  function saveState(st) {
    var o = { dog: st.dog, dogAuto: !!st.dogAuto, theme: st.theme, acc: st.acc, hidden: st.hidden, pos: st.pos, posV: POS_V, seen: st.seen || [], mood: st.mood, moodDay: st.moodDay };
    if (st.sample) { o.sample = true; o.sampleV = st.sampleV; }
    if (st.undo) o.undo = st.undo;
    return WalsonStore.setJSON(KEY, o);
  }
  // [이 방처럼 놓기](11/23 모델하우스 2단계) — 모델하우스 room의 벽지·머리 장식·자리를 내 방으로. 그 방 소품 자리를 모두 옮기고(빼 뒀으면 다시 넣음 —
  // 아직 없는 소품은 생기면 그 자리에 놓인다), 그 방에 없는 내 소품은 넣어 둔다([내 소품]에서 다시 꺼낼 수 있다).
  // 바로 전 모습은 undo에 남겨 [되돌리기]로.
  function copyRoom(st, p, room) {
    st.undo = { theme: st.theme, acc: st.acc, pos: copyPosOf(st.pos), hidden: st.hidden.slice(), from: room.id };
    st.theme = room.theme;
    var a = byId(ACCS, room.acc); if (a && met(a.need, p)) st.acc = room.acc;
    Object.keys(room.pos).forEach(function (id) {
      var c = {}, q = room.pos[id]; for (var f in q) c[f] = q[f];
      st.pos[id] = c;
      var h = st.hidden.indexOf(id); if (h >= 0) st.hidden.splice(h, 1);
    });
    unlockedItems(p).forEach(function (id) { if (!room.pos[id] && st.hidden.indexOf(id) < 0) st.hidden.push(id); });
    return st;
  }
  function undoCopy(st) {
    if (!st.undo) return st;
    st.theme = st.undo.theme; st.acc = st.undo.acc; st.pos = st.undo.pos; st.hidden = st.undo.hidden; st.undo = null;
    return st;
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
    SHOWROOMS: SHOWROOMS, sampleState: sampleState, copyRoom: copyRoom, undoCopy: undoCopy,
    guessDog: guessDog, dogFromBreed: dogFromBreed, myDog: myDog,
    loadState: loadState, saveState: saveState, unlockedItems: unlockedItems, placedItems: placedItems, accOn: accOn,
    snapshot: snapshot, mySnapshot: mySnapshot, parseRoom: parseRoom, todayKey: todayKey,
    dogSrc: function (id) { return 'icons/dot-dogs/' + id + '.webp?v=1'; },
    dogPxSrc: function (id) { return 'icons/dot-dogs/px/' + id + '.png?v=1'; }   // 원래 점 격자 그대로(점 하나 = 한 픽셀) — _dev/dot-dog-native.py
  };
})();
