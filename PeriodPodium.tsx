import { Crown, Medal } from "lucide-react";
import type { LeaderboardEntry } from "./admin/model";
import { NexusMark } from "./NexusCore";
import type { ArenaPeriod } from "./admin/model";

export function PeriodPodium({
  period,
  field,
  start,
  end,
}: {
  period: ArenaPeriod;
  field: LeaderboardEntry[];
  start: string;
  end: string;
}) {
  const weekly = period === "Weekly Arena",
    top = field.filter((a) => a.sales > 0).slice(0, 3);
  const date = (value: string) =>
    new Date(value + "T12:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return (
    <section
      className={"period-podium " + (weekly ? "weekly" : "monthly")}
      aria-label={period + " top performers"}
    >
      <div className="perf-head">
        <div>
          <small>
            <Medal size={17} /> NEXUS HONORS　/　{weekly ? "WEEK" : "MONTH"} TO
            DATE
          </small>
          <h2>{weekly ? "Weekly" : "Monthly"} top performers</h2>
        </div>
        <span>
          {date(start)} – {date(end)}
        </span>
      </div>
      <div className="period-field">
        {[1, 0, 2].map((i) => {
          const a = top[i];
          return (
            <article
              key={a?.id ?? "empty-" + i}
              className={"podium-racer medal-" + i}
            >
              <div className="podium-crest">
                {a?.avatar ? (
                  <img src={a.avatar} alt="" />
                ) : a ? (
                  a.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                ) : (
                  <NexusMark />
                )}
              </div>
              <small>
                {i === 0 ? <Crown size={16} /> : <Medal size={15} />} RANK 0
                {i + 1}
              </small>
              <h3>{a?.name || "Open position"}</h3>
              <p>{a?.team || "Awaiting approval"}</p>
              <div className="period-score">
                <b>{a?.sales ?? "—"}</b>
                <span>Approved sales</span>
              </div>
            </article>
          );
        })}
      </div>
      <div className="podium-summary">
        <NexusMark />
        <span>{weekly ? "Weekly" : "Monthly"} championship</span>
        <b>
          {top.length > 1
            ? "Lead margin　+" + (top[0].sales - top[1].sales)
            : "Field standings"}
        </b>
      </div>
    </section>
  );
}
