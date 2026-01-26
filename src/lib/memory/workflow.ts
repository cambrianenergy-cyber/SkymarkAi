import { db } from '../firebase';
import type { Workflow } from '../firestoreTypes';
import { WorkflowSchema } from '../firestoreTypes';
import type { Firestore } from 'firebase/firestore'; // Add this import if using firebase v9+

export async function getWorkflow(id: string): Promise<Workflow | null> {
  const firestore = db();
  const doc = await firestore.collection('workflows').doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data();
  const parsed = WorkflowSchema.safeParse({ ...data, id });
  return parsed.success ? parsed.data : null;
}

export async function setWorkflow(workflow: Workflow): Promise<void> {
  WorkflowSchema.parse(workflow);
  const firestore = db();
  await firestore.collection('workflows').doc(workflow.id).set(workflow);
}
