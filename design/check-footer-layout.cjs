const assert = require('node:assert/strict');
const {chromium} = require(require.resolve('playwright', {paths: [process.env.PLAYWRIGHT_MODULE_PATH || '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules']}));

(async () => {
  const browser = await chromium.launch({headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const page = await browser.newPage();
    for (const width of [1440, 390]) {
      await page.setViewportSize({width, height: 844});
      await page.goto(process.env.SITE_URL || 'http://127.0.0.1:8000/');
      await page.locator('.site-credit').scrollIntoViewIfNeeded();
      const position = await page.locator('.site-credit').evaluate(element => {
        const box = element.getBoundingClientRect();
        return {center: box.left + box.width / 2, viewport: innerWidth};
      });
      assert.ok(Math.abs(position.center - position.viewport / 2) < 1, `credit is centered at ${width}px`);
    }
    console.log('footer layout: Anna Kamchatka credit is centered on desktop and mobile');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
