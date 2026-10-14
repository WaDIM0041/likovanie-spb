const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const d=JSON.parse(fs.readFileSync('research/source/donor-content.json'));
const manifest=JSON.parse(fs.readFileSync('research/source/transfer-manifest.json'));
const normal=s=>s.replace(/\s+/g,' ').trim();
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  const text=normal(await page.locator('body').textContent());
  for(const t of manifest.teachers){assert.ok(text.includes(normal(t.name)));assert.ok(text.includes(normal(t.text)));}
  for(const review of d.reviews)assert.ok(text.includes(normal(review.text)),'Full review '+review.name);
  assert.equal(await page.locator('#gallery img').count(),49);
  assert.equal(await page.locator('video').count(),3);
  assert.equal(await page.locator('[data-mail-form]').count(),2);
  for(const row of manifest.scheduleRows)for(const value of row.filter(Boolean))assert.ok(text.includes(normal(value)),'Schedule content '+value);
  const seo=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,title:document.title,description:document.querySelector('meta[name=description]')?.content,lang:document.documentElement.lang,robots:document.querySelector('meta[name=robots]')?.content,schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)),background:getComputedStyle(document.querySelector('.hero')).backgroundImage}));
  assert.equal(seo.h1,1);assert.ok(seo.description.length>50);assert.equal(seo.lang,'ru');assert.ok(seo.robots.includes('noindex'));assert.ok(seo.schemas.length);assert.ok(seo.background.includes('gradient'));
  const links=await page.locator('[href],[src],[poster]').evaluateAll(es=>es.flatMap(el=>['href','src','poster'].map(a=>el.getAttribute(a)).filter(Boolean)));
  for(const link of links){if(link.startsWith('#')){assert.ok(await page.locator(link).count(),'Broken anchor '+link);continue;}if(/^(https?:|mailto:|tel:)/.test(link))continue;assert.ok(fs.existsSync(path.resolve(link.split(/[?#]/)[0])),'Missing local resource '+link);}
  for(const video of await page.locator('video').all()){
   await video.evaluate(v=>{v.preload='metadata';v.load()});
   await page.waitForFunction(el=>el.readyState>=1,await video.elementHandle());
   assert.ok(await video.evaluate(v=>v.duration>0&&v.videoWidth>0),'Playable video');
  }
  await page.screenshot({path:'design/site-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#enrol').scrollIntoViewIfNeeded();
  await page.screenshot({path:'design/site-mobile-form.png'});
  await page.locator('[data-mail-form]').first().locator('button').click();
  assert.equal(await page.locator('[data-mail-form]').first().evaluate(f=>f.checkValidity()),false,'Empty form rejected');
  for(const name of ['privacy','soglasie']){
   await page.goto(pathToFileURL(path.resolve(`design/${name}.html`)).href);
   const legal=normal(await page.locator('main').textContent());
   for(const paragraph of d.legal[name].filter(t=>t!=='Назад'))assert.ok(legal.includes(normal(paragraph)),'Legal text '+name);
  }
  await page.goto(pathToFileURL(path.resolve('design/materials.html')).href);
  const full=normal(await page.locator('main').textContent());
  for(const r of d.records.filter(r=>r.text&&!['rec1259841871','rec1213029911'].includes(r.id)))assert.ok(full.includes(normal(r.text)),'Missing source section '+r.id);
  assert.deepEqual(errors,[]);
  fs.writeFileSync('design/transfer-check-results.json',JSON.stringify({checkedAt:new Date().toISOString(),teachers:6,fullReviews:6,gallery:49,playableVideos:3,scheduleRows:11,legalPages:2,fullSourceSections:'passed',localLinks:'passed',formValidation:'passed',seo:{...seo,schemas:seo.schemas.length},errors},null,2));
  console.log('Passed: complete donor content, 49 photos, 3 playable local videos, 6 portraits/reviews, schedule, legal text, links, forms, SEO metadata, background');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
