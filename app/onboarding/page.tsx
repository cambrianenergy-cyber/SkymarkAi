// ENTRY GATE: /onboarding
import { redirect } from 'next/navigation';
import { getOnboardingState } from '../../lib/onboardingState';

export default async function OnboardingEntry() {
  // Server-side: check onboarding state and redirect
  const state = await getOnboardingState();
  switch (state) {
    case 'profile':
      redirect('/onboarding/profile');
    case 'workspace':
      redirect('/onboarding/workspace');
    case 'team':
      redirect('/onboarding/team');
    case 'connect':
      redirect('/onboarding/connect');
    case 'agents':
      redirect('/onboarding/agents');
    case 'first_run':
      redirect('/onboarding/first_run');
    case 'done':
      redirect('/dashboard');
    default:
      redirect('/onboarding/profile');
  }
  return null;
}
