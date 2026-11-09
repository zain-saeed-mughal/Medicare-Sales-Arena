from pathlib import Path
from PIL import Image
import shutil
source=Path(r'C:/Users/DEV-BT/AppData/Local/Temp/codex-clipboard-d8c76aa6-ac62-4ae1-a6f5-ba781c2df0c2.png')
out=Path('public/brand');shutil.copy2(source,out/'midnight-teal-source.png')
im=Image.open(source).convert('RGBA');print(im.size,im.getextrema()[3])
# Pixel-preserving crops retain the supplied metallic artwork and existing alpha.
word=im.crop((275,80,2065,600));word.save(out/'midnight-teal-wordmark.png',optimize=True)
emblem=im.crop((280,80,825,600));emblem.save(out/'midnight-teal-emblem.png',optimize=True)
icon=im.crop((345,85,765,560));canvas=Image.new('RGBA',(500,500));icon.thumbnail((460,460),Image.Resampling.LANCZOS);canvas.alpha_composite(icon,((500-icon.width)//2,(500-icon.height)//2))
for n in (16,32,48,180):canvas.resize((n,n),Image.Resampling.LANCZOS).save(out/f'favicon-teal-v1-{n}.png')
canvas.save(out/'favicon-teal-v1.ico',sizes=[(16,16),(32,32),(48,48)])
for name in ('championship/Players.tsx','velocity/Stage.tsx'):
 p=Path(name);s=p.read_text().replace('/brand/medicare-maroon-m.png','/brand/midnight-teal-emblem.png');p.write_text(s)
p=Path('championship/Players.tsx');s=p.read_text();s=s.replace('export function Crest({ className = "" }: { className?: string })','export function Crest({ className = "", wordmark = false }: { className?: string; wordmark?: boolean })');s=s.replace('"oe-crest official-brand-logo " + className','"oe-crest official-brand-logo " + (wordmark ? "official-wordmark " : "") + className');s=s.replace('src="/brand/midnight-teal-emblem.png"','src={wordmark ? "/brand/midnight-teal-wordmark.png" : "/brand/midnight-teal-emblem.png"}');p.write_text(s)
p=Path('championship/Arena.tsx');s=p.read_text();start=s.index('          {b.branding.logo ?');end=s.index('\n        </div>',start);s=s[:start]+'''          {b.branding.logo ? (
            <><img src={b.branding.logo} alt="Company logo" /><div><b>{s.settings.brand} <span>{s.settings.title}</span></b><small>{b.branding.office || "LIVE SALES & REWARDS"}</small></div></>
          ) : <Crest wordmark />}
'''+s[end:];# standby branding only
s=s.replace('<Crest />\n                  <div className="oe-eyebrow">','<Crest wordmark />\n                  <div className="oe-eyebrow">')
p.write_text(s)
p=Path('admin/Admin.tsx');s=p.read_text();s=s.replace('''          <Crest />
          <b>
            MEDICARE SALES ARENA <em>COMMAND CONSOLE</em>
          </b>''','''          <Crest wordmark />''');p.write_text(s)
p=Path('theme/Theme.tsx');s=p.read_text().replace('defaultTheme: ColorTheme = themeNames[0]','defaultTheme: ColorTheme = themeNames[2]');p.write_text(s)
p=Path('theme/ThemeSettings.tsx');s=p.read_text().replace('Emerald Green Championship is the default','Midnight Teal Glow is the default').replace('Emerald default staged.','Midnight Teal default staged.').replace('name === defaultTheme\n                  ? "theme-swatch emerald"','name === "Emerald Green Championship"\n                  ? "theme-swatch emerald"');p.write_text(s)
p=Path('broadcast/config.ts');s=p.read_text().replace('version: 8,','version: 9,').replace('theme: "Emerald Green Championship",','theme: "Midnight Teal Glow",',1).replace('accent: "#10cf78",','accent: "#16c9b5",',1)
marker='  return upgraded;'
s=s.replace(marker,'''  if ((value.version || 0) < 9) {
    if (upgraded.appearance.themeSource !== "user") {
      upgraded.appearance.theme = "Midnight Teal Glow";
      upgraded.appearance.accent = "#16c9b5";
      upgraded.appearance.themeSource = "system";
    }
    upgraded.version = 9;
  }
'''+marker)
p.write_text(s)
p=Path('theme/color-themes.css');s=p.read_text().replace(':root:not([data-color-theme]), [data-color-theme="Emerald Green Championship"]','[data-color-theme="Emerald Green Championship"]').replace('[data-color-theme="Midnight Teal Glow"] {',':root:not([data-color-theme]), [data-color-theme="Midnight Teal Glow"] {')
s+='\n/* Official teal artwork keeps its supplied colors in every palette. */\nimg.official-brand-logo { filter:none !important; }\n.oe-brand img.official-wordmark { width:22rem; height:4.9rem; max-width:100%; }\n.op-brand img.official-wordmark { width:100%; height:4.6rem; min-width:0; }\nimg.official-wordmark { object-fit:contain; }\n'
p.write_text(s)
p=Path('index.html');s=p.read_text().replace('#160309','#061316').replace('sizes="16x16 32x32" href="/brand/favicon-m-v2.ico"','sizes="16x16 32x32 48x48" href="/brand/favicon-teal-v1.ico"');s=s.replace('<title>','<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicon-teal-v1-180.png"><title>');p.write_text(s)
