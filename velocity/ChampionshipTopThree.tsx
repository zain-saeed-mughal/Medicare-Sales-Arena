import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Crown, Medal, ArrowUpRight } from "lucide-react";
import { Avatar } from "../championship/Players";
import { profile } from "../broadcast/config";
import type { Data } from "../admin/model";
import type { Player } from "../championship/data";

function Score({ value, reduced }: { value: number; reduced: boolean }) {
  const previous = useRef(0), [shown, setShown] = useState(reduced ? value : 0);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (reduced || document.hidden) { setShown(value); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1100);
      setShown(Math.round(from + (value - from) * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return <strong aria-label={String(value)}>{shown}</strong>;
}

function ChampionshipCard({ player: p, rank, s, reduced }: {
  player: Player; rank: number; s: Data; reduced: boolean;
}) {
  const prior = useRef(rank), [promoted, setPromoted] = useState(false);
  const b = s.broadcast.leaderboard;
  useEffect(() => {
    const improved = rank < prior.current;
    prior.current = rank;
    if (!improved) return;
    setPromoted(true);
    const timer = setTimeout(() => setPromoted(false), 2200);
    return () => clearTimeout(timer);
  }, [rank]);
  return <motion.article layout={reduced ? false : "position"}
    data-agent={p.id} data-rank={rank}
    style={{ gridColumn: rank === 1 ? 2 : rank === 2 ? 1 : 3 }}
    className={"champion-award award-" + rank + (promoted ? " award-promoted" : "")}
    initial={reduced ? false : { opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ opacity: { duration: .7, delay: reduced ? 0 : rank === 1 ? .45 : rank === 2 ? 0 : .2 },
      y: { duration: .85, delay: reduced ? 0 : rank === 1 ? .45 : rank === 2 ? 0 : .2 },
      layout: { type: "spring", stiffness: 120, damping: 24, duration: reduced ? 0 : .6 } }}
    aria-label={"Rank " + rank + ": " + p.name + ", " + p.sales + " approved sales"}>
    <div className="award-reflection" aria-hidden="true" />
    <header className="award-header">
      <div className="award-medal">{rank === 1 ? <Crown /> : <Medal />}<span>{rank === 1 ? "I" : rank === 2 ? "II" : "III"}</span></div>
      <p>{rank === 1 ? "GOLD CHAMPION" : rank === 2 ? "SILVER CONTENDER" : "BRONZE CONTENDER"}</p>
    </header>
    <div className="award-identity">
      {b.avatars && <div className="award-avatar"><Avatar name={p.name} avatar={p.avatar} /></div>}
      <h3 title={p.name}>{p.name}</h3>
      {b.topTeams && <p style={{ color: profile(s, "team", p.team).color }}>{p.teamLabel}</p>}
      {profile(s, "agent", p.id).badge && <span className="award-profile">{profile(s, "agent", p.id).badge}</span>}
    </div>
    <div className="award-result">
      {b.topSales && <div className="award-sales"><Score value={p.sales} reduced={reduced} /><span>APPROVED SALES</span></div>}
      <span className="award-rank" aria-hidden="true">0{rank}</span>
      {b.changes && p.change > 0 && <small className="award-movement"><ArrowUpRight />{p.change} places</small>}
    </div>
    <div className="award-foot" aria-hidden="true"><span />{rank === 1 ? "CHAMPIONSHIP LEADER" : "CHAMPIONSHIP CONTENDER"}<span /></div>
  </motion.article>;
}

export function ChampionshipTopThree({ players, s }: { players: Player[]; s: Data }) {
  const prefers = useReducedMotion();
  const reduced = !!prefers || s.settings.intensity === "Reduced";
  const podium = [players[1] && { p: players[1], rank: 2 }, players[0] && { p: players[0], rank: 1 }, players[2] && { p: players[2], rank: 3 }].filter(Boolean) as { p: Player; rank: number }[];
  return <div className={"championship-top-three" + (reduced ? " awards-reduced" : "")} aria-label="Top three performers">
    {podium.map(({ p, rank }) => <ChampionshipCard key={p.id} player={p} rank={rank} s={s} reduced={reduced} />)}
  </div>;
}
