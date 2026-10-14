const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const {chromium}=require(require.resolve('playwright',{paths:['C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
 const page=await browser.newPage();
 await page.route('https://**/*',route=>route.abort());
 await page.goto(pathToFileURL(path.resolve('research/source/home-current.html')).href,{waitUntil:'domcontentloaded'});
 const data=await page.evaluate(()=>{
  document.querySelectorAll('script,style').forEach(e=>e.remove());
  const records=[...document.querySelectorAll('.t-rec')].map(r=>({id:r.id,text:r.textContent.replace(/\s+/g,' ').trim(),atoms:[...r.querySelectorAll('.tn-atom')].map(a=>({text:a.textContent.trim(),url:a.getAttribute('data-original')||a.querySelector('img')?.getAttribute('data-original')||a.style.backgroundImage.match(/https:[^"')]+/)?.[0],top:a.closest('.t396__elem')?.getAttribute('data-field-top-value'),left:a.closest('.t396__elem')?.getAttribute('data-field-left-value')})),images:[...r.querySelectorAll('[data-original]')].map(i=>i.getAttribute('data-original'))}));
  const reviews=[...document.querySelectorAll('.t1186__title')].map((title,index)=>({name:title.textContent.trim(),text:document.querySelectorAll('.t1186__text')[index]?.textContent.trim()}));
  const gallery=[...document.querySelectorAll('#rec1181277201 [data-img-zoom-url]')].map(e=>e.getAttribute('data-img-zoom-url'));
  const formConfigs=[...document.querySelectorAll('[data-elem-type="form"]')].map(el=>({dataset:{...el.dataset},children:[...el.children].map(c=>({dataset:{...c.dataset},text:c.textContent}))}));
  const formFields=[...document.querySelectorAll('.tn-atom__inputs-data')].map(el=>JSON.parse(el.getAttribute('data-value')));
  return {records,reviews,gallery:[...new Set(gallery)],formConfigs,formFields};
 });
 const html=fs.readFileSync('research/source/home-current.html','utf8');
 data.videos=[...new Set([...html.matchAll(/https?:[^\s"'<>]+\.mp4/g)].map(m=>m[0]))];
 data.forms=await page.locator('input,select,textarea').evaluateAll(es=>es.map(e=>({type:e.type,name:e.name,placeholder:e.placeholder,options:e.options?[...e.options].map(o=>o.textContent):undefined})).filter(e=>!['hidden','submit'].includes(e.type)));
 data.legal={};
 for(const name of ['privacy','soglasie']){
  await page.goto(pathToFileURL(path.resolve(`research/source/${name}.txt`)).href,{waitUntil:'domcontentloaded'});
  // .txt is served as plain text; parse its archived HTML with DOMParser.
  data.legal[name]=await page.evaluate(()=>{const doc=new DOMParser().parseFromString(document.body.textContent,'text/html');doc.querySelectorAll('script,style').forEach(e=>e.remove());return [...doc.querySelectorAll('.t-rec')].map(r=>r.textContent.replace(/\s+/g,' ').trim()).filter(Boolean)});
 }
 fs.writeFileSync('research/source/donor-content.json',JSON.stringify(data,null,2));
 console.log(JSON.stringify({gallery:data.gallery.length,videos:data.videos.length,reviews:data.reviews.map(r=>({name:r.name,chars:r.text?.length})),legal:Object.fromEntries(Object.entries(data.legal).map(([k,v])=>[k,v.join('').length])),portraits:data.records.find(r=>r.id==='rec1253165056').atoms.filter(a=>a.url)}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
