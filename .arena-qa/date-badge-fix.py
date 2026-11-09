from pathlib import Path
p=Path('arenaPeriods.ts');s=p.read_text(encoding='utf-8');s=s.replace('import { day, type ArenaPeriod, type Data } from "./admin/model";','import { day, type ArenaPeriod, type Data } from "./admin/model";\nimport { periodStart, type Scope } from "./targets/engine";')
start=s.index('  const monday =');end=s.index('  function inPeriod',start)
s=s[:start]+'''  const { start } = arenaPeriodBounds(period, today);
'''+s[end:]
s+='''

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
  return /^\\d{4}-\\d{2}-\\d{2}$/.test(value) ? value : day(value, timezone);
}
export function formatArenaDateRange(startValue: string, endValue: string, timezone: string) {
  const start = businessDate(startValue, timezone);
  const end = businessDate(endValue, timezone);
  const format = (value: string, year: boolean) =>
    value.slice(5, 7) + "/" + value.slice(8, 10) + (year ? "/" + value.slice(0, 4) : "");
  if (start === end) return format(start, true);
  const crossYear = start.slice(0, 4) !== end.slice(0, 4);
  return format(start, crossYear) + " \\u2014 " + format(end, crossYear);
}
export function arenaDateBadge(period: ArenaPeriod, anchor: string, timezone: string) {
  const { start, end } = arenaPeriodBounds(period, anchor);
  return formatArenaDateRange(start, end, timezone);
}
'''
p.write_text(s,encoding='utf-8')
p=Path('velocity/Stage.tsx');s=p.read_text(encoding='utf-8');s='import { arenaDateBadge, formatArenaDateRange } from "../arenaPeriods";\nimport type { ArenaPeriod } from "../admin/model";\n'+s
s=s.replace('  return (\n    <div\n      className={\n        "tv-stage "', '''  const competition = s.competitions.find((c) => c.status === "Active");
  const badge = championship
    ? arenaDateBadge(mode as ArenaPeriod, data.today, s.settings.timezone)
    : competition?.start && competition?.end
      ? formatArenaDateRange(competition.start, competition.end, s.settings.timezone)
      : arenaDateBadge((data.scope + " Arena") as ArenaPeriod, data.today, s.settings.timezone);
  return (
    <div
      className={
        "tv-stage "''')
start=s.index('          {data.start.slice(5)');end=s.index('\n        </span>',start);s=s[:start]+'          {badge}'+s[end:];p.write_text(s,encoding='utf-8')
p=Path('championship/data.ts');s=p.read_text(encoding='utf-8').replace('        date: c.completedAt || c.end,','        date: c.completedAt || c.end,\n        start: c.start,\n        end: c.end,');p.write_text(s,encoding='utf-8')
p=Path('championship/Players.tsx');s=p.read_text(encoding='utf-8');s='import { formatArenaDateRange } from "../arenaPeriods";\n'+s
start=s.index('                  {new Date(h.date)');end=s.index('\n                </small>',start)
s=s[:start]+'                  {formatArenaDateRange(h.start, h.end, s.settings.timezone)}'+s[end:]
p.write_text(s,encoding='utf-8')
