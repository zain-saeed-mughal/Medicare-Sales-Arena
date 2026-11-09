import {
  day,
  type Data,
  type ArenaPeriod,
  type LeaderboardEntry,
} from "../admin/model";
import { periodSnapshot } from "../arenaPeriods";
import { progress, type Scope, type TargetProgress } from "../targets/engine";
export type Player = LeaderboardEntry & {
  teamLabel: string;
  badges: string[];
  target?: TargetProgress;
  change: number;
};
export function recognition(s: Data, period: ArenaPeriod) {
  const today = day(new Date().toISOString(), s.settings.timezone),
    snapshot = periodSnapshot(s, period, today),
    scope = period.split(" ")[0] as Scope,
    targets = progress(s).filter(
      (p) => p.rule.scope === scope && p.rule.showProgress !== false,
    );
  const players: Player[] = snapshot.field.map((a, i) => {
    const ps = targets
        .filter(
          (p) => p.rule.recipient === "Agent" && p.recipient === String(a.id),
        )
        .sort((a, b) => a.rule.threshold - b.rule.threshold),
      old =
        s.rankSnapshot?.day === today && period === "Daily Arena"
          ? s.rankSnapshot.baseline.indexOf(a.id)
          : -1;
    return {
      ...a,
      teamLabel: s.teams.find((t) => t.id === a.team)?.name || "Independent",
      target: ps.find((p) => p.remaining > 0) || ps.at(-1),
      change: old < 0 ? 0 : old - i,
      badges: s.targets.awards
        .filter(
          (w) =>
            w.recipient === String(a.id) &&
            w.rule.recipient === "Agent" &&
            w.rule.scope === scope &&
            w.period === snapshot.start &&
            !["Adjusted", "Rejected"].includes(w.status),
        )
        .map((w) => w.rule.threshold + " sales"),
    };
  });
  return {
    ...snapshot,
    players,
    targets,
    scope,
    today,
    rising: players
      .filter((p) => p.change > 0)
      .sort((a, b) => b.change - a.change)[0],
    near: targets
      .filter(
        (t) =>
          t.rule.recipient === "Agent" &&
          t.count > 0 &&
          t.remaining > 0 &&
          t.remaining <= s.broadcast.recognition.near,
      )
      .sort((a, b) => a.remaining - b.remaining)
      .filter(
        (t, i, arr) => arr.findIndex((x) => x.recipient === t.recipient) === i,
      )
      .slice(0, 3),
  };
}
export function hallOfFame(s: Data) {
  return s.competitions
    .filter(
      (c) =>
        ["Completed", "Archived"].includes(c.status) &&
        c.results?.length &&
        new Date(c.completedAt || c.end).getTime() <= Date.now(),
    )
    .sort((a, b) => b.end.localeCompare(a.end))
    .map((c) => {
      const original = c.results![0];
      const champion =
        c.type === "Team vs Team" && c.teamResults?.[0]
          ? {
              ...original,
              name: c.teamResults[0].name,
              team: c.teamResults[0].id,
              sales: c.teamResults[0].score,
              avatar: "",
            }
          : original;
      return {
        id: c.id,
        title: c.name,
        period: c.type,
        date: c.completedAt || c.end,
        start: c.start,
        end: c.end,
        champion,
        team:
          c.teamResults?.find((t) => t.id === champion.team)?.name ||
          s.teams.find((t) => t.id === champion.team)?.name ||
          champion.team,
        badges: s.targets.awards
          .filter(
            (a) =>
              a.recipient === String(champion.id) &&
              a.earned >= c.start &&
              a.earned <= c.end &&
              !["Adjusted", "Rejected"].includes(a.status),
          )
          .map((a) => a.rule.threshold + " sales"),
      };
    });
}
