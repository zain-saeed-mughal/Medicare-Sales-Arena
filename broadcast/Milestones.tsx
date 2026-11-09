import { useState } from "react";
import type { Data } from "../admin/model";
import { Panel, Table, Modal, Form, values } from "../admin/ui";
import { saveRule, overlaps } from "../targets/commands";
import {
  money,
  minorUnits,
  currencies,
  type TargetRule,
} from "../targets/engine";
import { toggle, select, number } from "./Pages";
import { command, session } from "../admin/service";
export function Milestones({ s, bonus = false }: { s: Data; bonus?: boolean }) {
  const [editing, edit] = useState<TargetRule | null>(null),
    [scope, setScope] = useState("All");
  return (
    <>
      <div className="console-tabs">
        {["All", "Daily", "Weekly", "Monthly"].map((p) => (
          <button
            key={p}
            aria-pressed={scope === p}
            onClick={() => setScope(p)}
          >
            {p}
          </button>
        ))}
        <a href="/admin/competitions">Special competition →</a>
      </div>
      <Panel
        title={bonus ? "Bonus milestones" : "Sales target configuration"}
        action={
          <button
            className="primary"
            onClick={() =>
              edit({
                id: crypto.randomUUID(),
                version: 0,
                name: "",
                description: "",
                scope: "Daily",
                recipient: "Agent",
                audience: "Global",
                threshold: 5,
                currency: "USD",
                minor: 0,
                label: "Performance bonus",
                spins: 0,
                prizes: [],
                active: false,
                start: "",
                end: "",
                priority: 0,
                policy: "Cumulative",
                maximum: 0,
                approvalRequired: true,
                showProgress: true,
                showMilestone: true,
                showBonus: true,
              })
            }
          >
            + Add {bonus ? "bonus milestone" : "sales target"}
          </button>
        }
      >
        <p>
          {bonus
            ? "Configure what an approved-sales milestone earns. Earned, approved and paid remain separate statuses."
            : "Set daily, weekly and monthly goals for agents or team pools. Scores always come from approved sales."}
        </p>
        <Table
          heads={[
            "Milestone",
            "Period / audience",
            "Approved sales",
            "Bonus / spins",
            "TV",
            "Status",
            "",
          ]}
          rows={s.targets.rules
            .filter(
              (r) =>
                (!bonus || r.minor > 0) &&
                (scope === "All" || r.scope === scope),
            )
            .map((r) => [
              r.name,
              r.scope + " / " + r.recipient + " / " + r.audience,
              r.threshold,
              money(r.minor, r.currency) + " / " + r.spins + " spins",
              r.showProgress === false ? "Progress hidden" : "Progress visible",
              r.active ? "Enabled" : "Disabled",
              <button onClick={() => edit(r)}>Edit</button>,
            ])}
        />
        <div className="op-actions">
          <a href="/admin/targets/agents">Assign agent targets →</a>
          <a href="/admin/targets/teams">Assign team targets →</a>
          <a href="/admin/targets/rules">
            Advanced rule terms & version history →
          </a>
        </div>
      </Panel>
      {bonus && (
        <Panel title="Bonus TV presentation">
          <p>
            Popup title, subtitle, names, timing and style are managed
            centrally.
          </p>
          <a href="/admin/effects">Configure bonus popup →</a>
          {session(s)?.role === "Super Admin" && (
            <Form
              fields={[toggle("showAmounts", "Show exact bonus amounts on TV")]}
              initial={{ showAmounts: String(s.targets.showAmounts) }}
              save={async (v) => {
                await command(
                  "settings",
                  "target.visibility_changed",
                  "Arena 01",
                  (d) => {
                    d.targets.showAmounts = v.showAmounts === "true";
                    return "Bonus amount visibility changed";
                  },
                );
              }}
            />
          )}
          <a href="/admin/bonus-review">Review earned awards →</a>
        </Panel>
      )}
      {editing && (
        <Modal
          title={editing.version ? "Edit milestone" : "New milestone"}
          close={() => edit(null)}
        >
          <Form
            fields={[
              { key: "name", label: "Target name", required: true },
              select("scope", "Period", ["Daily", "Weekly", "Monthly"]),
              number("threshold", "Approved sales required", 1, 100000),
              select("recipient", "Recipient", ["Agent", "Team"]),
              select("audience", "Eligibility", ["Global", "Assigned"]),
              { key: "start", label: "Effective from", type: "date" },
              { key: "end", label: "Effective through", type: "date" },
              toggle("active", "Rule enabled"),
              toggle("showProgress", "Show progress on TV"),
              toggle("showMilestone", "Show milestone popup"),
              {
                key: "amount",
                label: "Bonus amount (two decimals)",
                required: true,
              },
              select("currency", "Currency", currencies),
              number("spins", "Spins earned", 0, 20),
              toggle("showBonus", "Show bonus popup"),
              toggle("approvalRequired", "Require bonus approval"),
              select("policy", "Overlapping milestones", [
                "Cumulative",
                "Highest tier",
              ]),
              select("ack", "Reviewed overlapping milestones", ["No", "Yes"]),
            ]}
            initial={{
              ...values({
                showProgress: true,
                showMilestone: true,
                showBonus: true,
                approvalRequired: true,
                ...editing,
              }),
              amount: (editing.minor / 100).toFixed(2),
              ack: "No",
            }}
            preview={(v) => (
              <div className="rule-summary">
                <b>
                  {v.threshold} {v.scope.toLowerCase()} approvals → {v.currency}{" "}
                  {v.amount} + {v.spins} spins
                </b>
                <p>
                  {v.audience === "Assigned"
                    ? "Assign eligible agents or teams after saving."
                    : "Applies globally to active recipients."}{" "}
                  {v.policy === "Cumulative"
                    ? "Each qualifying milestone earns its full award."
                    : "Only the increase over a previously earned highest tier is awarded."}
                </p>
                <p>
                  Existing awards retain their original terms. Saving never
                  grants historical rewards.
                </p>
                {overlaps(s, {
                  ...editing,
                  scope: v.scope as TargetRule["scope"],
                  recipient: v.recipient as TargetRule["recipient"],
                  active: v.active === "true",
                }).length > 0 && (
                  <p>
                    Overlapping active milestones exist. Review the policy
                    before enabling.
                  </p>
                )}
              </div>
            )}
            save={async (v) => {
              await saveRule(
                {
                  ...editing,
                  name: v.name,
                  scope: v.scope as TargetRule["scope"],
                  threshold: Number(v.threshold),
                  recipient: v.recipient as TargetRule["recipient"],
                  audience: v.audience as TargetRule["audience"],
                  start: v.start,
                  end: v.end,
                  active: v.active === "true",
                  showProgress: v.showProgress === "true",
                  showMilestone: v.showMilestone === "true",
                  showBonus: v.showBonus === "true",
                  approvalRequired: v.approvalRequired === "true",
                  minor: minorUnits(v.amount),
                  currency: v.currency,
                  spins: Number(v.spins),
                  policy: v.policy as TargetRule["policy"],
                },
                v.ack === "Yes",
              );
              edit(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
