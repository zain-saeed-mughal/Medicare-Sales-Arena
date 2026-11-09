import type { Reward } from "./model";
/** Formatting is snapshotted at assignment; editing inventory never rewrites history. */
export function rewardLabel(p: Reward) {
  return p.minor && p.currency
    ? `${p.name} · ${p.currency} ${(p.minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : p.name;
}
export function rewardSegment(p: Reward) {
  return {
    name: rewardLabel(p),
    color: p.color,
    icon: p.icon,
    monetary: !!p.minor || /cash|money|monetary|currency/i.test(p.type),
  };
}
