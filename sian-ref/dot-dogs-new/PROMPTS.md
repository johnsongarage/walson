# 새 도트 강아지 — 제미나이 프롬프트 (2026-11-27)

기존 8마리(icons/dot-dogs)와 같은 느낌으로. 제미나이에 **정면 강아지 한 장(ref-jindo.png 또는 ref-shiba.png — 체형 비슷한 쪽)을 첨부**하고
(11/27 8마리 모음을 붙였더니 비스듬한 옆모습·굵은 점으로 나옴 — "three-quarter"를 옆으로 읽음),
아래 [공통]을 먼저 붙인 뒤 [견종] 한 줄을 끝에 넣는다. 한 번에 한 마리.

받은 그림은 `_dev/dot-dog-cutout.py`(바탕 지우기) → `_dev/dot-dog-native.py`(점 격자 되돌리기)로 icons/dot-dogs에 넣고,
azit-room.js `DOGS`(맨 뒤에 — 순서는 방 모습 번호라 바꾸지 않음)·`BREED_RULES`에 한 줄.

## [공통]
Pixel art of a single dog, in exactly the same style as the attached reference sheet of 8 pixel-art dogs.
- FRONT VIEW. The dog sits facing the viewer straight on, perfectly symmetrical like the attached reference: face, chest and both front legs pointing straight at the camera, front paws side by side, both eyes and both ears fully visible and level. The body is NOT turned sideways. The tail curls up beside the hip, visible from the front.
- Crisp square pixels, no blur, no anti-aliasing. Same pixel resolution and detail as the reference: small pixels, about 120–180 pixels tall, then upscaled with nearest-neighbor.
- Dark brown (#2b1d16) outline — not pure black, not chunky. Soft 4–5 step fur shading, warm light from the top left.
- Big round dark eyes with one small white highlight pixel each, small shiny nose, gentle friendly expression, mouth closed or a small happy open mouth.
- Realistic breed proportions but slightly cute (head a little bigger), exactly like the reference — not chibi, not cartoon-flat.
- No clothes, no collar, no accessories, no text, no shadow on the ground, no props.
- Background: one flat solid color #CFE3CF (light sage green) filling the whole image, nothing else.
- Square-ish canvas with the dog centered and small even margins. Do not crop the ears, tail or paws.

## [견종] — 끝에 한 줄 붙이기
1순위
- Breed: mixed-breed Korean dog (mutt), medium size, short smooth WHITE coat, pointed semi-erect ears, curled tail.
- Breed: mixed-breed Korean dog (mutt), small-medium size, short smooth LIGHT BROWN / tan coat with a cream chest, floppy-tipped ears.
- Breed: mixed-breed Korean dog (mutt), medium size, short BLACK coat with tan eyebrows and tan legs (black-and-tan), erect ears.
- Breed: Bichon Frise, small, fluffy pure white coat with a round "cotton ball" head shape, black eyes and nose, tail curled over the back.
- Breed: Shih Tzu, small, long silky coat white with gold/brown patches, short flat face, round big eyes, fluffy hair on the head (no topknot, no hair tie).
- Breed: Pembroke Welsh Corgi, small-medium, red-and-white (orange back and ears, white chest, muzzle and paws), big upright ears, short legs.
- Breed: Golden Retriever, large, golden wavy coat, feathered chest and legs, soft floppy ears, gentle smile.
- Breed: Yorkshire Terrier, very small, steel-blue body with tan head and legs, small upright ears, silky coat.
- Breed: Toy Poodle, small, curly pure WHITE coat (same pose and grooming as the brown poodle in the reference).
- Breed: Toy Poodle, small, curly BLACK coat (same pose and grooming as the brown poodle in the reference); keep the eyes clearly visible with a lighter rim.
2순위
- Breed: Miniature Schnauzer, salt-and-pepper grey, bushy eyebrows and beard, upright folded ears.
- Breed: Beagle, tricolor (black saddle, tan head, white chest and paws), long floppy ears.
- Breed: Border Collie, medium-large, black and white, half-folded ears, white blaze on the face.
- Breed: French Bulldog, small-medium, cream/fawn coat, big bat ears, flat face.
- Breed: Japanese Spitz, medium, fluffy pure white coat, pointed ears, plumed tail.
- Breed: Labrador Retriever, large, yellow (cream-gold) short coat, floppy ears.
- Breed: Miniature Pinscher, small, black and tan, sleek short coat, upright ears.
- Breed: American Cocker Spaniel, small-medium, buff/golden coat with long wavy ears.
- Breed: Samoyed, large, fluffy white coat, smiling open mouth, upright ears.

## 털이 진한 강아지(검정·진한 갈색)
끝에 한 줄 더: "The fur is dark, so draw the eye area with a slightly lighter ring and a clear white highlight so the eyes stay visible."
(닥스훈트 11/27 — 눈이 털에 묻혀 보였던 것)

## 옆으로 나왔을 때 고쳐 달라기(같은 대화에 이어서)
Redraw this same dog in a straight FRONT VIEW exactly like the attached reference dog: sitting, facing the camera, symmetrical, both front legs side by side, tail curled beside the hip. Keep the coat colors and face. Use smaller pixels and softer fur shading like the reference, dark brown outline instead of black. Plain #CFE3CF background, no sparkle or watermark.
