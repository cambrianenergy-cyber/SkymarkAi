"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
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

interface FollowUpSequence {
  id: string;
  workspaceId: string;
  name: string;
  status: "active" | "inactive";
  channel: "dm" | "sms" | "email";
  steps: FollowUpStep[];
  createdAt: any;
  updatedAt: any;
}

export default function SequenceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sequenceId = params.sequenceId as string;

  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sequence, setSequence] = useState<FollowUpSequence | null>(null);

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
    loadSequence();
  }, [authChecked, user, router]);

  async function loadSequence() {
    if (!user) return;

    try {
      const docRef = doc(db, "followup_sequences", sequenceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Sequence not found");
        router.push("/app/followups");
        return;
      }

      const data = { id: docSnap.id, ...docSnap.data() } as FollowUpSequence;
      setSequence(data);
    } catch (error) {
      console.error("Error loading sequence:", error);
      alert("Error loading sequence: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateSequence() {
    if (!sequence || updating) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "followup_sequences", sequence.id), {
        name: sequence.name,
        status: sequence.status,
        channel: sequence.channel,
        steps: sequence.steps,
        updatedAt: serverTimestamp(),
      });

      alert("✅ Sequence updated successfully!");
    } catch (error) {
      console.error("Error updating sequence:", error);
      alert("Failed to update sequence: " + (error as any).message);
    } finally {
      setUpdating(false);
    }
  }

  function addStep() {
    if (!sequence) return;
    setSequence({
      ...sequence,
      steps: [
        ...sequence.steps,
        {
          stepIndex: sequence.steps.length,
          waitHours: 24,
          messageTemplate: "",
          goal: "nurture",
          status: "active",
        },
      ],
    });
  }

  function removeStep(index: number) {
    if (!sequence) return;
    if (sequence.steps.length === 1) {
      alert("Sequence must have at least one step");
      return;
    }
    const newSteps = sequence.steps.filter((_, i) => i !== index);
    newSteps.forEach((step, i) => {
      step.stepIndex = i;
    });
    setSequence({ ...sequence, steps: newSteps });
  }

  function updateStep(index: number, field: keyof FollowUpStep, value: any) {
    if (!sequence) return;
    const newSteps = [...sequence.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSequence({ ...sequence, steps: newSteps });
  }

  if (!authChecked || loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!sequence) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Sequence not found</h1>
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
          ← Back to Sequences
        </button>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 32 }}>
        Edit Sequence
      </h1>

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
            value={sequence.name}
            onChange={(e) => setSequence({ ...sequence, name: e.target.value })}
            required
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
              value={sequence.channel}
              onChange={(e) => setSequence({ ...sequence, channel: e.target.value as any })}
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
              value={sequence.status}
              onChange={(e) => setSequence({ ...sequence, status: e.target.value as any })}
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

        {sequence.steps.map((step, index) => (
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
              {sequence.steps.length > 1 && (
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
          onClick={handleUpdateSequence}
          disabled={updating}
          style={{
            flex: 1,
            padding: "12px 24px",
            backgroundColor: updating ? "#6c757d" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: updating ? "not-allowed" : "pointer",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {updating ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}
