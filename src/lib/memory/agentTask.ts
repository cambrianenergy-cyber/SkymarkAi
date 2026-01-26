import { db } from '../firebase';
import type { AgentTask } from '../firestoreTypes';
import { AgentTaskSchema } from '../firestoreTypes';

// Fetch an agent task by ID
export async function getAgentTask(taskId: string): Promise<AgentTask | null> {
  const doc = await db().collection('agent_tasks').doc(taskId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  // Validate with Zod
  const parsed = AgentTaskSchema.safeParse({ ...data, taskId });
  return parsed.success ? parsed.data : null;
}

// Create or update an agent task
export async function setAgentTask(task: AgentTask): Promise<void> {
  // Validate before writing
  AgentTaskSchema.parse(task);
  await db().collection('agent_tasks').doc(task.taskId).set(task);
}

// Example: process an agent task with type safety
export function processTask(task: AgentTask) {
  // TypeScript will enforce correct usage
  console.log(task.status, task.updatedAt);
}
