'use client';
// SCREEN 4: CONNECT ACCOUNTS
import React, { useState, useEffect } from 'react';
import ProgressStepper from '../../../components/ProgressStepper';
import { setOnboardingStep } from '../../../lib/onboardingState';
import { db, auth } from '../../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const platforms = [
  { key: 'google', name: 'Google' },
  { key: 'linkedin', name: 'LinkedIn' },
  { key: 'facebook', name: 'Facebook/Instagram' },
  { key: 'x', name: 'X (Twitter)' },
  { key: 'youtube', name: 'YouTube' },
  { key: 'tiktok', name: 'TikTok' },
];

export default function ConnectOnboarding() {
  const router = useRouter();
  const [connections, setConnections] = useState<{ [k: string]: 'connected' | 'not_connected' | 'expired' }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const connectedCount = Object.values(connections).filter(v => v === 'connected').length;
  const canContinue = connectedCount > 0;

  function handleConnect(key: string) {
    setConnections(c => ({ ...c, [key]: 'connected' }));
  }
  function handleReconnect(key: string) {
    setConnections(c => ({ ...c, [key]: 'connected' }));
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
      const workspaceId = window.localStorage.getItem('workspaceId');
      // Save connections to Firestore (one doc per connection)
      for (const [key, status] of Object.entries(connections)) {
        if (status === 'connected') {
          await addDoc(collection(db, 'connections'), {
            workspaceId,
            userId: user.uid,
            provider: key,
            status,
            connectedAt: new Date(),
          });
        }
      }
      await setOnboardingStep(user.uid, 'agents');
      router.push('/onboarding/agents');
    } catch (err) {
      setError('Failed to save connections: ' + (err as any)?.message);
      console.error('[ConnectOnboarding] Failed to save connections:', err);
    }
    setSubmitting(false);
  }

  // Only allow founders to proceed
  useEffect(() => {
    // Fetch onboarding state and enforce correct step
    async function fetchStep() {
      const userId = window.localStorage.getItem('userId') || 'currentUser';
      console.log('[ConnectOnboarding] userId:', userId);
      const res = await fetch(`/api/onboarding/state?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        console.log('[ConnectOnboarding] onboarding state:', data.state);
        if (data.state && data.state !== 'connect') {
          router.replace(`/onboarding/${data.state}`);
        }
      } else {
        console.error('[ConnectOnboarding] Failed to fetch onboarding state', res.status);
      }
      if (!auth.currentUser) {
        router.push('/login');
      }
    }
    fetchStep();
  }, [router]);

  return (
    <>
      <ProgressStepper currentStep={3} />
      <main className="onboarding-step">
        <h1>Connect Your Accounts</h1>
        {error && <div style={{ color: 'crimson', marginBottom: 12, fontWeight: 600 }}>{error}</div>}
        <div className="platform-grid">
          {platforms.map(p => (
            <div key={p.key} style={{marginBottom: 12, border: '1px solid #ccc', padding: 12, borderRadius: 8, opacity: submitting ? 0.6 : 1}}>
              <span>{p.name}</span>
              <span style={{marginLeft: 8}}>{connections[p.key] === 'connected' ? 'Connected' : connections[p.key] === 'expired' ? 'Expired' : 'Not Connected'}</span>
              {connections[p.key] === 'connected' ? (
                <button onClick={() => handleReconnect(p.key)} type="button" disabled={submitting}>Reconnect</button>
              ) : (
                <button onClick={() => handleConnect(p.key)} type="button" disabled={submitting}>Connect</button>
              )}
            </div>
          ))}
        </div>
        <button disabled={!canContinue || submitting} onClick={handleContinue} style={{ marginTop: 16 }}>
          {submitting ? 'Saving...' : 'Continue'}
        </button>
        <div className="progress-bar">Step 4 of 7</div>
      </main>
    </>
  );
}
