import { useEffect, useRef, useState, useCallback } from "react";
import type { Data, ArenaEvent } from "../admin/model";
type PreviewPayload = {
  broadcast?: Data["broadcast"];
  settings?: Data["settings"];
  event?: ArenaEvent;
  suppressLiveEvents?: boolean;
};
export function Monitor({
  draft,
  event,
  suppressLiveEvents = false,
}: {
  draft?: Data;
  event?: ArenaEvent;
  suppressLiveEvents?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null),
    frame = useRef<HTMLIFrameElement>(null),
    [scale, set] = useState(0.3);
  const payload: PreviewPayload = {
    broadcast: draft?.broadcast,
    settings: draft?.settings,
    event,
    suppressLiveEvents,
  };
  function send() {
    frame.current?.contentWindow?.postMessage(
      { type: "nexus-preview", ...payload },
      location.origin,
    );
  }
  useEffect(() => {
    const el = box.current!;
    const obs = new ResizeObserver(() => set(el.clientWidth / 1920));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(send, [draft, event, suppressLiveEvents]);
  return (
    <div ref={box} className="op-monitor">
      <iframe
        ref={frame}
        title="Arena monitor"
        src="/arena?monitor&isolated"
        style={{ transform: "scale(" + scale + ")" }}
        onLoad={send}
      />
    </div>
  );
}
export function usePreviewData(s: Data, monitor: boolean) {
  const [draft, set] = useState<PreviewPayload>({});
  const consumed = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!monitor) return;
    const receive = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== parent ||
        e.data?.type !== "nexus-preview"
      )
        return;
      set({
        broadcast: e.data.broadcast,
        settings: e.data.settings,
        suppressLiveEvents: e.data.suppressLiveEvents === true,
        event:
          e.data.event?.sequence === consumed.current
            ? undefined
            : e.data.event,
      });
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [monitor]);
  return {
    store: monitor
      ? {
          ...s,
          broadcast: draft.broadcast ?? s.broadcast,
          settings: draft.settings ?? s.settings,
          queue: draft.event
            ? [draft.event]
            : draft.suppressLiveEvents
              ? []
              : s.queue,
        }
      : s,
    localEvent: !!draft.event,
    clear: useCallback(
      () =>
        set((d) => {
          if (d.event) consumed.current = d.event.sequence;
          return { ...d, event: undefined };
        }),
      [],
    ),
  };
}
