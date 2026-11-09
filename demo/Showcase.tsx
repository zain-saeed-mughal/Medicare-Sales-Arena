import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { ArenaPresentation } from "../championship/Arena";
import { Ceremony } from "../championship/Ceremony";
import { seed } from "../admin/seed";
import type { Spotlight } from "../arenaEvents";
import type { SoundKind } from "../broadcast/config";
import {
  activateAudio,
  audioDiagnostics,
  playCue,
  stopAudio,
} from "../championship/audio";
import "./showcase.css";
const previews = [
  "Sale Approved",
  "2-Sale Milestone",
  "5-Sale Milestone",
  "10-Sale Milestone",
  "Bonus Earned",
  "Spin Unlocked",
  "Reward Wheel",
  "Prize Reveal",
  "New Champion",
] as const;
type Preview = (typeof previews)[number] | "Full Reward Ceremony";
type Job = {
  id: number;
  label: string;
  event?: Spotlight;
  phase?: string;
  sound?: SoundKind;
};
type State = {
  queue: Job[];
  paused: boolean;
  mode: "idle" | "auto" | "showcase" | "manual";
  ticks: number;
};
type Action =
  | { type: "start"; job: Job }
  | { type: "queue"; jobs: Job[]; all?: boolean }
  | { type: "tick"; job: Job }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "stop" }
  | { type: "finish"; id: number };
