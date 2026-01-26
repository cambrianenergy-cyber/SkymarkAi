// components/AgentRecommendationPopup.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, TrendingUp, Zap, ShoppingCart } from 'lucide-react';
import type { AgentRecommendation } from '@/lib/orchestratorProdigy';

interface AgentRecommendationPopupProps {
  recommendations: AgentRecommendation[];
  taskName: string;
  onClose: () => void;
  onDismiss: () => void;
  onProceedAnyway: () => void;
}

export default function AgentRecommendationPopup({
  recommendations,
  taskName,
  onClose,
  onDismiss,
  onProceedAnyway,
}: AgentRecommendationPopupProps) {
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  if (recommendations.length === 0) return null;

  const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
  const displayRecs = highPriorityRecs.length > 0 ? highPriorityRecs : recommendations.slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 rounded-t-xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-yellow-300" />
            <h2 className="text-2xl font-bold text-white">Unlock Better Results!</h2>
          </div>
          <p className="text-indigo-100">
            The Orchestrator detected agents that would enhance your <strong>{taskName}</strong>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900">
                  Your task can run with current agents, but adding these will significantly boost performance.
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Agents */}
          <div className="space-y-3">
            {displayRecs.map((rec) => (
              <div
                key={rec.recommendedAgent}
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  selectedAgent === rec.recommendedAgent
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedAgent(rec.recommendedAgent)}
              >
                <div className="flex items-start gap-4">
                  {/* Agent Icon */}
                  <div className="text-4xl flex-shrink-0">{rec.agentIcon}</div>

                  {/* Agent Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{rec.agentName}</h3>
                      {rec.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                          HIGHLY RECOMMENDED
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>

                    <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                      <p className="text-sm text-green-800">
                        <strong>Benefit:</strong> {rec.benefit}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-semibold">{rec.estimatedImprovement}</span>
                      </div>
                      {rec.currentAgentUsed && (
                        <span className="text-xs text-gray-500">
                          (vs. {rec.currentAgentUsed})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Improvement */}
          {displayRecs.length > 1 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 text-center">
              <p className="text-lg font-bold text-green-800">
                Combined: Up to <span className="text-2xl">{displayRecs.length * 50}%</span> better results!
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                if (selectedAgent) {
                  router.push(`/app/marketplace?highlight=${selectedAgent}`);
                } else {
                  router.push('/app/marketplace');
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              <ShoppingCart className="w-5 h-5" />
              {selectedAgent ? 'Get This Agent' : 'Browse Marketplace'}
            </button>

            <button
              onClick={onProceedAnyway}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Continue Without
            </button>
          </div>

          {/* Dismiss Link */}
          <div className="text-center">
            <button
              onClick={onDismiss}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Don't show recommendations again for this session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
