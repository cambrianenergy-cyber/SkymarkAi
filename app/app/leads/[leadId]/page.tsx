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
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

interface Lead {
  id: string;
  workspaceId: string;
  threadId: string;
  fullName: string;
  handle: string;
  channel: string;
  status: "open" | "qualified" | "unqualified" | "won" | "lost";
  stage: "new" | "contacted" | "booked" | "closed";
  score: number;
  scoreLabel: "cold" | "warm" | "hot";
  sequenceId?: string;
  assignedToUid?: string;
  notes?: string;
  lastContactAt?: any;
  nextFollowUpAt?: any;
  disposition?: "sold" | "not_sold" | "credit_decline" | "follow_up" | "sold_financed";
  salePrice?: number;
  profitMargin?: number;
  createdAt: any;
  updatedAt: any;
}

interface FollowUpSequence {
  id: string;
  name: string;
  channel: string;
  status: string;
  steps: any[];
}

interface InboxMessage {
  id: string;
  text: string;
  direction: "inbound" | "outbound";
  createdAt: any;
}

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params?.leadId as string;

  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [lead, setLead] = useState<Lead | null>(null);
  const [sequences, setSequences] = useState<FollowUpSequence[]>([]);
  const [selectedSequenceId, setSelectedSequenceId] = useState("");
  const [showStartSequence, setShowStartSequence] = useState(false);

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
        setLoading(false);
        router.push("/app");
        return;
      }

      const wsId = memSnap.docs[0].data().workspaceId;
      setWorkspaceId(wsId);
      await Promise.all([loadLead(wsId), loadSequences(wsId)]);
    } catch (error) {
      console.error("Error loading workspace:", error);
      alert("Error loading lead: " + (error as any).message);
      setLoading(false);
    }
  }

  async function loadLead(wsId: string) {
    try {
      const docRef = doc(db, "leads", leadId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Lead not found");
        router.push("/app/leads");
        return;
      }

      const data = { id: docSnap.id, ...docSnap.data() } as Lead;

      if (data.workspaceId !== wsId) {
        alert("Access denied");
        router.push("/app/leads");
        return;
      }

      setLead(data);
    } catch (error) {
      console.error("Error loading lead:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSequences(wsId: string) {
    try {
      const q = query(
        collection(db, "followup_sequences"),
        where("workspaceId", "==", wsId),
        where("status", "==", "active")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FollowUpSequence[];
      setSequences(data);
    } catch (error) {
      console.error("Error loading sequences:", error);
    }
  }

  async function handleUpdateField(field: keyof Lead, value: any) {
    if (!lead || updating) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "leads", lead.id), {
        [field]: value,
        updatedAt: serverTimestamp(),
      });

      setLead({ ...lead, [field]: value });
      alert("✅ Updated successfully!");
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Failed to update: " + (error as any).message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleRecalculateScore() {
    if (!lead || updating) return;

    setUpdating(true);
    try {
      // Load messages from the thread
      if (!lead.threadId) {
        alert("No thread linked to this lead");
        setUpdating(false);
        return;
      }

      const messagesQ = query(
        collection(db, "inbox_messages"),
        where("threadId", "==", lead.threadId)
      );
      const messagesSnap = await getDocs(messagesQ);
      const messages = messagesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as InboxMessage[];

      // Apply scoring rubric
      let score = 0;

      messages.forEach((msg) => {
        const text = msg.text.toLowerCase();
        const wordCount = text.split(/\s+/).length;

        // Intent keywords
        if (/price|quote|how much|available|book|schedule/.test(text)) {
          score += 20;
        }

        // Message length
        if (wordCount > 20) {
          score += 10;
        }

        // Call/appointment request
        if (/call|appointment|meet|zoom|phone/.test(text)) {
          score += 25;
        }

        // Negative signals
        if (/just looking|maybe later|not now/.test(text)) {
          score -= 10;
        }

        // Spam detection
        if (/http|www\.|\.com|click here/i.test(text)) {
          score -= 50;
        }
      });

      // Check response time (simplified)
      const inboundMessages = messages.filter((m) => m.direction === "inbound");
      if (inboundMessages.length > 1) {
        const lastTwo = inboundMessages.slice(-2);
        if (lastTwo.length === 2) {
          const timeDiff = lastTwo[1].createdAt.toDate().getTime() - lastTwo[0].createdAt.toDate().getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          if (hoursDiff < 24) {
            score += 15;
          }
        }
      }

      // Ensure score is not negative
      score = Math.max(0, score);

      // Determine scoreLabel
      let scoreLabel: "cold" | "warm" | "hot";
      if (score >= 60) {
        scoreLabel = "hot";
      } else if (score >= 25) {
        scoreLabel = "warm";
      } else {
        scoreLabel = "cold";
      }

      // Update lead
      await updateDoc(doc(db, "leads", lead.id), {
        score,
        scoreLabel,
        updatedAt: serverTimestamp(),
      });

      setLead({ ...lead, score, scoreLabel });
      alert(`✅ Score recalculated: ${score} (${scoreLabel})`);
    } catch (error) {
      console.error("Error recalculating score:", error);
      alert("Failed to recalculate score: " + (error as any).message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleStartSequence() {
    if (!lead || !selectedSequenceId || updating) return;

    setUpdating(true);
    try {
      const sequence = sequences.find((s) => s.id === selectedSequenceId);
      if (!sequence || !sequence.steps || sequence.steps.length === 0) {
        alert("Invalid sequence selected");
        setUpdating(false);
        return;
      }

      const firstStep = sequence.steps[0];

      // Calculate scheduledFor time
      const now = new Date();
      const scheduledFor = new Date(now.getTime() + firstStep.waitHours * 60 * 60 * 1000);

      // Create first job
      await addDoc(collection(db, "followup_jobs"), {
        workspaceId: lead.workspaceId,
        leadId: lead.id,
        threadId: lead.threadId,
        sequenceId: selectedSequenceId,
        stepIndex: 0,
        scheduledFor: Timestamp.fromDate(scheduledFor),
        status: "queued",
        messageDraft: firstStep.messageTemplate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update lead
      await updateDoc(doc(db, "leads", lead.id), {
        sequenceId: selectedSequenceId,
        stage: "contacted",
        nextFollowUpAt: Timestamp.fromDate(scheduledFor),
        updatedAt: serverTimestamp(),
      });

      setLead({
        ...lead,
        sequenceId: selectedSequenceId,
        stage: "contacted",
        nextFollowUpAt: Timestamp.fromDate(scheduledFor),
      });

      alert("✅ Sequence started! First message queued.");
      setShowStartSequence(false);
      setSelectedSequenceId("");
    } catch (error) {
      console.error("Error starting sequence:", error);
      alert("Failed to start sequence: " + (error as any).message);
    } finally {
      setUpdating(false);
    }
  }

  function getScoreColor(scoreLabel: string) {
    switch (scoreLabel) {
      case "hot":
        return { bg: "#ff4444", color: "#fff" };
      case "warm":
        return { bg: "#ffa500", color: "#fff" };
      case "cold":
        return { bg: "#6c757d", color: "#fff" };
      default:
        return { bg: "#e2e3e5", color: "#000" };
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "won":
        return { bg: "#28a745", color: "#fff" };
      case "qualified":
        return { bg: "#17a2b8", color: "#fff" };
      case "open":
        return { bg: "#ffc107", color: "#000" };
      case "unqualified":
        return { bg: "#6c757d", color: "#fff" };
      case "lost":
        return { bg: "#dc3545", color: "#fff" };
      default:
        return { bg: "#e2e3e5", color: "#000" };
    }
  }

  if (!authChecked || loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!lead) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Lead not found</h1>
      </main>
    );
  }

  const scoreColors = getScoreColor(lead.scoreLabel);
  const statusColors = getStatusColor(lead.status);

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push("/app/leads")}
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
          ← Back to Leads
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
          {lead.fullName}
        </h1>
        <p style={{ fontSize: 16, opacity: 0.75 }}>
          @{lead.handle} • {lead.channel}
        </p>
      </div>

      {/* Stage & Status */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 8,
          border: "1px solid #ddd",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Lead Status
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              Stage
            </label>
            <select
              value={lead.stage}
              onChange={(e) => handleUpdateField("stage", e.target.value)}
              disabled={updating}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 4,
                fontSize: 14,
                textTransform: "capitalize",
              }}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="booked">Booked</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              Status
            </label>
            <select
              value={lead.status}
              onChange={(e) => handleUpdateField("status", e.target.value)}
              disabled={updating}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 4,
                fontSize: 14,
                textTransform: "capitalize",
              }}
            >
              <option value="open">Open</option>
              <option value="qualified">Qualified</option>
              <option value="unqualified">Unqualified</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Information */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 8,
          border: "1px solid #ddd",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Sales Information
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          {/* Disposition */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              Disposition
            </label>
            <select
              value={lead.disposition || ""}
              onChange={(e) => handleUpdateField("disposition", e.target.value)}
              disabled={updating}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 4,
                fontSize: 14,
              }}
            >
              <option value="">Select disposition...</option>
              <option value="sold">💰 Sold</option>
              <option value="sold_financed">🏦 Sold (Financed)</option>
              <option value="not_sold">❌ Not Sold</option>
              <option value="credit_decline">🚫 Credit Decline</option>
              <option value="follow_up">📞 Follow-up Required</option>
            </select>
          </div>

          {/* Show price & margin if sold */}
          {(lead.disposition === "sold" || lead.disposition === "sold_financed") && (
            <>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                  Sale Price ($)
                </label>
                <input
                  type="number"
                  value={lead.salePrice || ""}
                  onChange={(e) => setLead({ ...lead, salePrice: parseFloat(e.target.value) || 0 })}
                  onBlur={(e) => handleUpdateField("salePrice", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                  Profit Margin (%)
                </label>
                <input
                  type="number"
                  value={lead.profitMargin || ""}
                  onChange={(e) => setLead({ ...lead, profitMargin: parseFloat(e.target.value) || 0 })}
                  onBlur={(e) => handleUpdateField("profitMargin", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max="100"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    fontSize: 14,
                  }}
                />
              </div>

              {lead.salePrice && lead.profitMargin && (
                <div
                  style={{
                    padding: 16,
                    backgroundColor: "#d4edda",
                    border: "1px solid #c3e6cb",
                    borderRadius: 4,
                    marginTop: 8,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>💰 Profit Calculation</div>
                  <div style={{ fontSize: 14 }}>Profit Amount: ${((lead.salePrice * lead.profitMargin) / 100).toFixed(2)}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Score Card */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 8,
          border: "1px solid #ddd",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Lead Score
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 16 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundColor: scoreColors.bg,
              color: scoreColors.color,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 900 }}>{lead.score}</div>
            <div style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase" }}>
              {lead.scoreLabel}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ marginBottom: 12, opacity: 0.8 }}>
              Score calculated from message analysis including intent keywords, response time, and engagement signals.
            </p>
            <div style={{ display: "flex", gap: 8, fontSize: 12, opacity: 0.7 }}>
              <div>❄️ Cold: 0-24</div>
              <div>🌡️ Warm: 25-59</div>
              <div>🔥 Hot: 60+</div>
            </div>
          </div>
        </div>

        <button
          onClick={handleRecalculateScore}
          disabled={updating || !lead.threadId}
          style={{
            padding: "10px 20px",
            backgroundColor: updating ? "#6c757d" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: updating || !lead.threadId ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {updating ? "Recalculating..." : "🔄 Recalculate Score"}
        </button>
        {!lead.threadId && (
          <p style={{ fontSize: 12, color: "#dc3545", marginTop: 8 }}>
            No thread linked to this lead. Score calculation requires message history.
          </p>
        )}
      </div>

      {/* Follow-up */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 8,
          border: "1px solid #ddd",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Follow-up Automation
        </h2>

        {lead.sequenceId ? (
          <div style={{ padding: 16, backgroundColor: "#d4edda", borderRadius: 6, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, color: "#155724", marginBottom: 4 }}>
              ✅ Sequence Active
            </div>
            <div style={{ fontSize: 14, color: "#155724" }}>
              Next follow-up:{" "}
              {lead.nextFollowUpAt ? (
                lead.nextFollowUpAt.toDate().toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              ) : (
                "Not scheduled"
              )}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: 16, opacity: 0.8 }}>
              No active follow-up sequence. Start one to automate lead nurturing.
            </p>
            <button
              onClick={() => setShowStartSequence(true)}
              disabled={sequences.length === 0}
              style={{
                padding: "10px 20px",
                backgroundColor: sequences.length === 0 ? "#6c757d" : "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: sequences.length === 0 ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              ▶️ Start Sequence
            </button>
            {sequences.length === 0 && (
              <p style={{ fontSize: 12, color: "#dc3545", marginTop: 8 }}>
                No active sequences found. Create one first.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Thread Link */}
      {lead.threadId && (
        <div
          style={{
            backgroundColor: "#fff",
            padding: 24,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Conversation
          </h2>
          <button
            onClick={() => router.push(`/app/inbox?thread=${lead.threadId}`)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            💬 Open Conversation
          </button>
        </div>
      )}

      {/* Notes */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Notes
        </h2>
        <textarea
          value={lead.notes || ""}
          onChange={(e) => setLead({ ...lead, notes: e.target.value })}
          onBlur={(e) => handleUpdateField("notes", e.target.value)}
          placeholder="Add notes about this lead..."
          rows={6}
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

      {/* Start Sequence Modal */}
      {showStartSequence && (
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
          onClick={() => setShowStartSequence(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 8,
              padding: 32,
              maxWidth: 500,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
              Start Follow-up Sequence
            </h2>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                Select Sequence *
              </label>
              <select
                value={selectedSequenceId}
                onChange={(e) => setSelectedSequenceId(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: 14,
                }}
              >
                <option value="">-- Choose a sequence --</option>
                {sequences.map((seq) => (
                  <option key={seq.id} value={seq.id}>
                    {seq.name} ({seq.steps?.length || 0} steps)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowStartSequence(false)}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleStartSequence}
                disabled={!selectedSequenceId || updating}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  backgroundColor: !selectedSequenceId || updating ? "#6c757d" : "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: !selectedSequenceId || updating ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {updating ? "Starting..." : "Start Sequence"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
