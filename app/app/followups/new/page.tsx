"use client";

import { useEffect, useState } from "react";
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

interface FollowUpStep {
  stepIndex: number;
  waitHours: number;
  messageTemplate: string;
  goal: "nurture" | "book_call" | "close";
  status: "active" | "inactive";
}

export default function NewSequencePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"dm" | "sms" | "email">("dm");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [steps, setSteps] = useState<FollowUpStep[]>([
    {
      stepIndex: 0,
      waitHours: 0,
      messageTemplate: "",
      goal: "nurture",
      status: "active",
    },
  ]);

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
    } catch (error) {
      console.error("Error loading workspace:", error);
    }
  }

  function addStep() {
    setSteps([
      ...steps,
      {
        stepIndex: steps.length,
        waitHours: 24,
        messageTemplate: "",
        goal: "nurture",
        status: "active",
      },
    ]);
  }

  function removeStep(index: number) {
    if (steps.length === 1) {
      alert("Sequence must have at least one step");
      return;
    }
    const newSteps = steps.filter((_, i) => i !== index);
    // Re-index
    newSteps.forEach((step, i) => {
      step.stepIndex = i;
    });
    setSteps(newSteps);
  }

  function updateStep(index: number, field: keyof FollowUpStep, value: any) {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || submitting) return;

    if (!name) {
      alert("Please enter a sequence name");
      return;
    }

    if (steps.some((s) => !s.messageTemplate)) {
      alert("All steps must have a message template");
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "followup_sequences"), {
        workspaceId,
        name,
        status,
        channel,
        steps,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert(" Sequence created successfully!");
      router.push(`/app/followups/${docRef.id}`);
    } catch (error) {
      console.error("Error creating sequence:", error);
      alert("Failed to create sequence: " + (error as any).message);
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push("/app/followups")}
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
           Back to Sequences
        </button>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
        Create Follow-up Sequence
      </h1>
      <p style={{ opacity: 0.75, marginBottom: 32 }}>
        Set up automated follow-up messages for your leads
      </p>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Sequence Details
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Sequence Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., New Lead 7-Day"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 4,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                Channel *
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: 14,
                }}
              >
                <option value="dm">DM (Instagram/Facebook)</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: 14,
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              Follow-up Steps
            </h2>
            <button
              type="button"
              onClick={addStep}
              style={{
                padding: "8px 16px",
                backgroundColor: "#0070f3",
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

          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                padding: 20,
                backgroundColor: "#f8f9fa",
                borderRadius: 6,
                marginBottom: 16,
                border: "1px solid #ddd",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                  Step {index + 1}
                </h3>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "#dc3545",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Wait Hours *
                  </label>
                  <input
                    type="number"
                    value={step.waitHours}
                    onChange={(e) => updateStep(index, "waitHours", parseInt(e.target.value))}
                    required
                    min="0"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      fontSize: 14,
                    }}
                  />
                  <p style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                    {index === 0 ? "Hours from sequence start" : "Hours after previous step"}
                  </p>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Goal *
                  </label>
                  <select
                    value={step.goal}
                    onChange={(e) => updateStep(index, "goal", e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      fontSize: 14,
                    }}
                  >
                    <option value="nurture">Nurture</option>
                    <option value="book_call">Book Call</option>
                    <option value="close">Close</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Status *
                  </label>
                  <select
                    value={step.status}
                    onChange={(e) => updateStep(index, "status", e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      fontSize: 14,
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  Message Template *
                </label>
                <textarea
                  value={step.messageTemplate}
                  onChange={(e) => updateStep(index, "messageTemplate", e.target.value)}
                  required
                  placeholder="Write your follow-up message here..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => router.push("/app/followups")}
            style={{
              flex: 1,
              padding: "12px 24px",
              backgroundColor: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 1,
              padding: "12px 24px",
              backgroundColor: submitting ? "#6c757d" : "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {submitting ? "Creating..." : "Create Sequence"}
          </button>
        </div>
      </form>
    </main>
  );
}

