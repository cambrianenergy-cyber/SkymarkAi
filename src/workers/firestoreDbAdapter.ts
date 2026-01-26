// src/workers/firestoreDbAdapter.ts
import {
  type OrchestratorDB,
  type Workflow,
  type WorkflowRun,
  type PlanGate,
  type StepRunRecord,
  type OrchestratorEvent,
  type RunStatus,
} from "@/src/workers/orchestrator";
import { getFirestore, FieldValue } from "@/lib/firebaseAdmin";
import { buildPlanGate } from "@/lib/planGate";
import { computeAllowedAgentTypes } from "@/src/billing/entitlements";

type WithId<T> = T & { id: string };

function cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  // Firestore rejects undefined values; remove them.
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = cleanUndefined(v as any);
    } else {
      out[k] = v;
    }
  }
  return out as Partial<T>;
}

function nowServer() {
  return FieldValue.serverTimestamp();
}

/**
 * Best practice adapter:
 * - workflows/{workflowId}
 * - workflow_runs/{runId}
 * - workflow_runs/{runId}/steps/{stepId}
 * - audit_logs/{autoId}
 * - subscriptions queried by workspaceId
 */
export function makeFirestoreDB(): OrchestratorDB {
  const db = getFirestore();

  const workflowsCol = db.collection("workflows");
  const runsCol = db.collection("workflow_runs");
  const auditCol = db.collection("audit_logs");
  const subsCol = db.collection("subscriptions");

  return {
    // ---------------------------
    // Workflows
    // ---------------------------
    async getWorkflow(workflowId: string, workspaceId: string): Promise<Workflow | null> {
      const ref = workflowsCol.doc(workflowId);
      const snap = await ref.get();
      if (!snap.exists) return null;

      const data = snap.data() as any;
      if (!data) return null;

      // Workspace isolation enforcement:
      if (data.workspaceId !== workspaceId) return null;

      return {
        id: snap.id,
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description ?? null,
        status: data.status,
        steps: Array.isArray(data.steps) ? data.steps : [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    },

    // ---------------------------
    // Runs
    // ---------------------------
    async getWorkflowRun(runId: string, workspaceId: string): Promise<WorkflowRun | null> {
      const ref = runsCol.doc(runId);
      const snap = await ref.get();
      if (!snap.exists) return null;

      const data = snap.data() as any;
      if (!data) return null;

      if (data.workspaceId !== workspaceId) return null;

      return {
        id: snap.id,
        workspaceId: data.workspaceId,
        workflowId: data.workflowId,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        currentStepIndex: data.currentStepIndex ?? 0,
        canceledAt: data.canceledAt ?? null,
        input: data.input ?? {},
        context: data.context ?? {},
        outputs: data.outputs ?? {},
        budget: data.budget ?? {},
        usage: data.usage ?? { stepsExecuted: 0, msElapsed: 0, tokensUsed: 0 },
        error: data.error ?? null,
      };
    },

    async createOrUpdateRun(run: Partial<WorkflowRun> & { id: string; workspaceId: string }): Promise<void> {
      const ref = runsCol.doc(run.id);

      const payload = cleanUndefined({
        ...run,
        updatedAt: nowServer(),
      } as any);

      // Use merge so partial updates don't clobber other fields
      await ref.set(payload, { merge: true });
    },

    async setRunStatus(args: {
      workspaceId: string;
      runId: string;
      status: RunStatus;
      error?: WorkflowRun["error"];
      currentStepIndex?: number;
    }): Promise<void> {
      const { workspaceId, runId, status, error, currentStepIndex } = args;

      const ref = runsCol.doc(runId);
      // Use a transaction to enforce workspace boundary
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw new Error("RUN_NOT_FOUND");

        const data = snap.data() as any;
        if (data.workspaceId !== workspaceId) throw new Error("WORKSPACE_MISMATCH");

        const update: Record<string, any> = {
          status,
          updatedAt: nowServer(),
        };

        if (currentStepIndex !== undefined) update.currentStepIndex = currentStepIndex;
        if (error !== undefined) update.error = error ?? null;

        if (status === "canceled") update.canceledAt = nowServer();
        if (status === "completed") update.completedAt = nowServer();
        if (status === "failed") update.failedAt = nowServer();

        tx.set(ref, cleanUndefined(update), { merge: true });
      });
    },

    // ---------------------------
    // Step records (subcollection)
    // ---------------------------
    async upsertStepRecord(args: { workspaceId: string; runId: string; stepRecord: StepRunRecord }): Promise<void> {
      const { workspaceId, runId, stepRecord } = args;

      const runRef = runsCol.doc(runId);
      const stepRef = runRef.collection("steps").doc(stepRecord.stepId);

      await db.runTransaction(async (tx) => {
        const runSnap = await tx.get(runRef);
        if (!runSnap.exists) throw new Error("RUN_NOT_FOUND");

        const runData = runSnap.data() as any;
        if (runData.workspaceId !== workspaceId) throw new Error("WORKSPACE_MISMATCH");

        const payload = cleanUndefined({
          ...stepRecord,
          updatedAt: nowServer(),
          createdAt: FieldValue.serverTimestamp(), // safe even on merge
          workspaceId,
          runId,
        } as any);

        // merge to preserve earlier attempts if you re-upsert
        tx.set(stepRef, payload, { merge: true });
      });
    },

    // ---------------------------
    // Audit logs
    // ---------------------------
    async appendAuditLog(event: OrchestratorEvent): Promise<void> {
      // IMPORTANT: event.workspaceId is optional in type to avoid TS null errors
      // but we enforce it here for Uqentra:
      const workspaceId = event.workspaceId ?? null;

      await auditCol.add(
        cleanUndefined({
          ...event,
          workspaceId,
          createdAt: nowServer(),
        } as any)
      );
    },

    // ---------------------------
    // Pause / Cancel Signals
    // ---------------------------
    async isRunCanceled(workspaceId: string, runId: string): Promise<boolean> {
      const ref = runsCol.doc(runId);
      const snap = await ref.get();
      if (!snap.exists) return true; // treat missing as canceled
      const data = snap.data() as any;
      if (!data || data.workspaceId !== workspaceId) return true;

      return data.status === "canceled";
    },

    async isRunPaused(workspaceId: string, runId: string): Promise<boolean> {
      const ref = runsCol.doc(runId);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const data = snap.data() as any;
      if (!data || data.workspaceId !== workspaceId) return false;

      return data.status === "paused";
    },

    // ---------------------------
    // Subscriptions → Plan Gate
    // ---------------------------
    async getPlanGate(workspaceId: string): Promise<PlanGate> {
      // Pattern A: subscriptions docs might be keyed by workspaceId
      const directRef = subsCol.doc(workspaceId);
      const directSnap = await directRef.get();

      let sub: any | null = null;

      if (directSnap.exists) {
        const d = directSnap.data() as any;
        if (d?.workspaceId === workspaceId || d?.workspaceId === undefined) {
          sub = { id: directSnap.id, ...d };
        }
      }

      // Pattern B: query by workspaceId (most common)
      if (!sub) {
        const q = await subsCol
          .where("workspaceId", "==", workspaceId)
          .limit(1)
          .get();

        if (!q.empty) {
          sub = { id: q.docs[0].id, ...(q.docs[0].data() as any) };
        }
      }

      // New schema: basePlan + packs + specialty agents + entitlements
      // Legacy: plan/tier/package fields
      let effectivePlan: PlanGate["plan"] = "accelerate";
      
      if (sub?.basePlan) {
        // New schema
        const basePlanKey = sub.basePlan.key ?? "accelerate";
        const basePlanStatus = sub.basePlan.status ?? "inactive";
        
        const normalizedPlan =
          basePlanKey === "founder" ? "founder" :
          basePlanKey === "sovereign" ? "sovereign" :
          basePlanKey === "dominion" ? "dominion" :
          "accelerate";
        
        effectivePlan =
          basePlanStatus === "active" || basePlanStatus === "trialing"
            ? (normalizedPlan as PlanGate["plan"])
            : ("accelerate" as const);
      } else {
        // Legacy schema
        const rawPlan = (sub?.plan ?? sub?.tier ?? sub?.package ?? "accelerate") as string;
        const status = (sub?.status ?? "inactive") as string;

        const normalizedPlan =
          rawPlan === "founder" ? "founder" :
          rawPlan === "sovereign" ? "sovereign" :
          rawPlan === "dominion" ? "dominion" :
          "accelerate";

        effectivePlan =
          status === "active" || status === "trialing"
            ? (normalizedPlan as PlanGate["plan"])
            : ("accelerate" as const);
      }

      // Force plan override
      if (sub?.overrides?.forcePlan) {
        effectivePlan = sub.overrides.forcePlan as PlanGate["plan"];
      }

      // Base defaults from plan
      const defaults = buildPlanGate(effectivePlan);

      // Compute effective allowed agents using the new entitlements logic
      // This ensures packs and specialty agents are properly merged
      let finalAllowedAgents: string[] = defaults.allowedAgentTypesList;
      
      if (sub && typeof sub === "object") {
        // Use the centralized entitlements computation function
        // It handles: base plan + packs + specialty agents + overrides
        const computed = computeAllowedAgentTypes(sub);
        if (Array.isArray(computed) && computed.length > 0) {
          finalAllowedAgents = computed;
        }
      } else if (Array.isArray(sub?.allowedAgentTypes)) {
        // Legacy override for backward compatibility
        finalAllowedAgents = sub.allowedAgentTypes as string[];
      }

      // Merge limits from entitlements or legacy overrides
      let finalLimits = defaults.limits;
      if (sub?.entitlements?.limits && typeof sub.entitlements.limits === "object") {
        finalLimits = { ...defaults.limits, ...sub.entitlements.limits };
      } else if (sub?.limits && typeof sub.limits === "object") {
        finalLimits = { ...defaults.limits, ...sub.limits };
      }

      // Apply unlimited overrides
      if (sub?.overrides?.unlimitedAgents) {
        finalLimits = { ...finalLimits, maxAgents: 999999, maxActiveAgents: 999999 };
      }
      if (sub?.overrides?.unlimitedRuns) {
        finalLimits = { ...finalLimits, maxWorkflowRunsPerDay: 999999, maxConcurrentRuns: 999999 };
      }
      if (sub?.overrides?.unlimitedMembers) {
        finalLimits = { ...finalLimits, maxTeamMembers: 999999 };
      }

      // Hidden agents (from legacy or new)
      const overrideHidden = Array.isArray(sub?.hiddenAgentTypes) ? sub.hiddenAgentTypes as string[] : (defaults.hiddenAgentTypesList ?? []);

      // Features
      const overrideFeatures = typeof sub?.features === "object" ? { ...defaults.features, ...sub.features } : defaults.features;

      // Seats
      const overrideSeats = typeof sub?.seats === "object" ? { ...defaults.seats, ...sub.seats } : defaults.seats;

      // Overrides
      const overrideOverrides = typeof sub?.overrides === "object" ? { ...defaults.overrides, ...sub.overrides } : defaults.overrides;

      // Stripe metadata (new schema has nested stripe object)
      let finalStripe = defaults.stripe;
      if (sub?.stripe && typeof sub.stripe === "object") {
        finalStripe = {
          livemode: sub.stripe.livemode ?? false,
          latestInvoiceId: sub.stripe.latestInvoiceId ?? null,
          latestPaymentIntentId: sub.stripe.latestPaymentIntentId ?? null,
          defaultPaymentMethodId: sub.stripe.defaultPaymentMethodId ?? null,
          collectionMethod: sub.stripe.collectionMethod ?? null,
          lastWebhookEventId: sub.stripe.lastWebhookEventId ?? null,
        };
      }

      return {
        ...defaults,
        plan: effectivePlan,
        allowedAgentTypes: new Set(finalAllowedAgents),
        allowedAgentTypesList: finalAllowedAgents,
        hiddenAgentTypesList: overrideHidden,
        limits: finalLimits,
        features: overrideFeatures,
        seats: overrideSeats,
        overrides: overrideOverrides,
        stripe: finalStripe,
        // keep legacy fields aligned
        maxStepsPerRun: finalLimits?.maxStepsPerRun ?? defaults.maxStepsPerRun,
        maxConcurrentRuns: finalLimits?.maxConcurrentRuns ?? defaults.maxConcurrentRuns,
        maxWorkflowsPerDay: finalLimits?.maxWorkflowRunsPerDay ?? defaults.maxWorkflowsPerDay,
      };
    },
  };
}
