import React, { useEffect, useState } from "react";


export default function WorkspaceKnowledgeInspector({ workspaceId }: { workspaceId: string }) {
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    fetch(`/api/knowledge?workspaceId=${encodeURIComponent(workspaceId)}`)
      .then(res => res.json())
      .then(data => {
        setKnowledge(data.knowledge || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [workspaceId]);

  return (
    <div style={{ padding: 24, background: "#f8fafc", borderRadius: 12, boxShadow: "0 2px 8px #e0e7ef" }}>
      <h2>Workspace Knowledge Inspector</h2>
      {loading ? <div>Loading...</div> : (
        <table style={{ width: "100%", fontSize: 15, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#e3e8ef" }}>
              <th>Type</th>
              <th>Content</th>
              <th>Tags</th>
              <th>Confidence</th>
              <th>Reinforced</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {knowledge.map(k => (
              <tr key={k.knowledgeId} style={{ borderBottom: "1px solid #e0e7ef" }}>
                <td>{k.type}</td>
                <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.content}</td>
                <td>{Array.isArray(k.tags) ? k.tags.join(", ") : ""}</td>
                <td>{k.confidence}</td>
                <td>{k.reinforced}</td>
                <td>{new Date(k.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
