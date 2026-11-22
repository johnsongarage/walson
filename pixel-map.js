// 도트(픽셀아트) 지도 — 2026-11-22. map-pixel-sample.html에서 검토한 방식을 화면들에서 같이 쓰려고 분리.
//
// 공개 OSM 타일을 받아 캔버스에서 칸(4px) 단위로 다시 칠한다. 칸마다 원본 픽셀을
// 물·공원·간선도로·도로·건물·땅으로 분류해 다수결로 역할을 정하고, 역할별 게임 팔레트 색을 준다.
// (원래 검토한 소스의 CARTO voyager 타일은 API 키 없이 'API KEY REQUIRED' 타일만 줘서 OSM으로 바꿈)
//
// 쓰는 법 (Leaflet 다음에 불러온다):
//   var layer = PixelMap.createLayer({ pixelSize: 4 });       // L.tileLayer 대신
//   var route = PixelMap.createRoute(map, { color: '#b8563a' }); route.setLines([...]); route.setEnabled(true)
//   PixelMap.getStyle() / setStyle('pixel'|'basic')            // 화면 간에 공유되는 선택 (localStorage)
//
// 위치 데이터는 이 파일 안에서만 그려지고 어디로도 보내지 않는다. 받는 건 OSM 타일 이미지뿐.
(function () {
  var TILE = 256;
  var STYLE_KEY = 'walson_map_style';

  var PAL = {
    land:       [[233, 223, 196], [226, 215, 186]],  // 두 톤 체커 → 도트 질감
    building:   [[214, 196, 170], [214, 196, 170]],
    buildShade: [[176, 156, 130], [176, 156, 130]],  // 건물 아래쪽 그림자 한 칸
    park:       [[128, 196, 92],  [112, 182, 80]],
    water:      [[88, 172, 232],  [76, 160, 222]],
    road:       [[252, 248, 236], [252, 248, 236]],
    major:      [[250, 204, 92],  [250, 204, 92]]
  };
  // 한 칸 안에서의 우선순위: 얇은 도로가 끊기지 않게 도로는 조금만 섞여 있어도 이긴다
  var ROLE_WEIGHT = { major: 3.0, road: 2.2, water: 1.2, park: 1.1, building: 1.0, land: 0.6 };

  // OSM 기본 스타일 색 기준 분류. null = 글자·아이콘이라 다수결에서 뺀다.
  function classify(r, g, b) {
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var l = (max + min) / 2, d = max - min;
    var s = d === 0 ? 0 : d / (255 - Math.abs(max + min - 255));
    var h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    if (l < 140 && s < 0.25) return null;                                   // 글자
    if (s > 0.5 && l < 160) return null;                                    // 진한 원색 = POI 아이콘
    if (s > 0.12 && s < 0.8 && h >= 180 && h <= 250 && l >= 180) return 'water';
    if (s > 0.10 && h >= 70 && h < 170) return 'park';
    if (s > 0.5 && (h < 12 || h > 345) && l < 200) return 'road';          // 연어색 점선 = 보행로
    if (s > 0.35 && h >= 10 && h <= 68 && l >= 190 && l < 240) return 'major'; // 주황·노랑 = 간선도로
    if (l >= 250) return 'road';
    if (l < 216) return 'building';
    return 'land';
  }

  function paintTile(img, tile, coords, B) {
    var src = document.createElement('canvas');
    src.width = TILE; src.height = TILE;
    var sctx = src.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(img, 0, 0);
    var px = sctx.getImageData(0, 0, TILE, TILE).data;
    var n = TILE / B, roles = new Array(n * n);

    for (var by = 0; by < n; by++) {
      for (var bx = 0; bx < n; bx++) {
        var score = { major: 0, road: 0, water: 0, park: 0, building: 0, land: 0 };
        for (var y = by * B; y < by * B + B; y++) {
          for (var x = bx * B; x < bx * B + B; x++) {
            var i = (y * TILE + x) * 4;
            var rl = classify(px[i], px[i + 1], px[i + 2]);
            if (rl) score[rl] += 1;
          }
        }
        var best = 'land', bestScore = 0;
        for (var k in score) {
          var v = score[k] * ROLE_WEIGHT[k];
          if (v > bestScore) { bestScore = v; best = k; }
        }
        roles[by * n + bx] = best;
      }
    }

    var ctx = tile.getContext('2d');
    var baseX = coords.x * n, baseY = coords.y * n; // 월드 기준 칸 좌표 → 체커가 타일 경계에서 안 끊김
    for (var y2 = 0; y2 < n; y2++) {
      for (var x2 = 0; x2 < n; x2++) {
        var role = roles[y2 * n + x2];
        if (role === 'building' && y2 + 1 < n && roles[(y2 + 1) * n + x2] !== 'building') role = 'buildShade';
        var c = PAL[role][(baseX + x2 + baseY + y2) & 1];
        ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
        ctx.fillRect(x2 * B, y2 * B, B, B);
      }
    }
  }

  var PixelLayer = L.GridLayer.extend({
    // pixelSize는 256의 약수만 (4, 8) — 나누어떨어지지 않으면 칸 크기가 들쭉날쭉하고 타일 경계에 줄이 생긴다
    options: { pixelSize: 4, maxZoom: 19, className: 'pixel-map-layer', attribution: '&copy; OpenStreetMap' },
    createTile: function (coords, done) {
      var tile = document.createElement('canvas');
      tile.width = TILE; tile.height = TILE;
      var B = this.options.pixelSize;
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        try { paintTile(img, tile, coords, B); done(null, tile); }
        catch (e) { done(e, tile); }
      };
      img.onerror = function () { done(new Error('타일 로드 실패'), tile); };
      img.src = 'https://tile.openstreetmap.org/' + coords.z + '/' + coords.x + '/' + coords.y + '.png';
      return tile;
    }
  });

  // 위경도 목록 → 칸 좌표 목록 (브레젠험으로 빈칸 없이 이음)
  function blockPath(map, points, B, z) {
    var out = [], last = null;
    for (var i = 0; i < points.length; i++) {
      var p = map.project(points[i], z);
      var cur = { x: Math.floor(p.x / B), y: Math.floor(p.y / B) };
      if (!last) { out.push(cur); last = cur; continue; }
      var dx = Math.abs(cur.x - last.x), dy = -Math.abs(cur.y - last.y);
      var sx = last.x < cur.x ? 1 : -1, sy = last.y < cur.y ? 1 : -1;
      var err = dx + dy, x = last.x, y = last.y;
      while (x !== cur.x || y !== cur.y) {
        var e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
        out.push({ x: x, y: y });
      }
      last = cur;
    }
    return out;
  }

  // 걸은 길을 지도와 같은 격자에 맞춘 칸으로 그린다(도트 지도일 때만 켠다).
  // setLines([{ latlngs: [[lat,lng],…], dashed: true|false }, …]) — dashed(화면이 꺼져 있던 구간)는 한 칸씩 건너 그린다.
  function createRoute(map, opts) {
    opts = opts || {};
    var color = opts.color || '#ff3b30';
    var border = opts.border || '#3c2f26';
    var cell = opts.cell || 8;                 // 경로 한 칸 크기(px) — 지도 칸(4px)의 2배
    var lines = [], enabled = false;

    var pane = map.getPane('pixelRoute') || map.createPane('pixelRoute');
    pane.style.zIndex = 450;                   // 타일·선(400) 위, 마커(600) 아래
    pane.style.pointerEvents = 'none';
    var canvas = L.DomUtil.create('canvas', '', pane);
    var ctx = canvas.getContext('2d');

    function draw() {
      var size = map.getSize();
      if (canvas.width !== size.x || canvas.height !== size.y) { canvas.width = size.x; canvas.height = size.y; }
      L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!enabled) return;
      var origin = map.getPixelBounds().min, z = map.getZoom(), seen = {};
      lines.forEach(function (line) {
        if (!line.latlngs || line.latlngs.length < 2) return;
        blockPath(map, line.latlngs, cell, z).forEach(function (c, i) {
          if (line.dashed && i % 2) return;
          var key = c.x + ',' + c.y;
          if (seen[key]) return; seen[key] = 1;
          var x = c.x * cell - origin.x, y = c.y * cell - origin.y;
          ctx.fillStyle = border; ctx.fillRect(x, y, cell, cell);
          ctx.fillStyle = color; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        });
      });
    }

    map.on('moveend zoomend viewreset resize', draw);
    map.on('zoomstart', function () { canvas.style.visibility = 'hidden'; });
    map.on('zoomend', function () { canvas.style.visibility = 'visible'; });

    return {
      redraw: draw,
      setLines: function (ls) { lines = ls || []; draw(); },
      setEnabled: function (on) { enabled = !!on; draw(); }
    };
  }

  function getStyle() {
    // 기본은 기존 지도. 사용자가 버튼으로 도트를 고른 경우에만 도트로 연다.
    try { return localStorage.getItem(STYLE_KEY) === 'pixel' ? 'pixel' : 'basic'; } catch (e) { return 'basic'; }
  }
  function setStyle(v) {
    try { localStorage.setItem(STYLE_KEY, v); } catch (e) { /* 저장 못 해도 이번 화면에선 적용 */ }
  }

  window.PixelMap = {
    createLayer: function (opts) { return new PixelLayer(opts); },
    createRoute: createRoute,
    getStyle: getStyle,
    setStyle: setStyle,
    classify: classify
  };
})();
