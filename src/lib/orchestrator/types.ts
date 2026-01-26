// Minimal types for governance orchestrator logic
export type WorkflowRun = {
  id: string;
  workspaceId: string;
  policyKey: string;
  // ...other fields as needed
};

// Minimal AgentTask type for memoryIntegration
export type AgentTask = {
  workspaceId: string;
  agentId: string;
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
