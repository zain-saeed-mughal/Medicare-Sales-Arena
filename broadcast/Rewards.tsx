import { rewardSegment } from "../admin/rewardLabel";
import { PlayerCard } from "../velocity/Stage";
import { recognition } from "../championship/data";
import { Wheel as DimensionalWheel } from "../championship/Wheel";
import { RecognitionControls } from "../championship/Controls";
import { useState, useEffect, useRef } from "react";
import type { Data, AdminUser } from "../admin/model";
import { command, checkTeam } from "../admin/service";
import {
  Panel,
  Table,
  Modal,
  Form,
  values,
  opts,
  type Values,
} from "../admin/ui";
import { Catalog, Rewards } from "../admin/Catalog";
import { PrizeWheel } from "../Celebration";
import { profile, defaults } from "./config";
import { Monitor } from "./Monitor";
import { useAction, toggle, number, select } from "./Pages";
import { saveSection } from "./commands";
export function Participants({ s, u }: { s: Data; u: AdminUser }) {
  const [kind, setKind] = useState<"agent" | "team">(
      location.pathname.endsWith("/teams") ? "team" : "agent",
    ),
    [editing, setEditing] = useState<Values | null>(null),
    [search, setSearch] = useState(""),
    [teamFilter, setTeamFilter] = useState("");
  const original = useRef("");
  const signature = (d: Data, id: string) =>
    JSON.stringify({
      entity: (kind === "agent" ? d.agents : d.teams).find(
        (x) => String(x.id) === id,
      ),
      profile: d.broadcast.profiles[kind + ":" + id],
    });
  function edit(v: Values | null) {
    original.current = v?.id ? signature(s, v.id) : "";
    setEditing(v);
  }
  const ranks = recognition(s, "Daily Arena").players;
  const members = (kind === "agent" ? s.agents : s.teams).filter(
    (m) =>
      u.role !== "Sales Manager" ||
      (kind === "agent"
        ? (m as Data["agents"][number]).team === u.team
        : m.id === u.team),
  );
  const displayed = members.filter(
    (m) =>
      (profile(s, kind, m.id).label || m.name)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!teamFilter ||
        (kind === "agent"
          ? (m as Data["agents"][number]).team === teamFilter
          : m.id === teamFilter)),
  );
  return (
    <>
      <div className="op-filters">
        <label>
          Find participant
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or public label"
          />
        </label>
        <label>
          Team
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="">All permitted teams</option>
            {s.teams
              .filter((t) => u.role !== "Sales Manager" || t.id === u.team)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>
        <a href="/admin/targets/agents">Target assignments & eligibility →</a>
      </div>
      <div className="op-actions">
        <button onClick={() => setKind("agent")}>Agents</button>
        <button onClick={() => setKind("team")}>Teams</button>
      </div>
      <Panel
        title="TV display profiles"
        action={
          <button
            className="primary"
            onClick={() =>
              edit({
                id: "",
                name: "",
                label: "",
                visible: "true",
                color: "#e51e51",
                badge: "",
                avatar: "",
                team: u.team || s.teams[0]?.id || "",
              })
            }
          >
            + Add display profile
          </button>
        }
      >
        <p>
          Public labels are separate from internal IDs. Hiding a profile leaves
          sales, rewards and operational eligibility intact.
        </p>
        <Table
          heads={[
            "Display name",
            "Team / rank",
            "Approved",
            "TV visibility",
            "Badge",
            "Actions",
          ]}
          rows={displayed.map((m) => {
            const p = profile(s, kind, m.id);
            return [
              p.label || m.name,
              kind === "agent"
                ? (s.teams.find(
                    (t) => t.id === (m as Data["agents"][number]).team,
                  )?.name || "Independent") +
                  " / #" +
                  (ranks.findIndex((a) => a.id === m.id) + 1)
                : "Team",
              kind === "agent"
                ? ranks.find((a) => a.id === m.id)?.sales || 0
                : "—",
              p.visible ? "Visible" : "Hidden",
              p.badge || "—",
              <button onClick={() => edit({ ...values(m), ...values(p) })}>
                Edit & preview
              </button>,
            ];
          })}
        />
      </Panel>
      {editing && (
        <Modal
          title={(editing.id ? "Edit" : "Add") + " " + kind + " display"}
          close={() => edit(null)}
        >
          <Form
            fields={[
              { key: "name", label: "Display profile name", required: true },
              { key: "label", label: "Custom TV label" },
              ...(kind === "agent"
                ? [
                    { key: "avatar", label: "Avatar", type: "avatar" },
                    {
                      key: "team",
                      label: "Team",
                      options: s.teams
                        .filter(
                          (t) => u.role !== "Sales Manager" || t.id === u.team,
                        )
                        .map((t) => [t.id, t.name] as [string, string]),
                    },
                  ]
                : []),
              toggle("visible", "TV visibility"),
              { key: "color", label: "Badge / team color", type: "color" },
              { key: "badge", label: "Short badge label" },
            ]}
            initial={editing}
            preview={(v) => (
              <div className="console-player-preview">
                <PlayerCard
                  rank={1}
                  s={{
                    ...s,
                    broadcast: {
                      ...s.broadcast,
                      profiles: {
                        ...s.broadcast.profiles,
                        ["agent:" + (Number(v.id) || 0)]: {
                          visible: true,
                          label: v.label,
                          badge: v.badge,
                          color: v.color,
                        },
                      },
                    },
                  }}
                  p={{
                    id: Number(v.id) || 0,
                    name: v.label || v.name || "Player identity",
                    team: v.team || "",
                    avatar: v.avatar || "",
                    active: true,
                    sales: ranks.find((a) => String(a.id) === v.id)?.sales || 0,
                    approved: ranks.find((a) => String(a.id) === v.id)?.sales || 0,
                    submitted: ranks.find((a) => String(a.id) === v.id)?.sales || 0,
                    teamLabel:
                      s.teams.find((t) => t.id === v.team)?.name ||
                      "Independent",
                    badges: v.badge ? [v.badge] : [],
                    change: 0,
                  }}
                />
                <p>Active performer card · preview only</p>
              </div>
            )}
            save={async (v) => {
              await command(
                kind === "agent" ? "agents" : "teams",
                "display.profile_saved",
                editing.id || v.name,
                (d, user) => {
                  if (!v.name.trim()) throw Error("Enter a profile name.");
                  let id = editing.id;
                  if (id && signature(d, id) !== original.current)
                    throw Error(
                      "Profile changed in another tab. Reopen the editor before saving.",
                    );
                  if (kind === "agent") {
                    const a = d.agents.find((a) => String(a.id) === id);
                    if (a) checkTeam(user, a.team);
                    checkTeam(user, v.team);
                    if (!d.teams.some((t) => t.id === v.team))
                      throw Error("Choose an existing team.");
                    if (a) {
                      Object.assign(a, {
                        name: v.name,
                        team: v.team,
                        avatar: v.avatar || "",
                      });
                      d.teams.forEach((t) => {
                        if (t.leader === id && t.id !== v.team) t.leader = "";
                      });
                    } else {
                      const n = Math.max(-1, ...d.agents.map((a) => a.id)) + 1;
                      id = String(n);
                      d.agents.push({
                        id: n,
                        name: v.name,
                        team: v.team,
                        avatar: v.avatar || "",
                        active: true,
                      });
                    }
                  } else {
                    if (user.role === "Sales Manager" && id !== user.team)
                      throw Error("Assigned team only.");
                    const t = d.teams.find((t) => t.id === id);
                    if (t) t.name = v.name;
                    else {
                      id = crypto.randomUUID();
                      d.teams.push({
                        id,
                        name: v.name,
                        active: true,
                        leader: "",
                      });
                    }
                  }
                  d.broadcast.profiles[kind + ":" + id] = {
                    visible: v.visible === "true",
                    label: v.label.slice(0, 40),
                    color: v.color,
                    badge: v.badge.slice(0, 16),
                  };
                  return "TV visibility and public identity updated";
                },
              );
              edit(null);
            }}
          />
        </Modal>
      )}
    </>
  );
}
export function Wheel({
  s,
  u,
  section = "preview",
}: {
  s: Data;
  u: AdminUser;
  section?: "prizes" | "preview" | "settings" | "rules";
}) {
  const { message, run } = useAction();
  const [spin, setSpin] = useState(false),
    [flat, setFlat] = useState(false),
    [index, setIndex] = useState(0),
    [revision, revise] = useState(0);
  useEffect(() => {
    if (!spin) return;
    const timer = setTimeout(
      () => setSpin(false),
      s.broadcast.wheel.duration * 1000,
    );
    return () => clearTimeout(timer);
  }, [spin, revision, s.broadcast.wheel.duration]);
  const pool = s.prizes.filter((p) => p.active);
  return (
    <>
      <div className="simple-wheel-studio">
        {section === "prizes" && <Catalog kind="prizes" s={s} u={u} />}
        {section === "preview" && (
          <Panel title="Wheel preview">
            <div className="op-wheel">
              {pool.length ? (
                <DimensionalWheel
                  key={revision}
                  index={Math.min(index, pool.length - 1)}
                  segments={pool.map(rewardSegment)}
                  state={spin ? "spin" : "landed"}
                  duration={s.broadcast.wheel.duration}
                  flat={flat}
                  palette={s.broadcast.wheel.palette}
                />
              ) : (
                <p>No active prizes. Add or activate a segment.</p>
              )}
            </div>
            <p>
              Segments represent active prizes. The development reward service
              assigns each result with inventory and weight checks before TV
              playback.
            </p>
            <div className="op-actions">
              <button
                onClick={() => {
                  revise(revision + 1);
                  setSpin(true);
                }}
              >
                Rotate preview
              </button>
              <button onClick={() => setFlat(!flat)}>
                {flat ? "Show 3D" : "Flat preview"}
              </button>
              <button
                onClick={() => {
                  setSpin(false);
                  setIndex(0);
                  revise(revision + 1);
                }}
              >
                Reset view
              </button>
            </div>
            <label>
              Preview assigned segment
              <select
                value={index}
                onChange={(e) => {
                  setIndex(Number(e.target.value));
                  setSpin(false);
                }}
              >
                {pool.map((p, i) => (
                  <option value={i} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <p>Local preview only · no inventory consumed</p>
            <details className="simple-advanced">
              <summary>Manage segment order & archived prizes</summary>
              <div className="bc-segments">
                {s.prizes.map((p, i) => (
                  <div key={p.id}>
                    <span style={{ background: p.color }} />
                    <b>
                      {p.icon} {p.name}
                    </b>
                    <small>{p.active ? "ACTIVE" : "ARCHIVED"}</small>
                    <button
                      onClick={() =>
                        void run(() =>
                          command("rewards", "prize.duplicated", p.id, (d) => {
                            d.prizes.push({
                              ...p,
                              id: crypto.randomUUID(),
                              name: p.name + " copy",
                              active: false,
                            });
                            return "Created inactive copy";
                          }),
                        )
                      }
                    >
                      Duplicate
                    </button>
                    <button
                      aria-label={"Move " + p.name + " up"}
                      disabled={!i}
                      onClick={() =>
                        void run(() =>
                          command(
                            "spin-wheel",
                            "wheel.reordered",
                            p.id,
                            (d) => {
                              const n = d.prizes.findIndex(
                                (x) => x.id === p.id,
                              );
                              if (n < 1) return false;
                              [d.prizes[n - 1], d.prizes[n]] = [
                                d.prizes[n],
                                d.prizes[n - 1],
                              ];
                              return "Moved segment up";
                            },
                          ),
                        )
                      }
                    >
                      ↑
                    </button>
                    <button
                      onClick={() =>
                        void run(() =>
                          command(
                            "spin-wheel",
                            p.active ? "prize.archived" : "prize.restored",
                            p.id,
                            (d) => {
                              d.prizes.find((x) => x.id === p.id)!.active =
                                !p.active;
                              return "Historical results retained";
                            },
                          ),
                        )
                      }
                    >
                      {p.active ? "Remove" : "Restore"}
                    </button>
                  </div>
                ))}
              </div>
              <p>
                Removing archives a prize. Previously assigned results keep
                their original segments and landing position.
              </p>
            </details>
          </Panel>
        )}
        {section === "settings" && (
          <Panel title="Wheel settings">
            <Form
              key={JSON.stringify(s.broadcast.wheel)}
              initial={{
                ...values(s.broadcast.wheel),
                palette: s.broadcast.wheel.palette || "Maroon & gold",
                initiation: "Authorized manual",
              }}
              defaults={values(defaults().wheel)}
              fields={[
                toggle("enabled", "Show wheel"),
                select("palette", "Segment materials", [
                  "Maroon & gold",
                  "Configured colors",
                ]),
                number("duration", "Spin duration (seconds)", 2, 15),
                number("reveal", "Prize reveal (seconds)", 1, 15),
                {
                  key: "announcement",
                  label: "Spin announcement",
                  required: true,
                },
                toggle("sound", "Wheel sound"),
                select("effect", "Reveal lighting", ["Gold", "Electric"]),
                select("initiation", "Spin initiation", ["Authorized manual"]),
              ]}
              save={async (v) => {
                await saveSection(
                  "wheel",
                  {
                    ...s.broadcast.wheel,
                    enabled: v.enabled === "true",
                    duration: Number(v.duration),
                    reveal: Number(v.reveal),
                    announcement: v.announcement,
                    sound: v.sound === "true",
                    effect: v.effect,
                    palette: v.palette,
                    initiation: v.initiation,
                  },
                  "spin-wheel",
                );
              }}
            />
            <p>
              Every assigned spin waits for SPIN THE WHEEL in the Arena or
              “Start authorized spin” in Live TV Control. It reveals the already
              assigned prize.
            </p>
          </Panel>
        )}
      </div>
      <p role="status">{message}</p>
      {section === "rules" && (
        <>
          <Panel title="Milestone spin eligibility">
            <p>
              Daily, weekly and monthly targets can award multiple spins.
              Configure count, scope and audience with the target rule.
            </p>
            <a href="/admin/targets">Configure milestone spins →</a>
          </Panel>
          <Catalog kind="rules" s={s} u={u} />
        </>
      )}
    </>
  );
}
export function RewardHistory({
  s,
  u,
  initialStatus = "All",
}: {
  s: Data;
  u: AdminUser;
  initialStatus?: string;
}) {
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState(initialStatus),
    [date, setDate] = useState(""),
    [detail, setDetail] = useState(""),
    [event, setEvent] = useState<Data["queue"][number]>();
  const filtered = s.spins
    .filter((x) => {
      const agent = s.agents.find((a) => a.id === x.agent),
        team = s.teams.find((t) => t.id === agent?.team);
      return (
        (!date || x.created.startsWith(date)) &&
        [x.id, agent?.name, team?.name, x.prize]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (status === "All" ||
          (status === "Completed"
            ? !!x.completed && !x.voided
            : status === "Reversed"
              ? x.voided
              : !x.completed && !x.voided))
      );
    })
    .sort((a, b) => b.created.localeCompare(a.created));
  const spin = s.spins.find((x) => x.id === detail),
    original =
      s.completed.find((e) => e.spin === detail) ||
      s.queue.find((e) => e.spin === detail);
  return (
    <>
      <div className="op-filters">
        <label>
          Search agent, team, prize or spin
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search results"
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {["All", "Pending", "Completed", "Reversed"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>
      <Rewards historyOnly s={{ ...s, spins: filtered }} u={u} />
      <Panel title="Original outcome inspector">
        <Table
          heads={["Spin", "Agent", "Assigned prize", "Inspect"]}
          rows={filtered.map((x) => [
            x.id,
            s.agents.find((a) => a.id === x.agent)?.name,
            x.prize,
            <button
              onClick={() => {
                setDetail(x.id);
                setEvent(undefined);
              }}
            >
              View original result
            </button>,
          ])}
        />
      </Panel>
      {spin && (
        <Modal
          title="Assigned outcome · immutable snapshot"
          close={() => setDetail("")}
        >
          <dl className="bc-facts">
            <div>
              <dt>Spin ID</dt>
              <dd>{spin.id}</dd>
            </div>
            <div>
              <dt>Prize</dt>
              <dd>{spin.prize}</dd>
            </div>
            <div>
              <dt>Source sale</dt>
              <dd>{spin.sale}</dd>
            </div>
            <div>
              <dt>Inventory effect</dt>
              <dd>
                {spin.voided ? "Reversed allocation" : "One assigned reward"}
              </dd>
            </div>
            <div>
              <dt>Fulfillment</dt>
              <dd>{spin.fulfilled ? "Fulfilled" : "Not fulfilled"}</dd>
            </div>
          </dl>
          {original && spin.completed && !spin.voided ? (
            <>
              <button
                onClick={() =>
                  setEvent({
                    ...original,
                    demo: true,
                    sale: "",
                    spin: "",
                    sequence: Date.now(),
                    previewPhase: "wheel",
                  })
                }
              >
                Replay ceremony locally
              </button>
              <Monitor event={event} />
              <p>
                Replays the retained assigned segments. No reward or inventory
                changes.
              </p>
            </>
          ) : (
            <p>
              No completed replayable presentation snapshot is retained for this
              result.
            </p>
          )}
        </Modal>
      )}
      <p>
        <a href="/admin/bonus-review">Bonus approval & corrections →</a> ·{" "}
        <a href="/admin/bonuses/history">Compensation history →</a>
      </p>
    </>
  );
}
