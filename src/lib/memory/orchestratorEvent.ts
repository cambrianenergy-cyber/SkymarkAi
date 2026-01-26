import { db } from '../firebase';
import type { OrchestratorEvent } from '../firestoreTypes';
import { OrchestratorEventSchema } from '../firestoreTypes';

export async function getOrchestratorEvent(eventId: string): Promise<OrchestratorEvent | null> {
  const doc = await db().collection('orchestrator_events').doc(eventId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  const parsed = OrchestratorEventSchema.safeParse({ ...data, eventId });
  return parsed.success ? parsed.data : null;
}

export async function setOrchestratorEvent(event: OrchestratorEvent): Promise<void> {
  OrchestratorEventSchema.parse(event);
  await db().collection('orchestrator_events').doc(event.eventId).set(event);
}
