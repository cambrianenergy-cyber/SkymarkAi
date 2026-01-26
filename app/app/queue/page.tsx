"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "../../../lib/useAuthWorkspaceGuard";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

interface FollowUpJob {
  id: string;
  workspaceId: string;
  leadId: string;
  threadId: string;
  sequenceId: string;
  stepIndex: number;
  scheduledFor: any;
  status: "queued" | "sent" | "failed" | "canceled";
  messageDraft?: string;
  sentAt?: any;
  error?: string;
  createdAt: any;
  updatedAt: any;
}

interface Lead {
  id: string;
  fullName: string;
  handle: string;
  channel: string;
}

export default function QueuePage() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<FollowUpJob[]>([]);
  const [leads, setLeads] = useState<Map<string, Lead>>(new Map());
  const [processingJobId, setProcessingJobId] = useState<string>("");

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;
    setLoading(true);
    (async () => {
      try {
        const ws = workspaceId as string;
        await Promise.all([loadJobs(ws), loadLeads(ws)]);
      } catch (error) {
        console.error("Error loading queue:", error);
        alert("Error loading queue: " + (error as any).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isReady, isAuthorized, workspaceId]);

  async function loadJobs(wsId: string) {
    try {
      const q = query(
        collection(db, "followup_jobs"),
        where("workspaceId", "==", wsId)
        // orderBy removed to avoid index requirement
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FollowUpJob[];
      
      // Sort in memory by scheduledFor
      data.sort((a, b) => {
        const aTime = a.scheduledFor?.toMillis?.() || 0;
        const bTime = b.scheduledFor?.toMillis?.() || 0;
        return aTime - bTime;
      });
      
      setJobs(data);
    } catch (error) {
      console.error("Error loading jobs:", error);
      alert("Error loading jobs. You may need to create a Firestore index.");
    } finally {
      setLoading(false);
    }
  }

  async function loadLeads(wsId: string) {
    try {
      const q = query(
        collection(db, "leads"),
        where("workspaceId", "==", wsId)
      );
      const snap = await getDocs(q);
      const leadsMap = new Map<string, Lead>();
      snap.docs.forEach((doc) => {
        leadsMap.set(doc.id, { id: doc.id, ...doc.data() } as Lead);
      });
      setLeads(leadsMap);
    } catch (error) {
      console.error("Error loading leads:", error);
    }
  }

  async function handleSendNow(job: FollowUpJob) {
    if (processingJobId || !user) return;

    setProcessingJobId(job.id);
    try {
      const lead = leads.get(job.leadId);
      if (!lead) {
        alert("Lead not found");
        setProcessingJobId("");
        return;
      }

      // 1. Send message to inbox
      const messageRef = await addDoc(collection(db, "inbox_messages"), {
        workspaceId: job.workspaceId,
        threadId: job.threadId,
        direction: "outbound",
        senderName: user.displayName || user.email,
        senderHandle: "You",
        text: job.messageDraft || "Follow-up message",
        attachments: [],
        sentAt: Timestamp.now(),
        status: "delivered",
        createdAt: serverTimestamp(),
      });

      // 2. Update inbox thread
      await updateDoc(doc(db, "inbox_threads", job.threadId), {
        lastMessageAt: Timestamp.now(),
        lastMessagePreview: job.messageDraft || "Follow-up message",
        updatedAt: serverTimestamp(),
      });

      // 3. Mark job as sent
      await updateDoc(doc(db, "followup_jobs", job.id), {
        status: "sent",
        sentAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4. Get sequence to check for next step
      const sequenceDoc = await getDoc(doc(db, "followup_sequences", job.sequenceId));
      if (sequenceDoc.exists()) {
        const sequenceData = sequenceDoc.data();
        const steps = sequenceData.steps || [];
        const nextStepIndex = job.stepIndex + 1;

        // 5. Create next job if there are more steps
        if (nextStepIndex < steps.length) {
          const nextStep = steps[nextStepIndex];
          const now = new Date();
          const scheduledFor = new Date(now.getTime() + nextStep.waitHours * 60 * 60 * 1000);

          await addDoc(collection(db, "followup_jobs"), {
            workspaceId: job.workspaceId,
            leadId: job.leadId,
            threadId: job.threadId,
            sequenceId: job.sequenceId,
            stepIndex: nextStepIndex,
            scheduledFor: Timestamp.fromDate(scheduledFor),
            status: "queued",
            messageDraft: nextStep.messageTemplate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          // 6. Update lead's nextFollowUpAt
          await updateDoc(doc(db, "leads", job.leadId), {
            nextFollowUpAt: Timestamp.fromDate(scheduledFor),
            lastContactAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          // Sequence complete - clear nextFollowUpAt
          await updateDoc(doc(db, "leads", job.leadId), {
            nextFollowUpAt: null,
            lastContactAt: serverTimestamp(),
            stage: "contacted",
            updatedAt: serverTimestamp(),
          });
        }
      }

      alert(" Message sent successfully!");
      if (workspaceId) await loadJobs(workspaceId as string);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message: " + (error as any).message);
      
      // Mark job as failed
      try {
        await updateDoc(doc(db, "followup_jobs", job.id), {
          status: "failed",
          error: (error as any).message,
          updatedAt: serverTimestamp(),
        });
      } catch (updateError) {
        console.error("Error updating job status:", updateError);
      }
    } finally {
      setProcessingJobId("");
    }
  }

  async function handleCancel(job: FollowUpJob) {
    if (processingJobId) return;

    if (!confirm("Cancel this follow-up job?")) return;

    setProcessingJobId(job.id);
    try {
      await updateDoc(doc(db, "followup_jobs", job.id), {
        status: "canceled",
        updatedAt: serverTimestamp(),
      });

      alert(" Job canceled");
      if (workspaceId) await loadJobs(workspaceId as string);
    } catch (error) {
      console.error("Error canceling job:", error);
      alert("Failed to cancel job: " + (error as any).message);
    } finally {
      setProcessingJobId("");
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "sent":
        return { bg: "#28a745", color: "#fff" };
      case "queued":
        return { bg: "#ffc107", color: "#000" };
      case "failed":
        return { bg: "#dc3545", color: "#fff" };
      case "canceled":
        return { bg: "#6c757d", color: "#fff" };
      default:
        return { bg: "#e2e3e5", color: "#000" };
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
        <h1>Loading...</h1>
      </main>
    );
  }

  // Sort jobs: queued first, then by scheduledFor
  const sortedJobs = [...jobs].sort((a, b) => {
    if (a.status === "queued" && b.status !== "queued") return -1;
    if (a.status !== "queued" && b.status === "queued") return 1;
    const aTime = a.scheduledFor?.toDate?.()?.getTime() || 0;
    const bTime = b.scheduledFor?.toDate?.()?.getTime() || 0;
    return aTime - bTime;
  });

  return (
    <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => router.push("/app")} style={{ padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 }}>
           Dashboard
        </button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
          Automation Queue
        </h1>
        <p style={{ opacity: 0.75 }}>
          Manage scheduled follow-up messages
        </p>
      </div>

      {sortedJobs.length === 0 ? (
        <div
          style={{
            padding: 64,
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            borderRadius: 8,
            border: "2px dashed #ddd",
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            No Jobs in Queue
          </h2>
          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            Start a follow-up sequence on a lead to create jobs
          </p>
          <button
            onClick={() => router.push("/app/leads")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Go to Leads
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Lead
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Step
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Scheduled For
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Status
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Message Preview
                </th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs.map((job) => {
                const statusColors = getStatusColor(job.status);
                const lead = leads.get(job.leadId);
                const scheduledDate = job.scheduledFor?.toDate();

                return (
                  <tr key={job.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px 16px" }}>
                      {lead ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{lead.fullName}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>@{lead.handle}</div>
                        </div>
                      ) : (
                        <span style={{ opacity: 0.5 }}>Unknown Lead</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      Step {job.stepIndex + 1}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14 }}>
                      {scheduledDate ? (
                        <div>
                          <div>{scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>
                            {scheduledDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>
                      ) : (
                        <span style={{ opacity: 0.5 }}></span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 8px",
                        backgroundColor: statusColors.bg,
                        color: statusColors.color,
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, maxWidth: 300 }}>
                      {job.messageDraft ? (
                        <div style={{ 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap",
                          opacity: 0.8,
                        }}>
                          {job.messageDraft}
                        </div>
                      ) : (
                        <span style={{ opacity: 0.5 }}>No preview</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        {job.status === "queued" && (
                          <>
                            <button
                              onClick={() => handleSendNow(job)}
                              disabled={processingJobId === job.id}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: processingJobId === job.id ? "#6c757d" : "#28a745",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                cursor: processingJobId === job.id ? "not-allowed" : "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {processingJobId === job.id ? "Sending..." : " Send Now"}
                            </button>
                            <button
                              onClick={() => handleCancel(job)}
                              disabled={processingJobId === job.id}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#6c757d",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                cursor: processingJobId === job.id ? "not-allowed" : "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                               Cancel
                            </button>
                          </>
                        )}
                        {job.status === "sent" && (
                          <span style={{ fontSize: 12, color: "#28a745", fontWeight: 600 }}>
                             Sent {job.sentAt?.toDate().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        )}
                        {job.status === "failed" && job.error && (
                          <span style={{ fontSize: 12, color: "#dc3545" }}>
                             {job.error}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

