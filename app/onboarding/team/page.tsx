'use client';
// SCREEN 3: TEAM INVITE
import React, { useState, useEffect } from 'react';
import ProgressStepper from '../../../components/ProgressStepper';
import { setOnboardingStep } from '../../../lib/onboardingState';
import { db, auth } from '../../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function TeamOnboarding() {
  const router = useRouter();
  const [invites, setInvites] = useState([{ email: '', role: 'Member' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  function setInvite(index: number, field: string, value: string) {
    setInvites(invites => invites.map((inv, i) => i === index ? { ...inv, [field]: value } : inv));
  }
  function addInvite() {
    setInvites([...invites, { email: '', role: 'Member' }]);
  }
  function removeInvite(index: number) {
    setInvites(invites => invites.filter((_, i) => i !== index));
  }

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
      // Save invites to Firestore (one doc per invite)
      const workspaceId = window.localStorage.getItem('workspaceId');
      for (const inv of invites) {
        if (inv.email.trim()) {
          await addDoc(collection(db, 'workspace_invites'), {
            workspaceId,
            email: inv.email.trim(),
            role: inv.role,
            invitedBy: user.uid,
            createdAt: new Date(),
            status: 'pending',
          });
        }
      }
      await setOnboardingStep(user.uid, 'connect');
      router.push('/onboarding/connect');
    } catch (err) {
      setError('Failed to send invites: ' + (err as any)?.message);
      console.error('[TeamOnboarding] Failed to send invites:', err);
    }
    setSubmitting(false);
  }
  async function handleSkip() {
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
      // Optionally record skipped in Firestore
      await setOnboardingStep(user.uid, 'connect');
      router.push('/onboarding/connect');
    } catch (err) {
      setError('Failed to skip: ' + (err as any)?.message);
      console.error('[TeamOnboarding] Failed to skip:', err);
    }
    setSubmitting(false);
  }

  // Only allow founders to proceed
  useEffect(() => {
    // Fetch onboarding state and enforce correct step
    async function fetchStep() {
      const userId = window.localStorage.getItem('userId') || 'currentUser';
      console.log('[TeamOnboarding] userId:', userId);
      const res = await fetch(`/api/onboarding/state?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        console.log('[TeamOnboarding] onboarding state:', data.state);
        if (data.state && data.state !== 'team') {
          router.replace(`/onboarding/${data.state}`);
        }
      } else {
        console.error('[TeamOnboarding] Failed to fetch onboarding state', res.status);
      }
      if (!auth.currentUser) {
        router.push('/login');
      }
    }
    fetchStep();
  }, [router]);

  return (
    <>
      <ProgressStepper currentStep={2} />
      <main className="onboarding-step">
        <h1>Invite Your Team</h1>
        {error && <div style={{ color: 'crimson', marginBottom: 12, fontWeight: 600 }}>{error}</div>}
        <div className="invite-list">
          {invites.map((inv, i) => (
            <div key={i} style={{marginBottom: 8, opacity: submitting ? 0.6 : 1}}>
              <input type="email" placeholder="Email" value={inv.email} onChange={e => setInvite(i, 'email', e.target.value)} disabled={submitting} />
              <select value={inv.role} onChange={e => setInvite(i, 'role', e.target.value)} disabled={submitting}>
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
              {invites.length > 1 && <button onClick={() => removeInvite(i)} type="button" disabled={submitting}>Remove</button>}
            </div>
          ))}
          <button onClick={addInvite} type="button" disabled={submitting}>Add Another</button>
        </div>
        <button onClick={handleSkip} disabled={submitting} style={{ marginTop: 12 }}>
          {submitting ? 'Processing...' : 'Skip for Now'}
        </button>
        <button onClick={handleContinue} disabled={submitting} style={{ marginTop: 8 }}>
          {submitting ? 'Sending...' : 'Continue'}
        </button>
        <div className="progress-bar">Step 3 of 7</div>
      </main>
    </>
  );
}
