import React from "react";
import { PLAN_CONFIG, Plan } from "../lib/orchestrator/types";

const plans: [Plan, typeof PLAN_CONFIG[Plan]][] = Object.entries(PLAN_CONFIG) as [Plan, typeof PLAN_CONFIG[Plan]][];

import { useState } from "react";
import { useRouter } from "next/router";

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const router = useRouter();

  const handleSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    // Wire up logic here (e.g., API call, redirect, etc.)
    // For demo, just highlight selection
  };

  const handleBack = () => {
    router.push("/"); // Change to "/dashboard" if you want dashboard
  };

  return (
    <main style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>Uqentra Pricing</h1>
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {plans.map(([key, plan]) => (
          <section key={key} style={{ background: selectedPlan === key ? '#e0f2fe' : '#fff', borderRadius: '1rem', boxShadow: '0 2px 12px #0001', padding: '2rem', minWidth: 320, maxWidth: 400, flex: '1 1 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: selectedPlan === key ? '2px solid #2563eb' : 'none' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', color: '#2563eb' }}>{plan.label}</h2>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
              {plan.price > 0 ? `$${plan.price}/mo` : 'Custom'}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem', textAlign: 'left', width: '100%' }}>
              <li><strong>Agents:</strong> {plan.agentLimit ?? 'Unlimited'}</li>
              <li><strong>Workflows:</strong> {plan.workflowLimit ?? 'Unlimited'}</li>
              <li><strong>Users:</strong> {plan.userLimit ?? 'Unlimited'}</li>
              <li><strong>Workspaces:</strong> {plan.workspaceLimit ?? 'Unlimited'}</li>
            </ul>
            <div style={{ marginBottom: '1rem', width: '100%' }}>
              <strong>Features:</strong>
              <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                {plan.features.map((f: string, i: number) => (
                  <li key={i} style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{f}</li>
                ))}
              </ul>
            </div>
            <button
              style={{
                marginTop: '1rem',
                padding: '0.75rem 2rem',
                fontWeight: 600,
                fontSize: '1rem',
                background: selectedPlan === key ? '#2563eb' : '#f1f5f9',
                color: selectedPlan === key ? '#fff' : '#2563eb',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                boxShadow: selectedPlan === key ? '0 2px 8px #2563eb33' : 'none',
                transition: 'all 0.2s',
              }}
              onClick={() => handleSelect(key as Plan)}
            >
              {selectedPlan === key ? 'Selected' : 'Select Plan'}
            </button>
            {key === 'founders' && (
              <div style={{ color: '#f59e42', fontWeight: 600, marginTop: '1rem' }}>
                By invitation only
              </div>
            )}
          </section>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          style={{
            padding: '0.75rem 2rem',
            fontWeight: 600,
            fontSize: '1rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px #2563eb33',
            transition: 'all 0.2s',
          }}
          onClick={handleBack}
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}
