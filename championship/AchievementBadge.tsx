import { useId } from "react";
/** Nested complete SVG paths keep metallic shield edges inside the viewBox. */
export function AchievementBadge({
  kind = "approval",
}: {
  kind?: "approval" | "milestone" | "unlock" | "prize";
}) {
  const id = useId().replace(/:/g, "");
  const shield = "M140 25 242 82 242 218 140 285 38 218 38 82Z";
  return (
    <svg
      className={"cine-badge badge-" + kind}
      viewBox="0 0 280 320"
      role="img"
      aria-label={
        kind === "unlock"
          ? "Reward wheel unlocked"
          : kind === "prize"
            ? "Reward achievement badge"
            : "Approved achievement shield"
      }
    >
      <defs>
        <linearGradient id={id + "edge"} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--maroon-tone-16)" />
          <stop offset=".25" stopColor="var(--maroon-tone-12)" />
          <stop offset=".55" stopColor="var(--maroon-tone-5)" />
          <stop offset=".8" stopColor="var(--maroon-tone-15)" />
          <stop offset="1" stopColor="var(--maroon-tone-3)" />
        </linearGradient>
        <linearGradient id={id + "face"} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--maroon-tone-7)" />
          <stop offset=".45" stopColor="var(--maroon-tone-3)" />
          <stop offset="1" stopColor="var(--maroon-tone-0)" />
        </linearGradient>
        <linearGradient id={id + "gold"}>
          <stop stopColor="#876c32" />
          <stop offset=".4" stopColor="#fff0b8" />
          <stop offset="1" stopColor="#b28c42" />
        </linearGradient>
      </defs>
      <path
        d={shield}
        transform="translate(0 12)"
        fill="var(--maroon-tone-0)"
        stroke="var(--maroon-tone-0)"
        strokeWidth="9"
      />
      <path
        d={shield}
        fill={"url(#" + id + (kind === "prize" ? "gold" : "edge") + ")"}
        stroke="var(--maroon-tone-15)"
        strokeWidth="1.5"
      />
      <path
        d="M140 43 226 92 226 208 140 266 54 208 54 92Z"
        fill={"url(#" + id + "face)"}
        stroke={"url(#" + id + "gold)"}
        strokeWidth="2"
      />
      <path
        d="M140 54 214 97 214 130 66 194 66 97Z"
        fill="var(--maroon-tone-15)"
        opacity=".055"
      />
      {kind === "unlock" ? (
        <g fill="none" stroke={"url(#" + id + "gold)"} strokeWidth="4">
          <circle cx="140" cy="144" r="48" />
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d="M140 112V99"
              transform={"rotate(" + i * 45 + " 140 144)"}
            />
          ))}
          <circle cx="140" cy="144" r="20" />
          <path d="m131 144 7 7 13-16" stroke="var(--maroon-tone-15)" />
        </g>
      ) : kind === "prize" ? (
        <g
          fill="none"
          stroke={"url(#" + id + "gold)"}
          strokeWidth="5"
          strokeLinejoin="round"
        >
          <path d="M101 142H179V192H101ZM94 125H186V142H94ZM140 125V192" />
          <path d="M140 124C96 122 106 91 125 106ZM140 124C184 122 174 91 155 106Z" />
        </g>
      ) : (
        <path
          d="m99 147 28 29 58-65"
          fill="none"
          stroke="var(--maroon-tone-16)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <path d="M111 220H169" stroke={"url(#" + id + "gold)"} strokeWidth="2" />
      <circle cx="140" cy="235" r="3" fill="#e7c46b" />
    </svg>
  );
}
