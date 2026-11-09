import { useMemo, useRef, useState } from "react";
import type { Data, ArenaEvent } from "../admin/model";
import { command, preview } from "../admin/service";
import { Panel, useSettingsDraft } from "../admin/ui";
import { defaultTVTypography, type TVTypography } from "./config";
import { Monitor } from "./Monitor";

export function TVDisplaySettings({ s }: { s: Data }) {
  const saved = s.broadcast.typography ?? defaultTVTypography;
  const { draft, setDraft, conflict, reset } = useSettingsDraft(saved);
  const [busy, setBusy] = useState(false),
    pending = useRef(false);
  const [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [example, setExample] = useState("Champion, Top 3 & leaderboard");
  const [event, setEvent] = useState<ArenaEvent>();
  const previewData = useMemo(
    () => ({
      ...s,
      settings: { ...s.settings, mode: "Daily Arena" },
      broadcast: { ...s.broadcast, typography: draft, rotation: false },
    }),
    [s, draft],
  );
  function showPreview() {
    setError("");
    if (example === "Prize Won") {
      const clone = structuredClone(previewData);
      clone.queue = [];
      preview(clone, "Reward Wheel Result");
      const cue = clone.queue.at(-1);
      if (!cue?.segments?.length) {
        setError("Add an active prize to preview Prize Won.");
        return;
      }
      setEvent({ ...cue, sequence: Date.now(), previewPhase: "result" });
    } else setEvent(undefined);
    setMessage(
      "Preview uses your draft only. Apply publishes it to the Live Arena.",
    );
  }
  async function apply() {
    if (pending.current || conflict) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    const expected = JSON.stringify(saved);
    try {
      await command(
        "appearance",
        "arena.typography_updated",
        "Live Arena",
        (d) => {
          if (
            JSON.stringify(d.broadcast.typography ?? defaultTVTypography) !==
            expected
          )
            throw Error(
              "TV settings changed in another tab. Reload saved settings before applying.",
            );
          if (
            !["Normal", "Large TV", "Extra Large TV"].includes(draft.preset) ||
            !["Medium", "Bold", "Extra Bold"].includes(draft.weight)
          )
            throw Error("Select a supported TV preset and font weight.");
          d.broadcast.typography = { ...draft };
          return draft.preset + " · " + draft.weight;
        },
      );
      setMessage(
        "Applied to Live Arena tabs in this browser. Active ceremonies continue uninterrupted.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Panel title="TV Display Settings">
        <p>
          Large TV is recommended for 55–65 inch screens. Existing typography
          stays unchanged until you apply. These settings affect the Live Arena
          only.
        </p>
        <div className="op-form">
          <label>
            Display preset
            <select
              aria-label="Display preset"
              value={draft.preset}
              disabled={busy}
              onChange={(e) => {
                setDraft({
                  ...draft,
                  preset: e.target.value as TVTypography["preset"],
                });
                setMessage("");
              }}
            >
              <option value="Normal">Normal — current size</option>
              <option value="Large TV">Large TV — recommended</option>
              <option value="Extra Large TV">
                Extra Large TV — distant viewing
              </option>
            </select>
          </label>
          <label>
            Font weight
            <select
              aria-label="Font weight"
              value={draft.weight}
              disabled={busy}
              onChange={(e) => {
                setDraft({
                  ...draft,
                  weight: e.target.value as TVTypography["weight"],
                });
                setMessage("");
              }}
            >
              <option>Medium</option>
              <option>Bold</option>
              <option>Extra Bold</option>
            </select>
          </label>
        </div>
        <p>
          Extra Large prioritizes names, sales and rewards; decorative captions
          and repeated secondary labels are reduced. Long names are truncated
          where space is limited.
        </p>
        <div className="op-actions">
          <button
            className="primary"
            disabled={busy || conflict}
            onClick={() => void apply()}
          >
            {busy ? "Applying…" : "Apply to Live Arena"}
          </button>
          <button
            disabled={busy}
            onClick={() => {
              setDraft({ ...defaultTVTypography });
              setEvent(undefined);
              setMessage(
                "Default staged: Normal / Bold. Select Apply to Live Arena to save.",
              );
            }}
          >
            Restore Default
          </button>
        </div>
        {conflict && (
          <p role="alert">
            Another tab changed TV settings. Reload before saving.
          </p>
        )}
        {conflict && (
          <button
            onClick={() => {
              reset();
              setError("");
            }}
          >
            Reload saved settings
          </button>
        )}
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
      </Panel>
      <Panel title="Live typography preview">
        <p>
          Actual 1920 × 1080 Arena renderer. Champion Spotlight, Top 3 and
          leaderboard use the selected draft immediately. Choose Prize Won to
          preview reward typography. No sales or rewards are created.
        </p>
        <div className="op-actions">
          <select
            aria-label="Preview example"
            value={example}
            onChange={(e) => setExample(e.target.value)}
          >
            <option>Champion, Top 3 &amp; leaderboard</option>
            <option>Prize Won</option>
          </select>
          <button onClick={showPreview}>Preview</button>
        </div>
        <Monitor draft={previewData} event={event} suppressLiveEvents />
      </Panel>
    </>
  );
}
