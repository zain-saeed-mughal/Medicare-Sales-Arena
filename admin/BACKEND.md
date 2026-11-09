# Operations service handoff

## Local development
Run npm install and npm run dev. Open /admin and choose a fictional operator. Open /arena on the same origin in another tab for playout. The control-center monitor renders the Arena without starting a sales generator. Only a broadcast display acknowledges accounting-related ceremonies. The dashboard, sales, roster, competitions, prizes, rules, queue, and audit share one development ledger. A Web Lock serializes read/check/write operations across same-origin tabs. Storage notifications replace the in-memory snapshot. This requires localhost or another secure context and available browser storage.

Demo profile selection is intentional impersonation for UI testing. Its one-hour session is tab-local. Production builds disable all local commands, operator sign-in, rehearsal controls, and automatic sales. The production Arena shows a static fictional fixture pending integration. No identity provider, real prize assignment, or shared server is configured.

## Accounting and presentation
Sale references are immutable. Submission time determines daily submission totals. Approval time determines competition eligibility. Store timestamps in UTC and use the configured IANA timezone for daily boundaries. Competition editor times are explicitly UTC. Competition scores apply the configured points per eligible approved sale, initially one. Finishing or archiving a competition freezes its scoreboard. Reversing an approval cancels the linked spin, records the reason, and removes unplayed cues. A fulfilled physical reward requires operational reconciliation outside this demo.

Development rules count eligible approvals per agent per scoring day. The first matching active rule with available inventory receives the sale. Zero limits mean unlimited. Weighted prize selection is simulated in the service. Each assigned spin snapshots segment labels and colors so later prize edits cannot change its landing position. Preview events carry no sale or spin identifier and cannot change the ledger. Reward history and audit records survive reloads on the same browser origin.

## Production implementation
- Add SSO/OIDC with server-managed, revocable sessions, expiry, CSRF protection, and server-side role and team-scope checks on every read and command. Separate broadcast display credentials from staff sessions.
- Back the ledger with PostgreSQL tables for users, memberships, agents, teams, sale submissions, immutable reviews and reversals, competition participants and final results, prize inventory, eligibility rules, spins, fulfillment, settings, append-only audit events, and an outbox.
- Implement authenticated snapshot, catalog, settings, sales-review, correction, fulfillment, and playout endpoints. Validate fields, version mutable records, and require expected state and idempotency keys.
- In one database transaction lock the sale, validate pending status and reviewer scope, record the decision, allocate inventory, persist the server-selected award, and append audit and outbox rows. Enforce unique sale/rule entitlements and atomic quantity limits.
- Deliver versioned events over authenticated WebSockets or SSE. Resume from a cursor, suppress duplicate IDs, and reload an authoritative snapshot after gaps. The transport interface is defined in contracts.ts. Separate public display projections from restricted notes, reviewer identities, and audit data.
- Add immutable result finalization, scheduled competition transitions, server-side history retention, protected avatar storage, and server-owned broadcast device registration and playout acknowledgements before operational use.

