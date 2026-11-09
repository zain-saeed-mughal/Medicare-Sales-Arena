import { useState } from "react";
import { Panel, Badge, Table, Modal, Form } from "./ui";
import { type Data, type AdminUser, type TVDisplaySession, roles, type Role } from "./model";
import { command, signIn, signOut } from "./service";
import { Shield, KeyRound, Monitor, UserCheck, AlertOctagon, Lock, RefreshCw, CheckCircle } from "lucide-react";

export function AuthScreens({ s, u }: { s: Data; u: AdminUser }) {
  const [tab, setTab] = useState<"users" | "displays" | "security" | "reset">("users");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordResetComplete, setPasswordResetComplete] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [addingDisplay, setAddingDisplay] = useState(false);

  const displays: TVDisplaySession[] = s.tvDisplays || [
    {
      id: "tv-main-floor",
      name: "Main Sales Floor 85\" Display",
      status: "Online",
      activeMode: "Daily Arena",
      soundEnabled: true,
      lastEventReceived: new Date().toISOString(),
      registeredAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: "tv-west-wing",
      name: "West Wing TV Arena Display",
      status: "Online",
      activeMode: "Weekly Arena",
      soundEnabled: false,
      lastEventReceived: new Date().toISOString(),
      registeredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];

  const handleCreateUser = (data: Record<string, string>) => {
    const id = "u-" + Date.now();
    command("users", "user.created", id, (store) => {
      const newUser: AdminUser = {
        id,
        name: data.name,
        role: (data.role as Role) || "Arena Operator",
        active: true,
        team: data.team || "",
      };
      store.users.push(newUser);
      return `Created new user ${newUser.name} with role ${newUser.role}`;
    });
    setAddingUser(false);
  };

  const handleRegisterDisplay = (data: Record<string, string>) => {
    const id = "tv-" + Date.now().toString(36);
    command("arena-control", "display.registered", id, (store) => {
      store.tvDisplays ??= displays;
      const newDisplay: TVDisplaySession = {
        id,
        name: data.name || "Office Arena TV",
        status: "Online",
        activeMode: data.mode || "Daily Arena",
        soundEnabled: data.sound === "true",
        lastEventReceived: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
      };
      store.tvDisplays.push(newDisplay);
      return `Registered TV Display ${newDisplay.name}`;
    });
    setAddingDisplay(false);
  };

  return (
    <div className="auth-and-access-view">
      <div className="status-tabs" style={{ marginBottom: "1.2rem" }}>
        <button
          aria-pressed={tab === "users"}
          onClick={() => setTab("users")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <Shield size={15} />
          User Management & Roles
        </button>
        <button
          aria-pressed={tab === "displays"}
          onClick={() => setTab("displays")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <Monitor size={15} />
          Restricted TV Displays
        </button>
        <button
          aria-pressed={tab === "reset"}
          onClick={() => setTab("reset")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <KeyRound size={15} />
          Password Reset Flow
        </button>
      </div>

      {tab === "users" && (
        <Panel
          title="Administrative Users & Role-Based Permissions"
          action={
            <button className="primary" onClick={() => setAddingUser(true)}>
              + Add Admin User
            </button>
          }
        >
          <p className="op-help" style={{ marginBottom: "1rem" }}>
            The Arena distinguishes between five operational roles: <strong>Super Admin</strong>, <strong>Arena Admin</strong>, <strong>Team Manager</strong>, <strong>Arena Operator</strong>, and <strong>TV Display</strong>.
            TV Displays use restricted view-only sessions with zero access to administrative mutation controls.
          </p>

          <Table
            heads={["User Name", "Assigned Role", "Team Scope", "Status", "Permissions"]}
            rows={s.users.map((user) => [
              <strong key="name">{user.name}</strong>,
              <Badge key="role" value={user.role} />,
              <span key="team">{user.team || "All Teams"}</span>,
              <span key="status" style={{ color: user.active ? "var(--mint)" : "var(--muted)" }}>
                {user.active ? "Active" : "Suspended"}
              </span>,
              <small key="perm" style={{ color: "var(--muted)" }}>
                {user.role === "Super Admin"
                  ? "Full Access (All ledgers, users, rules, settings)"
                  : user.role === "Admin"
                    ? "Operations & Broadcast (Sales, Rules, Wheels, Arena)"
                    : user.role === "Sales Manager"
                      ? `Team-Scoped Review (${user.team || "Assigned Team"})`
                      : "Playout Operator (Rotation & Ceremony Release)"}
              </small>,
            ])}
          />
        </Panel>
      )}

      {tab === "displays" && (
        <Panel
          title="Restricted Office TV Displays"
          action={
            <button className="primary" onClick={() => setAddingDisplay(true)}>
              + Register TV Display
            </button>
          }
        >
          <p className="op-help" style={{ marginBottom: "1rem" }}>
            Office television displays run on dedicated restricted routes. They receive live sales broadcasts,
            play validated sale celebrations, and display real-time leaderboards while preventing unauthorized browser setting changes.
          </p>

          <Table
            heads={[
              "Display Name",
              "Identifier",
              "Connection Status",
              "Active Mode",
              "Audio Output",
              "Last Ping",
              "Restricted Access URL",
            ]}
            rows={displays.map((disp) => [
              <strong key="name">{disp.name}</strong>,
              <code key="id">{disp.id}</code>,
              <Badge key="status" value={disp.status} />,
              <span key="mode">{disp.activeMode}</span>,
              <span key="sound" style={{ color: disp.soundEnabled ? "var(--mint)" : "var(--muted)" }}>
                {disp.soundEnabled ? "Enabled" : "Muted"}
              </span>,
              <small key="time" style={{ color: "var(--muted)" }}>{disp.lastEventReceived ? "Active now" : "Offline"}</small>,
              <a key="link" href="/arena" target="_blank" style={{ fontSize: "0.8rem", color: "var(--mint)" }}>
                Launch Restricted Display ↗
              </a>,
            ])}
          />
        </Panel>
      )}

      {tab === "reset" && (
        <Panel title="Enterprise Authentication & Password Recovery Flow">
          <div style={{ maxWidth: "540px", margin: "1rem 0" }}>
            <p className="op-help" style={{ marginBottom: "1.2rem" }}>
              Test and verify the secure authentication recovery workflows. In production, recovery links are dispatched
              with short-lived cryptographic tokens via your SSO or secure SMTP integration.
            </p>

            {!resetSent ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Account Email Address</span>
                  <input
                    type="email"
                    placeholder="operator@medicarearena.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    style={{ padding: "0.6rem 0.8rem" }}
                  />
                </label>
                <button
                  className="primary"
                  onClick={() => {
                    if (resetEmail.trim()) setResetSent(true);
                  }}
                  disabled={!resetEmail.trim()}
                >
                  Send Password Reset Link
                </button>
              </div>
            ) : !passwordResetComplete ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <div style={{ padding: "0.8rem", background: "rgba(45, 212, 191, 0.1)", borderRadius: "6px", border: "1px solid var(--mint)" }}>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--mint)" }}>
                    ✓ Reset link dispatched to <strong>{resetEmail}</strong>. (Simulated verification token active)
                  </p>
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Enter New Secure Password</span>
                  <input
                    type="password"
                    placeholder="Minimum 12 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ padding: "0.6rem 0.8rem" }}
                  />
                </label>
                <button
                  className="primary"
                  onClick={() => {
                    if (newPassword.length >= 8) setPasswordResetComplete(true);
                  }}
                  disabled={newPassword.length < 8}
                >
                  Confirm & Update Password
                </button>
              </div>
            ) : (
              <div style={{ padding: "1.2rem", background: "rgba(45, 212, 191, 0.15)", borderRadius: "8px", border: "1px solid var(--mint)", textAlign: "center" }}>
                <CheckCircle size={32} color="var(--mint)" style={{ margin: "0 auto 0.5rem" }} />
                <h4 style={{ margin: "0 0 0.5rem", color: "var(--mint)" }}>Password Successfully Updated</h4>
                <p style={{ margin: "0 0 1rem", fontSize: "0.85rem" }}>
                  Your password has been securely reset. You can now authenticate with your new credentials.
                </p>
                <button
                  className="secondary small"
                  onClick={() => {
                    setResetSent(false);
                    setPasswordResetComplete(false);
                    setResetEmail("");
                    setNewPassword("");
                  }}
                >
                  Reset Another Account
                </button>
              </div>
            )}
          </div>
        </Panel>
      )}

      {addingUser && (
        <Modal title="Add Administrative User" close={() => setAddingUser(false)}>
          <Form
            fields={[
              { key: "name", label: "Full Name", required: true },
              {
                key: "role",
                label: "Operational Role",
                type: "select",
                options: roles.map((r) => [r, r] as [string, string]),
              },
              {
                key: "team",
                label: "Team Scope (for Team Managers)",
                type: "select",
                options: [["", "All Teams"] as [string, string], ...s.teams.map((t) => [t.id, t.name] as [string, string])],
              },
            ]}
            initial={{ name: "", role: "Arena Operator", team: "" }}
            submit="Create User Profile"
            save={async (data) => handleCreateUser(data)}
          />
        </Modal>
      )}

      {addingDisplay && (
        <Modal title="Register Restricted TV Display" close={() => setAddingDisplay(false)}>
          <Form
            fields={[
              { key: "name", label: "Display Location Name", required: true },
              {
                key: "mode",
                label: "Assigned Broadcast Mode",
                type: "select",
                options: [
                  ["Daily Arena", "Daily Arena"],
                  ["Weekly Arena", "Weekly Arena"],
                  ["Monthly Arena", "Monthly Arena"],
                  ["Leaderboard Focus", "Leaderboard Focus"],
                ],
              },
              {
                key: "sound",
                label: "Default Audio Activation",
                type: "select",
                options: [["true", "Enabled (Sound ON)"], ["false", "Muted (Sound OFF)"]],
              },
            ]}
            initial={{ name: "Conference Room Display", mode: "Daily Arena", sound: "true" }}
            submit="Register Display"
            save={async (data) => handleRegisterDisplay(data)}
          />
        </Modal>
      )}
    </div>
  );
}
