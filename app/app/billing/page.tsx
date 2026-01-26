"use client";

import { useEffect, useState } from "react";
import type { AgentType } from "../../../lib/types/agent";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { useWorkspace } from "../../../lib/useWorkspace";

const PLANS = [
  {
    name: "Foundation",
    price: 299,
    priceId: "price_1Si6QcD1fGCDD9ZESHeYpTdE",
    subtitle: 'Solid Start for Small Teams',
    description: "Launch your automation journey with essential AI agents and workflows.",
    agentCount: "3 Agents",
    agents: [
      "Copywriter  Posts, captions, ads, CTAs",
      "Content Creator  Multi-platform content",
      "Scheduler & Publisher  Posting cadence & timing",
    ],
    features: [
      "3 AI Agents Included",
      "100 Workflow Runs/month",
      "3 Templates Installed",
      "2 Team Members",
      "Email Support",
    ],
    canDo: ["Create content", "Post content", "Basic automation"],
    cantDo: ["Advanced analytics", "Campaign planning", "White label", "Unlimited templates"],
  },
  {
    name: "Accelerate",
    price: 499,
    priceId: "price_1Si5H5D1fGCDD9ZECDN8C8fI",
    subtitle: 'Growth & Collaboration',
    description: "Expand your team, unlock more agents, and access live chat support.",
    agentCount: "4 Agents",
    agents: [
      "Copywriter  Posts, captions, ads, CTAs",
      "Content Creator  Multi-platform content",
      "Scheduler & Publisher  Posting cadence & timing",
      "Campaign Director  Strategic planning",
    ],
    features: [
      "4 AI Agents Included",
      "200 Workflow Runs/month",
      "10 Templates Installed",
      "Up to 10 Team Members",
      "Live Chat Agent Access",
      "Campaign-level Planning",
    ],
    canDo: ["Campaign planning", "Trend analysis", "Performance optimization", "Brand consistency", "Live chat support"],
    cantDo: ["White label", "Unlimited templates"],
    popular: true,
  },
  {
    name: "Dominion",
    price: 999,
    priceId: "price_1Si53pD1fGCDD9ZEeRvd2RGK",
    subtitle: 'Enterprise Automation',
    description: "Unlock advanced automation, white label, and large team collaboration.",
    agentCount: "5 Agents",
    agents: [
      "Copywriter  Posts, captions, ads, CTAs",
      "Content Creator  Multi-platform content",
      "Scheduler & Publisher  Posting cadence & timing",
      "Campaign Director  Strategic planning",
      "Trend Hunter  Viral angles & hooks",
    ],
    features: [
      "5 AI Agents Included",
      "500 Workflow Runs/month",
      "15 Templates Installed",
      "Up to 50 Team Members",
      "White Label Options",
      "Dedicated Support",
    ],
    canDo: ["Marketing at scale", "Client delivery engine", "Revenue automation", "Full intelligence", "White label"],
    cantDo: ["Unlimited templates"],
  },
  {
    name: "Sovereign",
    price: 1999,
    priceId: "price_1Si52gD1fGCDD9ZEvTgdWidW",
    subtitle: 'Unlimited Power & Scale',
    description: "The ultimate plan for large organizations and agencies needing unlimited scale.",
    agentCount: "6 Agents",
    agents: [
      "Copywriter  Posts, captions, ads, CTAs",
      "Content Creator  Multi-platform content",
      "Scheduler & Publisher  Posting cadence & timing",
      "Campaign Director  Strategic planning",
      "Trend Hunter  Viral angles & hooks",
      "Competitor Watchdog  Competitive intel",
    ],
    features: [
      "6 AI Agents Included",
      "1500 Workflow Runs/month",
      "Unlimited Templates Installed",
      "Up to 150 Team Members",
      "Unlimited Support",
      "Custom Integrations"
    ],
    canDo: ["Unlimited scale", "Unlimited templates", "Full automation", "Custom integrations"],
    cantDo: [],
  },
];


