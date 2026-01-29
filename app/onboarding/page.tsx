"use client";
import { useEffect, useState } from 'react';

export default function OnboardingPage() {
  const [onboarding, setOnboarding] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/onboarding/state')
      .then(res => res.json())
      .then(data => {
        setOnboarding(data.onboarding);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load onboarding state');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading onboarding status...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h1>Onboarding Status</h1>
      <p>Current state: <b>{onboarding}</b></p>
    </div>
  );
}
