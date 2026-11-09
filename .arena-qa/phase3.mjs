import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,defaultViewport:{width:1500,height:960}});
try{
const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
const base='http://127.0.0.1:5191';const go=async(path)=>{await p.goto(base+path,{waitUntil:'networkidle0'})};await go('/admin');await p.click('.primary');await p.waitForSelector('.op-kpis');
await p.screenshot({path:'.arena-qa/admin.png'});const get=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('medicare-arena.dev.v3')));
for(const page of ['agents','teams','competitions','rewards','arena-control','activity','settings','users','sales']){await go('/admin/'+page);assert.ok(await p.$('.op-panel'));if(page==='arena-control')await p.screenshot({path:'.arena-qa/control.png'})}
const d=await get(),sale=d.sales.find(x=>x.status==='Pending'&&x.agent===0);await go('/admin/sales?sale='+sale.id);
async function click(text){await p.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent===t);if(!b)throw Error('Missing '+t);b.click()},text)}
await click('Approve sale');await click('Confirm approval');await p.waitForFunction(()=>!document.querySelector('dialog'));
await p.evaluate(async id=>{const {review}=await import('/admin/service.ts');await Promise.all([review(id,'Approved',''),review(id,'Approved','')])},sale.id);
let d2=await get();assert.equal(d2.queue.length,1);assert.equal(d2.spins.length,d.spins.length+1);assert.equal(d2.audit.filter(x=>x.action==='sale.approved'&&x.entity===sale.id).length,1);
const arena=await browser.newPage();await arena.setViewport({width:1920,height:1080});await arena.goto(base+'/arena');await arena.waitForSelector('.ceremony');assert.equal(await arena.$eval('.r0>b',el=>el.textContent),'25');assert.equal(await arena.evaluate(()=>document.documentElement.scrollHeight),1080);
await go('/admin/arena-control');await click('Reward Wheel Result');await p.waitForFunction(()=>JSON.parse(localStorage.getItem('medicare-arena.dev.v3')).queue.some(x=>x.demo));let c=await get();assert.equal(c.sales.length,d2.sales.length);assert.equal(c.spins.length,d2.spins.length);assert.ok(c.queue.some(x=>x.demo));
await p.evaluate(async id=>{const {review}=await import('/admin/service.ts');await review(id,'Cancelled','Operator correction')},sale.id);await arena.waitForFunction(()=>document.querySelector('.r0>b')?.textContent==='24');
await p.evaluate(async()=>{const {command}=await import('/admin/service.ts');await command('settings','arena.settings_updated','Arena 01',s=>{s.settings.simulate=false;return 'Pause simulation during QA'})});
await arena.waitForSelector('.ceremony',{hidden:true,timeout:20000});await arena.screenshot({path:'.arena-qa/phase3-arena.png'});
await p.bringToFront();await go('/admin/agents');await click('+ Add agent');await p.type('dialog input','Casey Lane');await click('Save changes');await p.waitForFunction(()=>document.body.innerText.includes('Casey Lane')&&!document.querySelector('dialog'));await go('/admin/competitions');await click('+ Add competition');await p.type('dialog input','Autumn Cup');await p.evaluate(()=>{for(const [i,el] of [...document.querySelectorAll('dialog input[type=datetime-local]')].entries()){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'2026-11-0'+(i+5)+'T12:00');el.dispatchEvent(new Event('input',{bubbles:true}))}});await click('Save changes');await p.waitForFunction(()=>!document.querySelector('dialog'));
await go('/admin/teams');await click('+ Add team');await p.type('dialog input','North Stars');await click('Save changes');await p.waitForFunction(()=>!document.querySelector('dialog'));assert.ok((await get()).teams.some(t=>t.name==='North Stars'));
await go('/admin/rewards');await click('+ Add rule');await p.type('dialog input','Ten sales');await click('Save changes');await p.waitForFunction(()=>!document.querySelector('dialog'));assert.ok((await get()).rules.some(r=>r.name==='Ten sales'));
await go('/admin/arena-control');await p.select('.op-form select','Standby');await click('Save changes');await arena.waitForSelector('.mode-stage');assert.ok((await arena.$eval('.mode-stage',el=>el.textContent)).includes('Standing by'));await click('Standard broadcast');await arena.waitForSelector('.mode-stage',{hidden:true});
await go('/admin/users');await click('End session');await p.select('select','u3');await click('Enter development workspace →');await go('/admin/sales');assert.ok((await p.$eval('.op-body',x=>x.textContent)).includes('unavailable for your profile'));await p.setViewport({width:390,height:844});await go('/admin');await p.click('[aria-label="Toggle navigation"]');assert.ok(await p.$eval('nav',el=>getComputedStyle(el).display!=='none'));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),390);assert.deepEqual(errors,[]);console.log('PASS 10 admin routes, approval confirmation, repeated approval, reward issuance, Arena sync, preview isolation, reversal, agent and competition creation, role gate, 1080p layout.');
}finally{await browser.close()}





