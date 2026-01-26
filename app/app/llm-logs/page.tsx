import React from "react";
import LLMLogsDashboard from "../../../components/LLMLogsDashboard";

export default function LLMLogsPage() {
  // For demo, you can hardcode or fetch workspaceId from context/session
  const workspaceId = typeof window !== "undefined" ? (window.localStorage.getItem("workspaceId") || "demo-workspace") : "demo-workspace";
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
      <h1>LLM Logs Dashboard</h1>
      <LLMLogsDashboard workspaceId={workspaceId} />
    </main>
  );
}
