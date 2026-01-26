'use client';
import React, { useState } from 'react';
import { setOnboardingStep } from '../../../lib/onboardingState';

export default function FirstRunOnboarding() {
  const [running, setRunning] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleRun() {
    setRunning(true);
    // TODO: Simulate workflow run, show live UI
    setTimeout(() => {
      setRunning(false);
      setSuccess(true);
    }, 2000);
  }

  async function handleContinue() {
    // TODO: Save workflow run result to Firestore
    await setOnboardingStep('currentUser', 'done');
    window.location.href = '/onboarding/finish';
  }

  return (
    <main className="onboarding-step">
      <h1>Lets Get Started</h1>
      <div className="workflow-preview">Create a 7-day content plan and schedule it.</div>
      <button onClick={handleRun} disabled={running || success}>Run</button>
      <div className="live-ui">
        {running && <div>Running workflow... [Live execution UI]</div>}
        {success && <div>Success! Output, audit log, and governance info here.</div>}
      </div>
      <button onClick={handleContinue} disabled={!success}>Continue</button>
      <div className="progress-bar">Step 6 of 7</div>
    </main>
  );
}