// Dynamically generate agent options from AgentType union
const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  campaign_director: "Campaign Director",
  trend_hunter: "Trend Hunter",
  competitor_watchdog: "Competitor Watchdog",
  copywriter: "Copywriter",
  visual_designer: "Visual Designer",
  video_producer: "Video Producer",
  scheduler_publisher: "Scheduler & Publisher",
  community_manager: "Community Manager",
  analytics_analyst: "Analytics Analyst",
  brand_voice_guardian: "Brand Voice Guardian",
  hashtag_seo_optimizer: "Hashtag/SEO Optimizer",
  repurpose_engine: "Repurpose Engine",
  lead_scoring_followup: "Lead Scoring & Followup",
  unified_inbox_triage: "Unified Inbox Triage",
  paid_ads_strategist: "Paid Ads Strategist",
  offer_funnel_architect: "Offer/Funnel Architect",
  email_sms_nurture: "Email/SMS Nurture",
  conversion_optimizer: "Conversion Optimizer",
  qa_compliance_checker: "QA/Compliance Checker",
  fact_checker_light: "Fact Checker (Light)",
  workflow_builder: "Workflow Builder",
  analytics_to_action: "Analytics to Action",
  client_reporting: "Client Reporting",
  hook_generator: "Hook Generator",
  shotlist_broll_planner: "Shotlist/B-Roll Planner",
  thumbnail_title_optimizer: "Thumbnail/Title Optimizer",
};

