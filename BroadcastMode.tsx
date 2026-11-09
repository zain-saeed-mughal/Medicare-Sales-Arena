import { Flag, Hexagon, ShieldCheck } from "lucide-react";
import { NexusCore } from "./NexusCore";
import { PrizeWheel } from "./Celebration";
import { standings, teamScores, type Data } from "./admin/model";
export function BroadcastMode({ s }: { s: Data }) {
  const mode = s.settings.mode,
    field = standings(
      s,
      s.competitions.find((c) => c.status === "Active"),
    ),
    teams = teamScores(s);
  if (mode === "Leaderboard Focus")
    return (
      <div className="mode-stage podium">
        <small>CHAMPIONSHIP PODIUM</small>
        <h2>Leaders of the field</h2>
        <div className="podium-steps">
          {[1, 0, 2].map((i) => {
            const a = field[i];
            return (
              a && (
                <div key={a.id} className={"step place-" + i}>
                  <em>0{i + 1}</em>
                  <b>{a.name}</b>
                  <span>{s.teams.find((t) => t.id === a.team)?.name}</span>
                  <strong>{a.sales}</strong>
                </div>
              )
            );
          })}
        </div>
      </div>
    );
  if (mode === "Team Battle") {
    const pair = teams.slice(0, 2);
    return (
      <div className="mode-stage battle">
        <small>TEAM CHAMPIONSHIP　/　HEAD TO HEAD</small>
        <h2>Team battle</h2>
        <div className="duel">
          {pair.map((t, i) => (
            <div key={t.id}>
              <Flag />
              <small>{i === 0 ? "LEADING SIDE" : "CHALLENGER"}</small>
              <h3>{t.name}</h3>
              <strong>{t.score}</strong>
              <p>Approved sales</p>
              <meter
                aria-label={t.name + " score share"}
                value={t.score}
                max={Math.max(
                  1,
                  pair.reduce((n, t) => n + t.score, 0),
                )}
              />
              <p>
                Top performer ·{" "}
                {standings(s).find((a) => a.team === t.id)?.name || "—"}
              </p>
            </div>
          ))}
          {pair.length === 2 && <b className="versus">VS</b>}
        </div>
        <small>
          LEAD MARGIN　+{(pair[0]?.score || 0) - (pair[1]?.score || 0)}
        </small>
      </div>
    );
  }
  if (mode === "Reward Ceremony") {
    const pool = s.prizes.filter((p) => p.active);
    return (
      <div className="mode-stage chamber-idle">
        <small>NEXUS　/　SPIN CHAMBER</small>
        {pool.length > 0 && <PrizeWheel segments={pool} index={0} />}
        <h2>Reward ceremony</h2>
        <p>Awaiting an authorized spin</p>
      </div>
    );
  }
  if (mode === "Standby")
    return (
      <div className="mode-stage standby">
        <NexusCore />
        <small>NEXUS COMMAND CENTER</small>
        <h2>{s.settings.brand} SALES ARENA</h2>
        <p>Standing by for competition</p>
      </div>
    );
  return null;
}
