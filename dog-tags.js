// 주민증 한 줄 소개 태그(2026-11-16, 가르시아가 준 "발칙한 태그 문구" — 3차 기획 문서의 주민증 태그 프리셋). 전역 window.DogTags.
// 주민증 카드의 신호등 띠 아랫줄(기본 문구 "눈으로만 예뻐해 주세요" 등)을 대신한다. 고르지 않으면 기본 문구 그대로.
// 신호등 색에 맞는 것만 고를 수 있다 — 빨강·노랑은 거리두기 안내, 초록은 친화력·성격.
// 원안의 이모지(🚨💛)는 넣지 않는다(11/15 "AI 티 나는 이모지는 뺀다" 결정).
// 이 휴대폰 프로필(petwalk_profile.tag)에만 저장하고 통계로 보내지 않는다.
// 쓰는 곳: start.html(주민증 만들기 2단계·카드 그림), profile.html(프로필에서 바꾸기)
(function () {
  var TAGS = [
    // 거리두기·주의 안내 — 빨강·노랑 신호등
    { id: 'big-dog',     group: 'caution',  text: '낯선 큰 개를 무서워해요. 멀리서 봐 주세요' },
    { id: 'eye-alarm',   group: 'caution',  text: '눈 마주치면 경보 발령 (3m 거리 유지 권장)' },
    { id: 'people-only', group: 'caution',  text: '개친구 사절 (사람만 취급해요)' },
    { id: 'boss',        group: 'caution',  text: '예민보스 출근 중 (지나갈 땐 모른 척해 주세요)' },
    // 친화력·성격 어필 — 초록 신호등
    // 원안 "간식 주면 바로 배 깜" — 모르는 사람이 간식을 주게 만들 수 있어 "쓰다듬으면"으로 바꿈(제안, 가르시아 확인 전)
    { id: 'belly',       group: 'friendly', text: '쓰다듬으면 바로 배 깜 (순둥이)' },
    { id: 'heli',        group: 'friendly', text: '꼬리 헬리콥터 가동 (옷에 발자국 주의)' },
    { id: 'sniffer',     group: 'friendly', text: '냄새 수집가 (전봇대 킁킁장인)' },
    { id: 'shy',         group: 'friendly', text: '소심한 관종 (멀리서만 쳐다봐요)' },
    // 원안은 거리두기 쪽 — 거리 안내가 아니라서 빨강불의 안전 문구를 대신하지 않게 초록에만 둔다
    { id: 'no-home',     group: 'friendly', text: '집에 가기 거부권 행사 중 (길바닥 눕방 주의)' }
  ];

  function groupOf(signal) {
    if (signal === 'green') return 'friendly';
    if (signal === 'yellow' || signal === 'red') return 'caution';
    return null;   // 아직 안 골랐거나 가게 수호견 — 태그 없음
  }
  // 이 신호등에서 고를 수 있는 태그
  function forSignal(signal) {
    var g = groupOf(signal);
    return TAGS.filter(function (t) { return t.group === g; });
  }
  // 프로필에 고른 태그가 지금 신호등에 맞으면 그 문구, 아니면 '' (카드는 기본 문구를 쓴다)
  function lineFor(profile) {
    if (!profile || !profile.tag) return '';
    var g = groupOf(profile.signal);
    for (var i = 0; i < TAGS.length; i++) {
      if (TAGS[i].id === profile.tag && TAGS[i].group === g) return TAGS[i].text;
    }
    return '';
  }
  function fits(tagId, signal) {
    return forSignal(signal).some(function (t) { return t.id === tagId; });
  }

  window.DogTags = { TAGS: TAGS, forSignal: forSignal, lineFor: lineFor, fits: fits };
})();
