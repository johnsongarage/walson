// 꾸준함 도장 그리기(2026-11-15) — [오늘](index.html)·산책 끝(walk-end.html)·[카드](my-card.html)가 같이 쓴다.
// 전역 window.SteadyStamp. 계산은 reward-rules.js의 RewardRules.steady(walks)가 하고, 여기서는 모양만 만든다.
// 화면마다 CSS를 복사하지 않으려고 처음 한 번 <style>을 넣는다(tabbar.js와 같은 방식). 화면 테마는 차분 하나뿐(11/16).
// 기록은 이 휴대폰의 산책 기록만 쓰고 어디로도 보내지 않는다.
(function () {
  var LEVEL_NAME = ['', '3일', '5일', '7일'];
  var LEVEL_COLOR = ['', '#4f7d4a', '#3b7dc4', '#c99a3a'];
  var DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
  // Phosphor Icons(MIT) PawPrint fill — town.html의 발도장과 같은 모양
  var PAW = '<svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M212,80a28,28,0,1,0,28,28A28,28,0,0,0,212,80ZM72,108a28,28,0,1,0-28,28A28,28,0,0,0,72,108ZM92,88A28,28,0,1,0,64,60,28,28,0,0,0,92,88Zm72,0a28,28,0,1,0-28-28A28,28,0,0,0,164,88Zm23.12,60.86a35.3,35.3,0,0,1-16.87-21.14,44,44,0,0,0-84.5,0A35.25,35.25,0,0,1,69,148.82,40,40,0,0,0,88,224a39.48,39.48,0,0,0,15.52-3.13,64.09,64.09,0,0,1,48.87,0,40,40,0,0,0,34.73-72Z"/></svg>';

  var styled = false;
  function style() {
    if (styled) return;
    styled = true;
    var css =
      '.ss-row{display:flex;align-items:center;gap:12px;}' +
      '.ss-days{flex:1;display:flex;justify-content:space-between;gap:4px;}' +
      '.ss-day{display:flex;flex-direction:column;align-items:center;gap:4px;font:700 11px Pretendard,-apple-system,sans-serif;color:var(--ink-soft,#6b5d4e);}' +
      '.ss-dot{width:28px;height:28px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;' +
        'border-radius:50%;border:2px dashed var(--panel-border,#e0cfb9);' + '}' +
      '.ss-day.is-walked .ss-dot{' + 'border:none;background:var(--accent,#b8563a);color:#fff;' + '}' +   // 색은 화면 테마(theme.js)
      '.ss-day.is-today .ss-lbl{color:var(--accent,#b8563a);}' +
      '.ss-stamp{flex-shrink:0;width:58px;height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;transform:rotate(-8deg);' +
        'font:900 15px/1 Pretendard,-apple-system,sans-serif;' + 'border-radius:50%;border:3px dashed var(--panel-border,#d8cbb8);color:rgba(var(--shadow-rgb,74,63,53),0.45);' + '}' +
      '.ss-stamp small{display:block;font-size:9px;font-weight:800;margin-top:3px;}' +
      '.ss-sum{word-break:keep-all;font:13px/1.5 Pretendard,-apple-system,sans-serif;color:var(--ink-soft,#6b5d4e);margin:10px 0 0;}' +
      '.ss-sum b{color:var(--ink,#4a3f35);}' +
      '.ss-note{word-break:keep-all;font:11px/1.5 Pretendard,-apple-system,sans-serif;color:var(--ink-soft,#8a7a68);margin:2px 0 0;}' +
      '.ss-board{display:flex;justify-content:space-between;gap:4px;}' +
      '.ss-week{display:flex;flex-direction:column;align-items:center;gap:4px;font:700 10px Pretendard,-apple-system,sans-serif;color:var(--ink-soft,#8a7a68);}' +
      '.ss-week .ss-stamp{width:34px;height:34px;font-size:11px;border-width:2px;transform:rotate(-6deg);}';
    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }
  function stampEl(level, size) {
    var s = document.createElement('div');
    s.className = 'ss-stamp';
    if (level) {
      var c = LEVEL_COLOR[level];
      s.style.borderStyle = 'solid';
      s.style.color = c;
      s.style.borderColor = c;
    }
    s.innerHTML = (level ? LEVEL_NAME[level] : '3일') + (size === 'big' ? '<small>' + (level ? '꾸준함' : '아직') + '</small>' : '');
    return s;
  }

  // 이번 주(월~일) 산책한 날 + 이번 주 도장 + 한 줄 설명. info = RewardRules.steady(walks)
  // opts.justGot: 방금 이 산책으로 단계가 올랐으면 true(끝 화면)
  function week(info, opts) {
    style();
    opts = opts || {};
    var t = info.thisWeek;
    var box = document.createElement('div');
    var row = document.createElement('div');
    row.className = 'ss-row';
    var days = document.createElement('div');
    days.className = 'ss-days';
    t.walked.forEach(function (w, i) {
      var d = document.createElement('div');
      d.className = 'ss-day' + (w ? ' is-walked' : '') + (i === t.todayIndex ? ' is-today' : '');
      var dot = document.createElement('div');
      dot.className = 'ss-dot';
      if (w) dot.innerHTML = PAW;
      var lbl = document.createElement('div');
      lbl.className = 'ss-lbl';
      lbl.textContent = i === t.todayIndex ? '오늘' : DAY_NAMES[i];
      d.appendChild(dot);
      d.appendChild(lbl);
      days.appendChild(d);
    });
    row.appendChild(days);
    row.appendChild(stampEl(t.level, 'big'));
    box.appendChild(row);
    var sum = document.createElement('p');
    sum.className = 'ss-sum';
    var lead = opts.justGot ? '방금 이번 주 <b>' + LEVEL_NAME[t.level] + ' 도장</b>을 받았어요! ' : '';
    if (t.level === 3) sum.innerHTML = lead || '이번 주 <b>7일 도장</b> — 매일 걸었어요.';
    else if (t.level) sum.innerHTML = (lead || '이번 주 <b>' + LEVEL_NAME[t.level] + ' 도장</b>을 받았어요. ') + t.left + '일 더 걸으면 ' + t.next + '일 도장';
    else sum.innerHTML = '이번 주 ' + t.days + '일 걸었어요 · ' + t.left + '일 더 걸으면 <b>3일 도장</b>';
    box.appendChild(sum);
    if (!opts.compact) {   // 산책 끝 화면은 글을 줄인다(2026-11-18 "텍스트가 너무 많아") — 안내는 [오늘]·주민증에서
      var note = document.createElement('p');
      note.className = 'ss-note';
      note.textContent = '시간만 잰 산책도 들어가요(5분 이상) · 월요일마다 새로 시작해요';
      box.appendChild(note);
    }
    return box;
  }

  // 최근 n주 도장판(오래된 주 → 이번 주). [카드] 화면용
  function board(info, n) {
    style();
    n = n || 8;
    var byStart = {};
    info.weeks.forEach(function (w) { byStart[w.start] = w; });
    var p = info.thisWeek.start.split('-');
    var mon = new Date(+p[0], +p[1] - 1, +p[2]);
    var wrap = document.createElement('div');
    wrap.className = 'ss-board';
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(mon);
      d.setDate(mon.getDate() - i * 7);
      var key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      var w = byStart[key];
      var col = document.createElement('div');
      col.className = 'ss-week';
      col.title = (d.getMonth() + 1) + '월 ' + d.getDate() + '일 주 · ' + (w ? w.days : 0) + '일 산책';
      col.appendChild(stampEl(w ? w.level : 0, 'small'));
      var lbl = document.createElement('div');
      lbl.textContent = i === 0 ? '이번 주' : (d.getMonth() + 1) + '/' + d.getDate();
      col.appendChild(lbl);
      if (!(w && w.level)) col.firstChild.textContent = '';
      wrap.appendChild(col);
    }
    return wrap;
  }

  window.SteadyStamp = { week: week, board: board, LEVEL_NAME: LEVEL_NAME };
})();
