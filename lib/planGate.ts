import type { PlanGate } from "../src/workers/orchestrator.d";

// Stripe product/price mapping
// IMPORTANT: Add metadata to each Price in Stripe Dashboard:
//   - type: "base_plan" | "pack" | "specialty_agent"
//   - key: plan key or pack key or agent key
//   - agentType: (only for specialty agents)

export const STRIPE = {
  // Base Plans
  basePlans: {
    accelerate: { 
      productId: "prod_ACCELERATE",
      priceId: "price_accelerate_monthly_499",
      priceMonthly: 499,
      metadata: { type: "base_plan", key: "accelerate" }
    },
    dominion: { 
      productId: "prod_DOMINION", 
      priceId: "price_dominion_monthly_999",
      priceMonthly: 999,
      metadata: { type: "base_plan", key: "dominion" }
    },
    sovereign: { 
      productId: "prod_SOVEREIGN", 
      priceId: "price_sovereign_monthly_1499",
      priceMonthly: 1499,
      metadata: { type: "base_plan", key: "sovereign" }
    },
    founder: { 
      productId: "prod_FOUNDER", 
      priceId: "price_founder_internal",
      priceMonthly: 0,
      metadata: { type: "base_plan", key: "founder" }
    },
  },

  // Packs (add-on subscriptions)
  packs: {
    salesAutomation: {
      productId: "prod_PACK_SALES",
      priceId: "price_pack_sales_99",
      priceMonthly: 99,
      agents: ["lead_scoring"],
      metadata: { type: "pack", key: "salesAutomation" }
    },
    marketingIntelligence: {
      productId: "prod_PACK_MARKETING",
      priceId: "price_pack_marketing_149",
      priceMonthly: 149,
      agents: ["repurpose_engine"],
      metadata: { type: "pack", key: "marketingIntelligence" }
    },
    agency: {
      productId: "prod_PACK_AGENCY",
      priceId: "price_pack_agency_299",
      priceMonthly: 299,
      agents: ["agency_mode_orchestrator", "client_routing", "template_marketplace_manager"],
      metadata: { type: "pack", key: "agency" }
    },
  },

  // Specialty Agents ( la carte)
  specialtyAgents: {
    Review_Responder: {
      productId: "prod_AGENT_REVIEW_RESPOND",
      priceId: "price_agent_review_respond_79",
      priceMonthly: 79,
      metadata: { type: "specialty_agent", key: "Review_Responder", agentType: "Review_Responder" }
    },
    Campaign_Director: {
      productId: "prod_AGENT_CAMPAIGN_DIRECTOR",
      priceId: "price_agent_campaign_director_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Campaign_Director", agentType: "Campaign_Director" }
    },
    Content_Creator: {
      productId: "prod_AGENT_CONTENT_CREATOR",
      priceId: "price_agent_content_creator_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Content_Creator", agentType: "Content_Creator" }
    },
    Copywriter: {
      productId: "prod_AGENT_COPYWRITER",
      priceId: "price_agent_copywriter_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Copywriter", agentType: "Copywriter" }
    },
    Brand_Voice_Guardian: {
      productId: "prod_AGENT_BRAND_VOICE_GUARDIAN",
      priceId: "price_agent_brand_voice_guardian_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Brand_Voice_Guardian", agentType: "Brand_Voice_Guardian" }
    },
    Scheduler: {
      productId: "prod_AGENT_SCHEDULER",
      priceId: "price_agent_scheduler_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Scheduler", agentType: "Scheduler" }
    },
    Engagement_Analyst: {
      productId: "prod_AGENT_ENGAGEMENT_ANALYST",
      priceId: "price_agent_engagement_analyst_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Engagement_Analyst", agentType: "Engagement_Analyst" }
    },
    Competitor_Watchdog: {
      productId: "prod_AGENT_COMPETITOR_WATCHDOG",
      priceId: "price_agent_competitor_watchdog_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Competitor_Watchdog", agentType: "Competitor_Watchdog" }
    },
    Trend_Hunter: {
      productId: "prod_AGENT_TREND_HUNTER",
      priceId: "price_agent_trend_hunter_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Trend_Hunter", agentType: "Trend_Hunter" }
    },
    Hashtag_SEO: {
      productId: "prod_AGENT_HASHTAG_SEO",
      priceId: "price_agent_hashtag_seo_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Hashtag_SEO", agentType: "Hashtag_SEO" }
    },
    Content_Writer: {
      productId: "prod_AGENT_CONTENT_WRITER",
      priceId: "price_agent_content_writer_129",
      priceMonthly: 129,
      metadata: { type: "specialty_agent", key: "Content_Writer", agentType: "Content_Writer" }
    },
    Video_Script_Generator: {
      productId: "prod_AGENT_VIDEO_SCRIPT",
      priceId: "price_agent_video_script_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Video_Script_Generator", agentType: "Video_Script_Generator" }
    },
    Email_Sequence_Strategist: {
      productId: "prod_AGENT_EMAIL_SEQ",
      priceId: "price_agent_email_seq_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Email_Sequence_Strategist", agentType: "Email_Sequence_Strategist" }
    },
    Social_Analytics_Pro: {
      productId: "prod_AGENT_SOCIAL_ANALYTICS",
      priceId: "price_agent_social_analytics_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Social_Analytics_Pro", agentType: "Social_Analytics_Pro" }
    },
    Brand_Architect: {
      productId: "prod_AGENT_BRAND_ARCHITECT",
      priceId: "price_agent_brand_architect_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Brand_Architect", agentType: "Brand_Architect" }
    },
    Community_Manager: {
      productId: "prod_AGENT_COMMUNITY_MANAGER_TITLE",
      priceId: "price_agent_community_manager_title_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Community_Manager", agentType: "Community_Manager" }
    },
    UGC_Creator: {
      productId: "prod_AGENT_UGC",
      priceId: "price_agent_ugc_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "UGC_Creator", agentType: "UGC_Creator" }
    },
    Email_Marketer: {
      productId: "prod_AGENT_EMAIL_MARKETER",
      priceId: "price_agent_email_marketer_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Email_Marketer", agentType: "Email_Marketer" }
    },
    Product_Copywriter: {
      productId: "prod_AGENT_PRODUCT_COPY",
      priceId: "price_agent_product_copy_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Product_Copywriter", agentType: "Product_Copywriter" }
    },
    Closer: {
      productId: "prod_AGENT_CLOSER",
      priceId: "price_agent_closer_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Closer", agentType: "Closer" }
    },
    Webinar_Scripter: {
      productId: "prod_AGENT_WEBINAR",
      priceId: "price_agent_webinar_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Webinar_Scripter", agentType: "Webinar_Scripter" }
    },
    Thought_Leader: {
      productId: "prod_AGENT_THOUGHT_LEADER",
      priceId: "price_agent_thought_leader_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Thought_Leader", agentType: "Thought_Leader" }
    },
    Review_Generator: {
      productId: "prod_AGENT_REVIEW_GEN",
      priceId: "price_agent_review_gen_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Review_Generator", agentType: "Review_Generator" }
    },
    Local_SEO_Specialist: {
      productId: "prod_AGENT_LOCAL_SEO",
      priceId: "price_agent_local_seo_49",
      priceMonthly: 49,
      metadata: { type: "specialty_agent", key: "Local_SEO_Specialist", agentType: "Local_SEO_Specialist" }
    },
  },
} as const;

