// src/billing/entitlements.ts
export type BasePlanKey = "accelerate" | "dominion" | "sovereign" | "founder";

type SubscriptionDoc = {
  basePlan: { key: BasePlanKey };
  packs?: {
    salesAutomation?: { enabled: boolean };
    marketingIntelligence?: { enabled: boolean };
    agency?: { enabled: boolean };
  };
  specialtyAgents?: Record<string, { enabled: boolean }>;
  overrides?: {
    unlimitedAgents?: boolean;
    forcePlan?: BasePlanKey | null;
  };
  entitlements?: {
    computedAt?: any; // server timestamp
    allowedAgentTypes?: string[];
    limits?: Record<string, number>;
  };
};

const BASE_PLAN_AGENTS: Record<BasePlanKey, string[]> = {
  accelerate: ["content_writer_manual", "lead_qualifier"],

  dominion: [
    "content_writer_manual",
    "lead_qualifier",
    "scheduler",
    "follow_up_automation",
  ],

  sovereign: [
    "content_writer_manual",
    "lead_qualifier",
    "scheduler",
    "follow_up_automation",
    "campaign_generator",
    "analytics_insights",
  ],

  founder: [
    // founder can access everything
    "content_writer_manual",
    "lead_qualifier",
    "scheduler",
    "follow_up_automation",
    "campaign_generator",
    "analytics_insights",
    "repurpose_engine",
    "lead_scoring",
    "agency_mode_orchestrator",
    "client_routing",
    "template_marketplace_manager",
    "unified_inbox_router",
    "estimate_builder",
    "review_requester",
    "document_generator",
    "task_manager",
    "video_script_generator",
    "email_sequence_strategist",
    "social_analytics_pro",
    "brand_architect",
    "community_manager",
    "ugc_creator",
    "email_marketer",
    "product_copywriter",
    "closer",
    "webinar_scripter",
    "thought_leader",
    "review_generator",
    "local_seo_specialist",
    "review_responder",
  ],
};

const PACK_AGENTS = {
  salesAutomation: ["lead_scoring"],
  marketingIntelligence: ["repurpose_engine"],
  agency: ["agency_mode_orchestrator", "client_routing", "template_marketplace_manager"],
} as const;

export function computeAllowedAgentTypes(sub: SubscriptionDoc): string[] {
  const forced = sub.overrides?.forcePlan ?? null;
  const basePlan = forced ?? sub.basePlan?.key ?? "accelerate";

  // Founder unlimited: allow everything from catalog (or skip gating)
  if (sub.overrides?.unlimitedAgents || basePlan === "founder") {
    // If you prefer truly unlimited, return ["*"] and handle that in gating.
    return Array.from(new Set(BASE_PLAN_AGENTS.founder));
  }

  const allowed = new Set<string>(BASE_PLAN_AGENTS[basePlan] ?? []);

  // Packs add agents (only those that are NOT already included)
  if (sub.packs?.salesAutomation?.enabled) {
    for (const a of PACK_AGENTS.salesAutomation) allowed.add(a);
  }
  if (sub.packs?.marketingIntelligence?.enabled) {
    for (const a of PACK_AGENTS.marketingIntelligence) allowed.add(a);
  }
  if (sub.packs?.agency?.enabled) {
    for (const a of PACK_AGENTS.agency) allowed.add(a);
  }

  // Specialty agents add their own keys
  const spec = sub.specialtyAgents ?? {};
  for (const [agentType, v] of Object.entries(spec)) {
    if (v?.enabled) allowed.add(agentType);
  }

  return Array.from(allowed);
}

export function computeEntitlements(sub: SubscriptionDoc) {
  const allowedAgentTypes = computeAllowedAgentTypes(sub);

  return {
    allowedAgentTypes,
    // You can compute limits here too if you want plan-based + overrides.
  };
}
