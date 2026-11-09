import { usePresentationTheme, themeAccent } from "../theme/Theme";
import { rewardSegment } from "../admin/rewardLabel";
import { quick } from "../broadcast/commands";
import { VelocityStage } from "../velocity/Stage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Maximize,
  Volume2,
  VolumeX,
  Flag,
  Crown,
  Radio,
  Target,
  Trophy,
  Users,
  CheckCheck,
} from "lucide-react";
import {
  useData,
  startRotation,
  finish,
  reportServiceError,
} from "../admin/service";
import {
  isArenaPeriod,
  day,
  standings,
  type Data,
  type ArenaPeriod,
} from "../admin/model";
import { useDisplayPresence } from "../admin/presence";
import { usePreviewData } from "../broadcast/Monitor";
import { displayData, profile } from "../broadcast/config";
import { recognition, type Player } from "./data";
import {
  Crest,
  Avatar,
  FeaturedPlayer,
  TopThree,
  WeeklyPodium,
  Radar,
  TeamDuel,
  TeamComparison,
  Hall,
  TargetRace,
} from "./Players";
import { Ceremony, useVisible } from "./Ceremony";
import {
  VictoryDaily,
  ChampionStage,
  CompetitionModules,
} from "../victory/Stages";
import { ArenaAudioControl } from "../victory/AudioControl";
import { Wheel } from "./Wheel";
import { activateAudio, stopAudio } from "./audio";
import "./championship.css";
function BroadcastClock({ timezone }: { timezone: string }) {
  const [date, set] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => set(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <time>
      {date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: timezone,
      })}
      <b>
        {date.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: timezone,
        })}
      </b>
    </time>
  );
}
function Standings({
  s,
  players,
  title,
}: {
  s: Data;
  players: Player[];
  title: string;
}) {
  const b = s.broadcast.leaderboard;
  return (
    <section className="oe-board">
      <div className="oe-board-heading">
        <div>
          <small>THE LIVE RANKINGS</small>
          <h2>{title}</h2>
        </div>
        <span>
          <i />
          {String(Math.min(s.settings.size, players.length)).padStart(
            2,
            "0",
          )}{" "}
          AGENTS
        </span>
      </div>
      <div className="oe-board-label">
        <span>RANK / COMPETITOR</span>
        <span>{b.sales ? "APPROVED" : ""}</span>
      </div>
      <ol
        style={
          {
            "--rows": Math.min(players.length, s.settings.size),
          } as React.CSSProperties
        }
      >
        {players.slice(0, s.settings.size).map((p, i) => (
          <motion.li
            layout={s.broadcast.effects.champion}
            transition={{ duration: 0.4 / s.broadcast.effects.transition }}
            key={p.id}
            className={
              (b.medals && i < 3 ? "oe-medal m" + i : "") + " oe-rank-row"
            }
          >
            <span className="oe-rank">{String(i + 1).padStart(2, "0")}</span>
            {b.avatars && <Avatar name={p.name} avatar={p.avatar} />}
            <div className="oe-rank-name">
              <strong>{p.name}</strong>
              {b.teams && (
                <small>
                  {p.teamLabel}
                  {profile(s, "agent", p.id).badge && (
                    <em style={{ color: profile(s, "agent", p.id).color }}>
                      {profile(s, "agent", p.id).badge}
                    </em>
                  )}
                </small>
              )}
              {b.targets && p.target && (
                <div className="oe-row-progress">
                  <progress
                    value={p.target.count}
                    max={p.target.rule.threshold}
                  />
                  <span>
                    {p.target.count}/{p.target.rule.threshold}
                  </span>
                </div>
              )}
            </div>
            {b.changes && (
              <span className={"oe-rank-change " + (p.change > 0 ? "up" : "")}>
                {p.change > 0
                  ? "↑ " + p.change
                  : p.change < 0
                    ? "↓ " + -p.change
                    : "—"}
              </span>
            )}
            {b.sales && <b className="oe-rank-score">{p.sales}</b>}
          </motion.li>
        ))}
      </ol>
      <div className="oe-board-foot">
        <span>APPROVED SALES ONLY</span>
        <span>PRECISION. PERFORMANCE. RECOGNITION.</span>
      </div>
    </section>
  );
}
function Ticker({ s, visible }: { s: Data; visible: boolean }) {
  const [i, set] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => set((n) => n + 1), 7500);
    return () => clearInterval(t);
  }, [visible]);
  return (
    <footer className="oe-ticker">
      <span>
        <Radio />
        ARENA LIVE
      </span>
      <p key={i}>
        {s.news[i % Math.max(1, s.news.length)] ||
          "Every achievement deserves recognition."}
      </p>
      <b>MEDICARE CHAMPIONSHIP</b>
    </footer>
  );
}
export function ChampionshipArena() {
  return <ArenaPresentation raw={useData()} />;
}
/** Isolated presenters never start writers, rotation, presence, or receive preview messages. */
export function ArenaPresentation({
  raw,
  isolated = false,
  ceremony,
  controls,
  headerNavigation,
  headerAudio,
}: {
  raw: Data;
  isolated?: boolean;
  ceremony?: React.ReactNode;
  controls?: React.ReactNode;
  headerNavigation?: React.ReactNode;
  headerAudio?: React.ReactNode;
}) {
  const monitor =
      isolated || new URLSearchParams(location.search).has("monitor"),
    preview = usePreviewData(raw, monitor && !isolated),
    s = useMemo(() => displayData(preview.store), [preview.store]),
    b = s.broadcast,
    mode = s.settings.mode,
    cfg = b.modes[mode] || b.modes["Daily Arena"],
    visible = useVisible(),
    [full, setFull] = useState(false),
    [audio, setAudio] = useState(false),
    [notice, setNotice] = useState("");
  const [date, setDate] = useState(
    day(new Date().toISOString(), s.settings.timezone),
  );
  useEffect(() => {
    const t = setInterval(
      () => setDate(day(new Date().toISOString(), s.settings.timezone)),
      30000,
    );
    return () => clearInterval(t);
  }, [s.settings.timezone]);
  const period: ArenaPeriod = isArenaPeriod(mode)
    ? mode
    : isArenaPeriod(b.leaderboard.period)
      ? b.leaderboard.period
      : "Daily Arena";
  const data = useMemo(() => recognition(s, period), [s, period, date]);
  const boardData = useMemo(
    () =>
      recognition(
        s,
        isArenaPeriod(b.leaderboard.period) ? b.leaderboard.period : period,
      ),
    [s, b.leaderboard.period, period, date],
  );
  let players = data.players,
    boardPlayers = boardData.players;
  if (mode === "Live Competition") {
    const competition = s.competitions.find((c) => c.status === "Active");
    players = standings(s, competition).map((a) => ({
      ...data.players.find((p) => p.id === a.id)!,
      ...a,
      teamLabel: s.teams.find((t) => t.id === a.team)?.name || "Independent",
      badges: data.players.find((p) => p.id === a.id)?.badges || [],
      change: 0,
    }));
    if (b.leaderboard.period === "Follow mode") boardPlayers = players;
  }
  const leader = players[0],
    playing = s.queue[0],
    complete = useCallback(
      (sequence: number) => {
        if (monitor) preview.clear();
        else void finish(sequence).catch(reportServiceError);
      },
      [monitor, preview.clear],
    );
  useEffect(() => (monitor ? undefined : startRotation()), [monitor]);
  useDisplayPresence(!monitor);
  useEffect(() => {
    const changed = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  useEffect(() => {
    if (!s.settings.sound || !visible) stopAudio();
  }, [s.settings.sound, visible]);
  const podium = cfg.podium,
    top3 =
      b.leaderboard.top3 &&
      (period === "Daily Arena"
        ? b.leaderboard.dailyTop3
        : period === "Weekly Arena"
          ? b.leaderboard.weeklyTop3
          : b.leaderboard.monthlyTop3),
    board = cfg.leaderboard,
    fullBoard = mode === "Leaderboard Focus",
    monthly = mode === "Monthly Arena",
    weekly = mode === "Weekly Arena";
  const targetMax = data.players.reduce(
      (n, p) => n + (p.target?.rule.threshold || 0),
      0,
    ),
    targetValue = data.players.reduce(
      (n, p) =>
        n + Math.min(p.target?.count || 0, p.target?.rule.threshold || 0),
      0,
    );
  const colorTheme = usePresentationTheme(
    b.appearance.theme,
    !!playing || !!ceremony,
  );
  const metrics = [
    {
      id: "Approved",
      label: weekly
        ? "WEEKLY APPROVALS"
        : monthly
          ? "MONTHLY APPROVALS"
          : "APPROVED SALES TODAY",
      value: data.approved,
      Icon: CheckCheck,
    },
    {
      id: "Agents",
      label: "ACTIVE AGENTS",
      value: data.players.filter((p) => p.active).length,
      Icon: Users,
    },
    {
      id: "Rewards",
      label: monthly
        ? "MONTHLY REWARDS"
        : weekly
          ? "WEEKLY REWARDS"
          : "REWARDS EARNED",
      value: data.rewards,
      Icon: Trophy,
    },
    {
      id: "Team",
      label: "LEADING TEAM",
      value: data.teams[0]?.name || "Open field",
      Icon: Flag,
    },
    {
      id: "Target",
      label: weekly
        ? "WEEKLY TARGETS REACHED"
        : monthly
          ? "MONTHLY TARGETS REACHED"
          : "DAILY TARGET PROGRESS",
      value:
        weekly || monthly
          ? data.targets.filter((t) => !t.remaining).length
          : targetMax
            ? Math.round((targetValue / targetMax) * 100) + "%"
            : "—",
      Icon: Target,
    },
    {
      id: "Submissions",
      label: "SUBMITTED SALES",
      value: data.submissions,
      Icon: Radio,
    },
  ].filter((m) => cfg.statistics.includes(m.id));
  return (
    <main
      className={
        "championship victory-studio titanium-velocity " +
        (fullBoard ? "oe-leaderboard-mode" : "") +
        (board ? " has-board" : "") +
        " board-left" +
        (b.recognition.championLayout === "Portrait" ? " portrait-layout" : "")
      }
      data-mode={mode}
      data-visible={visible}
      data-intensity={s.settings.intensity}
      data-theme={b.appearance.theme}
      data-color-theme={colorTheme}
      data-background={b.appearance.background}
      data-contrast={b.appearance.contrast}
      data-champion={b.appearance.championStyle}
      data-ranking={b.appearance.rankingStyle}
      data-density={b.leaderboard.density || "Comfortable"}
      data-tv-preset={b.typography?.preset || "Normal"}
      data-tv-weight={b.typography?.weight || "Original"}
      style={
        {
          "--emerald": b.appearance.accent,
          "--arena-accent":
            colorTheme === b.appearance.theme
              ? b.appearance.accent
              : themeAccent(colorTheme),
          "--speed": 1 / b.effects.transition + "s",
        } as React.CSSProperties
      }
    >
      <header className="oe-header">
        <div className="oe-brand">
          {b.branding.logo ? (
            <><img src={b.branding.logo} alt="Company logo" /><div><b>{s.settings.brand} <span>{s.settings.title}</span></b><small>{b.branding.office || "LIVE SALES & REWARDS"}</small></div></>
          ) : <Crest wordmark />}

        </div>
        <div className="oe-broadcast-title">
          <span>{cfg.title || mode.toUpperCase()}</span>
          <small>
            {b.branding.competition ||
              s.competitions.find((c) => c.status === "Active")?.name ||
              s.settings.title}
          </small>
          {headerNavigation}
        </div>
        <div className="oe-header-right">
          <span className="oe-live">
            <i />
            LIVE
          </span>
          <BroadcastClock timezone={s.settings.timezone} />
          {headerAudio ??
            (!monitor && (
              <ArenaAudioControl
                config={b}
                master={s.settings.sound}
                enabled={audio}
                onEnabled={setAudio}
              />
            ))}
          <button
            aria-label={full ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={async () => {
              try {
                if (full) await document.exitFullscreen();
                else await document.documentElement.requestFullscreen();
              } catch {
                setNotice(
                  "Fullscreen requires opening the Arena directly in the TV browser.",
                );
              }
            }}
          >
            <Maximize />
          </button>
        </div>
      </header>
      {notice && (
        <div className="oe-notice" role="status">
          {notice}
          <button onClick={() => setNotice("")}>Dismiss</button>
        </div>
      )}
      {b.appearance.metrics && metrics.length > 0 && (
        <section className="oe-metrics">
          {metrics.map(({ id, label, value, Icon }) => (
            <div key={id}>
              <small>
                <Icon />
                {label}
              </small>
              <b>{value}</b>
              {id === "Target" && targetMax > 0 && (
                <progress max={targetMax} value={targetValue} />
              )}
            </div>
          ))}
        </section>
      )}
      <div className="oe-content">
        <div className="oe-composition">
          {!fullBoard && (
            <section className="oe-recognition-stage">
              {!podium || (mode === "Hall of Fame" && !b.recognition.hall) ? (
                <div className="oe-standby">
                  <Crest wordmark />
                  <div className="oe-eyebrow">MEDICARE CHAMPIONSHIP</div>
                  <h2>Performance. Recognized.</h2>
                  <p>STANDING BY FOR THE NEXT ACHIEVEMENT</p>
                </div>
              ) : mode === "Hall of Fame" ? (
                <Hall s={s} />
              ) : mode === "Team Battle" && b.leaderboard.teamRanks ? (
                <TeamDuel s={s} data={data} />
              ) : mode === "Reward Ceremony" ? (
                <div className="oe-idle-chamber">
                  <div>
                    <div className="oe-eyebrow">EXCELLENCE HAS ITS REWARDS</div>
                    <h2>
                      Your next moment
                      <br />
                      is waiting.
                    </h2>
                    <p>The reward chamber opens for an authorized spin.</p>
                  </div>
                  <Wheel
                    index={0}
                    segments={s.prizes
                      .filter((p) => p.active)
                      .map(rewardSegment)}
                    flat={b.recognition.quality === "Flat"}
                    palette={b.wheel.palette}
                  />
                </div>
              ) : mode === "Standby" || !podium ? (
                <div className="oe-standby">
                  <Crest wordmark />
                  <div className="oe-eyebrow">MEDICARE CHAMPIONSHIP</div>
                  <h2>
                    Great things happen
                    <br />
                    when we rise together.
                  </h2>
                  <p>
                    {b.branding.office ||
                      "STANDING BY FOR THE NEXT ACHIEVEMENT"}
                  </p>
                </div>
              ) : (
                <VelocityStage
                  players={players}
                  data={data}
                  s={s}
                  top3={top3 && mode !== "Champion Spotlight"}
                  mode={mode}
                />
              )}
            </section>
          )}
          {board && (
            <Standings
              s={s}
              players={boardPlayers}
              title={
                (isArenaPeriod(b.leaderboard.period)
                  ? b.leaderboard.period.split(" ")[0]
                  : data.scope) + " leaderboard"
              }
            />
          )}
          {fullBoard && !board && (
            <div className="oe-standby">
              <Crest />
              <h2>Leaderboard paused</h2>
              <p>Enable its visibility in Arena Modes.</p>
            </div>
          )}
        </div>
        {ceremony}
        {playing && (
          <Ceremony
            key={(playing.eventId || "cue") + ":" + playing.sequence}
            event={playing}
            config={b}
            onFinish={complete}
            onStartSpin={
              monitor ? undefined : (sequence) => quick("Start spin", sequence)
            }
            sound={s.settings.sound && audio && !monitor}
            preview={monitor && preview.localEvent}
            reduced={s.settings.intensity === "Reduced"}
            showAmounts={s.targets.showAmounts}
            bonusStatus={
              s.targets.awards.find((a) => a.id === playing.target?.id)?.status
            }
          />
        )}
      </div>
      {b.appearance.ticker && <Ticker s={s} visible={visible} />}
      <div className="oe-transmission">
        <span>
          <i />
          LIVE SALES & REWARDS / LIVE
        </span>
        <span>
          {import.meta.env.DEV ? "DEVELOPMENT SIMULATOR" : "DEMONSTRATION DATA"}{" "}
          · {s.settings.timezone} · ARENA 01
        </span>
      </div>
      {controls}
    </main>
  );
}
