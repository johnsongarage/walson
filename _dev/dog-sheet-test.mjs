// 그림 공장 첫 시험 — 견종 도트 그림 8장을 서버 함수(dog-sheet)에 보내 3×2 그림을 받아 sian-ref/dog-sheet/에 둔다. (2026-11-28)
// 쓰는 법: node _dev/dog-sheet-test.mjs [라운드 글자(기본 a)] [견종…]
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

for (const b of breeds) {
  const f = path.join(root, 'icons', 'dot-dogs', b + '.webp');
  if (!fs.existsSync(f)) { console.log(b, '그림 없음'); continue; }
  const t0 = Date.now();
  const r = await fetch(url + '/functions/v1/dog-sheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anon, Origin: 'http://localhost' },
    body: JSON.stringify({ dog: round + '_' + b, kind: 'breed', breed: b, mime: 'image/webp', image: fs.readFileSync(f).toString('base64') }),
  });
  const j = await r.json().catch(() => ({ ok: false, why: 'http ' + r.status }));
  const s = ((Date.now() - t0) / 1000).toFixed(1) + '초';
  if (!j.ok) { console.log(b, '실패', j.why || r.status, s); if (j.why === 'day' || j.why === 'month') break; continue; }
  const ext = /jpeg/.test(j.mime) ? 'jpg' : 'png';
  const out = path.join(outDir, `${round}_${b}.${ext}`);
  fs.writeFileSync(out, Buffer.from(j.image, 'base64'));
  console.log(b, '됨', s, path.relative(root, out));
}
