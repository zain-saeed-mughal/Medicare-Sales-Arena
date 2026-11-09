/** Frontend Data Service Architecture & Adapters
 * Provides a unified data-access interface for the Medicare Sales Arena UI.
 *
 * Implements:
 * 1. LocalDevelopmentAdapter: Uses browser-local storage, Web Locks, and storage events.
 * 2. HttpApiAdapter: Structured for authenticated REST APIs and WebSocket streams for production.
 */

import type {
  Data,
  AdminUser,
  Sale,
  LeaderboardEntry,
  Competition,
  Team,
  Agent,
  DialerConnection,
  AgentDialerMapping,
  TVDisplaySession,
} from "./model";
import type {
  SubmittedSaleEventContract,
  ValidationEventContract,
  OperationEvent,
  OperationsApi,
} from "./contracts";
import { session, useData, command, review, submitSale } from "./service";

export interface DataService {
  // Session & Authentication
  getSession(): Promise<AdminUser | null>;
  signIn(userIdOrToken: string): Promise<AdminUser>;
  signOut(): Promise<void>;

  // Sales & Validation
  submitSale(event: SubmittedSaleEventContract): Promise<string>;
  validateSale(event: ValidationEventContract): Promise<void>;
  reverseSale(saleId: string, reason: string): Promise<void>;

  // Multi-Team Management
  getTeams(): Promise<Team[]>;
  createTeam(team: Partial<Team>): Promise<Team>;
  updateTeam(teamId: string, updates: Partial<Team>): Promise<Team>;

  // Dialer Integration Health
  getDialers(): Promise<DialerConnection[]>;
  syncDialer(dialerId: string): Promise<DialerConnection>;
  getAgentMappings(): Promise<AgentDialerMapping[]>;

  // TV Displays
  getDisplays(): Promise<TVDisplaySession[]>;
  registerDisplay(display: Partial<TVDisplaySession>): Promise<TVDisplaySession>;

  // Playout & Real-time Subscriptions
  subscribeToLiveEvents(
    onEvent: (event: OperationEvent) => void,
    onReconnect?: () => void,
  ): () => void;
}

/** Local Development Adapter: Safe in-browser implementation preserving existing data */
export class LocalDevelopmentAdapter implements DataService {
  async getSession(): Promise<AdminUser | null> {
    const s = session();
    return s || null;
  }

  async signIn(userId: string): Promise<AdminUser> {
    sessionStorage.setItem("medicare-arena.dev.v3.session", userId);
    const s = session();
    if (!s) throw new Error("User not found");
    return s;
  }

  async signOut(): Promise<void> {
    sessionStorage.removeItem("medicare-arena.dev.v3.session");
  }

  async submitSale(event: SubmittedSaleEventContract): Promise<string> {
    const saleId = submitSale({
      agent: event.internalAgentId ?? 0,
      dialerId: event.sourceDialerId,
      externalSaleId: event.externalSaleId,
      notes: event.metadata ? JSON.stringify(event.metadata) : "",
    });
    return typeof saleId === "string" ? saleId : String(saleId);
  }

  async validateSale(event: ValidationEventContract): Promise<void> {
    await review(event.externalSaleId, "Approved", event.reviewerNotes || "Validated by service");
  }

  async reverseSale(saleId: string, reason: string): Promise<void> {
    await review(saleId, "Cancelled", reason);
  }

  async getTeams(): Promise<Team[]> {
    return [];
  }

  async createTeam(team: Partial<Team>): Promise<Team> {
    const newTeam = {
      id: team.name || "new-team",
      name: team.name || "New Team",
      leader: team.leader || "0",
      active: true,
      color: team.color || "#2dd4bf",
      badge: team.badge || "NT",
      ...team,
    } as Team;
    return newTeam;
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    return { id: teamId, ...updates } as Team;
  }

  async getDialers(): Promise<DialerConnection[]> {
    return [];
  }

  async syncDialer(dialerId: string): Promise<DialerConnection> {
    return {
      id: dialerId,
      name: dialerId === "dialer-a" ? "Dialer A (Primary)" : "Dialer B (Secondary)",
      status: "Connected",
      integrationType: "Webhook",
      lastSuccessfulSync: new Date().toISOString(),
      pendingEvents: 0,
      failedEvents: 0,
      agentMappingStatus: "Complete",
    };
  }

