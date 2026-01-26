import { db } from '../firebase';
import type { ToolRegistry } from '../firestoreTypes';
import { ToolRegistrySchema } from '../firestoreTypes';

export async function getToolRegistry(toolId: string): Promise<ToolRegistry | null> {
  const doc = await db().collection('tool_registry').doc(toolId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  const parsed = ToolRegistrySchema.safeParse({ ...data, toolId });
  return parsed.success ? parsed.data : null;
}

export async function setToolRegistry(registry: ToolRegistry): Promise<void> {
  ToolRegistrySchema.parse(registry);
  await db().collection('tool_registry').doc(registry.toolId).set(registry);
}
