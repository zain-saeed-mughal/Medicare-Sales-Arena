import { Crest } from "./Players";
import { useId } from "react";
import type { Spotlight } from "../arenaEvents";
import {
  Crown,
  Gift,
  Coins,
  Trophy,
  Star,
  Coffee,
  Utensils,
  Tag,
  RefreshCw,
} from "lucide-react";
const icons = {
  crown: Crown,
  gift: Gift,
  coins: Coins,
  cash: Coins,
  trophy: Trophy,
  star: Star,
  coffee: Coffee,
  lunch: Utensils,
  discount: Tag,
  retry: RefreshCw,
};
function prizeLines(name: string, limit: number) {
  const words = name.trim().split(/\s+/),
    lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && (line + " " + word).length > limit) {
      lines.push(line);
      line = "";
    }
    line += (line ? " " : "") + word;
  }
  if (line) lines.push(line);
  return lines.length <= 3
    ? lines
    : [
        ...lines.slice(0, 2),
        lines
          .slice(2)
          .join(" ")
          .slice(0, limit - 1) + "…",
      ];
}
export function Wheel({
  index,
  segments = [],
  state = "idle",
  duration = 5,
  flat = false,
  palette = "Maroon & gold",
}: {
  index: number;
  segments?: NonNullable<Spotlight["segments"]>;
  state?: "idle" | "spin" | "landed";
  duration?: number;
  flat?: boolean;
  palette?: string;
}) {
  const id = useId().replace(/:/g, ""),
    count = Math.max(1, segments.length),
    arc = 360 / count,
    r = 102,
    x = r * Math.sin((arc * Math.PI) / 360),
    y = -r * Math.cos((arc * Math.PI) / 360);
  return (
    <div
      className={
        "oe-wheel premium-wheel velocity-wheel reference-wheel " +
        (flat ? "flat" : "")
      }
      data-state={state}
      aria-label={
        "Reward wheel" +
        (state === "landed" ? " · " + segments[index]?.name : "")
      }
      style={
        {
          "--landing": 1440 - index * arc + "deg",
          "--counter-landing": -(1440 - index * arc) + "deg",
          "--spin-time": duration + "s",
        } as React.CSSProperties
      }
    >
      <div className="tv-wheel-aura" aria-hidden="true" />
      <div className="tv-wheel-cradle" aria-hidden="true" />
      <div className="oe-wheel-shadow" />
      <div className="oe-wheel-stand" />
      <div className="oe-wheel-body">
        <div className="oe-wheel-depth" />
        <div className="oe-wheel-rim" />
        <div className="oe-wheel-pointer" aria-hidden="true">
          <svg viewBox="0 0 90 125">
            <defs>
              <linearGradient id={id + "pointer"}>
                <stop stopColor="#fff8bb" />
                <stop offset=".48" stopColor="#f7c654" />
                <stop offset="1" stopColor="#ab5d09" />
              </linearGradient>
            </defs>
            <path
              d="M14 4H76Q88 4 83 20L49 116Q45 126 41 116L7 20Q2 4 14 4Z"
              fill={"url(#" + id + "pointer)"}
              stroke="#fce6a0"
              strokeWidth="3"
            />
            <path
              d="M16 10H45V110L12 19Q9 10 16 10Z"
              fill="#fffbd1"
              opacity=".25"
            />
          </svg>
        </div>
        <div className="reference-bulbs" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <i
              key={i}
              className={i % 2 ? "rim-stud" : "rim-bulb"}
              style={{
                left: 50 + 46.8 * Math.sin((i * Math.PI) / 12) + "%",
                top: 50 - 46.8 * Math.cos((i * Math.PI) / 12) + "%",
              }}
            />
          ))}
        </div>
        <div className="oe-wheel-rotor">
          <svg
            viewBox="-110 -110 220 220"
            role="img"
            aria-label="Configured prize segments"
          >
            <defs>
              <linearGradient id={id + "gold"} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#ffe5a0" />
                <stop offset=".25" stopColor="#c88b2c" />
                <stop offset=".65" stopColor="#99520f" />
                <stop offset="1" stopColor="#e8b24d" />
              </linearGradient>
              <radialGradient id={id + "burgundy"} cx=".4" cy=".15" r="1">
                <stop stopColor="var(--material-a30e32)" />
                <stop offset=".5" stopColor="var(--material-650820)" />
                <stop offset="1" stopColor="var(--material-23030e)" />
              </radialGradient>
              <linearGradient id={id + "metal"} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#fff" stopOpacity=".28" />
                <stop offset=".45" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity=".5" />
              </linearGradient>
            </defs>
            {segments.map((p, i) => (
              <g
                key={i}
                transform={"rotate(" + i * arc + ")"}
                data-winning={state === "landed" && index === i}
              >
                <path
                  d={
                    count === 1
                      ? "M0 -102a102 102 0 1 0 .01 0Z"
                      : `M0 0L${-x} ${y} A${r} ${r} 0 ${count > 2 ? 0 : 1} 1 ${x} ${y}Z`
                  }
                  fill={
                    palette === "Configured colors" && p.color
                      ? p.color
                      : "url(#" + id + (i % 2 ? "gold" : "burgundy") + ")"
                  }
                />
                <path
                  d={
                    count === 1
                      ? "M0 -102a102 102 0 1 0 .01 0Z"
                      : `M0 0L${-x} ${y} A${r} ${r} 0 ${count > 2 ? 0 : 1} 1 ${x} ${y}Z`
                  }
                  fill={"url(#" + id + "metal)"}
                  stroke="#f9d885"
                  strokeWidth=".65"
                />
                <title>{p.name}</title>
                <g transform={"translate(0 " + (count > 8 ? -77 : -67) + ")"}>
                  <g transform={"rotate(" + -i * arc + ")"}>
                    <g className="premium-wheel-label">
                      {(() => {
                        const key = (p.icon || p.name).toLowerCase();
                        const Icon =
                          Object.entries(icons).find(([name]) =>
                            key.includes(name),
                          )?.[1] || Gift;
                        return p.icon && !/^[a-z -]+$/i.test(p.icon) ? (
                          <text
                            y="-13"
                            textAnchor="middle"
                            fontSize="12"
                            fill="#fff0ba"
                          >
                            {p.icon}
                          </text>
                        ) : (
                          <Icon
                            x="-7"
                            y="-24"
                            width="14"
                            height="14"
                            color="#ffefb5"
                            strokeWidth={1.6}
                          />
                        );
                      })()}
                      {prizeLines(p.name, count > 8 ? 12 : 16).map(
                        (line, j, lines) => (
                          <text
                            key={j}
                            y={j * 8.4 - (lines.length - 1) * 4.2 + 4}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#fff5d6"
                            fontWeight="600"
                            fontSize={count > 10 ? 4.6 : count > 7 ? 5.7 : 7.6}
                            stroke="#381000"
                            strokeWidth=".4"
                            paintOrder="stroke"
                          >
                            {line}
                          </text>
                        ),
                      )}
                    </g>
                  </g>
                </g>
              </g>
            ))}
            <circle r="103" fill="none" stroke="#e7c46b" strokeWidth="2" />
          </svg>
        </div>
        <div className="oe-wheel-hub">
          <div className="tv-hub-ring" aria-hidden="true" />
          <Crest />
          <span>
            {state === "spin"
              ? "SPINNING"
              : state === "landed"
                ? "WINNER"
                : "REWARDS"}
          </span>
          <small>MEDICARE ARENA</small>
        </div>
        <div className="oe-wheel-reflection" />
      </div>
    </div>
  );
}
