import { useState } from "react";
import { Form, Modal, Panel, Table, Badge, opts } from "./ui";
import { type Data, type AdminUser, day } from "./model";
import { checkTeam, command, review } from "./service";
import { format } from "./Catalog";
export function Sales({ s, u }: { s: Data; u: AdminUser }) {
  const [filter, set] = useState({
      q: "",
      agent: "",
      team: "",
      status: "",
      from: "",
      to: "",
      order: "Newest first",
    }),
    [page, paginate] = useState(0),
    [id, open] = useState(
      new URLSearchParams(location.search).get("sale") || "",
    ),
    [create, add] = useState(false),
    [action, choose] = useState<"Approved" | "Rejected" | "Cancelled" | "">("");
  const own = s.sales.filter(
    (x) => u.role !== "Sales Manager" || x.team === u.team,
  );
  const rows = own
    .filter((x) => {
      const date = day(x.submitted, s.settings.timezone);
      return (
        x.id.toLowerCase().includes(filter.q.toLowerCase()) &&
        (!filter.agent || String(x.agent) === filter.agent) &&
        (!filter.team || x.team === filter.team) &&
        (!filter.status || x.status === filter.status) &&
        (!filter.from || date >= filter.from) &&
        (!filter.to || date <= filter.to)
      );
    })
    .sort((a, b) =>
      filter.order === "Reference"
        ? a.id.localeCompare(b.id)
        : (filter.order === "Oldest first" ? 1 : -1) *
          a.submitted.localeCompare(b.submitted),
    );
  const selected = own.find((x) => x.id === id),
    last = Math.max(0, Math.ceil(rows.length / 12) - 1),
    n = Math.min(page, last);
  const agent = (id: number) => s.agents.find((a) => a.id === id)?.name,
    team = (id: string) => s.teams.find((t) => t.id === id)?.name;
  const update = (k: keyof typeof filter, v: string) => {
    set({ ...filter, [k]: v });
    paginate(0);
  };
  return (
    <Panel
      title="Sales review queue"
      action={
        <button className="primary" onClick={() => add(true)}>
          + Submit sale
        </button>
      }
    >
      <div className="status-tabs">
        {["", "Pending", "Rejected", "Cancelled", "Approved"].map((st) => (
          <button
            key={st}
            aria-pressed={filter.status === st}
            onClick={() => update("status", st)}
          >
            {st === "Cancelled" ? "Reversed / cancelled" : st || "All sales"}{" "}
            <b>{own.filter((x) => !st || x.status === st).length}</b>
          </button>
        ))}
      </div>
      <div className="op-filters">
        <input
          aria-label="Search by reference"
          placeholder="Search sale reference"
          value={filter.q}
          onChange={(e) => update("q", e.target.value)}
        />
        {(["agent", "team", "status", "order"] as const).map((k) => (
          <select
            aria-label={k}
            key={k}
            value={filter[k]}
            onChange={(e) => update(k, e.target.value)}
          >
            {k !== "order" && (
              <option value="">
                All {k === "status" ? "statuses" : k + "s"}
              </option>
            )}
            {(k === "agent"
              ? s.agents.map((a) => [a.id, a.name])
              : k === "team"
                ? s.teams.map((t) => [t.id, t.name])
                : opts(
                    k === "status"
                      ? ["Pending", "Approved", "Rejected", "Cancelled"]
                      : ["Newest first", "Oldest first", "Reference"],
                  )
            ).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        ))}
        {(["from", "to"] as const).map((k) => (
          <label key={k}>
            {k}
            <input
              type="date"
              value={filter[k]}
              onChange={(e) => update(k, e.target.value)}
            />
          </label>
        ))}
      </div>
      <Table
        heads={[
          "Sale reference",
          "Source Dialer",
          "Agent",
          "Team",
          "Submitted",
          "Status",
          "Review time",
          "Reviewed by",
          "Actions",
        ]}
        rows={rows.slice(n * 12, n * 12 + 12).map((x) => [
          x.id,
          <code key="dialer" style={{ fontSize: "0.8rem" }}>{x.dialerId === "dialer-b" ? "Dialer B" : "Dialer A"}</code>,
          agent(x.agent),
          team(x.team),
          format(x.submitted),
          <Badge value={x.status} />,
          format(x.reviewed),
          x.reviewer || "—",
          <button
            onClick={() => {
              open(x.id);
              choose("");
            }}
          >
            Review
          </button>,
        ])}
      />
      <div className="op-pages">
        {rows.length} records · Page {n + 1} of {last + 1}
        <button disabled={!n} onClick={() => paginate(n - 1)}>
          Previous
        </button>
        <button disabled={n >= last} onClick={() => paginate(n + 1)}>
          Next
        </button>
      </div>
      {selected && (
        <Modal title={"Sale " + selected.id} close={() => open("")}>
          <Badge value={selected.status} />
          <div className="op-details">
            {Object.entries({
              Agent: agent(selected.agent),
              "Team at submission": team(selected.team),
              "Source dialer": selected.dialerId ? (selected.dialerId === "dialer-b" ? "Dialer B (Secondary)" : "Dialer A (Primary)") : "Dialer A (Primary)",
              "External sale ID": selected.externalSaleId || "EXT-" + selected.id.replace(/\D/g, ""),
              Submitted: format(selected.submitted),
              "Reviewed by": selected.reviewer || "Awaiting validation",
              "Reviewed at": selected.reviewed ? format(selected.reviewed) : "Pending",
              "Internal notes": selected.notes || "None",
            }).map(([k, v]) => (
              <p key={k}>
                <span>{k}</span>
                <b>{v}</b>
              </p>
            ))}
          </div>
          <h3>Review history</h3>
          {s.audit
            .filter((x) => x.entity === id)
            .map((e) => (
              <p key={e.id}>
                {format(e.time)} · {e.actor} · {e.detail}
              </p>
            ))}
          <div className="op-actions">
            {selected.status === "Pending" ? (
              <>
                <button className="primary" onClick={() => choose("Approved")}>
                  Approve sale
                </button>
                <button onClick={() => choose("Rejected")}>Reject</button>
              </>
            ) : (
              selected.status === "Approved" &&
              ["Admin", "Super Admin"].includes(u.role) && (
                <button onClick={() => choose("Cancelled")}>
                  Reverse approval
                </button>
              )
            )}
          </div>
          {action && (
            <Form
              key={action}
              fields={[
                {
                  key: "reason",
                  label:
                    action === "Approved"
                      ? "Internal note (optional)"
                      : "Reason for " + action.toLowerCase(),
                  required: action !== "Approved",
                },
              ]}
              initial={{}}
              submit={
                "Confirm " +
                (action === "Approved"
                  ? "approval"
                  : action === "Rejected"
                    ? "rejection"
                    : "reversal")
              }
              save={async (v) => {
                await review(id, action, v.reason || "");
                choose("");
                open("");
              }}
            />
          )}
        </Modal>
      )}
      {create && (
        <Modal title="Submit development sale" close={() => add(false)}>
          <Form
            fields={[
              {
                key: "agent",
                label: "Agent",
                required: true,
                options: [
                  ["", "Select an agent"],
                  ...s.agents
                    .filter(
                      (a) =>
                        a.active &&
                        (u.role !== "Sales Manager" || u.team === a.team),
                    )
                    .map((a) => [String(a.id), a.name] as [string, string]),
                ],
              },
              {
                key: "dialerId",
                label: "Source Dialer",
                type: "select",
                options: [
                  ["dialer-a", "Dialer Primary (Alpha)"],
                  ["dialer-b", "Dialer Secondary (Beta)"],
                ],
              },
              { key: "notes", label: "Internal operational note" },
            ]}
            initial={{ dialerId: "dialer-a" }}
            submit="Submit for review"
            save={async (v) => {
              const id = "SA-" + crypto.randomUUID().slice(0, 8);
              await command("sales", "sale.submitted", id, (d, user) => {
                const a = d.agents.find(
                  (a) => String(a.id) === v.agent && a.active,
                );
                if (!a) throw Error("Select an active agent");
                checkTeam(user, a.team);
                d.sales.push({
                  id,
                  agent: a.id,
                  team: a.team,
                  status: "Pending",
                  submitted: new Date().toISOString(),
                  notes: v.notes || "",
                  reviewed: "",
                  reviewer: "",
                  dialerId: v.dialerId || "dialer-a",
                  externalSaleId: "EXT-" + (10000 + d.sales.length + 1),
                });
                return `${a.name} via ${v.dialerId || "dialer-a"}`;
              });
              add(false);
            }}
          />
        </Modal>
      )}
    </Panel>
  );
}
