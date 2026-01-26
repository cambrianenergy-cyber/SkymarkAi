import React from "react";
import OrchestratorObservabilityDashboard from "../../../components/OrchestratorObservabilityDashboard";

export default function ObservabilityPage() {
  // For demo, you can hardcode or fetch workspaceId from context/session
  const workspaceId = typeof window !== "undefined" ? (window.localStorage.getItem("workspaceId") || "demo-workspace") : "demo-workspace";
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <h1>Orchestrator Observability Dashboard</h1>
      <OrchestratorObservabilityDashboard workspaceId={workspaceId} />
      <div style={{ marginTop: 32, fontSize: 14, color: "#666" }}>
        <b>Prometheus metrics endpoint:</b> <code>/api/metrics/prometheus?workspaceId=YOUR_WORKSPACE_ID</code>
      </div>
    </main>
  );
}
