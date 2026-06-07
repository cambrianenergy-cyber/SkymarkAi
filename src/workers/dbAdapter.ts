// src/workers/dbAdapter.ts
// import types from orchestrator if/when available

export function makeFirestoreDB(): any {
  return {
    async getWorkflow(workflowId: string, workspaceId: string): Promise<any> {
      // TODO: fetch from `workflows` where id == workflowId and workspaceId matches
      return null;
    },

    async getWorkflowRun(runId: string, workspaceId: string): Promise<any> {
      // TODO: fetch from `workflow_runs`
      return null;
    },

    async createOrUpdateRun(run): Promise<void> {
      // TODO: merge update to `workflow_runs/{runId}`
    },

    async setRunStatus({ workspaceId, runId, status, error, currentStepIndex }): Promise<void> {
      // TODO: update `workflow_runs/{runId}`
    },

    async upsertStepRecord({ workspaceId, runId, stepRecord }: any): Promise<void> {
      // TODO: set `workflow_runs/{runId}/steps/{stepId}` (subcollection) OR a top-level collection `workflow_run_steps`
    },

    async appendAuditLog(event: any): Promise<void> {
      // TODO: add to `audit_logs`
    },

    async isRunCanceled(workspaceId: string, runId: string): Promise<boolean> {
      // TODO: read run status flags
      return false;
    },

    async isRunPaused(workspaceId: string, runId: string): Promise<boolean> {
      // TODO: read run status flags
      return false;
    },

    async getPlanGate(workspaceId: string): Promise<any> {
      // TODO: load subscription/plan for workspace and build PlanGate
      return {
          plan: "accelerate",
        allowedAgentTypes: new Set(["lead_qualifier", "follow_up_writer"]),
        allowedAgentTypesList: ["lead_qualifier", "follow_up_writer"],
        hiddenAgentTypesList: [],
        limits: {
          maxStepsPerRun: 15,
          maxConcurrentRuns: 1,
        },
        features: {
          unifiedInbox: false,
          campaignGenerator: false,
          repurposeEngine: false,
          leadScoring: false,
          agencyMode: false,
          templateMarketplace: true,
          workflowAutomation: true,
          advancedAnalytics: false,
          webhooks: false,
          apiAccess: false,
        },
        seats: {
          included: 3,
          purchased: 3,
          used: 0,
          overagePriceId: null,
        },
        overrides: {
          forcePlan: null,
          unlimitedAgents: false,
          unlimitedRuns: false,
          unlimitedMembers: false,
          notes: null,
        },
        stripe: {
          livemode: false,
          latestInvoiceId: null,
          latestPaymentIntentId: null,
          defaultPaymentMethodId: null,
          collectionMethod: null,
          lastWebhookEventId: null,
        },
        maxStepsPerRun: 15,
        maxConcurrentRuns: 1,
      };
    },
  };
}
