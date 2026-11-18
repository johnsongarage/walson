// 강아지 주민증 그림(2026-11-16 자라는 주민증 — 가르시아 "자라는 카드를 주민증에 합쳐").
// 주민증 만들기(start.html)와 [주민증] 탭(my-card.html)이 같이 쓴다. 예전엔 start.html 안에만 있었다.
// 앞면: 예전 주민증 그대로 + 부제가 주민 등급("남양주 다산동 토박이") + 정착 주민부터 사진 귀퉁이에 빨간 승급 도장 + 승급일.
// 뒷면: 진짜 주민등록증 뒷면의 "주소 변경" 칸 패러디 — 승급 기록 · 발도장 기록 · 특기 · 특이 사항.
// 테두리는 견주가 고른 카드 색(기본 모카 — 2026-11-18 가르시아 "모카 기본으로": 색을 정치적으로 보는 사람이 있을 수 있어 선택권).
// 성향 띠·불은 성향 색 그대로 — 안전 표시는 남긴다(11/15 "테두리는 신호등 색" 원칙을 띠·불로 옮김). 등급 숫자는 reward-rules.js RANKS.
// 키링 뒷면(drawKeyringBack): 도감 카드 주소 QR·NFC 안내 + 보호자 연락처·예방접종(광견병·종합)·메모 손글씨 칸(11/18 시안 2).
// 그림은 이 휴대폰 안에서만 그리고 어디로도 보내지 않는다. QR은 qrcode-generator를 먼저 불러야 그려진다(없으면 QR 없이).
// 고치면 쓰는 화면(start.html·my-card.html)의 ?v= 번호를 같이 올릴 것.
(function () {
  var W = 1600, H = 1000;
  var PHOTO_BOX = { x: 96, y: 318, w: 460, h: 520 };   // 앞면 사진 칸 — 편집기가 이 칸 안에서 사진을 끌고 키운다
  // 카드에 찍는 "나도 만들기" 주소(2026-11-14 피드백: 카드를 본 사람이 들어올 입구가 없었다) — 내 도메인 주소(QR_RULES.md의 원칙)
  var SHARE_URL = 'https://johnsongarage.co.kr/walson/start.html';
  var SHARE_URL_TEXT = 'johnsongarage.co.kr/walson';
  var SIGNALS = {
    green:  { line: '다가와도 좋아요', color: '#3f9b5b' },
    yellow: { line: '천천히 인사해요', color: '#dfa21f' },
    red:    { line: '눈으로만 예뻐해 주세요', color: '#d2493f' },
    // 신호등을 정하지 않은 가게 수호지킴이용 — 불은 켜지 않고 앱 색으로 그린다
    none:   { label: '수호견', line: '가게를 지키고 있어요', color: '#b8563a' }
  };
  // 카드 색(2026-11-18) — 테두리·저장 바탕·키링 뒷면 QR 판. 프로필 cardColor에 id로 저장, 없으면 모카.
  // 어느 색이든 누군가는 정당 색으로 볼 수 있어서 '중립 색 찾기' 대신 견주가 고른다. 'signal'은 성향 색 그대로(11/18 전까지의 모양)
  var CARD_COLORS = [
    { id: 'mocha', label: '모카', color: '#6b4f3a' },
    { id: 'sand', label: '모래', color: '#cdb796' },
    { id: 'ink', label: '먹색', color: '#44403c' },
    { id: 'sky', label: '하늘', color: '#7fb0d6' },
    { id: 'pink', label: '분홍', color: '#e9a0b4' },
    { id: 'signal', label: '성향 색', color: null }
  ];
  function cardColor(profile) {
    var id = profile && profile.cardColor;
    for (var i = 0; i < CARD_COLORS.length; i++) {
      if (CARD_COLORS[i].id === id) return CARD_COLORS[i].color || (SIGNALS[profile.signal] || SIGNALS.none).color;
    }
    return CARD_COLORS[0].color;
  }
  // 이름 옆에 붙는 것(2026-11-18) — 성별(암컷·수컷)·중성화·견종. 프로필에 적은 것만, 안 적었으면 빈 배열
  function infoBits(profile) {
    var bits = [];
    if (profile.sex === 'female') bits.push('암컷'); else if (profile.sex === 'male') bits.push('수컷');
    if (profile.neutered) bits.push('중성화');
    var breed = String(profile.breed || '').trim();
    if (breed) bits.push(breed);
    return bits;
  }
  var INK = '#4a3f35', SOFT = '#8a7a68', LINE = '#e6d6c1', CREAM = '#fffaf3', DIM = '#b9aa96', SEAL = '#c8423a';
  var SANS = 'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  var BIG = '"Black Han Sans", ' + SANS;   // 도장 글자(영수증 상환 도장과 같은 글꼴)

  function font(weight, size) { return weight + ' ' + size + 'px ' + SANS; }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  // 글자가 칸을 넘으면 글자 크기를 줄여서 맞춘다(긴 이름 대비)
  function fitText(ctx, text, maxWidth, size, weight) {
    var s = size;
    do {
      ctx.font = font(weight, s);
      if (ctx.measureText(text).width <= maxWidth) break;
      s -= 4;
    } while (s > 24);
    return s;
  }
  function loadImage(src) {
    return new Promise(function (resolve) {
      if (!src) { resolve(null); return; }
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }
  // 웹폰트가 아직 안 왔으면 기다렸다가 그린다(안 오면 기기 글꼴로 그려진다)
  function fontsReady() {
    if (!(document.fonts && document.fonts.load)) return Promise.resolve();
    return Promise.all([
      document.fonts.load('800 76px Pretendard'), document.fonts.load('700 36px Pretendard'), document.fonts.load('600 34px Pretendard'),
      document.fonts.load('60px "Black Han Sans"', '새내기정착주민토박이터줏대감확인전입')
    ]).catch(function () {});
  }
  function todayText() {
    var d = new Date();
    return d.getFullYear() + '. ' + (d.getMonth() + 1) + '. ' + d.getDate() + '.';
  }
  // 'YYYY. M. D.'(발급일) → 'YYYY-MM-DD'
  function keyFromText(t) {
    var m = /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/.exec(t || '');
    return m ? m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2) : null;
  }
  // 'YYYY-MM-DD' → 'YYYY. M. D.'(발급일과 같은 모양)
  function dateText(key) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
    return m ? m[1] + '. ' + (+m[2]) + '. ' + (+m[3]) + '.' : (key || '');
  }

  // QR을 size×size 칸 오른쪽 위에 맞춰 그린다. 라이브러리가 없으면 아무것도 그리지 않는다.
  function drawQr(ctx, text, x, y, size) {
    if (typeof qrcode !== 'function') return;
    var qr;
    // 오류 정정은 가장 낮은 L — 화면으로 보는 그림이라 긁힐 일이 없고, 칸이 굵어져 작게 줄여도 읽힌다
    try { qr = qrcode(0, 'L'); qr.addData(text); qr.make(); } catch (e) { return; }
    var n = qr.getModuleCount();
    var quiet = 3;                                  // 사방 여백(칸 수)
    var cell = Math.floor(size / (n + quiet * 2));
    var real = cell * (n + quiet * 2);
    var ox = x + size - real, oy = y;
    roundRect(ctx, ox, oy, real, real, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.fillStyle = INK;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) ctx.fillRect(ox + (c + quiet) * cell, oy + (r + quiet) * cell, cell, cell);
      }
    }
  }

  // 바탕 + 카드 색 테두리(견주가 고른 색 — cardColor)
  function frame(ctx, color) {
    ctx.clearRect(0, 0, W, H);
    roundRect(ctx, 0, 0, W, H, 64);
    ctx.fillStyle = color;
    ctx.fill();
    roundRect(ctx, 26, 26, W - 52, H - 52, 44);
    ctx.fillStyle = CREAM;
    ctx.fill();
  }

  // 빨간 원형 도장(영수증 "상환 완료" 도장과 같은 말투). 네 글자는 두 줄로(정착/주민, 터줏/대감)
  function sealLines(text) {
    var t = String(text).replace(/\s+/g, '');
    return t.length === 4 ? [t.slice(0, 2), t.slice(2)] : [t];
  }
  function seal(ctx, cx, cy, r, text, rot) {
    var lines = sealLines(text);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot || 0);
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = 'rgba(255, 250, 243, 0.55)';   // 사진 위에서도 글자가 읽히게 옅은 바탕
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = SEAL;
    ctx.lineWidth = Math.max(3, r * 0.08);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = Math.max(1.5, r * 0.035);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.83, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = SEAL;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var longest = Math.max.apply(null, lines.map(function (l) { return l.length; }));
    var fs = Math.round(r * (lines.length > 1 ? 0.5 : (longest >= 3 ? 0.46 : 0.62)));
    ctx.font = '400 ' + fs + 'px ' + BIG;
    lines.forEach(function (l, i) { ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * fs * 1.06 + fs * 0.04); });
    ctx.restore();
  }

  // ── 앞면 ──
  // opts: { photo: Image|null, rank: RewardRules.RANKS 항목|null, since: 'YYYY-MM-DD'(그 등급이 된 날)|null,
  //         subtitle: 가게 수호견 카드처럼 부제를 바꿀 때(이때는 등급·도장을 안 그림) }
  function drawFront(canvas, profile, opts) {
    opts = opts || {};
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    var sig = SIGNALS[profile.signal] || SIGNALS.none;
    var rank = opts.subtitle ? null : (opts.rank || null);
    frame(ctx, cardColor(profile));

    // 머리줄 — 부제가 주민 등급으로 자란다(새내기 주민 → 정착 주민 → 토박이 → 터줏대감)
    ctx.fillStyle = INK;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.font = font(800, 76);
    ctx.fillText('강아지 주민증', 96, 168);   // 2026-11-16 "댕댕이" → "강아지"(가르시아: 못 알아듣는 사람이 있을 것)
    var subtitle = opts.subtitle || ('남양주 다산동 ' + (rank ? rank.name : '산책 주민'));
    ctx.fillStyle = SOFT;
    ctx.font = font(600, fitText(ctx, subtitle, 900, 34, 600));
    ctx.fillText(subtitle, 100, 222);

    // 오른쪽 위 신호등(불 셋 중 하나만 켜짐)
    var lampOrder = ['green', 'yellow', 'red'];
    var lx = W - 96 - 3 * 76, ly = 96;
    roundRect(ctx, lx - 22, ly - 12, 3 * 76 + 20, 100, 50);
    ctx.fillStyle = INK;
    ctx.fill();
    lampOrder.forEach(function (key, i) {
      ctx.beginPath();
      ctx.arc(lx + 26 + i * 76, ly + 38, 28, 0, Math.PI * 2);
      ctx.fillStyle = (key === profile.signal) ? SIGNALS[key].color : '#6f6357';
      ctx.fill();
    });

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(96, 268); ctx.lineTo(W - 96, 268); ctx.stroke();

    // 사진
    var px = PHOTO_BOX.x, py = PHOTO_BOX.y, pw = PHOTO_BOX.w, ph = PHOTO_BOX.h, img = opts.photo || null;
    roundRect(ctx, px, py, pw, ph, 36);
    ctx.fillStyle = '#f3ddd2';
    ctx.fill();
    if (img) {
      ctx.save();
      roundRect(ctx, px, py, pw, ph, 36);
      ctx.clip();
      var scale = Math.max(pw / img.width, ph / img.height);
      var dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
      ctx.restore();
    } else {
      ctx.fillStyle = '#b8563a';
      ctx.textAlign = 'center';
      ctx.font = font(700, 40);
      ctx.fillText('사진 없음', px + pw / 2, py + ph / 2 + 14);
      ctx.textAlign = 'left';
    }
    // 승급 도장 — 정착 주민부터, 사진 오른쪽 아래 귀퉁이에 걸쳐서(진짜 신분증의 직인 자리)
    if (rank && rank.level >= 1) seal(ctx, px + pw - 34, py + ph - 72, 90, rank.name, -0.21);

    // 오른쪽 정보
    var tx = 620, maxW = W - 96 - tx;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = SOFT;
    ctx.font = font(600, 32);
    ctx.fillText('이름', tx, 362);
    var bits = infoBits(profile);
    if (bits.length) {   // '이름 · 암컷 · 중성화 · 말티즈' — 이름 글자 자리는 그대로 두고 그 위 작은 줄에
      var lw = ctx.measureText('이름').width + 14, more = '·  ' + bits.join(' · ');
      ctx.font = font(600, fitText(ctx, more, maxW - lw, 32, 600));
      ctx.fillText(more, tx + lw, 362);
    }
    ctx.fillStyle = INK;
    var name = profile.name || '';
    ctx.font = font(800, fitText(ctx, name, maxW, 124, 800));
    ctx.fillText(name, tx - 4, 482);

    // 신호등 문구 띠 — 색 이름("초록불" 등)은 쓰지 않는다(2026-11-16 가르시아 "공간 낭비"). 띠 전체를 안내 문구에.
    roundRect(ctx, tx, 532, maxW, 132, 30);
    ctx.fillStyle = sig.color;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    // 한 줄 소개 태그를 골랐으면 기본 문구 대신(dog-tags.js)
    var sigLine = (window.DogTags && DogTags.lineFor(profile)) || sig.line;
    var bandW = maxW - 72, bandMid = 532 + 66;
    var lineSize = fitText(ctx, sigLine, bandW, 54, 800);
    ctx.textBaseline = 'middle';
    if (lineSize >= 42) {
      ctx.font = font(800, lineSize);
      ctx.fillText(sigLine, tx + 36, bandMid + 2);
    } else {
      // 긴 문구는 한 줄로 작게 줄이지 말고 두 줄로 — 괄호 앞, 없으면 가운데에 가까운 띄어쓰기에서 나눈다
      var cut = sigLine.indexOf(' (');
      if (cut < 0) {
        var mid = sigLine.length / 2, best = -1;
        for (var i = 0; i < sigLine.length; i++) if (sigLine[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
        cut = best;
      }
      var l1 = cut > 0 ? sigLine.slice(0, cut) : sigLine, l2 = cut > 0 ? sigLine.slice(cut + 1) : '';
      var two = Math.min(fitText(ctx, l1, bandW, 46, 800), l2 ? fitText(ctx, l2, bandW, 46, 800) : 46);
      ctx.font = font(800, two);
      ctx.fillText(l1, tx + 36, bandMid - two * 0.58 + 2);
      if (l2) ctx.fillText(l2, tx + 36, bandMid + two * 0.58 + 2);
    }
    ctx.textBaseline = 'alphabetic';

    // 아래 칸 — 승급했으면 승급일 한 줄(진짜 주민증 재발급 패러디, 카드 번호는 그대로)
    var rows = [['발급일', profile.cardIssued || todayText()]];
    if (rank && rank.level >= 1 && opts.since) rows.push(['승급일', dateText(opts.since)]);
    rows.push(['카드 번호', profile.cardNo || '']);
    var y0 = rows.length > 2 ? 716 : 730, gap = rows.length > 2 ? 56 : 62;
    rows.forEach(function (row, i) {
      var y = y0 + i * gap;
      ctx.fillStyle = SOFT;
      ctx.font = font(600, 32);
      ctx.fillText(row[0], tx, y);
      ctx.fillStyle = INK;
      ctx.font = font(700, 36);
      ctx.fillText(row[1], tx + 190, y);
    });

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(96, 880); ctx.lineTo(W - 96, 880); ctx.stroke();
    // "나도 만들기" QR — 오른쪽 아래 빈자리. 흰 바탕에 사방 여백을 둬야 카메라가 읽는다.
    // opts.noQr: 키링용(2026-11-16) — 6cm로 줄이면 QR이 1cm 남짓이라 잘 안 찍혀서 뺀다.
    // 그 자리엔 홍보물 필수 문구 두 줄(2026-11-17 — 키링은 나눠 주는 인쇄물이라 CLAUDE.md 텍스트 규칙, site-config.js brand)
    if (!opts.noQr) drawQr(ctx, SHARE_URL, W - 96 - 200, 684, 200);
    else brandMark(ctx, rows.length > 2);
    footer(ctx, '왈슨 · ' + SHARE_URL_TEXT);
    return canvas;
  }

  // 키링 앞면 오른쪽 아래(QR 자리)에 브랜드 이름(site-config.js brand — 11/18부터 'WALSON') + 문구를 오른쪽 맞춤으로. 왼쪽 '카드 번호' 줄과 겹치지 않게 폭을 줄여 맞춘다
  function brandMark(ctx, threeRows) {
    var B = window.WALSON_CONFIG && window.WALSON_CONFIG.brand;
    if (!B || !B.name) return;
    var right = W - 96, maxW = 340, y1 = threeRows ? 812 : 800;
    ctx.save();
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = INK;
    var s1 = 56; ctx.font = s1 + 'px ' + BIG;
    while (s1 > 30 && ctx.measureText(B.name).width > maxW) { s1 -= 2; ctx.font = s1 + 'px ' + BIG; }
    ctx.fillText(B.name, right, y1);
    if (B.tagline) {
      ctx.fillStyle = SOFT;
      ctx.font = font(700, fitText(ctx, B.tagline, maxW, 26, 700));
      ctx.fillText(B.tagline, right, y1 + 46);
    }
    ctx.restore();
  }

  function footer(ctx, left) {
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = SOFT;
    ctx.textAlign = 'left';
    ctx.font = font(600, fitText(ctx, left, 760, 30, 600));
    ctx.fillText(left, 96, 934);
    ctx.font = font(600, 30);
    ctx.textAlign = 'right';
    ctx.fillText('재미로 만든 카드예요 · 공식 신분증이 아니에요', W - 96, 934);
    ctx.textAlign = 'left';
  }

  // ── 뒷면(산책 경력) ──
  // career: RewardRules.computeProgress(walks) 결과({ walks, km, visitedAt, rankDates })
  // opts: { ranks: RewardRules.RANKS, places: RewardRules.PLACES(판정 대기 장소는 뺀 것), slots: RewardRules.SLOT_RULES,
  //         skill: { title }|null, passive: { title }|null, steadyTotal: 꾸준함 도장 수 }
  function drawBack(canvas, profile, career, opts) {
    opts = opts || {};
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    var ranks = opts.ranks || [], places = (opts.places || []).filter(function (p) { return !p.pending; });
    var slots = opts.slots || { skill: 1, passive: 3 };
    var n = (career && career.walks) || 0, km = (career && career.km) || 0;
    var rankDates = (career && career.rankDates) || [], visitedAt = (career && career.visitedAt) || {};
    // 새내기 줄 = "전입": 주민증 발급일과 처음 센 산책 날 중 이른 날(주민증을 나중에 만든 사람도 날짜 순서가 맞게)
    var moveIn = [keyFromText(profile.cardIssued), career && career.firstDate].filter(Boolean).sort()[0] || null;
    var cur = null;
    ranks.forEach(function (r) { if (n >= r.minWalks) cur = r; });
    frame(ctx, cardColor(profile));

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.font = font(800, 64);
    ctx.fillText('산책 경력', 96, 158);
    // 11/18: 횟수는 어떻게 기록했든 5분 이상 산책(11/17부터 주민증 성장 기준) — 예전 '길 기록 산책'이라 적혀 있던 걸 고침
    var sub = (profile.name ? profile.name + ' · ' : '') + '산책 ' + n + '회 · ' + km.toFixed(1) + 'km';
    ctx.fillStyle = SOFT;
    ctx.font = font(600, fitText(ctx, sub, 1000, 34, 600));
    ctx.fillText(sub, 100, 214);
    // 오른쪽 위 — 지금 등급 도장(정착 주민부터)
    if (cur && cur.level >= 1) seal(ctx, W - 170, 150, 72, cur.name, -0.18);

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(96, 252); ctx.lineTo(W - 96, 252); ctx.stroke();

    // 왼쪽: 승급 기록(진짜 주민등록증 뒷면 "주소 변경" 칸 패러디) — 날짜 · 등급 · 확인 도장
    var colL = 96, colR = 860, headY = 318;
    ctx.fillStyle = INK;
    ctx.font = font(700, 34);
    ctx.fillText('승급 기록', colL, headY);
    ctx.fillText('발도장 기록', colR, headY);
    ranks.forEach(function (r, i) {
      var y = 392 + i * 70;
      var reached = n >= r.minWalks;
      var date = r.minWalks === 0 ? (moveIn ? dateText(moveIn) : (profile.cardIssued || '')) : (reached ? dateText(rankDates[i]) : '');
      ctx.fillStyle = reached ? SOFT : DIM;
      ctx.font = font(600, 30);
      ctx.fillText(date || '—', colL, y);
      ctx.fillStyle = reached ? INK : DIM;
      ctx.font = font(700, 36);
      ctx.fillText(r.name, colL + 236, y);
      if (reached) seal(ctx, 722, y - 12, 32, r.minWalks === 0 ? '전입' : '확인', -0.2);
      else {
        ctx.fillStyle = DIM;
        ctx.font = font(600, 28);
        ctx.textAlign = 'right';
        ctx.fillText('산책 ' + r.minWalks + '회', 760, y);
        ctx.textAlign = 'left';
      }
    });

    // 오른쪽: 발도장 기록 — 장소 · 찍은 날 · 확인 도장(장소는 공원·건물 이름뿐, 산책한 시각·길은 안 넣는다)
    var shown = places.slice(0, 5), step = shown.length > 4 ? 56 : 70;
    shown.forEach(function (pl, i) {
      var y = 392 + i * step;
      var at = visitedAt[pl.id];
      var got = at !== undefined;
      ctx.fillStyle = got ? INK : DIM;
      ctx.font = font(700, fitText(ctx, pl.name, 330, 34, 700));
      ctx.fillText(pl.name, colR, y);
      ctx.fillStyle = got ? SOFT : DIM;
      ctx.font = font(600, 30);
      ctx.fillText(got ? (dateText(at) || '찍음') : '아직', colR + 350, y);
      if (got) seal(ctx, W - 132, y - 12, 32, '확인', -0.2);
    });
    if (!shown.length) {
      ctx.fillStyle = DIM;
      ctx.font = font(600, 30);
      ctx.fillText('발도장 장소가 아직 없어요', colR, 392);
    }
    if (places.length > shown.length) {
      ctx.fillStyle = SOFT;
      ctx.font = font(600, 26);
      ctx.fillText('외 ' + (places.length - shown.length) + '곳은 앱에서', colR, 392 + shown.length * step);
    }

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(96, 664); ctx.lineTo(W - 96, 664); ctx.stroke();

    // 특기 · 특이 사항(가르시아가 쓴 문구 — card-shared.js). 산책 1회 · 3회에 생긴다
    [['특기', opts.skill, slots.skill], ['특이 사항', opts.passive, slots.passive]].forEach(function (row, i) {
      var y = 736 + i * 78;
      var open = n >= row[2] && row[1] && row[1].title;
      ctx.fillStyle = SOFT;
      ctx.font = font(600, 32);
      ctx.fillText(row[0], 96, y);
      var text = open ? row[1].title : '산책 ' + row[2] + '회 하면 생겨요';
      ctx.fillStyle = open ? INK : DIM;
      ctx.font = font(open ? 700 : 600, fitText(ctx, text, W - 96 - 270, open ? 40 : 34, open ? 700 : 600));
      ctx.fillText(text, 270, y);
    });

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(96, 880); ctx.lineTo(W - 96, 880); ctx.stroke();
    footer(ctx, '꾸준함 도장 ' + (opts.steadyTotal || 0) + '개' + (profile.cardNo ? ' · ' + profile.cardNo : ''));
    return canvas;
  }

  // ── 키링 뒷면(2026-11-18 가르시아: 양면 + NFC, "뒷면은 왈슨 주민증이 열리는 QR, 연락처 적을 공간·메모, 화면 꽉 차게" → 시안 2) ──
  // 왼쪽: 카드 색 판에 큰 QR(약 25mm, 오류 정정 M) + 폰을 대는 표시. 오른쪽: 이름(+성별·견종) · 보호자 연락처 · 광견병/종합 접종 · 메모 손글씨 칸.
  // url: 도감 카드 주소(dex-card.js — 이름·크기·성향·털색·무작위 번호만. 위치·사진·연락처 없음). NFC 칩에도 같은 주소를 넣는다.
  // bleed: 사방 인쇄 여유(px, 키링 파일은 40 = 1.5mm) — 바탕을 여유까지 꽉 채워 재단이 밀려도 흰 틈이 안 남게.
  // QR 라이브러리가 없으면(인터넷이 끊겨 못 불러옴) false — 부른 쪽이 저장하지 않는다.
  function inkOn(hex) {
    var h = String(hex).replace('#', '');
    var lum = (parseInt(h.substr(0, 2), 16) * 299 + parseInt(h.substr(2, 2), 16) * 587 + parseInt(h.substr(4, 2), 16) * 114) / 1000;
    return lum > 165 ? INK : '#ffffff';   // 밝은 판엔 진갈색 글씨, 어두운 판엔 흰 글씨
  }
  function qrSquare(ctx, text, x, y, size) {
    if (typeof qrcode !== 'function') return null;
    var qr;
    try { qr = qrcode(0, 'M'); qr.addData(text); qr.make(); } catch (e) { return null; }   // 키링은 긁히고 손때가 묻어서 M
    roundRect(ctx, x, y, size, size, 36);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    var n = qr.getModuleCount(), quiet = 3;
    var cell = Math.floor(size / (n + quiet * 2)), real = cell * n;
    var ox = x + Math.round((size - real) / 2), oy = y + Math.round((size - real) / 2);
    ctx.fillStyle = INK;
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(ox + c * cell, oy + r * cell, cell, cell);
    return { modules: n, cell: cell };
  }
  // 폰을 대는 표시(비접촉 물결) — NFC 포럼의 N 마크(상표)는 쓰지 않는다
  function tapWaves(ctx, cx, cy, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round'; ctx.lineWidth = 9;
    [20, 38, 56].forEach(function (r) { ctx.beginPath(); ctx.arc(cx - 22, cy, r, -0.95, 0.95); ctx.stroke(); });
    ctx.beginPath(); ctx.arc(cx - 26, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawKeyringBack(canvas, profile, url, bleed) {
    var b = bleed || 0;
    canvas.width = W + b * 2; canvas.height = H + b * 2;
    var ctx = canvas.getContext('2d');
    var panel = cardColor(profile), onPanel = inkOn(panel), SPLIT = 740;   // 왼쪽 QR 판 | 오른쪽 손글씨 판
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = panel; ctx.fillRect(0, 0, b + SPLIT, canvas.height);
    ctx.save();
    ctx.translate(b, b);

    // ── 왼쪽: QR + 폰 대기 안내 ──
    var info = qrSquare(ctx, url, 40, 44, 660);   // 24.8mm — 한 칸 약 0.45mm(키링 60×37.5mm 기준)
    if (!info) { ctx.restore(); return false; }
    tapWaves(ctx, 104, 800, onPanel);
    ctx.fillStyle = onPanel; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = font(800, 46);
    ctx.fillText('카메라로 찍거나', 164, 782);
    ctx.fillText('휴대폰을 대 보세요', 164, 842);
    var opens = (profile.name ? profile.name + ' ' : '') + '주민증이 열려요';
    ctx.font = font(700, fitText(ctx, opens, 640, 38, 700));
    ctx.fillText(opens, 48, 930);

    // ── 오른쪽: 이름 + 손글씨 칸(줄 사이 4~5mm — 키링 크기에서 가는 펜으로 한 줄씩) ──
    var x0 = 800, x1 = W - 64, name = profile.name || '우리 강아지';
    ctx.fillStyle = INK;
    ctx.font = font(800, fitText(ctx, name, x1 - x0, 84, 800));
    ctx.fillText(name, x0, 134);
    var bits = infoBits(profile);
    if (bits.length) {   // 이름 오른쪽에 작게 — 앱에 적어 둔 것(손글씨 아님). 자리가 모자라면 글자를 줄인다
      var nx = x0 + ctx.measureText(name).width + 22, more = bits.join(' · ');
      if (x1 - nx > 120) {
        ctx.fillStyle = SOFT;
        ctx.font = font(700, fitText(ctx, more, x1 - nx, 36, 700));
        ctx.fillText(more, nx, 128);
      }
    }
    ctx.fillStyle = SOFT;
    ctx.font = font(600, fitText(ctx, '길에서 저를 만나면 연락해 주세요', x1 - x0, 36, 600));
    ctx.fillText('길에서 저를 만나면 연락해 주세요', x0, 194);
    ctx.strokeStyle = LINE; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0, 238); ctx.lineTo(x1, 238); ctx.stroke();

    ctx.fillStyle = SOFT; ctx.font = font(700, 40);
    ctx.fillText('보호자 연락처', x0, 306);
    ctx.strokeStyle = DIM; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0, 420); ctx.lineTo(x1, 420); ctx.stroke();
    // 예방접종 — 반려동물 동반 음식점이 접종을 확인한다(손님이 손으로 적어 내도 됨, hq notes/petwalk-pet-restaurant-rules.md).
    // 해마다 바뀌어서 지우고 다시 쓰는 칸. 증명서를 대신하지는 않는다
    [['광견병 접종', 540, true], ['종합 접종', 652, true], ['메모', 764, false]].forEach(function (row) {
      ctx.fillStyle = SOFT; ctx.font = font(700, 38); ctx.textAlign = 'left';
      ctx.fillText(row[0], x0, row[1] - 14);
      var lw = ctx.measureText(row[0]).width + 22;
      ctx.strokeStyle = DIM; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x0 + lw, row[1]); ctx.lineTo(x1, row[1]); ctx.stroke();
      if (row[2]) {   // 날짜 칸 모양(년 . 월 . 일) — 어디에 쓸지 보이게 점만 옅게
        ctx.fillStyle = DIM; ctx.font = font(700, 34); ctx.textAlign = 'right';
        ctx.fillText('.          .', x1 - 70, row[1] - 14);
        ctx.textAlign = 'left';
      }
    });

    // 아래 줄 — 브랜드 이름(site-config.js brand) · 카드 번호(앞면과 같은 번호)
    var B = window.WALSON_CONFIG && window.WALSON_CONFIG.brand;
    if (B && B.name) { ctx.fillStyle = INK; ctx.font = '46px ' + BIG; ctx.textAlign = 'left'; ctx.fillText(B.name, x0, 924); }
    if (profile.cardNo) {
      ctx.fillStyle = SOFT; ctx.textAlign = 'right';
      ctx.font = font(600, fitText(ctx, 'No. ' + profile.cardNo, 420, 32, 600));
      ctx.fillText('No. ' + profile.cardNo, x1, 922);
    }
    ctx.restore();
    return info;
  }

  // 저장 모양: 카드만(1600×1000) / 정사각형(1080×1080, 카톡·피드) / 스토리용(1080×1920).
  // 정사각형·스토리용은 파스텔 바탕 가운데에 카드를 올려서, 올렸을 때 양옆이 잘리지 않게 한다.
  function composeExport(cardCanvas, profile, format) {
    if (format !== 'square' && format !== 'story') return cardCanvas;
    var OW = 1080, OH = format === 'story' ? 1920 : 1080;
    var out = document.createElement('canvas');
    out.width = OW; out.height = OH;
    var ctx = out.getContext('2d');
    var sig = SIGNALS[profile.signal] || SIGNALS.none;
    ctx.fillStyle = '#f7ede2';
    ctx.fillRect(0, 0, OW, OH);
    // 위아래에 카드 색 띠를 얇게(2026-11-18부터 성향 색 대신 견주가 고른 카드 색 — 성향은 카드 안 띠·불이 알린다)
    var cc = cardColor(profile);
    ctx.fillStyle = cc;
    ctx.fillRect(0, 0, OW, 18);
    ctx.fillRect(0, OH - 18, OW, 18);
    var cw = 960, ch = 600, cx = (OW - cw) / 2, cy = Math.round((OH - ch) / 2) - (format === 'story' ? 60 : 30);
    ctx.save();
    ctx.shadowColor = 'rgba(74, 63, 53, 0.25)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    roundRect(ctx, cx, cy, cw, ch, 38);
    ctx.fillStyle = cc;
    ctx.fill();
    ctx.restore();
    ctx.drawImage(cardCanvas, cx, cy, cw, ch);
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.font = font(800, 44);
    ctx.fillText((profile.name || '') + ' · ' + ((window.DogTags && DogTags.lineFor(profile)) || sig.line), OW / 2, cy + ch + 96);
    ctx.fillStyle = SOFT;
    ctx.font = font(600, 30);
    ctx.fillText('나도 만들기  ' + SHARE_URL_TEXT, OW / 2, cy + ch + 150);
    ctx.textAlign = 'left';
    return out;
  }

  // ── 꾸미고 저장하기(2026-11-16 한 화면 편집기, image-editor.js) — [주민증] 탭과 만들기 3단계가 같이 쓴다 ──
  // o: { profile, photo(그림|null), frontOpts: function () → drawFront opts(사진 빼고), drawBack: function (canvas)|null(뒷면 없음),
  //      side: 'front'|'back', fmt, title, onSave(st, how), onClose(st) }
  // 사진은 이 저장에서만 칸 안에서 옮기고 키운다(주민증에 들어간 원래 사진은 그대로).
  function cropPhoto(img, zoom, qx, qy) {
    var c = document.createElement('canvas'); c.width = PHOTO_BOX.w * 2; c.height = PHOTO_BOX.h * 2;
    var g = c.getContext('2d'), s = Math.max(c.width / img.width, c.height / img.height) * Math.max(1, zoom || 1), iw = img.width * s, ih = img.height * s;
    g.drawImage(img, -(iw - c.width) * qx, -(ih - c.height) * qy, iw, ih);
    return c;
  }
  function openEditor(o) {
    if (!window.WalsonEditor) return null;
    var card = document.createElement('canvas'), tabs = [];
    if (o.drawBack) tabs.push({
      id: 'side', label: '면', icon: 'side', first: true,
      rows: function (st) {
        return [{ chips: [{ text: '앞면', value: 'front', on: st.extra.side !== 'back' }, { text: '뒷면 · 산책 경력', value: 'back', on: st.extra.side === 'back' }] },
          { tip: '뒷면엔 승급 기록·발도장 기록·특기가 들어가요. 발도장 장소 이름은 공개된 공원·가게 이름뿐이에요.' }];
      },
      onPick: function (v, st) { st.extra.side = v === 'back' ? 'back' : 'front'; }
    });
    return WalsonEditor.open({
      title: o.title || '강아지 주민증',
      formats: [['card', '카드만'], ['square', '정사각형'], ['story', '스토리']], fmt: o.fmt || 'card',
      tabs: tabs, tab: o.side === 'back' ? 'side' : undefined,
      photo: o.photo ? { sources: [['profile', '주민증 사진']], src: 'profile', zoom: 1, x: 0.5, y: 0.5, home: { x: 0.5, y: 0.5 }, noBand: '뒷면엔 사진이 없어요.' } : null,
      extra: { side: o.side === 'back' ? 'back' : 'front' },
      hint: o.photo ? '사진 칸을 끌어서 옮기고, 두 손가락으로 키워요' : '글자 붙이기로 한마디 얹어 보세요',
      draw: function (cv, st) {
        var front = st.extra.side !== 'back' || !o.drawBack;
        if (front) {
          var fo = Object.assign({}, o.frontOpts ? o.frontOpts() : {});
          fo.photo = o.photo ? cropPhoto(o.photo, st.photo.zoom, st.photo.x, st.photo.y) : null;
          drawFront(card, o.profile, fo);
        } else o.drawBack(card);
        var out = composeExport(card, o.profile, st.fmt), g = cv.getContext('2d');
        if (cv.width !== out.width) cv.width = out.width;
        if (cv.height !== out.height) cv.height = out.height;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, cv.width, cv.height);
        // '카드만'은 카드 그림 그대로라 둥근 모서리 바깥이 투명했다 — 사진첩·카톡에서 흰색·검은색 귀퉁이(테두리)로 남아서,
        // 신호등 테두리 색으로 채워 꽉 찬 네모로 저장한다(2026-11-16 가르시아 "카드 양식일 때 이미지 테두리가 남는 거")
        if (out === card) { g.fillStyle = cardColor(o.profile); g.fillRect(0, 0, cv.width, cv.height); }
        g.drawImage(out, 0, 0);
        if (!front || !o.photo) return null;
        // composeExport가 카드를 놓는 자리(정사각형·스토리: 960×600 가운데) — 사진 칸을 같은 비율로 옮긴다
        var k = 1, ox = 0, oy = 0;
        if (st.fmt === 'square' || st.fmt === 'story') { k = 960 / W; ox = (out.width - 960) / 2; oy = Math.round((out.height - 600) / 2) - (st.fmt === 'story' ? 60 : 30); }
        return { x: ox + PHOTO_BOX.x * k, y: oy + PHOTO_BOX.y * k, w: PHOTO_BOX.w * k, h: PHOTO_BOX.h * k, img: o.photo };
      },
      fileName: function (st) { return (o.profile.name || 'dog') + '-주민증' + (st.extra.side === 'back' && o.drawBack ? '-뒷면' : '') + (st.fmt === 'card' ? '' : '-' + st.fmt) + '.png'; },
      onSave: o.onSave, onClose: o.onClose
    });
  }

  window.WalsonIdCard = {
    W: W, H: H, SIGNALS: SIGNALS, SHARE_URL: SHARE_URL, SHARE_URL_TEXT: SHARE_URL_TEXT, PHOTO_BOX: PHOTO_BOX,
    CARD_COLORS: CARD_COLORS, cardColor: cardColor, infoBits: infoBits, drawKeyringBack: drawKeyringBack,
    drawFront: drawFront, drawBack: drawBack, composeExport: composeExport, openEditor: openEditor,
    loadImage: loadImage, fontsReady: fontsReady, todayText: todayText, dateText: dateText
  };
})();
