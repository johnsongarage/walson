// 시연 모드(가짜 위치) — 2026-11-14, 기획표 V0-08 / 2026-11-15 버튼·랜덤 걷기·배속 추가.
// 공원 현장 시연, 화면 캡처, 방송, 개발 시험에서 실제 위치(특히 집 근처)가 화면에 나오지 않게 한다.
// CLAUDE.md "개인정보 취급": 스크린샷이 필요하면 가짜 경로로 만든다 — 그 가짜 경로를 만들어 주는 파일.
//
// 켜는 법: 산책 화면 메뉴의 "시연 모드(가짜 위치)" 또는 주소 뒤 ?demo=1 (끄기: 화면 배지의 "끄기" 또는 ?demo=0).
// 켜져 있는 동안 이 탭에서는 navigator.geolocation이 진짜 GPS 대신 가짜 좌표를 돌려준다. 진짜 위치는 읽지 않는다.
//  - 경로: "랜덤"(다산중앙공원에서 출발해 방향을 조금씩 틀며 걷기, 1km 밖으로 나가면 돌아옴) / "공원 둘레"(원래 고리)
//  - 배속: ×1·×5·×10·×30 — 위치뿐 아니라 시계(PetwalkDemoGeo.now)도 같은 배로 흐른다. 그래서 10배속으로 3분 돌리면
//    30분·보통 걸음 속도의 산책으로 기록된다(빠른 이동으로 걸러지지 않음). walk.html이 산책 시간을 이 시계로 잰다.
// 탭을 닫으면 꺼진다(sessionStorage). 경로·배속 고른 것은 기억한다(localStorage). walk.html·town.html에서 먼저 불러야 한다.
(function () {
  var KEY = 'petwalk_demo_geo';
  var SPEED_KEY = 'petwalk_demo_speed';
  var PATH_KEY = 'petwalk_demo_path';
  var SPEEDS = [1, 5, 10, 30];
  var m = /[?&]demo=([01])/.exec(location.search);
  try {
    if (m) {
      if (m[1] === '1') sessionStorage.setItem(KEY, '1'); else sessionStorage.removeItem(KEY);
    }
  } catch (e) { /* sessionStorage를 못 쓰면 주소의 ?demo=1 만으로 판단 */ }
  var on = false;
  try { on = sessionStorage.getItem(KEY) === '1'; } catch (e) { on = !!(m && m[1] === '1'); }
  function get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 무시 */ } }

  var speed = Number(get(SPEED_KEY, '1')); if (SPEEDS.indexOf(speed) < 0) speed = 1;
  var path = get(PATH_KEY, 'random') === 'loop' ? 'loop' : 'random';

  // ── 배속 시계: 실제로 흐른 시간 × 배속을 쌓는다(배속을 바꿔도 시간이 튀지 않게) ──
  var simNow = Date.now(), lastReal = Date.now();
  function now() {
    var r = Date.now();
    simNow += (r - lastReal) * speed;
    lastReal = r;
    return simNow;
  }

  window.PetwalkDemoGeo = {
    on: on, now: function () { return on ? now() : Date.now(); },
    speed: function () { return speed; },
    // 켜기/끄기(다시 불러서 진짜·가짜 위치를 바꾼다)
    enable: function () { try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* 무시 */ } location.reload(); },
    disable: function () { try { sessionStorage.removeItem(KEY); } catch (e) { /* 무시 */ } location.href = location.pathname; }
  };
  if (!on || !navigator.geolocation) return;

  // 다산중앙공원(공용 시설, OpenStreetMap 중심점) — 누구의 실제 위치도 아니다.
  var CENTER = [37.6233046, 127.1596196];
  var WALK_MPS = 1.2;                         // 강아지 산책 걸음(배속 시계 기준)
  var M_LAT = 111320, M_LNG = 111320 * Math.cos(CENTER[0] * Math.PI / 180);

  // 공원 둘레 고리
  var RADIUS_M = 130, loopStart = now();
  function loopPos(t) {
    var s = (t - loopStart) / 1000, ang = (WALK_MPS * s) / RADIUS_M, r = RADIUS_M + 6 * Math.sin(s / 7);
    return [CENTER[0] + (r * Math.sin(ang)) / M_LAT, CENTER[1] + (r * Math.cos(ang)) / M_LNG];
  }
  // 랜덤 걷기: 방향을 조금씩 틀며 걷고, 1km 밖이면 공원 쪽으로 돈다
  var rw = { x: 0, y: 0, h: Math.random() * Math.PI * 2, t: now() };
  function randomPos(t) {
    var dt = Math.max(0, (t - rw.t) / 1000);
    rw.t = t;
    var steps = Math.max(1, Math.ceil(dt / 2));        // 2초(배속 시계)마다 한 번씩 방향을 조금 튼다
    for (var i = 0; i < steps; i++) {
      var d = WALK_MPS * dt / steps;
      rw.h += (Math.random() - 0.5) * 0.5;
      var dist = Math.sqrt(rw.x * rw.x + rw.y * rw.y);
      if (dist > 1000) {                              // 공원 쪽으로 방향을 돌린다
        var back = Math.atan2(-rw.y, -rw.x);
        rw.h += Math.atan2(Math.sin(back - rw.h), Math.cos(back - rw.h)) * 0.3;
      }
      rw.x += Math.cos(rw.h) * d; rw.y += Math.sin(rw.h) * d;
    }
    return [CENTER[0] + rw.y / M_LAT, CENTER[1] + rw.x / M_LNG];
  }
  function fakePosition() {
    var t = now();
    var p = path === 'loop' ? loopPos(t) : randomPos(t);
    return {
      coords: { latitude: p[0], longitude: p[1], accuracy: 8, altitude: null, altitudeAccuracy: null, heading: null, speed: WALK_MPS },
      timestamp: t
    };
  }

  // 배속이 높으면 실제로 더 자주 점을 찍는다(한 점 사이가 너무 멀어 길이 각지지 않게)
  function tickMs() { return Math.round(1000 / Math.min(speed, 10)); }
  var watchers = {}, nextId = 1, geo = navigator.geolocation;
  function startTimer(id) {
    clearInterval(watchers[id].timer);
    watchers[id].timer = setInterval(function () { if (watchers[id]) watchers[id].cb(fakePosition()); }, tickMs());
  }
  var fake = {
    getCurrentPosition: function (success) { setTimeout(function () { if (success) success(fakePosition()); }, 150); },
    watchPosition: function (success) {
      var id = nextId++;
      watchers[id] = { cb: success, timer: null };
      setTimeout(function () { if (watchers[id] && success) success(fakePosition()); }, 150);
      startTimer(id);
      return id;
    },
    clearWatch: function (id) { if (watchers[id]) { clearInterval(watchers[id].timer); delete watchers[id]; } }
  };
  // 브라우저에 따라 메서드가 프로토타입에만 있어 대입이 막힐 수 있으니 defineProperty로 덮는다
  ['getCurrentPosition', 'watchPosition', 'clearWatch'].forEach(function (name) {
    try {
      Object.defineProperty(geo, name, { value: fake[name], configurable: true, writable: true });
    } catch (e) {
      try { geo[name] = fake[name]; } catch (e2) { window.PetwalkDemoGeo.on = false; }
    }
  });

  // 화면에 "가짜 위치"임을 항상 표시 + 경로·배속 바꾸기 — 시연 화면을 본 사람이 실제 위치로 오해하지 않게.
  function addBadge() {
    var badge = document.createElement('div');
    badge.setAttribute('role', 'status');
    badge.id = 'demo-badge';
    // 위쪽 칩 줄 바로 아래 왼쪽 — 가운데의 파란 점(지금 위치)과 아래쪽 산책 버튼을 가리지 않게
    badge.style.cssText = 'position:fixed;left:8px;top:132px;z-index:9999;display:flex;flex-direction:column;gap:6px;' +
      'background:#4a3f35;color:#fff;border-radius:14px;padding:8px;' +
      'font:700 12px Pretendard,-apple-system,"Malgun Gothic",sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
    var btnCss = 'border:none;border-radius:999px;background:#fff;color:#4a3f35;font:800 12px Pretendard,-apple-system,sans-serif;padding:5px 9px;cursor:pointer;';
    function btn(text, fn) { var b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.style.cssText = btnCss; b.addEventListener('click', fn); return b; }
    var title = document.createElement('span'); title.textContent = '시연 모드 · 가짜 위치';
    var speedBtn = btn('', function () {
      speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
      now();   // 지금까지의 시간은 예전 배속으로 정산
      set(SPEED_KEY, String(speed));
      Object.keys(watchers).forEach(startTimer);
      paint();
    });
    var pathBtn = btn('', function () {
      path = path === 'loop' ? 'random' : 'loop';
      set(PATH_KEY, path);
      if (path === 'random') { rw = { x: 0, y: 0, h: Math.random() * Math.PI * 2, t: now() }; } else loopStart = now();
      paint();
    });
    var off = btn('끄기', function () { window.PetwalkDemoGeo.disable(); });
    function paint() { speedBtn.textContent = '×' + speed + ' 배속'; pathBtn.textContent = path === 'loop' ? '공원 둘레' : '랜덤 걷기'; }
    paint();
    var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';
    row.appendChild(speedBtn); row.appendChild(pathBtn); row.appendChild(off);
    badge.appendChild(title); badge.appendChild(row);
    document.body.appendChild(badge);
  }
  if (document.body) addBadge(); else document.addEventListener('DOMContentLoaded', addBadge);
})();
