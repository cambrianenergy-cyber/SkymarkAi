import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore, FieldValue } from "@lib/firebaseAdmin";
import { refreshEntitlements } from "@/src/billing/refreshEntitlements";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log("Received Stripe event:", event.type);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * Create new subscription record with base plan
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const workspaceId = session.metadata?.workspaceId;
  const basePlanKey = session.metadata?.plan || "accelerate";

  if (!workspaceId) {
    console.error("No workspaceId in checkout session metadata");
    return;
  }

  console.log(`Checkout completed for workspace: ${workspaceId}, plan: ${basePlanKey}`);

  const db = getFirestore();
  const subsRef = db.collection("subscriptions").doc(workspaceId);

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  // Create new subscription with new schema
  const newSub = {
    workspaceId,
    stripe: {
      customerId,
      subscriptionId,
      priceId: null,
      productId: null,
      livemode: session.livemode,
      lastWebhookEventId: null,
      latestInvoiceId: null,
      latestPaymentIntentId: null,
    },
    basePlan: {
      key: basePlanKey,
      status: "active",
      currentPeriodStart: FieldValue.serverTimestamp(),
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialStart: null,
      trialEnd: null,
    },
    packs: {
      salesAutomation: { enabled: false, priceMonthly: 99, stripeSubscriptionId: null, stripePriceId: null },
      marketingIntelligence: { enabled: false, priceMonthly: 149, stripeSubscriptionId: null, stripePriceId: null },
      agency: { enabled: false, priceMonthly: 299, stripeSubscriptionId: null, stripePriceId: null },
    },
    specialtyAgents: {},
    entitlements: {
      baseIncludedAgents: [],
      packAgents: [],
      specialtyAgents: [],
      allowedAgentTypes: [],
      computedAt: FieldValue.serverTimestamp(),
    },
    overrides: {
      forcePlan: null,
      unlimitedAgents: false,
      unlimitedRuns: false,
      unlimitedMembers: false,
      notes: null,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await subsRef.set(newSub, { merge: true });

  // Compute initial entitlements
  try {
    await refreshEntitlements(workspaceId);
  } catch (err) {
    console.error(`Failed to refresh entitlements for workspace ${workspaceId}:`, err);
  }

  console.log(`Created subscription for workspace ${workspaceId}`);
}

/**
 * Handle customer.subscription.updated
 * Update base plan status and detect pack/specialty agent changes via invoice items
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata?.workspaceId;

  if (!workspaceId) {
    console.error("No workspaceId in subscription metadata");
    return;
  }

  console.log(`Subscription updated for workspace: ${workspaceId}`);

  const db = getFirestore();
  const subsRef = db.collection("subscriptions").doc(workspaceId);

  // Get current subscription doc
  const subSnap = await subsRef.get();
  if (!subSnap.exists) {
    console.warn(`Subscription doc not found for workspace ${workspaceId}`);
    return;
  }

  const currentSub = subSnap.data() as any;

  // Determine base plan from subscription metadata or fall back to current
  const basePlanKey = subscription.metadata?.plan || currentSub?.basePlan?.key || "accelerate";

  // Map subscription status to plan status
  let planStatus: "active" | "trialing" | "paused" | "canceled" | "past_due" = "canceled";
  if (subscription.status === "active") planStatus = "active";
  if (subscription.status === "trialing") planStatus = "trialing";
  if (subscription.status === "past_due") planStatus = "past_due";

  // Update base plan info
  const periodStart = (subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start;
  const periodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;

  const updateData: any = {
    "stripe.subscriptionId": subscription.id,
    "stripe.customerId": subscription.customer as string,
    "stripe.livemode": subscription.livemode,
    "basePlan.key": basePlanKey,
    "basePlan.status": planStatus,
    "basePlan.currentPeriodStart": periodStart ? new Date(periodStart * 1000) : null,
    "basePlan.currentPeriodEnd": periodEnd ? new Date(periodEnd * 1000) : null,
    "basePlan.cancelAtPeriodEnd": subscription.cancel_at_period_end,
    "updatedAt": FieldValue.serverTimestamp(),
  };

  // Process items to detect pack and specialty agent changes
  for (const item of subscription.items.data) {
    const price = item.price;
    if (!price) continue;

    const metadata = price.metadata as any;
    if (!metadata) continue;

    const itemType = metadata.type; // "base_plan" | "pack" | "specialty_agent"
    const key = metadata.key; // plan/pack key or agent key

    if (itemType === "pack") {
      // Enable the pack
      updateData[`packs.${key}.enabled`] = true;
      updateData[`packs.${key}.stripePriceId`] = price.id;
      updateData[`packs.${key}.stripeSubscriptionId`] = subscription.id;
      console.log(`Pack enabled: ${key} for workspace ${workspaceId}`);
    } else if (itemType === "specialty_agent") {
      // Enable the specialty agent
      const agentType = metadata.agentType || key;
      updateData[`specialtyAgents.${agentType}.enabled`] = true;
      updateData[`specialtyAgents.${agentType}.stripePriceId`] = price.id;
      updateData[`specialtyAgents.${agentType}.stripeSubscriptionId`] = subscription.id;
      console.log(`Specialty agent enabled: ${agentType} for workspace ${workspaceId}`);
    }
  }

  // Apply updates
  await subsRef.update(updateData);

  // Recompute entitlements (merges base + packs + specialty)
  try {
    const allowedAgentTypes = await refreshEntitlements(workspaceId);
    console.log(`Refreshed entitlements for workspace ${workspaceId}:`, allowedAgentTypes);
  } catch (err) {
    console.error(`Failed to refresh entitlements for workspace ${workspaceId}:`, err);
  }
}

/**
 * Handle customer.subscription.deleted
 * Downgrade to accelerate plan (minimal allowed agents)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata?.workspaceId;

  if (!workspaceId) {
    console.error("No workspaceId in subscription metadata");
    return;
  }

  console.log(`Subscription deleted for workspace: ${workspaceId}`);

  const db = getFirestore();
  const subsRef = db.collection("subscriptions").doc(workspaceId);

  // Downgrade to accelerate: disable all packs and specialty agents
  const updateData = {
    "basePlan.key": "accelerate",
    "basePlan.status": "canceled",
    "packs.salesAutomation.enabled": false,
    "packs.marketingIntelligence.enabled": false,
    "packs.agency.enabled": false,
    // Clear specialty agents
    "specialtyAgents": {},
    "updatedAt": FieldValue.serverTimestamp(),
  };

  await subsRef.update(updateData);

  // Recompute entitlements (will reset to accelerate agents only)
  try {
    await refreshEntitlements(workspaceId);
  } catch (err) {
    console.error(`Failed to refresh entitlements for workspace ${workspaceId}:`, err);
  }

  console.log(`Subscription canceled for workspace ${workspaceId}, downgraded to accelerate`);
}

