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
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

interface ScheduledPost {
  id: string;
  workspaceId: string;
  campaignId?: string;
  assetId: string;
  platform: string;
  scheduledFor: Timestamp;
  status: "queued" | "scheduled" | "published" | "failed" | "canceled";
  captionSnapshot?: string;
  mediaSpecSnapshot?: any;
  createdByUid?: string;
  notes?: string;
  publishResult?: {
    method?: string;
    publishedAt?: Timestamp;
    failedAt?: Timestamp;
    reason?: string;
  };
  createdAt: any;
  updatedAt: any;
}

interface ContentAsset {
  id: string;
  type: string;
  platform: string;
  copy: string;
  title?: string;
}

export default function ScheduleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params?.scheduleId as string;

  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [schedule, setSchedule] = useState<ScheduledPost | null>(null);
  const [asset, setAsset] = useState<ContentAsset | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDate, setNewDate] = useState<string>("");
  const [newTime, setNewTime] = useState<string>("");

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
      await loadSchedule(wsId);
    } catch (error) {
      console.error("Error loading workspace:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSchedule(wsId: string) {
    try {
      const docRef = doc(db, "scheduled_posts", scheduleId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Schedule not found");
        router.push("/app/schedule");
        return;
      }

      const data = { id: docSnap.id, ...docSnap.data() } as ScheduledPost;

      if (data.workspaceId !== wsId) {
        alert("Access denied");
        router.push("/app/schedule");
        return;
      }

      setSchedule(data);

      // Set initial reschedule values
      const scheduledDate = data.scheduledFor.toDate();
      setNewDate(scheduledDate.toISOString().split("T")[0]);
      setNewTime(scheduledDate.toTimeString().slice(0, 5));

      // Load asset
      if (data.assetId) {
        const assetRef = doc(db, "content_assets", data.assetId);
        const assetSnap = await getDoc(assetRef);
        if (assetSnap.exists()) {
          setAsset({ id: assetSnap.id, ...assetSnap.data() } as ContentAsset);
        }
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    }
  }

  async function handleMarkPublished() {
    if (!schedule || updating) return;

    if (!confirm("Mark this post as published?")) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "scheduled_posts", schedule.id), {
        status: "published",
        publishResult: {
          method: "manual",
          publishedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      alert("✅ Marked as published!");
      router.push("/app/schedule");
    } catch (error) {
      console.error("Error marking published:", error);
      alert("Failed to update: " + (error as any).message);
      setUpdating(false);
    }
  }

  async function handleMarkFailed() {
    if (!schedule || updating) return;

    const reason = prompt("Enter failure reason (optional):");
    if (reason === null) return; // User canceled

    setUpdating(true);
    try {
      await updateDoc(doc(db, "scheduled_posts", schedule.id), {
        status: "failed",
        publishResult: {
          method: "manual",
          failedAt: serverTimestamp(),
          reason: reason || "Unknown",
        },
        updatedAt: serverTimestamp(),
      });

      alert("❌ Marked as failed");
      router.push("/app/schedule");
    } catch (error) {
      console.error("Error marking failed:", error);
      alert("Failed to update: " + (error as any).message);
      setUpdating(false);
    }
  }

  async function handleCancel() {
    if (!schedule || updating) return;

    if (!confirm("Cancel this scheduled post?")) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "scheduled_posts", schedule.id), {
        status: "canceled",
        updatedAt: serverTimestamp(),
      });

      alert("🚫 Schedule canceled");
      router.push("/app/schedule");
    } catch (error) {
      console.error("Error canceling:", error);
      alert("Failed to cancel: " + (error as any).message);
      setUpdating(false);
    }
  }

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!schedule || updating) return;

    if (!newDate || !newTime) {
      alert("Please select date and time");
      return;
    }

    setUpdating(true);
    try {
      const newDateTime = new Date(`${newDate}T${newTime}`);
      
      if (newDateTime < new Date()) {
        alert("Cannot schedule in the past");
        setUpdating(false);
        return;
      }

      await updateDoc(doc(db, "scheduled_posts", schedule.id), {
        scheduledFor: Timestamp.fromDate(newDateTime),
        updatedAt: serverTimestamp(),
      });

      alert("✅ Rescheduled successfully!");
      setShowRescheduleModal(false);
      await loadSchedule(workspaceId);
      setUpdating(false);
    } catch (error) {
      console.error("Error rescheduling:", error);
      alert("Failed to reschedule: " + (error as any).message);
      setUpdating(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "published":
        return { bg: "#d4edda", color: "#155724" };
      case "scheduled":
        return { bg: "#cfe2ff", color: "#084298" };
      case "queued":
        return { bg: "#fff3cd", color: "#856404" };
      case "failed":
        return { bg: "#f8d7da", color: "#721c24" };
      case "canceled":
        return { bg: "#e2e3e5", color: "#383d41" };
      default:
        return { bg: "#e2e3e5", color: "#383d41" };
    }
  }

  if (!authChecked || loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!schedule) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Schedule not found</h1>
      </main>
    );
  }

  const statusColors = getStatusColor(schedule.status);
  const scheduledDate = schedule.scheduledFor.toDate();
  const canEdit = schedule.status === "queued" || schedule.status === "scheduled";

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push("/app/schedule")}
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
          ← Back to Schedule
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>
            Scheduled Post
          </h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                backgroundColor: statusColors.bg,
                color: statusColors.color,
              }}
            >
              {schedule.status}
            </span>
            <span
              style={{
                padding: "6px 14px",
                backgroundColor: "#0d6efd",
                color: "#fff",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {schedule.platform}
            </span>
          </div>
        </div>

        {canEdit && (
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => setShowRescheduleModal(true)}
              disabled={updating}
              style={{
                padding: "10px 20px",
                backgroundColor: "#0d6efd",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: updating ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              📅 Reschedule
            </button>
            <button
              onClick={handleCancel}
              disabled={updating}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: updating ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              🚫 Cancel
            </button>
          </div>
        )}
      </div>

      {/* Schedule Details */}
      <div style={{ padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Schedule Details
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px 24px" }}>
          <div style={{ fontWeight: 600 }}>Scheduled For:</div>
          <div>
            {scheduledDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {" at "}
            {scheduledDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "America/Chicago",
            })}
            {" CST"}
          </div>

          <div style={{ fontWeight: 600 }}>Platform:</div>
          <div>{schedule.platform}</div>

          {schedule.notes && (
            <>
              <div style={{ fontWeight: 600 }}>Notes:</div>
              <div>{schedule.notes}</div>
            </>
          )}

          {schedule.publishResult && (
            <>
              <div style={{ fontWeight: 600 }}>Publish Result:</div>
              <div>
                {schedule.publishResult.method === "manual" && (
                  <span>Manual {schedule.status === "published" ? "publish" : "failure"}</span>
                )}
                {schedule.publishResult.reason && (
                  <div style={{ marginTop: 4, opacity: 0.7 }}>
                    Reason: {schedule.publishResult.reason}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Linked Asset */}
      {asset && (
        <div style={{ padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              Linked Asset
            </h2>
            <button
              onClick={() => router.push(`/app/assets/${schedule.assetId}`)}
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
              Open Asset
            </button>
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong>Type:</strong> {asset.type} • <strong>Platform:</strong> {asset.platform}
          </div>

          {asset.title && (
            <div style={{ marginBottom: 12 }}>
              <strong>Title:</strong> {asset.title}
            </div>
          )}
        </div>
      )}

      {/* Caption Snapshot */}
      {schedule.captionSnapshot && (
        <div style={{ padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Caption Snapshot
          </h2>
          <p style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6 }}>
            {schedule.captionSnapshot}
          </p>
        </div>
      )}

      {/* Media Spec Snapshot */}
      {schedule.mediaSpecSnapshot && (
        <div style={{ padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Media Spec Snapshot
          </h2>
          <pre style={{ fontSize: 12, overflow: "auto" }}>
            {JSON.stringify(schedule.mediaSpecSnapshot, null, 2)}
          </pre>
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <div style={{ padding: 24, backgroundColor: "#f8f9fa", borderRadius: 8, border: "1px solid #ddd" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Actions
          </h2>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleMarkPublished}
              disabled={updating}
              style={{
                padding: "12px 24px",
                backgroundColor: updating ? "#6c757d" : "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: updating ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              ✅ Mark Published
            </button>
            <button
              onClick={handleMarkFailed}
              disabled={updating}
              style={{
                padding: "12px 24px",
                backgroundColor: updating ? "#6c757d" : "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: updating ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              ❌ Mark Failed
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
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
          onClick={() => setShowRescheduleModal(false)}
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
              Reschedule Post
            </h2>

            <form onSubmit={handleReschedule}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  New Date *
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 4,
                    border: "1px solid #ddd",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  New Time (CST) *
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 4,
                    border: "1px solid #ddd",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  style={{
                    padding: "10px 20px",
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
                  type="submit"
                  disabled={updating}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: updating ? "#6c757d" : "#0d6efd",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: updating ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {updating ? "Updating..." : "Reschedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
