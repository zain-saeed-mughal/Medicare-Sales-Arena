# Dark Maroon Championship — verification

Verified November 5, 2026. The approved Dark Maroon reference is the sole visual direction. Existing layout and business architecture were retained.

## Changes

- Centralized burgundy, ruby, rose, gold, silver, bronze and neutral text tokens in `theme/maroon-tokens.css`.
- Replaced inherited blue/emerald presentation colors across shared Arena and Admin styles; added reference-specific materials in `theme/maroon.css`.
- Matched Daily Arena's dark wine cards, diagonal ruby lighting, luminous stage, metallic champion emblem, medal-ranked cards, maroon leaderboard, neutral labels and ruby ticker.
- Applied the same materials to all ten broadcast modes, Admin navigation/forms/tables/dialogs, celebration badges, reward wheel and prize reveal.
- Wheel materials use a coordinated maroon palette without changing saved prize identities, amounts, order, assignment or inventory.
- Updated default theme and presentation migration to Dark Maroon Championship. No sales, targets, rewards or financial records were deleted or reset.
- Audited the cancelled task before editing; its TypeScript, build and playout checks had completed successfully. Working functionality was retained. Presentation snapshots are saved in `.arena-qa/maroon-before`.

## Verification results

- TypeScript: `npx tsc --noEmit` passed.
- Production: `npm run build` passed (16.29 seconds). Existing Motion module directive warnings are non-blocking.
- All ten Arena modes: 1920×1080, 2560×1440 and 3840×2160; no tested name, row, module or viewport overflow.
- All sixteen tested Admin routes: desktop 1920px and mobile 390px; navigation drawer and all six Rewards tabs passed. Wheel additionally checked on laptop/tablet/mobile widths.
- Actual Chrome screenshots inspected for Daily, Weekly, Monthly, Top 3, Leaderboard Focus, wheel, approved sale, bonus, spin unlocked, cash prize reveal, Dashboard and Admin wheel.
- Reference comparison corrected ticker contrast, first metric text, leaderboard progress labels, avatar materials, bottom-card rounding, ruby light streaks and champion gold.
- Actual approval animation: cumulative layout shift 0, median frame interval 16.7 ms, p95 16.9 ms in the sampled Chrome run. This is a local sample, not a hardware guarantee.
- Actual playout: custom milestone, duplicate protection, live scores during playback, manual spin release, pause/resume, immutable prize snapshot, rotation deferral, fullscreen and reduced motion passed.
- Admin save/discard, exact preview landing on index 3 (1260 degrees), safe rehearsals and unchanged inventory/ledger passed.
- Accounting regression: permissions, CSV, tier policy, reversals, migration-safe rules and period boundaries passed.
- Chrome audio activation produced a running 48 kHz AudioContext and measurable output for sale, milestones 2/5/10, unlock and prize cues. Local mute and zero master volume produced silence. Physical office speakers were not tested.
- No browser exceptions in the completed suites.

## Actual 1920×1080 captures

- [Daily and Top 3](../.arena-qa/maroon-Daily-Arena.png)
- [Weekly](../.arena-qa/maroon-Weekly-Arena.png)
- [Monthly](../.arena-qa/maroon-Monthly-Arena.png)
- [Leaderboard Focus](../.arena-qa/maroon-Leaderboard-Focus.png)
- [Sale Approved](../.arena-qa/maroon-ceremony-approved.png)
- [Bonus Earned](../.arena-qa/maroon-ceremony-bonus-earned.png)
- [Spin Unlocked](../.arena-qa/maroon-ceremony-unlock.png)
- [Reward Wheel](../.arena-qa/maroon-ceremony-wheel.png)
- [Prize Reveal](../.arena-qa/maroon-ceremony-cash-result.png)
- [Admin Dashboard](../.arena-qa/maroon-dashboard.png)
- [Admin Wheel](../.arena-qa/maroon-wheel-admin.png)

Tests used isolated Chrome profiles and rehearsal fixtures. No deployment or backend expansion was performed. Preview remains available at http://127.0.0.1:5191/arena and /admin. Reference fidelity was judged visually, not claimed as pixel-identical; viewport geometry and live values differ from the supplied reference.
