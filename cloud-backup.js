// 서버 백업(복구 코드) — 전역 window.WalsonCloud. (2026-11-23 가르시아 "supabase로 가자", "사진은 초기엔 빼고 퍼지면 하고")
// 왜: 기록은 이 휴대폰 브라우저에만 있어서 폰을 바꾸거나 사이트 데이터가 지워지면(아이폰 사파리는 7일 안 열면 지움) 되살릴 수 없다.
//   기기 번호로 묶는 백업은 기기 번호도 같이 사라져서 못 쓴다 → 사용자가 따로 보관하는 "복구 코드"로 묶는다. 회원 가입은 없다.
// 흐름: 사용자가 직접 켠다(동의 화면) → 복구 코드를 만들어 보여 줌 → 기록을 이 휴대폰에서 코드로 잠가(AES-GCM) Supabase에 올림.
//   켠 뒤엔 화면을 열 때 바뀐 게 있으면 자동으로 다시 올린다(끌 수 있음). 새 폰에선 코드를 넣어 내려받아 푼다.
// 올리는 것: 워킹패스(사진 빼고), 산책 기록(날짜·시간·거리·답·특이 사항), 산책마다 발도장을 받은 장소(지도에 공개된 발도장 장소의 가운데 점 —
//   backup.js 옮기기 주소와 같은 방식, 걸은 길·실제 좌표는 아님), 키링·꾸준함 등 앱 설정.
// 올리지 않는 것: 걸은 길·실제 좌표·내 핀·가게 방문 도장·진행 중 산책, 사진, 운영자 토큰, 샘플·통계 대기열, 이 복구 코드.
//   발도장 장소: 2026-11-23 위치정보지원센터에 가르시아가 물어봄 — "폰에서 잠가 운영자가 못 푸는, 이름·연락처 없는 백업이면 신고 필요 없다".
// 받는 곳: site-config.js cloudBackup { url, anonKey } — 비어 있으면 이 기능은 화면에 안 보이고 아무것도 보내지 않는다.
// 서버 쪽: docs/supabase-backup.sql(함수 셋 — 넣기·꺼내기·지우기, 표는 직접 못 읽음).
(function () {
  var KEY = 'walson_cloud';   // { code, auto, at(마지막 성공), sum(그때 내용 요약), consentAt }
  var ALPHA = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';   // 헷갈리는 0·1·I·O 뺌
  var SKIP = /^(petwalk_admin_token|petwalk_spot_draft|petwalk_sample_.*|walson_track_queue|walson_cloud|petwalk_location_explained|petwalk_pins|petwalk_visits|petwalk_active_walk|petwalk_active_route|petwalk_course_builder_state|petwalk_mock_db|petwalk_mock_server|petwalk_demo_.*|petwalk_infra_shown)$/;

  function cfg() { var c = window.WALSON_CONFIG && WALSON_CONFIG.cloudBackup; return c && c.url && c.anonKey ? c : null; }
  function state() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }
  function setState(s) { try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch (e) { /* 이번만 */ } }

  // ── 복구 코드: WALSON-XXXX-XXXX-XXXX-XXXX(80비트) ──
  function newCode() {
    var b = new Uint8Array(16), out = '';
    crypto.getRandomValues(b);
    for (var i = 0; i < 16; i++) out += ALPHA[b[i] & 31] + ((i % 4 === 3 && i < 15) ? '-' : '');
    return 'WALSON-' + out;
  }
  function normCode(s) {
    var t = String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/^WALSON/, '');
    if (t.length !== 16 || /[^2-9A-HJ-NP-Z]/.test(t)) return null;
    return 'WALSON-' + t.match(/.{4}/g).join('-');
  }
  var enc = new TextEncoder();
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function idOf(code) { return crypto.subtle.digest('SHA-256', enc.encode('walson-backup-id|' + code)).then(hex); }
  function keyOf(code) {
    return crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('walson-backup-key-v1'), iterations: 150000, hash: 'SHA-256' },
        base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function b64(bytes) { var s = ''; for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { var bin = atob(s), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
  function lock(code, text) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return keyOf(code).then(function (k) { return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, enc.encode(text)); })
      .then(function (ct) { return 'w1.' + b64(iv) + '.' + b64(new Uint8Array(ct)); });
  }
  function unlock(code, packed) {
    var p = String(packed || '').split('.');
    if (p[0] !== 'w1' || p.length !== 3) return Promise.reject(new Error('백업 형식을 읽지 못했어요.'));
    return keyOf(code).then(function (k) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(p[1]) }, k, unb64(p[2])); })
      .then(function (buf) { return new TextDecoder().decode(buf); }, function () { throw new Error('복구 코드가 맞지 않아요.'); });
  }

  // ── 올릴 내용(위치·사진 빼고) ──
  function payload() {
    var data = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (/^(petwalk_|walson_)/.test(k) && !SKIP.test(k)) data[k] = localStorage.getItem(k);
    }
    if (data.petwalk_walks) {
      // 발도장 장소를 알아야 하므로 장소 목록(reward-rules.js)이 없는 화면에서는 올리지 않는다(발도장 없는 백업으로 덮어쓰지 않게)
      var places = window.RewardRules && RewardRules.PLACES;
      if (!places || !places.length) return null;
      try {
        data.petwalk_walks = JSON.stringify((JSON.parse(data.petwalk_walks) || []).map(function (w) {
          var o = {}; Object.keys(w || {}).forEach(function (f) { if (f !== 'route' && f !== 'stampRoute' && f !== 'photoKey') o[f] = w[f]; });
          // 걸은 점 대신 '받은 발도장 장소의 가운데 점'만(되살리면 reward-rules.js가 같은 발도장으로 판정한다)
          var hit = [];
          (w && (w.stampRoute || w.route) || []).forEach(function (pt) {
            places.forEach(function (pl) {
              if (pl.pending || !pl.center || hit.indexOf(pl) >= 0) return;
              var dLat = (pt[0] - pl.center[0]) * 111.32, dLng = (pt[1] - pl.center[1]) * 111.32 * Math.cos(pl.center[0] * Math.PI / 180);
              if (Math.sqrt(dLat * dLat + dLng * dLng) <= pl.radiusKm) hit.push(pl);
            });
          });
          if (hit.length) o.stampRoute = hit.map(function (pl) { return [pl.center[0], pl.center[1]]; });
          return o;
        }));
      } catch (e) { delete data.petwalk_walks; }
    }
    if (data.petwalk_profile) {
      try { var p = JSON.parse(data.petwalk_profile) || {}; delete p.photo; delete p.photoOrig; delete p.photoFrame; data.petwalk_profile = JSON.stringify(p); } catch (e) { delete data.petwalk_profile; }
    }
    return data;
  }
  function summaryOf(data) { var s = JSON.stringify(data), h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ':' + h; }

  function rpc(name, args) {
    var c = cfg();
    if (!c) return Promise.reject(new Error('서버 백업이 아직 준비되지 않았어요.'));
    return fetch(c.url.replace(/\/$/, '') + '/rest/v1/rpc/' + name, {
      method: 'POST',
      // 새 공개 키(sb_publishable_…)는 apikey 머리말로만 — 예전 anon 키(JWT)일 때만 Authorization도 붙인다
      headers: /^sb_/.test(c.anonKey) ? { 'Content-Type': 'application/json', apikey: c.anonKey }
        : { 'Content-Type': 'application/json', apikey: c.anonKey, Authorization: 'Bearer ' + c.anonKey },
      body: JSON.stringify(args)
    }).then(function (r) {
      if (!r.ok) throw new Error('서버에 닿지 못했어요(' + r.status + '). 잠시 뒤 다시 해 주세요.');
      return r.json();
    }, function () { throw new Error('인터넷 연결을 확인해 주세요.'); });
  }

  function upload(code) {
    if (localStorage.getItem('petwalk_sample_mode') === '1') return Promise.reject(new Error('샘플 기록을 보는 중이라 백업하지 않았어요. 샘플을 끄고 다시 해 주세요.'));
    var data = payload();
    if (!data) return Promise.reject(new Error('잠시 뒤 다시 해 주세요(발도장 장소를 아직 못 읽었어요).'));
    var sum = summaryOf(data);
    var obj = { app: 'walson', kind: 'cloud', v: 1, at: new Date().toISOString(), data: data };
    return Promise.all([idOf(code), lock(code, JSON.stringify(obj))]).then(function (a) {
      return rpc('walson_backup_save', { p_id: a[0], p_data: a[1] });
    }).then(function () {
      var s = state() || {};
      s.code = code; s.at = obj.at; s.sum = sum;
      setState(s);
      var walks = 0; try { walks = (JSON.parse(data.petwalk_walks || '[]') || []).length; } catch (e) { walks = 0; }
      return { at: obj.at, walks: walks };
    });
  }

  var api = {
    available: function () { return !!cfg() && !!(window.crypto && crypto.subtle); },
    state: state,
    normCode: normCode,
    // 처음 켜기(동의 뒤) — 코드를 만들고 첫 백업. 실패하면 켜지 않는다
    enable: function () {
      var code = newCode();
      setState({ code: code, auto: true, consentAt: new Date().toISOString() });
      return upload(code).then(function (r) { r.code = code; return r; }, function (e) { setState(null); throw e; });
    },
    backupNow: function () { var s = state(); return s && s.code ? upload(s.code) : Promise.reject(new Error('서버 백업이 꺼져 있어요.')); },
    setAuto: function (on) { var s = state(); if (s) { s.auto = !!on; setState(s); } },
    // 서버에서 지우고 끄기
    disable: function () {
      var s = state();
      if (!s || !s.code) { setState(null); return Promise.resolve(); }
      return idOf(s.code).then(function (id) { return rpc('walson_backup_delete', { p_id: id }); }).then(function () { setState(null); });
    },
    // 코드로 꺼내기 → { obj(backup.js importAll이 받는 모양), at, walks, name }
    fetchByCode: function (raw) {
      var code = normCode(raw);
      if (!code) return Promise.reject(new Error('복구 코드를 다시 확인해 주세요(WALSON-으로 시작하는 16글자).'));
      return idOf(code).then(function (id) { return rpc('walson_backup_load', { p_id: id }); }).then(function (rows) {
        if (!rows || !rows.length) throw new Error('이 코드로 맡긴 백업이 없어요.');
        return unlock(code, rows[0].data);
      }).then(function (text) {
        var obj = JSON.parse(text), p = {};
        try { p = JSON.parse(obj.data.petwalk_profile || '{}') || {}; } catch (e) { p = {}; }
        var walks = 0; try { walks = (JSON.parse(obj.data.petwalk_walks || '[]') || []).length; } catch (e) { walks = 0; }
        return { code: code, obj: { app: 'walson', kind: 'backup', v: 2, at: obj.at, data: obj.data, photos: {} }, at: obj.at, walks: walks, name: p.name || '' };
      });
    },
    // 되살린 뒤 같은 코드로 계속 백업(되살리기는 이 기기 기록을 바꾸며 이 칸도 지워지므로 다시 적는다)
    adopt: function (code) { setState({ code: code, auto: true, consentAt: new Date().toISOString(), at: null, sum: null, saved: true }); },
    // 복구 코드를 보관했다고 누름(11/23 — 안 챙기면 백업이 있어도 못 찾으니, 누를 때까지 [오늘]에 한 줄로 알린다)
    markSaved: function () { var s = state(); if (s) { s.saved = true; setState(s); } },
    // [오늘] 맨 위 한 줄: 켰는데 코드 보관을 아직 안 눌렀으면
    remind: function (before) {
      var s = state();
      if (!api.available() || !s || !s.code || s.saved || !before || !before.parentNode) return;
      var a = document.createElement('a');
      a.href = 'profile.html#cloud';
      a.style.cssText = 'display:block;margin:0 0 12px;padding:10px 14px;border-radius:14px;border:1.5px dashed var(--accent);background:var(--panel);color:var(--ink);font-size:13px;font-weight:800;text-decoration:none;line-height:1.5;';
      a.textContent = '복구 코드를 보관하셨나요? 코드가 없으면 서버 백업을 되찾을 수 없어요 — [프로필]에서 보기';
      before.parentNode.insertBefore(a, before);
    },
    // 화면을 열 때: 켜져 있고 자동이고 내용이 바뀌었으면 조용히 올린다(10분에 한 번까지)
    autoSync: function () {
      var s = state();
      if (!api.available() || !s || !s.code || s.auto === false) return;
      if (localStorage.getItem('petwalk_sample_mode') === '1') return;
      var last = Number(sessionStorage.getItem('walson_cloud_try') || 0);
      if (Date.now() - last < 10 * 60 * 1000) return;
      var pl = payload();
      if (!pl || summaryOf(pl) === s.sum) return;
      try { sessionStorage.setItem('walson_cloud_try', String(Date.now())); } catch (e) { /* 그대로 */ }
      upload(s.code).catch(function () { /* 다음에 다시 */ });
    }
  };
  window.WalsonCloud = api;
  if (document.readyState === 'complete') setTimeout(api.autoSync, 1500);
  else window.addEventListener('load', function () { setTimeout(api.autoSync, 1500); });
})();
