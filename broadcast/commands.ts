import { command } from "../admin/service";
import type { BroadcastConfig, ModeOptions } from "./config";
export function setMode(mode: string) {
  return command("live-control", "arena.mode_selected", "Arena 01", (s) => {
    if (!s.broadcast.modes[mode]?.enabled)
      throw Error("Enable this mode before selecting it.");
    s.settings.mode = mode;
    s.broadcast.changedAt = Date.now();
    s.broadcast.manualUntil = Date.now() + 60000;
    return mode + " · rotation held for 60 seconds";
  });
}
export function saveSection<K extends keyof BroadcastConfig>(
  key: K,
  value: BroadcastConfig[K],
  area: string,
) {
  return command(area, "arena.presentation_updated", key, (s) => {
    if (key === "modes") {
      const modes = value as Record<string, ModeOptions>;
      if (
        !modes[s.broadcast.defaultMode]?.enabled ||
        !modes[s.settings.mode]?.enabled
      )
        throw Error("Keep the current and default mode enabled.");
      if (Object.values(modes).some((m) => m.seconds < 5 || m.seconds > 3600))
        throw Error("Durations must be between 5 and 3600 seconds.");
    }
    s.broadcast[key] = value;
    return "Saved " + key;
  });
}
export function quick(action: string, expectedSequence?: number) {
  return command("live-control", "arena.broadcast_command", action, (s) => {
    switch (action) {
      case "Start rotation":
        if (
          s.broadcast.order.filter(
            (name) =>
              s.broadcast.modes[name]?.enabled &&
              (name !== "Hall of Fame" || s.broadcast.recognition.hall),
          ).length < 2
        )
          throw Error("Enable at least two modes in the rotation schedule.");
        s.broadcast.rotation = true;
        s.broadcast.rotationPaused = false;
        s.broadcast.manualUntil = 0;
        s.broadcast.changedAt = Date.now();
        s.broadcast.rotationTick = Date.now();
        break;
      case "Enable celebrations":
        s.settings.animations = true;
        s.broadcast.effects.paused = false;
        break;
      case "Rotation pause":
        if (!s.broadcast.rotation)
          throw Error("Start automatic rotation first.");
        s.broadcast.rotationPaused = !s.broadcast.rotationPaused;
        if (!s.broadcast.rotationPaused) {
          s.broadcast.manualUntil = 0;
          s.broadcast.rotationTick = Date.now();
        }

        break;
      case "Sound":
        s.settings.sound = !s.settings.sound;
        break;
      case "Pause":
        s.broadcast.effects.paused = !s.broadcast.effects.paused;
        break;
      case "Resume rotation":
        s.broadcast.manualUntil = 0;
        s.broadcast.changedAt = Date.now();
        break;
      case "Start spin": {
        const e = s.queue[0];
        if (!e?.spin || e.prizeIndex === undefined || e.demo)
          throw Error("No assigned spin is waiting.");
        if (expectedSequence !== undefined && e.sequence !== expectedSequence)
          throw Error(
            "The pending spin changed. Please review the current chamber before trying again.",
          );
        const assigned = s.spins.find((spin) => spin.id === e.spin);
        if (!assigned || assigned.completed || assigned.voided)
          throw Error(
            "This assigned spin is unavailable or already completed.",
          );
        if (s.broadcast.effects.paused)
          throw Error("Resume celebrations before releasing this spin.");
        if (s.broadcast.wheel.released.includes(e.sequence)) return false;
        s.broadcast.wheel.released = [
          ...s.broadcast.wheel.released.slice(-99),
          e.sequence,
        ];
        break;
      }
      default:
        throw Error("Unsupported broadcast command.");
    }
    return action;
  });
}
