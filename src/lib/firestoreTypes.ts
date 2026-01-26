export interface Step {
  stepId: string;
  runId: string;
  data: unknown;
  createdAt: string;
  updatedAt?: string;
}

export const StepSchema = z.object({
  stepId: z.string(),
  runId: z.string(),
  data: z.unknown(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});
export interface AdminDashboard {
  docId: string;
  workspaceId: string;
  data: unknown;
  updatedAt: string;
}

export const AdminDashboardSchema = z.object({
  docId: z.string(),
  workspaceId: z.string(),
  data: z.unknown(),
  updatedAt: z.string().datetime(),
});

export interface CostUsageLog {
  logId: string;
  workspaceId: string;
  amount: number;
  createdAt: string;
}

export const CostUsageLogSchema = z.object({
  logId: z.string(),
  workspaceId: z.string(),
  amount: z.number(),
  createdAt: z.string().datetime(),
});

export interface OrchestratorEvent {
  eventId: string;
  workspaceId: string;
  type: string;
  payload: unknown;
  createdAt: string;
}

export const OrchestratorEventSchema = z.object({
  eventId: z.string(),
  workspaceId: z.string(),
  type: z.string(),
  payload: z.unknown(),
  createdAt: z.string().datetime(),
});

export interface ToolRegistry {
  toolId: string;
  workspaceId: string;
  toolKey: string;
  config: unknown;
}

export const ToolRegistrySchema = z.object({
  toolId: z.string(),
  workspaceId: z.string(),
  toolKey: z.string(),
  config: z.unknown(),
});

export interface Connection {
  connectionId: string;
  workspaceId: string;
  provider: string;
  status: string;
  createdAt: string;
}

export const ConnectionSchema = z.object({
  connectionId: z.string(),
  workspaceId: z.string(),
  provider: z.string(),
  status: z.string(),
  createdAt: z.string().datetime(),
});

export interface AgentTask {
  taskId: string;
  workspaceId: string;
  agentId: string;
  status: string;
  updatedAt: string;
  data?: unknown;
}

export const AgentTaskSchema = z.object({
  taskId: z.string(),
  workspaceId: z.string(),
  agentId: z.string(),
  status: z.string(),
  updatedAt: z.string().datetime(),
  data: z.unknown().optional(),
});
// onboarding_states: Not currently used in code, but present in security rules and indexes

export interface OnboardingState {
  userId: string;
  workspaceId: string;
  state: string;
  updatedAt: string;
}

export const OnboardingStateSchema = z.object({
  userId: z.string(),
  workspaceId: z.string(),
  state: z.string(),
  updatedAt: z.string().datetime(),
});
export interface Subscription {
  subscriptionId: string;
  workspaceId: string;
  plan: string;
  status: string;
  startedAt: string;
  endedAt?: string;
}

export const SubscriptionSchema = z.object({
  subscriptionId: z.string(),
  workspaceId: z.string(),
  plan: z.string(),
  status: z.string(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
});
export interface AuditLog {
  logId: string;
  workspaceId: string;
  action: string;
  actorUid: string;
  createdAt: string;
  details?: unknown;
}

export const AuditLogSchema = z.object({
  logId: z.string(),
  workspaceId: z.string(),
  action: z.string(),
  actorUid: z.string(),
  createdAt: z.string().datetime(),
  details: z.unknown().optional(),
});
export interface Workflow {
  id: string;
  workspaceId: string;
  policyKey: string;
  name?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export const WorkflowSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  policyKey: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});
// Firestore data types for missing collections


import { z } from 'zod';

export interface AgentMemory {
  memoryId: string;
  workspaceId: string;
  agentId: string;
  tier: 'short_term' | 'long_term';
  content: unknown;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}

export const AgentMemorySchema = z.object({
  memoryId: z.string(),
  workspaceId: z.string(),
  agentId: z.string(),
  tier: z.enum(['short_term', 'long_term']),
  content: z.unknown(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});


export interface WorkspaceKnowledge {
  knowledgeId: string;
  workspaceId: string;
  content: unknown;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}

export const WorkspaceKnowledgeSchema = z.object({
  knowledgeId: z.string(),
  workspaceId: z.string(),
  content: z.unknown(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export interface AuditLog {
  logId: string;
  workspaceId: string;
  action: string;
  actorUid: string;
  createdAt: string;
  details?: unknown;
}

export interface Subscription {
  subscriptionId: string;
  workspaceId: string;
  plan: string;
  status: string;
  startedAt: string;
  endedAt?: string;
}

export interface Step {
  stepId: string;
  runId: string;
  data: unknown;
  createdAt: string;
  updatedAt?: string;
}
