import { useMemo } from "react";
import { type Data, day, type AdminUser } from "../admin/model";
import { periodSnapshot } from "../arenaPeriods";
import { Kpis, Panel, Table } from "../admin/ui";
import { Assignments, RuleStudio } from "./Rules";
import { Bonuses } from "./Bonuses";
import {
  progress,
  scopes,
  totals,
  money,
  periodStart,
  type Scope,
  type BonusAward,
} from "./engine";
import "./targets.css";
export function TargetSummary({ s }: { s: Data }) {
  const today = day(new Date().toISOString(), s.settings.timezone);
  const all = progress(s);
  return (
    <div className="target-summaries">
      {scopes.map((scope) => {
        const ps = all.filter((p) => p.rule.scope === scope),
          eligible = new Set(ps.map((p) => p.rule.recipient + p.recipient)),
          met = new Set(
            ps
              .filter((p) => !p.remaining)
              .map((p) => p.rule.recipient + p.recipient),
          );
        return (
          <div key={scope}>
            <small>{scope.toUpperCase()} PERFORMANCE</small>
            <h3>
              {
                periodSnapshot(s, (scope + " Arena") as "Daily Arena", today)
                  .approved
              }{" "}
              approved sales
            </h3>
            <progress max={eligible.size || 1} value={met.size} />
            <p>
              {met.size} of {eligible.size} eligible recipients reached a target
            </p>
          </div>
        );
      })}
    </div>
  );
}
export function Targets({
  s,
  u,
  path,
}: {
  s: Data;
  u: AdminUser;
  path: string;
}) {
  if (path === "targets/rules") return <RuleStudio s={s} />;
  if (path === "targets/agents" || path === "targets/teams")
    return <Assignments s={s} team={path.endsWith("teams")} />;
  if (path.startsWith("bonuses"))
    return <Bonuses s={s} u={u} history={path.endsWith("history")} />;
  const a = s.targets.awards,
    all = progress(s),
    today = day(new Date().toISOString(), s.settings.timezone);
  const liability = a.filter((x) =>
    ["Pending Review", "Approved", "Scheduled"].includes(x.status),
  );
  const current = (scope: Scope) =>
    a.filter(
      (x) =>
        x.rule.scope === scope &&
        x.period === periodStart(today, scope) &&
        !["Adjusted", "Rejected"].includes(x.status),
    );
  const groups = new Map<string, BonusAward[]>();
  for (const x of a.filter(
    (x) => !["Adjusted", "Rejected"].includes(x.status),
  )) {
    const k = x.rule.currency + "|" + x.rule.recipient + "|" + x.recipient;
    groups.set(k, [...(groups.get(k) || []), x]);
  }
  const earners = [...groups.values()].sort(
    (a, b) =>
      a[0].rule.currency.localeCompare(b[0].rule.currency) ||
      b.reduce((n, x) => n + x.minor, 0) - a.reduce((n, x) => n + x.minor, 0),
  );
  return (
    <>
      <Kpis
        items={[
          [
            "Active target rules",
            s.targets.rules.filter(
              (r) =>
                r.active &&
                (!r.start || r.start <= today) &&
                (!r.end || r.end >= today),
            ).length,
          ],
          [
            "Agents reaching target",
            new Set(
              all
                .filter((p) => p.rule.recipient === "Agent" && !p.remaining)
                .map((p) => p.recipient),
            ).size,
          ],
          ...scopes.map(
            (scope) =>
              [scope + " earned", totals(current(scope))] as [string, string],
          ),
          [
            "Pending approval",
            a.filter((x) => x.status === "Pending Review").length,
          ],
          ["Approved bonuses", a.filter((x) => x.status === "Approved").length],
          ["Paid bonuses", a.filter((x) => x.status === "Paid").length],
          ["Outstanding liability", totals(liability)],
        ]}
      />
      <TargetSummary s={s} />
      <div className="op-columns">
        <Panel title="Recent milestones">
          <Table
            heads={["Recipient", "Rule", "Earned"]}
            rows={a
              .slice(0, 8)
              .map((x) => [x.name, x.rule.name, day(x.earned, x.timezone)])}
          />
        </Panel>
        <Panel title="Agents near target">
          <Table
            heads={["Agent", "Target", "Remaining"]}
            rows={all
              .filter((p) => p.rule.recipient === "Agent" && p.remaining > 0)
              .sort((a, b) => a.remaining - b.remaining)
              .slice(0, 8)
              .map((p) => [p.name, p.rule.name, p.remaining])}
          />
        </Panel>
        <Panel title="Top earners by currency">
          <Table
            heads={["Recipient", "Awarded"]}
            rows={earners.map((g) => [g[0].name, totals(g)])}
          />
        </Panel>
        <Panel title="Pending payouts">
          <Table
            heads={["Recipient", "Amount", "Status"]}
            rows={a
              .filter((x) => ["Approved", "Scheduled"].includes(x.status))
              .map((x) => [x.name, money(x.minor, x.rule.currency), x.status])}
          />
        </Panel>
      </div>
      <Panel title="Latest rule changes">
        {s.audit
          .filter((x) => x.action === "target.rule_saved")
          .slice(0, 6)
          .map((x) => (
            <p key={x.id}>
              {x.time} · {x.actor} ·{" "}
              {s.targets.rules.find((r) => r.id === x.entity)?.name}
            </p>
          ))}
        <a href="/admin/targets/rules">Manage incentive rules →</a>
      </Panel>
    </>
  );
}
export function TargetStrip({
  s,
  agent,
  scope,
}: {
  s: Data;
  agent: number | undefined;
  scope: Scope;
}) {
  const all = useMemo(() => progress(s), [s]);
  const ps = all
    .filter(
      (p) =>
        p.rule.showProgress !== false &&
        p.rule.scope === scope &&
        p.rule.recipient === "Agent" &&
        p.recipient === String(agent),
    )
    .sort((a, b) => a.rule.threshold - b.rule.threshold);
  const p = ps.find((x) => x.remaining) || ps.at(-1);
  if (!p) return null;
  const latest = s.targets.awards.find(
    (a) =>
      a.period === p.period &&
      a.rule.scope === scope &&
      a.rule.recipient === "Agent" &&
      a.recipient === p.recipient,
  );
  return (
    <div className="target-strip">
      <strong>{scope} target</strong>
      <progress value={p.count} max={p.rule.threshold} />
      <span>
        {p.count}/{p.rule.threshold} ·{" "}
        {p.remaining ? p.remaining + " to go" : "Reached"}
      </span>
      {latest && (
        <small>
          {latest.status}
          {s.targets.showAmounts
            ? " · " + money(latest.minor, latest.rule.currency)
            : ""}
        </small>
      )}
    </div>
  );
}
