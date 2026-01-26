import { db } from "@/lib/firebaseAdmin";
import { ensureWorkspaceOnboarding } from "./ensureWorkspaceOnboarding";
import { ONBOARDING_ORDER } from "./stepUtils";

export async function rerunOnboarding(workspaceId: string) {
  // Ensure onboarding doc exists
  const ref = await ensureWorkspaceOnboarding(workspaceId);
  // Reset all steps except company_identity
  const now = new Date();
  const updates: any = {};
  ONBOARDING_ORDER.forEach((step, idx) => {
    updates[`steps.${step}.status`] = step === "company_identity" ? "available" : "locked";
    updates[`steps.${step}.blockedReasons`] = [];
    updates[`steps.${step}.startedAt`] = idx === 0 ? now : null;
    updates[`steps.${step}.completedAt`] = null;
  });
  updates.currentStep = "company_identity";
  updates.updatedAt = now;
  await ref.update(updates);
  // Optionally, set workspace status to 'pending' or 'onboarding'
  await db.collection("workspaces").doc(workspaceId).update({ status: "onboarding", onboardingStatus: "incomplete" });
  return { ok: true };
}
