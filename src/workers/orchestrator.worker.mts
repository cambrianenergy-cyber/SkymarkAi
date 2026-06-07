// Sentry error monitoring
/// <reference types="node" />
// ...existing code...
// Sentry error monitoring
import * as Sentry from "@sentry/node";
// import { loadConfig } from "../lib/config.server";
// ...existing code...

if (process.env.SENTRY_DSN) 
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1, // Adjust as needed
    environment: process.env.NODE_ENV || "development",
  });

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

// This file should be run as a Node.js process (not a React component)


// --- Types ---
// (Removed duplicate/invalid type definitions. Use types from ../lib/orchestrator/types)



import { db as getDb, now } from "../lib/orchestrator/firestore";
import { markWorkflowRunStatus, advanceWorkflowCursor } from "../lib/orchestrator/workflow";
import type { WorkflowRun as BaseWorkflowRun, AgentTask as BaseAgentTask } from "../lib/orchestrator/types";

// Extend WorkflowRun to include cursor and workflowId for local use
type WorkflowCursor = {
  stepIndex: number;
  state: {
    steps: any[];
    context: any;
  };
};

type WorkflowRun = BaseWorkflowRun & {
  runId: string;
  cursor?: WorkflowCursor;
  workflowId: string;
};

type AgentTask = BaseAgentTask & {
  id: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled"; // Add all valid statuses used in your code
  attempts: number;
  createdAt: any;
  updatedAt: any;
};

const db = () => getDb();

async function getWorkflowRun(runId: string): Promise<WorkflowRun | null> {
  const snap = await db().collection("workflow_runs").doc(runId).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return {
    ...data,
    runId: snap.id,
    workflowId: data.workflowId,
    cursor: data.cursor,
  } as WorkflowRun;
}

async function findQueuedWorkflowRun(): Promise<WorkflowRun | null> {
  const snap = await db().collection("workflow_runs")
    .where("status", "==", "queued")
    .limit(1).get();
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  const data = docSnap.data() || {};
  return {
    ...data,
    runId: docSnap.id,
    workflowId: data.workflowId,
    cursor: data.cursor,
  } as WorkflowRun;
}

// async function getWorkflow(workflowId: string): Promise<any | null> {
//   const snap = await db().collection("workflows").doc(workflowId).get();
//   if (!snap.exists) return null;
//   return { id: snap.id, ...snap.data() };
// }

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

// async function audit(runId: string, action: string, meta: any) {
//   // Optionally implement audit log
// }
const audit = async () => {};


