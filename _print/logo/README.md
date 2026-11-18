# 왈슨 로고 (2026-11-18 ~ 짖는 얼굴)

가르시아가 준 그림(`walson-face-src.png`, 흰 바탕 2048px)을 앱 로고로 쓴다. 예전 로고(이를 드러낸 선 그림, 노랑 바탕)는
뱃지 후기 "멀리서 보면 알아보기 힘들다"(눈) 때문에 바꿈 — 반응을 보고 확정(가르시아). 예전 그림은 git 기록에 있다.

- `walson-face.png` — 바깥 흰 바탕만 뗀 투명 원본(얼굴 안 크림색 눈·이빨은 그대로). 인쇄·굿즈는 이걸 쓴다.
- `make-logo.py` — 원본 → 앱 그림 전부를 다시 만든다: `python3 _print/logo/make-logo.py`(저장소 맨 위에서)
  - `icons/walson-logo.webp` 900×732 투명 — 시작 화면·소개·포스터·전단·제안서·카운터 QR·영수증(사진 없는 산책)
  - `icons/icon-192.png`·`icon-512.png`(크림 바탕 둥근 네모), `icon-maskable-512.png`(꽉 찬 크림, 얼굴 70% — 안드로이드 모양 자르기 안전 영역),
    `apple-touch-icon.png`(180 꽉 찬 크림) — 바탕색은 맨 위 `CREAM` 한 줄
  - `icons/sample-walson.jpg` — 샘플 강아지(왈슨) 사진, 크림 바탕
  - 다시 만들면 화면들의 `icon-192.png?v=`·`apple-touch-icon.png?v=`와 `manifest.json` 아이콘 `?v=`를 올린다.
- `og.html` — 카톡 미리보기 그림 `og/walson-og.png`(1600×800) 판. 홍보 그림이라 필수 두 줄(APP WALSON · 당신과 강아지의 유의미한 산책)을
  `site-config.js` brand에서 불러 넣는다. 저장소 맨 위에서 정적 서버를 띄우고 `/_print/logo/og.html`을 1600×800으로 찍은 뒤
  128색으로 줄여 저장(약 250KB). 바꾸면 화면들의 `og/walson-og.png?v=` 번호를 올린다(카톡이 예전 그림을 오래 기억함).

## 확인할 것

- 생성 도구로 만든 그림이면 그 도구의 상업적 이용 조건. AI가 만든 그림은 저작권 보호를 받기 어려울 수 있어 로고로 오래 쓰려면 상표 등록을 같이 검토.
- 웃는 표정 버전(가르시아 "만들어 둬야 할 것 같다") — 생기면 같은 방법으로 `walson-face-smile.png`를 만들어 둔다.
- 이미 만든 뱃지는 예전 로고 그대로.
