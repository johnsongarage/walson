// 강아지 주민증 그림(2026-11-16 자라는 주민증 — 가르시아 "자라는 카드를 주민증에 합쳐").
// 주민증 만들기(start.html)와 [주민증] 탭(my-card.html)이 같이 쓴다. 예전엔 start.html 안에만 있었다.
// 앞면: 예전 주민증 그대로 + 부제가 주민 등급("남양주 다산동 토박이") + 정착 주민부터 사진 귀퉁이에 빨간 승급 도장 + 승급일.
// 뒷면: 진짜 주민등록증 뒷면의 "주소 변경" 칸 패러디 — 승급 기록 · 발도장 기록 · 특기 · 특이 사항.
// 테두리는 견주가 고른 카드 색(기본 모카 — 2026-11-18 가르시아 "모카 기본으로": 색을 정치적으로 보는 사람이 있을 수 있어 선택권).
// 성향 띠·불은 성향 색 그대로 — 안전 표시는 남긴다(11/15 "테두리는 신호등 색" 원칙을 띠·불로 옮김). 등급 숫자는 reward-rules.js RANKS.
// 키링 뒷면(drawKeyringBack): 도감 카드 글자 QR(11/24부터 링크·NFC 아님 — 왈슨 앱으로만 읽힘) + 보호자 연락처·예방접종(광견병·종합)·메모 손글씨 칸(11/18 시안 2).
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
    none:   { label: '지킴이', line: '가게를 지키고 있어요', color: '#b8563a' }
  };
  // 카드 색(2026-11-18) — 테두리·저장 바탕·키링 뒷면 QR 판. 프로필 cardColor에 id로 저장, 없으면 모카.
  // 같은 날 밤 가르시아 "색상 고를 수 있게 바를 줘" — 색 막대(card-color.js)로 고른 색은 '#rrggbb' 그대로 저장한다.
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
    if (typeof id === 'string' && /^#[0-9a-f]{6}$/i.test(id)) return id;   // 색 막대로 직접 고른 색
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
  // 단어(띄어쓰기) 단위로 줄을 나눈다(2026-11-18 가르시아 "견종이 엄청 길 수도 있어, 단어로 끊어서").
  // 구분점(·)은 앞 단어에 붙여 줄 머리에 오지 않게, 한 단어가 칸보다 길면(띄어쓰기 없는 긴 견종) 그 단어만 글자 단위로 자른다
  function wrapWords(ctx, text, maxW) {
    var words = [];
    String(text).split(/\s+/).forEach(function (w) {
      if (!w) return;
      if (w === '·' && words.length) words[words.length - 1] += ' ·'; else words.push(w);
    });
    var lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width <= maxW) { cur = t; return; }
      if (cur) lines.push(cur);
      while (ctx.measureText(w).width > maxW && w.length > 1) {
        var k = w.length - 1;
        while (k > 1 && ctx.measureText(w.slice(0, k)).width > maxW) k--;
        lines.push(w.slice(0, k));
        w = w.slice(k);
      }
      cur = w;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  // maxLines 줄 안에 들어가게 — 글자를 조금씩 줄여 보고(minSize까지), 그래도 넘치면 마지막 줄 끝을 '…'로
  function fitLines(ctx, text, maxW, size, weight, maxLines, minSize) {
    var s = size, lines;
    for (;;) {
      ctx.font = font(weight, s);
      lines = wrapWords(ctx, text, maxW);
      if (lines.length <= maxLines || s - 2 < minSize) break;
      s -= 2;
    }
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    return { size: s, lines: lines };
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
      document.fonts.load('60px "Black Han Sans"', '입문산책러버프로앰배서더확인시작강아지워킹패스')
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

  // 카드 번호 — 11/24 전국판부터 새 번호는 WALSON-연도-네 자리(start.html). 예전 DASAN- 번호도 화면·그림엔 WALSON-으로(저장된 값은 그대로)
  function cardNoText(no) { return String(no || '').replace(/^DASAN-/, 'WALSON-'); }
  // 그림 속 QR 글자(11/24부터 링크 아님 — site-config.js cardQrText). 카메라로 찍으면 "카카오톡에서 '왈슨' 검색"만 보인다
  function cardQrText() { var C = window.WALSON_CONFIG; return (C && C.cardQrText) || "WALSON · 카카오톡에서 '왈슨' 검색"; }
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
    ctx.fillText('강아지 워킹패스', 96, 168);   // 2026-11-16 "댕댕이" → "강아지"(가르시아: 못 알아듣는 사람이 있을 것)
    var subtitle = opts.subtitle || ('우리 동네 ' + (rank ? rank.name : '산책 메이트'));   // 11/24 전국판 — 예전 "남양주 다산동 ○○"
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
    if (rank && rank.level >= 1) seal(ctx, px + pw - 34, py + ph - 72, 90, rank.seal || rank.name, -0.21);

    // 오른쪽 정보
    var tx = 620, maxW = W - 96 - tx;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = SOFT;
    ctx.font = font(600, 32);
    var bits = infoBits(profile);
    // 이름 위 작은 '이름' 글자는 뺐다(2026-11-18 가르시아 "이름 위에 이름 작게 나오는 부분은 지워 줘").
    // 성별·중성화·견종을 적었으면 그것만 그 자리에('암컷 · 중성화 · 말티즈'). 길면(긴 견종) 단어 단위로 두 줄(위로 한 줄 올림)
    if (bits.length) {
      var fl = fitLines(ctx, bits.join(' · '), maxW, 32, 600, 2, 26), lh = Math.round(fl.size * 1.2);
      ctx.font = font(600, fl.size);
      fl.lines.forEach(function (l, i) { ctx.fillText(l, tx, 362 - (fl.lines.length - 1 - i) * lh); });
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
    rows.push(['카드 번호', cardNoText(profile.cardNo)]);
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
    // QR — 오른쪽 아래 빈자리. 흰 바탕에 사방 여백을 둬야 카메라가 읽는다.
    // 11/14 "나도 만들기" 주소였다가 11/24부터 링크가 아니라 글자(cardQrText) — 모르는 사람 그림 속 QR을 찍어 링크를 여는 일을 만들지 않는다(hq DECISIONS 11/24)
    // opts.noQr: 키링용(2026-11-16) — 6cm로 줄이면 QR이 1cm 남짓이라 잘 안 찍혀서 뺀다.
    // 그 자리엔 홍보물 필수 문구 두 줄(2026-11-17 — 키링은 나눠 주는 인쇄물이라 CLAUDE.md 텍스트 규칙, site-config.js brand)
    if (!opts.noQr) drawQr(ctx, cardQrText(), W - 96 - 200, 684, 200);
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
    if (cur && cur.level >= 1) seal(ctx, W - 170, 150, 72, cur.seal || cur.name, -0.18);

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(96, 252); ctx.lineTo(W - 96, 252); ctx.stroke();

    // 왼쪽: 승급 기록(진짜 주민등록증 뒷면 "주소 변경" 칸 패러디) — 날짜 · 등급 · 확인 도장
    var colL = 96, colR = 860, headY = 318;
    ctx.fillStyle = INK;
    ctx.font = font(700, 34);
    ctx.fillText('승급 기록', colL, headY);
    // 11/24 전국판 — 발도장 장소가 없으면(다산동 세 곳을 화면에서 뺌) 오른쪽은 꾸준함 도장 기록
    var steadyCol = !places.length && !!opts.steady;
    ctx.fillText(steadyCol ? '꾸준함 도장' : '발도장 기록', colR, headY);
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
      if (reached) seal(ctx, 722, y - 12, 32, r.minWalks === 0 ? '시작' : '확인', -0.2);
      else {
        ctx.fillStyle = DIM;
        ctx.font = font(600, 28);
        ctx.textAlign = 'right';
        ctx.fillText('산책 ' + r.minWalks + '회', 760, y);
        ctx.textAlign = 'left';
      }
    });

    // 오른쪽: 발도장 기록 — 장소 · 찍은 날 · 확인 도장(장소는 공원·건물 이름뿐, 산책한 시각·길은 안 넣는다)
    // 꾸준함 도장: 한 주에 3·5·7일 산책한 주가 몇 주인지(그 이상 걸은 주도 같이 셈) · 받았으면 확인 도장
    if (steadyCol) {
      var stp = opts.steady.steps || [3, 5, 7], byLv = opts.steady.byLevel || [];
      stp.forEach(function (d, i) {
        var y = 392 + i * 70, cnt = byLv.slice(i).reduce(function (s, v) { return s + (v || 0); }, 0), got = cnt > 0;
        ctx.fillStyle = got ? INK : DIM;
        ctx.font = font(700, 34);
        ctx.fillText('주 ' + d + '일 산책', colR, y);
        ctx.fillStyle = got ? SOFT : DIM;
        ctx.font = font(600, 30);
        ctx.fillText(got ? cnt + '주' : '아직', colR + 350, y);
        if (got) seal(ctx, W - 132, y - 12, 32, '확인', -0.2);
      });
    }
    var shown = steadyCol ? [] : places.slice(0, 5), step = shown.length > 4 ? 56 : 70;
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
    if (!shown.length && !steadyCol) {
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
    footer(ctx, '꾸준함 도장 ' + (opts.steadyTotal || 0) + '개' + (profile.cardNo ? ' · ' + cardNoText(profile.cardNo) : ''));
    return canvas;
  }

  // ── 키링 뒷면(2026-11-18 가르시아: 양면 + NFC, "뒷면은 왈슨 주민증이 열리는 QR, 연락처 적을 공간·메모, 화면 꽉 차게" → 시안 2) ──
  // 왼쪽: 카드 색 판에 큰 QR(약 25mm, 오류 정정 M) + 찍는 법. 오른쪽: 이름(+성별·견종) · 보호자 연락처 · 광견병/종합 접종 · 메모 손글씨 칸.
  // text: 친구 카드 글자(dex-card.js cardText — "WALSON 친구카드 #d=…", 이름·크기·성향·털색·무작위 번호만. 위치·사진·연락처 없음).
  // 11/24부터 링크가 아니다 — 휴대폰 카메라로 찍으면 글자만 보이고, 왈슨 앱 [상대 QR 찍기]로만 친구(발자국)가 된다. NFC는 넣지 않는다
  // (남의 키링에 폰을 대서 링크를 여는 것도 같은 행동 — 11/24 가르시아 "괜히 누가 악용해서 큐싱당했다고 피곤한 일 생기는 것보다 낫지").
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
    var n = qr.getModuleCount(), quiet = 2;   // 흰 네모가 여백 구실을 해서 2칸 — 같은 네모에 칸이 조금 더 굵게
    var cell = Math.floor(size / (n + quiet * 2)), real = cell * n;
    var ox = x + Math.round((size - real) / 2), oy = y + Math.round((size - real) / 2);
    ctx.fillStyle = INK;
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(ox + c * cell, oy + r * cell, cell, cell);
    return { modules: n, cell: cell };
  }
  function drawKeyringBack(canvas, profile, text, bleed) {
    var b = bleed || 0;
    canvas.width = W + b * 2; canvas.height = H + b * 2;
    var ctx = canvas.getContext('2d');
    var panel = cardColor(profile), onPanel = inkOn(panel), SPLIT = 760;   // 왼쪽 QR 판 | 오른쪽 손글씨 판
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = panel; ctx.fillRect(0, 0, b + SPLIT, canvas.height);
    ctx.save();
    ctx.translate(b, b);

    // ── 왼쪽: QR + 찍는 법 — 판 가운데(11/18 가르시아 "QR이 오른쪽으로 쏠렸어, 균형 있게") ──
    // 판 가운데를 재단 뒤(카드 0~760)와 파일(여유 포함 -40~760)의 중간에 둔다 — 잘린 뒤 양옆 50·70, 파일에선 90·70으로 어느 쪽에서 봐도 거의 가운데
    var cx = SPLIT / 2 - 10, QS = 640;   // 24mm — 한 칸 약 0.45mm(키링 60×37.5mm 기준)
    var info = qrSquare(ctx, text, cx - QS / 2, 50, QS);
    if (!info) { ctx.restore(); return false; }
    // 찍는 법(11/24) — 카메라로 찍거나 폰을 대라고 하지 않는다. 왈슨 앱으로만, 앱이 없으면 공식 입구(카톡 채널)
    ctx.fillStyle = onPanel; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
    ctx.font = font(800, fitText(ctx, '왈슨 앱으로 찍으면 친구', 680, 46, 800));
    ctx.fillText('왈슨 앱으로 찍으면 친구', cx, 800);
    var nonApp = "앱이 없으면 카톡에서 '왈슨'";
    ctx.font = font(700, fitText(ctx, nonApp, 680, 38, 700));
    ctx.fillText(nonApp, cx, 880);
    ctx.textAlign = 'left';

    // ── 오른쪽: 이름 + 손글씨 칸(줄 사이 4~5mm — 키링 크기에서 가는 펜으로 한 줄씩) ──
    var x0 = SPLIT + 60, x1 = W - 64, name = profile.name || '우리 강아지';
    ctx.fillStyle = INK;
    ctx.font = font(800, fitText(ctx, name, x1 - x0, 84, 800));
    ctx.fillText(name, x0, 134);
    var y = 134;   // 오른쪽 머리에서 마지막으로 쓴 줄의 기준선
    var bits = infoBits(profile);
    if (bits.length) {
      // 성별·견종 — 이름 오른쪽 한 줄에 들어가면 거기, 아니면(긴 견종·긴 이름) 이름 아래에 단어 단위로 세 줄까지
      var more = bits.join(' · '), nx = x0 + ctx.measureText(name).width + 22;
      ctx.fillStyle = SOFT; ctx.font = font(700, 36);
      if (ctx.measureText(more).width <= x1 - nx) ctx.fillText(more, nx, 128);
      else {
        var fl = fitLines(ctx, more, x1 - x0, 34, 700, 3, 28);
        ctx.font = font(700, fl.size);
        fl.lines.forEach(function (l) { y += Math.round(fl.size * 1.3); ctx.fillText(l, x0, y); });
      }
    }
    var sub = '길에서 저를 만나면 연락해 주세요';
    ctx.fillStyle = SOFT;
    ctx.font = font(600, fitText(ctx, sub, x1 - x0, 36, 600));
    y += 60;
    ctx.fillText(sub, x0, y);
    var sep = y + 44;
    ctx.strokeStyle = LINE; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0, sep); ctx.lineTo(x1, sep); ctx.stroke();
    // 손글씨 칸 자리 — 머리가 길어진 만큼 내려가고, 맨 아래 칸이 브랜드 줄(924)에 닿지 않게(840까지) 칸 사이를 조금 줄인다
    var OFF = [68, 182, 302, 414, 526], k = Math.min(1, (840 - sep - 68) / (526 - 68));
    function rowY(i) { return Math.round(sep + 68 + (OFF[i] - 68) * k); }

    ctx.fillStyle = SOFT; ctx.font = font(700, 40);
    ctx.fillText('보호자 연락처', x0, rowY(0));
    ctx.strokeStyle = DIM; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0, rowY(1)); ctx.lineTo(x1, rowY(1)); ctx.stroke();
    // 예방접종 — 반려동물 동반 음식점이 접종을 확인한다(손님이 손으로 적어 내도 됨, hq notes/petwalk-pet-restaurant-rules.md).
    // 해마다 바뀌어서 지우고 다시 쓰는 칸. 증명서를 대신하지는 않는다
    [['광견병 접종', rowY(2), true], ['종합 접종', rowY(3), true], ['메모', rowY(4), false]].forEach(function (row) {
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
      ctx.font = font(600, fitText(ctx, 'No. ' + cardNoText(profile.cardNo), 420, 32, 600));
      ctx.fillText('No. ' + cardNoText(profile.cardNo), x1, 922);
    }
    ctx.restore();
    return info;
  }

  // 저장 모양: 카드만(1600×1000) / 정사각형(1080×1080, 카톡·피드) / 스토리용(1080×1920).
  // 2026-11-19 가르시아 "첫 번째 것 외엔 배치만 달라 — 옵션에 맞게 사진 내용 채우는 걸 다양하게":
  //   정사각형 = 사진이 주인공(강아지 사진 크게 + 이름·성향·등급·산책 기록 한 줄) — 피드·카톡 프로필용
  //   스토리   = 산책 경력 한 장(카드 + 산책 횟수·거리·등급 칸 + 다음 등급까지 막대 + 모은 발도장 + 특기) — 인스타 스토리용
  // 사진이 없거나 뒷면이면 정사각형은 예전처럼 카드를 가운데에. 가게 지킴이 카드(stats 없음)는 기록 칸을 빼고 그린다.
  // x.stats: { walks, km, rank, next, left, places:[{name, got}], skill } | null,  x.photo: 사진(그림), x.zoom·qx·qy: 사진 맞춤
  // 돌려주는 캔버스의 _photoBox = 편집기에서 사진을 끌 칸(없으면 null)
  var EX_BG = '#f9f1ec', EX_PINK = '#e5568a', EX_PANEL = '#fffaf6';
  function brandLine() {
    var B = (window.WALSON_CONFIG && window.WALSON_CONFIG.brand) || {};
    return (B.name || 'WALSON') + (B.tagline ? ' · ' + B.tagline : '');
  }
  // 사진을 칸에 꽉 차게(넘치는 쪽은 잘라서) — zoom·qx·qy는 편집기 사진 맞춤
  function coverImage(ctx, img, x, y, w, h, zoom, qx, qy) {
    var s = Math.max(w / img.width, h / img.height) * Math.max(1, zoom || 1), iw = img.width * s, ih = img.height * s;
    ctx.drawImage(img, x - (iw - w) * (qx == null ? 0.5 : qx), y - (ih - h) * (qy == null ? 0.5 : qy), iw, ih);
  }
  function exportBase(ctx, OW, OH, cc) {
    ctx.fillStyle = EX_BG; ctx.fillRect(0, 0, OW, OH);
    ctx.fillStyle = cc; ctx.fillRect(0, 0, OW, 18); ctx.fillRect(0, OH - 18, OW, 18);
  }
  function exportFooter(ctx, OW, OH) {
    ctx.textAlign = 'center';
    ctx.fillStyle = SOFT;
    ctx.font = font(700, 28);
    ctx.fillText(brandLine(), OW / 2, OH - 92);
    ctx.font = font(600, 26);
    ctx.fillText('나도 만들기  ' + SHARE_URL_TEXT, OW / 2, OH - 52);
    ctx.textAlign = 'left';
  }
  function pill(ctx, x, y, text, bg, fg, size) {
    ctx.font = font(800, size);
    var w = ctx.measureText(text).width + size * 1.4, h = size * 1.9;
    roundRect(ctx, x, y, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
    ctx.fillStyle = fg; ctx.textBaseline = 'middle'; ctx.fillText(text, x + size * 0.7, y + h / 2 + 1); ctx.textBaseline = 'alphabetic';
    return w;
  }
  function placeCard(ctx, cardCanvas, cc, cx, cy, cw, ch) {
    ctx.save();
    ctx.shadowColor = 'rgba(74, 63, 53, 0.25)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
    roundRect(ctx, cx, cy, cw, ch, 38); ctx.fillStyle = cc; ctx.fill();
    ctx.restore();
    ctx.drawImage(cardCanvas, cx, cy, cw, ch);
  }
  function statLine(st) {
    if (!st) return '';
    return (st.rank ? st.rank.name + ' · ' : '') + '산책 ' + st.walks + '회 · ' + (st.km || 0).toFixed(1) + 'km';
  }
  function composeExport(cardCanvas, profile, format, x) {
    if (format !== 'square' && format !== 'story') return cardCanvas;
    x = x || {};
    var OW = 1080, OH = format === 'story' ? 1920 : 1080;
    var out = document.createElement('canvas');
    out.width = OW; out.height = OH;
    var ctx = out.getContext('2d');
    var sig = SIGNALS[profile.signal] || SIGNALS.none, cc = cardColor(profile), st = x.stats || null;
    var sigLine = (window.DogTags && DogTags.lineFor(profile)) || sig.line;
    exportBase(ctx, OW, OH, cc);
    out._photoBox = null;
    var k = 960 / W;

    if (format === 'square' && x.photo && !x.back) {
      // 사진이 주인공
      var px = 60, py = 60, pw = 960, ph = 660;
      ctx.save();
      roundRect(ctx, px, py, pw, ph, 44); ctx.clip();
      ctx.fillStyle = '#eee3d8'; ctx.fillRect(px, py, pw, ph);
      coverImage(ctx, x.photo, px, py, pw, ph, x.zoom, x.qx, x.qy);
      // 아래쪽 살짝 어둡게 — 성향 띠 글자가 사진 위에서도 읽히게
      var g = ctx.createLinearGradient(0, py + ph - 200, 0, py + ph);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = g; ctx.fillRect(px, py + ph - 200, pw, 200);
      ctx.restore();
      ctx.lineWidth = 10; ctx.strokeStyle = cc; roundRect(ctx, px, py, pw, ph, 44); ctx.stroke();
      pill(ctx, px + 36, py + ph - 100, sigLine, sig.color, '#ffffff', 34);
      out._photoBox = { x: px, y: py, w: pw, h: ph };
      // 이름 + 등급 도장
      ctx.textAlign = 'left'; ctx.fillStyle = INK;
      ctx.font = font(800, fitText(ctx, profile.name || '우리 강아지', 640, 84, 800));
      ctx.fillText(profile.name || '우리 강아지', 72, 842);
      ctx.fillStyle = SOFT;
      ctx.font = font(600, fitText(ctx, statLine(st) || '강아지 워킹패스', 700, 34, 600));
      ctx.fillText(statLine(st) || '강아지 워킹패스', 76, 900);
      if (st && st.rank && st.rank.level >= 1) seal(ctx, OW - 150, 860, 78, st.rank.seal || st.rank.name, -0.16);
      exportFooter(ctx, OW, OH);
      return out;
    }

    if (format === 'square') {
      // 사진이 없거나 뒷면 — 카드를 가운데에(예전 모양) + 기록 한 줄
      var cy0 = Math.round((OH - 600) / 2) - 70;
      placeCard(ctx, cardCanvas, cc, 60, cy0, 960, 600);
      ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.font = font(800, 44);
      ctx.fillText((profile.name || '') + ' · ' + sigLine, OW / 2, cy0 + 600 + 92);
      if (st) { ctx.fillStyle = SOFT; ctx.font = font(600, 32); ctx.fillText(statLine(st), OW / 2, cy0 + 600 + 146); }
      if (x.photo && !x.back) out._photoBox = { x: 60 + PHOTO_BOX.x * k, y: cy0 + PHOTO_BOX.y * k, w: PHOTO_BOX.w * k, h: PHOTO_BOX.h * k };
      exportFooter(ctx, OW, OH);
      return out;
    }

    // 스토리 — 산책 경력 한 장
    ctx.textAlign = 'left'; ctx.fillStyle = INK;
    var head = (profile.name ? profile.name + '의 ' : '') + '워킹패스';
    ctx.font = font(800, fitText(ctx, head, 900, 60, 800));
    ctx.fillText(head, 64, 140);
    ctx.fillStyle = SOFT; ctx.font = font(600, 32);
    ctx.fillText(st ? '우리 동네에서 산책 중' : sigLine, 66, 192);
    var cy = 236;
    placeCard(ctx, cardCanvas, cc, 60, cy, 960, 600);
    if (x.photo && !x.back) out._photoBox = { x: 60 + PHOTO_BOX.x * k, y: cy + PHOTO_BOX.y * k, w: PHOTO_BOX.w * k, h: PHOTO_BOX.h * k };
    var y = cy + 600 + 70;
    if (st) {
      // 숫자 칸 셋: 산책 · 거리 · 등급
      var boxes = [['산책', st.walks + '회'], ['거리', (st.km || 0).toFixed(1) + 'km'], ['등급', st.rank ? st.rank.short || st.rank.name : '-']];
      var bw = 300, gap = 30, bh = 190;
      boxes.forEach(function (b, i) {
        var bx = 60 + i * (bw + gap);
        roundRect(ctx, bx, y, bw, bh, 32); ctx.fillStyle = EX_PANEL; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = LINE; ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = SOFT; ctx.font = font(700, 30); ctx.fillText(b[0], bx + bw / 2, y + 62);
        ctx.fillStyle = INK; ctx.font = font(800, fitText(ctx, b[1], bw - 40, 64, 800)); ctx.fillText(b[1], bx + bw / 2, y + 146);
      });
      ctx.textAlign = 'left';
      y += bh + 76;
      // 다음 등급까지
      ctx.fillStyle = INK; ctx.font = font(800, 36);
      var cur = st.rank ? st.rank.minWalks : 0, nx = st.next;
      ctx.fillText(nx ? nx.name + '까지 산책 ' + (nx.minWalks - st.walks) + '회' : (st.rank ? st.rank.name + ' 달성!' : ''), 64, y);
      y += 30;
      var ratio = nx ? Math.max(0, Math.min(1, (st.walks - cur) / Math.max(1, nx.minWalks - cur))) : 1;
      roundRect(ctx, 60, y, 960, 34, 17); ctx.fillStyle = '#efe2d6'; ctx.fill();
      if (ratio > 0) { roundRect(ctx, 60, y, Math.max(34, 960 * ratio), 34, 17); ctx.fillStyle = EX_PINK; ctx.fill(); }
      y += 34 + 86;
      // 모은 발도장
      var places = st.places || [];
      if (places.length) {
        var got = places.filter(function (p) { return p.got; }).length;
        ctx.fillStyle = INK; ctx.font = font(800, 36);
        ctx.fillText('모은 발도장 ' + got + ' / ' + places.length, 64, y);
        y += 28;
        var px2 = 60, rowH = 74;
        places.forEach(function (p) {
          ctx.font = font(800, 28);
          var w = ctx.measureText(p.name).width + 28 * 1.4;
          if (px2 + w > 1020) { px2 = 60; y += rowH; }
          pill(ctx, px2, y, p.name, p.got ? EX_PINK : '#ece1d6', p.got ? '#ffffff' : DIM, 28);
          px2 += w + 16;
        });
        y += rowH + 60;
      }
      // 특기
      if (st.skill && y < OH - 260) {
        ctx.fillStyle = SOFT; ctx.font = font(700, 30); ctx.fillText('특기', 64, y);
        ctx.fillStyle = INK; ctx.font = font(800, fitText(ctx, st.skill, 960, 38, 800)); ctx.fillText(st.skill, 64, y + 54);
      }
    } else {
      ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.font = font(800, 44);
      ctx.fillText((profile.name || '') + ' · ' + sigLine, OW / 2, y + 40);
      ctx.textAlign = 'left';
    }
    exportFooter(ctx, OW, OH);
    return out;
  }

  // 저장 그림에 넣을 산책 기록(이 휴대폰 기록) — 가게 지킴이 카드처럼 내 기록이 아닌 카드는 openEditor({ stats: null })
  function myStats() {
    var RR = window.RewardRules, S = window.WalsonStore;
    if (!RR || !S || !RR.computeProgress) return null;
    var p = RR.computeProgress(S.walks() || []);
    return {
      walks: p.walks, km: p.km, rank: RR.rankFor(p.walks), next: RR.nextRank(p.walks),
      places: (RR.PLACES || []).filter(function (pl) { return !pl.pending; }).map(function (pl) { return { name: pl.name, got: !!p.visited[pl.id] }; })
    };
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

  // ── 주민증 사진 맞춤(2026-11-18 가르시아 "사진을 줌인된 상태로 저장하면 그렇게 보여야 하는데") ──
  // 편집기에서 [저장]하거나 내보내면 사진 칸 안의 확대·자리를 이 휴대폰에 남기고, [주민증] 탭·만들기 화면·키링 파일·실물 인쇄도
  // 같은 맞춤으로 그린다(전에는 편집기 안에서만 맞춤이 쓰이고 카드는 원래 사진 그대로였다). 맞춤은 그 사진에만 —
  // 사진을 바꾸면(서명이 다르면) 쓰지 않고 원래대로(가운데 꽉 차게) 그린다.
  var FRAME_KEY = 'walson_id_photo_frame', EDIT_KEY = 'walson_edit_id_card';
  function photoSig(p) {
    if (!p || typeof p !== 'string') return '';
    var h = 5381;
    for (var i = 0; i < p.length; i++) h = ((h << 5) + h + p.charCodeAt(i)) | 0;
    return p.length + ':' + (h >>> 0).toString(36);
  }
  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)) || null; } catch (e) { return null; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 못 남겨도 이번 그림은 그대로 */ } }
  function unit(v, d) { v = Number(v); return isFinite(v) ? Math.max(0, Math.min(1, v)) : d; }
  function savedFrame(profile) {
    var sig = photoSig(profile && profile.photo), f = readJSON(FRAME_KEY);
    if (!sig) return null;
    if (!f) {
      // 이 고침 전에 [저장]해 둔 맞춤(편집기가 남긴 값)은 지금 사진의 것으로 보고 한 번 옮겨 온다
      var k = readJSON(EDIT_KEY);
      if (!k || !k.photo || !(Number(k.photo.zoom) >= 1)) return null;
      f = { zoom: Number(k.photo.zoom), x: k.photo.x, y: k.photo.y, sig: sig };
      writeJSON(FRAME_KEY, f);
    }
    if (f.sig !== sig || !(Number(f.zoom) >= 1)) return null;
    return { zoom: Math.min(4, Number(f.zoom)), x: unit(f.x, 0.5), y: unit(f.y, 0.5) };
  }
  function saveFrame(profile, ph) {
    var sig = photoSig(profile && profile.photo);
    if (!sig || !ph) return;
    writeJSON(FRAME_KEY, { zoom: Number(ph.zoom) || 1, x: unit(ph.x, 0.5), y: unit(ph.y, 0.5), sig: sig });
  }
  // 카드에 넣을 사진 — 남긴 맞춤이 있으면 그 확대·자리로 자른 그림, 없으면 원래 사진
  function framedPhoto(img, profile) {
    var f = img ? savedFrame(profile) : null;
    return f ? cropPhoto(img, f.zoom, f.x, f.y) : img;
  }

  function openEditor(o) {
    if (!window.WalsonEditor) return null;
    var card = document.createElement('canvas'), tabs = [];
    // 편집기는 카드와 같은 맞춤에서 시작 — 사진이 바뀌어 맞춤을 안 쓰면, 편집기가 기억한 예전 확대·자리도 지운다
    var frame = o.photo ? savedFrame(o.profile) : null;
    if (o.photo && !frame) { var k0 = readJSON(EDIT_KEY); if (k0 && k0.photo) { delete k0.photo; writeJSON(EDIT_KEY, k0); } }
    if (o.drawBack) tabs.push({
      id: 'side', label: '면', icon: 'side', first: true,
      rows: function (st) {
        return [{ chips: [{ text: '앞면', value: 'front', on: st.extra.side !== 'back' }, { text: '뒷면 · 산책 경력', value: 'back', on: st.extra.side === 'back' }] },
          { tip: (window.RewardRules && RewardRules.PLACES && RewardRules.PLACES.length) ? '뒷면엔 승급 기록·발도장 기록·특기가 들어가요. 발도장 장소 이름은 공개된 공원·가게 이름뿐이에요.'
            : '뒷면엔 승급 기록·꾸준함 도장·특기가 들어가요.' }];   // 11/24 전국판
      },
      onPick: function (v, st) { st.extra.side = v === 'back' ? 'back' : 'front'; }
    });
    // 테두리 색(2026-11-19 가르시아 "꾸미고 저장하기 안에다가 테두리 색 변경 기능 넣어라") — 이름 붙은 색 + 색 막대(card-color.js).
    // 고르면 미리 보기에 바로. [저장]하거나 그림을 내보내면 주민증에도 남고, [×]로 나오면 열 때 색으로 되돌린다
    var CC = window.WalsonCardColor, color0 = o.profile.cardColor;
    tabs.push({
      id: 'color', label: '테두리', icon: 'color',
      rows: function () {
        var cur = o.profile.cardColor, picked = typeof cur === 'string' && /^#[0-9a-f]{6}$/i.test(cur);
        var known = CARD_COLORS.some(function (c) { return c.id === cur; }), now = picked ? null : (known ? cur : 'mocha');
        var rows = [{ label: '테두리', chips: CARD_COLORS.map(function (c) {
          return { text: c.label, value: 'cc:' + c.id, on: now === c.id, swatch: c.color || (SIGNALS[o.profile.signal] || SIGNALS.none).color };
        }) }];
        if (CC) rows.push({ label: '직접', hue: { value: picked ? CC.hexHue(cur) : 28, on: picked, track: CC.TRACK, color: CC.hueHex, aria: '테두리 색 직접 고르기 — 색 막대를 누르거나 끌어요' } });
        rows.push({ tip: '테두리만 바뀌어요. 성향 띠는 성향 색 그대로예요.' });
        return rows;
      },
      // st.extra에도 적어 둔다 — 편집기가 [×]로 나갈 때 '고친 내용을 저장하지 않고 나갈까요?'를 물을 수 있게(저장 칸에는 안 남김)
      onPick: function (v, st) { if (String(v).indexOf('cc:') === 0) { o.profile.cardColor = String(v).slice(3); st.extra.cardColor = o.profile.cardColor; } },
      onHue: function (h, done, st) { if (CC) { o.profile.cardColor = CC.hueHex(h); st.extra.cardColor = o.profile.cardColor; } }
    });
    return WalsonEditor.open({
      title: o.title || '강아지 워킹패스',
      formats: [['card', '카드만'], ['square', '정사각형'], ['story', '스토리']], fmt: o.fmt || 'card',
      tabs: tabs, tab: o.side === 'back' ? 'side' : undefined,
      photo: o.photo ? { sources: [['profile', '워킹패스 사진']], src: 'profile', zoom: frame ? frame.zoom : 1, x: frame ? frame.x : 0.5, y: frame ? frame.y : 0.5,
        home: { x: 0.5, y: 0.5 }, noBand: '뒷면엔 사진이 없어요.' } : null,
      extra: { side: o.side === 'back' ? 'back' : 'front' },
      hint: o.photo ? '사진 칸을 끌어서 옮기고, 두 손가락으로 키워요' : '글자 붙이기로 한마디 얹어 보세요',
      draw: function (cv, st) {
        var front = st.extra.side !== 'back' || !o.drawBack;
        if (front) {
          var fo = Object.assign({}, o.frontOpts ? o.frontOpts() : {});
          fo.photo = o.photo ? cropPhoto(o.photo, st.photo.zoom, st.photo.x, st.photo.y) : null;
          drawFront(card, o.profile, fo);
        } else o.drawBack(card);
        var stats = o.stats === null ? null : (typeof o.stats === 'function' ? o.stats() : myStats());
        var out = composeExport(card, o.profile, st.fmt, { stats: stats, back: !front, photo: o.photo, zoom: st.photo && st.photo.zoom, qx: st.photo && st.photo.x, qy: st.photo && st.photo.y }),
          g = cv.getContext('2d');
        if (cv.width !== out.width) cv.width = out.width;
        if (cv.height !== out.height) cv.height = out.height;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, cv.width, cv.height);
        // '카드만'은 카드 그림 그대로라 둥근 모서리 바깥이 투명했다 — 사진첩·카톡에서 흰색·검은색 귀퉁이(테두리)로 남아서,
        // 신호등 테두리 색으로 채워 꽉 찬 네모로 저장한다(2026-11-16 가르시아 "카드 양식일 때 이미지 테두리가 남는 거")
        if (out === card) { g.fillStyle = cardColor(o.profile); g.fillRect(0, 0, cv.width, cv.height); }
        g.drawImage(out, 0, 0);
        if (!front || !o.photo) return null;
        if (out === card) return { x: PHOTO_BOX.x, y: PHOTO_BOX.y, w: PHOTO_BOX.w, h: PHOTO_BOX.h, img: o.photo };
        // 정사각형·스토리: composeExport가 알려 준 사진 칸(정사각형은 큰 사진, 스토리는 카드 안 사진 칸)
        var pb = out._photoBox;
        return pb ? { x: pb.x, y: pb.y, w: pb.w, h: pb.h, img: o.photo } : null;
      },
      storeKey: 'walson_edit_id_card',   // [저장]한 꾸미기(모양·사진 칸 자리·글자)를 다음에 이어서(주민증에 든 원래 사진은 그대로)
      fileName: function (st) { return (o.profile.name || 'dog') + '-워킹패스' + (st.extra.side === 'back' && o.drawBack ? '-뒷면' : '') + (st.fmt === 'card' ? '' : '-' + st.fmt) + '.png'; },
      onSave: o.onSave,
      // [저장]했거나 내보냈으면(kept) 사진 맞춤을 카드 쪽에도 남긴다 — 부른 화면은 onClose에서 카드를 다시 그린다
      onClose: function (st, kept) {
        if (kept && o.photo && st.photo) saveFrame(o.profile, st.photo);
        // 테두리 색: 남겼으면 프로필에 저장, [×]로 나왔으면 열 때 색으로
        if (o.profile.cardColor !== color0) {
          if (kept) { if (window.WalsonStore) WalsonStore.saveProfile(o.profile); }
          else if (color0 === undefined) delete o.profile.cardColor; else o.profile.cardColor = color0;
        }
        if (o.onClose) o.onClose(st, kept);
      }
    });
  }

  window.WalsonIdCard = {
    W: W, H: H, SIGNALS: SIGNALS, SHARE_URL: SHARE_URL, SHARE_URL_TEXT: SHARE_URL_TEXT, PHOTO_BOX: PHOTO_BOX, cardQrText: cardQrText, cardNoText: cardNoText,
    CARD_COLORS: CARD_COLORS, cardColor: cardColor, infoBits: infoBits, drawKeyringBack: drawKeyringBack,
    drawFront: drawFront, drawBack: drawBack, composeExport: composeExport, myStats: myStats, openEditor: openEditor, framedPhoto: framedPhoto,
    loadImage: loadImage, fontsReady: fontsReady, todayText: todayText, dateText: dateText
  };
})();
