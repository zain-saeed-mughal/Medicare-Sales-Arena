import { rewardLabel, rewardSegment } from "./rewardLabel";
import { periodSnapshot } from "../arenaPeriods";
import { defaults, upgradeBroadcast } from "../broadcast/config";
import {
  initialTargets,
  earn,
  adjust,
  type BonusAward,
} from "../targets/engine";
import { useSyncExternalStore } from "react";
import { seed } from "./seed";
import {
  day,
  standings,
  participants,
  type Data,
  type AdminUser,
  type ArenaEvent,
  type Sale,
} from "./model";
const key = "medicare-arena.dev.v3";
const sessionKey = key + ".session";
export const dev = import.meta.env.DEV;
const read = (): Data => {
  const snapshot = JSON.parse(
    localStorage.getItem(key) || "null",
  ) as Data | null;
  if (!snapshot) return seed();
  for (const field of [
    "agents",
    "teams",
    "sales",
    "competitions",
    "prizes",
    "rules",
    "spins",
    "users",
    "audit",
    "queue",
    "completed",
    "previous",
    "news",
  ] as const) {
    if (!Array.isArray(snapshot[field]))
      throw Error(
        "Invalid saved ledger: " +
          field +
          ". Stored data has not been changed.",
      );
  }
  if (!snapshot.settings || typeof snapshot.settings.timezone !== "string")
    throw Error(
      "Invalid saved Arena settings. Stored data has not been changed.",
    );
  new Intl.DateTimeFormat("en", { timeZone: snapshot.settings.timezone });
  snapshot.targets ??= initialTargets();
  if (
    (snapshot.broadcast?.version || 0) < 2 &&
    snapshot.settings.title === "Live Sales Arena"
  )
    snapshot.settings.title = "Championship";
  if (
    (snapshot.broadcast?.version || 0) < 4 &&
    snapshot.settings.title === "Championship"
  )
    snapshot.settings.title = "SALES ARENA";
  if ((snapshot.broadcast?.version || 0) < 4) {
    // Only migrate the previous stock palette; custom prize colors and historical events stay intact.
    snapshot.prizes.forEach((p) => {
      if (p.color === "#14332d") p.color = "#142e4d";
      if (p.color === "#246151") p.color = "#285b86";
    });
  }
  snapshot.broadcast = upgradeBroadcast(
    snapshot.broadcast,
    snapshot.audit.some(
      (a) =>
        (["arena.presentation_updated", "arena.presentation_saved"].includes(
          a.action,
        ) &&
          a.entity === "appearance") ||
        a.action === "arena.theme_updated",
    ),
  );
  return snapshot;
};
const issueListeners = new Set<() => void>();
let issue = "";
export function reportServiceError(error: unknown) {
  issue = error instanceof Error ? error.message : String(error);
  console.error("Arena service:", error);
  issueListeners.forEach((fn) => fn());
}
export function useServiceIssue() {
  return useSyncExternalStore(
    (fn) => {
      issueListeners.add(fn);
      return () => {
        issueListeners.delete(fn);
      };
    },
    () => issue,
  );
}
function safeRead(): Data {
  try {
    return read();
  } catch (error) {
    reportServiceError(error);
    return seed();
  }
}
let state = dev ? safeRead() : seed();
export function retryService() {
  try {
    const next = read();
    issue = "";
    publish(next);
    issueListeners.forEach((fn) => fn());
  } catch (error) {
    reportServiceError(error);
  }
}
const listeners = new Set<() => void>();
function publish(value: Data) {
  state = value;
  listeners.forEach((fn) => fn());
}
const onStorage = (e: StorageEvent) => {
  if (dev && (e.key === key || e.key === null)) retryService();
};
window.addEventListener("storage", onStorage);
if (import.meta.hot)
  import.meta.hot.dispose(() =>
    window.removeEventListener("storage", onStorage),
  );
