# three.js r160 (MIT)

- 출처: npm `three@0.160.0` (https://registry.npmjs.org/three/-/three-0.160.0.tgz) — 2026-11-22 3D 키링 시안(keyring-3d-sample.html)용.
- `three.module.min.js`: `build/three.module.min.js` 그대로.
- `OrbitControls.js`(examples/jsm/controls), `RoomEnvironment.js`(examples/jsm/environments): 원본에서 `from 'three'`만 `from './three.module.min.js'`로 바꿨다(import map 없이 쓰려고).
- 0.160을 쓴 까닭: 그 뒤 판(0.17x~)은 압축본 없이 두 파일 2MB가 넘어 휴대폰에서 무겁다.
- 라이선스: 같은 폴더 LICENSE.
