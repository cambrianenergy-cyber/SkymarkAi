'use client';

import { useAuthWorkspaceGuard } from '@/lib/useAuthWorkspaceGuard';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AgentRunRecord {
  id: string;
  runId: string;
  agentType: string;
  channel: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'succeeded_with_no_output';
  triggerSource: string;
  duration?: number;
  outputs?: { artifactIds?: string[] };
  error?: { message: string };
  startedAt: { toDate: () => Date };
  endedAt?: { toDate: () => Date };
}

export default function AgentActivityPage() {
  const { isReady, isAuthorized, workspaceId } = useAuthWorkspaceGuard();
  const router = useRouter();
  const [runs, setRuns] = useState<AgentRunRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;

    const loadRuns = async () => {
      try {
        const q = query(
          collection(db, 'agent_runs'),
          where('workspaceId', '==', workspaceId),
          orderBy('startedAt', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as AgentRunRecord[];
        setRuns(data);
      } catch (e) {
        console.error('Failed to load agent runs:', e);
      } finally {
        setLoading(false);
      }
    };

    loadRuns();
  }, [isReady, isAuthorized, workspaceId]);

  if (!isReady) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!isAuthorized) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return '#0f766e';
      case 'failed': return '#b91c1c';
      case 'running': return '#2563eb';
      case 'queued': return '#6b7280';
      case 'succeeded_with_no_output': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded': return <CheckCircle className="h-5 w-5" color="#0f766e" />;
      case 'failed': return <AlertCircle className="h-5 w-5" color="#b91c1c" />;
      case 'running': return <Zap className="h-5 w-5" color="#2563eb" />;
      default: return <Clock className="h-5 w-5" color="#6b7280" />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => router.back()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Agent Activity</h1>
              <p style={{ color: '#6b7280', marginTop: 4 }}>Real-time agent execution logs and audit trail</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ color: '#6b7280' }}>Loading agent activity...</div>
          </div>
        ) : runs.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center' }}>
            <Zap className="h-12 w-12" style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>No agent runs yet</h3>
            <p style={{ color: '#6b7280', marginTop: 8 }}>Agent activity will appear here as workflows run and agents execute.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {runs.map(run => (
              <div
                key={run.id}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 120px 100px 100px',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                {/* Status Icon */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {getStatusIcon(run.status)}
                </div>

                {/* Details */}
                <div>
                  <p style={{ fontWeight: 600, margin: 0, color: '#1f2937' }}>
                    {run.agentType.replace(/_/g, ' ')}
                  </p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>
                    {run.channel}  {run.triggerSource}  Run ID: {run.runId.slice(0, 12)}...
                  </p>
                  {run.outputs?.artifactIds && run.outputs.artifactIds.length > 0 && (
                    <p style={{ fontSize: 11, color: '#0f766e', marginTop: 4 }}>
                      Output: {run.outputs.artifactIds.join(', ')}
                    </p>
                  )}
                  {run.error && (
                    <p style={{ fontSize: 11, color: '#b91c1c', marginTop: 4 }}>
                      Error: {run.error.message}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 600, margin: 0, color: '#1f2937' }}>
                    {run.duration ? `${(run.duration / 1000).toFixed(2)}s` : ''}
                  </p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>duration</p>
                </div>

                {/* Status Badge */}
                <div style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: `${getStatusColor(run.status)}20`,
                      color: getStatusColor(run.status),
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {run.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Timestamp */}
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                    {run.startedAt?.toDate?.()?.toLocaleTimeString?.() || ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

