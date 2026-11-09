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
};
export type Sale = {
  id: string;
  agent: number;
  team: string;
  submitted: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  reviewed: string;
  reviewer: string;
  notes: string;
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
export type LeaderboardEntry = Agent & { sales: number };
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
    .map((a) => ({
      ...a,
      sales: list.filter(
        (x) =>
          x.agent === a.id &&
          x.status === "Approved" &&
          (!c ||
            (x.reviewed >= c.start &&
              x.reviewed <= c.end &&
              participants(c.teams, x.team))),
      ).length,
    }))
    .sort((a, b) => b.sales - a.sales || a.id - b.id);
}
export function teamScores(s: Data) {
  const approved = todaySales(s).filter((x) => x.status === "Approved");
  return s.teams
    .map((t) => ({
      ...t,
      score: approved.filter((x) => x.team === t.id).length,
    }))
    .sort((a, b) => b.score - a.score);
}
