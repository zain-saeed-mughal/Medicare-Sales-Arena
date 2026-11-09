import { useState } from "react";
import { type Data, day, type AdminUser } from "../admin/model";
import {
  Panel,
  Table,
  Modal,
  Form,
  opts,
  type Field,
  type Values,
  values,
  Badge,
} from "../admin/ui";
import {
  progress,
  scopes,
  minorUnits,
  money,
  type TargetRule,
  type Scope,
  currencies,
} from "./engine";
import { assignTarget, overlaps, saveRule } from "./commands";
const f = (key: string, label: string, options?: string[]): Field => ({
  key,
  label,
  options: options ? opts(options) : undefined,
});
export function RuleStudio({ s }: { s: Data }) {
  const [editing, edit] = useState<TargetRule | null>(null),
    [msg, set] = useState("");
  function open(r?: TargetRule, copy = false) {
    edit(
      r
        ? {
            ...r,
            ...(copy
              ? {
                  id: crypto.randomUUID(),
                  version: 0,
                  name: r.name + " copy",
                  active: false,
                }
              : {}),
          }
        : {
            id: crypto.randomUUID(),
            version: 0,
            name: "",
            description: "",
            scope: "Daily",
            recipient: "Agent",
            audience: "Global",
            threshold: 5,
            minor: 0,
            currency: "PKR",
            spins: 0,
            active: false,
            start: "",
            end: "",
            priority: 0,
            maximum: 0,
            policy: "Cumulative",
            label: "Performance bonus",
            prizes: [],
          },
    );
  }
  const fields: Field[] = [
    { key: "name", label: "Rule name", required: true },
    f("description", "Description"),
    f("type", "Rule type", [
      "Bonus and spins",
      "Bonus only",
      "Spins only",
      "Target recognition",
    ]),
    f("scope", "Scoring period", [...scopes]),
    f("recipient", "Beneficiary", ["Agent", "Team"]),
    f("audience", "Audience", ["Global", "Assigned"]),
    {
      key: "threshold",
      label: "Approved sales required",
      type: "number",
      min: 1,
      required: true,
    },
    f("currency", "Bonus currency", currencies),
    {
      key: "amount",
      label: "Bonus amount (two decimal places)",
      required: true,
    },
    f("label", "Reward label"),
    f("policy", "Conflict policy", ["Cumulative", "Highest tier"]),
    {
      key: "spins",
      label: "Spins awarded (0 disables)",
      type: "number",
      min: 0,
      max: 20,
    },
    {
      key: "prizes",
      label: "Eligible wheel segments (empty = all)",
      type: "multi",
      options: s.prizes.map((p) => [p.id, p.name]),
    },
    ...["start", "end"].map((key) => ({
      key,
      label: "Effective " + key,
      type: "date",
    })),
    {
      key: "maximum",
      label: "Lifetime award limit (0 = unlimited)",
      type: "number",
      min: 0,
    },
    {
      key: "priority",
      label: "Priority (higher wins equal tiers)",
      type: "number",
      min: 0,
      max: 1000,
    },
    f("active", "Rule status", ["Active", "Inactive"]),
    f("ack", "I reviewed overlapping rules and their policy", ["No", "Yes"]),
  ];
  function draft(v: Values): TargetRule {
    return {
      ...editing!,
      name: v.name,
      description: v.description,
      label: v.label,
      scope: v.scope as Scope,
      recipient: v.recipient as TargetRule["recipient"],
      audience: v.audience as TargetRule["audience"],
      threshold: Number(v.threshold),
      minor: ["Spins only", "Target recognition"].includes(v.type)
        ? 0
        : minorUnits(v.amount),
      currency: v.currency,
      spins: ["Bonus only", "Target recognition"].includes(v.type)
        ? 0
        : Number(v.spins),
      prizes: v.prizes.split(",").filter(Boolean),
      policy: v.policy as TargetRule["policy"],
      start: v.start,
      end: v.end,
      maximum: Number(v.maximum),
      priority: Number(v.priority),
      active: v.active === "Active",
    };
  }
  return (
    <>
      <Panel
        title="Incentive rules"
        action={
          <button className="primary" onClick={() => open()}>
            + Create rule
          </button>
        }
      >
        <p>
          Development examples use fictional compensation. Team awards remain in
          the team pool. Changes apply on future approvals.
        </p>
        <Table
          heads={[
            "Rule",
            "Scope / recipient",
            "Sales target",
            "Bonus",
            "Spins",
            "Policy",
            "Status",
            "Actions",
          ]}
          rows={s.targets.rules.map((r) => [
            r.name,
            r.scope + " / " + r.recipient,
            r.threshold,
            money(r.minor, r.currency),
            r.spins,
            r.policy,
            <Badge value={r.active ? "Active" : "Inactive"} />,
            <div className="op-actions">
              <button onClick={() => open(r)}>Edit</button>
              <button onClick={() => open(r, true)}>Duplicate</button>
            </div>,
          ])}
        />
        {msg && <p role="status">{msg}</p>}
      </Panel>
      <Panel title="Rule change history">
        <Table
          heads={["Time", "Operator", "Rule", "Change"]}
          rows={s.audit
            .filter((a) => a.action === "target.rule_saved")
            .map((a) => [
              a.time,
              a.actor,
              a.entity,
              <details>
                <summary>Inspect version</summary>
                <pre>{a.detail}</pre>
              </details>,
            ])}
        />
      </Panel>
      {editing && (
        <Modal
          title={editing.version ? "Edit target rule" : "Create target rule"}
          close={() => edit(null)}
        >
          <Form
            fields={fields}
            initial={{
              ...values(editing),
              type: editing.minor
                ? editing.spins
                  ? "Bonus and spins"
                  : "Bonus only"
                : editing.spins
                  ? "Spins only"
                  : "Target recognition",
              amount: (editing.minor / 100).toFixed(2),
              active: editing.active ? "Active" : "Inactive",
              ack: "No",
              prizes: editing.prizes.join(","),
            }}
            preview={(v) => {
              try {
                const r = draft(v),
                  matches = overlaps(s, r);
                const sample = progress({
                  ...s,
                  targets: { ...s.targets, rules: [{ ...r, active: true }] },
                });
                return (
                  <div className="rule-summary">
                    <b>
                      {r.threshold} {r.scope.toLowerCase()} approvals →{" "}
                      {money(r.minor, r.currency)} + {r.spins} spins
                    </b>
                    <p>
                      {r.policy === "Highest tier"
                        ? "Pay only the increase over prior highest-tier awards in this period and currency."
                        : "Each qualifying rule earns its full configured award."}
                    </p>
                    <p>
                      Preview for today: {sample.length} eligible recipients,{" "}
                      {sample.filter((p) => !p.remaining).length} at or above
                      target. Saving does not issue historical awards.
                    </p>
                    {matches.length > 0 && (
                      <p>
                        Potential overlap:{" "}
                        {matches.map((x) => x.name).join(", ")}.
                      </p>
                    )}
                  </div>
                );
              } catch {
                return <p>Enter an amount to preview the rule.</p>;
              }
            }}
            save={async (v) => {
              await saveRule(draft(v), v.ack === "Yes");
              edit(null);
              set("Rule saved. Existing awards retain their original terms.");
            }}
          />
        </Modal>
      )}
    </>
  );
}
export function Assignments({ s, team }: { s: Data; team: boolean }) {
  const [open, show] = useState(false),
    [msg, set] = useState("");
  const kind = team ? "Team" : "Agent",
    members = team ? s.teams : s.agents,
    all = progress(s),
    rules = s.targets.rules.filter(
      (r) => r.audience === "Assigned" && (team || r.recipient === "Agent"),
    );
  const ranks = new Map(
    s.teams
      .map(
        (t) =>
          [
            t.id,
            s.sales.filter(
              (x) =>
                x.status === "Approved" &&
                x.team === t.id &&
                day(x.reviewed, s.settings.timezone) ===
                  day(new Date().toISOString(), s.settings.timezone),
            ).length,
          ] as const,
      )
      .sort((a, b) => b[1] - a[1])
      .map(([id], i) => [id, i + 1]),
  );
  const rows = members.map((m) => {
    const eligible = all.filter(
      (p) => p.rule.recipient === kind && p.recipient === String(m.id),
    );
    return [
      team ? "#" + ranks.get(String(m.id)) + "　" + m.name : m.name,
      ...scopes.map((scope) => {
        const ps = eligible
          .filter((p) => p.rule.scope === scope)
          .sort((a, b) => a.rule.threshold - b.rule.threshold);
        const p = ps.find((x) => x.remaining > 0) || ps.at(-1);
        return p ? (
          <div>
            <b>
              {p.count} / {p.rule.threshold}
            </b>
            <progress max={p.rule.threshold} value={p.count} />
            <small>
              {p.origin} · {p.remaining ? "In progress" : "Reached"} ·{" "}
              {p.rule.spins} spins
            </small>
          </div>
        ) : (
          "—"
        );
      }),
      s.targets.awards
        .filter(
          (a) => a.rule.recipient === kind && a.recipient === String(m.id),
        )
        .map((a) => money(a.minor, a.rule.currency) + " · " + a.status)
        .join(", ") || "—",
    ];
  });
  return (
    <>
      <Panel
        title={kind + " target progress"}
        action={
          <button className="primary" onClick={() => show(true)}>
            Assign target
          </button>
        }
      >
        <p>
          {team
            ? "Team pools retain the entire award. Spin presentation identifies the team and its qualifying sale."
            : "Global and team-assigned agent rules are inherited. Individual assignments are effective-dated."}
        </p>
        <Table
          heads={[
            kind,
            "Daily • next target",
            "Weekly • next target",
            "Monthly • next target",
            "Bonus history",
          ]}
          rows={rows}
        />
        {msg && <p role="status">{msg}</p>}
      </Panel>
      <Panel title="Effective assignments">
        <Table
          heads={[kind, "Rule", "From", "Through"]}
          rows={s.targets.assignments
            .filter((a) => a.kind === kind)
            .map((a) => [
              members.find((m) => String(m.id) === a.member)?.name,
              s.targets.rules.find((r) => r.id === a.rule)?.name,
              a.start,
              a.end || "Open",
            ])}
        />
      </Panel>
      {open && (
        <Modal
          title={"Assign " + kind.toLowerCase() + " target"}
          close={() => show(false)}
        >
          {!rules.length ? (
            <p>
              Create a rule with an Assigned audience first.{" "}
              <a href="/admin/targets/rules">Open rule builder →</a>
            </p>
          ) : (
            <Form
              fields={[
                {
                  key: "rule",
                  label: "Target rule",
                  required: true,
                  options: rules.map((r) => [r.id, r.name]),
                },
                {
                  key: "member",
                  label: kind,
                  required: true,
                  options: members.map((m) => [String(m.id), m.name]),
                },
                {
                  key: "start",
                  label: "Effective from",
                  type: "date",
                  required: true,
                },
                { key: "end", label: "Effective through", type: "date" },
              ]}
              initial={{
                rule: rules[0].id,
                member: String(members[0]?.id ?? ""),
                start: day(new Date().toISOString(), s.settings.timezone),
                end: "",
              }}
              save={async (v) => {
                await assignTarget({
                  id: crypto.randomUUID(),
                  kind,
                  member: v.member,
                  rule: v.rule,
                  start: v.start,
                  end: v.end,
                });
                show(false);
                set("Target assignment saved.");
              }}
            />
          )}
        </Modal>
      )}
    </>
  );
}
