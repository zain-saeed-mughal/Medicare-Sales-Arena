import { defaults } from "../broadcast/config";
import { initialTargets } from "../targets/engine";
import { agents, teams, teamColors, teamBadges } from "../fixture";
import { prizes } from "../arenaEvents";
import type { Data, Sale, DialerConnection, AgentDialerMapping, TVDisplaySession } from "./model";

export function seed(): Data {
  const now = new Date(),
    stamp = now.toISOString(),
    midnight = new Date(stamp.slice(0, 10) + "T00:00:00Z").getTime();
  const sales: Sale[] = [];

  function add(agent: number, status: Sale["status"], minutesOffset = 0) {
    const id = sales.length + 1;
    const baseTime = midnight + ((now.getTime() - midnight) * ((id * 73) % 163)) / 164;
    const submittedAt = new Date(baseTime + minutesOffset * 60000).toISOString();
    const isApproved = status === "Approved";
    const reviewedAt = isApproved ? new Date(new Date(submittedAt).getTime() + 180000).toISOString() : status === "Rejected" ? submittedAt : "";
    const dialerId = id % 2 === 0 ? "dialer-a" : "dialer-b";

    sales.push({
      id: "SA-" + String(id).padStart(5, "0"),
      agent,
      team: agents[agent].team,
      submitted: submittedAt,
      status,
      reviewer: isApproved ? "Morgan Ellis" : status === "Rejected" ? "Alex Reed" : "",
      reviewed: reviewedAt,
      notes: status === "Rejected" ? "Incomplete beneficiary verification document" : "",
      dialerId,
      externalSaleId: "EXT-" + (10000 + id),
      externalAgentId: dialerId === "dialer-a" ? "DA-" + (100 + agent) : "DB-" + (200 + agent),
      validatedAt: isApproved ? reviewedAt : undefined,
      validationSource: isApproved ? "Quality Assurance Review" : undefined,
    });
  }

  // Populate approved sales
  agents.forEach((a) => {
    for (let i = 0; i < a.sales; i++) add(a.id, "Approved", i * 2);
  });

  // Populate pending submitted sales so submitted > approved for active agents
  agents.forEach((a) => {
    const pendingCount = Math.max(0, (a.submitted ?? a.sales) - a.sales);
    for (let i = 0; i < pendingCount; i++) {
      add(a.id, "Pending", 120 + i * 5);
    }
  });

  // Add a few rejected and reversed sales for realistic audit
  add(0, "Rejected", 300);
  add(1, "Rejected", 310);
  add(2, "Cancelled", 320); // Reversed approved sale

  const dialers: DialerConnection[] = [
    {
      id: "dialer-a",
      name: "Dialer Primary (Alpha)",
      status: "Connected",
      integrationType: "Webhook",
      lastSuccessfulSync: new Date(Date.now() - 60000).toISOString(),
      latestEventReceived: new Date(Date.now() - 25000).toISOString(),
      pendingEvents: 0,
      failedEvents: 0,
      agentMappingStatus: "Complete",
    },
    {
      id: "dialer-b",
      name: "Dialer Secondary (Beta)",
      status: "Connected",
      integrationType: "REST API",
      lastSuccessfulSync: new Date(Date.now() - 120000).toISOString(),
      latestEventReceived: new Date(Date.now() - 40000).toISOString(),
      pendingEvents: 0,
      failedEvents: 0,
      agentMappingStatus: "Complete",
    },
  ];

  const agentMappings: AgentDialerMapping[] = agents.flatMap((a) => [
    {
      internalAgentId: a.id,
      sourceDialerId: "dialer-a",
      externalDialerAgentId: "DA-" + (100 + a.id),
      mappingStatus: "Mapped" as const,
      assignedTeam: a.team,
      updatedAt: stamp,
    },
    {
      internalAgentId: a.id,
      sourceDialerId: "dialer-b",
      externalDialerAgentId: "DB-" + (200 + a.id),
      mappingStatus: "Mapped" as const,
      assignedTeam: a.team,
      updatedAt: stamp,
    },
  ]);

  const tvDisplays: TVDisplaySession[] = [
    {
      id: "tv-main-floor",
      name: "Main Sales Floor 85\" Display",
      status: "Online",
      activeMode: "Daily Arena",
      soundEnabled: true,
      lastEventReceived: stamp,
      registeredAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: "tv-west-wing",
      name: "West Wing TV Arena Display",
      status: "Online",
      activeMode: "Weekly Arena",
      soundEnabled: false,
      lastEventReceived: stamp,
      registeredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];

  return {
    agents: agents.map((a) => ({ ...a, active: true, avatar: "" })),
    teams: teams.map((name) => {
      const leaderAgent = agents.find((a) => a.team === name) || agents[0];
      return {
        id: name,
        name,
        leader: String(leaderAgent.id),
        active: true,
        color: teamColors[name] || "#2dd4bf",
        badge: teamBadges[name] || name.slice(0, 2).toUpperCase(),
        dialerAssociations: ["dialer-a", "dialer-b"],
      };
    }),
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
        detail: "Medicare Sales Arena operating ledger initialized with multi-team & dialer integration readiness.",
      },
    ],
    previous: agents.map((a) => a.id),
    sequence: 0,
    news: [
      "Jordan Hayes leads the field with 24 approved sales (30 submitted).",
      "Team Vanguard holds first place in approved sales.",
      "Dialers Alpha and Beta synchronized and healthy.",
    ],
    lastTick: Date.now(),
    dialers,
    agentMappings,
    tvDisplays,
  };
}
