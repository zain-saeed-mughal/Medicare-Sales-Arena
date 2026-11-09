import { useState } from "react";
import type { Data, AdminUser, ArenaEvent } from "./model";
import { allowed, preview } from "./service";
import { Panel, Modal } from "./ui";
import { Monitor } from "../broadcast/Monitor";
import { quick, setMode } from "../broadcast/commands";
import { Wheel, RewardHistory } from "../broadcast/Rewards";
import { Rewards } from "./Catalog";
import { useAction } from "../broadcast/Pages";
import { recognition } from "../championship/data";
import { useDisplayPresence } from "./presence";

export const core = [
  ["overview", "Dashboard"],
  ["live-control", "Live Control"],
  ["targets", "Targets"],
  ["reward-operations", "Rewards & Spins"],
  ["leaderboard", "Leaderboard"],
  ["effects", "Celebrations"],
  ["appearance", "Appearance & Sound"],
  ["participants", "Agents"],
  ["reward-history", "History"],
  ["account", "Settings"],
] as const;
export const families: Record<string, string[]> = {
  "live-control": ["live-control", "arena-control", "modes", "integration"],
  targets: [
    "targets",
    "targets/rules",
    "targets/agents",
    "targets/teams",
    "programs",
    "bonuses",
    "bonus-review",
    "bonuses/history",
  ],
  "reward-operations": ["reward-operations", "spin-wheel", "rewards"],
  participants: ["participants", "agents", "teams", "sales", "performance"],
  "reward-history": ["reward-history", "activity"],
  account: [
    "account",
    "branding",
    "settings",
    "health",
    "security",
    "users",
    "access",
    "competitions",
  ],
};
export const sectionFor = (path: string) =>
  Object.entries(families).find(([, v]) => v.includes(path))?.[0] || path;
