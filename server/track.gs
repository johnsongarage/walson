/**
 * 왈슨 사용 통계 받기 — Google Apps Script (2026-11-15)
 * 이 파일을 운영자의 구글 시트 > 확장 프로그램 > Apps Script 에 통째로 붙여 넣고 웹 앱으로 배포한다.
 * 설치 순서는 저장소 docs/TRACKING.md.
 *
 * 앱(track.js)이 보내는 것: 무작위 기기 번호, 시각, 이벤트 이름, 화면, 유입 코드, 홈 화면 앱인지,
 *   샘플·운영자 표시, 이벤트별 작은 값(걸은 시간 구간, 새 발도장 개수 등). 위치·이름·사진은 오지 않는다.
 * 시트:
 *   log   — 받은 그대로 한 줄씩(원본)
 *   요약  — refreshDashboard()가 log로 계산(일별·유입별·재방문). 1시간마다 자동 실행되게 트리거를 건다.
 */

var LOG_SHEET = 'log';
var DASH_SHEET = '요약';
var TZ = 'Asia/Seoul';
var EVENTS = ['page_view', 'card_made', 'card_saved', 'walk_start', 'walk_complete', 'stamp_new',
              'keyring_given', 'walk_type_done', 'share_click', 'store_visit'];
var HEADER = ['받은 시각', '날짜', '기기', '이벤트', '화면', '유입', '첫 유입', '홈화면앱', '샘플', '운영자', '값'];

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '';
    if (raw.length > 2000) return ok_();
    var m = JSON.parse(raw);
    if (!m || EVENTS.indexOf(m.e) < 0 || !/^w[0-9a-f]{8,20}$/.test(String(m.d || ''))) return ok_();

    // 한 기기가 1분에 60번 넘게 보내면 버린다(오작동·장난 방지)
    var cache = CacheService.getScriptCache();
    var key = 'n_' + m.d;
    var n = Number(cache.get(key) || 0) + 1;
    cache.put(key, String(n), 60);
    if (n > 60) return ok_();

    var now = new Date();
    var clean = function (v, len) { return String(v == null ? '' : v).replace(/[^0-9A-Za-z_\-가-힣<+.]/g, '').slice(0, len || 30); };
    var extra = {};
    if (m.x && typeof m.x === 'object') Object.keys(m.x).slice(0, 5).forEach(function (k) { extra[clean(k, 15)] = clean(m.x[k], 20); });

    sheet_(LOG_SHEET, HEADER).appendRow([
      now,
      Utilities.formatDate(now, TZ, 'yyyy-MM-dd'),
      m.d, m.e, clean(m.p), clean(m.f), clean(m.ff),
      m.app ? 1 : 0, m.s ? 1 : 0, m.a ? 1 : 0,
      Object.keys(extra).length ? JSON.stringify(extra) : ''
    ]);
  } catch (err) {
    // 통계는 실패해도 앱에는 영향 없음
  }
  return ok_();
}

function doGet() { return ok_(); }

function ok_() { return ContentService.createTextOutput('ok'); }

function sheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (header && sh.getLastRow() === 0) { sh.appendRow(header); sh.setFrozenRows(1); }
  return sh;
}

/**
 * 요약 시트 다시 계산 — 샘플 모드·운영자 기기 줄은 뺀다.
 *  1) 일별: 방문 기기, 새 기기, 다시 온 기기, 주민증 만든 수, 산책 시작/완료 기기, 길 기록 산책, 새 발도장, 키링
 *  2) 유입별(첫 유입 기준): 기기 수 → 주민증 → 산책 완료 → 7일 뒤에도 옴
 *  3) 재방문율: 첫 방문 뒤 1일·7일·14일·30일 안에 다른 날 다시 온 기기 비율(그만큼 시간이 지난 기기만)
 */
