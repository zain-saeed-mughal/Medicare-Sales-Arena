import { useState } from "react";
import { Panel, Badge, Table, Modal, Form } from "./ui";
import { type Data, type AdminUser, type Team, standings } from "./model";
import { command } from "./service";
import { ShieldCheck, Plus, Users, Award, Edit2, Palette } from "lucide-react";

export function TeamsManagement({ s, u }: { s: Data; u: AdminUser }) {
  const [addingTeam, setAddingTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const teamMetrics = s.teams.map((t) => {
    const teamAgents = s.agents.filter((a) => a.team === t.id);
    const teamSales = s.sales.filter((x) => x.team === t.id);
    const approved = teamSales.filter((x) => x.status === "Approved").length;
    const submitted = teamSales.length;
    const leaderAgent = s.agents.find((a) => String(a.id) === t.leader);

    return {
      team: t,
      agentsCount: teamAgents.length,
      approved,
      submitted,
      pending: Math.max(0, submitted - approved),
      leaderName: leaderAgent?.name || "Unassigned",
    };
  });

  const handleCreateTeam = (data: Record<string, string>) => {
    const id = data.name.trim();
    if (!id) return;
    command("teams", "team.created", id, (store) => {
      if (store.teams.some((t) => t.id.toLowerCase() === id.toLowerCase())) {
        throw Error("A team with this name already exists.");
      }
      const newTeam: Team = {
        id,
        name: data.name.trim(),
        leader: data.leader || "0",
        active: true,
        color: data.color || "#2dd4bf",
        badge: data.badge ? data.badge.toUpperCase().slice(0, 4) : id.slice(0, 2).toUpperCase(),
        dialerAssociations: ["dialer-a", "dialer-b"],
      };
      store.teams.push(newTeam);
      return `Created new team: ${newTeam.name}`;
    });
    setAddingTeam(false);
  };

  const handleUpdateTeam = (data: Record<string, string>) => {
    if (!editingTeam) return;
    command("teams", "team.updated", editingTeam.id, (store) => {
      const t = store.teams.find((x) => x.id === editingTeam.id);
      if (!t) throw Error("Team not found");
      t.name = data.name || t.name;
      t.color = data.color || t.color;
      t.badge = data.badge ? data.badge.toUpperCase() : t.badge;
      t.leader = data.leader || t.leader;
      t.active = data.active === "true";
      return `Updated team profile for ${t.name}`;
    });
    setEditingTeam(null);
  };

  return (
    <div className="teams-management-view">
      <Panel
        title="Medicare Sales Teams & Dialer Associations"
        action={
          <button className="primary" onClick={() => setAddingTeam(true)}>
            <Plus size={16} /> Create Team
          </button>
        }
      >
        <p className="op-help" style={{ marginBottom: "1.2rem" }}>
          The organization operates across {s.teams.length} active Medicare teams across two dialers.
          Historical sales retain their original recorded team attribution even if agents transfer teams in the future.
        </p>

        <Table
          heads={[
            "Badge / Color",
            "Team Name",
            "Team Leader",
            "Active Agents",
            "Submitted Sales",
            "Approved Sales",
            "Status",
            "Actions",
          ]}
          rows={teamMetrics.map(({ team: t, agentsCount, approved, submitted, pending, leaderName }) => [
            <div key="color" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: t.color || "#2dd4bf",
                }}
              />
              <strong style={{ fontFamily: "monospace", color: t.color || "inherit" }}>
                {t.badge || t.id.slice(0, 2)}
              </strong>
            </div>,
            <div key="name">
              <strong>{t.name}</strong>
              <small style={{ display: "block", color: "var(--muted)", fontSize: "0.75rem" }}>
                ID: {t.id}
              </small>
            </div>,
            <span key="leader">{leaderName}</span>,
            <span key="count">{agentsCount} agents</span>,
            <span key="sub" style={{ color: "var(--muted)" }}>{submitted} submitted</span>,
            <strong key="app" style={{ color: "var(--mint)" }}>{approved} approved</strong>,
            <Badge key="status" value={t.active ? "Active" : "Inactive"} />,
            <button
              key="edit"
              className="secondary small"
              onClick={() => setEditingTeam(t)}
              style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}
            >
              <Edit2 size={13} /> Edit
            </button>,
          ])}
        />
      </Panel>

      {addingTeam && (
        <Modal title="Create New Medicare Sales Team" close={() => setAddingTeam(false)}>
          <Form
            fields={[
              { key: "name", label: "Team Name", required: true },
              { key: "badge", label: "Team Badge (2-4 uppercase characters)", required: false },
              { key: "color", label: "Team Display Color (Hex)", required: false },
              {
                key: "leader",
                label: "Team Leader",
                type: "select",
                options: s.agents.map((a) => [String(a.id), a.name] as [string, string]),
              },
            ]}
            initial={{ color: "#38bdf8", badge: "", leader: s.agents[0] ? String(s.agents[0].id) : "" }}
            submit="Create Team"
            save={async (data) => handleCreateTeam(data)}
          />
        </Modal>
      )}

      {editingTeam && (
        <Modal title={`Edit Team: ${editingTeam.name}`} close={() => setEditingTeam(null)}>
          <Form
            fields={[
              { key: "name", label: "Team Name", required: true },
              { key: "badge", label: "Team Badge", required: false },
              { key: "color", label: "Team Color", required: false },
              {
                key: "leader",
                label: "Team Leader",
                type: "select",
                options: s.agents.map((a) => [String(a.id), a.name] as [string, string]),
              },
              {
                key: "active",
                label: "Active in Competitions",
                type: "select",
                options: [["true", "Active"], ["false", "Inactive"]],
              },
            ]}
            initial={{
              name: editingTeam.name,
              badge: editingTeam.badge || "",
              color: editingTeam.color || "#2dd4bf",
              leader: editingTeam.leader,
              active: String(editingTeam.active),
            }}
            submit="Save Team Changes"
            save={async (data) => handleUpdateTeam(data)}
          />
        </Modal>
      )}
    </div>
  );
}
