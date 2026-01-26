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

export default function NewLeadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [handle, setHandle] = useState("");
  const [channel, setChannel] = useState("instagram");
  const [notes, setNotes] = useState("");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || submitting) return;

    if (!fullName || !handle) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "leads"), {
        workspaceId,
        threadId: "",
        fullName,
        handle,
        channel,
        status: "open",
        stage: "new",
        score: 0,
        scoreLabel: "cold",
        assignedToUid: user.uid,
        notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert(" Lead created successfully!");
      router.push(`/app/leads/${docRef.id}`);
    } catch (error) {
      console.error("Error creating lead:", error);
      alert("Failed to create lead: " + (error as any).message);
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
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
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
           Back to Leads
        </button>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
        Create New Lead
      </h1>
      <p style={{ opacity: 0.75, marginBottom: 32 }}>
        Manually add a new lead to your CRM
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "#fff",
          padding: 32,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            Full Name *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="John Doe"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            Handle/Username *
          </label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            required
            placeholder="@johndoe"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            Channel *
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any initial notes about this lead..."
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

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => router.push("/app/leads")}
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
            {submitting ? "Creating..." : "Create Lead"}
          </button>
        </div>
      </form>
    </main>
  );
}

