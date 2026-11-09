import { command } from "../admin/service";
import { day, type Data, type AdminUser } from "../admin/model";
import {
  can,
  adjust,
  type BonusAward,
  type TargetRule,
  type TargetAssignment,
  currencies,
  scopes,
} from "./engine";
export function authorized(u: AdminUser, p: Parameters<typeof can>[1]) {
  if (!can(u, p)) throw Error("Your profile lacks the " + p + " permission.");
}
export function overlaps(s: Data, r: TargetRule) {
  return s.targets.rules.filter(
    (o) =>
      o.id !== r.id &&
      o.active &&
      r.active &&
      o.scope === r.scope &&
      o.recipient === r.recipient &&
      (!r.end || !o.start || o.start <= r.end) &&
      (!o.end || !r.start || r.start <= o.end),
  );
}
function integer(n: number, min: number, max: number) {
  return Number.isSafeInteger(n) && n >= min && n <= max;
}
export function saveRule(r: TargetRule, ack: boolean) {
  return command("targets/rules", "target.rule_saved", r.id, (s, u) => {
    authorized(u, "configure");
    const old = s.targets.rules.find((x) => x.id === r.id);
    if (old && old.version !== r.version)
      throw Error("Rule changed. Reopen the editor.");
    if (
      !r.name.trim() ||
      !currencies.includes(r.currency) ||
      !scopes.includes(r.scope) ||
      !integer(r.threshold, 1, 100000) ||
      !integer(r.spins, 0, 20) ||
      !integer(r.minor, 0, 999999999999) ||
      !integer(r.maximum, 0, 100000) ||
      !integer(r.priority, 0, 1000)
    )
      throw Error("Check the name, currency, amount and numeric limits.");
    if (r.end && r.start && r.end < r.start)
      throw Error("End date precedes start date.");
    if (r.prizes.some((id) => !s.prizes.some((p) => p.id === id)))
      throw Error("Unknown wheel prize.");
    const conflicts = overlaps(s, r);
    if (conflicts.length && !ack)
      throw Error(
        "Confirm the overlap policy for " +
          conflicts.map((x) => x.name).join(", "),
      );
    const saved = {
      ...r,
      name: r.name.trim(),
      version: (old?.version || 0) + 1,
    };
    if (old) s.targets.rules[s.targets.rules.indexOf(old)] = saved;
    else s.targets.rules.push(saved);
    return JSON.stringify({ before: old, after: saved });
  });
}
export function assignTarget(a: TargetAssignment) {
  return command("targets", "target.assigned", a.id, (s, u) => {
    authorized(u, "assign");
    const r = s.targets.rules.find((r) => r.id === a.rule);
    if (!r || r.audience !== "Assigned")
      throw Error("Choose a rule with an assigned audience.");
    if (a.kind === "Agent" && r.recipient === "Team")
      throw Error("A team pool must be assigned to a team.");
    if (
      !(a.kind === "Agent" ? s.agents : s.teams).some(
        (m) => String(m.id) === a.member,
      )
    )
      throw Error("Select a recipient.");
    if (
      a.start < day(new Date().toISOString(), s.settings.timezone) ||
      (a.end && a.end < a.start)
    )
      throw Error(
        "Assignments start today or later and require a valid end date.",
      );
    if (
      s.targets.assignments.some(
        (x) =>
          x.rule === a.rule &&
          x.kind === a.kind &&
          x.member === a.member &&
          (!x.end || x.end >= a.start) &&
          (!a.end || a.end >= x.start),
      )
    )
      throw Error("An overlapping assignment already exists.");
    s.targets.assignments.push(a);
    return JSON.stringify(a);
  });
}
export type Decision =
  "Approve" | "Reject" | "Schedule" | "Record payment" | "Adjust" | "Add note";
export function decide(
  id: string,
  decision: Decision,
  note: string,
  reference: string,
  confirmed: boolean,
) {
  return command(
    "bonuses",
    "bonus." + decision.toLowerCase().replace(" ", "_"),
    id,
    (s, u) => {
      authorized(
        u,
        decision === "Record payment"
          ? "pay"
          : decision === "Adjust"
            ? "adjust"
            : "approve",
      );
      const a = s.targets.awards.find((a) => a.id === id);
      if (!a) throw Error("Missing award.");
      const before = a.status,
        at = new Date().toISOString();
      if (decision === "Approve" || decision === "Reject") {
        if (before !== "Pending Review")
          throw Error("Award has already been reviewed.");
        if (decision === "Reject" && !note.trim())
          throw Error("A reason is required.");
        a.status = decision === "Approve" ? "Approved" : "Rejected";
        a.approval = { actor: u.name, at, decision: a.status, note };
      } else if (decision === "Schedule") {
        if (before !== "Approved") throw Error("Approve before scheduling.");
        a.status = "Scheduled";
      } else if (decision === "Record payment") {
        if (
          !["Approved", "Scheduled"].includes(before) ||
          a.payment ||
          !confirmed
        )
          throw Error("Confirm an approved, externally completed payment.");
        a.status = "Paid";
        a.payment = { at, actor: u.name, reference: reference.trim() };
      } else if (decision === "Adjust") {
        if (!note.trim() || !adjust(s, a, "manual", u.name, note))
          throw Error("A new adjustment and reason are required.");
      } else if (!note.trim()) throw Error("Enter a note.");
      if (note.trim()) a.notes.push(u.name + " · " + at + " · " + note.trim());
      return JSON.stringify({ before, after: a.status, note, reference });
    },
  );
}
