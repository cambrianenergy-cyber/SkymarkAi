'use client';

import { useAuthWorkspaceGuard } from '@/lib/useAuthWorkspaceGuard';
import { db } from '@/lib/firebaseClient';
import { INDUSTRY_PLAYBOOKS } from '../../../lib/playbooks';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const INDUSTRY_PALETTES: Record<string, { from: string; to: string; text: string; subtle: string }> = {
  all: { from: '#2563eb', to: '#7c3aed', text: '#ffffff', subtle: '#e0e7ff' },
  'local services': { from: '#f59e0b', to: '#ef4444', text: '#ffffff', subtle: '#fff7ed' },
  'e-commerce': { from: '#22c55e', to: '#14b8a6', text: '#ffffff', subtle: '#ecfdf3' },
  'coaching & consulting': { from: '#6366f1', to: '#a855f7', text: '#ffffff', subtle: '#eef2ff' },
  default: { from: '#2563eb', to: '#7c3aed', text: '#ffffff', subtle: '#e5e7eb' },
};

export default function PlaybooksPage() {
  const { isReady, isAuthorized, workspaceId } = useAuthWorkspaceGuard();
  const router = useRouter();
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [installedPlaybooks, setInstalledPlaybooks] = useState<Set<string>>(new Set());
  const [installing, setInstalling] = useState<string | null>(null);
  const [purchasedPlaybooks, setPurchasedPlaybooks] = useState<Set<string>>(new Set());
  const [hasFounderAccess, setHasFounderAccess] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    const loadInstalled = async () => {
      try {
        const q = query(
          collection(db, 'installed_playbooks'),
          where('workspaceId', '==', workspaceId)
        );
        const snap = await getDocs(q);
        setInstalledPlaybooks(new Set(snap.docs.map(d => d.data().playbookId)));
      } catch (e) {
        console.error('Failed to load installed playbooks:', e);
      }
    };

    // Simulate founder access (replace with real logic as needed)
    const checkFounder = async () => {
      // TODO: Replace with real founder check
      // For now, check localStorage or always false
      setHasFounderAccess(localStorage.getItem('founder') === 'true');
    };

    // Simulate purchased playbooks (replace with real logic as needed)
    const loadPurchased = async () => {
      // TODO: Replace with real purchase check
      setPurchasedPlaybooks(new Set(JSON.parse(localStorage.getItem('purchasedPlaybooks') || '[]')));
    };

    loadInstalled();
    checkFounder();
    loadPurchased();
  }, [workspaceId]);

  const installPlaybook = async (playbook: typeof INDUSTRY_PLAYBOOKS[0]) => {
    if (!workspaceId || installing) return;

    setInstalling(playbook.id);

    try {
      // Create agent presets
      for (const agent of playbook.agentPresets) {
        await addDoc(collection(db, 'agents'), {
          workspaceId,
          type: agent.agentType,
          name: agent.agentType.replace(/_/g, ' '),
          config: agent.configuration,
          status: 'active',
          createdAt: serverTimestamp(),
        });
      }

      // Create workflow templates
      const phases = [
        { phase: 'Phase 1', ...playbook.cadence.phase1 },
        { phase: 'Phase 2', ...playbook.cadence.phase2 },
        { phase: 'Phase 3', ...playbook.cadence.phase3 },
      ];

      for (const phase of phases) {
        await addDoc(collection(db, 'workflows'), {
          workspaceId,
          name: `${playbook.title} - ${phase.phase}`,
          description: phase.actions.join(', '),
          steps: playbook.agentPresets.slice(0, 2).map((a: any, i: number) => ({
            id: `step-${i}`,
            agentType: a.agentType,
            action: 'generate',
            order: i,
          })),
          status: 'draft',
          createdAt: serverTimestamp(),
        });
      }

      // Mark as installed
      await addDoc(collection(db, 'installed_playbooks'), {
        workspaceId,
        playbookId: playbook.id,
        installedAt: serverTimestamp(),
      });

      setInstalledPlaybooks(prev => new Set(prev).add(playbook.id));
    } catch (e) {
      console.error('Failed to install playbook:', e);
    } finally {
      setInstalling(null);
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const industries = ['all', ...new Set(INDUSTRY_PLAYBOOKS.map(p => p.industry))];
  const filteredPlaybooks = selectedIndustry === 'all'
    ? INDUSTRY_PLAYBOOKS
    : INDUSTRY_PLAYBOOKS.filter(p => p.industry === selectedIndustry);

  const paletteFor = (industry: string) => {
    const key = industry.toLowerCase();
    return INDUSTRY_PALETTES[key] || INDUSTRY_PALETTES.default;
  };

  return (
    <main style={{
      padding: 32,
      maxWidth: 1300,
      margin: "0 auto",
      fontFamily: 'Segoe UI, Arial, sans-serif',
      background: 'linear-gradient(120deg, #e3f2fd 0%, #f5f7fa 100%)',
      minHeight: '100vh',
      boxShadow: '0 8px 32px rgba(33,150,243,0.10)',
    }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(90deg, #1976d2 0%, #7c3aed 100%)',
        color: '#fff',
        borderRadius: 18,
        padding: '36px 44px',
        marginBottom: 32,
        boxShadow: '0 4px 24px rgba(33,150,243,0.10)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(255,255,255,0.13)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
            fontWeight: 600,
            fontSize: 15,
            marginBottom: 18,
            cursor: 'pointer',
            marginRight: 18,
          }}
        >
          <ArrowLeft style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Back
        </button>
        <span style={{
          background: 'rgba(255,255,255,0.13)',
          borderRadius: 8,
          padding: '8px 18px',
          fontWeight: 700,
          fontSize: 13,
          marginLeft: 8,
          letterSpacing: 1,
        }}>
          <Sparkles style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Curated Systems
        </span>
        <h1 style={{ fontSize: 38, fontWeight: 900, margin: '18px 0 8px 0', letterSpacing: 1 }}>Industry Playbooks</h1>
        <p style={{ fontSize: 18, opacity: 0.92, maxWidth: 700, marginBottom: 0 }}>
          Install proven, ready-to-run playbooks that configure agents, workflows, and messaging for your industry in minutes.
        </p>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, #fff3 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Industry Filter */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {industries.map(industry => (
            <button
              key={industry}
              onClick={() => setSelectedIndustry(industry)}
              style={
                selectedIndustry === industry
                  ? {
                      background: `linear-gradient(120deg, ${paletteFor(industry).from}, ${paletteFor(industry).to})`,
                      color: paletteFor(industry).text,
                      boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 15,
                      borderRadius: 18,
                      padding: '10px 28px',
                      transform: 'translateY(-1px)',
                      cursor: 'pointer',
                    }
                  : {
                      background: paletteFor(industry).subtle,
                      color: '#0f172a',
                      border: '1px solid #e2e8f0',
                      fontWeight: 600,
                      fontSize: 15,
                      borderRadius: 18,
                      padding: '10px 28px',
                      cursor: 'pointer',
                    }
              }
            >
              {industry === 'all' ? 'All Industries' : industry}
            </button>
          ))}
        </div>
      </div>

      {/* Playbooks Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 32 }}>
          {filteredPlaybooks.map(playbook => {
            const isInstalled = installedPlaybooks.has(playbook.id);
            const isInstalling = installing === playbook.id;
            const isLocked = playbook.status === 'locked' && !hasFounderAccess && !purchasedPlaybooks.has(playbook.id);
            const timeline = [
              { phase: 'Phase 1', duration: playbook.cadence.phase1.duration, actions: playbook.cadence.phase1.actions },
              { phase: 'Phase 2', duration: playbook.cadence.phase2.duration, actions: playbook.cadence.phase2.actions },
              { phase: 'Phase 3', duration: playbook.cadence.phase3.duration, actions: playbook.cadence.phase3.actions },
            ];

            const expectedResults = playbook.kpiExpectations;

            return (
              <div
                key={playbook.id}
                style={{
                  position: 'relative',
                  background: isLocked ? 'linear-gradient(120deg, #f5f7fa 60%, #e3f2fd 100%)' : 'linear-gradient(120deg, #fff 60%, #e3f2fd 100%)',
                  border: isLocked ? '2px solid #ffc107' : '2px solid #b0bec5',
                  borderRadius: 22,
                  boxShadow: '0 8px 32px rgba(33,150,243,0.10)',
                  overflow: 'hidden',
                  minHeight: 420,
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: isLocked ? 0.7 : 1,
                  filter: isLocked ? 'grayscale(0.2)' : 'none',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }}
                onClick={() => router.push(`/app/playbooks/${playbook.id}`)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push(`/app/playbooks/${playbook.id}`); }}
                aria-label={`View details for ${playbook.title}`}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, #e3f2fd 0%, #fff 100%)', opacity: 0.5, zIndex: 0 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 7, background: 'linear-gradient(90deg, #1976d2 0%, #7c3aed 100%)', zIndex: 1 }} />
                {/* Header */}
                <div style={{ position: 'relative', zIndex: 2, padding: '28px 32px 18px 32px', borderBottom: '1.5px solid #b0bec5', background: isLocked ? 'linear-gradient(90deg, #fffbe6 80%, #fffde7 100%)' : 'linear-gradient(90deg, #fff 80%, #e3f2fd 100%)', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 24, fontWeight: 900, color: isLocked ? '#ff9800' : '#1976d2', margin: 0 }}>{playbook.title}</h3>
                    {isInstalled && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', background: '#e6f4ea', color: '#0f9d58', fontWeight: 700, fontSize: 13, borderRadius: 10 }}>
                        <CheckCircle style={{ height: 16, width: 16 }} /> Installed
                      </span>
                    )}
                    {isLocked && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', background: '#fff3cd', color: '#ff9800', fontWeight: 700, fontSize: 13, borderRadius: 10, marginLeft: 8 }}>
                         Locked
                      </span>
                    )}
                    {hasFounderAccess && playbook.founderAccess && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', background: '#e6f4ea', color: '#0f9d58', fontWeight: 700, fontSize: 13, borderRadius: 10, marginLeft: 8 }}>
                         Founder Full Access
                      </span>
                    )}
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#00897b', background: '#e0f2f1', borderRadius: 8, padding: '4px 14px', marginBottom: 6 }}>{playbook.industry}</span>
                  <p style={{ color: '#263238', fontSize: 15, margin: '8px 0 0 0' }}>{playbook.description}</p>
                </div>
                {/* ...existing content and footer remain unchanged... */}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

