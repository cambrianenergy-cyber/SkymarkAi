import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";

export async function verifyFirstWorkflowRun(workspaceId: string): Promise<boolean> {
  const q = query(
    collection(db, `workspaces/${workspaceId}/runs`),
    where("status", "==", "success"),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
