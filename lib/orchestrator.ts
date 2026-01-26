import { db } from "./firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getAgentRunner } from "./agentRunnerRegistry";
import { AgentRunnerInput } from "./agentRunner";
import { writeToDeadLetterQueue } from "./deadLetterQueue";

interface WorkflowStep {
  stepId: string;
  order: number;
  agentType: string;
  instruction: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  input?: any;
  output?: any;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

interface WorkflowRun {
  workspaceId: string;
  workflowId: string;
  workflowName: string;
  runType: "manual" | "scheduled" | "api" | "test";
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  createdByUid: string;
  createdByName: string;
  inputs: any;
  outputs: any;
  steps: WorkflowStep[];
  progress: {
    totalSteps: number;
    completedSteps: number;
    currentStepOrder: number;
  };
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class Orchestrator {
  /**
   * Execute the next pending step in a workflow run
   */
  static async executeNextStep(runId: string): Promise<{ success: boolean; message: string }> {
    try {
      const runRef = doc(db, "workflow_runs", runId);
      const runSnap = await getDoc(runRef);

      if (!runSnap.exists()) {
        return { success: false, message: "Run not found" };
      }

      const runData = runSnap.data() as WorkflowRun;

      // Check if run is in valid state to execute
      if (runData.status === "completed" || runData.status === "failed" || runData.status === "canceled") {
        return { success: false, message: `Run is already ${runData.status}` };
      }


      // Find the next pending step
      const nextStep = runData.steps.find((s) => s.status === "pending");

      if (!nextStep) {
        // No more pending steps - mark run as completed
        await updateDoc(runRef, {
          status: "completed",
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { success: true, message: "All steps completed" };
      }

      // --- Channel disable check ---
      // Load workspace to check for disabled channels
      const wsRef = doc(db, "workspaces", runData.workspaceId);
      const wsSnap = await getDoc(wsRef);
      const wsData = wsSnap.exists() ? wsSnap.data() : {};
      const disabledChannels: string[] = wsData.disabledChannels || [];
      // Try to infer channel from step input or instruction (assume step.input.channel or step.input.platform)
      let stepChannel = '';
      if (nextStep.input && typeof nextStep.input === 'object') {
        stepChannel = nextStep.input.channel || nextStep.input.platform || '';
      }
      // If this step requires a disabled channel, pause the workflow
      if (stepChannel && disabledChannels.includes(stepChannel)) {
        // Mark workflow as paused and log warning
        await updateDoc(runRef, {
          status: "paused",
          error: {
            message: `Workflow paused: Channel '${stepChannel}' is disabled at the workspace level. Re-enable the channel to continue.`,
            code: "CHANNEL_DISABLED",
          },
          updatedAt: serverTimestamp(),
        });
        return { success: false, message: `Workflow paused: Channel '${stepChannel}' is disabled.` };
      }

      // Update run status to running if it's queued
      if (runData.status === "queued") {
        await updateDoc(runRef, {
          status: "running",
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Update step status to running
      const updatedSteps = runData.steps.map((s) =>
        s.stepId === nextStep.stepId
          ? { ...s, status: "running" as const, startedAt: Timestamp.now() }
          : s
      );

      await updateDoc(runRef, {
        steps: updatedSteps,
        "progress.currentStepOrder": nextStep.order,
        updatedAt: serverTimestamp(),
      });

      // Get the agent runner

      // --- Plan/Add-on Gating ---
      // Define premium/add-on agent types (should match registry descriptions)
      const premiumAgents = [
        "Content_Writer",
        "Brand_Architect",
        "Social_Analytics_Pro",
        "Video_Script_Generator",
        "Email_Sequence_Strategist",
        "Community_Manager"
      ];
      // Only allow premium agents if workspace plan is not 'free'
      const wsPlan = wsData.plan || "free";
      if (premiumAgents.includes(nextStep.agentType) && wsPlan === "free") {
        // Mark step as failed and log error
        const failedSteps = updatedSteps.map((s) =>
          s.stepId === nextStep.stepId
            ? {
                ...s,
                status: "failed" as const,
                completedAt: Timestamp.now(),
                error: {
                  message: `Agent '${nextStep.agentType}' is a premium add-on. Upgrade your plan to use this agent.`,
                  code: "PLAN_RESTRICTED_AGENT",
                },
              }
            : s
        );
        await updateDoc(runRef, {
          steps: failedSteps,
          status: "failed",
          error: {
            message: `Agent '${nextStep.agentType}' is a premium add-on. Upgrade your plan to use this agent.`,
            code: "PLAN_RESTRICTED_AGENT",
          },
          updatedAt: serverTimestamp(),
        });
        return { success: false, message: `Agent '${nextStep.agentType}' is a premium add-on. Upgrade your plan to use this agent.` };
      }

      const agentRunner = getAgentRunner(nextStep.agentType);

      if (!agentRunner) {
        // Agent runner not found - fail the step
        const failedSteps = updatedSteps.map((s) =>
          s.stepId === nextStep.stepId
            ? {
                ...s,
                status: "failed" as const,
                completedAt: Timestamp.now(),
                error: {
                  message: `Agent runner not found for type: ${nextStep.agentType}`,
                  code: "AGENT_NOT_FOUND",
                },
              }
            : s
        );

        await updateDoc(runRef, {
          steps: failedSteps,
          status: "failed",
          error: {
            message: `Agent runner not found for type: ${nextStep.agentType}`,
            code: "AGENT_NOT_FOUND",
          },
          updatedAt: serverTimestamp(),
        });

        return { success: false, message: `Agent runner not found: ${nextStep.agentType}` };
      }

      // Execute the agent runner
      const input: AgentRunnerInput = {
        workspaceId: runData.workspaceId,
        runId,
        step: {
          stepId: nextStep.stepId,
          order: nextStep.order,
          agentType: nextStep.agentType,
          instruction: nextStep.instruction,
          input: nextStep.input,
        },
      };

      const result = await agentRunner(input);

      if (result.success) {
        // Update step as completed
        const completedSteps = updatedSteps.map((s) =>
          s.stepId === nextStep.stepId
            ? {
                ...s,
                status: "completed" as const,
                completedAt: Timestamp.now(),
                output: result.output,
              }
            : s
        );

        const completedCount = completedSteps.filter((s) => s.status === "completed").length;

        await updateDoc(runRef, {
          steps: completedSteps,
          "progress.completedSteps": completedCount,
          updatedAt: serverTimestamp(),
        });

        return { success: true, message: `Step ${nextStep.order} completed successfully` };
      } else {
        // Step failed
        const failedSteps = updatedSteps.map((s) =>
          s.stepId === nextStep.stepId
            ? {
                ...s,
                status: "failed" as const,
                completedAt: Timestamp.now(),
                error: result.error,
              }
            : s
        );

        await updateDoc(runRef, {
          steps: failedSteps,
          status: "failed",
          error: result.error,
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return {
          success: false,
          message: `Step ${nextStep.order} failed: ${result.error?.message}`,
        };
      }
    } catch (error: any) {
      console.error("Orchestrator error:", error);
      // Write to dead letter queue for unhandled orchestrator exception
      await writeToDeadLetterQueue({
        type: 'orchestrator_event',
        payload: { runId, context: 'executeNextStep' },
        error: error.message || 'Orchestrator execution failed',
      });
      return {
        success: false,
        message: error.message || "Orchestrator execution failed",
      };
    }
  }

  /**
   * Execute all remaining steps in a workflow run
   */
  static async executeAllSteps(runId: string): Promise<{ success: boolean; message: string }> {
    try {
      let continueExecution = true;
      let lastResult: { success: boolean; message: string } = { success: true, message: "Starting execution" };

      while (continueExecution) {
        lastResult = await this.executeNextStep(runId);

        if (!lastResult.success) {
          continueExecution = false;
        } else if (lastResult.message === "All steps completed") {
          continueExecution = false;
        }
      }

      return lastResult;
    } catch (error: any) {
      console.error("Execute all steps error:", error);
      // Write to dead letter queue for unhandled orchestrator exception
      await writeToDeadLetterQueue({
        type: 'orchestrator_event',
        payload: { runId, context: 'executeAllSteps' },
        error: error.message || 'Failed to execute all steps',
      });
      return {
        success: false,
        message: error.message || "Failed to execute all steps",
      };
    }
  }
}
