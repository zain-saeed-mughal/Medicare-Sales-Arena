import { GlobalTheme } from "./theme/Theme";
import { ServiceGuard } from "./admin/ServiceGuard";
import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "./theme/maroon-tokens.css";
import "./style.css";
import "./nexus.css";
import Admin from "./admin/Admin";
import { ChampionshipArena } from "./championship/Arena";
import "./championship/cinematic.css";
import "./victory/victory.css";
import "./admin/simple.css";
import "./championship/wheel-premium.css";
import "./velocity/velocity.css";
import "./theme/maroon.css";
import "./championship/wheel-reference.css";
import "./theme/brand.css";
import "./theme/tv-typography.css";
import "./theme/color-themes.css";
import "./velocity/championship-awards.css";
// Retired isolated demo entry: all Arena links now observe the same broadcast state.
if (
  location.pathname === "/arena" &&
  new URLSearchParams(location.search).has("demo")
) {
  const url = new URL(location.href);
  url.searchParams.delete("demo");
  history.replaceState(null, "", url.pathname + url.search + url.hash);
}
const RewardReview = import.meta.env.DEV
  ? lazy(() => import("./broadcast/RewardReview"))
  : null;
const ArenaPreview = import.meta.env.DEV
  ? lazy(() => import("./broadcast/ArenaPreview"))
  : null;
createRoot(document.getElementById("root")!).render(
  <ServiceGuard>
    <GlobalTheme>
      <MotionConfig reducedMotion="user">
        {location.pathname === "/admin" ||
        location.pathname.startsWith("/admin/") ? (
          <Admin />
        ) : ArenaPreview &&
          location.pathname === "/arena" &&
          new URLSearchParams(location.search).get("preview") === "1" ? (
          <Suspense fallback={null}>
            <ArenaPreview />
          </Suspense>
        ) : RewardReview &&
          location.pathname === "/arena" &&
          new URLSearchParams(location.search).get("review") === "reward" ? (
          <Suspense fallback={null}>
            <RewardReview />
          </Suspense>
        ) : (
          <ChampionshipArena />
        )}
      </MotionConfig>
    </GlobalTheme>
  </ServiceGuard>,
);
