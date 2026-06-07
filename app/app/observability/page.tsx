import React from "react";
import OrchestratorObservabilityDashboard from "../../../components/OrchestratorObservabilityDashboard";

export default function ObservabilityPage() {
  // Use the user's workspaceId everywhere
  const workspaceId = "V7kzoES7soCvRCWa74Kg";
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
      <h1>Orchestrator Observability Dashboard</h1>
      <OrchestratorObservabilityDashboard workspaceId={workspaceId} />
      <div style={{ marginTop: 32, fontSize: 14, color: "#666" }}>
        <b>Prometheus metrics endpoint:</b> <code>/api/metrics/prometheus?workspaceId=V7kzoES7soCvRCWa74Kg</code>
      </div>
    </main>
  );
}
