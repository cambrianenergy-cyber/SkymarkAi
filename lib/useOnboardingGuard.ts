import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@lib/firebase";

/**
 * useOnboardingGuard
 * Checks if onboarding is complete for the user/workspace.
 * Returns: true (complete), false (not complete), or null (loading)
 */
export function useOnboardingGuard(userId: string, workspaceId: string) {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId || !workspaceId) return;
    let active = true;
    async function check() {
      const ref = doc(db, "onboarding_states", `${userId}_${workspaceId}`);
      const snap = await getDoc(ref);
      if (!active) return;
      setCompleted(snap.exists() && !!snap.data().completed);
    }
    check();
    return () => { active = false; };
  }, [userId, workspaceId]);

  return completed;
}
