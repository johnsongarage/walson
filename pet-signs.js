// 반려동물 동반 영업장 인쇄물(입구 표지판·매장 안내문·라벨) 그리기 — 2026-11-16 pet-ready.html에서 분리. 전역 window.PetSigns.
// pet-ready.html(동반 준비 도우미)과 visit-kit.html(방문 키트)이 같은 그림을 쓴다. 스타일은 pet-signs.css.
// 입력 st: { shop, dog(기본 true), cat, size:''|'kg10'|'kg7'|'small'|'carry', way:'carry'|'leash'|'chair'|'zone', bite, danger }
// 입구 표지판은 법이 요구하는 것을 담는다: "반려동물 동반 영업장" 문구, 종류·크기 제한, 미접종 출입 불가 표시(hq notes/petwalk-pet-restaurant-rules.md).
(function () {
  // ── 선 아이콘(직접 그림, 48×48, 가는 선 1로 통일 — 2026-11-16 가르시아가 보여 준 매장 안내문 수준에 맞춰 래브라도풍 강아지로 다시 그림(그 그림을 베끼지 않고 직접 그림)) — 2026-11-16 다시 그림 ──
  // 작게 넣는 그림(g)은 줄인 만큼 선을 굵게 해서, 어디서나 선 굵기가 같아 보이게 한다.
  var SW = 1;
  function g(k, cx, cy, ox, oy, inner, pk) {
    return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + k + ') translate(' + (-ox) + ' ' + (-oy) + ')" stroke-width="' + (SW / (k * (pk || 1))).toFixed(2) + '">' + inner + '</g>';
  }
  var DOT = ' fill="currentColor" stroke="none"';
  // 강아지 얼굴(가운데 24,22)
  // 강아지 머리(정면, 넓은 이마·좁은 주둥이·크게 늘어진 귀). 원래 좌표의 가운데는 (24,17.9)
  var SKULL = '<path d="M16.500 12c1.700-3.200 4.300-4.700 7.500-4.700s5.800 1.500 7.500 4.700c.5 3 .4 6.300-.4 9.300-.5 1.900-1.300 3.500-2.400 4.800-1.200 1.500-2.800 2.400-4.700 2.400s-3.500-.9-4.700-2.400c-1.100-1.300-1.900-2.900-2.400-4.800-.8-3-.9-6.300-.4-9.300z"/>';
  var EARS =
    '<path d="M16.500 12c-2.600-2.300-6-2.200-8.300.2-1.500 1.600-1.900 3.800-1.300 6.100.7 2.700 2.200 5.500 4.100 7.300.9.9 1.900.8 2.600-.2 1.200-1.700 2-3.900 2.500-6.400"/>' +
    '<path d="M31.500 12c2.600-2.300 6-2.200 8.300.2 1.500 1.600 1.900 3.800 1.300 6.100-.7 2.700-2.200 5.500-4.100 7.300-.9.9-1.900.8-2.600-.2-1.200-1.700-2-3.900-2.500-6.400"/>';
  var NOSE = '<path d="M21.700 20.600c0-.8 1-1.300 2.300-1.300s2.300.5 2.300 1.300c0 1.300-1.400 2.700-2.300 2.700s-2.300-1.400-2.300-2.700z"' + DOT + '/>';
  var EYES = '<circle cx="20.300" cy="16.300" r="1"' + DOT + '/><circle cx="27.700" cy="16.300" r="1"' + DOT + '/>';
  var EYES_S = '<circle cx="20.300" cy="16.300" r="1.500"' + DOT + '/><circle cx="27.700" cy="16.300" r="1.500"' + DOT + '/>';
  var MOUTH = '<path d="M24 23.300v1.300M20.800 24c.5 1.600 2.200 2 3.200.6 1 1.400 2.700 1 3.200-.6"/>';
  // 아래 아이콘들은 머리 가운데를 (24,22)로 보고 놓는다 → 4.1 내려 둔다
  // 머리는 가로로 12% 넓혀 통통하게(가운데 x=24 기준)
  function wide(inner) { return '<g transform="translate(24 0) scale(1.120 1) translate(-24 0)">' + inner + '</g>'; }
  function down(inner) { return '<g transform="translate(0 4.100)">' + wide(inner) + '</g>'; }
  var HEAD = down(SKULL + EARS);
  var FACE = down(SKULL + EARS + EYES + NOSE + MOUTH);
  // 아주 작게 넣을 때: 눈·코만 조금 크게(입 선은 뭉개져서 뺀다)
  var FACE_S = down(SKULL + EARS + EYES_S + NOSE);
  // 앉아 있는 강아지(정면): 머리 + 가슴 + 앞다리 둘 + 양옆 뒷다리. 가운데 (24,24)
  function sit(pk, small) {
    return g(0.8, 24, 12.800, 24, 17.900, wide(SKULL + EARS + (small ? EYES_S + NOSE : EYES + NOSE + MOUTH)), pk) +
      '<path d="M19.200 20.800c-.6 2.800-.9 5.700-.9 8.700v15M28.800 20.800c.6 2.800.9 5.700.9 8.700v15"/>' +
      '<path d="M22.400 44.500V32.600c0-1 .7-1.700 1.600-1.700s1.600.7 1.600 1.700v11.900"/>' +
      '<path d="M18.300 30.600c-3.600.6-6 3.400-6 6.900 0 2.700 1.100 5.100 3 7M29.700 30.600c3.600.6 6 3.400 6 6.900 0 2.700-1.100 5.100-3 7"/>' +
      '<path d="M13.500 44.500h21"/>';
  }
  // 발바닥(가운데 0,0 — translate로 놓는다)
  function paw(x, y, k) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (k || 1) + ')"' + DOT + '>' +
      '<path d="M-3.4 2.3c0-2.2 1.6-4 3.4-4s3.4 1.8 3.4 4c0 1.6-1.4 2.3-3.4 2.3s-3.4-.7-3.4-2.3z"/>' +
      '<circle cx="-4" cy="-2.4" r="1.25"/><circle cx="-1.4" cy="-4.4" r="1.25"/><circle cx="1.4" cy="-4.4" r="1.25"/><circle cx="4" cy="-2.4" r="1.25"/></g>';
  }
  var BAN = '<circle cx="24" cy="24" r="21.600" stroke-width="1.250"/><path d="M8.700 39.300L39.300 8.700" stroke-width="1.250"/>';
  var I = {
    dog: sit(1),
    // 얼굴 + 무게 꼬리표
    scale: g(0.8, 24, 17.200, 24, 22, FACE) + '<rect x="9.500" y="31.800" width="29" height="11.500" rx="2.200" fill="#fff"/>' +
      '<text x="24" y="40.200" font-size="7.200" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="Pretendard,sans-serif">KG</text>',
    // 주사기(45° 기울임)
    syringe: '<g transform="rotate(45 24 24)">' +
      '<path d="M19 7.5h10M24 7.5v6.5"/><path d="M16.5 14h15"/>' +
      '<rect x="19" y="14" width="10" height="18" rx="1.6"/>' +
      '<path d="M19 19.5h4M19 24h4M19 28.5h4"/>' +
      '<path d="M22 32h4l-.8 3.2h-2.4z"/><path d="M24 35.2v8.3"/></g>',
    // 안고 있기: 사람 + 품 안의 강아지
    hug: '<circle cx="24" cy="7.800" r="4.600"/>' +
      '<path d="M9.500 44v-9c0-7.600 5.500-13 14.500-13s14.500 5.400 14.500 13v9"/>' +
      g(0.46, 24, 30, 24, 22, FACE_S) +
      '<path d="M14.500 35.500c0 3.300 2.400 5.500 5.500 5.500h8c3.100 0 5.500-2.200 5.500-5.500"/>',
    // 목줄: 앉은 강아지 + 줄 + 손잡이 고리
    leash: g(0.82, 19, 26.500, 24, 24, sit(0.82)) + '<path d="M26.500 22c4.500-1.500 7.500-5 9.300-9.800"/><rect x="33.200" y="3.200" width="7.600" height="9.400" rx="2.400" transform="rotate(24 37 7.900)"/><rect x="35.300" y="5.600" width="3.400" height="4.600" rx="1.200" transform="rotate(24 37 7.900)"/>',
    // 전용 의자: 의자 위 강아지
    chair: '<rect x="9.500" y="4.500" width="5" height="25" rx="2.500"/><rect x="9.500" y="26.500" width="29" height="5" rx="2.500"/>' +
      '<path d="M13 31.500v12M35 31.500v12M13 38h22"/>' + g(0.52, 26, 15.700, 24, 22, FACE),
    // 전용 자리: 점선 칸 안의 강아지
    zone: '<rect x="4.5" y="4.5" width="39" height="39" rx="4" stroke-dasharray="4.2 3.6"/>' + g(0.68, 24, 24.500, 24, 24, sit(0.68)),
    // 함께 이동: 걷는 사람 + 줄 + 강아지
    walk: '<circle cx="13" cy="7.6" r="4.3"/><path d="M13 13.5v14M13 27.5l-5 14M13 27.5l5.5 14M13 17.5l8.5 5.5"/>' +
      '<path d="M21.5 23c4.5 1.2 7.5 3 9.5 5.5"/>' + g(0.5, 35, 33, 24, 24, sit(0.5, true)),
    // 닿지 않게: 두 마리 사이 거리 화살표
    apart: g(0.5, 11.5, 17, 24, 22, FACE) + g(0.5, 36.5, 17, 24, 22, FACE) +
      '<path d="M24 5v24" stroke-dasharray="3 3"/><path d="M8 38h32M12.5 33.8L8 38l4.5 4.2M35.5 33.8L40 38l-4.5 4.2"/>',
    // 주방 출입 금지: 냄비 + 금지
    nokitchen: '<path d="M14 21.5h20v9.5a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6z"/><path d="M11.5 21.5h25M14 25.5h-3.2M34 25.5h3.2"/>' +
      '<path d="M19.5 17c0-2.4 1.8-2.6 1.8-5M26.5 17c0-2.4 1.8-2.6 1.8-5"/>' + BAN,
    // 배설물 전용 통: 뚜껑 있는 통 + 발바닥
    poop: '<path d="M11 13.5h26M19.5 13.5v-4h9v4"/><path d="M13.5 13.5l2.2 27a2.5 2.5 0 0 0 2.5 2.3h11.6a2.5 2.5 0 0 0 2.5-2.3l2.2-27"/>' + paw(24, 29, 1.15),
    // 반려동물 식기: 그릇 + 사료 + 발바닥
    bowl: '<path d="M6.5 24.5h35l-3.2 13.2a2.6 2.6 0 0 1-2.5 2H12.2a2.6 2.6 0 0 1-2.5-2z"/>' +
      '<path d="M11.500 24.500c0-2.600 2-4.500 4.300-4.500 1 0 1.900.3 2.600.9.800-2.200 2.900-3.700 5.600-3.700s4.800 1.500 5.600 3.700c.7-.6 1.600-.9 2.600-.9 2.300 0 4.300 1.900 4.300 4.500"/>' + paw(24, 33.4, 0.95),
    // 공격성 있는 반려견 불가: 찌푸린 얼굴 + 금지
    nobite: g(0.8, 24, 24.500, 24, 22, HEAD + '<path d="M17.600 16.800l4.800 2.400M30.400 16.800l-4.800 2.400"/>' +
      '<circle cx="20.300" cy="21.400" r="1.500"' + DOT + '/><circle cx="27.700" cy="21.400" r="1.500"' + DOT + '/>' +
      '<path d="M20.300 30.800c2.200-2 5.200-2 7.400 0"/>') + BAN
  };
  function svg(name) { return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="' + SW + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[name] + '</svg>'; }

  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function row(icon, html) { return '<div class="prow">' + svg(icon) + '<div class="t">' + html + '</div></div>'; }
  function animalsWord(st) {
    var dog = st.dog !== false, cat = !!st.cat;
    return dog && cat ? '강아지·고양이' : cat ? '고양이' : '강아지';
  }
  var SIZE = { kg10: '<b>10kg 이하</b>', kg7: '<b>7kg 이하</b>', small: '<b>소형</b>', carry: '<b>안을 수 있는 크기</b>의' };

  function entrance(st) {
    st = st || {};
    var way = st.way || 'carry', aw = animalsWord(st), size = SIZE[st.size] || '';
    var kgIcon = st.size === 'kg10' || st.size === 'kg7';
    var r = row(kgIcon ? 'scale' : 'dog',
      size ? size + ' ' + aw + '만<br><b>함께 들어오실 수 있어요.</b>' : aw + '와 <b>함께 들어오실 수 있어요.</b>');
    if (kgIcon) r = r.replace('>KG<', '>' + (st.size === 'kg7' ? '7kg↓' : '10kg↓') + '<');
    r += row('syringe', '<span class="em">예방접종을 하지 않은 반려동물은<br>들어올 수 없어요.</span> 입구에서 접종 여부를 확인해요.');
    var stay = {
      carry: ['hug', '매장 안에서는 <b>안고 계시거나,<br>가져오신 케이지·유모차에</b> 두어 주세요.'],
      leash: ['leash', '<b>목줄을 하고</b> 들어와 주세요.<br>자리에서는 목줄 고정 장치에 걸어 주세요.'],
      chair: ['chair', '<b>목줄을 하고</b> 들어와 주세요.<br>자리에서는 반려동물 전용 의자를 이용해 주세요.'],
      zone: ['zone', '<b>목줄을 하고</b> 들어와 주세요.<br>반려동물 전용 자리를 이용해 주세요.']
    }[way] || ['hug', ''];
    r += row(stay[0], stay[1]);
    if (st.bite !== false) r += row('nobite', '사람이나 다른 동물을 <b>공격할 수 있는 반려견은<br>들어올 수 없어요.</b>');
    var box = st.danger !== false
      ? '<b>다음 견종은 출입이 제한돼요</b>동물보호법상 맹견 — 도사견, 아메리칸 핏불테리어, 아메리칸 스태퍼드셔 테리어, 스태퍼드셔 불 테리어, 로트와일러와 그 잡종'
      : '<b>주방·식재료 보관 장소에는 들어갈 수 없어요</b>다른 손님과 반려동물 모두 편하게 머물 수 있게 함께 지켜 주세요.';
    return '<div class="paper"><div class="eyebrow">PET-FRIENDLY</div><div class="ptitle">반려동물 동반 영업장</div>' +
      '<div class="psub">반려동물 출입 안내</div><div class="rows">' + r + '</div><div class="pbox">' + box + '</div>' +
      '<div class="pfoot">' + esc(st.shop) + '</div><div class="plaw">식품위생법 시행규칙에 따른 반려동물(개·고양이) 동반 영업장</div></div>';
  }
  function inside(st) {
    st = st || {};
    var way = st.way || 'carry';
    var inStay = { carry: '안고 계시거나 케이지·유모차에 두어 주세요.', leash: '자리의 목줄 고정 장치에 걸어 주세요.', chair: '반려동물 전용 의자에 앉혀 주세요.', zone: '반려동물 전용 자리를 이용해 주세요.' }[way] || '';
    var rows =
      row(way === 'carry' ? 'hug' : way, '매장 안에서는 반려동물이 <b>자유롭게 돌아다닐 수 없어요.</b><br>' + inStay) +
      row('walk', '주문하시거나 화장실에 가실 때는<br><b>목줄을 하고 함께 이동</b>해 주세요.') +
      row('apart', '다른 손님·다른 반려동물과 <b>닿지 않게</b> 살펴 주세요.') +
      row('nokitchen', '<b>주방·식재료 보관 장소</b>에는 들어갈 수 없어요.') +
      row('poop', '배변 봉투는 <b>반려동물 배설물 전용 통</b>에 버려 주세요.');
    return '<div class="paper"><div class="eyebrow">PETIQUETTE</div><div class="ptitle">함께 지켜 주세요</div>' +
      '<div class="psub">매장 안 이용 안내</div><div class="rows">' + rows + '</div><div class="pfoot" style="margin-top:auto;">' + esc(st.shop) + '</div></div>';
  }
  function labels() {
    return '<div class="labels">' +
      '<div class="label">' + svg('nokitchen') + '<div class="lt"><b>반려동물<br>출입 금지</b><span>주방 · 식재료 보관 장소</span></div></div>' +
      '<div class="label">' + svg('bowl') + '<div class="lt"><b>반려동물용<br>식기</b><span>손님용과 따로 보관·사용해요</span></div></div>' +
      '<div class="label">' + svg('poop') + '<div class="lt"><b>반려동물<br>배설물 전용</b><span>배변 봉투는 여기에 버려 주세요</span></div></div></div>';
  }
  // ── 정사각 표지판(2026-11-16 가르시아 "A4는 벽에 붙이기엔 너무 커") ──
  // 200×200mm로 그리고, 148mm는 같은 그림을 줄여 쓴다. 아이콘 칸(타일)에 짧은 문장 하나씩 — 법이 요구하는 문구는 그대로 담는다.
  function tile(icon, html) { return '<div class="sqt">' + svg(icon) + '<div class="tx">' + html + '</div></div>'; }
  function entranceSquare(st) {
    st = st || {};
    var way = st.way || 'carry', aw = animalsWord(st), size = SIZE[st.size] || '';
    var kgIcon = st.size === 'kg10' || st.size === 'kg7';
    var t1 = tile(kgIcon ? 'scale' : 'dog', size ? size + ' ' + aw + '만<br>함께 들어올 수 있어요' : aw + '와<br><b>함께 들어올 수 있어요</b>');
    if (kgIcon) t1 = t1.replace('>KG<', '>' + (st.size === 'kg7' ? '7kg↓' : '10kg↓') + '<');
    var t2 = tile('syringe', '<span class="em">예방접종 안 한<br>반려동물은 출입 불가</span>');
    var t3 = {
      carry: tile('hug', '매장 안에서는<br><b>안거나 케이지·유모차에</b>'),
      leash: tile('leash', '<b>목줄 착용</b><br>자리에서는 고정 장치에'),
      chair: tile('chair', '<b>목줄 착용</b><br>자리에서는 전용 의자에'),
      zone: tile('zone', '<b>목줄 착용</b><br>전용 자리를 이용해 주세요')
    }[way] || '';
    var t4 = st.bite !== false ? tile('nobite', '공격성 있는 반려견은<br><b>출입 불가</b>') : tile('nokitchen', '주방·식재료 보관 장소<br><b>출입 불가</b>');
    var box = st.danger !== false ? '<div class="sqbox"><b>맹견 출입 제한</b> 도사견 · 아메리칸 핏불테리어 · 아메리칸 스태퍼드셔 테리어 · 스태퍼드셔 불 테리어 · 로트와일러와 그 잡종</div>' : '';
    return '<div class="sqs"><div class="eyebrow">PET-FRIENDLY</div><div class="sqtitle">반려동물 동반 영업장</div>' +
      '<div class="sqgrid g2">' + t1 + t2 + t3 + t4 + '</div>' + box +
      '<div class="sqfoot"><span class="shop">' + esc(st.shop) + '</span><span class="law">식품위생법 시행규칙에 따른 반려동물(개·고양이) 동반 영업장</span></div></div>';
  }
  function insideSquare(st) {
    st = st || {};
    var way = st.way || 'carry';
    var stay = { carry: '<b>안거나 케이지·유모차에</b><br>두어 주세요', leash: '자리의<br><b>목줄 고정 장치</b>에', chair: '반려동물<br><b>전용 의자</b>에', zone: '반려동물<br><b>전용 자리</b>를 이용해요' }[way] || '';
    return '<div class="sqs"><div class="eyebrow">PETIQUETTE</div><div class="sqtitle">함께 지켜 주세요</div>' +
      '<div class="sqgrid g3">' +
        tile(way === 'carry' ? 'hug' : way, '돌아다닐 수 없어요<br>' + stay) +
        tile('walk', '주문·화장실 갈 땐<br><b>목줄 하고 함께</b>') +
        tile('apart', '다른 손님·반려동물과<br><b>닿지 않게</b>') +
        tile('nokitchen', '주방·식재료 보관 장소<br><b>출입 불가</b>') +
        tile('poop', '배변 봉투는<br><b>전용 통에</b>') +
        tile('dog', '함께 지켜 주셔서<br><b>고맙습니다</b>') +
      '</div><div class="sqfoot"><span class="shop">' + esc(st.shop) + '</span></div></div>';
  }
  // A4 한 장에 담기: fmt 'a4'(기존) | 'sq200'(200mm 한 장) | 'sq148'(148mm 두 장). 정사각은 점선대로 잘라 쓴다.
  function page(kind, st, fmt) {
    if (fmt !== 'sq200' && fmt !== 'sq148') return kind === 'inside' ? inside(st) : entrance(st);
    var one = kind === 'inside' ? insideSquare(st) : entranceSquare(st);
    if (fmt === 'sq200') return '<div class="sqpage"><div class="sqcut w200">' + one + '</div></div>';
    return '<div class="sqpage two"><div class="sqcut w148"><div class="sqzoom">' + one + '</div></div><div class="sqcut w148"><div class="sqzoom">' + one + '</div></div></div>';
  }
  window.PetSigns = { svg: svg, entrance: entrance, inside: inside, labels: labels, entranceSquare: entranceSquare, insideSquare: insideSquare, page: page };
})();
