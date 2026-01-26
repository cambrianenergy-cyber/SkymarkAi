import { reinforceAgentMemory } from '../memory/agentMemory';
import { reinforceWorkspaceKnowledge } from '../memory/workspaceKnowledge';

// Reinforce all agent memory and workspace knowledge IDs used in a task
export async function reinforceContextMemory({ memory, amount = 1 }: { memory: any; amount?: number }) {
  if (!memory) return;
  const promises: Promise<any>[] = [];
  if (Array.isArray(memory.shortTerm)) {
    for (const m of memory.shortTerm) promises.push(reinforceAgentMemory(m.memoryId, amount));
  }
  if (Array.isArray(memory.longTerm)) {
    for (const m of memory.longTerm) promises.push(reinforceAgentMemory(m.memoryId, amount));
  }
  if (Array.isArray(memory.workspaceKnowledge)) {
    for (const k of memory.workspaceKnowledge) promises.push(reinforceWorkspaceKnowledge(k.knowledgeId, amount));
  }
  await Promise.all(promises);
}
