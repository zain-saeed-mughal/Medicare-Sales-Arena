import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const tempDir = fs.mkdtempSync('C:/Users/DEV-BT/Desktop/Medicare Arena/.arena-qa/tmp-chrome-');
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  userDataDir: tempDir,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1080, height: 750 }
});
const page = await browser.newPage();

const opt1_16 = 'data:image/png;base64,' + fs.readFileSync('public/brand/opt1_tile_16.png').toString('base64');
const opt1_32 = 'data:image/png;base64,' + fs.readFileSync('public/brand/opt1_tile_32.png').toString('base64');
const opt1_48 = 'data:image/png;base64,' + fs.readFileSync('public/brand/opt1_tile_48.png').toString('base64');
const opt2_16 = 'data:image/png;base64,' + fs.readFileSync('public/brand/opt2_shield_16.png').toString('base64');
const opt2_32 = 'data:image/png;base64,' + fs.readFileSync('public/brand/opt2_shield_32.png').toString('base64');
const opt2_48 = 'data:image/png;base64,' + fs.readFileSync('public/brand/opt2_shield_48.png').toString('base64');

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; background: #0f172a; color: #f8fafc; }
    .row { display: flex; gap: 24px; margin-top: 20px; }
    .card { padding: 20px; border-radius: 12px; flex: 1; border: 1px solid rgba(255,255,255,0.1); }
    .light { background: #dee1e6; color: #202124; border-color: #cbd5e1; }
    .dark { background: #202124; color: #fff; border-color: #374151; }
    .grid { display: flex; align-items: center; gap: 20px; margin: 12px 0 20px; }
    .grid > div { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 11px; }
    .pixelated { image-rendering: pixelated; }
    h3 { margin-top: 0; font-size: 16px; border-bottom: 1px solid currentColor; padding-bottom: 8px; }
    h4 { margin: 12px 0 4px; font-size: 13px; opacity: 0.9; }
    .tab-sim { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px 8px 0 0; width: 220px; font-size: 12px; margin-bottom: 12px; }
    .light .tab-sim { background: #fff; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .dark .tab-sim { background: #35363a; color: #f1f3f4; }
  </style>
</head>
<body>
  <h2>Favicon Verification: Option 1 (Squircle Badge) vs Option 2 (Shield Emblem)</h2>
  
  <div class="row">
    <div class="card light">
      <h3>Chrome Light Mode Tab Preview</h3>
      
      <h4>Option 1: Squircle Badge Tile (Matches Image Mock)</h4>
      <div class="tab-sim">
        <img src="${opt1_16}" width=16 height=16>
        <span>Medicare Sales Arena</span>
      </div>
      <div class="grid">
        <div><img src="${opt1_16}" width=16 height=16><span>16×16</span></div>
        <div><img src="${opt1_32}" width=32 height=32><span>32×32</span></div>
        <div><img src="${opt1_48}" width=48 height=48><span>48×48</span></div>
        <div><img class="pixelated" src="${opt1_16}" width=96 height=96><span>16px @ 6×</span></div>
        <div><img class="pixelated" src="${opt1_32}" width=96 height=96><span>32px @ 3×</span></div>
      </div>

      <h4>Option 2: Standalone Shield Emblem (Transparent background)</h4>
      <div class="tab-sim">
        <img src="${opt2_16}" width=16 height=16>
        <span>Medicare Sales Arena</span>
      </div>
      <div class="grid">
        <div><img src="${opt2_16}" width=16 height=16><span>16×16</span></div>
        <div><img src="${opt2_32}" width=32 height=32><span>32×32</span></div>
        <div><img src="${opt2_48}" width=48 height=48><span>48×48</span></div>
        <div><img class="pixelated" src="${opt2_16}" width=96 height=96><span>16px @ 6×</span></div>
        <div><img class="pixelated" src="${opt2_32}" width=96 height=96><span>32px @ 3×</span></div>
      </div>
    </div>

    <div class="card dark">
      <h3>Chrome Dark Mode Tab Preview</h3>
      
      <h4>Option 1: Squircle Badge Tile (Matches Image Mock)</h4>
      <div class="tab-sim">
        <img src="${opt1_16}" width=16 height=16>
        <span>Medicare Sales Arena</span>
      </div>
      <div class="grid">
        <div><img src="${opt1_16}" width=16 height=16><span>16×16</span></div>
        <div><img src="${opt1_32}" width=32 height=32><span>32×32</span></div>
        <div><img src="${opt1_48}" width=48 height=48><span>48×48</span></div>
        <div><img class="pixelated" src="${opt1_16}" width=96 height=96><span>16px @ 6×</span></div>
        <div><img class="pixelated" src="${opt1_32}" width=96 height=96><span>32px @ 3×</span></div>
      </div>

      <h4>Option 2: Standalone Shield Emblem (Transparent background)</h4>
      <div class="tab-sim">
        <img src="${opt2_16}" width=16 height=16>
        <span>Medicare Sales Arena</span>
      </div>
      <div class="grid">
        <div><img src="${opt2_16}" width=16 height=16><span>16×16</span></div>
        <div><img src="${opt2_32}" width=32 height=32><span>32×32</span></div>
        <div><img src="${opt2_48}" width=48 height=48><span>48×48</span></div>
        <div><img class="pixelated" src="${opt2_16}" width=96 height=96><span>16px @ 6×</span></div>
        <div><img class="pixelated" src="${opt2_32}" width=96 height=96><span>32px @ 3×</span></div>
      </div>
    </div>
  </div>
</body>
</html>
`;

await page.setContent(html);
await page.screenshot({ path: '.arena-qa/favicon-options-comparison.png', fullPage: true });
await browser.close();
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('Saved .arena-qa/favicon-options-comparison.png');
