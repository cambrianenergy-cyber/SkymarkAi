"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * If you already have a WorkspaceSwitcher component, update the import path below.
 * If not, this file includes a simple built-in fallback WorkspaceSwitcher.
 */
// import WorkspaceSwitcher from "@/components/workspaces/WorkspaceSwitcher";

type WorkspaceRole = "owner" | "admin" | "member";

type Workspace = {
  id: string;
  name: string;
  role: WorkspaceRole;
  createdAt?: number;
};

function RoleBadge({ role }: { role: WorkspaceRole }) {
  const label = role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Member";
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.18)",
        backgroundColor: "rgba(255,255,255,0.06)",
        fontSize: 12,
      }}
    >
      {label}
    </span>
  );
}

/** Fallback switcher so this file compiles even if your component doesn't exist yet */
function WorkspaceSwitcher({
  userEmail,
  workspaceName,
  onOpenWorkspaces,
}: {
  userEmail?: string | null;
  workspaceName?: string | null;
  onOpenWorkspaces: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        backgroundColor: "rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{userEmail ?? "Signed in"}</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          {workspaceName ? `Workspace: ${workspaceName}` : "No workspace selected"}
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenWorkspaces}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          backgroundColor: "rgba(255,255,255,0.06)",
          cursor: "pointer",
        }}
      >
        View Workspaces
      </button>
    </div>
  );
}

export default function WorkspacesPage() {
  const router = useRouter();

  // ---- state (fixes your missing setCreating, setWorkspaces, newWorkspaceName, etc.) ----
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // (Optional) Replace with your real auth user later
  const userEmail = "user@skymark.ai";

  // ---- load initial data (replace later with Firestore/DB call) ----
  useEffect(() => {
    // Seed demo data so the UI works immediately
    const demo: Workspace[] = [
      { id: "ws_1", name: "Skymark HQ", role: "owner", createdAt: Date.now() - 86400000 },
      { id: "ws_2", name: "Client Campaigns", role: "admin", createdAt: Date.now() - 43200000 },
      { id: "ws_3", name: "Sandbox", role: "member", createdAt: Date.now() - 21600000 },
    ];
    setWorkspaces(demo);
    setActiveWorkspaceId(demo[0]?.id ?? null);
  }, []);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId]
  );

  function openWorkspace(wsId: string) {
    setActiveWorkspaceId(wsId);
    // Navigate into the workspace area (adjust route to match your app)
    router.push(`/app/workspaces/${wsId}`);
  }

  async function handleCreateWorkspace() {
    const name = newWorkspaceName.trim();
    if (!name) return;

    setCreating(true);
    try {
      // Replace with your DB create call
      const newWs: Workspace = {
        id: `ws_${Math.random().toString(36).slice(2, 10)}`,
        name,
        role: "owner",
        createdAt: Date.now(),
      };

      setWorkspaces((prev) => [newWs, ...prev]);
      setActiveWorkspaceId(newWs.id);

      // reset form
      setNewWorkspaceName("");
      setShowCreateForm(false);

      // optional navigate right away
      router.push(`/app/workspaces/${newWs.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        backgroundColor: "#0b0f1a",
        color: "white",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Workspaces</h1>

        <WorkspaceSwitcher
          userEmail={userEmail}
          workspaceName={activeWorkspace?.name ?? null}
          onOpenWorkspaces={() => router.push("/app/workspaces")}
        />

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Create a new workspace</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              Use workspaces to separate clients, campaigns, and internal projects.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              backgroundColor: "rgba(255,255,255,0.06)",
              cursor: "pointer",
            }}
          >
            {showCreateForm ? "Close" : "New Workspace"}
          </button>
        </div>

        {showCreateForm && (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundColor: "rgba(0,0,0,0.25)",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Workspace name (e.g. Dallas Flooring Leads)"
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={handleCreateWorkspace}
              disabled={creating || !newWorkspaceName.trim()}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                backgroundColor: "rgba(255,255,255,0.10)",
                cursor: creating ? "not-allowed" : "pointer",
                opacity: creating || !newWorkspaceName.trim() ? 0.6 : 1,
              }}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 style={{ margin: "8px 0 0", fontSize: 18, fontWeight: 800 }}>Your Workspaces</h2>

          {workspaces.length === 0 ? (
            <div style={{ opacity: 0.8 }}>No workspaces yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => openWorkspace(ws.id)}
                  style={{
                    textAlign: "left",
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    backgroundColor: ws.id === activeWorkspaceId ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{ws.name}</div>
                    <RoleBadge role={ws.role} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                    ID: {ws.id}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
