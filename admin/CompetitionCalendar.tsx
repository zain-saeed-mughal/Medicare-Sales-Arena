import { useState } from "react";
import type { Competition } from "./model";
export function CompetitionCalendar({
  items,
  inspect,
}: {
  items: Competition[];
  inspect: (id: string) => void;
}) {
  const [month, set] = useState(new Date().toISOString().slice(0, 7));
  const first = new Date(month + "-01T00:00:00Z");
  function shift(n: number) {
    const d = new Date(first);
    d.setUTCMonth(d.getUTCMonth() + n);
    set(d.toISOString().slice(0, 7));
  }
  const count = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return (
    <section className="n-calendar">
      <div className="op-panel-head">
        <b>
          {first.toLocaleDateString("en", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        </b>
        <div>
          <button aria-label="Previous month" onClick={() => shift(-1)}>
            ‹
          </button>{" "}
          <button aria-label="Next month" onClick={() => shift(1)}>
            ›
          </button>
        </div>
      </div>
      <div className="calendar-days">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <small key={d}>{d}</small>
        ))}
        {Array.from({ length: first.getUTCDay() }, (_, i) => (
          <span key={"empty" + i} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const date = month + "-" + String(i + 1).padStart(2, "0");
          return (
            <div key={date}>
              <b>{i + 1}</b>
              {items
                .filter(
                  (c) =>
                    c.start.slice(0, 10) <= date && c.end.slice(0, 10) >= date,
                )
                .map((c) => (
                  <button
                    key={c.id}
                    title={c.name}
                    onClick={() => inspect(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
