"use client";

import { useParams } from "next/navigation";
import { useWorkspaceOnboarding } from "@/hooks/useWorkspaceOnboarding";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";

export default function OnboardingPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;

  const { data, loading } = useWorkspaceOnboarding(workspaceId);

  if (loading) return <div className="p-6">Loading onboarding...</div>;
  if (!data) return <div className="p-6">Onboarding not found.</div>;

  // TODO: Replace with actual user ID from session/auth context
  const uid = "CURRENT_USER_UID";

  // Onboarding steps removed. Ready for new onboarding flow.
  return <div className="p-6">Onboarding steps have been reset. Ready for new onboarding flow.</div>;
}
