const assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_MODULE_PATH||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.SITE_URL||'http://127.0.0.1:8000/');
  await page.waitForFunction(()=>document.documentElement.dataset.motionEngine==='framer-motion');
  const layout=await page.evaluate(()=>({scene:document.querySelector('.hero').getBoundingClientRect().height,photo:document.querySelector('.hero-photo').getBoundingClientRect().height,available:innerHeight-document.querySelector('header').getBoundingClientRect().height}));
  assert.ok(layout.scene<=layout.available,'Mobile scene fits below the sticky header');
  assert.ok(layout.photo>=layout.scene-1,'Mobile photograph fills its scene instead of leaving a tall empty region');
  await page.locator('.hero').evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-document.querySelector('header').getBoundingClientRect().height,behavior:'instant'}));
  const first=await page.locator('.hero-photo img').first().getAttribute('src');
  await page.waitForFunction(src=>document.querySelector('.hero-photo img').getAttribute('src')!==src,first,{timeout:11000});
  await page.locator('.scene-autoplay-toggle').click();
  const paused=await page.locator('.hero-photo img').first().getAttribute('src');
  await page.waitForTimeout(6600);
  assert.equal(await page.locator('.hero-photo img').first().getAttribute('src'),paused,'Pause stops automatic scene changes');
  await page.locator('.hero-scene-picker [data-scene="2"]').click();
  await page.waitForFunction(()=>document.querySelector('.hero-photo img').getAttribute('src').endsWith('091.jpg'));
  await page.locator('.scene-autoplay-toggle').click();
  await page.locator('#contacts').scrollIntoViewIfNeeded();
  const offscreen=await page.locator('.hero-photo img').first().getAttribute('src');
  await page.waitForTimeout(6600);
  assert.equal(await page.locator('.hero-photo img').first().getAttribute('src'),offscreen,'Scenes stop changing offscreen');
  for(const width of [320,390,700]){
   await page.setViewportSize({width,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No mobile overflow');
  }
  const delayed=await browser.newPage({viewport:{width:390,height:844}});
  await delayed.addInitScript(()=>{
   const decode=HTMLImageElement.prototype.decode;
   window.holdScene=true;
   HTMLImageElement.prototype.decode=function(){
    const ready=decode.call(this);
    return window.holdScene&&/\/002\.(?:webp|jpg)$/.test(this.src)?ready.then(()=>new Promise(resolve=>{window.sceneWaiting=true;window.releaseScene=resolve;})):ready;
   };
  });
  await delayed.goto(process.env.SITE_URL||'http://127.0.0.1:8000/');
  await delayed.locator('.hero').evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-document.querySelector('header').getBoundingClientRect().height,behavior:'instant'}));
  await delayed.waitForFunction(()=>window.sceneWaiting,null,{timeout:11000});
  await delayed.locator('.scene-autoplay-toggle').click();
  await delayed.evaluate(()=>{window.holdScene=false;window.releaseScene();});
  await delayed.waitForTimeout(300);
  assert.match(await delayed.locator('.hero-photo img').first().getAttribute('src'),/041\.jpg$/,'Pausing while the next image loads cancels that automatic change');
  await delayed.locator('.hero-scene-picker [data-scene="1"]').click();
  await delayed.locator('.scene-transition-image').waitFor();
  await delayed.emulateMedia({reducedMotion:'reduce'});
  await delayed.waitForFunction(()=>document.documentElement.dataset.motionPreference==='off');
  assert.equal(await delayed.locator('.hero-scene-picker [data-scene="0"]').getAttribute('aria-pressed'),'true','Cancelling a transition restores the selected button to the visible image');
  assert.deepEqual(errors,[]);
  console.log('Passed: compact mobile stage, full photo container, automatic scenes, pause, manual selection, offscreen suspension, mobile overflow');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
