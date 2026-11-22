// 도트(픽셀아트) 지도 — 2026-11-22. map-pixel-sample.html에서 검토한 방식을 화면들에서 같이 쓰려고 분리.
//
// 공개 OSM 타일을 받아 캔버스에서 칸(4px) 단위로 다시 칠한다. 칸마다 원본 픽셀을
// 물·공원·간선도로·도로·건물·땅으로 분류해 다수결로 역할을 정하고, 역할별 게임 팔레트 색을 준다.
// (원래 검토한 소스의 CARTO voyager 타일은 API 키 없이 'API KEY REQUIRED' 타일만 줘서 OSM으로 바꿈)
//
// 쓰는 법 (Leaflet 다음에 불러온다):
//   var layer = PixelMap.createLayer({ pixelSize: 4 });       // L.tileLayer 대신
//   var route = PixelMap.createRoute(map, { color: '#b8563a' }); route.setLines([...]); route.setEnabled(true)
//   var labels = PixelMap.createLabels(map); labels.setEnabled(true)   // 길·하천·공원·동네 이름 층
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

  // ───── 이름표 층(2026-11-22): 도트 지도 위에 길·하천·공원·동네 이름만 얹는다 ─────
  // [동네] 벡터 지도와 같은 OpenFreeMap 데이터(가입·키 없음)에서 글자 층만 남기고 바탕·길·건물은 뺀 투명 층.
  // 지도 엔진(MapLibre, 약 800KB)은 이름표를 처음 켤 때만 불러온다. 받는 건 지도 데이터뿐, 위치는 보내지 않는다.
  var LABEL_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
  var LABEL_KEY = 'walson_map_labels';
  var LABEL_LAYERS = {
    'waterway_line_label': 1, 'water_name_point_label': 1, 'water_name_line_label': 1,
    'highway-name-path': 1, 'highway-name-minor': 1, 'highway-name-major': 1,
    'label_village': 1, 'label_town': 1, 'label_city': 1
  };
  var TEXT = '#3c2f26', HALO = '#fff8e7', TEXT_WATER = '#1f5f99', TEXT_PARK = '#2f5a1f';
  var NAME = ['coalesce', ['get', 'name:ko'], ['get', 'name']];

  function loadScript(src) {
    return new Promise(function (ok, fail) {
      var el = document.createElement('script');
      el.src = src; el.onload = ok; el.onerror = fail;
      document.head.appendChild(el);
    });
  }
  var engineReady = null;
  function loadEngine() {
    if (engineReady) return engineReady;
    if (!document.querySelector('link[href*="maplibre-gl.css"]')) {
      var css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = 'vendor/maplibre/maplibre-gl.css?v=4.7.1';
      document.head.appendChild(css);
    }
    // 한글 이름표를 도트 글꼴(둥근모꼴, OFL)로 — 못 받으면 기본 글꼴로 그려진다
    if (!document.getElementById('dunggeunmo-face')) {
      var st = document.createElement('style');
      st.id = 'dunggeunmo-face';
      st.textContent = "@font-face{font-family:'DungGeunMo';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/DungGeunMo.woff') format('woff');}";
      document.head.appendChild(st);
    }
    var font = (document.fonts && document.fonts.load) ? document.fonts.load("16px 'DungGeunMo'").catch(function () {}) : Promise.resolve();
    engineReady = Promise.all([
      font,
      (window.maplibregl ? Promise.resolve() : loadScript('vendor/maplibre/maplibre-gl.js?v=4.7.1'))
        .then(function () { return (L.maplibreGL ? null : loadScript('vendor/maplibre/leaflet-maplibre-gl.js?v=0.1.4')); })
    ]);
    return engineReady;
  }

  function labelStyle(style) {
    var src = 'openmaptiles';
    var layers = style.layers.filter(function (l) { return LABEL_LAYERS[l.id]; }).map(function (l) {
      var sl = l['source-layer'];
      l.layout = l.layout || {};
      l.layout['text-field'] = NAME;
      l.paint = {
        'text-color': (sl === 'water_name' || sl === 'waterway') ? TEXT_WATER : TEXT,
        'text-halo-color': HALO, 'text-halo-width': 2, 'text-halo-blur': 0
      };
      return l;
    });
    // 공원 이름: 원래 스타일엔 poi(가게 등)와 섞여 있어서 공원만 따로 뽑는다
    layers.push({
      id: 'walson-park-name', type: 'symbol', source: src, 'source-layer': 'poi', minzoom: 14,
      filter: ['==', ['get', 'class'], 'park'],
      layout: { 'text-field': NAME, 'text-font': ['Noto Sans Regular'], 'text-size': 12, 'text-max-width': 8 },
      paint: { 'text-color': TEXT_PARK, 'text-halo-color': HALO, 'text-halo-width': 2, 'text-halo-blur': 0 }
    });
    var sources = {}; sources[src] = style.sources[src];
    return { version: 8, glyphs: style.glyphs, sources: sources, layers: layers };
  }

  // createLabels(map).setEnabled(true|false) — 처음 켤 때 엔진·스타일을 받는다. 실패하면 조용히 이름표 없이.
  function createLabels(map) {
    var layer = null, enabled = false, loading = null;
    var pane = map.getPane('pixelLabels') || map.createPane('pixelLabels');
    pane.style.zIndex = 460;                   // 도트 경로(450) 위, 마커(600) 아래
    pane.style.pointerEvents = 'none';

    function build() {
      if (loading) return loading;
      loading = loadEngine().then(function () {
        if (!window.maplibregl || !L.maplibreGL) throw new Error('지도 엔진을 못 불러옴');
        return fetch(LABEL_STYLE_URL).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
      }).then(function (style) {
        layer = L.maplibreGL({
          style: labelStyle(style), pane: 'pixelLabels', interactive: false,
          localIdeographFontFamily: "'DungGeunMo', sans-serif",
          attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a>'
        });
        return layer;
      }).catch(function (e) { loading = null; throw e; });
      return loading;
    }
    function setEnabled(on) {
      enabled = !!on;
      if (!enabled) { if (layer && map.hasLayer(layer)) map.removeLayer(layer); return Promise.resolve(false); }
      return build().then(function () {
        if (enabled && !map.hasLayer(layer)) layer.addTo(map);
        return true;
      });
    }
    return { setEnabled: setEnabled };
  }
  function getLabels() { try { return localStorage.getItem(LABEL_KEY) === 'on'; } catch (e) { return false; } }
  function setLabels(on) { try { localStorage.setItem(LABEL_KEY, on ? 'on' : 'off'); } catch (e) { /* 이번 화면에선 적용 */ } }

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
    createLabels: createLabels,
    getLabels: getLabels,
    setLabels: setLabels,
    getStyle: getStyle,
    setStyle: setStyle,
    classify: classify
  };
})();
