import { AgentRunner } from "./agentRunner";
import { CampaignDirectorRunner } from "./agentRunners/Campaign_Director";
import { TrendHunterRunner } from "./agentRunners/Trend_Hunter";
import { CompetitorWatchdogRunner } from "./agentRunners/Competitor_Watchdog";
import { CopywriterRunner } from "./agentRunners/Copywriter";
import { ContentCreatorRunner } from "./agentRunners/Content_Creator";
import { HashtagSEORunner } from "./agentRunners/Hashtag_SEO";
import { BrandVoiceGuardianRunner } from "./agentRunners/Brand_Voice_Guardian";
import { SchedulingMasterRunner } from "./agentRunners/Scheduling_Master";
import { EngagementAnalystRunner } from "./agentRunners/Engagement_Analyst";
import { AlgorithmHunterRunner } from "./agentRunners/Algorithm_Hunter";
import { ContentWriterRunner } from "./agentRunners/Content_Writer";
import { ReviewResponderRunner } from "./agentRunners/Review_Responder";

import { OutboundProspectorRunner } from "./agentRunners/Outbound_Prospector";
import { MeetingBookerRunner } from "./agentRunners/Meeting_Booker";
import { FollowupSequencerRunner } from "./agentRunners/Followup_Sequencer";
import { ListingOptimizerRunner } from "./agentRunners/Listing_Optimizer";
import { OpenHouseBotRunner } from "./agentRunners/OpenHouse_Bot";
import { LeadNurturerRunner } from "./agentRunners/Lead_Nurturer";
import { AppointmentReminderRunner } from "./agentRunners/Appointment_Reminder";
import { IntakeFormBotRunner } from "./agentRunners/Intake_Form_Bot";
import { FollowupSchedulerRunner } from "./agentRunners/Followup_Scheduler";
import { ReviewRequesterRunner } from "./agentRunners/Review_Requester";
import { LoyaltyProgramBotRunner } from "./agentRunners/Loyalty_Program_Bot";
import { AdManagerRunner } from "./agentRunners/Ad_Manager";
import { ClientOnboarderRunner } from "./agentRunners/Client_Onboarder";
import { ReportGeneratorRunner } from "./agentRunners/Report_Generator";
import { TaskDelegatorRunner } from "./agentRunners/Task_Delegator";
import { OutreachBotRunner } from "./agentRunners/Outreach_Bot";
import { GiftSenderRunner } from "./agentRunners/Gift_Sender";
import { CampaignTrackerRunner } from "./agentRunners/Campaign_Tracker";
import { TrialConverterRunner } from "./agentRunners/Trial_Converter";
import { OnboardingBotRunner } from "./agentRunners/Onboarding_Bot";
import { ChurnPredictorRunner } from "./agentRunners/Churn_Predictor";
import { RSVPBotRunner } from "./agentRunners/RSVP_Bot";
import { ReminderSenderRunner } from "./agentRunners/Reminder_Sender";
import { FollowupBotRunner } from "./agentRunners/Followup_Bot";
import { AcquisitionBotRunner } from "./agentRunners/Acquisition_Bot";
import { OnboardingSequenceRunner } from "./agentRunners/Onboarding_Sequence";
import { RetentionManagerRunner } from "./agentRunners/Retention_Manager";
import { OnboardingManagerRunner } from "./agentRunners/Onboarding_Manager";
import { TrainingBotRunner } from "./agentRunners/Training_Bot";
import { ReportingAgentRunner } from "./agentRunners/Reporting_Agent";

// Registry of all available agent runners
// Maps agent type IDs to their runner implementations and specialization descriptions
export interface AgentRegistryEntry {
  runner: any; // Allow function or class-based runners
  specialization: string;
}

