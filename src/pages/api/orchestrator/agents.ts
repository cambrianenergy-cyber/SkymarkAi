// List all agents for a workspace (for dashboard liveness)
import { db } from "@/lib/orchestrator/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { workspaceId } = req.query;
  if (!workspaceId) return res.status(400).json({ agents: [] });
  const q = query(
    collection(db, "agents"),
    where("workspaceId", "==", workspaceId)
  );
  const snap = await getDocs(q);
  const agents = snap.docs.map(d => ({ agentId: d.id, ...d.data() }));
  res.json({ agents });
}