const links: Record<string, [string, string][]> = {
  "live-control": [
    ["live-control", "Controls"],
    ["modes", "Rotation schedule"],
    ["integration-preview", "Rehearsal studio"],
  ],
  targets: [
    ["targets", "Milestones"],
    ["targets/agents", "Agent assignments"],
    ["targets/teams", "Team assignments"],
    ["bonus-review", "Bonus review"],
    ["targets/rules", "Advanced rules"],
  ],
  participants: [
    ["agents", "Profiles"],
    ["sales", "Sale review"],
    ["performance", "Performance"],
  ],
  "reward-history": [
    ["spin-history", "Rewards & replays"],
    ["activity", "Recent activity"],
  ],
  account: [
    ["account", "Operator"],
    ["branding", "Branding"],
    ["settings", "System"],
    ["system-health", "Health"],
    ["security", "Access"],
    ["competitions", "Competitions"],
  ],
};
const aliases: Record<string, string> = {
  agents: "participants",
  "spin-history": "reward-history",
  "integration-preview": "integration",
  "system-health": "health",
};
export function SectionLinks({ path, u }: { path: string; u: AdminUser }) {
  const list = links[sectionFor(path)];
  return list ? (
    <div className="simple-tabs" aria-label="Section pages">
      {list
        .filter(([p]) => allowed(u, aliases[p] || p))
        .map(([p, n]) => (
          <a
            key={p}
            href={"/admin/" + p}
            aria-current={(aliases[p] || p) === path ? "page" : undefined}
          >
            {n}
          </a>
        ))}
    </div>
  ) : null;
}
export function SimpleDashboard({ s, u }: { s: Data; u: AdminUser }) {
  const online = useDisplayPresence(),
    d = recognition(
      s,
      s.settings.mode === "Weekly Arena" || s.settings.mode === "Monthly Arena"
        ? s.settings.mode
        : "Daily Arena",
    );
  return (
    <div className="simple-dashboard">
      <section className="simple-summary">
        <div>
          <span className="simple-status">
            {online ? "Display connected" : "Waiting for TV display"}
          </span>
          <h2>{s.settings.mode}</h2>
          <p>
            {s.queue.length
              ? `${s.queue.length} celebrations queued`
              : "Ready for the next achievement"}
          </p>
        </div>
        <div>
          <small>Current champion</small>
          <h3>{d.players[0]?.name || "No approved sales yet"}</h3>
          <p>
            {d.players[0]?.teamLabel} · {d.players[0]?.sales || 0} approved
          </p>
        </div>
      </section>
      <div className="simple-stats">
        {[
          ["Approved sales", d.approved],
          ["Active agents", d.players.length],
          [
            "Pending spins",
            s.spins.filter((x) => !x.completed && !x.voided).length,
          ],
        ].map(([k, v]) => (
          <div key={k}>
            <small>{k}</small>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <div className="simple-dashboard-grid">
        <Panel title="Live preview">
          <Monitor />
          <p className="simple-help">Read-only preview of the TV display.</p>
        </Panel>
        <Panel title="Quick actions">
          <div className="simple-action-list">
            {[
              [
                "live-control",
                "Control the Arena",
                "Modes, playback and safe previews",
              ],
              ["rewards", "Rewards & Spins", "Prizes and pending rewards"],
              [
                "targets",
                "Manage targets",
                "Daily, weekly and monthly milestones",
              ],
              ["sales", "Review sales", "Approve or correct submissions"],
            ]
              .filter(([p]) => allowed(u, p))
              .map(([p, n, h]) => (
                <a key={p} href={"/admin/" + p}>
                  <b>
                    {n} <span>→</span>
                  </b>
                  <small>{h}</small>
                </a>
              ))}
          </div>
          <a className="simple-open" href="/arena" target="_blank">
            Open Live Arena ↗
          </a>
        </Panel>
      </div>
    </div>
  );
}
export function SimpleLive({ s }: { s: Data }) {
  const { message, run, busy } = useAction(),
    [event, setEvent] = useState<ArenaEvent>(),
    [kind, setKind] = useState("Approved Sale Animation");
  const rehearse = () =>
    void run(async () => {
      const clone = structuredClone(s);
      preview(clone, kind);
      setEvent({ ...clone.queue.at(-1)!, sequence: Date.now() });
    }, "Preview only. Live rewards and inventory are unchanged.");
  return (
    <>
      <div className="simple-live-grid">
        <Panel title="Broadcast controls">
          <fieldset disabled={busy} className="broadcast-controls-fields">
            <label>
              Active mode
              <select
                value={s.settings.mode}
                onChange={(e) => void run(() => setMode(e.target.value))}
              >
                {s.broadcast.order
                  .filter((m) => s.broadcast.modes[m]?.enabled)
                  .map((m) => (
                    <option key={m}>{m}</option>
                  ))}
              </select>
            </label>
            <div className="simple-actions">
              <button
                onClick={() =>
                  void run(() =>
                    quick(
                      s.settings.animations ? "Pause" : "Enable celebrations",
                    ),
                  )
                }
              >
                {!s.settings.animations
                  ? "Enable"
                  : s.broadcast.effects.paused
                    ? "Resume"
                    : "Pause"}{" "}
                celebrations
              </button>
              <button
                onClick={() =>
                  void run(() =>
                    quick(
                      s.broadcast.rotation
                        ? "Rotation pause"
                        : "Start rotation",
                    ),
                  )
                }
              >
                {!s.broadcast.rotation
                  ? "Start"
                  : s.broadcast.rotationPaused
                    ? "Resume"
                    : "Pause"}{" "}
                rotation
              </button>
              <button
                disabled={
                  !s.queue[0]?.spin ||
                  s.queue[0]?.demo ||
                  s.broadcast.effects.paused ||
                  s.broadcast.wheel.released.includes(s.queue[0]?.sequence)
                }
                onClick={() => void run(() => quick("Start spin"))}
              >
                Start authorized spin
              </button>
            </div>
            <p>
              {s.queue[0]
                ? `Now playing: ${s.queue[0].name}`
                : "No celebration playing"}{" "}
              · {s.queue.length} queued
            </p>
            <p role="status">
              Rotation:{" "}
              {!s.broadcast.rotation
                ? "Off"
                : s.broadcast.rotationPaused
                  ? "Paused"
                  : "Enabled"}{" "}
              · Celebrations:{" "}
              {!s.settings.animations
                ? "Disabled for future sales"
                : s.broadcast.effects.paused
                  ? "Paused"
                  : "Enabled"}
              .
            </p>
            <p>
              Rotation requires a visible normal Arena tab. It waits while a
              ceremony is queued or celebrations are paused. Selecting a mode
              holds it for 60 seconds.
            </p>
            <p>
              Spin release is available only for an assigned queued reward with
              Authorized manual initiation and celebrations resumed.
            </p>
            <a href="/admin/modes">
              Edit rotation schedule and enabled modes →
            </a>
            <details className="simple-advanced">
              <summary>More controls</summary>
              <div className="simple-actions">
                <button onClick={() => void run(() => quick("Sound"))}>
                  Sound: {s.settings.sound ? "On" : "Off"}
                </button>
                <button
                  onClick={() => void run(() => quick("Resume rotation"))}
                >
                  Release manual mode hold
                </button>
                <button
                  onClick={() =>
                    void run(() => setMode(s.broadcast.defaultMode))
                  }
                >
                  Return to default mode
                </button>
              </div>
              <p>
                For fullscreen and audio, open the Arena on the TV and use its
                header controls.
              </p>
            </details>
          </fieldset>
          <p role="status">{busy ? "Applying broadcast command…" : message}</p>
        </Panel>
        <Panel title={event ? "Local preview" : "Live preview"}>
          <Monitor event={event} />
          {event && (
            <button onClick={() => setEvent(undefined)}>
              Return to live preview
            </button>
          )}
        </Panel>
      </div>
      <Panel title="Safe celebration preview">
        <div className="simple-preview-row">
          <label>
            Celebration
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {[
                "Approved Sale Animation",
                "2-sale bonus",
                "5-sale bonus",
                "10-sale bonus",
                "Bonus Popup Preview",
                "Reward Spin Unlocked",
                "Reward Wheel Result",
                "New Champion",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <button onClick={rehearse}>Preview</button>
        </div>
        <p>
          Only this monitor changes. No sales, rewards or inventory are created.
        </p>
      </Panel>
      <p role="status">{message}</p>
    </>
  );
}
export function SimpleRewards({
  s,
  u,
  initial = "prizes",
}: {
  s: Data;
  u: AdminUser;
  initial?: string;
}) {
  const [tab, setTab] = useState(initial);
  return (
    <>
      <div
        className="simple-tabs"
        role="tablist"
        aria-label="Rewards and spins"
      >
        {[
          ["prizes", "Prize Setup"],
          ["preview", "Wheel Preview"],
          ["settings", "Wheel Settings"],
          ["rules", "Eligibility Rules"],
          ["pending", "Pending Spins"],
          ["completed", "Completed Rewards"],
        ].map(([id, n]) => (
          <button
            role="tab"
            aria-selected={id === tab}
            key={id}
            onClick={() => {
              if (
                document.querySelector(".save-action-bar") &&
                !window.confirm(
                  "Discard unsaved changes before switching tabs?",
                )
              )
                return;
              setTab(id);
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {["prizes", "preview", "settings", "rules"].includes(tab) ? (
          <Wheel
            s={s}
            u={u}
            section={tab as "prizes" | "preview" | "settings" | "rules"}
          />
        ) : tab === "pending" ? (
          <>
            <p className="simple-help">
              Manual spins are released from{" "}
              <a href="/admin/live-control">Live Control</a>.
            </p>
            <RewardHistory key="pending" s={s} u={u} initialStatus="Pending" />
          </>
        ) : (
          <RewardHistory
            key="completed"
            s={s}
            u={u}
            initialStatus="Completed"
          />
        )}
      </div>
    </>
  );
}

export function QuickPreview() {
  const [open, setOpen] = useState(false);
  return (
    <div className="simple-preview-action">
      <button onClick={() => setOpen(true)}>Preview TV</button>
      {open && (
        <Modal title="Live Arena preview" close={() => setOpen(false)}>
          <Monitor />
          <p>Read-only preview. No sales or rewards are created.</p>
        </Modal>
      )}
    </div>
  );
}
