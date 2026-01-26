"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

interface RunStep {
  stepId: string;
  order: number;
  agentType: string;
  instruction: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: any;
  completedAt?: any;
  input?: any;
  output?: any;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

interface WorkflowRun {
  id: string;
  workspaceId: string;
  workflowId: string;
  workflowName: string;
  runType: "manual" | "scheduled" | "api" | "test";
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  createdByUid: string;
  createdByName?: string;
  inputs?: any;
  outputs?: any;
  steps: RunStep[];
  progress: {
    totalSteps: number;
    completedSteps: number;
    currentStepOrder: number;
  };
  startedAt?: any;
  completedAt?: any;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  createdAt: any;
  updatedAt: any;
}

export default function RunDetailPage() {
  const router = useRouter();
  const params = useParams();
  const runId = params.runId as string;

  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadWorkspace();
  }, [authChecked, user, router]);

  async function loadWorkspace() {
    if (!user) return;

    try {
      const memQ = query(
        collection(db, "workspace_members"),
        where("userId", "==", user.uid)
      );
      const memSnap = await getDocs(memQ);

      if (memSnap.empty) {
        alert("No workspace found. Please set up your workspace first.");
        router.push("/app");
        return;
      }

      const wsId = memSnap.docs[0].data().workspaceId;
      setWorkspaceId(wsId);
      await loadRun(wsId);
    } catch (error) {
      console.error("Error loading workspace:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRun(wsId: string) {
    try {
      const docRef = doc(db, "workflow_runs", runId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Run not found");
        router.push("/app/run");
        return;
      }

      const data = { id: docSnap.id, ...docSnap.data() } as WorkflowRun;

      if (data.workspaceId !== wsId) {
        alert("Access denied");
        router.push("/app/run");
        return;
      }

      setRun(data);

      // Set up real-time listener for run updates
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const updatedData = { id: snapshot.id, ...snapshot.data() } as WorkflowRun;
          setRun(updatedData);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error loading run:", error);
    }
  }

  async function handleUpdateStatus(newStatus: "queued" | "running" | "completed" | "failed" | "canceled") {
    if (!run) return;

    try {
      const updates: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === "running" && !run.startedAt) {
        updates.startedAt = serverTimestamp();
      } else if (["completed", "failed", "canceled"].includes(newStatus) && !run.completedAt) {
        updates.completedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "workflow_runs", run.id), updates);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status: " + (error as any).message);
    }
  }

  async function handleUpdateStepStatus(
    stepIndex: number,
    newStatus: "pending" | "running" | "completed" | "failed" | "skipped"
  ) {
    if (!run) return;

    try {
      const updatedSteps = [...run.steps];
      updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], status: newStatus };

      if (newStatus === "running" && !updatedSteps[stepIndex].startedAt) {
        updatedSteps[stepIndex].startedAt = serverTimestamp();
      } else if (["completed", "failed", "skipped"].includes(newStatus) && !updatedSteps[stepIndex].completedAt) {
        updatedSteps[stepIndex].completedAt = serverTimestamp();
      }

      // Update progress
      const completedSteps = updatedSteps.filter(s => s.status === "completed").length;
      const currentRunning = updatedSteps.find(s => s.status === "running");
      const currentStepOrder = currentRunning ? currentRunning.order : run.progress.currentStepOrder;

      await updateDoc(doc(db, "workflow_runs", run.id), {
        steps: updatedSteps,
        progress: {
          totalSteps: updatedSteps.length,
          completedSteps,
          currentStepOrder,
        },
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating step:", error);
      alert("Failed to update step: " + (error as any).message);
    }
  }

  async function handleExecuteNextStep() {
    if (!run || executing) return;

    setExecuting(true);
    try {
      const response = await fetch("/api/orchestrator/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: run.id, action: "executeNext" }),
      });

      const result = await response.json();
      if (!result.success) {
        alert("Execution error: " + result.message);
      }
    } catch (error) {
      console.error("Error executing step:", error);
      alert("Failed to execute step: " + (error as any).message);
    } finally {
      setExecuting(false);
    }
  }

  async function handleExecuteAllSteps() {
    if (!run || executing) return;

    if (!confirm("This will execute all remaining steps automatically using AI. Continue?")) {
      return;
    }

    setExecuting(true);
    try {
      const response = await fetch("/api/orchestrator/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: run.id, action: "executeAll" }),
      });

      const result = await response.json();
      if (!result.success) {
        alert("Execution error: " + result.message);
      }
    } catch (error) {
      console.error("Error executing all steps:", error);
      alert("Failed to execute all steps: " + (error as any).message);
    } finally {
      setExecuting(false);
    }
  }

  async function handleExecuteWithDependencies() {
    if (!run || executing) return;

    if (!confirm("This will execute steps in parallel where possible (respecting dependencies). Continue?")) {
      return;
    }

    setExecuting(true);
    try {
      const response = await fetch("/api/orchestrator/execute-parallel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: run.id }),
      });

      const result = await response.json();
      if (!result.success) {
        alert("Execution error: " + result.message);
      }
    } catch (error) {
      console.error("Error executing with dependencies:", error);
      alert("Failed to execute: " + (error as any).message);
    } finally {
      setExecuting(false);
    }
  }

  function getStepStatusColor(status: string) {
    switch (status) {
      case "completed":
        return { bg: "#d4edda", color: "#155724" };
      case "running":
        return { bg: "#cfe2ff", color: "#084298" };
      case "failed":
        return { bg: "#f8d7da", color: "#721c24" };
      case "skipped":
        return { bg: "#e2e3e5", color: "#383d41" };
      default:
        return { bg: "#fff3cd", color: "#856404" };
    }
  }

  if (!authChecked || loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!run) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Run not found</h1>
      </main>
    );
  }

  const progressPercent = run.progress.totalSteps > 0 
    ? Math.round((run.progress.completedSteps / run.progress.totalSteps) * 100) 
    : 0;

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push("/app/run")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ← Back to Runs
        </button>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>
          {run.workflowName}
        </h1>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 14px",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              backgroundColor:
                run.status === "completed"
                  ? "#d4edda"
                  : run.status === "running"
                  ? "#cfe2ff"
                  : run.status === "failed"
                  ? "#f8d7da"
                  : run.status === "canceled"
                  ? "#e2e3e5"
                  : "#fff3cd",
              color:
                run.status === "completed"
                  ? "#155724"
                  : run.status === "running"
                  ? "#084298"
                  : run.status === "failed"
                  ? "#721c24"
                  : run.status === "canceled"
                  ? "#383d41"
                  : "#856404",
            }}
          >
            {run.status}
          </span>
          <span
            style={{
              display: "inline-block",
              padding: "6px 14px",
              borderRadius: 4,
              fontSize: 12,
              backgroundColor: "#f8f9fa",
              color: "#495057",
            }}
          >
            {run.runType}
          </span>
          <span style={{ fontSize: 14, opacity: 0.6 }}>
            Run ID: {run.id.substring(0, 8)}...
          </span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              Progress: {run.progress.completedSteps} / {run.progress.totalSteps} steps
            </span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{progressPercent}%</span>
          </div>
          <div
            style={{
              width: "100%",
              height: 24,
              backgroundColor: "#e9ecef",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                backgroundColor:
                  run.status === "completed"
                    ? "#28a745"
                    : run.status === "failed"
                    ? "#dc3545"
                    : "#0d6efd",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        <div style={{ fontSize: 13, opacity: 0.7, display: "flex", flexDirection: "column", gap: 4 }}>
          <p>
            <strong>Created by:</strong> {run.createdByName || run.createdByUid}
          </p>
          <p>
            <strong>Created:</strong> {run.createdAt?.toDate?.()?.toLocaleString() || "N/A"}
          </p>
          {run.startedAt && (
            <p>
              <strong>Started:</strong> {run.startedAt?.toDate?.()?.toLocaleString()}
            </p>
          )}
          {run.completedAt && (
            <p>
              <strong>Completed:</strong> {run.completedAt?.toDate?.()?.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Status Controls */}
      <div style={{ marginBottom: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* Orchestrator Controls */}
        {(run.status === "queued" || run.status === "running") && (
          <>
            <button
              onClick={handleExecuteNextStep}
              disabled={executing}
              style={{
                padding: "10px 20px",
                backgroundColor: executing ? "#6c757d" : "#17a2b8",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: executing ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                opacity: executing ? 0.6 : 1,
              }}
            >
              {executing ? "⏳ Executing..." : "▶ Execute Next Step (AI)"}
            </button>
            <button
              onClick={handleExecuteAllSteps}
              disabled={executing}
              style={{
                padding: "10px 20px",
                backgroundColor: executing ? "#6c757d" : "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: executing ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                opacity: executing ? 0.6 : 1,
              }}
            >
              {executing ? "⏳ Executing..." : "⚡ Execute All (AI)"}
            </button>
            <button
              onClick={handleExecuteWithDependencies}
              disabled={executing}
              style={{
                padding: "10px 20px",
                backgroundColor: executing ? "#6c757d" : "#ffc107",
                color: "#000",
                border: "none",
                borderRadius: 4,
                cursor: executing ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                opacity: executing ? 0.6 : 1,
              }}
            >
              {executing ? "⏳ Executing..." : "🚀 Parallel Execution"}
            </button>
          </>
        )}

        {/* Manual Status Controls */}
        {run.status === "queued" && (
          <button
            onClick={() => handleUpdateStatus("running")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#0d6efd",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            ▶ Start Run (Manual)
          </button>
        )}
        {run.status === "running" && (
          <>
            <button
              onClick={() => handleUpdateStatus("completed")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ✓ Mark Complete (Manual)
            </button>
            <button
              onClick={() => handleUpdateStatus("failed")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ✕ Mark Failed
            </button>
            <button
              onClick={() => handleUpdateStatus("canceled")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Error Display */}
      {run.error && (
        <div
          style={{
            padding: 16,
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#721c24", marginBottom: 8 }}>
            Error
          </h3>
          <p style={{ fontSize: 14, color: "#721c24", marginBottom: 4 }}>
            <strong>Message:</strong> {run.error.message}
          </p>
          {run.error.code && (
            <p style={{ fontSize: 14, color: "#721c24" }}>
              <strong>Code:</strong> {run.error.code}
            </p>
          )}
        </div>
      )}

      {/* Steps */}
      <div style={{ padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          Workflow Steps
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {run.steps.map((step, index) => {
            const statusColors = getStepStatusColor(step.status);
            const isActive = run.progress.currentStepOrder === step.order;

            return (
              <div
                key={step.stepId}
                style={{
                  padding: 20,
                  border: isActive ? "2px solid #0d6efd" : "1px solid #ddd",
                  borderRadius: 8,
                  backgroundColor: isActive ? "#f0f8ff" : "#f8f9fa",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                        Step {step.order}: {step.agentType}
                      </h3>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          backgroundColor: statusColors.bg,
                          color: statusColors.color,
                        }}
                      >
                        {step.status}
                      </span>
                      {isActive && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#0d6efd" }}>
                          ● CURRENT
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 8, whiteSpace: "pre-wrap" }}>
                      {step.instruction}
                    </p>
                    {step.startedAt && (
                      <p style={{ fontSize: 12, opacity: 0.6 }}>
                        Started: {step.startedAt?.toDate?.()?.toLocaleString()}
                      </p>
                    )}
                    {step.completedAt && (
                      <p style={{ fontSize: 12, opacity: 0.6 }}>
                        Completed: {step.completedAt?.toDate?.()?.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {run.status === "running" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {step.status === "pending" && (
                        <button
                          onClick={() => handleUpdateStepStatus(index, "running")}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#0d6efd",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Start
                        </button>
                      )}
                      {step.status === "running" && (
                        <>
                          <button
                            onClick={() => handleUpdateStepStatus(index, "completed")}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#28a745",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleUpdateStepStatus(index, "failed")}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#dc3545",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            Fail
                          </button>
                          <button
                            onClick={() => handleUpdateStepStatus(index, "skipped")}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#6c757d",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            Skip
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {step.output && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      backgroundColor: "#fff",
                      border: "1px solid #dee2e6",
                      borderRadius: 4,
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>Output:</strong>
                    <pre style={{ fontSize: 12, marginTop: 8, whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  </div>
                )}

                {step.error && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      backgroundColor: "#f8d7da",
                      border: "1px solid #f5c6cb",
                      borderRadius: 4,
                    }}
                  >
                    <strong style={{ fontSize: 13, color: "#721c24" }}>Error:</strong>
                    <p style={{ fontSize: 12, marginTop: 4, color: "#721c24" }}>
                      {step.error.message}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
