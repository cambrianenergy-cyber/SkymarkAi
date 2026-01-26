import { db } from '../firebase';
import type { AuditLog } from '../firestoreTypes';
import { AuditLogSchema } from '../firestoreTypes';

export async function getAuditLog(logId: string): Promise<AuditLog | null> {
  const doc = await db().collection('audit_logs').doc(logId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  const parsed = AuditLogSchema.safeParse({ ...data, logId });
  return parsed.success ? parsed.data : null;
}

export async function setAuditLog(log: AuditLog): Promise<void> {
  AuditLogSchema.parse(log);
  await db().collection('audit_logs').doc(log.logId).set(log);
}
