# Admin Command Console V2 — implementation report

4 November 2026 · Obsidian Emerald Championship

## Delivered

The existing Admin is now an emerald broadcast console with centralized, Admin-scoped design tokens, Sora typography, metallic green surfaces, champagne reward accents, a 262px grouped sidebar, 78px collapsed navigation and a sticky topbar. The sidebar uses distinct Lucide icons, active states, focus indicators and a persistent local collapse preference. Mobile uses a dismissible drawer with Escape support. The current operator and real local display heartbeat remain visible in the sidebar status area.

Existing React, forms, modals, tables, services and permissions were reused. No component framework, replacement reward engine, database or production deployment was added. TV layout is preserved; new TV-facing changes are optional leaderboard density/lead-margin settings and optional phase duration/visibility overrides.

## Primary pages and route mapping

| Console section | Primary route | Existing module / compatible route |
| --- | --- | --- |
| Overview Dashboard | `/admin` | Existing overview, operational metrics and actual Arena monitor |
| Spin Management | `/admin/spin-management` | `/admin/spin-wheel`; prize catalogue, wheel preview, configuration |
| System Health | `/admin/system-health` | `/admin/health`; new measured browser/runtime summary |
| Reward Programs | `/admin/reward-programs` | `/admin/programs`; existing target-rule studio and program gallery |
| Live Arena Controls | `/admin/live-control` | `/admin/arena-control`; director, schedule links, queue and actual monitor |
| Agent Management | `/admin/agents` | `/admin/participants`, `/admin/teams`; existing profile editor |
| Sales & Performance | `/admin/performance` | New period standings around existing `/admin/sales` workflow |
| Target Management | `/admin/targets` | Existing target/bonus services, period tabs and advanced assignments |
| Spin & Rewards | `/admin/rewards` | `/admin/reward-operations`; preserved inventory, entitlement and fulfillment tools |
| Leaderboard Settings | `/admin/leaderboard` | Actual draft-preview composer |
| Celebration Settings | `/admin/celebrations` | `/admin/effects`; phase selector, controls and isolated preview |
| Spin History | `/admin/spin-history` | `/admin/reward-history`; search, status/date filters and original-result inspector |
| Appearance & Sound | `/admin/appearance` | Appearance, Sound and Branding tabs; `/admin/branding` retained |
| Integration Preview | `/admin/integration-preview` | `/admin/integration`; isolated rehearsal studio |
| IP Perimeter Security | `/admin/security` | Honest local capability summary; no pretend firewall |
| Account | `/admin/account` | Operator, role, permission summary and session logout |

Other preserved paths include `/admin/modes`, `/admin/bonuses`, `/admin/activity`, `/admin/access`, `/admin/settings`, `/admin/competitions`, `/admin/targets/rules`, `/admin/targets/agents`, `/admin/targets/teams`, `/admin/bonus-review`, `/admin/bonuses/history` and `/admin/users`.

## Functional controls

- Overview: actual approved-sales count, champion, leading team, sound/rotation state, displayed agents, pending spins, active targets, six shortcuts and retained broadcast events.
- Wheel Studio: three-column desktop catalogue/preview/settings layout; existing prize labels, icon, color, weight, inventory and active state; ordering and inactive duplication; local rotate, assigned-segment selection, flat/3D and reset controls; duration, reveal, initiation and sound settings. Restore defaults edits a draft; it does not change live settings until saved.
- Recognition Programs: active-rule gallery plus existing create/edit/versioned rules. Scope, audience, dates, bonus, spin count, prize eligibility and maximum awards remain owned by the target service. Special competitions use the existing schedule rather than a competing rule system.
- Director: supported modes, manual overrides, queue pause, rotation pause, sound, authorized spin release, default mode, scheduled-order link and separate labeled local rehearsals. Queue status is separate from assigned financial rewards.
- Participants: name search and team filtering, current rank/sales, existing avatar/team/badge/visibility editor and the actual FeaturedPlayer component in its preview. Target assignments remain linked to the original assignment workflow.
- Performance: daily/weekly/monthly approved standings and target progress with the original permission-checked review/correction workflow.
- Leaderboard: draft changes update the actual iframe renderer before save; count, period, Top Three, avatars, teams, sales, movement, targets, lead margin, medal style and row density are persisted. Recognition/radar controls use the existing configuration service.
- Recognition Engine: event selector and optional phase visibility/base durations, master gates, global intensity/style, team/milestone labels and original sound controls. Prize result duration also updates the wheel reveal setting. Phase durations are snapshotted when a ceremony starts. FIFO queue ordering is intentionally retained; no arbitrary financial-event reordering is introduced.
- History: search by agent/team/prize/spin, date/status filters, newest-first results, original source/prize/fulfillment details and isolated replay of retained completed outcomes. Missing historical presentation snapshots are reported instead of generating replacement outcomes.
- Appearance: implemented theme/background/contrast/stage/ranking choices, ticker/metrics, logo/branding, dimensional fallback and recognition controls. Sound tab has real master enable/volume, event toggles/volumes, quiet mode, cooldown and previews.
- Rehearsal Studio: mode selection, 2/5/10/custom milestone, bonus, unlock, wheel, champion and team-lead previews. The custom threshold modifies only a cloned fixture. Sound previews have no save action on this page.
- Health: heartbeat, local sync mechanism, tab role, queue size/capacity, retained skipped-presentation audit count, rotation/manual source, last recorded activity, actual ledger bytes and document-load timing. It does not invent remote devices or backend metrics.

