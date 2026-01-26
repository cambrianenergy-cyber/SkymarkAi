// API endpoint to fetch LLM logs for a workspace
import { db } from "@/lib/orchestrator/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { workspaceId } = req.query;
  if (!workspaceId) return res.status(400).json({ logs: [] });
  const snap = await db().collection("llm_logs")
    .where("workspaceId", "==", workspaceId)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  res.json({ logs });
}
