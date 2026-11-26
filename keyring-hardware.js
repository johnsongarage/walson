// 3D 키링 금속 고리(2026-11-26 가르시아 "키링 렌더링할 때 고리를 D형으로 바꾸자 — 사슬 조금 있고 위에는 작은 D형 고리로"):
// 판 구멍을 지나는 작은 고리 → 짧은 사슬(고리 넷, 하나씩 90도 엇갈려 끼움) → 맨 위 작은 D고리(평평한 막대가 아래 — 사슬이 거기 걸림, 둥근 쪽이 위).
// 예전 집게(랍스터)·열쇠고리(두 바퀴)는 뺐다. [워킹패스] 3D 키링(keyring-3d-view.js)과 3D 키링 시안(keyring-3d-sample.html)이 같이 쓴다.
// 단위는 mm(판 가로 50mm와 같은 단위). 매달린 모양 그대로 — 아래 것이 위 것의 끝 안쪽에 걸려 있다.

const LINK = { len: 5.0, wid: 3.0, wire: 0.42, n: 4 };     // 사슬 고리 하나(바깥 길이·폭, 철사 반지름) · 고리 수
const DR = { half: 3.9, side: 2.6, corner: 1.0, wire: 0.75 };   // D고리(가운데 줄 기준 반 폭 · 막대에서 반원 시작까지 · 막대 양 끝 굴림 · 철사 반지름)

// 2D 길(가운데 줄)을 따라 둥근 철사를 감는다 — 닫힌 고리
function wireLoop(THREE, path, wire, seg) {
  const pts = path.getSpacedPoints(seg).slice(0, -1).map((p) => new THREE.Vector3(p.x, p.y, 0));   // 끝점 = 첫 점이라 하나 뺌
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), seg, wire, 12, true);
}
// 사슬 고리 — 길쭉한 고리, 가운데가 원점, 판과 같은 면(XY)
function linkGeo(THREE) {
  const r = LINK.wire, a = (LINK.wid - 2 * r) / 2, yc = (LINK.len - 2 * r) / 2 - a;
  const p = new THREE.Path();
  p.moveTo(a, -yc); p.lineTo(a, yc); p.absarc(0, yc, a, 0, Math.PI, false);
  p.lineTo(-a, -yc); p.absarc(0, -yc, a, Math.PI, Math.PI * 2, false);
  return wireLoop(THREE, p, r, 72);
}
// D고리 — 아래 평평한 막대(가운데 줄이 y = 0) + 위 반원
function dGeo(THREE) {
  const a = DR.half, s = DR.side, c = DR.corner;
  const p = new THREE.Path();
  p.moveTo(0, 0); p.lineTo(a - c, 0); p.absarc(a - c, c, c, -Math.PI / 2, 0, false);
  p.lineTo(a, s); p.absarc(0, s, a, 0, Math.PI, false);
  p.lineTo(-a, c); p.absarc(-a + c, c, c, Math.PI, Math.PI * 1.5, false); p.lineTo(0, 0);
  return wireLoop(THREE, p, DR.wire, 140);
}

// group에 고리를 단다. o = { x: 구멍 가운데 x, cross: 작은 고리 아래 줄(구멍 위쪽 안) y, JR: 작은 고리 반지름, tube: 작은 고리 철사 반지름 }
// 돌려주는 값 = 맨 위(D고리 꼭대기) y — 화면에 키링을 다 담을 때 쓴다
export function addHardware(THREE, group, metal, o) {
  const x = o.x || 0, tube = o.tube, JR = o.JR, cross = o.cross;
  // 1) 판 구멍을 지나는 작은 고리(판과 직각 — 구멍을 꿰어서)
  const jump = new THREE.Mesh(new THREE.TorusGeometry(JR, tube, 18, 64), metal);
  jump.rotation.y = Math.PI / 2; jump.position.set(x, cross + JR, 0); group.add(jump);
  // 2) 사슬 — 첫 고리는 작은 고리와 직각(판과 같은 면), 그다음부터 하나씩 90도 돌려 끼움.
  //    아래 것의 위 줄이 위 것의 아래 끝 안쪽에 얹힘 → 고리 사이 = 바깥 길이 - 철사 굵기 둘
  const r = LINK.wire, lg = linkGeo(THREE), pitch = LINK.len - 4 * r;
  let c = cross + 2 * JR - tube - r + LINK.len / 2 - r;
  for (let k = 0; k < LINK.n; k++) {
    const m = new THREE.Mesh(lg, metal);
    m.position.set(x, c, 0); if (k % 2) m.rotation.y = Math.PI / 2;
    group.add(m);
    if (k < LINK.n - 1) c += pitch;
  }
  // 3) D고리 — 평평한 막대가 마지막 사슬 고리의 위 끝 안쪽을 지난다(막대가 그 고리 면과 직각이 되게 면을 고름)
  const barY = c + LINK.len / 2 - 2 * r - DR.wire;
  const d = new THREE.Mesh(dGeo(THREE), metal);
  d.position.set(x, barY, 0);
  if ((LINK.n - 1) % 2 === 0) d.rotation.y = Math.PI / 2;   // 마지막 고리가 판과 같은 면이면 D고리는 옆으로
  group.add(d);
  return barY + DR.side + DR.half + DR.wire;
}
