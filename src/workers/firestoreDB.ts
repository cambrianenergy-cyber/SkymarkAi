import { getFirestore, Timestamp } from "@/lib/firebaseAdmin";
import type {
  OrchestratorDB,
  Workflow,
  WorkflowRun,
  StepRunRecord,
  OrchestratorEvent,
  PlanGate,
} from "./orchestrator";
import { buildPlanGate } from "../../lib/planGate";

export class FirestoreOrchestratorDB implements OrchestratorDB {
  private db = getFirestore();

  async getWorkflow(workflowId: string, workspaceId: string): Promise<Workflow | null> {
    try {
      const docSnap = await this.db.collection("workflows").doc(workflowId).get();
      
      if (!docSnap.exists) return null;
      
      const data = docSnap.data()!;
      
      // Verify workspace ownership
      if (data.workspaceId !== workspaceId) return null;
      
      return {
        id: docSnap.id,
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description ?? null,
        status: data.status ?? "active",
        steps: data.steps ?? [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.error("Error getting workflow:", error);
      return null;
    }
  }

  async getWorkflowRun(runId: string, workspaceId: string): Promise<WorkflowRun | null> {
    try {
      const docSnap = await this.db.collection("workflow_runs").doc(runId).get();
      
      if (!docSnap.exists) return null;
      
      const data = docSnap.data()!;
      
      // Verify workspace ownership
      if (data.workspaceId !== workspaceId) return null;
      
      return {
        id: docSnap.id,
        workspaceId: data.workspaceId,
        workflowId: data.workflowId,
        status: data.status ?? "queued",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        currentStepIndex: data.currentStepIndex ?? 0,
        canceledAt: data.canceledAt ?? null,
        input: data.input ?? {},
        context: data.context ?? {},
        outputs: data.outputs ?? {},
        budget: {
          maxSteps: data.budget?.maxSteps,
          maxMs: data.budget?.maxMs,
          maxTokens: data.budget?.maxTokens,
        },
        usage: {
          stepsExecuted: data.usage?.stepsExecuted ?? 0,
          msElapsed: data.usage?.msElapsed ?? 0,
          tokensUsed: data.usage?.tokensUsed ?? 0,
        },
        error: data.error ?? null,
      };
    } catch (error) {
      console.error("Error getting workflow run:", error);
      return null;
    }
  }

  async createOrUpdateRun(run: Partial<WorkflowRun> & { id: string; workspaceId: string }): Promise<void> {
    try {
      const docRef = this.db.collection("workflow_runs").doc(run.id);
      const updateData: any = {
        workspaceId: run.workspaceId,
        updatedAt: Timestamp.now(),
      };

      if (run.workflowId) updateData.workflowId = run.workflowId;
      if (run.status) updateData.status = run.status;
      if (run.currentStepIndex !== undefined) updateData.currentStepIndex = run.currentStepIndex;
      if (run.context) updateData.context = run.context;
      if (run.outputs) updateData.outputs = run.outputs;
      if (run.usage) updateData.usage = run.usage;
      if (run.error !== undefined) updateData.error = run.error;

      await docRef.set(updateData, { merge: true });
    } catch (error) {
      console.error("Error creating/updating run:", error);
      throw error;
    }
  }

  async setRunStatus(args: {
    workspaceId: string;
    runId: string;
    status: WorkflowRun["status"];
    error?: WorkflowRun["error"];
    currentStepIndex?: number;
  }): Promise<void> {
    try {
      const docRef = this.db.collection("workflow_runs").doc(args.runId);
      const updateData: any = {
        status: args.status,
        updatedAt: Timestamp.now(),
      };

      if (args.currentStepIndex !== undefined) {
        updateData.currentStepIndex = args.currentStepIndex;
      }

      if (args.error !== undefined) {
        updateData.error = args.error;
      }

      if (args.status === "completed") {
        updateData.completedAt = Timestamp.now();
      }

      if (args.status === "canceled") {
        updateData.canceledAt = Timestamp.now();
      }

      await docRef.update(updateData);
    } catch (error) {
      console.error("Error setting run status:", error);
      throw error;
    }
  }

  async upsertStepRecord(args: { workspaceId: string; runId: string; stepRecord: StepRunRecord }): Promise<void> {
    try {
      const docRef = this.db
        .collection("workflow_runs")
        .doc(args.runId)
        .collection("steps")
        .doc(args.stepRecord.stepId);

      const stepData: any = {
        stepId: args.stepRecord.stepId,
        order: args.stepRecord.order,
        agentType: args.stepRecord.agentType,
        status: args.stepRecord.status,
        attempts: args.stepRecord.attempts,
        input: args.stepRecord.input,
        updatedAt: Timestamp.now(),
      };

      if (args.stepRecord.startedAt) stepData.startedAt = args.stepRecord.startedAt;
      if (args.stepRecord.endedAt) stepData.endedAt = args.stepRecord.endedAt;
      if (args.stepRecord.output !== undefined) stepData.output = args.stepRecord.output;
      if (args.stepRecord.error !== undefined) stepData.error = args.stepRecord.error;
      if (args.stepRecord.ms !== undefined) stepData.ms = args.stepRecord.ms;

      await docRef.set(stepData, { merge: true });
    } catch (error) {
      console.error("Error upserting step record:", error);
      throw error;
    }
  }

  async appendAuditLog(event: OrchestratorEvent): Promise<void> {
    try {
      await this.db.collection("orchestrator_logs").add({
        ...event,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error appending audit log:", error);
      // Don't throw - logging shouldn't break execution
    }
  }

  async isRunCanceled(workspaceId: string, runId: string): Promise<boolean> {
    try {
      const docSnap = await this.db.collection("workflow_runs").doc(runId).get();
      if (!docSnap.exists) return false;
      
      const data = docSnap.data()!;
      return data.workspaceId === workspaceId && data.status === "canceled";
    } catch (error) {
      console.error("Error checking if run canceled:", error);
      return false;
    }
  }

  async isRunPaused(workspaceId: string, runId: string): Promise<boolean> {
    try {
      const docSnap = await this.db.collection("workflow_runs").doc(runId).get();
      if (!docSnap.exists) return false;
      
      const data = docSnap.data()!;
      return data.workspaceId === workspaceId && data.status === "paused";
    } catch (error) {
      console.error("Error checking if run paused:", error);
      return false;
    }
  }

  async getPlanGate(workspaceId: string): Promise<PlanGate> {
    try {
      const workspaceSnap = await this.db.collection("workspaces").doc(workspaceId).get();
      
      if (!workspaceSnap.exists) {
          // Default to accelerate plan
          return buildPlanGate("accelerate");
      }
      
        const data = workspaceSnap.data()!;
        const plan = data.plan ?? "accelerate";
      
      return buildPlanGate(plan);
    } catch (error) {
      console.error("Error getting plan gate:", error);
        // Fail-safe: return accelerate plan
        return buildPlanGate("accelerate");
    }
  }
}
