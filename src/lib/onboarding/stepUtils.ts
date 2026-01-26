import type { OnboardingStepId } from "./types";

export const ONBOARDING_ORDER: OnboardingStepId[] = [
  "company_identity",
  "company_role",
  "team_size",
  "workspace_needs",
  "primary_outcome",
  "plan_recommendation",
  "workspace_setup_optional",
  "invite_team",
  "connect_social_accounts",
  "complete"
];

export function nextStepOf(step: OnboardingStepId): OnboardingStepId {
  const idx = ONBOARDING_ORDER.indexOf(step);
  return ONBOARDING_ORDER[Math.min(idx + 1, ONBOARDING_ORDER.length - 1)];
}

export function isTerminal(step: OnboardingStepId) {
  return step === "complete";
}
