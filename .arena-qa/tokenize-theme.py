from pathlib import Path
import re,colorsys,json
root=Path('.')
base=Path('theme/maroon-tokens.css').read_text(encoding='utf-8')
original_body=base[base.index('{')+1:base.rindex('}')]
known={'100106':'00170f','160209':'001d14','1b020b':'002b1d','21040f':'002f20','310515':'003624','43091c':'054830','590b25':'07563b','720c30':'08784d','910d3d':'09995c','b21346':'0daf68','d61d50':'0ec573','e51e51':'10cf78','ff4775':'38f29d','fa85a3':'a5f5cc','d8b5c2':'b4d9c7','ecd0da':'d9f5e5','fff5f5':'f4fff9'}
colors={}
pat=re.compile(r'#[0-9a-fA-F]{3,8}\b')
def expand(c):
 h=c[1:].lower()
 if len(h) in (3,4):h=''.join(x*2 for x in h)
 return h

def themed(c):
 h=expand(c)
 if len(h) not in (6,8):return False
 r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
 hue,l,s=colorsys.rgb_to_hls(r,g,b)
 return s>.10 and (hue>.80 or hue<.025) and r>b*.98 and r>g*1.025

def replace(m):
 c=m.group();h=expand(c)
 if not themed(c):return c
 colors[h]='#'+h
 return 'var(--material-'+h+')'
files=[]
for p in root.rglob('*.css'):
 if any(x in p.parts for x in ['node_modules','dist','.arena-qa','.git']):continue
 s=p.read_text(encoding='utf-8');new=pat.sub(replace,s)
 if new!=s:p.write_text(new,encoding='utf-8');files.append(str(p))
for name in ['championship/Wheel.tsx','broadcast/ArenaPreview.tsx','broadcast/RewardReview.tsx']:
 p=Path(name);s=p.read_text(encoding='utf-8');new=pat.sub(replace,s)
 if s!=new:p.write_text(new,encoding='utf-8');files.append(name)
# Repeat semantic declarations at each scope so unsaved preview and held ceremonies are isolated.
body=pat.sub(replace,original_body)
def green(h):
 rgb=h[:6];alpha=h[6:]
 if rgb in known:return '#'+known[rgb]+alpha
 r,g,b=[int(rgb[i:i+2],16)/255 for i in (0,2,4)]
 _,l,s=colorsys.rgb_to_hls(r,g,b)
 vals=colorsys.hls_to_rgb(153/360,l,min(s,.94))
 return '#'+''.join(f'{round(v*255):02x}' for v in vals)+alpha
maroon='\n'.join(f'  --material-{h}: {c};' for h,c in sorted(colors.items()))
emerald='\n'.join(f'  --material-{h}: {green(h)};' for h in sorted(colors))
s='/* Central material palette. Maroon values retain the original CSS colors exactly. */\n:root, [data-color-theme="Dark Maroon Championship"] {\n'+maroon+'\n'+body+'\n}\n'
s+='[data-color-theme="Emerald Green Championship"] {\n'+emerald+'\n'+body+'\n  --arena-error:#ff6075;\n  --arena-success:#34d6a2;\n}\n'
s+='''
.theme-choices { display:flex; flex-wrap:wrap; gap:12px; margin:16px 0; }
.theme-choices button { display:flex; align-items:center; gap:12px; padding:14px 18px; }
.theme-choices button[aria-pressed="true"] { outline:2px solid var(--arena-accent); outline-offset:2px; }
.theme-swatch { width:48px; height:30px; border-radius:6px; flex-shrink:0; }
.theme-swatch.emerald { background:linear-gradient(135deg,#00170f,#07563b,#38f29d); }
.theme-swatch.maroon { background:linear-gradient(135deg,#100106,#590b25,#ff4775); }
'''
Path('theme/color-themes.css').write_text(s,encoding='utf-8')
Path('.arena-qa/theme-tokenization.json').write_text(json.dumps({'files':files,'colors':len(colors)},indent=2))
print(len(colors),'centralized material colors;',len(files),'stylesheets/components tokenized')
