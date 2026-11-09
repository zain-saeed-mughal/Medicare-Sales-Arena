import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,defaultViewport:{width:1920,height:1080}});
try{const p=await b.newPage();await p.goto('http://127.0.0.1:5191/admin',{waitUntil:'networkidle0'});await p.click('.primary');await p.waitForSelector('.op-shell');await p.screenshot({path:'.arena-qa/transparent-admin.png'});
await p.goto('http://127.0.0.1:5191/arena?preview=1',{waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,1800));await p.screenshot({path:'.arena-qa/transparent-arena.png'});
assert(await p.$$eval('img.official-brand-logo',es=>es.every(e=>e.src.includes('transparent-v2')&&e.complete&&e.naturalWidth)));
await p.click('.preview-featured');await p.waitForSelector('.phase-wait',{timeout:12000});await new Promise(r=>setTimeout(r,1500));await p.screenshot({path:'.arena-qa/transparent-wheel.png'});
const alpha=await p.evaluate(async()=>{const im=new Image();im.src='/brand/favicon-teal-v2-32.png';await im.decode();const c=document.createElement('canvas');c.width=c.height=32;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return [ctx.getImageData(0,0,1,1).data[3],ctx.getImageData(31,31,1,1).data[3]]});assert.deepEqual(alpha,[0,0]);assert((await p.$eval('link[rel="icon"]',e=>e.href)).includes('v2.ico'));
console.log('PASS transparent logo placements and favicon alpha in Chrome');
await p.goto('http://127.0.0.1:5197/arena?preview=1',{waitUntil:'networkidle0'});assert.equal(await p.$('[aria-label="Preview controls"]'),null);assert.equal(await p.$eval('html',e=>e.dataset.colorTheme),'Midnight Teal Glow');console.log('PASS production default and no preview controls');
}catch(e){console.error(e);process.exitCode=1}finally{b.process().kill()}
