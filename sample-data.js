// 샘플 데이터로 보기(2026-11-14 가르시아 요청) — 버튼 하나로 앱 전체를 "써 본 상태"로 채운다.
// 공원에서 견주에게 보여 주거나, 기능을 한눈에 확인할 때 쓴다. 전역 window.PetwalkSample.
//
// 넣는 것(전부 이 휴대폰 안에만, 서버로 보내지 않음):
//   - 강아지 프로필: 왈슨(앱 그림 사진·빨강불·주민증 번호)
//   - 최근 3주 산책 기록: 길 기록 산책(공원 둘레 가짜 경로) + 시간만 잰 산책, 끝 화면 답, 오늘의 한 장 사진
//   - 산책 중에 찍은 메모 핀 2개
//   - [동네] 지도의 수호지킴이 한 마리: 다산동 푸라닭 수호신 봄이(가르시아가 준 실제 가게·사진)
// 사진: 왈슨은 앱 그림, 봄이는 가르시아가 준 사진(icons/sample-*.jpg). 오늘의 한 장도 왈슨 그림.
// 경로는 공용 공원(다산중앙공원·다산수변공원) 둘레를 도는 지어낸 고리다 — 누구의 실제 경로도 아니다.
//
// 켜면 지금 기록을 따로 보관해 두고(petwalk_sample_backup), 끄면 샘플을 지우고 그대로 되돌린다.
// 샘플을 켠 동안 새로 한 산책은 끌 때 같이 사라진다(켤 때 알린다).
(function () {
  var FLAG = 'petwalk_sample_mode';
  var BACKUP = 'petwalk_sample_backup';
  var SPOTS = 'petwalk_sample_spots';    // infra-pins.js가 샘플 모드일 때만 읽는다
  // 샘플이 덮어쓰는 열쇠들 — 끌 때 이 값들을 되돌린다
  var KEYS = ['petwalk_walks', 'petwalk_profile', 'petwalk_pins', 'petwalk_reward_card',
              'petwalk_last_walk', 'petwalk_active_walk', 'petwalk_dog_size'];
  var PHOTO_PREFIX = 'sample-';

  function isOn() { try { return localStorage.getItem(FLAG) === '1'; } catch (e) { return false; } }

  // ── 가짜 경로: 공원 둘레 고리 ──
  function loop(center, radiusM, points, phase) {
    var mLat = 111320, mLng = 111320 * Math.cos(center[0] * Math.PI / 180);
    var out = [];
    for (var i = 0; i <= points; i++) {
      var a = phase + (i / points) * Math.PI * 2;
      var r = radiusM * (1 + 0.08 * Math.sin(i * 1.7));
      out.push([+(center[0] + (r * Math.sin(a)) / mLat).toFixed(6), +(center[1] + (r * Math.cos(a)) / mLng).toFixed(6)]);
    }
    return out;
  }
  function routeKm(route) {
    var km = 0, R = 6371, rad = Math.PI / 180;
    for (var i = 1; i < route.length; i++) {
      var a = route[i - 1], b = route[i];
      var dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
      var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      km += 2 * R * Math.asin(Math.sqrt(h));
    }
    return Math.round(km * 100) / 100;
  }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function dateKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

  var CENTRAL = [37.6233, 127.15962];    // 다산중앙공원(발도장 장소와 같은 중심)
  var WATERSIDE = [37.62396, 127.14529]; // 다산수변공원

  // [며칠 전, 방식, 분, 어느 공원, 고리 반지름(m), 충분했나, 킁킁, 응가, 사진 그림 번호]
  var PLAN = [
    [0, 'gps', 34, CENTRAL, 170, 'enough', 4, 1, 0],
    [1, 'time', 20, null, 0, 'short', 2, 1, -1],
    [1, 'gps', 41, WATERSIDE, 220, 'enough', 5, 2, 1],
    [2, 'gps', 28, CENTRAL, 150, 'enough', 3, 1, -1],
    [3, 'gps', 37, CENTRAL, 190, 'enough', 4, 1, 2],
    [4, 'time', 15, null, 0, 'short', 2, 0, -1],
    [5, 'gps', 46, WATERSIDE, 240, 'enough', 5, 1, 3],
    [6, 'gps', 31, CENTRAL, 160, 'enough', 3, 1, -1],
    [8, 'gps', 39, CENTRAL, 200, 'enough', 4, 2, -1],
    [9, 'gps', 26, WATERSIDE, 180, 'short', 3, 1, 4],
    [10, 'gps', 33, CENTRAL, 170, 'enough', 4, 1, -1],
    [12, 'gps', 44, WATERSIDE, 230, 'enough', 5, 1, -1],
    [13, 'gps', 29, CENTRAL, 150, 'enough', 3, 1, -1],
    [14, 'gps', 36, CENTRAL, 190, 'enough', 4, 1, -1],
    [16, 'gps', 40, WATERSIDE, 210, 'enough', 4, 2, -1],
    [17, 'gps', 27, CENTRAL, 160, 'short', 2, 1, -1],
    [19, 'gps', 35, CENTRAL, 180, 'enough', 4, 1, -1],
    [20, 'time', 18, null, 0, 'enough', 3, 1, -1]
  ];

  // 샘플 사진(2026-11-15 가르시아가 준 것): 왈슨 = 앱 그림, 봄이 = 다산동 푸라닭 수호신 사진.
  // 파일로 두고 경로로 쓴다(메타데이터 없이 다시 저장한 것).
  var WALSON_PHOTO = 'icons/sample-walson.jpg';
  var BOM_PHOTO = 'icons/sample-bom.jpg';

  // 샘플 수호지킴이는 봄이 한 마리(2026-11-15 가르시아가 알려 준 정보).
  // 같은 가게가 서비스 데이터에도 올라가 있어서(field-1794669441573), 샘플을 보는 동안에는 그 핀 대신 이 핀을 보인다(replaces).
  var SHOPS = [{
    id: 'sample-shop-bom', replaces: 'field-1794669441573',
    cat: 'spot', name: '다산동 푸라닭 수호신', lat: 37.6221, lng: 127.15995,
    tags: ['가끔 출몰'],
    note: '계산대 밑에서 손님맞이를 해요. 가게에 가끔 출몰해요.',
    guardian: { name: '봄이', signal: 'yellow', line: '얌전히 있다가 치킨을 가져가면 짖기 시작해요', photo: BOM_PHOTO }
  }];

  function turnOn() {
    if (isOn()) return Promise.resolve();
    // 지금 기록 보관
    var backup = {};
    KEYS.forEach(function (k) { try { backup[k] = localStorage.getItem(k); } catch (e) { backup[k] = null; } });
    try { localStorage.setItem(BACKUP, JSON.stringify(backup)); } catch (e) { return Promise.reject(new Error('저장 공간이 부족해요')); }

    var now = new Date();
    var walks = [], photoJobs = [];
    PLAN.slice().reverse().forEach(function (p, i) {   // 오래된 것부터 쌓는다
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - p[0]);
      var w = { date: dateKey(d), durationMin: p[2], gapMin: 0, feel: p[5], sniff: p[6], poop: p[7] };
      if (p[1] === 'gps') {
        var route = loop(p[3], p[4], 36, i * 0.7);
        w.distanceKm = routeKm(route);
        w.route = route;
        w.stampRoute = route;
        w.rewardEligible = true;
      } else {
        w.distanceKm = 0; w.route = []; w.stampRoute = []; w.rewardEligible = false; w.mode = 'time';
      }
      if (p[8] >= 0 && window.WalkPhotos) {
        w.photoKey = PHOTO_PREFIX + 'walk-' + i;
        photoJobs.push(w.photoKey);
      }
      walks.push(w);
    });

    var spots = SHOPS.map(function (s) {
      var copy = JSON.parse(JSON.stringify(s));
      copy.source = 'field';
      copy.verifiedAt = dateKey(now);
      return copy;
    });

    try {
      localStorage.setItem('petwalk_walks', JSON.stringify(walks));
      // 샘플 강아지는 왈슨(앱 그림) — 빨강불은 으르렁 얼굴에 맞춘 것
      localStorage.setItem('petwalk_profile', JSON.stringify({
        name: '왈슨', size: 'small', signal: 'red', photo: WALSON_PHOTO,
        cardNo: 'DASAN-SAMPLE', cardIssued: now.getFullYear() + '. ' + (now.getMonth() + 1) + '. ' + now.getDate() + '.'
      }));
      localStorage.setItem('petwalk_pins', JSON.stringify([
        { id: 'sample-pin-1', lat: 37.62362, lng: 127.15905, memo: '여기 풀숲 진드기 조심 (샘플)' },
        { id: 'sample-pin-2', lat: 37.62428, lng: 127.14460, memo: '그늘 벤치, 물그릇 있음 (샘플)' }
      ]));
      localStorage.removeItem('petwalk_reward_card');
      localStorage.removeItem('petwalk_last_walk');
      localStorage.removeItem('petwalk_active_walk');
      localStorage.setItem('petwalk_dog_size', 'small');
      localStorage.setItem(SPOTS, JSON.stringify(spots));
      localStorage.setItem(FLAG, '1');
    } catch (e) {
      restoreKeys(backup);
      return Promise.reject(new Error('저장 공간이 부족해요'));
    }

    // 오늘의 한 장 사진은 왈슨 그림으로 — 휴대폰 안 사진 저장소에 넣는다
    if (!photoJobs.length) return Promise.resolve();
    return fetch(WALSON_PHOTO).then(function (r) { return r.blob(); }).then(function (blob) {
      return Promise.all(photoJobs.map(function (key) {
        return WalkPhotos.put(key, blob).catch(function () { /* 사진 하나 못 넣어도 나머지는 그대로 */ });
      }));
    }).catch(function () { /* 사진 없이도 샘플은 그대로 */ });
  }

  // 처음 온 사람(기록·프로필이 없음)은 샘플로 시작한다(2026-11-15 가르시아 "샘플로 보는걸 기본으로").
  // 한 번 자동으로 켠 뒤(또는 직접 끈 뒤)에는 다시 켜지 않는다.
  var AUTO = 'petwalk_sample_auto_done';
  function shouldAutoStart() {
    try {
      if (isOn() || localStorage.getItem(AUTO)) return false;
      var walks = JSON.parse(localStorage.getItem('petwalk_walks') || '[]');
      if (walks && walks.length) return false;
      if (localStorage.getItem('petwalk_profile')) return false;
      return true;
    } catch (e) { return false; }
  }
  function autoStart() {
    try { localStorage.setItem(AUTO, '1'); } catch (e) { return Promise.resolve(false); }
    return turnOn().then(function () { return true; }, function () { return false; });
  }

  function restoreKeys(backup) {
    KEYS.forEach(function (k) {
      try {
        if (backup && backup[k] != null) localStorage.setItem(k, backup[k]);
        else localStorage.removeItem(k);
      } catch (e) { /* 되돌리지 못한 값은 그대로 */ }
    });
  }

  function turnOff() {
    var backup = null;
    try { backup = JSON.parse(localStorage.getItem(BACKUP)); } catch (e) { backup = null; }
    // 샘플 사진 지우기(진짜 사진은 열쇠가 sample-로 시작하지 않아 건드리지 않는다)
    var walks = [];
    try { walks = JSON.parse(localStorage.getItem('petwalk_walks')) || []; } catch (e) { walks = []; }
    var jobs = walks.map(function (w) { return w && w.photoKey; })
      .filter(function (k) { return k && k.indexOf(PHOTO_PREFIX) === 0; });
    restoreKeys(backup || {});
    try {
      localStorage.removeItem(BACKUP);
      localStorage.removeItem(SPOTS);
      localStorage.removeItem(FLAG);
    } catch (e) { /* 무시 */ }
    if (!window.WalkPhotos) return Promise.resolve();
    return Promise.all(jobs.map(function (k) { return WalkPhotos.remove(k).catch(function () {}); }));
  }

  window.PetwalkSample = { isOn: isOn, turnOn: turnOn, turnOff: turnOff, shouldAutoStart: shouldAutoStart, autoStart: autoStart, SPOTS_KEY: SPOTS };
})();
