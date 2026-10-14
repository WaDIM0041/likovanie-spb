const assert = require('node:assert/strict');
const {chromium} = require(require.resolve('playwright', {paths: [process.env.PLAYWRIGHT_MODULE_PATH || '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
(async () => {
  const browser = await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  try {
    for (const width of [1440,768,390,320]) {
      const page = await browser.newPage({viewport:{width,height:width < 700 ? 844 : 900}});
      await page.goto(process.env.SITE_URL || 'http://127.0.0.1:8000/');
      await page.waitForFunction(() => document.documentElement.dataset.motionEngine === 'framer-motion');
      const sceneTop = await page.locator('.hero').evaluate(el => el.getBoundingClientRect().top + scrollY);
      await page.evaluate(top => scrollTo({top:top - innerHeight * .8,behavior:'instant'}), sceneTop);
      await page.waitForFunction(() => {
        const el = document.querySelector('.stage-curtain-left');
        return -new DOMMatrix(getComputedStyle(el).transform).m41 / el.getBoundingClientRect().width > .55;
      }, null, {timeout:5000});
      await page.evaluate(({top,position}) => scrollTo({top:top - innerHeight * position,behavior:'instant'}), {top:sceneTop,position:width < 700 ? .7 : .5});
      await page.waitForFunction(() => {
        const el = document.querySelector('.stage-curtain-left');
        return -new DOMMatrix(getComputedStyle(el).transform).m41 / el.getBoundingClientRect().width >= .99;
      }, null, {timeout:5000});
      assert.ok(await page.locator('.hero').evaluate(el => el.getBoundingClientRect().bottom > innerHeight), `Curtains open before the whole photo is visible at ${width}px`);
      await page.close();
    }
    console.log('Passed: curtain opens on viewport entry and fully reveals while the photo is still entering at desktop and mobile widths');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
