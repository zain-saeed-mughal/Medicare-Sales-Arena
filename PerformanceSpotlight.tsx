import { useMemo } from "react";
import { periodSnapshot } from "./arenaPeriods";
import { CalendarDays, Crown, Medal, Orbit, Timer } from "lucide-react";
import { NexusCore } from "./NexusCore";
import { day, type Data, type LeaderboardEntry } from "./admin/model";
import "./spotlight.css";

export function PerformanceSpotlight({
  store,
  field,
}: {
  store: Data;
  field: LeaderboardEntry[];
}) {
  const first = field[0],
    today = day(new Date().toISOString(), store.settings.timezone);
  const leaders = useMemo(
    () =>
      (["Weekly Arena", "Monthly Arena"] as const).map((period) =>
        periodSnapshot(store, period, today).field.find((a) => a.sales > 0),
      ),
    [store, today],
  );
  return (
    <div className="performance">
      <div className="perf-head">
        <div>
          <small>
            <Orbit size={15} /> NEXUS RECOGNITION
          </small>
          <h2>Performance Spotlight</h2>
        </div>
        <span>FIELD　/　01</span>
      </div>
      <div className="perf-hero" key={first?.id}>
        <div className="perf-identity">
          <small>
            <Crown size={17} /> CURRENT CHAMPION
          </small>
          <h3>{first?.name || "Awaiting competitors"}</h3>
          <p>{first ? "Team " + first.team : "Open standings"}</p>
          <div className="perf-score">
            <b>{first?.sales ?? "—"}</b>
            <span>
              Approved
              <br />
              sales
            </span>
          </div>
          <div className="perf-margin">
            #{first ? "1" : "—"} in field　·　Lead margin +
            {(first?.sales || 0) - (field[1]?.sales || 0)}
          </div>
        </div>
        <div className="perf-core">
          <NexusCore />
        </div>
      </div>
      <section className="perf-podium">
        <small>
          <Medal size={15} /> TOP 3 PERFORMERS
        </small>
        <div>
          {field.slice(0, 3).map((a, i) => (
            <article key={a.id} className={"medal-" + i}>
              <span className="perf-place">0{i + 1}</span>
              <strong>{a.name}</strong>
              <p>{a.sales} approved</p>
              <small className="top-team">{a.team}</small>
            </article>
          ))}
        </div>
      </section>
      <div className="perf-periods">
        {leaders.map((a, i) => {
          const Icon = i ? CalendarDays : Timer;
          return (
            <article key={i}>
              <small>
                <Icon size={16} />
                {i ? "MONTHLY" : "WEEKLY"} TOP PERFORMER
              </small>
              <div>
                <strong>{a?.name || "Awaiting approval"}</strong>
                <b>{a?.sales ?? "—"}</b>
              </div>
              <p>
                {i ? "Month" : "Week"} to date <span>Approved sales</span>
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
