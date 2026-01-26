"use client";

import { useWorkspace } from "../lib/useWorkspace";

interface WorkspaceSwitcherProps {
  user: any;
}

interface Workspace {
  id: string;
  name: string;
}

export function WorkspaceSwitcher({ user }: WorkspaceSwitcherProps) {
  const { workspaces, currentWorkspace, loading, switchWorkspace } = useWorkspace(user);

  if (loading || !currentWorkspace) {
    return null;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, opacity: 0.7 }}>
        Workspace:
      </label>
      <select
        value={currentWorkspace.id}
        onChange={(e) => {
          alert(`Switching to: ${e.target.value}`);
          switchWorkspace(e.target.value);
        }}
        style={{
          padding: "6px 12px",
          fontSize: 14,
          border: "1px solid #ddd",
          borderRadius: 4,
          backgroundColor: "#fff",
          cursor: "pointer",
        }}
      >
        {(workspaces as Workspace[]).map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name}
          </option>
        ))}
      </select>
      
      <a
        href="/app/workspaces"
        style={{
          padding: "6px 12px",
          fontSize: 12,
          border: "1px solid #0070f3",
          borderRadius: 4,
          backgroundColor: "#fff",
          color: "#0070f3",
          cursor: "pointer",
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Manage
      </a>
    </div>
  );
}
