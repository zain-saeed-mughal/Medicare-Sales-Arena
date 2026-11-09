# MEDICARE SALES ARENA — BACKEND INTEGRATION & EVENT CONTRACT SPECIFICATION
**Version:** 1.0.0-PROD-READY  
**Target Environment:** Node.js / Go / FastAPI with PostgreSQL & Authenticated WebSocket/SSE  
**Source Systems:** Dialer A, Dialer B, Medicare QA Review System

---

## 1. Core Architectural Model: Two-Stage Sales Lifecycle

The Medicare Sales Arena operates on a strict **two-stage sales lifecycle**:

```
[ Dialer A / Dialer B ]
          │
          ▼
   (sale.submitted)
          │
          ├──> 1. Records submission timestamp & dialer sale ID
          ├──> 2. Increments agent & team Submitted Sales counter
          ├──> 3. Updates Daily / Weekly / Monthly submitted metrics
          ├──> 4. Status = "Pending" | "Submitted"
          └──> 5. Emits subtle visual pulse / activity ticker (NO fanfare, NO spins)
          │
          ▼
[ Quality Review / Verification Webhook ]
          │
          ├──────────────────────────────┬──────────────────────────────┐
          ▼                              ▼                              ▼
   (sale.validated)               (sale.rejected)               (sale.reversed)
          │                              │                              │
 1. Status -> "Approved"        1. Status -> "Rejected"        1. Status -> "Cancelled" / "Reversed"
 2. Increments Approved Sales   2. Retained for audit          2. Voids linked unplayed spins
 3. Recalculates Leaderboard    3. Zero impact on scores       3. Reverses qualifying bonus
 4. Evaluates Targets & Bonuses 4. Reason category stored      4. Recalculates live standings
 5. Triggers SALE VALIDATED!                                   5. Logs correction audit
    cinematic celebration
 6. Plays celebratory Web Audio
```

### Critical Consistency Rules:
- **Single Sale Record**: Submitted and Approved are lifecycle states of the *same* database record. A validated sale updates the existing record via its `id` / `externalSaleId` rather than inserting a duplicate record.
- **Idempotency**: All ingestion endpoints require `idempotencyKey` or `correlationId`. Duplicate webhooks from dialers must not double-count submitted or approved sales.
- **Privacy & HIPAA Compliance**: No beneficiary Protected Health Information (PHI) or personal details (such as SSN, Medicare Beneficiary Identifiers, or medical history) are ingested into the Live Arena. Events carry strictly operational and performance data (`agentId`, `teamId`, `externalSaleId`, `dialerId`, `timestamp`, `productType`).

---

## 2. Ingestion Contracts for Dialer A & Dialer B

Both dialers push normalized webhook payloads to `/api/v1/sales/submit`.

### 2.1 Sale Submitted Contract (`sale.submitted`)

```json
{
  "eventId": "evt_sub_984712049",
  "sourceDialerId": "dialer-a",
  "externalSaleId": "DA-SALE-882910",
  "externalAgentId": "DA-AGENT-104",
  "internalAgentId": 0,
  "submissionTimestamp": "2026-11-09T18:22:15.000Z",
  "sourceStatus": "SALE_RECORDED",
  "normalizedSaleStatus": "Submitted",
  "eventReceivedTimestamp": "2026-11-09T18:22:15.120Z",
  "metadata": {
    "campaign": "AEP_2027_MEDICARE_ADVANTAGE",
    "productType": "Medicare Advantage (Part C)",
    "state": "FL"
  }
}
```

### 2.2 Sale Validated Contract (`sale.validated`)

Dispatched when third-party QA verification or dialer QA approval confirms the submission.

```json
{
  "eventId": "evt_val_102938472",
  "correlationId": "DA-SALE-882910",
  "sourceDialerId": "dialer-a",
  "externalSaleId": "DA-SALE-882910",
  "internalAgentId": 0,
  "validationStatus": "Approved",
  "validationTimestamp": "2026-11-09T18:25:30.000Z",
  "validationSource": "Enterprise QA Gateway",
  "reviewerNotes": "Beneficiary eligibility and enrollment confirmed."
}
```

### 2.3 Sale Rejected Contract (`sale.rejected`)

```json
{
  "eventId": "evt_rej_593820194",
  "correlationId": "DB-SALE-773911",
  "sourceDialerId": "dialer-b",
  "externalSaleId": "DB-SALE-773911",
  "internalAgentId": 1,
  "validationStatus": "Rejected",
  "validationTimestamp": "2026-11-09T18:30:10.000Z",
  "rejectionReasonCategory": "Duplicate Submission",
  "reviewerNotes": "Existing active policy on file."
}
```

### 2.4 Sale Reversal Contract (`sale.reversed`)

Dispatched when an approved sale is later reversed by administrative correction.

```json
{
  "eventId": "evt_rev_110293847",
  "correlationId": "DA-SALE-882910",
  "saleId": "SA-00042",
  "reversalTimestamp": "2026-11-09T19:00:00.000Z",
  "reason": "Enrollment cancellation requested within cooling-off period",
  "actorId": "u_admin_01"
}
```

---

## 3. Real-Time Streaming Architecture (WebSocket / SSE)

