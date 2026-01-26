import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

interface AgentRun {
  runId: string;
  agentType: string;
  workflowName?: string;
  triggerSource: string;
  status: string;
  startedAt?: any;
  completedAt?: any;
  outputs?: any;
  error?: any;
}

export default function AgentActivityLog({ workspaceId }: { workspaceId: string }) {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    const q = query(
      collection(db, "agent_runs"),
      orderBy("startedAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setRuns(snap.docs.map((d) => ({ runId: d.id, ...d.data() } as AgentRun)));
      setLoading(false);
    });
    return () => unsub();
  }, [workspaceId]);

  if (loading) return <div>Loading agent activity</div>;
  if (!runs.length) return <div>No recent agent activity.</div>;

  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", marginBottom: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1976d2', marginBottom: 12 }}>Recent Agent & Workflow Activity</h3>
      <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#e3f2fd" }}>
            <th style={{ textAlign: "left", padding: 6 }}>Time</th>
            <th style={{ textAlign: "left", padding: 6 }}>Agent</th>
            <th style={{ textAlign: "left", padding: 6 }}>Workflow</th>
            <th style={{ textAlign: "left", padding: 6 }}>Trigger</th>
            <th style={{ textAlign: "left", padding: 6 }}>Status</th>
            <th style={{ textAlign: "left", padding: 6 }}>Output/Error</th>
          </tr>
        </thead>
        <tbody>
          {runs.map(run => (
            <tr key={run.runId} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: 6 }}>{run.startedAt?.toDate ? run.startedAt.toDate().toLocaleString() : ""}</td>
              <td style={{ padding: 6 }}>{run.agentType}</td>
              <td style={{ padding: 6 }}>{run.workflowName || ""}</td>
              <td style={{ padding: 6 }}>{run.triggerSource}</td>
              <td style={{ padding: 6 }}>{run.status}</td>
              <td style={{ padding: 6, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {run.status === "failed" ? (run.error?.message || "Error") : (run.outputs?.summary || "")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

