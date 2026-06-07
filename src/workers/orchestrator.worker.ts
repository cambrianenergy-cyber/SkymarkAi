// Sentry error monitoring
/// <reference types="node" />

import * as Sentry from "@sentry/node";
import { db, now, FieldValue, buildPlanGate } from "@/lib/firebaseAdmin";


if (process.env.SENTRY_DSN)
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1, // Adjust as needed
    environment: process.env.NODE_ENV || "development",
  });

// Helper: create approval task (could be a Firestore doc or notification)
async function createApprovalTask({ runId, step, workspaceId }: any) {
  const ref = db().collection("approval_tasks").doc();
  await ref.set({
    approvalTaskId: ref.id,
    runId,
    stepId: step.id || step.stepId,
    workspaceId,
    status: "pending",
    createdAt: now(),
    updatedAt: now(),
    instruction: step.instruction,
  });
  return ref.id;
}

// ...existing code for the rest of the file...

// Re-export the real implementation from .mts
export { executeWorkflowRun } from "./orchestrator.worker.mts";
// ...existing code...
