import { db, now } from "./firestore";
import type { WorkflowRun } from "./types";
import { writeAuditLog } from "./audit";

export async function markWorkflowRunStatus(args: {
  workspaceId: string;
  runId: string;
  status: WorkflowRun["status"];
  meta?: Record<string, any>;
}) {
  const { workspaceId, runId, status, meta = {} } = args;

  const ref = db().doc(`workflow_runs/${runId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("NOT_FOUND: workflow_run");

  const before = snap.data() || {};
  const prevStatus = before.status;
  const allowedTransitions: Record<string, string[]> = {
    queued: ["running", "canceled"],
    running: ["succeeded", "failed", "partial", "canceled"],
    succeeded: [],
    failed: [],
    partial: [],
    canceled: [],
  };

  if (prevStatus && prevStatus !== status) {
    const allowed = allowedTransitions[prevStatus] || [];
    if (!allowed.includes(status)) {
      throw new Error(`Invalid workflow run status transition: ${prevStatus} → ${status}`);
    }
  }

  const patch: Record<string, any> = { status, updatedAt: now() };
  if (status === "running" && !before.startedAt) patch.startedAt = now();
  if (["succeeded", "failed", "canceled", "partial"].includes(status)) patch.endedAt = now();

  await ref.set(patch, { merge: true });

  await writeAuditLog({
    workspaceId,
    actorType: "system",
    actorId: "orchestrator",
    action: "workflow_run.status_changed",
    entityType: "workflow_run",
    entityId: runId,
    before,
    after: { ...before, ...patch },
    meta,
  });
}

export async function advanceWorkflowCursor(args: {
  workspaceId: string;
  runId: string;
  nextStepIndex: number;
  statePatch?: Record<string, any>;
}) {
  const { workspaceId, runId, nextStepIndex, statePatch = {} } = args;

  const ref = db().doc(`workflow_runs/${runId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("NOT_FOUND: workflow_run");

  const data = snap.data() as any;
  const cursor = data.cursor || { stepIndex: 0, state: {} };

  const newCursor = {
    stepIndex: nextStepIndex,
    state: { ...(cursor.state || {}), ...statePatch },
  };

  await ref.set({ cursor: newCursor, updatedAt: now() }, { merge: true });

  await writeAuditLog({
    workspaceId,
    actorType: "system",
    actorId: "orchestrator",
    action: "workflow_run.cursor_advanced",
    entityType: "workflow_run",
    entityId: runId,
    before: data,
    after: { ...data, cursor: newCursor, updatedAt: "serverTimestamp" },
    meta: { nextStepIndex },
  });
}
