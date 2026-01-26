'use client';

import { getRandomInsight, InsightDrop } from '@/lib/insightDrops';
import { AlertTriangle, Info, Lightbulb, TrendingUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface InsightDropCardProps {
  context: InsightDrop['context'];
}

export default function InsightDropCard({ context }: InsightDropCardProps) {
  const [insight, setInsight] = useState<InsightDrop | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const randomInsight = getRandomInsight(context);
    setInsight(randomInsight);
  }, [context]);

  if (!insight || dismissed) return null;

  const iconMap = {
    strategy: TrendingUp,
    'best-practice': Info,
    warning: AlertTriangle,
    tip: Lightbulb,
  };

  const colorMap = {
    strategy: 'bg-blue-50 border-blue-200 text-blue-900',
    'best-practice': 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    tip: 'bg-purple-50 border-purple-200 text-purple-900',
  };

  const Icon = iconMap[insight.category];

  return (
    <div className={`rounded-lg border p-4 mb-6 ${colorMap[insight.category]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
            <p className="text-sm opacity-90">{insight.message}</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
