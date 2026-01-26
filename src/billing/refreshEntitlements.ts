// src/billing/refreshEntitlements.ts
/**
 * Automatically recompute and persist entitlements when pack/specialty agent status changes.
 * Called by Stripe webhooks, admin overrides, or scheduled jobs.
 */

import { getFirestore, FieldValue } from "@/lib/firebaseAdmin";
import { computeAllowedAgentTypes } from "@/src/billing/entitlements";

// Import the shared type to avoid duplication and type mismatches
type SubscriptionDoc = Parameters<typeof computeAllowedAgentTypes>[0];

/**
 * Refresh entitlements for a workspace subscription.
 * 
 * Usage:
 * - After Stripe webhook (pack/specialty agent purchase/cancellation)
 * - After admin override changes
 * - Periodic batch refresh for compliance audits
 * 
 * @param workspaceId The workspace to refresh
 * @param subscriptionDoc Optional: if you already have the doc loaded, pass it to save a Firestore read
 * @returns The updated allowedAgentTypes array
 */
export async function refreshEntitlements(
  workspaceId: string,
  subscriptionDoc?: SubscriptionDoc
): Promise<string[]> {
  const db = getFirestore();
  const subsRef = db.collection("subscriptions").doc(workspaceId);

  let sub: SubscriptionDoc;

  // Load subscription doc if not provided
  if (!subscriptionDoc) {
    const snap = await subsRef.get();
    if (!snap.exists) {
      throw new Error(`Subscription not found for workspace ${workspaceId}`);
    }
    sub = snap.data() as SubscriptionDoc;
  } else {
    sub = subscriptionDoc;
  }

  // Compute the fresh allowed agent types
  const allowedAgentTypes = computeAllowedAgentTypes(sub);

  // Update Firestore atomically
  await subsRef.update({
    "entitlements.allowedAgentTypes": allowedAgentTypes,
    "entitlements.computedAt": FieldValue.serverTimestamp(),
    "updatedAt": FieldValue.serverTimestamp(),
  });

  return allowedAgentTypes;
}

/**
 * Batch refresh entitlements for multiple workspaces.
 * Useful for compliance audits or after plan structure changes.
 * 
 * @param workspaceIds Array of workspace IDs to refresh
 * @returns Map of workspaceId -> updated allowedAgentTypes
 */
export async function batchRefreshEntitlements(
  workspaceIds: string[]
): Promise<Map<string, string[]>> {
  const db = getFirestore();
  const results = new Map<string, string[]>();

  for (const workspaceId of workspaceIds) {
    try {
      const allowedAgentTypes = await refreshEntitlements(workspaceId);
      results.set(workspaceId, allowedAgentTypes);
    } catch (err) {
      console.error(`Failed to refresh entitlements for workspace ${workspaceId}:`, err);
    }
  }

  return results;
}

/**
 * Helper to call after Stripe webhook events.
 * Extracts workspaceId from metadata and refreshes.
 * 
 * @param event Stripe event object
 * @returns The updated allowedAgentTypes array
 */
export async function refreshEntitlementsFromStripeEvent(
  event: any
): Promise<string[] | null> {
  // Extract workspaceId from Stripe object metadata
  const object = event.data?.object || event.data?.previous_attributes;
  if (!object) return null;

  const workspaceId = object.metadata?.workspaceId;
  if (!workspaceId) {
    console.warn("Stripe event missing workspaceId in metadata");
    return null;
  }

  try {
    return await refreshEntitlements(workspaceId);
  } catch (err) {
    console.error(`Failed to refresh entitlements from Stripe event for workspace ${workspaceId}:`, err);
    return null;
  }
}
