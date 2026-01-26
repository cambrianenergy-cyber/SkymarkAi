# Step 11 — Workflow Marketplace (COMPLETE)

## ✅ What Was Built

### 1. Firestore Collections Structure

#### `workflow_templates` collection
- **templateKey** (string) - unique identifier
- **name** (string) - display name
- **description** (string) - what the template does
- **category** (string) - campaigns | repurpose | inbox | leads | ads | analytics | creation | growth
- **tags** (array) - searchable keywords
- **version** (number) - template version
- **status** (string) - public | private | draft
- **steps** (array of objects)
  - order (number)
  - agentType (string)
  - instruction (string)
- **authorName** (string)
- **authorUid** (string, optional)
- **installCount** (number)
- **ratingAvg** (number, optional)
- **ratingCount** (number, optional)
- **createdAt** (timestamp)
- **updatedAt** (timestamp)

#### `template_installs` collection
- **workspaceId** (string)
- **templateId** (string)
- **templateKey** (string)
- **installedByUid** (string)
- **installedAt** (timestamp)
- **workflowId** (string) - the created workflow ID

---

### 2. Pages Created

#### `/app/marketplace` - List View
**Features:**
- Search bar (filters by name, description, tags)
- Category dropdown filter
- Template cards showing:
  - Category badge
  - Name
  - Description
  - Tags (first 3)
  - Install count
  - Version number
  - "View Details" button
  - "Install" button (disabled for viewers)
- Responsive grid layout
- Empty state for no results

#### `/app/marketplace/[templateId]` - Detail View
**Features:**
- Back button to marketplace
- Template header with:
  - Category badge
  - Full name
  - Full description
  - All tags
  - Stats (installs, version, author)
  - Install button (disabled for viewers)
- Steps breakdown showing:
  - Step number
  - Agent type
  - Instruction text
- Ordered by step.order field

---

### 3. Install Functionality

**When user clicks "Install":**

1. **Permission check** - Only owner/admin/member can install (viewers blocked)
2. **Create workflow** in user's workspace with:
   - workspaceId (from localStorage)
   - name, description, steps (from template)
   - status: "active"
   - installedFromTemplateId, installedFromTemplateKey (tracking)
   - timestamps
3. **Track install** in template_installs collection
4. **Increment** template's installCount (+1)
5. **Redirect** to `/app/workflows/[workflowId]`

---

### 4. Permission System

- **Viewers**: Can browse marketplace, but Install button is disabled with tooltip
- **Members, Admins, Owners**: Can browse and install templates
- Uses `useWorkspace` hook's `canEdit` permission helper
- Enforced in both UI (button disabled) and backend (permission check before install)

---

## 🎯 How to Seed Templates

### Option 1: Manual (Firebase Console)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Firestore Database → Data
4. Click "Start collection"
5. Collection ID: `workflow_templates`
6. Click "Auto-ID" for document
7. Copy fields from `lib/marketplaceSeedData.ts`
8. For **steps** field:
   - Type: array
   - Add item for each step
   - Each item is a map with: order, agentType, instruction
9. For **tags** field:
   - Type: array
   - Add each tag as string item
10. Add timestamps: createdAt, updatedAt (click clock icon)
11. Click Save
12. Repeat for all 8 templates

### Option 2: Browser Console Script (Fastest)

1. Open your app at `localhost:3000/app`
2. Press **F12** → Console tab
3. Copy contents of `scripts/seedMarketplace.js`
4. Paste into console
5. Press Enter
6. Wait for "🎉 All templates seeded successfully!"

**Note:** Browser console method requires Firebase SDK to be loaded on the page.

---

## 📦 8 Pre-Built Templates

All templates are defined in `lib/marketplaceSeedData.ts`:

1. **Campaign Generator — Full Launch Plan** (campaigns)
   - 4 steps: research → strategy → content → timeline
   
2. **Weekly Content Engine** (creation)
   - 4 steps: trending topics → blog post → repurpose → schedule
   
3. **Repurpose Engine — Multi-Platform Expansion** (repurpose)
   - 6 steps: analyze → Twitter → LinkedIn → Instagram → YouTube → email
   
