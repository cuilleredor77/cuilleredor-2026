const { chromium } = require('playwright');
(async () => {
  const dir = process.argv[2];
  const style = process.argv[3] || 'c';
  const pagesToShoot = (process.argv[4] || '').split(',').filter(Boolean).map(Number);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  await page.goto('file://' + dir + '/index.html');
  await page.evaluate(async () => { if (document.fonts) { await document.fonts.ready; } });
  await page.evaluate((s) => { document.getElementById('cdo-book').setAttribute('data-style', s); }, style);
  await page.waitForTimeout(300);
  const sheets = await page.$$('.sheet');
  console.log('sheets found:', sheets.length, 'style:', style);
  const indices = pagesToShoot.length ? pagesToShoot : sheets.map((_, i) => i + 1);
  for (const n of indices) {
    const el = sheets[n - 1];
    if (!el) continue;
    await el.screenshot({ path: `${dir}/theme-${style}-${String(n).padStart(2,'0')}.png` });
  }
  await browser.close();
})();
