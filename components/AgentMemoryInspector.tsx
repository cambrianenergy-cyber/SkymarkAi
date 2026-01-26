import React, { useEffect, useState } from "react";
import { db } from "../src/lib/orchestrator/firestore";

export default function AgentMemoryInspector({ workspaceId, agentId }: { workspaceId: string; agentId: string }) {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId || !agentId) return;
    setLoading(true);
    db().collection("agent_memory")
      .where("workspaceId", "==", workspaceId)
      .where("agentId", "==", agentId)
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get()
      .then(snapshot => {
        setMemories(snapshot.docs.map(d => d.data()));
        setLoading(false);
      });
  }, [workspaceId, agentId]);

  return (
    <div style={{ padding: 24, background: "#f8fafc", borderRadius: 12, boxShadow: "0 2px 8px #e0e7ef" }}>
      <h2>Agent Memory Inspector</h2>
      {loading ? <div>Loading...</div> : (
        <table style={{ width: "100%", fontSize: 15, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#e3e8ef" }}>
              <th>Type</th>
              <th>Tier</th>
              <th>Content</th>
              <th>Confidence</th>
              <th>Reinforced</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {memories.map(m => (
              <tr key={m.memoryId} style={{ borderBottom: "1px solid #e0e7ef" }}>
                <td>{m.type}</td>
                <td>{m.tier}</td>
                <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.content}</td>
                <td>{m.confidence}</td>
                <td>{m.reinforced}</td>
                <td>{new Date(m.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
