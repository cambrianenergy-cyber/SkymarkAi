import { col, now } from "./firestore";
import type { ActorType } from "./types";

export async function writeAuditLog(args: {
  workspaceId: string;
  actorType: ActorType;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  meta?: Record<string, any> | null;
}) {
  const {
    workspaceId,
    actorType,
    actorId,
    action,
    entityType,
    entityId,
    before = null,
    after = null,
    meta = null,
  } = args;

  await col("audit_logs").add({
    workspaceId,
    actorType,
    actorId,
    action,
    entityType,
    entityId,
    before,
    after,
    meta,
    createdAt: now(),
  });
}
