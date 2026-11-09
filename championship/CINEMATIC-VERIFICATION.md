# Cinematic recognition and rewards — verification report

4 November 2026 · Obsidian Emerald Championship

## Presentation changes

- Replaced the separated sale toast and achievement layouts with a central geometric presentation: dimensional badge on the left; heading, agent name, team, approved-sales count and applicable bonus grouped together.
- Introduced `AchievementBadge.tsx`: nested, complete SVG shield paths, emerald metallic edge, thin inner gold frame, glossy dark face, mint approval check, wheel-unlock emblem and gift emblem. No botanical, laurel or wreath assets are used.
- Added `cinematic.css`: dimmed but recognizable Arena context, restrained blur, emerald beams, angular frames, subtle reflections, controlled rectangular particles and transform/opacity transitions. The underlying broadcast and leaderboard remain mounted.
- Default sale recognition runs approximately 4.2 seconds: short entrance, staged identity reveal, actual count update, hold and fade. Existing duration multipliers and event overrides remain authoritative.
- Bonus recognition uses the actual event's positive minor-unit amount. Pending approval, approved, paid, rejected and adjusted states are distinct. Zero-value milestones do not claim a bonus. Global and per-rule bonus visibility are honored, and amounts remain gated by target privacy settings.
- Unlock recognition has a dimensional wheel emblem and a separate transition into the authorized reward ceremony.
- The existing deterministic CSS 3D wheel keeps its assigned index, segment snapshot, manual-release gate and flat/reduced-motion fallback. Added rim lighting, pointer illumination and winning-segment contrast. Wheel tick synthesis now receives the assigned-index offset so its crossings match the configured landing rotation.
- Post-spin presentation now groups a prominent winner name with a large gold YOU WON panel and the exact assigned prize label. A gift shield, light sweep, restrained particles and stronger original fanfare distinguish the result from an ordinary approval. A smaller landed wheel stays inside the frame.
- New installations use a 4.5-second result hold. Presentation migration changes the old untouched 3.2-second default to 4.5 seconds only when no result override exists; customized reveal settings remain respected.
- Updated the original procedural approval, unlock and prize melodies. Prize fanfare is longer and more elaborate. The existing single AudioContext, explicit activation, master/event volume, quiet mode, cooldown, priority handling and cleanup remain in use. No external audio recordings were added.

## Admin integration

Existing enable switches, phase durations, intensity, sound settings, team/milestone labels, custom bonus/spin titles, amount privacy, result hold, 3D/flat mode and isolated rehearsal remain functional. Added real Show agent avatar and Show approved sales controls to the existing recognition editor. These are saved through the existing local command service and consumed by the actual ceremony renderer.

Sales, target qualification, bonus accounting, prize assignment, inventory, history, deduplication and rotation services were not rewritten. All new effects visualize existing data. Rehearsal examples, including monetary labels, are isolated test fixtures and do not create financial rewards.

## Verification results

Chrome tests passed for:

- Approved sale, positive bonus, spin unlocked, spinning wheel and final prize compositions at 1920×1080, 2560×1440 and 3840×2160.
- Stage and name bounds, copy containment, complete shield SVG path bounds and absence of document overflow.
- Two-, five-, ten- and custom seven-sale milestones; zero-value targets display no false bonus.
- Exact authorized PKR 2,500 bonus display from 250000 minor units; default privacy hides the amount; pending status reads BONUS PENDING APPROVAL.
- Monetary assigned-prize label and noncash assigned-prize name displayed unchanged.
- Admin avatar/sales/team switches persist and affect the actual isolated ceremony preview, without changing inventory.
- Explicit sound activation, no autoplay, one AudioContext, preview synthesis, disabled-event gating, saved sound controls and rotation ordering.
- Genuine overtakes, duplicate approval suppression, bounded backlog, independent score updates and reload without synthesized recognition events.
- Real entitlement sequence, chamber → wheel → assigned reveal → return, queued continuation, manual release, pause/resume, prize-catalogue change after assignment and rotation deferral.
- Reduced-motion rendering and fullscreen enter/exit.
- Zero browser exceptions in the completed suites.
- TypeScript and production build pass. Upstream Motion `use client` directive warnings are non-fatal.

The existing regression scripts were reused. `emerald-events.mjs` had one stale pre-V2 Admin-title assertion updated. An audio run interrupted by source hot reload was rerun successfully after editing stopped.

New test scripts: `.arena-qa/cinematic-visuals.mjs`, `.arena-qa/cinematic-admin.mjs`. Build log: `.arena-qa/cinematic-build.log`.

## Files changed

New: `championship/AchievementBadge.tsx`, `championship/cinematic.css`, this report and the cinematic verification scripts/screenshots.

Updated: `championship/Ceremony.tsx`, `championship/audio.ts`, `broadcast/config.ts`, `broadcast/Pages.tsx`, `src.tsx`.

## Screenshots

- `.arena-qa/cinematic-approved.png`
- `.arena-qa/cinematic-bonus-earned.png`
- `.arena-qa/cinematic-unlock.png`
- `.arena-qa/cinematic-wheel.png`
- `.arena-qa/cinematic-result.png`
- `.arena-qa/cinematic-noncash.png`

All screenshots use clearly labeled development rehearsals.

## Boundaries

The written design brief was available; the referenced earlier design image was not attached in the current request. The implementation follows its described composition and explicit no-leaves direction. The existing reward model stores configured prize labels rather than structured cash amount/currency fields, so the reveal preserves the assigned label exactly instead of inferring or inventing monetary values. This remains the existing browser-local development architecture. Physical TV viewing distance, speaker output and extended hardware burn-in were not certified by the browser tests. No deployment was performed.
