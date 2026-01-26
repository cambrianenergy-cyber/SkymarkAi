import { db } from '../firebase';
import type { CostUsageLog } from '../firestoreTypes';
import { CostUsageLogSchema } from '../firestoreTypes';

export async function getCostUsageLog(logId: string): Promise<CostUsageLog | null> {
  const doc = await db().collection('cost_usage_logs').doc(logId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  const parsed = CostUsageLogSchema.safeParse({ ...data, logId });
  return parsed.success ? parsed.data : null;
}

export async function setCostUsageLog(log: CostUsageLog): Promise<void> {
  CostUsageLogSchema.parse(log);
  await db().collection('cost_usage_logs').doc(log.logId).set(log);
}
