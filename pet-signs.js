// 반려동물 동반 영업장 인쇄물(입구 표지판·매장 안내문·라벨) 그리기 — 2026-11-16 pet-ready.html에서 분리. 전역 window.PetSigns.
// pet-ready.html(동반 준비 도우미)과 visit-kit.html(방문 키트)이 같은 그림을 쓴다. 스타일은 pet-signs.css.
// 입력 st: { shop, dog(기본 true), cat, size:''|'kg10'|'kg7'|'small'|'carry', way:'carry'|'leash'|'chair'|'zone', bite, danger }
// 입구 표지판은 법이 요구하는 것을 담는다: "반려동물 동반 영업장" 문구, 종류·크기 제한, 미접종 출입 불가 표시(hq notes/petwalk-pet-restaurant-rules.md).
(function () {
  // ── 선 아이콘(직접 그림, 48×48) ──
  var DOG = '<path d="M14 15c-3 2-6 9-6 12 0 2 2 3 4 1l3-4"/><path d="M34 15c3 2 6 9 6 12 0 2-2 3-4 1l-3-4"/><path d="M15 14c4-4 14-4 18 0 3 4 3 13 0 18-2 4-5 6-9 6s-7-2-9-6c-3-5-3-14 0-18z"/><circle cx="19.5" cy="23" r="1.6" fill="currentColor" stroke="none"/><circle cx="28.5" cy="23" r="1.6" fill="currentColor" stroke="none"/><path d="M22 30h4l-2 2.4z" fill="currentColor"/>';
  var I = {
    dog: DOG,
    scale: '<g transform="translate(0,-4) scale(.8) translate(6,0)">' + DOG + '</g><rect x="11" y="36" width="26" height="9" rx="1.5"/><text x="24" y="43" font-size="7" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none" font-family="Pretendard,sans-serif">KG</text>',
    syringe: '<path d="M33 7l8 8"/><path d="M37 11L19 29l-6-6L31 5"/><path d="M13 23l-4 4M19 29l-4 4M9 33l6 6M11 35l-5 5"/><path d="M25 17l3 3M21 21l3 3"/>',
    hug: '<circle cx="24" cy="9" r="5"/><path d="M12 44c0-12 4-22 12-22s12 10 12 22"/><path d="M15 31c5 4 13 4 18 0"/><g transform="translate(15,24) scale(.38)">' + DOG + '</g>',
    cart: '<rect x="8" y="18" width="30" height="16" rx="3"/><path d="M8 18c4-9 26-9 30 0"/><path d="M38 22h4l2-6"/><circle cx="14" cy="40" r="3.5"/><circle cx="32" cy="40" r="3.5"/>',
    leash: '<g transform="translate(-4,6) scale(.75)">' + DOG + '</g><path d="M26 36c6 0 8-10 12-18"/><circle cx="40" cy="14" r="4"/>',
    chair: '<path d="M14 6v34M34 6v34M14 24h20M14 6h20M14 15h20"/><path d="M10 40h28"/>',
    zone: '<rect x="6" y="10" width="36" height="28" rx="2" stroke-dasharray="4 3"/><g transform="translate(12,13) scale(.5)">' + DOG + '</g>',
    walk: '<circle cx="14" cy="8" r="4"/><path d="M14 13v13l-4 14M14 26l5 14M14 17l7 6"/><path d="M21 23c4 4 7 8 9 12"/><g transform="translate(26,26) scale(.42)">' + DOG + '</g>',
    apart: '<g transform="translate(-3,4) scale(.55)">' + DOG + '</g><g transform="translate(24,4) scale(.55)">' + DOG + '</g><path d="M24 8v34" stroke-dasharray="3 3"/><path d="M18 36h-8M30 36h8M12 33l-3 3 3 3M36 33l3 3-3 3"/>',
    nokitchen: '<path d="M12 22h24v10a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8z"/><path d="M8 22h32M18 16c0-3 2-3 2-6M26 16c0-3 2-3 2-6"/><circle cx="24" cy="26" r="21" stroke-width="2.6"/><path d="M9 41L39 11" stroke-width="2.6"/>',
    poop: '<path d="M14 18h20l-2 24H16z"/><path d="M14 18c2-4 4-6 10-6s8 2 10 6"/><path d="M19 30h10M20 36h8"/>',
    bowl: '<path d="M6 26h36l-4 12H10z"/><path d="M14 26c0-5 4-8 10-8s10 3 10 8"/><path d="M20 12c0-2 2-2 2-4M26 12c0-2 2-2 2-4"/>',
    nobite: '<g transform="translate(5,6) scale(.8)">' + DOG + '</g><circle cx="24" cy="24" r="21" stroke-width="2.6"/><path d="M9 39L39 9" stroke-width="2.6"/>',
    cover: '<path d="M8 34h32"/><path d="M11 34c0-9 6-15 13-15s13 6 13 15"/><path d="M24 19v-4M21 15h6"/>'
  };
  function svg(name) { return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[name] + '</svg>'; }

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
