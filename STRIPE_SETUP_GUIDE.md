# Stripe Billing Setup Guide - LOCAL MODE

This guide will help you set up Stripe billing in **TEST MODE** for local development.

## Prerequisites

1. Stripe account (free at stripe.com)
2. Stripe CLI installed
3. All billing code files already created ✅

---

## Step 1: Install Stripe Package

```bash
npm install stripe
```

---

## Step 2: Get Stripe API Keys (Test Mode)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. **IMPORTANT**: Make sure you're in **TEST MODE** (toggle in top right)
3. Navigate to: **Developers → API keys**
4. Copy these two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - click "Reveal test key"

---

## Step 3: Create Products and Prices in Stripe

1. In Stripe Dashboard, go to **Products → Add product**
2. Create these 3 products:

### Product 1: Launch Plan
- **Name**: Launch Plan
- **Description**: For individuals and small teams
- **Price**: $49.00 USD
- **Billing period**: Monthly (Recurring)
- Click **Add product**
- Copy the **Price ID** (starts with `price_`) - you'll need this!

### Product 2: Growth Plan
- **Name**: Growth Plan
- **Description**: For growing businesses
- **Price**: $149.00 USD
- **Billing period**: Monthly (Recurring)
- Click **Add product**
- Copy the **Price ID**

### Product 3: Sovereign Plan
- **Name**: Sovereign Plan
- **Description**: For agencies and enterprises
- **Price**: $399.00 USD
- **Billing period**: Monthly (Recurring)
- Click **Add product**
- Copy the **Price ID**

---

## Step 4: Update Price IDs in Code

Open `app/app/billing/page.tsx` and replace the test price IDs:

```typescript
const PLANS = [
   {
      name: "Launch",
      priceId: "price_XXXXXXXXXXX", // Replace with your Launch price_id
      price: "$49",
      // ... rest of plan
   },
   {
      name: "Growth",
      priceId: "price_XXXXXXXXXXX", // Replace with your Growth price_id
      price: "$149",
      // ... rest of plan
   },
   {
      name: "Sovereign",
      priceId: "price_XXXXXXXXXXX", // Replace with your Sovereign price_id
      price: "$399",
      // ... rest of plan
   }
];
```

---

## Step 5: Set Up Stripe CLI for Local Webhooks

### Install Stripe CLI (if not already installed)
- **Windows**: Download from https://github.com/stripe/stripe-cli/releases
- **Mac**: `brew install stripe/stripe-cli/stripe`
- **Linux**: Download from releases page

### Login to Stripe CLI
```bash
stripe login
```
This will open your browser to authenticate.

### Start Webhook Listener
Open a **NEW terminal window** and run:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**IMPORTANT**: Keep this terminal running! You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Copy that webhook secret** (starts with `whsec_`) - you'll need it in the next step!

---

## Step 6: Configure Environment Variables

Create or update `.env.local` in your project root with these 3 keys:

