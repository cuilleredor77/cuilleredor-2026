const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  await page.goto('file://' + process.argv[2] + '/index.html');
  await page.waitForTimeout(300);
  const sheets = await page.$$('.sheet');
  console.log('sheets found:', sheets.length);
  for (let i = 0; i < sheets.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    await sheets[i].screenshot({ path: `${process.argv[2]}/preview-${n}.png` });
  }
  await browser.close();
})();
