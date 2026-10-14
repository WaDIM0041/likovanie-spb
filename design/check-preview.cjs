const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const results=[];
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:900});
  await page.goto(require('url').pathToFileURL(require('path').resolve('design/index.html')).href);
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode()})));
  const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),h1:document.querySelectorAll('h1').length}));
  await page.locator('[data-age="4"]').click();
  await page.waitForFunction(()=>document.getElementById('program-title').textContent==='Танцевать для себя');
  const adult=await page.locator('#program-title').textContent();
  await page.locator('[data-age="0"]').click();
  await page.waitForFunction(()=>document.getElementById('program-title').textContent==='Движение начинается с игры');
  const pressed=await page.locator('[aria-pressed="true"]').count();
  if(layout.scrollWidth>width||!layout.images||layout.h1!==1||adult!=='Танцевать для себя'||pressed!==1)throw Error(JSON.stringify({layout,adult,pressed}));
  if(width===1440||width===390){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`design/preview-${width}.png`,fullPage:true});}
  results.push({width,layout,ageSwitch:'passed'});
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 const reduced=await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior);
 if(reduced!=='auto'||errors.length)throw Error(JSON.stringify({reduced,errors}));
 fs.writeFileSync('design/check-results.json',JSON.stringify({checkedAt:new Date().toISOString(),results,reducedMotion:reduced,errors},null,2));
 await browser.close();console.log('Passed: 1440, 768, 390, 320px; images, overflow, age selection, reduced motion, JS errors');
})().catch(e=>{console.error(e);process.exit(1)});
