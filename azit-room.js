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
    { id: 'dachs',     breed: '닥스훈트', fur: '#3a3a40', sizes: 'sm' },   // 11/27 블랙 앤 탄으로 다시 칠함(_dev/dachs-piebald.py) — 털색 맞추기도 짙은 색 쪽
    { id: 'jindo',     breed: '진돗개',   fur: '#f0e6d6', sizes: 'ml' },
    { id: 'shiba',     breed: '시바',     fur: '#e2a464', sizes: 'ml' }
  ];
  // 프로필 견종 글자 → 도트 강아지(처음 한 번 — 아지트에서 언제든 바꿀 수 있다). 위에서부터 먼저 맞는 것
  var BREED_RULES = [
    [/말티푸|maltipoo/i, 'poodle'], [/포메|pomeranian/i, 'pom'], [/푸들|poodle/i, 'poodle'],
    [/말티|maltese|비숑|bichon/i, 'maltese'], [/치와와|chihuahua/i, 'chihuahua'], [/닥스|dachs/i, 'dachs'],
    [/진돗|진도|jindo/i, 'jindo'], [/시바|shiba/i, 'shiba']
  ];
  var THEMES = ['jelly', 'lilac', 'night', 'pink'];      // 벽지(그림 색은 azit.html). 방 모습에는 첫 글자 j·l·n·p — pink = 옛 분홍 방(11/24 기본이 크림으로 바뀌며 네 번째로 남김)

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
  // 처음 자리는 다 생긴 방을 그려 보며 손으로(붙박이 선반·창·계단을 피해서, 트로피는 오른쪽 선반에 — 11/24부터 사진 액자는 두 선반 사이·엽서 하나는 아래 선반 오른쪽 위, 선반 위는 화분 자리).
  // 내 방은 옮길 수 있다, 친구 방은 늘 이 자리.
  // 11/26 고해상도 방(가르시아 "고해상도 시안을 적용해줘" → 실제 [아지트]에): 방 = 받은 크림 방 원본(방 한 점 = 원본 4.5픽셀, 429×341점).
  //   바닥 칸은 그대로 101×86(앞쪽은 j 92까지 더 넓음), 두 벽 모서리 바닥 (217.6, 163.6)에서 오른쪽 벽 따라 i(한 칸 = 가로 2점·세로 0.8점),
  //   왼쪽 벽 따라 j(가로 2점·세로 0.87점). 벽 자리 (벽, u칸, 그림 가운데가 바닥 줄에서 h점 위)는 같은 뜻 — 벽이 높아져 h가 커졌다(천장 ≈ 157).
  //   붙박이 선반 둘은 오른쪽 벽 모서리 쪽, 창은 오른쪽 벽 u 44~89, 문은 왼쪽 벽 u 68~90(벽 소품은 왼쪽 벽 u 66까지).
  //   처음 자리는 고해상도 시안(azit-hd-sian.html — 다른 세션이 꾸민 꽉 찬 방) 배치를 바탕으로 다시 — 예전에 옮겨 둔 자리는 POS_V 3으로 새 처음 자리로.
  //   트로피는 새 그림에 벽 선반이 없어 붙박이 선반 위 소품으로, 가랜드는 모서리 대신 창 위에(azit.html GARLAND_AT).
  var ITEMS = [
    { id: 'frame', spr: 'frame_jelly_pink', face: 'L', wall: 'L', u: 54, h: 96, name: '등급 액자', need: { level: 1 } },
    { id: 'card0', spr: 'postcard_paw', face: 'L', wall: 'R', u: 40, h: 116, name: '엽서', need: { stamps: 1 } },
    { id: 'card1', spr: 'postcard_paw', face: 'L', wall: 'R', u: 40, h: 82, name: '엽서', need: { stamps: 2 } },   // 11/24 위 선반 위 벽 → 아래 선반 오른쪽 위(선반에 화분 올릴 자리)
    { id: 'bed', spr: 'cushion_cafe_beige', i: 84, j: 46, name: '가게 방석', need: { shop: 1 } },
    { id: 'trophy', spr: 'trophy', shelf: true, sh: 0, i: 16, j: 4, name: '트로피', need: { steady: 3 } },   // 11/26 고해상도 방 — 받은 새 그림엔 벽 선반이 없어 붙박이 선반 위에(자리가 차 있으면 선반 아래 바닥)
    { id: 'plant', spr: 'plant_pot', i: 2, j: 2, name: '화분', need: { walks: 10 } },
    { id: 'bowl', spr: 'feeder_wood_2bowl', i: 10, j: 48, name: '밥그릇', need: {} },
    { id: 'bone', spr: 'toy_bone', shelf: true, i: 50, j: 62, name: '뼈다귀', need: { walks: 1 } },
    { id: 'carrot', spr: 'carrot_plush', shelf: true, i: 62, j: 36, name: '당근 인형', need: { walks: 5 } },
    { id: 'ball', spr: 'ball_yellow', shelf: true, i: 52, j: 24, name: '공', need: {} },
    { id: 'flag', spr: 'flag_stand', i: 40, j: 3, name: '앰배서더 깃발', need: { level: 3 } },
    // ── 11/23 모델하우스 2단계 ──
    { id: 'rug', spr: 'rug_pattern', i: 70, j: 50, decal: true, name: '러그', need: { walks: 3 } },
    { id: 'photo', spr: 'frame_photo', face: 'L', wall: 'L', u: 26, h: 96, name: '우리 개 사진 액자', need: { pass: 1 } },   // 11/24 아래 선반 위 → 두 선반 사이
    { id: 'basket', spr: 'basket_blue_carrot', i: 40, j: 72, name: '장난감 바구니', need: { walks: 15 } },
    { id: 'house', spr: 'sofa_bed', i: 66, j: 10, name: '강아지 소파', need: { walks: 20 } },   // 11/23 새 방부터 집 대신 소파
    { id: 'shelf', spr: 'board_postcard', face: 'R', wall: 'L', u: 43, h: 56, name: '오늘의 한 장 게시판', need: { photos: 3 } },
    { id: 'poopbag', spr: 'bag_dispenser', face: 'L', wall: 'L', u: 12, h: 56, name: '응가 봉투 걸이', need: { poop: 10 } },   // 11/23 밤 받은 디스펜서 그림으로. 그림은 왼쪽 벽에 붙는 모양(벽 고리가 왼쪽 위, 몸통이 방 쪽으로 나옴) — face L(11/23 밤 가르시아 "풉백이 반대 방향으로 걸려")
    { id: 'keyhook', spr: 'keyhook_rail', face: 'R', wall: 'L', u: 28, h: 58, name: '키링 걸이', need: { keyring: 1 } },
    { id: 'lamp', spr: 'lamp_stand', i: 6, j: 22, name: '스탠드 조명', need: { steady: 1 } },
    { id: 'mat', spr: 'picnic_mat', i: 24, j: 72, decal: true, name: '피크닉 매트', need: { park: 1 } },
    { id: 'garland', spr: 'garland_R', corner: true, name: '가랜드', need: { steady5: 1 } },   // 11/26 고해상도 방 — 모서리 대신 오른쪽 벽 창 위에 벽 기울기대로(끌지 않음)
    // 단짝 액자(11/23 가르시아 "추천대로" — 교환 수 문턱 보상("단짝 3마리면 가랜드") 대신): 첫 단짝부터 걸리고 최근 단짝 도트 강아지가 들어간다.
    // 숫자를 채우는 보상이 아니라 방이 친구로 채워지는 것(11/23 결정 "방이 채워지는 것 자체가 보상"과 같은 결)
    { id: 'palframe', spr: 'frame_pal', face: 'R', wall: 'L', u: 40, h: 97, name: '단짝 액자', need: { pals: 1 } },
    // ── 11/23 밤 받은 그림 세 장(가르시아 "에셋을 추가해봤어 같은 느낌으로 실제로 추가해줘") — 29개 ──
    // stash: 생기면 [내 소품]에 들어오고 눌러야 방에 놓인다(소품이 51개라 한꺼번에 놓이면 방이 엉켜서). 자리는 눌렀을 때 처음 놓이는 곳.
    // both: 글자가 있는 벽 그림 — 왼쪽 벽에선 뒤집지 않고 왼쪽 벽용 그림(spr + '_L')을 쓴다(글씨가 거울처럼 되지 않게).
    // 생기는 조건은 Claude 제안(11/23 밤) — 모두 "한 것"(산책·발도장·가게 QR·응가 치움·꾸준함·오늘의 한 장 + 산책 기록으로 세는
    //   밤 산책 night · 겨울 산책 winter · 40분 넘는 산책 long · 킁킁 지수 4 이상 산책 sniff). 단짝 수는 조건으로 쓰지 않는다(11/23).
    // turn: 보는 방향을 바꿀 수 있는 팻말(11/27 가르시아 "팻말의 각도를 바꿀 수 있게 해 줘") — 정면 · 왼쪽(L) · 오른쪽(R). 뒤집지 않고 바닥 기울기대로 비스듬히(글씨가 거울처럼 되지 않게)
    // move: 바닥에 깔지만 끌어서 옮길 수 있는 깔개(11/24 가르시아 "배변패드 위치 변경되게") — 작아서 걷기·화면 밀기를 덜 가린다(러그·매트는 그대로)
    { id: 'pee_pad', spr: 'pee_pad', i: 98, j: 24, decal: true, move: true, name: '배변판', need: {}, stash: true },
    { id: 'bubble_visited', spr: 'bubble_visited', face: 'R', both: true, wall: 'L', u: 18, h: 124, name: '다녀감 말풍선', need: { walks: 2 }, stash: true },
    { id: 'sign_snack', spr: 'sign_snack', i: 14, j: 60, turn: true, name: '간식 내놔라 팻말', need: { walks: 4 }, stash: true },
    { id: 'board_refuse', spr: 'board_refuse', i: 30, j: 84, turn: true, name: '안가 안걸어 대자보', need: { walks: 6 }, stash: true },
    { id: 'toy_chicken', spr: 'toy_chicken', shelf: true, i: 64, j: 66, name: '삑삑이 닭 인형', need: { walks: 8 }, stash: true },
    { id: 'food_box', spr: 'food_box', i: 5, j: 36, name: '사료통', need: { walks: 12 }, stash: true },
    { id: 'grooming_basket', spr: 'grooming_basket', shelf: true, i: 18, j: 76, name: '미용 바구니', need: { walks: 22 }, stash: true },
    { id: 'bubble_interior', spr: 'bubble_interior', face: 'R', both: true, wall: 'L', u: 48, h: 116, name: '인테리어 맛집 말풍선', need: { walks: 25 }, stash: true },
    { id: 'pet_stairs', spr: 'pet_stairs', i: 22, j: 3, name: '강아지 계단', need: { walks: 30 }, stash: true },
    { id: 'panel_guestbook', spr: 'panel_guestbook', face: 'R', both: true, wall: 'L', u: 34, h: 118, name: '집사의 삶 판넬', need: { walks: 40 }, stash: true },
    { id: 'donut_cushion', spr: 'donut_cushion', i: 56, j: 44, name: '도넛 쿠션', need: { walks: 45 }, stash: true },
    { id: 'balloons', spr: 'balloons', i: 90, j: 30, name: '헬륨 풍선 다발', need: { walks: 50 }, stash: true },
    { id: 'cafe_cup', spr: 'cafe_cup', shelf: true, sh: 2, i: 80, j: 14, name: '동네 카페 컵', need: { shop: 2 }, stash: true },
    { id: 'stamp_regular', spr: 'stamp_regular', face: 'R', both: true, wall: 'R', u: 37, h: 44, name: '단골 인증 스탬프', need: { shop: 3 }, stash: true },
    { id: 'sign_meetup', spr: 'sign_meetup', i: 94, j: 40, turn: true, name: '산책길 조우 팻말', need: { stamps: 5 }, stash: true },
    { id: 'cone_barricade', spr: 'cone_barricade', i: 86, j: 64, name: '라바콘 바리케이드', need: { stamps: 8 }, stash: true },
    { id: 'parasol_set', spr: 'parasol_set', i: 76, j: 82, name: '편의점 파라솔', need: { stamps: 10 }, stash: true },
    { id: 'bubble_poop', spr: 'bubble_poop', face: 'R', both: true, wall: 'L', u: 24, h: 116, name: '오늘도 똥줍 말풍선', need: { poop: 5 }, stash: true },
    { id: 'trophy_poop', spr: 'trophy_poop', shelf: true, i: 46, j: 82, name: '황금 똥 트로피', need: { poop: 30 }, stash: true },
    { id: 'bubble_chihuahua', spr: 'bubble_chihuahua', face: 'R', both: true, wall: 'L', u: 38, h: 104, name: '참지않긔 말풍선', need: { steady: 2 }, stash: true },
    { id: 'leash_hook', spr: 'leash_hook', face: 'L', wall: 'L', u: 59, h: 60, name: '리드줄 걸이', need: { steady: 4 }, stash: true },
    { id: 'raincoat_rack', spr: 'raincoat_rack', i: 8, j: 70, name: '우비 옷걸이', need: { steady: 5 }, stash: true },
    { id: 'scroll_dogslife', spr: 'scroll_dogslife', face: 'R', both: true, wall: 'L', u: 64, h: 114, name: '개팔자 상팔자 족자', need: { level: 2 }, stash: true },
    { id: 'treat_jar', spr: 'treat_jar', shelf: true, sh: 3, i: 8, j: 44, name: '간식 통', need: { photos: 5 }, stash: true },
    { id: 'neon_chihuahua', spr: 'neon_chihuahua', face: 'R', wall: 'L', u: 10, h: 96, name: '치와와 네온사인', need: { night: 5 }, stash: true },
    { id: 'nosework_mat', spr: 'nosework_mat', i: 44, j: 44, name: '노즈워크 매트', need: { sniff: 5 }, stash: true },
    { id: 'stroller', spr: 'stroller', i: 92, j: 8, name: '강아지 유모차', need: { long: 5 }, stash: true },
    { id: 'cart_bungeoppang', spr: 'cart_bungeoppang', i: 76, j: 24, name: '붕어빵 포장마차', need: { winter: 5 }, stash: true },
    // ── 11/24 꽉 찬 방(가르시아 "이런 느낌의 배치 가능하겠냐? 꽉 차 있고 선반 위에도 화분과 풀들이 … 선반 사이에 액자도" → "앱에 넣어 줘") — 19개 ──
    // 받은 그림(11/23 밤 시트)에 있었는데 아직 소품이 아니던 것(분홍 가시 공은 두 장이 같은 그림이라 하나). 모두 stash.
    // shelf: 붙박이 선반(SHELVES)에 올릴 수 있는 작은 것 — 끌어서 선반 가까이 놓으면 선반 위로(당근 인형·카페 컵·황금 똥 트로피·간식 통도).
    //   11/24 가르시아 "선반에 올리려고 끌었는데 안 올라가" → 뼈다귀·공 다섯·닭 인형·미용 바구니·물그릇·파란 식기도(선반 폭에 맞는 작은 것)
    //   sh = 처음 놓이는 선반 자리 번호(그 자리가 차 있으면 i·j 바닥에).
    // 생기는 조건은 Claude 제안(11/24) — 모두 "한 것". 산책 횟수 사이사이(2·6·7·9·11 …)를 채워 걸을수록 방이 꾸준히 찬다.
    { id: 'daisy', spr: 'plant_daisy', shelf: true, sh: 1, i: 18, j: 64, name: '데이지 화분', need: { stamps: 3 }, stash: true },
    { id: 'cactus', spr: 'plant_cactus', shelf: true, sh: 4, i: 32, j: 4, name: '선인장 화분', need: { walks: 7 }, stash: true },
    { id: 'bonsai', spr: 'plant_cherry_blossom', shelf: true, sh: 0, i: 3, j: 58, name: '벚꽃 분재', need: { steady: 6 }, stash: true },
    // 걸이 화분은 모서리 왼쪽 천장에서(오른쪽은 오늘의 한 장 게시판 자리라) — 넝쿨이 위 선반 끝에 걸쳐 내려온다
    { id: 'hanging_plant', spr: 'plant_hanging', wall: 'L', u: 4, h: 124, name: '걸이 화분', need: { walks: 16 }, stash: true },
    { id: 'frame_dog', spr: 'frame_dog', face: 'R', wall: 'L', u: 10, h: 124, name: '강아지 초상화', need: { photos: 8 }, stash: true },
    { id: 'frame_gold', spr: 'frame_gold', face: 'R', wall: 'L', u: 60, h: 96, name: '금색 액자', need: { level: 2 }, stash: true },
    { id: 'banner', spr: 'banner_flag_blue', face: 'R', wall: 'L', u: 56, h: 118, name: '파란 깃발 배너', need: { level: 3 }, stash: true },
    { id: 'cushion_yellow', spr: 'cushion_yellow', i: 26, j: 30, name: '노란 방석', need: { walks: 9 }, stash: true },
    { id: 'cushion_blue', spr: 'cushion_blue', i: 40, j: 86, name: '파란 줄무늬 방석', need: { walks: 14 }, stash: true },
    { id: 'cushion_pink', spr: 'cushion_pink', i: 30, j: 40, name: '분홍 꽃 방석', need: { walks: 18 }, stash: true },
    { id: 'cushion_mint', spr: 'cushion_cafe_mint', i: 96, j: 48, name: '민트 뼈다귀 방석', need: { shop: 4 }, stash: true },
    { id: 'water_bowl', spr: 'water_bowl_blue', shelf: true, i: 18, j: 44, name: '물그릇', need: { walks: 2 }, stash: true },
    { id: 'feeder_blue', spr: 'feeder_blue_2bowl', shelf: true, i: 12, j: 78, name: '파란 식기', need: { walks: 24 }, stash: true },
    { id: 'basket_wicker', spr: 'basket_wicker_carrot', i: 88, j: 54, name: '당근 라탄 바구니', need: { walks: 27 }, stash: true },
    { id: 'rope', spr: 'toy_rope_blue', i: 76, j: 66, name: '밧줄 장난감', need: { walks: 6 }, stash: true },
    { id: 'ball_tennis', spr: 'ball_tennis', shelf: true, i: 70, j: 28, name: '테니스공', need: { walks: 11 }, stash: true },
    { id: 'ball_watermelon', spr: 'ball_watermelon', shelf: true, i: 94, j: 62, name: '수박 공', need: { walks: 13 }, stash: true },
    { id: 'ball_pastel', spr: 'ball_pastel', shelf: true, i: 84, j: 72, name: '무지개 공', need: { walks: 17 }, stash: true },
    { id: 'ball_spiky', spr: 'ball_spiky_pink_1', shelf: true, i: 60, j: 74, name: '분홍 가시 공', need: { walks: 21 }, stash: true }
  ];
  // 붙박이 선반 자리 — 방 그림에 있는 선반 둘(오른쪽 벽 모서리 쪽)의 윗면. shelf 소품을 올려놓는 곳, 한 자리에 하나.
  // x·y = 올린 그림의 아래 가운데(방 점), w = 올릴 수 있는 그림 폭, hmax = 키(아래 선반은 위 선반 밑까지 약 23점이라 낮은 것만).
  // 0~2 = 위 선반 왼쪽·가운데·오른쪽, 3~5 = 아래 선반. 11/26 고해상도 방(azit-hd-sian.html SHELF 선 위) — 예전 점 방의 선반 넷은 POS_V 3으로 버림.
  // 번호가 저장·모델하우스에 쓰이니 순서를 바꾸지 말 것(새 자리는 맨 뒤에)
  var SHELVES = [{ x: 239.8, y: 70.4, w: 26, hmax: 60 }, { x: 258.8, y: 78.2, w: 22, hmax: 60 }, { x: 275.2, y: 84.9, w: 16, hmax: 60 },
    { x: 239.8, y: 98.9, w: 22, hmax: 23 }, { x: 257.2, y: 106.0, w: 20, hmax: 23 }, { x: 274.6, y: 113.1, w: 16, hmax: 23 }];
  var POS_V = 3;   // 저장한 자리의 좌표 판 — 3 = 11/26 고해상도 방(429×341점), 2 = 11/23 새 방(394×220점). 다른 판 자리는 읽지 않고 새 처음 자리로
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
    var night = 0, winter = 0, long = 0, sniff = 0;                // 11/23 밤 새 소품 조건 — 5분 넘는 산책만 센다(산책 횟수와 같은 결)
    // 소품 조건의 산책 셈은 하루 2번까지(11/24 가르시아 — 하루에 여러 번 짧게 나가 빨리 모으지 않게, 사람마다 속도를 비슷하게).
    // 등급(산책 입문자~핑크 앰배서더)은 워킹패스와 같게 RewardRules 셈 그대로
    var perDay = {}, itemWalks = 0, DAY_CAP = 2;
    walks.slice().sort(function (a, b) { return String((a && a.startedAt) || '').localeCompare(String((b && b.startedAt) || '')); }).forEach(function (w) {
      if (!w || (Number(w.durationMin) || 0) < 5) return;
      var d = w.date || String(w.startedAt || '').slice(0, 10);
      perDay[d] = (perDay[d] || 0) + 1;
      if (perDay[d] <= DAY_CAP) { itemWalks++; w.__cnt = 1; } else w.__cnt = 0;
    });
    walks.forEach(function (w) {
      if (!w) return;
      if (w.photoKey) photos++;                                   // 오늘의 한 장을 남긴 산책
      var pp = Number(w.poop); if (pp === 1 || pp === 2) poop += pp;   // "응가 치웠나요" — 1번·2번 이상(2로 셈)
      var mins = Number(w.durationMin) || 0;
      var cnt = w.__cnt; delete w.__cnt;
      if (mins < 5 || !cnt) return;                               // 하루 3번째부터는 밤·겨울·긴·킁킁 산책에도 안 셈
      var at = w.startedAt ? new Date(w.startedAt) : null, hr = at && !isNaN(at) ? at.getHours() : -1;
      if (hr >= 20 || (hr >= 0 && hr < 5)) night++;                // 밤 산책(저녁 8시~새벽 5시에 나감)
      var mo = /^\d{4}-(\d{2})/.exec(w.date || ''), m = mo ? Number(mo[1]) : 0;
      if (m === 12 || m === 1 || m === 2) winter++;               // 겨울(12~2월) 산책
      if (mins >= 40) long++;                                     // 40분 넘게 걸은 산책
      if (Number(w.sniff) >= 4) sniff++;                          // 킁킁 지수 4 이상(실컷 맡음)
    });
    var park = ((RR && RR.PLACES) || []).filter(function (pl) { return pl.kind === 'park' && visited[pl.id]; }).length;
    var by = (st && st.byLevel) || [0, 0, 0];
    return {
      walks: Math.min(n, itemWalks),                              // 소품 조건용(하루 2번까지). 등급은 level(n)
      rankWalks: n,
      stamps: Object.keys(visited).length,
      shop: WalsonStore.visits().length,
      steady: (st && st.total) || 0,
      level: level, rank: rankName(level),
      pass: prof && prof.name ? 1 : 0, photos: photos, poop: poop, keyring: WalsonStore.keyring() ? 1 : 0, park: park,
      steady5: (by[1] || 0) + (by[2] || 0),                       // 5일·7일 도장을 받은 주
      pals: WalsonStore.dex().filter(function (e) { return e && e.pal; }).length,   // 도감 단짝 수(그 자리에서 서로 찍은 친구)
      night: night, winter: winter, long: long, sniff: sniff
    };
  }
  var NEED_KEYS = ['walks', 'level', 'stamps', 'shop', 'steady', 'pass', 'photos', 'poop', 'keyring', 'park', 'steady5', 'pals', 'night', 'winter', 'long', 'sniff'];
  // 발도장 조건은 지금 있는 장소 수까지만(11/24 — 장소가 5곳뿐이라 8·10곳 소품을 아무도 못 얻었음). 장소가 늘면 원래 수로 돌아간다
  function placeCount() {
    var RR = window.RewardRules;
    return ((RR && RR.PLACES) || []).filter(function (pl) { return !pl.pending; }).length;
  }
  function eff(need) {
    need = need || {};
    if (!need.stamps && !need.park) return need;
    var n = placeCount(), o = {};
    for (var k in need) o[k] = need[k];
    if (n > 0) { if (need.stamps) o.stamps = Math.min(need.stamps, n); return o; }
    // 11/24 전국판 — 발도장 장소가 없으면(다산동 세 곳을 화면에서 뺌) 발도장 N곳 → 40분 넘게 걷는 산책 N번, 공원 발도장 → 1번
    // (멀리 다녀오는 산책으로 대신 — 모두 "산 것"이 아니라 "한 것" 그대로)
    if (need.stamps) { o.long = Math.max(o.long || 0, need.stamps); delete o.stamps; }
    if (need.park) { o.long = Math.max(o.long || 0, 1); delete o.park; }
    return o;
  }
  function met(need, p) {
    need = eff(need);
    for (var k = 0; k < NEED_KEYS.length; k++) { var key = NEED_KEYS[k]; if (need[key] && !((p[key] || 0) >= need[key])) return false; }
    return true;
  }
  // 소품을 누르면 뜨는 글(모델하우스·친구 방) — how: 어떻게 생기는지, mine: 나는 어떤지
  function howText(need, p) {
    need = eff(need);
    var how;
    if (need.level) { var rn = rankName(need.level), c = rn.charCodeAt(rn.length - 1); how = rn + ((c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? '이' : '가') + ' 되면 생겨요'; }
    else if (need.walks) how = '산책 ' + need.walks + '번 하면 생겨요';
    else if (need.stamps) how = '발도장 ' + need.stamps + '곳 받으면 생겨요';
    else if (need.shop) how = need.shop > 1 ? '가게 QR을 ' + need.shop + '번 찍으면 생겨요' : '가게 QR을 찍으면 생겨요';
    else if (need.steady) how = '꾸준함 도장 ' + need.steady + '주 받으면 생겨요';
    else if (need.pass) how = '워킹패스를 만들면 생겨요';
    else if (need.photos) how = '오늘의 한 장을 ' + need.photos + '장 남기면 생겨요';
    else if (need.poop) how = '산책 끝에 응가를 ' + need.poop + '번 치우면 생겨요';
    else if (need.keyring) how = '키링을 받으면 생겨요';
    else if (need.park) how = '공원 발도장을 받으면 생겨요';
    else if (need.steady5) how = '한 주에 5일 산책하면 생겨요';
    else if (need.pals) how = '단짝이 생기면 걸려요 — 최근 단짝 강아지가 들어가요';
    else if (need.night) how = '밤 산책(저녁 8시~새벽 5시)을 ' + need.night + '번 하면 생겨요';
    else if (need.winter) how = '겨울(12~2월)에 ' + need.winter + '번 산책하면 생겨요';
    else if (need.long) how = '40분 넘게 걷는 산책을 ' + need.long + '번 하면 생겨요';
    else if (need.sniff) how = '킁킁 지수 4 이상인 산책을 ' + need.sniff + '번 하면 생겨요';
    else how = '처음부터 있어요';
    var once = need.shop === 1 || need.pass || need.keyring || need.park || need.pals;   // 한 번 하면 되는 것은 "아직 없어요"
    return { how: how, mine: met(need, p) ? '나도 있어요' : (once ? '나는 아직 없어요' : '나는 ' + needText(need, p)) };
  }
  // 소품 칸 아래 작은 글씨 — 생겼으면 어떻게 생겼는지, 아니면 얼마나 남았는지
  function needText(need, p) {
    need = eff(need);
    var ok = met(need, p);
    if (need.level) return ok ? rankName(need.level) : '산책 ' + (rankMin(need.level) - (p.rankWalks != null ? p.rankWalks : p.walks)) + '번 더';
    if (need.walks) return ok ? (need.walks === 1 ? '첫 산책' : '산책 ' + need.walks + '번') : '산책 ' + (need.walks - p.walks) + '번 더';
    if (need.stamps) return ok ? '발도장 ' + need.stamps + '곳' : '발도장 ' + (need.stamps - p.stamps) + '곳 더';
    if (need.shop) return need.shop > 1 ? (ok ? '가게 QR ' + need.shop + '번' : '가게 QR ' + (need.shop - (p.shop || 0)) + '번 더') : (ok ? '가게 QR' : '가게 QR 찍으면');
    if (need.steady) return ok ? '꾸준함 ' + need.steady + '주' : '꾸준함 도장 ' + (need.steady - p.steady) + '주 더';
    if (need.pass) return ok ? '워킹패스' : '워킹패스 만들면';
    if (need.photos) return ok ? '오늘의 한 장 ' + need.photos + '장' : '오늘의 한 장 ' + (need.photos - (p.photos || 0)) + '장 더';
    if (need.poop) return ok ? '응가 치움 ' + need.poop + '번' : '응가 치움 ' + (need.poop - (p.poop || 0)) + '번 더';
    if (need.keyring) return ok ? '키링' : '키링 받으면';
    if (need.park) return ok ? '공원 발도장' : '공원 발도장 받으면';
    if (need.steady5) return ok ? '꾸준함 5일' : '한 주 5일 산책하면';
    if (need.pals) return ok ? '단짝' : '단짝이 생기면';
    if (need.night) return ok ? '밤 산책 ' + need.night + '번' : '밤 산책 ' + (need.night - (p.night || 0)) + '번 더';
    if (need.winter) return ok ? '겨울 산책 ' + need.winter + '번' : '겨울 산책 ' + (need.winter - (p.winter || 0)) + '번 더';
    if (need.long) return ok ? '긴 산책 ' + need.long + '번' : '40분 산책 ' + (need.long - (p.long || 0)) + '번 더';
    if (need.sniff) return ok ? '킁킁 산책 ' + need.sniff + '번' : '킁킁 산책 ' + (need.sniff - (p.sniff || 0)) + '번 더';
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
  //    벽지: 핑크 앰배서더 = 분홍 방(11/24부터 theme 'pink' — 기본 jelly는 크림 방), 밤산책 라운지 = 밤 블랙 핑크 방, 공원 피크닉 = 라일락 방.
  function roomPos(ids, over) {
    var pos = {};
    ids.forEach(function (id) {
      var it = byId(ITEMS, id), o = over && over[id];
      if (o) pos[id] = o;
      else if (it.corner) pos[id] = { corner: 1 };
      else if (it.wall) pos[id] = { wall: it.wall, u: it.u, h: it.h };
      else if (it.sh != null) pos[id] = { shelf: it.sh };   // 선반 위(11/24)
      else pos[id] = { i: it.i, j: it.j };
    });
    return pos;
  }
  var SHOWROOMS = [
    { id: 'pink', name: '핑크 앰배서더의 방', owner: '왈슨', dog: 'chihuahua', theme: 'pink', acc: 'crown', level: 3,
      line: '산책 30번이면 이렇게 돼요',   // 등급·꾸준함 — 선반 위 트로피·소파 옆 깃발, 왼쪽 벽엔 우리 개 사진·단짝·등급 액자, 창 위 가랜드
      dogs: { host: [42, 36], guest: [60, 32] },
      pos: roomPos(['garland', 'frame', 'card0', 'photo', 'card1', 'palframe', 'rug', 'trophy', 'flag', 'bed', 'bowl', 'bone', 'plant', 'house', 'ball', 'carrot'],
        { flag: { i: 86, j: 4 } }) },
    { id: 'night', name: '밤산책 라운지', owner: '왈슨', dog: 'chihuahua', theme: 'night', acc: 'cap', level: 2,
      line: '꾸준히 걸으면 이렇게 돼요',   // 꾸준함 — 창가 방석 옆 스탠드 조명·러그, 오늘의 한 장 게시판, 키링 걸이
      dogs: { host: [36, 40], guest: [60, 36] },   // 러그 앞뒤로 나란히(창가 방석·스탠드가 가려지지 않게)
      pos: roomPos(['garland', 'frame', 'shelf', 'keyhook', 'photo', 'rug', 'trophy', 'lamp', 'plant', 'bed', 'bowl', 'basket', 'ball'],
        { bed: { i: 66, j: 14 }, lamp: { i: 86, j: 8 } }) },
    { id: 'picnic', name: '공원 피크닉 방', owner: '왈슨', dog: 'chihuahua', theme: 'lilac', acc: 'ribbon', level: 1,
      line: '오래 걷는 산책을 모으면 이렇게 돼요',   // 11/24 전국판 — 예전 "공원 발도장을 모으면"   // 공원 — 피크닉 매트에 바구니·공·당근, 벽엔 엽서, 응가 봉투 걸이
      dogs: { host: [34, 30], guest: [46, 24] },   // 매트 뒤에(앞쪽 매트 위 바구니·공이 가려지지 않게)
      pos: roomPos(['garland', 'card0', 'card1', 'photo', 'poopbag', 'palframe', 'mat', 'house', 'bowl', 'bone', 'basket', 'ball', 'carrot', 'plant'],
        { mat: { i: 56, j: 58 }, basket: { i: 52, j: 66 }, ball: { i: 64, j: 62 }, carrot: { i: 60, j: 52 }, bone: { i: 72, j: 50 } }) },
    // 11/23 밤 새 소품을 보여 주는 두 채 — 붕어빵 포장마차·네온·풍선·말풍선(B급), 생활용품(살림)
    { id: 'meme', name: '왈슨의 B급 방', owner: '왈슨', dog: 'chihuahua', theme: 'jelly', acc: 'crown', level: 2,
      line: '웃긴 소품을 모으면 이렇게 돼요',   // 족자·말풍선·네온, 창가 붕어빵 포장마차, 팻말·대자보, 노즈워크 매트·삑삑이
      dogs: { host: [46, 36], guest: [58, 44] },
      pos: roomPos(['garland', 'scroll_dogslife', 'bubble_visited', 'neon_chihuahua', 'bubble_interior', 'balloons', 'cart_bungeoppang',
        'trophy_poop', 'sign_snack', 'toy_chicken', 'cone_barricade', 'cafe_cup', 'nosework_mat', 'board_refuse'],
        { balloons: { i: 6, j: 8 }, cart_bungeoppang: { i: 66, j: 14 }, trophy_poop: { shelf: 0 } }) },
    { id: 'home', name: '집사 살림 방', owner: '왈슨', dog: 'chihuahua', theme: 'lilac', acc: 'ribbon', level: 1,
      line: '꾸준히 걸으면 살림이 늘어요',   // 리드줄 걸이·봉투 디스펜서·우비 옷걸이(문 쪽), 소파 옆 계단, 사료통·간식 통·밥그릇
      dogs: { host: [34, 32], guest: [46, 28] },
      pos: roomPos(['leash_hook', 'poopbag', 'panel_guestbook', 'shelf', 'house', 'pet_stairs', 'stroller', 'raincoat_rack', 'food_box',
        'treat_jar', 'bowl', 'grooming_basket', 'donut_cushion', 'pee_pad', 'plant'],
        { pet_stairs: { i: 44, j: 4 } }) },
    // 11/24 꽉 찬 방(가르시아 받은 그림 "이런 느낌의 배치") — 선반마다 화분, 액자 셋, 걸이 화분, 바닥 가득. 11/26 고해상도 방에선 시안(azit-hd-sian.html) 배치 그대로에 가깝게
    { id: 'full', name: '꽉 찬 아지트', owner: '왈슨', dog: 'chihuahua', theme: 'jelly', acc: 'crown', level: 3,
      line: '오래 걸으면 이렇게 꽉 차요',   // 위 선반 트로피·데이지, 아래 선반 선인장, 왼쪽 벽 액자 셋·걸이 화분 · 소파·방석 셋·식기 둘·바구니 둘·공 넷
      dogs: { host: [40, 34], guest: [58, 30] },   // 러그 위·앞(소파·방석이 가려지지 않게)
      pos: roomPos(['frame_dog', 'frame_gold', 'daisy', 'cactus', 'frame', 'bonsai', 'hanging_plant', 'trophy', 'banner',
        'house', 'plant', 'cushion_yellow', 'bowl', 'food_box', 'feeder_blue', 'water_bowl', 'basket', 'basket_wicker',
        'cushion_blue', 'cushion_pink', 'bone', 'rope', 'ball_tennis', 'ball_watermelon', 'ball_spiky', 'ball_pastel', 'rug'],
        { frame_gold: { wall: 'L', u: 26, h: 96 }, frame_dog: { wall: 'L', u: 40, h: 97 }, bonsai: { i: 3, j: 58 } }) }
  ];
  // 방마다 놓은 소품 = pos에 자리가 있는 것(소품 순서대로)
  SHOWROOMS.forEach(function (s) { s.items = ITEMS.filter(function (it) { return s.pos[it.id]; }).map(function (it) { return it.id; }); });
  function copyPosOf(pos) { var o = {}; Object.keys(pos).forEach(function (k) { var p = pos[k], c = {}; for (var f in p) c[f] = p[f]; o[k] = c; }); return o; }
  // 샘플 모드의 내 방(공원 시연·처음 온 사람) — 샘플 강아지 왈슨이 지금 가진 소품을 1번 방과 같은 손 배치로. 벽지는 모델하우스와 다르게 라일락.
  // 1번 방에 없는 소품은 빼 둔 걸로(샘플 방이 흐트러지지 않게 — [내 소품]에서 넣을 수 있다).
  // 샘플을 끄면 원래대로(sample-data.js가 petwalk_azit을 보관했다 되돌린다). sample: true = 이 상태가 샘플용이라는 표시
  var SAMPLE_V = 7;   // 샘플 방 모양 번호 — 7 = 고해상도 방(11/26) — 소품·배치가 바뀌면 올린다(예전 샘플 방은 새로 만든다). 3 = 단짝 액자 더함(11/23), 4 = 새 방(11/23 밤), 5 = 새 소품 28개(11/23 밤), 6 = 꽉 찬 방 소품 19개·사진 액자 자리(11/24)
  function sampleState() {
    var room = SHOWROOMS[0];
    var all = ITEMS.map(function (it) { return it.id; }).concat(ACCS.map(function (a) { return a.id; }));
    return { sample: true, sampleV: SAMPLE_V, dog: 'chihuahua', dogAuto: false, dogPhoto: false, photoDog: null, theme: 'lilac', acc: 'crown',
      hidden: ITEMS.filter(function (it) { return !room.pos[it.id]; }).map(function (it) { return it.id; }),
      pos: copyPosOf(room.pos), seen: all, mood: '산책 가고 싶어', moodDay: todayKey() };
  }

  // ── 내 방 상태(petwalk_azit) ──
  // {dog, dogAuto(우리가 골라 준 것 — 사용자가 고르면 false), theme, acc, hidden[빼 둔 소품], pos{소품: 옮긴 자리}, seen[본 적 있는 소품], mood, moodDay, sample,
  //  dogPhoto(우리 개 = 워킹패스 사진으로 만든 도트), photoDog{sig(만든 사진 표), png(도트 그림 — 1칸 = 1점)}}
  // 워킹패스 사진 도트(11/24 가르시아 "나의 워킹패스를 가져와서 고를 수 있게")는 이 휴대폰 방에서만 그린다 — 방 모습 QR엔 dog(닮은 도트 강아지)만,
  // 서버 백업엔 빼고 보낸다(cloud-backup.js — 사진처럼)
  // 샘플 모드인데 샘플용 상태가 아니면(샘플을 막 켰거나, 이 규칙 전에 샘플로 연 아지트) 샘플 방으로 시작한다
  function cleanPos(raw) {
    var pos = {};
    if (raw && typeof raw === 'object') Object.keys(raw).forEach(function (id) {
      var p = raw[id], it = byId(ITEMS, id);
      if (!it || !p || typeof p !== 'object' || it.corner) return;   // 모서리 가랜드는 자리가 없다
      if (it.wall && (p.wall === 'R' || p.wall === 'L') && isFinite(p.u) && isFinite(p.h)) pos[id] = { wall: p.wall, u: +p.u, h: +p.h };
      else if (it.shelf && p.shelf != null && SHELVES[p.shelf]) pos[id] = { shelf: Number(p.shelf) };   // 선반 위(11/24)
      else if (!it.wall && isFinite(p.i) && isFinite(p.j)) pos[id] = { i: +p.i, j: +p.j };
    });
    return pos;
  }
  function cleanTurn(raw) {   // 팻말 방향 { id: 'L' | 'R' } — 정면은 적지 않는다
    var t = {};
    if (raw && typeof raw === 'object') Object.keys(raw).forEach(function (id) { var it = byId(ITEMS, id); if (it && it.turn && (raw[id] === 'L' || raw[id] === 'R')) t[id] = raw[id]; });
    return t;
  }
  function cleanHidden(raw) { return Array.isArray(raw) ? raw.filter(function (id) { return !!byId(ITEMS, id); }) : []; }
  function cleanAcc(a) { return (a === '' || byId(ACCS, a)) ? a : 'ribbon'; }
  // 워킹패스 사진 도트 — 작은 PNG(점 그림이라 몇 KB)만 받는다. 모양이 이상하면 없는 것으로
  function cleanPhotoDog(p) {
    return p && typeof p === 'object' && typeof p.sig === 'string' && typeof p.png === 'string' &&
      p.png.indexOf('data:image/png;base64,') === 0 && p.png.length < 80000 ? { sig: p.sig.slice(0, 40), png: p.png } : null;
  }
  function loadState() {
    var s = WalsonStore.object(KEY) || {};
    if (WalsonStore.sampleOn && WalsonStore.sampleOn() && (s.sample !== true || s.sampleV !== SAMPLE_V)) return sampleState();
    var newPos = s.posV === POS_V;   // 예전 방(8×8칸) 자리·되돌리기는 새 방 좌표가 아니라서 읽지 않는다(새 처음 자리로)
    var u = newPos && s.undo && typeof s.undo === 'object' ? s.undo : null;
    return {
      dog: byId(DOGS, s.dog) ? s.dog : null,
      dogAuto: s.dogAuto !== false,
      photoDog: cleanPhotoDog(s.photoDog),
      dogPhoto: s.dogPhoto === true && !!cleanPhotoDog(s.photoDog),
      theme: THEMES.indexOf(s.theme) >= 0 ? s.theme : 'jelly',
      acc: cleanAcc(s.acc),
      hidden: cleanHidden(s.hidden),
      pos: newPos ? cleanPos(s.pos) : {},
      turn: cleanTurn(s.turn),   // 팻말 보는 방향(11/27)
      seen: Array.isArray(s.seen) ? s.seen.filter(function (id) { return !!byId(ITEMS, id) || !!byId(ACCS, id); }) : null,   // null = 아지트를 처음 연다
      mood: (s.moodDay === todayKey() && MOODS.indexOf(s.mood) >= 0) ? s.mood : '',   // 오늘 기분은 그날만
      moodDay: s.moodDay === todayKey() ? s.moodDay : '',
      sample: s.sample === true, sampleV: s.sampleV,
      lampOn: s.lampOn === true,   // 스탠드 조명 켬(11/24 — 톡 누르면 켜고 끔)
      // [이 방처럼 놓기] 전 모습(되돌리기용, 11/23) — 벽지·머리 장식·자리·빼 둔 소품
      undo: u ? { theme: THEMES.indexOf(u.theme) >= 0 ? u.theme : 'jelly', acc: cleanAcc(u.acc), pos: cleanPos(u.pos), hidden: cleanHidden(u.hidden),
        from: typeof u.from === 'string' ? u.from.slice(0, 20) : '' } : null
    };
  }
  function saveState(st) {
    var o = { dog: st.dog, dogAuto: !!st.dogAuto, theme: st.theme, acc: st.acc, hidden: st.hidden, pos: st.pos, posV: POS_V, seen: st.seen || [], mood: st.mood, moodDay: st.moodDay };
    if (st.lampOn) o.lampOn = true;
    if (st.turn && Object.keys(st.turn).length) o.turn = st.turn;
    if (st.sample) { o.sample = true; o.sampleV = st.sampleV; }
    if (st.undo) o.undo = st.undo;
    if (st.photoDog) { o.photoDog = st.photoDog; if (st.dogPhoto) o.dogPhoto = true; }
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

  // ── 방 모습 몇 글자(화면 QR의 r) ── [강아지 번호][벽지 j·l·n][머리 장식 0~][산책 등급 0~3][놓은 소품 16진수(1~32번)][.33~64번][.65~96번]
  // 예: "0j1" + "1" + "2c4", 33번째부터 놓았으면 "…2c4.3", 65번째부터면 "…2c4.0.1". 받은 쪽은 모르는 번호·자리는 버리고 읽는다(나중에 강아지·소품이 늘어도 예전 앱이 깨지지 않게).
  // 11/23 밤 소품이 50개가 되어 뒤에 ".16진수"를 붙였다(그 전 앱은 이 글자가 붙은 방을 "아직 방 구경 전"으로 본다 — 새로 열면 바뀜).
  // 11/24 꽉 찬 방 소품으로 69개 — 한 칸 더(".16진수" 둘째). 11/23 밤 앱은 둘째 칸이 붙은 방만 "아직 방 구경 전"으로 본다.
  function snapshot(st, p, color) {
    var w = [0, 0, 0];
    placedItems(st, p).forEach(function (id) {
      var k = indexOf(ITEMS, id);
      if (k < 0 || k >= 96) return;
      w[k >> 5] = (w[k >> 5] | (1 << (k & 31))) >>> 0;
    });
    var di = indexOf(DOGS, myDog(st, color)), ai = indexOf(ACCS, accOn(st, p));
    var tail = w[2] ? '.' + w[1].toString(16) + '.' + w[2].toString(16) : w[1] ? '.' + w[1].toString(16) : '';
    return (di < 0 ? 0 : di).toString(36) + st.theme.charAt(0) + (ai + 1).toString(36) + String(Math.max(0, Math.min(3, p.level))) +
      w[0].toString(16) + tail;
  }
  function mySnapshot(color) { try { return snapshot(loadState(), progress(), color); } catch (e) { return null; } }
  // 남이 만든 QR일 수 있으니 모양을 꼼꼼히 — 맞으면 {dog(모르면 null), theme, acc, level, items[]}, 아니면 null
  // 소품 자리는 16진수 8글자(소품 32개)까지 읽는다 — 소품을 늘리기 전에 읽는 쪽부터 넓혀 둔 것(11/23, 처음엔 4글자 = 16개)
  function parseRoom(r) {
    var m = /^([0-9a-z])([a-z])([0-9a-z])([0-9])([0-9a-f]{1,8})(?:\.([0-9a-f]{1,8}))?(?:\.([0-9a-f]{1,8}))?$/.exec(typeof r === 'string' ? r : '');
    if (!m) return null;
    var d = DOGS[parseInt(m[1], 36)], th = THEMES.filter(function (t) { return t.charAt(0) === m[2]; })[0] || 'jelly';
    var a = ACCS[parseInt(m[3], 36) - 1], w = [m[5], m[6], m[7]].map(function (x) { return x ? parseInt(x, 16) >>> 0 : 0; });
    return {
      dog: d ? d.id : null, theme: th, acc: a ? a.id : '', level: Math.min(3, parseInt(m[4], 10)),
      items: ITEMS.filter(function (it, i) { return i < 96 && (w[i >> 5] >>> (i & 31)) & 1; }).map(function (it) { return it.id; })
    };
  }

  window.WalsonAzit = {
    KEY: KEY, DOGS: DOGS, ITEMS: ITEMS, ACCS: ACCS, THEMES: THEMES, MOODS: MOODS, SHELVES: SHELVES,
    byId: byId, progress: progress, met: met, needText: needText, howText: howText, rankName: rankName,
    SHOWROOMS: SHOWROOMS, sampleState: sampleState, copyRoom: copyRoom, undoCopy: undoCopy,
    guessDog: guessDog, dogFromBreed: dogFromBreed, myDog: myDog,
    loadState: loadState, saveState: saveState, unlockedItems: unlockedItems, placedItems: placedItems, accOn: accOn,
    snapshot: snapshot, mySnapshot: mySnapshot, parseRoom: parseRoom, todayKey: todayKey,
    dogSrc: function (id) { return 'icons/dot-dogs/' + id + '.webp?v=5'; },
    dogPxSrc: function (id) { return 'icons/dot-dogs/px/' + id + '.png?v=5'; }   // 원래 점 격자 그대로(점 하나 = 한 픽셀) — _dev/dot-dog-native.py
  };
})();
