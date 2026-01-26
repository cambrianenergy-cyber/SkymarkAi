import { db, now } from "./firestore";

export async function checkAndIncrementRateLimit(args: {
  workspaceId: string;
  bucketId: string; // e.g. "agentTasks:minute"
  limit: number;
  windowSeconds: number;
}) {
  const { workspaceId, bucketId, limit, windowSeconds } = args;

  const ref = db().doc(`rate_limits/${workspaceId}_${bucketId}`);
  const snap = await ref.get();

  const ts = Date.now();
  const windowStartMs = ts - (ts % (windowSeconds * 1000));

  if (!snap.exists) {
    await ref.set({
      workspaceId,
      bucketId,
      windowStartMs,
      count: 1,
      limit,
      updatedAt: now(),
    });
    return;
  }

  const data = snap.data() as any;
  if (data.windowStartMs !== windowStartMs) {
    await ref.set(
      { workspaceId, bucketId, windowStartMs, count: 1, limit, updatedAt: now() },
      { merge: true }
    );
    return;
  }

  if (data.count >= limit) {
    throw new Error(`RATE_LIMITED: bucket "${bucketId}" limit ${limit}/${windowSeconds}s`);
  }

  await ref.set({ count: (data.count || 0) + 1, updatedAt: now() }, { merge: true });
}
