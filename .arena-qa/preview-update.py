from pathlib import Path
p=Path('broadcast/ArenaPreview.tsx');s=p.read_text().replace('import { stopAudio }','import { stopAudio, playCue }')
s=s.replace('import type { ArenaEvent }','import type { SoundKind } from "./config";\nimport type { ArenaEvent }')
s=s.replace('  const current = queue[0];','  const current = queue[0];\n  const [selected, setSelected] = useState("Sale Approved");')
s=s.replace('''            <select
              aria-label="Celebration preview"
              value=""
              onChange={(e) => launch(e.target.value)}
            >
              <option value="" disabled>
                Celebrations…
              </option>''','''            <select
              aria-label="Celebration preview"
              value={selected}
              onChange={(e) => { setSelected(e.target.value); launch(e.target.value); }}
            >''')
needle='''            <button
              onClick={() => {
                if (current) {'''
s=s.replace(needle,'''            <button onClick={() => launch(selected)}>Play</button>
            <button className="preview-featured" onClick={() => launch("Full Reward Ceremony")}>PLAY FULL REWARD CEREMONY</button>
            <button onClick={() => { stopAudio(); setQueue([]); setPaused(false); }}>Stop</button>
            <select aria-label="Sound preview" value="" disabled={!audio || !!current || !raw.settings.sound}
              onChange={(e) => { stopAudio(); playCue(e.target.value as SoundKind, raw.broadcast, 5, 6, true); }}>
              <option value="" disabled>Sound tests…</option>
              {([["sale","Sale Approved"],["milestone","Target Achieved"],["unlock","Spin Unlocked"],["wheel","Wheel Spinning"],["prize","Prize Won"],["champion","New Champion"]] as const).map(([kind,label]) => <option key={kind} value={kind}>{label}</option>)}
            </select>
            <button
              onClick={() => {
                if (current) {''')
p.write_text(s)
p=Path('broadcast/preview-navigation.css');s=p.read_text()+'''
.arena-preview-tools { flex-wrap:wrap; justify-content:center; width:max-content; max-width:90vw; }
.arena-preview-tools .preview-featured { color:#061316; background:linear-gradient(135deg,#f0c75e,#ffe59a); border-color:#f0c75e; }
''';p.write_text(s)
