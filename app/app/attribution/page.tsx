"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "../../../lib/useAuthWorkspaceGuard";
import { getAttributionReport } from "../../../lib/attribution";
import { getWorkspaceIntelligence } from "../../../lib/intelligence";

export default function AttributionPage() {
  const router = useRouter();
  const { workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;
    loadData();
  }, [isReady, isAuthorized, workspaceId, dateRange]);

  async function loadData() {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const now = new Date();
      const start = new Date();
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      start.setDate(start.getDate() - days);

      const [attrReport, intel] = await Promise.all([
        getAttributionReport(workspaceId, { start, end: now }),
        getWorkspaceIntelligence(workspaceId),
      ]);

      setReport(attrReport);
      setIntelligence(intel);
    } finally {
      setLoading(false);
    }
  }

  if (!isReady) return <GuardLoadingScreen />;
  if (!isAuthorized || !workspaceId) return null;

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading Attribution</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>Revenue Attribution</h1>
          <p style={{ marginTop: 8, color: '#6b7280' }}>Track leads  touchpoints  outcomes  revenue</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={dateRange} onChange={e => setDateRange(e.target.value as any)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8 }}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button onClick={() => router.push('/app')} style={{ border: '1px solid #d1d5db', background: '#f9fafb', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}> Dashboard</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Total Outcomes</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>{report?.totalOutcomes || 0}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Total Revenue</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>${((report?.totalRevenue || 0) / 100).toFixed(2)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Top Performers</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>{report?.topEntities?.length || 0}</div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Top Performing Campaigns & Workflows</h2>
        {report?.topEntities && report.topEntities.length > 0 ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {report.topEntities.map((entity: any, i: number) => (
              <div key={entity.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{i + 1}. {entity.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    {entity.touchpoints} touchpoints  {entity.outcomes.toFixed(1)} outcomes
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0ea5e9' }}>${(entity.revenue / 100).toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>attributed revenue</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 32, textAlign: 'center', color: '#6b7280' }}>
            No attribution data yet. Start tracking touchpoints in campaigns and workflows.
          </div>
        )}
      </div>

      {intelligence && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Workspace Intelligence</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}> Top Offers</div>
              {intelligence.bestOffers?.slice(0, 3).map((offer: any, i: number) => (
                <div key={i} style={{ fontSize: 12, padding: 8, background: '#f9fafb', borderRadius: 6, marginBottom: 6 }}>
                  <div style={{ fontWeight: 600 }}>{offer.offer}</div>
                  <div style={{ color: '#6b7280' }}>{(offer.conversionRate * 100).toFixed(1)}% conversion  ${(offer.revenue / 100).toFixed(0)} revenue</div>
                </div>
              )) || <div style={{ fontSize: 12, color: '#6b7280' }}>No data yet</div>}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}> Top Hooks</div>
              {intelligence.bestHooks?.slice(0, 3).map((hook: any, i: number) => (
                <div key={i} style={{ fontSize: 12, padding: 8, background: '#f9fafb', borderRadius: 6, marginBottom: 6 }}>
                  <div style={{ fontWeight: 600 }}>{hook.hook}</div>
                  <div style={{ color: '#6b7280' }}>{(hook.engagementRate * 100).toFixed(1)}% engagement</div>
                </div>
              )) || <div style={{ fontSize: 12, color: '#6b7280' }}>No data yet</div>}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