```env
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Replace with:
- Your secret key from Step 2
- Your publishable key from Step 2
- Your webhook secret from Step 5 (from `stripe listen` output)

---

## Step 7: Update Founder UID

Open `lib/billing.ts` and find line 23:

```typescript
const FOUNDER_UID = "YOUR_FOUNDER_UID_HERE"; // Replace with your Firebase user UID
```

Replace with your actual Firebase User UID:
1. Log into your app
2. Open browser console (F12)
3. Run: `firebase.auth().currentUser.uid`
4. Copy your UID and paste it in `lib/billing.ts`

**OR** find it in Firebase Console → Authentication → Users

This UID will bypass all plan limits.

---

## Step 8: Restart Development Server

Since you added new environment variables:

```bash
# Stop your dev server (Ctrl+C)
npm run dev
```

---

## Step 9: Test the Checkout Flow

1. Navigate to: http://localhost:3000/app/billing
2. You should see 3 plan cards (Launch, Growth, Sovereign)
3. Click **"Upgrade Now"** on any plan (add-on agents and templates available for purchase separately; price varies)
4. You'll be redirected to Stripe Checkout
5. Use Stripe test card details:
   - **Card number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)
   - **Name**: Any name
   - **Email**: Any email
6. Complete the checkout
7. You should be redirected to `/app/billing/success`
8. After 3 seconds, redirected to `/app` dashboard

---

## Step 10: Verify Webhook Events

1. Check the terminal window running `stripe listen`
2. You should see webhook events logged:
   ```
   checkout.session.completed [200]
   customer.subscription.created [200]
   ```

3. Check Firestore in Firebase Console
4. Navigate to: **Firestore Database → workspace_billing**
5. You should see a new document with:
   - `plan`: "launch" | "growth" | "sovereign"
   - `status`: "active"
   - `limits`: Object with plan limits
   - `stripeCustomerId`: "cus_..."
   - `stripeSubscriptionId`: "sub_..."
   - `currentPeriodEnd`: Timestamp

---

## Troubleshooting

### Error: "Stripe is not defined"
- Make sure you ran `npm install stripe`
- Restart dev server

### Error: "No signature found"
- Check that `STRIPE_WEBHOOK_SECRET` is in `.env.local`
- Make sure `stripe listen` is running
- Restart dev server after adding env vars

### Checkout button doesn't work
- Check browser console for errors
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Make sure price IDs in code match your Stripe products

### Webhook not receiving events
- Ensure `stripe listen --forward-to localhost:3000/api/stripe/webhook` is running
- Check the terminal output for errors
- Verify webhook secret in `.env.local` matches `stripe listen` output

### Plan limits not showing
- Verify workspace_billing document exists in Firestore
- Check that workspaceId is being passed correctly
- Look at browser console for errors

---

## Plan Limits Reference

| Feature | Free | Launch | Growth | Sovereign |
|---------|------|---------|-----|--------|
| Active Agents | 1 | 5 | 20 | Unlimited |
| Workflow Runs/Month | 10 | 100 | 1,000 | Unlimited |
| Template Installs | 3 | 10 | Unlimited | Unlimited |
| Team Members | 1 | 2 | 10 | Unlimited |

**Founder UID bypasses ALL limits** (unlimited everything)

---

## Testing Subscription Lifecycle

### Test Subscription Cancellation
1. Go to Stripe Dashboard → Customers
2. Find your test customer
3. Click on their subscription
4. Click **Cancel subscription**
5. Choose **Cancel immediately**
6. Check your webhook listener - should see `customer.subscription.deleted`
7. Check Firestore - plan should downgrade to "free"

### Test Subscription Update
1. Create another checkout session with a different plan
2. Webhook will handle upgrade/downgrade
3. Firestore should update with new plan limits

---

## Next Steps

Once billing is working:

1. **Add plan gates to features**:
   - Import `checkLimit` from `lib/billing.ts`
   - Check limits before creating agents, running workflows, etc.
   - Show error and redirect to `/app/billing` if limit reached

2. **Add usage tracking**:
   - Increment counters when actions are performed
   - Store in `workspace_billing` document
   - Reset monthly counters on subscription renewal

3. **Add customer portal** (optional):
   - Allow users to manage subscriptions
   - View invoices
   - Update payment methods

4. **Production deployment**:
   - Switch to LIVE MODE in Stripe Dashboard
   - Update env vars with live keys (sk_live_, pk_live_)
   - Use Stripe webhook endpoints (not CLI)
   - Set up proper webhook endpoint in Stripe Dashboard

---

## Important Reminders

- **Always stay in TEST MODE** during development
- **Never commit** `.env.local` to git
- **Keep `stripe listen` running** while testing
- **Use test card 4242 4242 4242 4242** only
- **Founder UID bypasses all limits** - great for testing!

---

## Support

If you encounter issues:
1. Check Stripe Dashboard → Developers → Logs
2. Check browser console for client errors
3. Check terminal running `stripe listen` for webhook errors
4. Check Next.js terminal for API route errors
5. Check Firestore rules if writes are failing

Happy billing! 💳
