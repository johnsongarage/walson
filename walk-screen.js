// 산책 중 화면 공용 동작(2026-11-16 2단계) — 전역 window.WalkScreen. walk.html(위치 사용)과 go.html(시간만)이 같이 쓴다.
// 모양은 walk-screen.css. 끝내기 두 번(0단계), 메뉴 열고 닫기, 알림 띠, "○○랑 산책 중", QR 찍기(가게 도장 · 11/24 친구 카드 받아 두기, 앱 안 — qr-scan.js·shop-visits.js).
// 위치·기록은 각 화면이 다룬다. 이 파일은 어디로도 보내지 않는다(가게 QR 통계는 shop-visits.js의 stamp가 가게 번호만).
(function () {
  // Phosphor Icons(MIT)가 아니라 단순한 선 그림 — 화면마다 같은 모양을 쓰려고 여기 둔다
  var ICONS = {
    stamp: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 3v18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M7 4h11l-2.6 4.2L18 12.4H7z" fill="currentColor"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h3l3-6 4 12 3-6h3"/></svg>',
    warn: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg>'
  };

  // 끝내기는 두 번 눌러야(0단계) — 첫 번째는 4초 동안 "한 번 더 누르면 끝나요"만. 주머니 속에서 잘못 눌려 끝나지 않게.
  function twoTap(btn, normalText, onEnd) {
    var label = btn.querySelector('.ws-end-label') || btn, armedAt = 0, timer = null;
    function disarm() { armedAt = 0; clearTimeout(timer); btn.classList.remove('is-armed'); label.textContent = normalText; }
    btn.addEventListener('click', function () {
      if (armedAt && Date.now() - armedAt < 4000) { disarm(); onEnd(); return; }
      armedAt = Date.now();
      btn.classList.add('is-armed');
      label.textContent = '한 번 더 누르면 끝나요';
      clearTimeout(timer);
      timer = setTimeout(disarm, 4000);
    });
    return { disarm: disarm };
  }

  // 메뉴 — 버튼으로 열고, 바깥을 누르면 닫는다
  function menu(btn, box) {
    function set(open) { box.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); set(box.hidden); });
    document.addEventListener('click', function (e) { if (!box.hidden && !box.contains(e.target)) set(false); });
    return { close: function () { set(false); } };
  }

  // 알림 띠 — show(글, 'info'|'stamp'|'warn'). 8초 뒤 저절로 닫히고, 누르면 바로 닫힌다
  function notice(el) {
    var textEl = el.querySelector('.ws-notice-text'), iconEl = el.querySelector('.ws-notice-icon'), timer = null;
    el.addEventListener('click', function () { el.hidden = true; });
    return function show(text, kind) {
      kind = ICONS[kind] ? kind : 'info';
      el.className = 'ws-notice is-' + kind;
      if (iconEl) iconEl.innerHTML = ICONS[kind];
      textEl.textContent = text;
      el.hidden = false;
      clearTimeout(timer);
      timer = setTimeout(function () { el.hidden = true; }, 8000);
    };
  }

  // "보리랑" / "콩이랑" — 받침이 있으면 "이랑"
  function rang(name) {
    name = String(name || '').trim();
    if (!name) return '';
    var c = name.charCodeAt(name.length - 1);
    var batchim = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
    return name + (batchim ? '이랑' : '랑');
  }
  function walkerLine(name) { var r = rang(name); return (r ? r + ' ' : '') + '산책 중'; }

  // QR 찍기 — 산책 화면을 떠나지 않고. 결과는 알림 띠로(show)
  // 가게 QR → 방문 도장(shop-visits.js). 친구 QR → 받아 두기(11/24, dex-card.js receive — 넣을지는 산책 끝 화면에서 고른다)
  function scanShop(show) {
    if (!window.WalsonQR || !window.ShopVisits) return false;
    WalsonQR.scan({
      title: 'QR 찍기',
      hint: '친구 화면 QR이나 가게 카운터의 왈슨 QR을 네모 안에 맞춰 주세요. 산책 기록은 그대로 이어져요.',
      onText: function (text) {
        var dp = window.WalsonDexCard ? WalsonDexCard.payloadOf(text) : null;
        if (dp) {   // 친구 QR — 받아만 두고 산책은 계속
          var got = WalsonDexCard.receive(dp);
          if (got.error === 'name') return '이름에 전화번호나 인터넷 주소가 든 카드라 넣지 않았어요.';
          if (got.error === 'mine') return '내 카드예요. 이 QR은 다른 강아지 휴대폰에서 찍어 주세요.';
          if (got.error) return '왈슨 친구 QR이 아니에요. 친구 화면의 QR을 찍어 주세요.';
          show(got.dog.n + ' 카드 받아 뒀어요 · 강아지 먼저! 넣을지는 산책 끝나고 골라요', 'stamp');
          return true;
        }
        var id = ShopVisits.idFromQr(text);
        if (!id) return /(?:dex\.html|WALSON[^#]{0,40})#d=/.test(text)   // 친구 QR인데 카드 도구(dex-card.js)를 못 불러온 경우
          ? '강아지 도감 QR이에요. 산책을 마치고 [워킹패스] → 도감에서 찍어 주세요.'
          : '왈슨 QR이 아니에요. 친구 화면 QR이나 가게 카운터의 QR을 찍어 주세요.';
        var shop = ShopVisits.findShop(id);
        if (!shop) return '등록되지 않은 가게 QR이에요. 가게에 알려 주세요.';
        var r = ShopVisits.stamp(id);
        show((shop.name || '가게') + (r.already ? ' · 오늘 도장은 이미 찍었어요' : ' 방문 도장을 찍었어요 · ' + ShopVisits.countText(r)), 'stamp');
        return true;
      }
    });
    return true;
  }

  window.WalkScreen = { twoTap: twoTap, menu: menu, notice: notice, rang: rang, walkerLine: walkerLine, scanShop: scanShop, ICONS: ICONS };
})();
