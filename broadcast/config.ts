import type { Data } from "../admin/model";
export type TVTypography = {
  preset: "Normal" | "Large TV" | "Extra Large TV";
  weight: "Medium" | "Bold" | "Extra Bold";
};
export const defaultTVTypography: TVTypography = {
  preset: "Normal",
  weight: "Bold",
};
export type ModeOptions = {
  enabled: boolean;
  seconds: number;
  title: string;
  statistics: string[];
  podium: boolean;
  leaderboard: boolean;
};
export type DisplayProfile = {
  visible: boolean;
  label: string;
  color: string;
  badge: string;
};
export type SoundKind =
  | "sale"
  | "milestone2"
  | "milestone5"
  | "milestone10"
  | "milestone"
  | "unlock"
  | "wheel"
  | "prize"
  | "champion"
  | "team";
export const soundKinds: SoundKind[] = [
  "sale",
  "milestone2",
  "milestone5",
  "milestone10",
  "milestone",
  "unlock",
  "wheel",
  "prize",
  "champion",
  "team",
];
export type BroadcastConfig = {
  typography?: TVTypography;
  version?: number;
  order: string[];
  rotationPaused: boolean;
  rotationTick: number;
  recognition: {
    radar: boolean;
    rising: boolean;
    hall: boolean;
    championLayout: string;
    near: number;
    quality: string;
  };
  audio: {
    quiet: boolean;
    cooldown: number;
    events: Record<SoundKind, { enabled: boolean; volume: number }>;
  };
  modes: Record<string, ModeOptions>;
  defaultMode: string;
  rotation: boolean;
  changedAt: number;
  manualUntil: number;
  leaderboard: {
    leadMargin?: boolean;
    density?: string;
    period: string;
    avatars: boolean;
    teams: boolean;
    changes: boolean;
    medals: boolean;
    champion: boolean;
    sales: boolean;
    targets: boolean;
    teamRanks: boolean;
    top3: boolean;
    dailyTop3: boolean;
    weeklyTop3: boolean;
    monthlyTop3: boolean;
    topSales: boolean;
    topTeams: boolean;
    podiumStyle: string;
  };
  appearance: {
    theme: string;
    themeSource?: "system" | "user";
    accent: string;
    background: string;
    contrast: string;
    championStyle: string;
    rankingStyle: string;
    position: string;
    metrics: boolean;
    ticker: boolean;
  };
  branding: {
    logo: string;
    office: string;
    label: string;
    competition: string;
  };
  eventOverrides?: Record<string, { enabled: boolean; seconds: number }>;
  effects: {
    avatar?: boolean;
    sales?: boolean;
    approved: boolean;
    milestone: boolean;
    bonus: boolean;
    unlock: boolean;
    wheel: boolean;
    champion: boolean;
    duration: number;
    transition: number;
    paused: boolean;
    soundSale: boolean;
    soundMilestone: boolean;
    soundSpin: boolean;
    soundPrize: boolean;
    volume: number;
    bonusTitle: string;
    bonusSubtitle: string;
    agent: boolean;
    team: boolean;
    threshold: boolean;
    style: string;
  };
  wheel: {
    palette?: string;
    enabled: boolean;
    duration: number;
    reveal: number;
    announcement: string;
    sound: boolean;
    effect: string;
    initiation: string;
    released: number[];
  };
  profiles: Record<string, DisplayProfile>;
};
export const statNames = [
  "Submissions",
  "Approved",
  "Agents",
  "Rewards",
  "Team",
  "Target",
];
export const broadcastModes = [
  "Daily Arena",
  "Weekly Arena",
  "Monthly Arena",
  "Leaderboard Focus",
  "Team Battle",
  "Champion Spotlight",
  "Reward Ceremony",
  "Standby",
  "Live Competition",
  "Hall of Fame",
];
export function defaults(): BroadcastConfig {
  return {
    version: 9,
    order: [...broadcastModes],
    rotationPaused: false,
    rotationTick: Date.now(),
    recognition: {
      radar: true,
      rising: true,
      hall: true,
      championLayout: "Editorial",
      near: 3,
      quality: "Dimensional",
    },
    audio: {
      quiet: false,
      cooldown: 4,
      events: Object.fromEntries(
        soundKinds.map((k) => [
          k,
          { enabled: true, volume: k === "wheel" ? 35 : 70 },
        ]),
      ) as BroadcastConfig["audio"]["events"],
    },
    modes: Object.fromEntries(
      broadcastModes.map((name) => [
        name,
        {
          enabled: true,
          seconds: name === "Daily Arena" ? 60 : 25,
          title: "",
          statistics: ["Approved", "Agents", "Rewards", "Team", "Target"],
          podium: true,
          leaderboard: ![
            "Team Battle",
            "Champion Spotlight",
            "Reward Ceremony",
            "Standby",
            "Hall of Fame",
          ].includes(name),
        },
      ]),
    ),
    defaultMode: "Daily Arena",
    rotation: false,
    changedAt: Date.now(),
    manualUntil: 0,
    leaderboard: {
      period: "Follow mode",
      avatars: true,
      teams: true,
      changes: true,
      medals: true,
      champion: true,
      sales: true,
      targets: true,
      teamRanks: true,
      top3: true,
      dailyTop3: true,
      weeklyTop3: true,
      monthlyTop3: true,
      topSales: true,
      topTeams: true,
      podiumStyle: "Podium",
    },
    appearance: {
      theme: "Midnight Teal Glow",
      themeSource: "system",
      accent: "#16c9b5",
      background: "Architectural",
      contrast: "Standard",
      championStyle: "Gold",
      rankingStyle: "Medal",
      position: "Left",
      metrics: true,
      ticker: true,
    },
    branding: { logo: "", office: "", label: "", competition: "" },
    effects: {
      approved: true,
      milestone: true,
      bonus: true,
      unlock: true,
      wheel: true,
      champion: true,
      duration: 1,
      transition: 1,
      paused: false,
      soundSale: true,
      soundMilestone: true,
      soundSpin: true,
      soundPrize: true,
      volume: 20,
      bonusTitle: "Target achieved!",
      bonusSubtitle: "",
      agent: true,
      team: true,
      threshold: true,
      style: "Championship",
    },
    wheel: {
      palette: "Maroon & gold",
      enabled: true,
      duration: 5,
      reveal: 4.5,
      announcement: "Spin Unlocked",
      sound: true,
      effect: "Gold",
      initiation: "Authorized manual",
      released: [],
    },
    profiles: {},
  };
}
export function profile(s: Data, kind: "agent" | "team", id: string | number) {
  return (
    s.broadcast.profiles[kind + ":" + id] ?? {
      visible: true,
      label: "",
      color: s.broadcast.appearance.theme === "Midnight Teal Glow" ? "#b0d9d4" : s.broadcast.appearance.theme === "Emerald Green Championship" ? "#b4d9c7" : "#eabdc7",
      badge: "",
    }
  );
}
/** Display projection leaves operational agent IDs, scores and historical records intact. */
export function displayData(s: Data): Data {
  const hiddenTeams = new Set(
    s.teams.filter((t) => !profile(s, "team", t.id).visible).map((t) => t.id),
  );
  const hiddenNames = [
    ...s.agents
      .filter(
        (a) => !profile(s, "agent", a.id).visible || hiddenTeams.has(a.team),
      )
      .map((a) => a.name),
    ...s.teams.filter((t) => hiddenTeams.has(t.id)).map((t) => t.name),
  ];
  const aliases = [
    ...s.agents.map((a) => [a.name, profile(s, "agent", a.id).label || a.name]),
    ...s.teams.map((t) => [t.name, profile(s, "team", t.id).label || t.name]),
  ];
  const publicText = (text: string) =>
    aliases.reduce(
      (value, [name, label]) => (name ? value.split(name).join(label) : value),
      text,
    );
  return {
    ...s,
    // Keep every cue and its authorized result. Hidden profiles receive anonymous recognition.
    queue: s.queue.map((e) => ({
      ...e,
      avatar: hiddenNames.includes(e.name) ? "" : e.avatar,
      name: hiddenNames.includes(e.name)
        ? "Arena performer"
        : publicText(e.name),
      team: hiddenNames.includes(e.team)
        ? "Team achievement"
        : publicText(e.team),
    })),
    news: s.news
      .filter(
        (text) => !hiddenNames.some((name) => name && text.includes(name)),
      )
      .map(publicText),
    agents: s.agents
      .filter(
        (a) => profile(s, "agent", a.id).visible && !hiddenTeams.has(a.team),
      )
      .map((a) => ({ ...a, name: profile(s, "agent", a.id).label || a.name })),
    teams: s.teams
      .filter((t) => !hiddenTeams.has(t.id))
      .map((t) => ({ ...t, name: profile(s, "team", t.id).label || t.name })),
  };
}

