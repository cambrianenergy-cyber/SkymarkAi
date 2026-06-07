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

interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  goal: "leads" | "sales" | "awareness";
  offer?: string;
  audience?: string;
  platforms: string[];
  messagingPillars: string[];
  contentPlan: any[];
  status: "draft" | "active" | "completed";
  createdAt: any;
  updatedAt: any;
  workflowRunId?: string;
  campaignRunStatus?: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;
    loadCampaigns(workspaceId);
  }, [isReady, isAuthorized, workspaceId]);

  async function loadCampaigns(wsId: string) {
    setLoading(true);
    try {
      const q = query(
        collection(db, "campaigns"),
        where("workspaceId", "==", wsId),
        orderBy("updatedAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Campaign[];

      // For each campaign, try to find a campaign_run with matching workflowRunId
      const campaignRunQ = query(
        collection(db, "campaign_runs"),
        where("workspaceId", "==", wsId)
      );
      const campaignRunSnap = await getDocs(campaignRunQ);
        const campaignRuns = campaignRunSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status,
        }));

      // Map campaignRuns to campaigns by id (matching workflowRunId to id)
      const campaignsWithRuns = data.map((c) => {
        const run = c.workflowRunId
          ? campaignRuns.find((r) => r.id === c.workflowRunId)
          : undefined;
        return {
          ...c,
          campaignRunStatus: run && typeof run.status !== "undefined" ? run.status : undefined,
        };
      });
      setCampaigns(campaignsWithRuns);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      alert("Error loading campaigns: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "active":
        return { bg: "#d4edda", color: "#155724" };
      case "completed":
        return { bg: "#cfe2ff", color: "#084298" };
      default:
        return { bg: "#e2e3e5", color: "#383d41" };
    }
  }

  function getGoalIcon(goal: string) {
    switch (goal) {
      case "leads":
        return "";
      case "sales":
        return "";
      case "awareness":
        return "";
      default:
        return "";
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
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "8px 12px",
            backgroundColor: "#f0f0f0",
            color: "#333",
            border: "1px solid #d0d0d0",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
           Back
        </button>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
            Campaigns
          </h1>
          <p style={{ opacity: 0.7, fontSize: 16 }}>
            Generate and manage marketing campaigns
          </p>
        </div>
        <button
          onClick={() => router.push("/app/campaigns/new")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          + Create Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            borderRadius: 8,
            border: "2px dashed #ddd",
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            No campaigns yet
          </h2>
          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            Create your first campaign to get started
          </p>
          <button
            onClick={() => router.push("/app/campaigns/new")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            + Create Campaign
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {campaigns.map((campaign) => {
            const statusColors = getStatusColor(campaign.status);
            return (
              <div
                key={campaign.id}
                style={{
                  padding: 24,
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                }}
                onClick={() => router.push(`/app/campaigns/${campaign.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 24 }}>
                        {getGoalIcon(campaign.goal)}
                      </span>
                      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                        {campaign.name}
                      </h2>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          backgroundColor: statusColors.bg,
                          color: statusColors.color,
                        }}
                      >
                        {campaign.status}
                      </span>
                      {campaign.campaignRunStatus && (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            backgroundColor: "#ffeeba",
                            color: "#856404",
                            marginLeft: 8,
                          }}
                        >
                          Campaign: {campaign.campaignRunStatus}
                        </span>
                      )}
                      {(campaign.campaignRunStatus === "running" || campaign.campaignRunStatus === "scheduled") && campaign.workflowRunId && (
                        (() => {
                          // Find the campaign_run for this workflowRunId
                          const run = campaigns
                            .map((c) => c.workflowRunId ? campaigns.find((r) => r.workflowRunId === c.workflowRunId) : undefined)
                            .find((r) => r && r.workflowRunId === campaign.workflowRunId);
                          type AudienceStats = { queued?: number; sent?: number; delivered?: number; opened?: number; clicked?: number; replied?: number; failed?: number };
                          const audience: Partial<AudienceStats> = (run && typeof run.audience === 'object') ? run.audience as Partial<AudienceStats> : {};
                          return (
                            <div className="flex flex-wrap gap-3 mt-1 text-xs">
                              <span><strong>Queued:</strong> {audience.queued ?? 0}</span>
                              <span><strong>Sent:</strong> {audience.sent ?? 0}</span>
                              <span><strong>Delivered:</strong> {audience.delivered ?? 0}</span>
                              <span><strong>Opened:</strong> {audience.opened ?? 0}</span>
                              <span><strong>Clicked:</strong> {audience.clicked ?? 0}</span>
                              <span><strong>Replies:</strong> {audience.replied ?? 0}</span>
                              <span><strong>Failures:</strong> {audience.failed ?? 0}</span>
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {campaign.offer && (
                      <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>
                        <strong>Offer:</strong> {campaign.offer}
                      </p>
                    )}

                    {campaign.audience && (
                      <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>
                        <strong>Audience:</strong> {campaign.audience}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                      {campaign.platforms.length > 0 && (
                        <div>
                          <span style={{ fontSize: 12, opacity: 0.6 }}>Platforms: </span>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>
                            {campaign.platforms.join(", ")}
                          </span>
                        </div>
                      )}
                      {campaign.contentPlan.length > 0 && (
                        <div>
                          <span style={{ fontSize: 12, opacity: 0.6 }}>Content: </span>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>
                            {campaign.contentPlan.length} pieces
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.5, textAlign: "right" }}>
                    <p style={{ margin: 0 }}>
                      {campaign.updatedAt?.toDate?.()?.toLocaleDateString() || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

