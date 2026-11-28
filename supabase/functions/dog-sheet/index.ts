// 왈슨 그림 공장 — 강아지 사진(또는 견종 도트 그림) 한 장 → 동작 그림 한 장 (2026-11-28)
// 칸 짜기 두 가지(11/28 가르시아 "3x3이건 3x2건 만들어 두고 내가 요청하는 방식에 따라 고를 수 있게"):
//   3x2: 앉기1 · 걷기A · 걷기B / 자기 · 웃기(가끔 으르렁) · 앉기2(갸웃)               — 1K 3:2
//   3x3: 앉기1 · 앉기2(갸웃) · 자기 / 걷기A · 걷기 중간 · 걷기B / 웃기 · 으르렁 · 배뒤집기 — 1K 1:1
//   자르기·배경 빼기는 앱(브라우저, dog-sheet.js)에서.
// 걷기: 왼다리·오른다리로 말하면 그림 모델이 못 알아듣는다(라운드 a — 두 장이 거의 같고 뒷다리는 그대로, 앞다리 교차 없음).
//   그래서 자세 안내 그림(막대 뼈대 — 라운드 c의 굵은 회색 마네킹은 다리 질감·일자 꼬리까지 따라 해서 바꿈, _dev/gait-guide.py)을 두 번째 그림으로 같이 보낸다 — 3x2는 gait-guide.png(A·B),
//   3x3은 pose-guide-3x3.png(A·중간·B·배뒤집기). 검은 굵은 선 = 가까운 다리, 옅은 회색 가는 선 = 먼 다리. 꼬리는 일부러 안 그림.
//   짝은 대각선(가까운 앞 + 먼 뒤) — 빠른 걸음(트롯). 진짜 '걷기'는 네 박자라 두세 장으로는 못 그리고,
//   같은 쪽 짝은 낙타 걸음처럼 보인다(점검 11/28). 중간 장은 A → 중간 → B → 중간으로 두 번 쓴다.
//   안내 그림은 사이트에서 받아 온다 — 그림만 고쳐 올리면 함수를 다시 올리지 않아도 바뀐다. 못 받으면 글만으로 그린다.
// 먼 다리 색(라운드 b 3x3 말티즈): '조금 어둡게'라고 하니 안내 그림처럼 진회색으로 칠함 → '같은 털색의 조금 짙은 색'으로.
// 목줄·하네스는 늘 뺀다(11/28 가르시아 "목줄 찬 채로 있는 가능성도 엄청 커" — 끊긴 줄이 매달리고 자르기도 망가짐). 옷은 그대로(벗기기는 나중에 고르게).
// 표정(11/28 가르시아): 앉기1은 늘 살짝 웃음. 걷기 얼굴은 웃음/덤덤 반반, 갸웃 방향은 왼/오 반반,
//   3x2 웃기 칸은 10번에 3번 장난 으르렁(3x3은 으르렁 칸이 따로). 부를 때 look으로 정할 수도.
//
// 비밀 값: GEMINI_API_KEY(Supabase Edge Function secrets에만 — 저장소·채팅·노트에 적지 않는다).
// SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY는 Supabase가 함수에 저절로 넣어 준다.
// 한도: docs/supabase-dog-sheet.sql의 walson_art_take(하루 20장 · 한 마리 3장 · 이번 달 어림 8,000원).
// 사진은 받아서 구글로 넘기고 바로 버린다 — 어디에도 저장하지 않고, 기록 표엔 번호·날짜·됐는지만.
//
// 부르는 법: POST { dog: '번호(영소문자·숫자·_ 24자까지)', kind: 'breed'|'photo', breed?: '견종 이름', image: base64, mime: 'image/png'|'image/jpeg'|'image/webp',
//                  layout?: '3x2'(기본)|'3x3', look?: { walk: 'smile'|'calm', happy: 'smile'|'growl', tilt: 'left'|'right' } }
// 받는 것:  { ok: true, image: base64, mime, layout, look } 또는 { ok: false, why: 'day'|'dog'|'month'|'bad'|'gemini'|'noimage' }

