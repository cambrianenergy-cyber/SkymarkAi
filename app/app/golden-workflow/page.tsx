// app/app/golden-workflow/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthWorkspaceGuard } from '@/lib/useAuthWorkspaceGuard';
import { createGoldenTestWorkflow, runGoldenTestWorkflow } from '@/lib/goldenWorkflow';
import { Play, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function GoldenWorkflowPage() {
  const { isReady, isAuthorized, workspaceId } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<any>(null);
  const [goldenWorkflowId, setGoldenWorkflowId] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;

    // Try to load existing golden workflow or create new one
    const initGoldenWorkflow = async () => {
      try {
        // In a real app, you'd query Firestore for existing golden workflow
        // For now, we'll create one fresh
        addLog('Initializing golden test workflow...');
        // const wfId = await createGoldenTestWorkflow(workspaceId);
        // setGoldenWorkflowId(wfId);
        addLog('Golden workflow ready');
      } catch (error) {
        addLog(`Error initializing: ${error}`);
      }
    };

    initGoldenWorkflow();
  }, [isReady, isAuthorized, workspaceId]);

  const handleRunTest = async () => {
    if (!workspaceId) return;

    setLoading(true);
    addLog(' Starting golden test workflow...');

    try {
      // Create workflow if it doesn't exist
      if (!goldenWorkflowId) {
        addLog('Creating golden test workflow...');
        const wfId = await createGoldenTestWorkflow(workspaceId);
        setGoldenWorkflowId(wfId);
        addLog(`Workflow created: ${wfId}`);
      }

      // Run the test
      addLog('Executing workflow steps...');
      const result = await runGoldenTestWorkflow(workspaceId, goldenWorkflowId);

      if (result.success) {
        addLog(' Step 1: Lead created - ' + result.outputs.leadId);
        addLog(' Step 2: Summary generated');
        addLog(' Step 3: Draft scheduled - ' + result.outputs.draftPostId);
        addLog(' Golden workflow completed successfully!');
        setLastRun({
          status: 'succeeded',
          timestamp: new Date(),
          outputs: result.outputs,
          correlationId: result.runId,
        });
      } else {
        addLog(' Workflow failed - check logs');
        setLastRun({
          status: 'failed',
          timestamp: new Date(),
          outputs: result.outputs,
          correlationId: result.runId,
        });
      }
    } catch (error) {
      addLog(` Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) return <div className="p-4">Loading...</div>;
  if (!isAuthorized) return <div className="p-4">Not authorized</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2"> Golden Test Workflow</h1>
        <p className="text-gray-600">
          Verify that all integrations and agents are working correctly. This workflow
          creates a test lead, summarizes it, and schedules a draft post.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How This Works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Run Test" to trigger the golden workflow</li>
              <li>Agent 1 creates a test lead in your CRM</li>
              <li>Agent 2 generates a summary</li>
              <li>Agent 3 schedules a draft post</li>
              <li>Check Agent Activity page to see audit trail with artifact IDs</li>
              <li>Check System Health to verify metrics captured</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Control */}
      <div className="mb-6">
        <button
          onClick={handleRunTest}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          {loading ? 'Running...' : 'Run Golden Test'}
        </button>
      </div>

      {/* Last Run Result */}
      {lastRun && (
        <div className={`border rounded-lg p-4 mb-6 ${
          lastRun.status === 'succeeded'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {lastRun.status === 'succeeded' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-semibold">
              {lastRun.status === 'succeeded' ? ' Test Passed' : ' Test Failed'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Correlation ID: {lastRun.correlationId}
          </p>
          {lastRun.outputs && Object.keys(lastRun.outputs).length > 0 && (
            <div className="bg-white rounded p-2 mt-2 text-xs font-mono overflow-auto max-h-40">
              {JSON.stringify(lastRun.outputs, null, 2)}
            </div>
          )}
        </div>
      )}

      {/* Live Logs */}
      <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm max-h-96 overflow-auto">
        <div className="flex items-center gap-2 mb-2 text-gray-400">
          <Clock className="w-4 h-4" />
          Live Execution Log
        </div>
        {logs.length === 0 ? (
          <div className="text-gray-500">Click "Run Golden Test" to start...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="whitespace-pre-wrap break-words">
              {log}
            </div>
          ))
        )}
      </div>

      {/* Verification Steps */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">After Running:</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li> Check <a href="/app/agent-activity" className="font-semibold underline">Agent Activity</a> to see the 3 agent runs and their artifact IDs</li>
          <li> Check <a href="/app/system-health" className="font-semibold underline">System Health</a> to confirm metrics were recorded</li>
          <li> Verify the test lead exists in your CRM (name starts with "TEST ")</li>
          <li> Verify the draft post appears in your scheduler</li>
        </ul>
      </div>
    </div>
  );
}

