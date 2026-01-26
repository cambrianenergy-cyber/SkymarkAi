import React from "react";

interface ToolCall {
  toolCallId?: string;
  toolKey?: string;
  status?: string;
  input?: any;
  output?: any;
  error?: any;
  createdAt?: any;
  updatedAt?: any;
}

interface Step {
  stepId: string;
  order: number;
  agentType: string;
  instruction: string;
  status: string;
  startedAt?: any;
  completedAt?: any;
  input?: any;
  output?: any;
  error?: { message: string; code?: string; details?: any };
  toolCalls?: ToolCall[];
  toolResults?: any[];
}

interface TimelineProps {
  steps: Step[];
}

const statusMeta: Record<string, { color: string; icon: string; label: string }> = {
  completed: { color: "#28a745", icon: "", label: "Completed" },
  succeeded: { color: "#28a745", icon: "", label: "Succeeded" },
  failed: { color: "#dc3545", icon: "", label: "Failed" },
  running: { color: "#007bff", icon: "", label: "Running" },
  queued: { color: "#ffc107", icon: "", label: "Queued" },
  pending: { color: "#adb5bd", icon: "", label: "Pending" },
  skipped: { color: "#adb5bd", icon: "", label: "Skipped" },
  paused: { color: "#6c757d", icon: "", label: "Paused" },
};

const StepTimeline: React.FC<TimelineProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return <div style={{ color: '#888', padding: 24 }}>No steps found for this run.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {steps.map((step, idx) => {
        const meta = statusMeta[step.status?.toLowerCase()] || { color: "#adb5bd", icon: "", label: step.status };
        const isFailed = step.status?.toLowerCase() === "failed";
        const isCurrent = step.status?.toLowerCase() === "running";
        return (
          <div
            key={step.stepId}
            style={{
              padding: 24,
              border: `2px solid ${meta.color}`,
              borderRadius: 12,
              background: isCurrent ? "#e3f0ff" : isFailed ? "#fff0f0" : "#f8f9fa",
              boxShadow: isCurrent ? "0 2px 12px #007bff22" : isFailed ? "0 2px 12px #dc354522" : undefined,
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>{meta.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: isFailed ? '#dc3545' : isCurrent ? '#007bff' : '#222' }}>
                    Step {step.order}: {step.agentType}
                  </h3>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 14px",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      background: meta.color,
                      color: "#fff",
                      marginLeft: 6,
                    }}
                  >
                    {meta.label}
                  </span>
                  {isCurrent && <span style={{ color: '#007bff', fontWeight: 600, marginLeft: 8 }}> CURRENT</span>}
                </div>
                <div style={{ fontSize: 14, opacity: 0.8, marginTop: 2 }}>
                  <b>Instruction:</b> {step.instruction || <em>No instruction</em>}
                </div>
              </div>
            </div>
            {step.input && (
              <div style={{ marginTop: 10, fontSize: 13 }}>
                <b>Input:</b>
                <pre style={{ background: "#f3f6fa", padding: 10, borderRadius: 6, marginTop: 4, fontSize: 13, overflowX: 'auto' }}>{JSON.stringify(step.input, null, 2)}</pre>
              </div>
            )}
            {step.output && (
              <div style={{ marginTop: 10, fontSize: 13 }}>
                <b>Output:</b>
                <pre style={{ background: "#e8f5e9", padding: 10, borderRadius: 6, marginTop: 4, fontSize: 13, overflowX: 'auto' }}>{JSON.stringify(step.output, null, 2)}</pre>
              </div>
            )}
            {/* Tool Calls/Results */}
            {(step.toolCalls && step.toolCalls.length > 0) && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Tool Calls ({step.toolCalls.length})</summary>
                <div style={{ marginTop: 8 }}>
                  {step.toolCalls.map((tool, i) => (
                    <div key={tool.toolCallId || i} style={{ marginBottom: 10, padding: 10, background: '#f4f8fb', borderRadius: 6 }}>
                      <div style={{ fontSize: 13, marginBottom: 2 }}><b>Tool:</b> {tool.toolKey || 'unknown'} <span style={{ marginLeft: 10, color: '#888' }}>Status: {tool.status}</span></div>
                      {tool.input && <div style={{ fontSize: 12 }}><b>Input:</b> <pre style={{ background: '#f3f6fa', padding: 6, borderRadius: 4 }}>{JSON.stringify(tool.input, null, 2)}</pre></div>}
                      {tool.output && <div style={{ fontSize: 12 }}><b>Output:</b> <pre style={{ background: '#e8f5e9', padding: 6, borderRadius: 4 }}>{JSON.stringify(tool.output, null, 2)}</pre></div>}
                      {tool.error && <div style={{ fontSize: 12, color: '#dc3545' }}><b>Error:</b> {typeof tool.error === 'string' ? tool.error : JSON.stringify(tool.error)}</div>}
                    </div>
                  ))}
                </div>
              </details>
            )}
            {(step.toolResults && step.toolResults.length > 0) && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Tool Results ({step.toolResults.length})</summary>
                <div style={{ marginTop: 8 }}>
                  {step.toolResults.map((result, i) => (
                    <div key={i} style={{ marginBottom: 10, padding: 10, background: '#f4f8fb', borderRadius: 6 }}>
                      <pre style={{ fontSize: 12, background: '#e8f5e9', padding: 6, borderRadius: 4 }}>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </details>
            )}
            {step.error && (
              <div style={{ marginTop: 10, fontSize: 13, color: "#dc3545", background: '#fff3f3', padding: 10, borderRadius: 6 }}>
                <b>Error:</b> {step.error.message}
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: 12, color: "#6c757d" }}>
              <span>Started: {step.startedAt ? new Date(step.startedAt.seconds * 1000).toLocaleString() : "-"}</span>
              <span style={{ marginLeft: 18 }}>Completed: {step.completedAt ? new Date(step.completedAt.seconds * 1000).toLocaleString() : "-"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepTimeline;

