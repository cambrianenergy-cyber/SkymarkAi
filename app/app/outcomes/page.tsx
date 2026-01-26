"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "../../../lib/useAuthWorkspaceGuard";
import { db } from "../../../lib/firebase";
import { addDoc, collection, getDocs, query, serverTimestamp, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { trackEvent } from "../../../lib/analytics";

interface Outcome {
  id: string;
  workspaceId: string;
  type: string;
  title: string;
  target: number;
  current: number;
  deadline?: any;
  status: 'active' | 'paused' | 'completed' | 'failed';
  strategy?: any;
  createdAt: any;
  updatedAt: any;
}

const OUTCOME_TYPES = [
  { value: 'booked_calls', label: 'Booked Calls', icon: '', description: 'Get qualified meetings scheduled' },
  { value: 'replies', label: 'Replies', icon: '', description: 'Increase response rate' },
  { value: 'revenue', label: 'Revenue', icon: '', description: 'Generate closed deals' },
  { value: 'conversions', label: 'Conversions', icon: '', description: 'Drive specific actions' },
  { value: 'reactivations', label: 'Reactivations', icon: '', description: 'Re-engage cold leads' },
];

export default function OutcomesPage() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newType, setNewType] = useState('booked_calls');
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState(10);
  const [newDeadlineDays, setNewDeadlineDays] = useState(30);

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;
    loadOutcomes();
  }, [isReady, isAuthorized, workspaceId]);

  async function loadOutcomes() {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'outcomes'),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Outcome[];
      setOutcomes(data);
    } catch (e) {
      console.error('Load outcomes error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || creating || !newTitle.trim()) return;
    setCreating(true);
    try {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + newDeadlineDays);

      // Back-solve strategy based on outcome type
      const strategy = backsolveStrategy(newType, newTarget);

      await addDoc(collection(db, 'outcomes'), {
        workspaceId,
        type: newType,
        title: newTitle.trim(),
        target: newTarget,
        current: 0,
        deadline: deadline,
        status: 'active',
        strategy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      trackEvent('outcome_created', { workspaceId, type: newType, target: newTarget });
      alert(' Outcome created! Skymark will recommend workflows and adjust strategy automatically.');
      setShowCreateModal(false);
      setNewTitle('');
      setNewTarget(10);
      setNewDeadlineDays(30);
      await loadOutcomes();
    } catch (e: any) {
      console.error(e);
      alert('Failed to create outcome: ' + e.message);
    } finally {
      setCreating(false);
    }
  }

  function backsolveStrategy(type: string, target: number) {
    // Intelligent back-solving based on outcome type
    const strategies: Record<string, any> = {
      booked_calls: {
        recommendedAgents: ['Outbound_SDR', 'Community_Manager', 'Copywriter'],
        recommendedWorkflows: ['lead-warmup-sequence-7day', 'reactivation-campaign-cold-leads'],
        cadence: {
          frequency: 'daily',
          channels: ['linkedin', 'email'],
          timing: ['9am', '2pm', '5pm'],
        },
        note: 'Focus on personalized outreach with clear CTAs.',
      },
      replies: {
        recommendedAgents: ['Community_Manager', 'Engagement_Analyst', 'Copywriter'],
        recommendedWorkflows: ['weekly-content-engine', 'repurpose-engine-multi-platform'],
        cadence: {
          frequency: '3x per week',
          channels: ['twitter', 'linkedin'],
          timing: ['10am', '3pm'],
        },
        note: 'Post value-first content with open-ended questions.',
      },
      revenue: {
        recommendedAgents: ['Campaign_Director', 'Offer_Architect', 'Closer'],
        recommendedWorkflows: ['offer-builder-funnel-draft', 'paid-ads-launch-strategy'],
        cadence: {
          frequency: 'campaign-driven',
          channels: ['email', 'linkedin', 'ads'],
          timing: ['varies by campaign phase'],
        },
        note: 'Lead with high-value offers and strong CTAs.',
      },
      conversions: {
        recommendedAgents: ['Funnel_Optimizer', 'Copywriter', 'A/B_Tester'],
        recommendedWorkflows: ['campaign-generator-full-launch', 'analytics-next-week-action-plan'],
        cadence: {
          frequency: 'testing cycles',
          channels: ['landing page', 'email', 'ads'],
          timing: ['split test phases'],
        },
        note: 'Iterate quickly with clear metrics.',
      },
      reactivations: {
        recommendedAgents: ['Reactivation_Specialist', 'Copywriter', 'Engagement_Analyst'],
        recommendedWorkflows: ['reactivation-campaign-cold-leads', 'lead-warmup-sequence-7day'],
        cadence: {
          frequency: 'sequence-based',
          channels: ['email', 'linkedin'],
          timing: ['3-day gaps'],
        },
        note: 'Offer exclusive come-back incentives.',
      },
    };
    return strategies[type] || strategies.booked_calls;
  }

  async function toggleStatus(outcome: Outcome) {
    const newStatus = outcome.status === 'active' ? 'paused' : 'active';
    await updateDoc(doc(db, 'outcomes', outcome.id), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    await loadOutcomes();
  }

  if (!isReady) return <GuardLoadingScreen />;
  if (!isAuthorized || !workspaceId) return null;

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading Outcomes</h1>
      </main>
    );
  }

  const progress = (outcome: Outcome) => Math.min(100, Math.round((outcome.current / outcome.target) * 100));

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Outcome Engine</h1>
          <p style={{ marginTop: 8, color: '#6b7280' }}>Set goals. Uqentra back-solves the execution.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/app')} style={{ background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 1px 4px 0 rgba(30,41,59,0.08)' }}> Dashboard</button>
          <button onClick={() => setShowCreateModal(true)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>+ New Outcome</button>
        </div>
      </div>

      {outcomes.length === 0 ? (
        <div style={{ padding: 64, textAlign: 'center', background: '#f9fafb', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}></div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>No outcomes yet</h2>
          <p style={{ color: '#6b7280', marginTop: 8 }}>Create your first outcome and let Skymark optimize toward it.</p>
          <button onClick={() => setShowCreateModal(true)} style={{ marginTop: 16, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>+ New Outcome</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {outcomes.map(outcome => {
            const typeInfo = OUTCOME_TYPES.find(t => t.value === outcome.type) || OUTCOME_TYPES[0];
            return (
              <div key={outcome.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{typeInfo.icon}</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{outcome.title}</h3>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{typeInfo.label}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: outcome.status === 'active' ? '#d1fae5' : '#fef3c7', color: outcome.status === 'active' ? '#065f46' : '#92400e' }}>{outcome.status.toUpperCase()}</span>
                    <button onClick={() => toggleStatus(outcome)} style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>{outcome.status === 'active' ? 'Pause' : 'Resume'}</button>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                    <span>Progress</span>
                    <span style={{ fontWeight: 700 }}>{outcome.current} / {outcome.target}</span>
                  </div>
                  <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#0ea5e9', width: `${progress(outcome)}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>

                {outcome.strategy && (
                  <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, fontSize: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Skymark's Strategy:</div>
                    <div style={{ color: '#6b7280' }}>
                      <div><strong>Agents:</strong> {outcome.strategy.recommendedAgents?.join(', ')}</div>
                      <div><strong>Cadence:</strong> {outcome.strategy.cadence?.frequency} via {outcome.strategy.cadence?.channels?.join(', ')}</div>
                      {outcome.strategy.note && <div style={{ marginTop: 6, fontStyle: 'italic' }}>{outcome.strategy.note}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreateModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 600, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Create New Outcome</h2>
            <form onSubmit={handleCreate}>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Outcome Type</label>
              <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                {OUTCOME_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setNewType(t.value)}
                    style={{
                      textAlign: 'left',
                      padding: 12,
                      border: newType === t.value ? '2px solid #0ea5e9' : '1px solid #e5e7eb',
                      borderRadius: 8,
                      background: newType === t.value ? '#eff6ff' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{t.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.label}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{t.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Goal Title</label>
              <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Get 10 booked calls this month" style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16 }} />

              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Target Number</label>
              <input required type="number" min={1} value={newTarget} onChange={e => setNewTarget(Number(e.target.value))} style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16 }} />

              <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Deadline (days from now)</label>
              <input required type="number" min={1} value={newDeadlineDays} onChange={e => setNewDeadlineDays(Number(e.target.value))} style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16 }} />

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '10px 16px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={creating} style={{ flex: 1, padding: '10px 16px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, cursor: creating ? 'not-allowed' : 'pointer', fontWeight: 600 }}>{creating ? 'Creating' : 'Create Outcome'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

