import { db } from '../firebase';
import type { AdminDashboard } from '../firestoreTypes';
import { AdminDashboardSchema } from '../firestoreTypes';

export async function getAdminDashboard(docId: string): Promise<AdminDashboard | null> {
  const doc = await db().collection('admin_dashboards').doc(docId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  const parsed = AdminDashboardSchema.safeParse({ ...data, docId });
  return parsed.success ? parsed.data : null;
}

export async function setAdminDashboard(dashboard: AdminDashboard): Promise<void> {
  AdminDashboardSchema.parse(dashboard);
  await db().collection('admin_dashboards').doc(dashboard.docId).set(dashboard);
}
