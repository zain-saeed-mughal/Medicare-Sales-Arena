/** Delivery contract for a future authenticated transport. The local adapter
 * reconciles complete snapshots through storage notifications instead. */
import type { Data, AdminUser } from "./model";
export type OperationEventName =
  | "sale.submitted"
  | "sale.approved"
  | "sale.rejected"
  | "sale.reversed"
  | "leaderboard.updated"
  | "team.score.updated"
  | "reward.spin_earned"
  | "reward.spin_started"
  | "reward.spin_completed"
  | "achievement.unlocked"
  | "competition.updated"
  | "arena.settings_updated"
  | "arena.broadcast_mode_changed";
export interface OperationEvent {
  id: string;
  cursor: string;
  type: OperationEventName;
  entityId: string;
  actorId: string;
  occurredAt: string;
}
export interface OperationsApi {
  session(): Promise<{ user: AdminUser; expiresAt: string }>;
  snapshot(): Promise<{ data: Data; cursor: string }>;
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
}
