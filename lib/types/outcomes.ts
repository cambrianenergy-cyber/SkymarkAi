// Outcome Engine Types

export interface Outcome {
  id: string;
  workspaceId: string;
  type: 'booked_calls' | 'replies' | 'revenue' | 'conversions' | 'reactivations' | 'custom';
  title: string;
  target: number;
  current: number;
  deadline?: Date;
  status: 'active' | 'paused' | 'completed' | 'failed';
  strategy?: OutcomeStrategy;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutcomeStrategy {
  recommendedAgents: string[];
  recommendedWorkflows: string[];
  cadence: {
    frequency: string;
    channels: string[];
    timing: string[];
  };
  adjustments: OutcomeAdjustment[];
}

export interface OutcomeAdjustment {
  timestamp: Date;
  reason: string;
  change: string;
  impact?: string;
}

// Intelligence Memory Types

export interface WorkspaceIntelligence {
  workspaceId: string;
  learnings: {
    bestOffers: OfferPerformance[];
    bestHooks: HookPerformance[];
    bestPostingTimes: TimeSlot[];
    bestAgentCombos: AgentCombo[];
    audienceInsights: AudienceInsight[];
  };
  patterns: {
    conversionDrivers: string[];
    dropoffPoints: string[];
    successFactors: string[];
  };
  lastUpdated: Date;
}

export interface OfferPerformance {
  offer: string;
  conversionRate: number;
  revenue: number;
  uses: number;
}

export interface HookPerformance {
  hook: string;
  engagementRate: number;
  replyRate: number;
  uses: number;
}

export interface TimeSlot {
  dayOfWeek: string;
  hour: number;
  engagementScore: number;
  platform: string;
}

export interface AgentCombo {
  agents: string[];
  successRate: number;
  avgOutcome: number;
  uses: number;
}

export interface AudienceInsight {
  segment: string;
  responseRate: number;
  preferredChannels: string[];
  bestMessaging: string[];
}

// Attribution Types

export interface Attribution {
  id: string;
  workspaceId: string;
  leadId: string;
  touchpoints: Touchpoint[];
  outcome?: {
    type: 'call_booked' | 'deal_closed' | 'revenue_generated';
    value?: number;
    timestamp: Date;
  };
  createdAt: Date;
}

export interface Touchpoint {
  timestamp: Date;
  type: 'campaign' | 'workflow' | 'post' | 'message' | 'followup';
  entityId: string;
  entityName: string;
  impact: 'high' | 'medium' | 'low';
}

// Shareable Win Types

export interface ShareableReport {
  id: string;
  workspaceId: string;
  type: 'weekly' | 'campaign' | 'client_results';
  title: string;
  dateRange: { start: Date; end: Date };
  metrics: ReportMetric[];
  insights: string[];
  createdAt: Date;
  shareLink?: string;
  pdfUrl?: string;
}

export interface ReportMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
}

// Playbook Types

export interface IndustryPlaybook {
  id: string;
  industry: string;
  title: string;
  description: string;
  agentPresets: AgentPreset[];
  messagingFrameworks: MessagingFramework[];
  cadence: PlaybookCadence;
  kpiExpectations: KPIExpectation[];
  status: 'public' | 'beta';
  installCount: number;
}

export interface AgentPreset {
  agentType: string;
  configuration: Record<string, any>;
  priority: number;
}

export interface MessagingFramework {
  scenario: string;
  template: string;
  variables: string[];
  tone: string;
}

export interface PlaybookCadence {
  phase1: { duration: string; actions: string[] };
  phase2: { duration: string; actions: string[] };
  phase3: { duration: string; actions: string[] };
}

export interface KPIExpectation {
  metric: string;
  target: number;
  timeframe: string;
}

// Constraint Intelligence Types

export interface ConstraintRecommendation {
  id: string;
  workspaceId: string;
  type: 'pause' | 'delay' | 'skip' | 'modify';
  severity: 'high' | 'medium' | 'low';
  entityType: 'workflow' | 'campaign' | 'agent' | 'post';
  entityId: string;
  message: string;
  reason: string;
  suggestedAction: string;
  dismissed: boolean;
  createdAt: Date;
}

// Insight Drop Types

export interface InsightDrop {
  id: string;
  context: string; // where it appears: 'workflows', 'campaigns', 'assets', etc.
  title: string;
  body: string;
  category: 'strategy' | 'execution' | 'optimization' | 'mindset';
  priority: number;
  seen: string[]; // user IDs who've seen it
}
