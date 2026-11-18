// 도감 카드 내용·주소(2026-11-18, dex.html에서 뺌). 전역 window.WalsonDexCard.
// 키링 뒷면 QR·NFC(주민증 탭 — id-card.js drawKeyringBack)와 도감의 "카드 주소 보내기"가 같은 주소를 쓰게 한 곳에 둔다.
// 주소 = 화면 주소 + dex.html#d=(강아지 이름·크기·성향·털색·무작위 번호). 위치·사진·견주 정보·성별·견종은 안 담는다.
// #뒤는 서버로 가지 않는다. 내 번호는 store.js(WalsonStore, petwalk_dex_me) — 이 파일보다 store.js를 먼저 불러야 한다.
(function () {
  var SIZE_FROM = { small: 's', medium: 'm', large: 'l' };
  var SIG_FROM = { green: 'g', yellow: 'y', red: 'r' };
  var PALETTE = ['#e8b77a', '#c98a5a', '#f2d7b6', '#8a6a52', '#f0efe9', '#5a4636', '#d9a066', '#b9b2a8'];

  function myId() {
    var id = WalsonStore.get(WalsonStore.KEYS.dexMe);
    if (!id || !/^[a-z0-9]{8}$/.test(id)) {
      id = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
      WalsonStore.set(WalsonStore.KEYS.dexMe, id);   // 저장 못 하면 이번만
    }
    return id;
  }
  function hashColor(id) { var h = 0; for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return PALETTE[h % PALETTE.length]; }
  // 프로필 사진 가운데 색을 하나 뽑아 털색으로 쓴다(사진 자체는 QR에 안 넣는다)
  function photoColor(src) {
    return new Promise(function (resolve) {
      if (!src) { resolve(null); return; }
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = c.height = 12;
          var ctx = c.getContext('2d');
          var s = Math.min(img.width, img.height) * 0.5;
          ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 12, 12);
          var d = ctx.getImageData(0, 0, 12, 12).data, r = 0, g = 0, b = 0, n = d.length / 4;
          for (var i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
          var hex = function (v) { return Math.round(v / n).toString(16).padStart(2, '0'); };
          resolve('#' + hex(r) + hex(g) + hex(b));
        } catch (e) { resolve(null); }
      };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }
  // 내 카드 — 주민증(이름)이 없으면 null
  function myCard() {
    var p = WalsonStore.profile();
    if (!p || !p.name) return Promise.resolve(null);
    var id = myId();
    return photoColor(p.photo).then(function (c) {
      return { v: 1, i: id, n: String(p.name).slice(0, 12), s: SIZE_FROM[p.size] || 'm', g: SIG_FROM[p.signal] || '', c: c || hashColor(id) };
    });
  }
  // QR 안의 글자 — base64url(JSON)
  function encode(card) {
    var b = btoa(unescape(encodeURIComponent(JSON.stringify(card))));
    return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  // base: 'https://…/walson/'처럼 끝이 /인 주소. 없으면 지금 화면이 있는 곳(앱 안 QR 교환은 이쪽)
  function cardUrl(card, base) {
    return (base || location.origin + location.pathname.replace(/[^/]*$/, '')) + 'dex.html#d=' + encode(card);
  }

  window.WalsonDexCard = {
    SIZE_FROM: SIZE_FROM, SIG_FROM: SIG_FROM, PALETTE: PALETTE,
    myId: myId, hashColor: hashColor, photoColor: photoColor, myCard: myCard, encode: encode, cardUrl: cardUrl
  };
})();