function refreshDashboard() {
  // 자동(1시간)과 손으로 누른 실행이 겹치면 요약을 두 번 지웠다 쓰므로 한 번에 하나만. doPost는 appendRow가 원자적이라 잠그지 않는다.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try { refreshDashboard_(); } finally { lock.releaseLock(); }
}
function refreshDashboard_() {
  var log = sheet_(LOG_SHEET, HEADER);
  var rows = log.getLastRow() > 1 ? log.getRange(2, 1, log.getLastRow() - 1, HEADER.length).getValues() : [];
  rows = rows.filter(function (r) { return !r[8] && !r[9]; });

  var dev = {};            // 기기 → { first, days:{}, from, card, walk }
  var shops = {};          // 가게(스팟 번호) → { dev:{기기:방문 날 수}, month:{기기:1}, first:{기기:1}, days:{} }
  var thisMonth = Utilities.formatDate(new Date(), TZ, 'yyyy-MM');
  var SIZE_LABEL = { small: '소형', medium: '중형', large: '대형', unknown: '고르지 않음' };
  var sizes = {};          // 주민증 만들 때 고른 크기 합계
  var months = {};         // 'yyyy-MM' → 월간 리포트 재료
  function M(date) {
    var k = date.slice(0, 7);
    return months[k] || (months[k] = { visit: {}, fresh: {}, card: 0, walks: 0, walkers: {}, shopDev: {}, size: {} });
  }
  var day = {};            // 날짜 → 집계
  function D(d) {
    return day[d] || (day[d] = { visit: {}, fresh: 0, back: {}, card: 0, wstart: {}, wdone: {}, gps: 0, stamp: 0, key: 0 });
  }
  rows.sort(function (a, b) { return a[0] - b[0]; });
  rows.forEach(function (r) {
    var date = typeof r[1] === 'string' ? r[1] : Utilities.formatDate(new Date(r[1]), TZ, 'yyyy-MM-dd');
    var id = r[2], ev = r[3], extra = {};
    try { extra = r[10] ? JSON.parse(r[10]) : {}; } catch (e) { extra = {}; }
    var g = dev[id];
    if (!g) { g = dev[id] = { first: date, days: {}, from: r[6] || r[5] || '(없음)', card: false, walk: false }; D(date).fresh++; }
    if (!g.days[date] && date !== g.first) D(date).back[id] = 1;
    g.days[date] = 1;
    var d = D(date);
    d.visit[id] = 1;
    if (ev === 'card_made') {
      d.card++; g.card = true;
      var sz = SIZE_LABEL[extra.size] ? extra.size : 'unknown';
      sizes[sz] = (sizes[sz] || 0) + 1;
      M(date).card++; M(date).size[sz] = (M(date).size[sz] || 0) + 1;
    }
    var mo = M(date);
    mo.visit[id] = 1;
    if (ev === 'walk_complete') { mo.walks++; mo.walkers[id] = 1; }
    if (ev === 'store_visit' && extra.shop) { mo.shopDev[extra.shop + '|' + id] = 1; }
    if (g.first.slice(0, 7) === date.slice(0, 7)) mo.fresh[id] = 1;
    if (ev === 'walk_start') d.wstart[id] = 1;
    if (ev === 'walk_complete') { d.wdone[id] = 1; g.walk = true; if (extra.mode === 'gps') d.gps++; }
    if (ev === 'stamp_new') d.stamp += Number(extra.count || 1);
    if (ev === 'keyring_given') d.key++;
    if (ev === 'store_visit' && extra.shop) {
      var sp = shops[extra.shop] || (shops[extra.shop] = { dev: {}, month: {}, newcomer: {}, days: {} });
      sp.dev[id] = (sp.dev[id] || 0) + 1;
      sp.days[date] = 1;
      if (date.slice(0, 7) === thisMonth) sp.month[id] = 1;
      if (String(g.from).indexOf('visit_') === 0) sp.newcomer[id] = 1;   // 이 가게 QR로 왈슨을 처음 알게 됨
    }
  });

  var out = [['일별 (샘플·운영자 기기 제외)'],
    ['날짜', '방문 기기', '새 기기', '다시 온 기기', '주민증 만듦', '산책 시작 기기', '산책 완료 기기', '길 기록 산책', '새 발도장', '키링']];
  Object.keys(day).sort().reverse().forEach(function (k) {
    var d = day[k];
    out.push([k, Object.keys(d.visit).length, d.fresh, Object.keys(d.back).length, d.card,
      Object.keys(d.wstart).length, Object.keys(d.wdone).length, d.gps, d.stamp, d.key]);
  });

  // 유입별
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
  function cameBackWithin(g, n) {
    return Object.keys(g.days).some(function (d) { var x = daysBetween(g.first, d); return x >= 1 && x <= n; });
  }
  var src = {};
  Object.keys(dev).forEach(function (id) {
    var g = dev[id], s = src[g.from] || (src[g.from] = { n: 0, card: 0, walk: 0, old7: 0, back7: 0 });
    s.n++; if (g.card) s.card++; if (g.walk) s.walk++;
    if (daysBetween(g.first, today) >= 7) { s.old7++; if (cameBackWithin(g, 7)) s.back7++; }
  });
  out.push([''], ['유입별 (처음 들어온 경로 기준)'], ['유입 코드', '기기', '주민증 만듦', '산책 완료', '7일 지난 기기', '그중 7일 안에 다시 옴', '7일 재방문율']);
  Object.keys(src).sort(function (a, b) { return src[b].n - src[a].n; }).forEach(function (k) {
    var s = src[k];
    out.push([k, s.n, s.card, s.walk, s.old7, s.back7, s.old7 ? Math.round(s.back7 / s.old7 * 100) + '%' : '-']);
  });

  // 재방문율
  out.push([''], ['재방문율 (첫 방문 뒤 N일 안에 다른 날 다시 온 기기, N일이 지난 기기만 셈)'], ['기간', '대상 기기', '다시 온 기기', '비율', '그중 주민증 만든 기기의 비율']);
  [1, 7, 14, 30].forEach(function (n) {
    var base = 0, back = 0, cbase = 0, cback = 0;
    Object.keys(dev).forEach(function (id) {
      var g = dev[id];
      if (daysBetween(g.first, today) < n) return;
      base++; var b = cameBackWithin(g, n); if (b) back++;
      if (g.card) { cbase++; if (b) cback++; }
    });
    out.push([n + '일', base, back, base ? Math.round(back / base * 100) + '%' : '-', cbase ? Math.round(cback / cbase * 100) + '%' : '-']);
  });
  // 가게 방문(체크인 QR) — 제휴 가게에 보여 줄 숫자
  out.push([''], ['가게 방문 (카운터 체크인 QR, 기기 기준 · 같은 기기는 하루 한 번)'],
    ['가게(스팟 번호)', '방문한 기기', '방문 횟수(기기×날)', '두 번 이상 온 기기', '이번 달 방문 기기', '이 QR로 왈슨을 처음 안 기기', '방문 있었던 날 수']);
  Object.keys(shops).forEach(function (k) {
    var sp = shops[k], ids = Object.keys(sp.dev);
    out.push([k, ids.length, ids.reduce(function (s, i) { return s + sp.dev[i]; }, 0),
      ids.filter(function (i) { return sp.dev[i] >= 2; }).length, Object.keys(sp.month).length,
      Object.keys(sp.newcomer).length, Object.keys(sp.days).length]);
  });
  if (!Object.keys(shops).length) out.push(['아직 없음']);

  // 강아지 크기(주민증 기준)
  var sizeTotal = Object.keys(sizes).reduce(function (a, k) { return a + sizes[k]; }, 0);
  out.push([''], ['강아지 크기 (주민증 만들 때 고른 것)'], ['크기', '주민증 수', '비율(고른 것 중)']);
  var chosen = sizeTotal - (sizes.unknown || 0);
  ['small', 'medium', 'large', 'unknown'].forEach(function (k) {
    if (!sizes[k]) return;
    out.push([SIZE_LABEL[k], sizes[k], k === 'unknown' ? '-' : (chosen ? Math.round(sizes[k] / chosen * 100) + '%' : '-')]);
  });
  if (!sizeTotal) out.push(['아직 없음']);

  out.push([''], ['마지막 계산: ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm')]);

  var width = 10;
  out = out.map(function (r) { while (r.length < width) r.push(''); return r; });
  var dash = sheet_(DASH_SHEET);
  dash.clearContents();
  dash.getRange(1, 1, out.length, width).setValues(out);
  writeMonthly_(months, dev, SIZE_LABEL, daysBetween);
}

