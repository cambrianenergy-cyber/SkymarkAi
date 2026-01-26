'use client';

import { ConstraintRecommendation, getActiveConstraints } from '@/lib/constraints';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConstraintAlertProps {
  workspaceId: string;
}

export default function ConstraintAlert({ workspaceId }: ConstraintAlertProps) {
  const [constraints, setConstraints] = useState<ConstraintRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;

    const loadConstraints = async () => {
      setLoading(true);
      const recs = await getActiveConstraints(workspaceId);
      setConstraints(recs);
      setLoading(false);
    };

    loadConstraints();
  }, [workspaceId]);

  const dismissConstraint = async (constraint: ConstraintRecommendation) => {
    try {
      // In real implementation, we'd store the constraint ID when creating
      // For now, just remove from local state
      setConstraints(prev => prev.filter(c => c !== constraint));
    } catch (e) {
      console.error('Failed to dismiss constraint:', e);
    }
  };

  if (loading || constraints.length === 0) return null;

  const iconMap = {
    high: AlertCircle,
    medium: AlertTriangle,
    low: Info,
  };

  const colorMap = {
    high: 'bg-red-50 border-red-200 text-red-900',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    low: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  return (
    <div className="space-y-3 mb-6">
      {constraints.map((constraint, idx) => {
        const Icon = iconMap[constraint.severity];
        return (
          <div key={idx} className={`rounded-lg border p-4 ${colorMap[constraint.severity]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">{constraint.message}</h4>
                  <p className="text-sm opacity-80 mb-2">{constraint.reason}</p>
                  <p className="text-sm font-medium">
                    <span className="opacity-70">Suggested action:</span> {constraint.suggestedAction}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissConstraint(constraint)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                title="Dismiss"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
