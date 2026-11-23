// 샘플 데이터로 보기(2026-11-14 가르시아 요청) — 버튼 하나로 앱 전체를 "써 본 상태"로 채운다.
// 공원에서 견주에게 보여 주거나, 기능을 한눈에 확인할 때 쓴다. 전역 window.PetwalkSample.
//
// 켜는 길은 둘뿐이다(2026-11-23 가르시아 "샘플 관련된 건 sample 링크로 다 몰아서 버튼 하나만" — 11/15 "샘플이 기본" 번복):
//   ① 주소 johnsongarage.co.kr/walson/sample (sample/index.html → index.html?sample=on — [오늘]이 켠다)
//   ② [오늘]·[기록] 톱니 판의 "샘플로 둘러보기"(같은 주소로 간다)
// 처음 온 사람에게 저절로 켜지지 않는다. 끄는 길은 탭 위 "샘플 끄기" 띠(tabbar.js)와 톱니 판의 같은 줄.
//
// 넣는 것(전부 이 휴대폰 안에만, 서버로 보내지 않음):
//   - 강아지 프로필: 왈슨(앱 그림 사진·빨강불·주민증 번호)
//   - 최근 3주 산책 기록: 길 기록 산책(공원 둘레 가짜 경로) + 시간만 잰 산책, 끝 화면 답, 오늘의 한 장 사진
//   - 산책 중에 찍은 메모 핀 2개
//   - 산책 아지트: 왈슨이 꾸민 방(azit-room.js sampleState — 켤 때 아지트 설정을 비워 두면 [아지트]가 샘플 방으로 연다, 2026-11-23)
//   (가게·지킴이(옛 수호견)는 넣지 않는다)
// 사진: 왈슨은 앱 그림(icons/sample-walson.jpg). 오늘의 한 장도 왈슨 그림.
// 경로는 공용 공원(다산중앙공원·다산수변공원) 둘레를 도는 지어낸 고리다 — 누구의 실제 경로도 아니다.
//
// 켜면 지금 기록을 따로 보관해 두고(petwalk_sample_backup), 끄면 샘플을 지우고 그대로 되돌린다.
// 샘플을 켠 동안 새로 한 산책은 끌 때 같이 사라진다(켤 때 알린다).
(function () {
  var FLAG = 'petwalk_sample_mode';
  var BACKUP = 'petwalk_sample_backup';
  var SPOTS = 'petwalk_sample_spots';    // 예전 샘플 가게 자리 — 이제 쓰지 않고, 남아 있으면 지운다
  // 샘플이 덮어쓰는 열쇠들 — 끌 때 이 값들을 되돌린다
  // petwalk_azit(11/23): 샘플 동안 연 아지트 설정(왈슨 방·고른 강아지·본 소품)이 진짜 기록에 남지 않게
  var KEYS = ['petwalk_walks', 'petwalk_profile', 'petwalk_pins', 'petwalk_reward_card',
              'petwalk_last_walk', 'petwalk_active_walk', 'petwalk_dog_size', 'petwalk_keyring', 'petwalk_azit'];
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

  // 샘플 사진: 왈슨 = 앱 그림. 파일로 두고 경로로 쓴다(메타데이터 없이 다시 저장한 것).
  var WALSON_PHOTO = 'icons/sample-walson.jpg';

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
      localStorage.removeItem('petwalk_keyring');
      localStorage.removeItem('petwalk_last_walk');
      localStorage.removeItem('petwalk_active_walk');
      localStorage.removeItem('petwalk_azit');   // [아지트]가 왈슨이 꾸민 샘플 방으로 연다(azit-room.js)
      localStorage.setItem('petwalk_dog_size', 'small');
      localStorage.removeItem(SPOTS);
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

  // 이 휴대폰에 내 기록이 있는지 — 샘플 주소로 왔을 때 기록이 없으면 묻지 않고 바로 켜고, 있으면 한 번 묻는다(2026-11-23).
  // 샘플이 덮어쓰는 것(KEYS) 중 사람이 남긴 것만 본다. 강아지 크기(petwalk_dog_size)는 프로필에서 따라오는 값이라 뺀다.
  // (예전 "처음 온 사람은 샘플로 시작"(11/15)의 shouldAutoStart·autoStart는 11/23에 뺐다)
  function hasOwnRecord() {
    if (isOn()) return false;   // 지금 보이는 건 샘플 — 내 기록은 따로 보관돼 있다
    try {
      return KEYS.some(function (k) {
        if (k === 'petwalk_dog_size') return false;
        var v = localStorage.getItem(k);
        if (v == null || v === '' || v === 'null') return false;
        if (v.charAt(0) === '[') { try { return JSON.parse(v).length > 0; } catch (e) { return true; } }
        return true;
      });
    } catch (e) { return true; }   // 모르면 있다고 보고 묻는다
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

  // 샘플을 보는 동안 내 기록을 남기려 할 때(산책 시작·프로필 저장) 먼저 샘플을 끄게 한다(2026-11-15).
  // 샘플을 켠 채 남긴 기록은 샘플을 끌 때 같이 사라지기 때문. 끄면 샘플 전에 있던 내 기록이 돌아온다.
  // 돌려주는 값: Promise<boolean> — true면 진행해도 됨(샘플이 꺼져 있거나 방금 껐음), false면 그만둠.
  function leaveForRealRecord(what) {
    if (!isOn()) return Promise.resolve(true);
    var ok = confirm('지금은 샘플 기록으로 둘러보는 중이에요.\n이대로 ' + what + ' 그 기록은 샘플을 끌 때 같이 지워져요.\n\n' +
      '샘플을 끄고 내 기록으로 ' + what.replace(/하면$/, '할까요?').replace(/면$/, '까요?') + '\n(확인: 샘플 끄고 계속 · 취소: 그만두기)');
    if (!ok) return Promise.resolve(false);
    return turnOff().then(function () { return true; }, function () { return true; });
  }

  window.PetwalkSample = { isOn: isOn, turnOn: turnOn, turnOff: turnOff, leaveForRealRecord: leaveForRealRecord, hasOwnRecord: hasOwnRecord, SPOTS_KEY: SPOTS };
})();
