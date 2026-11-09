# Admin functionality repair and verification

Updated 2026-11-05. Browser-local development application; no cross-device synchronization is claimed. Tests use disposable Chrome profiles, never the user's saved ledger.

## Latest requested behavior

- `/arena?demo` now normalizes to `/arena`. The isolated Demo Controller is no longer mounted or bundled. Its source is retained, not active.
- All Arena displays observe the shared browser-local broadcast settings.
- Arena startup no longer starts automatic simulated approvals. Legacy `simulate=true` does not cause a feed or recurring ceremonies. Already-earned queued rewards are preserved.
- Audio still requires a trusted activation click in the Arena browser. Master mute, per-event settings, volume and quiet mode remain authoritative.

## Checklist and evidence boundaries

The initial source checklist was created before application edits. Thirty Admin routes were inventoried, including legacy routes. Sixteen primary routes were checked at 1920×1080 and 390px. Route coverage does not mean every destructive action or every combination of controls was independently exercised. The table distinguishes direct browser interaction, service regression and source inspection.

| Page / control | Before / issue | Repair or retained behavior | Verification |
|---|---|---|---|
| Dashboard: display status | Heartbeat described as display connectivity | Labels now explicitly say local Arena tab / heartbeat | Primary route and screenshot check; presence code inspection |
| Dashboard: navigation, champion, queue | Existing real-state summaries and permission-filtered links | Preserved | Route inventory and 1080p/mobile checks |
| Live Control: Daily / Weekly / Monthly and seven other modes | Separate Demo renderer ignored shared mode state | Retired Demo route; shared Arena is used | All ten selections asserted in normal Arena and embedded monitor |
| Live Control: automatic rotation | Pause toggle could not start disabled rotation | Start rotation enables scheduler, clears hold; pause/resume retains controls | Actual timed mode change and pause/resume browser assertions |
| Live Control: celebrations | Disabled master generation was not obvious | Enable action for disabled generation; pause/resume and explicit state text | Saved state and actual controls checked |
| Live Control: manual spin release | Action available without an eligible reward; duplicate release possible | Disabled unless assigned manual reward is ready; command validates initiation/pause and deduplicates releases | Dedicated assigned-spin browser regression |
| Live Control: sound / default / release hold | Shared actions existed but lacked immediate local feedback | Busy guard and status beside controls; state explanation | Cross-tab command test |
| Live Control: safe preview | Existing cloned presentation | Preserved; no business writes | Reward-studio rehearsal regression checks unchanged ledger |
| Mode schedule: enable, order, duration, default, statistics | Stale local draft; no reload/conflict protection | Conflict-aware draft and discard/reload; existing validation retained | Source inspection and route inventory; timed scheduler regression |
| Leaderboard: Top 3 / medals | Theme styled top rows even with medals disabled | Styles now require configured medal class | Browser toggle -> actual Arena DOM assertions |
| Leaderboard: rows, avatars, teams, sales, movement, progress, density and period | Existing bindings; keyed form could discard drafts | Shared conflict-aware form; active bindings retained | Essential/advanced round-trip test; all-mode layout regression; inventory |
| Leaderboard position | Right option conflicted with approved fixed-left requirement | Only Left offered; renderer retains 32/68 Left | 1080p, 1440p and 4K geometry assertions |
| Appearance: background, contrast and accent | Later theme overrides defeated saved values | Active maroon selectors consume settings | Cross-tab Grid assertion; screenshots; source checks |
| Appearance: champion composition / highlight | Portrait targeted retired hero | Active hero reverses copy/sculpture columns; highlight connected | Cross-tab Portrait assertion and actual screenshot |
| Appearance: ranking accent | Theme colors overrode Electric option | Active medal rows consume accent choice | Source and screenshot regression |
| Branding: logo, title, office, label, competition | Shared draft could remain stale | Stable saved initial values; shared reload/discard/defaults | Source wiring and route inventory; preview rendering |
| Recognition: event phases | Missing Wheel editor; some previews started wrong phase | Wheel phase added, selected preview phase forwarded | Wheel editor save and selected preview browser check |
| Recognition: spin / reveal timing | Separate overrides could conflict with wheel settings | Canonical wheel duration and reveal control actual animation/timer | Saved duration assertion; exact landing/reveal regressions |
| Recognition: approved default duration | Editor showed 3.4s, runtime used 4.2s | Editor matches 4.2s | Source comparison |
| Recognition: agent/team/sales/privacy/intensity | Existing renderer flags | Preserved | Ceremony/reduced-motion regressions; privacy code inspection |
| Audio: interrupted cue | Unrelated store updates retriggered sound effect cleanup | Effect depends on serialized audio settings, not object identity | Chrome wheel cue survives unrelated writes; prize RMS measured |
| Audio: enable/test | Test could be silent when unlock event gain was zero | Explicit test uses audible event gain, while honoring master volume/mute | Trusted click and nonzero Chrome analyser signal |
| Audio: per-event save | Save force-enabled legacy category gates | Removed forced enabling; category gates explicitly editable | Source inspection; normal playback/mute checks |
| Audio: draft/preview | Stale draft and uncaught activation failures | Conflict-aware draft, reload, busy guard and preview errors | Source inspection and sound-engine regression |
| Prize Setup: name, amount, currency | No typed cash amount/currency controls | Added minor-unit amount/currency and assignment-time formatted snapshot | Browser create/save -> wheel labels; TypeScript |
| Prize Setup: icon/color | Wheel ignored stored color and icon | Wheel renders configured material and icon | Browser icon/label assertion; source color binding |
| Prize Setup: weight/inventory/archive/order | Existing assignment and archive logic | Added numeric/color validation; historical snapshots preserved | Inventory concurrency regression; six-tab browser test |
| Wheel preview / settings | Preview ignored saved Flat preference | Initializes/synchronizes quality setting; duration/reveal canonical | Exact assigned index landing; zero inventory/queue/history changes |
| Targets / assignments / bonuses | Existing typed ledger, effective rules and immutable award snapshots | Preserved | Accounting, tier policy, period boundaries, rule-version, reversal, payment permission and CSV regressions |
| Target inventory retry | Concurrent requests could be high risk | Existing serialized allocation retained | Two concurrent approvals and retries allocate exact two entitled spins |
| Agent / team profile | Preview used retired player; badge/team color incomplete | Active performer card preview; badge/team colors connected | Source inspection and route rendering; historical sales untouched |
| Reward History / detail / replay | Original assigned result replay already safe | Preserved | Details/replay UI assertions; byte-for-byte ledger unchanged |
| History filters / CSV | Existing filters and export logic | Preserved | Inventory, source checks and accounting CSV assertion |
| Shared forms | Initial state captured once; stale overwrites possible | Clean forms refresh; dirty forms block save and request explicit reload; save feedback; defaults merge | Cross-tab dirty conflict, reload and persistence browser assertions |
| Settings / account / security / access | Browser-local roles, no production service | Preserved; no production-security claims | Four-role command matrix, manager team boundary, production lockout check |
| Admin navigation / responsive UI | Existing pages | Preserved | 30-route inventory, 16 primary routes × desktop/mobile, drawer check |
| Arena visuals / reduced motion | Existing Dark Maroon stage and left leaderboard | Preserved | Ten modes × 1080p/1440p/4K, geometry/clipping checks and reduced-motion assertion |

