// [워킹패스] 3D 키링 보기(2026-11-24 밤 가르시아 "도트 카드는 없애 줘 … 대신 3D로 키링 시안 보는 탭을 만들어 줘, 거기선 편집할 거 없어,
// 기존 편집한 거 그대로 보여 줘" + 같은 날 "키링 앞뒤 같게 해").
// [키링 카드]에서 고친 그림(my-card.html krFile — 사진·글자·특기·모양·색 그대로)을 투명 아크릴 키링 앞·뒷면에 같은 그림으로 넣고
// 손가락으로 돌려 본다. 고리 구멍은 카드 위 분홍 칸 가운데(pass-trace.js geom().hole) 자리를 그대로 뚫고 작은 고리 → 집게 → 열쇠고리.
// 11/26 가르시아 "고리를 D형으로 — 사슬 조금, 위에는 작은 D형 고리": 작은 고리 → 짧은 사슬 → 작은 D고리(keyring-hardware.js, 시안과 같이 씀).
// 모양·재질은 3D 키링 시안(keyring-3d-sample.html)과 같은 수치(가로 50mm · 가로판 60mm, 가장자리 투명 2.2mm, 두께 3mm) — 크기는 예시.
// three.js r160(vendor/three, MIT). 무거워서 [3D 키링]을 처음 누를 때만 my-card.html이 이 파일을 불러온다(type=module).
// 그림은 이 휴대폰 안에서만 쓰고 어디로도 보내지 않는다. 고르는 칸·저장은 없다(보기만).
import * as THREE from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { addHardware } from './keyring-hardware.js?v=1';

const KR = 6, EDGE = 2.2, THICK = 3, BEV = 0.35, TUBE = 0.55;
// 금속 고리 색 — 화면 색(theme.js)마다: 젤리 은색 · 블랙 건메탈 · 노랑 금색 · 바다 은색 · 딸기우유 로즈골드(시안과 같음)
const METAL = { jelly: 0xf4f4f8, black: 0x6e6e78, yellow: 0xf2cf7a, sea: 0xe8eef6, pink: 0xf3c2b0 };

function rrShape(w, h, r, cy) {
  const s = new THREE.Shape(), x0 = -w / 2, y0 = cy - h / 2, x1 = w / 2, y1 = cy + h / 2;
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0); s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r); s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1); s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
function holePath(x, y, r) { const p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); return p; }

