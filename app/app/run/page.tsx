"use client";

import { useEffect, useState } from "react";
import { useRunStartedNotification } from "./useRunStartedNotification";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

interface WorkflowStep {
  stepId: string;
  order: number;
  agentType: string;
  instruction: string;
}

interface Workflow {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: "active" | "paused" | "draft";
  steps?: WorkflowStep[];
}

interface Agent {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  duty: string;
  status: "active" | "inactive";
}

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

export default function RunPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [showRunForm, setShowRunForm] = useState(false);

  // Form state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

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
      await Promise.all([
        loadWorkflows(wsId),
        loadAgents(wsId),
        loadRuns(wsId),
      ]);
    } catch (error) {
      console.error("Error loading workspace:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkflows(wsId: string) {
    try {
      const q = query(
        collection(db, "workflows"),
        where("workspaceId", "==", wsId),
        where("status", "==", "active")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Workflow[];
      setWorkflows(data);
    } catch (error) {
      console.error("Error loading workflows:", error);
    }
  }

  async function loadAgents(wsId: string) {
    try {
      const q = query(
        collection(db, "agents"),
        where("workspaceId", "==", wsId),
        where("status", "==", "active")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Agent[];
      setAgents(data);
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  }

  async function loadRuns(wsId: string) {
    try {
      const q = query(
        collection(db, "workflow_runs"),
        where("workspaceId", "==", wsId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as WorkflowRun[];
      // Sort by createdAt descending
      data.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      });
      setRuns(data);
    } catch (error) {
      console.error("Error loading runs:", error);
    }
  }

  async function handleCreateRun(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !selectedWorkflowId) {
      alert("Please select a workflow");
      return;
    }

    try {
      const workflow = workflows.find((w) => w.id === selectedWorkflowId);
      if (!workflow) {
        alert("Workflow not found");
        return;
      }

      // Convert workflow steps to run steps
      const runSteps: RunStep[] = (workflow.steps || []).map((step) => ({
        stepId: step.stepId,
        order: step.order,
        agentType: step.agentType,
        instruction: step.instruction,
        status: "pending" as const,
      }));

      const docRef = await addDoc(collection(db, "workflow_runs"), {
        workspaceId,
        workflowId: selectedWorkflowId,
        workflowName: workflow.name,
        runType: "manual",
        status: "queued",
        createdByUid: user.uid,
        createdByName: user.displayName || user.email,
        inputs: {},
        outputs: {},
        steps: runSteps,
        progress: {
          totalSteps: runSteps.length,
          completedSteps: 0,
          currentStepOrder: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Run created successfully with ID:", docRef.id);

      setSelectedWorkflowId("");
      setSelectedAgentIds([]);
      setShowRunForm(false);
      await loadRuns(workspaceId);
      alert("Run created successfully!");
    } catch (error) {
      console.error("Error creating run:", error);
      alert("Failed to create run: " + (error as any).message);
    }
  }

  function handleToggleAgent(agentId: string) {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  }

  async function handleUpdateRunStatus(runId: string, newStatus: "queued" | "running" | "completed" | "failed" | "canceled") {
    try {
      const updates: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === "running") {
        updates.startedAt = serverTimestamp();
      } else if (newStatus === "completed" || newStatus === "failed" || newStatus === "canceled") {
        updates.completedAt = serverTimestamp();
      }

      await updateDoc(doc(db, "workflow_runs", runId), updates);
      await loadRuns(workspaceId);
    } catch (error) {
      console.error("Error updating run status:", error);
    }
  }

  useRunStartedNotification(runs);

  if (!authChecked || loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
          Run Workflows
        </h1>
        <p style={{ opacity: 0.75 }}>
          Execute workflows with your active agents
        </p>
      </div>

      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => setShowRunForm(!showRunForm)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {showRunForm ? "Cancel" : "+ New Run"}
        </button>
      </div>

      {showRunForm && (
        <form
          onSubmit={handleCreateRun}
          style={{
            marginBottom: 32,
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 8,
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Create New Run
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
              Select Workflow *
            </label>
            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: 4,
                fontSize: 14,
              }}
            >
              <option value="">-- Choose a workflow --</option>
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
            {workflows.length === 0 && (
              <p style={{ fontSize: 12, color: "#dc3545", marginTop: 4 }}>
                No active workflows found. Please activate a workflow first.
              </p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
              Select Agents * (at least 1)
            </label>
            {agents.length === 0 ? (
              <p style={{ fontSize: 12, color: "#dc3545" }}>
                No active agents found. Please add and activate agents first.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {agents.map((agent) => (
                  <label
                    key={agent.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAgentIds.includes(agent.id)}
                      onChange={() => handleToggleAgent(agent.id)}
                    />
                    <span>
                      <strong>{agent.name}</strong> - {agent.type}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!selectedWorkflowId || selectedAgentIds.length === 0}
            style={{
              padding: "10px 24px",
              backgroundColor:
                !selectedWorkflowId || selectedAgentIds.length === 0
                  ? "#ccc"
                  : "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor:
                !selectedWorkflowId || selectedAgentIds.length === 0
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 600,
            }}
          >
            Create Run
          </button>
        </form>
      )}

      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          Run History ({runs.length})
        </h2>

        {runs.length === 0 ? (
          <p style={{ opacity: 0.6, fontStyle: "italic" }}>
            No runs yet. Create your first run to get started!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {runs.map((run) => {
              return (
                <div
                  key={run.id}
                  style={{
                    padding: 20,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    backgroundColor: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}
                      >
                        {run.workflowName}
                      </h3>
                      <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
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
                        <span style={{ fontSize: 12, opacity: 0.6, padding: "4px 8px" }}>
                          {run.runType}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, opacity: 0.75, marginBottom: 8 }}>
                        <strong>Progress:</strong> {run.progress.completedSteps}/{run.progress.totalSteps} steps
                      </p>
                      <p style={{ fontSize: 12, opacity: 0.6 }}>
                        Started: {run.startedAt?.toDate?.()?.toLocaleString() || "N/A"}
                      </p>
                      {run.completedAt && (
                        <p style={{ fontSize: 12, opacity: 0.6 }}>
                          Completed: {run.completedAt?.toDate?.()?.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                      {run.status === "queued" && (
                        <button
                          onClick={() => handleUpdateRunStatus(run.id, "running")}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#0d6efd",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          Start
                        </button>
                      )}
                      {run.status === "running" && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateRunStatus(run.id, "completed")
                            }
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#28a745",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleUpdateRunStatus(run.id, "failed")}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#dc3545",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            Fail
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <a
          href="/app"
          style={{
            color: "#0070f3",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
           Back to Dashboard
        </a>
      </div>
    </main>
  );
}

