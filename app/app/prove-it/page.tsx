// app/app/prove-it/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthWorkspaceGuard } from '@/lib/useAuthWorkspaceGuard';
import { getWorkspaceSubscriptions, type WorkspaceSubscriptions } from '@/lib/subscriptionHelper';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Play, Lock, Zap, TrendingUp, CheckCircle2, ArrowLeft } from 'lucide-react';

interface AgentMetrics {
  totalRuns: number;
  successRate: number;
  avgLatency: number;
  lastRun?: string;
}

export default function ProveItPage() {
  const router = useRouter();
  const { isReady, isAuthorized, workspaceId } = useAuthWorkspaceGuard();
  const [subscriptions, setSubscriptions] = useState<WorkspaceSubscriptions | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<Record<string, AgentMetrics>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;

    const loadData = async () => {
      try {
        // Get workspace subscriptions
        const subs = await getWorkspaceSubscriptions(workspaceId);
        setSubscriptions(subs);

        // Load metrics for each subscribed agent
        if (subs.agentIds.length > 0) {
          const metrics: Record<string, AgentMetrics> = {};

          for (const agentId of subs.agentIds) {
            try {
              const q = query(
                collection(db, 'agent_runs'),
                where('workspaceId', '==', workspaceId),
                where('agentType', '==', agentId)
              );
              const snapshot = await getDocs(q);
              const runs = snapshot.docs.map(doc => doc.data());

              if (runs.length > 0) {
                const successCount = runs.filter(r => r.status === 'succeeded').length;
                const totalDuration = runs.reduce((sum, r) => sum + (r.duration || 0), 0);

                metrics[agentId] = {
                  totalRuns: runs.length,
                  successRate: Math.round((successCount / runs.length) * 100),
                  avgLatency: totalDuration / runs.length,
                  lastRun: runs[0]?.createdAt?.toDate?.() || new Date().toISOString(),
                };
              } else {
                metrics[agentId] = {
                  totalRuns: 0,
                  successRate: 0,
                  avgLatency: 0,
                };
              }
            } catch (error) {
              console.error(`Error loading metrics for ${agentId}:`, error);
              metrics[agentId] = {
                totalRuns: 0,
                successRate: 0,
                avgLatency: 0,
              };
            }
          }

          setAgentMetrics(metrics);
        }
      } catch (error) {
        console.error('Error loading prove-it data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isReady, isAuthorized, workspaceId]);

  if (!isReady) return <div className="p-4">Loading...</div>;
  if (!isAuthorized) return <div className="p-4">Not authorized</div>;
  if (loading) return <div className="p-4">Loading subscriptions...</div>;

  const hasSubscriptions = subscriptions && subscriptions.totalSubscribed > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/app')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900"> Prove It</h1>
                <p className="text-gray-600 mt-1">Monitor your subscribed agents in real-time</p>
              </div>
            </div>
            {hasSubscriptions && (
              <button
                onClick={() => router.push('/app/golden-workflow')}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Zap className="w-4 h-4" />
                Run System Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!hasSubscriptions ? (
          // No subscriptions message
          <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Agents Subscribed</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You don't have any agents in your current subscription plan. Upgrade your plan to enable agent observability and performance tracking.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/app/billing')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                View Plans
              </button>
              <button
                onClick={() => router.push('/app/agents')}
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
              >
                Browse Agents
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-gray-600 text-sm">Subscribed Agents</p>
                <p className="text-3xl font-bold text-indigo-600">{subscriptions.totalSubscribed}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-gray-600 text-sm">Active Agents</p>
                <p className="text-3xl font-bold text-green-600">
                  {subscriptions.agentIds.filter(id => (agentMetrics[id]?.totalRuns || 0) > 0).length}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-gray-600 text-sm">Total Runs</p>
                <p className="text-3xl font-bold text-blue-600">
                  {subscriptions.agentIds.reduce((sum, id) => sum + (agentMetrics[id]?.totalRuns || 0), 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <p className="text-gray-600 text-sm">Avg Success Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(
                    subscriptions.agentIds.reduce((sum, id) => sum + (agentMetrics[id]?.successRate || 0), 0) /
                      subscriptions.totalSubscribed
                  )}%
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/app/agent-activity')}
                className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition border border-gray-200 text-left"
              >
                <Zap className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-bold text-gray-900">Live Activity</h3>
                <p className="text-sm text-gray-600">Real-time audit trail</p>
              </button>

              <button
                onClick={() => router.push('/app/system-health')}
                className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition border border-gray-200 text-left"
              >
                <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-bold text-gray-900">System Health</h3>
                <p className="text-sm text-gray-600">Metrics & component status</p>
              </button>

              <button
                onClick={() => router.push('/app/channel-verification')}
                className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition border border-gray-200 text-left"
              >
                <CheckCircle2 className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-bold text-gray-900">Integrations</h3>
                <p className="text-sm text-gray-600">Channel connectivity</p>
              </button>
            </div>

            {/* Agent Cards */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Subscribed Agents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptions.agentIds.map((agentId) => {
                  const agentData = subscriptions.agents[agentId];
                  const metrics = agentMetrics[agentId];

                  if (!agentData) return null;

                  return (
                    <div
                      key={agentId}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition border border-gray-200"
                    >
                      {/* Agent Header */}
                      <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-4 rounded-t-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{agentData.icon}</span>
                          <div>
                            <h3 className="text-lg font-bold text-white">{agentData.agentName}</h3>
                            <p className="text-indigo-100 text-sm">{agentId}</p>
                          </div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="p-4 space-y-3">
                        {metrics && metrics.totalRuns > 0 ? (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Total Runs</span>
                              <span className="text-lg font-bold text-gray-900">{metrics.totalRuns}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Success Rate</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      metrics.successRate >= 90
                                        ? 'bg-green-500'
                                        : metrics.successRate >= 70
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                    }`}
                                    style={{ width: `${metrics.successRate}%` }}
                                  />
                                </div>
                                <span className="font-bold text-sm">{metrics.successRate}%</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Avg Latency</span>
                              <span className="font-bold text-gray-900">{(metrics.avgLatency / 1000).toFixed(2)}s</span>
                            </div>

                            {metrics.lastRun && (
                              <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                                Last run: {new Date(metrics.lastRun).toLocaleTimeString()}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-gray-500 text-sm">No runs yet</p>
                            <p className="text-xs text-gray-400">This agent hasn't been triggered</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {metrics && metrics.totalRuns > 0 && (
                        <div className="p-4 border-t border-gray-200 flex gap-2">
                          <button
                            onClick={() => router.push('/app/agent-activity')}
                            className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition text-sm font-medium"
                          >
                            View Runs
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Verification Steps */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-4">How to Prove Your Agents Work</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white text-sm font-bold">1</div>
                  <div>
                    <p className="font-semibold text-gray-900">Run Golden Test</p>
                    <p className="text-xs text-gray-600">Execute a 3-agent workflow</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white text-sm font-bold">2</div>
                  <div>
                    <p className="font-semibold text-gray-900">Check Activity</p>
                    <p className="text-xs text-gray-600">See audit trail with IDs</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white text-sm font-bold">3</div>
                  <div>
                    <p className="font-semibold text-gray-900">Verify Integrations</p>
                    <p className="text-xs text-gray-600">Test channel connectivity</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600 text-white text-sm font-bold">4</div>
                  <div>
                    <p className="font-semibold text-gray-900">Monitor Health</p>
                    <p className="text-xs text-gray-600">Track metrics & status</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

