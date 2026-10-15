const assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_MODULE_PATH||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.SITE_URL||'http://127.0.0.1:8000/');
  await page.locator('.depth-layer').first().waitFor({timeout:20000});
  const before=await page.locator('.depth-layer').first().evaluate(e=>getComputedStyle(e).transform);
  await page.evaluate(()=>scrollTo({top:170,behavior:'instant'}));
  await page.waitForFunction(t=>getComputedStyle(document.querySelector('.depth-layer')).transform!==t,before);
  await page.waitForFunction(()=>document.querySelector('.ribbon-scene').dataset.ribbonRenderer==='three',null,{timeout:20000});
  await page.locator('.ribbon-toggle').click();
  const still=await page.locator('.ribbon-canvas').evaluate(c=>c.toDataURL());
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.ribbon-canvas').evaluate(c=>c.toDataURL()),still,'Actual WebGL pauses without further drawing');
  await page.locator('.ribbon-toggle').click();
  await page.waitForFunction(before=>document.querySelector('.ribbon-canvas').toDataURL()!==before,still);
  await page.locator('.ribbon-canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForFunction(()=>document.querySelector('.ribbon-scene').dataset.ribbonRenderer==='canvas');
  assert.ok(await page.locator('.hero-scene-picker button').first().evaluate(e=>getComputedStyle(e).backdropFilter!=='none'),'Scene controls use frosted glass');
  await page.locator('.living-frame').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>{const v=document.querySelector('.living-frame video');return !v.paused&&v.currentTime>0;});
  await page.locator('.living-toggle').click();assert.ok(await page.locator('.living-frame video').evaluate(v=>v.paused));
  await page.locator('.living-toggle').click();await page.waitForFunction(()=>!document.querySelector('.living-frame video').paused);
  const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:get.call(this,type,...args);};});
  await fallback.goto(process.env.SITE_URL||'http://127.0.0.1:8000/');await fallback.waitForTimeout(1600);
  assert.equal(await fallback.locator('.ribbon-scene').getAttribute('data-ribbon-renderer'),'canvas','No WebGL keeps the immediate Canvas scene');
  for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No overflow in the dynamic mobile grid');}
  assert.deepEqual(errors,[]);console.log('Passed: layered scroll depth, real Three.js renderer, glass controls, living frame playback/pause, Canvas fallback and mobile grid');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