// create(캔버스, { bg: 바탕 색 }) → { setArt(그림 캔버스, { land, hole: { fx, fy, fr } }), view(뒷면?), spin(켬?), start(), stop(), setBg(색), resize() }
// WebGL을 못 쓰면 던진다(부르는 쪽이 안내)
function create(canvas, opt) {
  opt = opt || {};
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;   // 그림 색 그대로(쨍하게) — 시안과 같음
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.background = new THREE.Color(opt.bg || '#fffaf3');
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 2000);
  camera.position.set(0, 12, 215);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.autoRotate = true; controls.autoRotateSpeed = 2.4;
  const listeners = [];
  controls.addEventListener('start', () => listeners.forEach((f) => f('touch')));

  const acrylic = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: THICK, ior: 1.49,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4 });
  const T = window.WalsonTheme;
  const metal = new THREE.MeshStandardMaterial({ color: METAL[(T && T.palette) || 'jelly'] || 0xf4f4f8, metalness: 1, roughness: 0.16, envMapIntensity: 1.3 });
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(60,30,45,0.25)'); gr.addColorStop(1, 'rgba(60,30,45,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(70, 22), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
  const keyring = new THREE.Group(); scene.add(keyring);
  let tex = null, framed = false;

  // 판·인쇄(앞뒤 같은 그림)·고리를 새로. art = 키링 카드 그림(카드 크기 그대로 — 둥근 귀퉁이·구멍 안은 투명)
  function setArt(art, info) {
    info = info || {};
    keyring.children.slice().forEach((m) => {
      keyring.remove(m);
      m.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== acrylic && o.material !== metal) { if (o.material.map) o.material.map = null; o.material.dispose(); } });
    });
    if (tex) tex.dispose();
    tex = new THREE.CanvasTexture(art);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const KW = info.land ? 60 : 50, PW = KW - EDGE * 2, PH = PW * art.height / art.width, KH = PH + EDGE * 2;
    // 고리 구멍 — 그림 안 구멍 자리(테두리 안 동그라미보다 조금 작게 뚫어 인쇄 테두리가 둘러 보이게). 없으면 위 가운데
    const h = info.hole, hx = h ? -PW / 2 + h.fx * PW : 0, hy = h ? PH / 2 - h.fy * PH : PH / 2 - 3, hr = h ? Math.max(1.2, h.fr * PW * 0.94) : 1.7;
    const outer = rrShape(KW, KH, KR, 0); outer.holes.push(holePath(hx, hy, hr));
    const geo = new THREE.ExtrudeGeometry(outer, { depth: THICK, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 3, curveSegments: 32 });
    geo.translate(0, 0, -THICK / 2);
    keyring.add(new THREE.Mesh(geo, acrylic));
    // 인쇄 판 — 아크릴 겉면에 바로, 조명 영향 없이 그림 색 그대로. 투명한 곳(구멍 둘레 등)은 버려서 아크릴이 보이게(alphaTest)
    const ps = rrShape(PW, PH, Math.max(1, KR - EDGE), 0); ps.holes.push(holePath(hx, hy, hr));
    const pg = new THREE.ShapeGeometry(ps, 32);
    const pos = pg.attributes.position, uv = pg.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + PW / 2) / PW, (pos.getY(i) + PH / 2) / PH);
    uv.needsUpdate = true;
    const front = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, alphaTest: 0.5 }));
    front.position.z = THICK / 2 + BEV + 0.02; keyring.add(front);
    // 뒷면 = 앞면과 같은 그림(11/24 밤 "키링 앞뒤 같게 해") — 뒤에서 보면 좌우가 뒤집혀서 UV를 뒤집어 똑바로 보이게
    const bgeo = pg.clone(), buv = bgeo.attributes.uv;
    for (let i = 0; i < buv.count; i++) buv.setX(i, 1 - buv.getX(i));
    buv.needsUpdate = true;
    const back = new THREE.Mesh(bgeo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, toneMapped: false, alphaTest: 0.5 }));
    back.position.z = -(THICK / 2 + BEV + 0.02); keyring.add(back);
    // 인쇄 위 광택 한 겹(빛 반사만) — 구멍 자리는 비움
    const gs = rrShape(KW - 0.6, KH - 0.6, KR, 0); gs.holes.push(holePath(hx, hy, hr + 0.3));
    const gloss = new THREE.Mesh(new THREE.ShapeGeometry(gs, 32),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.04, clearcoat: 1, envMapIntensity: 2, depthWrite: false }));
    gloss.position.z = THICK / 2 + BEV + 0.06; keyring.add(gloss);
    // 금속 고리 — 구멍 위쪽에 걸린 작은 고리(판 위 끝을 넘어가게 크기를 맞춤) → 짧은 사슬 → 맨 위 작은 D고리(11/26 — 예전 집게·열쇠고리 대신)
    const cross = hy + hr - TUBE - 0.15, JR = Math.max(3.2, (KH / 2 + TUBE + 0.6 - cross) / 2);
    const top = addHardware(THREE, keyring, metal, { x: hx, cross, JR, tube: TUBE });
    shadow.position.y = -KH / 2 - 14;
    // 키링(판 + 고리)이 위아래 여유 있게 들어오게 — 처음 한 번과 모양(세로·가로)이 바뀔 때만(돌려 보던 각도는 그대로)
    const bottom = -KH / 2, mid = (top + bottom) / 2, span = top - bottom;
    const dist = (span / 2 + 12) / Math.tan(THREE.MathUtils.degToRad(16));
    const key = (info.land ? 'h' : 'v');
    if (!framed || framed !== key) {
      const dir = camera.position.clone().sub(controls.target);
      if (dir.length() < 1) dir.set(0, 4, 1);
      controls.target.set(0, mid, 0);
      dir.setLength(dist); camera.position.copy(controls.target).add(dir);
      framed = key;
    }
    controls.minDistance = dist * 0.5; controls.maxDistance = dist * 1.8;
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(canvas);
  // 보일 때만 그린다(탭을 바꾸면 멈춤 — 배터리)
  let raf = 0, on = false;
  function frame() { raf = 0; if (!on) return; controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(frame); }
  function start() { on = true; resize(); if (!raf) raf = requestAnimationFrame(frame); }
  function stop() { on = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function spin(v) { controls.autoRotate = !!v; listeners.forEach((f) => f('spin')); }
  function view(back) {   // 앞면·뒷면으로 돌리기(빙글빙글은 멈춤)
    spin(false);
    const d = camera.position.distanceTo(controls.target);
    camera.position.set(0, controls.target.y + 4, back ? -d : d);
    controls.update();
  }
  function setBg(c) { scene.background = new THREE.Color(c); }
  return { setArt, start, stop, spin, view, setBg, resize, isSpinning: () => controls.autoRotate, on: (f) => listeners.push(f) };
}

window.WalsonKeyring3D = { create };
