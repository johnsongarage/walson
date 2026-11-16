// 서버 가정 시험판(2026-11-15, 가르시아 "서버가 있다고 가정한 버전도 만들어 봐야겠어") — 도감 + 오늘 스친 강아지.
// 진짜 서버는 없다. 이 파일 안의 "가짜 서버"가 이 폰의 localStorage에 가짜 견주 12명을 만들어 두고 응답한다.
// 그래서 위치든 뭐든 이 폰 밖으로 나가는 것은 없다(CLAUDE.md 개인정보 절).
//
// 구조 — 두 부분으로 나눠 둔다:
//   1) 폰 쪽(Client): 산책 기록에서 "서버로 보낼 것"을 만든다. 진짜 서버가 생겨도 그대로 쓴다.
//      보내는 건 { 날짜, 발도장 장소 번호, 시간대(아침/낮/저녁/밤) }뿐. 좌표·경로·시각은 폰 밖으로 안 나간다.
//   2) 가짜 서버(MockServer): 진짜 서버로 갈아 끼울 부분. 같은 이름의 함수를 fetch로 바꾸면 된다.
//      모든 함수는 Promise를 돌려주고 일부러 조금 늦게 답한다(진짜 서버처럼 기다리는 화면을 시험하려고).
//
// 켜고 끄기: 아무 화면 주소에 ?server=mock → 켜짐(이 기기에 기억), ?server=off → 꺼짐.
// 켜져 있을 때만 [카드] 탭·산책 끝 화면에 도감 입구가 보인다(friends.html). 꺼져 있으면 아무 데도 안 보인다.
// 고치면 friends.html·my-card.html·walk-end.html의 ?v= 번호를 같이 올릴 것.
(function () {
  var FLAG_KEY = 'petwalk_mock_server';
  var DB_KEY = 'petwalk_mock_db';

  // ?server=mock / ?server=off 로 켜고 끈다
  try {
    var q = new URLSearchParams(location.search).get('server');
    if (q === 'mock') localStorage.setItem(FLAG_KEY, '1');
    if (q === 'off') localStorage.removeItem(FLAG_KEY);
  } catch (e) { /* 저장소를 못 쓰면 꺼진 채로 */ }

  function isOn() {
    try { return localStorage.getItem(FLAG_KEY) === '1'; } catch (e) { return false; }
  }

  // ───────────────────────── 1) 폰 쪽 ─────────────────────────

  var BUCKETS = {
    morning: '아침', day: '낮', evening: '저녁', night: '밤', unknown: '시간대 모름'
  };
  function bucketOf(hour) {
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'day';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
  function distanceKm(a, b) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (b[0] - a[0]) * toRad, dLng = (b[1] - a[1]) * toRad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a[0] * toRad) * Math.cos(b[0] * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function places() {
    return (window.RewardRules && window.RewardRules.PLACES || []).filter(function (p) { return !p.pending; });
  }
  function placeName(id) {
    var p = places().filter(function (x) { return x.id === id; })[0];
    return p ? p.name : '어느 공원';
  }
  // 산책 기록 한 개 → 서버로 보낼 칸 목록. 발도장 장소에 걸친 곳만, 장소 번호와 시간대만 남긴다.
  // 시간만 잰 산책(길 없음)은 장소를 모르니 아무것도 안 보낸다 → 스친 강아지는 길 기록 산책에서만 생긴다.
  function slotsFromWalk(w) {
    var pts = w.stampRoute && w.stampRoute.length ? w.stampRoute : (w.route || []);
    if (!pts.length || w.rewardEligible === false) return [];
    var bucket = 'unknown';
    if (w.endedAt) {
      // 산책 한가운데 시각으로 시간대를 정한다
      var mid = new Date(w.endedAt - (w.durationMin || 0) * 30000);
      bucket = bucketOf(mid.getHours());
    }
    var seen = {};
    var out = [];
    pts.forEach(function (p) {
      places().forEach(function (pl) {
        if (!seen[pl.id] && distanceKm(p, pl.center) <= pl.radiusKm) {
          seen[pl.id] = true;
          out.push({ date: w.date, place: pl.id, bucket: bucket });
        }
      });
    });
    return out;
  }
  function walkSig(w, i) { return w.date + '|' + (w.endedAt || ('i' + i)); }
  function loadJSON(key, fb) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; } catch (e) { return fb; }
  }

  // ───────────────────────── 2) 가짜 서버 ─────────────────────────

  var FAKE_NAMES = ['콩이', '보리', '두부', '초코', '몽이', '해피', '코코', '루이', '별이', '감자', '호두', '뭉치'];
  var FAKE_BREEDS = {
    small: ['말티즈', '포메라니안', '토이푸들', '비숑', '시추', '치와와'],
    medium: ['웰시코기', '시바견', '비글', '보더콜리'],
    large: ['골든리트리버', '진돗개', '래브라도']
  };
  var COLORS = ['#e8b77a', '#c98a5a', '#f2d7b6', '#8a6a52', '#f0efe9', '#5a4636', '#d9a066', '#b9b2a8', '#e3c79a', '#7d5a44', '#f5e6cf', '#a8794f'];

  // 날짜·이름으로 늘 같은 값이 나오는 난수 — 같은 날 다시 열어도 같은 강아지가 같은 곳에 있게
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967296;
  }

  function makeFakeDogs() {
    var ids = places().map(function (p) { return p.id; });
    if (!ids.length) ids = ['central'];
    return FAKE_NAMES.map(function (name, i) {
      var r = function (k) { return hash(name + '|' + k); };
      var size = r('size') < 0.5 ? 'small' : (r('size') < 0.8 ? 'medium' : 'large');
      var breeds = FAKE_BREEDS[size];
      var sigR = r('sig');
      var home = [ids[Math.floor(r('home1') * ids.length)]];
      if (ids.length > 1 && r('two') < 0.4) {
        var other = ids[Math.floor(r('home2') * ids.length)];
        if (other !== home[0]) home.push(other);
      }
      var bk = ['morning', 'day', 'evening'];
      var buckets = [bk[Math.floor(r('b1') * 3)]];
      if (r('b2x') < 0.5) { var b2 = bk[Math.floor(r('b2') * 3)]; if (b2 !== buckets[0]) buckets.push(b2); }
      return {
        id: 'fake-' + (i + 1),
        name: name,
        size: size,
        breed: breeds[Math.floor(r('breed') * breeds.length)],
        signal: sigR < 0.55 ? 'green' : (sigR < 0.85 ? 'yellow' : 'red'),
        color: COLORS[i % COLORS.length],
        homePlaces: home,          // 자주 가는 발도장 장소
        buckets: buckets,          // 자주 나오는 시간대
        walkRate: 0.5 + r('rate') * 0.4,   // 하루에 산책 나올 확률
        visible: r('vis') < 0.75,  // 이 견주도 "스친 강아지"를 켰는지
        acceptRate: 0.55 + r('acc') * 0.4  // 교환 요청을 받아 줄 확률
      };
    });
  }

  function emptyDb() {
    return {
      v: 1,
      me: null,                 // { dogId, name, size, signal } — 서버에 올린 내 강아지
      visible: false,           // 나도 "스친 강아지"를 켰는지(기본 꺼짐)
      fakeDogs: makeFakeDogs(),
      reported: {},             // 보낸 산책 서명 → true
      slots: [],                // 서버가 받은 내 칸 { date, place, bucket, at }
      encounters: [],           // { id, date, place, bucket, dogId, at }
      exchanges: {},            // dogId → { state: pending|accepted|quiet, at, answerAt, via }
      collection: {},           // dogId → { addedAt, via }
      log: []                   // 최근에 서버로 보낸 것(보여 주기용, 최대 20)
    };
  }
  function loadDb() {
    var db = loadJSON(DB_KEY, null);
    if (!db || db.v !== 1) db = emptyDb();
    return db;
  }
  function saveDb(db) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* 꽉 차면 다음에 */ }
  }
  function logSend(db, what, body) {
    db.log.unshift({ at: Date.now(), what: what, body: body });
    db.log = db.log.slice(0, 20);
  }
  // 진짜 서버처럼 조금 기다렸다 답한다
  function later(fn) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try { resolve(fn()); } catch (e) { reject(e); }
      }, 250 + Math.random() * 350);
    });
  }

  // 이 가짜 강아지가 그날 그 장소·시간대에 나왔는지(서버가 다른 유저 기록을 갖고 있다고 치는 부분)
  function fakeWasThere(dog, date, place, bucket) {
    if (!dog.visible) return false;
    if (hash(dog.id + '|walk|' + date) > dog.walkRate) return false;
    if (dog.homePlaces.indexOf(place) < 0 && hash(dog.id + '|stray|' + date + place) > 0.08) return false;
    if (bucket === 'unknown') return hash(dog.id + '|ub|' + date + place) < 0.5;
    var b = dog.buckets[Math.floor(hash(dog.id + '|pick|' + date) * dog.buckets.length)];
    return b === bucket;
  }

  // 교환 요청에 답할 때가 된 것들을 정리(가짜 견주가 시간이 지나면 답한다)
  function settleExchanges(db) {
    var now = Date.now();
    Object.keys(db.exchanges).forEach(function (id) {
      var ex = db.exchanges[id];
      if (ex.state !== 'pending' || now < ex.answerAt) return;
      var dog = fakeById(db, id);
      if (dog && hash(id + '|answer|' + ex.at) < dog.acceptRate) {
        ex.state = 'accepted';
        db.collection[id] = { addedAt: ex.answerAt, via: ex.via || 'met' };
      } else {
        ex.state = 'quiet';   // 거절은 따로 알리지 않는다 — "아직 답이 없어요"로만 보인다
      }
    });
  }
  function fakeById(db, id) { return db.fakeDogs.filter(function (d) { return d.id === id; })[0] || null; }

  // 화면에 줄 강아지 모습 — 서로 도감에 넣기 전에는 이름·견종·색을 숨기고 신호등·크기만
  function publicDog(db, dog) {
    var friend = !!db.collection[dog.id];
    var base = { id: dog.id, size: dog.size, signal: dog.signal, friend: friend };
    if (friend) { base.name = dog.name; base.breed = dog.breed; base.color = dog.color; }
    return base;
  }

  var MockServer = {
    // 내 강아지를 서버에 올린다(프로필의 이름·크기·신호등만 — 사진은 이 시험판에서 안 올린다)
    register: function (profile) {
      return later(function () {
        var db = loadDb();
        var body = {
          name: (profile && profile.name) || '우리 개',
          size: (profile && profile.size) || 'medium',
          signal: (profile && profile.signal) || null
        };
        var changed = !db.me || db.me.name !== body.name || db.me.size !== body.size || db.me.signal !== body.signal;
        if (changed) {
          db.me = { dogId: (db.me && db.me.dogId) || ('me-' + Math.random().toString(36).slice(2, 8)), name: body.name, size: body.size, signal: body.signal };
          logSend(db, '내 강아지 올리기', body);
          saveDb(db);
        }
        return db.me;
      });
    },
    getSettings: function () {
      return later(function () { var db = loadDb(); return { visible: db.visible, me: db.me }; });
    },
    setVisible: function (on) {
      return later(function () {
        var db = loadDb();
        db.visible = !!on;
        logSend(db, '스친 강아지 ' + (on ? '켜기' : '끄기'), { visible: !!on });
        saveDb(db);
        return db.visible;
      });
    },
    // 산책 칸을 받아서, 같은 날·같은 장소·같은 시간대에 있던 강아지를 돌려준다
    reportSlots: function (slots) {
      return later(function () {
        var db = loadDb();
        var found = [];
        slots.forEach(function (s) {
          db.slots.push({ date: s.date, place: s.place, bucket: s.bucket, at: Date.now() });
          db.fakeDogs.forEach(function (dog) {
            if (!fakeWasThere(dog, s.date, s.place, s.bucket)) return;
            var dup = db.encounters.some(function (e) { return e.dogId === dog.id && e.date === s.date && e.place === s.place; });
            if (dup) return;
            var enc = { id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), date: s.date, place: s.place, bucket: s.bucket, dogId: dog.id, at: Date.now() };
            db.encounters.push(enc);
            found.push(enc);
          });
        });
        db.slots = db.slots.slice(-200);
        db.encounters = db.encounters.slice(-300);
        saveDb(db);
        return found.length;
      });
    },
    listEncounters: function () {
      return later(function () {
        var db = loadDb();
        settleExchanges(db);
        saveDb(db);
        return db.encounters.slice().sort(function (a, b) {
          return a.date < b.date ? 1 : a.date > b.date ? -1 : b.at - a.at;
        }).map(function (e) {
          var dog = fakeById(db, e.dogId);
          var ex = db.exchanges[e.dogId];
          return {
            id: e.id, date: e.date, place: e.place, bucket: e.bucket,
            dog: dog ? publicDog(db, dog) : null,
            exchange: ex ? ex.state : null
          };
        }).filter(function (e) { return e.dog; });
      });
    },
    requestExchange: function (dogId, via) {
      return later(function () {
        var db = loadDb();
        if (db.collection[dogId]) return 'accepted';
        var ex = db.exchanges[dogId];
        if (ex && ex.state === 'pending') return 'pending';
        var now = Date.now();
        // 가짜 견주는 15~60초 뒤에 답한다(시험하기 좋게 짧게)
        db.exchanges[dogId] = { state: 'pending', at: now, answerAt: now + 15000 + Math.random() * 45000, via: via || 'met' };
        logSend(db, '도감 교환 요청', { to: dogId });
        saveDb(db);
        return 'pending';
      });
    },
    // 공원에서 서로 QR을 찍은 경우 — 그 자리에서 둘 다 도감에 들어간다.
    // 시험판에는 상대 폰이 없으니 아직 안 만난 가짜 강아지 하나를 찍은 걸로 친다.
    scanFakeQr: function () {
      return later(function () {
        var db = loadDb();
        var left = db.fakeDogs.filter(function (d) { return !db.collection[d.id]; });
        if (!left.length) return null;
        var dog = left[Math.floor(Math.random() * left.length)];
        db.collection[dog.id] = { addedAt: Date.now(), via: 'qr' };
        db.exchanges[dog.id] = { state: 'accepted', at: Date.now(), answerAt: Date.now(), via: 'qr' };
        logSend(db, 'QR로 도감 교환', { with: dog.id });
        saveDb(db);
        return publicDog(db, dog);
      });
    },
    listCollection: function () {
      return later(function () {
        var db = loadDb();
        settleExchanges(db);
        saveDb(db);
        return Object.keys(db.collection).map(function (id) {
          var dog = fakeById(db, id);
          if (!dog) return null;
          var mets = db.encounters.filter(function (e) { return e.dogId === id; });
          var placesMet = {};
          mets.forEach(function (e) { placesMet[e.place] = true; });
          var c = db.collection[id];
          return {
            dog: publicDog(db, dog), addedAt: c.addedAt, via: c.via,
            metCount: mets.length, places: Object.keys(placesMet),
            lastMet: mets.length ? mets.map(function (e) { return e.date; }).sort().pop() : null
          };
        }).filter(Boolean).sort(function (a, b) { return b.addedAt - a.addedAt; });
      });
    },
    sentLog: function () {
      return later(function () { return loadDb().log; });
    },
    stats: function () {
      return later(function () {
        var db = loadDb();
        return { fakeDogs: db.fakeDogs.length, total: FAKE_NAMES.length };
      });
    },
    reset: function () {
      return later(function () { localStorage.removeItem(DB_KEY); return true; });
    }
  };

  // ───────────────────────── 화면이 쓰는 창구 ─────────────────────────

  // 아직 안 보낸 최근 7일 산책을 보낸다. 스친 강아지를 꺼 두었으면 아무것도 안 보낸다.
  function syncWalks() {
    var walks = WalsonStore.walks();   // 산책 기록(store.js)
    var db = loadDb();
    if (!db.visible) return Promise.resolve({ sent: 0, found: 0, off: true });
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 6);
    var cutoffKey = cutoff.getFullYear() + '-' + String(cutoff.getMonth() + 1).padStart(2, '0') + '-' + String(cutoff.getDate()).padStart(2, '0');
    var slots = [];
    var sigs = [];
    walks.forEach(function (w, i) {
      if (!w || !w.date || w.date < cutoffKey) return;
      var sig = walkSig(w, i);
      if (db.reported[sig]) return;
      sigs.push(sig);
      slotsFromWalk(w).forEach(function (s) { slots.push(s); });
    });
    if (!sigs.length) return Promise.resolve({ sent: 0, found: 0 });
    // 보낸 표시를 먼저 해 두고(두 화면이 동시에 열려도 두 번 안 보내게), 보낸 내용을 기록에 남긴다
    sigs.forEach(function (s) { db.reported[s] = true; });
    if (slots.length) logSend(db, '산책 칸 보내기', slots);
    saveDb(db);
    if (!slots.length) return Promise.resolve({ sent: 0, found: 0 });
    return MockServer.reportSlots(slots).then(function (n) { return { sent: slots.length, found: n }; });
  }

  window.WalsonApi = {
    mode: 'mock',
    isOn: isOn,
    BUCKETS: BUCKETS,
    placeName: placeName,
    slotsFromWalk: slotsFromWalk,
    syncWalks: syncWalks,
    server: MockServer
  };
})();
