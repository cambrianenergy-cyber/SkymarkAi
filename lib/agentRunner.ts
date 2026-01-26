// Agent Runner Interface
export interface AgentRunnerInput {
  workspaceId: string;
  runId: string;
  userRole?: "owner" | "admin" | "member" | "viewer";
  input?: any;
  step: {
    stepId: string;
    order: number;
    agentType: string;
    instruction: string;
    input?: any;
  };
}

export interface AgentRunnerOutput {
  success: boolean;
  output: any;
  logs?: any;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export type AgentRunContext = AgentRunnerInput;

export type AgentRunResult = AgentRunnerOutput;

export type AgentRunner = (input: AgentRunnerInput) => Promise<AgentRunnerOutput>;

// Abstract class for Agent Runners
export abstract class AgentRunnerBase {
  abstract run(config: any): Promise<any>;
}

// Simple default runner useful for tests and fallbacks
export const DefaultAgentRunner: AgentRunner = async (input) => ({
  success: true,
  output: { echo: input },
});
