import { defaults } from "../broadcast/config";
import { initialTargets } from "../targets/engine";
import { agents, teams } from "../fixture";
import { prizes } from "../arenaEvents";
import type { Data, Sale } from "./model";
export function seed(): Data {
  const now = new Date(),
    stamp = now.toISOString(),
    midnight = new Date(stamp.slice(0, 10) + "T00:00:00Z").getTime();
  const sales: Sale[] = [];
  function add(agent: number, status: Sale["status"]) {
    const id = sales.length + 1;
    const at = new Date(
      midnight + ((now.getTime() - midnight) * ((id * 73) % 163)) / 164,
    ).toISOString();
    sales.push({
      id: "SA-" + String(id).padStart(5, "0"),
      agent,
      team: agents[agent].team,
      submitted: at,
      status,
      reviewer: status === "Pending" ? "" : "Morgan Ellis",
      reviewed: status === "Pending" ? "" : at,
      notes: "",
    });
  }
  agents.forEach((a) => {
    for (let i = 0; i < a.sales; i++) add(a.id, "Approved");
  });
  for (let i = 0; i < 8; i++) add(i, i < 6 ? "Pending" : "Rejected");
  return {
    agents: agents.map((a) => ({ ...a, active: true, avatar: "" })),
    teams: teams.map((name) => ({
      id: name,
      name,
      leader: String(agents.find((a) => a.team === name)!.id),
      active: true,
    })),
    sales,
    competitions: [
      {
        id: "daily",
        name: "Daily Championship",
        type: "Daily Sales Championship",
        description: "Daily approved sales standings",
        start: new Date(midnight).toISOString(),
        end: new Date(midnight + 86400000 - 1).toISOString(),
        teams: "",
        agents: "",
        status: "Active",
      },
    ],
    prizes: prizes.map((name, i) => ({
      id: "p" + i,
      name,
      description: "",
      type: "Recognition",
      color: i === 3 ? "#8b7340" : i % 2 ? "#142e4d" : "#285b86",
      icon: "",
      weight: 1,
      limit: 0,
      active: true,
    })),
    rules: [
      {
        id: "every-five",
        name: "Five approved sales",
        competition: "",
        agents: "",
        teams: "",
        start: "",
        end: "",
        threshold: 5,
        max: 0,
        active: true,
      },
    ],
    spins: sales
      .filter((x) => x.status === "Approved")
      .slice(0, 18)
      .map((x, i) => ({
        id: "SP-" + i,
        agent: x.agent,
        sale: x.id,
        rule: "every-five",
        prize: prizes[i % 6],
        prizeId: "p" + (i % 6),
        created: x.reviewed,
        completed: x.reviewed,
        fulfilled: true,
        voided: false,
      })),
    users: ["Super Admin", "Admin", "Sales Manager", "Arena Operator"].map(
      (r, i) => ({
        id: "u" + i,
        name: ["Morgan Ellis", "Alex Reed", "Taylor Lane", "Riley West"][i],
        role: r as Data["users"][number]["role"],
        active: true,
        team: i === 2 ? "Vanguard" : "",
      }),
    ),
    targets: initialTargets(),
    broadcast: defaults(),
    settings: {
      title: "SALES ARENA",
      brand: "MEDICARE",
      mode: "Daily Arena",
      sound: true,
      animations: true,
      intensity: "Standard",
      size: 10,
      timezone: "UTC",
      simulate: false,
    },
    queue: [],
    completed: [],
    audit: [
      {
        id: "init",
        actor: "Demo service",
        action: "workspace.initialized",
        entity: "Arena 01",
        time: stamp,
        detail: "Fictional operating ledger initialized.",
      },
    ],
    previous: agents.map((a) => a.id),
    sequence: 0,
    news: [
      "Jordan Hayes leads the field with 24 approved sales.",
      "Team Vanguard holds first place.",
    ],
    lastTick: Date.now(),
  };
}
