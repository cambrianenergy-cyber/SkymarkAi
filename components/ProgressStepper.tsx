import React from 'react';

const steps = [
  'Profile',
  'Workspace',
  'Team',
  'Connect',
  'Agents',
  'Finish',
];

export default function ProgressStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 32px 0', gap: 12 }}>
      {steps.map((label, idx) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: idx <= currentStep ? '#6366f1' : '#e0e7ef',
              color: idx <= currentStep ? '#fff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 15,
              border: idx === currentStep ? '2px solid #f59e42' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {idx + 1}
          </div>
          <span style={{ fontWeight: idx === currentStep ? 700 : 500, color: idx === currentStep ? '#6366f1' : '#64748b', fontSize: 15 }}>{label}</span>
          {idx < steps.length - 1 && <span style={{ width: 24, height: 2, background: '#e0e7ef', borderRadius: 1 }} />}
        </div>
      ))}
    </nav>
  );
}
