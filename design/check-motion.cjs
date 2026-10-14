const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(require('url').pathToFileURL(require('path').resolve('design/index.html')).href);
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.motionEngine),'framer-motion');
 const entrance=await page.locator('h1').evaluate(el=>({opacity:Number(getComputedStyle(el).opacity),transform:getComputedStyle(el).transform}));
 assert.ok(entrance.opacity<1||entrance.transform!=='none','Entrance must visibly animate');
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('h1')).opacity)===1);
 await page.locator('[data-age="4"]').click();
 await page.locator('[data-age="2"]').click();
 await page.locator('[data-age="1"]').click();
 await page.waitForFunction(()=>document.getElementById('program-title').textContent==='Почувствовать ритм');
 await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.program-detail > div')).opacity)===1);
 await page.locator('[data-age="4"]').click();
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>document.getElementById('program-title').textContent==='Танцевать для себя');
 const reduced=await page.locator('[data-motion]').evaluateAll(els=>els.every(el=>getComputedStyle(el).transform==='none'&&Number(getComputedStyle(el).opacity)===1));
 assert.equal(reduced,true);
 await page.locator('[data-age="2"]').click();
 assert.equal(await page.locator('#program-title').textContent(),'Основа для большого пути');
 assert.deepEqual(errors,[]);
 fs.writeFileSync('design/motion-check-results.json',JSON.stringify({checkedAt:new Date().toISOString(),engine:'framer-motion',entrance,rapidSelection:'passed',reducedMotionLiveSwitch:'passed',reducedMotionSelection:'passed',errors},null,2));
 console.log('Passed: actual Framer Motion entrance, rapid selection, live reduced-motion switch, immediate reduced-motion selection');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
