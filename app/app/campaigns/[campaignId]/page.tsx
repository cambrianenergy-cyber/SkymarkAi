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
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

// Minimal WorkflowRun type to unblock build
type WorkflowRun = {
  id: string;
  status: string;
  progress: {
    totalSteps: number;
    completedSteps: number;
    currentStepOrder: number;
  };
  [key: string]: any; // Add more fields as needed
};

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
  workflowRunId?: string;
  generatedAt?: any;
  createdAt: any;
  updatedAt: any;
}



interface CampaignRun {
  id: string;
  status: string;
  channel: string;
  scheduledAt?: any;
  startedAt?: any;
  completedAt?: any;
  audience: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    replied: number;
    queued?: number;
    opened?: number;
    clicked?: number;
  };
  logs?: Array<{ timestamp: any; event: string; details?: any }>;
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.campaignId as string;

  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [workflowRun, setWorkflowRun] = useState<WorkflowRun | null>(null);
  const [campaignRun, setCampaignRun] = useState<CampaignRun | null>(null);
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

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
              ← Back
            </button>
          </div>
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
      await loadCampaign(wsId);
    } catch (error) {
      console.error("Error loading workspace:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCampaign(wsId: string) {
    try {
      const docRef = doc(db, "campaigns", campaignId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Campaign not found");
        router.push("/app/campaigns");
        return;
      }

      const data = { id: docSnap.id, ...docSnap.data() } as Campaign;

      if (data.workspaceId !== wsId) {
        alert("Access denied");
        router.push("/app/campaigns");
        return;
      }

      setCampaign(data);

      // Set up real-time listener
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const updatedData = { id: snapshot.id, ...snapshot.data() } as Campaign;
          setCampaign(updatedData);

          // If campaign has workflow run, listen to it
          if (updatedData.workflowRunId) {
            listenToWorkflowRun(updatedData.workflowRunId);
            // Also fetch campaign_run for this workflowRunId
            fetchCampaignRun(updatedData.workflowRunId, wsId);
          }
        }
      });

      return unsubscribe;
      async function fetchCampaignRun(workflowRunId: string, wsId: string) {
        // Query campaign_runs for this workspace and workflowRunId
        const q = query(
          collection(db, "campaign_runs"),
          where("workspaceId", "==", wsId),
          where("workflowRunId", "==", workflowRunId)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          const run = { id: doc.id, ...doc.data() } as CampaignRun;
          setCampaignRun(run);
          // Check for preflight error in status or logs
          if (run.status === "failed" && run.logs && run.logs.length > 0) {
            const preflightLog = run.logs.find((l) => l.event && l.event.toLowerCase().includes("preflight"));
            if (preflightLog && preflightLog.details && preflightLog.details.error) {
              setPreflightError(preflightLog.details.error);
            } else {
              setPreflightError("Campaign preflight check failed. See logs for details.");
            }
          } else {
            setPreflightError(null);
          }
        } else {
          setCampaignRun(null);
          setPreflightError(null);
        }
      }
    } catch (error) {
      console.error("Error loading campaign:", error);
    }
  }

  function listenToWorkflowRun(runId: string) {
    const runRef = doc(db, "workflow_runs", runId);
    const unsubscribe = onSnapshot(runRef, (snapshot) => {
      if (snapshot.exists()) {
        setWorkflowRun({ id: snapshot.id, ...snapshot.data() } as WorkflowRun);
      }
    });
    return unsubscribe;
  }

  async function handleApproveAndLaunch() {
    if (!campaignRun) return;
    setApproving(true);
    try {
      // Update campaign_run status to 'scheduled' or 'running' as appropriate
      await updateDoc(doc(db, "campaign_runs", campaignRun.id), {
        status: "scheduled",
        updatedAt: serverTimestamp(),
      });
      setCampaignRun({ ...campaignRun, status: "scheduled" });
      setPreflightError(null);
    } catch (error) {
      alert("Failed to approve and launch: " + (error as any).message);
    } finally {
      setApproving(false);
    }
  }

  async function handleGenerateCampaign() {
    if (!campaign || !workspaceId || generating) return;

    setGenerating(true);
    try {
      // Create workflow steps for campaign generation - Full Launch Plan
      const steps = [
        {
          stepId: "step_1",
          order: 1,
          agentType: "Campaign_Director",
          instruction: `Define campaign strategy for: "${campaign.name}". 
Goal: ${campaign.goal}. 
${campaign.offer ? `Offer: ${campaign.offer}` : ""}
${campaign.audience ? `Target Audience: ${campaign.audience}` : ""}
Platforms: ${campaign.platforms.join(", ")}.
Include: campaign strategy, messaging pillars (3-5 key themes), KPIs, and success metrics.`,
          status: "pending" as const,
        },
        {
          stepId: "step_2",
          order: 2,
          agentType: "Trend_Hunter",
          instruction: `Research trends + angles + hooks by platform for ${campaign.platforms.join(", ")} that align with ${campaign.goal} goals and ${campaign.audience || "the target audience"}. Provide platform-specific trending topics and content angles.`,
          status: "pending" as const,
        },
        {
          stepId: "step_3",
          order: 3,
          agentType: "Competitor_Watchdog",
          instruction: `Analyze competitor breakdown for ${campaign.audience || "the target audience"} in the context of ${campaign.goal}. Break down their offers, hooks, and content formats that are working.`,
          status: "pending" as const,
        },
        {
          stepId: "step_4",
          order: 4,
          agentType: "Copywriter",
          instruction: `Create messaging pillars + hooks + CTAs for the campaign "${campaign.name}". 
${campaign.offer ? `Offer: ${campaign.offer}` : ""}
Target: ${campaign.audience || "the target audience"}. 
Platforms: ${campaign.platforms.join(", ")}.
Generate compelling copy variations with strong hooks and clear calls-to-action.`,
          status: "pending" as const,
        },
        {
          stepId: "step_5",
          order: 5,
          agentType: "Visual_Designer",
          instruction: `Define creative direction + asset prompt specs for campaign "${campaign.name}". Platforms: ${campaign.platforms.join(", ")}. Include style, layout, overlays, and visual specifications for each platform.`,
          status: "pending" as const,
        },
        {
          stepId: "step_6",
          order: 6,
          agentType: "Video_Producer",
          instruction: `Create 5 short-form video scripts + shot ideas for campaign "${campaign.name}". Platforms: ${campaign.platforms.filter(p => ["TikTok", "Instagram", "YouTube", "Reels"].includes(p)).join(", ") || campaign.platforms.join(", ")}. Include hook, body, CTA, and shot list for each script.`,
          status: "pending" as const,
        },
        {
          stepId: "step_7",
          order: 7,
          agentType: "Scheduler_Publisher",
          instruction: `Create a 7-day posting cadence + best times for ${campaign.platforms.join(", ")}. Goal: ${campaign.goal}. Provide optimal posting schedule with timing recommendations for each platform.`,
          status: "pending" as const,
        },
        {
          stepId: "step_8",
          order: 8,
          agentType: "Analytics_Analyst",
          instruction: `Define KPIs + what to improve next week for campaign "${campaign.name}". Goal: ${campaign.goal}. Platforms: ${campaign.platforms.join(", ")}. Provide key metrics to track and optimization recommendations.`,
          status: "pending" as const,
        },
      ];

      // Create workflow run
      const runRef = await addDoc(collection(db, "workflow_runs"), {
        workspaceId,
        workflowId: "campaign_generator",
        workflowName: `Generate: ${campaign.name}`,
        runType: "manual",
        status: "queued",
        createdByUid: user.uid,
        createdByName: user.displayName || user.email,
        inputs: { campaignId: campaign.id },
        outputs: {},
        steps,
        progress: {
          totalSteps: steps.length,
          completedSteps: 0,
          currentStepOrder: 0,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update campaign with workflow run ID
      await updateDoc(doc(db, "campaigns", campaign.id), {
        workflowRunId: runRef.id,
        status: "active",
        updatedAt: serverTimestamp(),
      });

      // Start execution
      setTimeout(async () => {
        try {
          const response = await fetch("/api/orchestrator/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runId: runRef.id, action: "executeAll" }),
          });

          const result = await response.json();

          if (result.success) {
            // Extract outputs and update campaign
            const runSnap = await getDoc(doc(db, "workflow_runs", runRef.id));
            if (runSnap.exists()) {
              const runData = runSnap.data();
              const outputs = runData.steps.map((s: any) => s.output).filter(Boolean);

              // Parse outputs
              let messagingPillars: string[] = [];
              let contentPlan: any[] = [];

              outputs.forEach((output: any) => {
                // From Campaign Director - get messaging pillars
                if (output.messagingPillars && Array.isArray(output.messagingPillars)) {
                  messagingPillars = output.messagingPillars;
                }
                // From Content Creator or Copywriter - get posts/content
                if (output.posts && Array.isArray(output.posts)) {
                  contentPlan = output.posts;
                }
                // Alternative: variations from Copywriter
                if (output.variations && Array.isArray(output.variations) && contentPlan.length === 0) {
                  contentPlan = output.variations;
                }
              });

              await updateDoc(doc(db, "campaigns", campaign.id), {
                messagingPillars,
                contentPlan,
                generatedByRunId: runRef.id,
                generatedAt: serverTimestamp(),
                status: "active",
                updatedAt: serverTimestamp(),
              });
            }
          }
        } catch (error) {
          console.error("Generation error:", error);
        } finally {
          setGenerating(false);
        }
      }, 500);
    } catch (error) {
      console.error("Error generating campaign:", error);
      alert("Failed to generate campaign: " + (error as any).message);
      setGenerating(false);
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

  if (!authChecked || loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Campaign not found</h1>
      </main>
    );
  }

  const statusColors = getStatusColor(campaign.status);
  const hasGenerated = campaign.messagingPillars.length > 0 || campaign.contentPlan.length > 0;

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push("/app/campaigns")}
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
          ← Back to Campaigns
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>
            {campaign.name}
          </h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <span
              style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                backgroundColor: statusColors.bg,
                color: statusColors.color,
              }}
            >
              {campaign.status}
            </span>
            <span style={{ fontSize: 14, opacity: 0.6 }}>
              Goal: {campaign.goal}
            </span>
          </div>
        </div>

        {!hasGenerated && (
          <button
            onClick={handleGenerateCampaign}
            disabled={generating}
            style={{
              padding: "14px 28px",
              backgroundColor: generating ? "#6c757d" : "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: generating ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {generating ? "⏳ Generating..." : "🚀 Generate Campaign"}
          </button>
        )}
      </div>

      {/* Campaign Details */}
      <div style={{ padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd", marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
          Campaign Details
        </h2>

        {campaign.offer && (
          <div style={{ marginBottom: 12 }}>
            <strong style={{ fontSize: 14 }}>Offer:</strong>
            <p style={{ fontSize: 14, opacity: 0.8, margin: "4px 0 0 0" }}>{campaign.offer}</p>
          </div>
        )}

        {campaign.audience && (
          <div style={{ marginBottom: 12 }}>
            <strong style={{ fontSize: 14 }}>Target Audience:</strong>
            <p style={{ fontSize: 14, opacity: 0.8, margin: "4px 0 0 0" }}>{campaign.audience}</p>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <strong style={{ fontSize: 14 }}>Platforms:</strong>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {campaign.platforms.map((platform) => (
              <span
                key={platform}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#0d6efd",
                  color: "#fff",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Generation Progress */}
      {workflowRun && (
        <div style={{ padding: 24, backgroundColor: "#f0f8ff", borderRadius: 8, border: "1px solid #cfe2ff", marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Generation Progress
          </h3>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>
              {workflowRun.progress.completedSteps} / {workflowRun.progress.totalSteps} steps completed
            </span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {Math.round((workflowRun.progress.completedSteps / workflowRun.progress.totalSteps) * 100)}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: 24,
              backgroundColor: "#e9ecef",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(workflowRun.progress.completedSteps / workflowRun.progress.totalSteps) * 100}%`,
                height: "100%",
                backgroundColor: workflowRun.status === "completed" ? "#28a745" : "#0d6efd",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
            Status: {workflowRun.status}
          </p>
        </div>
      )}

      {/* Preflight Error UI */}
      {preflightError && (
        <div style={{ padding: 24, backgroundColor: "#fff0f0", borderRadius: 8, border: "1px solid #ffcccc", marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#c00" }}>
            Campaign Preflight Check Failed
          </h3>
          <div style={{ color: "#c00", fontWeight: 500, marginBottom: 8 }}>{preflightError}</div>
          <div style={{ fontSize: 13, color: "#555" }}>
            Please review your campaign settings, audience, and compliance requirements before retrying.
          </div>
        </div>
      )}

      {/* Campaign Run Details & Human Approval Gate */}
      {campaignRun && (
        <div style={{ padding: 24, backgroundColor: "#fffbe6", borderRadius: 8, border: "1px solid #ffeeba", marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Campaign Execution
          </h3>
          <div style={{ marginBottom: 8 }}>
            <strong>Status:</strong> {campaignRun.status}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Channel:</strong> {campaignRun.channel}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Audience:</strong> {campaignRun.audience?.total} total, {campaignRun.audience?.sent} sent, {campaignRun.audience?.delivered} delivered, {campaignRun.audience?.failed} failed, {campaignRun.audience?.replied} replied
          </div>
          {/* Human Approval Gate */}
          {campaignRun.status === "draft" && (
            <button
              onClick={handleApproveAndLaunch}
              disabled={approving}
              style={{
                padding: "14px 28px",
                backgroundColor: approving ? "#6c757d" : "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: approving ? "not-allowed" : "pointer",
                fontSize: 16,
                fontWeight: 600,
                marginTop: 16,
              }}
            >
              {approving ? "Approving..." : "✅ Approve & Launch"}
            </button>
          )}

          {/* Real-time Campaign Reporting */}
          {(campaignRun.status === "running" || campaignRun.status === "scheduled") && (
            <div style={{ marginTop: 24, marginBottom: 12 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Live Campaign Stats</h4>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div><strong>Queued:</strong> {campaignRun.audience?.queued ?? 0}</div>
                <div><strong>Sent:</strong> {campaignRun.audience?.sent ?? 0}</div>
                <div><strong>Delivered:</strong> {campaignRun.audience?.delivered ?? 0}</div>
                <div><strong>Opened:</strong> {campaignRun.audience?.opened ?? 0}</div>
                <div><strong>Clicked:</strong> {campaignRun.audience?.clicked ?? 0}</div>
                <div><strong>Replies:</strong> {campaignRun.audience?.replied ?? 0}</div>
                <div><strong>Failures:</strong> {campaignRun.audience?.failed ?? 0}</div>
              </div>
              {/* Show failure reasons if any */}
              {campaignRun.logs && campaignRun.logs.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>Failures:</strong>
                  <ul style={{ paddingLeft: 20 }}>
                    {campaignRun.logs.filter(l => l.event && l.event.toLowerCase().includes("fail")).map((log, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: '#c00', marginBottom: 4 }}>
                        [{log.timestamp?.toDate?.()?.toLocaleString?.() || ""}] {log.event} {log.details ? JSON.stringify(log.details) : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {campaignRun.logs && campaignRun.logs.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <strong>Logs:</strong>
              <ul style={{ paddingLeft: 20 }}>
                {campaignRun.logs.map((log, idx) => (
                  <li key={idx} style={{ fontSize: 13, marginBottom: 4 }}>
                    [{log.timestamp?.toDate?.()?.toLocaleString?.() || ""}] {log.event} {log.details ? JSON.stringify(log.details) : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Messaging Pillars */}
      {campaign.messagingPillars.length > 0 && (
        <div style={{ padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Messaging Pillars
          </h2>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {campaign.messagingPillars.map((pillar, index) => (
              <li key={index} style={{ fontSize: 14, marginBottom: 8 }}>
                {pillar}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content Plan */}
      {campaign.contentPlan.length > 0 && (
        <div style={{ padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Content Plan ({campaign.contentPlan.length} pieces)
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {campaign.contentPlan.map((content, index) => (
              <div
                key={index}
                style={{
                  padding: 16,
                  backgroundColor: "#f8f9fa",
                  borderRadius: 4,
                  border: "1px solid #dee2e6",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: "#6c757d",
                    }}
                  >
                    {content.type || "Post"}
                  </span>
                  <span style={{ fontSize: 12, color: "#6c757d" }}>
                    {content.platform || "Multi-platform"}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                  {content.hook || content.title}
                </h3>
                <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 8, whiteSpace: "pre-wrap" }}>
                  {content.content}
                </p>
                {content.cta && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0d6efd" }}>
                    CTA: {content.cta}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasGenerated && !generating && (
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
            Ready to Generate
          </h2>
          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            Click the "Generate Campaign" button to create your complete campaign plan with AI
          </p>
        </div>
      )}
    </main>
  );
}
