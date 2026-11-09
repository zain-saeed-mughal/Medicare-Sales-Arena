import {
  day,
  type Data,
  type Sale,
  type AdminUser,
  type AuditEvent,
} from "../admin/model";
export const scopes = ["Daily", "Weekly", "Monthly"] as const;
export type Scope = (typeof scopes)[number];
export type TargetRule = {
  showProgress?: boolean;
  showMilestone?: boolean;
  showBonus?: boolean;
  approvalRequired?: boolean;
  id: string;
  version: number;
  name: string;
  description: string;
  scope: Scope;
  recipient: "Agent" | "Team";
  threshold: number;
  currency: string;
  minor: number;
  label: string;
  spins: number;
  prizes: string[];
  active: boolean;
  start: string;
  end: string;
  priority: number;
  policy: "Cumulative" | "Highest tier";
  maximum: number;
  audience: "Global" | "Assigned";
};
export type TargetAssignment = {
  id: string;
  rule: string;
  kind: "Agent" | "Team";
  member: string;
  start: string;
  end: string;
};
export type MilestoneAchievement = {
  id: string;
  period: string;
  timezone: string;
  count: number;
  source: string;
  sales: string[];
  earned: string;
};
export type BonusApproval = {
  actor: string;
  at: string;
  decision: "Approved" | "Rejected";
  note: string;
};
export type BonusPaymentRecord = {
  actor: string;
  at: string;
  reference: string;
};
export const statuses = [
  "Pending Review",
  "Approved",
  "Rejected",
  "Scheduled",
  "Paid",
  "Adjusted",
] as const;
export type BonusAward = MilestoneAchievement & {
  rule: TargetRule;
  recipient: string;
  name: string;
  team: string;
  teamName: string;
  minor: number;
  status: (typeof statuses)[number];
  approval?: BonusApproval;
  payment?: BonusPaymentRecord;
  notes: string[];
};
export type BonusAdjustment = {
  id: string;
  award: string;
  source: string;
  actor: string;
  at: string;
  reason: string;
  kind: "Unpaid adjustment" | "Recovery review";
  minor: number;
};
export type SpinEntitlement = {
  id: string;
  award: string;
  spin: string;
  state: "Pending inventory" | "Assigned" | "Correction review" | "Cancelled";
};
export type TargetAuditEvent = AuditEvent;
export type TargetProgress = {
  rule: TargetRule;
  recipient: string;
  name: string;
  team: string;
  count: number;
  remaining: number;
  origin: string;
  period: string;
};
export type TargetLedger = {
  rules: TargetRule[];
  assignments: TargetAssignment[];
  awards: BonusAward[];
  adjustments: BonusAdjustment[];
  entitlements: SpinEntitlement[];
  showAmounts: boolean;
};
export function initialTargets(): TargetLedger {
  const rules = (
    [
      [2, "Daily", 1000, 0],
      [5, "Daily", 2500, 1],
      [10, "Daily", 6000, 2],
      [20, "Weekly", 10000, 1],
      [60, "Monthly", 30000, 3],
    ] as const
  ).map(([threshold, scope, amount, spins]) => ({
    id: "sample-" + scope + "-" + threshold,
    version: 1,
    name: scope + " " + threshold + " sales",
    description: "Illustrative development incentive",
    scope,
    recipient: "Agent" as const,
    threshold,
    currency: "PKR",
    minor: amount * 100,
    label: "Performance bonus",
    spins,
    prizes: [],
    active: true,
    start: "",
    end: "",
    priority: 0,
    policy: "Cumulative" as const,
    maximum: 0,
    audience: "Global" as const,
  }));
  return {
    rules,
    assignments: [],
    awards: [],
    adjustments: [],
    entitlements: [],
    showAmounts: false,
  };
}
export function periodStart(date: string, scope: Scope) {
  if (scope === "Daily") return date;
  if (scope === "Monthly") return date.slice(0, 7) + "-01";
  const m = new Date(date + "T00:00:00Z");
  m.setUTCDate(m.getUTCDate() - ((m.getUTCDay() + 6) % 7));
  return m.toISOString().slice(0, 10);
}
const within = (date: string, start: string, end: string) =>
  (!start || date >= start) && (!end || date <= end);
