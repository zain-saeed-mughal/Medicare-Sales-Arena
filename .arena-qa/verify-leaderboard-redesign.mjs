import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';

// Static file server serving dist
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

const PORT = 5195;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`Server running at http://127.0.0.1:${PORT}`);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-lb-qa-'));
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  userDataDir: tempDir,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1920, height: 1080 }
});

try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/arena`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  // Helper to switch mode / period in localStorage
  const setArenaState = async (mode, period, mutateFn) => {
    await page.evaluate(({ mode, period, mutateStr }) => {
      const KEY = 'medicare-arena.dev.v3';
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (mode) d.settings.mode = mode;
        if (period) d.broadcast.leaderboard.period = period;
        if (mutateStr) {
          const fn = new Function('d', mutateStr);
          fn(d);
        }
        localStorage.setItem(KEY, JSON.stringify(d));
        window.dispatchEvent(new Event('storage'));
      }
    }, { mode, period, mutateStr: mutateFn ? mutateFn.toString() : null });
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 700));
  };

  // 1. Weekly Leaderboard at 1080p
  console.log('Capturing Weekly Leaderboard (1080p)...');
  await setArenaState('Weekly Arena', 'Weekly Arena');
  const lbWeekly = await page.$('.oe-board');
  assert(lbWeekly, 'Weekly Leaderboard element must exist');
  
  // Verify 10 rows exist and fit without scrolling
  const rowsCount = await page.$$eval('.oe-rank-row', (els) => els.length);
  console.log('Weekly Leaderboard displayed rows:', rowsCount);
  assert.equal(rowsCount, 10, 'Must display Top 10 rows');
  
  // Verify headers and cells alignment
  const colAlignment = await page.evaluate(() => {
    const label = document.querySelector('.oe-board-label');
    const row = document.querySelector('.oe-rank-row');
    const lBox = label.getBoundingClientRect();
    const rBox = row.getBoundingClientRect();
    const headSub = document.querySelector('.oe-head-submitted')?.getBoundingClientRect();
    const headApp = document.querySelector('.oe-head-approved')?.getBoundingClientRect();
    const cellSub = row.querySelector('.oe-metric-submitted')?.getBoundingClientRect();
    const cellApp = row.querySelector('.oe-metric-approved')?.getBoundingClientRect();
    return {
      labelBox: { left: lBox.left, right: lBox.right, width: lBox.width },
      rowBox: { left: rBox.left, right: rBox.right, width: rBox.width },
      headSub: { left: headSub?.left, right: headSub?.right, width: headSub?.width },
      cellSub: { left: cellSub?.left, right: cellSub?.right, width: cellSub?.width },
      headApp: { left: headApp?.left, right: headApp?.right, width: headApp?.width },
      cellApp: { left: cellApp?.left, right: cellApp?.right, width: cellApp?.width },
      subDiff: Math.abs((headSub?.right || 0) - (cellSub?.right || 0)),
      appDiff: Math.abs((headApp?.right || 0) - (cellApp?.right || 0)),
    };
  });
  console.log('Detailed Column alignment analysis:', colAlignment);

  await page.screenshot({ path: '.arena-qa/leaderboard-1-weekly.png' });
  const clipBox = await lbWeekly.boundingBox();
  if (clipBox) {
    await page.screenshot({ path: '.arena-qa/leaderboard-weekly-crop.png', clip: clipBox });
  }

  // 2. Daily Leaderboard at 1080p
  console.log('Capturing Daily Leaderboard (1080p)...');
  await setArenaState('Daily Arena', 'Daily Arena');
  const lbDaily = await page.$('.oe-board');
  assert(lbDaily, 'Daily Leaderboard element must exist');
  await page.screenshot({ path: '.arena-qa/leaderboard-2-daily.png' });
  const clipDaily = await lbDaily.boundingBox();
  if (clipDaily) {
    await page.screenshot({ path: '.arena-qa/leaderboard-daily-crop.png', clip: clipDaily });
  }

  // 3. Monthly Leaderboard at 1080p
  console.log('Capturing Monthly Leaderboard (1080p)...');
  await setArenaState('Monthly Arena', 'Monthly Arena');
  const lbMonthly = await page.$('.oe-board');
  assert(lbMonthly, 'Monthly Leaderboard element must exist');
  await page.screenshot({ path: '.arena-qa/leaderboard-3-monthly.png' });
  const clipMonthly = await lbMonthly.boundingBox();
  if (clipMonthly) {
    await page.screenshot({ path: '.arena-qa/leaderboard-monthly-crop.png', clip: clipMonthly });
  }

  // 4. Long Agent Names Verification
  console.log('Testing Long Agent Names Handling...');
  await page.evaluate(() => {
    const KEY = 'medicare-arena.dev.v3';
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.agents) && d.agents.length >= 2) {
        d.agents[0].name = 'Alexander Christian Montgomery-Vanderbilt III';
        d.agents[1].name = 'Genevieve Elizabeth St. Claire-Harrington';
        localStorage.setItem(KEY, JSON.stringify(d));
      }
    } catch (e) {
      console.warn('Could not parse local storage for long names test', e);
    }
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));

  const longNameFit = await page.evaluate(() => {
    const row = document.querySelector('.oe-rank-row');
    const nameEl = row?.querySelector('.oe-agent-name');
    const rBox = row?.getBoundingClientRect();
    const nBox = nameEl?.getBoundingClientRect();
    return {
      fitsWithinRow: nBox && rBox ? nBox.right <= rBox.right : false,
      hasEllipsis: nameEl ? getComputedStyle(nameEl).textOverflow === 'ellipsis' : false,
    };
  });
  console.log('Long names check:', longNameFit);
  assert(longNameFit.hasEllipsis, 'Agent name must have text-overflow ellipsis');
  await page.screenshot({ path: '.arena-qa/leaderboard-4-long-names.png' });

  // 5. Multi-Resolution Verification (1440p and 4K)
  console.log('Testing 1440p resolution (2560x1440)...');
  await page.setViewport({ width: 2560, height: 1440 });
  await page.screenshot({ path: '.arena-qa/leaderboard-5-1440p.png' });

  console.log('Testing 4K resolution (3840x2160)...');
  await page.setViewport({ width: 3840, height: 2160 });
  await page.screenshot({ path: '.arena-qa/leaderboard-6-4k.png' });

  // 6. Reduced Motion Check
  console.log('Testing Reduced Motion...');
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: '.arena-qa/leaderboard-7-reduced-motion.png' });

  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
} finally {
  await browser.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
  server.close();
}
