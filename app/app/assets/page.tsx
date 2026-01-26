"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "../../../lib/useAuthWorkspaceGuard";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

interface ContentAsset {
  id: string;
  workspaceId: string;
  campaignId?: string;
  type: string;
  platform: string;
  status: "draft" | "approved" | "scheduled" | "published";
  copy: string;
  mediaRefs?: string[];
  parentAssetId?: string;
  repurposedCount?: number;
  createdAt: any;
  updatedAt: any;
}

interface Campaign {
  id: string;
  name: string;
}

export default function AssetsPage() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(true);
  const [repurposing, setRepurposing] = useState<string | null>(null);
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Filters
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCampaign, setFilterCampaign] = useState<string>("all");

  useEffect(() => {
    if (!isReady || !isAuthorized || !workspaceId) return;
    setLoading(true);
    (async () => {
      try {
        const campaignsQ = query(
          collection(db, "campaigns"),
          where("workspaceId", "==", workspaceId),
          orderBy("createdAt", "desc")
        );
        const campaignsSnap = await getDocs(campaignsQ);
        const campaignsData = campaignsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Campaign[];
        setCampaigns(campaignsData);

        const assetsQ = query(
          collection(db, "content_assets"),
          where("workspaceId", "==", workspaceId),
          orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(assetsQ, (snapshot) => {
          const assetsData = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as ContentAsset[];
          setAssets(assetsData);
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error loading assets:", error);
        setLoading(false);
      }
    })();
  }, [isReady, isAuthorized, workspaceId]);

  async function handleRepurpose(asset: ContentAsset) {
    if (!workspaceId || repurposing || !user) return;

    setRepurposing(asset.id);
    try {
      // Create workflow steps for repurposing
      const steps = [
        {
          stepId: "step_1",
          order: 1,
          agentType: "Content_Creator",
          instruction: `Take this ${asset.platform} ${asset.type} and create 5 short-form variations with different hooks and angles. Original content: "${asset.copy}"`,
          status: "pending" as const,
        },
        {
          stepId: "step_2",
          order: 2,
          agentType: "Copywriter",
          instruction: `Transform this content into 3 email versions (subject line + body) with different tones (professional, casual, urgent): "${asset.copy}"`,
          status: "pending" as const,
        },
        {
          stepId: "step_3",
          order: 3,
          agentType: "Script_Writer",
          instruction: `Create 2 video script versions from this content - one for TikTok/Reels (30 sec) and one for YouTube (2 min): "${asset.copy}"`,
          status: "pending" as const,
        },
      ];

      // Create workflow run
      const runRef = await addDoc(collection(db, "workflow_runs"), {
        workspaceId,
        workflowId: "content_repurpose",
        workflowName: `Repurpose: ${asset.type}`,
        runType: "manual",
        status: "queued",
        createdByUid: user?.uid || "",
        createdByName: user?.displayName || user?.email || "Unknown",
        inputs: { sourceAssetId: asset.id },
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

      // Execute workflow
      setTimeout(async () => {
        try {
          const response = await fetch("/api/orchestrator/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runId: runRef.id, action: "executeAll" }),
          });

          const result = await response.json();

          if (result.success) {
            // Extract outputs and create new assets
            const runSnap = await getDocs(
              query(
                collection(db, "workflow_runs"),
                where("__name__", "==", runRef.id)
              )
            );

            if (!runSnap.empty) {
              const runData = runSnap.docs[0].data();
              const outputs = runData.steps.map((s: any) => s.output).filter(Boolean);

              // Parse outputs and create derivative assets
              let newAssetsCount = 0;
              for (const output of outputs) {
                if (output.posts) {
                  // From Content_Creator - short variations
                  for (const post of output.posts) {
                    await addDoc(collection(db, "content_assets"), {
                      workspaceId,
                      campaignId: asset.campaignId,
                      type: "post",
                      platform: post.platform || "multi-platform",
                      status: "draft",
                      copy: `${post.hook}\n\n${post.content}`,
                      parentAssetId: asset.id,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    });
                    newAssetsCount++;
                  }
                }
                if (output.emails) {
                  // From Copywriter - email versions
                  for (const email of output.emails) {
                    await addDoc(collection(db, "content_assets"), {
                      workspaceId,
                      campaignId: asset.campaignId,
                      type: "email",
                      platform: "email",
                      status: "draft",
                      copy: `Subject: ${email.subject}\n\n${email.body}`,
                      parentAssetId: asset.id,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    });
                    newAssetsCount++;
                  }
                }
                if (output.scripts) {
                  // From Script_Writer - video scripts
                  for (const script of output.scripts) {
                    await addDoc(collection(db, "content_assets"), {
                      workspaceId,
                      campaignId: asset.campaignId,
                      type: "script",
                      platform: script.platform || "video",
                      status: "draft",
                      copy: script.content,
                      parentAssetId: asset.id,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    });
                    newAssetsCount++;
                  }
                }
              }

              // Update parent asset with repurposed count
              await updateDoc(doc(db, "content_assets", asset.id), {
                repurposedCount: newAssetsCount,
                updatedAt: serverTimestamp(),
              });

              alert(` Created ${newAssetsCount} repurposed assets!`);
            }
          }
        } catch (error) {
          console.error("Repurpose error:", error);
          alert("Failed to repurpose: " + (error as any).message);
        } finally {
          setRepurposing(null);
        }
      }, 500);
    } catch (error) {
      console.error("Error starting repurpose:", error);
      alert("Failed to start repurpose: " + (error as any).message);
      setRepurposing(null);
    }
  }

  function getCampaignName(campaignId?: string) {
    if (!campaignId) return "No Campaign";
    const campaign = campaigns.find((c) => c.id === campaignId);
    return campaign?.name || "Unknown Campaign";
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "published":
        return { bg: "#d4edda", color: "#155724" };
      case "approved":
        return { bg: "#cfe2ff", color: "#084298" };
      case "scheduled":
        return { bg: "#fff3cd", color: "#856404" };
      default:
        return { bg: "#e2e3e5", color: "#383d41" };
    }
  }

  function getTypeIcon(type: string) {
    const icons: Record<string, string> = {
      post: "",
      reel: "",
      script: "",
      email: "",
      blog: "",
      story: "",
    };
    return icons[type] || "";
  }

  // Apply filters
  const filteredAssets = assets.filter((asset) => {
    if (filterPlatform !== "all" && asset.platform !== filterPlatform) return false;
    if (filterStatus !== "all" && asset.status !== filterStatus) return false;
    if (filterCampaign !== "all" && asset.campaignId !== filterCampaign) return false;
    return true;
  });

  // Group assets by parent
  const groupedAssets = filteredAssets.reduce((acc, asset) => {
    if (asset.parentAssetId) {
      if (!acc[asset.parentAssetId]) {
        acc[asset.parentAssetId] = [];
      }
      acc[asset.parentAssetId].push(asset);
    } else {
      if (!acc[asset.id]) {
        acc[asset.id] = [];
      }
    }
    return acc;
  }, {} as Record<string, ContentAsset[]>);

  const parentAssets = filteredAssets.filter((a) => !a.parentAssetId);

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
            Content Assets
          </h1>
          <p style={{ opacity: 0.7, fontSize: 14 }}>
            {filteredAssets.length} assets in library
          </p>
        </div>
        <button
          onClick={() => router.push("/app/assets/new")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#0d6efd",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + New Asset
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, padding: 16, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Platform
          </label>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">Twitter</option>
            <option value="email">Email</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Campaign
          </label>
          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
          >
            <option value="all">All Campaigns</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets List */}
      {parentAssets.length === 0 ? (
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
            No Assets Yet
          </h2>
          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            Create your first content asset or generate from campaigns
          </p>
          <button
            onClick={() => router.push("/app/assets/new")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#0d6efd",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            + Create Asset
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {parentAssets.map((asset) => {
            const statusColors = getStatusColor(asset.status);
            const children = groupedAssets[asset.id] || [];

            return (
              <div
                key={asset.id}
                style={{
                  padding: 24,
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 24 }}>{getTypeIcon(asset.type)}</span>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          backgroundColor: statusColors.bg,
                          color: statusColors.color,
                        }}
                      >
                        {asset.status}
                      </span>
                      <span
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "#6c757d",
                          color: "#fff",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {asset.platform}
                      </span>
                      <span style={{ fontSize: 12, opacity: 0.6 }}>
                        {getCampaignName(asset.campaignId)}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.6,
                        marginBottom: 8,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {asset.copy.substring(0, 200)}
                      {asset.copy.length > 200 && "..."}
                    </p>
                    {children.length > 0 && (
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#0d6efd" }}>
                         {children.length} repurposed assets
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      onClick={() => router.push(`/app/assets/${asset.id}`)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#0d6efd",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleRepurpose(asset)}
                      disabled={repurposing === asset.id}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: repurposing === asset.id ? "#6c757d" : "#28a745",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: repurposing === asset.id ? "not-allowed" : "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {repurposing === asset.id ? " Repurposing..." : " Repurpose"}
                    </button>
                  </div>
                </div>

                {/* Show repurposed children */}
                {children.length > 0 && (
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid #e9ecef",
                    }}
                  >
                    <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", opacity: 0.6 }}>
                      Repurposed Variations ({children.length})
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {children.map((child) => {
                        const childStatusColors = getStatusColor(child.status);
                        return (
                          <div
                            key={child.id}
                            style={{
                              padding: 12,
                              backgroundColor: "#f8f9fa",
                              borderRadius: 4,
                              border: "1px solid #e9ecef",
                            }}
                          >
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: 16 }}>{getTypeIcon(child.type)}</span>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 3,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  backgroundColor: childStatusColors.bg,
                                  color: childStatusColors.color,
                                }}
                              >
                                {child.status}
                              </span>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  backgroundColor: "#6c757d",
                                  color: "#fff",
                                  borderRadius: 3,
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}
                              >
                                {child.platform}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, opacity: 0.8, margin: 0 }}>
                              {child.copy.substring(0, 120)}
                              {child.copy.length > 120 && "..."}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

