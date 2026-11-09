import type { BroadcastConfig } from "../broadcast/config";
import type { TargetLedger } from "../targets/engine";
import type { Spotlight } from "../arenaEvents";
export const roles = [
  "Super Admin",
  "Admin",
  "Sales Manager",
  "Arena Operator",
] as const;
export type Role = (typeof roles)[number];
export type AdminUser = {
  id: string;
  name: string;
  role: Role;
  active: boolean;
  team: string;
};
export type Agent = {
  id: number;
  name: string;
  team: string;
  active: boolean;
  avatar: string;
};
export type Team = {
  id: string;
  name: string;
  leader: string;
  active: boolean;
  color?: string;
  badge?: string;
  dialerAssociations?: string[];
  submitted?: number;
  approved?: number;
};
export type SaleStatus =
  | "Submitted"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Reversed";
export type Sale = {
  id: string;
  agent: number;
  team: string;
  submitted: string;
  status: SaleStatus;
  reviewed: string;
  reviewer: string;
  notes: string;
  dialerId?: string;
  externalSaleId?: string;
  externalAgentId?: string;
  validatedAt?: string;
  validationSource?: string;
  rejectionReason?: string;
};
export type DialerStatus = "Connected" | "Degraded" | "Disconnected" | "Connecting";
export type DialerConnection = {
  id: string;
  name: string;
  status: DialerStatus;
  integrationType: "Webhook" | "REST API" | "Database Sync" | "Agent Socket";
  lastSuccessfulSync?: string;
  latestEventReceived?: string;
  pendingEvents: number;
  failedEvents: number;
  agentMappingStatus: "Complete" | "Partial" | "Unmapped";
  lastError?: string;
};
export type AgentDialerMapping = {
  internalAgentId: number;
  sourceDialerId: string;
  externalDialerAgentId: string;
  mappingStatus: "Mapped" | "Pending Review" | "Conflict";
  assignedTeam: string;
  updatedAt: string;
  history?: { timestamp: string; note: string }[];
};
export type TVDisplaySession = {
  id: string;
  name: string;
  status: "Online" | "Offline" | "Reconnecting";
  activeMode: string;
  soundEnabled: boolean;
  lastEventReceived?: string;
  reconnectionState?: string;
  registeredAt: string;
};
export type Competition = {
  id: string;
  name: string;
  description: string;
  type: string;
  start: string;
  end: string;
  teams: string;
  agents: string;
  status: string;
  pointsPerSale?: number;
  results?: LeaderboardEntry[];
  completedAt?: string;
  teamResults?: { id: string; name: string; score: number }[];
};
export type Reward = {
  minor?: number;
  currency?: string;
  id: string;
  name: string;
  description: string;
  type: string;
  color: string;
  icon: string;
  active: boolean;
  limit: number;
  weight: number;
};
export type RewardRule = {
  id: string;
  name: string;
  threshold: number;
  competition: string;
  agents: string;
  teams: string;
  start: string;
  end: string;
  max: number;
  active: boolean;
};
export type RewardSpin = {
  id: string;
  agent: number;
  sale: string;
  rule: string;
  prize: string;
  prizeId: string;
  created: string;
  completed: string;
  fulfilled: boolean;
  voided: boolean;
};
export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  time: string;
  detail: string;
};
export const arenaModes = [
  "Daily Arena",
  "Weekly Arena",
  "Monthly Arena",
] as const;
export type ArenaPeriod = (typeof arenaModes)[number];
export function isArenaPeriod(mode: string): mode is ArenaPeriod {
  return arenaModes.some((period) => period === mode);
}

export const modes = [
  ...arenaModes,
  "Live Competition",
  "Leaderboard Focus",
  "Team Battle",
  "Champion Spotlight",
  "Reward Ceremony",
  "Standby",
  "Hall of Fame",
];
export type ArenaSettings = {
  title: string;
  brand: string;
  mode: string;
  sound: boolean;
  animations: boolean;
  intensity: string;
  size: number;
  timezone: string;
  simulate: boolean;
};
export type LeaderboardEntry = Agent & {
  sales: number;
  approved: number;
  submitted: number;
  pending?: number;
};
export type ArenaEvent = Spotlight & {
  sale: string;
  spin: string;
  demo: boolean;
};
export type Data = {
  rankSnapshot?: { day: string; baseline: number[]; current: number[] };
  broadcast: BroadcastConfig;
  targets: TargetLedger;
  agents: Agent[];
  teams: Team[];
  sales: Sale[];
  competitions: Competition[];
  prizes: Reward[];
  rules: RewardRule[];
  spins: RewardSpin[];
  users: AdminUser[];
  audit: AuditEvent[];
  settings: ArenaSettings;
  queue: ArenaEvent[];
  completed: ArenaEvent[];
  previous: number[];
  sequence: number;
  news: string[];
  lastTick: number;
  dialers?: DialerConnection[];
  agentMappings?: AgentDialerMapping[];
  tvDisplays?: TVDisplaySession[];
};
const calendars = new Map<string, Intl.DateTimeFormat>();
export function day(iso: string, tz: string) {
  let fmt = calendars.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    calendars.set(tz, fmt);
  }
  return fmt.format(new Date(iso));
}
export function todaySales(s: Data) {
  const today = day(new Date().toISOString(), s.settings.timezone);
  return s.sales.filter((x) => day(x.submitted, s.settings.timezone) === today);
}
export function participants(csv: string, id: string | number) {
  return !csv || csv.split(",").includes(String(id));
}
export function standings(s: Data, c?: Competition): LeaderboardEntry[] {
  if (c?.results) return c.results;
  const list = c ? s.sales : todaySales(s);
  return s.agents
    .filter(
      (a) =>
        !c || (participants(c.agents, a.id) && participants(c.teams, a.team)),
    )
    .map((a) => {
      const agentList = list.filter(
        (x) =>
          x.agent === a.id &&
          (!c ||
            (x.submitted >= c.start &&
              x.submitted <= c.end &&
              participants(c.teams, x.team))),
      );
      const approved = agentList.filter(
        (x) =>
          x.status === "Approved" &&
          (!c ||
            (x.reviewed >= c.start &&
              x.reviewed <= c.end &&
              participants(c.teams, x.team))),
      ).length;
      const submitted = agentList.length;
      const pending = agentList.filter(
        (x) => x.status === "Pending" || x.status === "Submitted",
      ).length;
      return {
        ...a,
        sales: approved,
        approved,
        submitted,
        pending,
      };
    })
    .sort(
      (a, b) =>
        b.approved - a.approved ||
        b.submitted - a.submitted ||
        a.id - b.id,
    );
}
export function teamScores(s: Data) {
  const salesList = todaySales(s);
  return s.teams
    .map((t) => {
      const teamSalesList = salesList.filter((x) => x.team === t.id);
      const approved = teamSalesList.filter((x) => x.status === "Approved").length;
      const submitted = teamSalesList.length;
      const pending = teamSalesList.filter(
        (x) => x.status === "Pending" || x.status === "Submitted",
      ).length;
      return {
        ...t,
        score: approved,
        approved,
        submitted,
        pending,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.submitted ?? 0) - (a.submitted ?? 0),
    );
}
