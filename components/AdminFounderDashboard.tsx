"use client";
import { useApprovalTasks } from "./useApprovalTasks";
import { useAnomalyDetection } from "./useAnomalyDetection";
import { RetryBarChart } from "./RetryBarChart";
import { useFirestoreQuery } from "./useFirestoreQuery";
// ...existing code...
import React, { useState } from "react";
// Color badge for status
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    running: '#007bff',
    queued: '#ffc107',
    done: '#28a745',
    succeeded: '#28a745',
    failed: '#dc3545',
    canceled: '#6c757d',
    partial: '#fd7e14',
    paused: '#6c757d',
    pause: '#6c757d',
    kill: '#dc3545',
    override: '#6610f2',
    resume: '#20c997',
  };
  const color = colorMap[status?.toLowerCase()] || '#adb5bd';
  return (
    <span style={{
      background: color,
      color: '#fff',
      borderRadius: 8,
      padding: '2px 10px',
      fontSize: 13,
      fontWeight: 500,
      textTransform: 'capitalize',
      letterSpacing: 0.5,
      marginRight: 2,
      display: 'inline-block',
      minWidth: 70,
      textAlign: 'center',
    }}>{status}</span>
  );
}
import { useFirestoreCollection } from "./useFirestoreCollection";
import WorkspaceKnowledgeInspector from "./WorkspaceKnowledgeInspector";
import { SocialConnectionStatus } from "./SocialConnectionStatus";
import { reconnectSocialPlatform } from "../lib/reconnectSocialPlatform";
import { useToolPermission } from "../lib/useToolPermission";
import StepTimeline from "./StepTimeline";
import ReactModal from "react-modal";

// Placeholder for admin/founder dashboard UI
// Features: orchestrator activity, agent monitor, workflow viewer, kill-switch, audit stream

// Modal style for timeline drill-down
const modalStyle = {
  overlay: { zIndex: 1000, background: "rgba(0,0,0,0.25)" },
  content: { maxWidth: 700, margin: "auto", borderRadius: 12, padding: 32 }
};

