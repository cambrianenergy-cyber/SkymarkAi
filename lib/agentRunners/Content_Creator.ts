
import { AgentRunner, AgentRunnerInput, AgentRunnerOutput } from "../agentRunner";
import { startAgentRun, logAgentRunSuccess, logAgentRunFailure } from "../agentRunLogger";

export const ContentCreatorRunner: AgentRunner = async (input: AgentRunnerInput): Promise<AgentRunnerOutput> => {
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

    await new Promise(resolve => setTimeout(resolve, 1200));

    const output = {
      posts: [
        {
          type: "educational",
          hook: " 3 AI tools that will 10x your productivity",
          content: "Stop working harder. Start working smarter...",
          cta: "Save this for later ",
          platform: "LinkedIn"
        },
        {
          type: "story",
          hook: "I wasted 6 months before learning this...",
          content: "Here's the truth about automation that no one tells you...",
          cta: "Comment 'YES' if you want the full guide",
          platform: "Instagram"
        },
        {
          type: "offer",
          hook: "Limited time: Free workflow automation audit",
          content: "We'll analyze your current process and show you exactly where to automate...",
          cta: "DM me 'AUDIT' to claim yours",
          platform: "Twitter"
        }
      ],
      instruction: input.step.instruction
    };

    if (runId) {
      await logAgentRunSuccess({
        runId,
        workspaceId: input.workspaceId,
        outputs: {
          summary: `Generated content posts`,
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
          message: error.message || "Content Creator execution failed",
          code: "EXECUTION_ERROR"
        },
        duration: Date.now() - startTime
      });
    }
    return {
      success: false,
      output: null,
      error: {
        message: error.message || "Content Creator execution failed",
        code: "EXECUTION_ERROR"
      }
    };
  }
};

