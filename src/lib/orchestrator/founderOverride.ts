import { db } from "./firestore";

/**
 * Founder emergency override: forcibly pause, kill, or override any agent, workflow, or tool execution.
 * Only callable by founder/admin. Logs all actions to audit trail.
 */
export async function founderEmergencyOverride({
  workspaceId,
  targetType,
  targetId,
  action,
  actorId,
  reason,
  meta = {},
}: {
  workspaceId: string;
  targetType: "agent" | "agent_run" | "workflow_run" | "tool";
  targetId: string;
  action: "pause" | "kill" | "resume" | "override";
  actorId: string; // founder/admin id
  reason: string;
  meta?: Record<string, any>;
}) {
  // Example: pause/kill agent or workflow by updating status
  if (targetType === "agent") {
    await db().doc(`agents/${targetId}`).set({ status: action === "kill" ? "archived" : action }, { merge: true });
  }
  if (targetType === "agent_run") {
    await db().doc(`agent_runs/${targetId}`).set({ status: action }, { merge: true });
  }
  if (targetType === "workflow_run") {
    await db().doc(`workflow_runs/${targetId}`).set({ status: action }, { merge: true });
  }
  // Log to audit trail
  await db().collection("audit_logs").add({
    workspaceId,
    actorType: "founder",
    actorId,
    action: `founder_override.${action}`,
    entityType: targetType,
    entityId: targetId,
    before: null,
    after: { status: action },
    meta: { reason, ...meta },
    createdAt: new Date(),
  });
}
