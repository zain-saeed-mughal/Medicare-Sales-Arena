import { useCallback, useMemo, useState, useRef } from "react";
import { ArenaPresentation } from "../championship/Arena";
import { Ceremony } from "../championship/Ceremony";
import { activateAudio } from "../championship/audio";
import { preview, useData } from "../admin/service";
import type { ArenaEvent } from "../admin/model";
export default function RewardReview() {
  const raw = useData();
  const data = useMemo(
    () => ({
      ...raw,
      queue: [] as ArenaEvent[],
      broadcast: { ...raw.broadcast, rotation: false },
    }),
    [raw],
  );
  const [event, setEvent] = useState<ArenaEvent>(),
    [error, setError] = useState("");
  const pending = useRef(false);
  const finish = useCallback(() => setEvent(undefined), []);
  async function play() {
    if (pending.current || event) return;
    pending.current = true;
    try {
      await activateAudio();
      const clone = structuredClone(data);
      preview(clone, "Reward Spin Unlocked");
      const cue = clone.queue.at(-1);
      if (!cue?.segments?.length)
        throw Error("Configure at least one active prize first.");
      setEvent({ ...cue, sequence: Date.now() });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
    }
  }
  return (
    <ArenaPresentation
      raw={data}
      isolated
      controls={
        !event && (
          <div
            style={{
              position: "fixed",
              bottom: "7rem",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 100,
              padding: "1.2rem 2rem",
              background: "var(--material-280510)",
              border: "1px solid #d8ad59",
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            <p>ONE-TIME REWARD REHEARSAL · NO REWARD ISSUED</p>
            <button
              onClick={() => void play()}
              style={{ padding: "1rem 2rem", borderRadius: 8, fontSize: 20 }}
            >
              Play reward ceremony with sound
            </button>
            {error && <p role="alert">{error}</p>}
          </div>
        )
      }
      ceremony={
        event && (
          <Ceremony
            key={event.sequence}
            event={event}
            config={raw.broadcast}
            onFinish={finish}
            preview
            sound={raw.settings.sound}
            showAmounts={raw.targets.showAmounts}
            reduced={raw.settings.intensity === "Reduced"}
          />
        )
      }
    />
  );
}
