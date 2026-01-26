'use client';

import { useAuthWorkspaceGuard } from '@/lib/useAuthWorkspaceGuard';
import { db } from '@/lib/firebase';
import { generateWeeklyReport, saveShareableReport } from '@/lib/shareableWins';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { ArrowLeft, ArrowUpRight, Calendar, Copy, ExternalLink, Share2, Sparkles, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SavedReport {
  id: string;
  title: string;
  dateRange: { start: Date; end: Date };
  metrics: Array<{
    label: string;
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'flat';
  }>;
  insights: string[];
  shareLink: string;
  createdAt: Date;
}

export default function ReportsPage() {
  const { isReady, isAuthorized, workspaceId } = useAuthWorkspaceGuard();
  const router = useRouter();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const loadReports = async () => {
      try {
        const q = query(
          collection(db, 'shareable_reports'),
          where('workspaceId', '==', workspaceId),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);

        const loaded: SavedReport[] = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title,
            dateRange: {
              start: data.dateRange?.start?.toDate?.() || new Date(),
              end: data.dateRange?.end?.toDate?.() || new Date(),
            },
            metrics: data.metrics || [],
            insights: data.insights || [],
            shareLink: data.shareLink || '',
            createdAt: data.createdAt?.toDate?.() || new Date(),
          };
        });

        setReports(loaded);
      } catch (e) {
        console.error('Failed to load reports:', e);
      }
    };

    loadReports();
  }, [workspaceId]);

  const handleGenerateReport = async () => {
    if (!workspaceId || generating) return;

    setGenerating(true);

    try {
      const report = await generateWeeklyReport(workspaceId);
      const saved = await saveShareableReport(workspaceId, { ...report, type: 'weekly' });

      // Reload reports
      const q = query(
        collection(db, 'shareable_reports'),
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const loaded: SavedReport[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          dateRange: {
            start: data.dateRange?.start?.toDate?.() || new Date(),
            end: data.dateRange?.end?.toDate?.() || new Date(),
          },
          metrics: data.metrics || [],
          insights: data.insights || [],
          shareLink: data.shareLink || '',
          createdAt: data.createdAt?.toDate?.() || new Date(),
        };
      });
      setReports(loaded);
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setGenerating(false);
    }
  };

  const copyShareLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-700 text-white shadow-xl animate-fade-in-slow">
        {/* Animated background gradient bubbles */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-400 opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 right-0 w-96 h-96 bg-blue-400 opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.10),_transparent_40%)]" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/30 shadow"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="hidden h-6 w-px bg-white/25 sm:block" />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/90 shadow">
              <Sparkles className="h-4 w-4 animate-bounce" />
              Shareable Insights
            </span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center shadow-lg">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-lg">Shareable Reports</h1>
              </div>
              <p className="text-white/90 text-lg sm:text-xl font-medium drop-shadow">
                Generate sleek, client-ready weekly reports with one click.<br />Save, share, and celebrate wins across your workspaces.
              </p>
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className={`flex items-center gap-2 px-7 py-4 rounded-2xl font-bold shadow-xl transition-all text-lg border-2 border-white/30 ${
                generating
                  ? 'bg-white/30 text-white cursor-wait'
                  : 'bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-400 text-blue-900 hover:scale-105 hover:shadow-2xl'
              }`}
            >
              <TrendingUp className="h-6 w-6" />
              {generating ? 'Generating...' : 'Generate Weekly Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {reports.length === 0 ? (
          <div className="bg-white/95 backdrop-blur rounded-3xl border border-indigo-100 shadow-2xl p-16 text-center flex flex-col items-center animate-fade-in-slow relative">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 text-white shadow-xl border-4 border-indigo-100">
              <Sparkles className="h-10 w-10 animate-bounce" />
            </div>
            <h3 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">No reports yet</h3>
            <p className="text-gray-600 mb-8 text-lg max-w-xl mx-auto">Generate your first weekly report to start sharing your wins. Reports are beautiful, interactive, and ready to share with your team or clients.</p>
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl border-2 border-indigo-100 ${
                generating
                  ? 'bg-blue-200 text-blue-900 cursor-wait'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 hover:shadow-2xl'
              }`}
            >
              Generate Report
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {reports.map(report => (
              <div key={report.id} className="bg-white/95 backdrop-blur rounded-3xl border border-indigo-100 shadow-2xl overflow-hidden hover:shadow-indigo-200 transition-shadow">
                {/* Header */}
                <div className="px-8 py-5 border-b border-indigo-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-400" />
                      {report.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-base text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {report.dateRange.start.toLocaleDateString()} - {report.dateRange.end.toLocaleDateString()}
                    </div>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-semibold shadow">WEEKLY</span>
                </div>

                {/* Metrics */}
                <div className="px-8 py-6">
                  <h4 className="text-base font-bold text-indigo-700 mb-4 tracking-wide">Key Metrics</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {report.metrics.map((metric, idx) => (
                      <div key={idx} className={`p-5 rounded-2xl border-2 shadow-md flex flex-col items-start gap-2 transition-all ${
                        metric.trend === 'up' ? 'border-green-200 bg-green-50/80' : metric.trend === 'down' ? 'border-red-200 bg-red-50/80' : 'border-gray-100 bg-gray-50/80'
                      }`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{metric.label}</p>
                        <p className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                          {metric.trend === 'up' && <ArrowUpRight className="h-5 w-5 text-green-500 animate-bounce" />}
                          {metric.trend === 'down' && <ArrowUpRight className="h-5 w-5 text-red-500 rotate-180 animate-bounce" />}
                          {metric.trend === 'flat' && <ArrowUpRight className="h-5 w-5 text-gray-400" />}
                          {metric.current}
                        </p>
                        <span className={`text-base font-bold ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                          {metric.change >= 0 ? '+' : ''}{metric.change}%
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Insights */}
                  {report.insights.length > 0 && (
                    <>
                      <h4 className="text-base font-bold text-indigo-700 mb-3 tracking-wide">Insights</h4>
                      <ul className="space-y-2 mb-6">
                        {report.insights.map((insight, idx) => (
                          <li key={idx} className="text-base text-gray-700 flex items-start gap-3">
                            <span className="text-indigo-500 mt-1"><Sparkles className="h-4 w-4" /></span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-indigo-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => copyShareLink(report.shareLink, report.id)}
                      className="flex items-center gap-2 px-5 py-2 bg-white border-2 border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-colors shadow-md font-semibold"
                    >
                      <Copy className="h-4 w-4" />
                      {copied === report.id ? 'Copied!' : 'Copy Link'}
                    </button>
                    <a
                      href={report.shareLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all font-semibold"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Report
                    </a>
                  </div>
                  <span className="text-xs text-gray-500">
                    Generated {report.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Soft divider */}
      <div className="w-full h-8 bg-gradient-to-r from-transparent via-indigo-100 to-transparent mt-16 mb-0 opacity-80" />
      {/* Footer */}
      <footer className="w-full py-6 bg-white/80 text-center text-gray-500 text-sm font-medium border-t border-indigo-100 shadow-inner animate-fade-in-slow">
         2025 Uqentra AI &bull; <span className="text-indigo-600 font-bold">Uqentra AI</span>
      </footer>
    </div>
  );
}

