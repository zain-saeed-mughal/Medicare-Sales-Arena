import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,defaultViewport:{width:1920,height:1080}});
try{const p=await b.newPage();await p.goto('http://127.0.0.1:5191/admin',{waitUntil:'networkidle0'});await p.click('.primary');await p.waitForSelector('.op-shell');
const change=code=>p.evaluate(async code=>{const u=performance.getEntriesByType('resource').find(e=>e.name.includes('/admin/service.ts')).name;await(await import(u)).command('settings','qa','QA',new Function('d',code+';return "QA"'))},code);
const a=await b.newPage();await a.goto('http://127.0.0.1:5191/arena',{waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,2300));
const rank2=await a.$eval('.award-2',e=>e.dataset.agent);await a.evaluate(()=>window.beforeAward=document.querySelector('.award-2'));
await change('const leader=d.sales[0].agent;for(const sale of d.sales)if(sale.agent===leader)sale.agent='+rank2);
await a.waitForFunction(id=>document.querySelector('.award-1')?.dataset.agent===id,{polling:100},rank2);
assert(await a.evaluate(()=>window.beforeAward===document.querySelector('.award-1')));assert(await a.$('.award-1.award-promoted'));await new Promise(r=>setTimeout(r,1300));
const expected=await p.evaluate(async()=>{const d=JSON.parse(localStorage.getItem('medicare-arena.dev.v3'));const {recognition}=await import('/championship/data.ts');return recognition(d,'Daily Arena').players.slice(0,3).map(p=>({id:String(p.id),sales:String(p.sales)}))});
for(const row of expected){assert.equal(await a.$eval('[data-agent="'+row.id+'"] .award-sales strong',e=>e.textContent),row.sales)}
console.log('PASS ranking promotion retains component, highlights promotion and matches approved-sales data');
await change('d.broadcast.typography={preset:"Extra Large TV",weight:"Extra Bold"};d.agents.forEach((a,i)=>{if(i<3)a.name="Alexandria Montgomery-Wellington"})');await new Promise(r=>setTimeout(r,1000));
assert(await a.$$eval('.champion-award',es=>es.every(e=>{const name=e.querySelector('h3').getBoundingClientRect(),score=e.querySelector('.award-result').getBoundingClientRect();return name.bottom<score.top && e.scrollHeight<=e.clientHeight+2})));await a.screenshot({path:'.arena-qa/awards-long-names.png'});
await a.goto('http://127.0.0.1:5191/arena?preview=1',{waitUntil:'networkidle0'});await a.waitForSelector('.championship-top-three');assert.equal(await a.$$eval('.champion-award',es=>es.length),3);console.log('PASS long names at Extra Large/Extra Bold and development preview');
}catch(e){console.error(e);process.exitCode=1}finally{b.process().kill()}
