// 지도 꾸미기(2026-11-15 가르시아 "A·B 바로 만들어줘") — town.html이 쓴다. 전역 window.MapDeco.
//  A. 우리 개 얼굴 발도장: 내가 산책으로 다녀간 공원·발도장 장소에 프로필 사진 얼굴 핀(+몇 번 왔는지).
//     이 휴대폰의 산책 기록(petwalk_walks)과 프로필만 쓰고 어디로도 보내지 않는다.
//  B. 그림 강아지: 공원마다 손그림 강아지 1~2마리를 놓아 지도를 꾸민다. 실제 강아지·실제 위치가 아니라
//     그림이다 — 누르지 않아도 되게 interactive: false, 확대했을 때만 보인다.
// 배경: 가게 수호지킴이(남의 강아지를 가게에 묶어 올림)를 동의·위생 문제로 내리고 대신 만든 것.
(function () {
  var INK = '#4a3f35';

  // ── B. 손그림 강아지 4가지(64×64, 오른쪽을 봄). c = 털색, d = 귀·무늬색 ──
  var POSES = {
    sit: function (c, d) {
      return '<path d="M15 44c-7-4-8-11-4-15" fill="none"/>' +
        '<path d="M15 55c-2-16 5-23 15-23 9 0 13 7 13 14v9z" fill="' + c + '"/>' +
        '<path d="M35 44v11M28 47v8" fill="none"/>' +
        '<circle cx="40" cy="25" r="11" fill="' + c + '"/>' +
        '<ellipse cx="50" cy="28" rx="6" ry="4.5" fill="' + c + '"/>' +
        '<path d="M32 17c-7 3-7 11-3 14 4-2 6-7 5-13z" fill="' + d + '"/>' +
        '<circle cx="55" cy="26.5" r="2" fill="' + INK + '" stroke="none"/>' +
        '<circle cx="43" cy="22" r="1.7" fill="' + INK + '" stroke="none"/>' +
        '<path d="M48 32c2 1 4 1 5-1" fill="none"/>';
    },
    lie: function (c, d) {
      return '<path d="M9 46c-5-1-6-6-3-9" fill="none"/>' +
        '<ellipse cx="28" cy="47" rx="19" ry="8" fill="' + c + '"/>' +
        '<path d="M38 54h10M20 54h-6" fill="none"/>' +
        '<circle cx="47" cy="40" r="9.5" fill="' + c + '"/>' +
        '<ellipse cx="55" cy="44" rx="5.5" ry="4" fill="' + c + '"/>' +
        '<path d="M41 33c-6 3-6 10-2 12 3-2 5-6 4-11z" fill="' + d + '"/>' +
        '<circle cx="59.5" cy="43" r="1.8" fill="' + INK + '" stroke="none"/>' +
        '<path d="M48 38.5c1 1 2.5 1 3.5 0" fill="none"/>';
    },
    run: function (c, d) {
      return '<path d="M12 34c-6-5-6-10-2-13" fill="none"/>' +
        '<ellipse cx="29" cy="38" rx="17" ry="9" fill="' + c + '"/>' +
        '<path d="M17 44l-7 9M24 46l-3 10M36 45l5 10M41 43l9 7" fill="none"/>' +
        '<circle cx="47" cy="27" r="10" fill="' + c + '"/>' +
        '<ellipse cx="56" cy="30" rx="6" ry="4.5" fill="' + c + '"/>' +
        '<path d="M40 18c-8 0-11 7-8 11 4 0 7-4 8-11z" fill="' + d + '"/>' +
        '<circle cx="61" cy="28.5" r="2" fill="' + INK + '" stroke="none"/>' +
        '<circle cx="50" cy="24" r="1.7" fill="' + INK + '" stroke="none"/>' +
        '<path d="M54 34.5c1 3 4 4 6 2" fill="#e2777a"/>';
    },
    ball: function (c, d) {
      return POSES.sit(c, d) + '<circle cx="54" cy="52" r="5.5" fill="#e2777a"/><path d="M49 50c3 1 7 1 10 0" fill="none"/>';
    }
  };
  var POSE_KEYS = ['sit', 'lie', 'run', 'ball'];
  var COATS = [['#f3e2c7', '#c9955f'], ['#fffaf3', '#d9b48a'], ['#d39a5c', '#8a5a2b'], ['#a07858', '#5c4030'], ['#f1f1ee', '#3d3d3d'], ['#e9c46a', '#b07d2b']];

  function dogSvg(pose, coat, px) {
    return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 64 64" aria-hidden="true">' +
      '<g stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">' +
      POSES[pose](coat[0], coat[1]) + '</g></svg>';
  }

  // 같은 공원에는 늘 같은 강아지가 같은 자리에 — 이름으로 만든 숫자로 정한다(새로 고칠 때마다 바뀌지 않게)
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function offset(center, meters, angleDeg) {
    var a = angleDeg * Math.PI / 180;
    var dLat = (meters * Math.cos(a)) / 111320;
    var dLng = (meters * Math.sin(a)) / (111320 * Math.cos(center[0] * Math.PI / 180));
    return [center[0] + dLat, center[1] + dLng];
  }

  // places: [{ id, name, center:[lat,lng] }] — 공원 하나에 1~2마리
  function decoDogs(places) {
    var out = [];
    places.forEach(function (pl) {
      var h = hash(pl.id || pl.name || '');
      var n = 1 + (h % 2);
      for (var i = 0; i < n; i++) {
        var hh = hash((pl.id || '') + ':' + i);
        out.push({
          latlng: offset(pl.center, 60 + (hh % 70), (hh >>> 3) % 360),
          html: '<div class="deco-dog' + ((hh >>> 9) % 2 ? ' is-flip' : '') + '" style="animation-delay:-' + ((hh >>> 5) % 30) / 10 + 's">' +
            dogSvg(POSE_KEYS[(hh >>> 7) % POSE_KEYS.length], COATS[(hh >>> 11) % COATS.length], 40) + '</div>'
        });
      }
    });
    return out;
  }

  // ── A. 우리 개 얼굴 발도장 ──
  function km(a, b) {
    var R = 6371, t = Math.PI / 180;
    var dLat = (b[0] - a[0]) * t, dLng = (b[1] - a[1]) * t;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  // places: [{ id, name, center, radiusKm }] → 장소별 { count: 다녀간 산책 수, first: 처음 날짜 }
  // 보상 규칙과 같이 5분·200m 미만 산책(rewardEligible: false)은 세지 않고, 걷는 속도 구간 점(stampRoute)으로 본다.
  function visits(walks, places) {
    var res = {};
    (walks || []).forEach(function (w) {
      if (!w || w.rewardEligible === false) return;
      var pts = w.stampRoute || w.route || [];
      if (!pts.length) return;
      places.forEach(function (pl) {
        for (var i = 0; i < pts.length; i++) {
          if (km(pts[i], pl.center) <= pl.radiusKm) {
            var r = res[pl.id] || (res[pl.id] = { count: 0, first: w.date });
            r.count++;
            if (w.date < r.first) r.first = w.date;
            break;
          }
        }
      });
    });
    return res;
  }
  function escapeAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function faceHtml(photo, ringColor, count) {
    return '<div class="dog-face" style="border-color:' + ringColor + '">' +
      (photo ? '<img src="' + escapeAttr(photo) + '" alt="">' : dogSvg('sit', COATS[0], 34)) +
      '<span class="dog-face-n">' + count + '</span></div>';
  }

  window.MapDeco = { decoDogs: decoDogs, dogSvg: dogSvg, visits: visits, faceHtml: faceHtml, POSES: POSE_KEYS, COATS: COATS };
})();
