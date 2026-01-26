"use client";

import { useEffect, useState } from "react";
import { isPremiumAddonAgent, getAgentName } from "@/lib/subscriptionHelper";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

interface WorkflowStep {
  stepId: string;
  order: number;
  agentType: string;
  instruction: string;
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

export default function NewWorkflowPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "paused">("draft");
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

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

    // Read workspaceId from localStorage
    const storedWorkspaceId = localStorage.getItem("workspaceId");
    
    if (!storedWorkspaceId) {
      console.log("No workspaceId in localStorage, redirecting to login");
      router.push("/login");
      return;
    }

    setWorkspaceId(storedWorkspaceId);
    setLoading(false);
  }

  function addStep() {
    const newStep: WorkflowStep = {
      stepId: `step_${String(steps.length + 1).padStart(3, "0")}`,
      order: steps.length + 1,
      agentType: AGENT_TYPES[0],
      instruction: "",
    };
    setSteps([...steps, newStep]);
  }

  function updateStep(index: number, field: keyof WorkflowStep, value: any) {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  }

  function removeStep(index: number) {
    const updated = steps.filter((_, i) => i !== index);
    // Reorder
    updated.forEach((step, i) => {
      step.order = i + 1;
      step.stepId = `step_${String(i + 1).padStart(3, "0")}`;
    });
    setSteps(updated);
  }

  function moveStep(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === steps.length - 1) return;

    const updated = [...steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    
    // Update order
    updated.forEach((step, i) => {
      step.order = i + 1;
    });
    setSteps(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !name.trim()) {
      alert("Please provide a workflow name");
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "workflows"), {
        workspaceId,
        name: name.trim(),
        description: description.trim(),
        status,
        steps,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Workflow created successfully!");
      router.push(`/app/workflows/${docRef.id}`);
    } catch (error) {
      console.error("Error creating workflow:", error);
      alert("Failed to create workflow: " + (error as any).message);
    } finally {
      setSubmitting(false);
    }
  }

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
           Back to Workflows
        </button>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
        Create New Workflow
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Design a multi-step workflow with agent instructions
      </p>

      <form onSubmit={handleSubmit}>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekly Content Engine"
              required
              style={{ width: "100%", padding: 12, fontSize: 14, border: "1px solid #ddd", borderRadius: 4 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={3}
              style={{ width: "100%", padding: 12, fontSize: 14, border: "1px solid #ddd", borderRadius: 4 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
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
              Workflow Steps ({steps.length})
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

          {steps.length === 0 ? (
            <p style={{ opacity: 0.6, fontStyle: "italic", textAlign: "center", padding: 24 }}>
              No steps yet. Click "Add Step" to get started.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {steps.map((step, index) => (
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
                        
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, "down")}
                        disabled={index === steps.length - 1}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: index === steps.length - 1 ? "#e9ecef" : "#6c757d",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: index === steps.length - 1 ? "not-allowed" : "pointer",
                          fontSize: 12,
                        }}
                      >
                        
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
                    {isPremiumAddonAgent(step.agentType) && (
                      <div style={{
                        marginTop: 8,
                        padding: "8px 12px",
                        background: "#fff3cd",
                        color: "#856404",
                        border: "1px solid #ffeeba",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600
                      }}>
                         <b>{getAgentName(step.agentType)}</b> is a <b>premium add-on agent</b>. You must purchase this add-on or upgrade your plan to use it in workflows.
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
                      Instruction
                    </label>
                    <textarea
                      value={step.instruction}
                      onChange={(e) => updateStep(index, "instruction", e.target.value)}
                      placeholder="Detailed instruction for this agent..."
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
            type="submit"
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
            {submitting ? "Creating..." : "Create Workflow"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/app/workflows")}
            style={{
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
      </form>
    </main>
  );
}

