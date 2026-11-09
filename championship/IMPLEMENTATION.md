# Obsidian Emerald Championship — implementation report

Implemented 4 November 2026 in the existing Medicare Arena application.

## Design and components

The active Arena now uses an original obsidian, emerald, mint and metallic medal palette. A horizontal broadcast score strip, prominent player identity stage, thin editorial rules, large approved-sales figures and a persistent rankings column replace the Nexus Core composition. Initials are the fallback when no agent photograph is configured. Existing uploaded profiles remain supported.

- Daily: large champion identity, lead margin, gold/silver/bronze Top Three, genuine Rising Star snapshots and next-target radar.
- Weekly: stepped three-player podium, team comparison and compact target race.
- Monthly: gold championship stage, monthly progress, Top Three and completed-results history strip.
- Team Battle: custom team-versus-team stage. Leaderboard Focus expands the rankings. Hall of Fame displays saved completed or archived competition results; it has an honest empty state when history is unavailable.
- Hall history is not reconstructed from current rankings. New competition completion stores winner/team results. Existing historical records without team snapshots retain their existing data limitations.
- All views retain the leaderboard, ticker, approved-sales data flow, privacy projection, fullscreen and isolated Admin monitor.

New components and modules: `ChampionshipArena`, `FeaturedPlayer`, `TopThree`, `WeeklyPodium`, `Radar`, `TargetRace`, `TeamDuel`, `TeamComparison`, `Hall`, `Crest`, `Wheel`, `Ceremony`, `SoundControls` and `RecognitionControls` in `championship/`.

## Celebrations and rewards

Approval recognition is generated in the serialized approval path. Strict score overtakes trigger champion/team recognition; ties and refreshes do not synthesize wins. Presentation IDs suppress duplicates. Milestones 2, 5 and 10 have escalating treatments; arbitrary configured thresholds are supported. Bonus messages use actual award status. Authorized spin events have separate unlock, chamber, spin, assigned-prize reveal and return phases.

The reward wheel uses layered CSS 3D geometry, an SVG segment face, rim, hub, pedestal, depth and reflection. It is not WebGL. Rotation lands on the snapshotted prize index; presentation never redraws a reward. Flat rendering and reduced-motion fallbacks are available. Manual spin release, pause/resume and live leaderboard updates during ceremonies remain functional.

The presentation queue is bounded at 96. Under extreme backlog it skips a pending presentation (ordinary sales first), records an audit entry and retains all financial awards and assigned outcomes. A skipped assigned-spin presentation is marked completed without reassigning its reward. This is a deliberate overload policy rather than unlimited playback backlog.

## Sound and rotation

All sound cues are original procedural Web Audio synthesis in `championship/audio.ts`. No external recordings, sampled music or third-party sound assets were incorporated; there is no external sound attribution requirement. Existing font/icon dependencies retain their own licenses.

Audio requires explicit activation in each TV browser. Controls provide master volume, per-event enable/volume, quiet mode, cooldown and local previews. A single audio context, bounded priority queue and node cleanup prevent accumulating playback. Wheel ticks follow the wheel easing and segment crossings. Hidden displays stop audio.

Rotation follows the saved enabled-mode order and individual durations. Manual selection holds for 60 seconds. Independent rotation pause is available; ceremonies and broadcast pause defer rotation. Hidden/isolated monitors do not drive the schedule or acknowledge real events.

## Admin integration

The existing Control Center and routes are preserved. Added mode ordering, Hall of Fame mode, rotation pause, champion/team rehearsals, recognition visibility, radar proximity, champion composition, dimensional/flat wheel selection and per-event audio controls. Saved recognition/audio settings also reach the isolated preview. Existing sales, targets, bonuses, inventory, access, audit, branding and reward-history workflows remain in place.

## Files changed

New: `championship/Arena.tsx`, `Players.tsx`, `data.ts`, `Ceremony.tsx`, `Wheel.tsx`, `audio.ts`, `Controls.tsx`, `championship.css`, and this report.

Updated: `src.tsx`, `arenaEvents.ts`, `Celebration.tsx`, `broadcast/config.ts`, `broadcast/commands.ts`, `broadcast/Pages.tsx`, `admin/model.ts`, `admin/seed.ts`, `admin/service.ts`, `admin/Catalog.tsx`.

Browser verification scripts/screenshots are in `.arena-qa/`. The pre-change source snapshot is `.arena-qa/pre-emerald/`; this workspace has no Git repository. Older visual components remain available for compatibility but are not the active Arena renderer.

## Verification results

- Chrome: all ten broadcast modes rendered at 1920 × 1080 without document overflow or browser exceptions.
- Daily, Weekly and Monthly: verified 1920 × 1080, 2560 × 1440 and 3840 × 2160; leaderboard rows stayed inside the content region and inspected player names did not clip.
- Fixed inherited list-row sizing that cramped leaderboard progress labels; improved rank/name spacing and contrast.
- Fullscreen enter/exit and reduced-motion flat wheel passed.
- Milestone rehearsals 2/5/10/7 left sales, awards, spins and real queue unchanged.
- Chamber → wheel → assigned result → return passed, including changing the prize catalogue after assignment.
- Real seven-sale entitlement, duplicate approval, manual release, pause/resume and live score updates during playback passed. Rotation waited for the queue.
- Genuine rank/team overtakes, tie suppression, reload suppression, stable rank snapshots, migration and 105-sale bounded backlog passed.
- Original accounting regressions passed: permissions, exact currency/CSV handling, tier policy, reversals/recovery, immutable rule snapshots and period boundaries.
- Concurrent distinct approvals produced one team award and two inventory entitlements; concurrent retries allocated exactly two spins.
- All 15 Control Center pages rendered without horizontal overflow or browser errors. Recognition settings, sound gates and mode reordering were tested through browser controls.
- Audio instrumentation verified no autoplay, a single AudioContext, functioning preview synthesis and disabled-event suppression.
- Short 180-frame foreground cadence sample: median 16.7 ms. This is not a physical-TV benchmark or sustained burn-in test.
- TypeScript and production build pass. Vite reports non-fatal upstream Motion `use client` directive warnings.

## Screenshots

All are isolated development fixtures, not production sales data. Reward images are explicitly labeled visual rehearsals.

- `.arena-qa/emerald-final-Daily.png`
- `.arena-qa/emerald-final-Weekly.png`
- `.arena-qa/emerald-final-Monthly.png`
- `.arena-qa/emerald-Team-Battle.png`
- `.arena-qa/emerald-Leaderboard-Focus.png`
- `.arena-qa/emerald-hall-of-fame.png` (saved completed competition fixture)
- `.arena-qa/emerald-milestone-2.png`, `emerald-milestone-5.png`, `emerald-milestone-10.png`, `emerald-milestone-7.png`
- `.arena-qa/emerald-reward-chamber.png`, `emerald-reward-wheel.png`, `emerald-reward-result.png`

## Limits

The existing browser-local development service remains the data source. Cross-tab synchronization is within the same browser/origin; no server transport, real payment integration or cross-device deployment was added. The existing production Admin restriction remains. Hall of Fame requires stored completed results and does not fabricate past weekly/monthly champions. Real office-TV viewing distance, speaker quality, prolonged playback and lower-powered hardware still need on-device acceptance. The external FE website was unavailable during inspection; no reference code or assets were copied.
