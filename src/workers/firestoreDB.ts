import { getFirestore } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
// import types from orchestrator if/when available
import { buildPlanGate } from "../../lib/planGate";

// Temporary type definitions (replace with real imports if available)
type WorkflowRun = {
  status: string;
  error?: any;
};
type StepRunRecord = {
  stepId: string;
  order: number;
  agentType: string;
  status: string;
  attempts: number;
  input: any;
  startedAt?: any;
  endedAt?: any;
  output?: any;
  error?: any;
  ms?: number;
};
type OrchestratorEvent = Record<string, any>;
type PlanGate = ReturnType<typeof buildPlanGate>;

// Define WorkspaceData type for Firestore workspace documents
type WorkspaceData = {
  plan?: string;
  [key: string]: any;
};

export class FirestoreOrchestratorDB {
  private db: any = getFirestore();

  // Removed duplicate setRunStatus method

  async getWorkflowRun(runId: string, workspaceId: string): Promise<any> {
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

  async createOrUpdateRun(run: any): Promise<void> {
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
      
      const data = workspaceSnap.data() as WorkspaceData;
      const plan = data.plan ?? "accelerate";
      
      return buildPlanGate(plan);
    } catch (error) {
      console.error("Error getting plan gate:", error);
        // Fail-safe: return accelerate plan
        return buildPlanGate("accelerate");
    }
  }
}
