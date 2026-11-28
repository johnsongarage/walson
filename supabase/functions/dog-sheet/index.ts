// 왈슨 그림 공장 — 강아지 사진(또는 견종 도트 그림) 한 장 → 3×2 동작 그림 한 장 (2026-11-28)
// 칸: 위 줄 앉기1 · 걷기1 · 걷기2 / 아래 줄 자기 · 웃기 · 앉기2. 자르기·배경 빼기는 앱(브라우저)에서.
//
// 비밀 값: GEMINI_API_KEY(Supabase Edge Function secrets에만 — 저장소·채팅·노트에 적지 않는다).
// SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY는 Supabase가 함수에 저절로 넣어 준다.
// 한도: docs/supabase-dog-sheet.sql의 walson_art_take(하루 20장 · 한 마리 3장 · 이번 달 어림 8,000원).
// 사진은 받아서 구글로 넘기고 바로 버린다 — 어디에도 저장하지 않고, 기록 표엔 번호·날짜·됐는지만.
//
// 부르는 법: POST { dog: '번호(영소문자·숫자·_ 24자까지)', kind: 'breed'|'photo', breed?: '견종 이름', image: base64, mime: 'image/png'|'image/jpeg'|'image/webp' }
// 받는 것:  { ok: true, image: base64, mime } 또는 { ok: false, why: 'day'|'dog'|'month'|'bad'|'gemini'|'noimage' }

const MODEL = 'gemini-nano-banana-2.1';
const ORIGINS = ['https://johnsongarage.co.kr', 'http://localhost', 'http://127.0.0.1'];
const MAX_B64 = 3_000_000;   // 사진 약 2.2MB까지(앱이 1024px로 줄여 보낸다)

const PROMPT = (breed: string) => `Use the dog in the attached image as the only character reference${breed ? ` (breed: ${breed})` : ''}.
Draw a sprite sheet of THIS SAME DOG: 3 columns x 2 rows, six equal cells.
Keep the breed, coat colors, markings, ear shape, tail and any clothing exactly the same in every cell.
Style: cute pixel art with chunky visible pixels and a dark outline, full body, side view facing right unless noted.
Every cell: one dog only, centered, the same size, feet on the same ground line, generous empty margin, nothing touching the cell edges.
No grid lines, no text, no numbers, no frames, no ground shadow, no props.
Background: one flat pure chroma green (#00FF00) everywhere, no gradient, no texture. Never use that green on the dog.
Row 1, cell 1: sitting, calm, facing right.
Row 1, cell 2: walking mid-stride. Front-left leg and back-right leg reach forward; front-right and back-left legs push back.
Row 1, cell 3: walking, the opposite stride. Front-right leg and back-left leg reach forward; front-left and back-right push back. Legs must look clearly different from cell 2 so the two frames alternate as a walk cycle.
Row 2, cell 1: sleeping, lying curled up, eyes closed.
Row 2, cell 2: happy, standing, mouth open, tongue out, tail up.
Row 2, cell 3: sitting, head tilted, looking at the viewer.`;

function cors(req: Request) {
  const o = req.headers.get('origin') || '';
  const ok = ORIGINS.some((a) => o === a || o.startsWith(a + ':'));
  return {
    'Access-Control-Allow-Origin': ok ? o : ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

async function rpc(name: string, args: Record<string, unknown>) {
  const url = Deno.env.get('SUPABASE_URL') + '/rest/v1/rpc/' + name;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: 'Bearer ' + key },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error('rpc ' + name + ' ' + r.status);
  return r.json();
}

Deno.serve(async (req) => {
  const h = { ...cors(req), 'Content-Type': 'application/json' };
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: h });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return out({ ok: false, why: 'bad' }, 405);

  let b: any;
  try { b = await req.json(); } catch { return out({ ok: false, why: 'bad' }, 400); }
  const dog = String(b?.dog || '');
  const kind = b?.kind === 'breed' ? 'breed' : 'photo';
  const breed = String(b?.breed || '').replace(/[^\p{L}\p{N} \-]/gu, '').slice(0, 30);
  const mime = String(b?.mime || '');
  const image = String(b?.image || '');
  if (!/^[a-z0-9_]{1,24}$/.test(dog) || !/^image\/(png|jpeg|webp)$/.test(mime)
    || !image || image.length > MAX_B64 || !/^[A-Za-z0-9+/=]+$/.test(image)) return out({ ok: false, why: 'bad' }, 400);

  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return out({ ok: false, why: 'gemini' }, 500);

  const t = String(await rpc('walson_art_take', { p_dog: dog, p_kind: kind, p_model: MODEL }));
  if (!t.startsWith('ok:')) return out({ ok: false, why: t }, 429);
  const id = Number(t.slice(3));

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: PROMPT(breed) }, { inline_data: { mime_type: mime, data: image } }] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '3:2', imageSize: '1K' } },
      }),
    });
    if (!r.ok) {
      console.log('gemini', r.status, (await r.text()).slice(0, 300));   // 사진·키는 찍지 않는다
      await rpc('walson_art_done', { p_id: id, p_ok: false });
      return out({ ok: false, why: 'gemini' }, 502);
    }
    const j = await r.json();
    const parts = j?.candidates?.[0]?.content?.parts || [];
    const pic = parts.map((p: any) => p.inlineData || p.inline_data).find((d: any) => d?.data);
    if (!pic) {
      console.log('noimage', JSON.stringify(j?.candidates?.[0]?.finishReason || j?.promptFeedback || '').slice(0, 200));
      await rpc('walson_art_done', { p_id: id, p_ok: false });
      return out({ ok: false, why: 'noimage' }, 502);
    }
    await rpc('walson_art_done', { p_id: id, p_ok: true });
    return out({ ok: true, image: pic.data, mime: pic.mimeType || pic.mime_type || 'image/png' });
  } catch (e) {
    console.log('fail', String(e).slice(0, 200));
    await rpc('walson_art_done', { p_id: id, p_ok: false }).catch(() => {});
    return out({ ok: false, why: 'gemini' }, 502);
  }
});
