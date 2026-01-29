import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getOnboardingStepRegistry } from "./getOnboardingStepRegistry";
import { createEmptyOnboarding } from "./createEmptyOnboarding";
import { verifyStep } from "./verifyStep";

export async function evaluateOnboarding(
  workspaceId: string,
  uid: string
) {
  const steps = await getOnboardingStepRegistry();
  const onboardingRef = doc(
    typeof db === "function" ? db() : db,
    `workspaces/${workspaceId}/members/${uid}/onboarding/state`
  );

  const onboardingSnap = await getDoc(onboardingRef);
  const onboarding = onboardingSnap.exists()
    ? onboardingSnap.data()
    : createEmptyOnboarding(steps);

  let allRequiredVerified = true;

  for (const step of steps) {
    const verified = await verifyStep(step, workspaceId, uid);

    onboarding.steps[step.stepId] = {
      status: verified ? "done" : "todo",
      verified,
      verifiedAt: verified ? serverTimestamp() : null
    };

    if (step.required && !verified) {
      allRequiredVerified = false;
    }
  }

  onboarding.completed = allRequiredVerified;
  onboarding.completedAt = allRequiredVerified
    ? serverTimestamp()
    : null;
  onboarding.lastEvaluatedAt = serverTimestamp();

  await setDoc(onboardingRef, onboarding, { merge: true });

  return onboarding;
}
