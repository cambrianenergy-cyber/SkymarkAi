"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { useWorkspace } from "../../../lib/useWorkspace";

interface Template {
  id: string;
  templateKey: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: number;
  status: string;
  installCount: number;
  authorName: string;
}

const TEMPLATE_ACCESS_BY_PLAN: Record<string, number> = {
  accelerate: 3,
  dominion: 7,
  sovereign: 12,
  founder: 999,
};

const TEMPLATE_PRICE = 9.99;
const TEMPLATE_PURCHASE_URL =
  process.env.NEXT_PUBLIC_TEMPLATE_CHECKOUT_URL || "https://pay.skyymarkai.com/templates";

export default function MarketplacePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [workspaceMeta, setWorkspaceMeta] = useState<any>(null);
  
  const { canEdit, currentWorkspace, currentWorkspaceId } = useWorkspace(user);
  
  // Check if user is a founder
  const isFounder = workspaceMeta?.isFounder === true || 
    user?.email === "cambrianenergy@gmail.com" || 
    user?.email === "financialgrowthdfw@gmail.com";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      loadTemplates();
      loadWorkspaceMeta();
    });
    return () => unsub();
  }, [router, currentWorkspaceId]);
  
  async function loadWorkspaceMeta() {
    if (!currentWorkspaceId) return;
    
    try {
      const workspaceRef = doc(db, "workspaces", currentWorkspaceId);
      const workspaceDoc = await getDoc(workspaceRef);
      if (workspaceDoc.exists()) {
        setWorkspaceMeta(workspaceDoc.data());
      }
    } catch (error) {
      console.error("Error loading workspace meta:", error);
    }
  }

  async function loadTemplates() {
    try {
      // Simple query without orderBy to avoid index requirement
      const q = query(
        collection(db, "workflow_templates"),
        where("status", "==", "public")
      );
      
      const snap = await getDocs(q);
      const temps = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Template[];
      
      // Sort client-side by installCount
      temps.sort((a, b) => (b.installCount || 0) - (a.installCount || 0));
      
      console.log("Loaded templates:", temps.length, temps);
      
      setTemplates(temps);
      setFilteredTemplates(temps);
      setLoading(false);
    } catch (error) {
      console.error("Error loading templates:", error);
      alert("Error loading templates. Check console for details.");
      setLoading(false);
    }
  }

  useEffect(() => {
    // Client-side filtering
    let filtered = templates;
    
    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredTemplates(filtered);
  }, [searchQuery, categoryFilter, templates]);

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>Loading marketplace...</h1>
      </main>
    );
  }

  const plan = (currentWorkspace?.plan || "accelerate").toLowerCase();
  const unlockedLimit = TEMPLATE_ACCESS_BY_PLAN[plan] ?? TEMPLATE_ACCESS_BY_PLAN.accelerate;
  const readablePlan = plan.charAt(0).toUpperCase() + plan.slice(1);
  const priceLabel = `$${TEMPLATE_PRICE.toFixed(2)}`;

  const categories = [
    "all",
    "campaigns",
    "repurpose",
    "inbox",
    "leads",
    "ads",
    "analytics",
    "creation",
    "growth",
  ];

  return (
    <main
      style={{
        padding: "32px 24px 56px",
        maxWidth: 1300,
        margin: "0 auto",
        background: "radial-gradient(circle at 10% 20%, #e0f2fe 0, #f5f7ff 32%, #ffffff 70%)",
        borderRadius: 24,
        boxShadow: "0 24px 80px rgba(15, 23, 42, 0.08)",
      }}
    >
      {isFounder && (
        <div
          style={{
            marginBottom: 20,
            padding: "16px 24px",
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            borderRadius: 12,
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(251, 191, 36, 0.3)",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, color: "#78350f", marginBottom: 4 }}>
             FOUNDER
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#92400e" }}>
            Lifetime Unlimited Access
          </div>
        </div>
      )}
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
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
        <div style={{ fontSize: 12, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {readablePlan} plan  {unlockedLimit} templates included
        </div>
      </div>
      {/* Header */}
      <div
        style={{
          marginBottom: 32,
          padding: "20px 20px 18px",
          borderRadius: 16,
          background: "linear-gradient(120deg, #0ea5e9 0%, #6366f1 60%, #8b5cf6 100%)",
          color: "#fff",
          boxShadow: "0 18px 50px rgba(14, 165, 233, 0.25)",
        }}
      >
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 6 }}>
           Workflow Marketplace
        </h1>
        <p style={{ fontSize: 16, opacity: 0.9 }}>
          Browse, preview, and install pre-built workflow templates. {readablePlan} plan includes {unlockedLimit} templates; additional templates are {priceLabel} each.
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 32,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 250,
            padding: "10px 16px",
            fontSize: 14,
            border: "1px solid #ddd",
            borderRadius: 6,
          }}
        />
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "10px 16px",
            fontSize: 14,
            border: "1px solid #ddd",
            borderRadius: 6,
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Template count */}
      <p style={{ marginBottom: 16, fontSize: 14, opacity: 0.75 }}>
        Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}  {readablePlan} plan includes {unlockedLimit}; locked templates are {priceLabel} each.
      </p>

      {/* Templates grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: 24,
        }}
      >
        {filteredTemplates.map((template, index) => {
          const isLocked = !isFounder && index >= unlockedLimit;
          const canInstall = canEdit && !isLocked;

          return (
          <div
            key={template.id}
            style={{
              padding: 24,
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              backgroundColor: "#ffffff",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
              transition: "all 0.2s",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              opacity: isLocked ? 0.92 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Category badge + lock */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  backgroundColor: "#eef2ff",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "capitalize",
                  color: "#3730a3",
                }}
              >
                {template.category}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: 999,
                  backgroundColor: isLocked ? "#fef2f2" : "#ecfeff",
                  color: isLocked ? "#b91c1c" : "#0f172a",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                }}
              >
                {isLocked ? " Locked" : " Included"}
              </div>
            </div>

            {/* Template name */}
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              {template.name}
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: 14,
                opacity: 0.75,
                marginBottom: 12,
                lineHeight: 1.5,
                minHeight: 60,
              }}
            >
              {template.description}
            </p>

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {template.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "2px 8px",
                      backgroundColor: "#e8f4ff",
                      color: "#0070f3",
                      fontSize: 11,
                      borderRadius: 4,
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div
              style={{
                fontSize: 12,
                opacity: 0.6,
                marginBottom: 16,
                display: "flex",
                gap: 12,
              }}
            >
              <span> {template.installCount || 0} installs</span>
              <span>v{template.version || 1}</span>
              <span>{isLocked ? `${priceLabel}  Buy to unlock` : "Included in plan"}</span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => router.push(`/app/marketplace/${template.id}`)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 700,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  backgroundColor: "#f8fafc",
                  color: "#0f172a",
                  cursor: "pointer",
                }}
              >
                View Details
              </button>

              {isLocked ? (
                <button
                  onClick={() => window.open(TEMPLATE_PURCHASE_URL, "_blank", "noopener")}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 800,
                    border: "none",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #fb7185 0%, #f97316 100%)",
                    color: "#fff",
                    cursor: "pointer",
                    boxShadow: "0 10px 20px rgba(249, 115, 22, 0.25)",
                  }}
                >
                  Buy for {priceLabel}
                </button>
              ) : canInstall ? (
                <button
                  onClick={() => router.push(`/app/marketplace/${template.id}`)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 800,
                    border: "none",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                    color: "#fff",
                    cursor: "pointer",
                    boxShadow: "0 10px 20px rgba(34, 197, 94, 0.25)",
                  }}
                >
                  Install
                </button>
              ) : (
                <button
                  disabled
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 700,
                    border: "none",
                    borderRadius: 8,
                    backgroundColor: "#e2e8f0",
                    color: "#94a3b8",
                    cursor: "not-allowed",
                  }}
                  title="Viewers cannot install templates"
                >
                  Install
                </button>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            opacity: 0.5,
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            No templates found
          </p>
          <p style={{ fontSize: 14 }}>
            Try adjusting your search or category filter
          </p>
        </div>
      )}
    </main>
  );
}

