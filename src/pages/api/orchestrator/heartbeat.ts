// Agent heartbeat endpoint: agents call this to report liveness
import { db, now } from "@/lib/orchestrator/firestore";
import { doc, setDoc } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { workspaceId, agentId } = req.body;
  if (!workspaceId || !agentId) return res.status(400).json({ error: "workspaceId and agentId required" });

  // Update agent doc with lastHeartbeat
  const ref = doc(db, `agents/${agentId}`);
  await setDoc(ref, { lastHeartbeat: now(), updatedAt: now() }, { merge: true });
  res.json({ ok: true, agentId, lastHeartbeat: new Date().toISOString() });
}
