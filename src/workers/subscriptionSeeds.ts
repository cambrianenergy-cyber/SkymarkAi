/**
 * Example Subscription Document (Starter Plan)
 * Collection: subscriptions/{workspaceId}
 * 
 * This represents the NEW subscription schema with:
 * - basePlan (key, pricing, status)
 * - packs (add-on bundles)
 * - specialtyAgents (à la carte agents)
 * - entitlements (precomputed access control)
 * - overrides (admin controls)
 */

import { getFirestore, FieldValue } from "@/lib/firebaseAdmin";

export async function seedStarterSubscription(workspaceId: string) {
  const db = getFirestore();

  const subscriptionData = {
    workspaceId,

    // Stripe linkage (null until checkout completes)
    stripe: {
      customerId: null,
      subscriptionId: null,
      priceId: "price_starter_monthly_149", // Replace with real Stripe price ID
      productId: "prod_STARTER",            // Replace with real Stripe product ID
      livemode: false,
      lastWebhookEventId: null,
      latestInvoiceId: null,
      latestPaymentIntentId: null,
    },

    // Base plan details
    basePlan: {
      key: "starter",
      priceMonthly: 149,
      status: "active",  // or "trialing" for 14-day trial
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialStart: null,
      trialEnd: null,
    },

    // Add-on packs (all disabled for starter)
    packs: {
      salesAutomation: {
        enabled: false,
        priceMonthly: 99,
        stripeSubscriptionId: null,
        stripePriceId: "price_pack_sales_99",
      },
      marketingIntelligence: {
        enabled: false,
        priceMonthly: 149,
        stripeSubscriptionId: null,
        stripePriceId: "price_pack_marketing_149",
      },
      agency: {
        enabled: false,
        priceMonthly: 299,
        stripeSubscriptionId: null,
        stripePriceId: "price_pack_agency_299",
      },
    },

    // Specialty agents (à la carte, none for starter)
    specialtyAgents: {},

    // Entitlements (precomputed for fast gating)
    entitlements: {
      // Agents included in starter base plan (only 2 agents)
      baseIncludedAgents: [
        "content_writer_manual",
        "lead_qualifier",
      ],
      
      // Agents from enabled packs (empty for starter)
      packAgents: [],

      // Specialty agents purchased (empty for starter)
      specialtyAgents: [],

      // Final allow-list enforced by orchestrator
      allowedAgentTypes: [
        "content_writer_manual",
        "lead_qualifier",
      ],

      // Timestamp of when entitlements were last computed
      computedAt: FieldValue.serverTimestamp(),

      // Limits for starter plan
      limits: {
        maxAgents: 2,
        maxActiveAgents: 2,
        maxWorkflows: 10,
        maxWorkflowRunsPerDay: 10,
        maxConcurrentRuns: 1,
        maxStepsPerRun: 15,
        maxTeamMembers: 3,
        maxIntegrations: 2,
        maxMemoryMb: 256,
      },
    },

    // Admin overrides (support/founder controls)
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

  // Write to subscriptions collection (keyed by workspaceId)
  await db.collection("subscriptions").doc(workspaceId).set(subscriptionData);

  console.log(`✅ Created starter subscription for workspace: ${workspaceId}`);
  return subscriptionData;
}

/**
 * Example: Pro Plan with Sales Automation Pack
 */
export async function seedProWithSalesPackSubscription(workspaceId: string) {
  const db = getFirestore();

  const subscriptionData = {
    workspaceId,

    stripe: {
      customerId: "cus_EXAMPLE123",
      subscriptionId: "sub_EXAMPLE456",
      priceId: "price_pro_monthly_299",
      productId: "prod_PRO",
      livemode: false,
      lastWebhookEventId: "evt_EXAMPLE789",
      latestInvoiceId: "in_EXAMPLE",
      latestPaymentIntentId: "pi_EXAMPLE",
    },

    basePlan: {
      key: "pro",
      priceMonthly: 299,
      status: "active",
      currentPeriodStart: FieldValue.serverTimestamp(),
      currentPeriodEnd: null, // Set to +1 month in real implementation
      cancelAtPeriodEnd: false,
      trialStart: null,
      trialEnd: null,
    },

    packs: {
      salesAutomation: {
        enabled: true,  // ENABLED
        priceMonthly: 99,
        stripeSubscriptionId: "sub_PACK_SALES_123",
        stripePriceId: "price_pack_sales_99",
      },
      marketingIntelligence: {
        enabled: false,
        priceMonthly: 149,
        stripeSubscriptionId: null,
        stripePriceId: "price_pack_marketing_149",
      },
      agency: {
        enabled: false,
        priceMonthly: 299,
        stripeSubscriptionId: null,
        stripePriceId: "price_pack_agency_299",
      },
    },

    specialtyAgents: {
      // Example: purchased estimate_builder as specialty agent
      estimate_builder: {
        enabled: true,
        priceMonthly: 49,
        stripeSubscriptionId: "sub_AGENT_EST_123",
        stripePriceId: "price_agent_estimate_builder_49",
      },
    },

    entitlements: {
      baseIncludedAgents: [
        "content_writer_manual",
        "lead_qualifier",
        "scheduler",
        "follow_up_automation",
      ],

      // Sales pack adds these agents
      packAgents: [
        "lead_scoring",
      ],

      // Specialty agents purchased
      specialtyAgents: [
        "estimate_builder",
      ],

      // Final merged allow-list (deduplicated)
      allowedAgentTypes: [
        "content_writer_manual",
        "lead_qualifier",
        "scheduler",
        "follow_up_automation",
        "lead_scoring", // from Sales pack
        "estimate_builder", // from specialty agent purchase
      ],

      // Timestamp of when entitlements were last computed
      computedAt: FieldValue.serverTimestamp(),

      limits: {
        maxAgents: 4,
        maxActiveAgents: 4,
        maxWorkflows: 50,
        maxWorkflowRunsPerDay: 150,
        maxConcurrentRuns: 3,
        maxStepsPerRun: 25,
        maxTeamMembers: 5,
        maxIntegrations: 3,
        maxMemoryMb: 400,
      },
    },

    overrides: {
      forcePlan: null,
      unlimitedAgents: false,
      unlimitedRuns: false,
      unlimitedMembers: false,
      notes: "Pro customer with Sales Automation pack",
    },

    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection("subscriptions").doc(workspaceId).set(subscriptionData);

  console.log(`✅ Created pro subscription with sales pack for workspace: ${workspaceId}`);
  return subscriptionData;
}
