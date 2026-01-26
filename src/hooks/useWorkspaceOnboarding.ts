"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import type { WorkspaceOnboardingDoc } from "@/lib/onboarding/types";

export function useWorkspaceOnboarding(workspaceId: string) {
  const [data, setData] = useState<WorkspaceOnboardingDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    const ref = doc(db, "workspace_onboarding", workspaceId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        setData((snap.data() as WorkspaceOnboardingDoc) ?? null);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [workspaceId]);

  return { data, loading };
}
