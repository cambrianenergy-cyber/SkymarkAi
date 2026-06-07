// Minimal stub for subscriptionHelper
export function getWorkspaceSubscriptions(workspaceId: string) { return { agentIds: [], totalSubscribed: 0, agents: {} }; }
export type WorkspaceSubscriptions = { agentIds: string[], totalSubscribed: number, agents: Record<string, any> };
export function isPremiumAddonAgent(agentType: string) { return false; }
export function getAgentName(agentType: string) { return ""; }
