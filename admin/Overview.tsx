import { useDisplayPresence } from "./presence";
import { useState } from "react";
import { useData, session } from "./service";
import {
  todaySales,
  standings,
  teamScores,
  type Data,
  type AdminUser,
} from "./model";
import { Table, Kpis, Panel, Badge, Modal } from "./ui";
import { format } from "./Catalog";
export function Dashboard({ s, u }: { s: Data; u: AdminUser }) {
  const online = useDisplayPresence();
  const [range, set] = useState("Daily");
  const sales = todaySales(s),
    pending = sales.filter(
      (x) =>
        x.status === "Pending" &&
        (u.role !== "Sales Manager" || x.team === u.team),
    ),
    active = s.competitions.find((c) => c.status === "Active");
  const span =
      range === "Daily"
        ? 86400000
        : range === "Weekly"
          ? 7 * 86400000
          : 30 * 86400000,
    bins = Array<number>(range === "Weekly" ? 7 : 12).fill(0),
    start = Date.now() - span;
  s.sales.forEach((x) => {
    const i = Math.floor(
      ((Date.parse(x.submitted) - start) / span) * bins.length,
    );
    if (i >= 0 && i < bins.length) bins[i]++;
  });
  return (
    <>
      <Kpis
        items={[
          ["Sales today", sales.length],
          [
            "Pending review",
            sales.filter((x) => x.status === "Pending").length,
          ],
          [
            "Approved sales",
            sales.filter((x) => x.status === "Approved").length,
          ],
          [
            "Rejected sales",
            sales.filter((x) => x.status === "Rejected").length,
          ],
          ["Active agents", s.agents.filter((x) => x.active).length],
          ["Active teams", s.teams.filter((x) => x.active).length],
          ["Rewards earned", s.spins.filter((x) => !x.voided).length],
          ["Active competition", active?.name || "None"],
        ]}
      />
      <div className="op-columns">
        <Panel
          title="Sales activity"
          action={
            <select
              aria-label="Chart period"
              value={range}
              onChange={(e) => set(e.target.value)}
            >
              {["Daily", "Weekly", "Monthly"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          }
        >
          <div className="chart-caption">
            <b>{bins.reduce((a, b) => a + b, 0)}</b>
            <span>submissions in this period</span>
          </div>
          <div className="op-chart">
            {bins.map((v, i) => (
              <div
                key={i}
                title={v + " submissions"}
                style={{
                  height: Math.max(3, (v / Math.max(...bins, 1)) * 100) + "%",
                }}
              >
                <span>{v}</span>
              </div>
            ))}
          </div>
          <p className="chart-axis">
            <span>{new Date(start).toLocaleDateString()}</span>
            <span>Submissions · rolling {range.toLowerCase()} window</span>
            <span>Now</span>
          </p>
        </Panel>
        <Panel title="Broadcast status">
          <Badge
            value={
              online ? "Local Arena tab detected" : "No local Arena heartbeat"
            }
          />
          <h3>{s.settings.mode}</h3>
          <p>
            {active?.name} · {s.settings.timezone}
          </p>
          <a href="/arena" target="_blank">
            Open Live Arena ↗
          </a>
          {["Super Admin", "Admin", "Arena Operator"].includes(u.role) && (
            <p>
              <a href="/admin/arena-control">Open control center →</a>
            </p>
          )}
        </Panel>
      </div>
      <div className="op-columns">
        <Panel title="Awaiting approval">
          <div className="pipeline">
            {["Pending", "Approved", "Rejected", "Cancelled"].map((status) => (
              <span
                key={status}
                title={status}
                style={{
                  flex: sales.filter((x) => x.status === status).length,
                  background: (
                    {
                      Pending: "#efc46a",
                      Approved: "var(--arena-success)",
                      Rejected: "var(--arena-error)",
                      Cancelled: "var(--arena-text-muted)",
                    } as Record<string, string>
                  )[status],
                }}
              />
            ))}
          </div>
          <Table
            heads={["Sale", "Agent", "Action"]}
            rows={pending
              .sort((a, b) => b.submitted.localeCompare(a.submitted))
              .slice(0, 5)
              .map((x) => [
                x.id,
                s.agents.find((a) => a.id === x.agent)?.name,
                u.role === "Arena Operator" ? (
                  "Pending"
                ) : (
                  <a href={"/admin/sales?sale=" + x.id}>Review →</a>
                ),
              ])}
          />
        </Panel>
        <Panel title="Top performers">
          <Table
            heads={["Rank", "Agent", "Approved"]}
            rows={standings(s)
              .slice(0, 5)
              .map((a, i) => [i + 1, a.name, a.sales])}
          />
        </Panel>
      </div>
      <div className="op-columns">
        <Panel title="Team standings">
          <Table
            heads={["Team", "Approved"]}
            rows={teamScores(s).map((t) => [t.name, t.score])}
          />
        </Panel>
        <Panel title="Recent activity">
          {s.audit.slice(0, 5).map((x) => (
            <p key={x.id}>
              {x.action} · {x.actor}
              <small>{format(x.time)}</small>
            </p>
          ))}
        </Panel>
      </div>
    </>
  );
}
export function ActivityLog() {
  const data = useData();
  const role = session(data)?.role;
  const s =
    role === "Admin" || role === "Super Admin"
      ? data
      : {
          ...data,
          audit: data.audit.filter(
            (e) =>
              !e.action.startsWith("bonus.") && !e.action.startsWith("target."),
          ),
        };
  const [q, set] = useState(""),
    [action, filter] = useState(""),
    [actor, by] = useState(""),
    [date, on] = useState(""),
    [id, open] = useState("");
  const e = s.audit.find((e) => e.id === id);
  return (
    <Panel title="Administrative audit trail">
      <div className="op-filters">
        <input
          aria-label="Search activity"
          placeholder="Search events or entities"
          value={q}
          onChange={(e) => set(e.target.value)}
        />
        {[
          [action, filter, "Event type", s.audit.map((x) => x.action)],
          [actor, by, "Actor", s.audit.map((x) => x.actor)],
        ].map(([v, fn, title, options]) => (
          <select
            key={String(title)}
            aria-label={String(title)}
            value={String(v)}
            onChange={(e) => (fn as typeof filter)(e.target.value)}
          >
            <option value="">{String(title)}</option>
            {Array.from(new Set(options as string[])).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        ))}
        <input
          aria-label="Event date UTC"
          type="date"
          value={date}
          onChange={(e) => on(e.target.value)}
        />
      </div>
      <Table
        heads={["Time", "Action", "Actor", "Entity", "Details"]}
        rows={s.audit
          .filter(
            (e) =>
              (!actor || e.actor === actor) &&
              (!action || e.action === action) &&
              (!date || e.time.startsWith(date)) &&
              (e.action + e.entity + e.detail)
                .toLowerCase()
                .includes(q.toLowerCase()),
          )
          .map((x) => [
            format(x.time),
            x.action,
            x.actor,
            x.entity,
            <button onClick={() => open(x.id)}>Inspect</button>,
          ])}
      />
      {e && (
        <Modal title={e.action} close={() => open("")}>
          <p>
            {e.actor} · {format(e.time)}
          </p>
          <p>{e.entity}</p>
          <pre>{e.detail}</pre>
        </Modal>
      )}
    </Panel>
  );
}