## Save and isolation boundaries

Forms load saved values, edit drafts, use native field validation and show a sticky unsaved-change bar with Discard and Save. Existing live preview callbacks reflect drafts. Saves await the existing serialized command transaction; failed leaderboard/presentation writes retain an error and do not mark the draft saved. Defaults are exposed where an actual default exists. Immediate operational commands and catalogue actions are intentionally immediate and labeled separately from form saves.

Broadcast settings, profiles, rules and operational mutations use the existing browser-local ledger and same-origin storage synchronization. Sidebar collapse is a separate local UI preference. Mode/segment/camera choices in rehearsals, temporary events and sound previews stay in component memory. Embedded monitors do not simulate sales, issue rewards, acknowledge real events, drive rotation or report themselves as real displays.

## Files changed

New: `admin/ConsolePages.tsx`, `admin/console.css`, this report and focused scripts/screenshots under `.arena-qa/`.

Updated: `admin/Admin.tsx`, `admin/ui.tsx`, `admin/service.ts` (permission aliases only), `broadcast/Pages.tsx`, `broadcast/Rewards.tsx`, `broadcast/Milestones.tsx`, `broadcast/config.ts`, `championship/Controls.tsx`, `championship/Arena.tsx`, `championship/Ceremony.tsx`, `championship/championship.css`.

Existing `Panel`, `Form`, `Table`, `Modal`, `Monitor`, catalogue, target, sales and accounting components remain in use. The UI adapts those primitives instead of introducing a second framework.

## Verification

- All 16 primary destinations rendered in Chrome at 1920×1080 and 390×844, without horizontal page overflow or browser exceptions. Wide data tables use contained horizontal scrolling on mobile.
- Tablet wheel-studio layout checked at 1024×768.
- Collapsed sidebar persisted after reload. Mobile drawer opened, closed via scrim and dismissed with Escape; expanded-state accessibility attribute was checked.
- Actual player-card modal rendered without document overflow.
- Leaderboard draft changed the embedded rankings from 10 to 5 without changing stored count. Discard restored 10; saving 6 persisted through reload.
- Wheel rotation/flat/reset previews left spins unchanged. Duration save, defaults draft and discard passed.
- Event-duration persistence passed. Isolated milestone/unlock/wheel/champion/team presets left sales, spins, targets, queue, sequence and broadcast settings unchanged.
- Historical outcome detail/replay left the complete ledger byte-for-byte unchanged.
- Arena Operator could open the director, but reward-program access and reward inventory mutation were denied.
- 25 legacy route mappings checked.
- Audio activation, single AudioContext, original synthesis, disabled-event gate, saved recognition controls and rotation reordering passed.
- Accounting regression passed: permissions, exact currency/CSV, tier policy, reversals/recovery, immutable rules and period boundaries.
- Concurrent approvals/retries preserved one team award, two inventory entitlements and exactly two spin assignments.
- Arena regression passed at 1080p, 1440p and 4K; genuine entitlement, duplicate protection, manual release, pause/resume, live-score continuity, assigned-result integrity, rotation deferral, reduced-motion fallback and fullscreen enter/exit passed.
- TypeScript and production build pass. Upstream Motion `use client` warnings remain non-fatal.

Test scripts: `console-smoke.mjs`, `console-interactions.mjs`, `console-security-replay.mjs`, `console-final-visuals.mjs`, plus the existing `emerald-accounting.mjs`, `control-inventory.mjs`, `emerald-settings.mjs` and `emerald-playout.mjs` under `.arena-qa/`.

## Screenshots

Development fixtures only:

- `.arena-qa/console-overview-1920.png`
- `.arena-qa/console-spin-management-1920.png`
- `.arena-qa/console-live-control-1920.png`
- `.arena-qa/console-leaderboard-1920.png`
- `.arena-qa/console-appearance-1920.png`
- `.arena-qa/console-player-editor.png`
- `.arena-qa/console-tablet.png`
- `.arena-qa/console-overview-390.png`

## Current boundaries

This remains a browser-local development system. Production Admin is still disabled pending real server identity and service APIs. IP enforcement, independent device telemetry and cross-device synchronization require backend infrastructure. Security describes that boundary rather than providing nonfunctional switches. Programs share the existing inventory-safe wheel and global visual style; there is no separate multi-wheel engine. Hall of Fame uses stored completed results, and its recognition is a mode rather than a newly fabricated award event. Queue order remains fixed FIFO. Physical TV hardware, speaker quality and extended uptime were not newly certified by these browser tests. Nothing was deployed.
