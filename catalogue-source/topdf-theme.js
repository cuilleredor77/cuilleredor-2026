const { chromium } = require('playwright');
(async () => {
  const dir = process.argv[2];
  const style = process.argv[3] || 'c';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  await page.goto('file://' + dir + '/index.html');
  await page.evaluate(async () => { if (document.fonts) { await document.fonts.ready; } });
  await page.evaluate((s) => { document.getElementById('cdo-book').setAttribute('data-style', s); }, style);
  await page.waitForTimeout(300);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: `${dir}/Cuillere-dOr-Catalogue-Charte-${style.toUpperCase()}.pdf`,
    printBackground: true,
    width: '210mm',
    height: '297mm',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await browser.close();
  console.log('done', style);
})();
