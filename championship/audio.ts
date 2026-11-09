import type { BroadcastConfig, SoundKind } from "../broadcast/config";
let context: AudioContext | undefined,
  analyser: AnalyserNode | undefined,
  limiter: DynamicsCompressorNode | undefined;
let scheduledNotes = 0,
  lastCue = "None",
  lastRequest = "None",
  lastError = "",
  lastDisposition = "Activation required",
  serial = 0;
const live = new Set<AudioScheduledSourceNode>();
const envelopes = new Map<AudioScheduledSourceNode, GainNode>();
type Request = {
  id: number;
  kind: SoundKind;
  config: BroadcastConfig;
  duration: number;
  segments: number;
  offset: number;
  seek: number;
  reduced: boolean;
  expires: number;
};
let active:
  | {
      id: number;
      kind: SoundKind;
      nodes: AudioScheduledSourceNode[];
      timer: ReturnType<typeof setTimeout>;
    }
  | undefined;
const pending: Request[] = [],
  last = new Map<SoundKind, number>();
const priority: Record<SoundKind, number> = {
  sale: 1,
  milestone2: 2,
  milestone5: 3,
  milestone10: 4,
  milestone: 2,
  unlock: 3,
  wheel: 3,
  prize: 5,
  champion: 4,
  team: 4,
};
export function audioDiagnostics() {
  let rms = 0;
  if (analyser && context?.state === "running") {
    const a = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(a);
    rms = Math.sqrt(a.reduce((n, v) => n + v * v, 0) / a.length);
  }
  return {
    state: context?.state || "inactive",
    rms,
    scheduledNotes,
    lastCue,
    sampleRate: context?.sampleRate || 0,
    activeNodes: live.size,
    currentEvent: active?.kind || "None",
    lastRequest,
    lastError,
    lastDisposition,
    queuedSounds: pending.length,
  };
}
export async function activateAudio() {
  try {
    if (!context || context.state === "closed") {
      context = new AudioContext({ latencyHint: "interactive" });
      analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 12;
      limiter.ratio.value = 4;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.2;
      limiter.connect(analyser);
      analyser.connect(context.destination);
    }
    await context.resume();
    if (context.state !== "running")
      throw Error(
        "Audio Blocked: Chrome did not resume audio. Click Enable Audio again and check site sound permissions.",
      );
    lastError = "";
    lastDisposition = "Activated; speaker output not detectable";
  } catch (e) {
    lastError = (e as Error).message;
    throw e;
  }
}
function cancel(nodes: AudioScheduledSourceNode[]) {
  for (const n of nodes) {
    try {
      const g = envelopes.get(n);
      if (context && g) {
        g.gain.cancelAndHoldAtTime(context.currentTime);
        g.gain.linearRampToValueAtTime(0, context.currentTime + 0.012);
      }
      n.stop((context?.currentTime || 0) + 0.015);
    } catch (error) {
      // Stopping an already-ended source is benign; other audio failures remain diagnosable.
      if (!(error instanceof DOMException && error.name === "InvalidStateError")) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error("Audio cleanup failed", error);
      }
    }
  }
}
export function stopAudio() {
  pending.length = 0;
  if (active) {
    clearTimeout(active.timer);
    cancel(active.nodes);
    active = undefined;
  }
  lastDisposition = "Stopped / muted";
}
const onVisibility = () => { if (document.hidden) stopAudio(); };
if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);
if (import.meta.hot) import.meta.hot.dispose(() => {
  document.removeEventListener("visibilitychange", onVisibility);
  stopAudio();
  if (context && context.state !== "closed") void context.close().catch(error => console.error("Audio shutdown failed", error));
});
/** Same cubic-bezier(.18,.01,.12,1) used by the wheel rotor. */
export function wheelEase(t: number) {
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 18; i++) {
    const u = (lo + hi) / 2,
      x =
        3 * (1 - u) * (1 - u) * u * 0.18 +
        3 * (1 - u) * u * u * 0.12 +
        u * u * u;
    if (x < t) lo = u;
    else hi = u;
  }
  const u = (lo + hi) / 2;
  return 3 * (1 - u) * (1 - u) * u * 0.01 + 3 * (1 - u) * u * u + u * u * u;
}
/** Initial pointer is over a segment centre; boundaries occur at half segments. */
export function wheelTickTimes(
  duration: number,
  segments: number,
  prizeIndex = 0,
) {
  const distance = Math.max(1, segments * 4 - prizeIndex),
    times: number[] = [];
  for (let boundary = 0.5; boundary < distance; boundary++) {
    let lo = 0,
      hi = 1;
    for (let i = 0; i < 20; i++) {
      const t = (lo + hi) / 2;
      if (wheelEase(t) < boundary / distance) lo = t;
      else hi = t;
    }
    times.push(((lo + hi) / 2) * duration);
  }
  return times;
}
const scores: Record<Exclude<SoundKind, "wheel">, number[]> = {
  sale: [587.33, 880],
  milestone2: [440, 659.25],
  milestone5: [440, 587.33, 880],
  milestone10: [293.66, 440, 587.33, 739.99, 880, 1174.66],
  milestone: [587.33, 739.99, 880],
  unlock: [440, 659.25, 880, 1174.66],
  prize: [293.66, 440, 587.33, 739.99, 880, 1174.66],
  champion: [293.66, 440, 587.33, 880, 1174.66],
  team: [440, 554.37, 830.61],
};
export function cueDuration(kind: SoundKind, duration = 5) {
  return kind === "wheel"
    ? duration + 0.12
    : kind === "sale"
      ? 1.05
      : kind === "prize"
        ? 3.8
        : kind === "milestone10" || kind === "champion"
          ? 3
          : kind === "unlock"
            ? 1.8
            : 1.6;
}
function pump() {
  if (active || !context || context.state !== "running") return;
  const request = pending.shift();
  if (!request) return;
  if (request.expires < Date.now()) {
    pump();
    return;
  }
  const { kind, config, duration, segments, id, offset, seek, reduced } =
      request,
    ctx = context,
    nodes: AudioScheduledSourceNode[] = [];
  const gain =
    ((Math.sqrt(Math.max(0, Math.min(100, config.effects.volume)) / 100) *
      Math.max(0, Math.min(100, config.audio.events[kind].volume))) /
      100) *
    0.16 *
    (config.audio.quiet ? 0.25 : 1);
  if (!gain) {
    lastDisposition = "Muted: volume is zero";
    pump();
    return;
  }
  const start = ctx.currentTime + 0.012;
  lastCue = kind;
  lastDisposition = "Playing";
  function note(
    freq: number,
    at: number,
    length: number,
    level = 1,
    type: OscillatorType = "sine",
    endFreq?: number,
  ) {
    if (at + length <= seek) return;
    const elapsed = Math.max(0, seek - at),
      when = start + Math.max(0, at - seek),
      tail = Math.max(0.025, length - elapsed),
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, when + tail);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(
      gain * level * Math.exp(-elapsed * 3),
      when + 0.012,
    );
    g.gain.exponentialRampToValueAtTime(0.00001, when + tail);
    o.connect(g);
    g.connect(limiter || analyser || ctx.destination);
    live.add(o);
    envelopes.set(o, g);
    nodes.push(o);
    scheduledNotes++;
    o.onended = () => {
      o.disconnect();
      g.disconnect();
      live.delete(o);
      envelopes.delete(o);
    };
    o.start(when);
    o.stop(when + tail + 0.015);
  }
  const length = cueDuration(kind, duration);
  if (kind === "wheel") {
    if (!reduced) {
      note(180, 0, 0.3, 0.45, "triangle", 950);
      note(90, 0, 0.24, 0.25, "sine", 45);
      const times = wheelTickTimes(duration, segments, offset);
      times.forEach((t, i) => {
        if (t < seek) return;
        const progress = i / times.length;
        note(1100 - progress * 420, t, 0.045, 0.4, "triangle");
        note(2200, t, 0.025, 0.1);
      });
    }
    note(440, reduced ? 0 : duration, 0.1, 0.8, "triangle");
    note(880, reduced ? 0 : duration, 0.12, 0.25);
  } else if (kind === "unlock") {
    // User-preferred reward flourish: warm major-ninth bells and a soft resolving chord.
    [587.33, 739.99, 880, 1108.73, 1174.66].forEach((f, i) => {
      const at = i * 0.115;
      note(f, at, 1.15, 0.48);
      note(f / 2, at, 0.85, 0.18);
      note(f * 2.006, at, 0.48, 0.075);
      note(f, at + 0.16, 0.65, 0.1);
    });
    [293.66, 369.99, 440, 587.33].forEach((f) => note(f, 0.62, 1.12, 0.22));
    note(2349.32, 0.77, 0.85, 0.07);
  } else if (kind === "prize") {
    // Original four-chord victory cadence with an opening accent at prize reveal.
    const chords = [
      [293.66, 369.99, 440, 587.33],
      [392, 493.88, 587.33, 783.99],
      [440, 554.37, 659.25, 880],
      [293.66, 369.99, 440, 587.33, 880],
    ];
    [0, 0.78, 1.56, 2.45].forEach((at, index) => {
      chords[index].forEach((f, j) => {
        note(f, at + j * 0.018, index === 3 ? 1.3 : 1.1, 0.23);
        note(f / 2, at, 0.8, 0.07, "triangle");
        note(f * 2.002, at, 0.55, 0.045);
      });
    });
    [880, 1108.73, 1174.66, 1479.98, 1174.66].forEach((f, i) => {
      note(f, [0.06, 0.36, 0.7, 1.65, 2.5][i], 0.95, 0.35);
      note(f * 2.004, [0.06, 0.36, 0.7, 1.65, 2.5][i], 0.5, 0.055);
    });
  } else {
    const score = scores[kind],
      spacing = (length - 0.7) / Math.max(1, score.length - 1);
    score.forEach((f, i) => {
      const at = i * spacing;
      note(f, at, 0.65, 0.7);
      note(f / 2, at, 0.55, 0.28, "triangle");
      note(f * 2.003, at, 0.4, 0.12);
    });
    if (kind === "champion" || kind === "milestone10") {
      // The opening chord accents the visible prize; the resolving chord gives a warm finale.
      [293.66, 369.99, 440, 587.33].forEach((f, i) => {
        note(f, 0.02, 1.15, 0.35, "triangle");
        note(f * 2, length - 1, 0.95, i === 3 ? 0.45 : 0.24);
      });
    }
  }
  active = {
    id,
    kind,
    nodes,
    timer: setTimeout(
      () => {
        cancel(nodes);
        active = undefined;
        pump();
      },
      Math.max(30, (length - seek + 0.04) * 1000),
    ),
  };
}
/** One shared context; bounded priority queue; callers own cancellation. No asset/network dependency. */
export function playCue(
  kind: SoundKind,
  config: BroadcastConfig,
  duration = 5,
  segments = 6,
  force = false,
  offset = 0,
  seek = 0,
  reduced = false,
) {
  lastRequest = kind;
  const noop = () => {};
  if (!context || context.state !== "running") {
    lastDisposition = "Activation required";
    return noop;
  }
  if (document.hidden) {
    lastDisposition = "Deferred: tab hidden";
    return noop;
  }
  if (!config.audio.events[kind]?.enabled) {
    lastDisposition = "Disabled in event settings";
    return noop;
  }
  if (config.effects.volume <= 0 || config.audio.events[kind].volume <= 0) {
    lastDisposition = "Muted: volume is zero";
    return noop;
  }
  if (
    !force &&
    Date.now() - (last.get(kind) || 0) < config.audio.cooldown * 1000
  ) {
    lastDisposition = "Cooldown";
    return noop;
  }
  last.set(kind, Date.now());
  const id = ++serial;
  if (active && priority[kind] > priority[active.kind]) {
    clearTimeout(active.timer);
    cancel(active.nodes);
    active = undefined;
  }
  pending.push({
    id,
    kind,
    config: structuredClone(config),
    duration,
    segments,
    offset,
    seek,
    reduced,
    expires: Date.now() + 7000,
  });
  pending.sort((a, b) => priority[b.kind] - priority[a.kind]);
  if (pending.length > 4) pending.length = 4;
  try {
    pump();
  } catch (e) {
    lastError = (e as Error).message;
    stopAudio();
  }
  return () => {
    const i = pending.findIndex((n) => n.id === id);
    if (i >= 0) pending.splice(i, 1);
    if (active?.id === id) {
      clearTimeout(active.timer);
      cancel(active.nodes);
      active = undefined;
      pump();
    }
  };
}
