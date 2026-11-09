import { formatArenaDateRange } from "../arenaPeriods";
import { useEffect, useState, useId } from "react";
import {
  Crown,
  Medal,
  ArrowUpRight,
  Flag,
  Star,
  Target,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import type { Data } from "../admin/model";
import { profile } from "../broadcast/config";
import { hallOfFame, type Player, recognition } from "./data";
export function Crest({ className = "", wordmark = false }: { className?: string; wordmark?: boolean }) {
  return (
    <img
      className={"oe-crest official-brand-logo " + (wordmark ? "official-wordmark " : "") + className}
      src={wordmark ? "/brand/midnight-teal-wordmark-transparent-v2.png" : "/brand/midnight-teal-emblem-transparent-v2.png"}
      alt="Medicare Sales Arena"
    />
  );
}

export function Avatar({
  name,
  avatar,
  className = "",
}: {
  name: string;
  avatar?: string;
  className?: string;
}) {
  return (
    <div className={"oe-avatar " + className}>
      {avatar ? (
        <img src={avatar} alt="" />
      ) : (
        <span>
          {name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </span>
      )}
    </div>
  );
}
export function Badges({ items }: { items: string[] }) {
  return (
    <div className="oe-badges">
      {items.slice(0, 3).map((n, i) => (
        <span key={i}>
          <Star size={12} />
          {n}
        </span>
      ))}
    </div>
  );
}
export function TargetLine({ player }: { player: Player }) {
  const t = player.target;
  return t ? (
    <div className="oe-target-line">
      <div>
        <span>{t.remaining ? "NEXT TARGET" : "TARGET ACHIEVED"}</span>
        <b>
          {t.count}
          <em> / {t.rule.threshold}</em>
        </b>
      </div>
      <progress max={t.rule.threshold} value={t.count} />
    </div>
  ) : (
    <div className="oe-target-line">
      <span>APPROVED SALES · LIVE STANDINGS</span>
    </div>
  );
}
export function FeaturedPlayer({
  player,
  monthly = false,
  s,
}: {
  player: Player | undefined;
  monthly?: boolean;
  s: Data;
}) {
  if (!player)
    return (
      <div className="oe-empty">
        <Crest />
        <h2>The next champion starts here.</h2>
        <p>Awaiting approved performance.</p>
      </div>
    );
  return (
    <section
      className={"oe-feature " + (monthly ? "finals" : "")}
      key={player.id}
    >
      <div className="oe-feature-copy">
        <div className="oe-eyebrow">
          <Crown />
          {monthly ? "MONTHLY CHAMPION" : "LEADING THE FIELD"}
        </div>
        <h2>{player.name}</h2>
        <p className="oe-feature-team">
          <span />
          {player.teamLabel}
        </p>
        <div className="oe-feature-score">
          <strong>{String(player.sales).padStart(2, "0")}</strong>
          <div>
            APPROVED SALES
            <small>{monthly ? "MONTH TO DATE" : "TODAY’S PERFORMANCE"}</small>
          </div>
        </div>
        <Badges items={player.badges} />
        {s.broadcast.leaderboard.targets && <TargetLine player={player} />}
      </div>
      <div className="oe-feature-portrait">
        <div className="oe-portrait-lines" />
        <span className="oe-giant-rank">01</span>
        <Avatar
          name={player.name}
          avatar={s.broadcast.leaderboard.avatars ? player.avatar : undefined}
        />
        <div className="oe-player-seal">
          <Crown />
          <span>
            MEDICARE
            <br />
            <b>{monthly ? "MONTHLY HONORS" : "DAILY CHAMPION"}</b>
          </span>
        </div>
      </div>
    </section>
  );
}
export function TopThree({ players, s }: { players: Player[]; s: Data }) {
  return (
    <section className="oe-top-three">
      <div className="oe-section-label">
        <span>THE TOP THREE</span>
        <span>APPROVED PERFORMANCE</span>
      </div>
      <div className="oe-top-list">
        {players.slice(0, 3).map((p, i) => (
          <article key={p.id} className={"oe-medal m" + i}>
            <span className="oe-place">0{i + 1}</span>
            {s.broadcast.leaderboard.avatars && (
              <Avatar name={p.name} avatar={p.avatar} />
            )}
            <div className="oe-top-name">
              <b>{p.name}</b>
              {s.broadcast.leaderboard.topTeams && <small>{p.teamLabel}</small>}
              {s.broadcast.leaderboard.changes && p.change > 0 && (
                <em>↑ {p.change} positions</em>
              )}
            </div>
            {s.broadcast.leaderboard.topSales && <strong>{p.sales}</strong>}
          </article>
        ))}
      </div>
    </section>
  );
}
export function WeeklyPodium({
  players,
  s,
  start,
  end,
}: {
  players: Player[];
  s: Data;
  start: string;
  end: string;
}) {
  return (
    <section
      className={
        "oe-weekly " +
        (s.broadcast.leaderboard.podiumStyle === "Cards" ? "cards" : "")
      }
    >
      <div className="oe-stage-heading">
        <div>
          <div className="oe-eyebrow">THE WEEK IN EXCELLENCE</div>
          <h2>Champions rise together.</h2>
        </div>
        <span>
          {start.slice(5).replace("-", " / ")} —{" "}
          {end.slice(5).replace("-", " / ")}
        </span>
      </div>
      <div className="oe-podium">
        {[1, 0, 2].map((i) => {
          const p = players[i];
          return (
            <article
              key={p?.id ?? i}
              className={"oe-podium-player oe-medal m" + i}
            >
              <div className="oe-podium-halo" />
              {i === 0 && <Crown className="oe-crown" />}
              <Avatar
                name={p?.name || "—"}
                avatar={s.broadcast.leaderboard.avatars ? p?.avatar : undefined}
              />
              <span className="oe-podium-rank">
                <Medal />
                RANK 0{i + 1}
              </span>
              <h3>{p?.name || "Open position"}</h3>
              {s.broadcast.leaderboard.topTeams && (
                <p>{p?.teamLabel || "Awaiting performance"}</p>
              )}
              {s.broadcast.leaderboard.topSales && (
                <div className="oe-podium-score">
                  <strong>{p?.sales ?? "—"}</strong>
                  <small>APPROVED SALES</small>
                </div>
              )}
              {p && s.broadcast.leaderboard.targets && (
                <TargetLine player={p} />
              )}
              <Badges items={p?.badges || []} />
              <span className="oe-podium-foot">
                {i === 0 ? "WEEKLY LEADER" : "CHAMPIONSHIP CONTENDER"}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
export function Radar({
  data,
  s,
}: {
  data: ReturnType<typeof recognition>;
  s: Data;
}) {
  const b = s.broadcast;
  return (
    <div className="oe-radar">
      {b.recognition.rising && (
        <div className="oe-rising">
          <ArrowUpRight />
          <span>
            RISING STAR<b>{data.rising?.name || "The race is on"}</b>
          </span>
          <strong>{data.rising ? "↑" + data.rising.change : "—"}</strong>
        </div>
      )}
      {b.recognition.radar && (
        <div className="oe-next">
          <Target />
          <span>
            NEXT TARGET
            {data.near.length ? (
              <b>
                {data.near[0].name}{" "}
                <em>
                  {data.near[0].remaining}{" "}
                  {data.near[0].remaining === 1 ? "sale" : "sales"} away
                </em>
              </b>
            ) : (
              <b>Every approval moves the field forward.</b>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
function TeamShield() {
  const gradient = useId();
  return (
    <div className="oe-team-badge">
      <svg
        className="oe-team-shield-frame"
        viewBox="0 0 112 112"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--maroon-tone-7)" />
            <stop offset="1" stopColor="var(--maroon-tone-3)" />
          </linearGradient>
        </defs>
        <path
          d="M 1 1 H 111 V 83.5 L 56 111 L 1 83.5 Z"
          fill={`url(#${gradient})`}
          stroke="var(--maroon-tone-14)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <ShieldCheck className="oe-team-shield-icon" />
    </div>
  );
}
export function TeamDuel({
  s,
  data,
}: {
  s: Data;
  data: ReturnType<typeof recognition>;
}) {
  const teams = data.teams.slice(0, 2);
  return (
    <div className="oe-duel">
      <div className="oe-stage-heading">
        <div>
          <div className="oe-eyebrow">
            {data.scope.toUpperCase()} TEAM COMPETITION
          </div>
          <h2>One team. Every contribution.</h2>
        </div>
        <Flag />
      </div>
      <div className="oe-duel-field">
        {teams.map((t, i) => {
          const agent = data.players.find((a) => a.team === t.id),
            target = data.targets.find(
              (p) => p.rule.recipient === "Team" && p.recipient === t.id,
            );
          return (
            <section
              key={t.id}
              className={"oe-team side-" + i}
              style={
                {
                  "--team": profile(s, "team", t.id).color,
                } as React.CSSProperties
              }
            >
              <TeamShield />
              <small>{i === 0 ? "SETTING THE PACE" : "IN THE CHASE"}</small>
              <h3>{t.name}</h3>
              <b className="oe-team-score" key={t.score}>
                {t.score}
              </b>
              <p>APPROVED SALES</p>
              <div className="oe-team-contributor">
                <Avatar name={agent?.name || "—"} avatar={agent?.avatar} />
                <span>
                  TOP CONTRIBUTOR<b>{agent?.name || "Open field"}</b>
                </span>
              </div>
              {target && s.broadcast.leaderboard.targets && (
                <div className="oe-team-target">
                  <span>
                    Team target · {target.count}/{target.rule.threshold}
                  </span>
                  <progress max={target.rule.threshold} value={target.count} />
                </div>
              )}
            </section>
          );
        })}
        <div className="oe-versus">
          VS<span>LEAD MARGIN</span>
          <b>+{(teams[0]?.score || 0) - (teams[1]?.score || 0)}</b>
        </div>
      </div>
    </div>
  );
}
export function TeamComparison({
  data,
}: {
  data: ReturnType<typeof recognition>;
}) {
  const pair = data.teams.slice(0, 2),
    max = Math.max(1, ...pair.map((t) => t.score));
  return (
    <div className="oe-comparison">
      <span>TEAM CHAMPIONSHIP</span>
      {pair.map((t, i) => (
        <div key={t.id}>
          <small>{i === 0 ? "01" : "02"}</small>
          <b>{t.name}</b>
          <progress value={t.score} max={max} />
          <strong>{t.score}</strong>
        </div>
      ))}
    </div>
  );
}
export function Hall({ s, compact = false }: { s: Data; compact?: boolean }) {
  const [page, setPage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      if (!document.hidden) setPage((n) => n + 1);
    }, 12000);
    return () => clearInterval(t);
  }, []);
  const history = hallOfFame(s).filter(
    (h) =>
      profile(s, "agent", h.champion.id).visible &&
      profile(s, "team", h.champion.team).visible,
  );
  if (compact)
    return (
      <div className="oe-history-strip">
        <Trophy />
        <span>CHAMPION HISTORY</span>
        <b>
          {history[0]
            ? history[0].champion.name + " · " + history[0].title
            : "The next chapter is being written."}
        </b>
      </div>
    );
  return (
    <section className="oe-hall">
      <div className="oe-stage-heading">
        <div>
          <div className="oe-eyebrow">A LEGACY OF EXCELLENCE</div>
          <h2>Hall of champions.</h2>
        </div>
        <Crest />
      </div>
      {history.length ? (
        <div className="oe-hall-grid">
          {history
            .slice(
              (page % Math.max(1, Math.ceil(history.length / 4))) * 4,
              (page % Math.max(1, Math.ceil(history.length / 4))) * 4 + 4,
            )
            .map((h) => (
              <article key={h.id}>
                <small>
                  {formatArenaDateRange(h.start, h.end, s.settings.timezone)}
                </small>
                <Crown />
                <Avatar name={h.champion.name} avatar={h.champion.avatar} />
                <h3>{h.champion.name}</h3>
                <p>{h.team}</p>
                <strong>
                  {h.champion.sales}
                  <span>APPROVED SALES</span>
                </strong>
                <Badges items={h.badges} />
                <footer>{h.title}</footer>
              </article>
            ))}
        </div>
      ) : (
        <div className="oe-empty">
          <Crest />
          <h3>Great performances become history.</h3>
          <p>
            Champions appear here when a competition is completed and its
            results are saved.
          </p>
        </div>
      )}
    </section>
  );
}

export function TargetRace({ data }: { data: ReturnType<typeof recognition> }) {
  const near = data.players
    .filter((p) => p.target && p.target.count > 0 && p.target.remaining > 0)
    .sort((a, b) => a.target!.remaining - b.target!.remaining)
    .slice(0, 3);
  return (
    <div className="oe-target-race">
      <span>TARGET RACE</span>
      {near.length ? (
        near.map((p) => (
          <div key={p.id}>
            <b>{p.name}</b>
            <small>
              {p.target!.count} / {p.target!.rule.threshold} approved
            </small>
            <progress value={p.target!.count} max={p.target!.rule.threshold} />
          </div>
        ))
      ) : (
        <div>
          <b>
            {data.targets.filter((t) => !t.remaining).length} targets reached
          </b>
          <small>Every approval moves the championship forward.</small>
        </div>
      )}
    </div>
  );
}