// Returns all steps ready to execute (no unmet dependencies, not completed/failed)
function getReadySteps(workflow: any, run: WorkflowRun): any[] {
  if (!workflow.steps) return [];
  const steps = workflow.steps;
  const runSteps = (run.cursor && run.cursor.state && Array.isArray(run.cursor.state.steps)) ? run.cursor.state.steps : [];
  const completed = new Set(runSteps.filter((s: any) => s.status === "completed").map((s: any) => s.id));
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

async function createTasksForStep({ runId, step, workspaceId }: any): Promise<AgentTask[]> {
  // Create a single agent_task for the step
  const ref = db().collection("agent_tasks").doc();

  const agentTask: AgentTask = {
    workspaceId,
    id: ref.id,
    agentId: step.agentType,
    priority: "normal",
    status: "queued",
    attempts: 0,
    createdAt: now(),
    updatedAt: now()
  };

  await ref.set(agentTask);
  return [agentTask];
}


// Removed unused dispatchTask function

// Removed unused waitForTasks function

function applyTaskResultsToContext(context: any, _step: any, results: any) {
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
  // ... your logic ...

  // Example logic for demonstration:
  const maxAttempts = step.maxAttempts ?? 2;
  const attempts = (step.attempts || 0) + 1;
  const errorType = classifyError(error);

  if (errorType === "invalid_input" || attempts > maxAttempts) {
    // ... escalate ...
    return true;
  } else {
    // ... retry logic ...
    return false;
  }
} // <-- THIS MUST EXIST
// (Removed duplicate/conflicting type and import definitions. Use helpers as needed, but types must come from ../lib/orchestrator/types)

// type Step = {
//   id: string;
// };

// type ToolCall = {
//   toolKey: string;
//   input: Record<string, any>;
//   // if LLM provides stepId override; otherwise use current step
//   stepId?: string;
// };

// type WorkspaceMember = { role: Role };
// type Subscription = { plan: Plan };

// ...rest of helpers block from your snippet...

// --- Main workflow run execution ---

// Define OrchestratorResult locally (not exported from types)
type OrchestratorResult =
  | { ok: true; runId: string }
  | { ok: false; runId: string; error: string };

async function executeWorkflowRun(runId: string): Promise<OrchestratorResult> {
  const lock = await acquireRunLock(runId);
  if (!lock.acquired) {
    return { ok: false, runId, error: "Run is locked by another worker." };
  }

  let heartbeatTimer: NodeJS.Timeout | null = null;
  let stopped = false;

  // Start heartbeat (no need for async here)
  function startHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      if (!stopped) {
        heartbeatRunLock(runId).catch(() => {
          // Ignore heartbeat errors; lock will eventually expire
        });
      }
    }, LOCK_HEARTBEAT_MS);
  }

  function stopHeartbeat() {
    stopped = true;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }

  try {
    startHeartbeat();

    // Load initial workflow_run
    const runSnap = await db().collection("workflow_runs").doc(runId).get();
    if (!runSnap.exists) {
      return { ok: false, runId, error: "workflow_run not found" };
    }

    const initialData = runSnap.data() || {};
    let current: WorkflowRun = {
      ...initialData,
      runId,
      workflowId: initialData.workflowId,
      cursor: initialData.cursor ?? {
        stepIndex: 0,
        state: { steps: [], context: {} },
      },
    } as WorkflowRun;

    if (current.status === "succeeded") {
      return { ok: true, runId };
    }
    if (current.status === "failed") {
      return { ok: false, runId, error: "Run already failed" };
    }

    await markRunRunning(runId);

    // Load workflow definition
    const workflowSnap = await db().collection("workflows").doc(current.workflowId).get();
    if (!workflowSnap.exists) {
      throw new Error("workflow not found");
    }
    const workflow = { id: workflowSnap.id, ...workflowSnap.data() };

    // Main orchestrator loop (single tick per invocation)
    while (true) {
      const currentSnap = await db().collection("workflow_runs").doc(runId).get();
      if (!currentSnap.exists) {
        throw new Error("workflow_run missing mid-run");
      }

      const currentData = currentSnap.data() || {};
      current = {
        ...currentData,
        runId,
        workflowId: currentData.workflowId,
        cursor: currentData.cursor ?? {
          stepIndex: 0,
          state: { steps: [], context: {} },
        },
      } as WorkflowRun;

      if (current.status === "succeeded") {
        return { ok: true, runId };
      }
      if (current.status === "failed" || current.status === "partial") {
        return { ok: false, runId, error: `Run ended with status: ${current.status}` };
      }

      const readySteps = getReadySteps(workflow, current);
      if (!readySteps.length) {
        await completeRun(runId);
        return { ok: true, runId };
      }

      // Ensure we have a mutable steps array
      let steps =
        current.cursor && current.cursor.state && Array.isArray(current.cursor.state.steps)
          ? [...current.cursor.state.steps]
          : [];

      // 1) For each ready step, ensure an agent_task or approval_task exists
      for (const step of readySteps) {
        const stepId = step.id || step.stepId;
        const stepIdx = steps.findIndex((s: any) => (s.id || s.stepId) === stepId);

        // If already queued/running/pending_approval, skip
        if (stepIdx !== -1 && ["queued", "running", "pending_approval"].includes(steps[stepIdx].status)) {
          continue;
        }

        if (step.requiresApproval) {
          // Create approval task and mark step as pending_approval
          await createApprovalTask({ runId, step, workspaceId: current.workspaceId });
          if (stepIdx !== -1) {
            steps[stepIdx] = {
              ...steps[stepIdx],
              status: "pending_approval",
              updatedAt: now(),
            };
          } else {
            steps.push({
              id: stepId,
              status: "pending_approval",
              updatedAt: now(),
            });
          }
        } else {
          // Create agent_task
          await createTasksForStep({
            runId,
            step,
            workspaceId: current.workspaceId,
          });
          await audit();

          // Mark step as queued
          if (stepIdx !== -1) {
            steps[stepIdx] = {
              ...steps[stepIdx],
              status: "queued",
              updatedAt: now(),
            };
          } else {
            steps.push({
              id: stepId,
              status: "queued",
              updatedAt: now(),
            });
          }
        }
      }

      // Persist step status updates
      await db().collection("workflow_runs").doc(runId).set(
        {
          cursor: {
            ...(current.cursor || { stepIndex: 0, state: { steps: [], context: {} } }),
            state: {
              ...(current.cursor?.state || { steps: [], context: {} }),
              steps,
            },
          },
          updatedAt: now(),
        },
        { merge: true }
      );

      // 2) Check completion/approval status for ready steps
      let allReadyStepsDone = true;

      for (const step of readySteps) {
        const stepId = step.id || step.stepId;

        if (step.requiresApproval) {
          const snap = await db()
            .collection("approval_tasks")
            .where("runId", "==", runId)
            .where("stepId", "==", stepId)
            .limit(1)
            .get();

          if (snap.empty) {
            allReadyStepsDone = false;
            continue;
          }

          const approval = snap.docs[0].data();
          const baseContext = current.cursor?.state?.context || {};

          if (approval.status === "approved") {
            await updateStepAndRunProgress({
              runId,
              stepId,
              status: "completed",
              context: baseContext,
              error: null,
            });
          } else if (approval.status === "rejected") {
            const reason = approval.reason || "Step rejected by human approver";
            await updateStepAndRunProgress({
              runId,
              stepId,
              status: "failed",
              context: baseContext,
              error: reason,
            });
            const escalated = await handleFailurePolicy(runId, step, reason);
            if (escalated) {
              return { ok: false, runId, error: reason };
            }
          } else {
            allReadyStepsDone = false;
          }
        } else {
          // Agent task path
          const snap = await db()
            .collection("agent_tasks")
            .where("runContext.workflowRunId", "==", runId)
            .where("agentId", "==", step.agentType)
            .limit(1)
            .get();

          if (snap.empty) {
            allReadyStepsDone = false;
            continue;
          }

          const task = snap.docs[0].data();
          const baseContext = current.cursor?.state?.context || {};

          // Tool-requested agent tasks
          if (Array.isArray(task.toolRequests) && task.toolRequests.length > 0) {
            const toolTaskSnaps = await db()
              .collection("agent_tasks")
              .where("requestedBy.id", "==", task.agentId)
              .where("runContext.workflowRunId", "==", runId)
              .where("status", "in", ["done", "failed"])
              .get();

            const toolTasks = toolTaskSnaps.docs.map((d: any) => d.data());
            if (toolTasks.length < task.toolRequests.length) {
              allReadyStepsDone = false;
              continue;
            }

            const toolResults = toolTasks.map((t: any) => t.output || t.error || null);
            const { updatedContext } = applyTaskResultsToContext(baseContext, step, toolResults);

            await updateStepAndRunProgress({
              runId,
              stepId,
              status: "completed",
              context: updatedContext,
              error: null,
            });
          } else if (task.status === "done" || task.status === "failed") {
            await updateStepAndRunProgress({
              runId,
              stepId,
              status: task.status === "done" ? "completed" : "failed",
              context: baseContext,
              error: task.status === "done" ? null : task.error || "Task failed",
            });

            if (task.status === "failed") {
              const reason = task.error || "Task failed";
              const escalated = await handleFailurePolicy(runId, step, reason);
              if (escalated) {
                return { ok: false, runId, error: reason };
              }
            }
          } else {
            allReadyStepsDone = false;
          }
        }
      }

      // If any ready steps are still in progress, end this tick and let the next worker run later
      if (!allReadyStepsDone) {
        break;
      }
    }

    return { ok: true, runId };
  } catch (err: any) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
    await failRun(runId, err?.message ?? "Unknown orchestrator error");
    return { ok: false, runId, error: err?.message ?? "Unknown orchestrator error" };
  } finally {
    stopHeartbeat();
    await releaseRunLock(runId);
  }
}


export { executeWorkflowRun };
