
import { AgentRunner, AgentRunnerInput, AgentRunnerOutput } from "../agentRunner";
import { startAgentRun, logAgentRunSuccess, logAgentRunFailure } from "../agentRunLogger";

export const HashtagSEORunner: AgentRunner = async (input: AgentRunnerInput): Promise<AgentRunnerOutput> => {
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
      hashtagSets: [
        {
          postType: "educational",
          broad: ["#productivity", "#business", "#entrepreneurship"],
          mid: ["#workflowautomation", "#businessgrowth", "#digitaltools"],
          niche: ["#aitools2025", "#automationtips", "#productivityhacks"]
        },
        {
          postType: "story",
          broad: ["#motivation", "#success", "#mindset"],
          mid: ["#entrepreneurlife", "#startupjourney", "#growthmindset"],
          niche: ["#automationwin", "#techfounder", "#saaslife"]
        },
        {
          postType: "offer",
          broad: ["#marketing", "#businesstips", "#entrepreneur"],
          mid: ["#leadgeneration", "#digitalmarketing", "#businessstrategy"],
          niche: ["#workflowaudit", "#automationconsulting", "#efficiencyhacks"]
        }
      ],
      seoKeywords: ["workflow automation", "AI productivity", "business efficiency", "process optimization"],
      instruction: input.step.instruction
    };

    if (runId) {
      await logAgentRunSuccess({
        runId,
        workspaceId: input.workspaceId,
        outputs: {
          summary: `Generated hashtag sets and SEO keywords`,
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
          message: error.message || "Hashtag SEO execution failed",
          code: "EXECUTION_ERROR"
        },
        duration: Date.now() - startTime
      });
    }
    return {
      success: false,
      output: null,
      error: {
        message: error.message || "Hashtag SEO execution failed",
        code: "EXECUTION_ERROR"
      }
    };
  }
};
