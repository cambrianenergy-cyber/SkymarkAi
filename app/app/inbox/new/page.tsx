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
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

export default function NewThreadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");

  const [channel, setChannel] = useState<string>("instagram");
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [firstMessage, setFirstMessage] = useState("");

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
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || creating) return;

    if (!displayName.trim() || !firstMessage.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      const now = Timestamp.now();

      // Create thread
      const threadRef = await addDoc(collection(db, "inbox_threads"), {
        workspaceId,
        channel,
        source: "manual",
        displayName: displayName.trim(),
        handle: handle.trim() || null,
        status: "open",
        priority: "normal",
        lastMessageAt: now,
        lastMessagePreview: firstMessage.trim(),
        unreadCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create first message
      await addDoc(collection(db, "inbox_messages"), {
        workspaceId,
        threadId: threadRef.id,
        direction: "inbound",
        senderName: displayName.trim(),
        senderHandle: handle.trim() || null,
        text: firstMessage.trim(),
        sentAt: now,
        createdAt: serverTimestamp(),
      });

      alert(" Thread created successfully!");
      router.push("/app/inbox");
    } catch (error) {
      console.error("Error creating thread:", error);
      alert("Failed to create thread: " + (error as any).message);
      setCreating(false);
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
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push("/app/inbox")}
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
           Back to Inbox
        </button>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>
        Create New Thread
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 32 }}>
        Manually create an inbox thread for testing or seeding conversations
      </p>

      <form onSubmit={handleCreate}>
        <div
          style={{
            padding: 24,
            backgroundColor: "#fff",
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          {/* Channel */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Channel *
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 4,
                border: "1px solid #ddd",
                fontSize: 14,
              }}
            >
              <option value="instagram"> Instagram</option>
              <option value="facebook"> Facebook</option>
              <option value="tiktok"> TikTok</option>
              <option value="youtube"> YouTube</option>
              <option value="linkedin"> LinkedIn</option>
              <option value="email"> Email</option>
              <option value="sms"> SMS</option>
              <option value="web"> Web</option>
            </select>
          </div>

          {/* Display Name */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Contact Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., John Smith"
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

          {/* Handle */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Handle (optional)
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="e.g., @johnsmith"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 4,
                border: "1px solid #ddd",
                fontSize: 14,
              }}
            />
          </div>

          {/* First Message */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              First Message (Inbound) *
            </label>
            <textarea
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              placeholder="e.g., Hi! I'm interested in your services..."
              rows={5}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 4,
                border: "1px solid #ddd",
                fontSize: 14,
                resize: "vertical",
              }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => router.push("/app/inbox")}
              style={{
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
              type="submit"
              disabled={creating}
              style={{
                padding: "12px 24px",
                backgroundColor: creating ? "#6c757d" : "#0d6efd",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: creating ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {creating ? "Creating..." : "Create Thread"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

