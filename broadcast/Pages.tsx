import { useSettingsDraft } from "../admin/ui";
import { VictoryOverview } from "../victory/AdminOverview";
import { OverviewPulse, RotationAction } from "../admin/ConsolePages";
import { SoundControls, RecognitionControls } from "../championship/Controls";
import { periodSnapshot } from "../arenaPeriods";
import { useState, useRef, type ReactNode } from "react";
import { Monitor } from "./Monitor";
import { defaults, displayData, broadcastModes, statNames } from "./config";
import { setMode, quick, saveSection } from "./commands";
import { command, preview, allowed } from "../admin/service";
import { useDisplayPresence } from "../admin/presence";
import {
  standings,
  todaySales,
  day,
  isArenaPeriod,
  type Data,
  type AdminUser,
  type ArenaEvent,
} from "../admin/model";
import {
  Panel,
  Table,
  Badge,
  Form,
  opts,
  values,
  type Field,
} from "../admin/ui";
export const toggle = (key: string, label: string): Field => ({
  key,
  label,
  options: [
    ["true", "Enabled"],
    ["false", "Disabled"],
  ],
});
export const select = (
  key: string,
  label: string,
  choices: string[],
): Field => ({ key, label, options: opts(choices) });
export const number = (
  key: string,
  label: string,
  min: number,
  max: number,
): Field => ({ key, label, type: "number", min, max, required: true });
export function useAction() {
  const [message, set] = useState(""),
    [busy, setBusy] = useState(false);
  const pending = useRef(false);
  return {
    message,
    busy,
    run: async (
      fn: () => Promise<unknown>,
      success = "Saved. Arena tabs in this browser will update.",
    ) => {
      if (pending.current) return false;
      pending.current = true;
      setBusy(true);
      try {
        await fn();
        set(success);
        return true;
      } catch (e) {
        set((e as Error).message);
        return false;
      } finally {
        pending.current = false;
        setBusy(false);
      }
    },
  };
}
function field(s: Data) {
  const d = displayData(s);
  return isArenaPeriod(s.settings.mode)
    ? periodSnapshot(
        d,
        s.settings.mode,
        day(new Date().toISOString(), s.settings.timezone),
      ).field
    : standings(
        d,
        s.competitions.find((c) => c.status === "Active"),
      );
}
function Status({ s }: { s: Data }) {
  const online = useDisplayPresence();
  return (
    <div className="control-status">
      <span>
        <i />
        {online ? "LOCAL ARENA TAB DETECTED" : "NO LOCAL ARENA HEARTBEAT"}
      </span>
      <b>{s.settings.mode}</b>
      <span>
        {s.broadcast.effects.paused ? "CELEBRATIONS PAUSED" : "PLAYOUT READY"}
      </span>
      <span>QUEUE {s.queue.length}</span>
    </div>
  );
}
export function Home({ s, u }: { s: Data; u: AdminUser }) {
  return <VictoryOverview s={s} u={u} />;
}
export function LiveControl({ s }: { s: Data }) {
  const { message, run } = useAction(),
    [event, setEvent] = useState<ArenaEvent>(),
    [rule, setRule] = useState(s.targets.rules[0]?.id || ""),
    [instructions, show] = useState(false);
  function rehearse(kind: string) {
    void run(async () => {
      const clone = structuredClone(s);
      if (kind === "Replay completed award") {
        const e = s.completed.find(
          (e) =>
            e.spin &&
            s.spins.some((x) => x.id === e.spin && x.completed && !x.voided),
        );
        if (!e) throw Error("No completed award is available.");
        setEvent({
          ...e,
          demo: true,
          sale: "",
          spin: "",
          sequence: Date.now(),
          previewPhase: "wheel",
        });
      } else {
        preview(clone, kind, rule);
        setEvent({ ...clone.queue.at(-1)!, sequence: Date.now() });
      }
    }, "Local rehearsal running. Live queue and rewards are unchanged.");
  }
  return (
    <>
      <Status s={s} />
      <div className="bc-control">
        <Panel title="Broadcast controls">
          <dl className="bc-facts">
            {[
              ["Champion", field(s)[0]?.name || "Awaiting competitors"],
              [
                "Competition",
                s.competitions.find((c) => c.status === "Active")?.name ||
                  "Open standings",
              ],
              ["Active presentation", s.queue[0]?.name || s.settings.mode],
              [
                "Animation status",
                s.broadcast.effects.paused
                  ? "Paused"
                  : s.queue.length
                    ? "Playing"
                    : "Ready",
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <label>
            Live mode
            <select
              value={s.settings.mode}
              onChange={(e) => void run(() => setMode(e.target.value))}
            >
              {broadcastModes
                .filter((m) => s.broadcast.modes[m].enabled)
                .map((m) => (
                  <option key={m}>{m}</option>
                ))}
            </select>
          </label>
          <p>
            Manual selection holds rotation for 60 seconds. Automatic changes
            wait for the queue to finish.
          </p>
        </Panel>
        <Panel
          title={event ? "Local rehearsal monitor" : "Live program monitor"}
          action={<Badge value={event ? "Local preview" : "Read-only"} />}
        >
          <Monitor event={event} />
          <p>Saved changes reach other tabs on this browser and origin.</p>
          <a href="/arena" target="_blank">
            Open broadcast display ↗
          </a>
          {event && (
            <button onClick={() => setEvent(undefined)}>
              Return monitor to live
            </button>
          )}
        </Panel>
        <Panel title="Queue & live actions">
          <div className="console-queue-head">
            <small>NOW PLAYING</small>
            <h3>{s.queue[0]?.name || "Standing by"}</h3>
            <p>
              {s.queue.length} queued · {s.completed.length} retained
              completions
            </p>
            <small>NEXT SCHEDULED MODE</small>
            <p>
              {(() => {
                const order = s.broadcast.order.filter(
                  (m) => s.broadcast.modes[m]?.enabled,
                );
                return (
                  order[(order.indexOf(s.settings.mode) + 1) % order.length] ||
                  "No enabled mode"
                );
              })()}
            </p>
            <a href="/admin/modes">Order, timing & auto rotation →</a>
          </div>
          <div className="bc-stack">
            <button onClick={() => rehearse("Bonus Popup Preview")}>
              Preview bonus · local
            </button>
            <button onClick={() => rehearse("Reward Wheel Result")}>
              Preview spin · local
            </button>
            {[
              "Daily Arena",
              "Weekly Arena",
              "Monthly Arena",
              "Team Battle",
              "Leaderboard Focus",
              "Reward Ceremony",
              "Standby",
              "Champion Spotlight",
              "Hall of Fame",
            ].map((m) => (
              <button
                disabled={!s.broadcast.modes[m].enabled}
                key={m}
                onClick={() => void run(() => setMode(m))}
              >
                {m}
              </button>
            ))}
            <button onClick={() => void run(() => quick("Rotation pause"))}>
              {s.broadcast.rotationPaused
                ? "Resume rotation"
                : "Pause rotation"}
            </button>
            <button onClick={() => void run(() => quick("Sound"))}>
              Sound: {s.settings.sound ? "On" : "Off"}
            </button>
            <button onClick={() => void run(() => quick("Pause"))}>
              {s.broadcast.effects.paused ? "Resume" : "Pause"} celebrations
            </button>
            <button
              onClick={() => void run(() => setMode(s.broadcast.defaultMode))}
            >
              Return to default Arena
            </button>
            <button onClick={() => void run(() => quick("Start spin"))}>
              Start authorized spin
            </button>
            <button onClick={() => void run(() => quick("Resume rotation"))}>
              Release manual rotation hold
            </button>
            <button onClick={() => show(!instructions)}>
              Fullscreen instructions
            </button>
          </div>
          {instructions && (
            <p>
              Open Live Arena on the TV browser, then select the fullscreen icon
              in its header. Press Esc to exit. Enable audio on that screen
              after switching master sound on.
            </p>
          )}
        </Panel>
      </div>
      <p role="status">{message}</p>
      <Panel
        title="Local visual rehearsal"
        action={<Badge value="No rewards issued" />}
      >
        <div id="rehearsal" />
        <label>
          Milestone rule
          <select value={rule} onChange={(e) => setRule(e.target.value)}>
            {s.targets.rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <div className="op-actions">
          {[
            "Approved Sale Animation",
            "Agent Spotlight",
            "Target Milestone Preview",
            "Bonus Popup Preview",
            "Spin Unlock Preview",
            "Reward Wheel Result",
            "Leaderboard Rank Change",
            "New Champion",
            "Team Lead Change",
            "Replay completed award",
          ].map((k) => (
            <button key={k} onClick={() => rehearse(k)}>
              {k}
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Playout queue">
        <Table
          heads={["Position", "Presentation", "Source"]}
          rows={s.queue
            .slice(0, 10)
            .map((e, i) => [
              i ? "Up next " + i : "Now playing",
              e.name,
              e.demo
                ? "Rehearsal"
                : e.spin
                  ? "Assigned spin"
                  : e.target
                    ? "Target milestone"
                    : "Approved sale",
            ])}
        />
        <p>
          FIFO queue. Pausing retains phase timing. Extreme backlogs are capped
          at 96 presentations; overflow is audited and reward records are
          retained.
        </p>
      </Panel>
    </>
  );
}
export function Modes({ s }: { s: Data }) {
  const {
    draft,
    setDraft: set,
    conflict,
    reset,
  } = useSettingsDraft({
    modes: s.broadcast.modes,
    order: s.broadcast.order,
    rotation: s.broadcast.rotation,
    defaultMode: s.broadcast.defaultMode,
  });
  const { message, run } = useAction();
  return (
    <>
      <Panel title="Broadcast rotation">
        <label className="bc-check">
          <input
            type="checkbox"
            checked={draft.rotation}
            onChange={(e) => set({ ...draft, rotation: e.target.checked })}
          />
          Automatically rotate enabled modes
        </label>
        <label>
          Default Arena
          <select
            value={draft.defaultMode}
            onChange={(e) => set({ ...draft, defaultMode: e.target.value })}
          >
            {broadcastModes
              .filter((m) => draft.modes[m].enabled)
              .map((m) => (
                <option key={m}>{m}</option>
              ))}
          </select>
        </label>
        <p>
          Durations are in seconds. Rotation waits for every queued ceremony.
          Manual selection takes priority for 60 seconds; use Live TV Control to
          release the hold early.
        </p>
        <a href="/admin/competitions">Manage competition schedule →</a>
      </Panel>
      <div className="bc-mode-grid">
        {draft.order.map((name) => {
          const m = draft.modes[name];
          const update = (value: Partial<typeof m>) =>
            set({
              ...draft,
              modes: { ...draft.modes, [name]: { ...m, ...value } },
            });
          return (
            <Panel
              key={name}
              title={name}
              action={
                <div className="op-actions">
                  <button
                    aria-label={"Move " + name + " earlier"}
                    disabled={draft.order.indexOf(name) === 0}
                    onClick={() => {
                      const order = [...draft.order],
                        i = order.indexOf(name);
                      [order[i - 1], order[i]] = [order[i], order[i - 1]];
                      set({ ...draft, order });
                    }}
                  >
                    ↑
                  </button>
                  <button
                    aria-label={"Move " + name + " later"}
                    disabled={
                      draft.order.indexOf(name) === draft.order.length - 1
                    }
                    onClick={() => {
                      const order = [...draft.order],
                        i = order.indexOf(name);
                      [order[i], order[i + 1]] = [order[i + 1], order[i]];
                      set({ ...draft, order });
                    }}
                  >
                    ↓
                  </button>
                </div>
              }
            >
              <label className="bc-check">
                <input
                  type="checkbox"
                  checked={m.enabled}
                  onChange={(e) => update({ enabled: e.target.checked })}
                />
                Enabled
              </label>
              <label>
                Display title
                <input
                  value={m.title}
                  maxLength={60}
                  placeholder={name}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </label>
              <label>
                Duration (5–3600 seconds)
                <input
                  type="number"
                  min={5}
                  max={3600}
                  value={m.seconds}
                  onChange={(e) => update({ seconds: Number(e.target.value) })}
                />
              </label>
              <div className="bc-options">
                {(["podium", "leaderboard"] as const).map((k) => (
                  <label className="bc-check" key={k}>
                    <input
                      type="checkbox"
                      checked={m[k]}
                      onChange={(e) => update({ [k]: e.target.checked })}
                    />
                    {k === "podium" ? "Spotlight / podium" : "Leaderboard"}
                  </label>
                ))}
              </div>
              <small>METRICS RIBBON</small>
              <div className="bc-options">
                {statNames.map((n) => (
                  <label className="bc-check" key={n}>
                    <input
                      type="checkbox"
                      checked={m.statistics.includes(n)}
                      onChange={(e) =>
                        update({
                          statistics: e.target.checked
                            ? [...m.statistics, n]
                            : m.statistics.filter((x) => x !== n),
                        })
                      }
                    />
                    {n}
                  </label>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
      <button
        className="primary"
        disabled={conflict}
        onClick={() =>
          void run(() =>
            command("modes", "arena.modes_saved", "Arena 01", (d) => {
              if (
                !draft.modes[draft.defaultMode]?.enabled ||
                !draft.modes[d.settings.mode]?.enabled
              )
                throw Error("Keep the live and default modes enabled.");
              if (
                Object.values(draft.modes).some(
                  (m) =>
                    !Number.isFinite(m.seconds) ||
                    m.seconds < 5 ||
                    m.seconds > 3600,
                )
              )
                throw Error("Enter durations between 5 and 3600 seconds.");
              d.broadcast.modes = draft.modes;
              d.broadcast.order = [...draft.order];
              d.broadcast.rotationTick = Date.now();
              d.broadcast.rotation = draft.rotation;
              d.broadcast.defaultMode = draft.defaultMode;
              d.broadcast.changedAt = Date.now();
              return "Mode configuration saved";
            }),
          )
        }
      >
        Save mode configuration
      </button>
      <button onClick={reset}>Discard / reload saved modes</button>
      {conflict && (
        <p role="alert">
          Mode settings changed in another editor. Reload before saving.
        </p>
      )}
      <p role="status">{message}</p>
    </>
  );
}
const boardLabels: Record<string, string> = {
  leadMargin: "Champion lead margin",
  avatars: "Agent avatars",
  teams: "Team names",
  changes: "Rank-change indicators",
  medals: "Highlight top three rows",
  champion: "Champion information",
  sales: "Sales counts",
  targets: "Target progress",
  teamRanks: "Team battle rankings",
  top3: "Top 3 spotlight",
  dailyTop3: "Daily Top 3",
  weeklyTop3: "Weekly Top 3",
  monthlyTop3: "Monthly Top 3",
  topSales: "Top 3 sales totals",
  topTeams: "Top 3 team names",
};
export function Leaderboard({ s }: { s: Data }) {
  const { message, run } = useAction();
  const [draft, setDraft] = useState(s);
  const [advanced, setAdvanced] = useState(false);
  return (
    <div className="console-composer">
      <Panel title="Standings & spotlight">
        <p>
          Rankings always use approved sales. Period overrides apply to the
          leaderboard; the selected Arena mode retains its own spotlight period.
        </p>
        <button
          className="simple-options-toggle"
          onClick={() => setAdvanced(!advanced)}
          aria-expanded={advanced}
        >
          {advanced ? "Show essential settings" : "More display options"}
        </button>
        <Form
          initial={{
            ...values(s.broadcast.leaderboard),
            size: String(s.settings.size),
            leadMargin: String(s.broadcast.leaderboard.leadMargin !== false),
            density: s.broadcast.leaderboard.density || "Comfortable",
          }}
          fields={[
            number("size", "Displayed agents", 1, 10),
            select("period", "Leaderboard ranking period", [
              "Follow mode",
              "Daily Arena",
              "Weekly Arena",
              "Monthly Arena",
            ]),
            ...Object.entries(boardLabels)
              .filter(
                ([k]) =>
                  advanced ||
                  ["top3", "changes", "teams", "avatars", "sales"].includes(k),
              )
              .map(([k, l]) => toggle(k, l)),
            select("density", "Row density", [
              "Compact",
              "Comfortable",
              "Spacious",
            ]),
            select("podiumStyle", "Top 3 layout", ["Podium", "Cards"]),
          ]}
          preview={(v) => {
            const next = structuredClone(s);
            next.settings.size = Number(v.size);
            for (const k of Object.keys(boardLabels))
              Object.assign(next.broadcast.leaderboard, {
                [k]: v[k] === "true",
              });
            Object.assign(next.broadcast.leaderboard, {
              period: v.period,
              podiumStyle: v.podiumStyle,
              density: v.density,
            });
            return <DraftPreview data={next} set={setDraft} />;
          }}
          save={async (v) => {
            const saved = await run(() =>
              command(
                "leaderboard",
                "arena.leaderboard_saved",
                "Arena 01",
                (d) => {
                  d.settings.size = Math.min(10, Math.max(1, Number(v.size)));
                  const b = d.broadcast.leaderboard;
                  for (const k of Object.keys(boardLabels))
                    Object.assign(b, { [k]: v[k] === "true" });
                  b.period = v.period;
                  b.podiumStyle = v.podiumStyle;
                  b.density = v.density;
                  return "Approved-sales display settings";
                },
              ),
            );
            if (!saved)
              throw Error(
                "Settings were not saved. See the error below and try again.",
              );
          }}
        />
        <p role="status">{message}</p>
      </Panel>
      <Panel title="Preview · unsaved changes">
        <Monitor draft={draft} />
        <p>
          Actual Arena renderer. Changes reach the broadcast only after saving.
        </p>
        <details className="simple-advanced">
          <summary>Advanced recognition settings</summary>
          <RecognitionControls s={s} />
        </details>
      </Panel>
    </div>
  );
}
const appearanceFields = [
  { key: "accent", label: "Accent color", type: "color" },
  select("background", "Background", ["Architectural", "Clean", "Grid"]),
  select("contrast", "Text contrast", ["Standard", "High"]),
  select("championStyle", "Champion highlight", ["Gold", "Electric"]),
  select("rankingStyle", "Leaderboard accent", ["Medal", "Electric"]),
  select("position", "Leaderboard position", ["Left"]),
  toggle("metrics", "Metrics ribbon"),
  toggle("ticker", "Activity ticker"),
];
const effectFields = [
  toggle("soundSale", "Approval sound category"),
  toggle("soundMilestone", "Milestone sound category"),
  toggle("soundSpin", "Spin sound category"),
  toggle("soundPrize", "Prize sound category"),
  ...["approved", "milestone", "bonus", "unlock", "wheel", "champion"].map(
    (k, i) =>
      toggle(
        k,
        [
          "Approved sale animation",
          "Target milestone popup",
          "Bonus popup",
          "Spin unlocked popup",
          "Reward wheel animation",
          "Champion change / spotlight animation",
        ][i],
      ),
  ),
  select("duration", "Celebration duration multiplier", ["1", "2", "3"]),
  select("transition", "Transition speed", ["0.5", "1", "2"]),
  toggle("paused", "Pause celebration queue"),
  number("volume", "Volume (%)", 0, 100),
  { key: "bonusTitle", label: "Bonus popup title" },
  { key: "bonusSubtitle", label: "Bonus popup subtitle" },
  toggle("agent", "Show agent name"),
  toggle("avatar", "Show agent avatar"),
  toggle("sales", "Show approved sales"),
  toggle("team", "Show team name"),
  toggle("threshold", "Show milestone"),
  select("style", "Celebration style", ["Championship", "Minimal"]),
];
export function Presentation({
  s,
  kind,
}: {
  s: Data;
  kind: "appearance" | "effects" | "branding";
}) {
  const [draft, set] = useState(structuredClone(s)),
    [revision, revise] = useState(0),
    { message, run } = useAction();
  useEffect(() => {
    set((d) => ({
      ...d,
      broadcast: {
        ...d.broadcast,
        recognition: s.broadcast.recognition,
        audio: s.broadcast.audio,
      },
    }));
  }, [s.broadcast.recognition, s.broadcast.audio]);
  const fields: Field[] =
    kind === "appearance"
      ? appearanceFields
      : kind === "effects"
        ? effectFields
        : [
            {
              key: "logo",
              label: "Company logo (PNG, JPEG, WebP)",
              type: "avatar",
            },
            { key: "office", label: "Office name" },
            { key: "label", label: "Sponsor / department label" },
            { key: "competition", label: "Competition display title" },
          ];
  const extras: Field[] =
    kind === "branding"
      ? [
          { key: "title", label: "Arena title", required: true },
          { key: "brand", label: "Header wordmark", required: true },
        ]
      : kind === "effects"
        ? [
            toggle("sound", "Master sound"),
            select("intensity", "Animation intensity", ["Standard", "Reduced"]),
          ]
        : [];
  function update(v: Record<string, string>) {
    const next = structuredClone(s),
      target = next.broadcast[kind] as unknown as Record<string, unknown>;
    for (const f of fields) {
      const old = target[f.key];
      target[f.key] =
        typeof old === "boolean" || ["avatar", "sales"].includes(f.key)
          ? v[f.key] === "true"
          : typeof old === "number"
            ? Number(v[f.key])
            : v[f.key];
    }
    for (const f of extras)
      Object.assign(next.settings, {
        [f.key]: f.key === "sound" ? v[f.key] === "true" : v[f.key],
      });
    return next;
  }
  return (
    <>
      <div className="bc-home">
        <Panel
          title="Presentation editor"
          action={<Badge value="Draft preview" />}
        >
          <Form
            key={revision}
            fields={[...fields, ...extras]}
            initial={{
              ...values(s.broadcast[kind]),
              ...(kind === "effects"
                ? {
                    avatar: String(s.broadcast.effects.avatar !== false),
                    sales: String(s.broadcast.effects.sales !== false),
                  }
                : {}),
              ...Object.fromEntries(
                extras.map((f) => [
                  f.key,
                  String(s.settings[f.key as keyof Data["settings"]]),
                ]),
              ),
            }}
            defaults={values(defaults()[kind])}
            preview={(v) => <DraftPreview data={update(v)} set={set} />}
            save={async (v) => {
              const next = update(v);
              const saved = await run(() =>
                command(kind, "arena.presentation_saved", kind, (d) => {
                  Object.assign(d.broadcast[kind], next.broadcast[kind]);
                  for (const f of extras)
                    Object.assign(d.settings, {
                      [f.key]: next.settings[f.key as keyof Data["settings"]],
                    });
                  return "Saved " + kind;
                }),
              );
              if (!saved)
                throw Error(
                  "Settings were not saved. See the error below and try again.",
                );
            }}
          />
          <div className="op-actions">
            <button
              onClick={() => {
                set(structuredClone(s));
                revise(revision + 1);
              }}
            >
              Reset to saved
            </button>
          </div>
          {kind === "appearance" && (
            <p>
              Spotlight, Top 3, target progress and row count:{" "}
              <a href="/admin/leaderboard">Leaderboard settings →</a>
            </p>
          )}
          {kind === "effects" && (
            <p>
              Reduced-motion follows the TV browser preference. Master sound
              requires local activation; enable audio on the TV to authorize
              playback. FIFO preserves assigned rewards.
            </p>
          )}
        </Panel>
        <Panel title="Actual Arena preview">
          <Monitor draft={draft} />
          <p>
            Preview updates immediately. Save publishes this section to
            connected tabs.
          </p>
        </Panel>
      </div>
      <p role="status">{message}</p>
      {kind === "effects" && <SoundControls s={s} />}
      {kind === "appearance" && (
        <details className="simple-advanced">
          <summary>Advanced recognition settings</summary>
          <RecognitionControls s={s} />
        </details>
      )}
    </>
  );
}
// Commit form preview values after render; never writes the shared ledger.
import { useEffect } from "react";
function DraftPreview({ data, set }: { data: Data; set: (d: Data) => void }) {
  const signature = JSON.stringify([data.broadcast, data.settings]);
  useEffect(() => set(data), [signature]);
  return null;
}
