import { useEffect, useState } from "react";
import { useAuthUser } from "./useAuthUser";
import { useWorkspaceOnboarding } from "./useWorkspaceOnboarding";

/**
 * Hook to get allowed tools for the current user in a workspace.
 * Returns { allowedTools, loading }
 */
export function useAllowedTools(workspaceId: string) {
  const { user, loading: userLoading } = useAuthUser();
  const { data: onboarding, loading: onboardingLoading } = useWorkspaceOnboarding(workspaceId);
  const [allowedTools, setAllowedTools] = useState<string[] | null>(null);

  useEffect(() => {
    if (onboarding && onboarding.inputs?.goals?.tools) {
      setAllowedTools(onboarding.inputs.goals.tools);
    }
  }, [onboarding]);

  return { allowedTools, loading: userLoading || onboardingLoading };
}