// Shared agent catalog to keep naming consistent across plans
export const AGENT_CATALOG = {
  accelerate: [
    "content_writer_manual",
    "lead_qualifier",
  ],
  dominion: [
    "scheduler",
    "follow_up_automation",
  ],
  sovereignOnly: [
    "campaign_generator",
    "analytics_insights",
  ],
} as const;

export function buildPlanGate(plan: PlanGate["plan"]): PlanGate {
  const accelerateList = [...AGENT_CATALOG.accelerate];
  const dominionList = [...AGENT_CATALOG.accelerate, ...AGENT_CATALOG.dominion];
  const sovereignList = [...AGENT_CATALOG.accelerate, ...AGENT_CATALOG.dominion, ...AGENT_CATALOG.sovereignOnly];

  const allowedAgentTypesList =
    plan === "accelerate" ? accelerateList :
    plan === "dominion" ? dominionList :
    plan === "sovereign" ? sovereignList :
    sovereignList; // founder => sovereign+

  const limitsByPlan = {
    accelerate: {
      maxAgents: 2,
      maxActiveAgents: 2,
      maxWorkflows: 10,
      maxWorkflowRunsPerDay: 50,
      maxConcurrentRuns: 2,
      maxStepsPerRun: 15,
      maxTeamMembers: 5,
      maxIntegrations: 3,
      maxMemoryMb: 512,
    },
    dominion: {
      maxAgents: 4,
      maxActiveAgents: 4,
      maxWorkflows: 50,
      maxWorkflowRunsPerDay: 200,
      maxConcurrentRuns: 5,
      maxStepsPerRun: 50,
      maxTeamMembers: 20,
      maxIntegrations: 10,
      maxMemoryMb: 1024,
    },
    sovereign: {
      maxAgents: 6,
      maxActiveAgents: 6,
      maxWorkflows: 200,
      maxWorkflowRunsPerDay: 1000,
      maxConcurrentRuns: 25,
      maxStepsPerRun: 200,
      maxTeamMembers: 100,
      maxIntegrations: 30,
      maxMemoryMb: 4096,
    },
    founder: {
      maxAgents: 200,
      maxActiveAgents: 100,
      maxWorkflows: 500,
      maxWorkflowRunsPerDay: 2000,
      maxConcurrentRuns: 50,
      maxStepsPerRun: 400,
      maxTeamMembers: 200,
      maxIntegrations: 40,
      maxMemoryMb: 8192,
    },
  } as const;

  const featuresByPlan = {
    accelerate: {
      unifiedInbox: false,
      campaignGenerator: false,
      repurposeEngine: false,
      leadScoring: false,
      agencyMode: false,
      templateMarketplace: true,
      workflowAutomation: true,
      advancedAnalytics: false,
      webhooks: false,
      apiAccess: false,
    },
    dominion: {
      unifiedInbox: true,
      campaignGenerator: true,
      repurposeEngine: true,
      leadScoring: true,
      agencyMode: false,
      templateMarketplace: true,
      workflowAutomation: true,
      advancedAnalytics: true,
      webhooks: true,
      apiAccess: false,
    },
    sovereign: {
      unifiedInbox: true,
      campaignGenerator: true,
      repurposeEngine: true,
      leadScoring: true,
      agencyMode: true,
      templateMarketplace: true,
      workflowAutomation: true,
      advancedAnalytics: true,
      webhooks: true,
      apiAccess: true,
    },
    founder: {
      unifiedInbox: true,
      campaignGenerator: true,
      repurposeEngine: true,
      leadScoring: true,
      agencyMode: true,
      templateMarketplace: true,
      workflowAutomation: true,
      advancedAnalytics: true,
      webhooks: true,
      apiAccess: true,
    },
  } as const;

  const limits = limitsByPlan[plan] ?? limitsByPlan.accelerate;
  const features = featuresByPlan[plan] ?? featuresByPlan.accelerate;

  const seatsByPlan = {
    accelerate: { included: 5, purchased: 5, used: 0, overagePriceId: null },
    dominion: { included: 20, purchased: 20, used: 0, overagePriceId: null },
    sovereign: { included: 100, purchased: 100, used: 0, overagePriceId: null },
    founder: { included: 200, purchased: 200, used: 0, overagePriceId: null },
  } as const;
  const seats = seatsByPlan[plan] ?? seatsByPlan.accelerate;

  const overrides = {
    forcePlan: null,
    unlimitedAgents: false,
    unlimitedRuns: false,
    unlimitedMembers: false,
    notes: null,
  } as const;

  const stripe = {
    livemode: false,
    latestInvoiceId: null,
    latestPaymentIntentId: null,
    defaultPaymentMethodId: null,
    collectionMethod: null,
    lastWebhookEventId: null,
  } as const;

  return {
    plan,
    allowedAgentTypes: new Set(allowedAgentTypesList),
    allowedAgentTypesList,
    hiddenAgentTypesList: [],
    limits,
    features,
    seats,
    overrides,
    stripe,
    // legacy caps for compatibility
    maxStepsPerRun: limits.maxStepsPerRun,
    maxConcurrentRuns: limits.maxConcurrentRuns,
    maxWorkflowsPerDay: limits.maxWorkflowRunsPerDay,
  };
}

