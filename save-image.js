// 이미지 저장 공통(2026-11-15). 전역 window.WalsonSave.
// 휴대폰: 공유 창(사진 앱에 저장·카톡·인스타로 바로 보내기). PC: 파일로 내려받기.
// 예전에는 공유가 되면 무조건 공유 창을 띄워서, 공유를 지원하는 PC 브라우저(윈도우·맥 크롬, 맥 사파리)에서는
// 파일이 저장되지 않고 공유 창만 떴다 — 그래서 휴대폰일 때만 공유한다.
// 쓰는 곳: start.html(주민증), walk-type.html(유형 결과), walk-history.html(산책 영수증), month-report.js(월간 리포트)
(function () {
  function isMobile() {
    var ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
    // 아이패드 사파리는 맥처럼 보인다 — 터치가 있으면 휴대 기기로 본다
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
    return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches);
  }
  function canShareFile(file) {
    try { return !!(navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { return false; }
  }
  function download(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  // 휴대폰이면 공유 창, 아니면(또는 공유가 안 되면) 내려받기. 공유 창에서 오류가 나면 내려받기로.
  function blob(b, fileName) {
    if (!b) return;
    var file = null;
    try { file = new File([b], fileName, { type: b.type || 'image/png' }); } catch (e) { file = null; }
    if (isMobile() && file && canShareFile(file)) {
      navigator.share({ files: [file] }).catch(function (err) {
        if (err && err.name === 'AbortError') return;   // 사용자가 닫음
        download(b, fileName);
      });
      return;
    }
    download(b, fileName);
  }
  function canvas(c, fileName) {
    c.toBlob(function (b) { blob(b, fileName); }, 'image/png');
  }
  // 버튼 글자: 휴대폰 "저장·공유", PC "이미지 저장"
  function label() { return isMobile() ? '저장·공유' : '이미지 저장'; }

  window.WalsonSave = { canvas: canvas, blob: blob, download: download, isMobile: isMobile, label: label };
})();
