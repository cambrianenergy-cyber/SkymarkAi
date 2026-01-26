
import { AgentRunner, AgentRunnerInput, AgentRunnerOutput } from "../agentRunner";
import { startAgentRun, logAgentRunSuccess, logAgentRunFailure } from "../agentRunLogger";

export const CopywriterRunner: AgentRunner = async (input: AgentRunnerInput): Promise<AgentRunnerOutput> => {
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

    await new Promise(resolve => setTimeout(resolve, 900));

    const output = {
      variations: [
        {
          hook: "The #1 mistake killing your productivity (and how to fix it in 5 minutes)",
          tone: "urgent",
          emotional_appeal: "fear_of_missing_out"
        },
        {
          hook: "What if I told you there's a way to get 3 hours back every day?",
          tone: "curious",
          emotional_appeal: "curiosity"
        },
        {
          hook: "My clients are automating 80% of their busywork. Here's exactly how...",
          tone: "conversational",
          emotional_appeal: "social_proof"
        }
      ],
      bestPerformer: "Variation 3 - social proof + specificity drives action",
      instruction: input.step.instruction
    };

    if (runId) {
      await logAgentRunSuccess({
        runId,
        workspaceId: input.workspaceId,
        outputs: {
          summary: `Generated copy variations`,
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
          message: error.message || "Copywriter execution failed",
          code: "EXECUTION_ERROR"
        },
        duration: Date.now() - startTime
      });
    }
    return {
      success: false,
      output: null,
      error: {
        message: error.message || "Copywriter execution failed",
        code: "EXECUTION_ERROR"
      }
    };
  }
};
