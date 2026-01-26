import admin from "firebase-admin";
import { db } from "@/lib/firebaseAdmin";
import type { SocialPlatform, WorkspaceOnboardingDoc } from "./types";
import { ONBOARDING_ORDER } from "./stepUtils";

const SOCIAL_PLATFORMS: SocialPlatform[] = ["meta", "x", "linkedin", "tiktok", "youtube", "pinterest"];

export async function ensureWorkspaceOnboarding(workspaceId: string) {
  const ref = db.collection("workspace_onboarding").doc(workspaceId);
  const snap = await ref.get();
    if (snap.exists) return ref;

  // Create initial onboarding doc
    const now = admin.firestore.Timestamp.now();
  const steps: WorkspaceOnboardingDoc["steps"] = ONBOARDING_ORDER.reduce((acc, step) => {
    acc[step] = {
      status: step === "company_identity" ? "available" : "locked",
      blockedReasons: [],
      ...(step === "company_identity" ? { startedAt: now } : {}),
    };
    return acc;
  }, {} as Record<import("./types").OnboardingStepId, { status: "locked" | "available" | "in_progress" | "completed"; startedAt?: any; completedAt?: any; blockedReasons?: string[] }>);

    const statusByPlatform = SOCIAL_PLATFORMS.reduce((acc, p) => {
      acc[p] = { status: "not_connected" as const };
      return acc;
    }, {} as WorkspaceOnboardingDoc["integrations"]["social"]["statusByPlatform"]);

    const doc: WorkspaceOnboardingDoc = {
      workspaceId,
      currentStep: "company_identity",
      steps,

      inputs: {
        company: { legalName: "", dba: null, industry: null, website: null, country: "US", state: "TX" },
        user: { businessRole: "member", billingAuthority: false },
        sizing: { seatRange: "1", activeUsersRange: "1", externalCollaborators: false },
        workspaceNeeds: { multiWorkspace: false, useCase: null, workspaceCountRange: null },
        goals: { primaryOutcome: "support", tools: [] },
        social: { connectNowChoice: "add_later", plannedPlatforms: [] },
      },

      planIntent: {
        recommendedPlan: "starter",
        selectedPlan: null,
        seatsPlanned: 1,
        workspacesPlanned: 1,
        reasonCodes: [],
      },

      integrations: {
        social: {
          statusByPlatform,
          connectedPlatforms: [],
          connectedCount: 0,
          deferred: true,
          updatedAt: now,
        },
      },

      createdAt: now,
      updatedAt: now,
    };

    await ref.set(doc, { merge: false });
    return ref;
}
