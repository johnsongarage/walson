// 뱃지 시안 찍기(2026-11-18) — 저장소 맨 위에서 정적 서버(포트 5181)를 띄운 뒤: node _print/badge/render.js
// out/badge-<이름>.png(600dpi, 재단 70mm), out/badge-<이름>-guides.png(확인용 선), out/badges-A4.pdf(실제 크기)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:5181/_print/badge/badge.html';
// 11/16 가르시아가 고른 두 가지 색 방식 그대로 — 노랑(노랑+갈색)·핑크(핑크+검정), 글자 있음·없음. 세 색 판(눈 흰자 크림)은 고를 거리로 하나 더
const SET = [
  ['yellow-text', { bg: '#f2b733', ink: '#361e12', text: 1 }],
  ['yellow', { bg: '#f2b733', ink: '#361e12' }],
  ['pink-text', { bg: '#ff9ab8', ink: '#161616', text: 1 }],
  ['pink', { bg: '#ff9ab8', ink: '#161616' }],
  ['yellow-cream-text', { bg: '#f2b733', ink: '#361e12', text: 1, cream: 1 }],
  ['yellow-cream', { bg: '#f2b733', ink: '#361e12', cream: 1 }]
].concat(JSON.parse(process.env.EXTRA || '[]'));
(async () => {
  const launch = {};
  if (process.env.HTTPS_PROXY) launch.proxy = { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' };
  const browser = await chromium.launch(launch);
  const page = await browser.newPage({ viewport: { width: 1654, height: 1654 }, deviceScaleFactor: 1 });
  for (const [name, o] of SET) {
    for (const guides of [0, 1]) {
      const qs = new URLSearchParams(Object.assign({}, o, guides ? { guides: 1 } : {})).toString();
      await page.goto(BASE + '?' + qs, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(OUT, 'badge-' + name + (guides ? '-guides' : '') + '.png') });
    }
    console.log('ok', name);
  }
  // A4 한 장에 실제 크기(지름 70mm)로 — 뱃지 집에 보낼 때(가이드 선 없음)
  const names = SET.filter((s) => !s[1].mask).map((s) => s[0]);
  const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}body{margin:0}' +
    '.p{width:210mm;height:297mm;display:flex;flex-wrap:wrap;align-content:flex-start;gap:6mm;padding:12mm;box-sizing:border-box}' +
    '.p img{width:70mm;height:70mm;border-radius:50%}</style></head><body><div class="p">' +
    names.map((n) => '<img src="file://' + path.join(OUT, 'badge-' + n + '.png') + '">').join('') + '</div></body></html>';
  fs.writeFileSync(path.join(OUT, 'sheet.html'), html);
  await page.goto('file://' + path.join(OUT, 'sheet.html'));
  await page.waitForTimeout(300);
  await page.pdf({ path: path.join(OUT, 'badges-A4.pdf'), format: 'A4', printBackground: true });
  console.log('pdf ok');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
