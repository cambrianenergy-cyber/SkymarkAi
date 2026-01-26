import { db } from "@/lib/orchestrator/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { PLAN_CONFIG, Plan } from "@/lib/orchestrator/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { workspaceId, agent } = req.body;
  if (!workspaceId || !agent) return res.status(400).json({ error: "workspaceId and agent required" });

  // Fetch subscription/plan for workspace
  const subSnap = await db().collection("subscriptions").where("workspaceId", "==", workspaceId).limit(1).get();
  if (subSnap.empty) return res.status(403).json({ error: "No subscription found for workspace" });
  const sub = subSnap.docs[0].data();
  const plan: Plan = sub.plan;
  const agentLimit = PLAN_CONFIG[plan]?.agentLimit;

  // Count current agents
  const agentSnap = await db().collection("agents").where("workspaceId", "==", workspaceId).get();
  const agentCount = agentSnap.size;

  if (agentLimit !== null && agentCount >= agentLimit) {
    // Audit log for denied agent creation
    await db().collection("audit_logs").add({
      workspaceId,
      actorType: "user",
      action: "agent.creation.denied",
      entityType: "agent",
      entityId: null,
      before: null,
      after: { reason: `Agent limit reached for plan (${PLAN_CONFIG[plan].label}): ${agentLimit}` },
      createdAt: new Date(),
    });
    return res.status(403).json({ error: `Agent limit reached for plan (${PLAN_CONFIG[plan].label}): ${agentLimit}` });
  }

  // Create agent
  const ref = db().collection("agents").doc();
  await ref.set({ ...agent, agentId: ref.id, workspaceId, createdAt: new Date(), updatedAt: new Date() });
  return res.status(200).json({ ok: true, agentId: ref.id });
}
