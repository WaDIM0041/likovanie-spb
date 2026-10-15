const assert = require('node:assert/strict');
const {chromium} = require(require.resolve('playwright', {paths: [process.env.PLAYWRIGHT_MODULE_PATH || '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules']}));

(async () => {
  const browser = await chromium.launch({headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const page = await browser.newPage({reducedMotion: 'reduce'});
    await page.goto(process.env.SITE_URL || 'http://127.0.0.1:8000/');
    await page.waitForFunction(() => document.documentElement.dataset.motionEngine === 'framer-motion');
    assert.equal(await page.locator('.motion-toggle').textContent(), 'Остановить фон', 'effects should be enabled by default');
    assert.ok(await page.locator('.hero .stage-beam').evaluateAll(items => items.some(item => item.getAnimations().some(animation => animation.playState === 'running'))), 'stage effects should run by default');
    console.log('motion default: effects are enabled at first load');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
