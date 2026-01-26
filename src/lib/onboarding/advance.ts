import admin from "firebase-admin";
import { db } from "@/lib/firebaseAdmin";
import { ensureWorkspaceOnboarding } from "./ensureWorkspaceOnboarding";
import { nextStepOf, isTerminal } from "./stepUtils";
import { evaluateStepRequirements } from "./serverStepRequirements";
import { provisionFirstValueTx } from "./provisionFirstValue";
import type { OnboardingStepId, WorkspaceOnboardingDoc } from "./types";

export async function advanceOnboardingStep(params: {
  workspaceId: string;
  uid: string;
  expectedCurrentStep?: OnboardingStepId; // optional optimistic check
}) {
  const { workspaceId, uid, expectedCurrentStep } = params;

  const ref = await ensureWorkspaceOnboarding(workspaceId);

  return await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Onboarding doc missing (ensure failed).");
    const doc = snap.data() as WorkspaceOnboardingDoc;
    const current = doc.currentStep;

    if (expectedCurrentStep && expectedCurrentStep !== current) {
      throw new Error(`Step mismatch. UI expected ${expectedCurrentStep} but DB is ${current}.`);
    }

    if (isTerminal(current)) {
      return { ok: true, currentStep: current, nextStep: current, reasons: [] as string[] };
    }

    // Validate requirements for the current step being completed (or for next step to unlock)
    const req = await evaluateStepRequirements(workspaceId, current);
    if (!req.ok) {
      // persist reasons for UI
      const now = admin.firestore.Timestamp.now();
      tx.update(ref, {
        [`steps.${current}.status`]: "in_progress",
        [`steps.${current}.blockedReasons`]: req.reasons,
        updatedAt: now,
      });
      return { ok: false, currentStep: current, nextStep: current, reasons: req.reasons };
    }

    const next = nextStepOf(current);
    const now = admin.firestore.Timestamp.now();

    // If completing social connect, provision starter agent/workflow
    if (current === "connect_social_accounts" && next === "complete") {
      // WorkspaceOnboardingDoc has 'inputs' property per types.ts
      const outcome = doc.inputs && doc.inputs.goals ? doc.inputs.goals.primaryOutcome : "support";
      await provisionFirstValueTx(tx, workspaceId, uid, outcome);
    }

    // Atomic transition
    tx.update(ref, {
      currentStep: next,
      [`steps.${current}.status`]: "completed",
      [`steps.${current}.completedAt`]: now,
      [`steps.${current}.blockedReasons`]: [],
      [`steps.${next}.status`]: next === "complete" ? "completed" : "available",
      [`steps.${next}.startedAt`]: now,
      // Only allow simple values in update object
      lastTransition: JSON.stringify({ from: current, to: next, at: now, byUid: uid }),
      updatedAt: now,
    });

    // After onboarding complete, update workspace state
    if (next === "complete") {
      const wsRef = db.collection("workspaces").doc(workspaceId);
      tx.update(wsRef, {
        onboardingStatus: "completed",
        activatedAt: now,
        status: "active",
      });
    }

    // Optional: write audit log in same transaction (recommended if your audit log is append-only)
    const auditRef = db.collection("audit_logs").doc();
    tx.set(auditRef, {
      workspaceId,
      type: "onboarding.transition",
      actorUid: uid,
      from: current,
      to: next,
      createdAt: now,
    });

    return { ok: true, currentStep: next, nextStep: next, reasons: [] as string[] };
  });
}
