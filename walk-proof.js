// 산책 인증샷(2026-11-15, hq 개발 후보 1번 — 우산 앱 참고). 전역 window.WalkProof.
// "오늘의 한 장" 사진 위에 날짜·걸은 시간·강아지 이름·끝 화면 답(충분했나·킁킁·응가)·로고를 얹어
// 인스타 피드(4:5)·스토리(9:16) 이미지로 저장·공유한다.
// 위치·경로·지도는 넣지 않는다(집 근처 동선 노출 방지 — 경로를 넣게 되면 "집 주변 숨김 구역"이 먼저).
// 모든 그리기는 이 휴대폰 안에서만 하고 어디로도 올리지 않는다(공유는 사용자가 고른 앱으로).
// 쓰는 곳: walk-end.html(산책 끝 화면), walk-history.html(사진이 있는 기록)
//   WalkProof.open({ src: 사진 주소(blob:/data:/같은 사이트), walk: 산책 기록, profile: 프로필 })
(function () {
  var FORMATS = { feed: { w: 1080, h: 1350, label: '피드 4:5' }, story: { w: 1080, h: 1920, label: '스토리 9:16' } };
  var SIGNAL = { green: '#3f9b5b', yellow: '#dfa21f', red: '#d2493f' };
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var URL_TEXT = 'johnsongarage.co.kr/walson';

  function brutal() { return !!(window.WalsonTheme && window.WalsonTheme.isBrutal); }
  function font(w, s) { return w + ' ' + s + 'px Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'; }
  function bigFont(s) { return s + 'px "Black Han Sans", Pretendard, sans-serif'; }
  function withJosa(name) {
    var c = name.charCodeAt(name.length - 1);
    if (c < 0xAC00 || c > 0xD7A3) return name + '와(과)';
    return name + ((c - 0xAC00) % 28 ? '과' : '와');
  }
  function loadImg(src) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var i = new Image();
      i.onload = function () { res(i); };
      i.onerror = function () { res(null); };
      i.src = src;
    });
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // 끝 화면 답 → 칩 글자
  function chips(walk) {
    var out = [];
    if (walk.feel === 'enough') out.push('충분했어요');
    else if (walk.feel === 'short') out.push('조금 아쉬워요');
    if (walk.sniff) out.push('킁킁 ' + walk.sniff + '/5');
    if (walk.poop === 0) out.push('응가 안 함');
    else if (walk.poop === 1) out.push('응가 1번');
    else if (walk.poop >= 2) out.push('응가 2번+');
    return out;
  }
  function dateText(d) {
    var dt = new Date(String(d || '').slice(0, 10) + 'T00:00:00');
    if (isNaN(dt)) dt = new Date();
    return (dt.getMonth() + 1) + '월 ' + dt.getDate() + '일 ' + DOW[dt.getDay()] + '요일';
  }

  function draw(photo, logo, walk, profile, fmt) {
    var F = FORMATS[fmt] || FORMATS.feed, W = F.w, H = F.h, B = brutal();
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    var ink = '#3a2e24';

    // 사진(꽉 차게). 없으면 바탕색
    ctx.fillStyle = B ? '#F2B833' : '#f3ddd2';
    ctx.fillRect(0, 0, W, H);
    if (photo) {
      var s = Math.max(W / photo.width, H / photo.height);
      ctx.drawImage(photo, (W - photo.width * s) / 2, (H - photo.height * s) / 2, photo.width * s, photo.height * s);
    }

    // 위: 로고 + 날짜
    var pad = 56;
    if (B) {
      ctx.fillStyle = '#000'; ctx.fillRect(pad + 8, pad + 8, 300, 104);
      ctx.fillStyle = '#F2B833'; ctx.fillRect(pad, pad, 300, 104);
      ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.strokeRect(pad, pad, 300, 104);
    } else {
      ctx.fillStyle = 'rgba(255,250,243,0.92)'; roundRect(ctx, pad, pad, 300, 104, 52); ctx.fill();
    }
    if (logo) {
      ctx.save();
      if (!B) { ctx.beginPath(); ctx.arc(pad + 54, pad + 52, 40, 0, Math.PI * 2); ctx.clip(); }
      ctx.drawImage(logo, pad + 14, pad + 12, 80, 80 * logo.height / logo.width);
      ctx.restore();
    }
    ctx.fillStyle = B ? '#000' : ink;
    ctx.font = bigFont(56); ctx.textBaseline = 'middle';
    ctx.fillText('왈슨', pad + 110, pad + 56);
    ctx.font = font(800, 34);
    var dt = dateText(walk.date), dtw = ctx.measureText(dt).width + 56;
    if (B) {
      ctx.fillStyle = '#000'; ctx.fillRect(W - pad - dtw, pad + 22, dtw, 64);
      ctx.fillStyle = '#F2B833'; ctx.fillText(dt, W - pad - dtw + 28, pad + 55);
    } else {
      ctx.fillStyle = 'rgba(58,46,36,0.72)'; roundRect(ctx, W - pad - dtw, pad + 22, dtw, 64, 32); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(dt, W - pad - dtw + 28, pad + 55);
    }

    // 아래: 판(부드러운 그림자 띠 / 뉴브루탈 노랑 판)
    var panelH = fmt === 'story' ? 640 : 560, py = H - panelH;
    if (B) {
      ctx.fillStyle = '#F2B833'; ctx.fillRect(0, py, W, panelH);
      ctx.fillStyle = '#000'; ctx.fillRect(0, py, W, 8);
    } else {
      var g = ctx.createLinearGradient(0, py - 120, 0, H);
      g.addColorStop(0, 'rgba(30,20,12,0)'); g.addColorStop(0.35, 'rgba(30,20,12,0.55)'); g.addColorStop(1, 'rgba(30,20,12,0.85)');
      ctx.fillStyle = g; ctx.fillRect(0, py - 120, W, panelH + 120);
    }
    var txt = B ? '#000' : '#fff', soft = B ? '#000' : 'rgba(255,255,255,0.85)';
    var x = pad, y = py + (B ? 70 : 60);
    var name = (profile && profile.name) || '우리 개';
    ctx.textBaseline = 'alphabetic';
    // 신호등 색 점 + "초코와 산책"
    var sig = SIGNAL[profile && profile.signal];
    if (sig) {
      ctx.fillStyle = sig; ctx.beginPath(); ctx.arc(x + 18, y + 2, 18, 0, Math.PI * 2); ctx.fill();
      if (B) { ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.stroke(); }
    }
    ctx.fillStyle = soft; ctx.font = font(800, 46);
    ctx.fillText(withJosa(name) + ' 산책', x + (sig ? 50 : 0), y + 18);
    // 큰 숫자: 걸은 분
    y += 210;
    ctx.fillStyle = txt; ctx.font = bigFont(200);
    var min = String(walk.durationMin || 0);
    ctx.fillText(min, x - 6, y);
    var mw = ctx.measureText(min).width;
    ctx.font = bigFont(84);
    ctx.fillText('분', x + mw + 10, y);
    var unitW = ctx.measureText('분').width;
    ctx.font = font(800, 40); ctx.fillStyle = soft;
    var tail = (walk.distanceKm ? walk.distanceKm.toFixed(1) + 'km · ' : '') + '산책 완료';
    ctx.fillText(tail, x + mw + 10 + unitW + 26, y);
    // 칩
    y += 50;
    var cx = x, list = chips(walk);
    ctx.font = font(800, 36);
    list.forEach(function (t) {
      var w = ctx.measureText(t).width + 48;
      if (cx + w > W - pad) return;
      if (B) {
        ctx.fillStyle = '#000'; ctx.fillRect(cx + 6, y + 6, w, 66);
        ctx.fillStyle = '#C8F06A'; ctx.fillRect(cx, y, w, 66);
        ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeRect(cx, y, w, 66);
      } else {
        ctx.fillStyle = 'rgba(255,250,243,0.95)'; roundRect(ctx, cx, y, w, 66, 33); ctx.fill();
      }
      ctx.fillStyle = B ? '#000' : ink; ctx.textBaseline = 'middle';
      ctx.fillText(t, cx + 24, y + 35);
      ctx.textBaseline = 'alphabetic';
      cx += w + 16;
    });
    // 맨 아래 주소
    ctx.font = font(700, 30); ctx.fillStyle = soft;
    ctx.fillText('다산동 댕댕이 산책앱 · ' + URL_TEXT, x, H - (fmt === 'story' ? 90 : 56));
    return c;
  }

  // ── 미리 보기·저장 시트 ──
  var styleAdded = false;
  function addStyle() {
    if (styleAdded) return; styleAdded = true;
    var css = document.createElement('style');
    css.textContent =
      '.wp-back{position:fixed;inset:0;z-index:3000;background:rgba(30,20,12,.6);display:flex;align-items:flex-end;justify-content:center;overflow-y:auto;}' +
      '.wp-sheet{width:100%;max-width:440px;background:#fffaf3;border-radius:20px 20px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));margin-top:auto;' +
        'font-family:Pretendard,-apple-system,"Malgun Gothic",sans-serif;color:#4a3f35;}' +
      '.wp-sheet h3{margin:0 0 10px;font-size:16px;font-weight:800;}' +
      '.wp-prev{display:block;max-width:100%;max-height:58vh;margin:0 auto;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.2);}' +
      '.wp-fmt{display:flex;gap:8px;margin:12px 0;}' +
      '.wp-fmt button,.wp-row button{flex:1;font:800 14px Pretendard,-apple-system,sans-serif;padding:11px;border-radius:12px;border:1px solid #e6d6c1;background:#fff;color:#4a3f35;cursor:pointer;}' +
      '.wp-fmt button[aria-pressed="true"]{background:#4a3f35;color:#fff;border-color:#4a3f35;}' +
      '.wp-row{display:flex;gap:8px;}' +
      '.wp-row .wp-save{background:#b8563a;border-color:#b8563a;color:#fff;flex:2;}' +
      '.wp-note{font-size:12px;color:#6b5d4e;margin:10px 2px 0;line-height:1.5;}' +
      '[data-theme="brutal"] .wp-sheet{border-radius:0;border-top:4px solid #000;}' +
      '[data-theme="brutal"] .wp-prev{border-radius:0;border:3px solid #000;box-shadow:5px 5px 0 #000;}' +
      '[data-theme="brutal"] .wp-fmt button,[data-theme="brutal"] .wp-row button{border-radius:0;border:3px solid #000;color:#000;}' +
      '[data-theme="brutal"] .wp-fmt button[aria-pressed="true"]{background:#000;color:#F2B833;}' +
      '[data-theme="brutal"] .wp-row .wp-save{background:#FF6BB5;color:#000;}';
    document.head.appendChild(css);
  }

  function saveCanvas(canvas, fmt) {
    if (window.WalsonTrack) WalsonTrack.send('card_saved', { what: 'walk_proof', format: fmt });
    canvas.toBlob(function (blob) {
      var file = new File([blob], 'walson-walk-' + fmt + '.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file] }).catch(function () { /* 사용자가 닫음 */ });
        return;
      }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }, 'image/png');
  }

  function open(opts) {
    addStyle();
    var fmt = 'feed', canvas = null;
    var back = document.createElement('div');
    back.className = 'wp-back';
    back.innerHTML =
      '<div class="wp-sheet" role="dialog" aria-modal="true" aria-label="산책 인증샷">' +
        '<h3>산책 인증샷</h3>' +
        '<img class="wp-prev" alt="인증샷 미리 보기">' +
        '<div class="wp-fmt"><button type="button" data-f="feed" aria-pressed="true">피드 4:5</button><button type="button" data-f="story" aria-pressed="false">스토리 9:16</button></div>' +
        '<div class="wp-row"><button type="button" class="wp-close">닫기</button><button type="button" class="wp-save">저장·공유</button></div>' +
        '<p class="wp-note">사진·이름·시간만 들어가고 위치·산책 길은 들어가지 않아요. 이 휴대폰에서 만들어요.</p>' +
      '</div>';
    document.body.appendChild(back);
    var prev = back.querySelector('.wp-prev');
    function close() { back.remove(); }
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    back.querySelector('.wp-close').addEventListener('click', close);
    back.querySelector('.wp-save').addEventListener('click', function () { if (canvas) saveCanvas(canvas, fmt); });

    var fontsReady = (document.fonts && document.fonts.load)
      ? Promise.all([document.fonts.load('200px "Black Han Sans"'), document.fonts.load('800 46px Pretendard')]).catch(function () {})
      : Promise.resolve();
    var assets = Promise.all([loadImg(opts.src), loadImg('icons/walson-logo.webp'), fontsReady]);
    function render() {
      assets.then(function (r) {
        canvas = draw(r[0], r[1], opts.walk || {}, opts.profile || {}, fmt);
        prev.src = canvas.toDataURL('image/jpeg', 0.85);
      });
    }
    Array.prototype.forEach.call(back.querySelectorAll('.wp-fmt button'), function (b) {
      b.addEventListener('click', function () {
        fmt = b.getAttribute('data-f');
        Array.prototype.forEach.call(back.querySelectorAll('.wp-fmt button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
    });
    render();
  }

  window.WalkProof = { open: open, draw: draw };
})();
