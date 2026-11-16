// 가게 방문 도장 읽기 + 가게까지 걸어서 몇 분(2026-11-15) — 전역 window.ShopVisits.
//
// 방문 도장은 가게 카운터의 체크인 QR(checkin-qr.html이 인쇄)을 찍으면 visit.html이 남긴다:
//   localStorage petwalk_visits = [{ s: 스팟 id, d: 'YYYY-MM-DD' }] — 같은 가게는 하루 한 번. 위치는 읽지 않는다.
// 이 파일은 그 기록을 읽어 [동네] 지도에 "단골 Lv"로 보여 준다(기획표 B-34): 처음 1번 Lv1, 그 뒤 5번마다 Lv가 오른다.
// 처음엔 [동네]에서 위치로 가게 근처인지 확인해 찍는 방식도 만들었으나, 같은 날 다른 세션이 만든 QR 방문 도장과
// 겹쳐서 QR 하나로 정리했다(방문 확인은 GPS보다 가게에서 직접 찍는 쪽이 정확하고 위치도 안 읽는다).
// 보상은 아직 없다 — 가게가 "몇 Lv부터 무엇을" 정하면 그때 붙인다(기획표 V3 혜택은 보류 중).
// 2026-11-16: 도장 찍기(stamp)도 여기로 모았다 — visit.html과 앱 안 QR 찍기(qr-scan.js, [동네]·산책 화면)가 같이 쓴다.
(function () {
  var KEY = 'petwalk_visits';
  var LEVEL_STEP = 5;   // 5번마다 Lv가 오른다

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function level(n) { return n > 0 ? 1 + Math.floor(n / LEVEL_STEP) : 0; }

  // { count: 도장 찍은 날 수, level, toNext: 다음 Lv까지 남은 횟수, today: 오늘 찍었는지 }
  function info(id) {
    var days = {};
    load().forEach(function (v) { if (v && v.s === id && v.d) days[v.d] = true; });
    var n = Object.keys(days).length;
    return { count: n, level: level(n), toNext: LEVEL_STEP - (n % LEVEL_STEP), today: !!days[todayKey()] };
  }

  // 두 점 [lat, lng] 사이 거리(m)
  function distanceM(a, b) {
    var R = 6371000, t = Math.PI / 180;
    var dLat = (b[0] - a[0]) * t, dLng = (b[1] - a[1]) * t;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // 걸어서 몇 분인지 어림(기획표 B-49) — 길이 아니라 직선 거리에 1.3배를 곱하고, 강아지와 걷는 속도(분당 60m)로 나눈다.
  // 길찾기 서버(OSRM 등)에 내 위치를 보내지 않으려고 이 휴대폰 안에서만 계산한다(11/14 추천 루트를 숨긴 이유와 같음).
  var DETOUR = 1.3, M_PER_MIN = 60;
  function walkMinutes(distM) { return Math.max(1, Math.round(distM * DETOUR / M_PER_MIN)); }
  function walkText(distM) {
    var m = walkMinutes(distM);
    if (m > 90) return '걸어서 가기엔 멀어요';
    if (m >= 60) return '걸어서 약 1시간' + (m > 60 ? ' ' + (m - 60) + '분' : '');
    return '걸어서 약 ' + m + '분';
  }
  function distText(distM) {
    return distM < 1000 ? Math.round(distM / 10) * 10 + 'm' : (distM / 1000).toFixed(1) + 'km';
  }

  // ── 방문 도장 찍기(2026-11-16) — visit.html(휴대폰 카메라로 찍고 들어온 경우)과 앱 안 QR 찍기(qr-scan.js)가 같이 쓴다 ──
  // 같은 가게는 하루 한 번. 통계는 가게 번호만(store_visit, 하루 한 번). 위치는 읽지 않는다.
  // 돌려주는 것: { already: 오늘 이미 찍었는지, saved, times: 이 가게 방문 날 수, level, lvUp: 이번에 Lv가 올랐는지 }
  function stamp(id) {
    var today = todayKey(), visits = load();
    var already = visits.some(function (v) { return v && v.s === id && v.d === today; });
    var saved = true;
    if (!already) {
      visits.push({ s: id, d: today });
      try { localStorage.setItem(KEY, JSON.stringify(visits)); } catch (e) { saved = false; }
      if (saved && window.WalsonTrack) WalsonTrack.send('store_visit', { shop: id });
    }
    var times = visits.filter(function (v) { return v && v.s === id; }).length;
    var lv = level(times);
    return { already: already, saved: saved, times: times, level: lv, lvUp: !already && times > 1 && lv > level(times - 1) };
  }
  // "이 가게 첫 방문 · 단골 Lv1 달성" 같은 한 줄
  function countText(r) {
    return (r.times > 1 ? '이 가게 방문 ' + r.times + '번째' : '이 가게 첫 방문') +
      (r.level ? ' · 단골 Lv' + r.level + (r.lvUp || r.times === 1 ? ' 달성' : '') : '');
  }
  // 등록된 동반 스팟(체크인 QR이 붙는 가게)인지 — infra-pins.js가 있어야 한다
  function findShop(id) {
    if (!id || !window.InfraPins) return null;
    return InfraPins.all().filter(function (p) { return p.id === id && p.cat === 'spot'; })[0] || null;
  }
  // 찍은 QR 글자 → 가게 번호. 우리 주소의 visit.html?s=… 일 때만(checkin-qr.html이 인쇄하는 모양), 아니면 null
  var HOSTS = ['johnsongarage.co.kr', 'www.johnsongarage.co.kr', 'kery27.github.io'];
  function idFromQr(text) {
    var u;
    try { u = new URL(String(text || '').trim(), location.href); } catch (e) { return null; }
    if (!/\/visit\.html$/.test(u.pathname)) return null;
    if (u.host !== location.host && HOSTS.indexOf(u.hostname) < 0) return null;
    return u.searchParams.get('s') || null;
  }

  window.ShopVisits = {
    KEY: KEY, LEVEL_STEP: LEVEL_STEP, info: info, level: level, todayKey: todayKey,
    distanceM: distanceM, walkMinutes: walkMinutes, walkText: walkText, distText: distText,
    stamp: stamp, countText: countText, findShop: findShop, idFromQr: idFromQr
  };
})();