/**
 * 월간 리포트 시트 — 제휴 가게에 보여 줄 한 달 숫자(합계만, 기기 기준 추정). 최근 달이 위.
 * 다음 달 재방문: 그 달에 처음 온 기기 중 다음 달에도 온 비율.
 */
function writeMonthly_(months, dev, SIZE_LABEL, daysBetween) {
  var keys = Object.keys(months).sort().reverse();
  var out = [['월간 리포트 (샘플·운영자 기기 제외, 기기 기준 추정 — 제휴 가게에는 이 합계만)'],
    ['달', '방문 기기', '새로 온 기기', '새 주민증', '산책한 기기', '산책 수', '가게 방문(기기·가게)', '다음 달에도 온 비율(새 기기)', '크기: 소/중/대']];
  keys.forEach(function (k) {
    var mo = months[k];
    var y = Number(k.slice(0, 4)), m = Number(k.slice(5, 7));
    var next = (m === 12 ? (y + 1) + '-01' : y + '-' + ('0' + (m + 1)).slice(-2));
    var fresh = Object.keys(mo.fresh), back = 0;
    var nextMo = months[next];
    fresh.forEach(function (id) { if (nextMo && nextMo.visit[id]) back++; });
    var ret = nextMo ? (fresh.length ? Math.round(back / fresh.length * 100) + '%' : '-') : '(다음 달 전)';
    var sz = mo.size;
    out.push([k, Object.keys(mo.visit).length, fresh.length, mo.card, Object.keys(mo.walkers).length, mo.walks,
      Object.keys(mo.shopDev).length, ret, (sz.small || 0) + '/' + (sz.medium || 0) + '/' + (sz.large || 0)]);
  });
  if (!keys.length) out.push(['아직 없음']);
  var width = 9;
  out = out.map(function (r) { while (r.length < width) r.push(''); return r; });
  var sh = sheet_('월간 리포트');
  sh.clearContents();
  sh.getRange(1, 1, out.length, width).setValues(out);
}

/** 처음 한 번 실행: 1시간마다 refreshDashboard가 돌게 트리거를 건다 */
function installHourlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshDashboard') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('refreshDashboard').timeBased().everyHours(1).create();
  refreshDashboard();
}

/** 보관 기간: 400일이 지난 log 줄을 지운다(개인정보 안내의 보관 기간과 맞춤). 필요하면 월 1회 트리거로 */
function deleteOldRows() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try { deleteOldRows_(); } finally { lock.releaseLock(); }
}
function deleteOldRows_() {
  var log = sheet_(LOG_SHEET, HEADER);
  var last = log.getLastRow();
  if (last < 2) return;
  var cutoff = new Date(Date.now() - 400 * 86400000);
  var dates = log.getRange(2, 1, last - 1, 1).getValues();
  var n = 0;
  while (n < dates.length && new Date(dates[n][0]) < cutoff) n++;
  if (n) log.deleteRows(2, n);
}
