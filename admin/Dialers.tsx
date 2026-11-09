import { useState } from "react";
import { Panel, Badge, Table, Modal } from "./ui";
import { type Data, type AdminUser, type DialerConnection, type AgentDialerMapping } from "./model";
import { format } from "./Catalog";
import { command, submitSale, review } from "./service";
import { Radio, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRightLeft, Plus } from "lucide-react";

export function Dialers({ s, u }: { s: Data; u: AdminUser }) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [mappingModal, setMappingModal] = useState<AgentDialerMapping | null>(null);
  const [testSimulating, setTestSimulating] = useState<string | null>(null);

  const dialers: DialerConnection[] = s.dialers || [
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

  const mappings: AgentDialerMapping[] = s.agentMappings || s.agents.flatMap((a) => [
    {
      internalAgentId: a.id,
      sourceDialerId: "dialer-a",
      externalDialerAgentId: "DA-" + (100 + a.id),
      mappingStatus: "Mapped",
      assignedTeam: a.team,
      updatedAt: new Date().toISOString(),
    },
    {
      internalAgentId: a.id,
      sourceDialerId: "dialer-b",
      externalDialerAgentId: "DB-" + (200 + a.id),
      mappingStatus: "Mapped",
      assignedTeam: a.team,
      updatedAt: new Date().toISOString(),
    },
  ]);

  const handleSync = (dialerId: string) => {
    setSyncing(dialerId);
    command("arena-control", "dialer.sync", dialerId, (store) => {
      store.dialers ??= dialers;
      const d = store.dialers.find((x) => x.id === dialerId);
      if (d) {
        d.lastSuccessfulSync = new Date().toISOString();
        d.latestEventReceived = new Date().toISOString();
        d.status = "Connected";
        d.pendingEvents = 0;
      }
      return `Synchronized connection health for ${dialerId}`;
    });
    setTimeout(() => setSyncing(null), 600);
  };

  const handleSimulateSale = (dialerId: string) => {
    setTestSimulating(dialerId);
    const randomAgent = s.agents[Math.floor(Math.random() * s.agents.length)];
    const saleId = submitSale({
      agent: randomAgent.id,
      dialerId,
      notes: `Simulated live event from ${dialerId.toUpperCase()}`,
    });
    setTimeout(() => setTestSimulating(null), 500);
  };

  const handleSimulateValidation = () => {
    const pendingSale = s.sales.find((x) => x.status === "Pending");
    if (pendingSale) {
      review(pendingSale.id, "Approved", "Automated QA Verification Service");
    } else {
      // create a sale then validate
      const randomAgent = s.agents[0];
      const saleId = submitSale({
        agent: randomAgent.id,
        notes: "Automated test validation sale",
      });
      if (typeof saleId === "string") {
        review(saleId, "Approved", "Instant Test Validation");
      }
    }
  };

  return (
    <div className="dialer-management-container">
      <Panel
        title="Two-Dialer Integration & Synchronization"
        action={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="secondary"
              onClick={() => handleSimulateSale("dialer-a")}
              disabled={!!testSimulating}
            >
              + Ingest Sale (Dialer A)
            </button>
            <button
              className="secondary"
              onClick={() => handleSimulateSale("dialer-b")}
              disabled={!!testSimulating}
            >
              + Ingest Sale (Dialer B)
            </button>
            <button
              className="primary"
              onClick={handleSimulateValidation}
            >
              ✓ Validate Sale (Trigger Celebration)
            </button>
          </div>
        }
      >
        <p className="op-help" style={{ marginBottom: "1.2rem" }}>
          The Medicare Sales Arena connects two independent dialer systems (Dialer A & Dialer B).
          Sales first arrive in the <strong>Submitted</strong> state, updating submitted counters without awarding bonuses or victory fanfares.
          When verified by quality review or webhook confirmation, sales transition to <strong>Approved</strong>, recalculating rankings and triggering Live Arena celebrations.
        </p>

        <div className="dialer-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {dialers.map((d) => (
            <article
              key={d.id}
              style={{
                background: "var(--maroon-tone-2)",
                border: "1px solid var(--maroon-tone-4)",
                borderRadius: "8px",
                padding: "1.2rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Radio size={18} color="var(--mint)" />
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{d.name}</h3>
                </div>
                <Badge
                  value={d.status}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", fontSize: "0.85rem" }}>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Integration Mode</small>
                  <b>{d.integrationType}</b>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Mapping Health</small>
                  <span style={{ color: "var(--mint)", fontWeight: 600 }}>{d.agentMappingStatus}</span>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Last Sync</small>
                  <span>{d.lastSuccessfulSync ? format(d.lastSuccessfulSync) : "Never"}</span>
                </div>
                <div>
                  <small style={{ color: "var(--muted)", display: "block" }}>Pending / Failed</small>
                  <span>{d.pendingEvents} pending · {d.failedEvents} failed</span>
                </div>
              </div>

              <div style={{ marginTop: "auto", paddingTop: "0.6rem", borderTop: "1px solid var(--maroon-tone-3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <small style={{ color: "var(--muted)" }}>ID: <code>{d.id}</code></small>
                <button
                  className="secondary small"
                  onClick={() => handleSync(d.id)}
                  disabled={syncing === d.id}
                  style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
                >
                  <RefreshCw size={13} className={syncing === d.id ? "spin" : ""} />
                  {syncing === d.id ? "Syncing…" : "Check Health"}
                </button>
              </div>
            </article>
          ))}
        </div>

        <h3 style={{ fontSize: "1.15rem", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ArrowRightLeft size={18} />
          Agent Identity Mapping Across Dialers
        </h3>
        <p className="op-help" style={{ marginBottom: "1rem" }}>
          Agents operate across both dialers. Internal Arena IDs unify their sales across Dialer A and Dialer B so no agent is duplicated on the Live Arena.
        </p>

        <Table
          heads={[
            "Internal Agent",
            "Assigned Team",
            "Dialer Source",
            "External Dialer ID",
            "Status",
            "Last Updated",
          ]}
          rows={mappings.map((m) => {
            const agent = s.agents.find((a) => a.id === m.internalAgentId);
            const team = s.teams.find((t) => t.id === m.assignedTeam);
            return [
              <strong key="name">{agent?.name || `Agent #${m.internalAgentId}`}</strong>,
              <span key="team" style={{ color: team?.color }}>{team?.name || m.assignedTeam}</span>,
              <code key="dialer">{m.sourceDialerId === "dialer-a" ? "Dialer A (Primary)" : "Dialer B (Secondary)"}</code>,
              <code key="ext">{m.externalDialerAgentId}</code>,
              <Badge key="status" value={m.mappingStatus} />,
              <span key="time" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{format(m.updatedAt)}</span>,
            ];
          })}
        />
      </Panel>
    </div>
  );
}
