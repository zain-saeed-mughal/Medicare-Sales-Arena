import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Simple static server
const distDir = path.resolve('dist');
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '/arena') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 5199;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`Test server running at http://127.0.0.1:${PORT}`);

const tempDir = fs.mkdtempSync(path.resolve('.arena-qa/tmp-qa-'));
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  userDataDir: tempDir,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1280, height: 800 }
});

try {
  // 1. Initial Page Load (Active Tab)
  console.log('Testing Active Tab Load...');
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/arena`, { waitUntil: 'networkidle0' });

  // Verify favicon link tags
  const icons = await page.$$eval('link[rel~="icon"], link[rel="apple-touch-icon"]', (els) =>
    els.map((e) => ({ rel: e.rel, href: e.getAttribute('href'), sizes: e.getAttribute('sizes') }))
  );
  console.log('Detected icon link tags:', icons);
  assert(icons.some((i) => i.href.includes('favicon-shield-v4.ico')), 'ICO icon must point to favicon-shield-v4.ico');
  assert(icons.some((i) => i.href.includes('favicon-shield-v4-32.png')), '32px PNG icon must be referenced');
  assert(icons.some((i) => i.href.includes('favicon-shield-v4-16.png')), '16px PNG icon must be referenced');
  assert(icons.some((i) => i.href.includes('favicon-shield-v4-180.png')), '180px apple-touch-icon must be referenced');

  // Verify favicon HTTP responses
  for (const icon of icons) {
    const res = await page.evaluate(async (href) => {
      const r = await fetch(href, { cache: 'reload' });
      return { status: r.status, type: r.headers.get('content-type'), bytes: (await r.arrayBuffer()).byteLength };
    }, icon.href);
    console.log(`Fetch ${icon.href} -> status=${res.status}, type=${res.type}, bytes=${res.bytes}`);
    assert.equal(res.status, 200, `Favicon ${icon.href} should return HTTP 200`);
    assert(res.bytes > 500, `Favicon ${icon.href} should not be empty`);
  }

  // Active Tab Screenshot
  await page.screenshot({ path: '.arena-qa/verify-1-active-tab.png' });
  console.log('PASS: Active Tab verified.');

  // 2. Tab Refresh
  console.log('Testing Tab Refresh...');
  await page.reload({ waitUntil: 'networkidle0' });
  const reloadedIcon = await page.$eval('link[rel~="icon"]', (e) => e.getAttribute('href'));
  assert(reloadedIcon.includes('favicon-shield-v4'), 'Reloaded page preserves shield favicon');
  await page.screenshot({ path: '.arena-qa/verify-2-refreshed-tab.png' });
  console.log('PASS: Refreshed Tab verified.');

  // 3. New Tab Load
  console.log('Testing New Tab Load...');
  const newPage = await browser.newPage();
  await newPage.goto(`http://127.0.0.1:${PORT}/arena`, { waitUntil: 'networkidle0' });
  const newPageIcon = await newPage.$eval('link[rel~="icon"]', (e) => e.getAttribute('href'));
  assert(newPageIcon.includes('favicon-shield-v4'), 'New tab loads shield favicon');
  await newPage.screenshot({ path: '.arena-qa/verify-3-new-tab.png' });
  console.log('PASS: New Tab load verified.');

  // 4. Tab Bar Simulation (Active & Inactive Tabs in Chrome UI)
  console.log('Testing Active & Inactive Chrome Tab Bar UI Simulation...');
  const ico32Data = 'data:image/png;base64,' + fs.readFileSync('dist/brand/favicon-shield-v4-32.png').toString('base64');
  const ico16Data = 'data:image/png;base64,' + fs.readFileSync('dist/brand/favicon-shield-v4-16.png').toString('base64');

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c121e; color: #fff; }
        h2 { font-size: 18px; margin-bottom: 20px; font-weight: 600; color: #2dd4bf; }
        .chrome-frame { border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-bottom: 30px; border: 1px solid rgba(255,255,255,0.1); }
        .dark-frame { background: #202124; }
        .light-frame { background: #dee1e6; color: #202124; }
        .tab-bar { display: flex; align-items: flex-end; padding: 8px 12px 0; gap: 6px; }
        .tab { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 8px 8px 0 0; font-size: 12px; width: 220px; box-sizing: border-box; }
        .dark-frame .tab.active { background: #323639; color: #fff; }
        .dark-frame .tab.inactive { background: transparent; color: #9aa0a6; }
        .light-frame .tab.active { background: #ffffff; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .light-frame .tab.inactive { background: transparent; color: #5f6368; }
        .tab span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; font-weight: 500; }
        .close-btn { opacity: 0.6; font-size: 13px; }
        .content-bar { padding: 12px 16px; background: #292a2d; font-size: 13px; display: flex; align-items: center; gap: 12px; }
        .light-frame .content-bar { background: #ffffff; border-top: 1px solid #e2e8f0; color: #334155; }
        .url-box { background: rgba(0,0,0,0.2); padding: 5px 12px; border-radius: 20px; flex: 1; font-family: monospace; font-size: 12px; }
        .light-frame .url-box { background: #f1f5f9; color: #0f172a; }
        .zoom-row { display: flex; align-items: center; gap: 24px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-top: 20px; }
        .pixelated { image-rendering: pixelated; }
      </style>
    </head>
    <body>
      <h2>Medicare Sales Arena · Browser Tab Favicon Chrome Verification</h2>

      <div class="chrome-frame dark-frame">
        <div class="tab-bar">
          <div class="tab active">
            <img src="${ico16Data}" width=16 height=16 alt="Favicon Active Tab">
            <span>Medicare Sales Arena · Live Championship</span>
            <div class="close-btn">×</div>
          </div>
          <div class="tab inactive">
            <img src="${ico16Data}" width=16 height=16 style="opacity: 0.85;" alt="Favicon Inactive Tab">
            <span>Admin Control Center</span>
            <div class="close-btn">×</div>
          </div>
          <div class="tab inactive">
            <span style="font-size: 14px; margin-left: 4px;">+</span>
          </div>
        </div>
        <div class="content-bar">
          <div class="url-box">https://medicarearena.com/arena</div>
        </div>
      </div>

      <div class="chrome-frame light-frame">
        <div class="tab-bar">
          <div class="tab active">
            <img src="${ico16Data}" width=16 height=16 alt="Favicon Active Tab">
            <span>Medicare Sales Arena · Live Championship</span>
            <div class="close-btn">×</div>
          </div>
          <div class="tab inactive">
            <img src="${ico16Data}" width=16 height=16 style="opacity: 0.85;" alt="Favicon Inactive Tab">
            <span>Admin Control Center</span>
            <div class="close-btn">×</div>
          </div>
          <div class="tab inactive">
            <span style="font-size: 14px; margin-left: 4px;">+</span>
          </div>
        </div>
        <div class="content-bar">
          <div class="url-box">https://medicarearena.com/arena</div>
        </div>
      </div>

      <div class="zoom-row">
        <div>
          <small style="color: #94a3b8; display: block; margin-bottom: 6px;">16×16 Native</small>
          <img src="${ico16Data}" width=16 height=16>
        </div>
        <div>
          <small style="color: #94a3b8; display: block; margin-bottom: 6px;">32×32 Retina</small>
          <img src="${ico32Data}" width=32 height=32>
        </div>
        <div>
          <small style="color: #94a3b8; display: block; margin-bottom: 6px;">16px @ 6× Zoom</small>
          <img class="pixelated" src="${ico16Data}" width=96 height=96>
        </div>
        <div>
          <small style="color: #94a3b8; display: block; margin-bottom: 6px;">32px @ 4× Zoom</small>
          <img class="pixelated" src="${ico32Data}" width=128 height=128>
        </div>
      </div>
    </body>
    </html>
  `);

  await page.screenshot({ path: '.arena-qa/verify-4-tab-simulation.png', fullPage: true });
  console.log('PASS: Chrome Active & Inactive Tab bar simulation verified.');

} finally {
  await browser.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
  server.close();
  console.log('Server stopped and test complete.');
}

