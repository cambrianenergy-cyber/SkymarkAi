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

export default function NewCampaignPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");

  const [name, setName] = useState("");
  const [goal, setGoal] = useState<"leads" | "sales" | "awareness">("leads");
  const [offer, setOffer] = useState("");
  const [audience, setAudience] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [customPlatform, setCustomPlatform] = useState("");

  const platformOptions = ["LinkedIn", "Instagram", "TikTok", "Twitter", "Facebook", "YouTube"];

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

  function togglePlatform(platform: string) {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter((p) => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  }

  function addCustomPlatform() {
    if (customPlatform.trim() && !platforms.includes(customPlatform.trim())) {
      setPlatforms([...platforms, customPlatform.trim()]);
      setCustomPlatform("");
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      alert("Campaign name is required");
      return;
    }

    if (platforms.length === 0) {
      alert("Please select at least one platform");
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "campaigns"), {
        workspaceId,
        name: name.trim(),
        goal,
        offer: offer.trim(),
        audience: audience.trim(),
        platforms,
        messagingPillars: [],
        contentPlan: [],
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push(`/app/campaigns/${docRef.id}`);
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign: " + (error as any).message);
    } finally {
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
          onClick={() => router.back()}
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
           Back
        </button>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
        Create New Campaign
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 32 }}>
        Set up your campaign details, then generate with AI
      </p>

      <div
        style={{
          backgroundColor: "#fff",
          padding: 32,
          borderRadius: 8,
          border: "1px solid #ddd",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            Campaign Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Q1 Product Launch"
            style={{
              width: "100%",
              padding: 12,
              fontSize: 14,
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            Campaign Goal *
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            {(["leads", "sales", "awareness"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  backgroundColor: goal === g ? "#0d6efd" : "#f8f9fa",
                  color: goal === g ? "#fff" : "#000",
                  border: goal === g ? "none" : "1px solid #ddd",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {g === "leads" && " "}
                {g === "sales" && " "}
                {g === "awareness" && " "}
                {g}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            Offer / Value Proposition
          </label>
          <input
            type="text"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="e.g., 50% off first month, Free trial, Exclusive webinar"
            style={{
              width: "100%",
              padding: 12,
              fontSize: 14,
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            Target Audience
          </label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., B2B SaaS founders, Small business owners, Tech enthusiasts"
            style={{
              width: "100%",
              padding: 12,
              fontSize: 14,
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
            Platforms *
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {platformOptions.map((platform) => (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                style={{
                  padding: "10px 12px",
                  backgroundColor: platforms.includes(platform) ? "#28a745" : "#f8f9fa",
                  color: platforms.includes(platform) ? "#fff" : "#000",
                  border: platforms.includes(platform) ? "none" : "1px solid #ddd",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {platforms.includes(platform) && " "}
                {platform}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={customPlatform}
              onChange={(e) => setCustomPlatform(e.target.value)}
              placeholder="Add custom platform"
              onKeyPress={(e) => e.key === "Enter" && addCustomPlatform()}
              style={{
                flex: 1,
                padding: 10,
                fontSize: 14,
                border: "1px solid #ddd",
                borderRadius: 4,
              }}
            />
            <button
              onClick={addCustomPlatform}
              style={{
                padding: "10px 16px",
                backgroundColor: "#0d6efd",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Add
            </button>
          </div>

          {platforms.filter((p) => !platformOptions.includes(p)).length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {platforms
                .filter((p) => !platformOptions.includes(p))
                .map((platform) => (
                  <span
                    key={platform}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#28a745",
                      color: "#fff",
                      borderRadius: 4,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {platform}
                    <button
                      onClick={() => setPlatforms(platforms.filter((p) => p !== platform))}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 16,
                        padding: 0,
                      }}
                    >
                      
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 16,
            backgroundColor: "#f0f8ff",
            borderRadius: 4,
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 14, margin: 0 }}>
            <strong>Next step:</strong> After creating, you'll be able to generate the full
            campaign plan using AI workflows.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 1,
              padding: "14px 24px",
              backgroundColor: submitting ? "#6c757d" : "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {submitting ? "Creating..." : "Create Campaign"}
          </button>
          <button
            onClick={() => router.push("/app/campaigns")}
            disabled={submitting}
            style={{
              padding: "14px 24px",
              backgroundColor: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: 16,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}