const ALL_AGENT_TYPES = Object.keys(AGENT_TYPE_LABELS) as AgentType[];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const agentTypeParam = searchParams?.get("agentType");
  const agentPriceParam = searchParams?.get("price");
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [workspaceMeta, setWorkspaceMeta] = useState<any>(null);
  const [workflowRunsQuantity, setWorkflowRunsQuantity] = useState<number>(1);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  // Agent-specific pricing
  const AGENT_PRICES: Partial<Record<AgentType, number>> = {
    copywriter: 99,
    scheduler_publisher: 99,
    campaign_director: 149, // Specialty agent
    trend_hunter: 119, // Specialty agent
    competitor_watchdog: 109, // Specialty agent
    visual_designer: 99,
    video_producer: 99,
    community_manager: 99,
    analytics_analyst: 99,
    brand_voice_guardian: 99,
    hashtag_seo_optimizer: 99,
    repurpose_engine: 99,
    lead_scoring_followup: 99,
    unified_inbox_triage: 99,
    paid_ads_strategist: 149, // Specialty agent
    offer_funnel_architect: 129, // Specialty agent
    email_sms_nurture: 99,
    conversion_optimizer: 99,
    qa_compliance_checker: 99,
    fact_checker_light: 99,
    workflow_builder: 99,
    analytics_to_action: 99,
    client_reporting: 99,
    hook_generator: 99,
    shotlist_broll_planner: 99,
    thumbnail_title_optimizer: 99,
  };

  const { currentWorkspaceId, isOwner } = useWorkspace(user);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      loadBillingInfo();
    });
    return () => unsub();
  }, [router, currentWorkspaceId]);


  useEffect(() => {
    if (agentTypeParam) {
      const found = ALL_AGENT_TYPES.find(a => a === agentTypeParam);
      if (found) setSelectedAgent(found);
    }
  }, [agentTypeParam]);

  async function loadBillingInfo() {
    if (!currentWorkspaceId) {
      setLoading(false);
      return;
    }

    try {
      const billingRef = doc(db, "workspace_billing", currentWorkspaceId);
      const billingSnap = await getDoc(billingRef);

      if (billingSnap.exists()) {
        const data = billingSnap.data();
        setBillingInfo(data);
        setCurrentPlan(data.plan || "free");
      } else {
        setCurrentPlan("free");
      }

      const wsRef = doc(db, "workspaces", currentWorkspaceId);
      const wsSnap = await getDoc(wsRef);
      if (wsSnap.exists()) {
        setWorkspaceMeta(wsSnap.data());
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading billing:", error);
      setLoading(false);
    }
  }

  async function handleUpgrade(priceId: string, planName: string) {
    if (!currentWorkspaceId || !isOwner) {
      alert("Only workspace owners can upgrade plans");
      return;
    }

    setUpgrading(priceId);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          workspaceId: currentWorkspaceId,
          plan: planName.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(error.message || "Failed to start checkout");
      setUpgrading(null);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>Loading billing...</h1>
      </main>
    );
  }

  const hasFounderAccess = workspaceMeta?.isFounder === true || 
    user?.email === "cambrianenergy@gmail.com" || 
    user?.email === "financialgrowthdfw@gmail.com";
  const hasFullAccess = hasFounderAccess;


  // Compute available add-on agents (not included in current plan)
  const currentPlanObj = PLANS.find((p: any) => p.name.toLowerCase() === currentPlan.toLowerCase());
  const includedAgentLabels = (currentPlanObj?.agents || []).map((a: string) => a.split('  ')[0].trim());
  const availableAddOnAgents = ALL_AGENT_TYPES.filter(
    (agentType) => !includedAgentLabels.includes(AGENT_TYPE_LABELS[agentType])
  );

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {hasFullAccess && (
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
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "8px 14px",
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



      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <div style={{ margin: "32px 0" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Want to add an agent?</h2>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
            <select
              id="agent-dropdown"
              style={{ padding: "12px 18px", fontSize: 16, borderRadius: 8, border: "1px solid #ccc", minWidth: 220 }}
              value={selectedAgent || ''}
              onChange={e => {
                const found = e.target.value as AgentType;
                setSelectedAgent(found || null);
              }}
            >
              <option value="">Select an agent...</option>
              {availableAddOnAgents.map((agentType) => (
                <option key={agentType} value={agentType}>{AGENT_TYPE_LABELS[agentType]}</option>
              ))}
            </select>
            <button
              style={{
                padding: "14px 32px",
                fontSize: 18,
                fontWeight: 700,
                border: "none",
                borderRadius: 10,
                backgroundColor: selectedAgent ? "#0070f3" : "#ccc",
                color: "#fff",
                cursor: selectedAgent ? "pointer" : "not-allowed",
                boxShadow: "0 4px 16px rgba(0,112,243,0.15)",
                transition: "all 0.2s",
              }}
              disabled={!selectedAgent}
              onClick={() => {
                if (selectedAgent) router.push(`/app/billing?agentType=${selectedAgent}`);
              }}
            >
              Add Selected Agent
            </button>
          </div>
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, marginBottom: 12 }}>
          Choose Your Plan
        </h1>
        <p style={{ fontSize: 18, opacity: 0.7 }}>
          Current Plan: <strong style={{ textTransform: "capitalize" }}>{currentPlan}</strong>
        </p>
        <p style={{ fontSize: 14, color: "#444", marginTop: 8 }}>
           Accelerate includes 2 base agents ($499/mo), Dominion 4 base agents ($999/mo), Sovereign 6 base agents ($1,999/mo).<br/>
           Each plan has specific workflow limits and team member seats. Specialty agents available for $49-$129/mo each. Packs available: Sales Automation ($99), Marketing Intelligence ($149), Agency ($299). See below for details.
        </p>
        {hasFullAccess && (
           <p style={{ fontSize: 13, color: "#0f9d58", marginTop: 6, fontWeight: 700 }}>
             Full access enabled: all agents and templates are unlocked for your workspace.
           </p>
        )}
        {!isOwner && (
          <p style={{ fontSize: 14, color: "#ff6b35", marginTop: 8 }}>
             Only workspace owners can change billing plans
          </p>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: 32,
          marginBottom: 48,
        }}
      >
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan.toLowerCase() === plan.name.toLowerCase();
          const priceId = typeof plan.priceId === 'string' ? plan.priceId : '';
          return (
            <div key={priceId || plan.name} style={{ /* ...existing styles... */ }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 16px", backgroundColor: "#0070f3", color: "#fff", fontSize: 12, fontWeight: 700, borderRadius: 12 }}>Uqentra AI Product</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{plan.name}</h3>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#0070f3", marginBottom: 4 }}>{plan.subtitle}</p>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>{plan.description}</p>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 48, fontWeight: 900 }}>${plan.price}</span>
                <span style={{ fontSize: 18, opacity: 0.6 }}>/month</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0070f3", marginTop: 4 }}>{plan.agentCount}</div>
              </div>
              {/* ...agents/features/canDo/cantDo as above... */}
              {/* All product plan buttons now say 'Buy Now' and redirect to card info entry page. */}
              <button
                onClick={() => {
                  if (isOwner && !upgrading) {
                    // Pass plan and priceId as query params for card entry page
                    router.push(`/app/billing/card-entry?plan=${encodeURIComponent(plan.name)}&priceId=${encodeURIComponent(priceId)}`);
                  }
                }}
                disabled={!isOwner || upgrading === priceId}
                style={{ width: "100%", padding: "14px 24px", fontSize: 16, fontWeight: 700, border: "none", borderRadius: 8, backgroundColor: upgrading === priceId ? "#ccc" : plan.popular ? "#0070f3" : "#333", color: "#fff", cursor: !isOwner || upgrading === priceId ? "not-allowed" : "pointer", transition: "all 0.2s" }}
              >
                {upgrading === priceId ? "Redirecting..." : "Buy Now"}
              </button>
            </div>
          );
        })}
      </div>

      {billingInfo && (
        <div
          style={{
            padding: 24,
            backgroundColor: "#f8f9fa",
            borderRadius: 12,
            marginTop: 32,
          }}
        >
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Billing Information</h3>
          <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
            <div>
              <strong>Status:</strong> <span style={{ textTransform: "capitalize" }}>{billingInfo.status || "active"}</span>
            </div>
            <div>
              <strong>Subscription ID:</strong> {billingInfo.stripeSubscriptionId || "N/A"}
            </div>
            {billingInfo.currentPeriodEnd && (
              <div>
                <strong>Next Billing Date:</strong> {new Date(billingInfo.currentPeriodEnd.seconds * 1000).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 64 }}>
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Premium Add-On Agents & Templates</h2>
          <p style={{ fontSize: 16, opacity: 0.7, maxWidth: 600, margin: "0 auto" }}>
            Enhance your plan with specialized AI agents and install additional workflow templates as needed.<br/>
            <b>All add-on agent prices are monthly recurring and will be billed each month.</b><br/>
            Templates beyond your plan: $9.99/mo each. Fully Automated Content Creator: $129/mo. Other agents: see pricing below.<br/>
            {hasFullAccess && (
              <span style={{ display: "block", marginTop: 6, color: "#0f9d58", fontWeight: 700 }}>
                Full access: all add-on agents and templates are already unlocked for you.
              </span>
            )}
          </p>
        </div>

        {selectedAgent ? (
          <div style={{ maxWidth: 500, margin: "0 auto", padding: 32, border: "2px solid #0070f3", borderRadius: 16, background: "#f8f9ff", boxShadow: "0 8px 24px rgba(0,112,243,0.10)", marginBottom: 48 }}>
            <h4 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{AGENT_TYPE_LABELS[selectedAgent]}</h4>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 32, fontWeight: 900 }}>${AGENT_PRICES[selectedAgent] || 99}</span>
              <span style={{ fontSize: 13, opacity: 0.6 }}>/month</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: 16, fontSize: 14 }}>
              <li>Feature 1 for {AGENT_TYPE_LABELS[selectedAgent]}</li>
              <li>Feature 2 for {AGENT_TYPE_LABELS[selectedAgent]}</li>
              <li>Feature 3 for {AGENT_TYPE_LABELS[selectedAgent]}</li>
            </ul>
            <button
              disabled={!isOwner || hasFullAccess}
              style={{
                width: "100%",
                padding: "12px 20px",
                fontSize: 16,
                fontWeight: 700,
                border: "none",
                borderRadius: 8,
                backgroundColor: !isOwner || hasFullAccess ? "#ccc" : "#0070f3",
                color: "#fff",
                cursor: !isOwner || hasFullAccess ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                marginTop: 12,
              }}
              onClick={() => {
                if (!isOwner || hasFullAccess) return;
                // Redirect to card entry page with agent and price
                router.push(`/app/billing/card-entry?agentType=${encodeURIComponent(selectedAgent)}&price=${encodeURIComponent(AGENT_PRICES[selectedAgent] || 99)}`);
              }}
              onMouseEnter={(e) => {
                if (isOwner && !hasFullAccess) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {!isOwner ? "Owner Only" : hasFullAccess ? "Included with Access" : `Buy Now`}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
              marginTop: 32,
            }}
          >
            {availableAddOnAgents.map((agentType) => (
              <div
                key={agentType}
                style={{
                  padding: 24,
                  border: "1px solid #e0e0e0",
                  borderRadius: 12,
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  transition: "all 0.3s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,112,243,0.15)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{AGENT_TYPE_LABELS[agentType]}</h4>
                <div style={{ marginBottom: 16 }}>
                  {hasFullAccess ? (
                    <div
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        backgroundColor: "#e6f4ea",
                        color: "#0f9d58",
                        fontWeight: 800,
                        textAlign: "center",
                        border: "1px solid #c3e6cb",
                      }}
                    >
                       Included via Full Access
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: 32, fontWeight: 900 }}>$99</span>
                      <span style={{ fontSize: 13, opacity: 0.6 }}>/month (example)</span>
                    </>
                  )}
                </div>
                <ul style={{ listStyle: "none", padding: 0, marginBottom: 16, fontSize: 13 }}>
                  <li>Feature 1 for {AGENT_TYPE_LABELS[agentType]}</li>
                  <li>Feature 2 for {AGENT_TYPE_LABELS[agentType]}</li>
                  <li>Feature 3 for {AGENT_TYPE_LABELS[agentType]}</li>
                </ul>
                <button
                  disabled={!isOwner || hasFullAccess}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    border: "none",
                    borderRadius: 6,
                    backgroundColor: !isOwner || hasFullAccess ? "#ccc" : "#0070f3",
                    color: "#fff",
                    cursor: !isOwner || hasFullAccess ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                  onClick={() => {
                    if (!isOwner || hasFullAccess) return;
                    alert(`Checkout flow for ${AGENT_TYPE_LABELS[agentType]} ($99/month, billed monthly) coming soon.`);
                  }}
                  onMouseEnter={(e) => {
                    if (isOwner && !hasFullAccess) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {!isOwner ? "Owner Only" : hasFullAccess ? "Included with Access" : `Purchase ${AGENT_TYPE_LABELS[agentType]}`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 64 }}>
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Purchase Additional Workflow Runs</h2>
          <p style={{ fontSize: 16, opacity: 0.7, maxWidth: 600, margin: "0 auto" }}>
            Need more workflow runs per month? Purchase additional runs in increments of 100.
            <span style={{ display: "block", marginTop: 8, color: "#0070f3", fontWeight: 600 }}>
              $39 per 100 additional runs/month
            </span>
          </p>
        </div>

        <div
          style={{
            maxWidth: 500,
            margin: "0 auto",
            padding: 32,
            border: "1px solid #e0e0e0",
            borderRadius: 12,
            backgroundColor: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="workflow-runs"
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 8,
                color: "#333",
              }}
            >
              Number of 100-run increments
            </label>
            <input
              id="workflow-runs"
              type="number"
              min="1"
              step="1"
              value={workflowRunsQuantity}
              onChange={(e) => setWorkflowRunsQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: 16,
                border: "1px solid #d0d0d0",
                borderRadius: 8,
                outline: "none",
              }}
            />
            <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>
              {workflowRunsQuantity}  100 runs = {workflowRunsQuantity * 100} additional runs/month
            </p>
          </div>

          <div
            style={{
              padding: 16,
              backgroundColor: "#f8f9fa",
              borderRadius: 8,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>Total Cost</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#333" }}>
              ${workflowRunsQuantity * 39}
              <span style={{ fontSize: 16, fontWeight: 400, color: "#666" }}>/month</span>
            </div>
          </div>

          <button
            disabled={!isOwner}
            style={{
              width: "100%",
              padding: "14px 24px",
              fontSize: 16,
              fontWeight: 700,
              border: "none",
              borderRadius: 8,
              backgroundColor: !isOwner ? "#ccc" : "#0070f3",
              color: "#fff",
              cursor: !isOwner ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
            onClick={() => {
              if (!isOwner) return;
              alert(`Checkout flow for ${workflowRunsQuantity * 100} additional workflow runs ($${workflowRunsQuantity * 39}/month) coming soon.`);
            }}
            onMouseEnter={(e) => {
              if (isOwner) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {!isOwner ? "Owner Only" : "Purchase Workflow Runs"}
          </button>
        </div>
      </div>
    </main>
  );
}

