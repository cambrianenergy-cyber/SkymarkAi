"use client";
import React, { useEffect, useState } from 'react';
import ProgressStepper from '../../../components/ProgressStepper';
import { setOnboardingStep } from '../../../lib/onboardingState';
import { db, auth } from '../../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ProfileOnboarding() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [intents, setIntents] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("/logo.svg");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [userRole, setUserRole] = useState<string>('');
  const [workspaceRole, setWorkspaceRole] = useState<string>('');

  useEffect(() => {
    // Fetch user and workspace role, and onboarding state
    async function fetchRolesAndStep() {
      const userId = window.localStorage.getItem('userId') || 'currentUser';
      const wsId = window.localStorage.getItem('workspaceId') || '';
      console.log('[ProfileOnboarding] userId:', userId, 'workspaceId:', wsId);
      const [roleRes, stepRes] = await Promise.all([
        fetch(`/api/user/role?userId=${userId}&workspaceId=${wsId}`),
        fetch(`/api/onboarding/state?userId=${userId}`)
      ]);
      if (roleRes.ok) {
        const data = await roleRes.json();
        setUserRole(data.role || '');
        setWorkspaceRole(data.workspaceRole || '');
        console.log('[ProfileOnboarding] userRole:', data.role, 'workspaceRole:', data.workspaceRole);
      } else {
        console.error('[ProfileOnboarding] Failed to fetch user role', roleRes.status);
      }
      if (stepRes.ok) {
        const data = await stepRes.json();
        console.log('[ProfileOnboarding] onboarding state:', data.state);
        if (data.state && data.state !== 'profile') {
          // Redirect to the correct onboarding step if not on profile
          router.replace(`/onboarding/${data.state}`);
        }
      } else {
        console.error('[ProfileOnboarding] Failed to fetch onboarding state', stepRes.status);
      }
    }
    fetchRolesAndStep();
  }, [router]);

  // Roles for user assignment (no founder for users, only owner/admin/manager/analyst)
  const roles = userRole === 'founder'
    ? ['Founder', 'Operator', 'Manager', 'Analyst']
    : ['Owner', 'Admin', 'Manager', 'Analyst'];
  const intentOptions = ['Content', 'Marketing', 'Ops', 'Research', 'Automation'];

  const canContinue = name.trim() && intents.length > 0 && userRole !== 'viewer';

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
      // Save user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        role,
        intents,
        avatar: avatar ? avatar.name : '',
        updatedAt: new Date(),
      }, { merge: true });
      await setOnboardingStep(user.uid, 'workspace');
      router.push('/onboarding/workspace');
    } catch (err) {
      setError('Failed to save profile: ' + (err as any)?.message);
      console.error('[ProfileOnboarding] Failed to save profile:', err);
    }
    setSubmitting(false);
  }

  function toggleIntent(intent: string) {
    setIntents(intents => intents.includes(intent)
      ? intents.filter(i => i !== intent)
      : [...intents, intent]);
  }

  // Only allow founders to proceed
  useEffect(() => {
    if (userRole && userRole !== 'founder') {
      router.push('/login');
    }
  }, [userRole, router]);

  return (
    <>
      <ProgressStepper currentStep={0} />
      <main
        className="onboarding-step"
        style={{
          maxWidth: 520,
          margin: '48px auto',
          padding: 32,
          background: 'linear-gradient(120deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: 20,
          boxShadow: '0 8px 32px 0 rgba(30,41,59,0.10)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <header style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* Removed 'Click Me' button */}
          {/* Logo Preview (all users, founders can click to upload) */}
          <div style={{ marginBottom: 18, position: 'relative', width: 72, marginLeft: 'auto', marginRight: 'auto' }}>
            <img
              src={logoUrl + '?t=' + Date.now()}
              alt="Workspace Logo"
              style={{
                width: 72,
                height: 72,
                objectFit: 'contain',
                borderRadius: 12,
                background: '#fff',
                boxShadow: '0 2px 8px 0 rgba(30,41,59,0.08)',
                margin: '0 auto',
                display: 'block',
                cursor: userRole === 'founder' ? 'pointer' : 'default',
                border: userRole === 'founder' ? '2px dashed #6366f1' : undefined,
                opacity: logoUploading ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
              onError={e => (e.currentTarget.src = '/logo.svg')}
              onClick={() => {
                if (userRole === 'founder') {
                  document.getElementById('logo-upload-input')?.click();
                }
              }}
              title={userRole === 'founder' ? 'Click to upload logo' : undefined}
            />
            {userRole === 'founder' && (
              <input
                id="logo-upload-input"
                type="file"
                name="logo"
                accept="image/svg+xml"
                disabled={logoUploading}
                style={{ display: 'none' }}
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setLogoUploading(true);
                  setLogoError("");
                  if (!file.name.endsWith('.svg')) {
                    setLogoError('Only SVG files are allowed.');
                    setLogoUploading(false);
                    return;
                  }
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (data.ok) {
                      setLogoUrl(data.path + '?t=' + Date.now());
                    } else {
                      setLogoError(data.error || 'Upload failed');
                    }
                  } catch (err: any) {
                    setLogoError('Upload failed');
                  }
                  setLogoUploading(false);
                }}
              />
            )}
            {logoError && <div style={{ color: 'red', marginTop: 6, fontSize: 13 }}>{logoError}</div>}
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>
            {userRole === 'founder' ? 'Welcome Johnny' : 'Welcome!'}
          </h1>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#6366f1', marginBottom: 0 }}>
            {userRole === 'founder' ? "Founder's Page" : "Let's get to know you"}
          </h2>
        </header>
        {error && <div style={{ color: 'crimson', marginBottom: 12, fontWeight: 600 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Avatar Upload */}
          <section id="profile">
            <label style={{ fontWeight: 700, color: '#334155', fontSize: 16 }}>Avatar</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              {/* Show logo if uploaded, otherwise show avatar preview if selected, otherwise nothing */}
              {logoUrl && logoUrl !== '/logo.svg' ? (
                <img
                  src={logoUrl + '?t=' + Date.now()}
                  alt="Workspace Logo"
                  style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, background: '#fff', border: '1.5px solid #cbd5e1' }}
                />
              ) : avatar ? (
                <span style={{ color: '#475569', fontWeight: 500 }}>{avatar.name}</span>
              ) : null}
              <input type="file" accept="image/*" onChange={e => setAvatar(e.target.files?.[0] || null)} style={{ flex: 'none' }} />
            </div>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={userRole === 'viewer' || submitting}
              style={{
                padding: 12,
                width: '100%',
                borderRadius: 8,
                border: '1.5px solid #cbd5e1',
                marginTop: 16,
                fontSize: 17,
                background: '#fff',
              }}
            />
          </section>
          {/* Role Selector */}
          <section id="role">
            <label style={{ fontWeight: 700, color: '#334155', fontSize: 16 }}>Role</label>
            <div className="role-selector" style={{ display: 'flex', gap: 18, marginTop: 10, flexWrap: 'wrap' }}>
              {roles.map(r => (
                <label key={r} style={{
                  background: role === r ? '#6366f1' : '#e0e7ef',
                  color: role === r ? '#fff' : '#334155',
                  padding: '10px 18px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: userRole === 'viewer' ? 'not-allowed' : 'pointer',
                  boxShadow: role === r ? '0 2px 8px 0 rgba(99,102,241,0.10)' : 'none',
                  border: 'none',
                  transition: 'all 0.15s',
                  opacity: submitting ? 0.6 : 1,
                }}>
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    disabled={userRole === 'viewer' || submitting}
                    style={{ display: 'none' }}
                  />
                  {r}
                </label>
              ))}
            </div>
            {/* Founders Button under Role */}
            <div style={{ marginTop: 18, textAlign: 'left' }}>
              <button
                type="button"
                style={{
                  background: 'linear-gradient(90deg, #6366f1 0%, #f43f5e 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '10px 28px',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 17,
                  boxShadow: '0 2px 8px 0 rgba(99,102,241,0.10)',
                  cursor: 'pointer',
                  marginTop: 2,
                  letterSpacing: 0.5,
                  transition: 'background 0.2s',
                  opacity: submitting ? 0.6 : 1,
                }}
                onClick={() => alert('Founders button clicked!')}
                disabled={submitting}
              >
                Founders
              </button>
            </div>
          </section>
          {/* Intent Multi-Select */}
          <section id="intents">
            <label style={{ fontWeight: 700, color: '#334155', fontSize: 16 }}>Intents</label>
            <div className="intent-multiselect" style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              {intentOptions.map(opt => (
                <label key={opt} style={{
                  background: intents.includes(opt) ? '#f59e42' : '#e0e7ef',
                  color: intents.includes(opt) ? '#fff' : '#334155',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: userRole === 'viewer' ? 'not-allowed' : 'pointer',
                  boxShadow: intents.includes(opt) ? '0 2px 8px 0 rgba(245,158,66,0.10)' : 'none',
                  border: 'none',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: submitting ? 0.6 : 1,
                }}>
                  <input
                    type="checkbox"
                    checked={intents.includes(opt)}
                    onChange={() => toggleIntent(opt)}
                    disabled={userRole === 'viewer' || submitting}
                    style={{ display: 'none' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </section>
          {/* Continue Button */}
          <button
            disabled={!canContinue || submitting}
            onClick={handleContinue}
            style={{
              background: 'linear-gradient(90deg, #f59e42 0%, #f43f5e 100%)',
              color: '#fff',
              fontWeight: 900,
              padding: '16px 0',
              border: 'none',
              borderRadius: 10,
              fontSize: 22,
              marginTop: 10,
              width: '100%',
              boxShadow: '0 2px 8px 0 rgba(244,63,94,0.10)',
              cursor: (!canContinue || submitting) ? 'not-allowed' : 'pointer',
              opacity: (!canContinue || submitting) ? 0.6 : 1,
              transition: 'background 0.2s',
              letterSpacing: 0.5,
            }}
          >{submitting ? 'Saving...' : 'Continue'}</button>
          {userRole === 'viewer' && (
            <div style={{ color: 'red', marginTop: 12, textAlign: 'center', fontWeight: 600 }}>
              Viewers cannot onboard or access privileged features.
            </div>
          )}
          {/* Progress Bar */}
          <div className="progress-bar" style={{ marginTop: 18, textAlign: 'center', color: '#6366f1', fontWeight: 700, fontSize: 16 }}>
            Step 1 of 7
          </div>
        </div>
      </main>
    </>
  );
}