const initial: State = { queue: [], paused: false, mode: "idle", ticks: 0 };
function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "start":
      return s.mode === "auto"
        ? { ...s, paused: false }
        : {
            ...s,
            mode: "auto",
            paused: false,
            queue: s.queue.length ? s.queue : [a.job],
            ticks: 0,
          };
    case "queue":
      if (a.all && s.mode === "showcase") return s;
      return {
        ...s,
        mode: a.all ? "showcase" : s.mode === "idle" ? "manual" : s.mode,
        queue: [
          ...s.queue,
          ...a.jobs.filter((j) => !s.queue.some((q) => q.label === j.label)),
        ].slice(0, 24),
      };
    case "tick":
      return s.mode !== "auto" || s.paused
        ? s
        : {
            ...s,
            ticks: s.ticks + 1,
            queue: s.queue.length ? s.queue : [a.job],
          };
    case "pause":
      return { ...s, paused: true };
    case "resume":
      return { ...s, paused: false };
    case "stop":
      return initial;
    case "finish":
      if (s.queue[0]?.id !== a.id) return s;
      return {
        ...s,
        queue: s.queue.slice(1),
        mode: s.queue.length === 1 && s.mode !== "auto" ? "idle" : s.mode,
      };
  }
}
const soundTests: [string, SoundKind][] = [
  ["Sale Approved", "sale"],
  ["Small Milestone", "milestone2"],
  ["Major Milestone", "milestone10"],
  ["Spin Unlock", "unlock"],
  ["Wheel Spin", "wheel"],
  ["Prize Won", "prize"],
  ["Champion", "champion"],
];
export default function Showcase() {
  const [data] = useState(() => {
    const d = seed();
    d.queue = [];
    d.settings.simulate = false;
    d.settings.sound = true;
    d.broadcast.rotation = false;
    d.targets.showAmounts = true;
    return d;
  });
  const [state, dispatch] = useReducer(reducer, initial),
    [speed, setSpeed] = useState(5000),
    [collapsed, setCollapsed] = useState(false),
    [hidden, setHidden] = useState(false),
    [audio, setAudio] = useState(false),
    [muted, setMuted] = useState(false),
    [volume, setVolume] = useState(55),
    [quiet, setQuiet] = useState(false),
    [error, setError] = useState(""),
    [diagnostics, setDiagnostics] = useState(audioDiagnostics());
  const serial = useRef(0),
    current = state.queue[0];
  const config = useMemo(
    () => ({
      ...data.broadcast,
      audio: { ...data.broadcast.audio, quiet },
      effects: { ...data.broadcast.effects, volume },
    }),
    [data, volume, quiet],
  );
  const make = useCallback((label: Preview): Job => {
    const id = ++serial.current;
    const event: Spotlight & { demo: boolean } = {
      sequence: id,
      eventId: "isolated-demo-" + id,
      demo: true,
      name: "Sofia Reyes",
      team: "Team Summit",
      sales: 10,
      category: "sale",
    };
    let phase: string | undefined;
    if (label.includes("Milestone") || label === "Bonus Earned") {
      const threshold = label.startsWith("2-")
        ? 2
        : label.startsWith("5-")
          ? 5
          : 10;
      event.sales = threshold;
      event.target = {
        id: "demo-target",
        scope: "Daily",
        name: "Rehearsal target",
        threshold,
        minor: label === "Bonus Earned" ? 250000 : 0,
        currency: "PKR",
        status: "Approved",
      };
      phase = label === "Bonus Earned" ? "bonus" : "milestone";
    } else if (label === "Sale Approved") {
      event.sales = 2;
      phase = "approved";
    } else if (label === "New Champion") {
      event.category = "champion";
      phase = "champion";
    } else {
      event.segments = [
        { name: "Coffee card", color: "#43091c" },
        { name: "Team lunch", color: "#590b25" },
        { name: "PKR 5,000", color: "#720c30", monetary: true },
        { name: "Gold badge", color: "#310515" },
        { name: "Snack box", color: "#590b25" },
        { name: "Merch pack", color: "#43091c" },
      ];
      event.prizeIndex = 2;
      if (label === "Full Reward Ceremony") event.previewPhase = "unlock";
      else
        phase =
          label === "Spin Unlocked"
            ? "unlock"
            : label === "Prize Reveal"
              ? "result"
              : "wheel";
    }
    return { id, label, event, phase };
  }, []);
  const finish = useCallback(
    (id: number) => dispatch({ type: "finish", id }),
    [],
  );
  useEffect(() => {
    if (state.mode !== "auto" || state.paused) return;
    const t = setInterval(
      () => dispatch({ type: "tick", job: make("Sale Approved") }),
      speed,
    );
    return () => clearInterval(t);
  }, [state.mode, state.paused, speed, make]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === "KeyD") {
        e.preventDefault();
        setHidden((v) => !v);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setDiagnostics(audioDiagnostics()), 300);
    return () => {
      clearInterval(t);
      stopAudio();
    };
  }, []);
  const enabled = audio && !muted && volume > 0;
  useEffect(() => {
    if (!enabled || state.paused) stopAudio();
  }, [enabled, state.paused]);
  useEffect(() => {
    if (!current?.sound || state.paused) return;
    const cleanup = enabled
      ? playCue(current.sound, config, 5, 6, true, 2)
      : () => {};
    const t = setTimeout(
      () => finish(current.id),
      current.sound === "wheel"
        ? 5300
        : current.sound === "prize"
          ? 4100
          : 3200,
    );
    return () => {
      clearTimeout(t);
      cleanup();
    };
  }, [current?.id, state.paused, enabled, config, finish]);
  async function enable() {
    try {
      await activateAudio();
      setAudio(true);
      setMuted(false);
      setError("");
      stopAudio();
      playCue(
        "unlock",
        { ...config, effects: { ...config.effects, volume: volume || 55 } },
        1,
        6,
        true,
      );
      if (!volume) setVolume(55);
    } catch (e) {
      setAudio(false);
      setError((e as Error).message);
    }
  }
  function stop() {
    stopAudio();
    dispatch({ type: "stop" });
  }
  function queue(label: Preview) {
    dispatch({ type: "queue", jobs: [make(label)] });
  }
  function soundJob(label: string, sound: SoundKind): Job {
    return { id: ++serial.current, label: "Sound: " + label, sound };
  }
  const status = error
    ? "Audio Blocked / Unavailable"
    : !audio || diagnostics.state !== "running"
      ? "Activation Required"
      : muted || volume === 0
        ? "Muted"
        : "Sound Ready";
  const panel = (
    <>
      {!hidden && (
        <aside
          className={"demo-showcase " + (collapsed ? "is-collapsed" : "")}
          aria-label="Demo Showcase Controller"
          data-mode={state.mode}
          data-paused={state.paused}
          data-ticks={state.ticks}
        >
          <header>
            <strong>Demo Showcase</strong>
            <div>
              <button
                aria-label={
                  collapsed
                    ? "Expand demo controller"
                    : "Collapse demo controller"
                }
                onClick={() => setCollapsed((v) => !v)}
              >
                {collapsed ? "Open" : "Collapse"}
              </button>
              <button
                aria-label="Hide demo controller"
                onClick={() => setHidden(true)}
              >
                Hide
              </button>
            </div>
          </header>
          {!collapsed && (
            <div className="demo-body">
              <p className="demo-safety">
                ISOLATED REHEARSAL · No sales or rewards issued
              </p>
              <p className="demo-status" role="status">
                {state.paused ? "Paused · " : ""}
                {current?.label ||
                  (state.mode === "auto"
                    ? "Waiting for next demo sale"
                    : "Ready to preview")}
                {state.queue.length > 1
                  ? ` · ${state.queue.length - 1} queued`
                  : ""}
              </p>
              <label>
                Demo speed
                <select
                  aria-label="Demo speed"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                >
                  <option value={22000}>Normal — 22 seconds</option>
                  <option value={5000}>Fast — 5 seconds</option>
                  <option value={2000}>Ultra Fast — 2 seconds</option>
                </select>
              </label>
              <div className="demo-buttons">
                <button
                  onClick={() =>
                    dispatch({ type: "start", job: make("Sale Approved") })
                  }
                >
                  Start Demo
                </button>
                <button
                  disabled={state.mode === "idle"}
                  onClick={() =>
                    dispatch({ type: state.paused ? "resume" : "pause" })
                  }
                >
                  {state.paused ? "Resume Demo" : "Pause Demo"}
                </button>
                <button onClick={stop}>Stop Demo</button>
              </div>
              <button
                className="demo-featured"
                onClick={() => queue("Full Reward Ceremony")}
              >
                Play Full Reward Ceremony
              </button>
              <details open>
                <summary>Quick Preview</summary>
                <div className="demo-grid">
                  {previews.map((p) => (
                    <button key={p} onClick={() => queue(p)}>
                      {p}
                    </button>
                  ))}
                </div>
              </details>
              <div className="demo-buttons">
                <button
                  onClick={() =>
                    dispatch({
                      type: "queue",
                      jobs: previews.map(make),
                      all: true,
                    })
                  }
                >
                  Play All Animations
                </button>
                <button
                  disabled={!current}
                  onClick={() => {
                    stopAudio();
                    if (current) finish(current.id);
                  }}
                >
                  Skip Current
                </button>
              </div>
              <small>
                Pause / Resume and Stop above also control the showcase.
              </small>
              <details>
                <summary>Sound Test</summary>
                <button className="demo-featured" onClick={() => void enable()}>
                  Enable Demo Audio
                </button>
                <p role="status" data-demo-audio={status}>
                  {status} · {volume}%{quiet ? " · Quiet mode" : ""}
                </p>
                <div className="demo-buttons">
                  <button
                    onClick={() => {
                      stopAudio();
                      setMuted((v) => !v);
                    }}
                  >
                    {muted ? "Unmute" : "Mute"}
                  </button>
                  <label>
                    Quiet mode{" "}
                    <input
                      type="checkbox"
                      checked={quiet}
                      onChange={(e) => setQuiet(e.target.checked)}
                    />
                  </label>
                </div>
                <label>
                  Master Volume
                  <input
                    aria-label="Demo master volume"
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(+e.target.value)}
                  />
                </label>
                <div className="demo-grid">
                  {soundTests.map(([label, kind]) => (
                    <button
                      key={kind}
                      disabled={!enabled}
                      onClick={() =>
                        dispatch({
                          type: "queue",
                          jobs: [soundJob(label, kind)],
                        })
                      }
                    >
                      Test {label}
                    </button>
                  ))}
                  <button
                    disabled={!enabled}
                    onClick={() =>
                      dispatch({
                        type: "queue",
                        jobs: soundTests.map(([l, k]) => soundJob(l, k)),
                        all: true,
                      })
                    }
                  >
                    Test All Sounds
                  </button>
                </div>
              </details>
              <button onClick={() => void enable()}>
                {audio ? status : "Enable Audio · Test Chime"}
              </button>
              {error && <p role="alert">{error}</p>}
              <details>
                <summary>Audio Diagnostics</summary>
                <dl>
                  {Object.entries({
                    ...diagnostics,
                    masterVolume: volume,
                    soundEnabled: enabled,
                    quietMode: quiet,
                    browserActivation:
                      navigator.userActivation?.hasBeenActive ?? "Unavailable",
                  }).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{String(v)}</dd>
                    </div>
                  ))}
                </dl>
                <p>
                  If you hear nothing, unmute this Chrome tab/site, check Chrome
                  in Windows Volume Mixer, and select connected speakers as the
                  Windows output. Browser signal does not confirm speaker
                  output.
                </p>
              </details>
              <small>
                Hide removes the panel completely. Ctrl+Shift+D restores it.
                Cinematic timings stay unchanged; busy automatic ticks are
                deferred.
              </small>
            </div>
          )}
        </aside>
      )}
    </>
  );
  return (
    <ArenaPresentation
      raw={data}
      isolated
      controls={panel}
      ceremony={
        current?.event ? (
          <Ceremony
            key={current.id}
            event={current.event}
            config={config}
            onFinish={finish}
            preview
            rehearsalPhase={current.phase}
            rehearsalPaused={state.paused}
            sound={enabled}
            showAmounts
          />
        ) : undefined
      }
    />
  );
}
