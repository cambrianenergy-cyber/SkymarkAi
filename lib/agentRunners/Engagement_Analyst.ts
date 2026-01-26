
import { AgentRunner, AgentRunnerInput, AgentRunnerOutput } from "../agentRunner";
import { startAgentRun, logAgentRunSuccess, logAgentRunFailure } from "../agentRunLogger";

export const EngagementAnalystRunner: AgentRunner = async (input: AgentRunnerInput): Promise<AgentRunnerOutput> => {
  const startTime = Date.now();
  let runId: string | undefined;
  try {
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
    // Start agent run logging
    runId = await startAgentRun({
      workspaceId: input.workspaceId,
      agentType: input.step.agentType,
      channel: "api",
      triggerSource: "workflow",
      triggerDescription: input.step.instruction,
      inputs: input.step.input,
      correlationId: input.runId,
      workflowRunId: input.runId
    });

    // Workspace enforcement: agent must only run in its assigned workspace
    const agentWorkspaceId = input.step.input?.agentWorkspaceId || input.step.input?.workspaceId;
    const currentWorkspaceId = input.workspaceId;
    if (agentWorkspaceId && agentWorkspaceId !== currentWorkspaceId) {
      if (runId) {
        await logAgentRunFailure({
          runId,
          workspaceId: input.workspaceId,
          error: {
            message: `Workspace mismatch: agent belongs to ${agentWorkspaceId}, but current workspace is ${currentWorkspaceId}`,
            code: "WORKSPACE_ISOLATION_ERROR"
          },
          duration: Date.now() - startTime
        });
      }
      return {
        success: false,
        output: null,
        error: {
          message: `Workspace mismatch: agent belongs to ${agentWorkspaceId}, but current workspace is ${currentWorkspaceId}`,
          code: "WORKSPACE_ISOLATION_ERROR"
        }
      };
    }

    await new Promise(resolve => setTimeout(resolve, 600));

    const output = {
      performanceMetrics: {
        totalEngagement: 2847,
        topPerformingPost: "AI tools productivity post - 892 engagements",
        engagementRate: "4.2%",
        bestPlatform: "LinkedIn (5.1% engagement rate)",
        worstPlatform: "Twitter (2.3% engagement rate)"
      },
      insights: [
        "Educational content performs 3x better than promotional",
        "Posts with numbers in headlines get 40% more clicks",
        "Video content has 2.5x higher engagement than static images",
        "Posting between 9-11 AM yields 50% more engagement"
      ],
      recommendations: [
        "Double down on LinkedIn educational content",
        "Reduce Twitter frequency, focus on threads",
        "Add more data/statistics to hooks",
        "Test more video content formats"
      ],
      instruction: input.step.instruction
    };

    if (runId) {
      await logAgentRunSuccess({
        runId,
        workspaceId: input.workspaceId,
        outputs: {
          summary: `Generated engagement analysis`,
        },
        duration: Date.now() - startTime
      });
    }

    return {
      success: true,
      output
    };
  } catch (error: any) {
    if (runId) {
      await logAgentRunFailure({
        runId,
        workspaceId: input.workspaceId,
        error: {
          message: error.message || "Engagement Analyst execution failed",
          code: "EXECUTION_ERROR"
        },
        duration: Date.now() - startTime
      });
    }
    return {
      success: false,
      output: null,
      error: {
        message: error.message || "Engagement Analyst execution failed",
        code: "EXECUTION_ERROR"
      }
    };
  }
};
