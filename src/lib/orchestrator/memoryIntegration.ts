import { getAgentMemory } from '../memory/agentMemory';
import { getWorkspaceKnowledge } from '../memory/workspaceKnowledge';
import type { AgentTask } from './types';

// Fetch agent memory and workspace knowledge for a task
export async function fetchAgentContext(task: AgentTask) {
  const [shortTerm, longTerm, workspaceKnowledge] = await Promise.all([
    getAgentMemory({ workspaceId: task.workspaceId, agentId: task.agentId, tier: 'short_term', limit: 10 }),
    getAgentMemory({ workspaceId: task.workspaceId, agentId: task.agentId, tier: 'long_term', limit: 20 }),
    getWorkspaceKnowledge({ workspaceId: task.workspaceId, limit: 20 })
  ]);
  return {
    shortTerm,
    longTerm,
    workspaceKnowledge
  };
}
