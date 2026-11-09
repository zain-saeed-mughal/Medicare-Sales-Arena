import { day, type ArenaPeriod, type Data } from "./admin/model";
import { periodStart, type Scope } from "./targets/engine";

export function periodSnapshot(
  store: Data,
  period: ArenaPeriod,
  today: string,
) {
  const { start } = arenaPeriodBounds(period, today);
  function inPeriod(stamp: string) {
    if (!stamp) return false;
    const date = day(stamp, store.settings.timezone);
    return date >= start && date <= today;
  }
  const agentSales = new Map<number, number>(),
    teamSales = new Map<string, number>();
  let submissions = 0,
    approved = 0;
  for (const sale of store.sales) {
    if (inPeriod(sale.submitted)) submissions++;
    if (sale.status !== "Approved" || !inPeriod(sale.reviewed)) continue;
    approved++;
    agentSales.set(sale.agent, (agentSales.get(sale.agent) || 0) + 1);
    teamSales.set(sale.team, (teamSales.get(sale.team) || 0) + 1);
  }
  const field = store.agents
    .map((a) => ({ ...a, sales: agentSales.get(a.id) || 0 }))
    .sort((a, b) => b.sales - a.sales || a.id - b.id);
  const teams = store.teams
    .map((t) => ({ ...t, score: teamSales.get(t.id) || 0 }))
    .sort((a, b) => b.score - a.score);
  const rewards = store.spins.filter(
    (sp) => !sp.voided && inPeriod(sp.completed),
  ).length;
  return {
    field,
    teams,
    submissions,
    approved,
    scorers: agentSales.size,
    rewards,
    start,
    today,
  };
}


// Calendar display bounds are distinct from the scoring cutoff (today above).
// Date-only arithmetic uses UTC after the business timezone has selected the day.
export function arenaPeriodBounds(period: ArenaPeriod, anchor: string) {
  const scope = period.split(" ")[0] as Scope;
  const start = periodStart(anchor, scope);
  const end = new Date(start + "T00:00:00Z");
  if (scope === "Weekly") end.setUTCDate(end.getUTCDate() + 6);
  if (scope === "Monthly") end.setUTCMonth(end.getUTCMonth() + 1, 0);
  return { start, end: end.toISOString().slice(0, 10) };
}

function businessDate(value: string, timezone: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : day(value, timezone);
}
export function formatArenaDateRange(startValue: string, endValue: string, timezone: string) {
  const start = businessDate(startValue, timezone);
  const end = businessDate(endValue, timezone);
  const format = (value: string, year: boolean) =>
    value.slice(5, 7) + "/" + value.slice(8, 10) + (year ? "/" + value.slice(0, 4) : "");
  if (start === end) return format(start, true);
  const crossYear = start.slice(0, 4) !== end.slice(0, 4);
  return format(start, crossYear) + " \u2014 " + format(end, crossYear);
}
export function arenaDateBadge(period: ArenaPeriod, anchor: string, timezone: string) {
  const { start, end } = arenaPeriodBounds(period, anchor);
  return formatArenaDateRange(start, end, timezone);
}