4. **Inbox Triage + Suggested Replies** (inbox)
   - 4 steps: classify → prioritize → generate replies → tag
   
5. **Lead Warm-Up Sequence (7-day)** (leads)
   - 7 steps: one email per day building trust and conversion
   
6. **Reactivation Campaign (Cold Leads)** (leads)
   - 5 steps: segment → miss you → offer → testimonials → urgency
   
7. **Analytics → Next Week Action Plan** (analytics)
   - 4 steps: pull metrics → insights → action items → task breakdown
   
8. **Offer Builder + Funnel Draft** (growth)
   - 5 steps: define offer → landing copy → upsells → email sequence → flow diagram

---

## 🧪 Testing Checklist

### Browse Marketplace
- [ ] Navigate to `/app/marketplace` from dashboard
- [ ] See all public templates in grid
- [ ] Search for "campaign" shows only campaign templates
- [ ] Category filter works (select "leads" shows only lead templates)
- [ ] Template cards show name, description, tags, install count

### View Template Detail
- [ ] Click "View Details" on any template
- [ ] See template name, description, category, tags
- [ ] See all workflow steps in order
- [ ] Each step shows order number, agent type, instruction
- [ ] "Back to Marketplace" button works

### Install Template (as Member/Admin/Owner)
- [ ] Click "Install" button
- [ ] See "Installing..." text briefly
- [ ] Redirected to `/app/workflows/[id]`
- [ ] New workflow appears in workflows list
- [ ] Workflow has correct name, description, steps from template
- [ ] Go back to marketplace → template installCount increased by 1
- [ ] Check Firestore → `template_installs` has new doc with workspaceId, templateId, workflowId

### Permission Tests (as Viewer)
- [ ] Login as viewer role
- [ ] Navigate to `/app/marketplace`
- [ ] See all templates
- [ ] "Install" button is gray/disabled
- [ ] Hover shows "Viewers cannot install templates" tooltip
- [ ] Click on detail page → Install button still disabled

---

## 🔒 Firestore Security Rules

Add to your `firestore.rules`:

```javascript
// Workflow Templates (public read, admin write)
match /workflow_templates/{templateId} {
  allow read: if isSignedIn();
  allow create, update, delete: if false; // Only via admin SDK
}

// Template Installs (workspace-scoped)
match /template_installs/{installId} {
  allow read: if isSignedIn() && isMemberOf(resource.data.workspaceId);
  allow create: if isSignedIn() && canEdit(request.resource.data.workspaceId);
  allow delete: if isSignedIn() && canAdmin(resource.data.workspaceId);
}
```

**Note:** Templates should be created via Firebase Console or Admin SDK, not client-side.

---

## 🚀 What's Next (Optional Enhancements)

### Phase 2 Features:
- [ ] **Ratings & Reviews** - Let users rate installed templates
- [ ] **My Installed Templates** - Page showing all templates installed in workspace
- [ ] **Template Versions** - Allow updating installed workflows when template is updated
- [ ] **Private Templates** - Let users create and save their own templates
- [ ] **Template Collections** - Group related templates into bundles
- [ ] **Usage Analytics** - Track which templates are most successful
- [ ] **Template Previews** - Show sample outputs or screenshots
- [ ] **AI-Generated Templates** - Let users describe workflow, AI generates template

### Quick Wins:
- Add "Recently Installed" section to dashboard
- Email notification when new templates added
- "Recommended for you" based on workspace activity
- Export/import templates as JSON files

---

## 📁 Files Created

```
app/app/marketplace/
  ├── page.tsx              # Marketplace list view
  └── [templateId]/
      └── page.tsx          # Template detail & install

lib/
  └── marketplaceSeedData.ts  # 8 template definitions

scripts/
  └── seedMarketplace.js    # Browser console seed script
```

---

## ✅ Step 11 Complete

Your marketplace is now live with:
- ✅ Browse & search workflow templates
- ✅ Category filtering
- ✅ Template detail pages with step breakdown
- ✅ One-click install to workspace
- ✅ Permission checks (viewers can't install)
- ✅ Install tracking in Firestore
- ✅ 8 pre-built templates ready to seed
- ✅ Marketplace link in dashboard navigation

**Next:** Seed your templates and test the full install flow!
