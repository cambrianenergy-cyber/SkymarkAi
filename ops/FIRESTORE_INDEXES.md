# Firestore Indexes

## Overview
Firestore requires composite indexes for queries that:
- Order by multiple fields
- Filter on multiple fields
- Combine array-contains with other filters

This document tracks all required indexes for production.

---

## How to Create Indexes

### Method 1: From Error Links (Recommended)
1. Run the app and visit pages that list data
2. When you see a Firestore index error in console
3. Click the error link (it opens Firebase Console)
4. Click "Create Index"
5. Wait for index to build (~2-5 minutes)
6. Refresh the page

### Method 2: Manual Creation
1. Firebase Console → Firestore Database → Indexes tab
2. Click "Create Index"
3. Select collection and fields
4. Click "Create"

---

### CLI Quick Deploy (JSON)
Use our curated JSON to deploy a minimal set of indexes that match current queries:

```bash
# From repo root
npm i -g firebase-tools
firebase login
copy ops\FIRESTORE_INDEXES.json firestore.indexes.json
firebase deploy --only firestore:indexes
```

---

## Required Indexes

### 1. Workflows
**Collection:** `workflows`
```
Fields:
  - workspaceId (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

**Collection:** `workflows`
```
Fields:
  - workspaceId (Ascending)
  - status (Ascending)
  - updatedAt (Descending)
Query scope: Collection
```

### 2. Workflow Runs
**Collection:** `workflow_runs`
```
Fields:
  - workspaceId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

**Collection:** `workflow_runs`
```
Fields:
  - workspaceId (Ascending)
  - workflowId (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

### 3. Campaigns
**Collection:** `campaigns`
```
Fields:
  - workspaceId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

### 4. Content Assets
**Collection:** `content_assets`
```
Fields:
  - workspaceId (Ascending)
  - type (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

### 5. Scheduled Posts
**Collection:** `scheduled_posts`
```
Fields:
  - workspaceId (Ascending)
  - status (Ascending)
  - scheduledFor (Ascending)
Query scope: Collection
```

### 6. Inbox Threads
**Collection:** `inbox_threads`
```
Fields:
  - workspaceId (Ascending)
  - status (Ascending)
  - lastMessageAt (Descending)
Query scope: Collection
```

**Collection:** `inbox_threads`
```
Fields:
  - workspaceId (Ascending)
  - assignedTo (Ascending)
  - lastMessageAt (Descending)
Query scope: Collection
```

### 7. Leads
**Collection:** `leads`
```
Fields:
  - workspaceId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

**Collection:** `leads`
```
Fields:
  - workspaceId (Ascending)
  - disposition (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

### 8. Followup Jobs
**Collection:** `followup_jobs`
```
Fields:
  - workspaceId (Ascending)
  - status (Ascending)
  - scheduledFor (Ascending)
Query scope: Collection
```

**Collection:** `followup_jobs`
```
Fields:
  - workspaceId (Ascending)
  - leadId (Ascending)
  - status (Ascending)
Query scope: Collection
```

### 9. Agents
**Collection:** `agents`
```
Fields:
  - workspaceId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

### 10. Workspace Members
**Collection:** `workspace_members`
```
Fields:
  - workspaceId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

**Collection:** `workspace_members`
```
Fields:
  - userId (Ascending)
  - status (Ascending)
Query scope: Collection
```

### 11. Template Installs
**Collection:** `template_installs`
```
Fields:
  - workspaceId (Ascending)
  - installedAt (Descending)
Query scope: Collection
```

### 12. Audit Logs
**Collection:** `audit_logs`
```
Fields:
  - workspaceId (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

**Collection:** `audit_logs`
```
Fields:
  - workspaceId (Ascending)
  - entityType (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

---

## Minimal Indexes for Current Code
If you only want the indexes necessary for the current code paths, create these:

- workflows: workspaceId (ASC), updatedAt (DESC)
- campaigns: workspaceId (ASC), updatedAt (DESC)
- campaigns: workspaceId (ASC), createdAt (DESC)
- content_assets: workspaceId (ASC), createdAt (DESC)
- scheduled_posts: workspaceId (ASC), scheduledFor (ASC)
- leads: workspaceId (ASC), updatedAt (DESC)
- inbox_messages: workspaceId (ASC), threadId (ASC), sentAt (ASC)

These are included in ops/FIRESTORE_INDEXES.json.

---

## Index Build Status

| Collection | Index Fields | Status | Date Created | Notes |
|------------|-------------|---------|--------------|-------|
| workflows | workspaceId + createdAt | ❌ Not Created | - | Required for workflows list |
| workflow_runs | workspaceId + status + createdAt | ❌ Not Created | - | Required for runs list |
| campaigns | workspaceId + status + createdAt | ❌ Not Created | - | Required for campaigns list |
| scheduled_posts | workspaceId + status + scheduledFor | ❌ Not Created | - | Required for schedule page |
| inbox_threads | workspaceId + status + lastMessageAt | ❌ Not Created | - | Required for inbox |
| leads | workspaceId + status + createdAt | ❌ Not Created | - | Required for leads list |
| followup_jobs | workspaceId + status + scheduledFor | ❌ Not Created | - | Required for queue |

---

## Testing Process

Visit each page and document any index errors:

1. [ ] `/app/workflows` - Workflows list
2. [ ] `/app/workflows/run` - Runs list
3. [ ] `/app/campaigns` - Campaigns list
4. [ ] `/app/assets` - Assets list
5. [ ] `/app/schedule` - Scheduled posts
6. [ ] `/app/inbox` - Inbox threads
7. [ ] `/app/leads` - Leads list
8. [ ] `/app/queue` - Followup queue
9. [ ] `/app/marketplace` - Templates (should work, no workspaceId filter)
10. [ ] `/app/agents` - Agents list

---

## Notes

- Indexes take 2-5 minutes to build
- You cannot query until index is ready
- Indexes consume storage quota (minimal)
- Single-field indexes are created automatically
- Composite indexes must be created manually

**Last Updated:** December 23, 2025
