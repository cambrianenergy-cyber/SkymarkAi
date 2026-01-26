import type { WorkspaceOnboardingDoc } from "./types";

export function recommendPlan(onboarding: WorkspaceOnboardingDoc) {
  // Updated logic to match new types
  const seats = onboarding.inputs?.sizing?.seatRange || "1";
  const multiWorkspace = onboarding.inputs?.workspaceNeeds?.multiWorkspace || false;
  const workspacesPlanned = onboarding.inputs?.workspaceNeeds?.workspaceCountRange || "2-3";
  const useCase = onboarding.inputs?.workspaceNeeds?.useCase || null;
  let recommendedPlan: "starter" | "team" | "business" | "enterprise" = "starter";
  const reasonCodes: string[] = [];

  if (multiWorkspace) {
    recommendedPlan = "business";
    reasonCodes.push("multi-workspace");
  }
  if (seats !== "1" && seats !== "2-5") {
    recommendedPlan = "team";
    reasonCodes.push("seats");
  }
  if (workspacesPlanned === "25+" || useCase === "agency") {
    recommendedPlan = "enterprise";
    reasonCodes.push("agency signals");
  }
  return { recommendedPlan, reasonCodes };
}
