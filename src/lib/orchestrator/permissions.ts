import type { AgentPermissionPolicy } from "./types";

function normalizeWildcards(arr: string[]) {
  return new Set(arr.map((s) => s.trim().toLowerCase()));
}

export function assertCollectionAllowed(
  policy: AgentPermissionPolicy,
  op: "read" | "write" | "delete",
  collectionName: string
) {
  const name = collectionName.toLowerCase();

  const set =
    op === "read"
      ? normalizeWildcards(policy.canRead)
      : op === "write"
      ? normalizeWildcards(policy.canWrite)
      : normalizeWildcards(policy.canDelete);

  if (set.has("*")) return;
  if (!set.has(name)) {
    throw new Error(`PERMISSION_DENIED: agent cannot ${op} collection "${collectionName}"`);
  }
}

export function assertEntityAllowed(policy: AgentPermissionPolicy, entityType?: string | null) {
  if (!entityType) return; // if task not tied to entity, allow if collection ops pass
  const allowed = new Set(policy.allowedEntityTypes.map((t) => t.toLowerCase()));
  if (allowed.has("*")) return;
  if (!allowed.has(entityType.toLowerCase())) {
    throw new Error(`PERMISSION_DENIED: agent cannot operate on entityType "${entityType}"`);
  }
}

export function assertMessagingAllowed(policy: AgentPermissionPolicy) {
  if (!policy.canMessage) throw new Error("PERMISSION_DENIED: agent cannot message");
}

export function assertWorkflowTriggerAllowed(policy: AgentPermissionPolicy) {
  if (!policy.canTriggerWorkflows) throw new Error("PERMISSION_DENIED: agent cannot trigger workflows");
}
