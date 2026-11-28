// 그림 공장 첫 시험 — 견종 도트 그림 8장을 서버 함수(dog-sheet)에 보내 3×2 그림을 받아 sian-ref/dog-sheet/에 둔다. (2026-11-28)
// 쓰는 법: node _dev/dog-sheet-test.mjs [라운드 글자(기본 a)] [견종…]   — 3×3은 LAYOUT=3x3 node …, 정지 자세 3×2는 LAYOUT=pose, 걷기 2×2는 LAYOUT=walk
//   라운드 글자는 번호 앞에 붙는다(a_maltese) — 한 마리 3장 한도라 프롬프트를 바꿔 다시 시험할 땐 b, c…로.
// 한 장 약 50원. 8장 약 400원. 하루 20장 한도.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const cfg = fs.readFileSync(path.join(root, 'site-config.js'), 'utf8');
const url = cfg.match(/cloudBackup:\s*\{\s*url:\s*'([^']+)'/)[1];
const anon = cfg.match(/anonKey:\s*'([^']+)'/)[1];
const round = (process.argv[2] || 'a').replace(/[^a-z0-9]/g, '').slice(0, 4) || 'a';
const breeds = process.argv.slice(3).length ? process.argv.slice(3)
  : ['maltese', 'poodle', 'pom', 'bichon', 'shihtzu', 'maltipoo', 'jindo', 'golden'];
const outDir = path.join(root, 'sian-ref', 'dog-sheet');
fs.mkdirSync(outDir, { recursive: true });

// 표정은 번갈아 정해 두 가지가 다 나오게(앱에선 서버가 뽑는다)
const LOOKS = [{ walk: 'smile', happy: 'smile', tilt: 'left' }, { walk: 'calm', happy: 'growl', tilt: 'right' }, { walk: 'calm', happy: 'smile', tilt: 'right' }, { walk: 'smile', happy: 'growl', tilt: 'left' }];
const layout = ['3x3', 'pose', 'walk'].includes(process.env.LAYOUT) ? process.env.LAYOUT : '3x2';
let n = 0;
for (const b of breeds) {
  const look = LOOKS[n++ % LOOKS.length];
  const f = path.join(root, 'icons', 'dot-dogs', b + '.webp');
  if (!fs.existsSync(f)) { console.log(b, '그림 없음'); continue; }
  const t0 = Date.now();
  const r = await fetch(url + '/functions/v1/dog-sheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anon, Origin: 'http://localhost' },
    body: JSON.stringify({ dog: round + '_' + b, kind: 'breed', breed: b, mime: 'image/webp', image: fs.readFileSync(f).toString('base64'), look, layout }),
  });
  const j = await r.json().catch(() => ({ ok: false, why: 'http ' + r.status }));
  const s = ((Date.now() - t0) / 1000).toFixed(1) + '초';
  if (!j.ok) { console.log(b, "실패", j.why || r.status, j.code || "", s); if (j.why === 'day' || j.why === 'month') break; continue; }
  const ext = /jpeg/.test(j.mime) ? 'jpg' : 'png';
  const out = path.join(outDir, `${round}_${layout}_${b}.${ext}`);
  fs.writeFileSync(out, Buffer.from(j.image, 'base64'));
  console.log(b, '됨', s, layout, '걷기 ' + j.look?.walk + ' · 웃기 ' + j.look?.happy + ' · 갸웃 ' + j.look?.tilt, path.relative(root, out));
}
