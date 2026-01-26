"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

interface FollowUpSequence {
  id: string;
  workspaceId: string;
  name: string;
  status: "active" | "inactive";
  channel: "dm" | "sms" | "email";
  steps: any[];
  createdAt: any;
  updatedAt: any;
}

export default function FollowUpsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [sequences, setSequences] = useState<FollowUpSequence[]>([]);

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
      await loadSequences(wsId);
    } catch (error) {
      console.error("Error loading workspace:", error);
      alert("Error loading follow-up sequences: " + (error as any).message);
      setLoading(false);
    }
  }

  async function loadSequences(wsId: string) {
    try {
      const q = query(
        collection(db, "followup_sequences"),
        where("workspaceId", "==", wsId)
        // orderBy removed to avoid index requirement
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as FollowUpSequence[];
      
      // Sort in memory by createdAt
      data.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      setSequences(data);
    } catch (error) {
      console.error("Error loading sequences:", error);
      alert("Error loading sequences: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    return status === "active"
      ? { bg: "#28a745", color: "#fff" }
      : { bg: "#6c757d", color: "#fff" };
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
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => router.push("/app")} style={{ padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 }}>
           Dashboard
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
            Follow-up Sequences
          </h1>
          <p style={{ opacity: 0.75 }}>
            Automated follow-up message templates
          </p>
        </div>
        <button
          onClick={() => router.push("/app/followups/new")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          + New Sequence
        </button>
      </div>

      {sequences.length === 0 ? (
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
            No Sequences Found
          </h2>
          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            Create your first follow-up sequence to automate lead nurturing
          </p>
          <button
            onClick={() => router.push("/app/followups/new")}
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
            Create Sequence
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {sequences.map((seq) => {
            const statusColors = getStatusColor(seq.status);

            return (
              <div
                key={seq.id}
                style={{
                  backgroundColor: "#fff",
                  padding: 24,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                }}
                onClick={() => router.push(`/app/followups/${seq.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                      {seq.name}
                    </h3>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                      <span style={{
                        padding: "4px 8px",
                        backgroundColor: statusColors.bg,
                        color: statusColors.color,
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}>
                        {seq.status}
                      </span>
                      <span style={{
                        padding: "4px 8px",
                        backgroundColor: "#e9ecef",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}>
                        {seq.channel}
                      </span>
                      <span style={{ fontSize: 14, opacity: 0.7 }}>
                        {seq.steps?.length || 0} steps
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/app/followups/${seq.id}`);
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#0070f3",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

