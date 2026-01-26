'use client';

import { useAuthWorkspaceGuard } from '@/lib/useAuthWorkspaceGuard';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SystemHealth } from '@/lib/types/agentAudit';
import { validateIntegrations, IntegrationStatus } from '@/lib/integrationValidator';

export default function SystemHealthPage() {
  const { isReady, isAuthorized, workspaceId } = useAuthWorkspaceGuard();
  const router = useRouter();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;

    const loadHealth = async () => {
      try {
        const res = await fetch(`/api/health/${workspaceId}`);
        if (!res.ok) throw new Error('Failed to fetch health');
        const data = await res.json();
        setHealth(data);
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load health data');
      } finally {
        setLoading(false);
      }
    };

    loadHealth();
    const interval = setInterval(loadHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [isReady, isAuthorized, workspaceId]);

  if (!isReady) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!isAuthorized) return null;

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
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>System Health</h1>
              <p style={{ color: '#6b7280', marginTop: 4 }}>Monitor agent orchestration and integration status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading health data...</div>
        ) : error ? (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: 16, borderRadius: 8 }}>
            {error}
          </div>
        ) : health ? (
          <div style={{ display: 'grid', gap: 24 }}>
            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, borderLeft: '4px solid #10b981' }}>
                <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>SUCCESS RATE (24h)</p>
                <p style={{ fontSize: 32, fontWeight: 800, margin: '8px 0 0 0', color: '#10b981' }}>
                  {health.metrics.successRate24h}%
                </p>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, borderLeft: '4px solid #ef4444' }}>
                <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>ERROR RATE (24h)</p>
                <p style={{ fontSize: 32, fontWeight: 800, margin: '8px 0 0 0', color: '#ef4444' }}>
                  {health.metrics.errorRate24h}%
                </p>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, borderLeft: '4px solid #3b82f6' }}>
                <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>AVG LATENCY (24h)</p>
                <p style={{ fontSize: 32, fontWeight: 800, margin: '8px 0 0 0', color: '#3b82f6' }}>
                  {(health.metrics.avgLatency24h / 1000).toFixed(2)}s
                </p>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, borderLeft: '4px solid #8b5cf6' }}>
                <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>TOTAL RUNS (24h)</p>
                <p style={{ fontSize: 32, fontWeight: 800, margin: '8px 0 0 0', color: '#8b5cf6' }}>
                  {health.metrics.totalRuns24h}
                </p>
              </div>
            </div>

            {/* System Components */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>System Components</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {/* Orchestrator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {health.orchestrator.reachable ? (
                      <CheckCircle2 className="h-5 w-5" style={{ color: '#10b981' }} />
                    ) : (
                      <AlertTriangle className="h-5 w-5" style={{ color: '#ef4444' }} />
                    )}
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>Orchestrator</p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>
                        Last checked: {new Date(health.orchestrator.lastCheck).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: health.orchestrator.reachable ? '#10b981' : '#ef4444' }}>
                    {health.orchestrator.reachable ? 'OK' : 'FAILED'}
                  </span>
                </div>

                {/* Database */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {health.database.healthy ? (
                      <CheckCircle2 className="h-5 w-5" style={{ color: '#10b981' }} />
                    ) : (
                      <AlertTriangle className="h-5 w-5" style={{ color: '#ef4444' }} />
                    )}
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>Database</p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>
                        Read: {health.database.readOk ? '' : ''} | Write: {health.database.writeOk ? '' : ''}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: health.database.healthy ? '#10b981' : '#ef4444' }}>
                    {health.database.healthy ? 'OK' : 'FAILED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Integrations */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0 }}>Integrations</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {Object.entries(health.integrations).map(([key, integration]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {integration.valid ? (
                        <CheckCircle2 className="h-5 w-5" style={{ color: '#10b981' }} />
                      ) : (
                        <AlertTriangle className="h-5 w-5" style={{ color: '#ef4444' }} />
                      )}
                      <div>
                        <p style={{ fontWeight: 600, margin: 0 }}>{integration.name}</p>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>
                          Verified: {new Date(integration.lastVerified).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: integration.valid ? '#10b981' : '#ef4444' }}>
                      {integration.valid ? 'VALID' : 'INVALID'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Successful Run */}
            {health.lastSuccessfulRun && (
              <div style={{ background: '#ecfdf5', borderRadius: 12, padding: 20, borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Activity className="h-5 w-5" style={{ color: '#10b981' }} />
                  <h3 style={{ margin: 0, fontWeight: 600 }}>Last Successful Agent Run</h3>
                </div>
                <p style={{ margin: '8px 0 0 0', color: '#047857', fontSize: 14 }}>
                  <strong>{health.lastSuccessfulRun.agentType}</strong> ran at{' '}
                  {new Date(health.lastSuccessfulRun.timestamp).toLocaleTimeString()}
                </p>
                <p style={{ margin: '4px 0 0 0', color: '#047857', fontSize: 12 }}>
                  Run ID: {health.lastSuccessfulRun.runId}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

