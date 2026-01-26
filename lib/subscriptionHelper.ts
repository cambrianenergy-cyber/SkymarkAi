// lib/subscriptionHelper.ts

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface AgentSubscription {
  agentType: string;
  agentName: string;
  icon: string;
  enabled: boolean;
  subscribedAt?: Date;
}

export interface WorkspaceSubscriptions {
  agentIds: string[];
  agents: Record<string, AgentSubscription>;
  totalSubscribed: number;
}

// Premium add-on agents available with subscription tiers (full access override enabled)
const ADDON_AGENTS = [
  'Content_Writer',
  'Fully_Automated_Content_Creator',
  'Video_Script_Generator',
  'Email_Sequence_Strategist',
  'Social_Analytics_Pro',
  'Brand_Architect',
  'Community_Manager',
  'UGC_Creator',
  'Email_Marketer',
  'Product_Copywriter',
  'Closer',
  'Webinar_Scripter',
  'Thought_Leader',
  'Review_Generator',
  'Local_SEO_Specialist',
];

// Map of all available agents
const AVAILABLE_AGENTS: Record<string, { name: string; icon: string; category: string }> = {
    'Fully_Automated_Content_Creator': { name: 'Fully Automated Content Creator', icon: '', category: 'Content' },
  'Orchestrator_Prodigy': { name: 'Orchestrator Prodigy', icon: '', category: 'System' }, // Always active behind scenes
  'Campaign_Manager': { name: 'Campaign Manager', icon: '', category: 'Campaign' }, // Elite plan required
  'Lead_Creator': { name: 'Lead Creator', icon: '', category: 'Lead Gen' },
  'Content_Creator': { name: 'Content Creator', icon: '', category: 'Content' },
  'Copywriter': { name: 'Copywriter', icon: '', category: 'Content' },
  'Brand_Voice_Guardian': { name: 'Brand Voice Guardian', icon: '', category: 'Brand' },
  'Campaign_Director': { name: 'Campaign Director', icon: '', category: 'Campaign' },
  'Scheduler': { name: 'Scheduling Master', icon: '', category: 'Publishing' },
  'Social_Manager': { name: 'Social Manager', icon: '', category: 'Social' },
  'Engagement_Analyst': { name: 'Engagement Analyst', icon: '', category: 'Analytics' },
  'Competitor_Watchdog': { name: 'Competitor Watchdog', icon: '', category: 'Intelligence' },
  'Trend_Hunter': { name: 'Trend Hunter', icon: '', category: 'Intelligence' },
  'Hashtag_SEO': { name: 'Hashtag SEO', icon: '#', category: 'SEO' },
  'Algorithm_Hunter': { name: 'Algorithm Hunter', icon: '', category: 'Intelligence' },
  'Content_Writer': { name: 'Content Writer', icon: '', category: 'Content' },
  'Video_Script_Generator': { name: 'Video Script Generator', icon: '', category: 'Content' },
  'Email_Sequence_Strategist': { name: 'Email Sequence Strategist', icon: '', category: 'Email' },
  'Social_Analytics_Pro': { name: 'Social Analytics Pro', icon: '', category: 'Analytics' },
  'Brand_Architect': { name: 'Brand Architect', icon: '', category: 'Brand' },
  'Community_Manager': { name: 'Community Manager', icon: '', category: 'Community' },
  'UGC_Creator': { name: 'UGC Creator', icon: '', category: 'Content' },
  'Email_Marketer': { name: 'Email Marketer', icon: '', category: 'Email' },
  'Product_Copywriter': { name: 'Product Copywriter', icon: '', category: 'Copy' },
  'Closer': { name: 'Closer', icon: '', category: 'Sales' },
  'Webinar_Scripter': { name: 'Webinar Scripter', icon: '', category: 'Content' },
  'Thought_Leader': { name: 'Thought Leader', icon: '', category: 'Content' },
  'Review_Generator': { name: 'Review Generator', icon: '', category: 'Reputation' },
  'Local_SEO_Specialist': { name: 'Local SEO Specialist', icon: '', category: 'SEO' },
};

