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

  // ── 화면 QR(2026-11-23 개방명록 1단계, hq DECISIONS 11/23) ──
  // 앱 안 "내 카드 보여 주기" QR에는 띄운 시각(t, 1970년부터 센 분)과 고른 한마디 번호(m)를 더 담는다.
  // 찍은 쪽은 몇 분 안에 띄운 화면 QR이면 단짝 + 한마디로, 시각이 없는 QR(키링 뒷면 인쇄·NFC·카드 주소 보내기)이나
  // 지난 캡처는 발자국으로 적는다. 키링·NFC·카드 주소 보내기는 지금처럼 cardUrl(시각 없음) 그대로 — 이미 뽑은 키링도 그대로 읽힌다.
  // 예전 왈슨으로 찍으면 t·m은 무시되고 지금처럼 도감에 들어간다.
  var LIVE_MIN = 5;   // 띄운 지 이 분 수 안이면 그 자리에서 찍은 걸로 본다(휴대폰끼리 시계가 다른 것도 이만큼 봐준다)

  // 한마디는 고르기만(11/23 — 모르는 사람 글·장소·시간·연락처가 샐 틈이 없게. 직접 쓰는 글은 서버가 생긴 뒤 편지에서).
  // 강아지가 강아지에게 하는 말. 받은 기록에 번호로 남으니 순서를 바꾸거나 지우지 말 것 — 새 말은 맨 뒤에 더한다.
  // 간식 말은 넣지 않는다(남의 개에게 간식 — 키링 뒷면 "간식 주지 마세요"와 부딪힘)
  // 11/24 가르시아 "3 수정해": 받는 사람이 모르는 견주라 견주가 건네는 말로 읽힐 수 있는 셋(냄새 칭찬 · 친구 하자 · 부끄러워서 말 못 했어)을
  // 강아지 말이 분명하게(코 인사 고마워 · 우리 이제 킁킁 친구! · 수줍어서 멍도 못 했어) 바꿨다. 번호와 뜻(고마움·친구·수줍음)은 그대로라 예전에 받은 기록도 새 글자로 보인다.
  // 새로 더하는 말도 "너"(받는 사람)를 칭찬하거나 다시 만나자고 조르는 말은 피한다 — hq notes/petwalk-park-trouble.md 9번
  var MSGS = [
    { t: '킁킁! 반가웠어', s: 'nose' },
    { t: '또 냄새 맡자', s: 'paw' },
    { t: '코 인사 고마워', s: 'heart' },
    { t: '꼬리 흔든 거 봤지?', s: 'sparkle' },
    { t: '우리 이제 킁킁 친구!', s: 'star' },
    { t: '다음에 또 놀자', s: 'ball' },
    { t: '수줍어서 멍도 못\u00a0했어', s: 'bubble' },   // \u00a0: 좁은 칸에서 "못 / 했어"로 갈리지 않게
    { t: '오늘 산책 최고!', s: 'bone' }
  ];
  // 도장 그림 — 7×7 도트, 색은 쓰는 곳의 글자 색(currentColor)
  var STAMPS = {
    nose:    ['.......', '.#####.', '#######', '##.#.##', '.#####.', '..###..', '.......'],
    paw:     ['.#.#.#.', '.#.#.#.', '#.....#', '..###..', '.#####.', '.#####.', '..###..'],
    heart:   ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
    sparkle: ['...#...', '...#...', '..###..', '#######', '..###..', '...#...', '...#...'],
    star:    ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'],
    ball:    ['..###..', '.#####.', '#######', '#.....#', '#######', '.#####.', '..###..'],
    bubble:  ['.#####.', '#######', '#.#.#.#', '#######', '.#####.', '..#....', '.#.....'],
    bone:    ['.......', '##...##', '#######', '.#####.', '#######', '##...##', '.......']
  };
  function stampSvg(name) {
    var rows = STAMPS[name] || STAMPS.paw, d = '';
    rows.forEach(function (r, y) {
      // 가로로 붙은 칸은 한 덩어리로(칸 사이 틈이 안 보이게)
      r.replace(/#+/g, function (run, x) { d += 'M' + x + ' ' + y + 'h' + run.length + 'v1h-' + run.length + 'z'; return run; });
    });
    return '<svg viewBox="0 0 7 7" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" d="' + d + '"/></svg>';
  }
  function nowMin() { return Math.floor(Date.now() / 60000); }
  // 화면 QR 주소 — 내 카드 + 지금 시각 + 고른 한마디(없으면 빼고) + 내 아지트 방 모습 몇 글자(r, azit-room.js snapshot — 없으면 빼고)
  // 방 모습(2026-11-23 개방명록 2단계)은 그 자리에서 찍은 단짝 폰에만 남아 마실 갈 때 그 방으로 보인다. 키링·카드 주소 보내기에는 안 싣는다.
  function liveUrl(card, m, r) {
    var c = {};
    for (var k in card) if (Object.prototype.hasOwnProperty.call(card, k)) c[k] = card[k];
    c.t = nowMin();
    if (m != null && MSGS[m]) c.m = m;
    if (typeof r === 'string' && r) c.r = r;
    return cardUrl(c);
  }
  // 받은 카드가 어떤 QR이었나: 'live' 몇 분 안에 띄운 화면 · 'stale' 지난 캡처 · 'static' 시각 없음(키링·카드 주소·예전 QR)
  function kindOf(t) {
    if (typeof t !== 'number' || !isFinite(t)) return 'static';
    var age = nowMin() - t;
    return (age >= -LIVE_MIN && age <= LIVE_MIN) ? 'live' : 'stale';
  }

  window.WalsonDexCard = {
    SIZE_FROM: SIZE_FROM, SIG_FROM: SIG_FROM, PALETTE: PALETTE,
    myId: myId, hashColor: hashColor, photoColor: photoColor, myCard: myCard, encode: encode, cardUrl: cardUrl,
    LIVE_MIN: LIVE_MIN, MSGS: MSGS, stampSvg: stampSvg, liveUrl: liveUrl, kindOf: kindOf
  };
})();
