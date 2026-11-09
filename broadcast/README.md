# Arena Control Center

The Admin entry point is `/admin`; the TV remains `/arena`. This restructuring keeps the existing React/Vite renderer, browser-local ledger, approval processing, target engine, assigned-prize snapshots and FIFO celebration queue.

## Navigation and workflows

Primary sections: Overview, Live TV Control, Arena Modes, Leaderboard Settings, Agent & Team Display, Sales Targets, Bonus Rules, Spin Wheel, Reward History, Theme & Layout, Animations & Sounds, Branding, Activity Logs, Admin Access and Settings.

Source-sale review and correction remain at `/admin/sales`, accessible through the sidebar's secondary link. Award approval/correction is at `/admin/bonus-review`; compensation history remains `/admin/bonuses/history`. Advanced rule versions and assignments remain at `/admin/targets/rules`, `/admin/targets/agents` and `/admin/targets/teams`. Competition scheduling remains at `/admin/competitions`. Existing `/admin/arena-control`, `/admin/agents`, `/admin/teams`, `/admin/users` and `/admin/rewards` links still resolve.

## Typed presentation configuration

`config.ts` separates presentation settings, mode rotation, display profiles, appearance, branding, phase/audio controls and wheel presentation from financial records. Existing v3 browser ledgers receive defaults on read; records are retained. Mutations still use the existing serialized development command service and audit trail.

Display visibility filters only the presentation projection. Internal IDs, operational eligibility and historical sales/rewards remain intact. The leaderboard uses approved-sales calculations, with an optional independent period override. Display aliases never become score inputs. Public badges and team colors appear in standings. Ticker text uses public labels; hidden-profile ticker mentions are suppressed. Queued rewards keep their authorized outcome and sequence, while hidden names receive anonymous recognition.

## Live control and safe rehearsal

`Monitor.tsx` embeds the actual `/arena` renderer at 1920 × 1080 and scales it to its container. A monitor cannot run sales simulation, publish display presence, rotate the broadcast or acknowledge live queue events. Same-origin messages carry draft settings and local rehearsal cues. The rehearsal service receives a cloned ledger; previews do not write sales, spins, inventory, rankings, award history or the live queue.

Replay uses a completed, non-voided award's original assigned segments and prize index. It is marked as a rehearsal and never creates a new reward.

Saved settings reach tabs in the **same browser and origin** using the existing storage subscription. This is not cross-device delivery. Production still requires authenticated APIs, server-side permissions and server-backed event delivery, as described in `../admin/BACKEND.md` and `../targets/BACKEND.md`.

## Rotation and queue policy

- Rotation advances only enabled modes, using each configured duration (5–3600 seconds).
- Automatic changes wait while any celebration is queued or the queue is paused.
- Manual mode selection takes priority for 60 seconds. Live TV Control can release the hold early.
- The default mode is selected by the Return to default Arena command; opening another TV tab does not override an already selected live mode.
- Pausing retains the active phase and its remaining time; resuming continues FIFO playback.
- Phase flags and durations are captured when an event starts. Pause and authorized spin release remain live controls. Configuration edits otherwise apply to the next event.
- Manual spin initiation holds at the assigned reward until an authorized operator releases it. The service has already assigned the result. Hiding the wheel does not cancel an earned entitlement.

## Targets, bonuses and wheel

The compact milestone editor uses the existing versioned rules and conflict checks. Advanced terms are preserved when editing simple fields. Assignment pages configure effective-dated audiences. Optional progress/milestone/bonus visibility affects presentation only.

Bonus approval remains required by default. Explicitly disabling it for a rule records automatic **Approved** status and approval provenance on new awards; it never marks the award **Paid**. Existing awards retain their snapshotted terms. Exact amount visibility and external payment recording retain their Super Admin restrictions.

Wheel editing reuses the existing prize inventory and eligibility service. Reordering affects future assignments. Remove archives a prize; it does not delete historical results. Already assigned events retain their own segment snapshots. Quantity limits, weighted assignment, pending inventory entitlements and retry idempotency remain in the service.

## Appearance and audio

Theme & Layout, Branding and Effects show the actual renderer. Draft changes affect only the monitor. Save publishes the current section; Reset reloads saved values; Restore defaults changes the draft until saved. Shared layout visibility and row count controls are centralized in Leaderboard Settings.

Master sound remains off by default. After enabling it, click Enable audio on the TV to activate the browser audio context. Phase sounds respect master/type toggles and volume. Reduced-motion follows the TV browser preference; animation intensity can also be reduced explicitly. Fullscreen must be entered from the TV browser's fullscreen button.

## Verification

Chrome checks are in `.arena-qa` (isolated temporary browser sessions; no user ledger changes):

- `control-smoke.mjs`: all 15 primary pages, browser errors, overflow, screenshots and 1080p rendering.
- `control-regression.mjs`: all nine modes, local rehearsal accounting isolation, draft/save/reset/defaults, cross-tab updates, display profiles, pause/resume, duplicate-safe approval, original prize preservation after wheel edits, manual spin release, rotation deferral/manual priority, fullscreen, reduced-motion preference, legacy routes and mobile layout.
- `control-editors.mjs`: real form interactions for profiles, milestones, prize create/reorder/archive, fractional reveal duration, mode durations, branding, audio activation and role boundaries.
- `control-layouts.mjs`: every mode with a leaderboard, custom titles, hidden-panel composition and reduced-motion animation styles.
- `control-inventory.mjs`: concurrent approvals, a single team milestone award, pending inventory and idempotent allocation retry.

Run `npx tsc --noEmit` and `npm run build` for TypeScript and production compilation. These checks do not imply production backend availability.
