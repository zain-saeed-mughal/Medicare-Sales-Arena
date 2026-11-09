import { motion, useReducedMotion } from "motion/react";
import {
  Trophy,
  Crown,
  ArrowUpRight,
  Target,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Data } from "../admin/model";
import { Avatar, Crest, TargetLine } from "../championship/Players";
import { type Player, recognition } from "../championship/data";
export function PremiumRankBadge({ rank }: { rank: number }) {
  return (
    <span className={"vx-rank-badge tier-" + rank}>
      <b>{String(rank).padStart(2, "0")}</b>
      <small>RANK</small>
    </span>
  );
}
export function FeaturedPlayerCard({
  player,
  rank,
  s,
}: {
  player: Player;
  rank: number;
  s: Data;
}) {
  const b = s.broadcast.leaderboard,
    reduced = useReducedMotion() || s.settings.intensity === "Reduced";
  return (
    <motion.article
      layout="position"
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 22,
        delay: reduced ? 0 : (rank - 1) * 0.12,
      }}
      className={"vx-player-card tier-" + rank}
    >
      <div className="vx-card-cut" />
      <PremiumRankBadge rank={rank} />
      <div className="vx-card-identity">
        {b.avatars && <Avatar name={player.name} avatar={player.avatar} />}
        <div>
          <h3>{player.name}</h3>
          {b.topTeams && <p>{player.teamLabel}</p>}
        </div>
      </div>
      <div className="vx-card-score">
        {b.topSales && (
          <div className="vx-score-group">
            <strong>{player.approved ?? player.sales}</strong>
            <span>
              APPROVED
              <br />
              SALES
            </span>
            {player.submitted !== undefined && (
              <small className="vx-submitted-chip">
                {player.submitted} SUBMITTED
              </small>
            )}
          </div>
        )}
        {b.changes && player.change > 0 && <em>↑ {player.change}</em>}
      </div>
      <div className="vx-card-foot">
        {rank === 1
          ? "CHAMPIONSHIP LEADER"
          : rank === 2
            ? "SILVER CONTENDER"
            : "BRONZE CONTENDER"}
      </div>
    </motion.article>
  );
}
export function TopThreeDeck({ players, s }: { players: Player[]; s: Data }) {
  return (
    <section className="vx-deck">
      <div className="vx-label">
        <Trophy />
        THE ELITE THREE
      </div>
      {players.slice(0, 3).map((p, i) => (
        <FeaturedPlayerCard player={p} rank={i + 1} s={s} key={p.id} />
      ))}
    </section>
  );
}
export function ProgressRing({ value, max }: { value: number; max: number }) {
  const percent = Math.min(100, Math.max(0, max ? (value / max) * 100 : 0));
  return (
    <div
      className="vx-progress-ring"
      style={{ "--progress": percent + "%" } as React.CSSProperties}
    >
      <span>
        {Math.round(percent)}
        <small>%</small>
      </span>
    </div>
  );
}
export function ChampionStage({
  player,
  runnerUp,
  s,
  monthly = false,
  leadingTeam,
}: {
  player?: Player;
  runnerUp?: Player;
  s: Data;
  monthly?: boolean;
  leadingTeam?: string;
}) {
  const b = s.broadcast.leaderboard;
  return (
    <section className={"vx-champion-stage " + (monthly ? "vx-finals" : "")}>
      <div className="vx-stage-beams" />
      <div className="vx-stage-top">
        <span>
          <Crown />
          {monthly ? "MONTHLY CHAMPION" : "CHAMPION SPOTLIGHT"}
        </span>
        <b>VICTORY / 01</b>
      </div>
      <div className="vx-champion-portrait" key={player?.id || "empty"}>
        <div className="vx-orbit orbit-back" />
        <div className="vx-portrait-shell">
          {player ? (
            <Avatar
              name={player.name}
              avatar={b.avatars ? player.avatar : undefined}
            />
          ) : (
            <Crest />
          )}
          <div className="vx-portrait-rank">
            <Crown />
            01
          </div>
        </div>
        <div className="vx-orbit orbit-front" />
        <div className="vx-platform">
          <div className="vx-platform-surface" />
          <div className="vx-platform-rim" />
          <div className="vx-platform-light" />
        </div>
      </div>
      {monthly && leadingTeam && (
        <aside className="vx-finals-team">
          <ShieldCheck />
          <small>BEST TEAM</small>
          <b>{leadingTeam}</b>
          <span>MONTHLY COMPETITION</span>
        </aside>
      )}
      <div className="vx-champion-nameplate">
        <small>
          {monthly
            ? "THE MONTH. THE MOMENT. THE CHAMPION."
            : "PERFORMANCE THAT SETS THE STANDARD"}
        </small>
        <h2>{player?.name || "Your stage awaits."}</h2>
        {b.teams && (
          <p>{player?.teamLabel || "The next champion starts here"}</p>
        )}
        <div className="vx-champion-numbers">
          {b.sales && (
            <div>
              <strong>{player?.approved ?? player?.sales ?? "—"}</strong>
              <span>APPROVED SALES</span>
            </div>
          )}
          {player?.submitted !== undefined && (
            <div className="vx-champion-submitted">
              <strong>{player.submitted}</strong>
              <span>SUBMITTED SALES</span>
            </div>
          )}
          {b.leadMargin !== false && player && (
            <div className="vx-margin">
              <b>+{Math.max(0, (player.approved ?? player.sales) - ((runnerUp?.approved ?? runnerUp?.sales) || 0))}</b>
              <span>LEAD MARGIN</span>
            </div>
          )}
        </div>
        {player && b.targets && <TargetLine player={player} />}
      </div>
      <div className="vx-stage-bottom">
        <span>MEDICARE SALES ARENA</span>
        <span>{monthly ? "CHAMPIONSHIP FINALS" : "LIVE COMPETITION"}</span>
      </div>
    </section>
  );
}
export function CompetitionModules({
  data,
  s,
}: {
  data: ReturnType<typeof recognition>;
  s: Data;
}) {
  const near = data.near[0],
    team = data.teams[0];
  return (
    <div className="vx-modules">
      {s.broadcast.leaderboard.teamRanks && (
        <article className="vx-team-module">
          <ShieldCheck />
          <div>
            <small>LEADING TEAM</small>
            <b>{team?.name || "Open competition"}</b>
            <span>{team?.score || 0} approved sales</span>
          </div>
        </article>
      )}
      {s.broadcast.recognition.rising && (
        <article className="vx-rising-module">
          <ArrowUpRight />
          <div>
            <small>RISING STAR</small>
            <b>{data.rising?.name || "The race is on"}</b>
            <span>
              {data.rising
                ? "↑ " + data.rising.change + " positions gained"
                : "Awaiting a recorded rank climb"}
            </span>
          </div>
        </article>
      )}
      {s.broadcast.recognition.radar && (
        <article className="vx-target-module">
          <ProgressRing
            value={near?.count || 0}
            max={near?.rule.threshold || 1}
          />
          <div>
            <small>NEXT TARGET</small>
            <b>{near?.name || "Every sale counts"}</b>
            <span>
              {near
                ? near.remaining + " to " + near.rule.threshold + " approved"
                : "No nearby target"}
            </span>
          </div>
        </article>
      )}
      <article className="vx-reward-module">
        <Sparkles />
        <div>
          <small>REWARDS EARNED</small>
          <b>{data.rewards}</b>
          <span>{data.scope} achievements</span>
        </div>
      </article>
    </div>
  );
}
export function VictoryDaily({
  players,
  data,
  s,
  top3,
}: {
  players: Player[];
  data: ReturnType<typeof recognition>;
  s: Data;
  top3: boolean;
}) {
  return (
    <div className="vx-daily">
      <div className="vx-period-metrics-strip" aria-label="Daily sales performance metrics">
        <div className="vx-metric-chip">
          <small>SUBMITTED TODAY</small>
          <b>{data.submissions}</b>
        </div>
        <div className="vx-metric-chip vx-chip-approved">
          <small>APPROVED TODAY</small>
          <strong>{data.approved}</strong>
        </div>
        <div className="vx-metric-chip vx-chip-pending">
          <small>PENDING VALIDATION</small>
          <span>{data.pending ?? Math.max(0, data.submissions - data.approved)}</span>
        </div>
        <div className="vx-metric-chip">
          <small>ACTIVE AGENTS</small>
          <b>{data.activeAgents ?? data.scorers}</b>
        </div>
      </div>
      <div className={"vx-main-stage " + (!top3 ? "no-deck" : "")}>
        {top3 && <TopThreeDeck players={players} s={s} />}
        <ChampionStage
          player={s.broadcast.leaderboard.champion ? players[0] : undefined}
          runnerUp={players[1]}
          s={s}
        />
      </div>
      <CompetitionModules data={data} s={s} />
    </div>
  );
}
