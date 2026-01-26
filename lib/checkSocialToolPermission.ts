import { getSocialConnection } from "../lib/socialConnection";

/**
 * Checks if the agent/tool can use a social platform for the user.
 * Returns { allowed, reason }
 */
export async function checkSocialToolPermission(userId: string, platform: string, requiredScopes: string[] = []) {
  const conn = await getSocialConnection(userId, platform);
  if (!conn) return { allowed: false, reason: "not_connected" };
  if (conn.status !== "connected") return { allowed: false, reason: conn.status };
  if (conn.expiresAt && conn.expiresAt < Date.now()) return { allowed: false, reason: "expired" };
  if (requiredScopes.length && !requiredScopes.every(s => conn.scopes.includes(s))) {
    return { allowed: false, reason: "missing_scope" };
  }
  return { allowed: true };
}