export function useData() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
  );
}
async function transaction(fn: (s: Data) => boolean | void) {
  if (!dev) throw Error("A production service connection is required.");
  await navigator.locks.request(key, () => {
    const s = read();
    if (fn(s) === false) return;
    localStorage.setItem(key, JSON.stringify(s));
    publish(s);
  });
}
export function session(s = state): AdminUser | undefined {
  let token;
  try {
    token = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
  } catch {
    return undefined;
  } // Corrupt or unavailable credentials fail closed; no ledger mutation.
  return token && token.until > Date.now()
    ? s.users.find((u) => u.id === token.id && u.active)
    : undefined;
}
export function audit(
  s: Data,
  actor: string,
  action: string,
  entity: string,
  detail: string,
) {
  s.audit.unshift({
    id: crypto.randomUUID(),
    actor,
    action,
    entity,
    detail,
    time: new Date().toISOString(),
  });
}
export async function signIn(id: string) {
  await transaction((s) => {
    const u = s.users.find((u) => u.id === id && u.active);
    if (!u) throw Error("Inactive demo profile");
    sessionStorage.setItem(
      sessionKey,
      JSON.stringify({ id, until: Date.now() + 3600000 }),
    );
    audit(s, u.name, "session.started", id, "One-hour development session");
  });
}
export async function signOut() {
  await transaction((s) => {
    audit(
      s,
      session(s)?.name || "Expired session",
      "session.ended",
      "session",
      "Signed out",
    );
    sessionStorage.removeItem(sessionKey);
  });
}
export function allowed(u: AdminUser, area: string) {
  const aliases: Record<string, string> = {
    health: "overview",
    account: "overview",
    security: "overview",
    programs: "targets",
    performance: "sales",
    "reward-operations": "rewards",
    integration: "arena-control",
    "live-control": "arena-control",
    modes: "arena-control",
    leaderboard: "arena-control",
    participants: "agents",
    "spin-wheel": "rewards",
    "reward-history": "rewards",
    appearance: "arena-control",
    effects: "arena-control",
    branding: "arena-control",
    access: "users",
  };
  area = aliases[area] || area;
  return (
    u.role === "Super Admin" ||
    ["overview", "activity"].includes(area) ||
    (u.role === "Admin" && !["users", "settings"].includes(area)) ||
    (u.role === "Arena Operator" && area === "arena-control") ||
    (u.role === "Sales Manager" && ["sales", "teams", "agents"].includes(area))
  );
}
export function command(
  area: string,
  action: string,
  entity: string,
  change: (s: Data, u: AdminUser) => string | false,
) {
  return transaction((s) => {
    const u = session(s);
    if (!u || !allowed(u, area))
      throw Error("Session expired or permission denied.");
    const detail = change(s, u);
    if (detail === false) return false;
    audit(s, u.name, action, entity, detail);
  });
}
export function checkTeam(u: AdminUser, team: string) {
  if (u.role === "Sales Manager" && u.team !== team)
    throw Error("Outside your assigned team.");
}
const uid = () => crypto.randomUUID();
function announce(s: Data, text: string) {
  s.news = [text, ...s.news].slice(0, 3);
}
function assignSpin(
  s: Data,
  event: ArenaEvent,
  sale: Sale,
  actor: string,
  ruleId: string,
  prizes: string[],
  entitlement = "",
) {
  const pool = s.prizes.filter(
    (p) =>
      p.active &&
      (!prizes.length || prizes.includes(p.id)) &&
      (!p.limit ||
        s.spins.filter((x) => x.prizeId === p.id && !x.voided).length <
          p.limit),
  );
  if (!pool.length) return false;
  const hash = Array.from(entitlement).reduce(
    (n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );
  const sample = entitlement ? hash / 4294967296 : Math.random();
  let pick = sample * pool.reduce((n, p) => n + p.weight, 0);
  const prize = pool.find((p) => (pick -= p.weight) < 0) || pool[0];
  event.segments = pool.map(rewardSegment);
  event.prizeIndex = pool.indexOf(prize);
  event.spin = entitlement || uid();
  s.spins.unshift({
    id: event.spin,
    agent: sale.agent,
    sale: sale.id,
    rule: ruleId,
    prize: rewardLabel(prize),
    prizeId: prize.id,
    created: sale.reviewed,
    completed: s.settings.animations ? "" : sale.reviewed,
    fulfilled: false,
    voided: false,
  });
  audit(s, actor, "reward.spin_earned", event.spin, prize.name);
  return true;
}
/** Bounded TV backlog. Accounting remains authoritative even under extreme presentation load. */
export function queuePresentation(s: Data, ...events: ArenaEvent[]) {
  for (const event of events) {
    event.eventId ??= "presentation:" + event.sequence;
    if (
      s.queue.some((e) => e.eventId === event.eventId) ||
      s.completed.some((e) => e.eventId === event.eventId)
    )
      continue;
    if (s.queue.length >= 96) {
      const removable = s.queue.findIndex(
        (e, i) => i > 0 && !e.spin && !e.target,
      );
      const index = removable >= 0 ? removable : 1;
      const skipped = s.queue.splice(index, 1)[0];
      const spin = s.spins.find((x) => x.id === skipped.spin);
      if (spin && !spin.completed) spin.completed = new Date().toISOString();
      s.completed.unshift(skipped);
      s.completed = s.completed.slice(0, 25);
      audit(
        s,
        "Arena",
        "presentation.capacity_skipped",
        String(skipped.sequence),
        "Broadcast backlog limit; original prize and reward records preserved.",
      );
    }
    s.queue.push(event);
  }
}
function enqueue(s: Data, sale: Sale, actor: string) {
  const entry = standings(s).find((a) => a.id === sale.agent)!;
  const team = s.teams.find((t) => t.id === sale.team)?.name || sale.team;
  const event: ArenaEvent = {
    sequence: ++s.sequence,
    eventId: sale.id + ":sale",
    agentId: sale.agent,
    avatar: entry.avatar,
    created: sale.reviewed,
    category: "sale",
    timeframe: "Daily",
    name: entry.name,
    team,
    sales: entry.sales,
    sale: sale.id,
    spin: "",
    demo: false,
  };
  const awards = earn(s, sale);
  const cues: ArenaEvent[] = [];
  let targetedSpin = false;
  for (const award of awards) {
    const cue: ArenaEvent = {
      ...event,
      sequence: cues.length ? ++s.sequence : event.sequence,
      eventId: sale.id + ":milestone:" + award.id,
      category: "milestone",
      timeframe: award.rule.scope,
      name: award.name,
      team: award.teamName,
      sales: award.count,
      previewPhase: cues.length ? "milestone" : undefined,
      target: {
        id: award.id,
        scope: award.rule.scope,
        name: award.rule.name,
        threshold: award.rule.threshold,
        minor: award.minor,
        currency: award.rule.currency,
        status: award.status,
        showMilestone: award.rule.showMilestone,
        showBonus: award.rule.showBonus,
      },
    };
    cues.push(cue);
    audit(
      s,
      actor,
      "target.achieved",
      award.id,
      award.rule.scope + " · " + award.count + " approved sales",
    );
    audit(s, actor, "bonus.earned", award.id, award.rule.name);
    const tickets = s.targets.entitlements.filter((t) => t.award === award.id);
    for (const [i, ticket] of tickets.entries()) {
      targetedSpin = true;
      const spinCue = i
        ? {
            ...cue,
            sequence: ++s.sequence,
            eventId: ticket.id + ":presentation",
            previewPhase: "unlock",
            spin: "",
          }
        : cue;
      if (
        assignSpin(
          s,
          spinCue,
          sale,
          actor,
          award.rule.id,
          award.rule.prizes,
          ticket.id,
        )
      ) {
        ticket.state = "Assigned";
        ticket.spin = spinCue.spin;
        if (i) cues.push(spinCue);
      }
    }
  }
  for (const rule of targetedSpin ? [] : s.rules) {
    const c = s.competitions.find((c) => c.id === rule.competition);
    const start = [rule.start, c?.start || ""].sort().at(-1)!;
    const end = [rule.end, c?.end || ""].filter(Boolean).sort()[0];
    if (
      !rule.active ||
      (rule.competition && (!c || c.status !== "Active")) ||
      sale.reviewed < start ||
      (end && sale.reviewed > end) ||
      !participants(rule.agents, sale.agent) ||
      !participants(rule.teams, sale.team) ||
      (c &&
        (!participants(c.agents, sale.agent) ||
          !participants(c.teams, sale.team)))
    )
      continue;
    const count = s.sales.filter(
      (x) =>
        x.agent === sale.agent &&
        x.status === "Approved" &&
        x.reviewed >= start &&
        (!end || x.reviewed <= end) &&
        participants(rule.teams, x.team) &&
        (!c || participants(c.teams, x.team)) &&
        day(x.reviewed, s.settings.timezone) ===
          day(sale.reviewed, s.settings.timezone),
    ).length;
    if (
      count % rule.threshold ||
      (rule.max &&
        s.spins.filter(
          (x) => !x.voided && x.rule === rule.id && x.agent === sale.agent,
        ).length >= rule.max)
    )
      continue;
    if (!assignSpin(s, event, sale, actor, rule.id, [])) continue;
    break;
  }
  if (cues.length && event.spin)
    cues.push({ ...event, sequence: ++s.sequence, previewPhase: "unlock" });
  if (s.settings.animations)
    queuePresentation(s, ...(cues.length ? cues : [event]));
  else if (event.spin)
    audit(
      s,
      actor,
      "reward.spin_completed",
      event.spin,
      "Assigned without animation",
    );
  announce(s, entry.name + " recorded an approved sale for " + team + ".");
}
function approve(s: Data, sale: Sale, actor: string) {
  const date = day(new Date().toISOString(), s.settings.timezone),
    before = periodSnapshot(s, "Daily Arena", date);
  s.previous = standings(s).map((a) => a.id);
  sale.status = "Approved";
  sale.reviewed = new Date().toISOString();
  sale.reviewer = actor;
  enqueue(s, sale, actor);
  const after = periodSnapshot(s, "Daily Arena", date);
  s.rankSnapshot = {
    day: date,
    baseline:
      s.rankSnapshot?.day === date
        ? s.rankSnapshot.baseline
        : before.field.map((a) => a.id),
    current: after.field.map((a) => a.id),
  };
  const agent = after.field.find((a) => a.id === sale.agent)!,
    previousRank = before.field.findIndex((a) => a.id === sale.agent) + 1,
    rank = after.field.findIndex((a) => a.id === sale.agent) + 1;
  if (
    s.settings.animations &&
    before.field[0]?.sales > 0 &&
    after.field[0]?.id !== before.field[0]?.id &&
    after.field[0]?.sales > (after.field[1]?.sales || 0)
  )
    queuePresentation(s, {
      sequence: ++s.sequence,
      eventId: sale.id + ":leader",
      agentId: agent.id,
      avatar: agent.avatar,
      created: sale.reviewed,
      category: "champion",
      name: agent.name,
      team: s.teams.find((t) => t.id === sale.team)?.name || sale.team,
      sales: agent.sales,
      sale: sale.id,
      spin: "",
      demo: false,
      previousRank,
      rank,
      timeframe: "Daily",
    });
  else if (s.settings.animations && previousRank > 3 && rank <= 3)
    queuePresentation(s, {
      sequence: ++s.sequence,
      eventId: sale.id + ":top3",
      agentId: agent.id,
      avatar: agent.avatar,
      created: sale.reviewed,
      category: "top3",
      name: agent.name,
      team: s.teams.find((t) => t.id === sale.team)?.name || sale.team,
      sales: agent.sales,
      sale: sale.id,
      spin: "",
      demo: false,
      previousRank,
      rank,
      timeframe: "Daily",
    });
  if (
    s.settings.animations &&
    before.teams[0]?.score > 0 &&
    after.teams[0]?.id !== before.teams[0]?.id &&
    after.teams[0]?.score > (after.teams[1]?.score || 0)
  )
    queuePresentation(s, {
      sequence: ++s.sequence,
      eventId: sale.id + ":team",
      created: sale.reviewed,
      category: "team",
      name: after.teams[0].name,
      team: after.teams[0].name,
      sales: after.teams[0].score,
      sale: sale.id,
      spin: "",
      demo: false,
      timeframe: "Daily",
    });
}
export function review(
  id: string,
  status: "Approved" | "Rejected" | "Cancelled",
  reason: string,
) {
  return command(
    "sales",
    status === "Cancelled" ? "sale.reversed" : "sale." + status.toLowerCase(),
    id,
    (s, u) => {
      const x = s.sales.find((x) => x.id === id);
      if (!x) throw Error("Sale not found");
      checkTeam(u, x.team);
      if (
        status === "Cancelled"
          ? x.status !== "Approved"
          : x.status !== "Pending"
      )
        return false;
      if (status !== "Approved" && !reason.trim())
        throw Error("A reason is required.");
      const priorReview = {
        status: x.status,
        reviewed: x.reviewed,
        reviewer: x.reviewer,
      };
      if (status === "Approved") approve(s, x, u.name);
      else {
        if (status === "Cancelled") {
          if (!["Super Admin", "Admin"].includes(u.role))
            throw Error("Administrator required");
          for (const award of s.targets.awards.filter((a) =>
            a.sales.includes(id),
          )) {
            if (adjust(s, award, id, u.name, reason))
              audit(s, u.name, "bonus.adjusted", award.id, reason);
          }
          s.queue = s.queue.filter((e) => e.sale !== id);
          announce(
            s,
            "Approval reversed for " +
              (s.agents.find((a) => a.id === x.agent)?.name || "agent") +
              ".",
          );
          s.spins
            .filter(
              (sp) =>
                sp.sale === id &&
                !s.targets.entitlements.some(
                  (e) => e.spin === sp.id && e.state === "Correction review",
                ),
            )
            .forEach((sp) => (sp.voided = true));
        }
        x.status = status;
        x.reviewer = u.name;
        x.reviewed = new Date().toISOString();
      }
      x.notes = [x.notes, reason.trim()].filter(Boolean).join("\n");
      return JSON.stringify({
        before: priorReview,
        after: { status, reviewed: x.reviewed, reviewer: x.reviewer },
        reason,
      });
    },
  );
}
export function preview(s: Data, kind: string, ruleId?: string) {
  const champion = standings(s)[0];
  if (!champion) return;
  const targetPreview = [
    "Target Milestone Preview",
    "Bonus Popup Preview",
    "Spin Unlock Preview",
  ].includes(kind);
  const rule = targetPreview
    ? s.targets.rules.find((r) => r.id === ruleId) ||
      s.targets.rules.find((r) => r.active)
    : undefined;
  if (targetPreview && !rule) throw Error("Choose a target rule to preview.");
  if (kind === "Spin Unlock Preview" && !rule?.spins)
    throw Error("This rule does not grant a spin.");
  const reward =
    (targetPreview && !!rule?.spins) ||
    ["Reward Spin Unlocked", "Reward Wheel Result", "reward"].includes(kind);
  const segments = s.prizes.filter(
    (p) => p.active && (!rule?.prizes.length || rule.prizes.includes(p.id)),
  );
  queuePresentation(s, {
    sequence: ++s.sequence,
    name: champion.name,
    team: s.teams.find((t) => t.id === champion.team)?.name || champion.team,
    sales: rule
      ? rule.threshold
      : kind === "Achievement Celebration"
        ? 10
        : kind === "2-sale bonus"
          ? 2
          : kind === "5-sale bonus"
            ? 5
            : kind === "10-sale bonus"
              ? 10
              : champion.sales,
    spin: "",
    sale: "",
    demo: true,
    category:
      kind === "New Champion"
        ? "champion"
        : kind === "Team Lead Change"
          ? "team"
          : undefined,
    previousRank: 2,
    rank: 1,
    target: rule
      ? {
          id: "rehearsal",
          scope: rule.scope,
          name: rule.name,
          threshold: rule.threshold,
          minor: rule.minor,
          currency: rule.currency,
          status: "Pending Review",
        }
      : /bonus|Achievement/i.test(kind)
        ? {
            id: "rehearsal",
            scope: "Daily",
            name: "Target rehearsal",
            threshold:
              kind === "2-sale bonus" ? 2 : kind === "5-sale bonus" ? 5 : 10,
            minor: 0,
            currency: "PKR",
            status: "Pending Review",
          }
        : undefined,
    segments: segments.map(rewardSegment),
    prizeIndex: reward && segments.length ? 0 : undefined,
    previewPhase: (
      {
        "Agent Spotlight": "spotlight",
        "Reward Spin Unlocked": "unlock",
        "Reward Wheel Result": "wheel",
        "Achievement Celebration": "milestone",
        "Target Milestone Preview": "milestone",
        "Bonus Popup Preview": "bonus",
        "Spin Unlock Preview": "unlock",
        "2-sale bonus": "milestone",
        "5-sale bonus": "milestone",
        "10-sale bonus": "milestone",
        "Leaderboard Rank Change": "rank",
      } as Record<string, string>
    )[kind],
  });
}
export const demo = (kind: string) =>
  transaction((s) => {
    for (let i = 0; i < (kind === "burst" ? 3 : 1); i++) preview(s, kind);
  });
export function finish(sequence: number) {
  return transaction((s) => {
    const e = s.queue[0];
    if (e?.sequence !== sequence) return false;
    s.queue.shift();
    s.completed.unshift(e);
    s.completed = s.completed.slice(0, 25);
    const spin = s.spins.find((sp) => sp.id === e.spin);
    if (spin && !spin.completed) {
      spin.completed = new Date().toISOString();
      audit(s, "Arena", "reward.spin_completed", spin.id, spin.prize);
      announce(s, e.name + " earned " + spin.prize + ".");
    }
  });
}
export function startSimulation() {
  if (!dev) return () => {};
  const interval = setInterval(() => {
    void transaction((s) => {
      if (!s.settings.simulate || Date.now() - s.lastTick < 22000) return false;
      s.lastTick = Date.now();
      const list = s.agents.filter(
        (a) => a.active && s.teams.some((t) => t.id === a.team && t.active),
      );
      if (!list.length) return;
      const agent =
        list[[2, 2, 2, 1, 4, 0, 3, 5][s.sequence % 8] % list.length];
      const sale: Sale = {
        id: "SA-" + uid().slice(0, 8),
        agent: agent.id,
        team: agent.team,
        submitted: new Date().toISOString(),
        status: "Pending",
        reviewer: "",
        reviewed: "",
        notes: "Simulated broadcast feed",
      };
      s.sales.push(sale);
      approve(s, sale, "Demo service");
      audit(s, "Demo service", "sale.approved", sale.id, agent.name);
    }).catch(reportServiceError);
  }, 22000);
  return () => clearInterval(interval);
}

export function retryEntitlements(id: string) {
  return command("bonuses", "reward.inventory_rechecked", id, (s, u) => {
    const award = s.targets.awards.find((a) => a.id === id);
    if (
      !award ||
      ["Rejected", "Adjusted"].includes(award.status) ||
      s.targets.adjustments.some((a) => a.award === id)
    )
      throw Error("Award unavailable");
    const sale = s.sales.find(
      (x) => x.id === award.source && x.status === "Approved",
    );
    if (!sale) throw Error("Qualifying sale unavailable");
    let count = 0;
    for (const ticket of s.targets.entitlements.filter(
      (e) => e.award === id && e.state === "Pending inventory",
    )) {
      const cue: ArenaEvent = {
        sequence: ++s.sequence,
        eventId: ticket.id + ":presentation",
        agentId: sale.agent,
        avatar: s.agents.find((a) => a.id === sale.agent)?.avatar,
        created: new Date().toISOString(),
        category: "milestone",
        timeframe: award.rule.scope,
        name: award.name,
        team: award.teamName,
        sales: award.count,
        sale: sale.id,
        spin: "",
        demo: false,
        previewPhase: "unlock",
        target: {
          id,
          name: award.rule.name,
          scope: award.rule.scope,
          threshold: award.rule.threshold,
          minor: award.minor,
          currency: award.rule.currency,
          status: award.status,
          showMilestone: award.rule.showMilestone,
          showBonus: award.rule.showBonus,
        },
      };
      if (
        !assignSpin(
          s,
          cue,
          sale,
          u.name,
          award.rule.id,
          award.rule.prizes,
          ticket.id,
        )
      )
        break;
      ticket.state = "Assigned";
      ticket.spin = cue.spin;
      if (s.settings.animations) queuePresentation(s, cue);
      count++;
    }
    return count + " pending spins assigned";
  });
}

/** Serialized display scheduler. Only actual broadcast clients call this. */
export function startRotation() {
  if (!dev) return () => {};
  const timer = setInterval(() => {
    if (document.hidden) return;
    void transaction((s) => {
      const c = s.broadcast,
        now = Date.now();
      if (!c.rotation) return false;
      const elapsed = Math.min(5000, now - (c.rotationTick || now));
      if (elapsed < 500) return false;
      c.rotationTick = now;
      if (c.effects.paused || c.rotationPaused || s.queue.length) {
        c.changedAt += elapsed;
        return;
      }
      if (now < c.manualUntil) return;
      const enabled = c.order.filter(
        (name) =>
          c.modes[name]?.enabled &&
          (name !== "Hall of Fame" || c.recognition.hall),
      );
      if (enabled.length < 2) return;
      if (now - c.changedAt < (c.modes[s.settings.mode]?.seconds || 20) * 1000)
        return;
      const index = enabled.indexOf(s.settings.mode);
      s.settings.mode = enabled[(index + 1) % enabled.length];
      c.changedAt = now;
    }).catch(reportServiceError);
  }, 1000);
  return () => clearInterval(timer);
}
