import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArenaPresentation, ChampionshipArena } from "../championship/Arena";
import { Ceremony } from "../championship/Ceremony";
import { stopAudio, playCue } from "../championship/audio";
import { ArenaAudioControl } from "../victory/AudioControl";
import { preview, useData } from "../admin/service";
import type { SoundKind } from "./config";
import type { ArenaEvent } from "../admin/model";
import "./preview-navigation.css";
const examples = [
  "Sale Approved",
  "Target Achieved",
  "Bonus Earned",
  "Spin Unlocked",
  "Reward Wheel",
  "Prize Reveal",
  "New Champion",
  "Team Takes the Lead",
  "Full Reward Ceremony",
];
const kinds: Record<string, string> = {
  "Target Achieved": "Target Milestone Preview",
  "Bonus Earned": "Bonus Popup Preview",
  "Spin Unlocked": "Reward Spin Unlocked",
  "Reward Wheel": "Reward Wheel Result",
  "Prize Reveal": "Reward Wheel Result",
  "Team Takes the Lead": "Team Lead Change",
  "Full Reward Ceremony": "Reward Spin Unlocked",
};
const phases: Record<string, string> = {
  "Sale Approved": "approved",
  "Target Achieved": "milestone",
  "Bonus Earned": "bonus",
  "Spin Unlocked": "unlock",
  "Prize Reveal": "result",
  "New Champion": "champion",
  "Team Takes the Lead": "team",
};
type Item = { event: ArenaEvent; label: string; phase?: string };
export default function ArenaPreview() {
  const raw = useData();
  const [mode, setMode] = useState<string>(),
    [hidden, setHidden] = useState(false),
    [exited, setExited] = useState(false);
  const [queue, setQueue] = useState<Item[]>([]),
    [last, setLast] = useState<Item>(),
    [paused, setPaused] = useState(false),
    [audio, setAudio] = useState(false),
    [error, setError] = useState("");
  const serial = useRef(Date.now()),
    nextIndex = useRef(0);
  const current = queue[0];
  const [selected, setSelected] = useState("Sale Approved");
  const data = useMemo(
    () => ({
      ...raw,
      queue: [] as ArenaEvent[],
      settings: { ...raw.settings, mode: mode ?? raw.settings.mode },
      broadcast: { ...raw.broadcast, rotation: false },
    }),
    [raw, mode],
  );
  const finish = useCallback((sequence: number) => {
    setQueue((q) => (q[0]?.event.sequence === sequence ? q.slice(1) : q));
    setPaused(false);
  }, []);
  useEffect(() => () => stopAudio(), []);
  function launch(label: string) {
    try {
      const clone = structuredClone(data);
      clone.queue = [];
      const rule = clone.targets.rules.find(
        (r) => r.active && (label !== "Bonus Earned" || r.minor > 0),
      );
      preview(clone, kinds[label] || label, rule?.id);
      const cue = clone.queue.at(-1);
      if (!cue)
        throw Error("Add an active agent before previewing celebrations.");
      if (
        [
          "Reward Wheel",
          "Prize Reveal",
          "Spin Unlocked",
          "Full Reward Ceremony",
        ].includes(label) &&
        cue.prizeIndex === undefined
      )
        throw Error("Configure an active prize before previewing the wheel.");
      if (label === "Bonus Earned" && !cue.target?.minor)
        throw Error("Configure a bonus target to preview its amount.");
      const item = {
        event: { ...cue, sequence: ++serial.current },
        label,
        phase: phases[label],
      };
      setQueue((q) => (q.length < 12 ? [...q, item] : q));
      setLast(item);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function exit() {
    stopAudio();
    setQueue([]);
    const url = new URL(location.href);
    url.searchParams.delete("preview");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    setExited(true);
  }
  if (exited) return <ChampionshipArena />;
  const more = Object.keys(raw.broadcast.modes).filter(
    (m) => !["Daily Arena", "Weekly Arena", "Monthly Arena"].includes(m),
  );
  return (
    <ArenaPresentation
      raw={data}
      isolated
      headerAudio={
        <ArenaAudioControl
          config={raw.broadcast}
          master={raw.settings.sound}
          enabled={audio}
          onEnabled={setAudio}
        />
      }
      headerNavigation={
        !hidden && (
          <nav
            className="arena-preview-nav"
            aria-label="Temporary Arena preview"
          >
            {["Daily", "Weekly", "Monthly"].map((n) => (
              <button
                key={n}
                aria-pressed={data.settings.mode === n + " Arena"}
                onClick={() => setMode(n + " Arena")}
              >
                {n}
              </button>
            ))}
            <select
              aria-label="More Modes"
              value={
                more.includes(data.settings.mode) ? data.settings.mode : ""
              }
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="" disabled>
                More Modes
              </option>
              {more.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <button onClick={() => launch("Prize Reveal")}>
              Rewards Preview
            </button>
            <button onClick={() => launch("Reward Wheel")}>
              Spin Wheel Preview
            </button>
          </nav>
        )
      }
      controls={
        hidden ? (
          <button
            className="arena-preview-reopen"
            onClick={() => setHidden(false)}
          >
            Show Preview Controls
          </button>
        ) : (
          <aside className="arena-preview-tools" aria-label="Preview controls">
            <span>
              LOCAL PREVIEW{" "}
              {queue.length > 1 ? `· ${queue.length - 1} queued` : ""}
            </span>
            <select
              aria-label="Celebration preview"
              value=""
              onChange={(e) => { setSelected(e.target.value); launch(e.target.value); }}
            >
              <option value="" disabled>
                Celebrations…
              </option>
              {examples.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <button onClick={() => launch(selected)}>Play</button>
            <button className="preview-featured" onClick={() => launch("Full Reward Ceremony")}>PLAY FULL REWARD CEREMONY</button>
            <button onClick={() => { stopAudio(); setQueue([]); setPaused(false); }}>Stop</button>
            <select aria-label="Sound preview" value="" disabled={!audio || !!current || !raw.settings.sound}
              onChange={(e) => { stopAudio(); playCue(e.target.value as SoundKind, raw.broadcast, 5, 6, true); }}>
              <option value="" disabled>Sound tests...</option>
              {([["sale","Sale Approved"],["milestone","Target Achieved"],["unlock","Spin Unlocked"],["wheel","Wheel Spinning"],["prize","Prize Won"],["champion","New Champion"]] as const).map(([kind,label]) => <option key={kind} value={kind}>{label}</option>)}
            </select>
            <button
              onClick={() => {
                if (current) {
                  stopAudio();
                  finish(current.event.sequence);
                } else launch(examples[nextIndex.current++ % examples.length]);
              }}
            >
              Next Animation
            </button>
            <button
              disabled={!last}
              onClick={() => {
                if (!last) return;
                stopAudio();
                setPaused(false);
                setQueue([
                  {
                    ...last,
                    event: { ...last.event, sequence: ++serial.current },
                  },
                  ...queue.slice(current ? 1 : 0),
                ]);
              }}
            >
              Replay
            </button>
            <button disabled={!current} onClick={() => setPaused((v) => !v)}>
              {paused ? "Resume" : "Pause"}
            </button>
            <button onClick={() => setHidden(true)}>Hide Controls</button>
            <button onClick={exit}>Exit Preview</button>
            {error && <span role="alert">{error}</span>}
          </aside>
        )
      }
      ceremony={
        current && (
          <Ceremony
            key={current.event.sequence}
            event={current.event}
            config={raw.broadcast}
            onFinish={finish}
            preview
            rehearsalPhase={current.phase}
            rehearsalPaused={paused}
            sound={audio && raw.settings.sound}
            showAmounts={raw.targets.showAmounts}
            reduced={raw.settings.intensity === "Reduced"}
          />
        )
      }
    />
  );
}
