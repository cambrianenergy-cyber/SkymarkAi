# Production Checklist

## Status Legend
- ✅ Complete
- ⏳ In Progress
- ❌ Not Started
- ⚠️ Needs Review

---

## 13A - Documentation Setup
- [x] Create ops folder
- [x] Create PROD_CHECKLIST.md
- [x] Create FIRESTORE_INDEXES.md
- [x] Create SECURITY_RULES.md
- [x] Create ENV_VARS.md

## 13B - Firestore Security Rules
- [ ] Implement workspace membership gate
- [ ] Create isMember() helper function
- [ ] Lock all collections with workspaceId
- [ ] Test unauthorized access prevention
- [ ] Publish rules to production

## 13C - Firestore Indexes
- [ ] Test all list pages for index errors
- [ ] Create indexes from error links
- [ ] Document all indexes in FIRESTORE_INDEXES.md

## 13D - System Status Handling
- [ ] Audit all pages for loading states
- [ ] Add empty states with clear messages
- [ ] Add error states with retry options
- [ ] Ensure no infinite spinners

## 13E - Centralize Auth Guard
- [x] Create auth + workspaceId guard hook
- [x] Add guard to agents page
- [x] Add guard to workflows page
- [x] Add guard to campaigns page
- [x] Add guard to leads page
- [x] Add guard to workspaces page (auth only)
- [ ] Add guard to remaining pages (inbox, queue, schedule, assets, etc.)
- [x] Route to /app/workspaces when missing workspace
- [x] Test all routes have preconditions

## 13F - Logging + Audit Trails
- [ ] Create audit_logs collection
- [ ] Add logging for workflow actions
- [ ] Add logging for template installs
- [ ] Add logging for agent changes
- [ ] Add logging for schedule actions
- [ ] Add logging for lead conversions
- [ ] Add logging for followup actions
- [ ] Add logging for billing changes

## 13G - Environment Variables
- [ ] Create .env.example with all vars
- [ ] Confirm .env.local in .gitignore
- [ ] Document all required variables

## 13H - Stripe Production Readiness
- [ ] Confirm billing reads from workspace_billing
- [ ] Add past_due/canceled UI states
- [ ] Test billing gate on features

## 13I - Load Testing
- [ ] Test: Create workspace → switch workspace
- [ ] Test: Create workflow → run workflow → complete run
- [ ] Test: Create campaign → generate outputs
- [ ] Test: Create assets → schedule post
- [ ] Test: Create inbox thread → convert to lead → followup
- [ ] Test: Install marketplace template → run it
- [ ] Test: Switch workspace → confirm data isolation

## 13J - Vercel Deployment
- [ ] Push code to GitHub
- [ ] Connect Vercel to GitHub repo
- [ ] Deploy to Vercel
- [ ] Add environment variables in Vercel
- [ ] Test production deployment

## 13K - Firebase Auth Domain
- [ ] Add Vercel domain to authorized domains
- [ ] Test login in production

## 13L - Stripe Webhook Production
- [ ] Add webhook endpoint in Stripe Dashboard
- [ ] Copy webhook signing secret
- [ ] Add secret to Vercel env vars
- [ ] Redeploy and test

## 13M - Backups & Recovery
- [ ] Enable Firestore scheduled exports
- [ ] Set up Cloud Storage bucket
- [ ] Document founder UID break-glass access
- [ ] Test recovery procedure

---

## Notes
- Date Started: December 23, 2025
- Target Launch Date: TBD
- Critical Path: 13B (Security Rules) → 13J (Deployment) → 13K/L (Auth & Billing)
