import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,defaultViewport:{width:1920,height:1080}});
try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5191/admin',{waitUntil:'networkidle0'});await p.click('.primary');await p.waitForSelector('.op-shell');await p.goto('http://127.0.0.1:5191/admin/appearance',{waitUntil:'networkidle0'});
const click=async(text)=>{await p.evaluate(text=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===text);if(!e)throw Error(text);e.click()},text)};
await click('TV Display Settings');await p.waitForSelector('[aria-label="Display preset"]');
const a=await b.newPage();for(const page of [p,a]){const wait=page.waitForFunction.bind(page);page.waitForFunction=(fn,opts,...args)=>wait(fn,{polling:100,...opts},...args)}a.on('pageerror',e=>errors.push(e.message));await a.goto('http://127.0.0.1:5191/arena',{waitUntil:'networkidle0'});
const change=async code=>p.evaluate(async code=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/admin/service.ts')).name;const{command}=await import(url);await command('settings','qa','QA',new Function('d',code+';return "QA"'))},code);
assert.equal(await a.$eval('main',e=>e.dataset.tvWeight),'Original');
for(const preset of ['Normal','Large TV','Extra Large TV']){await p.bringToFront();await p.select('[aria-label="Display preset"]',preset);await p.select('[aria-label="Font weight"]','Extra Bold');await click('Apply to Live Arena');await a.waitForFunction(v=>document.querySelector('main').dataset.tvPreset===v,{},preset);await p.waitForFunction(()=>[...document.querySelectorAll('[role="status"]')].some(e=>e.textContent.includes('Applied')));
for(const [width,height]of[[1920,1080],[2560,1440],[3840,2160]]){await a.bringToFront();await a.setViewport({width,height});for(const mode of ['Daily Arena','Weekly Arena','Monthly Arena','Team Battle','Leaderboard Focus','Champion Spotlight','Reward Ceremony','Standby','Hall of Fame','Live Competition']){await change(`d.settings.mode=${JSON.stringify(mode)}`);await a.waitForFunction(m=>document.querySelector('main').dataset.mode===m,{},mode);await new Promise(r=>setTimeout(r,450));assert.deepEqual(await a.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.scrollHeight]),[width,height]);
const heading=await a.$eval('.oe-broadcast-title > span',e=>({size:parseFloat(getComputedStyle(e).fontSize),clip:e.scrollHeight>e.clientHeight+2,rect:e.getBoundingClientRect().toJSON()}));
assert(heading.size >= 30*width/1920 && heading.size <= 37*width/1920);assert(!heading.clip);
if(width===1920)await a.screenshot({path:`.arena-qa/broadcast-type-${preset.replaceAll(' ','-')}-${mode.replaceAll(' ','-')}.png`});}}
console.log('PASS',preset,'10 modes at 1080/1440/4K');}
await a.reload({waitUntil:'networkidle0'});assert.equal(await a.$eval('main',e=>e.dataset.tvPreset),'Extra Large TV');
for(const weight of ['Medium','Bold','Extra Bold']){await p.select('[aria-label="Font weight"]',weight);await click('Apply to Live Arena');await a.waitForFunction(w=>document.querySelector('main').dataset.tvWeight===w,{},weight);assert.equal(await a.$eval('.oe-rank-name strong',e=>getComputedStyle(e).fontWeight),({Medium:'600',Bold:'700','Extra Bold':'800'})[weight]);}
await a.setViewport({width:1920,height:1080});await change('d.settings.mode="Daily Arena";d.agents[0].name="Alexandria Montgomery-Wellington"');await new Promise(r=>setTimeout(r,500));await a.screenshot({path:'.arena-qa/tv-longname.png'});await p.screenshot({path:'.arena-qa/tv-admin.png'});
await p.select('[aria-label="Preview example"]','Prize Won');await click('Preview');const f=p.frames().find(f=>f.url().includes('monitor'));await f.waitForSelector('.cine-prize-panel');await p.screenshot({path:'.arena-qa/tv-prize-preview.png'});
await a.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);assert.equal(await a.$eval('.tv-avatar-core',e=>getComputedStyle(e).animationName),'none');await a.evaluate(()=>document.documentElement.requestFullscreen());assert(await a.evaluate(()=>!!document.fullscreenElement));await a.evaluate(()=>document.exitFullscreen());
await click('Restore Default');assert.equal(await a.$eval('main',e=>e.dataset.tvPreset),'Extra Large TV');await click('Apply to Live Arena');await a.waitForFunction(()=>document.querySelector('main').dataset.tvPreset==='Normal');assert.deepEqual(errors,[]);console.log('PASS weights, persistence, restore, preview, fullscreen, reduced motion, zero errors');
}catch(e){console.error(e);process.exitCode=1}finally{b.process().kill()}



