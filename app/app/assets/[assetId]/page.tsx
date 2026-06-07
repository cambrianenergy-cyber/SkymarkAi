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
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

interface ContentAsset {
  id: string;
  workspaceId: string;
  campaignId?: string;
  sourceAssetId?: string;
  type: string;
  platform: string;
  status: "draft" | "approved" | "scheduled" | "published";
  title?: string;
  copy: string;
  mediaSpec?: any;
  hooks?: string[];
  ctas?: string[];
  mediaRefs?: string[];
  parentAssetId?: string;
  createdByRunId?: string;
  createdAt: any;
  updatedAt: any;
}

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params?.assetId as string;

  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [repurposing, setRepurposing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [asset, setAsset] = useState<ContentAsset | null>(null);

  // Schedule form
  const [schedulePlatform, setSchedulePlatform] = useState<string>("");
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [usePeakTime, setUsePeakTime] = useState(false);

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
      await loadAsset(wsId);
    } catch (error) {
      console.error("Error loading workspace:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAsset(wsId: string) {
    try {
      const docRef = doc(db, "content_assets", assetId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Asset not found");
        router.push("/app/assets");
        return;
      }

      const data = { id: docSnap.id, ...docSnap.data() } as ContentAsset;

      if (data.workspaceId !== wsId) {
        alert("Access denied");
        router.push("/app/assets");
        return;
      }

      setAsset(data);
      setSchedulePlatform(data.platform);
    } catch (error) {
      console.error("Error loading asset:", error);
    }
  }

  function getPeakTime(platform: string) {
    // Simple peak time rules
    const peakTimes: Record<string, { time: string; label: string }> = {
      instagram: { time: "19:00", label: "7:00 PM (Best engagement)" },
      tiktok: { time: "21:00", label: "9:00 PM (Peak viewing)" },
      linkedin: { time: "09:00", label: "9:00 AM (Business hours)" },
      twitter: { time: "12:00", label: "12:00 PM (Lunch break)" },
      facebook: { time: "13:00", label: "1:00 PM (Afternoon peak)" },
      youtube: { time: "20:00", label: "8:00 PM (Evening viewers)" },
    };

    return peakTimes[platform.toLowerCase()] || { time: "12:00", label: "12:00 PM (Midday)" };
  }

  function handleUsePeakTime(checked: boolean) {
    setUsePeakTime(checked);
    if (checked && schedulePlatform) {
      const peakTime = getPeakTime(schedulePlatform);
      setScheduleTime(peakTime.time);
    }
  }

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !asset || scheduling) return;

    if (!scheduleDate || !scheduleTime) {
      alert("Please select date and time");
      return;
    }

    setScheduling(true);
    try {
      // Combine date and time into timestamp
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      
      if (scheduledDateTime < new Date()) {
        alert("Cannot schedule in the past");
        setScheduling(false);
        return;
      }

      await addDoc(collection(db, "scheduled_posts"), {
        workspaceId,
        campaignId: asset.campaignId,
        assetId: asset.id,
        platform: schedulePlatform,
        scheduledFor: Timestamp.fromDate(scheduledDateTime),
        status: "scheduled",
        captionSnapshot: asset.copy,
        mediaSpecSnapshot: asset.mediaSpec || null,
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update asset status
      await updateDoc(doc(db, "content_assets", asset.id), {
        status: "scheduled",
        updatedAt: serverTimestamp(),
      });

      alert("✅ Asset scheduled successfully!");
      setShowScheduleModal(false);
      router.push("/app/schedule");
    } catch (error) {
      console.error("Error scheduling asset:", error);
      alert("Failed to schedule: " + (error as any).message);
      setScheduling(false);
    }
  }

  async function handleRepurpose() {
    if (!workspaceId || !asset || repurposing) return;

    setRepurposing(true);
    try {
      // Create Repurpose Engine workflow - Full multi-platform expansion
      const steps = [
        {
          stepId: "step_1",
          order: 1,
          agentType: "Repurpose_Engine",
          instruction: `Take this ${asset.platform} ${asset.type} and extract 5-10 derivative content ideas for multiple platforms (Instagram, TikTok, LinkedIn, Email, Blog). Original: "${asset.copy}"`,
          status: "pending" as const,
        },
        {
          stepId: "step_2",
          order: 2,
          agentType: "Copywriter",
          instruction: `Rewrite the content for each target platform with platform-specific hooks, tone, and formatting. Source: "${asset.copy}"`,
          status: "pending" as const,
        },
        {
          stepId: "step_3",
          order: 3,
          agentType: "Video_Producer",
          instruction: `Generate short-form video scripts (if applicable) for TikTok, Instagram Reels, and YouTube Shorts from this content: "${asset.copy}"`,
          status: "pending" as const,
        },
        {
          stepId: "step_4",
          order: 4,
          agentType: "Visual_Designer",
          instruction: `Generate creative prompts and visual specifications for each platform variant. Include style, layout, and visual elements.`,
          status: "pending" as const,
        },
        {
          stepId: "step_5",
          order: 5,
          agentType: "Brand_Voice_Guardian",
          instruction: `Review all derivative content for tone consistency and brand alignment. Ensure all variations maintain brand voice.`,
          status: "pending" as const,
        },
        {
          stepId: "step_6",
          order: 6,
          agentType: "Scheduler_Publisher",
          instruction: `Suggest platform-specific posting windows for each variant. Consider audience behavior and platform algorithms.`,
          status: "pending" as const,
        },
      ];

      // Create workflow run
      const runRef = await addDoc(collection(db, "workflow_runs"), {
        workspaceId,
        workflowId: "repurpose_engine",
        workflowName: `Repurpose: ${asset.type}`,
        runType: "manual",
        status: "queued",
        createdByUid: user.uid,
        createdByName: user.displayName || user.email,
        inputs: { sourceAssetId: asset.id, targetPlatforms: ["instagram", "tiktok", "linkedin", "email", "youtube"] },
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
            const runSnap = await getDoc(doc(db, "workflow_runs", runRef.id));
            
            if (runSnap.exists()) {
              const runData = runSnap.data();
              const outputs = runData.steps.map((s: any) => s.output).filter(Boolean);

              // Parse outputs and create derivative assets
              let newAssetsCount = 0;
              for (const output of outputs) {
                if (output.posts && Array.isArray(output.posts)) {
                  for (const post of output.posts) {
                    await addDoc(collection(db, "content_assets"), {
                      workspaceId,
                      campaignId: asset.campaignId,
                      sourceAssetId: asset.id,
                      type: post.type || "post",
                      platform: post.platform || "multi-platform",
                      status: "draft",
                      copy: post.content || `${post.hook}\n\n${post.body || post.content}`,
                      createdByRunId: runRef.id,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    });
                    newAssetsCount++;
                  }
                }
                if (output.variations && Array.isArray(output.variations)) {
                  for (const variation of output.variations) {
                    await addDoc(collection(db, "content_assets"), {
                      workspaceId,
                      campaignId: asset.campaignId,
                      sourceAssetId: asset.id,
                      type: "post",
                      platform: variation.platform || "multi-platform",
                      status: "draft",
                      copy: variation.copy || variation.text,
                      createdByRunId: runRef.id,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    });
                    newAssetsCount++;
                  }
                }
                if (output.scripts && Array.isArray(output.scripts)) {
                  for (const script of output.scripts) {
                    await addDoc(collection(db, "content_assets"), {
                      workspaceId,
                      campaignId: asset.campaignId,
                      sourceAssetId: asset.id,
                      type: "video",
                      platform: script.platform || "video",
                      status: "draft",
                      title: script.title,
                      copy: script.script || script.content,
                      createdByRunId: runRef.id,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    });
                    newAssetsCount++;
                  }
                }
              }

              alert(`✅ Created ${newAssetsCount} repurposed assets! Check the Assets library.`);
              router.push("/app/assets");
            }
          }
        } catch (error) {
          console.error("Repurpose error:", error);
          alert("Failed to repurpose: " + (error as any).message);
        } finally {
          setRepurposing(false);
        }
      }, 500);
    } catch (error) {
      console.error("Error starting repurpose:", error);
      alert("Failed to start repurpose: " + (error as any).message);
      setRepurposing(false);
    }
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
      post: "📱",
      reel: "🎥",
      script: "📝",
      email: "📧",
      blog: "📰",
      story: "⭐",
    };
    return icons[type] || "📄";
  }

  if (!authChecked || loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  if (!asset) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Asset not found</h1>
      </main>
    );
  }

  const statusColors = getStatusColor(asset.status);
  const peakTime = getPeakTime(schedulePlatform);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.push("/app/assets")}
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
          ← Back to Assets
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 48 }}>{getTypeIcon(asset.type)}</span>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
              {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
            </h1>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
                  backgroundColor: "#0d6efd",
                  color: "#fff",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {asset.platform}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleRepurpose}
            disabled={repurposing}
            style={{
              padding: "12px 24px",
              backgroundColor: repurposing ? "#6c757d" : "#0d6efd",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: repurposing ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {repurposing ? "⏳ Repurposing..." : "🔄 Repurpose Asset"}
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            📅 Schedule Post
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Content
        </h2>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            margin: 0,
          }}
        >
          {asset.copy}
        </p>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
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
          onClick={() => setShowScheduleModal(false)}
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
              Schedule Post
            </h2>

            <form onSubmit={handleSchedule}>
              {/* Platform */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Platform *
                </label>
                <select
                  value={schedulePlatform}
                  onChange={(e) => {
                    setSchedulePlatform(e.target.value);
                    if (usePeakTime) {
                      const peak = getPeakTime(e.target.value);
                      setScheduleTime(peak.time);
                    }
                  }}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 4,
                    border: "1px solid #ddd",
                    fontSize: 14,
                  }}
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">Twitter</option>
                </select>
              </div>

              {/* Date */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
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

              {/* Peak Time Toggle */}
              <div style={{ marginBottom: 20, padding: 16, backgroundColor: "#f8f9fa", borderRadius: 4 }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={usePeakTime}
                    onChange={(e) => handleUsePeakTime(e.target.checked)}
                    style={{ marginRight: 8, width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    Use peak time for {schedulePlatform}
                  </span>
                </label>
                {usePeakTime && (
                  <p style={{ fontSize: 12, opacity: 0.7, margin: "8px 0 0 26px" }}>
                    📊 {peakTime.label}
                  </p>
                )}
              </div>

              {/* Time */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>
                  Time *
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => {
                    setScheduleTime(e.target.value);
                    setUsePeakTime(false);
                  }}
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

              {/* Buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
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
                  disabled={scheduling}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: scheduling ? "#6c757d" : "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: scheduling ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {scheduling ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
