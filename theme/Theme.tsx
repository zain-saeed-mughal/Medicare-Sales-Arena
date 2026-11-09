import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useData } from "../admin/service";
export const themeNames = [
  "Emerald Green Championship",
  "Dark Maroon Championship",
  "Midnight Teal Glow",
] as const;
export type ColorTheme = (typeof themeNames)[number];
export const defaultTheme: ColorTheme = themeNames[2];
export const themeAccent = (theme: string) =>
  theme === themeNames[2] ? "#16c9b5" : theme === themeNames[1] ? "#e51e51" : "#10cf78";
export function usePresentationTheme(theme: string, active: boolean) {
  const last = useRef(theme);
  const chosen = active ? last.current : theme;
  useLayoutEffect(() => {
    if (!active) last.current = theme;
  }, [theme, active]);
  return chosen;
}
export function GlobalTheme({ children }: { children: ReactNode }) {
  const s = useData();
  useLayoutEffect(() => {
    document.documentElement.dataset.colorTheme = s.broadcast.appearance.theme;
  }, [s.broadcast.appearance.theme]);
  return <>{children}</>;
}
