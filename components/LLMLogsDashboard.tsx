'use client';
import React, { useEffect, useState } from "react";

export default function LLMLogsDashboard({ workspaceId }: { workspaceId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    fetch(`/api/orchestrator/llm-logs?workspaceId=${workspaceId}`)
      .then(res => res.json())
      .then(res => setLogs(res.logs || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (!workspaceId) return <div>Workspace ID required</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!logs.length) return <div>No LLM logs found.</div>;

  return (
    <div style={{ fontFamily: "monospace", padding: 16 }}>
      <h2>LLM Logs</h2>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Time</th>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Agent</th>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Model</th>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Prompt</th>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Output</th>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Tokens</th>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Cost</th>
            <th style={{ border: "1px solid #ccc", padding: 4 }}>Validation</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{log.createdAt?.toDate?.().toLocaleString?.() || log.createdAt || "-"}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{log.agentId || "-"}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{log.model}</td>
              <td style={{ border: "1px solid #ccc", padding: 4, maxWidth: 200, overflow: "auto" }}>{log.input}</td>
              <td style={{ border: "1px solid #ccc", padding: 4, maxWidth: 200, overflow: "auto" }}>{log.outputText}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{log.usage ? (log.usage.tokensIn || 0) + (log.usage.tokensOut || 0) : "-"}</td>
              <td style={{ border: "1px solid #ccc", padding: 4 }}>{log.usage?.cost ? `$${log.usage.cost.toFixed(4)}` : "-"}</td>
              <td style={{ border: "1px solid #ccc", padding: 4, color: log.validation?.ok ? 'green' : 'red' }}>{log.validation?.ok ? "Valid" : (log.validation?.error || "Invalid")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
