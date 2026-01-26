import { db } from "@/lib/orchestrator/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { PLAN_CONFIG, Plan } from "@/lib/orchestrator/types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { workspaceId, workflow } = req.body;
  if (!workspaceId || !workflow) return res.status(400).json({ error: "workspaceId and workflow required" });

  // Fetch subscription/plan for workspace
  const subSnap = await db().collection("subscriptions").where("workspaceId", "==", workspaceId).limit(1).get();
  if (subSnap.empty) return res.status(403).json({ error: "No subscription found for workspace" });
  const sub = subSnap.docs[0].data();
  const plan: Plan = sub.plan;
  const workflowLimit = PLAN_CONFIG[plan]?.workflowLimit;

  // Count current workflows
  const workflowSnap = await db().collection("workflows").where("workspaceId", "==", workspaceId).get();
  const workflowCount = workflowSnap.size;

  if (workflowLimit !== null && workflowCount >= workflowLimit) {
    return res.status(403).json({ error: `Workflow limit reached for plan (${PLAN_CONFIG[plan].label}): ${workflowLimit}` });
  }

  // Create workflow
  const ref = db().collection("workflows").doc();
  await ref.set({ ...workflow, workflowId: ref.id, workspaceId, createdAt: new Date(), updatedAt: new Date() });
  return res.status(200).json({ ok: true, workflowId: ref.id });
}
