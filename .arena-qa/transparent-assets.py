from PIL import Image
from pathlib import Path
im=Image.open(r'C:/Users/DEV-BT/.codex/generated_images/01a1a2c9-0821-7b02-9ada-17106a0c19e0/exec-63ac7a39-151e-4063-9287-374804cff5ce.png').convert('RGBA')
print(im.size,im.getextrema()[3])
out=Path('public/brand')
im.save(out/'midnight-teal-wordmark-transparent-v2.png',optimize=True)
# Derive compact assets from the approved transparent edit without recoloring.
emblem=im.crop((0,20,665,690));emblem.save(out/'midnight-teal-emblem-transparent-v2.png',optimize=True)
icon=im.crop((65,55,600,660));icon.thumbnail((460,460),Image.Resampling.LANCZOS)
canvas=Image.new('RGBA',(500,500));canvas.alpha_composite(icon,((500-icon.width)//2,(500-icon.height)//2))
for n in (16,32,48,180):canvas.resize((n,n),Image.Resampling.LANCZOS).save(out/f'favicon-teal-v2-{n}.png')
canvas.save(out/'favicon-teal-v2.ico',sizes=[(16,16),(32,32),(48,48)])
for name in ('championship/Players.tsx','velocity/Stage.tsx'):
 p=Path(name);s=p.read_text(encoding='utf-8').replace('/brand/midnight-teal-emblem.png','/brand/midnight-teal-emblem-transparent-v2.png').replace('/brand/midnight-teal-wordmark.png','/brand/midnight-teal-wordmark-transparent-v2.png');p.write_text(s,encoding='utf-8')
p=Path('index.html');s=p.read_text().replace('favicon-teal-v1','favicon-teal-v2');p.write_text(s)
