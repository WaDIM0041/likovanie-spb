const assert = require('node:assert/strict');
const {chromium} = require(require.resolve('playwright', {paths: [process.env.PLAYWRIGHT_MODULE_PATH || '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
(async () => {
  const browser = await chromium.launch({headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 900}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.SITE_URL || 'http://127.0.0.1:8000/');
    const canvas = page.locator('.ribbon-canvas');
    await canvas.waitFor({timeout: 5000});
    const pixels = () => canvas.evaluate(el => el.toDataURL());
    const first = await pixels();
    await page.waitForFunction(before => document.querySelector('.ribbon-canvas').toDataURL() !== before, first);
    await page.locator('.ribbon-toggle').click();
    assert.equal(await page.locator('.ribbon-toggle').getAttribute('aria-pressed'), 'true');
    const paused = await pixels();
    await page.waitForTimeout(200);
    assert.equal(await pixels(), paused, 'Pause freezes the canvas');
    await page.locator('.ribbon-toggle').click();
    await page.waitForFunction(before => document.querySelector('.ribbon-canvas').toDataURL() !== before, paused);
    await page.locator('.ribbon-gesture').click();
    await page.locator('#contacts').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.ribbon-scene').dataset.ribbonState === 'paused');
    const offscreen = await pixels();
    await page.waitForTimeout(200);
    assert.equal(await pixels(), offscreen, 'Offscreen scene stops rendering');
    await page.evaluate(() => scrollTo({top: 0, behavior: 'instant'}));
    await page.waitForFunction(() => document.querySelector('.ribbon-scene').dataset.ribbonState === 'playing');
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.waitForFunction(() => document.querySelector('.ribbon-scene').dataset.ribbonState === 'paused');
    const reduced = await pixels();
    await page.waitForTimeout(200);
    assert.equal(await pixels(), reduced, 'Reduced motion leaves a still sculpture');
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({width, height: 900});
      await page.waitForFunction(() => document.querySelector('.ribbon-canvas').width > 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}px`);
      assert.ok(await canvas.evaluate(el => el.getBoundingClientRect().top < innerHeight), `The visual is visible immediately at ${width}px`);
    }
    const mobile = await browser.newPage({viewport: {width:390,height:844},isMobile:true,hasTouch:true});
    mobile.on('pageerror', error => errors.push(error.message));
    await mobile.goto(process.env.SITE_URL || 'http://127.0.0.1:8000/');
    await mobile.locator('.ribbon-toggle').click();
    const box = await mobile.locator('.ribbon-canvas').boundingBox();
    const touch = await mobile.context().newCDPSession(mobile);
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await touch.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x,y}]});
    for (const dy of [20,50,90,125]) {
      await touch.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x,y:y-dy}]});
      await mobile.waitForTimeout(20);
    }
    await touch.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
    assert.ok(await mobile.evaluate(() => scrollY > 0), 'The canvas allows touch scrolling');
    assert.equal(await mobile.locator('.ribbon-toggle').getAttribute('aria-pressed'), 'true', 'A swipe must not resume a paused ribbon');
    await mobile.locator('.ribbon-gesture').tap();
    assert.equal(await mobile.locator('.ribbon-toggle').getAttribute('aria-pressed'), 'false', 'A deliberate gesture resumes the ribbon');
    assert.deepEqual(errors, []);
    console.log('Passed: immediate ribbon movement, pause/resume, interaction, offscreen suspension, reduced motion, responsive first screen');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