export const currencies = ["PKR", "USD", "EUR", "GBP"];
export function minorUnits(v: string) {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(v))
    throw Error("Use a nonnegative amount with at most two decimal places.");
  const [n, c = ""] = v.split(".");
  return Number(n) * 100 + Number(c.padEnd(2, "0"));
}
export function money(n: number, c: string) {
  return (
    c +
    " " +
    Math.trunc(n / 100).toLocaleString("en-US") +
    "." +
    String(n % 100).padStart(2, "0")
  );
}
export function totals(rows: BonusAward[]) {
  const sums = new Map<string, bigint>();
  for (const a of rows)
    sums.set(
      a.rule.currency,
      (sums.get(a.rule.currency) || 0n) + BigInt(a.minor),
    );
  return (
    [...sums]
      .map(
        ([c, n]) =>
          c +
          " " +
          (n / 100n).toLocaleString("en-US") +
          "." +
          String(n % 100n).padStart(2, "0"),
      )
      .join(" · ") || "—"
  );
}
export function can(
  u: AdminUser,
  permission:
    "view" | "configure" | "assign" | "approve" | "pay" | "export" | "adjust",
) {
  return (
    u.role === "Super Admin" || (u.role === "Admin" && permission !== "pay")
  );
}
function match(s: Data, r: TargetRule, id: string, team: string, date: string) {
  const a = s.targets.assignments.filter(
    (a) => a.rule === r.id && within(date, a.start, a.end),
  );
  if (
    r.recipient === "Agent" &&
    a.some((x) => x.kind === "Agent" && x.member === id)
  )
    return "Individual";
  if (a.some((x) => x.kind === "Team" && x.member === team))
    return r.recipient === "Team" ? "Team pool" : "Inherited team";
  return r.audience === "Global" ? "Global default" : "";
}
export function progress(s: Data, at = new Date().toISOString(), only?: Sale) {
  const tz = s.settings.timezone,
    date = day(at, tz);
  const rows: TargetProgress[] = [];
  const approved = s.sales
    .filter((x) => x.status === "Approved" && x.reviewed <= at)
    .map((x) => ({ x, date: day(x.reviewed, tz) }));
  for (const r of s.targets.rules) {
    if (!r.active || !within(date, r.start, r.end)) continue;
    const start = periodStart(date, r.scope);
    const members =
      r.recipient === "Team"
        ? s.teams
            .filter((t) => t.active && (!only || only.team === t.id))
            .map((t) => ({ id: t.id, team: t.id, name: t.name }))
        : s.agents
            .filter((a) => a.active && (!only || only.agent === a.id))
            .map((a) => ({
              id: String(a.id),
              team: only?.team || a.team,
              name: a.name,
            }));
    for (const m of members) {
      const origin = match(s, r, m.id, m.team, date);
      if (!origin) continue;
      const count = approved.filter(
        ({ x, date: d }) =>
          d >= start &&
          within(d, r.start, r.end) &&
          (r.recipient === "Team"
            ? x.team === m.id
            : String(x.agent) === m.id) &&
          match(s, r, m.id, x.team, d),
      ).length;
      rows.push({
        rule: r,
        recipient: m.id,
        name: m.name,
        team: m.team,
        count,
        remaining: Math.max(0, r.threshold - count),
        origin,
        period: start,
      });
    }
  }
  return rows;
}
export function earn(s: Data, sale: Sale): BonusAward[] {
  const possible = progress(s, sale.reviewed, sale)
    .filter((p) => p.count === p.rule.threshold)
    .sort(
      (a, b) =>
        b.rule.threshold - a.rule.threshold ||
        b.rule.priority - a.rule.priority ||
        a.rule.id.localeCompare(b.rule.id),
    );
  const fresh: BonusAward[] = [];
  for (const p of possible) {
    const r = p.rule,
      id = JSON.stringify([r.id, r.recipient, p.recipient, p.period]);
    if (
      s.targets.awards.some((a) => a.id === id) ||
      (r.maximum &&
        s.targets.awards.filter((a) => a.rule.id === r.id).length >= r.maximum)
    )
      continue;
    let minor = r.minor,
      spins = r.spins;
    if (r.policy === "Highest tier") {
      const previous = s.targets.awards.filter(
        (a) =>
          a.rule.policy === r.policy &&
          a.rule.scope === r.scope &&
          a.rule.currency === r.currency &&
          a.rule.recipient === r.recipient &&
          a.recipient === p.recipient &&
          a.period === p.period &&
          !["Adjusted", "Rejected"].includes(a.status),
      );
      if (previous.some((a) => a.rule.threshold >= r.threshold)) continue;
      minor = Math.max(0, minor - previous.reduce((n, a) => n + a.minor, 0));
      spins = Math.max(
        0,
        spins -
          s.targets.entitlements.filter((e) =>
            previous.some((a) => a.id === e.award),
          ).length,
      );
    }
    const qualifying = s.sales.filter((x) => {
      if (x.status !== "Approved" || x.reviewed > sale.reviewed) return false;
      const d = day(x.reviewed, s.settings.timezone);
      return (
        periodStart(d, r.scope) === p.period &&
        within(d, r.start, r.end) &&
        (r.recipient === "Team"
          ? x.team === p.recipient
          : String(x.agent) === p.recipient) &&
        !!match(s, r, p.recipient, x.team, d)
      );
    });
    const award: BonusAward = {
      id,
      period: p.period,
      timezone: s.settings.timezone,
      count: p.count,
      source: sale.id,
      sales: qualifying.map((x) => x.id),
      earned: sale.reviewed,
      rule: structuredClone(r),
      recipient: p.recipient,
      name: p.name,
      team: p.team,
      teamName: s.teams.find((t) => t.id === p.team)?.name || p.team,
      minor,
      status: r.approvalRequired === false ? "Approved" : "Pending Review",
      approval:
        r.approvalRequired === false
          ? {
              actor: "Configured rule",
              at: sale.reviewed,
              decision: "Approved",
              note: "Automatic approval under rule version " + r.version,
            }
          : undefined,
      notes: [],
    };
    s.targets.awards.unshift(award);
    fresh.push(award);
    for (let i = 0; i < spins; i++)
      s.targets.entitlements.push({
        id: id + "#" + i,
        award: id,
        spin: "",
        state: "Pending inventory",
      });
  }
  return fresh;
}
export function adjust(
  s: Data,
  a: BonusAward,
  source: string,
  actor: string,
  reason: string,
) {
  if (s.targets.adjustments.some((x) => x.award === a.id)) return false;
  s.targets.adjustments.unshift({
    id: crypto.randomUUID(),
    award: a.id,
    source,
    actor,
    reason,
    at: new Date().toISOString(),
    minor: a.minor,
    kind: a.payment ? "Recovery review" : "Unpaid adjustment",
  });
  if (!a.payment) a.status = "Adjusted";
  s.queue = s.queue.filter((e) => e.target?.id !== a.id);
  for (const e of s.targets.entitlements.filter((e) => e.award === a.id)) {
    const sp = s.spins.find((x) => x.id === e.spin);
    if (sp?.completed) e.state = "Correction review";
    else {
      e.state = "Cancelled";
      if (sp) sp.voided = true;
    }
  }
  return true;
}
export function csv(rows: BonusAward[]) {
  const escape = (v: unknown) => {
    let t = String(v ?? "");
    if (/^[=+@\-\t\r]/.test(t)) t = "'" + t;
    return '"' + t.replaceAll('"', '""') + '"';
  };
  return [
    [
      "Bonus ID",
      "Agent or pool",
      "Team",
      "Rule",
      "Period",
      "Threshold",
      "Currency",
      "Amount",
      "Status",
      "Earned",
      "Approved",
      "Paid",
      "Payment reference",
    ],
    ...rows.map((a) => [
      a.id,
      a.name,
      a.teamName,
      a.rule.name,
      a.period,
      a.rule.threshold,
      a.rule.currency,
      BigInt(a.minor) / 100n + "." + String(a.minor % 100).padStart(2, "0"),
      a.status,
      a.earned,
      a.approval?.decision === "Approved" ? a.approval.at : "",
      a.payment?.at,
      a.payment?.reference,
    ]),
  ]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
}