### Connection Endpoint
```
wss://<host>/api/v1/events?token=<jwt_session_token>&cursor=<last_received_cursor>
```

### Event Payload Schema
```typescript
export interface OperationStreamMessage {
  id: string;             // Globally unique event ID (UUID v4)
  cursor: string;         // Monotonically increasing sequence cursor
  type: string;           // e.g. "sale.validated" | "leaderboard.updated"
  entityId: string;       // ID of the target entity
  actorId: string;        // System or reviewer user ID
  occurredAt: string;     // ISO 8601 UTC timestamp
  version: number;        // Schema version (e.g. 1)
  payload: Record<string, unknown>;
}
```

### Reconnection & Authoritative Reconciliation Protocol:
1. **Cursor Resumption**: Upon reconnecting, the client supplies its latest `cursor`.
2. **Buffer Replay**: If the server holds missed events between `cursor` and `HEAD`, it streams them in sequence.
3. **Snapshot Fallback**: If the cursor has expired beyond the server outbox window, the server returns an `outbox.stale` response, prompting the client to request a fresh authoritative snapshot via `GET /api/v1/snapshot`.

---

## 4. Multi-Team Routing (5+ Teams) & Historical Attribution

The application supports an arbitrary number of teams (e.g., Vanguard, Apex, Velocity, Summit, Titan, Horizon).

### Historical Attribution Rule:
```
When an agent changes team affiliation from Team A to Team B:
- Historical sales recorded while the agent was in Team A RETAIN Team A in their `sale.team` field.
- Future sales submitted and approved assign Team B.
- Competition scoring queries filter by `sale.team` at the time of the business event, ensuring historical integrity.
```

---

## 5. REST API Endpoint Specifications

| Method | Endpoint | Description | Required Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate with credentials or SSO SAML/OIDC ticket | Public |
| `GET` | `/api/v1/auth/session` | Validate active session token and return user profile | Authenticated |
| `POST` | `/api/v1/auth/logout` | Revoke session token and disconnect active WebSockets | Authenticated |
| `GET` | `/api/v1/snapshot` | Complete authoritative state snapshot (ledgers, rules, broadcast) | Any valid role |
| `POST` | `/api/v1/sales/submit` | Ingest external dialer sale submission | Ingestion API Key |
| `POST` | `/api/v1/sales/validate` | Confirm and approve a submitted sale | Reviewer / Admin |
| `POST` | `/api/v1/sales/:id/review` | Manual approval, rejection, or reversal of a sale | Reviewer / Admin |
| `GET` | `/api/v1/teams` | List all Medicare sales teams and performance metrics | Any valid role |
| `POST` | `/api/v1/teams` | Create a new Medicare sales team | Arena Admin+ |
| `PATCH` | `/api/v1/teams/:id` | Update team metadata, badge, display color, or leader | Arena Admin+ |
| `GET` | `/api/v1/dialers` | Health status and sync metrics for Dialer A & Dialer B | Operator+ |
| `POST` | `/api/v1/dialers/:id/sync` | Trigger on-demand connection heartbeat and mapping sync | Operator+ |
| `GET` | `/api/v1/displays` | List registered office TV displays and active states | Operator+ |
| `POST` | `/api/v1/displays/register` | Register new restricted TV display | Admin+ |

---

## 6. Recommended PostgreSQL Database Schema

```sql
-- 1. Teams Table (supports 5+ configurable teams)
CREATE TABLE teams (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    leader_agent_id INTEGER,
    color VARCHAR(32) DEFAULT '#2dd4bf',
    badge VARCHAR(8) DEFAULT 'MED',
    active BOOLEAN DEFAULT TRUE,
    dialer_associations TEXT[] DEFAULT ARRAY['dialer-a', 'dialer-b'],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agents Table
CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    current_team_id VARCHAR(64) REFERENCES teams(id),
    avatar_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Dialer Identity Mappings
CREATE TABLE agent_dialer_mappings (
    id SERIAL PRIMARY KEY,
    internal_agent_id INTEGER REFERENCES agents(id),
    source_dialer_id VARCHAR(32) NOT NULL, -- 'dialer-a' | 'dialer-b'
    external_dialer_agent_id VARCHAR(64) NOT NULL,
    mapping_status VARCHAR(32) DEFAULT 'Mapped',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_dialer_id, external_dialer_agent_id)
);

-- 4. Sales Ledger (Two-stage lifecycle)
CREATE TYPE sale_status AS ENUM ('Submitted', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Reversed');

CREATE TABLE sales (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'SA-00124'
    agent_id INTEGER NOT NULL REFERENCES agents(id),
    team_id VARCHAR(64) NOT NULL REFERENCES teams(id), -- Historical team attribution
    source_dialer_id VARCHAR(32) NOT NULL,
    external_sale_id VARCHAR(128) NOT NULL,
    status sale_status DEFAULT 'Pending',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewer_user_id VARCHAR(64),
    validation_source VARCHAR(128),
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_dialer_id, external_sale_id)
);

CREATE INDEX idx_sales_period ON sales (submitted_at, status, team_id, agent_id);

-- 5. Outbox for Real-Time Event Dispatch
CREATE TABLE event_outbox (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);
```
