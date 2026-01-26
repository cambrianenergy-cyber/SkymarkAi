'use client';
import React, { useEffect } from 'react';
import { completeOnboarding } from '../../../lib/onboardingState';

export default function FinishOnboarding() {
  useEffect(() => {
    // Set cookie and release middleware guard
    completeOnboarding('currentUser');
    document.cookie = 'uqentra_onboarded=1; path=/;';
  }, []);

  function goToDashboard() {
    window.location.href = '/dashboard';
  }

  return (
    <main className="onboarding-step">
      <h1>Youre Live!</h1>
      <div className="summary">Youve unlocked the full dashboard, admin controls, agents, and automation.</div>
      <button onClick={goToDashboard}>Go to Dashboard</button>
      <div className="progress-bar">Step 7 of 7</div>
    </main>
  );
}

