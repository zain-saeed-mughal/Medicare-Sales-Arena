# Demo Showcase Controller and Premium Sound — verification

November 5, 2026. Both requested features are implemented together. Dark Maroon Arena and Admin layouts are preserved.

## Open and use

Development URL: **http://127.0.0.1:5191/arena?demo**

The floating panel is at the bottom right. No Admin navigation or Admin demo panel was added.

| Control | Exact location / behavior |
|---|---|
| Demo speed | Top of the panel. Normal = existing 22 seconds; Fast = default 5 seconds; Ultra Fast = 2 seconds. |
| Start / Pause / Resume / Stop | Row immediately beneath speed. The same Pause/Resume and Stop controls govern manual and automatic showcases. |
| Play Full Reward Ceremony | Prominent ruby button beneath playback controls. Unlock → chamber → wheel → fixed demo prize → return. |
| Individual previews | Quick Preview section: Sale Approved, 2/5/10-Sale Milestones, Bonus Earned, Spin Unlocked, Reward Wheel, Prize Reveal, New Champion. |
| Play All Animations / Skip Current | Immediately beneath Quick Preview. Natural completion advances the queue; Skip ends only the current job. |
| Enable Audio / test chime | Main panel button; also “Enable Demo Audio” inside Sound Test. Requires a browser click. |
| Sound Test | Expand to access all seven individual sound tests, Test All Sounds, Mute/Unmute, Master Volume and Quiet mode. |
| Audio Diagnostics | Expand at the bottom: context state, signal RMS, current event, active nodes, last request/error, volume and activation state. Includes Chrome/Windows output troubleshooting. |
| Collapse / Hide | Panel header. Hide removes the entire panel. **Ctrl+Shift+D** restores it. |
| Normal Arena sound | Minimal top-right audio control at `/arena`; no Demo Controller. |

## Safety and architecture

- A dedicated in-memory seed supplies the rehearsal roster. It does not subscribe to live store updates, start the real sales simulator, broadcast rotation, display-presence writer or preview-message receiver.
- All demo events stay in a bounded local React queue. No sales/bonus/spin/financial transaction methods are called.
- Real sales, target records, entitlements, inventory, accounting and permanent history are untouched. Existing stored application data was compared byte-for-byte after a full ceremony.
- A single effect owns the automatic interval. Repeated Start clicks cannot create duplicate timers. Busy automatic ticks are deferred rather than accumulating an unbounded queue.
- Manual requests queue behind the active job; repeated queued actions are coalesced. Only one Ceremony renders at a time.
- The fixed demonstration reward is **PKR 5,000**, assigned to segment index 2 of six. Landing is **1320 degrees**, using the existing deterministic wheel calculation. This is explicitly rehearsal data, never a real reward assignment.
- Existing Ceremony, wheel, animation and sound engines are reused. Ordinary animation and spin durations are not shortened by the speed selector.
- Production uses a compile-time DEV guard and dynamic import. The controller module and its CSS are absent from production assets; `/arena?demo` in production renders the clean normal Arena.

## Audio findings and changes

- New-install seed previously had master sound disabled. New installs now allow sound after explicit activation; existing saved master-mute preferences are not overwritten.
- The old status could say Ready despite master mute. Status now distinguishes activation required, muted, ready and blocked/unavailable, with an actionable master-mute explanation.
- Original gain multiplication was conservative. The shared mixer now uses a perceptual master-volume curve, per-event volume, a limiter and short envelopes. Quiet mode remains an additional attenuation, not a separate audio engine.
- One AudioContext is shared by activation, live ceremonies and all demo tests. User-gesture activation is retained. Hidden tabs, cancellation, local mute and master-volume zero stop or suppress output.
- The wheel adds launch and lock accents. Rotation ticks follow half-segment boundary crossings of the same cubic-bezier curve used by the wheel. Resume uses elapsed wheel time rather than restarting the click sequence.
- Sale, milestones, champion, unlock and prize cues are original procedural synthesis. Prize has a longer four-chord cadence than an ordinary sale.
- After listening feedback, the later ensemble experiment was removed and the previous warmer bell/chord reward version was restored. Both activation controls use that reward flourish rather than the original sale beep.
- No downloaded samples, recognizable game-show music, network assets or autoplay bypasses are used.

## Verification

Chrome at 1920 × 1080:

- Default 5-second interval; repeated Start; Pause/Resume/Stop.
- All nine individual previews and Skip Current.
- Full unlock/chamber/wheel/result/return; exact demo prize and wheel landing.
- Natural completion of Play All Animations and Test All Sounds, with no overlapping ceremonies.
- Queue de-duplication, cancellation and zero remaining audio nodes after stop/pause.
- Real Chrome click activation; browser signal for sale, milestones, unlock, wheel, prize and champion.
- Local mute/unmute, master volume 0/100, quiet attenuation and saved Admin master-mute synchronization.
- Quiet measurement was approximately 29% of the ordinary signal in the sampled run.
- Wheel timing: 22 segment crossings for the six-segment/index-2 fixture, error under 0.001 segment against CSS easing. Late tick gap approximately 0.697 s versus an early gap of 0.085 s.
- Reduced-motion fallback, hidden-panel recovery, viewport bounds and clean normal `/arena`.
- Persistent store unchanged byte-for-byte and rehearsal leaderboard unchanged after the full sequence.
- Production controller absence checked in Chrome and emitted JS/CSS.
- TypeScript and production build passed; existing Motion directive warnings are non-blocking.

Evidence scripts and captures are in `.arena-qa`: `demo-integrated.mjs`, `demo-sounds.mjs`, `demo-normal.mjs`, `demo-production.mjs`, `demo-audio-evidence.json`, `demo-sound-tests.json`, `demo-controller-1920.png`, `demo-sound-panel.png`, `demo-hidden-1920.png`, `demo-prize.png`, `demo-production-clean.png`, and `demo-build.log`.

## Physical audio and remaining limits

The user confirmed hearing the activation chime through their speakers and provided comparative sound-design feedback. The assistant did not personally hear the target speakers. Browser signal and context diagnostics do not prove physical output for every cue. The full revised sequence has browser verification; final subjective sound-quality approval is not claimed.

No known controller functionality remains incomplete. Admin configuration and all business workflows remain in place. No deployment was performed.
