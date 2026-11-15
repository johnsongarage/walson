// 기록 옮기기(2026-11-15, hq 개발 후보). 전역 window.WalsonBackup.
// 왜: 카톡·크롬 창과 홈 화면에 설치한 왈슨은 저장 공간이 따로라서, 설치하면 주민증·산책 기록이 안 넘어간다.
// 서버 없이 "파일로 내보내기 → 다른 곳에서 불러오기"로 옮긴다. 파일은 사용자가 직접 갖고 다니고 어디로도 올리지 않는다.
// 담는 것: 이 사이트의 왈슨 기록(petwalk_*, walson_*)과 산책 사진(오늘의 한 장).
// 빼는 것: 운영자 토큰·스팟 편집 초안(운영자 기기 정보), 샘플 모드 자료(지어낸 기록), 통계 대기열.
(function () {
  var SKIP = /^(petwalk_admin_token|petwalk_spot_draft|petwalk_sample_.*|walson_track_queue)$/;
  var ARRAY_MERGE = {   // 합치기 때 겹침을 가리는 기준
    petwalk_walks: function (w) { return [w.date, w.durationMin, w.distanceKm || 0, w.photoKey || ''].join('|'); },
    petwalk_pins: function (p) { return p.id || [p.lat, p.lng, p.memo].join('|'); },
    petwalk_visits: function (v) { return v.s + '|' + v.d; }
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
    return Promise.all(jobs).then(function () {
      var obj = { app: 'walson', kind: 'backup', v: 1, at: new Date().toISOString(), data: data, photos: photos };
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
          res(obj);
        } catch (e) { rej(new Error(e.message.indexOf('왈슨') >= 0 ? e.message : '파일을 읽지 못했어요(왈슨 기록 파일인지 확인해 주세요).')); }
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
  function importAll(obj, merge) {
    var data = obj.data || {}, failed = false;
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
    if (failed) return Promise.reject(new Error('이 휴대폰 저장 공간이 부족해서 일부를 불러오지 못했어요.'));
    var photos = obj.photos || {};
    var jobs = Object.keys(photos).map(function (k) {
      var b = dataUrlToBlob(photos[k]);
      return (b && window.WalkPhotos) ? WalkPhotos.put(k, b).catch(function () { /* 사진 하나 실패해도 계속 */ }) : null;
    });
    return Promise.all(jobs);
  }

  window.WalsonBackup = { exportAll: exportAll, read: read, summary: summary, importAll: importAll };
})();
