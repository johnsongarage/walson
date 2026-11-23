// 기록 옮기기(2026-11-15, hq 개발 후보). 전역 window.WalsonBackup.
// 왜: 카톡·크롬 창과 홈 화면에 설치한 왈슨은 저장 공간이 따로라서, 설치하면 주민증·산책 기록이 안 넘어간다.
// 서버 없이 "파일로 내보내기 → 다른 곳에서 불러오기"로 옮긴다. 파일은 사용자가 직접 갖고 다니고 어디로도 올리지 않는다.
// 담는 것: 이 사이트의 왈슨 기록(petwalk_*, walson_*)과 산책 사진(오늘의 한 장).
// 빼는 것: 운영자 토큰·스팟 편집 초안(운영자 기기 정보), 샘플 모드 자료(지어낸 기록), 통계 대기열.
(function () {
  var SKIP = /^(petwalk_admin_token|petwalk_spot_draft|petwalk_sample_.*|walson_track_queue|walson_cloud)$/;   // walson_cloud = 서버 백업 복구 코드(파일·주소에 넣지 않음, 11/23)
  var ARRAY_MERGE = {   // 합치기 때 겹침을 가리는 기준
    // loggedAt(다녀왔어요)·endedAt(길 기록)이 있으면 넣어서, 같은 날 같은 분 수의 다른 산책이 하나로 합쳐지지 않게(2026-11-16)
    petwalk_walks: function (w) { return [w.date, w.durationMin, w.distanceKm || 0, w.photoKey || '', w.loggedAt || w.endedAt || ''].join('|'); },
    petwalk_pins: function (p) { return p.id || [p.lat, p.lng, p.memo].join('|'); },
    petwalk_visits: function (v) { return v.s + '|' + v.d; },
    petwalk_dex: function (d) { return d.i; }   // 강아지 도감(dex.html) — 같은 강아지는 하나만
  };
  function keys() {
    var out = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (/^(petwalk_|walson_)/.test(k) && !SKIP.test(k)) out.push(k);
    }
    return out;
  }
  function blobToDataUrl(b) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(b); });
  }
  function dataUrlToBlob(u) {
    var m = /^data:([^;]+);base64,(.*)$/.exec(u || '');
    if (!m) return null;
    var bin = atob(m[2]), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: m[1] });
  }
  // ── 파일 검증 값(2026-11-15, 치팅 방지 ②) ──
  // 내용 + 고정 문자열을 SHA-256으로 묶어 sig에 넣는다. 메모장으로 기록을 고치면 값이 안 맞아 불러오지 않는다.
  // 코드가 공개돼 있어 작정하면 다시 계산할 수 있다 — 손쉬운 조작만 막는 장치. 진짜 확인은 현장 명단(카드 번호).
  var SALT = 'walson-backup-v1:dasan';
  function canonical(obj) {
    var keys = Object.keys(obj || {}).sort(), out = {};
    keys.forEach(function (k) { out[k] = obj[k]; });
    return JSON.stringify(out);
  }
  function signOf(obj) {
    var text = SALT + '|' + obj.at + '|' + canonical(obj.data) + '|' + canonical(obj.photos);
    if (!(window.crypto && crypto.subtle)) return Promise.reject(new Error('이 브라우저에서는 기록 옮기기를 쓸 수 없어요(보안 연결 필요).'));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function walksOf(obj) { try { return JSON.parse(obj) || []; } catch (e) { return []; } }

  // 내보내기 → { app, kind, v, at, data:{키:문자열}, photos:{열쇠:dataURL} }
  function exportAll() {
    if (localStorage.getItem('petwalk_sample_mode') === '1') {
      return Promise.reject(new Error('지금은 샘플 기록을 보는 중이에요. [오늘]에서 "샘플 끄기"를 누른 뒤 내보내 주세요.'));
    }
    var data = {};
    keys().forEach(function (k) { data[k] = localStorage.getItem(k); });
    var photoKeys = walksOf(data.petwalk_walks).map(function (w) { return w && w.photoKey; }).filter(Boolean);
    var photos = {};
    var jobs = photoKeys.map(function (k) {
      return (window.WalkPhotos ? WalkPhotos.get(k) : Promise.resolve(null)).then(function (b) {
        return b ? blobToDataUrl(b).then(function (u) { photos[k] = u; }) : null;
      }).catch(function () { /* 사진 하나 못 읽어도 나머지는 담는다 */ });
    });
    var obj;
    return Promise.all(jobs).then(function () {
      obj = { app: 'walson', kind: 'backup', v: 2, at: new Date().toISOString(), data: data, photos: photos };
      return signOf(obj);
    }).then(function (sig) {
      obj.sig = sig;
      var walks = walksOf(data.petwalk_walks).length;
      var blob = new Blob([JSON.stringify(obj)], { type: 'text/plain' });   // 휴대폰 공유 창이 받는 형식(.txt)
      return { blob: blob, name: 'walson-backup-' + today() + '.txt', walks: walks, photos: Object.keys(photos).length };
    });
  }

  function read(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () {
        try {
          var obj = JSON.parse(r.result);
          if (!obj || obj.app !== 'walson' || obj.kind !== 'backup' || !obj.data) throw new Error('왈슨 기록 파일이 아니에요.');
          if (!obj.sig) throw new Error('예전 형식의 왈슨 기록 파일이에요. 기록이 있는 곳에서 다시 내보내 주세요.');
          signOf(obj).then(function (sig) {
            if (sig !== obj.sig) rej(new Error('파일 내용이 바뀌어서 불러올 수 없어요. 기록이 있는 곳에서 다시 내보내 주세요.'));
            else res(obj);
          }, rej);
          return;
        } catch (e) { rej(new Error(/왈슨|예전 형식/.test(e.message) ? e.message : '파일을 읽지 못했어요(왈슨 기록 파일인지 확인해 주세요).')); }
      };
      r.onerror = function () { rej(new Error('파일을 읽지 못했어요.')); };
      r.readAsText(file);
    });
  }
  function summary(obj) {
    var p = {}; try { p = JSON.parse(obj.data.petwalk_profile || '{}') || {}; } catch (e) { p = {}; }
    return { walks: walksOf(obj.data.petwalk_walks).length, photos: Object.keys(obj.photos || {}).length, name: p.name || '', at: (obj.at || '').slice(0, 10) };
  }

  // 불러오기. merge=true면 산책·핀·방문 도장은 이 기기 것과 합치고(겹치는 건 하나로), 나머지는 파일 값으로.
  // merge=false면 이 기기의 왈슨 기록을 파일 내용으로 바꾼다. 운영자 토큰은 어느 쪽이든 건드리지 않는다.
  function importAll(obj, merge, opts) {
    opts = opts || {};
    var data = obj.data || {}, failed = false;
    // 치팅 방지 ①: "키링 받음"은 불러오기로 절대 지워지지 않는다(이 기기·파일 중 한쪽이라도 받았으면 유지)
    var keyringHere = localStorage.getItem('petwalk_keyring');
    // 샘플을 보는 중이었다면 샘플 자료부터 걷어 낸다(파일은 진짜 기록)
    ['petwalk_sample_mode', 'petwalk_sample_backup', 'petwalk_sample_spots'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } });
    if (!merge) keys().forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } });
    Object.keys(data).forEach(function (k) {
      if (!/^(petwalk_|walson_)/.test(k) || SKIP.test(k)) return;
      var v = data[k];
      if (merge && ARRAY_MERGE[k]) {
        var mine = walksOf(localStorage.getItem(k)), theirs = walksOf(v), seen = {}, out = [];
        mine.concat(theirs).forEach(function (x) { var id = ARRAY_MERGE[k](x || {}); if (!seen[id]) { seen[id] = 1; out.push(x); } });
        if (k === 'petwalk_walks') out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
        v = JSON.stringify(out);
      } else if (merge && k === 'petwalk_profile' && localStorage.getItem(k)) {
        // 합치기: 프로필은 이 기기에 이미 있으면 그대로 두되, 비어 있는 칸만 파일에서 채운다
        try {
          var cur = JSON.parse(localStorage.getItem(k)) || {}, inc = JSON.parse(v) || {};
          Object.keys(inc).forEach(function (f) { if (cur[f] == null || cur[f] === '') cur[f] = inc[f]; });
          v = JSON.stringify(cur);
        } catch (e) { /* 그대로 */ }
      }
      try { localStorage.setItem(k, v); } catch (e) { failed = true; }
    });
    var keyringThere = data.petwalk_keyring || null;
    var keep = keyringHere || keyringThere;
    try { if (keep) localStorage.setItem('petwalk_keyring', keep); } catch (e) { failed = true; }
    // 치팅 방지 ③: 기록을 불러온 적이 있음을 남긴다(키링 표에 작게 보인다). 파일에 이미 있던 날짜는 이어 간다.
    //   같은 휴대폰 안에서 카톡 → 크롬으로 옮긴 것(opts.moved)은 따로 "옮겨 옴"으로 약하게 남긴다.
    try {
      var markKey = opts.moved ? 'petwalk_moved_at' : 'petwalk_imported_at';
      var prevImports = localStorage.getItem(markKey);
      localStorage.setItem(markKey, today() + (prevImports && prevImports !== today() ? ',' + prevImports : ''));
    } catch (e) { /* 표시용이라 실패해도 진행 */ }
    if (failed) return Promise.reject(new Error('이 휴대폰 저장 공간이 부족해서 일부를 불러오지 못했어요.'));
    var photos = obj.photos || {};
    var jobs = Object.keys(photos).map(function (k) {
      var b = dataUrlToBlob(photos[k]);
      return (b && window.WalkPhotos) ? WalkPhotos.put(k, b).catch(function () { /* 사진 하나 실패해도 계속 */ }) : null;
    });
    return Promise.all(jobs);
  }

  // ── 카톡 창 → 크롬·사파리로 한 번에 옮기기(2026-11-15) ──
  // 기록을 주소의 # 뒷부분에 담아 카톡의 "바깥 브라우저로 열기"로 넘긴다. # 뒷부분은 서버로 가지 않고 이 휴대폰 안에서만 넘어간다.
  // 주소 길이에 한계가 있어 가벼운 기록만 담는다. 위치는 담지 않는다:
  //  - 산책의 걸은 길(route)·사진 열쇠는 뺀다. 발도장 판정용 점(stampRoute)은 "도장을 받은 장소의 중심점"(공개된 장소 좌표)으로 바꾼다.
  //  - 내가 찍은 핀, 진행 중인 산책(시간만 재기·길 기록 둘 다), 코스 짜기, 서버 가정 시험판 자료는 뺀다.
  //    길 기록 중인 산책(petwalk_active_route)은 걸은 궤적 원본이라 가장 민감한데 빠져 있었다 — 주소가 브라우저 기록 등에
  //    남을 수 있어 2026-11-17 뺌(가르시아 "고쳐 줘", PLATFORM_PLAN 8절). 받는 쪽도 이 칸들은 받지 않는다(예전에 만든 주소).
  // 기기 번호·처음 유입 코드(walson_*)는 같이 넘겨, 통계에서 같은 사람이 두 기기로 세어지지 않게 한다.
  var MOVE_SKIP = /^(petwalk_location_explained|petwalk_pins|petwalk_active_walk|petwalk_active_route|petwalk_course_builder_state|petwalk_mock_db|petwalk_mock_server|petwalk_demo_.*|petwalk_infra_shown)$/;
  var MOVE_PREFIX = '#walson-move=';
  var MOVE_MAX = 300000;   // 이보다 길면 강아지 사진을 빼고 보낸다
  function b64urlEncode(str) {
    var bin = unescape(encodeURIComponent(str));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }
  function lightWalks(raw) {
    var places = (window.RewardRules && RewardRules.PLACES) || [];
    return JSON.stringify(walksOf(raw).map(function (w) {
      var o = {};
      Object.keys(w || {}).forEach(function (k) { if (k !== 'route' && k !== 'stampRoute' && k !== 'photoKey') o[k] = w[k]; });
      var hit = [];
      (w.stampRoute || w.route || []).forEach(function (pt) {
        places.forEach(function (pl) {
          if (pl.pending || hit.indexOf(pl) >= 0 || !pl.center) return;
          var dLat = (pt[0] - pl.center[0]) * 111.32, dLng = (pt[1] - pl.center[1]) * 111.32 * Math.cos(pl.center[0] * Math.PI / 180);
          if (Math.sqrt(dLat * dLat + dLng * dLng) <= pl.radiusKm) hit.push(pl);
        });
      });
      o.route = [];
      o.stampRoute = hit.map(function (pl) { return [pl.center[0], pl.center[1]]; });
      return o;
    }));
  }
  // 사진(dataURL)을 긴 쪽 max px 이하로 줄인다. 못 줄이면 그대로
  function shrinkPhoto(u, max) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height));
        if (k >= 1) { resolve(u); return; }
        try {
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.82));
        } catch (e) { resolve(u); }
      };
      img.onerror = function () { resolve(u); };
      img.src = u;
    });
  }
  // 옮기기 주소 만들기 → { url, walks, photoDropped }
  function moveLink(baseUrl) {
    if (localStorage.getItem('petwalk_sample_mode') === '1') {
      return Promise.reject(new Error('지금은 샘플 기록을 보는 중이에요. [오늘]에서 "샘플 끄기"를 누른 뒤 옮겨 주세요.'));
    }
    var data = {};
    keys().forEach(function (k) { if (!MOVE_SKIP.test(k)) data[k] = localStorage.getItem(k); });
    if (data.petwalk_walks) data.petwalk_walks = lightWalks(data.petwalk_walks);
    // 프로필 사진(2026-11-18부터 맞춘 사진 최대 720px + 맞추기용 원본): 원본·맞춤은 주소에 넣지 않고, 맞춘 사진은 320px로 줄여 담는다
    // (예전 240px 사진만큼 가볍게 — 그대로 담으면 주소가 길어져 아래에서 사진이 통째로 빠지기 쉽다)
    var prep = Promise.resolve(), p0 = null;
    try { p0 = data.petwalk_profile && JSON.parse(data.petwalk_profile); } catch (e) { p0 = null; }
    if (p0 && typeof p0 === 'object') {
      delete p0.photoOrig; delete p0.photoFrame;
      if (typeof p0.photo === 'string' && p0.photo.indexOf('data:image/') === 0 && p0.photo.length > 60000) {
        prep = shrinkPhoto(p0.photo, 320).then(function (u) { p0.photo = u; });
      }
      prep = prep.then(function () { data.petwalk_profile = JSON.stringify(p0); });
    }
    var photoDropped = false;
    function build() {
      var obj = { app: 'walson', kind: 'move', v: 1, at: new Date().toISOString(), data: data, photos: {} };
      return signOf(obj).then(function (sig) {
        obj.sig = sig;
        return (baseUrl || location.href.split('#')[0]) + MOVE_PREFIX + b64urlEncode(JSON.stringify(obj));
      });
    }
    return prep.then(build).then(function (url) {
      if (url.length <= MOVE_MAX || !data.petwalk_profile) return url;
      try {   // 너무 길면 강아지 사진만 빼고 다시
        var p = JSON.parse(data.petwalk_profile) || {};
        if (!p.photo) return url;
        delete p.photo; data.petwalk_profile = JSON.stringify(p); photoDropped = true;
      } catch (e) { return url; }
      return build();
    }).then(function (url) {
      return { url: url, walks: walksOf(data.petwalk_walks).length, photoDropped: photoDropped };
    });
  }
  // 주소의 #walson-move=… 를 읽어 검증 → 옮겨 담기. 없으면 null
  // hash: 주소 대신 받은 글(2026-11-18 아이폰 홈 화면 앱 — 사파리에서 복사해 붙여넣은 '#walson-move=…'). 없으면 지금 주소
  function hasMoveLink(hash) { return (hash || location.hash).indexOf(MOVE_PREFIX) === 0; }
  function receiveMove(hash) {
    hash = hash || location.hash;
    if (!hasMoveLink(hash)) return Promise.resolve(null);
    var obj;
    try {
      obj = JSON.parse(b64urlDecode(hash.slice(MOVE_PREFIX.length)));
      if (!obj || obj.app !== 'walson' || obj.kind !== 'move' || !obj.data || !obj.sig) throw new Error('bad');
    } catch (e) { return Promise.reject(new Error('옮기기 주소가 잘려서 기록을 읽지 못했어요. 카톡 창에서 다시 눌러 주세요.')); }
    return signOf(obj).then(function (sig) {
      if (sig !== obj.sig) throw new Error('옮기기 주소 내용이 바뀌어서 불러오지 않았어요.');
      // 받는 쪽이 샘플을 보는 중이면 샘플부터 끈다(샘플 기록과 섞이지 않게, 샘플 전에 있던 내 기록은 살린다)
      var off = (window.PetwalkSample && PetwalkSample.isOn()) ? PetwalkSample.turnOff() : Promise.resolve();
      return off.then(function () {}, function () {});
    }).then(function () {
      // 예전에 만든 주소에 들어 있던 진행 중 산책 궤적 등은 받지 않는다(서명을 확인한 뒤에 걷어 낸다)
      Object.keys(obj.data).forEach(function (k) { if (MOVE_SKIP.test(k)) delete obj.data[k]; });
      var mine = walksOf(localStorage.getItem('petwalk_walks'));
      return importAll(obj, true, { moved: true }).then(function () { return { walks: walksOf(obj.data.petwalk_walks).length, hadOwn: mine.length }; });
    });
  }

  window.WalsonBackup = { exportAll: exportAll, read: read, summary: summary, importAll: importAll,
    moveLink: moveLink, hasMoveLink: hasMoveLink, receiveMove: receiveMove };
})();
