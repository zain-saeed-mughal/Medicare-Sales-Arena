# Simplified Admin & premium wheel

Completed November 4, 2026. Existing application and browser-local business services retained. No backend expansion or deployment.

## Admin changes

The primary sidebar now contains exactly ten sections: Dashboard, Live Control, Targets, Rewards & Spins, Leaderboard, Celebrations, Appearance & Sound, Agents, History and Settings. Collapse persistence, mobile drawer, role filtering and direct legacy links remain supported.

Dashboard now has a compact status/champion summary, three useful totals, one live preview and a short action list. The large decorative hero and dense command widgets were removed.

Live Control now has broadcast controls, a preview and one celebration selector. Rotation scheduling and the extended rehearsal studio remain secondary tabs. Less-used controls are disclosed on demand. Previews clone state and play only in the isolated monitor.

Targets groups milestones, agent assignments, team assignments, bonus review and advanced rules into secondary tabs. A read-only TV preview modal is available. Existing rule editors and accounting safeguards remain intact.

Rewards & Spins separates Prize Setup, Wheel Preview, Wheel Settings, Eligibility Rules, Pending Spins and Completed Rewards. The pending view no longer repeats prize setup or the legacy wheel. Pending/completed tabs open with the relevant status filter. Manual release remains in Live Control. Switching away from an unsaved wheel form asks before discarding changes.

Leaderboard initially shows essential controls; additional display settings are revealed on demand. Saving essential settings preserves hidden values. Celebrations retains per-event editing and preview, with advanced behavior and display fields collapsed. Appearance & Sound retains its topic tabs. Agents, History and Settings use quieter surfaces, spacing and grouped secondary navigation. Forms retain inline/native validation and sticky unsaved save/discard controls.

## Route mapping

No existing routes were deleted. Existing components and permission checks remain the source of truth.

| Primary section | Existing routes grouped beneath it |
|---|---|
| Dashboard | `/admin` |
| Live Control | `/admin/live-control`, `/admin/arena-control`, `/admin/modes`, `/admin/integration-preview` |
| Targets | `/admin/targets`, `/admin/targets/agents`, `/admin/targets/teams`, `/admin/targets/rules`, `/admin/bonus-review`, `/admin/reward-programs`, existing bonus routes |
| Rewards & Spins | `/admin/rewards`, `/admin/spin-management`, `/admin/spin-wheel`, `/admin/reward-operations` |
| Leaderboard | `/admin/leaderboard` |
| Celebrations | `/admin/celebrations`, `/admin/effects` |
| Appearance & Sound | `/admin/appearance` |
| Agents | `/admin/agents`, `/admin/participants`, `/admin/teams`, `/admin/sales`, `/admin/performance` |
| History | `/admin/spin-history`, `/admin/reward-history`, `/admin/activity` |
| Settings | `/admin/account`, `/admin/branding`, `/admin/settings`, `/admin/system-health`, `/admin/security`, `/admin/access`, `/admin/users`, `/admin/competitions` |

## Wheel and reveal

The shared live/Admin wheel now has a restrained brushed-gold rim, navy mechanical body, visible depth, softer floor shadow, larger detailed center cap and a sharper pointer. Segment labels counter-rotate with the rotor using the same easing, keeping them upright during the spin and at the assigned landing. Existing prize colors, indices, assignment snapshots and inventory rules are unchanged. The Admin preview now transitions to its landed state and illuminates the selected segment.

The result uses a distinct gold reward badge, centered agent/team identity, a prominent framed actual prize and a brief light sweep. Privacy settings, exact monetary formatting, existing audio cues and reduced-motion fallbacks remain in place. All visuals are live CSS/SVG/React components.

## Browser verification

- All 16 existing canonical Admin routes passed desktop 1920px and mobile 390px overflow checks, with zero browser exceptions and a working navigation drawer.
- All six Rewards & Spins tabs opened successfully. Wheel settings save and discard passed. Invalid duration was rejected by the form.
- Wheel preview index 3 landed at the correct 1260-degree target with one winning segment; sales, prize inventory, queue and history remained unchanged.
- Isolated Live Control rehearsal and target preview modal left business state unchanged.
- Essential/advanced Leaderboard disclosure preserved hidden values when saving.
- Wheel layouts passed at 1366, 1024, 768 and 390px widths. TV celebration layouts passed at 1080p, 1440p and 4K.
- Live playback regression passed deterministic assigned results, immutable snapshots, duplicate suppression, manual release, pause/resume, queue-aware rotation, fullscreen and reduced-motion flat fallback.
- Historical replay did not mutate the ledger. Arena Operator permissions still prohibit reward edits and inventory mutation.
- TypeScript passed. Production build passed in 8.49 seconds. Existing Motion dependency `use client` warnings remain non-blocking.

Screenshots were captured from actual Chrome rendering and inspected. They are verification artifacts, not application UI. QA uses isolated fictional browser data.

## Screenshots

- [Simplified Dashboard](../.arena-qa/simple-dashboard.png)
- [Rewards & Spins — Prize Setup](../.arena-qa/simple-rewards.png)
- [Wheel Preview — Admin](../.arena-qa/simple-wheel-admin.png)
- [New Wheel — TV](../.arena-qa/simple-ceremony-wheel.png)
- [Reward Reveal — TV](../.arena-qa/simple-ceremony-cash-result.png)
- [Mobile Wheel](../.arena-qa/simple-wheel-390.png)

Primary changes: `admin/SimplePages.tsx`, `admin/simple.css`, `admin/Admin.tsx`, `broadcast/Rewards.tsx`, progressive disclosure in `broadcast/Pages.tsx` and `admin/ConsolePages.tsx`, `championship/Wheel.tsx`, `championship/wheel-premium.css`, `championship/AchievementBadge.tsx`, and stylesheet imports in `src.tsx`.
