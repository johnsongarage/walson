// 산책 보상 카드(자라는 카드) 그리기 — card-reward.html(디자인 비교 도구)과 my-card.html(사용자
// 화면)이 같은 카드를 그리도록 card-reward.html에서 분리함(2026-09-26). 보상 규칙 숫자는
// reward-rules.js, 카드 모양은 이 파일. card-shared.js와 reward-rules.js를 먼저 불러와야 한다.
// 이 파일을 고치면 ?v= 번호를 올리고 두 HTML 파일에서 같이 올릴 것(card-shared.js와 같은 캐시 문제).
//
// 사용법: var card = RewardCard.create(function () { return state; });
//   state = { name, petImage, filterKey, photoOffset: {x,y}, photoZoom,
//             skill: {title, desc}, passive: {title, desc}, showLocked, tiersOn }
//   card.drawSide(canvas, 'front'|'back', progress, card.sharedHeight(progress))
(function () {
  var CS = window.CardShared;
  var RR = window.RewardRules;
  var FRAME_TIERS = RR.FRAME_TIERS, SLOT_RULES = RR.SLOT_RULES, PLACES = RR.PLACES;

  var W = 680;
  var PHOTO_D = 460, PHOTO_TOP = 20, FRAME_TOP = 90;
  var PHOTO_CX = W / 2, PHOTO_CY = PHOTO_TOP + PHOTO_D / 2;
  var PHOTO_RECT = { x: PHOTO_CX - PHOTO_D / 2, y: PHOTO_TOP, w: PHOTO_D, h: PHOTO_D };
  var MAP_MIN_H = 520;
  // 이모지는 쓰지 않는다(2026-11-15 뉴브루탈리즘 정리) — 빈 목록이면 이모지 자리 없이 글자만 그린다
  var EMOJI = [];

  function create(getState) {
    var cartoonCache = { source: null, canvas: null };

    function tierOf(s, p) {
      return s.tiersOn ? RR.tierFor(p.walks) : FRAME_TIERS[FRAME_TIERS.length - 1];
    }

    function getPhotoDrawSource(s) {
      if (s.filterKey !== 'cartoon') return s.petImage;
      if (cartoonCache.source !== s.petImage) {
        cartoonCache.canvas = CS.applyCartoonEffect(s.petImage);
        cartoonCache.source = s.petImage;
      }
      return cartoonCache.canvas;
    }

    // ── 공통 프레임 ──
    // 뉴브루탈리즘(2026-11-15): 그라데이션·둥근 모서리·흐린 그림자 대신 등급 색 한 가지 + 굵은 검정 선 +
    // 딱 떨어지는 검정 그림자. 등급은 테두리 색으로 구분한다(종이 흰색 → 나무 → 은 → 금).
    var INK = '#000', SOFT = '#3d3d3d';
    var TIER_FILL = { '종이': '#FFFFFF', '나무': '#C8955E', '은': '#C9D0D6', '금': '#F2B833' };
    function tierFill(tier) { return TIER_FILL[tier.name] || '#FFFFFF'; }

    function boxWithShadow(ctx, x, y, w, h, fill, line, shadow) {
      if (shadow) { ctx.fillStyle = INK; ctx.fillRect(x + shadow, y + shadow, w, h); }
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
      ctx.lineWidth = line;
      ctx.strokeStyle = INK;
      ctx.strokeRect(x + line / 2, y + line / 2, w - line, h - line);
    }

    function drawFrame(ctx, H, tier, top) {
      var sh = 10;
      var x = 8, y = top, w = W - 16 - sh, h = H - 8 - sh - top;
      boxWithShadow(ctx, x, y, w, h, tierFill(tier), 6, sh);
      // 안쪽 흰 판 — 등급 색은 바깥 띠로만 보이게
      var band = 10 + Math.round(tier.width / 2);
      boxWithShadow(ctx, x + band, y + band, w - band * 2, h - band * 2, '#FFFFFF', 4, 0);

      // 은·금은 네 귀퉁이에 검정 사각 리벳을 박아 "등급이 높다"는 걸 한눈에 보이게 한다
      if (tier.minWalks >= FRAME_TIERS[2].minWalks) {
        var c = 14;
        [[x + band + 12, y + band + 12], [x + w - band - 12 - c, y + band + 12],
         [x + band + 12, y + h - band - 12 - c], [x + w - band - 12 - c, y + h - band - 12 - c]].forEach(function (p) {
          ctx.fillStyle = INK;
          ctx.fillRect(p[0], p[1], c, c);
        });
      }
    }

    function drawPhoto(ctx, s, tier) {
      var R = PHOTO_RECT;
      ctx.fillStyle = INK;
      ctx.fillRect(R.x + 10, R.y + 10, R.w, R.h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(R.x, R.y, R.w, R.h);
      ctx.clip();
      ctx.fillStyle = '#F2B833';
      ctx.fillRect(R.x, R.y, R.w, R.h);
      if (s.petImage) {
        var src = getPhotoDrawSource(s);
        ctx.filter = s.filterKey === 'cartoon' ? 'none' : (CS.FILTER_MAP[s.filterKey] || 'none');
        var fit = CS.computePhotoFit(PHOTO_RECT, src, s.photoZoom);
        ctx.imageSmoothingEnabled = s.filterKey !== 'cartoon';
        ctx.drawImage(src,
          R.x + (R.w - fit.dw) / 2 + s.photoOffset.x,
          R.y + (R.h - fit.dh) / 2 + s.photoOffset.y, fit.dw, fit.dh);
        ctx.imageSmoothingEnabled = true;
        ctx.filter = 'none';
      } else {
        ctx.fillStyle = INK;
        ctx.font = '800 20px "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('사진을 골라 주세요', PHOTO_CX, PHOTO_CY);
      }
      ctx.restore();

      ctx.lineWidth = 6;
      ctx.strokeStyle = INK;
      ctx.strokeRect(R.x + 3, R.y + 3, R.w - 6, R.h - 6);
    }

    function drawLockedSlot(ctx, x, y, w, label, sub) {
      var h = 78;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, y, w, h);
      ctx.setLineDash([10, 6]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      ctx.setLineDash([]);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '800 20px "Malgun Gothic", sans-serif';
      ctx.fillStyle = INK;
      ctx.fillText('잠김 · ' + label, x + 28, y + 26);
      ctx.font = '15px "Malgun Gothic", sans-serif';
      ctx.fillStyle = SOFT;
      ctx.fillText(sub, x + 28, y + 56);
      ctx.textBaseline = 'top';
      return y + h;
    }

    function drawBadgeRow(ctx, y, p, showLocked) {
      var items = PLACES.filter(function (pl) { return showLocked || p.visited[pl.id]; });
      if (!items.length) return y;
      var gap = 12, x0 = 44, total = W - 88 - 4;
      var pillW = (total - gap * (items.length - 1)) / items.length, pillH = 46;
      items.forEach(function (pl, i) {
        var x = x0 + i * (pillW + gap);
        var got = !!p.visited[pl.id];
        if (got) {
          boxWithShadow(ctx, x, y, pillW, pillH, '#C8F06A', 3, 4);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(x, y, pillW, pillH);
          ctx.setLineDash([8, 5]);
          ctx.lineWidth = 3;
          ctx.strokeStyle = INK;
          ctx.strokeRect(x + 1.5, y + 1.5, pillW - 3, pillH - 3);
          ctx.setLineDash([]);
        }
        ctx.font = (got ? '800 ' : '') + '16px "Malgun Gothic", sans-serif';
        ctx.fillStyle = got ? INK : SOFT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((got ? '' : '잠김 · ') + pl.name, x + pillW / 2, y + pillH / 2);
      });
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      return y + pillH + 4;
    }

    function traitChip(ctx, y, title, desc, fill) {
      return CS.drawTraitChip(ctx, { x: 44, y: y, w: W - 88 - 6, titleText: title, desc: desc,
        titleColor: INK, titleAlign: 'left',
        titleFont: '800 23px "Malgun Gothic", sans-serif', titleLH: 28,
        descFont: '18px "Malgun Gothic", sans-serif',
        chip: { fill: fill, stroke: INK, lineWidth: 3, radius: 0, shadow: 5 } }) + 5;
    }

    // ── 앞면 ──
    function drawFront(ctx, H, p) {
      var s = getState();
      var tier = tierOf(s, p);
      ctx.clearRect(0, 0, W, H);
      drawFrame(ctx, H, tier, FRAME_TOP);
      drawPhoto(ctx, s, tier);

      var nameY = PHOTO_TOP + PHOTO_D + 26;
      ctx.font = '34px "Black Han Sans", sans-serif';
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(s.name, W / 2, nameY);

      var metaY = nameY + 42;
      ctx.font = '800 16px "Malgun Gothic", sans-serif';
      var meta = (s.tiersOn ? tier.name + ' 등급  ·  ' : '') + '산책 ' + p.walks + '회  ·  ' + p.km.toFixed(1) + 'km';
      ctx.fillText(meta, W / 2, metaY);
      ctx.textAlign = 'left';

      var lineY = metaY + 34;
      ctx.fillStyle = INK;
      ctx.fillRect(44, lineY - 1.5, W - 88 - 6, 3);

      var y = lineY + 22;
      var drewSomething = false;

      if (p.walks >= SLOT_RULES.skill) {
        y = traitChip(ctx, y, s.skill.title, s.skill.desc, '#FFD6EA');
        drewSomething = true;
      } else if (s.showLocked) {
        y = drawLockedSlot(ctx, 44, y, W - 88 - 6, '스킬 칸', '산책 ' + SLOT_RULES.skill + '회 하면 열려요');
        drewSomething = true;
      }
      if (drewSomething) y += 16;

      var drewPassive = false;
      if (p.walks >= SLOT_RULES.passive) {
        y = traitChip(ctx, y, s.passive.title, s.passive.desc, '#EAF8C4');
        drewPassive = true;
      } else if (s.showLocked) {
        y = drawLockedSlot(ctx, 44, y, W - 88 - 6, '특성 칸', '산책 ' + SLOT_RULES.passive + '회 하면 열려요');
        drewPassive = true;
      }
      if (drewPassive) y += 16;

      var yAfterBadges = drawBadgeRow(ctx, y, p, s.showLocked);
      if (yAfterBadges > y) y = yAfterBadges + 18;

      if (s.showLocked) {
        ctx.font = '700 15px "Malgun Gothic", sans-serif';
        ctx.fillStyle = INK;
        ctx.textAlign = 'center';
        ctx.fillText('다음 보상 · ' + RR.nextGoalText(p), W / 2, y + 2);
        ctx.textAlign = 'left';
        y += 26;
      }
      return y;
    }

    // ── 뒷면: 다산동 발도장 지도 ──
    // fillHeight가 true면 앞면에 맞춘 높이(H)에서 남는 공간을 지도가 채운다 — 아래 문구/진행 바가
    // 차지하는 높이(footer)를 뺀 나머지를 지도에 준다. 높이를 재는 중에는 최소 높이로만 그린다.
    function drawBack(ctx, H, p, fillHeight) {
      var s = getState();
      var tier = tierOf(s, p);
      ctx.clearRect(0, 0, W, H);
      // 뒷면은 사진 팝업이 없으니 프레임을 캔버스 위쪽에 붙인다
      drawFrame(ctx, H, tier, 14);

      var visitedCount = PLACES.filter(function (pl) { return p.visited[pl.id]; }).length;
      ctx.font = '32px "Black Han Sans", sans-serif';
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(s.name + '의 다산동 발도장', W / 2, 66);
      ctx.font = '800 17px "Malgun Gothic", sans-serif';
      ctx.fillText(visitedCount + ' / ' + PLACES.length + ' 곳 방문', W / 2, 116);

      var footerH = s.tiersOn ? 124 : 70;
      var mx = 60, my = 160, mw = W - 120 - 10;
      var mh = fillHeight ? Math.max(MAP_MIN_H, H - 14 - 30 - footerH - my) : MAP_MIN_H;
      ctx.fillStyle = INK;
      ctx.fillRect(mx + 6, my + 6, mw, mh);
      ctx.save();
      ctx.beginPath();
      ctx.rect(mx, my, mw, mh);
      ctx.fillStyle = '#F4F1E6';
      ctx.fill();
      ctx.clip();

      var lats = PLACES.map(function (pl) { return pl.center[0]; });
      var lngs = PLACES.map(function (pl) { return pl.center[1]; });
      var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
      var minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
      var pad = 0.2;
      function project(c) {
        var fx = (c[1] - minLng) / ((maxLng - minLng) || 1);
        var fy = (maxLat - c[0]) / ((maxLat - minLat) || 1);
        return [mx + mw * (pad + fx * (1 - pad * 2)), my + mh * (pad + fy * (1 - pad * 2))];
      }

      // 장식용 도로 — 실제 도로망이 아니라 "지도 같은 느낌"을 내는 그림
      ctx.lineCap = 'butt';
      [[INK, 16], ['#FFFFFF', 10]].forEach(function (st) {
        ctx.strokeStyle = st[0];
        ctx.lineWidth = st[1];
        ctx.beginPath();
        ctx.moveTo(mx, my + mh * 0.58); ctx.lineTo(mx + mw, my + mh * 0.5);
        ctx.moveTo(mx + mw * 0.32, my); ctx.lineTo(mx + mw * 0.4, my + mh);
        ctx.stroke();
      });

      PLACES.forEach(function (pl) {
        var pt = project(pl.center);
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        if (pl.kind === 'park') {
          ctx.fillStyle = '#C8F06A';
          ctx.beginPath();
          ctx.ellipse(pt[0], pt[1], 110, 80, -0.2, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        } else if (pl.kind === 'water') {
          ctx.lineWidth = 44;
          ctx.strokeStyle = '#9ED3F0';
          ctx.beginPath();
          ctx.moveTo(pt[0] + 40, my - 20);
          ctx.quadraticCurveTo(pt[0] - 50, pt[1], pt[0] + 60, my + mh + 20);
          ctx.stroke();
          ctx.fillStyle = '#C8F06A';
          ctx.lineWidth = 3;
          ctx.strokeStyle = INK;
          ctx.beginPath();
          ctx.ellipse(pt[0] - 40, pt[1], 70, 90, 0, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        } else {
          ctx.fillStyle = '#FFD6EA';
          ctx.fillRect(pt[0] - 70, pt[1] - 44, 140, 88);
          ctx.strokeRect(pt[0] - 70, pt[1] - 44, 140, 88);
        }
      });

      PLACES.forEach(function (pl, i) {
        var pt = project(pl.center);
        var got = !!p.visited[pl.id];
        var r = 46;
        ctx.save();
        ctx.translate(pt[0], pt[1]);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (got) {
          // 찍힌 도장 — 빨간 이중 원 + "방문"
          ctx.rotate([-0.2, 0.15, -0.08][i % 3]);
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#E0281B';
          ctx.lineWidth = 6;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, r - 10, 0, Math.PI * 2); ctx.stroke();
          ctx.font = '26px "Black Han Sans", sans-serif';
          ctx.fillStyle = '#E0281B';
          ctx.fillText('방문', 0, 2);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
          ctx.setLineDash([8, 6]);
          ctx.strokeStyle = INK;
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = '34px "Black Han Sans", sans-serif';
          ctx.fillStyle = INK;
          ctx.fillText('?', 0, 2);
        }
        ctx.restore();

        // 장소 이름은 검정 띠 위 흰 글자로 — 지도 색 위에서도 읽히게
        ctx.font = '800 17px "Malgun Gothic", sans-serif';
        var tw = ctx.measureText(pl.name).width + 16;
        ctx.fillStyle = got ? INK : '#FFFFFF';
        ctx.fillRect(pt[0] - tw / 2, pt[1] + r + 8, tw, 26);
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK;
        ctx.strokeRect(pt[0] - tw / 2, pt[1] + r + 8, tw, 26);
        ctx.fillStyle = got ? '#F2B833' : INK;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pl.name, pt[0], pt[1] + r + 22);
      });
      ctx.restore();
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.strokeRect(mx + 2, my + 2, mw - 4, mh - 4);

      var y = my + mh + 30;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (s.tiersOn) {
        var nt = RR.nextTier(p.walks);
        var label = nt ? tier.name + ' 다음은 ' + nt.name + ' 테두리, 산책 ' + (nt.minWalks - p.walks) + '회 남음'
                       : '최고 등급 금 테두리 달성';
        ctx.font = '800 16px "Malgun Gothic", sans-serif';
        ctx.fillStyle = INK;
        ctx.fillText(label, W / 2, y);
        var bx = 90, bw = W - 180, by = y + 30, frac = 1;
        if (nt) frac = (p.walks - tier.minWalks) / (nt.minWalks - tier.minWalks);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(bx, by, bw, 18);
        ctx.fillStyle = '#FF6BB5';
        ctx.fillRect(bx, by, Math.max(18, bw * frac), 18);
        ctx.lineWidth = 3;
        ctx.strokeStyle = INK;
        ctx.strokeRect(bx, by, bw, 18);
        y = by + 34;
      }
      ctx.font = '13px "Malgun Gothic", sans-serif';
      ctx.fillStyle = SOFT;
      ctx.fillText('공용 장소 도장만 표시돼요 · 실제 산책 경로는 담기지 않아요', W / 2, y);
      ctx.textAlign = 'left';
      return y + 20;
    }

    // ── 렌더 ──
    var measureCanvas = document.createElement('canvas');
    measureCanvas.width = W;
    measureCanvas.height = 1600;

    // 앞/뒷면을 양면 아크릴로 뽑을 걸 고려해 두 면의 높이를 항상 같게 맞춘다
    function sharedHeight(p) {
      var mctx = measureCanvas.getContext('2d');
      var front = drawFront(mctx, measureCanvas.height, p);
      var back = drawBack(mctx, measureCanvas.height, p);
      return Math.ceil(Math.max(front, back)) + 30;
    }

    function drawSide(targetCanvas, which, p, H) {
      targetCanvas.width = W;
      targetCanvas.height = H;
      var c = targetCanvas.getContext('2d');
      if (which === 'front') drawFront(c, H, p); else drawBack(c, H, p, true);
    }

    // 앞/뒷면을 나란히 붙인 한 장(양면 출력·저장용)
    function drawBoth(p) {
      var H = sharedHeight(p);
      var gap = 40;
      var out = document.createElement('canvas');
      out.width = W * 2 + gap;
      out.height = H;
      var tmp = document.createElement('canvas');
      drawSide(tmp, 'front', p, H);
      out.getContext('2d').drawImage(tmp, 0, 0);
      drawSide(tmp, 'back', p, H);
      out.getContext('2d').drawImage(tmp, W + gap, 0);
      return out;
    }

    return { sharedHeight: sharedHeight, drawSide: drawSide, drawBoth: drawBoth };
  }

  window.RewardCard = {
    W: W,
    PHOTO_D: PHOTO_D,
    PHOTO_CX: PHOTO_CX,
    PHOTO_CY: PHOTO_CY,
    PHOTO_RECT: PHOTO_RECT,
    EMOJI: EMOJI,
    create: create
  };
})();
