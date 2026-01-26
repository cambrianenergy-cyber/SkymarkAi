import { db } from "@/lib/firebaseAdmin";
import type { OnboardingStepId } from "./types";

export async function evaluateStepRequirements(workspaceId: string, step: OnboardingStepId) {
  const reasons: string[] = [];

  if (step === "company_identity") {
    const ws = await db.collection("workspaces").doc(workspaceId).get();
    const data = ws.data();
    if (!data?.name) reasons.push("Workspace name is missing.");
    if (!data?.timezone) reasons.push("Workspace timezone is missing.");
    return { ok: reasons.length === 0, reasons };
  }

  // Example: enforce requirements for all steps
  if (step === "company_role") {
    // Add checks for company role
    // ...
  }
  if (step === "team_size") {
    // Add checks for team size
    // ...
  }
  if (step === "workspace_needs") {
    // Add checks for workspace needs
    // ...
  }
  if (step === "primary_outcome") {
    // Add checks for primary outcome
    // ...
  }
  if (step === "plan_recommendation") {
    // Add checks for plan recommendation
    // ...
  }
  if (step === "invite_team") {
    // Add checks for team invite
    // ...
  }
  if (step === "connect_social_accounts") {
    // Add checks for social account connection
    // ...
  }

  return { ok: true, reasons };
}
