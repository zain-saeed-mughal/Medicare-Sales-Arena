export const prizes = [
  "Team lunch",
  "Coffee card",
  "Arena pin",
  "Gold badge",
  "Snack box",
  "Merch pack",
];

export type Spotlight = {
  eventId?: string;
  agentId?: number;
  avatar?: string;
  created?: string;
  category?: "sale" | "milestone" | "champion" | "top3" | "team" | "teamWin";
  previousRank?: number;
  rank?: number;
  timeframe?: string;
  sequence: number;
  target?: {
    showMilestone?: boolean;
    showBonus?: boolean;
    id: string;
    scope: string;
    name: string;
    threshold: number;
    minor: number;
    currency: string;
    status: string;
  };
  name: string;
  team: string;
  sales: number;
  segments?: {
    name: string;
    color: string;
    icon?: string;
    monetary?: boolean;
  }[];
  previewPhase?: string;
  prizeIndex?: number;
};