export const AGENT_RUNNERS: Record<string, AgentRegistryEntry> = {
  // System Agents
  Review_Responder: {
    runner: ReviewResponderRunner,
    specialization: "Responds to customer reviews: thanks positive reviewers, resolves negative reviews if possible without hurting revenue, and enforces consistent logic."
  },
  Orchestrator_Prodigy: {
    runner: CampaignDirectorRunner,
    specialization: "System orchestrator for agent workflows and automation."
  },
  
  // Core Campaign Agents
  Campaign_Director: {
    runner: CampaignDirectorRunner,
    specialization: "Leads and manages marketing campaigns end-to-end."
  },
  Campaign_Manager: {
    runner: CampaignDirectorRunner,
    specialization: "Elite-tier agent for advanced campaign management."
  },
  
  // Content Creation Agents
  Content_Creator: {
    runner: ContentCreatorRunner,
    specialization: "Creates engaging content for multiple platforms."
  },
  Fully_Automated_Content_Creator: {
    runner: ContentCreatorRunner,
    specialization: "Fully automated content creator active across all platforms in full automation mode. Priced at $129/month."
  },
  Content_Writer: {
    runner: ContentWriterRunner,
    specialization: "Premium add-on: AI-powered content writer across 7 platforms."
  },
  Copywriter: {
    runner: CopywriterRunner,
    specialization: "Writes persuasive copy for ads, emails, and landing pages."
  },
  
  // Intelligence & Research Agents
  Trend_Hunter: {
    runner: TrendHunterRunner,
    specialization: "Discovers emerging trends and viral topics."
  },
  Competitor_Watchdog: {
    runner: CompetitorWatchdogRunner,
    specialization: "Monitors competitors and analyzes their strategies."
  },
  Algorithm_Hunter: {
    runner: AlgorithmHunterRunner,
    specialization: "Tracks and adapts to social platform algorithm changes."
  },
  
  // Brand & Voice Agents
  Brand_Voice_Guardian: {
    runner: BrandVoiceGuardianRunner,
    specialization: "Ensures brand voice consistency across all content."
  },
  Brand_Architect: {
    runner: BrandVoiceGuardianRunner,
    specialization: "Premium add-on: Develops brand strategy and identity."
  },
  
  // Publishing & Scheduling
  Scheduler: {
    runner: SchedulingMasterRunner,
    specialization: "Automates publishing schedules for optimal engagement."
  },
  Scheduling_Master: {
    runner: SchedulingMasterRunner,
    specialization: "Advanced scheduling and publishing automation."
  },
  
  // Analytics & Engagement
  Engagement_Analyst: {
    runner: EngagementAnalystRunner,
    specialization: "Analyzes audience engagement and optimizes strategies."
  },
  Social_Analytics_Pro: {
    runner: EngagementAnalystRunner,
    specialization: "Premium add-on: Provides advanced social analytics."
  },
  UGC_Creator: {
    runner: ContentCreatorRunner,
    specialization: "Generates user-generated content for campaigns."
  },
  Email_Marketer: {
    runner: CopywriterRunner,
    specialization: "Designs and writes email marketing campaigns."
  },
  Product_Copywriter: {
    runner: CopywriterRunner,
    specialization: "Creates compelling product descriptions and copy."
  },
  Closer: {
    runner: CopywriterRunner,
    specialization: "Writes persuasive sales copy to close deals."
  },
  Webinar_Scripter: {
    runner: CopywriterRunner,
    specialization: "Crafts scripts for webinars and online presentations."
  },
  Thought_Leader: {
    runner: ContentWriterRunner,
    specialization: "Produces thought leadership content for brand authority."
  },
  Review_Generator: {
    runner: CopywriterRunner,
    specialization: "Generates product and service reviews."
  },
  Local_SEO_Specialist: {
    runner: HashtagSEORunner,
    specialization: "Optimizes content for local search and SEO."
  },
  
  // SEO & Optimization
  Hashtag_SEO: {
    runner: HashtagSEORunner,
    specialization: "Optimizes hashtags for maximum reach and SEO."
  },
  
  // Social Media Management
  Social_Manager: {
    runner: ContentCreatorRunner,
    specialization: "Manages social media accounts and content calendars."
  },
  
  // Lead Generation
  Lead_Creator: {
    runner: CampaignDirectorRunner,
    specialization: "Generates and nurtures new business leads."
  },
  
  // Premium Add-On Agents (require subscription)
  Video_Script_Generator: {
    runner: CopywriterRunner,
    specialization: "Premium add-on: Creates scripts for video content."
  },
  Email_Sequence_Strategist: {
    runner: CopywriterRunner,
    specialization: "Premium add-on: Designs automated email sequences."
  },
  Community_Manager: {
    runner: EngagementAnalystRunner,
    specialization: "Premium add-on: Manages and grows online communities."
  },
  // --- New Playbook Agents ---
  Outbound_Prospector: {
    runner: OutboundProspectorRunner,
    specialization: "Automates outbound prospecting via LinkedIn and email for B2B lead generation."
  },
  Meeting_Booker: {
    runner: MeetingBookerRunner,
    specialization: "Books meetings and automates calendar scheduling for prospects."
  },
  Followup_Sequencer: {
    runner: FollowupSequencerRunner,
    specialization: "Manages and automates multi-step follow-up sequences."
  },
  Listing_Optimizer: {
    runner: ListingOptimizerRunner,
    specialization: "Optimizes real estate listings for maximum visibility and conversion."
  },
  OpenHouse_Bot: {
    runner: OpenHouseBotRunner,
    specialization: "Automates open house reminders and attendee engagement."
  },
  Lead_Nurturer: {
    runner: LeadNurturerRunner,
    specialization: "Nurtures leads with drip campaigns and personalized follow-ups."
  },
  Appointment_Reminder: {
    runner: AppointmentReminderRunner,
    specialization: "Sends automated appointment reminders to reduce no-shows."
  },
  Intake_Form_Bot: {
    runner: IntakeFormBotRunner,
    specialization: "Automates digital intake forms and patient onboarding."
  },
  Followup_Scheduler: {
    runner: FollowupSchedulerRunner,
    specialization: "Schedules and automates patient follow-up communications."
  },
  Review_Requester: {
    runner: ReviewRequesterRunner,
    specialization: "Requests customer reviews on key platforms automatically."
  },
  Loyalty_Program_Bot: {
    runner: LoyaltyProgramBotRunner,
    specialization: "Manages and automates loyalty program communications."
  },
  Ad_Manager: {
    runner: AdManagerRunner,
    specialization: "Automates local ad campaigns and optimizes ad spend."
  },
  Client_Onboarder: {
    runner: ClientOnboarderRunner,
    specialization: "Automates client onboarding with checklists and workflows."
  },
  Report_Generator: {
    runner: ReportGeneratorRunner,
    specialization: "Generates and sends automated client reports."
  },
  Task_Delegator: {
    runner: TaskDelegatorRunner,
    specialization: "Delegates and auto-assigns tasks to team members."
  },
  Outreach_Bot: {
    runner: OutreachBotRunner,
    specialization: "Automates influencer outreach across social platforms."
  },
  Gift_Sender: {
    runner: GiftSenderRunner,
    specialization: "Automates sending gifts and swag to influencers."
  },
  Campaign_Tracker: {
    runner: CampaignTrackerRunner,
    specialization: "Tracks influencer campaign KPIs and ROI."
  },
  Trial_Converter: {
    runner: TrialConverterRunner,
    specialization: "Automates trial conversion sequences for SaaS products."
  },
  Onboarding_Bot: {
    runner: OnboardingBotRunner,
    specialization: "Guides new users through onboarding checklists."
  },
  Churn_Predictor: {
    runner: ChurnPredictorRunner,
    specialization: "Predicts and flags users at risk of churn."
  },
  RSVP_Bot: {
    runner: RSVPBotRunner,
    specialization: "Automates RSVP collection and event attendance tracking."
  },
  Reminder_Sender: {
    runner: ReminderSenderRunner,
    specialization: "Sends event and appointment reminders via email or SMS."
  },
  Followup_Bot: {
    runner: FollowupBotRunner,
    specialization: "Automates post-event and post-appointment follow-ups."
  },
  Acquisition_Bot: {
    runner: AcquisitionBotRunner,
    specialization: "Automates acquisition offers and onboarding for new members."
  },
  Onboarding_Sequence: {
    runner: OnboardingSequenceRunner,
    specialization: "Manages multi-step onboarding sequences for new members."
  },
  Retention_Manager: {
    runner: RetentionManagerRunner,
    specialization: "Automates retention check-ins and member engagement."
  },
  Onboarding_Manager: {
    runner: OnboardingManagerRunner,
    specialization: "Standardizes franchise onboarding and training."
  },
  Training_Bot: {
    runner: TrainingBotRunner,
    specialization: "Automates franchisee training modules and progress tracking."
  },
  Reporting_Agent: {
    runner: ReportingAgentRunner,
    specialization: "Automates weekly and monthly reporting for franchises."
  },
};

export function getAgentRunner(agentType: string): AgentRunner | null {
  return AGENT_RUNNERS[agentType]?.runner || null;
}

export function getAgentSpecialization(agentType: string): string | null {
  return AGENT_RUNNERS[agentType]?.specialization || null;
}
