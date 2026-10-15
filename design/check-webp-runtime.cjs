const assert = require('node:assert/strict');
const {chromium} = require(require.resolve('playwright', {paths: [process.env.PLAYWRIGHT_MODULE_PATH || '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules']}));

(async () => {
  const browser = await chromium.launch({headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.SITE_URL || 'http://127.0.0.1:8000/');
    await page.waitForFunction(() => document.documentElement.dataset.motionEngine === 'framer-motion');

    const hero = page.locator('.hero-photo img');
    await hero.evaluate(image => image.decode());
    assert.match(await hero.evaluate(image => image.currentSrc), /041\.webp$/, 'the initial hero should use WebP');

    await page.locator('.hero-scene-picker [data-scene="2"]').click();
    await page.waitForFunction(() => document.querySelector('.hero-photo img').currentSrc.endsWith('/091.webp'));
    assert.deepEqual(errors, []);
    console.log('Passed: browser selects WebP for the initial and switched hero scenes');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
