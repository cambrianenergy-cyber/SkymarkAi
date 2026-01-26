
import { AgentRunner, AgentRunnerInput, AgentRunnerOutput } from '../agentRunner';

export const OutboundProspectorRunner: AgentRunner = async (input: AgentRunnerInput): Promise<AgentRunnerOutput> => {
  // RBAC: Block agent execution for viewer role
  if (input.userRole === "viewer") {
    return {
      success: false,
      output: null,
      error: {
        message: "Agent execution is not allowed for 'viewer' role.",
        code: "RBAC_VIEWER_BLOCKED"
      }
    };
  }
  // Validate input
  if (!input.step.input || !input.step.input.prospectList || !Array.isArray(input.step.input.prospectList) || !input.step.input.message) {
    return {
      success: false,
      output: null,
      error: {
        message: 'Missing required prospectList array or message',
        code: 'INVALID_INPUT',
      }
    };
  }

  // Simulate outbound prospecting (replace with real integration)
  const results = input.step.input.prospectList.map((prospect: string) => ({
    prospect,
    message: input.step.input.message,
    contactedAt: new Date().toISOString(),
    status: 'contacted',
  }));

  return {
    success: true,
    output: {
      message: 'Outbound prospecting completed',
      results,
    },
  };
};