## Evidence files

- `.arena-qa/admin-control-inventory.json`: page-level buttons, fields, select choices and links.
- `.arena-qa/admin-role-results.json`: all four roles across protected service areas.
- `.arena-qa/admin-functional-results.json`: cross-tab visibility, stale drafts, appearance, prizes and duration persistence.
- `.arena-qa/admin-live-controls.mjs`: user's exact old Demo URL, all modes, rotation and manual spin release.
- `.arena-qa/admin-audio-once.mjs`: normal-browser activation, audio during state writes, fanfare and idle no-loop checks.
- `.arena-qa/left-layout.mjs`, `maroon-admin.mjs`, `simple-admin.mjs`, `emerald-accounting.mjs`, `control-inventory.mjs`, `console-security-replay.mjs`: regression suites.

## Practical limits

Synchronization requires the same browser profile and origin (`127.0.0.1:5191` is different from `localhost:5191`). Rotation runs only with a visible normal Arena tab and waits for queued ceremonies. Local Admin previews are intentionally silent presentation monitors; the TV must activate its own audio. Physical speaker output is not established by analyser measurements. Existing earned rewards are not deleted to hide a queue. Production Admin remains unavailable without a production service.

Final build / last targeted test results are recorded below after execution.

Final targeted results: strict TypeScript and production build passed. All ten mode selections updated normal Arena and embedded monitor. Start/pause/resume rotation and celebrations passed. Authorized manual spin released, landed and revealed the assigned prize. Chrome activation chime RMS peak 0.04369; prize fanfare peak 0.02354; wheel sound survived unrelated store writes. After completion, 25 seconds idle produced no new sales, spins, queue entries or repeated celebration even with legacy simulate=true. Physical speaker output was not verified. Demo isolation tests passed before its removal; they are superseded by the requested route retirement.
