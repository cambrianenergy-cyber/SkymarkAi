jest.mock('@google-cloud/firestore', () => {
  const mDoc = {
    get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
    set: jest.fn(),
  };

  const mCollection = {
    doc: jest.fn(() => mDoc),
  };

  const mFirestore = function () {
    return {
      collection: jest.fn(() => mCollection),
    };
  };

  return { Firestore: mFirestore };
});
import { db } from '../firebase';
import type { WorkflowRun } from '../orchestrator/types';

export async function getWorkflowRun(id: string): Promise<WorkflowRun | null> {
  const firestore = db();
  const doc = await firestore.collection('workflow_runs').doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data();
  // You may want to validate with a WorkflowRunSchema if you define one
  return { ...data, id } as WorkflowRun;
}

export async function setWorkflowRun(run: WorkflowRun): Promise<void> {
  // Add validation if you define a WorkflowRunSchema
  const firestore = db();
  await firestore.collection('workflow_runs').doc(run.id).set(run);
}
