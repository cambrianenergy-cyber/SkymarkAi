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
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

interface Member {
  id: string;
  userId: string;
  email: string;
  role: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: any;
}

// Use the primary workspace ID
const DEFAULT_WORKSPACE_ID = "NtabEfcWZHdcKSsWi4fN";

export default function TeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>(DEFAULT_WORKSPACE_ID);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Try to get workspace from user's membership, fallback to default
      const memQ = query(
        collection(db, "workspace_members"),
        where("userId", "==", user.uid)
      );
      const memSnap = await getDocs(memQ);

      let wsId = DEFAULT_WORKSPACE_ID;
      if (!memSnap.empty) {
        wsId = memSnap.docs[0].data().workspaceId;
      }
      
      setWorkspaceId(wsId);

      // Load members
      await loadMembers(wsId);
      
      // Load invites
      await loadInvites(wsId);

      setLoading(false);
    });

    return () => unsub();
  }, []);

  async function loadMembers(wsId: string) {
    const memQ = query(
      collection(db, "workspace_members"),
      where("workspaceId", "==", wsId)
    );
    const memSnap = await getDocs(memQ);

    const membersList: Member[] = [];
    for (const d of memSnap.docs) {
      const data = d.data();
      const userDoc = await getDoc(doc(db, "users", data.userId));
      const email = userDoc.exists() ? userDoc.data()?.email : "Unknown";

      membersList.push({
        id: d.id,
        userId: data.userId,
        email,
        role: data.role || "member",
      });
    }

    setMembers(membersList);
  }

  async function loadInvites(wsId: string) {
    const invQ = query(
      collection(db, "workspace_invites"),
      where("workspaceId", "==", wsId)
    );
    const invSnap = await getDocs(invQ);

    const invitesList: Invite[] = invSnap.docs.map((d) => ({
      id: d.id,
      email: d.data().email,
      role: d.data().role || "member",
      status: d.data().status || "pending",
      createdAt: d.data().createdAt,
    }));

    setInvites(invitesList);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !inviteEmail.trim()) return;

    setInviteLoading(true);
    setInviteMessage("");

    try {
      await addDoc(collection(db, "workspace_invites"), {
        workspaceId,
        email: inviteEmail.toLowerCase().trim(),
        role: inviteRole,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setInviteMessage(" Invite sent!");
      setInviteEmail("");
      
      // Reload invites
      await loadInvites(workspaceId);
    } catch (err: any) {
      setInviteMessage(" Error: " + (err?.message ?? "Failed to invite"));
    } finally {
      setInviteLoading(false);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900 }}>Team</h1>
        <p style={{ marginTop: 10 }}>Loading...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "10px 14px",
            background: "#f8fafc",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
           Back
        </button>
      </div>
      
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>Team Management</h1>
      <p style={{ marginTop: 8, opacity: 0.7 }}>Workspace: {workspaceId}</p>

      {/* A) Members List */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Members ({members.length})</h2>
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {members.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No members found.</p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: 16,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{m.email}</div>
                  <div style={{ fontSize: 14, opacity: 0.6, marginTop: 4 }}>
                    User ID: {m.userId}
                  </div>
                </div>
                <div
                  style={{
                    padding: "6px 12px",
                    background: m.role === "owner" ? "#4CAF50" : "#2196F3",
                    color: "white",
                    borderRadius: 4,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {m.role}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* B) Invite User */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Invite New Member</h2>
        <form
          onSubmit={handleInvite}
          style={{ marginTop: 16, display: "grid", gap: 12, maxWidth: 500 }}
        >
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address"
            required
            style={{ padding: 12, fontSize: 16 }}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            style={{ padding: 12, fontSize: 16 }}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <button
            type="submit"
            disabled={inviteLoading}
            style={{
              padding: 12,
              fontSize: 16,
              fontWeight: 700,
              background: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: inviteLoading ? "not-allowed" : "pointer",
            }}
          >
            {inviteLoading ? "Sending..." : "Send Invite"}
          </button>
          {inviteMessage && (
            <p
              style={{
                marginTop: 8,
                color: inviteMessage.startsWith("") ? "green" : "crimson",
              }}
            >
              {inviteMessage}
            </p>
          )}
        </form>
      </section>

      {/* C) Pending Invites */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Pending Invites ({invites.length})</h2>
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {invites.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No pending invites.</p>
          ) : (
            invites.map((inv) => (
              <div
                key={inv.id}
                style={{
                  padding: 16,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{inv.email}</div>
                  <div style={{ fontSize: 14, opacity: 0.6, marginTop: 4 }}>
                    Role: {inv.role}  Status: {inv.status}
                  </div>
                </div>
                <div
                  style={{
                    padding: "6px 12px",
                    background: inv.status === "pending" ? "#FFC107" : "#4CAF50",
                    color: inv.status === "pending" ? "#000" : "white",
                    borderRadius: 4,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {inv.status}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

