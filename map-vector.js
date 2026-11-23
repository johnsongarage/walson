// 벡터 지도(시험) — 2026-11-19 가르시아 "지도 내가 커스텀할 수 있는 게 어디까지" → "그렇게 해줘".
// 그림 조각(OpenStreetMap 타일) 대신 길·건물·물·글자를 따로 받아 브라우저가 그리는 지도.
// 그래서 길·건물·공원·글자 색을 하나하나 정할 수 있다(그림 지도는 통째로 필터만 가능).
// 지도 데이터: OpenFreeMap(가입·키·요금 없음, 보증 없음) · 그리는 엔진: MapLibre GL(무료) · Leaflet 위에 얹는 다리: maplibre-gl-leaflet.
// 핀·경로·말풍선은 그대로 Leaflet이 그린다 — 지도 바탕만 바뀐다.
// 데이터를 못 받으면 원래 그림 지도(WalsonMapTiles)로 돌아간다.
(function () {
  var STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

  // 화면 색별 지도 색. 바꾸고 싶으면 여기 값만 고친다.
  var COLORS = {
    // 젤리 블랙 밤 지도 — 낮처럼 파스텔 톤으로(11/19 "밤도 마찬가지로"): 어두운 바탕 위에 공원 짙은 보라, 물 짙은 남색,
    // 큰길 연분홍, 중간 길 라벤더, 골목 회보라. 길은 밝게 남겨서 밤에도 위치를 알아보게(11/19 "밤에도 위치는 알아볼 수 있어야")
    night: {
      background: '#16151b', land: '#1b1a21', park: '#2a2231', wood: '#2f2538', water: '#1c2a3e',
      building: '#2c2a35', buildingLine: '#3a3746',
      roadMajor: '#f0b3cf', roadMid: '#c5b6e2', roadMinor: '#7b7789', path: '#8296bb', casing: '#0f0e13', rail: '#5a566a',
      waterway: '#3a5b84', boundary: '#4a4658',
      text: '#eeeaf2', textRoad: '#f6cfe0', textWater: '#9dbbe3', textPark: '#d3b3dd', halo: '#121116'
    },
    // 젤리(밝은 화면) — 예전 그림 지도의 파스텔 톤(town.html 필터 saturate·hue-rotate로 만들던 색)을 되살림(11/19 "파스텔톤이 잘 안 살아서 아쉽네"):
    // 공원 연보라·분홍, 큰길 연분홍(하늘색은 강처럼 보여서 뺌), 중간 길 라벤더, 건물 연회색 보라. 물은 알아보게 연하늘(예전 필터는 베이지로 바뀌었음)
    day: {
      background: '#f7f5f8', land: '#f5f3f6', park: '#f3e4f3', wood: '#ecd3e4', water: '#dfe9f5',
      building: '#e4e2ea', buildingLine: '#cfcdd8',
      roadMajor: '#f6cbdd', roadMid: '#ece2f3', roadMinor: '#ffffff', path: '#9fb6df', casing: '#d6d3dc', rail: '#c8c6cf',
      waterway: '#b9cfe9', boundary: '#d9d2de',
      text: '#3f3f46', textRoad: '#5d5d66', textWater: '#5b7fae', textPark: '#9a5c8a', halo: '#ffffff'
    }
  };

  var MAJOR = /motorway|trunk|primary/, MID = /secondary|tertiary/, PATH = /path|pedestrian|footway|track|steps|cycleway/;

  function paint(l, k, v) { l.paint = l.paint || {}; l.paint[k] = v; }

  // 지도에 원래 들어 있는 가게 이름·정류장(poi)·건물 번호(housenumber)는 숨긴다 — 왈슨 핀만 보이게(11/19 "지도 위에 보여줄 게 너무 많아").
  // 다시 보이게 하려면 여기서 빼면 된다.
  var HIDE_SOURCE_LAYERS = ['poi', 'housenumber', 'aerodrome_label'];

  function hide(l) { l.layout = l.layout || {}; l.layout.visibility = 'none'; }

  function recolor(style, c) {
    style.layers.forEach(function (l) {
      var id = l.id, sl = l['source-layer'] || '';
      if (HIDE_SOURCE_LAYERS.indexOf(sl) >= 0) { hide(l); return; }
      // 도로 번호(14·46 같은 노선 번호 방패) — 줌아웃하면 번호만 잔뜩 보여서 숨긴다(11/19 "도로의 번호는 안 보이게")
      if (l.type === 'symbol' && (/shield/.test(id) || /"ref"|\{ref\}/.test(JSON.stringify((l.layout || {})['text-field'] || '')))) { hide(l); return; }
      // 동네 이름은 '다산동' 같은 큰 이름만 — 'OO통'(행정 통)·작은 마을 이름은 빼기
      if (sl === 'place' && Array.isArray(l.filter) && l.filter[0] === 'match' && Array.isArray(l.filter[2]) && l.filter[3] === false) {
        ['neighbourhood', 'hamlet', 'isolated_dwelling'].forEach(function (k) { if (l.filter[2].indexOf(k) < 0) l.filter[2].push(k); });
      }
      // 3D 건물(입체로 솟은 건물) → 납작한 2D 건물로(11/19 "지도가 3D인데 2D로")
      if (l.type === 'fill-extrusion') {
        l.type = 'fill';
        l.paint = { 'fill-color': c.building, 'fill-outline-color': c.buildingLine };
        return;
      }
      if (l.type === 'background') { paint(l, 'background-color', c.background); return; }
      if (l.type === 'hillshade') { hide(l); return; }
      if (l.type === 'fill' || l.type === 'fill-extrusion') {
        var key = l.type === 'fill' ? 'fill-color' : 'fill-extrusion-color';
        if (sl === 'water') paint(l, key, c.water);
        else if (sl === 'park' || /park|grass|meadow|pitch|garden/.test(id)) paint(l, key, c.park);
        else if (/wood|forest|landcover/.test(id) || sl === 'landcover') paint(l, key, c.wood);
        else if (sl === 'building') { paint(l, key, c.building); if (l.type === 'fill') paint(l, 'fill-outline-color', c.buildingLine); }
        else paint(l, key, c.land);
        if (l.paint && l.paint['fill-pattern']) delete l.paint['fill-pattern'];
        return;
      }
      if (l.type === 'line') {
        var col;
        if (sl === 'waterway') col = c.waterway;
        else if (sl === 'boundary') col = c.boundary;
        else if (sl === 'transportation' || sl === 'aeroway') {
          if (/casing/.test(id)) col = c.casing;
          else if (/rail|transit/.test(id)) col = c.rail;
          else if (MAJOR.test(id)) col = c.roadMajor;
          else if (MID.test(id)) col = c.roadMid;
          else if (PATH.test(id)) col = c.path;
          else col = c.roadMinor;
        } else if (sl === 'building') col = c.buildingLine;
        else if (sl === 'park') col = c.park;
        if (col) paint(l, 'line-color', col);
        return;
      }
      if (l.type === 'symbol' && l.layout && l.layout['text-field']) {
        // 이름은 한국어 이름 먼저(없으면 원래 이름). 도로 번호(ref) 같은 건 그대로 둔다.
        if (JSON.stringify(l.layout['text-field']).indexOf('name') >= 0) {
          l.layout['text-field'] = ['coalesce', ['get', 'name:ko'], ['get', 'name']];
        }
        var t = c.text;
        if (sl === 'transportation_name') t = c.textRoad;
        else if (sl === 'water_name' || sl === 'waterway') t = c.textWater;
        else if (sl === 'park') t = c.textPark;
        paint(l, 'text-color', t);
        paint(l, 'text-halo-color', c.halo);
        paint(l, 'text-halo-width', 1.4);
      }
    });
    return style;
  }

  function colorsNow() { return document.documentElement.getAttribute('data-palette') === 'black' ? COLORS.night : COLORS.day; }
  var rawStyle = null;   // 받은 스타일 원본(다시 칠할 때 씀)

  // map: Leaflet 지도. fallback: 실패하면 부를 함수(원래 그림 지도).
  window.WalsonVectorTiles = function (map, fallback) {
    if (!window.L || !L.maplibreGL || !window.maplibregl || !window.fetch) { fallback(map); return; }
    var c = colorsNow();
    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; fallback(map); } }, 8000);
    fetch(STYLE_URL).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (style) {
      if (done) return;
      done = true; clearTimeout(timer);
      rawStyle = JSON.stringify(style);
      var layer = L.maplibreGL({
        style: recolor(style, c),
        attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      }).addTo(map);
      document.documentElement.classList.add('walson-vector-map');
      window.WalsonVectorLayer = layer;
    }).catch(function () { if (!done) { done = true; clearTimeout(timer); fallback(map); } });
  };
  // 화면 색을 바꾼 뒤 지도 색도 다시(2026-11-23 지도 위 [설정] → 화면 색). 받은 원본에서 지금 화면 색(밤·낮)으로 다시 칠해 넣으면
  // MapLibre가 달라진 칸만 고친다(지도 데이터는 다시 안 받음). 벡터 지도를 못 받았으면(그림 지도) 할 일 없음 → false.
  // 도트 지도로 바꿔 둔 동안엔 벡터 지도가 빠져 있다가 다시 붙을 때 options.style로 새로 만들어져서, 그 값도 새 색으로 바꿔 둔다.
  window.WalsonVectorTiles.repaint = function () {
    var layer = window.WalsonVectorLayer;
    if (!layer || !rawStyle) return false;
    var c = colorsNow();
    layer.options.style = recolor(JSON.parse(rawStyle), c);
    var ml = layer.getMaplibreMap && layer.getMaplibreMap();
    if (ml) ml.setStyle(recolor(JSON.parse(rawStyle), c));
    return true;
  };
})();
