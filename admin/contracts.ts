/** Delivery contracts for future production authenticated transports, real-time event streaming,
 * and two-dialer ingestion pipelines. The local development adapter reconciles complete snapshots
 * through storage notifications and Web Locks.
 */
import type { Data, AdminUser, DialerConnection, AgentDialerMapping, TVDisplaySession } from "./model";

export type OperationEventName =
  | "sale.submitted"
  | "sale.validated"
  | "sale.approved"
  | "sale.rejected"
  | "sale.reversed"
  | "agent.updated"
  | "team.updated"
  | "leaderboard.updated"
  | "team.score.updated"
  | "target.achieved"
  | "bonus.awarded"
  | "spin.unlocked"
  | "spin.released"
  | "spin.started"
  | "spin.completed"
  | "prize.revealed"
  | "achievement.unlocked"
  | "competition.updated"
  | "broadcast.mode_changed"
  | "broadcast.settings_updated"
  | "arena.settings_updated"
  | "arena.broadcast_mode_changed";

export interface OperationEvent {
  id: string;
  cursor: string;
  type: OperationEventName;
  entityId: string;
  actorId: string;
  occurredAt: string;
  version?: number;
  payload?: Record<string, unknown>;
}

/** Normalized submitted sale event from external dialer sources (Dialer A or Dialer B).
 * Excludes beneficiary personal / health information.
 */
export interface SubmittedSaleEventContract {
  eventId: string;
  sourceDialerId: string; // e.g., 'dialer-a' | 'dialer-b'
  externalSaleId: string;
  internalAgentId?: number;
  externalAgentId: string;
  submissionTimestamp: string;
  sourceStatus: string;
  normalizedSaleStatus: "Submitted" | "Pending";
  eventReceivedTimestamp: string;
  metadata?: {
    campaign?: string;
    productType?: string; // e.g. Medicare Advantage, Supplement, PDP
    state?: string;
  };
}

/** Normalized validation/review event from verification sources */
export interface ValidationEventContract {
  eventId: string;
  sourceDialerId: string;
  externalSaleId: string;
  validationStatus: "Approved" | "Rejected" | "Reversed";
  validationTimestamp: string;
  validationSource: string;
  internalAgentId: number;
  rejectionReasonCategory?:
    | "Incomplete Documentation"
    | "Duplicate Submission"
    | "Eligibility Mismatch"
    | "Customer Withdrawal"
    | "Compliance Invalidation"
    | "Other";
  correlationId: string;
  reviewerNotes?: string;
}

/** Operations API contract for future backend implementation */
export interface OperationsApi {
  session(): Promise<{ user: AdminUser; expiresAt: string }>;
  snapshot(): Promise<{ data: Data; cursor: string }>;
  submitSale(input: SubmittedSaleEventContract): Promise<{ saleId: string; cursor: string }>;
  reviewSale(input: {
    saleId: string;
    expectedStatus: string;
    decision: "approve" | "reject" | "reverse";
    reason: string;
    idempotencyKey: string;
  }): Promise<{ cursor: string }>;
  subscribe(
    after: string,
    onEvent: (event: OperationEvent) => void,
    onReconnect: () => void,
  ): () => void;
  syncDialer(dialerId: string): Promise<DialerConnection>;
  registerDisplay(display: Partial<TVDisplaySession>): Promise<TVDisplaySession>;
}
