// 사진 속 강아지만 도트로(2026-11-22 가르시아가 보여 준 참고 그림 두 장: 진짜 사진 위에 강아지만 도트 + 굵은 검은 칸 테두리,
// 배경은 사진 그대로 또는 흐리게). 손으로 그린 캐릭터(dog-pixel.js)와 달리 우리 강아지 모습(털 무늬·자세)이 그대로 남는다.
// 1) 강아지 자리 찾기: 배경을 지운 PNG(누끼)면 그 투명도 그대로. 보통 사진이면 사진 속 물체 나누기 모델(MediaPipe DeepLab v3 — '개' 칸)로.
//    모델 파일만 받아 오고(jsdelivr·구글 저장소), 사진은 이 휴대폰 안에서만 다룬다 — 어디로도 보내지 않는다.
// 2) 칸 나누기: 사진을 cols칸으로 나눠 강아지 칸만 색을 평균 → 색을 k개로 줄임 → 바깥 한 칸 테두리.
// window.WalsonPhotoDot.findDog(img) → Promise<mask> · render(img, mask, opts) → canvas · sticker(...) → 투명 바탕 잘라낸 캔버스
(function () {
  var MP_VER = '0.10.14';
  var MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite';
  var DOG = 12, CAT = 8;   // Pascal VOC 칸 번호(작은 개를 고양이로 보는 일이 있어 둘을 더한다)
  var segmenter = null;

  // mask = { w, h, data(Float32Array 0~1), source('alpha'|'model'|'none') }
  function alphaMask(img) {
    var w = Math.min(512, img.width), h = Math.round(img.height * w / img.width);
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
    var p = g.getImageData(0, 0, w, h).data, data = new Float32Array(w * h), clear = 0;
    for (var i = 0; i < w * h; i++) { data[i] = p[i * 4 + 3] / 255; if (p[i * 4 + 3] < 20) clear++; }
    return clear > w * h * 0.08 ? { w: w, h: h, data: data, source: 'alpha' } : null;   // 투명한 곳이 8% 넘으면 누끼로 본다
  }

  function loadSegmenter() {
    if (segmenter) return Promise.resolve(segmenter);
    return import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + MP_VER + '/vision_bundle.mjs').then(function (v) {
      return v.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + MP_VER + '/wasm').then(function (fs) {
        return v.ImageSegmenter.createFromOptions(fs, {
          baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' },
          runningMode: 'IMAGE', outputCategoryMask: false, outputConfidenceMasks: true
        });
      });
    }).then(function (s) { segmenter = s; return s; });
  }

  function modelMask(img) {
    return loadSegmenter().then(function (s) {
      // 모델 입력은 작아도 된다(안에서 257칸으로 줄인다) — 큰 사진은 줄여서 넘김
      var w = Math.min(768, img.width), h = Math.round(img.height * w / img.width);
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      var res = s.segment(c), ms = res.confidenceMasks;
      var dog = ms[DOG].getAsFloat32Array(), cat = ms[CAT].getAsFloat32Array();
      var mw = ms[DOG].width, mh = ms[DOG].height, data = new Float32Array(mw * mh), sum = 0;
      for (var i = 0; i < mw * mh; i++) { data[i] = Math.min(1, dog[i] + cat[i]); sum += data[i]; }
      if (res.close) res.close();
      return { w: mw, h: mh, data: data, source: sum > mw * mh * 0.02 ? 'model' : 'none' };
    });
  }

  function findDog(img) {
    var a = alphaMask(img);
    return a ? Promise.resolve(a) : modelMask(img);
  }

  function maskAt(m, fx, fy) {   // fx, fy: 0~1
    var x = Math.min(m.w - 1, Math.max(0, Math.floor(fx * m.w))), y = Math.min(m.h - 1, Math.max(0, Math.floor(fy * m.h)));
    return m.data[y * m.w + x];
  }

  // 칸 계산 — 반환 { cols, rows, cell(색 배열 또는 null), outline(불리언) }
  function cells(img, m, cols, k) {
    var rows = Math.max(1, Math.round(cols * img.height / img.width)), SS = 4;
    var c = document.createElement('canvas'); c.width = cols * SS; c.height = rows * SS;
    var g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
    var p = g.getImageData(0, 0, c.width, c.height).data, n = cols * rows, col = new Array(n), dog = new Uint8Array(n), x, y, i;
    for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
      var r = 0, gg = 0, b = 0, wsum = 0, cov = 0;
      for (var sy = 0; sy < SS; sy++) for (var sx = 0; sx < SS; sx++) {
        var px = x * SS + sx, py = y * SS + sy, mv = maskAt(m, (px + 0.5) / c.width, (py + 0.5) / c.height), o = (py * c.width + px) * 4;
        cov += mv;
        if (mv > 0.2) { r += p[o] * mv; gg += p[o + 1] * mv; b += p[o + 2] * mv; wsum += mv; }
      }
      cov /= SS * SS;
      if (cov >= 0.38 && wsum > 0) { dog[y * cols + x] = 1; col[y * cols + x] = [r / wsum, gg / wsum, b / wsum]; }
    }
    // 다듬기 — 혼자 튀어나온 칸 빼고, 사방이 강아지인 구멍 메우기
    function nb(x, y) { var s = 0; if (x > 0 && dog[y * cols + x - 1]) s++; if (x < cols - 1 && dog[y * cols + x + 1]) s++; if (y > 0 && dog[(y - 1) * cols + x]) s++; if (y < rows - 1 && dog[(y + 1) * cols + x]) s++; return s; }
    for (var pass = 0; pass < 2; pass++) {
      var kill = [], fill = [];
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
        var s = nb(x, y), idx = y * cols + x;
        if (dog[idx] && s <= 1) kill.push(idx);
        if (!dog[idx] && s >= 3) fill.push(idx);
      }
      kill.forEach(function (j) { dog[j] = 0; });
      fill.forEach(function (j) {
        var acc = [0, 0, 0], cnt = 0, jx = j % cols, jy = (j - jx) / cols;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var q = (jy + d[1]) * cols + jx + d[0]; if (col[q] && dog[q]) { acc[0] += col[q][0]; acc[1] += col[q][1]; acc[2] += col[q][2]; cnt++; } });
        if (cnt) { dog[j] = 1; col[j] = [acc[0] / cnt, acc[1] / cnt, acc[2] / cnt]; }
      });
    }
    // 색 다듬기(채도 1.15·대비 1.08) + k-평균으로 k색
    var pts = [];
    for (i = 0; i < n; i++) if (dog[i]) {
      var cc = col[i], l = 0.3 * cc[0] + 0.59 * cc[1] + 0.11 * cc[2];
      col[i] = cc.map(function (v) { v = l + (v - l) * 1.15; return Math.max(0, Math.min(255, (v - 128) * 1.08 + 128)); });
      pts.push(i);
    }
    if (pts.length) {
      var sorted = pts.slice().sort(function (a, b2) { return lum(col[a]) - lum(col[b2]); });
      var cent = []; for (var j = 0; j < k; j++) cent.push(col[sorted[Math.floor((j + 0.5) / k * sorted.length)]].slice());
      var lab = {};
      for (var it = 0; it < 10; it++) {
        var sum = cent.map(function () { return [0, 0, 0, 0]; });
        pts.forEach(function (q) {
          var bi = 0, bd = 1e9;
          for (var j2 = 0; j2 < k; j2++) { var d = dist(col[q], cent[j2]); if (d < bd) { bd = d; bi = j2; } }
          lab[q] = bi; sum[bi][0] += col[q][0]; sum[bi][1] += col[q][1]; sum[bi][2] += col[q][2]; sum[bi][3]++;
        });
        for (j = 0; j < k; j++) if (sum[j][3]) cent[j] = [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]];
      }
      // 아주 어두운 색(눈·코)은 테두리 색에 가깝게 — 또렷하게
      cent = cent.map(function (cc2) { return lum(cc2) < 55 ? [28, 26, 43] : cc2; });
      pts.forEach(function (q) { col[q] = cent[lab[q]]; });
    }
    var outline = new Uint8Array(n);
    for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
      i = y * cols + x;
      if (!dog[i] && nb(x, y) > 0) outline[i] = 1;
    }
    return { cols: cols, rows: rows, dog: dog, col: col, outline: outline };
  }
  function lum(c) { return 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]; }
  function dist(a, b) { var r = a[0] - b[0], g = a[1] - b[1], bb = a[2] - b[2]; return r * r * 0.3 + g * g * 0.59 + bb * bb * 0.11; }
  function hex(c) { return 'rgb(' + c.map(function (v) { return Math.round(v); }).join(',') + ')'; }

  // 강아지가 차지한 가로 비율(0~1) — 칸 수를 '강아지 몸 가로' 기준으로 세려고
  function dogWidth(m) {
    var x0 = m.w, x1 = -1;
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) if (m.data[y * m.w + x] > 0.4) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
    return x1 < 0 ? 1 : Math.max(0.05, (x1 - x0 + 1) / m.w);
  }

  // opts: { cols(강아지 몸 가로 칸 수, 56), colors(12), bg('photo'|'blur'|'none'), width(1000), ink('#1c1a2b') }
  function render(img, m, opts) {
    opts = opts || {};
    var dogCols = opts.cols || 56, k = opts.colors || 12, ink = opts.ink || '#1c1a2b';
    var cols = Math.min(480, Math.round(dogCols / dogWidth(m)));
    var cs = cells(img, m, cols, k);
    var cell = Math.max(2, Math.round((opts.width || 1000) / cols)), W = cell * cs.cols, H = cell * cs.rows;
    var out = document.createElement('canvas'); out.width = W; out.height = H;
    var g = out.getContext('2d');
    if (opts.bg === 'photo') g.drawImage(img, 0, 0, W, H);
    else if (opts.bg === 'blur') {
      g.filter = 'blur(' + Math.round(W / 70) + 'px) saturate(0.85) brightness(1.06)';
      g.drawImage(img, -W * 0.03, -H * 0.03, W * 1.06, H * 1.06);
      g.filter = 'none';
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, W, H);
    }
    for (var y = 0; y < cs.rows; y++) for (var x = 0; x < cs.cols; x++) {
      var i = y * cs.cols + x;
      if (cs.dog[i]) { g.fillStyle = hex(cs.col[i]); g.fillRect(x * cell, y * cell, cell, cell); }
      else if (cs.outline[i]) { g.fillStyle = ink; g.fillRect(x * cell, y * cell, cell, cell); }
    }
    out._cells = cs; out._cell = cell;
    return out;
  }

  // 투명 바탕 스티커 — 강아지+테두리만 남기고 가장자리 2칸 여유로 잘라낸다(카드·키링 사진 칸에 넣을 것)
  function sticker(canvas) {
    var cs = canvas._cells, cell = canvas._cell, x0 = cs.cols, y0 = cs.rows, x1 = -1, y1 = -1;
    for (var y = 0; y < cs.rows; y++) for (var x = 0; x < cs.cols; x++) {
      var i = y * cs.cols + x;
      if (cs.dog[i] || cs.outline[i]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    }
    if (x1 < 0) return null;
    x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(cs.cols - 1, x1 + 2); y1 = Math.min(cs.rows - 1, y1 + 2);
    var out = document.createElement('canvas'); out.width = (x1 - x0 + 1) * cell; out.height = (y1 - y0 + 1) * cell;
    var g = out.getContext('2d');
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
      i = y * cs.cols + x;
      if (cs.dog[i]) g.fillStyle = hex(cs.col[i]); else if (cs.outline[i]) g.fillStyle = '#1c1a2b'; else continue;
      g.fillRect((x - x0) * cell, (y - y0) * cell, cell, cell);
    }
    return out;
  }

  window.WalsonPhotoDot = { findDog: findDog, render: render, sticker: sticker, loadSegmenter: loadSegmenter };
})();
