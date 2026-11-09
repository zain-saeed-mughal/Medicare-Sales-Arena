import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="op-panel">
      <div className="op-panel-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Table({
  heads,
  rows,
}: {
  heads: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="op-scroll">
      <table>
        <thead>
          <tr>
            {heads.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty">No matching records.</p>}
    </div>
  );
}
export function Badge({ value }: { value: string }) {
  return (
    <span className={"op-badge " + value.toLowerCase().split(" ")[0]}>
      {value}
    </span>
  );
}
export function Kpis({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="op-kpis">
      {items.map(([k, v]) => (
        <div key={k}>
          <span>{k}</span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}
export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={close} aria-label={title}>
      <div className="op-panel-head">
        <h2>{title}</h2>
        <button aria-label="Close" onClick={close}>
          <X size={16} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export type Field = {
  key: string;
  label: string;
  type?: string;
  options?: [string, string][];
  min?: number;
  max?: number;
  required?: boolean;
};
export type Values = Record<string, string>;
export function Form({
  fields,
  initial,
  save,
  submit = "Save changes",
  preview,
  defaults,
}: {
  fields: Field[];
  initial: Values;
  save: (v: Values) => Promise<void>;
  submit?: string;
  preview?: (v: Values) => ReactNode;
  defaults?: Values;
}) {
  const [v, set] = useState(initial),
    [error, err] = useState(""),
    [busy, wait] = useState(false),
    [baseline, setBaseline] = useState(initial);
  const pending = useRef(false);
  const dirty = JSON.stringify(v) !== JSON.stringify(baseline);
  const incoming = JSON.stringify(initial);
  const previous = useRef(incoming);
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (incoming === previous.current) return;
    previous.current = incoming;
    if (!dirty || incoming === JSON.stringify(v)) {
      set(initial);
      setBaseline(initial);
      setConflict(false);
    } else setConflict(true);
  }, [incoming]);
  return (
    <form
      className="op-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending.current || conflict) return;
        pending.current = true;
        wait(true);
        setSaved(false);
        err("");
        try {
          await save(v);
          setBaseline(v);
          setSaved(true);
        } catch (e) {
          err(String((e as Error).message));
        } finally {
          pending.current = false;
          wait(false);
        }
      }}
    >
      {fields.map((f) => (
        <label key={f.key}>
          {f.label}
          {f.options ? (
            <select
              multiple={f.type === "multi"}
              value={
                f.type === "multi"
                  ? (v[f.key] || "").split(",")
                  : (v[f.key] ?? "")
              }
              required={f.required}
              onChange={(e) =>
                set({
                  ...v,
                  [f.key]:
                    f.type === "multi"
                      ? Array.from(
                          e.target.selectedOptions,
                          (o) => o.value,
                        ).join(",")
                      : e.target.value,
                })
              }
            >
              {f.options.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          ) : f.type === "avatar" ? (
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (
                  file.size > 150000 ||
                  !["image/png", "image/jpeg", "image/webp"].includes(file.type)
                ) {
                  err("Choose a PNG, JPEG or WebP under 150 KB.");
                  return;
                }
                const r = new FileReader();
                r.onload = () =>
                  set((old) => ({ ...old, [f.key]: String(r.result) }));
                r.readAsDataURL(file);
              }}
            />
          ) : (
            <input
              type={f.type || "text"}
              step={f.type === "number" ? "any" : undefined}
              value={v[f.key] ?? ""}
              min={f.min}
              max={f.max}
              maxLength={240}
              required={f.required}
              onChange={(e) => set({ ...v, [f.key]: e.target.value })}
            />
          )}
        </label>
      ))}
      {!preview && fields.some((f) => f.key === "threshold") && (
        <div className="rule-chain">
          <span>{v.threshold || 5} approvals</span>→<span>1 spin</span>
          <span>{v.active === "false" ? "Paused" : "Active"}</span>
        </div>
      )}
      {preview?.(v)}
      {error && <p role="alert">{error}</p>}
      {saved && !dirty && <p role="status">Changes saved.</p>}
      {conflict && (
        <div role="alert">
          Saved settings changed in another editor. Reload them before saving to
          avoid overwriting newer changes.{" "}
          <button
            type="button"
            onClick={() => {
              set(initial);
              setBaseline(initial);
              setConflict(false);
              err("");
            }}
          >
            Reload saved settings
          </button>
        </div>
      )}
      <div className={dirty ? "save-action-bar" : "op-actions"}>
        {defaults && (
          <button type="button" onClick={() => set({ ...v, ...defaults })}>
            Restore defaults
          </button>
        )}
        {dirty && (
          <>
            <span>UNSAVED CHANGES</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                set(baseline);
                err("");
              }}
            >
              Discard
            </button>
          </>
        )}
        <button className="primary" disabled={busy || conflict}>
          {busy ? "Saving…" : submit}
        </button>
      </div>
    </form>
  );
}
export const opts = (values: string[]): [string, string][] =>
  values.map((x) => [x, x]);
export const activeField: Field = {
  key: "active",
  label: "Status",
  options: [
    ["true", "Active"],
    ["false", "Inactive"],
  ],
};
export const nameField: Field = {
  key: "name",
  label: "Display name",
  required: true,
};
export function values(obj: object): Values {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, String(v ?? "")]),
  );
}

/** Preserve unsaved edits when another tab publishes a new settings revision. */
export function useSettingsDraft<T>(current: T) {
  const [draft, setDraft] = useState(() => structuredClone(current));
  const [baseline, setBaseline] = useState(() => JSON.stringify(current));
  const signature = JSON.stringify(current);
  const dirty = JSON.stringify(draft) !== baseline;
  const conflict =
    signature !== baseline && dirty && JSON.stringify(draft) !== signature;
  useEffect(() => {
    if (!dirty || JSON.stringify(draft) === signature) {
      setDraft(structuredClone(current));
      setBaseline(signature);
    }
  }, [signature]);
  const reset = () => {
    setDraft(structuredClone(current));
    setBaseline(signature);
  };
  return { draft, setDraft, dirty, conflict, reset };
}
