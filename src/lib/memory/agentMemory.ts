import type { AgentMemory } from "./types";
import { db } from "../orchestrator/firestore";

// Add memory (short or long term)
export async function addAgentMemory(memory: AgentMemory) {
  await db().collection("agent_memory").doc(memory.memoryId).set(memory);
}

// Retrieve agent memory by tier/type, with optional retrieval rules
export async function getAgentMemory({ workspaceId, agentId, tier, type, limit = 20 }: {
  workspaceId: string;
  agentId: string;
  tier?: string;
  type?: string;
  limit?: number;
}): Promise<AgentMemory[]> {
  let q = db().collection("agent_memory")
    .where("workspaceId", "==", workspaceId)
    .where("agentId", "==", agentId);
  if (tier) q = q.where("tier", "==", tier);
  if (type) q = q.where("type", "==", type);
  return (await q.orderBy("updatedAt", "desc").limit(limit).get()).docs.map(d => d.data() as AgentMemory);
}

// Decay/expire old memories
export async function decayAgentMemory({ workspaceId, agentId, now }: { workspaceId: string; agentId: string; now: number; }) {
  const docs = await db().collection("agent_memory")
    .where("workspaceId", "==", workspaceId)
    .where("agentId", "==", agentId)
    .where("decayAt", "<=", now)
    .get();
  for (const doc of docs.docs) {
    await doc.ref.delete();
  }
}

// Reinforce memory (increase reinforcement score)
export async function reinforceAgentMemory(memoryId: string, amount: number = 1) {
  const ref = db().collection("agent_memory").doc(memoryId);
  await ref.update({ reinforced: amount, updatedAt: Date.now() });
}
