// Observability hooks for orchestrator: exposes real-time status, metrics, and event logs
// This API can be expanded for dashboards, Prometheus, or external monitoring

import { db } from "@/lib/orchestrator/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET /api/orchestrator/observability?workspaceId=...  (optionally filter by agentId, runId, etc)
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { workspaceId, agentId, runId, status } = req.query;
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  // Gather recent agent_tasks
  const tasksSnap = await db()
    .collection("agent_tasks")
    .where("workspaceId", "==", workspaceId)
    .orderBy("updatedAt", "desc")
    .limit(50)
    .get();
  const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Gather recent agent_runs
  const runsSnap = await db()
    .collection("agent_runs")
    .where("workspaceId", "==", workspaceId)
    .orderBy("updatedAt", "desc")
    .limit(50)
    .get();
  const runs = runsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Gather recent workflow_runs
  const wfSnap = await db()
    .collection("workflow_runs")
    .where("workspaceId", "==", workspaceId)
    .orderBy("updatedAt", "desc")
    .limit(20)
    .get();
  const workflows = wfSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Optionally filter by agentId, runId, status
  const filter = (arr: any[]) => arr.filter(item =>
    (!agentId || item.agentId === agentId) &&
    (!runId || item.runId === runId || item.agentRunId === runId) &&
    (!status || item.status === status)
  );

  res.json({
    tasks: filter(tasks),
    runs: filter(runs),
    workflows: filter(workflows),
    timestamp: new Date().toISOString(),
  });
}
