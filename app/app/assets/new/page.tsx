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
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";

interface Campaign {
  id: string;
  name: string;
}

export default function NewAssetPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Form state
  const [type, setType] = useState<string>("post");
  const [platform, setPlatform] = useState<string>("instagram");
  const [status, setStatus] = useState<string>("draft");
  const [campaignId, setCampaignId] = useState<string>("");
  const [copy, setCopy] = useState<string>("");

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

      // Load campaigns
      const campaignsQ = query(
        collection(db, "campaigns"),
        where("workspaceId", "==", wsId),
        orderBy("createdAt", "desc")
      );
      const campaignsSnap = await getDocs(campaignsQ);
      const campaignsData = campaignsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Campaign[];
      setCampaigns(campaignsData);

      setLoading(false);
    } catch (error) {
      console.error("Error loading workspace:", error);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId || !copy.trim() || submitting) return;

    setSubmitting(true);
    try {
      const assetData: any = {
        workspaceId,
        type,
        platform,
        status,
        copy: copy.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (campaignId) {
        assetData.campaignId = campaignId;
      }

      await addDoc(collection(db, "content_assets"), assetData);

      alert(" Asset created successfully!");
      router.push("/app/assets");
    } catch (error) {
      console.error("Error creating asset:", error);
      alert("Failed to create asset: " + (error as any).message);
      setSubmitting(false);
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
           Back to Assets
        </button>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 32 }}>
        Create New Asset
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={{ padding: 24, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd" }}>
          {/* Type */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>
              Content Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 4,
                border: "1px solid #ddd",
                fontSize: 14,
              }}
            >
              <option value="post">Post</option>
              <option value="reel">Reel</option>
              <option value="story">Story</option>
              <option value="script">Script</option>
              <option value="email">Email</option>
              <option value="blog">Blog</option>
            </select>
          </div>

          {/* Platform */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>
              Platform *
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
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
              <option value="email">Email</option>
              <option value="multi-platform">Multi-Platform</option>
            </select>
          </div>

          {/* Status */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 4,
                border: "1px solid #ddd",
                fontSize: 14,
              }}
            >
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Campaign */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>
              Campaign (Optional)
            </label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 4,
                border: "1px solid #ddd",
                fontSize: 14,
              }}
            >
              <option value="">None</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          {/* Copy */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 8 }}>
              Content Copy *
            </label>
            <textarea
              value={copy}
              onChange={(e) => setCopy(e.target.value)}
              required
              placeholder="Enter your content here..."
              rows={10}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 4,
                border: "1px solid #ddd",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
              {copy.length} characters {!copy.trim() && "(Required to create asset)"}
            </p>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => router.push("/app/assets")}
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
              disabled={submitting || !copy.trim()}
              title={!copy.trim() ? "Please enter content copy to create asset" : ""}
              style={{
                padding: "10px 20px",
                backgroundColor: submitting || !copy.trim() ? "#6c757d" : "#0d6efd",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: submitting || !copy.trim() ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                opacity: submitting || !copy.trim() ? 0.6 : 1,
              }}
            >
              {submitting ? "Creating..." : "Create Asset"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

