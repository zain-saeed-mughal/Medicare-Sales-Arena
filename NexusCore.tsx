import { memo, useId } from "react";
export function NexusMark() {
  return (
    <svg viewBox="0 0 80 72" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 60 20 12h12L15 60zm18 0 15-42 17 25 11-31h13L59 60H47L31 37l-8 23z"
      />
    </svg>
  );
}
export const NexusCore = memo(function NexusCore() {
  const id = useId().replace(/:/g, "");
  const paint = (s: string) => "url(#" + id + s + ")";
  return (
    <svg
      className="nexus-device"
      viewBox="0 0 660 390"
      role="img"
      aria-label="Suspended Nexus championship core with counter-rotating titanium rings and gold insignia"
    >
      <defs>
        <linearGradient
          id={id + "metal"}
          x1=".1"
          y1="0"
          x2=".85"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop stopColor="#e1f6ff" />
          <stop offset=".12" stopColor="#577897" />
          <stop offset=".29" stopColor="#16304a" />
          <stop offset=".43" stopColor="#9db7c8" />
          <stop offset=".51" stopColor="#375775" />
          <stop offset=".67" stopColor="#10243a" />
          <stop offset=".88" stopColor="#697e93" />
          <stop offset="1" stopColor="#18314e" />
        </linearGradient>
        <radialGradient id={id + "face"} cx=".38" cy=".25" r=".8">
          <stop stopColor="#23557e" />
          <stop offset=".48" stopColor="#102e4a" />
          <stop offset="1" stopColor="#040d19" />
        </radialGradient>
        <linearGradient id={id + "gold"} x2=".7" y2="1">
          <stop stopColor="#fff3b9" />
          <stop offset=".38" stopColor="#efd59b" />
          <stop offset=".58" stopColor="#b98034" />
          <stop offset="1" stopColor="#fff3bd" />
        </linearGradient>
        <radialGradient id={id + "light"}>
          <stop stopColor="#63e5ff" stopOpacity=".7" />
          <stop offset=".3" stopColor="#2498ed" stopOpacity=".35" />
          <stop offset="1" stopColor="#0c6ac7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="330" cy="334" rx="245" ry="49" fill={paint("light")} />
      <g fill="none" stroke="#4b9fc7">
        <ellipse cx="330" cy="335" rx="185" ry="25" opacity=".22" />
        <ellipse cx="330" cy="337" rx="137" ry="17" opacity=".6" />
        <ellipse
          cx="330"
          cy="336"
          rx="86"
          ry="10"
          stroke="#66dfff"
          strokeDasharray="18 9"
        />
      </g>
      <g className="motes" fill="#88e8ff">
        {[
          [170, 158],
          [489, 190],
          [212, 79],
          [453, 109],
          [195, 247],
          [477, 242],
          [285, 298],
          [404, 292],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 ? 1.4 : 1} />
        ))}
      </g>
      <g transform="translate(330 167) rotate(-13) scale(.94 1)">
        <circle
          r="145"
          cy="8"
          fill="#071729"
          stroke="#345878"
          strokeWidth="3"
        />
        <circle
          r="141"
          fill={paint("face")}
          stroke={paint("metal")}
          strokeWidth="9"
        />
        <g className="rotor outer">
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i} transform={"rotate(" + i * 30 + ")"}>
              <path
                d="M-27 -128l3-11 46 1 4 10-5 8-41 1z"
                fill={paint("metal")}
                stroke="#708ba2"
                strokeWidth=".7"
              />
              <path
                d="M-15 -129h24"
                stroke={i % 3 === 0 ? "#efc46a" : "#4bd7ff"}
                strokeWidth="2.6"
              />
              <circle cy="-133" cx="-19" r="1.7" fill="#071629" />
            </g>
          ))}
        </g>
        <circle r="112" fill="none" stroke="#32d9ff" strokeWidth="3" />
        <circle
          r="105"
          fill="none"
          stroke="#a5d1e2"
          strokeWidth="6"
          strokeDasharray="1 7"
        />
        <g className="rotor inner">
          <circle
            r="95"
            fill="none"
            stroke={paint("metal")}
            strokeWidth="15"
            strokeDasharray="132 17"
          />
          <circle
            r="93"
            fill="none"
            stroke="#95ecff"
            strokeWidth="3"
            strokeDasharray="53 96"
          />
        </g>
        <circle r="82" fill={paint("face")} stroke="#4786ad" strokeWidth="2" />
        <path
          d="m0-68 59 34v68L0 68l-59-34v-68z"
          fill="#0c2940"
          stroke="#5c7b8e"
        />
        <path
          d="m0-59 50 29v60L0 59l-50-29v-60z"
          fill="none"
          stroke="#345873"
        />
        <g
          transform="rotate(13) translate(-45 -39) scale(1.15)"
          fill={paint("gold")}
        >
          <path d="M3 60 20 12h12L15 60zm18 0 15-42 17 25 11-31h13L59 60H47L31 37l-8 23z" />
        </g>
      </g>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} stroke="#77bad9" opacity=".6">
          <path
            d={"M" + (82 + i * 10) + " 179h5M" + (520 + i * 10) + " 179h5"}
          />
        </g>
      ))}
    </svg>
  );
});
