"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { auth, db } from "../../../../lib/firebase";
import { useWorkspace } from "../../../../lib/useWorkspace";

interface WorkflowStep {
  order: number;
  agentType: string;
  instruction: string;
}

interface Template {
  id: string;
  templateKey: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: number;
  status: string;
  steps: WorkflowStep[];
  authorName: string;
  authorUid?: string;
  installCount: number;
  ratingAvg?: number;
  ratingCount?: number;
}

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.templateId as string;
  
  const [user, setUser] = useState<any>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [workspaceMeta, setWorkspaceMeta] = useState<any>(null);
  
  const { currentWorkspaceId, canEdit } = useWorkspace(user);
  
  // Check if user is a founder
  const isFounder = workspaceMeta?.isFounder === true || 
    user?.email === "cambrianenergy@gmail.com" || 
    user?.email === "financialgrowthdfw@gmail.com";

  // Plan/template gating
  const userPlan = (workspaceMeta?.plan || "foundation").toLowerCase();
  const PLAN_TEMPLATE_LIMITS: Record<string, number | "unlimited"> = {
    foundation: 3,
    accelerate: 10,
    dominion: 15,
    sovereign: "unlimited",
  };
  const templateLimit = PLAN_TEMPLATE_LIMITS[userPlan] || 3;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      loadTemplate();
      loadWorkspaceMeta();
    });
    return () => unsub();
  }, [router, templateId, currentWorkspaceId]);
  
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

  async function loadTemplate() {
    try {
      const docRef = doc(db, "workflow_templates", templateId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setTemplate({
          id: docSnap.id,
          ...docSnap.data(),
        } as Template);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading template:", error);
      setLoading(false);
    }
  }

  async function handleInstall() {
    if (!user || !template || !currentWorkspaceId || (!canEdit && !isFounder)) {
      alert("You don't have permission to install templates");
      return;
    }

    // Enforce template limit unless founder or sovereign
    if (!isFounder && templateLimit !== "unlimited" && workspaceMeta?.installedTemplates?.length >= templateLimit) {
      alert(`Your plan includes up to ${templateLimit} templates. Purchase additional templates for $9.99/mo each or upgrade your plan.`);
      return;
    }

    setInstalling(true);

    try {
      // 1. Create new workflow in workspace
      const workflowRef = await addDoc(collection(db, "workflows"), {
        workspaceId: currentWorkspaceId,
        name: template.name,
        description: template.description,
        status: "active",
        steps: template.steps,
        installedFromTemplateId: template.id,
        installedFromTemplateKey: template.templateKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Track install in template_installs
      await addDoc(collection(db, "template_installs"), {
        workspaceId: currentWorkspaceId,
        templateId: template.id,
        templateKey: template.templateKey,
        installedByUid: user.uid,
        installedAt: serverTimestamp(),
        workflowId: workflowRef.id,
      });

      // 3. Increment template install count
      const templateRef = doc(db, "workflow_templates", template.id);
      await updateDoc(templateRef, {
        installCount: increment(1),
      });

      // 4. Redirect to the new workflow
      router.push(`/app/workflows/${workflowRef.id}`);
    } catch (error) {
      console.error("Error installing template:", error);
      alert("Failed to install template. Please try again.");
      setInstalling(false);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>Loading template...</h1>
      </main>
    );
  }

  if (!template) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>Template not found</h1>
        <button
          onClick={() => router.push("/app/marketplace")}
          style={{
            marginTop: 16,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            border: "1px solid #ddd",
            borderRadius: 6,
            backgroundColor: "#fff",
            cursor: "pointer",
          }}
        >
          ← Back to Marketplace
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 18, padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14 }}>
        <b>Plan limits:</b> Foundation: 3 templates, Accelerate: 10, Dominion: 15, Sovereign: unlimited.<br/>
        Additional templates: $9.99/mo each. Upgrade your plan for more included templates.
      </div>
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
            👑 FOUNDER
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#92400e" }}>
            Lifetime Unlimited Access
          </div>
        </div>
      )}
      {/* Back button */}
      <button
        onClick={() => router.push("/app/marketplace")}
        style={{
          marginBottom: 24,
          padding: "8px 16px",
          fontSize: 14,
          fontWeight: 600,
          border: "1px solid #ddd",
          borderRadius: 6,
          backgroundColor: "#fff",
          cursor: "pointer",
        }}
      >
        ← Back to Marketplace
      </button>

      {/* Header */}
      <div
        style={{
          padding: 32,
          backgroundColor: "#f8f9fa",
          borderRadius: 12,
          marginBottom: 32,
        }}
      >
        {/* Category badge */}
        <div
          style={{
            display: "inline-block",
            padding: "6px 16px",
            backgroundColor: "#fff",
            borderRadius: 16,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            textTransform: "capitalize",
          }}
        >
          {template.category}
        </div>

        {/* Template name */}
        <h1
          style={{
            fontSize: 32,
            fontWeight: 900,
            marginBottom: 16,
            lineHeight: 1.2,
          }}
        >
          {template.name}
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 16,
            opacity: 0.75,
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          {template.description}
        </p>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {template.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#e8f4ff",
                  color: "#0070f3",
                  fontSize: 13,
                  borderRadius: 6,
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
            display: "flex",
            gap: 24,
            fontSize: 14,
            opacity: 0.7,
            marginBottom: 24,
          }}
        >
          <span>📦 {template.installCount || 0} installs</span>
          <span>🏷️ v{template.version || 1}</span>
          <span>👤 {template.authorName}</span>
        </div>

        {/* Install button */}
        {canEdit ? (
          <button
            onClick={handleInstall}
            disabled={installing}
            style={{
              padding: "14px 32px",
              fontSize: 16,
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              backgroundColor: installing ? "#ccc" : "#0070f3",
              color: "#fff",
              cursor: installing ? "not-allowed" : "pointer",
            }}
          >
            {installing ? "Installing..." : "🚀 Install to My Workspace"}
          </button>
        ) : (
          <button
            disabled
            style={{
              padding: "14px 32px",
              fontSize: 16,
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              backgroundColor: "#ccc",
              color: "#666",
              cursor: "not-allowed",
            }}
            title="Viewers cannot install templates"
          >
            🚀 Install to My Workspace
          </button>
        )}
      </div>

      {/* Steps section */}
      <div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 16,
          }}
        >
          Workflow Steps ({template.steps?.length || 0})
        </h2>

        {template.steps && template.steps.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {template.steps
              .sort((a, b) => a.order - b.order)
              .map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 20,
                    border: "1px solid #e0e0e0",
                    borderRadius: 10,
                    backgroundColor: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: "#0070f3",
                        color: "#fff",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {step.order}
                    </div>
                    <div
                      style={{
                        padding: "4px 12px",
                        backgroundColor: "#f0f0f0",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {step.agentType}
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      opacity: 0.85,
                      marginLeft: 44,
                    }}
                  >
                    {step.instruction}
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <p style={{ opacity: 0.5, fontStyle: "italic" }}>
            No steps defined for this template
          </p>
        )}
      </div>
    </main>
  );
}
