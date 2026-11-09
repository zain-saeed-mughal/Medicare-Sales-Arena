import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Spotlight } from "../arenaEvents";
import type { BroadcastConfig, SoundKind } from "../broadcast/config";
import { Avatar, Crest } from "./Players";
import { AchievementBadge } from "./AchievementBadge";
import { Wheel } from "./Wheel";
import { playCue, stopAudio } from "./audio";
export function useVisible() {
  const [visible, set] = useState(!document.hidden);
  useEffect(() => {
    const update = () => set(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}
export function Ceremony({
  event,
  config,
  onFinish,
  showAmounts = false,
  bonusStatus,
  sound = false,
  preview = false,
  reduced = false,
  rehearsalPaused = false,
  rehearsalPhase,
  onStartSpin,
}: {
  event: Spotlight;
  config: BroadcastConfig;
  onFinish: (sequence: number) => void;
  showAmounts?: boolean;
  bonusStatus?: string;
  sound?: boolean;
  preview?: boolean;
  reduced?: boolean;
  rehearsalPaused?: boolean;
  rehearsalPhase?: string;
  onStartSpin?: (sequence: number) => Promise<unknown>;
}) {
  const reduceMotion = useReducedMotion() || reduced;
  const [locallyReleased, releaseLocal] = useState(false);
  const [starting, setStarting] = useState(false),
    [startError, setStartError] = useState("");
  const startPending = useRef(false);
  async function startSpin() {
    if (startPending.current) return;
    startPending.current = true;
    setStarting(true);
    setStartError("");
    try {
      if (preview || (event as Spotlight & { demo?: boolean }).demo)
        releaseLocal(true);
      else {
        if (!onStartSpin)
          throw Error(
            "Open the Live Arena in an authorized operator session to start this spin.",
          );
        await onStartSpin(event.sequence);
      }
      const wheelStep = phases.indexOf("wheel");
      if (wheelStep >= 0) set(wheelStep);
    } catch (e) {
      startPending.current = false;
      setStarting(false);
      setStartError((e as Error).message);
    }
  }
  const snapshot = useRef(structuredClone(config)).current,
    fx = snapshot.effects,
    wheel = snapshot.wheel,
    [step, set] = useState(0),
    visible = useVisible();
  const reward = event.prizeIndex !== undefined,
    threshold = event.target?.threshold || event.sales,
    category = event.category;
  const all =
    category === "champion" ||
    category === "top3" ||
    category === "team" ||
    category === "teamWin"
      ? [category]
      : [
          "approved",
          ...(event.target ? ["milestone", "bonus"] : []),
          ...(reward ? ["unlock", "chamber", "wheel", "result", "return"] : []),
        ];
  const requested =
    event.previewPhase === "rank"
      ? ["champion"]
      : event.previewPhase === "spotlight"
        ? ["spotlight"]
        : event.previewPhase
          ? all.slice(
              Math.max(
                0,
                all.indexOf(
                  event.previewPhase === "wheel"
                    ? "chamber"
                    : event.previewPhase,
                ),
              ),
            )
          : all;
  const phases = (preview && rehearsalPhase ? [rehearsalPhase] : requested)
    .filter(
      (p) =>
        (reward && ["chamber", "wheel", "result", "return"].includes(p)) ||
        snapshot.eventOverrides?.[p]?.enabled !== false,
    )
    .filter(
      (p) =>
        p === "result" ||
        p === "return" ||
        (p === "wheel" || p === "chamber"
          ? reward
          : ["champion", "top3", "team", "teamWin", "spotlight"].includes(p)
            ? fx.champion
            : p === "approved"
              ? fx.approved
              : p === "milestone"
                ? fx.milestone && event.target?.showMilestone !== false
                : p === "bonus"
                  ? fx.bonus &&
                    !!event.target?.minor &&
                    event.target?.showBonus !== false
                  : fx.unlock),
    );
  const selected = phases[step],
    waiting =
      (selected === "chamber" ||
        (selected === "result" && !preview && !phases.includes("wheel"))) &&
      !locallyReleased &&
      (preview ||
        (event as Spotlight & { demo?: boolean }).demo ||
        !config.wheel.released.includes(event.sequence)),
    phase = waiting ? "wait" : selected,
    paused =
      (preview && rehearsalPaused) ||
      (!preview && config.effects.paused) ||
      !visible;
  const duration: Record<string, number> = {
    approved: 4200,
    spotlight: 3000,
    milestone: threshold >= 10 ? 6500 : threshold >= 5 ? 5000 : 4200,
    bonus: 2400,
    unlock: 2000,
    chamber: 1800,
    wheel: wheel.duration * 1000 + 100,
    result: wheel.reveal * 1000,
    // 700 ms entrance + 6000 ms fully readable hold + 700 ms exit.
    return: 7400,
    champion: 4000,
    top3: 3500,
    team: 4000,
    teamWin: 5000,
  };
  // Store publishes also occur for rotation and queue bookkeeping. Those must
  // never stop/restart a playing sound or trigger the category cooldown.
  const audioSettings = JSON.stringify([
    config.audio,
    config.effects.volume,
    config.effects.soundSale,
    config.effects.soundMilestone,
    config.effects.soundSpin,
    config.effects.soundPrize,
    config.wheel.sound,
  ]);
  const timer = useRef({ phase: "", remaining: 0, startedAt: 0 });
  useEffect(() => {
    if (paused) return;
    if (!selected) {
      onFinish(event.sequence);
      return;
    }
    if (timer.current.phase !== selected)
      timer.current = {
        phase: selected,
        startedAt: 0,
        remaining: selected === "return" ? duration.return :
          (!["wheel", "result"].includes(selected) &&
          snapshot.eventOverrides?.[selected]?.seconds
            ? snapshot.eventOverrides[selected].seconds * 1000
            : duration[selected]) *
          (["wheel", "result"].includes(selected) ? 1 : fx.duration),
      };
    if (waiting) return;
    timer.current.startedAt = performance.now();
    const start = timer.current.startedAt,
      t = setTimeout(
        () =>
          step + 1 >= phases.length
            ? onFinish(event.sequence)
            : set((n) => n + 1),
        timer.current.remaining,
      );
    return () => {
      clearTimeout(t);
      timer.current.remaining = Math.max(
        0,
        timer.current.remaining - (performance.now() - start),
      );
    };
  }, [selected, step, paused, waiting, onFinish, event.sequence]);
  useEffect(() => {
    if (!sound || paused || waiting) {
      stopAudio();
      return;
    }
    const kind: SoundKind | undefined =
      phase === "approved"
        ? "sale"
        : phase === "milestone" || phase === "bonus"
          ? threshold === 2
            ? "milestone2"
            : threshold === 5
              ? "milestone5"
              : threshold === 10
                ? "milestone10"
                : "milestone"
          : phase === "unlock"
            ? "unlock"
            : phase === "wheel"
              ? "wheel"
              : phase === "result"
                ? "prize"
                : phase === "team" || phase === "teamWin"
                  ? "team"
                  : ["champion", "top3", "rank"].includes(phase)
                    ? "champion"
                    : undefined;
    if (!kind) return;
    const enabled =
      kind === "sale"
        ? config.effects.soundSale
        : kind.startsWith("milestone")
          ? config.effects.soundMilestone
          : kind === "wheel" || kind === "unlock"
            ? config.effects.soundSpin && config.wheel.sound
            : kind === "prize"
              ? config.effects.soundPrize
              : true;
    if (enabled)
      return playCue(
        kind,
        {
          ...snapshot,
          audio: config.audio,
          effects: { ...snapshot.effects, volume: config.effects.volume },
        },
        wheel.duration,
        event.segments?.length,
        preview || timer.current.remaining < (duration[selected] || 0),
        event.prizeIndex || 0,
        kind === "wheel"
          ? Math.max(
              0,
              (duration.wheel -
                timer.current.remaining +
                performance.now() -
                timer.current.startedAt) /
                1000,
            )
          : 0,
        !!reduceMotion,
      );
  }, [phase, sound, paused, waiting, audioSettings]);
  const [displayCount, setDisplayCount] = useState(
    Math.max(0, event.sales - 1),
  );
  useEffect(() => {
    if (phase !== "approved" || paused) return;
    const t = setTimeout(() => setDisplayCount(event.sales), 900);
    return () => clearTimeout(t);
  }, [phase, paused, event.sales]);
  if (!phase) return null;
  const title =
    phase === "approved"
      ? "SALE VALIDATED!"
      : phase === "champion"
        ? "NEW ARENA LEADER"
        : phase === "top3"
          ? "INTO THE TOP THREE"
          : phase === "team" || phase === "teamWin"
            ? phase === "teamWin"
              ? "TEAM CHAMPIONS"
              : "TEAM TAKES THE LEAD"
            : phase === "milestone"
              ? threshold === 2
                ? "FIRST MILESTONE UNLOCKED"
                : threshold === 5
                  ? "SUPERSTAR MILESTONE"
                  : threshold === 10
                    ? "LEGENDARY PERFORMANCE"
                    : (event.target?.scope?.toUpperCase() || "PERFORMANCE") +
                      " MILESTONE"
              : phase === "bonus"
                ? fx.bonusTitle
                : phase === "unlock"
                  ? wheel.announcement
                  : phase === "wait"
                    ? "YOUR SPIN IS READY"
                    : phase === "spotlight"
                      ? "AGENT SPOTLIGHT"
                      : phase === "return"
                        ? "THE CHAMPIONSHIP CONTINUES"
                        : "THE REWARD CHAMBER";
  const shownSegments = event.segments?.map((p) =>
    !showAmounts &&
    (p.monetary || /(?:PKR|USD|GBP|EUR|AED|INR|\$|£|€)\s*[\d,]/i.test(p.name))
      ? { ...p, name: "Cash reward", icon: "" }
      : p,
  );
  const status = bonusStatus || event.target?.status || "Pending Review",
    prize = shownSegments?.[event.prizeIndex ?? 0]?.name || "Assigned reward",
    demo = (event as Spotlight & { demo?: boolean }).demo;
  const hasBonus =
    !!event.target &&
    event.target.minor > 0 &&
    event.target.showBonus !== false &&
    fx.bonus;
  const bonusLabel =
    status === "Pending Review"
      ? "BONUS PENDING APPROVAL"
      : status === "Paid"
        ? "BONUS PAID"
        : status === "Approved"
          ? "BONUS APPROVED"
          : ["Rejected", "Adjusted"].includes(status)
            ? "BONUS " + status.toUpperCase()
            : "BONUS EARNED";
  const rewardScene = ["chamber", "wheel", "wait", "result", "return"].includes(
    phase,
  );
  const showCount =
    fx.sales !== false &&
    (phase === "approved" || fx.threshold) &&
    !["unlock", "wait", "chamber", "wheel", "result", "return"].includes(phase);
  return (
    <section
      className={"oe-ceremony cine-ceremony velocity-ceremony phase-" + phase}
      data-paused={paused}
      data-effect={wheel.effect}
      data-style={fx.style}
      data-event={event.eventId || event.sequence}
      data-category={
        threshold >= 10
          ? "legendary"
          : threshold >= 5
            ? "superstar"
            : "milestone"
      }
      aria-live="polite"
    >
      <div className="cine-light" aria-hidden="true" />
      <div className="tv-ceremony-architecture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="oe-ceremony-rail">
        <Crest className="ceremony-brand" />
        <span>{demo ? "VISUAL REHEARSAL" : "MEDICARE CHAMPIONSHIP"}</span>
        <span>
          {event.target?.scope || event.timeframe || "DAILY"} RECOGNITION
        </span>
      </div>
      <div
        className={
          "cine-stage " +
          (rewardScene && phase !== "result" && phase !== "return"
            ? "cine-wheel-stage"
            : "")
        }
        key={phase}
        style={
          {
            "--exit-delay":
              Math.max(
                0,
                ((!["wheel", "result"].includes(selected) &&
                  snapshot.eventOverrides?.[selected]?.seconds) ||
                  duration[selected] / 1000) *
                  (["wheel", "result"].includes(selected) ? 1 : fx.duration) -
                  0.3,
              ) + "s",
          } as React.CSSProperties
        }
      >
        {!["wheel", "chamber", "wait"].includes(phase) && (
          <motion.div
            className="cine-emblem"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, scale: 0.88, y: 18, rotateY: -12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
            transition={{
              type: "spring",
              stiffness: 135,
              damping: 20,
              mass: 1,
            }}
          >
            <div className="cine-orbit" />
            <AchievementBadge
              kind={
                phase === "result" || phase === "return"
                  ? "prize"
                  : phase === "unlock"
                    ? "unlock"
                    : phase === "approved"
                      ? "approval"
                      : "milestone"
              }
            />
          </motion.div>
        )}
        <div className="cine-copy">
          <div className="cine-heading">
            {phase === "result"
              ? "CONGRATULATIONS!"
              : phase === "bonus"
                ? fx.bonusTitle === "Bonus earned"
                  ? "TARGET ACHIEVED!"
                  : fx.bonusTitle.toUpperCase()
                : phase === "unlock"
                  ? wheel.announcement.toUpperCase()
                  : title}
          </div>
          <div className="cine-identity">
            {fx.avatar !== false && event.avatar && (
              <Avatar name={event.name} avatar={event.avatar} />
            )}
            <h2>{fx.agent ? event.name : "Performance recognized"}</h2>
          </div>
          {fx.team && <p className="cine-team">{event.team}</p>}
          {showCount && (
            <div className="cine-sales">
              <strong
                style={{
                  minWidth: Math.max(2, String(event.sales).length) + "ch",
                }}
              >
                {phase === "approved" ? displayCount : event.sales}
              </strong>{" "}
              <span>APPROVED SALES</span>
            </div>
          )}
          {phase === "result" || phase === "return" ? (
            <div className="oe-prize-copy cine-prize-panel">
              <small>YOU WON</small>
              <h3>{prize}</h3>
              <span>
                {demo ? "REHEARSAL · ORIGINAL RESULT" : "YOUR ASSIGNED REWARD"}
              </span>
            </div>
          ) : phase === "unlock" ? (
            <div className="cine-reward-ready">YOUR REWARD IS READY</div>
          ) : ["wheel", "chamber", "wait"].includes(phase) ? (
            <p className="cine-reward-ready">
              {waiting
                ? "Awaiting operator authorization"
                : phase === "wheel"
                  ? "YOUR MOMENT IS HERE"
                  : "An authorized reward is ready"}
            </p>
          ) : (
            hasBonus && (
              <div className="cine-bonus">
                <small>{bonusLabel}</small>
                {showAmounts && (
                  <strong>
                    {event.target!.currency}{" "}
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }).format(event.target!.minor / 100)}
                  </strong>
                )}
              </div>
            )
          )}
          {waiting && (
            <div className="cine-spin-action">
              <button
                className="cine-spin-button"
                disabled={starting || paused}
                onClick={() => void startSpin()}
              >
                {starting ? "STARTING…" : "SPIN THE WHEEL"}
              </button>
              {startError && <p role="alert">{startError}</p>}
            </div>
          )}
          {phase === "bonus" && fx.bonusSubtitle && (
            <p className="cine-caption">{fx.bonusSubtitle}</p>
          )}
        </div>
        {rewardScene && (
          <div
            className={
              phase === "result" || phase === "return"
                ? "cine-landed-wheel"
                : "cine-main-wheel"
            }
          >
            <Wheel
              index={event.prizeIndex ?? 0}
              segments={shownSegments}
              state={
                phase === "wheel"
                  ? "spin"
                  : ["result", "return"].includes(phase)
                    ? "landed"
                    : "idle"
              }
              duration={wheel.duration}
              flat={snapshot.recognition.quality === "Flat"}
              palette={wheel.palette}
            />
          </div>
        )}
        {["bonus", "milestone", "result", "unlock"].includes(phase) && (
          <div className="oe-confetti" aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => (
              <i key={i} style={{ "--i": i } as React.CSSProperties} />
            ))}
          </div>
        )}
      </div>
      <div className="oe-ceremony-baseline">
        <span>
          {waiting
            ? "AUTHORIZED MANUAL SPIN"
            : paused
              ? "PRESENTATION PAUSED"
              : "PERFORMANCE. RECOGNIZED."}
        </span>
        <span>
          {demo ? "NO REWARD ISSUED" : "LIVE SCORES CONTINUE UPDATING"}
        </span>
      </div>
    </section>
  );
}
