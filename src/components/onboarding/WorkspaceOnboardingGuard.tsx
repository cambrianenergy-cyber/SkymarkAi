"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspaceOnboarding } from "@/hooks/useWorkspaceOnboarding";
import { useAuthUser } from "@/hooks/useAuthUser";

export function WorkspaceOnboardingGuard({ workspaceId }: { workspaceId: string }) {
  const { data, loading } = useWorkspaceOnboarding(workspaceId);
  const { user, loading: authLoading } = useAuthUser();
  const router = useRouter();
  const pathname = usePathname();

  const isFounder = useMemo(() => {
    const founderUid = process.env.NEXT_PUBLIC_FOUNDER_UID;
    if (!founderUid) return false;
    return user?.uid === founderUid;
  }, [user?.uid]);

  useEffect(() => {
    if (authLoading || loading) return;
    if (isFounder) return;
    if (!data) return;

    const isOnboardingRoute = pathname.includes("/onboarding");
    const isComplete = data.currentStep === "complete";

    if (!isComplete && !isOnboardingRoute) {
      router.replace(`/app/${workspaceId}/onboarding`);
    }
  }, [authLoading, loading, data, isFounder, pathname, router, workspaceId]);

  return null;
}
