const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  await page.goto('file://' + process.argv[2] + '/index.html');
  await page.waitForTimeout(300);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: process.argv[2] + '/Cuillere-dOr-Catalogue-2027-2028.pdf',
    printBackground: true,
    width: '210mm',
    height: '297mm',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await browser.close();
  console.log('done');
})();
