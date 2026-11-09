import { useState } from "react";
import { Panel, Form, values, Table, useSettingsDraft } from "../admin/ui";
import { command } from "../admin/service";
import type { Data } from "../admin/model";
import { soundKinds, type SoundKind } from "../broadcast/config";
import { activateAudio, playCue, stopAudio } from "./audio";
const labels: Record<SoundKind, string> = {
  sale: "Sale approved",
  milestone2: "Two-sales milestone",
  milestone5: "Five-sales milestone",
  milestone10: "Ten-sales milestone",
  milestone: "Other milestones",
  unlock: "Spin unlocked",
  wheel: "Mechanical wheel ticks",
  prize: "Prize revealed",
  champion: "New champion",
  team: "Team takes the lead",
};
export function SoundControls({
  s,
  previewOnly = false,
}: {
  s: Data;
  previewOnly?: boolean;
}) {
  const {
    draft,
    setDraft: set,
    conflict,
    reset,
  } = useSettingsDraft(s.broadcast.audio);
  const [notice, msg] = useState(""),
    [busy, setBusy] = useState(false);
  async function save() {
    if (busy || conflict) return;
    setBusy(true);
    try {
      await command("effects", "arena.audio_saved", "Arena 01", (d) => {
        d.broadcast.audio = draft;
        return "Original sound identity settings saved";
      });
      msg("Sound settings saved.");
    } catch (e) {
      msg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel title="Championship sound identity">
      <p>
        Original Web Audio synthesis. Preview plays only in this browser after
        your click. The TV requires its own audio activation.
      </p>
      <div className="op-form">
        <label className="bc-check">
          <input
            type="checkbox"
            checked={draft.quiet}
            onChange={(e) => set({ ...draft, quiet: e.target.checked })}
          />
          Quiet mode · 25% level
        </label>
        <label>
          Repeated-category cooldown (seconds)
          <input
            type="number"
            min={0}
            max={60}
            value={draft.cooldown}
            onChange={(e) =>
              set({
                ...draft,
                cooldown: Math.max(0, Math.min(60, Number(e.target.value))),
              })
            }
          />
        </label>
      </div>
      <Table
        heads={["Event", "Enabled", "Event volume", "Local sound preview"]}
        rows={soundKinds.map((k) => [
          labels[k],
          <input
            type="checkbox"
            aria-label={labels[k] + " enabled"}
            checked={draft.events[k].enabled}
            onChange={(e) =>
              set({
                ...draft,
                events: {
                  ...draft.events,
                  [k]: { ...draft.events[k], enabled: e.target.checked },
                },
              })
            }
          />,
          <input
            aria-label={labels[k] + " volume"}
            type="range"
            min={0}
            max={100}
            value={draft.events[k].volume}
            onChange={(e) =>
              set({
                ...draft,
                events: {
                  ...draft.events,
                  [k]: { ...draft.events[k], volume: Number(e.target.value) },
                },
              })
            }
          />,
          <button
            onClick={async () => {
              try {
                await activateAudio();
                stopAudio();
                playCue(
                  k,
                  { ...s.broadcast, audio: draft },
                  s.broadcast.wheel.duration,
                  s.prizes.filter((p) => p.active).length,
                  true,
                );
                msg(
                  "Local preview requested. Muted event settings and volume still apply.",
                );
              } catch (e) {
                msg((e as Error).message);
              }
            }}
          >
            Preview {labels[k]}
          </button>,
        ])}
      />
      <div className="op-actions">
        {!previewOnly && (
          <button
            className="primary"
            disabled={busy || conflict}
            onClick={() => void save()}
          >
            Save sound settings
          </button>
        )}
        <button onClick={stopAudio}>Stop preview</button>
        <button onClick={reset}>Discard / reload saved sound settings</button>
      </div>
      {conflict && (
        <p role="alert">
          Sound settings changed in another editor. Reload saved settings before
          saving.
        </p>
      )}
      <p role="status">{notice}</p>
    </Panel>
  );
}
export function RecognitionControls({ s }: { s: Data }) {
  const [notice, msg] = useState("");
  return (
    <Panel title="Recognition & TV performance">
      <Form
        fields={[
          {
            key: "championLayout",
            label: "Champion composition",
            options: [
              ["Editorial", "Editorial • identity on left"],
              ["Portrait", "Portrait • identity on right"],
            ],
          },
          {
            key: "quality",
            label: "Wheel rendering",
            options: [
              ["Dimensional", "Dimensional • CSS 3D"],
              ["Flat", "Flat • low-power fallback"],
            ],
          },
          ...(["radar", "rising", "hall"] as const).map((key, i) => ({
            key,
            label: [
              "Next target radar",
              "Rising Star module",
              "Hall of Fame visibility",
            ][i],
            options: [
              ["true", "Enabled"],
              ["false", "Disabled"],
            ] as [string, string][],
          })),
          {
            key: "near",
            label: "Radar proximity (sales remaining)",
            type: "number",
            min: 1,
            max: 100,
            required: true,
          },
        ]}
        initial={values(s.broadcast.recognition)}
        save={async (v) => {
          await command(
            "appearance",
            "arena.recognition_saved",
            "Arena 01",
            (d) => {
              d.broadcast.recognition = {
                radar: v.radar === "true",
                rising: v.rising === "true",
                hall: v.hall === "true",
                championLayout: v.championLayout,
                quality: v.quality,
                near: Math.max(1, Math.min(100, Number(v.near))),
              };
              return "Recognition modules updated";
            },
          );
          msg("Recognition settings saved.");
        }}
      />
      <p>
        Rising Star uses recorded rank snapshots. Hall of Fame uses saved
        completed competition results. Neither invents past performance.
      </p>
      <p role="status">{notice}</p>
    </Panel>
  );
}
