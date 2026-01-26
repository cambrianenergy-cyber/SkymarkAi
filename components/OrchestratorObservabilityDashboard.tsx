'use client';
import React, { useEffect, useState } from "react";

export default function OrchestratorObservabilityDashboard({ workspaceId }: { workspaceId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    fetch(`/api/orchestrator/observability?workspaceId=${workspaceId}`)
      .then(res => res.json())
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    // Fetch agents for liveness
    fetch(`/api/orchestrator/agents?workspaceId=${workspaceId}`)
      .then(res => res.ok ? res.json() : { agents: [] })
      .then(res => setAgents(res.agents || []))
      .catch(() => setAgents([]));
  }, [workspaceId]);

  if (!workspaceId) return <div>Workspace ID required</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  // Compute liveness for each agent
  const now = Date.now();
  const agentRows = agents.map(agent => {
    const last = agent.lastHeartbeat ? new Date(agent.lastHeartbeat._seconds * 1000) : null;
    const msAgo = last ? now - last.getTime() : null;
    const live = msAgo !== null && msAgo < 2 * 60 * 1000;
    return {
      ...agent,
      lastHeartbeat: last ? last.toISOString() : "never",
      liveness: live ? " live" : " stale",
      msAgo: msAgo !== null ? Math.round(msAgo / 1000) + "s ago" : "-",
    };
  });

  // Alerting logic
  const staleAgents = agentRows.filter(a => a.liveness !== " live");
  const failedTasks = (data.tasks || []).filter((t: any) => t.status === "failed");
  const failedRuns = (data.runs || []).filter((r: any) => r.status === "failed");
  const failedWorkflows = (data.workflows || []).filter((w: any) => w.status === "failed" || w.status === "partial");

  // Email alert logic: only send once per alert type per page load
  const [alertSent, setAlertSent] = React.useState(false);
  React.useEffect(() => {
    if (!alertSent && (staleAgents.length > 0 || failedTasks.length > 0 || failedRuns.length > 0 || failedWorkflows.length > 0)) {
      fetch("/api/orchestrator/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Uqentra Orchestrator Alert",
          message: `Stale agents: ${staleAgents.length}\nFailed tasks: ${failedTasks.length}\nFailed runs: ${failedRuns.length}\nFailed/partial workflows: ${failedWorkflows.length}`
        })
      }).then(() => setAlertSent(true)).catch(() => {});
    }
  }, [alertSent, staleAgents.length, failedTasks.length, failedRuns.length, failedWorkflows.length]);

  return (
    <div style={{ fontFamily: "monospace", padding: 16 }}>
      <h2>Orchestrator Observability</h2>
      <div>Timestamp: {data.timestamp}</div>
      {(staleAgents.length > 0 || failedTasks.length > 0 || failedRuns.length > 0 || failedWorkflows.length > 0) && (
        <div style={{ background: "#fff3cd", color: "#856404", border: "1px solid #ffeeba", padding: 12, margin: "16px 0", borderRadius: 6 }}>
          <b> Alerts:</b>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {staleAgents.length > 0 && <li>{staleAgents.length} agent(s) are <b>stale</b> (no heartbeat)</li>}
            {failedTasks.length > 0 && <li>{failedTasks.length} agent task(s) <b>failed</b></li>}
            {failedRuns.length > 0 && <li>{failedRuns.length} agent run(s) <b>failed</b></li>}
            {failedWorkflows.length > 0 && <li>{failedWorkflows.length} workflow run(s) <b>failed/partial</b></li>}
          </ul>
        </div>
      )}
      <h3>Agent Liveness</h3>
      <table style={{ borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Agent ID</th>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Name</th>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Last Heartbeat</th>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Liveness</th>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {agentRows.map(agent => (
            <tr key={agent.agentId} style={agent.liveness !== " live" ? { background: "#fff3cd" } : {}}>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{agent.agentId}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{agent.name}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{agent.lastHeartbeat}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{agent.liveness}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{agent.msAgo}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Agent Tasks</h3>
      <pre style={{ maxHeight: 200, overflow: "auto", background: "#f6f8fa" }}>{JSON.stringify(data.tasks, null, 2)}</pre>
      <h3>Agent Runs</h3>
      <pre style={{ maxHeight: 200, overflow: "auto", background: "#f6f8fa" }}>{JSON.stringify(data.runs, null, 2)}</pre>
      <h3>Workflow Runs</h3>
      <pre style={{ maxHeight: 200, overflow: "auto", background: "#f6f8fa" }}>{JSON.stringify(data.workflows, null, 2)}</pre>
    </div>
  );
}

