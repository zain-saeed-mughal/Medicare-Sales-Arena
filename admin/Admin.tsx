import { reportServiceError } from "./service";
import { VelocityDashboard } from "../velocity/Dashboard";
import {
  core,
  sectionFor,
  QuickPreview,
  SectionLinks,
  SimpleDashboard,
  SimpleLive,
  SimpleRewards,
} from "./SimplePages";
import { useEffect, useState, Fragment } from "react";
import {
  Monitor,
  Radio,
  LayoutDashboard,
  Users,
  Flag,
  Gift,
  Activity,
  Settings2,
  Shield,
  SlidersHorizontal,
  BarChart3,
  Menu,
  CircleDot,
  HeartPulse,
  Trophy,
  ScanLine,
  ChartNoAxesCombined,
  Target,
  PackageCheck,
  ListOrdered,
  Sparkles,
  History,
  Palette,
  Clapperboard,
  Network,
  CircleUser,
} from "lucide-react";
import { Crest } from "../championship/Players";
import {
  ConsoleSection,
  ConsoleStatus,
  RecognitionEngine,
} from "./ConsolePages";
import { allowed, dev, session, signIn, signOut, useData } from "./service";
import { Catalog, Rewards } from "./Catalog";
import { ActivityLog } from "./Overview";
import { Sales } from "./Sales";
import { Settings } from "./Control";
import { Targets } from "../targets/Targets";
import {
  Home,
  LiveControl,
  Modes,
  Leaderboard,
  Presentation,
} from "../broadcast/Pages";
import { Participants, Wheel, RewardHistory } from "../broadcast/Rewards";
import { Milestones } from "../broadcast/Milestones";
import "./admin.css";
import "../broadcast/control.css";
import "./console.css";
const pages = [
  ["overview", "Overview Dashboard", LayoutDashboard],
  ["spin-wheel", "Spin Management", CircleDot],
  ["health", "System Health", HeartPulse],
  ["programs", "Reward Programs", Trophy],
  ["live-control", "Live Arena Controls", ScanLine],
  ["participants", "Agent Management", Users],
  ["performance", "Sales & Performance", ChartNoAxesCombined],
  ["targets", "Target Management", Target],
  ["reward-operations", "Spin & Rewards", PackageCheck],
  ["leaderboard", "Leaderboard Settings", ListOrdered],
  ["effects", "Celebration Settings", Sparkles],
  ["reward-history", "Spin History", History],
  ["appearance", "Appearance & Sound", Palette],
  ["integration", "Integration Preview", Clapperboard],
  ["security", "IP Perimeter Security", Network],
  ["account", "Account", CircleUser],
] as const;
const secondary = [
  ["modes", "Arena Modes"],
  ["bonuses", "Bonus Rules"],
  ["branding", "Branding"],
  ["activity", "Activity Logs"],
  ["access", "Admin Access"],
  ["settings", "Settings"],
  ["sales", "Sale review & corrections"],
  ["competitions", "Competition schedule"],
  ["targets/rules", "Advanced target rules"],
  ["targets/agents", "Agent assignments"],
  ["targets/teams", "Team assignments"],
  ["bonus-review", "Bonus review"],
  ["bonuses/history", "Compensation history"],
  ["users", "Admin access"],
  ["rewards", "Rewards studio"],
  ["agents", "Agent display"],
  ["teams", "Team display"],
  ["arena-control", "Live TV Control"],
];
const groups: Record<string, string> = {
  overview: "COMMAND",
  programs: "COMPETITION",
  "reward-operations": "RECOGNITION",
  appearance: "PRESENTATION",
  security: "SYSTEM",
};
const routeNames: Record<string, string> = {
  "spin-wheel": "spin-management",
  health: "system-health",
  programs: "reward-programs",
  participants: "agents",
  "reward-operations": "rewards",
  effects: "celebrations",
  "reward-history": "spin-history",
  integration: "integration-preview",
};
const titles: Record<string, string> = {
  overview: "Arena Command Overview",
  "spin-wheel": "Reward Wheel Studio",
  health: "Broadcast System Health",
  programs: "Recognition Programs",
  "live-control": "Live Broadcast Director",
  participants: "Arena Participants",
  performance: "Competition Performance",
  targets: "Target Configuration Studio",
  "reward-operations": "Reward Operations",
  leaderboard: "Leaderboard Composer",
  effects: "Recognition Engine",
  "reward-history": "Spin History & Results",
  appearance: "Broadcast Appearance & Soundboard",
  integration: "Broadcast Rehearsal Studio",
  security: "Access & Security Perimeter",
  account: "Operator Account",
};
export default function Admin() {
  const s = useData(),
    u = session(s),
    [profile, pick] = useState(s.users[0].id),
    [collapsed, toggle] = useState(
      () => localStorage.getItem("arena.console.collapsed") === "true",
    ),
    [drawer, setDrawer] = useState(false),
    [error, err] = useState(""),
    [, refresh] = useState(0);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    const t = setInterval(() => refresh((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);
  const requestedPath =
      location.pathname.replace(/\/$/, "").split("/").slice(2).join("/") ||
      "overview",
    path =
      Object.entries(routeNames).find(
        ([, route]) => route === requestedPath,
      )?.[0] || requestedPath,
    page =
      pages.find((p) => p[0] === path) || secondary.find((p) => p[0] === path);
  if (!dev || !u)
    return (
      <div className="ops op-gate">
        <section>
          <div className="gate-mark">
            <Crest />
          </div>
          <small>LIVE SALES & REWARDS</small>
          <h1>{dev ? "Development workspace" : "Admin access unavailable"}</h1>
          <p>
            {dev
              ? "Choose a fictional operator profile. Browser-local sessions expire after one hour."
              : "Connect a server-side identity provider and operations API to enable administration."}
          </p>
          {dev && (
            <>
              <label>
                Demo operator
                <select value={profile} onChange={(e) => pick(e.target.value)}>
                  {s.users
                    .filter((x) => x.active)
                    .map((x) => (
                      <option value={x.id} key={x.id}>
                        {x.name} · {x.role}
                      </option>
                    ))}
                </select>
              </label>
              <button
                className="primary"
                onClick={() =>
                  void signIn(profile).catch((e) => err(e.message))
                }
              >
                Enter development workspace →
              </button>
            </>
          )}
          <p role="alert">{error}</p>
          <a href="/arena">Open Live Arena ↗</a>
        </section>
      </div>
    );
  return (
    <div
      className={
        "ops op-shell simple-console velocity-console " +
        (collapsed ? "is-collapsed " : "") +
        (drawer ? "drawer-open" : "")
      }
    >
      {drawer && (
        <button
          className="console-scrim"
          aria-label="Close navigation"
          onClick={() => setDrawer(false)}
        />
      )}
      <nav id="console-navigation" aria-label="Arena control navigation">
        <div className="op-brand">
          <Crest wordmark />
        </div>
        {core
          .filter((p) => allowed(u, p[0]))
          .map(([id, label]) => {
            const I = pages.find((p) => p[0] === id)?.[2] || Settings2;
            return (
              <Fragment key={id}>
                <a
                  href={
                    id === "overview"
                      ? "/admin"
                      : "/admin/" + (routeNames[id] || id)
                  }
                  aria-current={id === sectionFor(path) ? "page" : undefined}
                  title={label}
                >
                  <I size={17} />
                  <span>{label}</span>
                </a>
              </Fragment>
            );
          })}
        <ConsoleStatus s={s} />
        <div className="op-identity">
          <b>{u.name}</b>
          <p>{u.role}</p>
          <button onClick={() => void signOut().catch(reportServiceError)}>End session</button>
        </div>
      </nav>
      <div className="op-work">
        <div className="op-top">
          <button
            aria-label="Toggle navigation"
            aria-controls="console-navigation"
            aria-expanded={
              matchMedia("(max-width: 800px)").matches ? drawer : !collapsed
            }
            onClick={() => {
              if (matchMedia("(max-width: 800px)").matches) setDrawer(!drawer);
              else {
                toggle(!collapsed);
                localStorage.setItem(
                  "arena.console.collapsed",
                  String(!collapsed),
                );
              }
            }}
          >
            <Menu size={18} />
          </button>
          <span>
            Arena Control <em>/</em>{" "}
            {core.find((p) => p[0] === sectionFor(path))?.[1] ||
              page?.[1] ||
              "Unknown route"}
          </span>
          <div className="console-top-chips">
            <span>{s.settings.mode}</span>
            <span>
              {s.broadcast.rotationPaused
                ? "ROTATION PAUSED"
                : s.broadcast.rotation
                  ? "AUTO ROTATION"
                  : "MANUAL"}
            </span>
            <span>{s.settings.sound ? "SOUND ON" : "MUTED"}</span>
          </div>
          <a href="/arena" target="_blank">
            <Monitor size={15} /> Live Arena ↗
          </a>
        </div>
        <div className="op-body">
          <h1>
            {core.find((p) => p[0] === sectionFor(path))?.[1] ||
              titles[path] ||
              page?.[1] ||
              "Page unavailable"}
          </h1>
          <p className="dev-label">
            {path === "overview"
              ? "Manage your live championship broadcast from one central console."
              : "Manage your Arena. Changes stay synchronized in this browser."}
          </p>
          {allowed(u, path) &&
            ["targets", "participants", "account"].includes(
              sectionFor(path),
            ) && <QuickPreview />}
          <SectionLinks path={path} u={u} />
          {!page || !allowed(u, path) ? (
            <p role="alert">This page is unavailable for your profile.</p>
          ) : path === "overview" ? (
            <VelocityDashboard s={s} u={u} />
          ) : ["live-control", "arena-control"].includes(path) ? (
            <SimpleLive s={s} />
          ) : ["spin-wheel", "reward-operations", "rewards"].includes(path) ? (
            <SimpleRewards
              s={s}
              u={u}
              initial={path === "spin-wheel" ? "preview" : "prizes"}
            />
          ) : [
              "health",
              "programs",
              "performance",
              "reward-operations",
              "integration",
              "security",
              "account",
              "appearance",
            ].includes(path) ? (
            <ConsoleSection s={s} u={u} path={path} />
          ) : path === "effects" ? (
            <RecognitionEngine s={s} />
          ) : path === "overview" ? (
            <Home s={s} u={u} />
          ) : ["live-control", "arena-control"].includes(path) ? (
            <LiveControl s={s} />
          ) : path === "modes" ? (
            <Modes s={s} />
          ) : path === "leaderboard" ? (
            <Leaderboard s={s} />
          ) : ["participants", "agents", "teams"].includes(path) ? (
            <Participants s={s} u={u} />
          ) : path === "targets" || path === "bonuses" ? (
            <Milestones s={s} bonus={path === "bonuses"} />
          ) : path === "bonus-review" ? (
            <Targets s={s} u={u} path="bonuses" />
          ) : path.startsWith("targets/") || path.startsWith("bonuses/") ? (
            <Targets s={s} u={u} path={path} />
          ) : path === "spin-wheel" ? (
            <Wheel s={s} u={u} />
          ) : path === "reward-history" ? (
            <RewardHistory s={s} u={u} />
          ) : ["appearance", "effects", "branding"].includes(path) ? (
            <Presentation
              s={s}
              kind={path as "appearance" | "effects" | "branding"}
            />
          ) : path === "activity" ? (
            <ActivityLog />
          ) : path === "sales" ? (
            <Sales s={s} u={u} />
          ) : path === "rewards" ? (
            <Rewards s={s} u={u} />
          ) : path === "settings" ? (
            <>
              <Settings s={s} />
              <section className="op-panel">
                <h2>Operational workflows</h2>
                <p>
                  Existing source review, corrections and compensation audit
                  remain available.
                </p>
                <div className="op-actions">
                  {secondary
                    .slice(0, 7)
                    .filter(([p]) => allowed(u, p))
                    .map(([p, n]) => (
                      <a key={p} href={"/admin/" + p}>
                        {n} →
                      </a>
                    ))}
                </div>
              </section>
            </>
          ) : (
            <Catalog
              kind={path === "competitions" ? "competitions" : "users"}
              s={s}
              u={u}
            />
          )}
        </div>
      </div>
    </div>
  );
}
