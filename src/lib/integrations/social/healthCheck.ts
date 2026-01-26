import fetch from "node-fetch";
import { adminDb } from "@/lib/firebaseAdmin";
import type SocialConnection from "@/lib/types/socialConnection";

// Health check for a single social connection
export async function checkSocialConnectionHealth(conn: SocialConnection): Promise<{ valid: boolean; reason?: string }> {
  if (!conn.accessToken) return { valid: false, reason: "Missing access token" };
  if (conn.expiresAt && conn.expiresAt < Date.now()) return { valid: false, reason: "Token expired" };
  if (conn.status === "revoked") return { valid: false, reason: "Token revoked" };

  // Platform-specific token validation
  switch (conn.platform) {
    case "facebook":
      // Validate Facebook token
      try {
        const res = await fetch(`https://graph.facebook.com/debug_token?input_token=${conn.accessToken}&access_token=${process.env.META_CLIENT_ID}|${process.env.META_CLIENT_SECRET}`);
        const data = await res.json();
        if (!data.data || !data.data.is_valid) return { valid: false, reason: "Facebook token invalid" };
      } catch (e) {
        return { valid: false, reason: "Facebook token check failed" };
      }
      break;
    case "twitter":
      // Twitter token validation (simplified)
      // TODO: Implement real check via Twitter API
      if (!conn.accessToken) return { valid: false, reason: "Missing Twitter token" };
      break;
    // Add other platforms as needed
    default:
      // For unknown platforms, just check expiry/revocation
      break;
  }
  return { valid: true };
}

// Health check for all connections of a workspace
export async function checkWorkspaceSocialHealth(workspaceId: string): Promise<{ [platform: string]: { valid: boolean; reason?: string } }> {
  const snap = await adminDb.collection("connections").where("workspaceId", "==", workspaceId).get();
  const results: { [platform: string]: { valid: boolean; reason?: string } } = {};
  for (const doc of snap.docs) {
    const conn = doc.data() as SocialConnection;
    results[conn.platform] = await checkSocialConnectionHealth(conn);
  }
  return results;
}
