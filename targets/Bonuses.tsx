import { useState } from "react";
import { type Data, type AdminUser, day } from "../admin/model";
import { command, retryEntitlements } from "../admin/service";
import { Panel, Table, Modal, Form, Badge, Kpis, opts } from "../admin/ui";
import {
  can,
  csv,
  totals,
  statuses,
  scopes,
  money,
  type BonusAward,
} from "./engine";
import { decide, type Decision, authorized } from "./commands";
export function Bonuses({
  s,
  u,
  history,
}: {
  s: Data;
  u: AdminUser;
  history: boolean;
}) {
  const [q, search] = useState(""),
    [f, filter] = useState<Record<string, string>>({}),
    [id, open] = useState(""),
    [decision, choose] = useState<Decision | null>(null),
    [msg, set] = useState("");
  const rows = s.targets.awards.filter((a) => {
    const date = day(a.earned, a.timezone);
    return (
      (!q ||
        (a.name + " " + a.rule.name + " " + a.id)
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (!f.agent || (a.rule.recipient === "Agent" && a.recipient === f.agent)) &&
      (!f.team || a.team === f.team) &&
      (!f.scope || a.rule.scope === f.scope) &&
      (!f.rule || a.rule.id === f.rule) &&
      (!f.status || a.status === f.status) &&
      (!f.currency || a.rule.currency === f.currency) &&
      (!f.from || date >= f.from) &&
      (!f.to || date <= f.to)
    );
  });
  const a = s.targets.awards.find((a) => a.id === id);
  const filters: [string, [string, string][]][] = [
    ["agent", s.agents.map((a) => [String(a.id), a.name])],
    ["team", s.teams.map((t) => [t.id, t.name])],
    ["scope", opts([...scopes])],
    ["rule", s.targets.rules.map((r) => [r.id, r.name])],
    ["status", opts([...statuses])],
    [
      "currency",
      opts([...new Set(s.targets.awards.map((a) => a.rule.currency))]),
    ],
  ];
  async function download() {
    try {
      await command("bonuses/history", "bonus.export", "CSV", (d, user) => {
        authorized(user, "export");
        return rows.length + " filtered records";
      });
      const url = URL.createObjectURL(
        new Blob(["\uFEFF" + csv(rows)], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "nexus-development-bonuses.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      set("Filtered CSV exported.");
    } catch (e) {
      set((e as Error).message);
    }
  }
  function actions(a: BonusAward): Decision[] {
    const list: Decision[] = ["Add note"];
    if (a.status === "Pending Review") list.push("Approve", "Reject");
    if (a.status === "Approved") list.push("Schedule");
    if (can(u, "pay") && ["Approved", "Scheduled"].includes(a.status))
      list.push("Record payment");
    if (!s.targets.adjustments.some((x) => x.award === a.id))
      list.push("Adjust");
    return list;
  }
  return (
    <>
      <Panel
        title={history ? "Payout history" : "Bonus review desk"}
        action={<button onClick={download}>Export filtered CSV</button>}
      >
        <p>
          Development compensation ledger. Paid records a manually confirmed
          external payment.
        </p>
        <div className="op-filters">
          <input
            aria-label="Search bonuses"
            placeholder="Find award or recipient"
            value={q}
            onChange={(e) => search(e.target.value)}
          />
          {filters.map(([k, options]) => (
            <select
              key={k}
              aria-label={k}
              value={f[k] || ""}
              onChange={(e) => filter({ ...f, [k]: e.target.value })}
            >
              <option value="">All {k}</option>
              {options.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          ))}
          {["from", "to"].map((k) => (
            <label key={k}>
              Earned {k}
              <input
                type="date"
                value={f[k] || ""}
                onChange={(e) => filter({ ...f, [k]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <Table
          heads={[
            "Recipient",
            "Rule / period",
            "Bonus",
            "Status",
            "Earned",
            "Action",
          ]}
          rows={rows.map((a) => [
            a.name,
            a.rule.name + " / " + a.period,
            money(a.minor, a.rule.currency),
            <Badge value={a.status} />,
            day(a.earned, a.timezone),
            <button
              onClick={() => {
                open(a.id);
                choose(null);
              }}
            >
              Inspect
            </button>,
          ])}
        />
        {msg && <p role="status">{msg}</p>}
      </Panel>
      <Panel title="Filtered totals by status and currency">
        <Table
          heads={["Status", "Awards", "Totals"]}
          rows={statuses
            .filter((v) => rows.some((a) => a.status === v))
            .map((v) => {
              const items = rows.filter((a) => a.status === v);
              return [v, items.length, totals(items)];
            })}
        />
      </Panel>
      <Panel title="Adjustments and recovery reviews">
        <Table
          heads={["Recipient", "Review", "Amount", "Reason", "Operator"]}
          rows={s.targets.adjustments
            .filter((x) => rows.some((a) => a.id === x.award))
            .map((x) => {
              const a = s.targets.awards.find((a) => a.id === x.award)!;
              return [
                a.name,
                x.kind,
                money(x.minor, a.rule.currency),
                x.reason,
                x.actor,
              ];
            })}
        />
      </Panel>
      {a && (
        <Modal title={a.name + " · " + a.rule.name} close={() => open("")}>
          <Badge value={a.status} />
          <div className="op-details">
            {Object.entries({
              "Bonus ID": a.id,
              Terms: a.rule.scope + " / v" + a.rule.version,
              "Qualifying approvals": a.count,
              Amount: money(a.minor, a.rule.currency),
              Earned: a.earned,
              Review: a.approval
                ? a.approval.actor + " · " + a.approval.at
                : "Pending",
              Paid: a.payment ? a.payment.at + " · " + a.payment.actor : "—",
              "Payment reference": a.payment?.reference || "—",
              "Qualifying sales": a.sales.join(", "),
            }).map(([k, v]) => (
              <p key={k}>
                <span>{k}</span>
                <b>{v}</b>
              </p>
            ))}
          </div>
          <div className="op-actions">
            {actions(a).map((x) => (
              <button key={x} onClick={() => choose(x)}>
                {x}
              </button>
            ))}
          </div>
          {decision && (
            <Form
              key={decision}
              fields={[
                {
                  key: "note",
                  label: "Internal note / reason",
                  required: ["Reject", "Adjust", "Add note"].includes(decision),
                },
                ...(decision === "Record payment"
                  ? [
                      {
                        key: "ref",
                        label: "External payment reference (optional)",
                      },
                      {
                        key: "confirm",
                        label:
                          "I verified that payment was completed externally",
                        options: opts(["No", "Yes"]),
                      },
                    ]
                  : []),
              ]}
              initial={{ note: "", ref: "", confirm: "No" }}
              submit={"Confirm " + decision.toLowerCase()}
              save={async (v) => {
                await decide(
                  a.id,
                  decision,
                  v.note,
                  v.ref,
                  v.confirm === "Yes",
                );
                choose(null);
                set("Award updated.");
              }}
            />
          )}
          <h3>Spin entitlements</h3>
          {s.targets.entitlements
            .filter((e) => e.award === a.id)
            .map((e) => (
              <p key={e.id}>
                {e.state} ·{" "}
                {s.spins.find((sp) => sp.id === e.spin)?.prize ||
                  "Awaiting eligible inventory"}
              </p>
            ))}
          {s.targets.entitlements.some(
            (e) => e.award === a.id && e.state === "Pending inventory",
          ) && (
            <button
              onClick={() =>
                retryEntitlements(a.id)
                  .then(() => set("Inventory rechecked."))
                  .catch((e) => set(e.message))
              }
            >
              Retry available inventory
            </button>
          )}
          <h3>Audit history</h3>
          {s.audit
            .filter((x) => x.entity === id)
            .map((x) => (
              <p key={x.id}>
                {x.time} · {x.actor} · {x.action}
                <small>{x.detail}</small>
              </p>
            ))}
        </Modal>
      )}
    </>
  );
}
