import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,defaultViewport:{width:1920,height:1080}});
const results=[];const key='medicare-arena.dev.v3';
try {
 const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:5191/admin',{waitUntil:'networkidle0'});await p.click('.primary');await p.waitForSelector('.op-shell');
 await p.screenshot({path:'.arena-qa/official-logo-admin.png'});
 assert.equal(await p.$$eval('.official-brand-logo',es=>es.every(e=>e.complete&&e.naturalWidth===578)),true);
 results.push('Admin sidebar and dashboard use loaded official transparent asset');
 await p.goto('http://127.0.0.1:5191/arena',{waitUntil:'networkidle0'});await p.screenshot({path:'.arena-qa/official-logo-arena.png'});
 assert(await p.$('.oe-brand .official-brand-logo'));assert(await p.$('.tv-insignia.official-brand-logo'));
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=1920&&document.documentElement.scrollHeight<=1080),true);
 results.push('1920x1080 Arena header/champion logo loaded with no document overflow');
 const saved=await p.evaluate(k=>localStorage.getItem(k),key);
 await p.evaluate(k=>localStorage.setItem(k,'{broken'),key);await p.reload({waitUntil:'networkidle0'});
 assert.match(await p.$eval('h1',e=>e.textContent),/data needs attention/);
 assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),'{broken');
 await p.evaluate((k,s)=>localStorage.setItem(k,s),key,saved);await p.click('button');await p.waitForSelector('.oe-header');
 results.push('Malformed ledger blocked safely, original bytes retained; Retry restored Arena');
 await p.evaluate(k=>sessionStorage.setItem(k+'.session','invalid'),key);await p.goto('http://127.0.0.1:5191/admin',{waitUntil:'networkidle0'});await p.waitForSelector('.primary');
 results.push('Malformed session fails closed to sign-in without crash');
 assert.deepEqual(errors,[]);results.push('No uncaught browser exceptions');
 fs.writeFileSync('.arena-qa/brand-stability-results.json',JSON.stringify(results,null,2));console.log(results.join('\n'));
}finally{await browser.close()}
