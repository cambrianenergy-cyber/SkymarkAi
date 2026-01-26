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
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";

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
  assignedToUid?: string;
  notes?: string;
  lastContactAt?: any;
  nextFollowUpAt?: any;
  createdAt: any;
  updatedAt: any;
}

export default function LeadsPage() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Filters
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterScore, setFilterScore] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;
    loadLeads(workspaceId);
  }, [isReady, isAuthorized, workspaceId]);

  async function loadLeads(wsId: string) {
    setLoading(true);
    try {
      const q = query(
        collection(db, "leads"),
        where("workspaceId", "==", wsId),
        orderBy("updatedAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Lead[];
      setLeads(data);
    } catch (error) {
      console.error("Error loading leads:", error);
      alert("Error loading leads: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  }

  const filteredLeads = leads.filter((lead) => {
    if (filterStage !== "all" && lead.stage !== filterStage) return false;
    if (filterScore !== "all" && lead.scoreLabel !== filterScore) return false;
    if (filterStatus !== "all" && lead.status !== filterStatus) return false;
    if (
      searchQuery &&
      !lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !lead.handle.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  function getScoreColor(score: string) {
    switch (score) {
      case "hot":
        return { bg: "#ffe8e6", color: "#d93025" };
      case "warm":
        return { bg: "#fff4e5", color: "#b26a00" };
      case "cold":
        return { bg: "#e8f0fe", color: "#1a73e8" };
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

  return (
    <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => router.push("/app")} style={{ padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14 }}>
           Dashboard
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
            Leads
          </h1>
          <p style={{ opacity: 0.75 }}>
            Manage and track your sales leads
          </p>
        </div>
        <button
          onClick={() => router.push("/app/leads/new")}
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
          + New Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{
        padding: 20,
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        marginBottom: 24,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
      }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Stage
          </label>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            <option value="all">All Stages</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="booked">Booked</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Score
          </label>
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            <option value="all">All Scores</option>
            <option value="hot"> Hot</option>
            <option value="warm"> Warm</option>
            <option value="cold"> Cold</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="qualified">Qualified</option>
            <option value="unqualified">Unqualified</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or handle..."
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 4,
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
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
            No Leads Found
          </h2>
          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            Convert inbox threads to leads or create one manually
          </p>
          <button
            onClick={() => router.push("/app/inbox")}
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
            Go to Inbox
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
                  Channel
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Stage
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Score
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Status
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Next Follow-up
                </th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const scoreColors = getScoreColor(lead.scoreLabel);
                const statusColors = getStatusColor(lead.status);

                return (
                  <tr key={lead.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{lead.fullName}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>@{lead.handle}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 8px",
                        backgroundColor: "#e9ecef",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}>
                        {lead.channel}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textTransform: "capitalize" }}>
                      {lead.stage}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          padding: "4px 8px",
                          backgroundColor: scoreColors.bg,
                          color: scoreColors.color,
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}>
                          {lead.scoreLabel}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                          {lead.score}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "4px 8px",
                        backgroundColor: statusColors.bg,
                        color: statusColors.color,
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14 }}>
                      {lead.nextFollowUpAt ? (
                        lead.nextFollowUpAt.toDate().toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      ) : (
                        <span style={{ opacity: 0.5 }}></span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => router.push(`/app/leads/${lead.id}`)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#0070f3",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Open
                      </button>
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

