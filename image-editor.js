// 한 화면 이미지 편집기(2026-11-16 가르시아 "적용해" — 시안 edit-proto.html을 공통으로). 전역 window.WalsonEditor.
// 왜: 영수증·월간 리포트·주민증처럼 이미지로 저장하는 화면이 여러 개인데, 미리 보기는 세로로 길고 고치는 도구는 스크롤 아래에 있었다.
// 원칙: 화면 높이에 딱 맞춘다(스크롤 없음) · 미리 보기가 남은 자리 전부(9:16도 한눈에) · 사진은 미리 보기에서 끌고 두 손가락으로 키운다 ·
//       아래 탭은 하나씩만 얇게 · 저장은 늘 오른쪽 위 · 글을 쓸 땐 자판 바로 위 입력 칸(미리 보기는 그 위에 그대로).
// 그림은 이 휴대폰 안에서만 그리고 어디로도 보내지 않는다(저장·공유는 save-image.js — 사용자가 고른 앱으로).
//
// WalsonEditor.open({
//   title: '산책 영수증',
//   formats: [['story', '스토리 9:16'], ['feed', '피드 4:5']], fmt: 'story',        // 둘 이상이면 [모양] 탭
//   photo: { sources: [['walk', '산책 사진'], ['logo', '왈슨 그림']], fixed: ['logo'],  // 있으면 [사진] 탭 + 미리 보기에서 끌기
//            src: 'walk', zoom: 1, x: 0.5, y: 0.4, home: { x: 0.5, y: 0.4 } },
//   tabs: [{ id, label, icon: 'note'|'side'|'month', rows: function (st) → [{ label, chips: [{ text, value, on, cls }] } | { tip }],
//            onPick: function (value, st, api) }                                    // 콘텐츠마다 다른 탭(칩 한두 줄)
//          | { id, label, icon, text: { title, hint, max, empty, font, presets: [{ text, value, group }],   // 큰 글 칸 탭(2026-11-16):
//              get: function (st) → 지금 글('' = 없음), set: function (st, 글, 고른 칩 value|null), fonts: function (글) → Promise } }],
//            미리 보기를 줄이더라도 글 칸을 크게, 고를 글은 옆으로 밀지 않고 줄바꿈해서 한눈에. 칩은 글 칸을 채우는 본보기(고쳐 써도 됨)
//            본보기에 group(묶음 이름)이 있으면 본보기 위에 묶음 탭을 두고 고른 묶음만 보여 준다(11/18 — 탭 순서는 본보기에 처음 나온 순서)
//          탭에 focus: function (st) → { x, y, w, h }(그림 픽셀)를 주면 그 탭에선 미리 보기를 그 부분으로 확대한다(예: 영수증 특이 사항 줄)
//   stickers: [{ text, nx, ny, s, style }],  stickers: false면 [글자 붙이기] 탭을 뺀다
//   draw: function (canvas, st) → 사진 칸 { x, y, w, h, img } 또는 null — 바탕 그림을 그린다(동기). 글자는 편집기가 위에 얹는다
//   hint, fileName: function (st), onSave: function (st, how) — 그림을 내보낼 때만: how 'save'(사진첩에 저장·내려받기)·'share'(공유 창),
//   onClose: function (st, kept) — kept: [저장]을 눌렀거나 그림을 내보냈으면 true, [×]로 버리고 나왔으면 false,
//   storeKey: 'walson_edit_…' — 주면 [저장]한 꾸미기(모양·사진 자리·붙인 글자, storeExtra에 적은 extra 칸)를 이 휴대폰에 남겨 다음에 이어서 연다
// })
// 2026-11-18 가르시아 "저장하면 진짜 폰으로 다운로드를 해 버리잖아. 공유 안에 있는 기능 아니냐? 저장은 내가 수정한 걸 저장하고 편집에서 빠져나오는 것":
//   오른쪽 위 [저장] = 고친 것을 앱에 남기고 닫기. 사진첩 저장·공유 창은 [공유]를 누르면 나오는 작은 메뉴 안에.  →  api { state, redraw(), rebuild(), prompt({ value, max, placeholder }) → Promise<글|null>, close() }
// st = { fmt, photo: { src, zoom, x, y }, stickers: [...], extra: (부른 쪽 마음대로) }
// WalsonEditor.drawStickers(canvas, stickers) — 저장해 둔 글자를 다른 미리 보기(예: [기록]의 작은 영수증)에 같은 모양으로 얹는다.
(function () {
  var STYLES = [['white', '흰 글씨', '#ffffff'], ['black', '검은 글씨', '#2b2420'], ['bubble', '말풍선', '#ffffff'], ['tag', '띠', '#b8563a']];
  var ICONS = {
    shape: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>',
    note: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    side: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M19 9v9a2 2 0 0 1-2 2H8"/>',
    month: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
  };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var SAVE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>';
  var SHARE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12"/></svg>';
  function svg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[k] || ICONS.note) + '</svg>'; }

  // ── 붙인 글자 그리기(편집기·다른 미리 보기 공통) — 위치는 그림 크기에 대한 비율(nx·ny)이라 모양을 바꿔도 같은 자리 ──
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawSticker(ctx, W, H, st, selected) {
    if (!st || !st.text) return null;
    var size = Math.round(W * 0.062 * (st.s || 1)), x = (st.nx == null ? 0.5 : st.nx) * W, y = (st.ny == null ? 0.4 : st.ny) * H;
    ctx.save();
    ctx.font = '800 ' + size + 'px Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var w = ctx.measureText(st.text).width, padX = size * 0.5, padY = size * 0.34;
    var bw = w + padX * 2, bh = size + padY * 2, x0 = x - bw / 2, y0 = y - bh / 2;
    if (st.style === 'bubble' || st.style === 'tag') {
      ctx.fillStyle = st.style === 'bubble' ? '#ffffff' : '#b8563a';
      ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = size * 0.35; ctx.shadowOffsetY = size * 0.08;
      roundRect(ctx, x0, y0, bw, bh, st.style === 'bubble' ? bh / 2 : size * 0.16); ctx.fill();
      if (st.style === 'bubble') { ctx.beginPath(); ctx.moveTo(x0 + bw * 0.22, y0 + bh - 2); ctx.lineTo(x0 + bw * 0.16, y0 + bh + size * 0.42); ctx.lineTo(x0 + bw * 0.36, y0 + bh - 2); ctx.closePath(); ctx.fill(); }
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = st.style === 'bubble' ? '#2b2420' : '#ffffff';
      ctx.fillText(st.text, x, y + size * 0.04);
    } else {
      ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.17;
      ctx.strokeStyle = st.style === 'black' ? 'rgba(255,255,255,.95)' : 'rgba(30,22,18,.72)';
      ctx.strokeText(st.text, x, y);
      ctx.fillStyle = st.style === 'black' ? '#2b2420' : '#ffffff';
      ctx.fillText(st.text, x, y);
    }
    if (selected) {   // 고른 글자 테두리 — 미리 보기에만
      ctx.setLineDash([size * 0.25, size * 0.18]); ctx.lineWidth = Math.max(3, size * 0.06); ctx.strokeStyle = '#e2774f';
      roundRect(ctx, x0 - size * 0.18, y0 - size * 0.18, bw + size * 0.36, bh + size * 0.36, size * 0.25); ctx.stroke();
    }
    ctx.restore();
    return { x: x0, y: y0, w: bw, h: bh };
  }
  function drawStickers(canvas, stickers) {
    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    (stickers || []).forEach(function (st) { drawSticker(ctx, canvas.width, canvas.height, st, false); });
  }

  // ── 모양(한 번만 넣음) ──
  var cssAdded = false;
  function addCss() {
    if (cssAdded) return; cssAdded = true;
    var c = document.createElement('style');
    c.textContent = [
      '.we{position:fixed;left:0;top:0;width:100vw;height:100vh;height:100dvh;z-index:5000;display:flex;flex-direction:column;background:#2b231e;color:#fbf4ea;font-family:Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;overscroll-behavior:none;-webkit-tap-highlight-color:transparent;}',
      '.we *{box-sizing:border-box;}',
      '.we button{font:inherit;color:inherit;}',
      '.we [hidden]{display:none!important;}',
      '.we-top{flex:none;display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top) + 8px) 10px 8px;}',
      '.we-x{width:40px;height:40px;border-radius:12px;border:none;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;}',
      '.we-x svg{width:22px;height:22px;}',
      '.we-title{flex:1;min-width:0;font-weight:800;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.we .we-save,.we .we-share{flex:none;display:flex;align-items:center;gap:5px;border-radius:999px;font-weight:800;font-size:15px;cursor:pointer;}',
      '.we .we-save{border:none;padding:10px 16px;background:#e2774f;color:#fff;}',
      '.we .we-share{border:1px solid rgba(255,255,255,.26);padding:9px 13px;background:transparent;color:#fbf4ea;}',
      '.we-save svg,.we-share svg{width:17px;height:17px;flex:none;}',
      '@media (max-width:359px){.we .we-share span{display:none;}.we .we-share{padding:9px 10px;}}',
      '.we-menu{position:absolute;right:10px;top:calc(env(safe-area-inset-top) + 56px);z-index:3;min-width:210px;background:#362c26;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:6px;box-shadow:0 10px 30px rgba(0,0,0,.45);}',
      '.we-menu button{display:flex;align-items:center;gap:10px;width:100%;border:none;background:transparent;border-radius:10px;padding:11px 12px;font-size:15px;font-weight:700;text-align:left;cursor:pointer;color:#fbf4ea;}',
      '.we-menu button:active,.we-menu button:hover{background:rgba(255,255,255,.08);}',
      '.we-menu svg{width:19px;height:19px;flex:none;}',
      '.we-menu small{display:block;font-size:11.5px;font-weight:500;color:#c9b9a6;margin-top:1px;}',
      '.we-stage{flex:1;min-height:0;position:relative;display:flex;align-items:center;justify-content:center;background:#1f1915;overflow:hidden;}',
      '.we-stage canvas{position:absolute;left:0;top:0;display:block;touch-action:none;border-radius:4px;box-shadow:0 6px 24px rgba(0,0,0,.45);}',
      '.we-stage.anim canvas{transition:left .22s ease,top .22s ease,width .22s ease,height .22s ease;}',
      '.we-zoomtag{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);white-space:nowrap;padding:5px 11px;border-radius:999px;background:rgba(0,0,0,.62);color:#fff;font-size:11.5px;font-weight:800;pointer-events:none;}',
      '.we-hint{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);max-width:calc(100% - 32px);padding:7px 13px;border-radius:999px;background:rgba(0,0,0,.62);color:#fff;font-size:12.5px;font-weight:700;line-height:1.35;text-align:center;pointer-events:none;transition:opacity .4s;}',
      '.we-hint.gone{opacity:0;}',
      '.we-tray{flex:none;min-height:96px;padding:12px 0 10px;background:#362c26;border-top:1px solid rgba(255,255,255,.1);}',
      '.we-row{display:flex;align-items:center;gap:8px;padding:0 14px;overflow-x:auto;scrollbar-width:none;}',
      '.we-row::-webkit-scrollbar{display:none;}',
      '.we-row+.we-row{margin-top:10px;}',
      '.we-label{flex:none;font-size:12px;font-weight:800;color:#c9b9a6;}',
      '.we-chip{flex:none;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);border-radius:999px;padding:9px 14px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;}',
      '.we-chip[aria-pressed="true"]{background:#fbf4ea;color:#2b231e;border-color:#fbf4ea;}',
      '.we-chip.accent{background:#e2774f;border-color:#e2774f;color:#fff;}',
      '.we-chip.ghost{background:transparent;}',
      '.we-chip:disabled{opacity:.35;cursor:default;}',
      '.we-chip .sw{display:inline-block;width:14px;height:14px;border-radius:4px;vertical-align:-2px;margin-right:6px;border:1px solid rgba(255,255,255,.35);}',
      '.we-range{flex:1;min-width:120px;accent-color:#e2774f;}',
      '.we-tip{padding:0 14px;margin:9px 0 0;font-size:12px;color:#c9b9a6;line-height:1.45;}',
      // 큰 글 칸 탭 — 도구 칸을 화면 절반쯤으로 키운다(미리 보기는 그만큼 작아짐). 글 쓰는 동안은 탭·칩을 숨기고 글 칸만 자판 위에
      '.we-tray.tall{height:50%;max-height:470px;min-height:0;display:flex;flex-direction:column;padding:12px 0 0;}',
      '.we.we-typing .we-tabs{display:none;}',
      '.we.we-typing .we-tray.tall{height:auto;padding-bottom:10px;}',
      '.we.we-typing .we-tray .we-grid-wrap,.we.we-typing .we-phead{display:none;}',
      '.we-phead{flex:none;display:flex;align-items:baseline;gap:8px;padding:0 14px 8px;}',
      '.we-phead b{font-size:15px;font-weight:800;}',
      '.we-phead span{font-size:12px;color:#c9b9a6;line-height:1.4;}',
      '.we-paper{flex:none;position:relative;margin:0 14px;background:#fffaf3;border-radius:6px;padding:12px 44px 12px 14px;box-shadow:inset 0 2px 0 rgba(0,0,0,.06);}',
      '.we-paper::before,.we-paper::after{content:"";position:absolute;left:10px;right:10px;border-top:2px dashed #d9c7b1;}',
      '.we-paper::before{top:5px;}.we-paper::after{bottom:5px;}',
      '.we-paper textarea{display:block;width:100%;border:none;outline:none;resize:none;background:transparent;color:#2b2420;font-size:18px;font-weight:700;line-height:1.45;padding:0;min-height:52px;word-break:keep-all;overflow-wrap:anywhere;}',
      '.we-paper textarea::placeholder{color:#a8977f;}',
      '.we-paper .we-clear{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:none;border-radius:50%;background:rgba(43,36,32,.08);color:#5b4d42;font-size:16px;line-height:1;cursor:pointer;}',
      '.we-pmeta{flex:none;display:flex;align-items:center;gap:8px;padding:7px 14px 0;font-size:11.5px;color:#c9b9a6;}',
      '.we-pmeta .we-chip{margin-left:auto;padding:7px 16px;font-size:13.5px;}',
      '.we-grid-wrap{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;margin-top:10px;padding:2px 0 12px;border-top:1px solid rgba(255,255,255,.08);}',
      '.we-grid-wrap .we-label{display:block;padding:10px 14px 8px;}',
      '.we-grid{display:flex;flex-wrap:wrap;gap:7px;padding:0 14px;}',
      '.we-gtabs{display:flex;gap:3px;margin:0 14px 10px;padding:3px;border-radius:12px;background:rgba(255,255,255,.07);overflow-x:auto;scrollbar-width:none;}',
      '.we-gtabs::-webkit-scrollbar{display:none;}',
      '.we-gtab{flex:1 0 auto;min-height:34px;padding:0 10px;border:none;border-radius:9px;background:transparent;color:#c9b9a6;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;}',
      '.we-gtab[aria-pressed="true"]{background:#fbf4ea;color:#2b231e;}',
      '.we-grid .we-chip{white-space:normal;text-align:left;max-width:100%;padding:8px 12px;font-size:13.5px;line-height:1.35;}',
      '@media (max-width:370px){.we-grid{gap:6px;}.we-grid .we-chip{padding:7px 11px;font-size:13px;}.we-paper textarea{font-size:17px;}}',
      '.we-tabs{flex:none;display:flex;background:#2b231e;border-top:1px solid rgba(255,255,255,.1);padding-bottom:env(safe-area-inset-bottom);}',
      '.we-tab{flex:1;border:none;background:transparent;padding:8px 0 9px;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11.5px;font-weight:700;color:#c9b9a6;cursor:pointer;}',
      '.we-tab svg{width:22px;height:22px;}',
      '.we-tab[aria-selected="true"]{color:#fbf4ea;}',
      '.we-tab[aria-selected="true"] svg{color:#e2774f;}',
      '.we-sheet{position:fixed;left:0;right:0;bottom:0;z-index:5001;background:#362c26;border-top:1px solid rgba(255,255,255,.1);padding:10px 12px calc(env(safe-area-inset-bottom) + 10px);font-family:Pretendard,-apple-system,sans-serif;color:#fbf4ea;}',
      '.we-sheet-in{display:flex;gap:8px;align-items:center;}',
      '.we-sheet input{flex:1;min-width:0;font:inherit;font-size:16px;padding:11px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#1f1915;color:#fbf4ea;}',
      '.we-sheet .we-chip{font-family:inherit;}',
      '.we-count{font-size:11px;color:#c9b9a6;margin:6px 2px 0;}'
    ].join('\n');
    document.head.appendChild(c);
  }

  // [저장]한 꾸미기를 이 휴대폰에 — storeKey를 준 화면만(영수증은 산책마다 따로 남겨서 쓰지 않음)
  function loadKept(key) { if (!key) return null; try { return JSON.parse(localStorage.getItem(key)) || null; } catch (e) { return null; } }
  function open(cfg) {
    addCss();
    var fmts = cfg.formats || [];
    var P = cfg.photo || null;
    var st = {
      fmt: cfg.fmt || (fmts[0] && fmts[0][0]) || '',
      photo: P ? { src: P.src, zoom: P.zoom || 1, x: P.x != null ? P.x : 0.5, y: P.y != null ? P.y : 0.4 } : null,
      stickers: (cfg.stickers || []).map(function (s) { return { text: s.text, nx: s.nx, ny: s.ny, s: s.s || 1, style: s.style || 'white' }; }),
      extra: cfg.extra || {}
    };
    var kept0 = loadKept(cfg.storeKey);
    if (kept0) {
      if (kept0.fmt && fmts.some(function (f) { return f[0] === kept0.fmt; })) st.fmt = kept0.fmt;
      if (kept0.photo && st.photo && P.sources && P.sources.some(function (x) { return x[0] === kept0.photo.src; })) {
        st.photo = { src: kept0.photo.src, zoom: kept0.photo.zoom || 1, x: kept0.photo.x, y: kept0.photo.y };
      }
      if (Array.isArray(kept0.stickers) && cfg.stickers !== false) st.stickers = kept0.stickers;
      (cfg.storeExtra || []).forEach(function (k) { if (kept0.extra && kept0.extra[k] !== undefined) st.extra[k] = kept0.extra[k]; });
    }
    function snapshot() { try { return JSON.stringify([st.fmt, st.photo, st.stickers, st.extra]); } catch (e) { return ''; } }
    var opened = snapshot(), kept = false;
    var allowText = cfg.stickers !== false;
    var tabs = [];
    if (fmts.length > 1) tabs.push({ id: 'shape', label: '모양', icon: 'shape' });
    (cfg.tabs || []).forEach(function (t) { if (t.first) tabs.push(t); });
    if (P) tabs.push({ id: 'photo', label: '사진', icon: 'photo' });
    (cfg.tabs || []).forEach(function (t) { if (!t.first) tabs.push(t); });
    if (allowText) tabs.push({ id: 'text', label: '글자 붙이기', icon: 'text' });
    var tab = cfg.tab || (P ? 'photo' : tabs[0] && tabs[0].id);
    var sel = -1, style = 'white', band = null, boxes = [];

    // ── 화면 ──
    var root = document.createElement('div');
    root.className = 'we';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', (cfg.title || '이미지') + ' 꾸미기');
    root.innerHTML =
      '<div class="we-top"><button type="button" class="we-x" aria-label="닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<div class="we-title"></div>' +
        '<button type="button" class="we-share" aria-label="공유·사진첩에 저장" aria-haspopup="menu" aria-expanded="false">' + SHARE_SVG + '<span>공유</span></button>' +
        '<button type="button" class="we-save" aria-label="저장하고 닫기">' + CHECK_SVG + '<span>저장</span></button></div>' +
      '<div class="we-menu" role="menu" hidden>' +
        '<button type="button" role="menuitem" data-out="share" hidden>' + SHARE_SVG + '<span>공유하기<small>카톡·인스타 등으로 보내기</small></span></button>' +
        '<button type="button" role="menuitem" data-out="save">' + SAVE_SVG + '<span>사진첩에 저장<small>이 휴대폰에 그림 파일로</small></span></button>' +
      '</div>' +
      '<div class="we-stage"><canvas role="img" aria-label="미리 보기"></canvas><div class="we-hint"></div><div class="we-zoomtag" hidden></div></div>' +
      '<div class="we-tray"></div><div class="we-tabs" role="tablist"></div>';
    var sheet = document.createElement('div');
    sheet.className = 'we-sheet'; sheet.hidden = true;
    sheet.innerHTML = '<div class="we-sheet-in"><input type="text" autocomplete="off" enterkeyhint="done"><button type="button" class="we-chip accent">완료</button></div><p class="we-count"></p>';
    document.body.appendChild(root); document.body.appendChild(sheet);
    var q = function (s) { return root.querySelector(s); };
    var cv = q('canvas'), ctx = cv.getContext('2d'), stage = q('.we-stage'), tray = q('.we-tray'), tabsEl = q('.we-tabs'), hint = q('.we-hint'), zoomTag = q('.we-zoomtag');
    var input = sheet.querySelector('input');
    q('.we-title').textContent = cfg.title || '꾸미기';
    // [공유] 메뉴의 '공유하기'는 공유 창을 열 수 있는 브라우저에서만(대부분의 PC·일부 앱 안 브라우저는 '사진첩에 저장'만)
    q('.we-menu [data-out="share"]').hidden = !(window.WalsonSave && WalsonSave.canShare && WalsonSave.canShare());
    hint.textContent = cfg.hint || (P ? '사진은 끌어서 옮기고, 두 손가락으로 키워요' : '글자 붙이기로 한마디 얹어 보세요');
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // ── 그리기 ──
    function render(forSave) {
      band = cfg.draw(cv, st) || null;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      boxes = st.stickers.map(function (s, i) { return drawSticker(ctx, cv.width, cv.height, s, !forSave && i === sel); });
      fit();
    }
    var raf = 0;
    function schedule() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; render(false); }); }
    function fit() {
      var pad = 14, sw = stage.clientWidth, sh = stage.clientHeight, aw = sw - pad * 2, ah = sh - pad * 2;
      if (aw <= 0 || ah <= 0) return;
      var k = Math.min(aw / cv.width, ah / cv.height), left, top, Z = null;
      var T = tabOf(tab);
      if (T && T.focus) { try { Z = T.focus(st); } catch (e) { Z = null; } }
      // 폭에 맞춰 키운다(자판이 올라와 미리 보기가 아주 낮아져도 글자 크기는 그대로 — 그 줄만 가운데 보이면 된다)
      var kz = Z && Z.w > 0 ? Math.min((sw - 8) / Z.w, sh > 220 ? ah / Math.max(1, Z.h) : Infinity) : 0;
      if (Z && kz > k * 1.15) {
        // 확대: 그 부분이 가운데 오게, 그림 밖(빈 곳)은 되도록 안 보이게
        k = kz;
        var cw = cv.width * k, ch = cv.height * k;
        left = sw / 2 - (Z.x + Z.w / 2) * k; top = sh / 2 - (Z.y + Z.h / 2) * k;
        left = cw > sw ? clamp(left, sw - cw, 0) : (sw - cw) / 2;
        top = ch > sh ? clamp(top, sh - ch, 0) : (sh - ch) / 2;
        zoomTag.textContent = (T.focusLabel || '크게 보기') + ' · 저장은 전체 그대로'; zoomTag.hidden = sh < 150;   // 아주 낮으면 글을 가리니 숨김
      } else {
        left = (sw - Math.floor(cv.width * k)) / 2; top = (sh - Math.floor(cv.height * k)) / 2;
        zoomTag.hidden = true;
      }
      cv.style.width = Math.floor(cv.width * k) + 'px'; cv.style.height = Math.floor(cv.height * k) + 'px';
      cv.style.left = Math.round(left) + 'px'; cv.style.top = Math.round(top) + 'px';
      if (!fitted) { fitted = true; requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.add('anim'); }); }); }
    }
    var fitted = false;
    function tabOf(id) { for (var i = 0; i < tabs.length; i++) if (tabs[i].id === id) return tabs[i]; return null; }
    var ro = window.ResizeObserver ? new ResizeObserver(function () { fit(); }) : null;
    if (ro) ro.observe(stage);
    // 자판이 올라오면 보이는 영역에 맞춘다(아이폰은 화면 바닥 고정 칸이 자판에 가려서 직접 옮긴다)
    function fitViewport() {
      var vv = window.visualViewport, h = vv ? vv.height : window.innerHeight;
      root.style.height = h + 'px';
      root.style.top = (vv ? vv.offsetTop : 0) + 'px';
      sheet.style.bottom = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + 'px' : '0px';
      fit();
    }
    if (window.visualViewport) { visualViewport.addEventListener('resize', fitViewport); visualViewport.addEventListener('scroll', fitViewport); }
    window.addEventListener('resize', fitViewport);

    // ── 손으로 바로 고치기 ──
    var ptrs = {}, gesture = null, lastTap = 0;
    function toCanvas(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }
    function hitSticker(p) { var m = cv.width * 0.02; for (var i = boxes.length - 1; i >= 0; i--) { var b = boxes[i]; if (b && p.x >= b.x - m && p.x <= b.x + b.w + m && p.y >= b.y - m && p.y <= b.y + b.h + m) return i; } return -1; }
    function movable() { return P && band && band.img && (P.fixed || []).indexOf(st.photo.src) < 0; }
    function inBand(p) { return movable() && p.x >= band.x && p.x <= band.x + band.w && p.y >= band.y && p.y <= band.y + band.h; }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function hideHint() { hint.classList.add('gone'); }
    function home() { var h = (P && P.home) || {}; st.photo.zoom = 1; st.photo.x = h.x != null ? h.x : 0.5; st.photo.y = h.y != null ? h.y : 0.4; }
    cv.addEventListener('pointerdown', function (e) {
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
      ptrs[e.pointerId] = toCanvas(e);
      var ids = Object.keys(ptrs);
      if (ids.length === 1) {
        var p = ptrs[ids[0]], i = hitSticker(p);
        if (i >= 0) { var was = sel === i; sel = i; gesture = { kind: 'sticker', i: i, last: p, start: p, t: Date.now(), was: was }; if (tab !== 'text') openTab('text'); else buildTray(); }
        else if (inBand(p)) { gesture = { kind: 'photo', last: p, start: p, t: Date.now() }; if (sel >= 0) { sel = -1; buildTray(); } }
        else { gesture = null; if (sel >= 0) { sel = -1; buildTray(); } }
        schedule();
      } else if (ids.length === 2 && gesture) {
        gesture.pinch = { d0: dist(ptrs[ids[0]], ptrs[ids[1]]), v0: gesture.kind === 'sticker' ? st.stickers[gesture.i].s : st.photo.zoom };
      }
      hideHint();
    });
    cv.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId] || !gesture) return;
      var p = toCanvas(e); ptrs[e.pointerId] = p;
      var ids = Object.keys(ptrs);
      if (ids.length >= 2 && gesture.pinch) {
        var r = dist(ptrs[ids[0]], ptrs[ids[1]]) / Math.max(1, gesture.pinch.d0);
        if (gesture.kind === 'sticker') st.stickers[gesture.i].s = clamp(gesture.pinch.v0 * r, 0.4, 3.2);
        else { st.photo.zoom = clamp(gesture.pinch.v0 * r, 1, 4); syncZoom(); }
        schedule(); return;
      }
      if (ids.length !== 1) return;
      var dx = p.x - gesture.last.x, dy = p.y - gesture.last.y; gesture.last = p;
      if (gesture.kind === 'sticker') {
        var s = st.stickers[gesture.i];
        s.nx = clamp(s.nx + dx / cv.width, 0, 1); s.ny = clamp(s.ny + dy / cv.height, 0, 1);
      } else if (gesture.kind === 'photo' && band && band.img) {
        var k = Math.max(band.w / band.img.width, band.h / band.img.height) * st.photo.zoom, pw = band.img.width * k, ph = band.img.height * k;
        if (pw - band.w > 1) st.photo.x = clamp(st.photo.x - dx / (pw - band.w), 0, 1);
        if (ph - band.h > 1) st.photo.y = clamp(st.photo.y - dy / (ph - band.h), 0, 1);
      }
      schedule();
    });
    function endPtr(e) {
      var p = ptrs[e.pointerId]; delete ptrs[e.pointerId];
      if (!gesture || !p) return;
      var ids = Object.keys(ptrs);
      if (ids.length) { gesture.pinch = null; gesture.last = ptrs[ids[0]]; return; }
      var tap = dist(p, gesture.start) < cv.width * 0.012 && Date.now() - gesture.t < 350;
      if (tap && gesture.kind === 'sticker' && gesture.was) editSticker();   // 고른 글자를 한 번 더 누르면 고치기
      if (tap && gesture.kind === 'photo') { if (Date.now() - lastTap < 320) { home(); syncZoom(); schedule(); } lastTap = Date.now(); }   // 두 번 톡 = 처음대로
      gesture = null;
    }
    cv.addEventListener('pointerup', endPtr);
    cv.addEventListener('pointercancel', endPtr);
    cv.addEventListener('wheel', function (e) { if (!movable()) return; e.preventDefault(); st.photo.zoom = clamp(st.photo.zoom * (e.deltaY < 0 ? 1.08 : 0.93), 1, 4); syncZoom(); schedule(); }, { passive: false });

    // ── 탭과 도구 칸 ──
    function openTab(k) { tab = k; buildTabs(); buildTray(); fit(); }
    function buildTabs() {
      tabsEl.innerHTML = tabs.map(function (t) { return '<button type="button" class="we-tab" role="tab" data-k="' + t.id + '" aria-selected="' + (tab === t.id) + '">' + svg(t.icon) + esc(t.label) + '</button>'; }).join('');
      Array.prototype.forEach.call(tabsEl.children, function (b) { b.addEventListener('click', function () { openTab(b.getAttribute('data-k')); }); });
    }
    function chip(text, on, value, cls, disabled, raw) {
      return '<button type="button" class="we-chip' + (cls ? ' ' + cls : '') + '"' + (on != null ? ' aria-pressed="' + !!on + '"' : '') + ' data-v="' + esc(value) + '"' + (disabled ? ' disabled' : '') + '>' + (raw ? text : esc(text)) + '</button>';
    }
    function rowsHtml(rows) {
      return rows.map(function (r) {
        if (r.tip) return '<p class="we-tip">' + esc(r.tip) + '</p>';
        return '<div class="we-row">' + (r.label ? '<span class="we-label">' + esc(r.label) + '</span>' : '') +
          (r.chips || []).map(function (c) { return chip(c.text, c.on, c.value, c.cls, c.disabled); }).join('') + '</div>';
      }).join('');
    }
    function syncZoom() { var r = tray.querySelector('.we-range'); if (r && st.photo) r.value = Math.round(st.photo.zoom * 100); }
    function custom() { for (var i = 0; i < tabs.length; i++) if (tabs[i].id === tab && tabs[i].rows) return tabs[i]; return null; }
    function textTab() { for (var i = 0; i < tabs.length; i++) if (tabs[i].id === tab && tabs[i].text) return tabs[i].text; return null; }
    function buildTray() {
      var h = '', T = custom(), X = textTab();
      tray.classList.toggle('tall', !!X);
      if (!X) typing(false);
      if (X) { hideHint(); buildText(X); fit(); return; }
      if (tab === 'shape') {
        h = '<div class="we-row"><span class="we-label">모양</span>' + fmts.map(function (f) { return chip(f[1], st.fmt === f[0], 'fmt:' + f[0]); }).join('') + '</div>' +
          '<p class="we-tip">올릴 곳에 맞춰 골라요 — 스토리는 세로로 길게, 피드·정사각형은 게시물용이에요.</p>';
      } else if (tab === 'photo' && P) {
        h = '<div class="we-row"><span class="we-label">사진</span>' + P.sources.map(function (s) { return chip(s[1], st.photo.src === s[0], 'src:' + s[0]); }).join('') + '</div>' +
          (!movable() ? '<p class="we-tip">' + esc((P.fixed || []).indexOf(st.photo.src) >= 0 ? '이 그림은 옮기거나 키울 수 없어요.' : !band ? (P.noBand || '이 그림은 옮기거나 키울 수 없어요.') : '사진이 없어서 앱 그림이 들어가요.') + '</p>' :
          '<div class="we-row"><span class="we-label">크기</span><input type="range" class="we-range" min="100" max="400" value="' + Math.round(st.photo.zoom * 100) + '" aria-label="사진 크기">' +
            chip('처음대로', null, 'home', 'ghost') + '</div>');
      } else if (tab === 'text') {
        var s = sel >= 0 ? st.stickers[sel] : null, cur = s ? s.style : style;
        h = '<div class="we-row">' + chip('＋ 글자 넣기', null, 'add', 'accent') + (s ? chip('글자 고치기', null, 'edit', 'ghost') + chip('지우기', null, 'del', 'ghost') : '') + '</div>' +
          '<div class="we-row"><span class="we-label">모양</span>' + STYLES.map(function (x) { return chip('<span class="sw" style="background:' + x[2] + '"></span>' + x[1], cur === x[0], 'style:' + x[0], '', false, true); }).join('') + '</div>' +
          '<p class="we-tip">' + (st.stickers.length ? '글자는 끌어서 옮기고 두 손가락으로 키워요. 고른 글자를 한 번 더 누르면 고쳐요.' : '사진 위에 한마디 얹어 보세요. 넣은 뒤 끌어서 자리를 잡아요.') + '</p>';
      } else if (T) h = rowsHtml(T.rows(st));
      tray.innerHTML = h;
      Array.prototype.forEach.call(tray.querySelectorAll('.we-chip'), function (b) { b.addEventListener('click', function () { onChip(b.getAttribute('data-v')); }); });
      var z = tray.querySelector('.we-range');
      if (z) z.addEventListener('input', function () { st.photo.zoom = z.value / 100; hideHint(); schedule(); });
    }
    function onChip(v) {
      var T = custom();
      if (T) { T.onPick(v, st, api); render(false); buildTray(); return; }
      if (v.indexOf('fmt:') === 0) st.fmt = v.slice(4);
      else if (v.indexOf('src:') === 0) { st.photo.src = v.slice(4); }
      else if (v === 'home') home();
      else if (v === 'add') { prompt({ max: 18, placeholder: '사진 위에 얹을 한마디 (18자까지)' }).then(function (t) {
        if (!t) return;
        var ny = band ? (band.y + band.h * 0.5) / cv.height : 0.35;
        st.stickers.push({ text: t, nx: 0.5, ny: clamp(ny, 0.08, 0.92), s: 1, style: style }); sel = st.stickers.length - 1; buildTray(); schedule();
      }); return; }
      else if (v === 'edit') { editSticker(); return; }
      else if (v === 'del' && sel >= 0) { st.stickers.splice(sel, 1); sel = -1; }
      else if (v.indexOf('style:') === 0) { style = v.slice(6); if (sel >= 0) st.stickers[sel].style = style; }
      render(false); buildTray();   // 먼저 그려야 사진 칸(옮길 수 있는지)이 새로 정해진다
    }
    function editSticker() {
      if (sel < 0) return;
      var i = sel, before = st.stickers[i].text;
      prompt({ value: before, max: 18, placeholder: '사진 위에 얹을 한마디 (18자까지)', live: function (t) { st.stickers[i].text = t || before; schedule(); } })
        .then(function (t) { st.stickers[i].text = t || before; buildTray(); schedule(); });
    }

    // ── 큰 글 칸(예: 영수증 특이 사항) — 칩은 글 칸을 채우는 본보기, 고쳐 쓰면 그 글이 그대로 들어간다 ──
    function typing(on) {
      if (root.classList.contains('we-typing') === !!on) return;
      root.classList.toggle('we-typing', !!on);
      setTimeout(fitViewport, 0);
    }
    function buildText(X) {
      var max = X.max || 28, presets = X.presets || [];
      // 본보기 묶음(11/18 가르시아 "그것도 나눠줘") — 처음엔 지금 글이 든 묶음, 아니면 첫 묶음
      var groups = [], curGroup = null, now0 = String(X.get(st) || '').trim();
      presets.forEach(function (p) { if (p.group && groups.indexOf(p.group) < 0) groups.push(p.group); });
      presets.forEach(function (p) { if (!curGroup && p.group && p.text === now0) curGroup = p.group; });
      if (groups.length && !curGroup) curGroup = groups[0];
      function chipsHtml() {
        return presets.map(function (p, k) { return groups.length && p.group !== curGroup ? '' : chip(p.text, false, 'p' + k); }).join('') +
          (X.empty ? chip(X.empty, false, 'empty', 'ghost') : '');
      }
      var gtabsHtml = groups.length ? '<div class="we-gtabs" role="group" aria-label="본보기 묶음">' + groups.map(function (g) {
        return '<button type="button" class="we-gtab" aria-pressed="' + (g === curGroup) + '" data-g="' + esc(g) + '">' + esc(g) + '</button>';
      }).join('') + '</div>' : '';
      tray.innerHTML =
        '<div class="we-phead"><b>' + esc(X.title || '') + '</b><span>' + esc(X.hint || '') + '</span></div>' +
        '<div class="we-paper"><textarea rows="2" maxlength="' + max + '" enterkeyhint="done" autocomplete="off" spellcheck="false" aria-label="' + esc(X.title || '글') + ' 쓰기"' +
          (X.font ? ' style="font-family:' + esc(X.font) + '"' : '') + ' placeholder="' + esc(X.empty || '') + '"></textarea>' +
          '<button type="button" class="we-clear" aria-label="지우고 직접 쓰기">✕</button></div>' +
        '<div class="we-pmeta"><span class="we-pcount"></span><button type="button" class="we-chip accent we-done" hidden>완료</button></div>' +
        '<div class="we-grid-wrap"><span class="we-label">골라서 넣기 · 넣은 뒤 고쳐 써도 돼요</span>' + gtabsHtml + '<div class="we-grid">' + chipsHtml() + '</div></div>';
      var ta = tray.querySelector('textarea'), done = tray.querySelector('.we-done'), cnt = tray.querySelector('.we-pcount');
      ta.value = X.get(st) || '';
      function sync() {
        var t = ta.value.trim();
        Array.prototype.forEach.call(tray.querySelectorAll('.we-grid .we-chip'), function (b) {
          var v = b.getAttribute('data-v'), on = v === 'empty' ? !t : presets[+v.slice(1)].text === t;
          b.setAttribute('aria-pressed', String(on));
        });
        cnt.textContent = ta.value.length + ' / ' + max + '자 · 이 휴대폰 안에서만 그려요';
      }
      function apply(t, value) {
        X.set(st, t, value == null ? null : value);
        sync(); schedule();
        if (X.fonts && t) X.fonts(t).then(schedule);
      }
      ta.addEventListener('input', function () {
        if (/[\r\n]/.test(ta.value)) ta.value = ta.value.replace(/[\r\n]+/g, ' ');   // 붙여 넣은 줄바꿈은 띄어쓰기로
        var t = ta.value.trim(), m = null;
        for (var k = 0; k < presets.length; k++) if (presets[k].text === t) m = presets[k].value;
        apply(t, m);
      });
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ta.blur(); } });
      // 휴대폰에서 글 쓰는 동안은 자판 자리를 만들려고 탭·칩을 숨긴다. 자판을 닫을 땐 조금 기다렸다가 되돌린다
      // (바로 되돌리면 칸이 움직여서, 누르던 [완료] 자리에 칩이 와서 눌릴 수 있다)
      var blurT = 0, coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
      ta.addEventListener('focus', function () { clearTimeout(blurT); done.hidden = false; if (coarse) typing(true); hideHint(); });
      ta.addEventListener('blur', function () {
        clearTimeout(blurT);
        blurT = setTimeout(function () { if (document.activeElement === ta) return; done.hidden = true; typing(false); }, 250);
      });
      done.addEventListener('click', function () { ta.blur(); });
      var clr = tray.querySelector('.we-clear');
      clr.addEventListener('mousedown', function (e) { e.preventDefault(); });   // 지울 때 자판이 닫혔다 열리지 않게
      clr.addEventListener('click', function () { ta.value = ''; apply('', null); ta.focus(); });
      function bindChips() {
        Array.prototype.forEach.call(tray.querySelectorAll('.we-grid .we-chip'), function (b) {
          b.addEventListener('click', function () {
            var v = b.getAttribute('data-v');
            if (v === 'empty') { ta.value = ''; apply('', null); return; }
            var p = presets[+v.slice(1)];
            ta.value = p.text; apply(p.text, p.value);
          });
        });
      }
      bindChips();
      // 묶음 탭 — 본보기만 바꿔 보여 준다(글 칸은 그대로)
      Array.prototype.forEach.call(tray.querySelectorAll('.we-gtab'), function (b) {
        b.addEventListener('click', function () {
          curGroup = b.getAttribute('data-g');
          Array.prototype.forEach.call(tray.querySelectorAll('.we-gtab'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          tray.querySelector('.we-grid').innerHTML = chipsHtml();
          bindChips(); sync();
        });
      });
      sync();
    }

    // ── 글 쓰기 칸(자판 바로 위) ──
    var pending = null;
    function prompt(o) {
      o = o || {};
      if (pending) pending.resolve(null);
      return new Promise(function (resolve) {
        pending = { resolve: resolve, live: o.live };
        input.maxLength = o.max || 28; input.value = o.value || ''; input.placeholder = o.placeholder || '';
        sheet.hidden = false; tray.style.visibility = 'hidden';
        count(); fitViewport();
        setTimeout(function () { input.focus(); }, 30);
      });
    }
    function count() { sheet.querySelector('.we-count').textContent = input.value.length + ' / ' + input.maxLength + '자 · 이 휴대폰 안에서만 그려요'; }
    function finish(ok) {
      if (!pending) return;
      var p = pending; pending = null;
      var v = input.value.trim();
      input.blur(); sheet.hidden = true; tray.style.visibility = '';
      p.resolve(ok ? v : null);
    }
    input.addEventListener('input', function () { count(); if (pending && pending.live) pending.live(input.value.trim()); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); finish(true); } });
    sheet.querySelector('.we-chip').addEventListener('click', function () { finish(true); });

    // ── 저장·닫기 ──
    var closed = false, pushed = false;
    function cleanup() {
      if (closed) return; closed = true;
      if (pending) finish(false);
      if (ro) ro.disconnect();
      if (window.visualViewport) { visualViewport.removeEventListener('resize', fitViewport); visualViewport.removeEventListener('scroll', fitViewport); }
      window.removeEventListener('resize', fitViewport);
      window.removeEventListener('popstate', onPop);
      root.remove(); sheet.remove();
      document.body.style.overflow = prevOverflow;
      if (cfg.onClose) cfg.onClose(st, kept);
    }
    function close() { if (pushed) { pushed = false; history.back(); } else cleanup(); }   // 뒤로 가기(popstate)가 cleanup을 부른다
    function onPop() {
      // 안드로이드 뒤로 가기도 [×]처럼 — 저장 안 한 고침이 있으면 묻고, 남겠다면 편집기 그대로
      if (!kept && snapshot() !== opened && !confirm('고친 내용을 저장하지 않고 나갈까요?')) {
        try { history.pushState({ walsonEditor: 1 }, ''); } catch (e) { /* 못 막으면 닫힘 */ }
        return;
      }
      pushed = false; cleanup();
    }
    // [×]·뒤로 가기: 고친 게 있는데 [저장]도 내보내기도 안 했으면 한 번 묻는다(아니요면 편집기에 그대로)
    function askClose() {
      if (!kept && snapshot() !== opened && !confirm('고친 내용을 저장하지 않고 나갈까요?')) return;
      close();
    }
    // 고친 것 남기기 — 부른 화면은 onClose(st, true)로, storeKey가 있으면 여기서 이 휴대폰에
    function keep() {
      kept = true;
      if (!cfg.storeKey) return;
      var extra = {};
      (cfg.storeExtra || []).forEach(function (k) { extra[k] = st.extra[k]; });
      try { localStorage.setItem(cfg.storeKey, JSON.stringify({ fmt: st.fmt, photo: st.photo, stickers: st.stickers, extra: extra })); } catch (e) { /* 못 남겨도 이번 그림은 그대로 */ }
    }
    // 안드로이드 뒤로 가기·브라우저 뒤로 = 편집기 닫기(앞 화면을 떠나지 않게)
    try { history.pushState({ walsonEditor: 1 }, ''); pushed = true; window.addEventListener('popstate', onPop); } catch (e) { pushed = false; }
    q('.we-x').addEventListener('click', askClose);
    // 사진첩 저장(내려받기)과 공유(카톡·인스타 등 공유 창) — 둘 다 [공유] 메뉴 안(11/16 "저장과 공유는 분리", 11/18 "저장은 고친 걸 남기고 빠져나오기")
    function output(how) {
      keep();
      if (pending) finish(true);
      if (document.activeElement && root.contains(document.activeElement) && document.activeElement.blur) document.activeElement.blur();
      sel = -1; render(true);   // 고른 글자 테두리 없이
      var name = cfg.fileName ? cfg.fileName(st) : 'walson.png';
      if (cfg.onSave) cfg.onSave(st, how);
      if (window.WalsonSave) {
        if (how === 'share' && WalsonSave.share) WalsonSave.share(cv, name);
        else if (WalsonSave.save) WalsonSave.save(cv, name);
        else WalsonSave.canvas(cv, name);
      }
      buildTray(); setTimeout(function () { schedule(); }, 300);
    }
    var menu = q('.we-menu'), shareBtn = q('.we-share');
    function toggleMenu(on) { menu.hidden = !on; shareBtn.setAttribute('aria-expanded', on ? 'true' : 'false'); }
    shareBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(menu.hidden); });
    Array.prototype.forEach.call(menu.querySelectorAll('[data-out]'), function (b) {
      b.addEventListener('click', function () { toggleMenu(false); output(b.getAttribute('data-out')); });
    });
    root.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) toggleMenu(false); });
    // [저장] = 고친 것을 남기고 편집기에서 나온다(폰으로 내려받지 않음)
    q('.we-save').addEventListener('click', function () {
      if (pending) finish(true);
      keep();
      close();
    });

    var api = {
      state: st,
      redraw: schedule,
      rebuild: function () { buildTabs(); buildTray(); },
      prompt: prompt,
      close: close,
      canvas: cv
    };
    render(false); buildTabs(); buildTray(); fitViewport();
    return api;
  }

  window.WalsonEditor = { open: open, drawStickers: drawStickers, STYLES: STYLES };
})();
