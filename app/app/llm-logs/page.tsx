import React from "react";
import LLMLogsDashboard from "../../../components/LLMLogsDashboard";

export default function LLMLogsPage() {
  // Use the user's workspaceId everywhere
  const workspaceId = "V7kzoES7soCvRCWa74Kg";
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
      <h1>LLM Logs Dashboard</h1>
      <LLMLogsDashboard workspaceId={workspaceId} />
    </main>
  );
}
