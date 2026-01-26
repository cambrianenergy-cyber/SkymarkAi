"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { WorkspaceSwitcher } from "../../components/WorkspaceSwitcher";
import { useAuthWorkspaceGuard, GuardLoadingScreen } from "../../lib/useAuthWorkspaceGuard";
import InsightDropCard from "@/components/InsightDropCard";
import ConstraintAlert from "@/components/ConstraintAlert";
import { FounderBadge } from "@/components/FounderBadge";
import { useFounderStatus } from "@/lib/useFounderStatus";
import AgentActivityLog from "../../components/AgentActivityLog";

// Workspace IDs
const WORKSPACE_IDS = ["NtabEfcWZHdcKSsWi4fN", "zwiBq3zuMCylPk7kP05H", "r2jTIxIRLsq1ErL7fRR2"];

export default function AppHome() {
  const router = useRouter();
  const { user, workspaceId, isReady, isAuthorized } = useAuthWorkspaceGuard();
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { isFounder } = useFounderStatus(user, workspaceId);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthorized || !workspaceId || !user) return;
    (async () => {
      setLoading(true);

      // 1) Ensure user doc exists (users/{uid})
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email?.toLowerCase() ?? "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          userRef,
          { updatedAt: serverTimestamp() },
          { merge: true }
        );
      }
      setLoading(false);
    })();
  }, [isReady, isAuthorized, workspaceId, user]);

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>Loading workspace</h1>
        <p style={{ marginTop: 8, opacity: 0.75 }}>
          Creating your company profile if this is your first login.
        </p>
      </main>
    );
  }

  const navItems = [
    { icon: "", label: "Prove It", path: "/app/prove-it", category: "Observability" },
    { icon: "", label: "Outcomes", path: "/app/outcomes", category: "Strategy" },
    { icon: "", label: "Attribution", path: "/app/attribution", category: "Strategy" },
    { icon: "", label: "Reports", path: "/app/reports", category: "Strategy" },
    { icon: "", label: "Playbooks", path: "/app/playbooks", category: "Strategy" },
    { icon: "", label: "Inbox", path: "/app/inbox", category: "Communication" },
    { icon: "", label: "Leads", path: "/app/leads", category: "Communication" },
    { icon: "", label: "Follow-ups", path: "/app/followups", category: "Communication" },
    { icon: "", label: "Queue", path: "/app/queue", category: "Communication" },
    { icon: "", label: "Campaigns", path: "/app/campaigns", category: "Marketing" },
    { icon: "", label: "Content Assets", path: "/app/assets", category: "Marketing" },
    { icon: "", label: "Schedule", path: "/app/schedule", category: "Marketing" },
    { icon: "", label: "Agents", path: "/app/agents", category: "Automation" },
    { icon: "", label: "Workflows", path: "/app/workflows", category: "Automation" },
    { icon: "", label: "Run", path: "/app/run", category: "Automation" },
    { icon: "", label: "Marketplace", path: "/app/marketplace", category: "Settings" },
    { icon: "", label: "Operations Manual", path: "/app/manual", category: "Settings" },
    { icon: "", label: "Team", path: "/app/team", category: "Settings" },
    { icon: "", label: "Workspaces", path: "/app/workspaces", category: "Settings" },
    { icon: "", label: "Billing", path: "/app/billing", category: "Settings" },
    // Founder-only manual link
    ...(isFounder ? [{ icon: "", label: "Founder's Manual", path: "/app/founder-manual", category: "Settings" }] : []),
  ];

  const categories = ["Observability", "Strategy", "Communication", "Marketing", "Automation", "Settings"];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f7fa", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ 
        width: 220, 
        backgroundColor: "#1a1d29", 
        color: "#fff", 
        padding: "0 0 0 0",
        position: "fixed",
        height: "100vh",
        overflowY: "auto",
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        zIndex: 10,
        top: 0
      }}>
        <div style={{ padding: "12px 12px 8px 12px", marginBottom: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#fff" }}>Uqentra AI</h2>
          <p style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>Workspace: {workspaceId?.slice(0, 8)}...</p>
        </div>

        {categories.map((category) => (
          <div key={category} style={{ marginBottom: 12 }}>
            <div style={{ 
              padding: "0 12px", 
              fontSize: 9, 
              fontWeight: 700, 
              textTransform: "uppercase", 
              letterSpacing: "0.5px",
              opacity: 0.5,
              marginBottom: 4
            }}>
              {category}
            </div>
            {navItems
              .filter((item) => item.category === category)
              .map((item) => (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  style={{
                    width: "100%",
                    padding: "7px 12px",
                    backgroundColor: "transparent",
                    color: "#fff",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.paddingLeft = "16px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.paddingLeft = "12px";
                  }}
                >
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: 260, flex: 1, padding: 32, position: "relative", height: "100vh", overflowY: "auto" }}>
        {isFounder && <FounderBadge />}
        {logoUrl ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${logoUrl})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "contain",
              opacity: 0.08,
              filter: "grayscale(1)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        ) : null}

        {/* Owner's Manual & Onboarding Checklist for Owners */}
        {isFounder && (
          <div style={{
            backgroundColor: "#e3f2fd",
            border: "2px solid #1976d2",
            borderRadius: 14,
            padding: 28,
            marginBottom: 28,
            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
            display: 'flex',
            alignItems: 'flex-start',
            gap: 32
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1565c0', margin: 0 }}>Getting Started: Step-by-Step</h2>
              <ol style={{ color: '#263238', fontSize: 15, margin: '12px 0 0 0', paddingLeft: 20 }}>
                <li><b>First Login:</b> Take 5 minutes to orient yourself. <span title="Find Workspaces, Agents, Workflows, Inbox, Billing."></span></li>
                <li><b>Confirm Plan & Limits:</b> Check your plan before adding agents or templates. <span title="Your plan determines what you can enable."></span></li>
                <li><b>Create Workspace:</b> Use your real business name. Treat as production, not a sandbox.</li>
                <li><b>Configure Workspace:</b> Set brand, description, voice, timezone, and execution windows.</li>
                <li><b>Connect Channels:</b> Integrate one inbound and one outbound channel. Test before proceeding.</li>
                <li><b>Enable Core Agents:</b> Start with Lead Conversion, Content Writer, and Scheduler only.</li>
                <li><b>Activate Templates:</b> Use 1-3 basic templates (lead conversion, content, scheduling).</li>
                <li><b>Run Golden Test:</b> <span style={{ color: '#1976d2', fontWeight: 600 }}>Required!</span> Manually trigger a workflow, watch each step, and confirm output/logs.</li>
                <li><b>Review Logs:</b> Check workflow run history and agent activity. If you can't see what happened, do not proceed.</li>
                <li><b>Make One Adjustment:</b> Change a template or schedule, then re-run the workflow to see the effect.</li>
                <li><b>Establish Weekly Rhythm:</b> Review runs weekly, not constantly. Trust the system once verified.</li>
                <li><b>Add More Only When Ready:</b> Expand agents/templates only after consistent proof.</li>
              </ol>
              <div style={{ marginTop: 16, color: '#b91c1c', fontWeight: 600 }}>
                <span> Avoid common mistakes: Dont enable everything at once. Dont ignore logs. Dont treat automation as fire and forget.</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1976d2', marginBottom: 10 }}>Golden Test Workflow</h3>
              <p style={{ fontSize: 15, color: '#263238', marginBottom: 8 }}>
                <b>Before scaling, you must run the Golden Test:</b>
                <ul style={{ margin: '8px 0 0 18px', color: '#263238', fontSize: 15 }}>
                  <li>Choose a simple workflow template</li>
                  <li>Manually trigger the workflow</li>
                  <li>Watch each step complete</li>
                  <li>Confirm output appears in the channel</li>
                  <li>Review the workflow run log</li>
                </ul>
                <span style={{ color: '#1976d2', fontWeight: 600 }}>If all steps succeed, your system is operational!</span>
              </p>
              <a href="/app/workflows" style={{
                display: 'inline-block',
                background: '#1976d2',
                color: '#fff',
                padding: '10px 22px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
                marginBottom: 8
              }}>Go to Workflows</a>
            </div>
          </div>
        )}

        {/* Welcome and workspace summary */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 32,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: 24,
          position: "relative",
          zIndex: 1
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: "#1a1d29" }}>Welcome Back!</h1>
                <p style={{ marginTop: 8, color: "#6b7280", fontSize: 16 }}>
                  Here's what's happening with your workspace today.
                </p>
              </div>
            </div>
          </div>
        </div>

        {workspaceId && <ConstraintAlert workspaceId={workspaceId} />}
        {/* Agent & Workflow Activity Log for Owners */}
        {isFounder && workspaceId && (
          <AgentActivityLog workspaceId={workspaceId} />
        )}
        <InsightDropCard context="dashboard" />
        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          <div style={{ 
            backgroundColor: "#fff", 
            borderRadius: 12, 
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            borderLeft: "4px solid #0070f3"
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}></div>
            <h3 style={{ fontSize: 14, color: "#6b7280", margin: 0, fontWeight: 500 }}>Inbox Messages</h3>
            <p style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 0 0", color: "#1a1d29" }}>0</p>
          </div>

          <div style={{ 
            backgroundColor: "#fff", 
            borderRadius: 12, 
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            borderLeft: "4px solid #28a745"
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}></div>
            <h3 style={{ fontSize: 14, color: "#6b7280", margin: 0, fontWeight: 500 }}>Active Leads</h3>
            <p style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 0 0", color: "#1a1d29" }}>0</p>
          </div>

          <div style={{ 
            backgroundColor: "#fff", 
            borderRadius: 12, 
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            borderLeft: "4px solid #17a2b8"
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}></div>
            <h3 style={{ fontSize: 14, color: "#6b7280", margin: 0, fontWeight: 500 }}>Active Workflows</h3>
            <p style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 0 0", color: "#1a1d29" }}>0</p>
          </div>

          <div style={{ 
            backgroundColor: "#fff", 
            borderRadius: 12, 
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            borderLeft: "4px solid #ffc107"
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}></div>
            <h3 style={{ fontSize: 14, color: "#6b7280", margin: 0, fontWeight: 500 }}>Scheduled Posts</h3>
            <p style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 0 0", color: "#1a1d29" }}>0</p>
          </div>

        </div>
      </main>
    </div>
  );
}

