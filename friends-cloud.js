// 친구 방·방명록 서버(서로 넣은 사이) — 전역 window.WalsonFriends. (2026-11-25 가르시아 "서버랑 같이 오픈에 열자")
// 왜: 산책길에서 앱 쓰는 견주를 만나 화면 QR을 서로 찍는 일은 드물다(11/25 인터뷰 — 마주치는 견주 대부분 60대 어른).
//   카드 주소·답장으로 서로 넣은 친구도 지금 방 모습을 보고 방명록을 남기려면 서버가 있어야 한다.
// 흐름: [아지트]에서 사용자가 직접 켠다(동의) → 이 휴대폰이 주인 열쇠(128비트)를 만들어 강아지 번호를 등록 →
//   [아지트]를 열 때마다 한 번 맞추기(내 카드·방 모습을 올리고, 내 도감 번호들을 "넣었다"로 적고, 서로 넣은 친구의 지금 방을 받아 온다).
// 서버로 가는 것: 강아지 번호·카드(이름·크기·성향·털색)·방 모습 몇 글자·도감에 넣은 강아지 번호들·방명록 한마디 번호(0~7)·날짜.
// 가지 않는 것: 위치·산책 경로·사진·견주 이름·연락처·자유 글.
// 받는 곳: site-config.js cloudBackup { url, anonKey }(백업과 같은 Supabase) — 비어 있으면 이 기능은 화면에 안 보이고 아무것도 보내지 않는다.
// 서버 쪽: docs/supabase-friends.sql. 주인 열쇠는 이 휴대폰(walson_friends)에만 — 서버 백업을 켜면 잠긴 백업에 같이 들어가 새 폰에서도 이어진다.
(function () {
  var KEY = 'walson_friends';   // { on, key, consentAt, at(마지막 맞추기), gb(받아 온 방명록), gbAt, seen(마지막으로 본 방명록 날짜), visits{번호:날짜}, taken }
  var DC = window.WalsonDexCard;

  function cfg() { var c = window.WALSON_CONFIG && WALSON_CONFIG.cloudBackup; return c && c.url && c.anonKey ? c : null; }
  function state() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }
  function setState(s) { try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch (e) { /* 이번만 */ } }
  function newKey() { var b = new Uint8Array(16); crypto.getRandomValues(b); return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function day(v) { return typeof v === 'string' ? v.slice(0, 10) : ''; }

  function rpc(name, args) {
    var c = cfg();
    if (!c) return Promise.reject(new Error('서버가 아직 준비되지 않았어요.'));
    return fetch(c.url.replace(/\/$/, '') + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: /^sb_/.test(c.anonKey) ? { 'Content-Type': 'application/json', apikey: c.anonKey }
        : { 'Content-Type': 'application/json', apikey: c.anonKey, Authorization: 'Bearer ' + c.anonKey },
      body: JSON.stringify(args)
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          var e = new Error(/bad key/.test(t) ? '이 휴대폰의 열쇠가 서버와 맞지 않아요.' : /bad name/.test(t) ? '강아지 이름에 전화번호나 인터넷 주소가 있어 올리지 않았어요.'
            : '서버에 닿지 못했어요(' + r.status + '). 잠시 뒤 다시 해 주세요.');
          e.code = /bad key/.test(t) ? 'key' : /bad name/.test(t) ? 'name' : 'net';
          throw e;
        });
      }
      return r.json();
    }, function () { var e = new Error('인터넷 연결을 확인해 주세요.'); e.code = 'net'; throw e; });
  }

  // 지금 도감 친구 번호(샘플 친구 빼고)
  function friendIds() {
    return WalsonStore.dex().filter(function (e) { return e && /^[a-z0-9]{8}$/.test(e.i) && !/^sample/.test(e.i); }).map(function (e) { return e.i; });
  }
  function cardArgs(card) { return { p_n: card.n, p_s: card.s, p_g: card.g || '', p_c: card.c }; }
  function mine() {
    return DC.myCard().then(function (card) {
      if (!card) { var e = new Error('워킹패스(우리 개 이름)가 있어야 켤 수 있어요.'); e.code = 'nocard'; throw e; }
      return card;
    });
  }
  function on() { var s = state(); return !!(s && s.on && s.key); }

  var api = {
    available: function () { return !!cfg() && !!(window.crypto && crypto.getRandomValues) && !WalsonStore.sampleOn(); },
    state: state,
    on: on,
    // 켜기(동의 뒤) — 열쇠를 만들고 번호 등록. 이미 다른 휴대폰이 가진 번호면 켜지 않고 'taken'
    enable: function () {
      var s = state() || {}, key = s.key || newKey();
      return mine().then(function (card) {
        var a = cardArgs(card); a.p_id = card.i; a.p_key = key;
        return rpc('walson_dog_register', a);
      }).then(function (r) {
        if (r === 'taken') { setState({ key: key, taken: true }); var e = new Error('taken'); e.code = 'taken'; throw e; }
        setState({ on: true, key: key, consentAt: new Date().toISOString() });
        return api.sync();
      });
    },
    // 맞추기 — 서로 넣은 친구의 지금 카드·방 모습을 도감에 적고(e.mut = 1), 방명록도 받아 온다.
    // 돌려주는 값: { mutual: 서로 넣은 친구 수, changed: 도감이 바뀌었나, gb: 방명록 줄 }
    sync: function () {
      if (!on()) return Promise.resolve(null);
      var s = state();
      return mine().then(function (card) {
        var a = cardArgs(card); a.p_id = card.i; a.p_key = s.key;
        a.p_room = window.WalsonAzit ? WalsonAzit.mySnapshot(card.c) : null;
        a.p_friends = friendIds();
        return Promise.all([rpc('walson_sync', a), rpc('walson_guestbook', { p_id: card.i, p_key: s.key })]);
      }).then(function (res) {
        var rows = Array.isArray(res[0]) ? res[0] : [], gb = Array.isArray(res[1]) ? res[1] : [];
        var byId = {}; rows.forEach(function (r) { if (r && /^[a-z0-9]{8}$/.test(r.id)) byId[r.id] = r; });
        var dex = WalsonStore.dex(), changed = false;
        dex.forEach(function (e) {
          var r = byId[e && e.i];
          if (!r) {   // 서로 넣은 사이가 아니게 됨(상대가 빼거나 막음·끔) — 서버로 받은 방 모습도 지운다(그 자리 QR로 받은 방은 그대로)
            if (e && e.mut) { delete e.mut; changed = true; }
            if (e && e.roomSrv) { delete e.room; delete e.roomAt; delete e.roomSrv; changed = true; }
            return;
          }
          if (!e.mut) { e.mut = 1; changed = true; }
          // 카드(이름·크기·성향·털색)는 이상하면 예전 그대로 — 남이 고칠 수 있는 서버 값이라 도감 카드와 같은 검사를 한다
          if (typeof r.n === 'string' && r.n.trim() && r.n.length <= 12 && !DC.nameProblem(r.n) && r.n !== e.n) { e.n = r.n.trim(); changed = true; }
          if (/^[sml]$/.test(r.s) && r.s !== e.s) { e.s = r.s; changed = true; }
          if (/^[gyr]?$/.test(r.g || '') && (r.g || '') !== (e.g || '')) { e.g = r.g || ''; changed = true; }
          if (/^#[0-9a-f]{6}$/i.test(r.c) && r.c.toLowerCase() !== e.c) { e.c = r.c.toLowerCase(); changed = true; }
          var room = window.WalsonAzit && WalsonAzit.parseRoom(r.room) ? r.room : null, ra = day(r.room_at);
          if (room && (room !== e.room || (ra && ra !== e.roomAt) || !e.roomSrv)) { e.room = room; if (ra) e.roomAt = ra; e.roomSrv = 1; changed = true; }
        });
        if (changed) WalsonStore.saveDex(dex);
        var lines = gb.filter(function (x) { return x && /^[a-z0-9]{8}$/.test(x.guest); }).map(function (x) {
          return { i: x.guest, n: typeof x.n === 'string' && !DC.nameProblem(x.n) ? x.n.slice(0, 12) : '', d: day(x.day), m: (typeof x.m === 'number' && DC.MSGS[x.m]) ? x.m : null };
        });
        var st = state() || {};
        st.at = new Date().toISOString(); st.gb = lines.slice(0, 200); st.gbAt = st.at;
        setState(st);
        return { mutual: rows.length, changed: changed, gb: lines };
      });
    },
    // 받아 둔 방명록(마지막 맞추기 때) — 서버가 멈춰도 지난 것은 보인다
    guestbook: function () { var s = state(); return (s && Array.isArray(s.gb)) ? s.gb : []; },
    // 새로 온 방명록 수(마지막으로 본 뒤) · 봤다고 적기
    unseen: function () { var s = state(), seen = (s && s.seen) || ''; return api.guestbook().filter(function (x) { return x.d > seen; }).length; },
    markSeen: function () { var s = state(); if (!s) return; var top = api.guestbook()[0]; s.seen = top ? top.d : (s.seen || ''); setState(s); },
    // 친구 방에 다녀가며 한마디(하루 한 번 — 같은 날 또 하면 한마디만 바뀜)
    visit: function (host, m) {
      if (!on()) return Promise.reject(new Error('꺼져 있어요.'));
      var s = state();
      return rpc('walson_visit', { p_id: DC.myId(), p_key: s.key, p_host: host, p_m: (m != null && DC.MSGS[m]) ? m : null }).then(function (ok) {
        if (ok) { var st = state() || {}; st.visits = st.visits || {}; st.visits[host] = DC.dayKey(); setState(st); }
        return !!ok;
      });
    },
    visitedToday: function (host) { var s = state(); return !!(s && s.visits && s.visits[host] === DC.dayKey()); },
    // 막기·풀기 — 막으면 서로 방·방명록이 안 보이고 앞으로 안 들어온다(도감엔 남음)
    block: function (other, yes) {
      if (!on()) return Promise.reject(new Error('꺼져 있어요.'));
      return rpc('walson_block', { p_id: DC.myId(), p_key: state().key, p_other: other, p_on: !!yes }).then(function () {
        var dex = WalsonStore.dex();
        dex.forEach(function (e) { if (e && e.i === other) { if (yes) { e.blocked = 1; delete e.mut; if (e.roomSrv) { delete e.room; delete e.roomAt; delete e.roomSrv; } } else delete e.blocked; } });
        WalsonStore.saveDex(dex);
      });
    },
    // 끄고 서버에서 지우기 — 내 강아지·넣은 것·받은·남긴 방명록·막은 것 모두. 도감·친구 방 모습(이 휴대폰에 받아 둔 것)은 그대로
    disable: function () {
      var s = state();
      var done = function () {
        setState(null);
        var dex = WalsonStore.dex(), ch = false;
        dex.forEach(function (e) { if (e && e.mut) { delete e.mut; ch = true; } if (e && e.roomSrv) { delete e.room; delete e.roomAt; delete e.roomSrv; ch = true; } });
        if (ch) WalsonStore.saveDex(dex);
      };
      if (!s || !s.on || !s.key) { done(); return Promise.resolve(); }
      return rpc('walson_dog_delete', { p_id: DC.myId(), p_key: s.key }).then(done);
    }
  };
  window.WalsonFriends = api;
})();
