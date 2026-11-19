// 크게 그린 그림을 화면에서 또렷하게(2026-11-18 가르시아 "글씨 깨지는 부분 체크해서 수정해"). 전역 window.WalsonView.
// 왜: 주민증(1600px)·영수증(1080px)·응가 카드처럼 저장·인쇄용으로 크게 그린 캔버스를 그대로 화면에 줄여 보이면,
//     PC(화면 배율 1)에선 4분의 1쯤으로 줄어드는데 브라우저가 이걸 거칠게 줄여서 가는 글씨가 끊겨 보였다.
//     (휴대폰은 화면 픽셀이 많아 반쯤만 줄어서 괜찮았다.)
// 그래서 그림은 원래 크기 캔버스(big)에 그리고, 화면에 보이는 캔버스(view)에는 보이는 크기(기기 픽셀)만큼만 곱게 줄여 옮긴다.
// 반씩 여러 번 줄이면(밉맵과 같은 셈) 어느 브라우저에서도 작은 글씨가 끊기지 않는다.
//
// WalsonView.show(view, big) — 그릴 때마다 부른다. view의 화면 크기는 원래처럼 CSS가 정한다(잠깐 big 크기로 두고 잰다).
//   창 크기·화면 배율이 바뀌거나, 숨어 있던 view가 보이게 되면 알아서 다시 옮긴다.
// WalsonView.paint(view, big, cssW, cssH) — 화면 크기를 이미 아는 곳(편집기)에서 바로 옮기기.
// 저장·공유·인쇄는 늘 big으로(view는 화면용이라 작다). 그림은 이 휴대폰 안에서만 옮기고 어디로도 보내지 않는다.
(function () {
  if (window.WalsonView) return;
  var pool = [];
  function scratch(i, w, h) {
    var c = pool[i] || (pool[i] = document.createElement('canvas'));
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    return c;
  }
  // big을 w×h의 두 배 안쪽이 될 때까지 반씩 줄인다(마지막 한 번은 paint가 그린다)
  function halve(big, w, h) {
    var cur = big, cw = big.width, ch = big.height, i = 0;
    while (cw / 2 >= w && ch / 2 >= h) {
      var nw = Math.max(1, Math.round(cw / 2)), nh = Math.max(1, Math.round(ch / 2)), t = scratch(i++, nw, nh), g = t.getContext('2d');
      g.clearRect(0, 0, nw, nh);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(cur, 0, 0, nw, nh);
      cur = t; cw = nw; ch = nh;
    }
    return cur;
  }
  function size(c, w, h) {
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; return c.getContext('2d'); }
    var g = c.getContext('2d'); g.clearRect(0, 0, w, h); return g;
  }
  function paint(view, big, cssW, cssH) {
    if (!view || !big || !big.width || !big.height) return;
    // 화면 배율이 1보다 작아도(브라우저 축소) 1로 — 픽셀이 화면 크기보다 작아지면 CSS가 그림을 더 작게 잡을 수 있다
    var dpr = Math.max(1, window.devicePixelRatio || 1), w = Math.round(cssW * dpr), g;
    if (!(w > 0) || !(cssH > 0) || w >= big.width) {   // 안 보이는 중이거나 줄일 필요가 없으면 그대로
      size(view, big.width, big.height).drawImage(big, 0, 0);
      return;
    }
    var h = Math.max(1, Math.round(w * big.height / big.width)), src = halve(big, w, h);
    g = size(view, w, h);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, w, h);
  }

  // show로 맡긴 화면 칸들 — 크기가 바뀌면 다시 옮긴다
  var list = [];
  function find(view) { for (var i = 0; i < list.length; i++) if (list[i].view === view) return list[i]; return null; }
  function measureAndPaint(e) {
    var view = e.view, big = e.big;
    if (!big.width || !big.height) return;
    // 원래 크기로 두고 CSS가 정한 화면 크기를 잰다(같은 순간에 다시 줄이므로 화면엔 안 보인다)
    if (view.width !== big.width) view.width = big.width;
    if (view.height !== big.height) view.height = big.height;
    var r = view.getBoundingClientRect();
    e.sz = [r.width, r.height, window.devicePixelRatio || 1];
    paint(view, big, r.width, r.height);
  }
  var pending = [], raf = 0;
  function schedule(e) {
    if (pending.indexOf(e) < 0) pending.push(e);
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var todo = pending; pending = [];
      todo.forEach(function (x) { if (x.view.isConnected) measureAndPaint(x); });
    });
  }
  var ro = window.ResizeObserver ? new ResizeObserver(function (entries) {
    entries.forEach(function (en) {
      var e = find(en.target), r = en.target.getBoundingClientRect();
      if (!e || (e.sz && Math.abs(r.width - e.sz[0]) < 1.5 && Math.abs(r.height - e.sz[1]) < 1.5)) return;
      schedule(e);
    });
  }) : null;
  window.addEventListener('resize', function () {
    list = list.filter(function (e) {
      if (e.view.isConnected) return true;
      if (ro) ro.unobserve(e.view);
      return false;
    });
    list.forEach(function (e) { schedule(e); });   // 창 크기·화면 배율(확대·축소)이 바뀌었다
  });
  function show(view, big) {
    if (!view || !big) return;
    var e = find(view);
    if (!e) { e = { view: view, big: big, sz: null }; list.push(e); if (ro) ro.observe(view); }
    e.big = big;
    measureAndPaint(e);
  }

  window.WalsonView = { show: show, paint: paint };
})();
