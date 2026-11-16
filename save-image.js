// 이미지 저장 공통(2026-11-15). 전역 window.WalsonSave.
// 예전 방식(canvas·blob): 휴대폰이면 공유 창, PC면 내려받기 — 공유를 지원하는 PC 브라우저에서 공유 창만 뜨던 문제를 막으려고 휴대폰만 공유.
// 2026-11-16 저장과 공유를 나눔(save·share): 안드로이드 공유 창에는 '사진첩에 저장'이 없어서 "저장·공유" 버튼으로는 저장이 안 됐다.
//   한 화면 편집기(image-editor.js)·키링 파일은 save/share를 쓴다. 기록 내보내기(profile.html)는 예전 방식(blob) 그대로.
// 2026-11-17 리팩토링: 기기 종류(휴대폰·아이폰)와 공유 창은 device.js(WalsonDevice)가 한다 — 이 파일은 그림 저장·내려받기·
//   "길게 눌러 저장" 안내와, 공유 창이 안 될 때 무엇을 할지(내려받기·안내 글)만. 동작은 그대로. 먼저 불러야 하는 것: device.js
(function () {
  // 예전 이름 그대로 둔다(응가 캐릭터 화면 등이 WalsonSave.isMobile을 부른다) — 판단은 device.js
  function isMobile() { return WalsonDevice.isMobile(); }
  function isIOS() { return WalsonDevice.isIOS(); }
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
    if (isMobile() && file && WalsonDevice.canShare({ files: [file] })) {
      WalsonDevice.share({ files: [file] }).catch(function (err) {
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

  // ── 저장과 공유를 따로(2026-11-16 가르시아 "저장과 공유는 분리해줘") — 한 화면 편집기(image-editor.js)가 쓴다 ──
  // 저장: 안드로이드·PC는 파일로 내려받기(갤러리·다운로드 폴더). 아이폰·아이패드는 내려받으면 '파일' 앱으로 가서 사진 앱에 안 보이므로,
  //       그림을 크게 띄우고 "길게 눌러 사진 앱에 저장"을 안내한다.
  // 공유: 공유 창(카톡·인스타 등). 공유 창을 못 여는 브라우저(대부분의 PC, 일부 앱 안 브라우저)에서는 공유 버튼을 숨긴다(canShare).
  // 그림 파일을 공유 창에 넘길 수 있다고 브라우저가 답하는지(편집기의 [공유] 버튼을 보일지)
  function canShare() {
    try {
      if (!WalsonDevice.canShare() || typeof File !== 'function') return false;
      return !!WalsonDevice.canShare({ files: [new File([new Blob(['x'], { type: 'image/png' })], 'a.png', { type: 'image/png' })] });
    } catch (e) { return false; }
  }
  function longPress(c) {
    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:6000;background:rgba(20,14,10,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px;' +
      'font-family:Pretendard,-apple-system,"Apple SD Gothic Neo",sans-serif;color:#fff;text-align:center;';
    var img = document.createElement('img');
    img.src = c.toDataURL('image/png'); img.alt = '저장할 그림';
    img.style.cssText = 'max-width:100%;max-height:66vh;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.5);-webkit-touch-callout:default;';
    var tip = document.createElement('p');
    tip.style.cssText = 'margin:0;font-size:15px;font-weight:800;line-height:1.5;word-break:keep-all;';
    tip.textContent = '그림을 꾹 누르고 "사진 앱에 저장"(또는 "이미지 저장")을 누르세요';
    var tip2 = document.createElement('p');
    tip2.style.cssText = 'margin:-6px 0 0;font-size:12.5px;font-weight:600;line-height:1.5;color:rgba(255,255,255,.72);word-break:keep-all;';
    tip2.textContent = '메뉴가 안 나오면 닫고 [공유] → "이미지 저장"으로도 돼요';
    var x = document.createElement('button');
    x.type = 'button'; x.textContent = '닫기';
    x.style.cssText = 'border:none;border-radius:999px;padding:11px 26px;background:#fff;color:#2b231e;font:800 15px Pretendard,-apple-system,sans-serif;cursor:pointer;';
    x.addEventListener('click', function () { box.remove(); });
    box.appendChild(img); box.appendChild(tip); if (canShare()) box.appendChild(tip2); box.appendChild(x);
    document.body.appendChild(box);
  }
  function save(c, fileName) {
    if (isIOS()) { longPress(c); return; }
    c.toBlob(function (b) { if (b) download(b, fileName); }, 'image/png');
  }
  // 그림 → 파일을 바로(동기) 만든다. toBlob을 기다리면 아이폰 사파리가 "누른 직후"가 아니라며 공유 창을 막을 수 있어서.
  function fileOf(c, fileName) {
    var url = c.toDataURL('image/png'), bin = atob(url.slice(url.indexOf(',') + 1)), n = bin.length, u8 = new Uint8Array(n);
    for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    return new File([u8], fileName, { type: 'image/png' });
  }
  function share(c, fileName) {
    var file = null;
    try { file = fileOf(c, fileName); } catch (e) { file = null; }
    // 공유 창이 있고 브라우저가 이 그림을 거절하지 않으면(미리 답하지 못하는 브라우저는 일단 해 본다 — canShare가 null)
    var ok = false;
    try { ok = !!(file && WalsonDevice.canShare() && WalsonDevice.canShare({ files: [file] }) !== false); } catch (e) { ok = false; }
    if (!ok) { alert('이 브라우저에서는 바로 공유할 수 없어요. [저장]한 뒤 보내 주세요.'); return; }
    WalsonDevice.share({ files: [file] }).catch(function (err) {
      if (err && err.name === 'AbortError') return;   // 사용자가 닫음
      alert('공유 창을 열지 못했어요. [저장]한 뒤 보내 주세요.');
    });
  }

  window.WalsonSave = { canvas: canvas, blob: blob, download: download, isMobile: isMobile, label: label,
    save: save, share: share, canShare: canShare, isIOS: isIOS };
})();
