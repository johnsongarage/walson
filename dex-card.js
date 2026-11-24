// 도감 카드 내용·주소(2026-11-18, dex.html에서 뺌). 전역 window.WalsonDexCard.
// 도감 화면 QR · 키링 뒷면 QR(주민증 탭 — id-card.js drawKeyringBack) · 도감의 "카드 주소 보내기"가 같은 카드를 쓰게 한 곳에 둔다.
// 카드 = #d=(강아지 이름·크기·성향·털색·무작위 번호). 위치·사진·견주 정보·성별·견종은 안 담는다.
// 2026-11-24부터 QR에는 링크가 아니라 글자(cardText — "WALSON 친구카드 #d=…")를 넣는다 — 아래 "친구 QR 글자".
// 링크(cardUrl, dex.html#d=…)는 "카드 주소 보내기"에만. #뒤는 서버로 가지 않는다.
// 내 번호는 store.js(WalsonStore, petwalk_dex_me) — 이 파일보다 store.js를 먼저 불러야 한다.
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
  // 강아지 이름에 연락처·주소를 싣지 못하게(2026-11-24 가르시아 "3번은 할 거야" — hq notes/petwalk-park-trouble.md 6-1 G).
  // 카드 QR의 이름은 모르는 사람 휴대폰에도 보이는 자유 글(12자)이라 "01012345678"·인터넷 주소 같은 걸 실어 보낼 수 있었다.
  // 막는 것: 숫자 7개 이상(전화번호) · 인터넷 주소(http·www·도메인 꼴·@). "1004"·"초코2"·"보리 3세" 같은 이름은 통과.
  // 카톡·인스타 아이디(abc123 등)는 강아지 이름과 구별이 안 돼 못 막는다.
  // 쓰는 곳: 워킹패스 만들기(start.html)·프로필 저장(profile.html)·내 카드(아래 myCard — 예전에 저장된 이름도)·받은 카드(dex.html).
  // 돌려주는 값: 막는 까닭('전화번호' / '인터넷 주소'), 괜찮으면 ''.
  function nameProblem(name) {
    var s = String(name == null ? '' : name);
    if ((s.match(/[0-9\uFF10-\uFF19]/g) || []).length >= 7) return '전화번호';
    if (/https?:|www\.|@|[a-z0-9-]\.(com|net|org|kr|co|me|io|ly|gl|link|page|app|site|shop|xyz)(\b|$)/i.test(s)) return '인터넷 주소';
    return '';
  }
  // 내 카드 — 주민증(이름)이 없으면 null. 이름에 연락처·주소가 있어도 null(QR로 내보내지 않는다 — 부르는 쪽이 nameProblem으로 까닭을 알린다)
  function myCard() {
    var p = WalsonStore.profile();
    if (!p || !p.name || nameProblem(p.name)) return Promise.resolve(null);
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
  // base: 'https://…/walson/'처럼 끝이 /인 주소. 없으면 지금 화면이 있는 곳.
  // 링크는 "카드 주소 보내기"(아는 사람에게·키링 신청 때 운영자에게 카톡으로)에만 쓴다 — QR에는 넣지 않는다(아래 cardText)
  function cardUrl(card, base) {
    return (base || location.origin + location.pathname.replace(/[^/]*$/, '')) + 'dex.html#d=' + encode(card);
  }
  // ── 친구 QR 글자(2026-11-24 가르시아 "그렇게 바꿔 줘. 괜히 누가 악용해서 큐싱당했다고 피곤한 일 생기는 것보다 낫지") ──
  // 견주끼리 보여 주는 QR(도감 화면 QR · 키링 뒷면)은 링크가 아니라 글자다. 휴대폰 카메라로 찍으면 이 글자만 보이고 아무 데도 열리지 않는다.
  // 왈슨 앱 안 [QR 찍기]만 #d= 뒤의 카드를 읽는다(payloadOf). 모르는 사람이 내민 QR을 찍어 링크를 여는 행동(큐싱)을 가르치지 않으려고 —
  // hq DECISIONS 11/24, notes/petwalk-park-trouble.md 7절. 머리 'WALSON 친구카드 '는 글자 꼴 표시라 바꾸지 말 것(뽑은 키링이 이 꼴로 읽힌다).
  // 링크 주소보다 짧아서 QR도 덜 빽빽하다.
  var QR_HEAD = 'WALSON 친구카드 ';
  function cardText(card) { return QR_HEAD + '#d=' + encode(card); }
  // 찍은 글에서 카드 글자(#d= 뒤)만 꺼낸다 — 새 글자 꼴과 예전 링크 꼴(dex.html#d= — 이미 퍼진 캡처·키링 샘플·카드 주소) 둘 다.
  // town.html(동네 QR 찍기)·walk-screen.js(산책 중 가게 QR 찍기)도 같은 꼴을 본다 — 바꾸면 거기도 같이.
  // 표시는 영문 'WALSON'으로 본다 — 한글(친구카드)은 읽는 쪽 글자 변환에 따라 깨질 수 있어서(카드 글자 #d= 뒤는 영문·숫자뿐이라 늘 그대로).
  function payloadOf(text) {
    var m = /(?:dex\.html|WALSON[^#]{0,40})#d=([A-Za-z0-9_-]+)/.exec(String(text || ''));
    return m ? m[1] : null;
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
  // 화면 QR 카드 — 내 카드 + 지금 시각 + 고른 한마디(없으면 빼고) + 내 아지트 방 모습 몇 글자(r, azit-room.js snapshot — 없으면 빼고)
  // 방 모습(2026-11-23 개방명록 2단계)은 그 자리에서 찍은 단짝 폰에만 남아 마실 갈 때 그 방으로 보인다. 키링·카드 주소 보내기에는 안 싣는다.
  function liveCard(card, m, r) {
    var c = {};
    for (var k in card) if (Object.prototype.hasOwnProperty.call(card, k)) c[k] = card[k];
    c.t = nowMin();
    if (m != null && MSGS[m]) c.m = m;
    if (typeof r === 'string' && r) c.r = r;
    return c;
  }
  // 화면 QR에 넣는 글자(11/24부터 링크 아님). liveUrl은 예전 꼴 — 이미 퍼진 링크가 열리는지 시험할 때만
  function liveText(card, m, r) { return cardText(liveCard(card, m, r)); }
  function liveUrl(card, m, r) { return cardUrl(liveCard(card, m, r)); }
  // ── 카드 읽기(2026-11-24 dex.html에서 옮김 — 도감·[동네]·산책 중 QR 찍기가 같이 쓴다) ──
  // 남이 만든 QR일 수 있으니 모양을 꼼꼼히 본다. 화면 QR이면 띄운 시각(t)·한마디 번호(m)·방 모습(r)이 더 있다 — 모양이 이상하면 없는 걸로.
  // 방 모습은 azit-room.js(WalsonAzit.parseRoom)가 있는 화면에서만 확인해 돌려준다(없으면 r: null — 받아 둘 땐 원래 글자를 그대로 두므로 잃지 않는다).
  var SIZE_OK = { s: 1, m: 1, l: 1 }, SIGNAL_OK = { g: 1, y: 1, r: 1 };
  function decodeCard(str) {
    try {
      var b = String(str).replace(/-/g, '+').replace(/_/g, '/');
      while (b.length % 4) b += '=';
      var o = JSON.parse(decodeURIComponent(escape(atob(b))));
      if (!o || o.v !== 1) return null;
      if (!/^[a-z0-9]{8}$/.test(o.i) || typeof o.n !== 'string' || !o.n.trim() || o.n.length > 12) return null;
      if (!SIZE_OK[o.s]) return null;
      if (o.g && !SIGNAL_OK[o.g]) return null;
      if (!/^#[0-9a-f]{6}$/i.test(o.c)) return null;
      var t = (typeof o.t === 'number' && o.t > 0 && o.t % 1 === 0) ? o.t : null;
      var m = (typeof o.m === 'number' && MSGS[o.m]) ? o.m : null;
      var r = (window.WalsonAzit && WalsonAzit.parseRoom(o.r)) ? o.r : null;
      return { i: o.i, n: o.n.trim(), s: o.s, g: o.g || '', c: o.c.toLowerCase(), t: t, m: m, r: r };
    } catch (e) { return null; }
  }

  // ── 받아 둔 카드(2026-11-24 가르시아 "2번 받아 두기 만들어 줘" — hq notes/petwalk-park-trouble.md 6절 C) ──
  // 앱 안에서 친구 QR을 찍으면 그 자리에선 받아 두기만 하고, 넣을지는 산책이 끝난 뒤에 고른다 — 강아지끼리 붙어 있을 때 폰 보는 시간을 줄이려고.
  // 단짝인지(그 자리 화면 QR)는 찍은 순간에 정해 둔다(k) — 나중에 넣어도 그대로. 고르기 전엔 도감·아지트·통계에 들어가지 않는다.
  // 하나 = { p: 찍은 카드 글자(#d= 뒤 그대로 — 방 모습까지), i: 번호, n: 이름, k: 'live'|'stale'|'static', d: 찍은 날짜 'YYYY-MM-DD' }.
  // 같은 강아지를 또 찍으면 한 장으로(그 자리 화면 QR이 이긴다). 최근 20장까지. 이 휴대폰에만(store.js KEYS.dexPending).
  var PENDING_KEY = (window.WalsonStore && WalsonStore.KEYS && WalsonStore.KEYS.dexPending) || 'petwalk_dex_pending', PENDING_MAX = 20;
  function dayKey(dt) { var d = dt || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function pendingList() {
    return WalsonStore.list(PENDING_KEY).filter(function (x) { return x && typeof x.p === 'string' && /^[a-z0-9]{8}$/.test(x.i); });
  }
  function dropPending(i) {
    var list = pendingList(), left = list.filter(function (x) { return x.i !== i; });
    if (left.length !== list.length) WalsonStore.setJSON(PENDING_KEY, left);
    return left;
  }
  // 앱 안에서 찍은 카드 글자(payloadOf로 꺼낸 것)를 받아 둔다.
  // 돌려주는 값: { ok: true, dog, kind, again } 또는 { error: 'bad'(카드 아님) | 'name'(이름에 연락처·주소) | 'mine'(내 카드), dog }
  function receive(payload) {
    var dog = decodeCard(payload);
    if (!dog) return { error: 'bad' };
    if (nameProblem(dog.n)) return { error: 'name' };
    if (dog.i === myId()) return { error: 'mine', dog: dog };
    var kind = kindOf(dog.t), list = pendingList(), old = null;
    list = list.filter(function (x) { if (x.i === dog.i) { old = x; return false; } return true; });
    var item = { p: String(payload), i: dog.i, n: dog.n, k: kind, d: dayKey() };
    if (old && old.k === 'live' && kind !== 'live' && old.d === item.d) item = old;   // 같은 날 단짝으로 찍은 게 있으면 그걸 남긴다
    list.push(item);
    if (list.length > PENDING_MAX) list = list.slice(-PENDING_MAX);
    WalsonStore.setJSON(PENDING_KEY, list);
    return { ok: true, dog: dog, kind: item.k, again: !!old };
  }

  // 받은 카드가 어떤 QR이었나: 'live' 몇 분 안에 띄운 화면 · 'stale' 지난 캡처 · 'static' 시각 없음(키링·카드 주소·예전 QR)
  function kindOf(t) {
    if (typeof t !== 'number' || !isFinite(t)) return 'static';
    var age = nowMin() - t;
    return (age >= -LIVE_MIN && age <= LIVE_MIN) ? 'live' : 'stale';
  }

  window.WalsonDexCard = {
    SIZE_FROM: SIZE_FROM, SIG_FROM: SIG_FROM, PALETTE: PALETTE,
    myId: myId, hashColor: hashColor, photoColor: photoColor, myCard: myCard, encode: encode, cardUrl: cardUrl, nameProblem: nameProblem,
    QR_HEAD: QR_HEAD, cardText: cardText, payloadOf: payloadOf, decodeCard: decodeCard,
    receive: receive, pendingList: pendingList, dropPending: dropPending, dayKey: dayKey,
    LIVE_MIN: LIVE_MIN, MSGS: MSGS, stampSvg: stampSvg, liveText: liveText, liveUrl: liveUrl, kindOf: kindOf
  };
})();
