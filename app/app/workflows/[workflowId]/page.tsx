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
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

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
  steps: WorkflowStep[];
  createdAt: any;
  updatedAt: any;
}

interface WorkflowRun {
  id: string;
  workspaceId: string;
  workflowId: string;
  workflowName: string;
  runType: string;
  status: string;
  progress: {
    totalSteps: number;
    completedSteps: number;
    currentStepOrder: number;
  };
  createdAt: any;
}

const AGENT_TYPES = [
  "Campaign_Director",
  "Trend_Hunter",
  "Competitor_Watchdog",
  "Copywriter",
  "Content_Creator",
  "Hashtag_SEO",
  "Brand_Voice_Guardian",
  "Scheduling_Master",
  "Engagement_Analyst",
];

export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.workflowId as string;

  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleCron, setScheduleCron] = useState("0 9 * * *");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "active" | "paused">("draft");
  const [editSteps, setEditSteps] = useState<WorkflowStep[]>([]);

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
      await loadWorkflow(wsId);
    } catch (error) {
      console.error("Error loading workspace:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkflow(wsId: string) {
    try {
      const docRef = doc(db, "workflows", workflowId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Workflow not found");
        router.push("/app/workflows");
        return;
      }

      const data = { id: docSnap.id, ...docSnap.data() } as Workflow;

      if (data.workspaceId !== wsId) {
        alert("Access denied");
        router.push("/app/workflows");
        return;
      }

      setWorkflow(data);
      setEditName(data.name);
      setEditDescription(data.description || "");
      setEditStatus(data.status);
      setEditSteps(data.steps || []);
      await loadRecentRuns(wsId, workflowId);
    } catch (error) {
      console.error("Error loading workflow:", error);
    }
  }

  async function loadRecentRuns(wsId: string, wfId: string) {
    try {
      const q = query(
        collection(db, "workflow_runs"),
        where("workspaceId", "==", wsId),
        where("workflowId", "==", wfId),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as WorkflowRun[];
      setRecentRuns(data);
    } catch (error) {
      console.error("Error loading recent runs:", error);
    }
  }

  function addStep() {
    const newStep: WorkflowStep = {
      stepId: `step_${String(editSteps.length + 1).padStart(3, "0")}`,
      order: editSteps.length + 1,
      agentType: AGENT_TYPES[0],
      instruction: "",
    };
    setEditSteps([...editSteps, newStep]);
  }

  function updateStep(index: number, field: keyof WorkflowStep, value: any) {
    const updated = [...editSteps];
    updated[index] = { ...updated[index], [field]: value };
    setEditSteps(updated);
  }

  function removeStep(index: number) {
    const updated = editSteps.filter((_, i) => i !== index);
    updated.forEach((step, i) => {
      step.order = i + 1;
      step.stepId = `step_${String(i + 1).padStart(3, "0")}`;
    });
    setEditSteps(updated);
  }

  function moveStep(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === editSteps.length - 1) return;

    const updated = [...editSteps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    
    updated.forEach((step, i) => {
      step.order = i + 1;
    });
    setEditSteps(updated);
  }

  async function handleSave() {
    if (!workflow || !editName.trim()) {
      alert("Workflow name is required");
      return;
    }

    setSubmitting(true);
    try {
      await updateDoc(doc(db, "workflows", workflow.id), {
        name: editName.trim(),
        description: editDescription.trim(),
        status: editStatus,
        steps: editSteps,
        updatedAt: serverTimestamp(),
      });

      await loadWorkflow(workspaceId);
      setIsEditing(false);
      alert("Workflow updated successfully!");
    } catch (error) {
      console.error("Error updating workflow:", error);
      alert("Failed to update workflow: " + (error as any).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancelEdit() {
    if (!workflow) return;
    setEditName(workflow.name);
    setEditDescription(workflow.description || "");
    setEditStatus(workflow.status);
    setEditSteps(workflow.steps || []);
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!workflow) return;
    if (!confirm(`Are you sure you want to delete "${workflow.name}"? This cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, "workflows", workflow.id));
      alert("Workflow deleted successfully");
      router.push("/app/workflows");
    } catch (error) {
      console.error("Error deleting workflow:", error);
      alert("Failed to delete workflow: " + (error as any).message);
    }
  }

  async function handleRunWorkflow() {
    if (!workflow || !workspaceId) return;

    try {
      const runSteps = workflow.steps.map((step) => ({
        stepId: step.stepId,
        order: step.order,
        agentType: step.agentType,
        instruction: step.instruction,
        status: "pending" as const,
      }));

      const docRef = await addDoc(collection(db, "workflow_runs"), {
        workspaceId,
        workflowId: workflow.id,
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

      // Navigate to run detail page first
      router.push(`/app/runs/${docRef.id}`);

      // Start automatic execution via server API
      setTimeout(async () => {
        try {
          await fetch("/api/orchestrator/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runId: docRef.id, action: "executeAll" }),
          });
        } catch (error) {
          console.error("Auto-execution error:", error);
        }
      }, 500);
    } catch (error) {
      console.error("Error creating run:", error);
      alert("Failed to create run: " + (error as any).message);
    }
  }

  async function handleSaveSchedule() {
    if (!workflow) return;

    try {
      const response = await fetch("/api/orchestrator/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: workflow.id,
          schedule: scheduleCron,
          enabled: scheduleEnabled,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Schedule saved successfully!");
        setShowSchedule(false);
      } else {
        alert("Failed to save schedule: " + result.message);
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("Failed to save schedule: " + (error as any).message);
    }
  }

  async function loadSchedule() {
    if (!workflow) return;

    try {
      const response = await fetch(`/api/orchestrator/schedule?workflowId=${workflow.id}`);
      const result = await response.json();

      if (result.success && result.schedules.length > 0) {
        const schedule = result.schedules[0];
        setScheduleCron(schedule.schedule);
        setScheduleEnabled(schedule.enabled);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    }
  }

  useEffect(() => {
    if (workflow) {
      loadSchedule();
    }
  }, [workflow]);

  if (!authChecked || loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!workflow) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Workflow not found</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push("/app/workflows")}
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
          ← Back to Workflows
        </button>
      </div>

      {!isEditing ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
                {workflow.name}
              </h1>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    backgroundColor:
                      workflow.status === "active"
                        ? "#d4edda"
                        : workflow.status === "paused"
                        ? "#fff3cd"
                        : "#e2e3e5",
                    color:
                      workflow.status === "active"
                        ? "#155724"
                        : workflow.status === "paused"
                        ? "#856404"
                        : "#383d41",
                  }}
                >
                  {workflow.status}
                </span>
                <span style={{ fontSize: 14, opacity: 0.6 }}>
                  {workflow.steps?.length || 0} steps
                </span>
              </div>
              {workflow.description && (
                <p style={{ opacity: 0.7, marginBottom: 16 }}>{workflow.description}</p>
              )}
              <p style={{ fontSize: 12, opacity: 0.5 }}>
                Created: {workflow.createdAt?.toDate?.()?.toLocaleString() || "N/A"}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleRunWorkflow}
                disabled={workflow.status !== "active" || !workflow.steps?.length}
                style={{
                  padding: "12px 24px",
                  backgroundColor: workflow.status !== "active" || !workflow.steps?.length ? "#6c757d" : "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: workflow.status !== "active" || !workflow.steps?.length ? "not-allowed" : "pointer",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                ▶ Run Workflow
              </button>
              <button
                onClick={() => setShowSchedule(true)}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#ffc107",
                  color: "#000",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                ⏰ Schedule
              </button>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#0d6efd",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                Delete
              </button>
            </div>
          </div>

          <div style={{ padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              Workflow Steps
            </h2>

            {!workflow.steps || workflow.steps.length === 0 ? (
              <p style={{ opacity: 0.6, fontStyle: "italic", textAlign: "center", padding: 24 }}>
                No steps defined yet
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {workflow.steps.map((step, index) => (
                  <div
                    key={step.stepId}
                    style={{
                      padding: 16,
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                      Step {step.order}: {step.agentType}
                    </h3>
                    <p style={{ fontSize: 14, opacity: 0.8, whiteSpace: "pre-wrap" }}>
                      {step.instruction || <em style={{ opacity: 0.5 }}>No instruction provided</em>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Runs Section */}
          <div style={{ marginTop: 32, padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              Recent Runs ({recentRuns.length})
            </h2>

            {recentRuns.length === 0 ? (
              <p style={{ opacity: 0.6, fontStyle: "italic", textAlign: "center", padding: 24 }}>
                No runs yet. Click "Run Workflow" to start your first run!
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recentRuns.map((run) => (
                  <div
                    key={run.id}
                    style={{
                      padding: 16,
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      backgroundColor: "#f8f9fa",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: 4,
                            fontSize: 11,
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
                        <span style={{ fontSize: 13, opacity: 0.7 }}>
                          Progress: {run.progress.completedSteps}/{run.progress.totalSteps}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, opacity: 0.6 }}>
                        Created: {run.createdAt?.toDate?.()?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/app/runs/${run.id}`)}
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
                      Open Run
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>
            Edit Workflow
          </h1>

          <div style={{ marginBottom: 24, padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              Basic Information
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                Workflow Name *
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ width: "100%", padding: 12, fontSize: 14, border: "1px solid #ddd", borderRadius: 4 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                style={{ width: "100%", padding: 12, fontSize: 14, border: "1px solid #ddd", borderRadius: 4 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                style={{ padding: 12, fontSize: 14, border: "1px solid #ddd", borderRadius: 4 }}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 24, padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                Workflow Steps ({editSteps.length})
              </h2>
              <button
                type="button"
                onClick={addStep}
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
                + Add Step
              </button>
            </div>

            {editSteps.length === 0 ? (
              <p style={{ opacity: 0.6, fontStyle: "italic", textAlign: "center", padding: 24 }}>
                No steps yet. Click "Add Step" to get started.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {editSteps.map((step, index) => (
                  <div
                    key={step.stepId}
                    style={{
                      padding: 16,
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                        Step {step.order}: {step.stepId}
                      </h3>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => moveStep(index, "up")}
                          disabled={index === 0}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: index === 0 ? "#e9ecef" : "#6c757d",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: index === 0 ? "not-allowed" : "pointer",
                            fontSize: 12,
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(index, "down")}
                          disabled={index === editSteps.length - 1}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: index === editSteps.length - 1 ? "#e9ecef" : "#6c757d",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: index === editSteps.length - 1 ? "not-allowed" : "pointer",
                            fontSize: 12,
                          }}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#dc3545",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                        Agent Type
                      </label>
                      <select
                        value={step.agentType}
                        onChange={(e) => updateStep(index, "agentType", e.target.value)}
                        style={{ width: "100%", padding: 10, fontSize: 14, border: "1px solid #ddd", borderRadius: 4 }}
                      >
                        {AGENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                        Instruction
                      </label>
                      <textarea
                        value={step.instruction}
                        onChange={(e) => updateStep(index, "instruction", e.target.value)}
                        rows={3}
                        style={{ width: "100%", padding: 10, fontSize: 14, border: "1px solid #ddd", borderRadius: 4 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={submitting}
              style={{
                padding: "12px 24px",
                backgroundColor: submitting ? "#6c757d" : "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={submitting}
              style={{
                padding: "12px 24px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: 16,
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* Schedule Modal */}
      {showSchedule && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowSchedule(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: 32,
              borderRadius: 8,
              maxWidth: 500,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
              Schedule Workflow
            </h2>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 16, fontWeight: 600 }}>Enable Scheduled Execution</span>
              </label>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                Cron Schedule:
              </label>
              <input
                type="text"
                value={scheduleCron}
                onChange={(e) => setScheduleCron(e.target.value)}
                placeholder="0 9 * * *"
                disabled={!scheduleEnabled}
                style={{
                  width: "100%",
                  padding: 10,
                  fontSize: 14,
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  opacity: scheduleEnabled ? 1 : 0.5,
                }}
              />
              <p style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
                Format: minute hour day month dayOfWeek
                <br />
                Example: "0 9 * * *" = Every day at 9:00 AM
              </p>
            </div>

            <div style={{ marginBottom: 20, padding: 16, backgroundColor: "#f8f9fa", borderRadius: 4 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Common Schedules:</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => setScheduleCron("0 9 * * *")}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#e9ecef",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  Daily at 9:00 AM - <code>0 9 * * *</code>
                </button>
                <button
                  onClick={() => setScheduleCron("0 */6 * * *")}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#e9ecef",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  Every 6 hours - <code>0 */6 * * *</code>
                </button>
                <button
                  onClick={() => setScheduleCron("0 0 * * 1")}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#e9ecef",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                  }}
                >
                  Weekly on Monday - <code>0 0 * * 1</code>
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleSaveSchedule}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  backgroundColor: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Save Schedule
              </button>
              <button
                onClick={() => setShowSchedule(false)}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
