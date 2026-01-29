# Onboarding Process Documentation

## Overview
This document describes the onboarding process for new workspaces and users in the Skyymarkai platform. It covers the onboarding flow, plan recommendation logic, user roles, and key API endpoints.

---

## Onboarding Flow Steps

1. **Company Identity**
   - Collect company name, industry, website, location.
2. **Company Role**
   - User selects their business role (owner, exec, admin, lead, member, contractor).
3. **Team Size**
   - Specify seat range and active users.
4. **Workspace Needs**
   - Indicate if multi-workspace is needed, use case, and workspace count.
5. **Primary Outcome**
   - Select main goal (support, sales, ops, marketing, reporting, custom) and tools.
6. **Plan Recommendation**
   - System recommends a plan (Accelerate, Dominion, Sovereign) based on inputs.
7. **Workspace Setup (Optional)**
   - Create additional workspaces if multi-workspace is selected.
8. **Invite Team**
   - Invite team members by email and assign roles.
9. **Connect Social Accounts**
   - Connect social platforms for integration.
10. **Complete**
    - Onboarding is finished, quickstart agent/workflow is provisioned.

---

## Plan Recommendation Logic
- **Accelerate ($499/mo, up to 3 agents):** Default for solo/small teams.
- **Dominion ($999/mo, up to 5 agents):** Multi-workspace or large teams (16+ seats).
- **Sovereign ($1,999/mo, up to 7 agents):** Agency use case or 25+ workspaces.

---

## User Roles
- Owner / Founder
- Executive (C-level / VP)
- Admin / Ops Manager
- Team Lead
- Individual Contributor
- Contractor / Agency

---

## API Endpoints
- `/api/plan_intents/[workspaceId]` – Save plan selection
- `/api/workspace_onboarding/[workspaceId]/inputs` – Save onboarding step inputs
- `/api/workspace_members/[workspaceId]_[uid]` – Assign user role
- `/api/invitations` – Invite team members
- `/api/notifications` – Send onboarding notifications

---

## Quickstart Provisioning
- After onboarding, a starter agent and workflow are created based on the selected primary outcome.

---

## FAQ
- **Can I change my plan later?**
  Yes, you can upgrade or downgrade at any time from the billing settings.
- **What if I skip inviting my team?**
  You can invite team members later from the workspace dashboard.
- **Is onboarding required for all users?**
  Only workspace creators must complete onboarding; team members join via invite.

---

## Troubleshooting
- **Stuck on a step?**
  - Ensure all required fields are filled.
  - Check for error messages or blocked reasons.
- **Did not receive invite email?**
  - Check spam folder.
  - Contact support if not received within 10 minutes.
- **Social account connection fails?**
  - Verify credentials and permissions.
  - Try reconnecting or use a different browser.

---

For more details, see the onboarding UI screens and onboarding logic in the `src/components/onboarding/` and `src/lib/onboarding/` folders.
