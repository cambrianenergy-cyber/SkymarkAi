"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

interface Workspace {
  id: string;
  name: string;
  ownerUserId: string;
  plan?: string;
  status?: string;
}

interface Member {
  id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited" | "removed";
  invitedEmail?: string;
  createdAt: any;
}

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  
  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviting, setInviting] = useState(false);

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
  }, [authChecked, user, router, workspaceId]);

  async function loadWorkspace() {
    if (!user || !workspaceId) return;

    try {
      // Load workspace
      const wsDoc = await getDoc(doc(db, "workspaces", workspaceId));
      if (!wsDoc.exists()) {
        alert("Workspace not found");
        router.push("/app/workspaces");
        return;
      }

      setWorkspace({
        id: wsDoc.id,
        ...wsDoc.data(),
      } as Workspace);

      // Load members
      const memQ = query(
        collection(db, "workspace_members"),
        where("workspaceId", "==", workspaceId)
      );
      const memSnap = await getDocs(memQ);
      
      const memberList = memSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Member[];
      
      setMembers(memberList);

      // Get current user role
      const currentMember = memberList.find((m) => m.userId === user.uid);
      setCurrentUserRole(currentMember?.role || "viewer");

      setLoading(false);
    } catch (error) {
      console.error("Error loading workspace:", error);
      alert("Error loading workspace: " + (error as any).message);
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !workspace || inviting || !inviteEmail) return;

    if (currentUserRole !== "owner" && currentUserRole !== "admin") {
      alert("You don't have permission to invite members");
      return;
    }

    setInviting(true);
    try {
      // Create invited membership
      await addDoc(collection(db, "workspace_members"), {
        workspaceId: workspace.id,
        userId: "", // Will be set when user accepts invite
        role: inviteRole,
        status: "invited",
        invitedEmail: inviteEmail.toLowerCase().trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert(`Invitation sent to ${inviteEmail}`);
      setShowInviteForm(false);
      setInviteEmail("");
      setInviteRole("member");
      loadWorkspace();
    } catch (error) {
      console.error("Error inviting member:", error);
      alert("Failed to send invitation: " + (error as any).message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!user || currentUserRole !== "owner" && currentUserRole !== "admin") {
      alert("You don't have permission to remove members");
      return;
    }

    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await updateDoc(doc(db, "workspace_members", memberId), {
        status: "removed",
        updatedAt: serverTimestamp(),
      });
      alert("Member removed");
      loadWorkspace();
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member: " + (error as any).message);
    }
  }

  function getRoleBadge(role: string) {
    const colors: Record<string, { bg: string; color: string }> = {
      owner: { bg: "#dc3545", color: "#fff" },
      admin: { bg: "#ffc107", color: "#000" },
      member: { bg: "#0d6efd", color: "#fff" },
      viewer: { bg: "#6c757d", color: "#fff" },
    };
    
    const style = colors[role] || colors.member;
    
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {role.toUpperCase()}
      </span>
    );
  }

  function getStatusBadge(status: string) {
    const safeStatus = status || "active";
    const colors: Record<string, { bg: string; color: string }> = {
      active: { bg: "#28a745", color: "#fff" },
      invited: { bg: "#ffc107", color: "#000" },
      removed: { bg: "#dc3545", color: "#fff" },
    };
    
    const style = colors[safeStatus] || colors.active;
    
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {safeStatus.toUpperCase()}
      </span>
    );
  }

  if (!authChecked || loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Workspace not found</h1>
      </main>
    );
  }

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => router.push("/app/workspaces")}
          style={{
            padding: "8px 16px",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ← Back to Workspaces
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
          {workspace.name}
        </h1>
        <p style={{ fontSize: 14, opacity: 0.6 }}>
          Plan: {workspace.plan || "free"} • Status: {workspace.status || "active"}
        </p>
        {/* Show included agents for the plan */}
        {(() => {
          const PLAN_AGENT_MAP: Record<string, string[]> = {
            foundation: ["Copywriter", "Content Creator", "Scheduler & Publisher"],
            accelerate: ["Copywriter", "Content Creator", "Scheduler & Publisher", "Campaign Director"],
            dominion: ["Copywriter", "Content Creator", "Scheduler & Publisher", "Campaign Director", "Trend Hunter"],
            sovereign: ["Copywriter", "Content Creator", "Scheduler & Publisher", "Campaign Director", "Trend Hunter", "Competitor Watchdog"],
          };
          const planKey = (workspace.plan || "foundation").toLowerCase();
          const included = PLAN_AGENT_MAP[planKey];
          if (!included) return null;
          return (
            <div style={{ marginTop: 8, fontSize: 13, color: '#374151' }}>
              <b>Included Agents:</b> {included.join(", ")}
            </div>
          );
        })()}
      </div>

      {/* Team Section */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 8,
          border: "1px solid #ddd",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            Team Members ({members.filter((m) => m.status !== "removed").length})
          </h2>
          
          {canManage && (
            <button
              onClick={() => setShowInviteForm(true)}
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
              + Invite Member
            </button>
          )}
        </div>

        {/* Invite Form Modal */}
        {showInviteForm && (
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
            onClick={() => setShowInviteForm(false)}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: 32,
                borderRadius: 8,
                maxWidth: 500,
                width: "100%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
                Invite Team Member
              </h3>
              
              <form onSubmit={handleInvite}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="teammate@example.com"
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
                    Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      fontSize: 14,
                    }}
                  >
                    <option value="admin">Admin - Full access except workspace deletion</option>
                    <option value="member">Member - Can create content and manage leads</option>
                    <option value="viewer">Viewer - Read-only access</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    disabled={inviting}
                    style={{
                      flex: 1,
                      padding: "10px 20px",
                      backgroundColor: "#6c757d",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail}
                    style={{
                      flex: 1,
                      padding: "10px 20px",
                      backgroundColor: "#0070f3",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: inviting ? "not-allowed" : "pointer",
                      opacity: inviting || !inviteEmail ? 0.6 : 1,
                      fontSize: 14,
                    }}
                  >
                    {inviting ? "Inviting..." : "Send Invite"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Members List */}
        <div style={{ display: "grid", gap: 12 }}>
          {members
            .filter((m) => m.status !== "removed")
            .map((member) => (
              <div
                key={member.id}
                style={{
                  padding: 16,
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>
                      {member.status === "invited" 
                        ? member.invitedEmail 
                        : member.userId === user.uid 
                          ? "You" 
                          : member.userId}
                    </span>
                    {getRoleBadge(member.role)}
                    {getStatusBadge(member.status)}
                  </div>
                  <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>
                    {member.status === "invited" 
                      ? "Pending acceptance" 
                      : `User ID: ${member.userId}`}
                  </p>
                </div>

                {canManage && member.userId !== user.uid && member.role !== "owner" && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    style={{
                      padding: "6px 12px",
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
            ))}
        </div>

        {members.filter((m) => m.status !== "removed").length === 0 && (
          <p style={{ textAlign: "center", opacity: 0.6, padding: 32 }}>
            No team members yet. Invite someone to get started!
          </p>
        )}
      </div>

      {/* Workspace Settings */}
      <div
        style={{
          backgroundColor: "#fff",
          padding: 24,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          Settings
        </h2>
        
        <div style={{ opacity: canManage ? 1 : 0.5 }}>
          <p style={{ fontSize: 14, marginBottom: 16 }}>
            Workspace settings available for owners and admins.
          </p>
          
          {!canManage && (
            <p style={{ fontSize: 14, color: "#dc3545" }}>
              You don't have permission to edit workspace settings.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
