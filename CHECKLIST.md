# ✅ FINAL SETUP CHECKLIST

## 🎯 **YOUR MISSION: Get CRM Running in 15 Minutes**

---

## **STEP 1: Firebase Console Setup** (5 minutes)

### Open Firebase:
→ https://console.firebase.google.com
→ Select your project
→ Click "Firestore Database" → "Data"

### Create Collection #1: `leads`
```
Collection ID: leads
Document ID: [Auto-ID]

Fields:
✓ workspaceId: string → "NtabEfcWZHdcKSsWi4fN" (or your workspace ID)
✓ threadId: string → "" (empty)
✓ fullName: string → "John Doe"
✓ handle: string → "@johndoe"
✓ channel: string → "instagram"
✓ status: string → "open"
✓ stage: string → "new"
✓ score: number → 0
✓ scoreLabel: string → "cold"
✓ assignedToUid: string → [Your Firebase Auth user ID]
✓ notes: string → "Test lead"
✓ createdAt: timestamp → [Click "Add timestamp"]
✓ updatedAt: timestamp → [Click "Add timestamp"]

[Save]
```

### Create Collection #2: `followup_sequences`
```
Collection ID: followup_sequences
Document ID: [Auto-ID]

Fields:
✓ workspaceId: string → "NtabEfcWZHdcKSsWi4fN"
✓ name: string → "Test Sequence"
✓ status: string → "active"
✓ channel: string → "dm"
✓ steps: array → [] (empty array)
✓ createdAt: timestamp → [Add timestamp]
✓ updatedAt: timestamp → [Add timestamp]

[Save]
```

### Create Collection #3: `followup_jobs`
```
Collection ID: followup_jobs
Document ID: [Auto-ID]

Fields:
✓ workspaceId: string → "NtabEfcWZHdcKSsWi4fN"
✓ leadId: string → [Copy lead ID from Collection #1]
✓ threadId: string → "" (empty for now)
✓ sequenceId: string → [Copy sequence ID from Collection #2]
✓ stepIndex: number → 0
✓ scheduledFor: timestamp → [Set to NOW or future]
✓ status: string → "queued"
✓ messageDraft: string → "Hey! Just following up."
✓ createdAt: timestamp → [Add timestamp]
✓ updatedAt: timestamp → [Add timestamp]

[Save]
```

**✅ Collections Created!**

---

## **STEP 2: Verify Setup** (3 minutes)

### In Terminal:
```bash
npm run dev
```

### In Browser:
→ Go to http://localhost:3000/app

### Test Navigation:
- [ ] Click "🎯 Leads" - See test lead
- [ ] Click "📨 Follow-ups" - See test sequence  
- [ ] Click "⏰ Queue" - See test job
- [ ] Click "📬 Inbox" - Opens inbox

**✅ App is running!**

---

## **STEP 3: Test Automation** (7 minutes)

### Test #1: View Lead
1. Click "🎯 Leads"
2. Click "Open" on test lead
3. Verify all fields display
4. Try changing Stage/Status dropdowns

### Test #2: Create Sequence
1. Click "📨 Follow-ups"
2. Click "+ New Sequence"
3. Name: "My First Sequence"
4. Add 3 steps:
   - Step 1: Wait 0 hours, "Hi! Thanks for reaching out."
   - Step 2: Wait 24 hours, "Just checking in!"
   - Step 3: Wait 48 hours, "Any questions?"
5. Click "Create Sequence"

### Test #3: Start Sequence
1. Go to "🎯 Leads"
2. Open a lead
3. Click "▶️ Start Sequence"
4. Select your new sequence
5. Click "Start Sequence"
6. Should see: "✅ Sequence started!"

### Test #4: Execute Job
1. Click "⏰ Queue"
2. Find the queued job
3. Click "📤 Send Now"
4. Wait for success message
5. Verify:
   - Job shows "✅ Sent"
   - Next job appears in queue
   - Lead's "Next Follow-up" updated

### Test #5: Inbox Integration (if you have inbox threads)
1. Go to "📬 Inbox"
2. Click a conversation
3. Click "🎯 Convert to Lead"
4. Opens new lead detail page
5. Start a sequence
6. Execute from queue

**✅ Automation Working!**

---

## **TROUBLESHOOTING**

### ❌ "No workspace found"
**Fix:** Check workspace ID in dashboard URL
- Should be in: `/app?workspace=YOUR_ID`
- Use that ID in Firestore collections

### ❌ "Missing Firestore index"
**Fix:** Click the link in the error message
- Firebase auto-generates the index
- Wait 2-5 minutes
- Refresh page

### ❌ "Lead not found"
**Fix:** Copy exact lead ID from Firestore
- Go to Firestore → leads collection
- Copy the document ID
- Use it exactly

### ❌ "Job won't send"
**Fix:** Check required fields
- `threadId` must be valid (or empty for testing)
- `messageDraft` must exist
- `status` must be "queued"

### ❌ "Sequence won't start"
**Fix:** Verify sequence settings
- Status must be "active"
- Steps array must have items
- Lead must have workspace ID

---

## **NEXT ACTIONS**

### 🎯 **Immediate (Required)**
- [x] Create Firestore collections
- [x] Test app loads
- [x] Verify navigation works
- [ ] Create real sequence
- [ ] Test on real inbox thread

### 📊 **Short Term (This Week)**
- [ ] Import actual leads
- [ ] Create 3-5 sequences for different scenarios
- [ ] Set up sequences for hot/warm/cold leads
- [ ] Train team on system

### 🚀 **Long Term (Optional)**
- [ ] Add Cloud Function for auto-execution
- [ ] Build analytics dashboard
- [ ] Create sequence templates
- [ ] Import leads from CSV

---

## **SUCCESS CRITERIA**

You've successfully set up the CRM when:

✅ All 3 Firestore collections exist
✅ Dashboard shows leads, sequences, queue
✅ Can create new sequences via UI
✅ Can start sequence on lead
✅ Can execute jobs from queue
✅ Messages appear in inbox
✅ Next jobs auto-create

---

## **🎉 YOU'RE DONE!**

**The system is fully functional and ready to use!**

### What You Built:
- Complete lead management system
- Automatic lead scoring
- Multi-step follow-up automation
- Message queue with execution
- Inbox integration

### What You Can Do:
- Track unlimited leads
- Create unlimited sequences
- Automate follow-up messages
- Score leads automatically
- Manage full sales pipeline

### Time to First Automation:
- Setup: 5 minutes
- Testing: 7 minutes
- **Total: 12 minutes** ⚡

---

## **QUICK REFERENCE**

### File Structure:
```
app/app/
├── leads/ → Lead management
├── followups/ → Sequences
├── queue/ → Job execution
└── inbox/ → Convert to leads
```

### Key URLs:
- Dashboard: `/app`
- Leads: `/app/leads`
- Follow-ups: `/app/followups`
- Queue: `/app/queue`
- Inbox: `/app/inbox`

### Documentation:
- `CRM_SETUP_COMPLETE.md` - Full guide
- `FIRESTORE_SETUP_GUIDE.md` - Database setup
- `README_AUTOMATION.md` - System overview
- `CHECKLIST.md` - This file

---

## **🚀 START AUTOMATING!**

1. Create your first real sequence
2. Convert an inbox thread to lead
3. Start the sequence
4. Click "Send Now" in queue
5. Watch the automation work!

**You've got this! 💪**
