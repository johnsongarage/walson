# 새 도트 강아지 — 제미나이 프롬프트 (2026-11-27)

기존 8마리(icons/dot-dogs)와 같은 느낌으로. 제미나이에 **정면 강아지 한 장을 첨부**하고(체형 비슷한 쪽 — 대형·귀 선 개 ref-jindo, 중형 ref-shiba, 소형 털복숭이 ref-maltese·ref-poodle, 소형 단모 ref-chihuahua)
(11/27 8마리 모음을 붙였더니 비스듬한 옆모습·굵은 점으로 나옴 — "three-quarter"를 옆으로 읽음),
아래 [공통]을 먼저 붙인 뒤 [견종] 한 줄을 끝에 넣는다. 한 번에 한 마리.

받은 그림은 `_dev/dot-dog-cutout.py`(바탕 지우기) → `_dev/dot-dog-native.py`(점 격자 되돌리기)로 icons/dot-dogs에 넣고,
azit-room.js `DOGS`(맨 뒤에 — 순서는 방 모습 번호라 바꾸지 않음)·`BREED_RULES`에 한 줄.

## [공통]
Draw ONE dog as pixel art, matching the attached reference dog image as closely as possible in style, angle, pixel size and shading. Only the breed and coat change.

POSE (most important):
- FRONT VIEW, exactly like the reference: the dog sits and looks straight at the viewer.
- Perfectly symmetrical: face, chest and both front legs point straight at the camera, front paws side by side.
- Both eyes and both ears fully visible and at the same height. The body is NOT turned to the side, NOT three-quarter, NOT profile.
- The tail is visible beside the hip.

STYLE:
- Crisp square pixels, no blur, no anti-aliasing. Small pixels: the dog is about 120–180 pixels tall on the pixel grid (same density as the reference), upscaled with nearest-neighbor.
- Dark brown outline (#2b1d16), one pixel thick — not pure black, not chunky.
- Soft 4–5 step fur shading with visible fur texture, warm light from the top left, like the reference.
- Big round dark eyes, each with one small white highlight, small shiny nose, gentle friendly face.
- Realistic breed proportions, head slightly bigger to look cute — not chibi, not flat cartoon.

DO NOT:
- No clothes, collar, bandana or accessories. No text, logo, sparkle or watermark. No ground shadow, no props.

CANVAS:
- Background is one flat solid color #CFE3CF (light sage green), nothing else.
- Dog centered with small even margins. Do not crop ears, tail or paws.

BREED:
(아래 견종 줄 하나를 여기 붙인다)

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
