// 산책 영수증에 들어갈 것 셈(2026-11-23, walk-history.html에서 뺌) — 전역 window.WalsonReceiptInfo.
// [기록] 그날의 일기 창(walk-history.html)과 [오늘] 오늘 영수증 미리 보기(index.html)가 같은 그림을 그리게 같이 쓴다.
//   - NOTES: 특이 사항 본보기 문구(꾸미기 [특이 사항] 탭) · defaultNote: 고르지 않았을 때 그날 문구
//   - infoFor: 산책마다 발도장(이번에 찍은 곳·처음 찍은 곳 수)·꾸준함(그 주 며칠째·도장 받은 산책)·산책 열쇠·들른 장소
//   - loadChoices: 산책마다 고른 꾸미기(walson_receipts — 특이 사항·사진·자리·확대·글자) · noteText · dataFor(WalkReceipt.draw에 넘기는 값)
// 숫자 규칙은 reward-rules.js(RewardRules)와 같다. 이 휴대폰 기록만 쓰고 어디로도 보내지 않는다.
// 영수증 번호 = clean()으로 거른 기록 순서 + 1 — 두 화면이 같은 걸 쓴다.
(function () {
  var CHOICE_KEY = 'walson_receipts';     // 산책별로 고른 것 { 산책 열쇠: { note, custom, photo, pos(위아래 0~100), px(좌우 0~100), zoom, stickers } } — 이 휴대폰에만

  // 특이 사항 — 가르시아가 쓴 관찰(card-shared.js 스킬·특성)과 산책 유형(walk-type.html)을 영수증 말투로 줄인 것.
  // 관찰은 그대로 두고 말투만 바꿨다(게임식 수치·확률 표기는 뺌). 꾸미기의 [특이 사항] 탭에 본보기로 보여 준다.
  // g: 상황 묶음(11/18 가르시아 "그것도 나눠줘") — 꾸미기에서 묶음 탭(킁킁·간식·걷기·만남·응가·특징)으로 나눠 보여 준다.
  //    탭 순서는 이 목록 순서. 기본 문구(defaultNote)·저장값은 id로 찾으니 순서를 바꿔도 된다
  var NOTES = [
    { id: 'pole',    g: '킁킁', text: '전봇대마다 냄새 정독함' },            // 산책 유형 · 킁킁 탐정형
    { id: 'grass',   g: '킁킁', text: '풀숲 앞에서 3분 정차 (냄새 조사)' },   // 스킬 · 3초 멈칫 냄새 탐정
    { id: 'bench',   g: '킁킁', text: '벤치에서 바람 냄새 감상' },            // 산책 유형 · 감성 산책러형
    { id: 'shop',    g: '간식', text: '간식집 앞 정차 (보호자 설득까지)' },    // 스킬 · 수제간식점 앞 얼음 놀이
    { id: 'treat',   g: '간식', text: '한 블록마다 간식 요구' },              // 산책 유형 · 간식 협상가형
    { id: 'other',   g: '간식', text: '남의 개 간식을 더 오래 쳐다봄' },        // 특성 · 남의 떡이 더 커 보임
    { id: 'pull',    g: '걷기', text: '목줄 당기며 직진함' },                // 산책 유형 · 직진 마라토너형
    { id: 'home',    g: '걷기', text: '나오자마자 집에 가자고 함' },          // 산책 유형 · 집돌이 귀가형
    { id: 'hug',     g: '걷기', text: '5분 만에 안아 달라고 함' },           // 특성 · 산책 5분 후 안아라 신호
    { id: 'rain',    g: '걷기', text: '현관 앞 빗물 보고 안아 달라 함' },       // 특성 · 비 오면 발에 물 묻히기 싫음
    { id: 'hello',   g: '만남', text: '만나는 개마다 인사함' },              // 산책 유형 · 동네 이장님형
    { id: 'bike',    g: '만남', text: '배달 오토바이 경보 발령' },             // 스킬 · 배달 오토바이 레이더
    { id: 'outside', g: '만남', text: '밖에서만 순둥이 (집에선 왕)' },         // 특성 · 외부인 한정 순둥이
    { id: 'eye',     g: '응가', text: '응가하며 보호자와 눈 맞춤' },           // 스킬 · 천사표 얼굴로 배변 포즈
    // 응가 날 문구(2026-11-17 가르시아 "그렇게 진행해줘" — 다른 기획팀장 검토 C안). 행동 드립만 — 변 상태(색·모양) 드립은 안 쓴다
    { id: 'bag',     g: '응가', text: '비닐봉투 값 제대로 뽑음' },
    { id: 'kick',    g: '응가', text: '볼일 뒤 뒷발 차기 세리머니' },
    { id: 'ears',    g: '특징', text: "'산책'은 듣고 '기다려'는 못 들음" },    // 특성 · 선택적 귓등 듣기
    { id: 'cloth',   g: '특징', text: '새 옷 입고 1초 정지' },                // 특성 · 새 옷 착용 시 1초 멘붕
    { id: 'paw',     g: '특징', text: '발바닥 옥수수 칩 냄새 진동' }          // 특성 · 발바닥 고소함 MAX
  ];
  function noteById(id) { for (var i = 0; i < NOTES.length; i++) if (NOTES[i].id === id) return NOTES[i].text; return ''; }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function dk(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function parseDay(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function mondayKey(s) { var d = parseDay(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dk(d); }

  // 영수증에 쓰는 기록 — 날짜가 없거나 이상한 것은 뺀다(영수증 번호가 두 화면에서 같게)
  function clean(walks) {
    return (walks || []).filter(function (w) { return w && typeof w.date === 'string' && w.date.length >= 10; });
  }

  // 특이 사항 기본값 — 날마다 다르게(같은 문구만 나오면 금방 질린다). 산책 시간·답과 어긋나지 않게 고른다(11/16):
  // 킁킁을 많이 했으면 냄새 쪽, 짧았거나 "조금 아쉬워요"면 일찍 들어가려는 쪽, 충분히 걸었으면 그 두 문구(5분 만에 안아·나오자마자 집에)는 빼고.
  // 날씨·옷처럼 그날 일을 모르는 문구(빗물·새 옷)는 기본값으로 안 쓴다 — 보호자가 고를 때만.
  function defaultNote(walks, i) {
    var w = walks[i], min = w.durationMin || 0;
    // 응가를 적은 날은 세 번에 한 번꼴로 응가 문구(11/17, 다른 기획팀장 검토 C안) — 날마다 응가 드립이면 질린다.
    // 가르시아가 쓴 '응가하며 보호자와 눈 맞춤'(천사표 배변 포즈)부터 돌아가며. 그 전엔 응가했는지 몰라 기본값으로 안 썼다.
    if (w.poop >= 1 && i % 3 === 0) return ['eye', 'bag', 'kick'][Math.floor(i / 3) % 3];
    if (w.sniff >= 4) return (i % 2) ? 'grass' : 'pole';
    var pool = (min < 15 || w.feel === 'short')
      ? ['hug', 'home', 'ears', 'shop']
      : ['pole', 'grass', 'shop', 'ears', 'hello', 'pull', 'treat', 'bench'];
    return pool[(i * 7 + 3) % pool.length];
  }

  // 산책마다 영수증에 들어갈 것 미리 세기(기록 순서 = 영수증 번호)
  function infoFor(walks, R) {
    var info = [];
    var places = (R && R.PLACES) ? R.PLACES.filter(function (p) { return !p.pending; }) : [];
    var minM = (R && R.STEADY_MIN_MINUTES) || 5;
    var steps = (R && R.STEADY_STEPS) || [3, 5, 7];
    // 꾸준함 도장: 주(월~일)마다 5분 넘게 산책한 날 — reward-rules.js steady()와 같은 기준
    var weekDays = {}, firstOfDay = {};
    walks.forEach(function (w, i) {
      if (!(w.durationMin >= minM)) return;
      (weekDays[mondayKey(w.date)] || (weekDays[mondayKey(w.date)] = {}))[w.date] = true;
      if (firstOfDay[w.date] === undefined) firstOfDay[w.date] = i;
    });
    var visited = {}, nthOfDay = {};
    walks.forEach(function (w, i) {
      // 발도장: 길 기록 산책만, 장소 이름은 영수증에 안 넣고 개수만 — reward-rules.js computeProgress()와 같은 판정.
      // 들른 장소(places)는 [기록] 결산 영수증 그림에서 '이달 가장 많이 간 곳'을 셀 때만 쓴다
      var stamps = null, inPlaces = [];
      if (w.rewardEligible !== false && w.mode !== 'time' && places.length) {
        var pts = w.stampRoute || w.route || [], hit = 0, fresh = 0;
        places.forEach(function (pl) {
          var inside = pts.some(function (p) { return R.distanceKm(p, pl.center) <= pl.radiusKm; });
          if (!inside) return;
          hit++; inPlaces.push(pl);
          if (!visited[pl.id]) { fresh++; visited[pl.id] = true; }
        });
        stamps = { hit: hit, fresh: fresh };
      }
      var set = weekDays[mondayKey(w.date)] || {};
      var days = Object.keys(set).filter(function (d) { return d <= w.date; }).length;
      var got = firstOfDay[w.date] === i && steps.indexOf(days) >= 0;
      // 산책을 가리키는 열쇠 — 길 기록 산책은 끝난 시각, 시간만 잰 산책은 날짜 + 그날 몇 번째
      var n = nthOfDay[w.date] = (nthOfDay[w.date] || 0) + 1;
      var key = w.endedAt ? 'e' + w.endedAt : 'd' + w.date + '-' + n;
      info.push({ stamps: stamps, steady: { days: days, got: got }, key: key, places: inPlaces });
    });
    return info;
  }

  // 고른 꾸미기 — 샘플을 보는 중에는 쓰지도 읽지도 않는다(샘플을 끄면 산책 기록이 바뀌어서)
  function isSample() { try { return localStorage.getItem('petwalk_sample_mode') === '1'; } catch (e) { return false; } }
  function loadChoices() {
    if (isSample()) return {};
    try { var v = JSON.parse(localStorage.getItem(CHOICE_KEY)); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; }
  }

  // 영수증에 찍힐 특이 사항 — 고른 것(c.note: 'none' 없음 · 'custom' 직접 쓴 글 · 문구 id) → 없으면 그날 기본 문구
  function noteText(walks, i, c) {
    c = c || {};
    if (c.note === 'none') return '';
    if (c.note === 'custom' && c.custom && c.custom.trim()) return c.custom.trim();
    return noteById(c.note && c.note !== 'custom' ? c.note : defaultNote(walks, i));
  }

  // WalkReceipt.draw에 넘기는 값
  function dataFor(walks, info, i, c, profile, R) {
    var w = walks[i];
    return {
      no: i + 1, date: w.date, demo: !!w.demo, mode: w.mode === 'time' ? 'time' : 'gps', after: w.logged === 'after',
      durationMin: w.durationMin || 0, distanceKm: w.distanceKm || 0,
      feel: w.feel, sniff: w.sniff, poop: typeof w.poop === 'number' ? w.poop : undefined,
      stamps: info[i].stamps, steady: info[i].steady, note: noteText(walks, i, c), name: (profile && profile.name) || '',
      goal: (R && R.dayGoal) ? R.dayGoal(walks, w.date, i) : null   // 그날 목표 — 이 산책까지 걸은 시간(11/16)
    };
  }

  window.WalsonReceiptInfo = {
    CHOICE_KEY: CHOICE_KEY, NOTES: NOTES, noteById: noteById, clean: clean, defaultNote: defaultNote,
    infoFor: infoFor, isSample: isSample, loadChoices: loadChoices, noteText: noteText, dataFor: dataFor
  };
})();
