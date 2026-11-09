import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,defaultViewport:{width:1920,height:1080}});
try{
const p=await b.newPage();await p.goto('http://127.0.0.1:5191/admin',{waitUntil:'networkidle0'});await p.click('.primary');await p.waitForSelector('.op-shell');
assert((await p.$eval('.official-brand-logo',e=>getComputedStyle(e).filter)).includes('170deg'));
await p.screenshot({path:'.arena-qa/emerald-final-admin.png'});
await p.goto('http://127.0.0.1:5191/arena',{waitUntil:'networkidle0'});
await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await p.click('[aria-label="Enter fullscreen"]');await p.waitForSelector('[aria-label="Exit fullscreen"]');assert(await p.evaluate(()=>!!document.fullscreenElement));await p.click('[aria-label="Exit fullscreen"]');await p.waitForFunction(()=>!document.fullscreenElement);
console.log('PASS Admin logo, fullscreen, reduced motion');
await p.goto('http://127.0.0.1:5197/arena?preview=1',{waitUntil:'networkidle0'});assert.equal(await p.$eval('main',e=>e.dataset.colorTheme),'Emerald Green Championship');assert.equal(await p.$('[aria-label="Celebration preview"]'),null);console.log('PASS production default and development preview exclusion');
}finally{await b.close()}