  async getAgentMappings(): Promise<AgentDialerMapping[]> {
    return [];
  }

  async getDisplays(): Promise<TVDisplaySession[]> {
    return [];
  }

  async registerDisplay(display: Partial<TVDisplaySession>): Promise<TVDisplaySession> {
    return {
      id: display.id || "tv-" + Date.now().toString(36),
      name: display.name || "Office Display",
      status: "Online",
      activeMode: display.activeMode || "Daily Arena",
      soundEnabled: display.soundEnabled ?? true,
      registeredAt: new Date().toISOString(),
    };
  }

  subscribeToLiveEvents(
    onEvent: (event: OperationEvent) => void,
    onReconnect?: () => void,
  ): () => void {
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("medicare-arena")) {
        onEvent({
          id: crypto.randomUUID(),
          cursor: Date.now().toString(),
          type: "leaderboard.updated",
          entityId: "arena",
          actorId: "system",
          occurredAt: new Date().toISOString(),
        });
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }
}

/** Production HTTP API Adapter: Ready for server-side integration */
export class HttpApiAdapter implements DataService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl = "/api/v1") {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async fetchAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Request failed with status ${res.status}`);
    }

    return res.json() as Promise<T>;
  }

  async getSession(): Promise<AdminUser | null> {
    return this.fetchAuth<AdminUser>("/auth/session").catch(() => null);
  }

  async signIn(token: string): Promise<AdminUser> {
    this.setToken(token);
    return this.fetchAuth<AdminUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async signOut(): Promise<void> {
    await this.fetchAuth<void>("/auth/logout", { method: "POST" });
    this.token = null;
  }

  async submitSale(event: SubmittedSaleEventContract): Promise<string> {
    const res = await this.fetchAuth<{ saleId: string }>("/sales/submit", {
      method: "POST",
      body: JSON.stringify(event),
    });
    return res.saleId;
  }

  async validateSale(event: ValidationEventContract): Promise<void> {
    await this.fetchAuth<void>("/sales/validate", {
      method: "POST",
      body: JSON.stringify(event),
    });
  }

  async reverseSale(saleId: string, reason: string): Promise<void> {
    await this.fetchAuth<void>(`/sales/${saleId}/reverse`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getTeams(): Promise<Team[]> {
    return this.fetchAuth<Team[]>("/teams");
  }

  async createTeam(team: Partial<Team>): Promise<Team> {
    return this.fetchAuth<Team>("/teams", {
      method: "POST",
      body: JSON.stringify(team),
    });
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    return this.fetchAuth<Team>(`/teams/${teamId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async getDialers(): Promise<DialerConnection[]> {
    return this.fetchAuth<DialerConnection[]>("/dialers");
  }

  async syncDialer(dialerId: string): Promise<DialerConnection> {
    return this.fetchAuth<DialerConnection>(`/dialers/${dialerId}/sync`, {
      method: "POST",
    });
  }

  async getAgentMappings(): Promise<AgentDialerMapping[]> {
    return this.fetchAuth<AgentDialerMapping[]>("/dialers/mappings");
  }

  async getDisplays(): Promise<TVDisplaySession[]> {
    return this.fetchAuth<TVDisplaySession[]>("/displays");
  }

  async registerDisplay(display: Partial<TVDisplaySession>): Promise<TVDisplaySession> {
    return this.fetchAuth<TVDisplaySession>("/displays/register", {
      method: "POST",
      body: JSON.stringify(display),
    });
  }

  subscribeToLiveEvents(
    onEvent: (event: OperationEvent) => void,
    onReconnect?: () => void,
  ): () => void {
    let ws: WebSocket | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${location.host}/api/v1/events?token=${this.token || ""}`);

      ws.onmessage = (msg) => {
        try {
          const parsed = JSON.parse(msg.data) as OperationEvent;
          onEvent(parsed);
        } catch (e) {
          console.error("Invalid websocket message", e);
        }
      };

      ws.onclose = () => {
        if (!closed) {
          setTimeout(connect, 3000);
          onReconnect?.();
        }
      };
    };

    connect();
    return () => {
      closed = true;
      ws?.close();
    };
  }
}

// Active service default (Local Development Adapter with seamless backend upgrade path)
export const dataService: DataService = new LocalDevelopmentAdapter();
