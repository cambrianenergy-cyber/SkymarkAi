import { adminDb } from "@/server/firebaseAdmin";

export async function getLead(workspaceId: string, leadId: string) {
  const db = adminDb();
  const doc = await db.collection("leads").doc(leadId).get();
  if (!doc.exists) return null;

  const data = doc.data() as any;
  if (data.workspaceId !== workspaceId) throw new Error("FORBIDDEN_CROSS_WORKSPACE");

  return { id: doc.id, ...data };
}
