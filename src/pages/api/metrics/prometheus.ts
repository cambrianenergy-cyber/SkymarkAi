// Prometheus metrics endpoint for orchestrator
// Exposes basic metrics for scraping
import { db } from "@/lib/orchestrator/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { workspaceId } = req.query;
  if (!workspaceId) return res.status(400).send("workspaceId required\n");

  // Count agent_tasks by status
  const statuses = ["queued", "running", "done", "failed"];
  let metrics = "";
  for (const status of statuses) {
    const snap = await db()
      .collection("agent_tasks")
      .where("workspaceId", "==", workspaceId)
      .where("status", "==", status)
      .get();
    metrics += `orchestrator_agent_tasks{status="${status}",workspace="${workspaceId}"} ${snap.size}\n`;
  }

  // Count agent_runs by status
  const runStatuses = ["queued", "running", "succeeded", "failed", "canceled"];
  for (const status of runStatuses) {
    const snap = await db()
      .collection("agent_runs")
      .where("workspaceId", "==", workspaceId)
      .where("status", "==", status)
      .get();
    metrics += `orchestrator_agent_runs{status="${status}",workspace="${workspaceId}"} ${snap.size}\n`;
  }

  // Count workflow_runs by status
  const wfStatuses = ["queued", "running", "succeeded", "failed", "partial", "canceled"];
  for (const status of wfStatuses) {
    const snap = await db()
      .collection("workflow_runs")
      .where("workspaceId", "==", workspaceId)
      .where("status", "==", status)
      .get();
    metrics += `orchestrator_workflow_runs{status="${status}",workspace="${workspaceId}"} ${snap.size}\n`;
  }

  res.setHeader("Content-Type", "text/plain; version=0.0.4");
  res.send(metrics);
}
