from pathlib import Path
import re,colorsys
p=Path('theme/Theme.tsx');s=p.read_text();s=s.replace('"Dark Maroon Championship",','"Dark Maroon Championship",\n  "Midnight Teal Glow",');s=s.replace('theme === themeNames[1] ? "#e51e51" : "#10cf78"','theme === themeNames[2] ? "#16c9b5" : theme === themeNames[1] ? "#e51e51" : "#10cf78"');p.write_text(s)
p=Path('theme/ThemeSettings.tsx');s=p.read_text();s=s.replace(': "theme-swatch maroon"',': name === "Midnight Teal Glow" ? "theme-swatch teal" : "theme-swatch maroon"');p.write_text(s)
p=Path('broadcast/config.ts');s=p.read_text();s=s.replace('!["Dark Maroon Championship", "Emerald Green Championship"].includes(','!["Dark Maroon Championship", "Emerald Green Championship", "Midnight Teal Glow"].includes(');s=s.replace('color: s.broadcast.appearance.theme === "Emerald Green Championship"','color: s.broadcast.appearance.theme === "Midnight Teal Glow" ? "#b0d9d4" : s.broadcast.appearance.theme === "Emerald Green Championship"');p.write_text(s)
p=Path('theme/color-themes.css');s=p.read_text();block=s[s.index('  --material-080003:'):s.index('\n}\n:root:not')]
mapping={'080003':'030b0d','100106':'061316','160209':'081c20','1b020b':'0b282b','21040f':'0d2c30','310515':'103234','43091c':'12413f','590b25':'075b55','720c30':'08776d','910d3d':'09998b','b21346':'0dae9f','d61d50':'12bca9','e51e51':'16c9b5','ff4775':'32e6d2','fa85a3':'b0f5ea','d8b5c2':'b0d9d4','ecd0da':'d5eee9','fff5f5':'f5fffd','75112e':'28605e'}
def convert(m):
    key=m[1];rgb=key[:6];alpha=key[6:]
    if rgb in mapping: val=mapping[rgb]
    else:
        r,g,b=[int(rgb[i:i+2],16)/255 for i in (0,2,4)]
        h,l,sat=colorsys.rgb_to_hls(r,g,b)
        out=colorsys.hls_to_rgb(174/360,l,min(sat,.70))
        val=''.join(f'{round(v*255):02x}' for v in out)
    return f'--material-{key}: #{val}{alpha};'
block=re.sub(r'--material-([0-9a-f]+): #[0-9a-f]+;',convert,block)
block=block.replace('--arena-gold: #f4c75c;','--arena-gold: #f0c75e;')
s+='\n/* Midnight Teal: complete scoped palette prevents inheritance from another theme. */\n[data-color-theme="Midnight Teal Glow"] {\n'+block+'\n  --arena-error: #ff6075;\n  --brand-logo-filter: none;\n}\n.theme-swatch.teal { background:linear-gradient(135deg,#061316,#075b55,#32e6d2); }\n'
p.write_text(s)
