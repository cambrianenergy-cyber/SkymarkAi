'use client';
// SCREEN 2: WORKSPACE CREATION
import React, { useState, useEffect } from 'react';
import ProgressStepper from '../../../components/ProgressStepper';
import { setOnboardingStep } from '../../../lib/onboardingState';
import { db, auth } from '../../../lib/firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function WorkspaceOnboarding() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceType, setWorkspaceType] = useState('');
  const [timezone, setTimezone] = useState('');
  const [industry, setIndustry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const types = ['Personal OS', 'Team OS', 'Agency OS'];
  const timezones = ['UTC', 'EST', 'CST', 'MST', 'PST']; // Example, replace with real list
  const industries = ['', 'Marketing', 'Finance', 'Healthcare', 'Education'];

  const canContinue = workspaceName.trim() && workspaceType && timezone;

  async function handleContinue() {
    setSubmitting(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('You must be logged in.');
        setSubmitting(false);
        router.push('/login');
        return;
      }
      // Create workspace document
      const wsRef = await addDoc(collection(db, 'workspaces'), {
        name: workspaceName,
        type: workspaceType,
        timezone,
        industry,
        ownerUid: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      });
      // Add creator as workspace member (owner)
      await setDoc(doc(db, 'workspace_members', user.uid + '_' + wsRef.id), {
        workspaceId: wsRef.id,
        uid: user.uid,
        role: 'owner',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await setOnboardingStep(user.uid, 'team');
      // Save workspaceId to localStorage for next steps
      window.localStorage.setItem('workspaceId', wsRef.id);
      router.push('/onboarding/team');
    } catch (err) {
      setError('Failed to create workspace: ' + (err as any)?.message);
    }
    setSubmitting(false);
  }

  // Only allow founders to proceed
  useEffect(() => {
    // Fetch onboarding state and enforce correct step
    async function fetchStep() {
      const userId = window.localStorage.getItem('userId') || 'currentUser';
      const res = await fetch(`/api/onboarding/state?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.state && data.state !== 'workspace') {
          router.replace(`/onboarding/${data.state}`);
        }
      }
      if (!auth.currentUser) {
        router.push('/login');
      }
    }
    fetchStep();
  }, [router]);

  return (
    <>
      <ProgressStepper currentStep={1} />
      <main className="onboarding-step">
        <h1>Create Your Workspace</h1>
        {error && <div style={{ color: 'crimson', marginBottom: 12, fontWeight: 600 }}>{error}</div>}
        <input type="text" placeholder="Workspace Name" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} disabled={submitting} />
        <div className="workspace-type">
          {types.map(t => (
            <label key={t} style={{marginRight: 12, opacity: submitting ? 0.6 : 1}}>
              <input type="radio" name="workspaceType" value={t} checked={workspaceType === t} onChange={() => setWorkspaceType(t)} disabled={submitting} /> {t}
            </label>
          ))}
        </div>
        <select value={timezone} onChange={e => setTimezone(e.target.value)} disabled={submitting}>
          <option value="">Timezone</option>
          {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
        <select value={industry} onChange={e => setIndustry(e.target.value)} disabled={submitting}>
          <option value="">Industry (optional)</option>
          {industries.filter(i => i).map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <button disabled={!canContinue || submitting} onClick={handleContinue} style={{ marginTop: 16 }}>
          {submitting ? 'Saving...' : 'Continue'}
        </button>
        <div className="progress-bar">Step 2 of 7</div>
      </main>
    </>
  );
}
