import { Timestamp } from "firebase/firestore";

/**
 * Agent Type Definitions
 */
export interface Agent {
  id?: string;
  workspaceId: string;
  name: string;
  type: string;
  duty: string;
  status: "active" | "inactive";
  systemPrompt?: string;
  capabilities?: string[];
  agentType?: string; // Legacy field for new agents
  description?: string; // Legacy field for new agents
  isActive?: boolean; // Legacy field for new agents
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Available Agent Types
 */
export type AgentType =
  | "campaign_director"
  | "trend_hunter"
  | "competitor_watchdog"
  | "copywriter"
  | "visual_designer"
  | "video_producer"
  | "scheduler_publisher"
  | "community_manager"
  | "analytics_analyst"
  | "brand_voice_guardian"
  | "hashtag_seo_optimizer"
  | "repurpose_engine"
  | "lead_scoring_followup"
  | "unified_inbox_triage"
  | "paid_ads_strategist"
  | "offer_funnel_architect"
  | "email_sms_nurture"
  | "conversion_optimizer"
  | "qa_compliance_checker"
  | "fact_checker_light"
  | "workflow_builder"
  | "analytics_to_action"
  | "client_reporting"
  | "hook_generator"
  | "shotlist_broll_planner"
  | "thumbnail_title_optimizer";
