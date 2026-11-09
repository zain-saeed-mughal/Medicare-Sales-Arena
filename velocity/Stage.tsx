import { arenaDateBadge, formatArenaDateRange } from "../arenaPeriods";
import type { ArenaPeriod } from "../admin/model";
import { ChampionshipTopThree } from "./ChampionshipTopThree";
import { profile } from "../broadcast/config";
import { useEffect, useRef, useState, useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Crown,
  ArrowUpRight,
  Trophy,
  Target,
  Zap,
  ShieldCheck,
} from "lucide-react";
import type { Data } from "../admin/model";
import { type Player, recognition } from "../championship/data";
import {
  Avatar,
  TargetLine,
  TeamComparison,
} from "../championship/Players";

export function VelocityInsignia({ className = "" }: { className?: string }) {
  return (
    <img
      className={"tv-insignia official-brand-logo " + className}
      src="/brand/midnight-teal-emblem-transparent-v2.png"
      alt="Medicare Sales Arena"
    />
  );
}

export function PlayerCard({
  p,
  rank,
  s,
}: {
  p: Player;
  rank: number;
  s: Data;
}) {
  const b = s.broadcast.leaderboard,
    reduced = useReducedMotion() || s.settings.intensity === "Reduced";
  return (
    <motion.article
      layout="position"
      className={"tv-player tv-rank-" + rank}
      initial={reduced ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 170,
        damping: 24,
        delay: reduced ? 0 : rank * 0.09,
      }}
    >
      <span className="tv-card-number" aria-hidden="true">
        0{rank}
      </span>
      <div className="tv-player-top">
        <span className="tv-medallion">
          {rank === 1 ? <Crown /> : rank === 2 ? "II" : "III"}
        </span>
        <span>
          {rank === 1
            ? "GOLD STANDARD"
            : rank === 2
              ? "SILVER CONTENDER"
              : "BRONZE CONTENDER"}
        </span>
      </div>
      <div className="tv-player-identity">
        {b.avatars && <Avatar name={p.name} avatar={p.avatar} />}
        <div>
          <h3>{p.name}</h3>
          {b.topTeams && (
            <p style={{ color: profile(s, "team", p.team).color }}>
              {p.teamLabel}
            </p>
          )}
          {profile(s, "agent", p.id).badge && (
            <span
              className="tv-profile-badge"
              style={{ color: profile(s, "agent", p.id).color }}
            >
              {profile(s, "agent", p.id).badge}
            </span>
          )}
        </div>
      </div>
      <div className="tv-player-bottom">
        {b.topSales && (
          <div>
            <strong>{p.sales}</strong>
            <span>APPROVED SALES</span>
          </div>
        )}
        {b.changes && p.change > 0 && (
          <em>
            <ArrowUpRight />
            {p.change}
          </em>
        )}
      </div>
      <div className="tv-card-plinth" />
    </motion.article>
  );
}
function Hero({
  players,
  s,
  monthly,
}: {
  players: Player[];
  s: Data;
  monthly: boolean;
}) {
  const b = s.broadcast.leaderboard,
    p = b.champion ? players[0] : undefined;
  return (
    <section className={"tv-hero " + (monthly ? "tv-hero-finals" : "")}>
      <div className="tv-hero-track" aria-hidden="true" />
      <div className="tv-hero-copy">
        <div className="tv-kicker">
          <Crown />
          {monthly ? "MONTHLY GRAND CHAMPION" : "THE CHAMPION SPOTLIGHT"}
        </div>
        <h2>{p?.name || "Your moment awaits"}</h2>
        {p && profile(s, "agent", p.id).badge && (
          <span
            className="tv-profile-badge"
            style={{ color: profile(s, "agent", p.id).color }}
          >
            {profile(s, "agent", p.id).badge}
          </span>
        )}
        {b.teams && (
          <p
            className="tv-hero-team"
            style={p ? { color: profile(s, "team", p.team).color } : undefined}
          >
            {p?.teamLabel || "The next achievement starts here"}
          </p>
        )}
        <div className="tv-hero-score">
          {b.sales && (
            <>
              <strong>
                {p ? (
                  <VelocityCount
                    value={p.sales}
                    reduced={s.settings.intensity === "Reduced"}
                  />
                ) : (
                  "—"
                )}
              </strong>
              <span>
                APPROVED
                <br />
                SALES
              </span>
            </>
          )}
          {b.leadMargin !== false && p && (
            <div className="tv-lead">
              <ArrowUpRight />
              <b>+{Math.max(0, p.sales - (players[1]?.sales || 0))}</b>
              <small>LEAD MARGIN</small>
            </div>
          )}
        </div>
        {p && b.targets && <TargetLine player={p} />}
        <div className="tv-hero-signature">
          {monthly
            ? "EXCELLENCE, IMMORTALIZED."
            : "PERFORMANCE. IN FULL VELOCITY."}
        </div>
      </div>
      <div className="tv-hero-sculpture">
        <div className="tv-halo" />
        <div className="tv-halo halo-two" />
        <div className="tv-avatar-core">
          {p && b.avatars && p.avatar ? (
            <Avatar name={p.name} avatar={p.avatar} />
          ) : (
            <VelocityInsignia />
          )}
        </div>
        <div className="tv-orbit-caption">
          <span>RANK</span>
          <b>{p ? "01" : "—"}</b>
          <span>{monthly ? "FINALS" : "LEADER"}</span>
        </div>
        <div className="tv-dais">
          <span />
          <i />
        </div>
      </div>
    </section>
  );
}
export function VelocityStage({
  players,
  data,
  s,
  top3,
  mode = "Daily Arena",
}: {
  players: Player[];
  data: ReturnType<typeof recognition>;
  s: Data;
  top3: boolean;
  mode?: string;
}) {
  const championship = ["Daily Arena", "Weekly Arena", "Monthly Arena"].includes(mode),
    weekly = mode === "Weekly Arena",
    monthly = mode === "Monthly Arena";
  const competition = s.competitions.find((c) => c.status === "Active");
  const badge = championship
    ? arenaDateBadge(mode as ArenaPeriod, data.today, s.settings.timezone)
    : competition?.start && competition?.end
      ? formatArenaDateRange(competition.start, competition.end, s.settings.timezone)
      : arenaDateBadge((data.scope + " Arena") as ArenaPeriod, data.today, s.settings.timezone);
  return (
    <div
      className={
        "tv-stage " + (championship && top3 && players.length ? "tv-awards-stage " : "") +
        (weekly ? "tv-weekly" : monthly ? "tv-monthly" : "tv-daily")
      }
    >
      <div className="tv-stage-heading">
        <div>
          <span>
            {weekly
              ? "THE WEEKLY CHAMPIONSHIP"
              : monthly
                ? "THE MONTHLY CHAMPIONSHIP"
                : "THE DAILY CHAMPIONSHIP"}
          </span>
          <h2>
            {weekly
              ? "The Pursuit of Greatness."
              : monthly
                ? "A Month of Excellence."
                : "Every Sale Counts."}
          </h2>
        </div>
        <span className="tv-period-tag">
          {badge}
        </span>
      </div>
      {(!top3 || !players.length || !championship) && <Hero players={players} s={s} monthly={monthly} />}
      {top3 && players.length > 0 && (
        championship ? <ChampionshipTopThree key={mode} players={players} s={s} /> :
        <div className="tv-top-three" aria-label="Top three performers">
          {players.slice(0, 3).map((p, i) => <PlayerCard key={p.id} p={p} rank={i + 1} s={s} />)}
        </div>
      )}
      {championship && top3 && players.length > 0 && s.broadcast.leaderboard.teamRanks && (
        <div className="tv-teamrace"><TeamComparison data={data} /></div>
      )}
    </div>
  );
}

function VelocityCount({
  value,
  reduced,
}: {
  value: number;
  reduced: boolean;
}) {
  const prefers = useReducedMotion(),
    [shown, setShown] = useState(value),
    previous = useRef(value);
  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (reduced || prefers || document.hidden) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (time: number) => {
      const t = Math.min(1, (time - start) / 450);
      setShown(Math.round(from + (value - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced, prefers]);
  return <span aria-label={String(value)}>{shown}</span>;
}
