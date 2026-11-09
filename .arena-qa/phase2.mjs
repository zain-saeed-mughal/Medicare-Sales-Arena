import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,defaultViewport:{width:1920,height:1080}});
try{
const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:5191/arena?demo',{waitUntil:'networkidle0'});
await p.click('.demo button'); const buttons=await p.$$('.demo button');
await buttons[2].click(); await p.waitForSelector('.phase-approved');
await buttons[3].click(); await p.waitForSelector('.phase-unlock');await p.waitForSelector('.phase-wheel');
await p.screenshot({path:'.arena-qa/wheel.png'});
await p.waitForSelector('.phase-result');assert.equal(await p.$eval('.phase-result h2',e=>e.textContent),'Gold badge');
await p.waitForFunction(()=>document.querySelector('.metrics article:nth-child(4) b').textContent==='19');
assert.equal(await p.$$eval('.ceremony',els=>els.length),1);
assert.equal(await p.$eval('.metrics article:nth-child(2) b',e=>e.textContent),'156');
assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight),1080);
assert.deepEqual(errors,[]);console.log('Approved → unlock → wheel → assigned prize verified. Three queued sales updated standings during ceremony; next celebration started. 1920×1080 fit; no runtime errors.');
} finally {await browser.close()}
