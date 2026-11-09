import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import type { BroadcastConfig } from "../broadcast/config";
import {
  activateAudio,
  audioDiagnostics,
  playCue,
  stopAudio,
} from "../championship/audio";
export function ArenaAudioControl({
  config,
  master,
  enabled,
  onEnabled,
}: {
  config: BroadcastConfig;
  master: boolean;
  enabled: boolean;
  onEnabled: (v: boolean) => void;
}) {
  const [state, setState] = useState(audioDiagnostics()),
    [error, setError] = useState("");
  useEffect(() => {
    const t = setInterval(() => setState(audioDiagnostics()), 400);
    return () => clearInterval(t);
  }, []);
  async function enable(test = false) {
    try {
      await activateAudio();
      onEnabled(true);
      if (test && master && config.effects.volume > 0) {
        const cue = structuredClone(config);
        cue.audio.events.unlock.enabled = true;
        cue.audio.events.unlock.volume = Math.max(
          55,
          cue.audio.events.unlock.volume,
        );
        stopAudio();
        playCue("unlock", cue, 1.8, 6, true);
      }
      setState(audioDiagnostics());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const running = enabled && state.state === "running";
  const muted = !master || config.effects.volume === 0;
  const status = error
    ? "Audio Blocked / Unavailable"
    : !running
      ? "Activation Required"
      : muted
        ? "Muted"
        : "Sound Ready";
  return (
    <div
      className="vx-audio"
      data-audio-state={state.state}
      data-master-muted={!master}
    >
      <button
        aria-label={running ? "Mute TV audio" : "Enable Arena Audio"}
        onClick={() =>
          running ? (stopAudio(), onEnabled(false)) : void enable(true)
        }
      >
        {running ? <Volume2 /> : <VolumeX />}
        <span>{running ? status.toUpperCase() : "ENABLE ARENA SOUND"}</span>
      </button>
      <div className="vx-audio-detail">
        <i className={state.rms > 0.00001 ? "signal" : ""} />
        <small>
          {!enabled ? "CLICK TO ACTIVATE" : status.toUpperCase()}
          {enabled &&
            (!master
              ? " · MASTER MUTED"
              : config.effects.volume === 0
                ? " · VOLUME 0"
                : " · " + config.effects.volume + "%")}
        </small>
        {running && (
          <button
            aria-label="Test Arena audio"
            onClick={() => void enable(true)}
          >
            TEST
          </button>
        )}
      </div>
      {error && <span role="alert">{error}</span>}
      {muted && (
        <small>Enable master sound and volume in Appearance &amp; Sound.</small>
      )}
    </div>
  );
}
