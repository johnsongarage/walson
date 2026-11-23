// 설정 판 — [동네]·[산책] 지도와 [기록] 머리의 톱니가 같이 쓴다(2026-11-23).
// 가르시아 "테마 변경을 좀 쉽게… 프로필 변경에선 너무 찾기 힘들어… 지도에 설정 버튼 달아봐 거기서 하게 해" →
// "산책 지도에도 달아줘" + "모아줘"(지도 위에 따로 있던 [도트]·[이름] 버튼도 이 판으로 모음).
//
// 판에 있는 것
//   - 화면 색 다섯 가지: 프로필 "화면 색"과 같은 설정(theme.js setPalette, 이 기기에 저장). 견본은 theme.js 색 값으로 그린다(색 고칠 땐 theme.js 한 곳).
//   - 지도 모양 [기본]·[도트]과 길·장소 이름 [끄기]·[켜기](도트 지도일 때만 — 기본 지도엔 이름이 원래 있다). 고른 것은 pixel-map.js가 기억하고 두 화면이 같이 쓴다.
//   - (app: true일 때 — 2026-11-23 탭 정리, 가르시아 "복잡한 거 다 접어 버리고 싶어") 앱 링크:
//     강아지 정보·프로필 · 기록 옮기기 · 홈 화면에 추가(둘 수 있을 때만, install.js) · 새 소식 받기(카톡 채널 — site-config.js에 주소가 있을 때만) ·
//     산책 유형 테스트 · 왈슨 소개·개인정보 안내, 그리고 접힌 '시연용'(샘플 데이터 켜기·끄기 + 화면마다 넘긴 demo 항목).
//     [오늘] 맨 아래 링크 줄·샘플 버튼과 [기록] 데모 기록 지우기를 여기로 모았다. 샘플 켜기·끄기는 [오늘] 주소(index.html?sample=on|off)가 처리한다.
// 색은 모두 화면 색 변수라 블랙에서도 그대로 보인다(theme-black.css에 더할 것 없음).
// 겹침 순서: 판은 10001 — 시연 모드 "가짜 위치" 배지(demo-geo.js 9999)보다 위, 미션 도착 알림(mission-alert.js 12000)보다 아래.
//
// 쓰는 법(theme.js 다음에 불러온다. app 링크를 쓰면 site-config.js·install.js도 먼저):
//   var qs = WalsonQuickSet.attach(톱니 버튼, {
//     side: 'left' | 'below',      // 판을 버튼 왼쪽(오른쪽 버튼 줄)에 / 버튼 아래(위쪽 띠)에
//     map: { get(), set(v), labels(), setLabels(on) },   // 지도 모양·이름 — 없으면 지도 칸을 안 보인다. setLabels는 Promise를 돌려줘도 됨
//     onPalette(prev, next),       // 화면 색을 바꾼 뒤(벡터 지도 다시 칠하기 등)
//     more: { href, label },       // 판 맨 아래 다른 설정으로 가는 링크(예: 프로필) — 없으면 안 보임. app이면 쓰지 않는다
//     app: true,                   // 위 앱 링크·시연용 칸(산책 중 화면처럼 다른 화면으로 나가면 안 되는 곳엔 안 씀)
//     demo: [{ label, onClick, id }]   // 시연용 칸에 더할 것(예: [기록] 데모 기록 지우기)
//   });
//   qs.close()  // 지도를 닫을 때 등
(function () {
  var CSS =
    '.quick-set{position:fixed;z-index:10001;width:min(272px,calc(100vw - 32px));padding:10px 12px 12px;background:var(--panel);color:var(--ink);overflow-y:auto;overscroll-behavior:contain;' +
      'border:1.5px solid var(--panel-border);border-radius:16px;box-shadow:0 8px 24px rgba(var(--shadow-rgb),0.22);font-family:Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;text-align:left;}' +
    '.quick-set[hidden]{display:none;}' +
    '.qs-head{display:flex;align-items:center;justify-content:space-between;margin:0 0 2px;}' +
    '.qs-head b{font-size:15px;font-weight:800;}' +
    '.qs-close{width:30px;height:30px;margin-right:-6px;border:none;border-radius:50%;background:transparent;color:var(--ink-soft);font:inherit;font-size:22px;line-height:1;cursor:pointer;}' +
    '.qs-label{margin:4px 0 7px;font-size:13px;font-weight:800;color:var(--ink);}' +
    '.qs-label small{font-size:11px;font-weight:700;color:var(--ink-soft);margin-left:4px;}' +
    '.qs-pals{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}' +
    '.qs-pal{font:inherit;padding:5px 5px 6px;border-radius:12px;border:2px solid var(--panel-border);background:var(--panel);color:var(--ink);cursor:pointer;text-align:center;}' +
    '.qs-pal[aria-pressed="true"]{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-tint);}' +
    '.qs-pal .sw{position:relative;display:block;height:36px;border-radius:8px;border:1.5px solid rgba(0,0,0,0.14);background-size:120px 120px;background-position:-12px -8px;}' +
    '.qs-pal .sw i{position:absolute;left:5px;bottom:5px;width:24px;height:11px;border-radius:999px;border:2px solid;box-sizing:border-box;}' +
    '.qs-pal .nm{display:block;margin-top:5px;font-size:11px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.qs-done{margin:7px 2px 0;font-size:12px;font-weight:800;color:var(--accent);word-break:keep-all;}' +
    '.qs-done:empty{display:none;}' +
    '.qs-sec{margin-top:10px;padding-top:8px;border-top:1px dashed var(--panel-border);}' +
    '.qs-sec[hidden],.qs-row[hidden]{display:none;}' +
    '.qs-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;}' +
    '.qs-row>span{font-size:13px;font-weight:800;}' +
    '.qs-seg{display:inline-flex;gap:2px;padding:2px;border:1.5px solid var(--panel-border);border-radius:999px;}' +
    '.qs-seg button{font:inherit;font-size:12px;font-weight:800;min-width:48px;padding:7px 11px;border:none;border-radius:999px;background:transparent;color:var(--ink-soft);cursor:pointer;}' +
    '.qs-seg button[aria-pressed="true"]{background:var(--hl);color:var(--hl-ink);}' +
    '.qs-more{display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding:9px 2px 0;border-top:1px dashed var(--panel-border);' +
      'font-size:13px;font-weight:800;color:var(--ink);text-decoration:none;}' +
    '.qs-more::after{content:"›";font-size:18px;line-height:1;color:var(--ink-soft);}' +
    // 앱 링크·시연용(app: true)
    '.qs-links{margin-top:10px;border-top:1px dashed var(--panel-border);}' +
    '.qs-links a{display:flex;align-items:center;justify-content:space-between;min-height:38px;padding:0 2px;border-bottom:1px solid var(--panel-border);' +
      'font-size:13px;font-weight:800;color:var(--ink);text-decoration:none;}' +
    '.qs-links a[hidden]{display:none;}' +
    '.qs-links a::after{content:"›";font-size:18px;line-height:1;color:var(--ink-soft);}' +
    '.qs-foot{margin:8px 2px 0;font-size:12px;font-weight:700;color:var(--ink-soft);}' +
    '.qs-foot a{color:var(--ink-soft);}' +
    '.qs-demo{margin-top:8px;}' +
    '.qs-demo>summary{cursor:pointer;font-size:12px;font-weight:800;color:var(--ink-soft);padding:4px 2px;}' +
    '.qs-dl{display:block;width:100%;margin-top:6px;padding:9px 10px;border:1px dashed var(--ink-soft);border-radius:999px;background:transparent;color:var(--ink-soft);' +
      'font:inherit;font-size:12.5px;font-weight:800;text-align:center;text-decoration:none;cursor:pointer;box-sizing:border-box;}' +
    '.qs-dl[hidden]{display:none;}';
  var cssDone = false;
  function addCss() {
    if (cssDone) return; cssDone = true;
    var st = document.createElement('style'); st.id = 'walson-quick-set'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  // 받침 있으면 '으로'(ㄹ 받침은 '로')
  function ro(word) {
    var last = word.charCodeAt(word.length - 1) - 0xAC00;
    return (last >= 0 && last < 11172 && last % 28 !== 0 && last % 28 !== 8) ? '으로' : '로';
  }
  // [끄기][켜기] 같은 두 칸 고르기
  function seg(name, items, onPick) {
    var box = el('div', 'qs-seg'); box.setAttribute('role', 'group'); box.setAttribute('aria-label', name);
    items.forEach(function (it) {
      var b = el('button', '', it[1]); b.type = 'button'; b.setAttribute('data-v', it[0]);
      b.addEventListener('click', function () { onPick(it[0]); });
      box.appendChild(b);
    });
    box.paint = function (v) {
      Array.prototype.forEach.call(box.children, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === String(v) ? 'true' : 'false'); });
    };
    return box;
  }

  window.WalsonQuickSet = {
    attach: function (btn, opt) {
      opt = opt || {};
      var T = window.WalsonTheme, map = opt.map || null;
      var hasPal = !!(T && T.palettes && T.setPalette);
      if (!btn || (!hasPal && !map)) { if (btn) btn.hidden = true; return { close: function () {} }; }
      addCss();
      var box = el('div', 'quick-set'); box.hidden = true;
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '설정');
      if (btn.id) { box.id = btn.id + '-panel'; btn.setAttribute('aria-controls', box.id); }
      btn.setAttribute('aria-expanded', 'false');
      var head = el('div', 'qs-head'); head.appendChild(el('b', '', '설정'));
      var x = el('button', 'qs-close', '×'); x.type = 'button'; x.setAttribute('aria-label', '설정 닫기'); head.appendChild(x);
      box.appendChild(head);

      // 화면 색
      var pals = null, done = null;
      if (hasPal) {
        var lab = el('p', 'qs-label', '화면 색'); lab.appendChild(el('small', '', '누르면 바로 바뀌고 저장돼요'));
        box.appendChild(lab);
        pals = el('div', 'qs-pals'); pals.setAttribute('role', 'group'); pals.setAttribute('aria-label', '화면 색');
        Object.keys(T.palettes).forEach(function (k) {
          var p = T.palettes[k], b = el('button', 'qs-pal'); b.type = 'button'; b.setAttribute('data-pal', k);
          var sw = el('span', 'sw'); sw.style.backgroundColor = p.bg; sw.style.backgroundImage = 'url("icons/dog-pattern-' + k + '.svg?v=1")';
          var chip = el('i'); chip.style.background = p.hl; chip.style.borderColor = p.line; sw.appendChild(chip);
          b.appendChild(sw); b.appendChild(el('span', 'nm', p.label));
          pals.appendChild(b);
        });
        box.appendChild(pals);
        done = el('p', 'qs-done'); done.setAttribute('aria-live', 'polite'); box.appendChild(done);
        pals.addEventListener('click', function (e) {
          var b = e.target.closest('[data-pal]'); if (!b) return;
          var was = T.palette, k = b.getAttribute('data-pal');
          T.setPalette(k);
          paint();
          if (opt.onPalette) { try { opt.onPalette(was, k); } catch (err) { /* 지도 색 다시 칠하기가 실패해도 화면 색은 바뀜 */ } }
          var nm = T.palettes[k].label;
          done.textContent = '✓ ' + nm + ro(nm) + ' 바꿨어요 · 저장됐어요';
        });
      }

      // 지도 모양·이름
      var styleSeg = null, labelSeg = null, labelRow = null;
      if (map) {
        var sec = el('div', 'qs-sec');
        var r1 = el('div', 'qs-row'); r1.appendChild(el('span', '', '지도 모양'));
        styleSeg = seg('지도 모양', [['basic', '기본'], ['pixel', '도트']], function (v) { map.set(v); paint(); });
        r1.appendChild(styleSeg); sec.appendChild(r1);
        labelRow = el('div', 'qs-row'); labelRow.appendChild(el('span', '', '길·장소 이름'));
        labelSeg = seg('길·장소 이름', [['false', '끄기'], ['true', '켜기']], function (v) {
          var p = map.setLabels(v === 'true');
          paint();
          if (p && p.then) p.then(paint, paint);   // 이름 데이터를 못 받으면 꺼진 모양으로 돌아온다
        });
        labelRow.appendChild(labelSeg); sec.appendChild(labelRow);
        box.appendChild(sec);
      }

      if (opt.app) {
        // 앱 링크(2026-11-23 탭 정리) — [오늘] 맨 아래 링크 줄에 있던 것
        var links = el('div', 'qs-links');
        var link = function (href, label) { var a = el('a', '', label); a.href = href; links.appendChild(a); return a; };
        link('profile.html', '강아지 정보 · 프로필');
        link('profile.html#backup', '기록 옮기기');
        var inst = link('#', '홈 화면에 추가'); inst.hidden = true;
        var I = window.WalsonInstall;
        if (I && I.whenReady) {
          I.whenReady(function () { inst.hidden = false; }, 15000);
          inst.addEventListener('click', function (e) { e.preventDefault(); open(false); I.open(); });
        }
        var ch = window.WALSON_CONFIG && WALSON_CONFIG.kakaoChannel;
        if (ch) { var ca = link(ch, '새 소식 받기 · 카톡 채널'); ca.target = '_blank'; ca.rel = 'noopener'; }
        link('walk-type.html', '산책 유형 테스트');
        box.appendChild(links);
        var foot = el('p', 'qs-foot');
        foot.innerHTML = '<a href="about.html">왈슨 소개</a> · <a href="privacy.html">개인정보 안내</a>';
        box.appendChild(foot);
        // 시연용(접어 둠) — 공원에서 보여 줄 때만 쓰는 것
        var demo = el('details', 'qs-demo'), sum = el('summary', '', '시연용');
        demo.appendChild(sum);
        var sOn = false;
        try { sOn = localStorage.getItem('petwalk_sample_mode') === '1'; } catch (e) { sOn = false; }
        var sa = el('a', 'qs-dl', sOn ? '샘플 끄고 내 기록으로 돌아가기' : '샘플 데이터로 둘러보기');
        sa.href = 'index.html?sample=' + (sOn ? 'off' : 'on');
        sa.id = 'qs-sample';
        demo.appendChild(sa);
        (opt.demo || []).forEach(function (d) {
          if (!d || !d.label) return;
          var b = el('button', 'qs-dl', d.label); b.type = 'button';
          if (d.id) b.id = d.id;
          b.addEventListener('click', function () { open(false); if (d.onClick) d.onClick(); });
          demo.appendChild(b);
        });
        box.appendChild(demo);
      } else if (opt.more && opt.more.href) {
        var more = el('a', 'qs-more', opt.more.label || '다른 설정'); more.href = opt.more.href;
        box.appendChild(more);
      }

      document.body.appendChild(box);
      function paint() {
        if (pals) Array.prototype.forEach.call(pals.children, function (b) {
          b.setAttribute('aria-pressed', b.getAttribute('data-pal') === T.palette ? 'true' : 'false');
        });
        if (map) {
          var st = map.get();
          styleSeg.paint(st);
          labelRow.hidden = st !== 'pixel';
          labelSeg.paint(String(!!map.labels()));
        }
      }
      // 판 자리 — 오른쪽 버튼 줄이면 버튼 왼쪽에, 위쪽 띠면 버튼 아래에. 화면 밖으로 안 나가게
      function place() {
        var r = btn.getBoundingClientRect(), W = window.innerWidth, top;
        box.style.left = 'auto';
        if (opt.side === 'below') { top = Math.round(r.bottom + 8); box.style.right = Math.max(8, Math.round(W - r.right)) + 'px'; }
        else { top = Math.round(r.top); box.style.right = Math.max(8, Math.round(W - r.left + 10)) + 'px'; }
        top = Math.max(8, top);
        box.style.top = top + 'px';
        box.style.maxHeight = Math.max(180, window.innerHeight - top - 12) + 'px';   // 낮은 화면에선 판 안에서 스크롤
      }
      function open(on) {
        box.hidden = !on;
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        if (on) { if (done) done.textContent = ''; paint(); place(); }
      }
      btn.addEventListener('click', function () { open(box.hidden); });
      x.addEventListener('click', function () { open(false); btn.focus(); });
      // 판 밖(지도 등)을 누르면 닫는다
      document.addEventListener('pointerdown', function (e) {
        if (!box.hidden && !box.contains(e.target) && !btn.contains(e.target)) open(false);
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) { open(false); btn.focus(); } });
      window.addEventListener('resize', function () { if (!box.hidden) place(); });
      return { close: function () { open(false); }, open: function () { open(true); }, el: box };
    }
  };
})();
