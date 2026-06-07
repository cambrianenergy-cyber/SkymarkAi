// Stub for Plan and PLAN_CONFIG to unblock build
export type Plan = string;
export const PLAN_CONFIG: { [key: string]: any } = {};
// Stub for WorkflowRun to unblock build
export type WorkflowRun = {
  id: string;
  workspaceId: string;
  policyKey: string;
  status?: string;
  // ...other fields as needed
};
// Stub for AgentPermissionPolicy to unblock build
export type AgentPermissionPolicy = any;
// Stub for ActorType to unblock build
export type ActorType = string;
// Minimal types for governance orchestrator logic

// Minimal AgentTask type for memoryIntegration
export type AgentTask = {
  workspaceId: string;
  agentId: string;
  priority?: string;
  // ...add more fields as needed
};

export type Agent = {
  id: string;
  // ...other fields as needed
};

export type Step = {
  id: string;
  // ...other fields as needed
};

export type ToolCall = {
  toolKey: string;
  input: any;
  stepId?: string;
  // ...other fields as needed
};
