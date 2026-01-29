import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function verifySocial(workspaceId: string, platform: string): Promise<boolean> {
  const ref = doc(
    db,
    `workspaces/${workspaceId}/integrations/${platform}`
  );
  const snap = await getDoc(ref);
  return snap.exists() && snap.data().status === "connected";
}