/**
 * Get subscribed agents for a workspace
 */
export async function getWorkspaceSubscriptions(workspaceId: string): Promise<WorkspaceSubscriptions> {
  try {
    const workspaceRef = doc(db, 'workspaces', workspaceId);
    const workspaceDoc = await getDoc(workspaceRef);

    if (!workspaceDoc.exists()) {
      return {
        agentIds: [],
        agents: {},
        totalSubscribed: 0,
      };
    }

    const workspaceData = workspaceDoc.data();

    // Only include agents that are explicitly subscribed or system agents
    // Orchestrator_Prodigy is always available as it's the system orchestrator
    const subscribedAgentIds = Array.from(
      new Set([
        'Orchestrator_Prodigy', // System agent - always available
        ...(workspaceData?.subscribedAgents || workspaceData?.agents || [])
      ])
    );
    
    // Build agent subscription map
    const agents: Record<string, AgentSubscription> = {};
    
    subscribedAgentIds.forEach((agentId: string) => {
      const agentInfo = AVAILABLE_AGENTS[agentId];
      if (agentInfo) {
        agents[agentId] = {
          agentType: agentId,
          agentName: agentInfo.name,
          icon: agentInfo.icon,
          enabled: true,
          subscribedAt: workspaceData?.agentSubscriptionDates?.[agentId] || new Date(),
        };
      }
    });

    return {
      agentIds: subscribedAgentIds,
      agents,
      totalSubscribed: subscribedAgentIds.length,
    };
  } catch (error) {
    console.error('Failed to get workspace subscriptions:', error);
    return {
      agentIds: [],
      agents: {},
      totalSubscribed: 0,
    };
  }
}

/**
 * Check if user is subscribed to an agent
 * Note: Orchestrator_Prodigy is always available (works behind the scenes for everyone)
 * Agency plan founders get all add-on agents automatically
 */
export async function isSubscribedToAgent(workspaceId: string, agentType: string): Promise<boolean> {
  // Orchestrator is always available to everyone (invisible operation)
  if (agentType === 'Orchestrator_Prodigy') {
    return true;
  }
  
  const subscriptions = await getWorkspaceSubscriptions(workspaceId);
  return subscriptions.agentIds.includes(agentType);
}

/**
 * Legacy check - use isSubscribedToAgent with workspaceId instead for full-access logic
 */
export function isSubscribedToAgentSync(subscriptions: WorkspaceSubscriptions, agentType: string): boolean {
  if (agentType === 'Orchestrator_Prodigy') {
    return true;
  }
  
  return subscriptions.agentIds.includes(agentType);
}

/**
 * Check if agent is always available to all users
 */
export function isAlwaysAvailable(agentType: string): boolean {
  return agentType === 'Orchestrator_Prodigy';
}

/**
 * Check if agent is a premium add-on
 */
export function isPremiumAddonAgent(agentType: string): boolean {
  return ADDON_AGENTS.includes(agentType);
}

/**
 * Get all available agents (for admin/upgrade view)
 */
export function getAllAvailableAgents(): Record<string, { name: string; icon: string; category: string }> {
  return AVAILABLE_AGENTS;
}

/**
 * Get all add-on agents
 */
export function getAllAddonAgents(): string[] {
  return ADDON_AGENTS;
}

/**
 * Get agent name by type
 */
export function getAgentName(agentType: string): string {
  const agent = AVAILABLE_AGENTS[agentType];
  return agent ? agent.name : agentType;
}

/**
 * Get agent icon by type
 */
export function getAgentIcon(agentType: string): string {
  const agent = AVAILABLE_AGENTS[agentType];
  return agent ? agent.icon : '';
}

/**
 * Get agent category by type
 */
export function getAgentCategory(agentType: string): string {
  const agent = AVAILABLE_AGENTS[agentType];
  return agent ? agent.category : 'Other';
}

