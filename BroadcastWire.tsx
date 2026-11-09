import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import type { Data } from "./admin/model";
type WireItem = { label: string; text: string };
export function BroadcastWire({
  s,
  leader,
  team,
}: {
  s: Data;
  leader: string;
  team: string;
}) {
  const previous = useRef({ leader, team, sequence: s.sequence });
  const [signals, setSignals] = useState<WireItem[]>([]);
  const [slot, setSlot] = useState(0);
  useEffect(() => {
    const old = previous.current;
    previous.current = { leader, team, sequence: s.sequence };
    const next: WireItem[] = [];
    if (old.leader !== leader)
      next.push({
        label: "Champion change",
        text: leader + " leads the championship.",
      });
    if (old.team !== team)
      next.push({
        label: "Team lead",
        text: team + " moves into first place.",
      });
    const e = s.queue.find(
      (e) => !e.demo && e.sequence > old.sequence && !!e.target,
    );
    if (e)
      next.push({
        label: "Milestone",
        text: e.name + " reached " + e.sales + " approved sales.",
      });
    if (next.length) setSignals(next.slice(0, 3));
  }, [s.sequence, s.queue, leader, team]);
  useEffect(() => {
    setSlot(0);
    const timer = setInterval(() => setSlot((i) => (i + 1) % 6), 6500);
    return () => clearInterval(timer);
  }, [s.news[0]]);
  const items = [
    {
      label: s.news[0]?.includes(" earned ") ? "Reward awarded" : "Latest",
      text: s.news[0],
    },
    ...signals,
    ...s.news.slice(1).map((text) => ({ label: "Around the arena", text })),
  ].filter((x) => x.text);
  const item = items[slot % items.length];
  return (
    <footer>
      <small>
        <Activity size={16} /> ARENA WIRE
      </small>
      <div className="feed" key={item?.text}>
        <b>{item?.label}</b>
        {item?.text || "Awaiting activity"}
      </div>
    </footer>
  );
}
