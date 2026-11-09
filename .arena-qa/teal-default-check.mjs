import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';
console.log('launch');const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding'],defaultViewport:{width:1920,height:1080}});
try {
console.log('launched');const p=await b.newPage(),errors=[];for(const page of [p])page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});
await p.bringToFront();console.log('admin navigation');await p.goto('http://127.0.0.1:5191/admin',{waitUntil:'domcontentloaded'});console.log('admin loaded');await p.screenshot({path:'.arena-qa/debug-before.png'});await p.waitForSelector('.primary');await p.screenshot({path:'.arena-qa/debug-admin.png'});await p.click('.primary');console.log('signed in');await p.waitForSelector('.op-shell');
const a=await b.newPage();console.log('arena navigation');await a.goto('http://127.0.0.1:5191/arena?preview=1',{waitUntil:'domcontentloaded'});
const records=()=>p.evaluate(()=>{const d=JSON.parse(localStorage.getItem('medicare-arena.dev.v3'));return JSON.stringify([d.sales,d.spins,d.prizes,d.targets,d.completed])});const before=await records();
const click=async text=>p.evaluate(text=>{const panel=document.querySelector('.theme-choices').closest('section');[...panel.querySelectorAll('button')].find(e=>e.textContent.trim()===text).click()},text);
for(const theme of ['Midnight Teal Glow']){
await p.bringToFront();console.log('admin navigation');await p.goto('http://127.0.0.1:5191/admin/appearance',{waitUntil:'domcontentloaded'});await p.waitForSelector('.theme-choices');assert.equal(await p.$$eval('.theme-choices button',e=>e.length),3);
const saved=await a.$eval('main',e=>e.dataset.colorTheme);
await click(theme+(theme.startsWith('Emerald')?' · Default':''));await click('Preview Theme');assert.equal(await a.$eval('main',e=>e.dataset.colorTheme),saved);
await click('Reset to Saved');await click(theme+(theme.startsWith('Emerald')?' · Default':''));console.log('saving',theme);await click('Save Changes');await a.waitForFunction(t=>document.querySelector('main').dataset.colorTheme===t,{},theme);
await a.bringToFront();await a.reload({waitUntil:'domcontentloaded'});await a.waitForSelector('main');assert.equal(await a.$eval('main',e=>e.dataset.colorTheme),theme);
await p.bringToFront();console.log('admin navigation');await p.goto('http://127.0.0.1:5191/admin',{waitUntil:'domcontentloaded'});await p.waitForSelector('.op-shell');await p.screenshot({path:'.arena-qa/'+theme.split(' ')[0]+'-admin-verified.png'});

}
await p.bringToFront();console.log('admin navigation');await p.goto('http://127.0.0.1:5191/admin/appearance',{waitUntil:'domcontentloaded'});await p.waitForSelector('.theme-choices');await click('Restore Default');await p.waitForFunction(()=>document.querySelector('.theme-choices button:first-child').getAttribute('aria-pressed')==='true');assert(await p.$eval('.theme-choices button:first-child',e=>e.getAttribute('aria-pressed')==='true'));await click('Save Changes');await a.waitForFunction(()=>document.querySelector('main').dataset.colorTheme==='Emerald Green Championship');assert.equal(await records(),before);assert.deepEqual(errors,[]);console.log('PASS Restore Default, operational data unchanged, no browser errors');
}catch(e){console.error(e);process.exitCode=1}finally{b.process().kill()}





