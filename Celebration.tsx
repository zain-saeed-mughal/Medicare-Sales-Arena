import { Wheel } from "./championship/Wheel";
import "./championship/championship.css";
import { defaults, type BroadcastConfig } from "./broadcast/config";
import { chime } from "./broadcast/audio";
import { NexusMark } from "./NexusCore";
import { useEffect, useState, useRef } from "react";
import { BadgeCheck, Gift, Crown } from "lucide-react";
import { prizes, type Spotlight } from "./arenaEvents";

export function PrizeWheel({
  index,
  segments = prizes.map((name, i) => ({
    name,
    color: i === 3 ? "#8b7340" : i % 2 ? "#14332d" : "#246151",
    icon: "",
  })),
}: {
  index: number;
  segments?: NonNullable<Spotlight["segments"]>;
}) {
  return <Wheel index={index} segments={segments} />;
}
export function Celebration({
  event,
  onFinish,
  showAmounts = false,
  bonusStatus,
  config = defaults(),
  sound = false,
  preview = false,
}: {
  config?: BroadcastConfig;
  sound?: boolean;
  preview?: boolean;
  event: Spotlight;
  showAmounts?: boolean;
  bonusStatus?: string;
  onFinish: (sequence: number) => void;
}) {
  const [step, setStep] = useState(0);
  const snapshot = useRef(structuredClone(config)).current,
    fx = snapshot.effects,
    wheel = snapshot.wheel;
  const reward = event.prizeIndex !== undefined;
  const milestone = !!event.target;
  const allPhases = [
    "approved",
    "spotlight",
    ...(milestone ? ["milestone", "bonus"] : []),
    ...(reward ? ["unlock", "wheel", "result"] : []),
  ];
  const requested =
    event.previewPhase === "rank"
      ? ["rank"]
      : event.previewPhase
        ? allPhases.slice(Math.max(0, allPhases.indexOf(event.previewPhase)))
        : allPhases;
  const phases = requested.filter(
    (p) =>
      p === "result" ||
      (p === "spotlight" || p === "rank"
        ? fx.champion
        : p === "wheel"
          ? fx.wheel && wheel.enabled
          : p === "milestone"
            ? fx.milestone && event.target?.showMilestone !== false
            : p === "bonus"
              ? fx.bonus && event.target?.showBonus !== false
              : fx[p as "approved" | "unlock"]),
  );
  const selected = phases[step];
  const waiting =
    (selected === "wheel" ||
      (selected === "result" && !phases.includes("wheel"))) &&
    wheel.initiation === "Authorized manual" &&
    !preview &&
    !config.wheel.released.includes(event.sequence);
  const phase = waiting ? "wait" : selected;
  const paused = config.effects.paused && !preview;
  const durations: Record<string, number> = {
    rank: 2200,
    approved: 1250,
    spotlight: 1900,
    milestone: 1600,
    bonus: 1900,
    unlock: 1700,
    wheel: wheel.duration * 1000 + 200,
    result: wheel.reveal * 1000,
  };
  const timerState = useRef({ phase: "", remaining: 0 });
  useEffect(() => {
    if (paused) return;
    if (!selected) {
      onFinish(event.sequence);
      return;
    }
    if (timerState.current.phase !== selected)
      timerState.current = {
        phase: selected,
        remaining:
          durations[selected] *
          (selected === "wheel" || selected === "result" ? 1 : fx.duration),
      };
    if (paused || waiting) return;
    const started = performance.now();
    const timer = setTimeout(
      () =>
        step + 1 >= phases.length
          ? onFinish(event.sequence)
          : setStep((n) => n + 1),
      timerState.current.remaining,
    );
    return () => {
      clearTimeout(timer);
      timerState.current.remaining = Math.max(
        0,
        timerState.current.remaining - (performance.now() - started),
      );
    };
  }, [selected, step, paused, waiting, onFinish, event.sequence]);
  const sounded = useRef("");
  useEffect(() => {
    if (!sound || paused || waiting || sounded.current === phase) return;
    sounded.current = phase;
    const enabled =
      phase === "approved"
        ? fx.soundSale
        : ["milestone", "bonus"].includes(phase)
          ? fx.soundMilestone
          : ["unlock", "wheel"].includes(phase)
            ? fx.soundSpin && wheel.sound
            : phase === "result"
              ? fx.soundPrize
              : false;
    if (enabled)
      chime(
        phase === "result" ? 880 : phase === "wheel" ? 440 : 660,
        fx.volume,
      );
  }, [phase, sound, paused, waiting]);
  const title =
    phase === "rank"
      ? "Rank advanced"
      : phase === "approved"
        ? "Sale approved"
        : phase === "spotlight"
          ? event.name
          : phase === "milestone"
            ? "Target achieved"
            : phase === "bonus"
              ? fx.bonusTitle || "Bonus earned"
              : phase === "unlock"
                ? wheel.announcement
                : phase === "wait"
                  ? "Spin ready"
                  : phase === "wheel"
                    ? "Reward ceremony"
                    : (event.segments?.[event.prizeIndex!]?.name ??
                      prizes[event.prizeIndex!]);
  return (
    <section
      className={"ceremony phase-" + phase}
      data-paused={paused}
      data-style={fx.style}
      data-effect={wheel.effect}
      style={
        { "--wheel-duration": wheel.duration + "s" } as React.CSSProperties
      }
      aria-live="polite"
    >
      <div className="ceremony-tag">
        {(event as Spotlight & { demo?: boolean }).demo
          ? "VISUAL REHEARSAL"
          : "ARENA LIVE"}
        　 /　{" "}
        {reward && step > 1 ? "REWARD PRESENTATION" : "SALES RECOGNITION"}
      </div>
      <div className="ceremony-content" key={phase}>
        {phase === "wheel" || phase === "result" || phase === "wait" ? (
          <PrizeWheel segments={event.segments} index={event.prizeIndex!} />
        ) : (
          <div className="medallion">
            {phase === "spotlight" ? (
              event.name
                .split(" ")
                .map((n) => n[0])
                .join("")
            ) : phase === "approved" ? (
              <BadgeCheck />
            ) : phase === "milestone" ? (
              <Crown />
            ) : (
              <Gift />
            )}
          </div>
        )}
        <small>
          {phase === "result"
            ? "PRIZE AWARDED"
            : phase === "spotlight"
              ? "AGENT SPOTLIGHT"
              : phase === "milestone"
                ? "MILESTONE BONUS"
                : phase === "bonus"
                  ? event.target?.name
                  : "DAILY CHAMPIONSHIP"}
        </small>
        <h2>
          {phase === "spotlight" && !fx.agent ? "Agent spotlight" : title}
        </h2>
        {waiting && (
          <div className="ceremony-wait">Awaiting operator authorization</div>
        )}
        {phase === "bonus" && fx.bonusSubtitle && <p>{fx.bonusSubtitle}</p>}
        {phase === "bonus" && event.target && (
          <p>
            {(bonusStatus || event.target.status) &&
            (bonusStatus || event.target.status) !== "Pending Review"
              ? "Bonus status · " + (bonusStatus || event.target.status)
              : "Earned · pending approval"}{" "}
            {showAmounts &&
            (event.target.id !== "rehearsal" || event.target.minor > 0)
              ? " · " +
                event.target.currency +
                " " +
                (event.target.minor / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })
              : ""}
          </p>
        )}
        <p>
          {[
            fx.agent && phase !== "spotlight" ? event.name : "",
            fx.team ? event.team : "",
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <div
        className="ceremony-score"
        style={{ visibility: fx.threshold ? "visible" : "hidden" }}
      >
        {event.target
          ? event.target.scope.toUpperCase() +
            " TARGET · " +
            event.target.threshold +
            " APPROVED SALES"
          : event.sales + " APPROVED SALES"}
      </div>
    </section>
  );
}