/** Idempotent presentation migration; never touches financial records. */
export function upgradeBroadcast(
  value: BroadcastConfig | undefined,
  explicitLegacyTheme = false,
): BroadcastConfig {
  const base = defaults();
  if (!value) return base;
  const upgraded = {
    ...base,
    ...value,
    modes: Object.fromEntries(
      broadcastModes.map((mode) => [
        mode,
        { ...base.modes[mode], ...value.modes?.[mode] },
      ]),
    ) as BroadcastConfig["modes"],
    leaderboard: { ...base.leaderboard, ...value.leaderboard },
    appearance: { ...base.appearance, ...value.appearance },
    branding: { ...base.branding, ...value.branding },
    effects: { ...base.effects, ...value.effects },
    wheel: { ...base.wheel, ...value.wheel },
    recognition: { ...base.recognition, ...value.recognition },
    audio: {
      ...base.audio,
      ...value.audio,
      events: Object.fromEntries(
        Object.entries(base.audio.events).map(([kind, event]) => [
          kind,
          { ...event, ...value.audio?.events?.[kind as SoundKind] },
        ]),
      ) as BroadcastConfig["audio"]["events"],
    },
  };
  if ((value.version || 0) < 2) {
    upgraded.appearance = {
      ...upgraded.appearance,
      theme: "Obsidian Emerald",
      accent: "#15c6a0",
    };
    upgraded.effects = {
      ...upgraded.effects,
      style:
        upgraded.effects.style === "Nexus"
          ? "Championship"
          : upgraded.effects.style,
    };
    upgraded.version = 2;
    upgraded.order = [...broadcastModes];
  }
  if ((value.version || 0) < 3) {
    if (upgraded.wheel.reveal === 3.2 && !value.eventOverrides?.result)
      upgraded.wheel.reveal = 4.5;
    upgraded.version = 3;
  }
  if ((value.version || 0) < 4) {
    if (
      ["Obsidian Emerald", "Midnight", "Nexus Blue"].includes(
        upgraded.appearance.theme,
      )
    )
      upgraded.appearance.theme = "Victory Studio X";
    if (
      ["#15c6a0", "#32d9ff"].includes(upgraded.appearance.accent.toLowerCase())
    )
      upgraded.appearance.accent = "#40d6f1";
    upgraded.version = 4;
  }
  if ((value.version || 0) < 5) {
    if (
      ["Victory Studio X", "Obsidian Emerald", "Nexus Blue"].includes(
        upgraded.appearance.theme,
      )
    )
      upgraded.appearance.theme = "Titanium Blue Velocity";
    upgraded.version = 5;
  }
  if ((value.version || 0) < 6) {
    upgraded.appearance.theme = "Dark Maroon Championship";
    upgraded.appearance.accent = "#e51e51";
    upgraded.version = 6;
  }
  if ((value.version || 0) < 7) {
    upgraded.appearance.position = "Left";
    upgraded.version = 7;
  }
  if ((value.version || 0) < 8) {
    const chosen =
      value.appearance?.themeSource === "user" || explicitLegacyTheme;
    const supported = [
      "Dark Maroon Championship",
      "Emerald Green Championship",
    ].includes(value.appearance?.theme);
    upgraded.appearance.theme =
      chosen && supported
        ? value.appearance.theme
        : "Emerald Green Championship";
    upgraded.appearance.themeSource = chosen && supported ? "user" : "system";
    if (
      !chosen ||
      ["#e51e51", "#10cf78"].includes(upgraded.appearance.accent.toLowerCase())
    )
      upgraded.appearance.accent =
        upgraded.appearance.theme === "Emerald Green Championship"
          ? "#10cf78"
          : "#e51e51";
    upgraded.version = 8;
  }
  if (
    !["Dark Maroon Championship", "Emerald Green Championship", "Midnight Teal Glow"].includes(
      upgraded.appearance.theme,
    )
  ) {
    upgraded.appearance.theme = "Midnight Teal Glow";
    upgraded.appearance.themeSource = "system";
    upgraded.appearance.accent = "#16c9b5";
  }
  if ((value.version || 0) < 9) {
    if (upgraded.appearance.themeSource !== "user") {
      upgraded.appearance.theme = "Midnight Teal Glow";
      upgraded.appearance.accent = "#16c9b5";
      upgraded.appearance.themeSource = "system";
    }
    upgraded.version = 9;
  }
  if (upgraded.branding.logo === "/brand/medicare-maroon-m.png") upgraded.branding.logo = "";
  return upgraded;
}
