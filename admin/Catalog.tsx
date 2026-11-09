import { CompetitionCalendar } from "./CompetitionCalendar";
import { useState, useRef } from "react";
import {
  Panel,
  Table,
  Modal,
  Form,
  Badge,
  Kpis,
  type Field,
  type Values,
  activeField,
  nameField,
  opts,
  values,
} from "./ui";
import {
  roles,
  standings,
  teamScores,
  todaySales,
  participants,
  type Data,
  type AdminUser,
} from "./model";
import {
  command,
  checkTeam,
  queuePresentation,
  reportServiceError,
} from "./service";
import { PrizeWheel } from "../Celebration";
type Kind = "agents" | "teams" | "competitions" | "prizes" | "rules" | "users";
export const format = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        timeZone: "UTC",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }) + " UTC"
    : "—";
const cmpTypes = [
  "Daily Sales Championship",
  "Weekly Sales Championship",
  "Team vs Team",
  "Individual Leaderboard",
  "Special Event Competition",
];
export function Catalog({ s, u, kind }: { s: Data; u: AdminUser; kind: Kind }) {
  const [editing, edit] = useState<Values | null>(null),
    [detail, show] = useState(""),
    [q, search] = useState("");
  const original = useRef<string | undefined>(undefined);
  const teams = s.teams
      .filter((t) => u.role !== "Sales Manager" || t.id === u.team)
      .map((t) => [t.id, t.name] as [string, string]),
    agents = s.agents.map((a) => [String(a.id), a.name] as [string, string]);
  const teamField: Field = {
    key: "team",
    label: "Assigned team",
    options: teams,
    required: true,
  };
  const multi = (
    key: string,
    label: string,
    options: [string, string][],
  ): Field => ({ key, label, type: "multi", options });
  const dates: Field[] = ["start", "end"].map((key) => ({
    key,
    label: key + " time (UTC)",
    type: "datetime-local",
    required: kind === "competitions",
  }));
  const number = (key: string, label: string, min = 0): Field => ({
    key,
    label,
    type: "number",
    min,
    required: true,
  });
  const fields: Record<Kind, Field[]> = {
    agents: [
      nameField,
      teamField,
      activeField,
      { key: "avatar", label: "Profile image", type: "avatar" },
    ],
    teams: [
      nameField,
      {
        key: "leader",
        label: "Team leader",
        options: [["", "Unassigned"], ...agents],
      },
      multi("members", "Team members", agents),
      activeField,
    ],
    competitions: [
      nameField,
      { key: "description", label: "Description" },
      { key: "type", label: "Competition type", options: opts(cmpTypes) },
      number("pointsPerSale", "Points per approved sale", 1),
      ...dates,
      multi("teams", "Participating teams (empty = all)", teams),
      multi("agents", "Participating agents (empty = all)", agents),
      {
        key: "status",
        label: "Status",
        options: opts([
          "Draft",
          "Scheduled",
          "Active",
          "Completed",
          "Archived",
        ]),
      },
    ],
    prizes: [
      nameField,
      { key: "description", label: "Description" },
      { key: "type", label: "Reward type" },
      number("amount", "Cash amount (0 = non-cash)"),
      {
        key: "currency",
        label: "Currency",
        options: opts(["PKR", "USD", "EUR", "GBP", "AED"]),
      },
      { key: "icon", label: "Segment icon" },
      { key: "color", label: "Segment color", type: "color" },
      number("weight", "Assignment weight", 1),
      number("limit", "Inventory limit (0 = unlimited)"),
      activeField,
    ],
    rules: [
      nameField,
      number("threshold", "Approved sales per spin", 1),
      number("max", "Maximum spins per agent (0 = unlimited)"),
      {
        key: "competition",
        label: "Competition",
        options: [
          ["", "Any competition"],
          ...s.competitions.map((c) => [c.id, c.name] as [string, string]),
        ],
      },
      multi("teams", "Eligible teams (empty = all)", teams),
      multi("agents", "Eligible agents (empty = all)", agents),
      ...dates,
      activeField,
    ],
    users: [
      nameField,
      { key: "role", label: "Development role", options: opts([...roles]) },
      { ...teamField, required: false, options: [["", "All teams"], ...teams] },
      activeField,
    ],
  };
  const singular = {
    agents: "agent",
    teams: "team",
    competitions: "competition",
    prizes: "prize",
    rules: "rule",
    users: "user",
  }[kind];
  const list = s[kind]
    .map(values)
    .filter(
      (r) =>
        u.role !== "Sales Manager" ||
        (kind === "agents" ? r.team === u.team : r.id === u.team),
    );
  const ranked = standings(s),
    ts = teamScores(s);
  const target = list.find((r) => r.id === detail);
  function open(r?: Values) {
    original.current = r?.id
      ? JSON.stringify(s[kind].find((x) => String(x.id) === r.id))
      : undefined;
    const v = {
      id: "",
      name: "",
      active: "true",
      role: "Admin",
      team: teams[0]?.[0] || "",
      threshold: "5",
      pointsPerSale: "1",
      max: "0",
      weight: "1",
      limit: "0",
      amount: "0",
      currency: "PKR",
      color: "#590b25",
      status: "Draft",
      type: kind === "competitions" ? cmpTypes[0] : "Recognition",
      ...r,
    };
    edit({
      ...v,
      amount: String(Number(r?.minor || 0) / 100),
      members: s.agents
        .filter((a) => a.team === v.id)
        .map((a) => a.id)
        .join(","),
      start: r?.start?.slice(0, 16) || "",
      end: r?.end?.slice(0, 16) || "",
    });
  }
  async function save(v: Values) {
    await command(
      ["rules", "prizes"].includes(kind) ? "rewards" : kind,
      singular + "." + (editing?.id ? "updated" : "created"),
      editing?.id || v.name,
      (d, user) => {
        if (!v.name.trim()) throw Error("Enter a name.");
        const id = editing?.id || crypto.randomUUID(),
          active = v.active === "true",
          name = v.name.trim(),
          team = v.team || "";
        const existing = d[kind].find((x) => String(x.id) === id);
        if (editing?.id && JSON.stringify(existing) !== original.current)
          throw Error("Record changed. Reopen the editor.");
        if (kind === "agents") {
          const a = d.agents.find((a) => String(a.id) === id);
          if (a) checkTeam(user, a.team);
          checkTeam(user, team);
          const item = {
            id: a?.id ?? Math.max(-1, ...d.agents.map((a) => a.id)) + 1,
            name,
            active,
            team,
            avatar: v.avatar || "",
          };
          if (a) Object.assign(a, item);
          else d.agents.push(item);
          d.teams.forEach((t) => {
            if (t.leader === String(item.id) && t.id !== team) t.leader = "";
          });
        }
        if (kind === "teams") {
          if (user.role === "Sales Manager" && id !== user.team)
            throw Error("Assigned team only");
          const before = d.teams.find((t) => t.id === id);
          const members = (v.members || "").split(",").filter(Boolean);
          if (v.leader && !members.includes(v.leader))
            throw Error("Select the leader as a member.");
          if (
            user.role === "Sales Manager" &&
            d.agents.some(
              (a) => members.includes(String(a.id)) && a.team !== id,
            )
          )
            throw Error("Cannot transfer agents from other teams.");
          const item = { id, name, active, leader: v.leader || "" };
          if (before) Object.assign(before, item);
          else d.teams.push(item);
          d.agents.forEach((a) => {
            if (members.includes(String(a.id))) a.team = id;
            else if (a.team === id) a.team = "";
          });
          d.teams.forEach((t) => {
            if (
              t.leader &&
              !d.agents.some(
                (a) => String(a.id) === t.leader && a.team === t.id,
              )
            )
              t.leader = "";
          });
        }
        const iso = (key: string) =>
          v[key] ? new Date(v[key] + "Z").toISOString() : "";
        if (v.start && v.end && v.end <= v.start)
          throw Error("End time must follow start time.");
        if (kind === "competitions") {
          const prior = d.competitions.find((x) => x.id === id);
          if (prior?.results) throw Error("Completed results are locked.");
          if (
            v.status === "Active" &&
            d.competitions.some((c) => c.id !== id && c.status === "Active")
          )
            throw Error("Complete the current competition first.");
          const item = {
            id,
            name,
            type: v.type,
            pointsPerSale:
              kind === "competitions"
                ? Number(v.pointsPerSale || 1)
                : undefined,
            description: v.description || "",
            teams: v.teams || "",
            agents: v.agents || "",
            start: iso("start"),
            end: iso("end"),
            status: v.status,
          };
          const results = ["Completed", "Archived"].includes(item.status)
            ? standings(d, item)
            : undefined;
          const completedAt = results ? new Date().toISOString() : undefined;
          const teamResults = results
            ? d.teams
                .map((t) => ({
                  id: t.id,
                  name: t.name,
                  score: d.sales.filter(
                    (x) =>
                      x.status === "Approved" &&
                      x.team === t.id &&
                      x.reviewed >= item.start &&
                      x.reviewed <= item.end &&
                      participants(item.teams, x.team) &&
                      participants(item.agents, x.agent),
                  ).length,
                }))
                .sort((a, b) => b.score - a.score)
            : undefined;
          if (prior)
            Object.assign(prior, item, { results, completedAt, teamResults });
          else
            d.competitions.push({ ...item, results, completedAt, teamResults });
          if (
            results &&
            item.type === "Team vs Team" &&
            teamResults?.[0]?.score &&
            d.settings.animations
          ) {
            const winner = teamResults[0];
            queuePresentation(d, {
              sequence: ++d.sequence,
              eventId: "competition:" + id + ":winner",
              category: "teamWin",
              name: winner.name,
              team: winner.name,
              sales: winner.score,
              sale: "",
              spin: "",
              demo: false,
              created: completedAt,
              timeframe: item.name,
            });
          }
        }
        if (kind === "rules") {
          const item = {
            id,
            name,
            active,
            threshold: Number(v.threshold),
            max: Number(v.max),
            agents: v.agents || "",
            teams: v.teams || "",
            competition: v.competition || "",
            start: iso("start"),
            end: iso("end"),
          };
          const prior = d.rules.find((x) => x.id === id);
          if (prior) Object.assign(prior, item);
          else d.rules.push(item);
        }
        if (kind === "prizes") {
          const amount = Number(v.amount || 0);
          if (
            !/^\d+(\.\d{1,2})?$/.test(v.amount || "0") ||
            !Number.isFinite(amount) ||
            amount < 0 ||
            !Number.isSafeInteger(Math.round(amount * 100))
          )
            throw Error("Enter a valid cash amount.");
          if (
            !Number.isInteger(Number(v.limit)) ||
            Number(v.limit) < 0 ||
            !Number.isFinite(Number(v.weight)) ||
            Number(v.weight) < 1
          )
            throw Error(
              "Inventory must be a nonnegative whole number and weight at least 1.",
            );
          if (!/^#[0-9a-f]{6}$/i.test(v.color))
            throw Error("Choose a valid segment color.");
          const item = {
            id,
            name,
            active,
            minor: Math.round(amount * 100),
            currency: v.currency || "PKR",
            weight: Number(v.weight),
            limit: Number(v.limit),
            color: v.color,
            icon: v.icon || "",
            description: v.description || "",
            type: v.type,
          };
          const prior = d.prizes.find((x) => x.id === id);
          if (prior) Object.assign(prior, item);
          else d.prizes.push(item);
        }
        if (kind === "users") {
          if (user.id === id && (!active || v.role !== "Super Admin"))
            throw Error("Keep your active super-admin profile.");
          if (v.role === "Sales Manager" && !team)
            throw Error("Assign a team to the sales manager.");
          const item = {
            id,
            name,
            active,
            team,
            role: v.role as AdminUser["role"],
          };
          const prior = d.users.find((x) => x.id === id);
          if (prior) Object.assign(prior, item);
          else d.users.push(item);
        }
        return JSON.stringify({
          ...v,
          avatar: v.avatar ? "Image supplied" : undefined,
        });
      },
    );
    edit(null);
  }
  const teamName = (id: string) =>
    s.teams.find((t) => t.id === id)?.name || "Unassigned";
  const heads: Record<Kind, string[]> = {
    agents: ["Agent", "Team", "Sales today / approved", "Rewards"],
    teams: ["Team", "Leader", "Active agents", "Approved / rank"],
    competitions: ["Competition", "Format", "Opens", "Closes"],
    prizes: ["Prize", "Type", "Weight", "Limit"],
    rules: ["Rule", "Sales / spin", "Max spins", "Competition"],
    users: ["Operator", "Role", "Assigned team"],
  };
  function cells(r: Values) {
    switch (kind) {
      case "agents":
        return [
          <span className="op-agent">
            {r.avatar ? (
              <img src={r.avatar} alt="" />
            ) : (
              <em>
                {r.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </em>
            )}
            {r.name}
            <sub>#{r.id}</sub>
          </span>,
          teamName(r.team),
          todaySales(s).filter((x) => String(x.agent) === r.id).length +
            " / " +
            ranked.find((a) => String(a.id) === r.id)?.sales,
          s.spins.filter((x) => String(x.agent) === r.id && !x.voided).length,
        ];
      case "teams":
        return [
          r.name,
          agents.find((a) => a[0] === r.leader)?.[1] || "—",
          s.agents.filter((a) => a.active && a.team === r.id).length,
          ts.find((t) => t.id === r.id)?.score +
            " / #" +
            (ts.findIndex((t) => t.id === r.id) + 1),
        ];
      case "competitions":
        return [r.name, r.type, format(r.start), format(r.end)];
      case "prizes":
        return [r.name, r.type, r.weight, Number(r.limit) || "Unlimited"];
      case "rules":
        return [
          r.name,
          r.threshold,
          Number(r.max) || "Unlimited",
          s.competitions.find((c) => c.id === r.competition)?.name || "All",
        ];
      case "users":
        return [r.name, r.role, teamName(r.team)];
    }
  }
  return (
    <Panel
      title={
        kind === "prizes"
          ? "Prize inventory"
          : kind === "rules"
            ? "Eligibility rules"
            : kind === "users"
              ? "Operator directory"
              : kind[0].toUpperCase() + kind.slice(1)
      }
      action={
        <button className="primary" onClick={() => open()}>
          + Add {singular}
        </button>
      }
    >
      {kind === "competitions" && (
        <CompetitionCalendar items={s.competitions} inspect={show} />
      )}{" "}
      {kind === "rules" && (
        <div className="rule-chain">
          <span>Eligible approval</span>→<span>Threshold &amp; scope</span>→
          <span>Assigned spin</span>
        </div>
      )}
      <input
        aria-label={"Search " + kind}
        placeholder={"Search " + kind}
        value={q}
        onChange={(e) => search(e.target.value)}
      />
      <Table
        heads={[...heads[kind], "Status", "Actions"]}
        rows={list
          .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
          .map((r) => [
            ...cells(r),
            <Badge
              value={r.status || (r.active === "true" ? "Active" : "Inactive")}
            />,
            <div className="op-actions">
              <button onClick={() => show(r.id)}>Details</button>
              <button onClick={() => open(r)}>Edit</button>
            </div>,
          ])}
      />
      {editing && (
        <Modal
          title={(editing.id ? "Edit " : "Add ") + singular}
          close={() => edit(null)}
        >
          <Form fields={fields[kind]} initial={editing} save={save} />
        </Modal>
      )}
      {target && (
        <Modal title={target.name} close={() => show("")}>
          <div className="op-details">
            {fields[kind]
              .filter((f) => f.key !== "avatar")
              .map((f) => (
                <p key={f.key}>
                  <span>{f.label}</span>
                  <b>
                    {f.options
                      ? f.options
                          .filter((o) =>
                            (target[f.key] || "").split(",").includes(o[0]),
                          )
                          .map((o) => o[1])
                          .join(", ") || "—"
                      : target[f.key] || "—"}
                  </b>
                </p>
              ))}
          </div>
          {kind === "agents" && (
            <>
              <Kpis
                items={[
                  [
                    "Daily rank",
                    "#" +
                      (ranked.findIndex((a) => String(a.id) === detail) + 1),
                  ],
                  [
                    "Milestones",
                    [1, 5, 10, 20]
                      .filter(
                        (n) =>
                          n <=
                          (ranked.find((a) => String(a.id) === detail)?.sales ||
                            0),
                      )
                      .join(" · "),
                  ],
                ]}
              />
              <Table
                heads={["Recent sale", "Status"]}
                rows={s.sales
                  .filter((x) => String(x.agent) === detail)
                  .sort((a, b) => b.submitted.localeCompare(a.submitted))
                  .slice(0, 8)
                  .map((x) => [x.id, x.status])}
              />
              <p>Reward history</p>
              {s.spins
                .filter((x) => String(x.agent) === detail)
                .map((x) => (
                  <p key={x.id}>
                    {x.prize} · {format(x.created)}
                  </p>
                ))}
            </>
          )}
          {kind === "teams" && (
            <>
              <Kpis
                items={[
                  [
                    "Total submissions",
                    s.sales.filter((x) => x.team === detail).length,
                  ],
                  [
                    "Approved",
                    s.sales.filter(
                      (x) => x.team === detail && x.status === "Approved",
                    ).length,
                  ],
                ]}
              />
              <Table
                heads={["Member", "Approved today", "Milestones"]}
                rows={ranked
                  .filter((a) => a.team === detail)
                  .map((a) => [
                    a.name,
                    a.sales,
                    [1, 5, 10, 20].filter((n) => n <= a.sales).join(" / ") ||
                      "—",
                  ])}
              />
            </>
          )}
          {kind === "competitions" && (
            <Table
              heads={["Standing", "Approved sales", "Score"]}
              rows={standings(
                s,
                s.competitions.find((c) => c.id === detail),
              ).map((a) => [
                a.name,
                a.sales,
                a.sales * Number(target.pointsPerSale || 1),
              ])}
            />
          )}
        </Modal>
      )}
    </Panel>
  );
}
export function Rewards({
  s,
  u,
  historyOnly = false,
}: {
  s: Data;
  u: AdminUser;
  historyOnly?: boolean;
}) {
  const linkedAwards = new Map(
    s.targets.entitlements
      .filter((e) => e.spin)
      .map((e) => [
        e.spin,
        {
          entitlement: e,
          award: s.targets.awards.find((a) => a.id === e.award),
        },
      ]),
  );
  const available = s.prizes.filter(
    (p) =>
      p.active &&
      (!p.limit ||
        s.spins.filter((x) => x.prizeId === p.id && !x.voided).length <
          p.limit),
  );
  return (
    <>
      <Kpis
        items={[
          ["Awarded", s.spins.filter((x) => !x.voided).length],
          [
            "Pending spins",
            s.spins.filter((x) => !x.completed && !x.voided).length,
          ],
          ["Completed", s.spins.filter((x) => x.completed && !x.voided).length],
          ["Active rules", s.rules.filter((x) => x.active).length],
        ]}
      />
      {!historyOnly && (
        <>
          <div className="op-columns">
            <Catalog s={s} u={u} kind="prizes" />
            <Panel title="Wheel configuration">
              <div className="op-wheel">
                {available.length ? (
                  <PrizeWheel index={0} segments={available} />
                ) : (
                  "No eligible prizes"
                )}
              </div>
            </Panel>
          </div>
          <Catalog s={s} u={u} kind="rules" />
        </>
      )}
      <div id="spin-history"></div>
      <Panel title="Reward history">
        <Table
          heads={[
            "Spin / source",
            "Agent",
            "Rule",
            "Prize",
            "Status",
            "Created",
            "Completed",
            "Fulfillment",
          ]}
          rows={s.spins.map((x) => [
            x.id.slice(0, 10) + " / " + x.sale,
            s.agents.find((a) => a.id === x.agent)?.name,
            linkedAwards.get(x.id)?.award?.rule.name ??
              s.rules.find((r) => r.id === x.rule)?.name,
            x.prize,
            linkedAwards.get(x.id)?.entitlement.state === "Correction review"
              ? "Completed · correction review"
              : x.voided
                ? "Reversed"
                : x.completed
                  ? "Completed"
                  : "Pending",
            format(x.created),
            format(x.completed),
            x.fulfilled ? (
              "Fulfilled"
            ) : (
              <button
                disabled={
                  x.voided ||
                  !x.completed ||
                  linkedAwards.get(x.id)?.entitlement.state ===
                    "Correction review"
                }
                onClick={() =>
                  void command("rewards", "reward.fulfilled", x.id, (d) => {
                    const sp = d.spins.find((a) => a.id === x.id)!;
                    if (
                      sp.fulfilled ||
                      sp.voided ||
                      !sp.completed ||
                      d.targets.entitlements.some(
                        (e) =>
                          e.spin === sp.id && e.state === "Correction review",
                      )
                    )
                      return false;
                    sp.fulfilled = true;
                    return sp.prize;
                  }).catch(reportServiceError)
                }
              >
                Fulfill
              </button>
            ),
          ])}
        />
      </Panel>
    </>
  );
}
