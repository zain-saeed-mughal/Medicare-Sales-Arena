import { useState } from "react";
import {
  Radio,
  Monitor as Screen,
  Crown,
  ArrowUpRight,
  Play,
  Gift,
  Target,
  SlidersHorizontal,
  Palette,
  CalendarClock,
} from "lucide-react";
import type { Data, AdminUser } from "../admin/model";
import { isArenaPeriod } from "../admin/model";
import { allowed } from "../admin/service";
import { useDisplayPresence } from "../admin/presence";
import { Monitor } from "../broadcast/Monitor";
import { displayData } from "../broadcast/config";
import { quick, setMode } from "../broadcast/commands";
import { recognition } from "../championship/data";
export function VictoryOverview({ s, u }: { s: Data; u: AdminUser }) {
  const online = useDisplayPresence(),
    d = recognition(
      displayData(s),
      isArenaPeriod(s.settings.mode) ? s.settings.mode : "Daily Arena",
    ),
    champion = d.players[0],
    [notice, setNotice] = useState("");
  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      setNotice("Broadcast updated.");
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const actions = [
    ["live-control", "Broadcast director", "Control the live show", Screen],
    ["integration", "Rehearsal studio", "Preview without rewards", Play],
    ["spin-wheel", "Reward wheel", "Prizes & presentation", Gift],
    ["targets", "Target studio", "Milestones & eligibility", Target],
    ["appearance", "Appearance & sound", "The broadcast identity", Palette],
    ["modes", "Program schedule", "Order & duration", CalendarClock],
  ] as const;
  return (
    <div className="vx-console-dashboard">
      <section className="vx-console-hero">
        <div>
          <span className="vx-console-kicker">
            <Radio size={13} />
            {online ? "DISPLAY CONNECTED" : "WAITING FOR TV DISPLAY"} / ARENA 01
          </span>
          <h2>
            Your championship.
            <br />
            <em>Your command.</em>
          </h2>
          <p>Direct the moments that move your team forward.</p>
        </div>
        <div className="vx-console-now">
          <Crown />
          <small>ON AIR CHAMPION</small>
          <strong>{champion?.name || "Awaiting performance"}</strong>
          <span>
            {champion?.teamLabel || "Open competition"} · {champion?.sales || 0}{" "}
            approved
          </span>
          <a href="/arena" target="_blank">
            Open TV Arena <ArrowUpRight size={16} />
          </a>
        </div>
      </section>
      <div className="vx-console-overview">
        <section className="vx-console-monitor">
          <header>
            <div>
              <span className="vx-console-kicker">PROGRAM MONITOR</span>
              <h2>{s.settings.mode}</h2>
            </div>
            <span className="vx-readonly">READ-ONLY PREVIEW</span>
          </header>
          <Monitor />
          <footer>
            <span>Actual Arena renderer · 1920 × 1080</span>
            <b>VICTORY STUDIO X</b>
          </footer>
        </section>
        <aside className="vx-console-operations">
          <h2>
            <SlidersHorizontal size={18} /> Playout desk
          </h2>
          <div className="vx-operator-metrics">
            <div>
              <small>APPROVED SALES</small>
              <strong>{d.approved}</strong>
            </div>
            <div>
              <small>ACTIVE AGENTS</small>
              <strong>{d.players.length}</strong>
            </div>
            <div>
              <small>PENDING SPINS</small>
              <strong>
                {s.spins.filter((x) => !x.completed && !x.voided).length}
              </strong>
            </div>
            <div>
              <small>ACTIVE TARGETS</small>
              <strong>{s.targets.rules.filter((r) => r.active).length}</strong>
            </div>
          </div>
          <dl>
            <div>
              <dt>Leading team</dt>
              <dd>{d.teams[0]?.name || "Open field"}</dd>
            </div>
            <div>
              <dt>Audio master</dt>
              <dd>{s.settings.sound ? "On · activate on TV" : "Muted"}</dd>
            </div>
            <div>
              <dt>Rotation</dt>
              <dd>
                {!s.broadcast.rotation
                  ? "Manual"
                  : s.broadcast.rotationPaused
                    ? "Paused"
                    : "Scheduled"}
              </dd>
            </div>
            <div>
              <dt>Current queue</dt>
              <dd>
                {s.queue[0]?.name || "Standing by"}{" "}
                <small>{s.queue.length} waiting</small>
              </dd>
            </div>
          </dl>
          {allowed(u, "live-control") && (
            <>
              <label>
                Live mode
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
              <button onClick={() => void run(() => quick("Rotation pause"))}>
                {s.broadcast.rotationPaused
                  ? "Resume rotation"
                  : "Pause rotation"}
              </button>
            </>
          )}
          <p role="status">{notice}</p>
        </aside>
      </div>
      <div className="vx-console-action-deck">
        {actions
          .filter(([path]) => allowed(u, path))
          .map(([path, label, hint, Icon]) => (
            <a key={path} href={"/admin/" + path}>
              <Icon />
              <div>
                <b>{label}</b>
                <small>{hint}</small>
              </div>
              <ArrowUpRight />
            </a>
          ))}
      </div>
      <section className="vx-console-feed">
        <h2>Latest recognition</h2>
        {s.completed.length ? (
          <div>
            {s.completed.slice(0, 4).map((e) => (
              <article key={e.sequence}>
                <span>
                  {e.demo
                    ? "REHEARSAL"
                    : e.spin
                      ? "REWARD REVEAL"
                      : e.target
                        ? "TARGET ACHIEVED"
                        : "APPROVED SALE"}
                </span>
                <b>{e.name}</b>
                <small>Presentation #{e.sequence}</small>
              </article>
            ))}
          </div>
        ) : (
          <p>The next approved achievement will appear here.</p>
        )}
      </section>
    </div>
  );
}
