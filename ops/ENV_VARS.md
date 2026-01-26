# Environment Variables

## Overview
This document lists all environment variables required for the application.

**⚠️ NEVER commit .env.local to version control!**

---

## Required Variables

### Firebase Configuration
```bash
# Firebase Web SDK Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

### Stripe Configuration (Test Mode)
```bash
# Stripe Test Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Test Mode)
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...
```

### Stripe Configuration (Production Mode)
```bash
# Stripe Live Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Live Mode)
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...
```

### Application Configuration
```bash
# Founder Access (Bypass billing limits)
FOUNDER_UID=your_firebase_user_id

# App URL (for webhooks and redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production: https://your-app.vercel.app
```

### Future API Keys (Add as needed)
```bash
# OpenAI (if using GPT agents)
OPENAI_API_KEY=sk-...

# SendGrid (for email)
SENDGRID_API_KEY=SG...

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

---

## Setup Instructions

### Local Development

1. **Create .env.local**
   ```bash
   # In project root
   touch .env.local
   ```

2. **Copy template**
   ```bash
   cp .env.example .env.local
   ```

3. **Fill in values**
   - Get Firebase config from Firebase Console
   - Get Stripe keys from Stripe Dashboard
   - Set your Firebase UID as FOUNDER_UID

### Vercel Production

1. **Go to Vercel Dashboard**
   - Select your project
   - Settings → Environment Variables

2. **Add each variable**
   - Name: Variable name (e.g., `STRIPE_SECRET_KEY`)
   - Value: Your secret value
   - Environment: Production, Preview, Development

3. **Redeploy**
   - After adding variables, redeploy your app
   - Deployments → ⋯ → Redeploy

---

## Security Checklist

- [x] `.env.local` is in `.gitignore`
- [x] `.env.example` has placeholders only (no real secrets)
- [ ] All team members have their own `.env.local`
- [ ] Production secrets are different from test secrets
- [ ] Webhook secrets are unique per environment
- [ ] Founder UID is documented and stored securely

---

## Getting Values

### Firebase Config
1. Firebase Console → Project Settings → General
2. Scroll to "Your apps"
3. Select web app or create one
4. Copy config object values

### Stripe Keys
1. Stripe Dashboard → Developers → API Keys
2. Publishable key: Starts with `pk_test_` or `pk_live_`
3. Secret key: Starts with `sk_test_` or `sk_live_`
4. Click "Reveal test/live key" to copy

### Stripe Webhook Secret
**Local Development:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Output will show: whsec_...
```

**Production:**
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`
4. Copy signing secret (starts with `whsec_`)

### Founder UID
1. Firebase Console → Authentication → Users
2. Find your user account
3. Copy the UID (long alphanumeric string)

---

## Environment-Specific Values

| Variable | Local | Staging | Production |
|----------|-------|---------|------------|
| NEXT_PUBLIC_APP_URL | localhost:3000 | staging.app.com | app.com |
| Stripe Keys | Test keys | Test keys | Live keys |
| Firebase Project | Dev project | Staging project | Production project |

---

## Troubleshooting

**Problem:** "STRIPE_SECRET_KEY is not defined"
- **Solution:** Add variable to `.env.local` and restart dev server

**Problem:** Stripe webhook fails with "Invalid signature"
- **Solution:** Ensure `STRIPE_WEBHOOK_SECRET` matches webhook secret from Stripe

**Problem:** Firebase permission denied
- **Solution:** Check Firebase config variables are correct (especially project ID)

**Problem:** Founder bypass not working
- **Solution:** Verify `FOUNDER_UID` matches your Firebase Auth UID exactly

---

**Last Updated:** December 23, 2025
