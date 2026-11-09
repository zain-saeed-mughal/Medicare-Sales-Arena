import type { Data, AdminUser } from "../admin/model";
import { allowed } from "../admin/service";
import { useDisplayPresence } from "../admin/presence";
import { recognition } from "../championship/data";
import { Monitor } from "../broadcast/Monitor";
import {
  ArrowUpRight,
  Radio,
  Target,
  Gift,
  Users,
  Play,
  CheckCheck,
} from "lucide-react";
import { VelocityInsignia } from "./Stage";
export function VelocityDashboard({ s, u }: { s: Data; u: AdminUser }) {
  const online = useDisplayPresence(),
    d = recognition(
      s,
      s.settings.mode === "Weekly Arena" || s.settings.mode === "Monthly Arena"
        ? s.settings.mode
        : "Daily Arena",
    ),
    p = d.players[0];
  return (
    <div className="tv-command simple-dashboard">
      <section className="tv-command-hero">
        <div>
          <span className="tv-kicker">
            <Radio />
            {online
              ? "ARENA TAB DETECTED IN THIS BROWSER"
              : "NO RECENT ARENA TAB HEARTBEAT"}
          </span>
          <h2>
            Extraordinary effort.
            <br />
            <em>Unforgettable moments.</em>
          </h2>
          <p>
            {s.settings.mode} ·{" "}
            {s.queue.length
              ? s.queue.length + " moments in the queue"
              : "Ready for the next achievement"}
          </p>
          <a href="/arena" target="_blank">
            Open Live Arena <ArrowUpRight />
          </a>
        </div>
        <div className="tv-command-champion">
          <VelocityInsignia />
          <div>
            <small>SETTING THE STANDARD</small>
            <h3>{p?.name || "The stage is open"}</h3>
            <p>{p?.teamLabel || "Awaiting approved sales"}</p>
            <strong>
              {p?.sales || 0}
              <span>approved</span>
            </strong>
          </div>
        </div>
      </section>
      <div className="tv-command-stats">
        {[
          [CheckCheck, "Approved sales", d.approved],
          [Users, "Active agents", d.players.length],
          [
            Gift,
            "Pending spins",
            s.spins.filter((x) => !x.completed && !x.voided).length,
          ],
          [
            Target,
            "Active targets",
            s.targets.rules.filter((x) => x.active).length,
          ],
        ].map(([Icon, k, v]) => {
          const I = Icon as typeof Target;
          return (
            <article key={String(k)}>
              <I />
              <div>
                <small>{String(k)}</small>
                <b>{String(v)}</b>
              </div>
            </article>
          );
        })}
      </div>
      <div className="tv-command-main">
        <section className="tv-command-monitor">
          <header>
            <div>
              <span className="tv-kicker">PROGRAM MONITOR</span>
              <h3>{s.settings.mode}</h3>
            </div>
            <span>READ-ONLY PREVIEW</span>
          </header>
          <Monitor />
        </section>
        <section className="tv-command-actions">
          <span className="tv-kicker">TAKE THE DIRECTOR'S SEAT</span>
          <h3>Your next move.</h3>
          {[
            [
              "live-control",
              "Direct the broadcast",
              "Modes, moments & safe previews",
            ],
            ["rewards", "Create a reward moment", "Prizes, spins & results"],
            [
              "targets",
              "Set the next challenge",
              "Targets & milestone eligibility",
            ],
            ["sales", "Review incoming sales", "Approval & corrections"],
          ]
            .filter(([path]) => allowed(u, path))
            .map(([path, title, hint], i) => (
              <a key={path} href={"/admin/" + path}>
                <span>0{i + 1}</span>
                <div>
                  <b>{title}</b>
                  <small>{hint}</small>
                </div>
                <ArrowUpRight />
              </a>
            ))}
        </section>
      </div>
    </div>
  );
}
