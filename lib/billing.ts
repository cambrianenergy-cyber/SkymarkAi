import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface PlanLimits {
  activeAgents: number;
  workflowRuns: number;
  templateInstalls: number;
  seats: number;
  allowedAgentTypes?: string[];
}

export interface BillingInfo {
  plan: string;
  status: string;
  limits: PlanLimits;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: any;
}

//  ACCELERATE PLAN AGENTS - "Get It Done" AI (Execution)
const ACCELERATE_AGENTS = [
  "Copywriter",
  "Content_Creator", // Visual Designer role
  "Scheduling_Master", // Scheduler/Publisher
];

//  DOMINION PLAN AGENTS - "Grow Smarter" AI (Strategy + Optimization)
const DOMINION_AGENTS = [
  ...ACCELERATE_AGENTS,
  "Campaign_Director",
  "Trend_Hunter",
  "Competitor_Watchdog",
  "Engagement_Analyst", // Analytics Analyst
  "Brand_Voice_Guardian",
  "Hashtag_SEO",
  "Algorithm_Hunter",
];

//  SOVEREIGN PLAN AGENTS - "Scale & Automate" AI (Full Suite)
const SOVEREIGN_AGENTS = [
  ...DOMINION_AGENTS,
  // Additional automation & scale agents
  // Note: Some agents mentioned in the plan may need to be created
];

const DEFAULT_LIMITS: PlanLimits = {
  activeAgents: 1,
  workflowRuns: 10,
  templateInstalls: 3,
  seats: 1,
  allowedAgentTypes: ACCELERATE_AGENTS,
};

// Founder UID - bypasses all limits
const FOUNDER_UID = "YOUR_FOUNDER_UID_HERE"; // Replace with your actual UID

export async function getBillingInfo(workspaceId: string): Promise<BillingInfo | null> {
  try {
    const billingRef = doc(db, "workspace_billing", workspaceId);
    const billingSnap = await getDoc(billingRef);

    if (billingSnap.exists()) {
      return billingSnap.data() as BillingInfo;
    }

    // Return free plan defaults if no billing info
    return {
      plan: "free",
      status: "active",
      limits: DEFAULT_LIMITS,
    };
  } catch (error) {
    console.error("Error fetching billing info:", error);
    return null;
  }
}

export async function checkLimit(
  workspaceId: string,
  userId: string,
  limitType: "activeAgents" | "workflowRuns" | "templateInstalls" | "seats",
  currentUsage: number
): Promise<{ allowed: boolean; limit: number; message?: string }> {
  // Founder bypass
  if (userId === FOUNDER_UID) {
    return { allowed: true, limit: 999999 };
  }

  const billingInfo = await getBillingInfo(workspaceId);

  if (!billingInfo) {
    return {
      allowed: false,
      limit: 0,
      message: "Unable to fetch billing information",
    };
  }

  const limit = billingInfo.limits[limitType] || DEFAULT_LIMITS[limitType];
  const allowed = currentUsage < limit;

  return {
    allowed,
    limit,
    message: allowed
      ? undefined
      : `You've reached your ${limitType} limit (${limit}). Upgrade to continue.`,
  };
}

export function isFounder(userId: string): boolean {
  return userId === FOUNDER_UID;
}

export function getPlanLimits(plan: string): PlanLimits {
  switch (plan) {
    case "accelerate":
      return {
        activeAgents: 3,
        workflowRuns: 100,
        templateInstalls: 10,
        seats: 2,
        allowedAgentTypes: ACCELERATE_AGENTS,
      };
    case "dominion":
      return {
        activeAgents: 5,
        workflowRuns: 1000,
        templateInstalls: -1, // Unlimited
        seats: 10,
        allowedAgentTypes: DOMINION_AGENTS,
      };
    case "sovereign":
      return {
        activeAgents: 7,
        workflowRuns: -1, // Unlimited
        templateInstalls: -1, // Unlimited
        seats: -1, // Unlimited
        allowedAgentTypes: SOVEREIGN_AGENTS,
      };
    case "founder":
      return {
        activeAgents: -1,
        workflowRuns: -1,
        templateInstalls: -1,
        seats: -1,
        allowedAgentTypes: [...SOVEREIGN_AGENTS], // Founder gets everything
      };
    default: // free
      return DEFAULT_LIMITS;
  }
}

export function canUseAgent(
  agentType: string,
  plan: string,
  userId: string
): { allowed: boolean; requiredPlan?: string; message?: string } {
  // Founder bypass
  if (userId === FOUNDER_UID) {
    return { allowed: true };
  }

  const limits = getPlanLimits(plan);
  const allowedAgents = limits.allowedAgentTypes || [];

  if (allowedAgents.includes(agentType)) {
    return { allowed: true };
  }

  // Determine which plan is required
  let requiredPlan = "accelerate";
  if (DOMINION_AGENTS.includes(agentType)) {
    requiredPlan = "dominion";
  }
  if (SOVEREIGN_AGENTS.includes(agentType) && !DOMINION_AGENTS.includes(agentType)) {
    requiredPlan = "sovereign";
  }

  return {
    allowed: false,
    requiredPlan,
    message: `This agent requires the ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan or higher.`,
  };
}

