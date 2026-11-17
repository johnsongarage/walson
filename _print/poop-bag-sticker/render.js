// 스티커 시안 뽑기: 보드 PNG, A4 시험지 PDF, 인쇄소용(재단 여유 1.5mm) PDF·600dpi PNG·칼선 SVG
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const DIR = __dirname, OUT = path.join(DIR, 'out');   // 결과물은 커밋하지 않는다(.gitignore) fs.mkdirSync(OUT, { recursive: true });
const URL = 'file://' + path.join(DIR, 'sticker.html');
(async () => {
  const launch = {};
  if (process.env.HTTPS_PROXY) launch.proxy = { server: process.env.HTTPS_PROXY };
  const browser = await chromium.launch(launch);
  async function open(hash, ctxOpts) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1900, height: 1000 } }, ctxOpts || {}));
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(URL + '#' + hash, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const ok = await page.evaluate(() => document.fonts.check('10px "Black Han Sans"') && document.fonts.check('900 10px "Noto Sans KR"'));
    if (!ok || errs.length) console.log('글꼴/오류 확인', hash, ok, errs);
    return { ctx, page };
  }
  // 1) 보드
  let { ctx, page } = await open('board', { deviceScaleFactor: 1 });
  await page.locator('.board').screenshot({ path: path.join(OUT, 'sticker-board.png') });
  await ctx.close();
  // 2) A4 시험지(벡터 PDF)
  ({ ctx, page } = await open('sheet'));
  await page.pdf({ path: path.join(OUT, 'sticker-test-sheet-A4.pdf'), width: '210mm', height: '297mm', printBackground: true });
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.screenshot({ path: path.join(OUT, 'sticker-test-sheet-A4-preview.png'), fullPage: false });
  await ctx.close();
  // 2-1) 고른 시안(B 노랑, 11/17) 한 가지로 채운 A4 라벨지
  ({ ctx, page } = await open('sheet1=B-yellow'));
  await page.pdf({ path: path.join(OUT, 'sticker-B-yellow-sheet-A4.pdf'), width: '210mm', height: '297mm', printBackground: true });
  await ctx.close();
  // 3) 인쇄소용 한 장씩
  const dims = { A: [25, 25], B: [44, 20], C: [62, 34] };
  for (const key of ['A', 'B', 'C']) {
    for (const pal of ['yellow', 'cream']) {
      const w = dims[key][0] + 3, h = dims[key][1] + 3;
      ({ ctx, page } = await open('single=' + key + '-' + pal, { deviceScaleFactor: 600 / 96 }));
      await page.pdf({ path: path.join(OUT, 'sticker-' + key + '-' + pal + '-print.pdf'), width: w + 'mm', height: h + 'mm', printBackground: true, pageRanges: '1' });
      await page.locator('svg').first().screenshot({ path: path.join(OUT, 'sticker-' + key + '-' + pal + '-600dpi.png'), omitBackground: true });
      await ctx.close();
    }
    // 칼선(재단 여유 포함 같은 판 크기, 실제 자르는 선만)
    ({ ctx, page } = await open('single=' + key + '-yellow'));
    const cutSvg = await page.evaluate((k) => {
      var S = window.STICKER.SHAPES[k], o = window.STICKER.BLEED, W = S.w + 2 * o, H = S.h + 2 * o;
      return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + 'mm" height="' + H + 'mm" viewBox="0 0 ' + W + ' ' + H + '">' +
        '<g fill="none" stroke="#e0007a" stroke-width="0.1">' + S.cut(o) + '</g></svg>';
    }, key);
    fs.writeFileSync(path.join(OUT, 'sticker-' + key + '-cutline.svg'), cutSvg);
    await ctx.close();
  }
  await browser.close();
  console.log(fs.readdirSync(OUT).join('\n'));
})().catch((e) => { console.error(e); process.exit(1); });
