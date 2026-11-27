# 새 도트 강아지 — 제미나이 프롬프트 (2026-11-27)

기존 8마리(icons/dot-dogs)와 같은 느낌으로. 제미나이에 **reference-8.png(기존 8마리 모음)를 함께 첨부**하고,
아래 [공통]을 먼저 붙인 뒤 [견종] 한 줄을 끝에 넣는다. 한 번에 한 마리.

받은 그림은 `_dev/dot-dog-cutout.py`(바탕 지우기) → `_dev/dot-dog-native.py`(점 격자 되돌리기)로 icons/dot-dogs에 넣고,
azit-room.js `DOGS`(맨 뒤에 — 순서는 방 모습 번호라 바꾸지 않음)·`BREED_RULES`에 한 줄.

## [공통]
Pixel art of a single dog, in exactly the same style as the attached reference sheet of 8 pixel-art dogs.
- Full body, sitting, facing the viewer at a slight three-quarter angle (head and chest toward the camera), like the reference dogs.
- Crisp square pixels, no blur, no anti-aliasing, no gradients outside the pixel shading. About 90–130 pixels tall on the pixel grid, then upscaled with nearest-neighbor so each pixel is a clean square.
- One-pixel dark brown outline (#2b1d16) around the whole dog. Soft 3–4 step pixel shading on the fur, warm light from the top left.
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
