# Firestore Security Rules - Production

## Current Status
⚠️ **CRITICAL**: Current rules allow authenticated read/write to all collections. This MUST be fixed before production.

---

## Production Security Rules

Replace your current Firestore rules with these workspace-gated rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function: Check if user is an active member of workspace
    function isMember(workspaceId) {
      return exists(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + workspaceId))
        && get(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + workspaceId)).data.status == 'active';
    }
    
    // Helper function: Check if user is owner or admin
    function isAdmin(workspaceId) {
      let membership = get(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + workspaceId)).data;
      return membership.status == 'active' 
        && (membership.role == 'owner' || membership.role == 'admin');
    }
    
    // Helper function: Check if user is owner
    function isOwner(workspaceId) {
      let membership = get(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + workspaceId)).data;
      return membership.status == 'active' && membership.role == 'owner';
    }
    
    // Workspaces - read if member, write if owner/admin
    match /workspaces/{workspaceId} {
      allow read: if request.auth != null && isMember(workspaceId);
      allow create: if request.auth != null && request.resource.data.ownerUserId == request.auth.uid;
      allow update, delete: if request.auth != null && isOwner(workspaceId);
    }
    
    // Workspace Members - read if member, write if owner/admin
    match /workspace_members/{membershipId} {
      allow read: if request.auth != null && (
        membershipId.matches('^' + request.auth.uid + '_.*') ||
        isMember(membershipId.split('_')[1])
      );
      allow create: if request.auth != null && (
        request.resource.data.userId == request.auth.uid ||
        isAdmin(request.resource.data.workspaceId)
      );
      allow update, delete: if request.auth != null && isAdmin(resource.data.workspaceId);
    }
    
    // Agents - read/write if member
    match /agents/{agentId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Workflows - read/write if member
    match /workflows/{workflowId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Workflow Runs - read/write if member
    match /workflow_runs/{runId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Campaigns - read/write if member
    match /campaigns/{campaignId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Content Assets - read/write if member
    match /content_assets/{assetId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Scheduled Posts - read/write if member
    match /scheduled_posts/{postId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Inbox Threads - read/write if member
    match /inbox_threads/{threadId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Inbox Messages - read/write if member
    match /inbox_messages/{messageId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Leads - read/write if member
    match /leads/{leadId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Followup Sequences - read/write if member
    match /followup_sequences/{sequenceId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Followup Jobs - read/write if member
    match /followup_jobs/{jobId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Workflow Templates - public read, restricted write
    match /workflow_templates/{templateId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.authorName == 'Uqentra AI';
      allow update, delete: if false; // Templates are immutable
    }
    
    // Template Installs - read/write if member
    match /template_installs/{installId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if request.auth != null && isMember(request.resource.data.workspaceId);
    }
    
    // Workspace Billing - read if member, write if owner
    match /workspace_billing/{workspaceId} {
      allow read: if request.auth != null && isMember(workspaceId);
      allow write: if request.auth != null && isOwner(workspaceId);
    }
    
    // Usage Counters - read if member, write server-only (via Admin SDK)
    match /usage_counters/{counterId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if false; // Server-side only
    }
    
    // Appointments - public read/write (for booking form)
    match /appointments/{appointmentId} {
      allow read, write: if true; // Public booking form needs this
    }
    
    // Audit Logs - read if member, write server-only
    match /audit_logs/{logId} {
      allow read: if request.auth != null && isMember(resource.data.workspaceId);
      allow write: if false; // Server-side only
    }
  }
}
```

---

## Implementation Steps

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com
   - Select your project
   - Left sidebar → Build → Firestore Database
   - Click "Rules" tab

2. **Paste Production Rules**
   - Copy the rules above
   - Replace ALL existing rules
   - Review the rules carefully

3. **Publish Rules**
   - Click "Publish" button
   - Confirm the change

4. **Test Security**
   - Try accessing data from another workspace
   - Should get "permission-denied" error
   - Test with different user roles (owner, admin, member, viewer)

---

## Important Notes

### Membership Document Structure
Rules assume workspace_members documents use compound ID format:
- Document ID: `{userId}_{workspaceId}`
- Fields: `userId`, `workspaceId`, `role`, `status`

If your structure is different, adjust the `isMember()` function accordingly.

### Collections Not Yet Protected
If you add new collections later, make sure to add rules for them!

### Server-Side Operations
Some operations require Firebase Admin SDK (server-side):
- Usage counter updates
- Audit log writes
- Stripe webhook operations

These bypass security rules and use service account credentials.

---

## Testing Checklist

- [ ] User A can read workspace A data
- [ ] User A CANNOT read workspace B data
- [ ] Owner can delete workspace
- [ ] Admin can invite members
- [ ] Member can create workflows
- [ ] Viewer CANNOT create workflows
- [ ] Public users can submit appointments
- [ ] Marketplace templates are readable by all authenticated users

---

## Rollback Plan

If something breaks after deploying these rules:

1. Go to Firebase Console → Firestore → Rules
2. Click "History" tab
3. Find previous version
4. Click "Restore"
5. Click "Publish"

Keep a backup of your old rules in this file for reference.
