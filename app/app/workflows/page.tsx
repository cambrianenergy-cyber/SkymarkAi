"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "@/lib/useAuthWorkspaceGuard";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseClient";
import InsightDropCard from "@/components/InsightDropCard";
import ConstraintAlert from "@/components/ConstraintAlert";

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
  createdAt: any;
  updatedAt: any;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard() as any;
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;
    loadWorkflows(workspaceId);
  }, [isReady, isAuthorized, workspaceId]);

  async function loadWorkflows(wsId: string) {
    setLoading(true);
    try {
      const q = query(
        collection(db, "workflows"),
        where("workspaceId", "==", wsId),
        orderBy("updatedAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Workflow[];
      setWorkflows(data);
    } catch (error) {
      console.error("Error loading workflows:", error);
      alert("Error loading workflows: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWorkflow(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !newName.trim()) return;

    try {
      await addDoc(collection(db, "workflows"), {
        workspaceId,
        name: newName.trim(),
        description: newDescription.trim(),
        status: "draft",
        steps: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNewName("");
      setNewDescription("");
      setShowCreateForm(false);
      if (workspaceId) await loadWorkflows(workspaceId);
    } catch (error) {
      console.error("Error creating workflow:", error);
      alert("Failed to create workflow: " + (error as any).message);
    }
  }

  async function handleToggleStatus(workflow: Workflow) {
    try {
      const newStatus =
        workflow.status === "active"
          ? "paused"
          : workflow.status === "paused"
          ? "active"
          : "active";

      await updateDoc(doc(db, "workflows", workflow.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      if (workspaceId) await loadWorkflows(workspaceId);
    } catch (error) {
      console.error("Error updating workflow:", error);
    }
  }

  async function handleDeleteWorkflow(workflowId: string) {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      await deleteDoc(doc(db, "workflows", workflowId));
      if (workspaceId) await loadWorkflows(workspaceId);
    } catch (error) {
      console.error("Error deleting workflow:", error);
    }
  }

  if (!isReady) {
    return <GuardLoadingScreen />;
  }

  if (!isAuthorized || !workspaceId) {
    return null;
  }

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading workflows...</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
          Workflows
        </h1>
        <p style={{ opacity: 0.75 }}>
          Create and manage automated workflows for your workspace
        </p>
      </div>

      {workspaceId && <ConstraintAlert workspaceId={workspaceId} />}
      <InsightDropCard context="workflow-builder" />

      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => router.push("/app/workflows/new")}
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
          + New Workflow
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateWorkflow}
          style={{
            marginBottom: 32,
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 8,
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Create New Workflow
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
              Workflow Name *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Weekly Social Media Campaign"
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: 4,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
              Description
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: 4,
                fontSize: 14,
                resize: "vertical",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "10px 24px",
              backgroundColor: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Create Workflow
          </button>
        </form>
      )}

      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          Your Workflows ({workflows.length})
        </h2>

        {workflows.length === 0 ? (
          <p style={{ opacity: 0.6, fontStyle: "italic" }}>
            No workflows yet. Create your first workflow to get started!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
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
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                      {workflow.name}
                    </h3>
                    {workflow.description && (
                      <p style={{ opacity: 0.75, marginBottom: 12 }}>
                        {workflow.description}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
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
                      <span style={{ fontSize: 12, opacity: 0.6 }}>
                        {workflow.steps?.length || 0} steps
                      </span>
                      <span style={{ fontSize: 12, opacity: 0.6 }}>
                        Updated: {workflow.updatedAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                    <button
                      onClick={() => router.push(`/app/workflows/${workflow.id}`)}
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
                      Open
                    </button>
                    {/* Pause/Resume Button */}
                    {workflow.status === "active" ? (
                      <button
                        onClick={async () => await handleToggleStatus(workflow)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#ffc107",
                          color: "#333",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                        title="Pause Workflow"
                      >
                        Pause
                      </button>
                    ) : workflow.status === "paused" ? (
                      <button
                        onClick={async () => await handleToggleStatus(workflow)}
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
                        title="Resume Workflow"
                      >
                        Resume
                      </button>
                    ) : null}
                    {/* Stop/Delete Button */}
                    <button
                      onClick={() => handleDeleteWorkflow(workflow.id)}
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
                      title="Stop and Delete Workflow"
                    >
                      Stop
                    </button>
                    {/* Run Button */}
                    <button
                      onClick={async () => {
                        if (workflow.status !== "active" || !workflow.steps?.length) {
                          alert("Workflow must be active and have steps to run");
                          return;
                        }
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
                            createdByUid: user?.uid || "",
                            createdByName: user?.displayName || user?.email || "Unknown",
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
                          router.push(`/app/runs/${docRef.id}`);
                        } catch (error) {
                          console.error("Error creating run:", error);
                          alert("Failed to create run: " + (error as any).message);
                        }
                      }}
                      disabled={workflow.status !== "active" || !workflow.steps?.length}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: workflow.status !== "active" || !workflow.steps?.length ? "#6c757d" : "#28a745",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: workflow.status !== "active" || !workflow.steps?.length ? "not-allowed" : "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      Run
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