const MODEL = 'gemini-nano-banana-2.1';
const ORIGINS = ['https://johnsongarage.co.kr', 'http://localhost', 'http://127.0.0.1'];
const MAX_B64 = 3_000_000;   // 사진 약 2.2MB까지(앱이 1024px로 줄여 보낸다)
const GUIDE_BASE = 'https://johnsongarage.co.kr/walson/sian-ref/dog-sheet/';
const guides: Record<string, { data: string; at: number }> = {};
async function guideB64(name: string): Promise<string | null> {   // 10분 동안 기억
  const c = guides[name];
  if (c && Date.now() - c.at < 600_000) return c.data;
  try {
    const r = await fetch(GUIDE_BASE + name + '?t=' + Math.floor(Date.now() / 600_000));
    if (!r.ok) throw new Error(String(r.status));
    const u = new Uint8Array(await r.arrayBuffer());
    let bin = ''; for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode(...u.subarray(i, i + 0x8000));
    guides[name] = { data: btoa(bin), at: Date.now() };
    return guides[name].data;
  } catch (e) { console.log('guide', name, String(e).slice(0, 100)); return null; }
}

const WALK_FACE = {
  smile: 'In every walk frame the face is happy: mouth open in a smile, tongue slightly out.',
  calm: 'In every walk frame the face is calm: mouth closed, relaxed, looking ahead.',
};
const SMILE = 'happy, standing, big smile with mouth open, tongue out, tail up.';
const GROWL = 'a playful little growl, standing: nose slightly wrinkled, lips lifted to show a few tiny teeth, ears forward, tail still up and wagging. Eyes stay soft and happy. Cute and teasing like play time, never grumpy, scary or aggressive.';
const HAPPY_FACE = { smile: SMILE, growl: GROWL };
const TILT = {   // 강아지 기준 왼·오가 아니라 그림 기준으로 말한다(모델이 덜 헷갈림)
  left: 'head tilted so the top of the head leans toward the LEFT side of the picture',
  right: 'head tilted so the top of the head leans toward the RIGHT side of the picture',
};
type Look = { walk: keyof typeof WALK_FACE; happy: keyof typeof HAPPY_FACE; tilt: keyof typeof TILT };

const COMMON = (breed: string, grid: string, n: string) => `Use the dog in the FIRST attached image as the only character reference${breed ? ` (breed: ${breed})` : ''}.
Draw a sprite sheet of THIS SAME DOG: ${grid}, ${n} equal cells.
Keep the breed, coat colors, markings, ear shape, tail and any clothing exactly the same in every cell.
Keep the coat texture (curly, fluffy, long, wiry or smooth) on the whole body in every cell, legs included - legs are as furry as in the reference, with real paws.
Keep the tail shape of the reference dog in every cell (curled, plumed, fluffy, short...). Never draw a straight stick tail.
Never draw a leash, lead or harness (a small collar is fine); if the photo has one, leave it out and fill in the fur it covered.
Style: cute pixel art with chunky visible pixels and a dark outline, full body, side view facing right unless noted.
Every cell: one dog only, centered, the same size, feet on the same ground line, generous empty margin, nothing touching the cell edges.
No grid lines, no text, no numbers, no frames, no ground shadow, no props, no motion lines or effect marks.
Background: one flat pure chroma green (#00FF00) everywhere, no gradient, no texture. Never use that green on the dog.
`;
const SIT1 = 'sitting, facing right, with a gentle slight smile (mouth softly curved, closed or only a little open).';
const SIT2 = (look: Look) => `sitting, ${TILT[look.tilt]}, curious face, looking at the viewer.`;
const LEGS = `The guide is a stick figure: thick black lines are the near-side legs, thin light gray lines are the far-side legs, small circles are the joints. Put the dog's legs where those lines are.
The lines only show positions. Draw real furry legs of this dog over them - never copy the lines, circles, colors or the outline body of the guide, and the guide has no tail on purpose.
Diagonal pairs move together like a trot: when the near front leg is forward, the far back leg is also forward, and the far front leg and near back leg are back.
In walk frames A and B the two front legs cross each other like an X and the two back legs cross each other like an X.
From A to B every leg swaps: each front leg and each back leg that is forward in A is back in B. The back legs must move as much as the front legs.
All four legs have the dog's own fur color. The far-side legs are only a slightly deeper shade of that same fur color - never gray or black unless the dog's fur really is. For a white or cream dog the far-side legs are a very light cream. Real dog anatomy: front legs bend at the wrist, back legs bend at the hock which points backward.`;

