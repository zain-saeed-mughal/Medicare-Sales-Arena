import { TargetSummary } from "../targets/Targets";
import { session } from "./service";
import { useDisplayPresence } from "./presence";
import { useEffect, useRef, useState } from "react";
import { type Data, modes } from "./model";
import { command, preview } from "./service";
import { Form, Panel, Badge, opts, values, type Field } from "./ui";
export function Settings({
  s,
  control = false,
}: {
  s: Data;
  control?: boolean;
}) {
  const toggle = (key: string, label: string): Field => ({
    key,
    label,
    options: [
      ["true", "Enabled"],
      ["false", "Disabled"],
    ],
  });
  const fields: Field[] = control
    ? [
        { key: "mode", label: "Broadcast mode", options: opts(modes) },
        toggle("sound", "Announcement chime"),
        toggle("animations", "Celebration sequences"),
        {
          key: "intensity",
          label: "Animation intensity",
          options: opts(["Standard", "Reduced"]),
        },
      ]
    : [
        {
          key: "timezone",
          label: "Scoring timezone",
          options: opts([
            "UTC",
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "Asia/Karachi",
          ]),
        },
      ];
  const [notice, set] = useState("");
  return (
    <Panel
      title={control ? "Broadcast controls" : "Scoring & development feed"}
    >
      <Form
        fields={fields}
        initial={Object.fromEntries(
          fields.map((f) => [
            f.key,
            String(s.settings[f.key as keyof Data["settings"]]),
          ]),
        )}
        save={async (v) => {
          await command(
            control ? "arena-control" : "settings",
            control && v.mode !== s.settings.mode
              ? "arena.broadcast_mode_changed"
              : "arena.settings_updated",
            "Arena 01",
            (d) => {
              const before = { ...d.settings };
              if (control)
                Object.assign(d.settings, {
                  mode: v.mode,
                  animations: v.animations === "true",
                  sound: v.sound === "true",
                  intensity: v.intensity,
                });
              else
                Object.assign(d.settings, {
                  timezone: v.timezone,
                  simulate: false,
                });
              return JSON.stringify({ before, after: d.settings });
            },
          );
          set("Settings saved.");
        }}
      />
      {notice && <p role="status">{notice}</p>}
    </Panel>
  );
}
export function Control({ s }: { s: Data }) {
  const online = useDisplayPresence();
  const [ruleId, selectRule] = useState(
    s.targets.rules.find((r) => r.active)?.id || "",
  );
  const ref = useRef<HTMLDivElement>(null),
    [scale, set] = useState(0.3),
    [notice, msg] = useState("");
  useEffect(() => {
    const node = ref.current!;
    const r = new ResizeObserver(() => set(node.clientWidth / 1920));
    r.observe(node);
    return () => r.disconnect();
  }, []);
  async function run(kind: string) {
    try {
      await command("arena-control", "arena.preview", kind, (d) => {
        if (kind === "Clear completed") d.completed = [];
        else if (kind === "Standard broadcast")
          d.settings.mode = "Live Competition";
        else if (kind === "Replay last award") {
          const source = d.completed.find(
            (e) =>
              e.spin &&
              d.spins.some(
                (sp) => sp.id === e.spin && sp.completed && !sp.voided,
              ),
          );
          if (!source)
            throw Error("No completed award is available to replay.");
          d.queue.push({
            ...source,
            sale: "",
            spin: "",
            demo: true,
            sequence: ++d.sequence,
            previewPhase: "wheel",
          });
        } else preview(d, kind, ruleId);
        return "Development presentation control";
      });
      msg(kind + " applied.");
    } catch (e) {
      msg((e as Error).message);
    }
  }
  return (
    <>
      <div className="control-status">
        <span>
          <i /> PROGRAM MONITOR
        </span>
        <b>{s.settings.mode}</b>
        <span>
          {online ? "LOCAL ARENA TAB DETECTED" : "NO LOCAL ARENA HEARTBEAT"}
        </span>
        <span>QUEUE　{String(s.queue.length).padStart(2, "0")}</span>
      </div>
      <div className="control-grid">
        <Settings s={s} control />
        <Panel title="Program monitor" action={<Badge value="Preview" />}>
          <div ref={ref} className="op-monitor">
            <iframe
              title="Read-only Arena preview"
              src="/arena?monitor"
              style={{ transform: "scale(" + scale + ")" }}
            />
          </div>
          <p>
            {s.competitions.find((c) => c.status === "Active")?.name ||
              "No active competition"}{" "}
            · {s.settings.mode}
          </p>
          <a href="/arena" target="_blank">
            Open broadcast display ↗
          </a>
        </Panel>
        <Panel title="Playout queue">
          <small>NOW PLAYING</small>
          <h3>{s.queue[0]?.name || "Champion stage"}</h3>
          <p>
            {s.queue[0]?.spin
              ? "Reward ceremony"
              : s.queue[0]?.demo
                ? "Demo preview"
                : "Standard broadcast"}
          </p>
          <small>UP NEXT · {Math.max(0, s.queue.length - 1)}</small>
          {s.queue.slice(1, 7).map((e) => (
            <p key={e.sequence}>
              {e.name} · #{e.sequence}
            </p>
          ))}
          <small>RECENTLY COMPLETED</small>
          {s.completed.slice(0, 4).map((e) => (
            <p key={e.sequence}>
              {e.name} · #{e.sequence}
            </p>
          ))}
          <button onClick={() => run("Clear completed")}>
            Clear completed
          </button>
        </Panel>
      </div>
      <TargetSummary s={s} />
      {session(s)?.role === "Super Admin" && (
        <Panel title="Bonus broadcast visibility">
          <label>
            <input
              type="checkbox"
              checked={s.targets.showAmounts}
              onChange={(e) => {
                const visible = e.target.checked;
                void command(
                  "settings",
                  "target.visibility_changed",
                  "Arena 01",
                  (d) => {
                    d.targets.showAmounts = visible;
                    return visible
                      ? "Show exact bonus amounts"
                      : "Hide exact bonus amounts";
                  },
                ).catch((e) => msg(e.message));
              }}
            />{" "}
            Show exact bonus amounts on TV
          </label>
        </Panel>
      )}
      <Panel title="Visual rehearsal">
        <label>
          Target rule for milestone, bonus and spin previews
          <select value={ruleId} onChange={(e) => selectRule(e.target.value)}>
            {s.targets.rules.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} · {r.scope}
              </option>
            ))}
          </select>
        </label>
        <p>
          Preview cues are labeled and excluded from sales, rewards, and
          competition scores. Open a broadcast display for live playout.
        </p>
        <div className="op-actions">
          {[
            "Approved Sale Animation",
            "Agent Spotlight",
            "Reward Spin Unlocked",
            "Reward Wheel Result",
            "Achievement Celebration",
            "Target Milestone Preview",
            "Bonus Popup Preview",
            "Spin Unlock Preview",
            "2-sale bonus",
            "5-sale bonus",
            "10-sale bonus",
            "Leaderboard Rank Change",
            "Replay last award",
            "Standard broadcast",
          ].map((k) => (
            <button onClick={() => run(k)} key={k}>
              {k}
            </button>
          ))}
        </div>
        <p role="status">{notice}</p>
      </Panel>
    </>
  );
}
