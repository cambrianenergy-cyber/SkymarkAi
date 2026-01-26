// Example Firestore integration for onboarding_states
import { db } from '../firebase';
import type { OnboardingState } from '../firestoreTypes';
import { OnboardingStateSchema } from '../firestoreTypes';

// Fetch onboarding state for a user
export async function getOnboardingState(userId: string, workspaceId: string): Promise<OnboardingState | null> {
  const doc = await db().collection('onboarding_states').doc(userId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  // Validate with Zod
  const parsed = OnboardingStateSchema.safeParse({ ...data, userId, workspaceId });
  return parsed.success ? parsed.data : null;
}

// Set onboarding state for a user
export async function setOnboardingState(state: OnboardingState): Promise<void> {
  // Validate with Zod
  OnboardingStateSchema.parse(state);
  await db().collection('onboarding_states').doc(state.userId).set(state);
}
