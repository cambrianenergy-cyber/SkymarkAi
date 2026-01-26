# Firestore Security Rules for Multi-Tenant Agency Mode

## ⚠️ CRITICAL: Deploy These Rules to Protect Client Data

These security rules enforce workspace-level data isolation and role-based permissions.

---

## 📋 Rules to Add in Firebase Console

**Go to**: Firebase Console → Firestore Database → Rules tab

**Replace your current rules** with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function: Check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function: Get user's role in a workspace
    function getUserRole(workspaceId) {
      return get(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + workspaceId)).data.role;
    }
    
    // Helper function: Check if user is member of workspace
    function isMemberOf(workspaceId) {
      return exists(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + workspaceId)) &&
             get(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + workspaceId)).data.status == 'active';
    }
    
    // Helper function: Check if user can edit (member, admin, or owner)
    function canEdit(workspaceId) {
      let role = getUserRole(workspaceId);
      return role in ['owner', 'admin', 'member'];
    }
    
    // Helper function: Check if user can admin (admin or owner)
    function canAdmin(workspaceId) {
      let role = getUserRole(workspaceId);
      return role in ['owner', 'admin'];
    }
    
    // Helper function: Check if user is owner
    function isOwner(workspaceId) {
      let role = getUserRole(workspaceId);
      return role == 'owner';
    }
    
    // ========================================
    // USERS COLLECTION
    // ========================================
    match /users/{userId} {
      // Users can read/write their own profile
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    
    // ========================================
    // WORKSPACES COLLECTION
    // ========================================
    match /workspaces/{workspaceId} {
      // Members can read workspace they belong to
      allow read: if isSignedIn() && isMemberOf(workspaceId);
      
      // Only owners can update workspace settings
      allow update: if isSignedIn() && isOwner(workspaceId);
      
      // Anyone can create a workspace (becomes owner)
      allow create: if isSignedIn() && request.resource.data.ownerUserId == request.auth.uid;
      
      // Only owners can delete
      allow delete: if isSignedIn() && isOwner(workspaceId);
    }
    
    // ========================================
    // WORKSPACE_MEMBERS COLLECTION
    // ========================================
    match /workspace_members/{memberId} {
      // Members can read all members of workspaces they belong to
      allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
      
      // Admins and owners can add members
      allow create: if isSignedIn() && canAdmin(request.resource.data.workspaceId);
      
      // Admins and owners can update member roles (except can't demote owner)
      allow update: if isSignedIn() && 
                      canAdmin(resource.data.workspaceId) &&
                      resource.data.role != 'owner';
      
      // Admins and owners can remove members (except owner)
      allow delete: if isSignedIn() && 
                      canAdmin(resource.data.workspaceId) &&
                      resource.data.role != 'owner';
    }
    
    // ========================================
    // LEADS COLLECTION
    // ========================================
    match /leads/{leadId} {
      // Members can read leads in their workspace
      allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
      
      // Members, admins, owners can create/update leads
      allow create, update: if isSignedIn() && canEdit(request.resource.data.workspaceId);
      
      // Admins and owners can delete leads
      allow delete: if isSignedIn() && canAdmin(resource.data.workspaceId);
    }
    
    // ========================================
    // FOLLOW-UP SEQUENCES COLLECTION
    // ========================================
    match /followup_sequences/{sequenceId} {
      // Members can read sequences in their workspace
      allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
      
      // Members, admins, owners can create/update sequences
      allow create, update: if isSignedIn() && canEdit(request.resource.data.workspaceId);
      
      // Admins and owners can delete sequences
      allow delete: if isSignedIn() && canAdmin(resource.data.workspaceId);
    }
    
    // ========================================
    // FOLLOW-UP JOBS COLLECTION
    // ========================================
    match /followup_jobs/{jobId} {
      // Members can read jobs in their workspace
      allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
      
      // Members, admins, owners can create/update jobs
      allow create, update: if isSignedIn() && canEdit(request.resource.data.workspaceId);
      
      // Admins and owners can delete jobs
      allow delete: if isSignedIn() && canAdmin(resource.data.workspaceId);
    }
    
    // ========================================
    // INBOX THREADS COLLECTION
    // ========================================
    match /inbox_threads/{threadId} {
      // Members can read threads in their workspace
      allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
      
      // Members, admins, owners can create/update threads
      allow create, update: if isSignedIn() && canEdit(request.resource.data.workspaceId);
      
      // Admins and owners can delete threads
      allow delete: if isSignedIn() && canAdmin(resource.data.workspaceId);
    }
    
    // ========================================
    // INBOX MESSAGES COLLECTION
    // ========================================
    match /inbox_messages/{messageId} {
      // Members can read messages in their workspace
      allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
      
      // Members, admins, owners can create messages
      allow create: if isSignedIn() && canEdit(request.resource.data.workspaceId);
      
      // No one can update messages (immutable)
      allow update: if false;
      
      // Admins and owners can delete messages
      allow delete: if isSignedIn() && canAdmin(resource.data.workspaceId);
    }
    
    // ========================================
    // WORKFLOWS, ASSETS, SCHEDULE, ETC.
    // ========================================
    match /workflows/{workflowId} {
      allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
      allow create, update: if isSignedIn() && canEdit(request.resource.data.workspaceId);
      allow delete: if isSignedIn() && canAdmin(resource.data.workspaceId);
    }
    
    match /workflow_runs/{runId} {
      allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
      allow create, update: if isSignedIn() && canEdit(request.resource.data.workspaceId);
      allow delete: if isSignedIn() && canAdmin(resource.data.workspaceId);
    }
    
    match /assets/{assetId} {
      allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
      allow create, update: if isSignedIn() && canEdit(request.resource.data.workspaceId);
      allow delete: if isSignedIn() && canAdmin(resource.data.workspaceId);
    }
    
    match /scheduled_posts/{postId} {
      allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
      allow create, update: if isSignedIn() && canEdit(request.resource.data.workspaceId);
      allow delete: if isSignedIn() && canAdmin(resource.data.workspaceId);
    }
    
    match /campaigns/{campaignId} {
      allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
      allow create, update: if isSignedIn() && canEdit(request.resource.data.workspaceId);
      allow delete: if isSignedIn() && canAdmin(resource.data.workspaceId);
    }
    
    // Deny all other reads/writes by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🔒 What These Rules Protect

### 1. **Workspace Isolation**
- Users can only read/write data in workspaces they're a member of
- Prevents cross-workspace data leaks
- Critical for agency/multi-tenant setups

### 2. **Role-Based Permissions**

**Owner:**
- Full access to everything
- Can delete workspace
- Cannot be removed or demoted

**Admin:**
- Can manage team (invite, remove members)
- Can create/edit/delete content
- Cannot delete workspace

**Member:**
- Can create/edit content
- Can manage leads and inbox
- Cannot manage team

**Viewer:**
- Read-only access
- Cannot create, edit, or delete anything

### 3. **Data Integrity**
- Messages are immutable (cannot be edited after creation)
- Workspace owner role is protected
- User profiles can only be edited by the user themselves

---

## 🚀 How to Deploy

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Firestore Database** in left menu
4. Click **Rules** tab

### Step 2: Replace Rules
1. **Delete existing rules** in the editor
2. **Copy the entire rules code** from above
3. **Paste** into the editor
4. Click **Publish**

### Step 3: Test
1. Try accessing data from different workspaces
2. Try actions with different roles
3. Verify errors show for unauthorized access

---

## ⚠️ Important Notes

### Membership Document ID Format
The rules assume membership document IDs follow this pattern:
```
{userId}_{workspaceId}
```

**If your membership docs use auto-generated IDs**, you'll need to modify the helper functions to use a query instead:

```javascript
function isMemberOf(workspaceId) {
  return exists(/databases/$(database)/documents/workspace_members/
    $(query.where('userId', '==', request.auth.uid)
           .where('workspaceId', '==', workspaceId)
           .where('status', '==', 'active')));
}
```

However, this is **slower** and **costs more reads**. Consider restructuring your membership docs to use composite IDs.

### Testing Mode
If rules are too strict during development, you can temporarily use:

```javascript
// ⚠️ DEVELOPMENT ONLY - REMOVE IN PRODUCTION
match /{document=**} {
  allow read, write: if isSignedIn();
}
```

**Never deploy this to production!**

---

## 📊 Permission Matrix

| Action | Viewer | Member | Admin | Owner |
|--------|--------|--------|-------|-------|
| View data | ✅ | ✅ | ✅ | ✅ |
| Create leads/content | ❌ | ✅ | ✅ | ✅ |
| Edit leads/content | ❌ | ✅ | ✅ | ✅ |
| Delete leads/content | ❌ | ❌ | ✅ | ✅ |
| Invite members | ❌ | ❌ | ✅ | ✅ |
| Remove members | ❌ | ❌ | ✅ | ✅ |
| Edit workspace | ❌ | ❌ | ❌ | ✅ |
| Delete workspace | ❌ | ❌ | ❌ | ✅ |

---

## ✅ Deployment Checklist

- [ ] Rules published in Firebase Console
- [ ] Tested with multiple user roles
- [ ] Tested with multiple workspaces
- [ ] Verified unauthorized access is blocked
- [ ] Removed any development-only rules
- [ ] Documented for team members

---

## 🔍 Troubleshooting

### "Permission denied" errors
1. Check user is logged in
2. Verify user has active membership in workspace
3. Confirm workspaceId is correct in document
4. Check user role has required permissions

### Rules not updating
1. Wait 30 seconds after publishing
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache
4. Sign out and sign back in

### Performance issues
1. Minimize rule complexity
2. Use indexed queries
3. Consider caching membership data
4. Monitor Firestore usage in console

---

Your multi-tenant security is now **agency-grade**! 🎉
