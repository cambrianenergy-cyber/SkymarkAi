import type { WorkspaceKnowledge } from "./types";
import { db } from "../orchestrator/firestore";

// Add knowledge to workspace
export async function addWorkspaceKnowledge(knowledge: WorkspaceKnowledge) {
  await db().collection("workspace_knowledge").doc(knowledge.knowledgeId).set(knowledge);
}

// Retrieve workspace knowledge by type/tags
export async function getWorkspaceKnowledge({ workspaceId, type, tags, limit = 20 }: {
  workspaceId: string;
  type?: string;
  tags?: string[];
  limit?: number;
}): Promise<WorkspaceKnowledge[]> {
  let q = db().collection("workspace_knowledge")
    .where("workspaceId", "==", workspaceId);
  if (type) q = q.where("type", "==", type);
  // Simple tag filter (for demo)
  if (tags && tags.length > 0) q = q.where("tags", "array-contains-any", tags);
  return (await q.orderBy("updatedAt", "desc").limit(limit).get()).docs.map(d => d.data() as WorkspaceKnowledge);
}

// Decay/expire old knowledge
export async function decayWorkspaceKnowledge({ workspaceId, now }: { workspaceId: string; now: number; }) {
  const docs = await db().collection("workspace_knowledge")
    .where("workspaceId", "==", workspaceId)
    .where("decayAt", "<=", now)
    .get();
  for (const doc of docs.docs) {
    await doc.ref.delete();
  }
}

// Reinforce knowledge (increase reinforcement score)
export async function reinforceWorkspaceKnowledge(knowledgeId: string, amount: number = 1) {
  const ref = db().collection("workspace_knowledge").doc(knowledgeId);
  await ref.update({ reinforced: amount, updatedAt: Date.now() });
}
