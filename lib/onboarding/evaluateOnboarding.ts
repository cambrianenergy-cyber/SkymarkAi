import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";


export async function evaluateOnboarding(
  workspaceId: string,
  uid: string
) {
  // TODO: Restore onboarding evaluation logic when helpers are available.
  return null;
}
