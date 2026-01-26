# 🔥 FIRESTORE SETUP - Quick Start Guide

## 🚀 **5-Minute Setup**

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com
2. Select your project
3. Click **Firestore Database** in left sidebar
4. Click **Data** tab at the top

---

### Step 2: Create Collection: `leads`

1. Click **"+ Start collection"**
2. **Collection ID**: `leads`
3. Click **Auto-ID** for Document ID
4. Add these fields one by one:

| Field Name | Type | Value (for testing) |
|------------|------|---------------------|
| `workspaceId` | string | Your workspace ID from dashboard |
| `threadId` | string | *(leave empty)* |
| `fullName` | string | `Test Lead` |
| `handle` | string | `@testlead` |
| `channel` | string | `instagram` |
| `status` | string | `open` |
| `stage` | string | `new` |
| `score` | number | `0` |
| `scoreLabel` | string | `cold` |
| `assignedToUid` | string | Your user ID from Firebase Auth |
| `notes` | string | `Test lead for CRM` |
| `createdAt` | timestamp | *(click "Add timestamp")* |
| `updatedAt` | timestamp | *(click "Add timestamp")* |

5. Click **Save**

---

### Step 3: Create Collection: `followup_sequences`

1. Click **"+ Start collection"**
2. **Collection ID**: `followup_sequences`
3. Click **Auto-ID** for Document ID
4. Add these fields:

| Field Name | Type | Value |
|------------|------|-------|
| `workspaceId` | string | Your workspace ID |
| `name` | string | `New Lead 7-Day Sequence` |
| `status` | string | `active` |
| `channel` | string | `dm` |
| `steps` | array | *(leave empty - will fill via UI)* |
| `createdAt` | timestamp | *(add timestamp)* |
| `updatedAt` | timestamp | *(add timestamp)* |

5. Click **Save**

---

### Step 4: Create Collection: `followup_jobs`

1. Click **"+ Start collection"**
2. **Collection ID**: `followup_jobs`
3. Click **Auto-ID** for Document ID
4. Add these fields:

| Field Name | Type | Value |
|------------|------|-------|
| `workspaceId` | string | Your workspace ID |
| `leadId` | string | *(copy lead ID from Step 2)* |
| `threadId` | string | *(leave empty for now)* |
| `sequenceId` | string | *(copy sequence ID from Step 3)* |
| `stepIndex` | number | `0` |
| `scheduledFor` | timestamp | *(set to current time or future)* |
| `status` | string | `queued` |
| `messageDraft` | string | `Hi! Following up on our conversation.` |
| `createdAt` | timestamp | *(add timestamp)* |
| `updatedAt` | timestamp | *(add timestamp)* |

5. Click **Save**

---

## 🎯 **You're Done!**

### ✅ Quick Verification:
1. Go to your app dashboard
2. Click **"🎯 Leads"** - Should see your test lead
3. Click **"📨 Follow-ups"** - Should see your sequence
4. Click **"⏰ Queue"** - Should see your test job

---

## 📊 **Firestore Indexes (Will Auto-Prompt)**

When you first use the app, you'll see errors like:
> "The query requires an index. Click here to create it."

**Just click the link** - Firebase will:
1. Auto-generate the index
2. Take 2-5 minutes to build
3. Start working automatically

### Common Indexes Needed:
- `leads`: `workspaceId` + `updatedAt`
- `followup_sequences`: `workspaceId` + `createdAt`
- `followup_jobs`: `workspaceId` + `scheduledFor`

**Don't worry** - Firebase tells you exactly what to create!

---

## 🚨 **Troubleshooting**

### "No workspace found"
- Check your workspace ID in the dashboard
- Make sure it matches the `workspaceId` in collections

### "Lead not found"
- Copy the exact lead ID from Firestore
- Use it when creating jobs

### "Missing permissions"
- Check Firestore Rules
- Make sure authenticated users can read/write

### "Index not ready"
- Wait 2-5 minutes after creating index
- Refresh the page

---

## 🎉 **Next: Test the Full Flow**

1. **Convert Inbox → Lead**
   - Go to `/app/inbox`
   - Click a conversation
   - Click "🎯 Convert to Lead"

2. **Create Sequence**
   - Go to `/app/followups`
   - Click "+ New Sequence"
   - Add 3 steps with message templates

3. **Start Automation**
   - Open a lead
   - Click "▶️ Start Sequence"
   - Select your sequence

4. **Execute Jobs**
   - Go to `/app/queue`
   - Click "📤 Send Now"
   - Watch the magic! ✨

---

## 📝 **Field Explanations**

### Lead Fields:
- `workspaceId`: Links to your company workspace
- `threadId`: Links to inbox conversation
- `status`: Sales pipeline status (open/qualified/won/lost)
- `stage`: Follow-up stage (new/contacted/booked/closed)
- `score`: Lead quality score (0-100+)
- `scoreLabel`: cold/warm/hot indicator

### Sequence Fields:
- `steps`: Array of follow-up messages
- `channel`: Where to send (dm/sms/email)
- `status`: active or inactive

### Job Fields:
- `stepIndex`: Which step in sequence (0 = first)
- `scheduledFor`: When to send
- `status`: queued/sent/failed/canceled
- `messageDraft`: The actual message to send

---

## 🔗 **Useful Firebase Console Links**

- Firestore Database: `console.firebase.google.com/project/[YOUR_PROJECT]/firestore`
- Authentication: `console.firebase.google.com/project/[YOUR_PROJECT]/authentication`
- Indexes: `console.firebase.google.com/project/[YOUR_PROJECT]/firestore/indexes`

**Replace `[YOUR_PROJECT]` with your Firebase project ID**

---

## ⚡ **Speed Tips**

1. Use **Auto-ID** for all documents (don't type custom IDs)
2. Copy workspace ID from your dashboard URL
3. For timestamps, click **"Add timestamp"** - don't type
4. You can add more test data via the UI (better than console)
5. Indexes build in background - keep working!

---

## 🎊 **Ready to Rock!**

Once collections are created:
- Restart dev server: `npm run dev`
- Open dashboard
- Start automating! 🚀
