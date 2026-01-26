// Onboarding state model for Firestore (per user or per workspace)
// Place in lib/types/onboarding.ts

export interface OnboardingStep {
  key: string; // e.g. 'connect_social', 'invite_team', 'run_first_workflow'
  label: string;
  completed: boolean;
  completedAt?: string; // ISO date
  description?: string;
}

export interface OnboardingState {
  userId: string;
  workspaceId: string;
  startedAt: string; // ISO date
  completed: boolean;
  completedAt?: string; // ISO date
  steps: OnboardingStep[];
}

// Example Firestore document (onboarding_states/{userId}_{workspaceId}):
// {
//   userId: 'abc123',
//   workspaceId: 'ws456',
//   startedAt: '2026-01-04T12:00:00Z',
//   completed: false,
//   steps: [
//     { key: 'connect_social', label: 'Connect a social account', completed: true, completedAt: '2026-01-04T12:01:00Z' },
//     { key: 'invite_team', label: 'Invite a team member', completed: false },
//     { key: 'run_first_workflow', label: 'Run your first workflow', completed: false }
//   ]
// }
