import puppeteer from 'puppeteer-core';
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--window-size=1920,1080'],defaultViewport:{width:1920,height:1080}});
try {
const page=await browser.newPage();page.on('pageerror',e=>console.error(e));await page.goto('http://127.0.0.1:5191/arena',{waitUntil:'networkidle0'});await page.evaluate(()=>document.fonts.ready);
console.log(await page.evaluate(()=>({title:document.title,height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,stage:document.querySelector('.stage').getBoundingClientRect().toJSON(),last:document.querySelector('aside').getBoundingClientRect().bottom})));
await page.screenshot({path:'.arena-qa/screen.png'});
if(process.argv.includes('verify')){
await page.click('button');console.log('fullscreen',await page.evaluate(()=>!!document.fullscreenElement));await page.click('button');console.log('exited',await page.evaluate(()=>!document.fullscreenElement));
await page.evaluate(()=>{window.shifts=[];new PerformanceObserver(list=>window.shifts.push(...list.getEntries().filter(e=>!e.hadRecentInput).map(e=>e.value))).observe({type:'layout-shift'});});
const frame=await page.evaluate(()=>new Promise(resolve=>{const frames=[];function step(now){frames.push(now);if(frames.length<121)requestAnimationFrame(step);else{const deltas=frames.slice(1).map((v,i)=>v-frames[i]).sort((a,b)=>a-b);resolve(deltas[114])}}requestAnimationFrame(step)}));console.log('p95 frame ms',frame);
await page.waitForFunction(()=>document.querySelector('.r1 .person strong')?.textContent==='Ethan Cole',{timeout:85000});console.log(await page.evaluate(()=>({score:document.querySelector('.r1>b').textContent,news:document.querySelector('.feed').textContent,shifts:window.shifts,height:document.documentElement.scrollHeight})));
await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);console.log('reduced motion',await page.$eval('.cup',el=>getComputedStyle(el).animationName));}
} finally {await browser.close()}
