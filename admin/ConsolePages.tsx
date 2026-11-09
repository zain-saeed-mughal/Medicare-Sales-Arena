import { ThemeSettings } from "../theme/ThemeSettings";
import { reportServiceError } from "./service";
import { TVDisplaySettings } from "../broadcast/TVDisplaySettings";
import { useState } from "react";
import type { Data, AdminUser, ArenaEvent, ArenaPeriod } from "./model";
import { day, todaySales } from "./model";
import { command, allowed, preview, signOut } from "./service";
import { useDisplayPresence } from "./presence";
import { Form, Panel, Table } from "./ui";
import { Monitor } from "../broadcast/Monitor";
import { broadcastModes } from "../broadcast/config";
import { Presentation } from "../broadcast/Pages";
import { SoundControls } from "../championship/Controls";
import { RuleStudio } from "../targets/Rules";
import { Rewards, Catalog } from "./Catalog";
import { Sales } from "./Sales";
import { recognition } from "../championship/data";
import { quick } from "../broadcast/commands";
export function ConsoleStatus({ s }: { s: Data }) {
  const online = useDisplayPresence();
  return (
    <div className="console-status">
      <span className={online ? "is-online" : ""}>
        <i />
        {online ? "Local Arena tab detected" : "No local Arena heartbeat"}
      </span>
      <small>LOCAL SYNC · DEVELOPMENT</small>
      <small>{s.settings.mode}</small>
    </div>
  );
}
function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="bc-facts">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
export function OverviewPulse({ s }: { s: Data }) {
  const d = recognition(s, "Daily Arena");
  return (
    <div className="console-metrics">
      {[
        [
          "Approved today",
          todaySales(s).filter((x) => x.status === "Approved").length,
        ],
        ["Leading team", d.teams[0]?.name || "Awaiting sales"],
        ["Sound", s.settings.sound ? "Enabled · activate on TV" : "Muted"],
        [
          "Auto rotation",
          !s.broadcast.rotation
            ? "Manual"
            : s.broadcast.rotationPaused
              ? "Paused"
              : "Scheduled",
        ],
      ].map(([k, v]) => (
        <div key={k}>
          <small>{k}</small>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  );
}
export function RotationAction() {
  const [msg, set] = useState("");
  return (
    <>
      <button
        onClick={() =>
          void quick("Rotation pause")
            .then(() => set("Rotation pause toggled."))
            .catch((e) => set(e.message))
        }
      >
        Pause / resume rotation
      </button>
      <span role="status">{msg}</span>
    </>
  );
}
function Integration({ s }: { s: Data }) {
  const [mode, setMode] = useState(s.settings.mode),
    [event, setEvent] = useState<ArenaEvent>(),
    [custom, setCustom] = useState(7),
    [error, setError] = useState("");
  const draft = {
    ...s,
    settings: { ...s.settings, mode },
    broadcast: { ...s.broadcast, rotation: false },
  };
  return (
    <>
      <div className="console-notice">
        <b>ISOLATED REHEARSAL</b>
        <span>
          Changes on this page affect this monitor only. No sales, awards,
          inventory or broadcast settings are written.
        </span>
      </div>
      <div className="console-preview-grid">
        <Panel title="Preview monitor">
          <Monitor draft={draft} event={event} />
          <p>Actual 1920 × 1080 Arena renderer · read-only accounting</p>
        </Panel>
        <Panel title="Scene selection">
          <label>
            Preview mode
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setEvent(undefined);
              }}
            >
              {broadcastModes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Custom milestone threshold
            <input
              type="number"
              min={1}
              max={999}
              value={custom}
              onChange={(e) =>
                setCustom(
                  Math.max(1, Math.min(999, Number(e.target.value) || 1)),
                )
              }
            />
          </label>
          <div className="console-preview-actions">
            {[
              "Approved Sale",
              "2-sale bonus",
              "5-sale bonus",
              "10-sale bonus",
              "Target Milestone Preview",
              "Bonus Popup Preview",
              "Reward Spin Unlocked",
              "Reward Wheel Result",
              "New Champion",
              "Team Lead Change",
            ].map((kind) => (
              <button
                key={kind}
                onClick={() => {
                  try {
                    const clone = structuredClone(s);
                    if (
                      kind === "Target Milestone Preview" &&
                      clone.targets.rules[0]
                    ) {
                      clone.targets.rules[0] = {
                        ...clone.targets.rules[0],
                        threshold: custom,
                      };
                    }
                    preview(
                      clone,
                      kind,
                      kind === "Target Milestone Preview"
                        ? clone.targets.rules[0]?.id
                        : undefined,
                    );
                    const e = clone.queue.at(-1);
                    if (e)
                      setEvent({
                        ...e,
                        demo: true,
                        spin: "",
                        sale: "",
                        sequence: Date.now(),
                      });
                    setError("");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                {kind} <span>↗</span>
              </button>
            ))}
          </div>
          <button onClick={() => setEvent(undefined)}>Clear rehearsal</button>
          <p role="status">{error}</p>
        </Panel>
      </div>
      <SoundControls s={s} previewOnly />
    </>
  );
}
function Health({ s }: { s: Data }) {
  const online = useDisplayPresence();
  const bytes = new Blob([localStorage.getItem("medicare-arena.dev.v3") || ""])
    .size;
  const navigation = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  return (
    <>
      <div className="console-notice">
        <b>RUNTIME OBSERVATIONS</b>
        <span>
          Measurements describe this browser and origin. Display presence
          requires a real Arena heartbeat.
        </span>
      </div>
      <div className="console-two">
        <Panel title="Broadcast runtime">
          <Facts
            items={[
              [
                "Display heartbeat",
                online ? "Connected" : "No recent heartbeat",
              ],
              ["Local sync", "Storage events · same browser/origin"],
              ["Current tab", "Admin operator · not a playout driver"],
              ["Preview role", "Isolated / read-only"],
              [
                "Audio API",
                typeof AudioContext !== "undefined"
                  ? "Available · gesture required"
                  : "Unavailable",
              ],
              [
                "Rotation",
                !s.broadcast.rotation
                  ? "Manual"
                  : s.broadcast.rotationPaused
                    ? "Paused"
                    : s.queue.length
                      ? "Deferred during queue"
                      : "Scheduled",
              ],
              [
                "Mode source",
                s.broadcast.manualUntil > Date.now()
                  ? "Manual override"
                  : s.broadcast.rotation
                    ? "Scheduled"
                    : "Manual",
              ],
              ["Last recorded activity", s.audit[0]?.time || "No activity"],
            ]}
          />
        </Panel>
        <Panel title="Queue & storage">
          <Facts
            items={[
              ["Pending celebrations", s.queue.length],
              ["Queue capacity", "96 presentations"],
              [
                "Skipped presentations (retained audit)",
                s.audit.filter(
                  (a) => a.action === "presentation.capacity_skipped",
                ).length,
              ],
              ["Current item", s.queue[0]?.name || "Queue clear"],
              ["Ledger size", (bytes / 1024).toFixed(1) + " KiB"],
              [
                "Document load",
                navigation?.loadEventEnd
                  ? Math.round(navigation.loadEventEnd) + " ms"
                  : "Measuring",
              ],
              ["Foreground visibility", document.visibilityState],
              ["Animations", s.settings.intensity],
            ]}
          />
          <a href="/admin/activity">Inspect audit trail →</a>
        </Panel>
      </div>
    </>
  );
}
function Appearance({ s }: { s: Data }) {
  const [tab, set] = useState("Visual identity");
  return (
    <>
      <div
        className="console-tabs"
        role="tablist"
        aria-label="Customization section"
      >
        {["Visual identity", "Branding", "Sound", "TV Display Settings"].map(
          (t) => (
            <button
              role="tab"
              aria-selected={tab === t}
              key={t}
              onClick={() => set(t)}
            >
              {t}
            </button>
          ),
        )}
      </div>
      {tab === "TV Display Settings" ? (
        <TVDisplaySettings s={s} />
      ) : tab === "Sound" ? (
        <>
          <Panel title="Master sound">
            <p>
              On the actual TV, select ENABLE ARENA AUDIO to resume the audio
              context and hear a test chime. Enable master sound here and keep
              volume above zero for live events. Admin sound previews activate
              only this browser tab. Hidden tabs mute automatically. Higher
              priority recognition preempts lower priority sounds.
            </p>
            <MasterSound s={s} />
          </Panel>
          <SoundControls s={s} />
        </>
      ) : (
        <>
          {" "}
          {tab === "Visual identity" && <ThemeSettings s={s} />}
          <Presentation
            key={tab}
            s={s}
            kind={tab === "Branding" ? "branding" : "appearance"}
          />
        </>
      )}
    </>
  );
}
function MasterSound({ s }: { s: Data }) {
  return (
    <Form
      key={String(s.settings.sound) + s.broadcast.effects.volume}
      initial={{
        sound: String(s.settings.sound),
        volume: String(s.broadcast.effects.volume),
      }}
      fields={[
        {
          key: "sound",
          label: "Master broadcast sound",
          options: [
            ["true", "Enabled"],
            ["false", "Muted"],
          ],
        },
        {
          key: "volume",
          label: "Master volume (%)",
          type: "number",
          min: 0,
          max: 100,
          required: true,
        },
      ]}
      save={async (v) => {
        await command("effects", "audio.master_saved", "Arena 01", (d) => {
          const n = Number(v.volume);
          if (!Number.isFinite(n) || n < 0 || n > 100)
            throw Error("Volume must be 0–100");
          d.settings.sound = v.sound === "true";
          d.broadcast.effects.volume = n;
          return "Master audio saved";
        });
      }}
    />
  );
}
function Performance({ s, u }: { s: Data; u: AdminUser }) {
  const [period, set] = useState<ArenaPeriod>("Daily Arena");
  const scoped =
    u.role === "Sales Manager"
      ? { ...s, agents: s.agents.filter((a) => a.team === u.team) }
      : s;
  const r = recognition(scoped, period);
  return (
    <>
      <div className="console-tabs">
        {(
          ["Daily Arena", "Weekly Arena", "Monthly Arena"] as ArenaPeriod[]
        ).map((p) => (
          <button key={p} aria-pressed={period === p} onClick={() => set(p)}>
            {p.replace(" Arena", "")}
          </button>
        ))}
      </div>
      <Panel title={period.replace("Arena", "performance")}>
        <Table
          heads={["Rank", "Performer", "Team", "Approved", "Next target"]}
          rows={r.players.map((p, i) => [
            i + 1,
            p.name,
            p.teamLabel,
            p.sales,
            p.target
              ? `${p.target.count} / ${p.target.rule.threshold}`
              : "No assigned target",
          ])}
        />
      </Panel>
      <Sales s={s} u={u} />
    </>
  );
}
export function ConsoleSection({
  s,
  u,
  path,
}: {
  s: Data;
  u: AdminUser;
  path: string;
}) {
  if (path === "health") return <Health s={s} />;
  if (path === "integration") return <Integration s={s} />;
  if (path === "appearance") return <Appearance s={s} />;
  if (path === "performance") return <Performance s={s} u={u} />;
  if (path === "programs")
    return (
      <>
        <div className="console-notice">
          <b>RULE-DRIVEN REWARD PROGRAMS</b>
          <span>
            Existing target rules define scope, audience, bonus, spins,
            effective dates and limits. Prize selection uses the shared
            inventory-safe wheel.
          </span>
        </div>
        <div className="console-programs">
          {s.targets.rules
            .filter((r) => r.active)
            .map((r) => (
              <article key={r.id}>
                <small>
                  {r.scope.toUpperCase()} / {r.recipient.toUpperCase()}
                </small>
                <h3>{r.name}</h3>
                <strong>
                  {r.threshold} <span>approved sales</span>
                </strong>
                <p>
                  {r.audience} · {r.spins} spins ·{" "}
                  {r.minor > 0 ? "Bonus included" : "Recognition reward"}
                </p>
                <a href="#program-editor">Edit rule below →</a>
              </article>
            ))}
        </div>
        <div id="program-editor">
          <RuleStudio s={s} />
        </div>
        <Panel title="Special events & presentation">
          <div className="op-actions">
            <a href="/admin/competitions">
              Competition schedules & eligibility →
            </a>
            <a href="/admin/spin-wheel">Shared wheel & prize inventory →</a>
            <a href="/admin/effects">Global celebration style →</a>
            <a href="/admin/targets/agents">Agent assignments →</a>
            <a href="/admin/targets/teams">Team assignments →</a>
          </div>
          <p>
            Presentation style is shared across programs. Completed awards
            retain their original rule snapshot.
          </p>
        </Panel>
      </>
    );
  if (path === "reward-operations")
    return (
      <>
        <div className="console-metrics">
          {[
            [
              "Pending",
              s.spins.filter((x) => !x.completed && !x.voided).length,
            ],
            [
              "Completed",
              s.spins.filter((x) => x.completed && !x.voided).length,
            ],
            ["Available prizes", s.prizes.filter((p) => p.active).length],
            ["Manual releases", s.broadcast.wheel.released.length],
          ].map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <Rewards s={s} u={u} />
      </>
    );
  if (path === "security")
    return (
      <>
        <div className="console-notice">
          <b>LOCAL DEVELOPMENT BOUNDARY</b>
          <span>
            No IP allowlist or network firewall is enforced by this application.
          </span>
        </div>
        <div className="console-two">
          <Panel title="Active safeguards">
            <Facts
              items={[
                ["Environment", "Development · browser-local"],
                ["Session", "Operator profile · one-hour expiry"],
                ["Production Admin", "Disabled without server identity/API"],
                [
                  "Mutation checks",
                  "Role and team scope checked by local command service",
                ],
                ["Rehearsals", "Isolated monitor · no reward issuance"],
                ["Network perimeter", "Not implemented"],
              ]}
            />
          </Panel>
          <Panel title="Server enforcement roadmap">
            <p>
              Trusted IP ranges, server sessions, PostgreSQL authorization and
              cross-device sync require a server-backed deployment. No settings
              here claim to enforce those capabilities.
            </p>
            <p>
              Use this workspace only with development data. Anyone with browser
              storage access can inspect or modify local records.
            </p>
            <a href="/admin/activity">Security and operator audit →</a>
          </Panel>
        </div>
      </>
    );
  return (
    <>
      <div className="console-two">
        <Panel title="Operator identity">
          <Facts
            items={[
              ["Name", u.name],
              ["Role", u.role],
              ["Team scope", u.team || "Workspace"],
              ["Session", "Browser tab · expires after one hour"],
              ["Environment", "Development profile"],
            ]}
          />
          <button onClick={() => void signOut().catch(reportServiceError)}>
            End development session
          </button>
        </Panel>
        <Panel title="Permissions & preferences">
          <Facts
            items={[
              "arena-control",
              "sales",
              "rewards",
              "targets",
              "users",
              "settings",
            ].map((p) => [p, allowed(u, p) ? "Allowed" : "Restricted"])}
          />
          <p>
            Sidebar width is saved on this browser. TV sound activation is
            separate from Admin sound previews.
          </p>
          <div className="op-actions">
            <a href="/admin/activity">Activity logs →</a>
            {allowed(u, "settings") && (
              <a href="/admin/settings">Workspace preferences →</a>
            )}
            {allowed(u, "users") && (
              <a href="/admin/access">Operator access →</a>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

export function RecognitionEngine({ s }: { s: Data }) {
  const choices: [string, string, string][] = [
    ["approved", "Sale approved", "Approved Sale"],
    ["milestone", "Target achieved", "Target Milestone Preview"],
    ["bonus", "Bonus earned / pending", "Bonus Popup Preview"],
    ["unlock", "Spin unlocked", "Reward Spin Unlocked"],
    ["chamber", "Reward chamber", "Reward Wheel Result"],
    ["wheel", "Wheel spin", "Reward Wheel Result"],
    ["result", "Prize won", "Reward Wheel Result"],
    ["champion", "New champion", "New Champion"],
    ["team", "Team lead change", "Team Lead Change"],
    ["hall", "Hall of Fame", "Hall of Fame"],
  ];
  const [selected, select] = useState("approved"),
    [event, setEvent] = useState<ArenaEvent>(),
    [notice, setNotice] = useState("");
  const current = choices.find((c) => c[0] === selected)!;
  const fallback: Record<string, number> = {
    approved: 4.2,
    wheel: s.broadcast.wheel.duration,
    milestone: 5,
    bonus: 2.4,
    unlock: 2,
    chamber: 1.8,
    result: s.broadcast.wheel.reveal,
    champion: 4,
    team: 4,
  };
  return (
    <>
      <div className="console-tabs" aria-label="Recognition event">
        {choices.map(([id, label]) => (
          <button
            key={id}
            aria-pressed={id === selected}
            onClick={() => {
              select(id);
              setEvent(undefined);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="console-composer">
        <Panel title={current[1]}>
          {selected === "hall" ? (
            <p>
              Hall of Fame uses saved completed competition results. Its
              visibility is controlled in Appearance and its dwell time in the
              broadcast schedule.
            </p>
          ) : (
            <Form
              key={selected}
              initial={{
                enabled: String(
                  s.broadcast.eventOverrides?.[selected]?.enabled !== false,
                ),
                seconds: String(
                  ["wheel", "result"].includes(selected)
                    ? fallback[selected]
                    : s.broadcast.eventOverrides?.[selected]?.seconds ||
                        fallback[selected],
                ),
              }}
              fields={[
                {
                  key: "enabled",
                  label: "Include event phase",
                  options: [
                    ["true", "Enabled"],
                    ["false", "Disabled"],
                  ],
                },
                {
                  key: "seconds",
                  label:
                    "Base duration (seconds; global multiplier applies except prize reveal)",
                  type: "number",
                  min: 1,
                  max: 30,
                  required: true,
                },
              ]}
              save={async (v) => {
                await command(
                  "effects",
                  "recognition.phase_saved",
                  selected,
                  (d) => {
                    const seconds = Number(v.seconds);
                    if (
                      !Number.isFinite(seconds) ||
                      seconds < 1 ||
                      seconds > 30
                    )
                      throw Error("Choose 1–30 seconds");
                    d.broadcast.eventOverrides = {
                      ...d.broadcast.eventOverrides,
                      [selected]: { enabled: v.enabled === "true", seconds },
                    };
                    if (selected === "wheel")
                      d.broadcast.wheel.duration = seconds;
                    if (selected === "result")
                      d.broadcast.wheel.reveal = seconds;
                    return "Recognition phase saved";
                  },
                );
                setNotice("Saved recognition phase.");
              }}
            />
          )}
          <p>
            Global switches below remain master gates. Queue order remains FIFO
            to preserve reward presentation integrity.
          </p>
          <button
            onClick={() => {
              try {
                const clone = structuredClone(s);
                preview(clone, current[2]);
                const e = clone.queue.at(-1);
                setEvent(
                  e
                    ? {
                        ...e,
                        demo: true,
                        spin: "",
                        sale: "",
                        sequence: Date.now(),
                        previewPhase: selected,
                      }
                    : undefined,
                );
              } catch (e) {
                setNotice((e as Error).message);
              }
            }}
          >
            Preview selected event
          </button>
          <p role="status">{notice}</p>
        </Panel>
        <Panel title="Isolated recognition preview">
          <Monitor
            draft={
              selected === "hall"
                ? { ...s, settings: { ...s.settings, mode: "Hall of Fame" } }
                : s
            }
            event={event}
          />
          <p>No award is issued by rehearsal playback.</p>
        </Panel>
      </div>
      <details className="simple-advanced">
        <summary>Advanced celebration behavior & display fields</summary>
        <Presentation s={s} kind="effects" />
      </details>
    </>
  );
}
