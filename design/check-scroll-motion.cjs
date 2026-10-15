const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(require.resolve('playwright', {
  paths: [process.env.PLAYWRIGHT_MODULE_PATH || '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules']
}));
(async () => {
  const browser = await chromium.launch({headless: true,
    ...(fs.existsSync('/usr/bin/chromium') ? {executablePath: '/usr/bin/chromium', args: ['--no-sandbox']} : {})});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 900}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.SITE_URL || 'http://127.0.0.1:8000/');
    await page.waitForFunction(() => document.documentElement.dataset.motionEngine === 'framer-motion');
    assert.ok(await page.locator('.stage-banner').evaluate(el => el.nextElementSibling.classList.contains('hero')), 'The main banner comes before the curtained stage scene');
    assert.equal(await page.locator('.stage-banner h1').count(), 1, 'The main headline sits in its own banner above the stage');
    assert.equal(await page.locator('.hero h1').count(), 0, 'The curtain scene is visually separate from the main banner');
    assert.ok(await page.locator('.hero-photo').evaluate(el => el.getBoundingClientRect().width >= document.querySelector('.hero').getBoundingClientRect().width - 1), 'The stage photograph fills the hero, instead of a conventional two-column card');
    assert.equal(await page.locator('.stage-curtain').count(), 2, 'The opening photograph is framed by animated stage curtains');
    await page.waitForFunction(() => {
      const el = document.querySelector('.stage-curtain-left');
      return -new DOMMatrix(getComputedStyle(el).transform).m41 / el.getBoundingClientRect().width >= .99;
    }, null, {timeout: 7000});
    const stageEntry = await page.evaluate(() => document.querySelector('.hero').getBoundingClientRect().top + scrollY - document.querySelector('header').getBoundingClientRect().height + 40);
    await page.evaluate(top => scrollTo({top, behavior: 'instant'}), stageEntry);
    await page.locator('.hero-photo').hover({position: {x: 1200, y: 500}});
    assert.ok(await page.locator('.hero-photo img').evaluate(el => getComputedStyle(el).filter !== 'none'), 'The opening photo responds visibly to pointer hover');
    await page.locator('.stage-banner h1').hover();
    assert.ok(await page.locator('.stage-banner h1').evaluate(el => getComputedStyle(el).textShadow !== 'none'), 'Hero lettering responds visibly to pointer hover');
    assert.equal(await page.locator('.hero-scene-picker button').count(), 3, 'Visitors can explicitly change the opening scene');
    assert.match(await page.locator('.hero-photo img').getAttribute('src'), /041\.jpg$/);
    await page.locator('.hero-scene-picker [data-scene="1"]').click();
    await page.waitForFunction(() => document.querySelectorAll('.hero-photo .scene-transition-image').length === 1);
    assert.ok(await page.locator('.scene-transition-image').evaluate(el => el.getAnimations().some(a => a.playState === 'running')), 'A new scene overlaps and fades in above the current photo');
    await page.waitForFunction(() => document.querySelector('.hero-photo img').getAttribute('src').endsWith('002.jpg'));
    assert.match(await page.locator('.hero-photo img').getAttribute('src'), /002\.jpg$/, 'Scene control switches to a real rehearsal photograph');
    assert.equal(await page.locator('.hero-scene-picker [aria-pressed="true"]').count(), 1);
    await page.locator('.hero-scene-picker [data-scene="2"]').click();
    await page.waitForFunction(() => document.querySelector('.hero-photo img').getAttribute('src').endsWith('091.jpg'));
    assert.match(await page.locator('.hero-photo img').getAttribute('src'), /091\.jpg$/, 'Scene control switches to a real ensemble photograph');
    await page.locator('.hero-scene-picker [data-scene="0"]').click();
    await page.waitForFunction(() => document.querySelector('.hero-photo img').getAttribute('src').endsWith('041.jpg'));
    assert.equal(await page.locator('.stage-marquee').count(), 1, 'A moving typographic scene connects the hero to the story');
    assert.ok(await page.locator('.stage-marquee-track > span').first().evaluate(el => el.getBoundingClientRect().width >= innerWidth), 'Each marquee sequence fills the viewport without a loop-end gap');
    assert.ok(await page.locator('.stage-beam').count() >= 2, 'Visible moving stage lights are required');
    const beam = page.locator('.hero .stage-beam').first();
    const initial = await beam.evaluate(el => getComputedStyle(el).transform);
    await page.waitForFunction(({initial}) => getComputedStyle(document.querySelector('.hero .stage-beam')).transform !== initial, {initial});
    await page.locator('.motion-toggle').click();
    assert.equal(await page.locator('.motion-toggle').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.stage-beam').evaluateAll(els => els.flatMap(el => el.getAnimations()).filter(a => a.playState === 'running').length), 0, 'Background pause stops movement');
    await page.locator('.motion-toggle').click();
    assert.ok(await beam.evaluate(el => el.getAnimations().some(a => a.playState === 'running')), 'Background resumes');
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('h1')).opacity) === 1);
    const revealPoint = stageEntry + 160;
    await page.evaluate(top => scrollTo({top, behavior: 'instant'}), revealPoint);
    assert.ok(await page.locator('.stage-curtain-left').evaluate(el =>
      -new DOMMatrix(getComputedStyle(el).transform).m41 / el.getBoundingClientRect().width >= .99),
    'Published automatic curtain remains open while scrolling');
    const parallaxPoint = await page.evaluate(() => document.querySelector('.hero').getBoundingClientRect().top + scrollY - document.querySelector('header').getBoundingClientRect().height + 350);
    await page.evaluate(top => scrollTo({top, behavior: 'instant'}), parallaxPoint);
    await page.waitForFunction(() => {
      const t = new DOMMatrix(getComputedStyle(document.querySelector('.hero-photo')).transform);
      return t.m42 > 30;
    });
    assert.ok(await page.locator('.scroll-progress').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m11 > 0), 'Scroll progress follows document');
    await page.locator('.teacher-grid').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('.teacher-grid article')].some(el => el.getAnimations().some(a => a.playState === 'running')), null, {timeout: 3000});
    await page.evaluate(() => {
      dispatchEvent(new PageTransitionEvent('pagehide', {persisted: true}));
      dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}));
    });
    assert.ok(await beam.evaluate(el => el.getAnimations().some(a => a.playState === 'running')), 'Returning to a cached page restarts background movement');
    await page.emulateMedia({reducedMotion: 'reduce'});
    assert.equal(await page.locator('[data-motion]').evaluateAll(els => els.every(el => Number(getComputedStyle(el).opacity) === 1 && getComputedStyle(el).transform === 'none')), true, 'Reduced motion restores content');
    await page.waitForFunction(() => document.querySelectorAll('.stage-beam').length === [...document.querySelectorAll('.stage-beam')].filter(el => el.getAnimations().every(a => a.playState !== 'running')).length, null, {timeout: 3000});
    assert.equal(await page.locator('.stage-beam').evaluateAll(els => els.flatMap(el => el.getAnimations()).filter(a => a.playState === 'running').length), 0);
    for (const width of [390, 320]) {
      await page.setViewportSize({width, height: 844});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    }
    await page.evaluate(() => scrollTo({top: 0, behavior: 'instant'}));
    await page.locator('.motion-toggle').click();
    await page.waitForFunction(() => document.querySelector('.hero .stage-beam').getAnimations().some(a => a.playState === 'running'));
    assert.equal(await page.locator('.motion-toggle').textContent(), 'Остановить фон', 'The visitor can explicitly enable movement when the system reduces it');
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.evaluate(() => scrollTo({top: 0, behavior: 'instant'}));
    await page.waitForFunction(() => document.querySelector('.hero .stage-beam').getAnimations().some(a => a.playState === 'running'));
    assert.deepEqual(errors, []);
    console.log('Passed: moving background, pause/resume, scroll parallax, section reveal, progress, reduced motion, mobile overflow, JS errors');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