export default function AdminFounderDashboard() {
      // Timeline modal state
      const [timelineOpen, setTimelineOpen] = useState(false);
      const [timelineSteps, setTimelineSteps] = useState<any[]>([]);
      const [timelineTitle, setTimelineTitle] = useState<string>("");

      // Fetch steps for a workflow/agent run (mock: expects steps inline, real: fetch subcollection if needed)
      function openTimeline(run: any, type: 'workflow' | 'agent') {
        let steps = run.steps || [];
        setTimelineSteps(steps);
        setTimelineTitle(`${type === 'workflow' ? 'Workflow' : 'Agent'} Run: ${run.id}`);
        setTimelineOpen(true);
      }
    // Needs Review Inbox (approval_tasks)
    const [approvalTasks, approvalLoading] = useApprovalTasks({ status: "pending" });
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("pending");

    const handleSelectTask = (id: string, checked: boolean) => {
      setSelectedTasks((prev) => checked ? [...prev, id] : prev.filter((tid) => tid !== id));
    };

    const handleSelectAll = () => {
      if (!approvalTasks) return;
      setSelectedTasks(approvalTasks.map((t: any) => t.id));
    };
    const handleClearSelection = () => setSelectedTasks([]);

    const handleBulkAction = async (action: "approve" | "reject" | "needs_info") => {
      // TODO: Replace with real API call
      alert(`Would ${action} tasks: ${selectedTasks.join(", ")}`);
      setSelectedTasks([]);
    };

    // Filter tasks by type if selected
    const filteredApprovalTasks = approvalTasks ? approvalTasks.filter((t: any) =>
      (!filterType || t.type === filterType) && (!filterStatus || t.status === filterStatus)
    ) : [];
        {/* Needs Review Inbox */}
        <div style={{ marginBottom: 32 }}>
          <h3>Needs Review Inbox</h3>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
            <button disabled={!selectedTasks.length} onClick={() => handleBulkAction("approve")}>Approve</button>
            <button disabled={!selectedTasks.length} onClick={() => handleBulkAction("reject")}>Reject</button>
            <button disabled={!selectedTasks.length} onClick={() => handleBulkAction("needs_info")}>Mark as Needs Info</button>
            <button disabled={!approvalTasks || !approvalTasks.length} onClick={handleSelectAll}>Select All</button>
            <button disabled={!selectedTasks.length} onClick={handleClearSelection}>Clear Selection</button>
            <span style={{ marginLeft: 16 }}>Filter:</span>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="run">Run</option>
              <option value="step">Step</option>
              <option value="tool">Tool</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="needs_info">Needs Info</option>
            </select>
          </div>
          {approvalLoading ? (
            <p>Loading approval tasks...</p>
          ) : filteredApprovalTasks && filteredApprovalTasks.length > 0 ? (
            <table style={{ width: '100%', fontSize: 14, background: '#fff', borderRadius: 6, borderCollapse: 'collapse', boxShadow: '0 1px 4px #eee' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredApprovalTasks.map((task: any) => (
                  <tr key={task.id} style={{ background: selectedTasks.includes(task.id) ? '#e9ecef' : undefined }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={e => handleSelectTask(task.id, e.target.checked)}
                      />
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{task.id}</td>
                    <td>{task.type || '-'}</td>
                    <td>{task.reason || '-'}</td>
                    <td>{task.createdAt ? new Date(task.createdAt.seconds * 1000).toLocaleString() : '-'}</td>
                    <td><StatusBadge status={task.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No approval tasks found for this filter.</p>
          )}
        </div>
  // Metrics: retry rates by tool/step type
  // Assumes a Firestore collection 'step_retries' with fields: tool, stepType, retryCount, lastRetryAt
  const [stepRetries, stepRetriesLoading] = useFirestoreCollection<any>("step_retries");
  let retryBarData: { label: string; value: number }[] = [];
  if (stepRetries) {
    const retryByTool: { [tool: string]: number } = {};
    for (const r of stepRetries) {
      if (!r.tool) continue;
      retryByTool[r.tool] = (retryByTool[r.tool] || 0) + (r.retryCount || 0);
    }
    retryBarData = Object.entries(retryByTool).map(([label, value]) => ({ label, value }));
  }
  // Automated anomaly detection/alerts
  const anomalies = useAnomalyDetection(stepRetries);
  {/* Automated Anomaly Alerts */}
  {anomalies.length > 0 && (
    <div style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', borderRadius: 6, padding: 12, marginBottom: 24 }}>
      <strong>Alerts:</strong>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {anomalies.map((a, i) => <li key={i}>{a}</li>)}
      </ul>
    </div>
  )}
    // Metrics: retry rates by tool/step type
    // Assumes a Firestore collection 'step_retries' with fields: tool, stepType, retryCount, lastRetryAt
    // ...existing code...
  const [targetType, setTargetType] = useState("agent");
  const [targetId, setTargetId] = useState("");
  const [action, setAction] = useState("pause");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const workspaceId = "demo-workspace"; // Replace with real context
  const actorId = "founder-demo"; // Replace with real founder/admin id

  async function handleOverride(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch('/api/founder-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          targetType,
          targetId,
          action,
          actorId,
          reason,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("Override successful");
      } else {
        setStatus("Error: " + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      setStatus("Error: " + (err?.message || err));
    }
  }

  // Real-time Firestore collections
  const [agentRuns, agentRunsLoading] = useFirestoreCollection<any>("agent_runs");
  const [workflowRuns, workflowRunsLoading] = useFirestoreCollection<any>("workflow_runs");
  const [agentTasks, agentTasksLoading] = useFirestoreCollection<any>("agent_tasks");

  // Filtering/search state
  const [agentRunFilter, setAgentRunFilter] = useState("");
  const [workflowRunFilter, setWorkflowRunFilter] = useState("");
  const [agentTaskFilter, setAgentTaskFilter] = useState("");

  return (
    <div style={{ padding: 32 }}>
      {/* Social Connection Health Indicator (Demo: Twitter) */}
      <div style={{ marginBottom: 24 }}>
        <h3>Social Connection Health</h3>
        <SocialConnectionStatus
          userId={actorId}
          platform="twitter"
          onReconnect={async () => {
            await reconnectSocialPlatform(actorId, "twitter");
          }}
        />
        <button style={{ marginLeft: 16 }} onClick={async () => await reconnectSocialPlatform(actorId, "twitter")}>Reconnect (Demo)</button>
      </div>
            {/* Metrics: Retry Rates by Tool/Step Type */}
            <div style={{ marginBottom: 32 }}>
              <h3>Step Retry Metrics</h3>
              {stepRetriesLoading ? (
                <p>Loading retry metrics...</p>
              ) : stepRetries && stepRetries.length > 0 ? (
                <>
                  <RetryBarChart data={retryBarData} />
                  <table style={{ width: '100%', fontSize: 14, background: '#f3f6fa', borderRadius: 6 }}>
                    <thead>
                      <tr>
                        <th>Tool</th>
                        <th>Step Type</th>
                        <th>Retry Count</th>
                        <th>Last Retry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stepRetries.map((retry: any) => (
                        <tr key={retry.id}>
                          <td>{retry.tool || '-'}</td>
                          <td>{retry.stepType || '-'}</td>
                          <td style={{ color: retry.retryCount > 0 ? '#dc3545' : '#28a745', fontWeight: 600 }}>{retry.retryCount}</td>
                          <td>{retry.lastRetryAt ? new Date(retry.lastRetryAt.seconds * 1000).toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p>No retry metrics found.</p>
              )}
            </div>
      <h1>Admin & Founder Dashboard</h1>
      <ul style={{ fontSize: 18, marginBottom: 32 }}>
        <li>Visual Orchestrator Activity Dashboard</li>
        <li>Agent Execution Monitor</li>
        <li>Workflow Run Viewer</li>
        <li>Global Kill-Switch (Founder Override)</li>
        <li>Live Audit Stream</li>
      </ul>
      <form onSubmit={handleOverride} style={{ marginBottom: 32, background: '#f8f8f8', padding: 16, borderRadius: 8 }}>
        <h3>Founder Emergency Override</h3>
        <div style={{ marginBottom: 8 }}>
          <label>Target Type: </label>
          <select value={targetType} onChange={e => setTargetType(e.target.value)}>
            <option value="agent">Agent</option>
            <option value="agent_run">Agent Run</option>
            <option value="workflow_run">Workflow Run</option>
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Target ID: </label>
          <input value={targetId} onChange={e => setTargetId(e.target.value)} required style={{ width: 200 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Action: </label>
          <select value={action} onChange={e => setAction(e.target.value)}>
            <option value="pause">Pause</option>
            <option value="kill">Kill</option>
            <option value="resume">Resume</option>
            <option value="override">Override</option>
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Reason: </label>
          <input value={reason} onChange={e => setReason(e.target.value)} required style={{ width: 300 }} />
        </div>
        <button type="submit">Execute Emergency Override</button>
        {status && <div style={{ marginTop: 8, color: status.startsWith("Error") ? "red" : "green" }}>{status}</div>}
      </form>
      {/* Real-time Orchestrator Activity */}
      <div style={{ marginBottom: 32 }}>
        <h3>Orchestrator Activity (Agent Runs)</h3>
        <input
          type="text"
          placeholder="Search by ID, status, or agent..."
          value={agentRunFilter}
          onChange={e => setAgentRunFilter(e.target.value)}
          style={{ marginBottom: 8, width: 260 }}
        />
        {agentRunsLoading ? (
          <p>Loading agent runs...</p>
        ) : agentRuns && agentRuns.length > 0 ? (
          <table style={{ width: '100%', fontSize: 14, background: '#fafbfc', borderRadius: 6 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Agent</th>
                <th>Started</th>
                <th>Updated</th>
                <th>Timeline</th>
              </tr>
            </thead>
            <tbody>
              {agentRuns.filter((run: any) =>
                [run.id, run.status, run.agentId].join(" ").toLowerCase().includes(agentRunFilter.toLowerCase())
              ).map((run: any) => (
                <tr key={run.id}>
                  <td>{run.id}</td>
                  <td><StatusBadge status={run.status} /></td>
                  <td>{run.agentId || '-'}</td>
                  <td>{run.startedAt ? new Date(run.startedAt.seconds * 1000).toLocaleString() : '-'}</td>
                  <td>{run.updatedAt ? new Date(run.updatedAt.seconds * 1000).toLocaleString() : '-'}</td>
                  <td>
                    <button onClick={() => openTimeline(run, 'agent')}>View Timeline</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No agent runs found.</p>
        )}
      </div>

      {/* Real-time Workflow Progress */}
      <div style={{ marginBottom: 32 }}>
        <h3>Workflow Runs</h3>
        <input
          type="text"
          placeholder="Search by ID or status..."
          value={workflowRunFilter}
          onChange={e => setWorkflowRunFilter(e.target.value)}
          style={{ marginBottom: 8, width: 220 }}
        />
        {workflowRunsLoading ? (
          <p>Loading workflow runs...</p>
        ) : workflowRuns && workflowRuns.length > 0 ? (
          <table style={{ width: '100%', fontSize: 14, background: '#fafbfc', borderRadius: 6 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Started</th>
                <th>Updated</th>
                <th>Timeline</th>
              </tr>
            </thead>
            <tbody>
              {workflowRuns.filter((run: any) =>
                [run.id, run.status].join(" ").toLowerCase().includes(workflowRunFilter.toLowerCase())
              ).map((run: any) => (
                <tr key={run.id}>
                  <td>{run.id}</td>
                  <td><StatusBadge status={run.status} /></td>
                  <td>{run.startedAt ? new Date(run.startedAt.seconds * 1000).toLocaleString() : '-'}</td>
                  <td>{run.updatedAt ? new Date(run.updatedAt.seconds * 1000).toLocaleString() : '-'}</td>
                  <td>
                    <button onClick={() => openTimeline(run, 'workflow')}>View Timeline</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No workflow runs found.</p>
        )}
      </div>
      {/* Timeline Modal */}
      <ReactModal
        isOpen={timelineOpen}
        onRequestClose={() => setTimelineOpen(false)}
        style={modalStyle}
        ariaHideApp={false}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{timelineTitle}</h2>
          <button onClick={() => setTimelineOpen(false)} style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}></button>
        </div>
        <StepTimeline steps={timelineSteps} />
      </ReactModal>

      {/* Real-time Agent Task Activity */}
      <div style={{ marginBottom: 32 }}>
        <h3>Agent Tasks</h3>
        <input
          type="text"
          placeholder="Search by ID, status, agent, or workflow..."
          value={agentTaskFilter}
          onChange={e => setAgentTaskFilter(e.target.value)}
          style={{ marginBottom: 8, width: 320 }}
        />
        {agentTasksLoading ? (
          <p>Loading agent tasks...</p>
        ) : agentTasks && agentTasks.length > 0 ? (
          <table style={{ width: '100%', fontSize: 14, background: '#fafbfc', borderRadius: 6 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Agent</th>
                <th>Workflow Run</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {agentTasks.filter((task: any) =>
                [task.id, task.status, task.agentId, task.workflowRunId].join(" ").toLowerCase().includes(agentTaskFilter.toLowerCase())
              ).map((task: any) => {
                // Example: assume task.toolId is present (adjust as needed)
                const toolId = task.toolId || "llm_function"; // fallback for demo
                const agentId = task.agentId;
                const workspaceId = task.workspaceId;
                // Use the permission hook
                const { allowed, loading } = useToolPermission(agentId, toolId, workspaceId);
                // Social tool gating (demo: if toolId is 'twitter_post', check social connection)
                const [socialAllowed, setSocialAllowed] = React.useState(true);
                React.useEffect(() => {
                  if (toolId === 'twitter_post') {
                    import('../lib/checkSocialToolPermission').then(({ checkSocialToolPermission }) => {
                      checkSocialToolPermission(agentId, 'twitter', ['post']).then(res => setSocialAllowed(res.allowed));
                    });
                  } else {
                    setSocialAllowed(true);
                  }
                }, [toolId, agentId]);
                return (
                  <tr key={task.id}>
                    <td>{task.id}</td>
                    <td><StatusBadge status={task.status} /></td>
                    <td>{task.agentId || '-'}</td>
                    <td>{task.workflowRunId || '-'}</td>
                    <td>{task.updatedAt ? new Date(task.updatedAt.seconds * 1000).toLocaleString() : '-'}</td>
                    <td>
                      {loading ? (
                        <span style={{ color: '#888' }}>Checking...</span>
                      ) : allowed && socialAllowed ? (
                        <button onClick={() => alert(`Run Task: ${task.id}`)}>Run Task</button>
                      ) : (
                        <button disabled style={{ color: '#aaa', cursor: 'not-allowed' }} title={!allowed ? "You do not have permission to run this tool" : "Social connection required or expired"}>Run Task</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No agent tasks found.</p>
        )}
      </div>
      <WorkspaceKnowledgeInspector workspaceId={workspaceId} />
    </div>
  );
}