const LAYOUTS = {
  '3x2': {
    aspect: '3:2', guide: 'gait-guide.png',
    prompt: (breed: string, look: Look) => COMMON(breed, '3 columns x 2 rows', 'six') + `Row 1, cell 1: ${SIT1}
Row 1, cell 2 and cell 3 - WALKING, two frames that alternate as a walk cycle.
The SECOND attached image is only a POSE GUIDE: two stick-figure dogs, walk frame A on the left and walk frame B on the right.
Cell 2 = frame A, cell 3 = frame B.
${LEGS}
Head, face, ears, tail, body, size and position in the cell stay identical between A and B; only the legs change.
${WALK_FACE[look.walk]}
Row 2, cell 1: sleeping, lying curled up, eyes closed.
Row 2, cell 2: ${HAPPY_FACE[look.happy]}
Row 2, cell 3: ${SIT2(look)}`,
  },
  '3x3': {
    aspect: '1:1', guide: 'pose-guide-3x3.png',
    prompt: (breed: string, look: Look) => COMMON(breed, '3 columns x 3 rows', 'nine') + `Row 1, cell 1: ${SIT1}
Row 1, cell 2: ${SIT2(look)}
Row 1, cell 3: sleeping, lying curled up, eyes closed.
Row 2 - WALKING, three frames of one walk cycle, played A, middle, B, middle.
The SECOND attached image is only a POSE GUIDE: four stick-figure dogs from left to right = walk frame A, walk middle frame, walk frame B, belly-up pose.
Row 2, cell 1 = frame A, cell 2 = middle frame, cell 3 = frame B.
In the middle frame the legs that were forward in A stand straight under the body on the ground, and the other two legs are lifted, bent and passing forward under the body.
${LEGS}
Head, face, ears, tail, body, size and position in the cell stay identical in all three walk frames; only the legs change.
${WALK_FACE[look.walk]}
Row 3, cell 1: ${SMILE}
Row 3, cell 2: ${GROWL}
Row 3, cell 3: belly-up, like the fourth stick figure: lying on its back on the ground line, belly up, all four paws loosely bent in the air, head resting sideways on the ground turned toward the viewer with a happy face, tail on the ground. Show the belly in a lighter shade of the coat.`,
  },
} as const;
type LayoutName = keyof typeof LAYOUTS;

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
  const t = await r.text();   // walson_art_done은 빈 답(void)
  return t ? JSON.parse(t) : null;
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
  const layout: LayoutName = b?.layout === '3x3' ? '3x3' : '3x2';
  const L = LAYOUTS[layout];
  const look: Look = {
    walk: b?.look?.walk in WALK_FACE ? b.look.walk : (Math.random() < 0.5 ? 'smile' : 'calm'),
    happy: layout === '3x3' ? 'smile' : b?.look?.happy in HAPPY_FACE ? b.look.happy : (Math.random() < 0.7 ? 'smile' : 'growl'),
    tilt: b?.look?.tilt in TILT ? b.look.tilt : (Math.random() < 0.5 ? 'left' : 'right'),
  };
  if (!/^[a-z0-9_]{1,24}$/.test(dog) || !/^image\/(png|jpeg|webp)$/.test(mime)
    || !image || image.length > MAX_B64 || !/^[A-Za-z0-9+/=]+$/.test(image)) return out({ ok: false, why: 'bad' }, 400);

  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return out({ ok: false, why: 'gemini' }, 500);

  const t = String(await rpc('walson_art_take', { p_dog: dog, p_kind: kind, p_model: MODEL }));
  if (!t.startsWith('ok:')) return out({ ok: false, why: t }, 429);
  const id = Number(t.slice(3));

  try {
    const g = await guideB64(L.guide);
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [
          { text: L.prompt(breed, look) },
          { inline_data: { mime_type: mime, data: image } },
          ...(g ? [{ inline_data: { mime_type: 'image/png', data: g } }] : []),
        ] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: L.aspect, imageSize: '1K' } },
      }),
    });
    if (!r.ok) {
      console.log('gemini', r.status, (await r.text()).slice(0, 300));   // 사진·키는 찍지 않는다
      await rpc('walson_art_done', { p_id: id, p_ok: false });
      return out({ ok: false, why: 'gemini', code: r.status }, 502);   // 402 = AI Studio 선불 크레딧 바닥
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
    return out({ ok: true, image: pic.data, mime: pic.mimeType || pic.mime_type || 'image/png', layout, look });
  } catch (e) {
    console.log('fail', String(e).slice(0, 200));
    await rpc('walson_art_done', { p_id: id, p_ok: false }).catch(() => {});
    return out({ ok: false, why: 'gemini' }, 502);
  }
});
