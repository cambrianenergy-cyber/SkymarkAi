// Sentry error monitoring
/// <reference types="node" />
// ...existing code...
// Sentry error monitoring
import * as Sentry from "@sentry/node";
import { loadConfig } from "../lib/config";
// ...existing code...

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1, // Adjust as needed
    environment: process.env.NODE_ENV || "development",
  });
}

// Helper: create approval task (could be a Firestore doc or notification)
async function createApprovalTask({ runId, step, workspaceId }: any) {
  // For now, just create a doc in 'approval_tasks' collection
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

let config: any;
(async () => {
  config = await loadConfig();
})();
// This file should be run as a Node.js process (not a React component)
  import { adminDb, adminFieldValue } from "../lib/firebaseAdmin";
  import { AI_COLLECTIONS } from "../lib/aiCollections.firestore";


// --- Types ---
// (Removed duplicate/invalid type definitions. Use types from ../lib/orchestrator/types)



import { db as getDb, now, col, doc } from "../lib/orchestrator/firestore";
import { markWorkflowRunStatus, advanceWorkflowCursor } from "../lib/orchestrator/workflow";
import type { WorkflowRun, AgentTask } from "../lib/orchestrator/types";

const db = () => getDb();

async function getWorkflowRun(runId: string): Promise<WorkflowRun | null> {
  const snap = await db().collection("workflow_runs").doc(runId).get();
  if (!snap.exists) return null;
  // snap.data() may not have all WorkflowRun fields, so merge carefully
  const data = snap.data() || {};
  return {
    ...data,
    runId: snap.id,
  } as WorkflowRun;
}

async function findQueuedWorkflowRun(): Promise<WorkflowRun | null> {
  // TODO: Pass workspaceId as argument for isolation
  // Example: findQueuedWorkflowRun(workspaceId: string)
  // const snap = await db().collection("workflow_runs")
  //   .where("workspaceId", "==", workspaceId)
  //   .where("status", "==", "queued")
  //   .limit(1).get();
  const snap = await db().collection("workflow_runs")
    .where("status", "==", "queued")
    .limit(1).get();
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  const data = docSnap.data() || {};
  return {
    ...data,
    runId: docSnap.id,
  } as WorkflowRun;
}

async function getWorkflow(workflowId: string): Promise<any | null> {
  const snap = await db().collection("workflows").doc(workflowId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

const LOCK_TTL_MS = 30000; // 30 seconds
const LOCK_HEARTBEAT_MS = 10000; // 10 seconds

async function acquireRunLock(runId: string) {
  const ref = db().collection("workflow_runs").doc(runId);
  let acquired = false;
  await db().runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const data = snap.data() as any;
    const nowTs = Date.now();
    let lockedAt = 0;
    if (data.runLock && data.runLock.locked && data.runLock.lockedAt) {
      lockedAt = typeof data.runLock.lockedAt === "number" ? data.runLock.lockedAt : (data.runLock.lockedAt.toMillis?.() ?? 0);
    }
    // If lock is present and not stale, do not acquire
    if (data.runLock && data.runLock.locked && lockedAt && nowTs - lockedAt < LOCK_TTL_MS) return;
    // Otherwise, acquire or steal lock
    tx.set(ref, { runLock: { locked: true, lockedAt: nowTs } }, { merge: true });
    acquired = true;
  });
  return { acquired };
}

// Heartbeat: update lockedAt to keep lock alive
async function heartbeatRunLock(runId: string) {
  const ref = db().collection("workflow_runs").doc(runId);
  await ref.set({ runLock: { locked: true, lockedAt: Date.now() } }, { merge: true });
}

async function releaseRunLock(runId: string) {
  await db().collection("workflow_runs").doc(runId).set({ runLock: { locked: false, lockedAt: null } }, { merge: true });
}

async function markRunRunning(runId: string) {
  await markWorkflowRunStatus({ workspaceId: "", runId, status: "running" });
}

async function completeRun(runId: string) {
  await markWorkflowRunStatus({ workspaceId: "", runId, status: "succeeded" });
}

async function failRun(runId: string, error: string) {
  await markWorkflowRunStatus({ workspaceId: "", runId, status: "failed", meta: { error } });
}

async function audit(runId: string, action: string, meta: any) {
  // Optionally implement audit log
}


// Returns all steps ready to execute (no unmet dependencies, not completed/failed)
function getReadySteps(workflow: any, run: WorkflowRun): any[] {
  if (!workflow.steps) return [];
  const steps = workflow.steps;
  const runSteps = (run.cursor && run.cursor.state && Array.isArray(run.cursor.state.steps)) ? run.cursor.state.steps : [];
  const completed = new Set(runSteps.filter((s: any) => s.status === "completed").map((s: any) => s.id));
  const failed = new Set(runSteps.filter((s: any) => s.status === "failed").map((s: any) => s.id));
  return steps.filter((step: any) => {
    const stepStatus = runSteps.find((s: any) => s.id === step.id)?.status;
    if (stepStatus === "completed" || stepStatus === "failed") return false;
    if (Array.isArray(step.dependencies) && step.dependencies.length > 0) {
      // All dependencies must be completed
      return step.dependencies.every((dep: string) => completed.has(dep));
    }
    return true;
  });
}

async function createTasksForStep({ runId, workflowId, step, workspaceId, context }: any): Promise<AgentTask[]> {
  // Create a single agent_task for the step
  const ref = db().collection("agent_tasks").doc();
  const agentTask: AgentTask = {
    workspaceId,
    taskId: ref.id,
    agentId: step.agentType,
    title: step.prompt,
    description: step.prompt,
    priority: "normal",
    status: "queued",
    createdBy: { type: "system", id: null },
    attempts: 0,
    createdAt: now(),
    updatedAt: now(),
    runContext: { workflowRunId: runId },
  };
  await ref.set(agentTask);
  return [agentTask];
}

async function dispatchTask(task: AgentTask) {
  // No-op: task is already queued
}

async function waitForTasks(ids: string[], opts: { timeoutMs: number }) {
  // Poll for all tasks to be done/failed
  const start = Date.now();
  while (Date.now() - start < opts.timeoutMs) {
    const snaps = await Promise.all(ids.map((id: string) => db().collection("agent_tasks").doc(id).get()));
    const allDone = snaps.every((snap: any) => {
      const st = snap.data()?.status;
      return st === "done" || st === "failed";
    });
    if (allDone) return snaps.map((snap: any) => snap.data());
    await new Promise(res => setTimeout(res, 2000));
  }
  return ids.map(() => ({ status: "timeout" }));
}

function applyTaskResultsToContext(context: any, step: any, results: any) {
  // Simple: just pass through
  const ok = results.every((r: any) => r.status === "done");
  return { updatedContext: context, stepOutcome: { ok, error: ok ? null : "Task(s) failed or timed out" } };
}

async function updateStepAndRunProgress({ runId, stepId, status, context, error }: any) {
  // Advance cursor and update step status/output/error in Firestore
  const run = await getWorkflowRun(runId);
  if (!run) return;
  // Find step index
  // Only advance stepIndex if step is completed/failed/skipped
  const idx = run.cursor?.stepIndex ?? 0;
  let steps = (run.cursor && run.cursor.state && Array.isArray(run.cursor.state.steps)) ? [...run.cursor.state.steps] : [];
  const stepIdx = steps.findIndex((s: any) => s.id === stepId);
  if (stepIdx !== -1) {
    const prev = steps[stepIdx] || {};
    let attempts = prev.attempts || 0;
    let startedAt = prev.startedAt || null;
    let completedAt = prev.completedAt || null;
    if (status === "running") {
      attempts += 1;
      if (!startedAt) startedAt = now();
    }
    if (["completed", "failed", "skipped"].includes(status)) {
      if (!completedAt) completedAt = now();
    }
    steps[stepIdx] = {
      ...prev,
      status,
      error: error || null,
      updatedAt: now(),
      attempts,
      startedAt,
      completedAt,
    };
  }
  await db().collection("workflow_runs").doc(runId).set({ updatedAt: now() }, { merge: true });
  // Only advance step pointer if step is terminal
  if (["completed", "failed", "skipped"].includes(status)) {
    await advanceWorkflowCursor({ workspaceId: run.workspaceId, runId, nextStepIndex: idx + 1, statePatch: { steps, context } });
  } else {
    await advanceWorkflowCursor({ workspaceId: run.workspaceId, runId, nextStepIndex: idx, statePatch: { steps, context } });
  }
}

// Classify error type for escalation policy
function classifyError(error: string): "tool_failure" | "model_failure" | "invalid_input" | "unknown" {
  if (!error) return "unknown";
  const msg = error.toLowerCase();
  if (msg.includes("tool") || msg.includes("api") || msg.includes("network")) return "tool_failure";
  if (msg.includes("model") || msg.includes("llm") || msg.includes("token")) return "model_failure";
  if (msg.includes("invalid") || msg.includes("input") || msg.includes("required")) return "invalid_input";
  return "unknown";
}

async function handleFailurePolicy(runId: string, step: any, error: string) {
  // Advanced retry logic: retry step up to maxAttempts, else escalate
  const run = await getWorkflowRun(runId);
  if (!run) return true;
  const cursor = run.cursor || { stepIndex: 0, state: {} };
  let steps = Array.isArray(cursor.state.steps) ? [...cursor.state.steps] : [];
  const stepIdx = steps.findIndex((s: any) => s.id === step.id);
  if (stepIdx === -1) return true;
  const maxAttempts = step.maxAttempts ?? 2;
  const attempts = (steps[stepIdx].attempts || 0) + 1;
  const errorType = classifyError(error);
  // Escalate immediately for invalid input, or after max attempts for other errors
  if (errorType === "invalid_input" || attempts > maxAttempts) {
    // Escalate: mark as needs_review
    steps[stepIdx] = {
      ...steps[stepIdx],
      status: "needs_review",
      error,
      attempts,
      updatedAt: now(),
      errorType,
    };
    await db().collection("workflow_runs").doc(runId).set({ cursor: { ...cursor, state: { ...cursor.state, steps } }, updatedAt: now() }, { merge: true });
    return true; // Escalated
  } else {
    // Re-queue the step/task by creating a new agent_task with backoff
    const ref = db().collection("agent_tasks").doc();
    const delayMs = Math.min(30000, 1000 * Math.pow(2, attempts));
    const agentTask: AgentTask = {
      workspaceId: run.workspaceId,
      taskId: ref.id,
      agentId: step.agentType,
      title: step.prompt,
      description: step.prompt,
      priority: "normal",
      status: "queued",
      createdBy: { type: "system", id: null },
      attempts,
      createdAt: now(),
      updatedAt: now(),
      runContext: { workflowRunId: runId },
      dueAt: new Date(Date.now() + delayMs),
      lastError: { code: errorType, message: error },
    };
    await ref.set(agentTask);
    // Update step attempts and status in workflow_run
    steps[stepIdx] = {
      ...steps[stepIdx],
      status: "queued",
      error,
      attempts,
      updatedAt: now(),
      errorType,
    };
    await db().collection("workflow_runs").doc(runId).set({ steps, updatedAt: now() }, { merge: true });
    return false; // Not escalated, retrying
  }
}

// --- helpers block ---
// (Removed duplicate/conflicting type and import definitions. Use helpers as needed, but types must come from ../lib/orchestrator/types)

type Step = {
  id: string;
};

type ToolCall = {
  toolKey: string;
  input: Record<string, any>;
  // if LLM provides stepId override; otherwise use current step
  stepId?: string;
};

// type WorkspaceMember = { role: Role };
// type Subscription = { plan: Plan };

// ...rest of helpers block from your snippet...

// --- Main workflow run execution ---


// Define OrchestratorResult locally (not exported from types)
type OrchestratorResult =
  | { ok: true; runId: string }
  | { ok: false; runId: string; error: string };

export async function executeWorkflowRun(runId: string): Promise<OrchestratorResult> {
  const lock = await acquireRunLock(runId);
  if (!lock.acquired) return { ok: false, runId, error: "Run is locked by another worker." };
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let stopped = false;
  // Start heartbeat
  async function startHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (!stopped) heartbeatRunLock(runId);
    }, LOCK_HEARTBEAT_MS);
  }
  async function stopHeartbeat() {
    stopped = true;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
  try {
    await startHeartbeat();
    const runSnap = await db().collection("workflow_runs").doc(runId).get();
    const run = runSnap.exists ? { runId, ...runSnap.data() } as WorkflowRun : null;
    if (!run) return { ok: false, runId, error: "workflow_run not found" };
    if (run.status === "succeeded") return { ok: true, runId };
    if (run.status === "failed") return { ok: false, runId, error: "Run already failed" };
    await markRunRunning(runId);
    const workflowSnap = await db().collection("workflows").doc(run!.workflowId).get();
    const workflow = workflowSnap.exists ? { id: workflowSnap.id, ...workflowSnap.data() } : null;
    if (!workflow) throw new Error("workflow not found");
    while (true) {
      const currentSnap = await db().collection("workflow_runs").doc(runId).get();
      const current = currentSnap.exists ? { runId, ...currentSnap.data() } as WorkflowRun : null;
      if (!current) throw new Error("workflow_run missing mid-run");
      if (current.status === "succeeded") return { ok: true, runId };
      if (current.status === "failed" || current.status === "partial") {
        return { ok: false, runId, error: `Run ended with status: ${current.status}` };
      }
      // --- Decoupled agent_tasks execution ---
      const readySteps = getReadySteps(workflow, current);
      if (!readySteps.length) {
        await completeRun(runId);
        return { ok: true, runId };
      }
      // For each ready step, if no agent_task exists for it, create one and mark step as queued
      let steps = (current.cursor && current.cursor.state && Array.isArray(current.cursor.state.steps)) ? [...current.cursor.state.steps] : [];
      for (const step of readySteps) {
        const stepIdx = steps.findIndex((s: any) => (s.id || s.stepId) === (step.id || step.stepId));
        // If already has a queued/running/approval agent_task, skip
        if (stepIdx !== -1 && ["queued", "running", "pending_approval"].includes(steps[stepIdx].status)) continue;
        if (step.requiresApproval) {
          // Create approval task and mark step as pending_approval
          await createApprovalTask({ runId, step, workspaceId: current.workspaceId });
          if (stepIdx !== -1) {
            steps[stepIdx] = {
              ...steps[stepIdx],
              status: "pending_approval",
              updatedAt: now(),
            };
          }
        } else {
          // Create agent_task
          const tasks = await createTasksForStep({
            runId,
            workflowId: workflow.id,
            step,
            workspaceId: current.workspaceId,
            context: current.cursor && current.cursor.state ? current.cursor.state.context : {},
          });
          await audit(runId, "tasks_created", { stepId: step.id || step.stepId, taskCount: tasks.length });
          // Mark step as queued
          if (stepIdx !== -1) {
            steps[stepIdx] = {
              ...steps[stepIdx],
              status: "queued",
              updatedAt: now(),
            };
          }
        }
      }
      // Persist step status updates
      await db().collection("workflow_runs").doc(runId).set({ steps, updatedAt: now() }, { merge: true });

      // Now check if any ready steps have completed agent_tasks or been approved
      let allReadyStepsDone = true;
      for (const step of readySteps) {
        if (step.requiresApproval) {
          // Check approval_tasks for this step
          const snap = await db().collection("approval_tasks")
            .where("runId", "==", runId)
            .where("stepId", "==", step.id || step.stepId)
            .limit(1).get();
          if (snap.empty) {
            allReadyStepsDone = false;
            continue;
          }
          const approval = snap.docs[0].data();
          if (approval.status === "approved") {
            // Mark step as completed
            await updateStepAndRunProgress({
              runId,
              stepId: step.id || step.stepId,
              status: "completed",
              context: current.cursor && current.cursor.state ? current.cursor.state.context : {},
              error: null,
            });
          } else if (approval.status === "rejected") {
            await updateStepAndRunProgress({
              runId,
              stepId: step.id || step.stepId,
              status: "failed",
              context: current.cursor && current.cursor.state ? current.cursor.state.context : {},
              error: approval.reason || "Step rejected by human approver",
            });
            const escalated = await handleFailurePolicy(runId, step, approval.reason || "Step rejected by human approver");
            if (escalated) return { ok: false, runId, error: approval.reason || "Step rejected by human approver" };
          } else {
            allReadyStepsDone = false;
          }
        } else {
          // Find agent_task for this step
          const snap = await db().collection("agent_tasks")
            .where("runContext.workflowRunId", "==", runId)
            .where("agentId", "==", step.agentType)
            .where("title", "==", step.prompt)
            .limit(1).get();
          if (snap.empty) {
            allReadyStepsDone = false;
            continue;
          }
          const task = snap.docs[0].data();
          // --- TOOL REQUESTED AGENT TASKS HANDLING ---
          if (Array.isArray(task.toolRequests) && task.toolRequests.length > 0) {
            // Wait for all tool-requested agent_tasks to complete
            const toolTaskSnaps = await db().collection("agent_tasks")
              .where("requestedBy.id", "==", task.agentId)
              .where("runContext.workflowRunId", "==", runId)
              .where("status", "in", ["done", "failed"])
              .get();
            const toolTasks = toolTaskSnaps.docs.map((d: any) => d.data());
            if (toolTasks.length < task.toolRequests.length) {
              allReadyStepsDone = false;
              continue;
            }
            // Collect ToolResults
            const toolResults = toolTasks.map((t: any) => t.output || t.error || null);
            // Inject ToolResults into context
            const { updatedContext } = applyTaskResultsToContext(current.cursor && current.cursor.state ? current.cursor.state.context : {}, step, toolResults);
            // Mark parent step as completed
            await updateStepAndRunProgress({
              runId,
              stepId: step.id || step.stepId,
              status: "completed",
              context: updatedContext,
              error: null,
            });
          } else if (task.status === "done" || task.status === "failed") {
            // Update step status/output
            await updateStepAndRunProgress({
              runId,
              stepId: step.id || step.stepId,
              status: task.status === "done" ? "completed" : "failed",
              context: current.cursor && current.cursor.state ? current.cursor.state.context : {},
              error: task.status === "done" ? null : (task.error || "Task failed"),
            });
            if (task.status === "failed") {
              const escalated = await handleFailurePolicy(runId, step, task.error || "Task failed");
              if (escalated) return { ok: false, runId, error: task.error || "Task failed" };
            }
          } else {
            allReadyStepsDone = false;
          }
        }
      }
      // If any ready steps are not done/failed/approved, break loop and wait for next orchestrator tick
      if (!allReadyStepsDone) break;
    }
    return { ok: true, runId };
  } catch (err: any) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
    await failRun(runId, err?.message ?? "Unknown orchestrator error");
    return { ok: false, runId, error: err?.message ?? "Unknown orchestrator error" };
  } finally {
    await stopHeartbeat();
    await releaseRunLock(runId);
  }
}

// Worker polling loop for queued workflow runs
if (require.main === module) {
  (async function orchestratorWorkerLoop() {
    while (true) {
      const nextRun = await findQueuedWorkflowRun();
      if (nextRun) {
        await executeWorkflowRun(nextRun.runId);
      } else {
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  })();
}
