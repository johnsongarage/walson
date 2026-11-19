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
    // 블랙 핑크 밤 지도 — 바탕은 어둡게, 건물·공원·물은 구분되게, 큰길은 노랑, 골목은 밝은 회색, 글자는 흰색
    night: {
      background: '#16161b', land: '#1b1b21', park: '#1d2a22', wood: '#1f2d24', water: '#1b2b40',
      building: '#2f2f3a', buildingLine: '#3d3d4a',
      roadMajor: '#ffcf40', roadMid: '#e8c766', roadMinor: '#9b9ba8', path: '#7c7c8a', casing: '#0e0e12', rail: '#55556a',
      waterway: '#2c4f75', boundary: '#4a4a58',
      text: '#ececf0', textRoad: '#ffe08a', textWater: '#8fb4e0', textPark: '#9cc9a8', halo: '#121215'
    },
    // 젤리(밝은 화면) — 크림 바탕, 공원 연두, 물 하늘, 길 흰색, 큰길 연핑크
    day: {
      background: '#fffdfd', land: '#fbf7f8', park: '#e6f3dc', wood: '#dcedd2', water: '#d6e6ff',
      building: '#f1e7ec', buildingLine: '#e6d6de',
      roadMajor: '#ffd1e3', roadMid: '#ffe4ef', roadMinor: '#ffffff', path: '#c9b9c2', casing: '#e9d3de', rail: '#c8c0c6',
      waterway: '#a9c8f5', boundary: '#d9c9d2',
      text: '#3a3a40', textRoad: '#5a5a62', textWater: '#4a72b0', textPark: '#4f7d50', halo: '#ffffff'
    }
  };

  var MAJOR = /motorway|trunk|primary/, MID = /secondary|tertiary/, PATH = /path|pedestrian|footway|track|steps|cycleway/;

  function paint(l, k, v) { l.paint = l.paint || {}; l.paint[k] = v; }

  function recolor(style, c) {
    style.layers.forEach(function (l) {
      var id = l.id, sl = l['source-layer'] || '';
      if (l.type === 'background') { paint(l, 'background-color', c.background); return; }
      if (l.type === 'hillshade') { l.layout = l.layout || {}; l.layout.visibility = 'none'; return; }
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

  // map: Leaflet 지도. fallback: 실패하면 부를 함수(원래 그림 지도).
  window.WalsonVectorTiles = function (map, fallback) {
    if (!window.L || !L.maplibreGL || !window.maplibregl || !window.fetch) { fallback(map); return; }
    var dark = document.documentElement.getAttribute('data-palette') === 'black';
    var c = dark ? COLORS.night : COLORS.day;
    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; fallback(map); } }, 8000);
    fetch(STYLE_URL).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (style) {
      if (done) return;
      done = true; clearTimeout(timer);
      var layer = L.maplibreGL({
        style: recolor(style, c),
        attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      }).addTo(map);
      document.documentElement.classList.add('walson-vector-map');
      window.WalsonVectorLayer = layer;
    }).catch(function () { if (!done) { done = true; clearTimeout(timer); fallback(map); } });
  };
})();
