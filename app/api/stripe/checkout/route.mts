import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Import Stripe and initialize inside the function to avoid top-level ESM code
  const Stripe = (await import("stripe")).default;
  let stripe: InstanceType<typeof Stripe> | null = null;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    stripe = new Stripe(stripeKey, {
      apiVersion: "2026-01-28.clover",
    });
  }
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment." },
        { status: 500 }
      );
    }
    const { priceId, workspaceId, plan } = await request.json();

    if (!priceId || !workspaceId || !plan) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    // For simplicity, we'll create a new customer each time
    // In production, you'd want to check if customer exists first
    const customer = await stripe.customers.create({
      metadata: {
        workspaceId,
      },
    });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/billing/cancel`,
      metadata: {
        workspaceId,
        plan,
      },
      subscription_data: {
        metadata: {
          workspaceId,
          plan,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
