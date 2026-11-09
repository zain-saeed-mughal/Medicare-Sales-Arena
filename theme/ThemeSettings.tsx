import { useMemo, useRef, useState } from "react";
import type { Data } from "../admin/model";
import { command } from "../admin/service";
import { Panel, useSettingsDraft } from "../admin/ui";
import { Monitor } from "../broadcast/Monitor";
import {
  defaultTheme,
  themeNames,
  themeAccent,
  type ColorTheme,
} from "./Theme";
export function ThemeSettings({ s }: { s: Data }) {
  const saved = s.broadcast.appearance.theme as ColorTheme;
  const { draft, setDraft, reset, conflict } = useSettingsDraft(saved);
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const data = useMemo(
    () => ({
      ...s,
      broadcast: {
        ...s.broadcast,
        rotation: false,
        appearance: {
          ...s.broadcast.appearance,
          theme: draft,
          accent: themeAccent(draft),
        },
      },
    }),
    [s, draft],
  );
  async function save() {
    if (pending.current || conflict) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await command("appearance", "arena.theme_updated", draft, (d) => {
        if (!themeNames.includes(draft))
          throw Error("Select a supported theme.");
        if (d.broadcast.appearance.theme !== saved)
          throw Error(
            "Theme changed in another tab. Reset to Saved and try again.",
          );
        d.broadcast.appearance = {
          ...d.broadcast.appearance,
          theme: draft,
          themeSource: "user",
          accent: themeAccent(draft),
        };
        return draft;
      });
      setMessage(
        "Theme saved. Active ceremonies retain their current palette until they finish.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Panel title="Color Theme">
      <p>
        Midnight Teal Glow is the default. Preview a draft without
        changing other displays.
      </p>
      <div className="theme-choices">
        {themeNames.map((name) => (
          <button
            key={name}
            disabled={busy}
            aria-pressed={draft === name}
            onClick={() => {
              setDraft(name);
              setMessage("");
            }}
          >
            <span
              className={
                name === "Emerald Green Championship"
                  ? "theme-swatch emerald"
                  : name === "Midnight Teal Glow" ? "theme-swatch teal" : "theme-swatch maroon"
              }
            />
            {name}
            {name === defaultTheme ? " · Default" : ""}
          </button>
        ))}
      </div>
      <div className="op-actions">
        <button onClick={() => setShow(true)}>Preview Theme</button>
        <button
          className="primary"
          disabled={busy || conflict}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : "Save Changes"}
        </button>
        <button
          onClick={() => {
            reset();
            setError("");
            setMessage("Saved theme restored in the draft.");
          }}
        >
          Reset to Saved
        </button>
        <button
          onClick={() => {
            setDraft(defaultTheme);
            setMessage("Midnight Teal default staged. Save Changes to apply.");
          }}
        >
          Restore Default
        </button>
      </div>
      {conflict && (
        <p role="alert">
          Theme changed in another tab. Reset to Saved before applying.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {show && (
        <div data-color-theme={draft}>
          <Monitor draft={data} suppressLiveEvents />
        </div>
      )}
    </Panel>
  );
}
