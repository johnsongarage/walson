// [밤하늘] 4단계(2026-11-27 가르시아 "3D 우주 탐험·외계 생명체·다른 강아지 별·기억의 별도 만들 거야 — 외계 생명체는 이미지 하나로 두고 가끔 출몰,
// 순찰대는 로켓 탄 우주복 입은 강아지를 계속 비행시켜서 하늘에서 우주인을 탐색한다고 떠들게, 다른 강아지 별 보러 가기·기억의 별 메뉴는
// 누르면 다른 행성이 줌인 — 아직 미완성인 형태로 남겨 두는 거지"). night.html이 부른다. 전역 window.WalsonNightExtras.
//   순찰대: 우리 개 도트(icons/dot-dogs)가 유리 돔 로켓을 타고 별자리 위쪽 하늘 끝을 타원을 그리며 계속 돈다(11/27 가르시아 "3D에서 별자리 윗부분
//     가장자리를 순찰하는 강아지야, 하늘 끝부분의 타원 곡선을 그리면서" — 3D 하늘 sky.html은 별자리들 위 높이를 한 바퀴, 2D 밤하늘은 위쪽 타원 — 뒤쪽은 작고 흐리게).
//     말풍선으로 떠든다. 누르면 다음 말.
//   외계 생명체: UFO 유리 돔 안에(11/27 "외계인도 UFO 안에 있어야 해"). 하늘을 열 때 세 번에 한 번쯤, 몇 초 뒤 가장자리에서 빼꼼 — 누르면 휙 도망, 순찰대가 "놓쳤다".
//   행성 문 둘: [다른 강아지 별 보러 가기] · [기억의 별] — 누르면 행성이 다가오며(줌인) "준비 중" 화면. 다른 강아지 별은 가짜로 채우지 않는다.
//     기억의 별은 조용한 말투(농담·순찰대·외계인 없음). [기다릴게요]는 track.js 익명 통계에 sky_door(door·act)로만 센다 — 위치·이름 없음.
//   그림은 받기 전까지 코드로 그린 임시 그림(ART에 주소를 넣으면 그 그림으로 — 흰 바탕 없는 png/webp).
//   11/28 가르시아 "로케트랑 외계인은 지금 빼줘": 순찰대·외계 생명체는 ON으로 끔 — 그림·코드는 남겨 두고 화면에서만 뺀다(다시 넣을 땐 true).
//     지금 보이는 건 행성 문 둘뿐. 3D 하늘(sky.html)도 같은 ON을 본다.
(function () {
  'use strict';
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ON = { patrol: false, alien: false };   // 11/28 "지금 빼줘" — 순찰대(로켓)·외계 생명체(UFO)
  var ART = { rocket: 'icons/night/rocket.webp?v=1', ufo: '', others: '', memory: '' };   // 받은 그림 주소(비어 있으면 코드 그림) — ufo = 외계인이 탄 UFO 한 장
  // 받은 로켓(11/27 가르시아 "추가하고 배포" — _dev/night-rocket.py): 그림 비율과 유리 돔 자리(돔 속은 반투명 — 우리 개를 로켓 뒤에 그리면 돔 안에 탄 것처럼)·불꽃 자리
  var ROCKET = { aspect: 1.3908, dome: { cx: 0.5317, top: 0.0216, base: 0.4452, w: 0.3612 }, flame: { x: 0.1009, y: 0.6818, r: 0.0799 } };
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 못 해도 그대로 */ } }
  function track(door, act) { try { if (window.WalsonTrack) WalsonTrack.send('sky_door', { door: door, act: act }); } catch (e) { /* 통계는 없어도 그대로 */ } }
  function loadImg(src) { return new Promise(function (ok) { if (!src) { ok(null); return; } var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src; }); }

  var CSS = '.nx-patrol{position:absolute;left:0;top:0;z-index:3;cursor:pointer;will-change:transform;-webkit-tap-highlight-color:transparent}' +
    '.nx-patrol canvas{display:block}' +
    '.nx-say{position:absolute;left:0;top:0;z-index:4;max-width:180px;font-size:12px;font-weight:800;line-height:1.35;color:#1b1d33;background:#fff;padding:6px 9px;border-radius:12px;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;white-space:nowrap;transition:opacity .25s}' +
    '.nx-say::after{content:"";position:absolute;left:18px;bottom:-6px;border:6px solid transparent;border-top-color:#fff;border-bottom:0}' +
    '.nx-alien{position:absolute;z-index:3;width:84px;height:60px;cursor:pointer;transition:transform .7s cubic-bezier(.2,.9,.3,1.2),opacity .4s;-webkit-tap-highlight-color:transparent}' +
    '.nx-alien canvas{display:block;width:100%;height:100%}' +
    '.nx-doors{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}' +
    '.nx-door{display:flex;align-items:center;gap:8px;min-height:52px;padding:8px 10px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);' +
    'color:#fff;font:inherit;font-size:13px;font-weight:800;text-align:left;cursor:pointer;line-height:1.3}' +
    '.nx-door i{flex:none;width:28px;height:28px;border-radius:50%;display:block}' +
    '.nx-door small{display:block;font-size:11px;font-weight:700;color:#aab3d4}' +
    '.nx-door.others i{background:radial-gradient(circle at 35% 30%,#ffe0ef,#ff7fb5 50%,#7a3fd1);box-shadow:0 0 12px rgba(255,127,181,.6)}' +
    '.nx-door.memory i{background:radial-gradient(circle at 35% 30%,#ffffff,#c9c3ff 50%,#5a57b0);box-shadow:0 0 12px rgba(201,195,255,.55)}' +
    '.nx-pl{position:fixed;inset:0;z-index:1170;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 22px calc(28px + env(safe-area-inset-bottom));' +
    'background:radial-gradient(circle at 50% 40%,#1d1850 0%,#090b22 70%);opacity:0;transition:opacity .35s;text-align:center;color:#eef1fb;overflow:hidden}' +
    '.nx-pl.on{opacity:1}.nx-pl.memory{background:radial-gradient(circle at 50% 40%,#232052 0%,#0b0c20 72%)}' +
    '.nx-pl .orb{position:relative;width:min(62vw,250px);aspect-ratio:1;border-radius:50%;transition:transform 1s cubic-bezier(.16,.84,.24,1)}' +
    '.nx-pl .orb canvas{display:block;width:100%;height:100%}' +
    '.nx-pl h2{margin:26px 0 8px;font-size:20px;font-weight:900;opacity:0;transform:translateY(8px);transition:opacity .4s .75s,transform .4s .75s}' +
    '.nx-pl p{margin:0 auto;max-width:300px;font-size:14px;line-height:1.6;color:#c3cbe2;word-break:keep-all;opacity:0;transform:translateY(8px);transition:opacity .4s .85s,transform .4s .85s}' +
    '.nx-pl .tag{display:inline-block;margin-bottom:6px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;color:#ffd38a;background:rgba(255,211,138,.12);border:1px solid rgba(255,211,138,.35)}' +
    '.nx-pl .btns{display:flex;gap:8px;margin-top:22px;width:100%;max-width:320px;opacity:0;transition:opacity .4s .95s}' +
    '.nx-pl .btns button{flex:1;min-height:48px;border-radius:12px;border:0;background:#2b3358;color:#fff;font:inherit;font-size:15px;font-weight:800;cursor:pointer}' +
    '.nx-pl .btns button.main{background:#ff5c9d}.nx-pl.memory .btns button.main{background:#8d86e8}' +
    '.nx-pl.on h2,.nx-pl.on p{opacity:1;transform:none}.nx-pl.on .btns{opacity:1}' +
    '.nx-pl .sparks{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}.nx-pl>*:not(.sparks){position:relative;z-index:1}';

  // ── 코드 그림(받은 그림이 오기 전) ──
  // 로켓 + 유리 돔 + 우리 개 도트 — 오른쪽으로 나는 모양(왼쪽으로 갈 땐 통째로 뒤집음), flame = 0~1 불꽃 길이
  function drawRocket(g, W, H, dog, flame) {
    g.clearRect(0, 0, W, H);
    var u = W / 120, cy = H * 0.62;
    // 불꽃
    var fl = (16 + 14 * flame) * u;
    var fg = g.createLinearGradient(20 * u - fl, cy, 22 * u, cy); fg.addColorStop(0, 'rgba(255,120,60,0)'); fg.addColorStop(0.5, 'rgba(255,150,60,.85)'); fg.addColorStop(1, 'rgba(255,240,170,1)');
    g.fillStyle = fg; g.beginPath(); g.moveTo(22 * u, cy - 8 * u); g.quadraticCurveTo(20 * u - fl * 0.6, cy - 3 * u, 20 * u - fl, cy); g.quadraticCurveTo(20 * u - fl * 0.6, cy + 3 * u, 22 * u, cy + 8 * u); g.closePath(); g.fill();
    // 꼬리 날개
    g.fillStyle = '#ff5c7a';
    g.beginPath(); g.moveTo(30 * u, cy - 8 * u); g.lineTo(20 * u, cy - 20 * u); g.lineTo(42 * u, cy - 9 * u); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(30 * u, cy + 8 * u); g.lineTo(20 * u, cy + 20 * u); g.lineTo(42 * u, cy + 9 * u); g.closePath(); g.fill();
    // 몸통(가로 캡슐) + 코
    var bg = g.createLinearGradient(0, cy - 13 * u, 0, cy + 13 * u); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#c9d2ee');
    g.fillStyle = bg; g.beginPath(); g.moveTo(26 * u, cy - 12 * u); g.lineTo(92 * u, cy - 12 * u); g.quadraticCurveTo(114 * u, cy, 92 * u, cy + 12 * u); g.lineTo(26 * u, cy + 12 * u); g.quadraticCurveTo(20 * u, cy, 26 * u, cy - 12 * u); g.fill();
    g.fillStyle = '#ff5c7a'; g.beginPath(); g.moveTo(96 * u, cy - 10 * u); g.quadraticCurveTo(114 * u, cy, 96 * u, cy + 10 * u); g.quadraticCurveTo(101 * u, cy, 96 * u, cy - 10 * u); g.fill();
    g.strokeStyle = '#7d86ad'; g.lineWidth = 1.6 * u; g.beginPath(); g.moveTo(26 * u, cy - 12 * u); g.lineTo(92 * u, cy - 12 * u); g.quadraticCurveTo(114 * u, cy, 92 * u, cy + 12 * u); g.lineTo(26 * u, cy + 12 * u); g.quadraticCurveTo(20 * u, cy, 26 * u, cy - 12 * u); g.stroke();
    // 돔 안 우리 개
    var dx = 44 * u, dw = 40 * u, dh = 40 * u, dyb = cy - 9 * u;
    if (dog) { var s = Math.min(dw / dog.naturalWidth, dh / dog.naturalHeight), w = dog.naturalWidth * s, h = dog.naturalHeight * s; g.imageSmoothingEnabled = false; g.drawImage(dog, dx + (dw - w) / 2, dyb - h, w, h); g.imageSmoothingEnabled = true; }
    // 유리 돔
    var cx = dx + dw / 2, r = 24 * u;
    var dg = g.createRadialGradient(cx - r * 0.35, dyb - r * 0.75, r * 0.1, cx, dyb - r * 0.4, r * 1.1); dg.addColorStop(0, 'rgba(255,255,255,.45)'); dg.addColorStop(1, 'rgba(150,200,255,.12)');
    g.fillStyle = dg; g.beginPath(); g.arc(cx, dyb, r, Math.PI, 0); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(220,236,255,.9)'; g.lineWidth = 1.8 * u; g.beginPath(); g.arc(cx, dyb, r, Math.PI, 0); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.2 * u; g.beginPath(); g.arc(cx, dyb, r * 0.78, Math.PI * 1.18, Math.PI * 1.42); g.stroke();
  }
  // 받은 로켓 그림: 불꽃 둘레 깜빡이는 빛 → 우리 개(돔 자리, 아랫몸은 몸통에 가림) → 로켓(돔 속 반투명이라 개가 비쳐 보임)
  function drawRocketArt(g, W, H, dog, rocket, now) {
    g.clearRect(0, 0, W, H);
    var f = ROCKET.flame, fx = f.x * W, fy = f.y * H, fr = f.r * W * (1.6 + 0.35 * Math.sin(now / 60) + 0.2 * Math.sin(now / 23));
    var fg = g.createRadialGradient(fx, fy, 0, fx, fy, fr); fg.addColorStop(0, 'rgba(255,190,90,.75)'); fg.addColorStop(1, 'rgba(255,120,60,0)');
    g.fillStyle = fg; g.beginPath(); g.arc(fx, fy, fr, 0, 7); g.fill();
    var d = ROCKET.dome;
    if (dog) {
      var dh = (d.base - d.top) * H * 0.95, dw = dog.naturalWidth * dh / dog.naturalHeight;
      if (dw > d.w * W * 0.9) { dw = d.w * W * 0.9; dh = dog.naturalHeight * dw / dog.naturalWidth; }
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(dog, d.cx * W - dw / 2, d.base * H + H * 0.06 - dh, dw, dh);
    }
    g.drawImage(rocket, 0, 0, W, H);
  }
  // UFO — 유리 돔 안에 외계 생명체(초록 · 큰 눈 하나 · 노란 끝 더듬이 · 손 흔들기), 접시 둘레 불빛이 깜빡. 받은 그림(art)이 있으면 그 그림
  function drawUfo(g, W, H, t, art) {
    g.clearRect(0, 0, W, H);
    if (art) { g.drawImage(art, 0, 0, W, H); return; }
    var u = W / 100, cx = 50 * u;
    // 돔 속 외계인(돔 유리보다 먼저)
    var wave = t / 180;
    g.lineCap = 'round';
    g.strokeStyle = '#7fe08a'; g.lineWidth = 1.6 * u;
    g.beginPath(); g.moveTo(cx - 5 * u, 22 * u); g.lineTo(cx - 8 * u, 15 * u); g.stroke(); g.beginPath(); g.moveTo(cx + 5 * u, 22 * u); g.lineTo(cx + 8 * u, 15 * u); g.stroke();
    g.fillStyle = '#ffe36e'; g.beginPath(); g.arc(cx - 8 * u, 14.5 * u, 2 * u, 0, 7); g.fill(); g.beginPath(); g.arc(cx + 8 * u, 14.5 * u, 2 * u, 0, 7); g.fill();
    var ab = g.createRadialGradient(cx - 3 * u, 25 * u, 1 * u, cx, 30 * u, 13 * u); ab.addColorStop(0, '#b8ffb8'); ab.addColorStop(1, '#3fbf63');
    g.fillStyle = ab; g.beginPath(); g.ellipse(cx, 31 * u, 10 * u, 11 * u, 0, 0, 7); g.fill();
    g.strokeStyle = '#1f7a3a'; g.lineWidth = 1.2 * u; g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx, 28 * u, 5.2 * u, 4.6 * u, 0, 0, 7); g.fill();
    g.fillStyle = '#1b1d33'; g.beginPath(); g.arc(cx + 1 * u, 28.5 * u, 2.5 * u, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + 1.9 * u, 27.6 * u, 0.9 * u, 0, 7); g.fill();
    g.strokeStyle = '#1f7a3a'; g.lineWidth = 1.1 * u; g.beginPath(); g.arc(cx, 33 * u, 2.6 * u, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    var a = -1.1 + 0.55 * Math.sin(wave); g.strokeStyle = '#3fbf63'; g.lineWidth = 2.2 * u;
    g.beginPath(); g.moveTo(cx + 8.5 * u, 32 * u); g.lineTo(cx + 8.5 * u + Math.cos(a) * 7 * u, 32 * u + Math.sin(a) * 7 * u); g.stroke();
    // 유리 돔
    var dg = g.createRadialGradient(cx - 6 * u, 18 * u, 1 * u, cx, 28 * u, 19 * u); dg.addColorStop(0, 'rgba(255,255,255,.5)'); dg.addColorStop(1, 'rgba(160,220,255,.18)');
    g.fillStyle = dg; g.beginPath(); g.arc(cx, 36 * u, 18 * u, Math.PI, 0); g.closePath(); g.fill();
    g.strokeStyle = '#1e2350'; g.lineWidth = 1.6 * u; g.beginPath(); g.arc(cx, 36 * u, 18 * u, Math.PI, 0); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.8 * u; g.beginPath(); g.arc(cx, 36 * u, 14 * u, Math.PI * 1.2, Math.PI * 1.45); g.stroke();
    // 접시
    var sg = g.createLinearGradient(0, 34 * u, 0, 56 * u); sg.addColorStop(0, '#f3f0ff'); sg.addColorStop(0.55, '#c3bcf0'); sg.addColorStop(1, '#8a80cf');
    g.fillStyle = sg; g.beginPath(); g.ellipse(cx, 45 * u, 45 * u, 11.5 * u, 0, 0, 7); g.fill();
    g.strokeStyle = '#1e2350'; g.lineWidth = 1.6 * u; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(cx - 6 * u, 40.5 * u, 26 * u, 3.6 * u, 0, 0, 7); g.fill();
    g.fillStyle = '#7c72c4'; g.beginPath(); g.ellipse(cx, 55 * u, 15 * u, 5 * u, 0, 0, Math.PI); g.fill();
    g.strokeStyle = '#1e2350'; g.lineWidth = 1.4 * u; g.beginPath(); g.ellipse(cx, 55 * u, 15 * u, 5 * u, 0, 0, Math.PI); g.stroke();
    // 둘레 불빛(차례로 깜빡)
    var cols = ['#ffe36e', '#ff8fbf', '#8fe7ff'];
    for (var k = 0; k < 7; k++) {
      var ang = Math.PI * (0.12 + 0.76 * k / 6), lx = cx - Math.cos(ang) * 37 * u, ly = 45 * u + Math.sin(ang) * 8.5 * u, on = (Math.floor(t / 220) + k) % 3 === 0;
      if (on) { var lg = g.createRadialGradient(lx, ly, 0, lx, ly, 5 * u); lg.addColorStop(0, cols[k % 3]); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.beginPath(); g.arc(lx, ly, 5 * u, 0, 7); g.fill(); }
      g.fillStyle = on ? '#fff' : cols[k % 3]; g.beginPath(); g.arc(lx, ly, 1.9 * u, 0, 7); g.fill();
    }
  }
  function drawPlanet(g, W, kind, t) {
    var r = W * 0.36, cx = W / 2, cy = W / 2;
    g.clearRect(0, 0, W, W);
    var halo = g.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.45);
    halo.addColorStop(0, kind === 'memory' ? 'rgba(201,195,255,.35)' : 'rgba(255,127,181,.35)'); halo.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, r * 1.45, 0, 7); g.fill();
    var body = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    if (kind === 'memory') { body.addColorStop(0, '#ffffff'); body.addColorStop(0.45, '#cfc9ff'); body.addColorStop(1, '#4f4c9c'); }
    else { body.addColorStop(0, '#ffe6f2'); body.addColorStop(0.45, '#ff86b9'); body.addColorStop(1, '#6a36c4'); }
    if (kind !== 'memory') {   // 고리(뒤쪽 반)
      g.strokeStyle = 'rgba(255, 214, 236, .55)'; g.lineWidth = r * 0.09;
      g.beginPath(); g.ellipse(cx, cy, r * 1.55, r * 0.42, -0.35, Math.PI, Math.PI * 2); g.stroke();
    }
    g.fillStyle = body; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    // 무늬 — 다른 강아지 별: 발바닥 크레이터 · 기억의 별: 잔잔한 띠
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip();
    if (kind === 'memory') {
      for (var i = 0; i < 4; i++) { g.strokeStyle = 'rgba(255,255,255,' + (0.1 + 0.04 * i) + ')'; g.lineWidth = r * 0.06; g.beginPath(); g.ellipse(cx, cy + r * (-0.5 + i * 0.32), r * 1.1, r * 0.12, 0.1, 0, 7); g.stroke(); }
    } else {
      var pads = [[-0.35, 0.25, 0.22], [0.3, -0.2, 0.15], [0.15, 0.45, 0.11]];
      pads.forEach(function (p) {
        var px = cx + p[0] * r, py = cy + p[1] * r, pr = p[2] * r;
        g.fillStyle = 'rgba(120, 40, 140, .28)'; g.beginPath(); g.ellipse(px, py + pr * 0.25, pr, pr * 0.8, 0, 0, 7); g.fill();
        for (var k = 0; k < 4; k++) { var a = -2.4 + k * 0.55; g.beginPath(); g.arc(px + Math.cos(a) * pr * 1.25, py + Math.sin(a) * pr * 1.15, pr * 0.32, 0, 7); g.fill(); }
      });
    }
    var sh = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.65, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(10,8,40,.5)');
    g.fillStyle = sh; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    g.restore();
    if (kind !== 'memory') {   // 고리(앞쪽 반)
      g.strokeStyle = 'rgba(255, 224, 240, .85)'; g.lineWidth = r * 0.09;
      g.beginPath(); g.ellipse(cx, cy, r * 1.55, r * 0.42, -0.35, 0, Math.PI); g.stroke();
    }
    // 둘레 반짝이
    for (var j = 0; j < 7; j++) {
      var aa = j * 0.9 + t * 0.0004, rr = r * (1.35 + 0.12 * Math.sin(t * 0.002 + j)), sx = cx + Math.cos(aa) * rr, sy = cy + Math.sin(aa) * rr * 0.8;
      g.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.35 * Math.sin(t * 0.003 + j * 1.7)).toFixed(3) + ')'; g.beginPath(); g.arc(sx, sy, W * 0.006, 0, 7); g.fill();
    }
  }

  // 순찰대 말 — {who}는 우리 개 이름
  var SAY = ['우주인 탐색 중…', '{who}자리 이상 무! 멍!', '저쪽에서 뭔가 반짝였어!', '오늘 별 몇 개 떴는지 세는 중', '순찰도 산책이랑 비슷해. 킁킁', '우주인 찾으면 제일 먼저 알려 줄게', '은하수까지 한 바퀴 다녀올게!'];

  function init(o) {
    o = o || {};
    if (!document.getElementById('nx-css')) { var st = document.createElement('style'); st.id = 'nx-css'; st.textContent = CSS; document.head.appendChild(st); }
    var box = o.box, who = o.who || '우리 개', dpr = Math.min(3, window.devicePixelRatio || 1);
    var alive = true, dogImg = null, rocketImg = null, alienImg = null;
    // ── 순찰대 ──
    var pw = 92, ph = 69, pat = document.createElement('div'); pat.className = 'nx-patrol'; pat.setAttribute('role', 'button'); pat.setAttribute('aria-label', '순찰대 ' + who + ' — 누르면 한마디');
    var pc = document.createElement('canvas'); pc.width = Math.round(pw * dpr); pc.height = Math.round(ph * dpr); pc.style.width = pw + 'px'; pc.style.height = ph + 'px'; pat.appendChild(pc);
    var say = document.createElement('div'); say.className = 'nx-say'; say.setAttribute('aria-live', 'polite');
    if (ON.patrol) { box.appendChild(pat); box.appendChild(say); }
    var si = 0, sayUntil = 0, sayHold = 0;
    function speak(text, hold) { say.textContent = text.replace('{who}', who); say.style.opacity = '1'; sayHold = performance.now() + (hold || 5200); }
    function nextLine() { si = (si + 1) % SAY.length; speak(SAY[si]); }
    speak(SAY[0]);
    pat.addEventListener('click', function (e) { e.stopPropagation(); nextLine(); });
    if (ON.patrol) {
      loadImg(o.dogSrc).then(function (im) { dogImg = im; });
      loadImg(ART.rocket).then(function (im) {
        rocketImg = im; if (!im) return;
        pw = 112; ph = Math.round(pw / ROCKET.aspect);   // 받은 로켓 비율로 칸을 다시
        pc.width = Math.round(pw * dpr); pc.height = Math.round(ph * dpr); pc.style.width = pw + 'px'; pc.style.height = ph + 'px';
      });
    }
    if (ON.alien) loadImg(ART.ufo).then(function (im) { alienImg = im; });
    var lastX = 0, faceL = false;
    // ── 외계 생명체 — 하늘을 열 때 세 번에 한 번쯤 ──
    var al = null, alT = 0, alOut = false, seen = +(lsGet('walson_alien_seen') || 0);
    function showAlien() {
      if (!ON.alien || !alive || al) return;
      al = document.createElement('div'); al.className = 'nx-alien'; al.setAttribute('role', 'button'); al.setAttribute('aria-label', 'UFO를 탄 외계 생명체 — 누르면 도망가요');
      var ac = document.createElement('canvas'); ac.width = Math.round(84 * dpr); ac.height = Math.round(60 * dpr); al.appendChild(ac);
      var right = Math.random() < 0.5, bw = box.clientWidth, bh = box.clientHeight;
      al.style.top = Math.round(bh * (0.35 + Math.random() * 0.4)) + 'px';
      al.style[right ? 'right' : 'left'] = '-8px';
      al.style.transform = 'translateX(' + (right ? 70 : -70) + 'px) rotate(' + (right ? -14 : 14) + 'deg)';
      box.appendChild(al);
      requestAnimationFrame(function () { requestAnimationFrame(function () { if (al) al.style.transform = 'translateX(0) rotate(' + (right ? -14 : 14) + 'deg)'; }); });
      alOut = true; alT = performance.now();
      seen++; lsSet('walson_alien_seen', String(seen));
      speak('앗, 저기! 우주인?!', 3200);
      al.addEventListener('click', function (e) {
        e.stopPropagation(); if (!al) return;
        al.style.transform = 'translate(' + (right ? 160 : -160) + 'px, -120px) rotate(' + (right ? 40 : -40) + 'deg) scale(.4)'; al.style.opacity = '0';
        speak('앗, 놓쳤다! 우주인 목격 ' + seen + '번째…', 4200);
        var a0 = al; al = null; setTimeout(function () { a0.remove(); }, 800);
      });
      setTimeout(function () {   // 3.5초 뒤 슬쩍 들어감
        if (!al) return;
        al.style.transform = 'translateX(' + (right ? 80 : -80) + 'px) rotate(0deg)';
        var a1 = al; al = null; setTimeout(function () { a1.remove(); }, 800);
        if (performance.now() < sayHold) speak('방금 그거 봤어? 다음엔 꼭 잡을게', 3600);
      }, 3500);
      al._draw = function (now) { if (ac.isConnected) drawUfo(ac.getContext('2d'), ac.width, ac.height, now, alienImg); };
      alDraw = al._draw;
    }
    var alDraw = null;
    if (ON.alien && !REDUCE && (o.alien === true || (o.alien !== false && Math.random() < 0.34))) setTimeout(showAlien, 4500 + Math.random() * 6000);
    // ── 그리기(night.html 한 장 그리기마다) ──
    function tick(now) {
      if (!alive) return;
      var bw = box.clientWidth, bh = box.clientHeight;
      if (!bw || !bh) return;
      if (!ON.patrol) { if (alDraw) alDraw(now); return; }
      var t = now / 1000, x, y, sc = 1, tilt = 0;
      // 별자리 위쪽 하늘 끝을 타원으로 한 바퀴(약 26초) — 위쪽 반은 멀리(작고 흐리게), 아래쪽 반은 가까이
      if (REDUCE) { x = bw * 0.62 - pw / 2; y = bh * 0.12 - ph / 2; }
      else {
        var th = t * 0.24, rx = bw / 2 - pw * 0.5, ry = bh * 0.085, depth = (Math.sin(th) + 1) / 2;
        sc = 0.7 + 0.3 * depth;
        x = bw / 2 + rx * Math.cos(th) - pw / 2; y = bh * 0.2 + ry * Math.sin(th) - ph / 2;
        tilt = Math.atan2(ry * Math.cos(th), -rx * Math.sin(th));   // 길 기울기
        if (Math.abs(tilt) > Math.PI / 2) tilt -= Math.sign(tilt) * Math.PI;
        tilt *= 0.6; pat.style.opacity = (0.78 + 0.22 * depth).toFixed(2);
      }
      var vx = x - lastX; lastX = x; if (Math.abs(vx) > 0.05) faceL = vx < 0;
      pat.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + tilt.toFixed(3) + 'rad) scale(' + ((faceL ? -1 : 1) * sc).toFixed(3) + ',' + sc.toFixed(3) + ')';
      var g = pc.getContext('2d');
      if (rocketImg) drawRocketArt(g, pc.width, pc.height, dogImg, rocketImg, now);
      else drawRocket(g, pc.width, pc.height, dogImg, 0.5 + 0.5 * Math.sin(now / 70));
      // 말풍선 — 로켓 위, 칸 밖으로 안 나가게
      var sw = say.offsetWidth || 120, sx = Math.max(6, Math.min(bw - sw - 6, x + pw / 2 - 24)), sy = Math.max(4, y + ph * (1 - sc) / 2 - 30);
      say.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)';
      if (now > sayHold) { if (now - sayHold < 2600) say.style.opacity = '0'; else nextLine(); }
      if (alDraw) alDraw(now);
    }
    // ── 행성 문 ──
    function openPlanet(kind, from) {
      track(kind, 'open');
      var memory = kind === 'memory';
      var back = document.createElement('div'); back.className = 'nx-pl' + (memory ? ' memory' : ''); back.setAttribute('role', 'dialog'); back.setAttribute('aria-modal', 'true');
      back.setAttribute('aria-label', memory ? '기억의 별' : '다른 강아지 별');
      back.innerHTML = '<canvas class="sparks" aria-hidden="true"></canvas><div class="orb"><canvas aria-hidden="true"></canvas></div>' +
        '<h2>' + (memory ? '기억의 별' : '다른 강아지 별') + '</h2>' +
        (memory
          ? '<p><span class="tag">정성껏 준비하고 있어요</span><br>언젠가 무지개다리를 건넌 친구를 별로 남겨 둘 수 있는 곳이에요. 보호자가 직접 남기고, 누구에게 보일지도 직접 정하게 만들고 있어요.</p>'
          : '<p><span class="tag">아직 공사 중이에요</span><br>친구들이 자기 하늘을 보여 주기로 하면 이 행성에서 다른 강아지들의 별을 구경할 수 있어요. 지금은 친구들 별이 오는 중이에요.</p>') +
        '<div class="btns"><button type="button" data-a="back">돌아가기</button><button type="button" data-a="wait" class="main">기다릴게요</button></div>';
      document.body.appendChild(back);
      // 줌인 — 누른 문 자리에서 작게 시작해 가운데로
      var orb = back.querySelector('.orb'), oc = orb.querySelector('canvas'), sp = back.querySelector('.sparks');
      var ow = orb.clientWidth || 240; oc.width = Math.round(ow * dpr); oc.height = oc.width;
      sp.width = Math.round(back.clientWidth * dpr); sp.height = Math.round(back.clientHeight * dpr);
      var fr = from && from.getBoundingClientRect ? from.getBoundingClientRect() : null, ob = orb.getBoundingClientRect();
      var dx = fr ? (fr.left + 22) - (ob.left + ob.width / 2) : 0, dy = fr ? (fr.top + fr.height / 2) - (ob.top + ob.height / 2) : 0;
      orb.style.transition = 'none'; orb.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.1)';
      requestAnimationFrame(function () { requestAnimationFrame(function () { back.classList.add('on'); orb.style.transition = ''; orb.style.transform = 'translate(0,0) scale(1)'; }); });
      // 잔별(뒤로 흐름) + 행성 반짝이
      var sr = [], k; for (k = 0; k < 90; k++) sr.push({ x: Math.random(), y: Math.random(), z: Math.random() });
      var raf2 = 0, t0 = performance.now();
      function loop(now) {
        raf2 = 0; if (!back.isConnected) return;
        var sg = sp.getContext('2d'), W = sp.width, H = sp.height, zoom = Math.min(1, (now - t0) / 1000);
        sg.clearRect(0, 0, W, H);
        sr.forEach(function (s) {
          var f = 1 + (1 - zoom) * 2.2 * s.z, x = W / 2 + (s.x - 0.5) * W * f, y = H / 2 + (s.y - 0.5) * H * f;
          sg.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.6 * s.z) + ')'; sg.beginPath(); sg.arc(x, y, (0.6 + s.z * 1.6) * dpr, 0, 7); sg.fill();
        });
        drawPlanet(oc.getContext('2d'), oc.width, kind, now);
        if (!REDUCE) raf2 = requestAnimationFrame(loop);
      }
      raf2 = requestAnimationFrame(loop);
      function close() { back.classList.remove('on'); orb.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.1)'; setTimeout(function () { if (raf2) cancelAnimationFrame(raf2); back.remove(); }, 380); document.removeEventListener('keydown', onKey, true); }
      function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
      document.addEventListener('keydown', onKey, true);
      back.addEventListener('click', function (e) {
        var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a');
        if (a === 'back') close();
        else if (a === 'wait') {
          track(kind, 'wait');
          var key = 'walson_sky_wait_' + kind; lsSet(key, '1');
          e.target.textContent = '기다리는 중 ✓'; e.target.disabled = true;
          if (o.toast) o.toast(memory ? '고마워요. 기다리는 마음을 세어 두고 정성껏 열게요.' : '고마워요! 기다리는 친구가 많으면 이 행성부터 열게요.');
        }
      });
      if (lsGet('walson_sky_wait_' + kind)) { var wb = back.querySelector('[data-a="wait"]'); wb.textContent = '기다리는 중 ✓'; wb.disabled = true; }
    }
    if (o.doors) {
      o.doors.innerHTML = '<button type="button" class="nx-door others" data-door="others"><i aria-hidden="true"></i><span>다른 강아지 별 보러 가기<small>친구들 하늘 구경 · 준비 중</small></span></button>' +
        '<button type="button" class="nx-door memory" data-door="memory"><i aria-hidden="true"></i><span>기억의 별<small>무지개다리 친구 · 준비 중</small></span></button>';
      o.doors.addEventListener('click', function (e) { var b = e.target.closest('[data-door]'); if (b) openPlanet(b.getAttribute('data-door'), b); });
    }
    return {
      tick: tick, openPlanet: openPlanet, showAlien: showAlien,
      destroy: function () { alive = false; pat.remove(); say.remove(); if (al) al.remove(); }
    };
  }
  // 3D 하늘(sky.html)이 같이 쓰는 것 — 순찰대 로켓·UFO 그리기, 말
  window.WalsonNightExtras = { init: init, ON: ON, ART: ART, ROCKET: ROCKET, SAY: SAY, loadImg: loadImg, drawRocketArt: drawRocketArt, drawRocket: drawRocket, drawUfo: drawUfo };
})();
