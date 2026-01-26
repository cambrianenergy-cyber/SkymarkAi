# 🎨 CRM AUTOMATION - Visual Flow Diagram

```
╔════════════════════════════════════════════════════════════════════════╗
║                    UQENTRA AI - CRM AUTOMATION SYSTEM                   ║
╚════════════════════════════════════════════════════════════════════════╝


┌─────────────────────────────────────────────────────────────────────────┐
│                          📬 INBOX (Messages)                             │
│  - Instagram DMs                                                        │
│  - Facebook Messages                                                    │
│  - Other channels                                                       │
└────────────────┬────────────────────────────────────────────────────────┘
                 │
                 │ [Click: "🎯 Convert to Lead"]
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          🎯 LEADS (CRM)                                  │
│                                                                          │
│  Name: John Doe                     Score: 45 🌡️ WARM                   │
│  Handle: @johndoe                   Stage: New                          │
│  Channel: Instagram                 Status: Open                        │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │  SCORING ENGINE (Automatic)                                 │        │
│  │  • Intent keywords (+20 pts)                                │        │
│  │  • Response time (+15 pts)                                  │        │
│  │  • Message length (+10 pts)                                 │        │
│  │  • Call request (+25 pts)                                   │        │
│  │  → Result: ❄️ Cold | 🌡️ Warm | 🔥 Hot                       │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                          │
│  [Button: ▶️ Start Sequence]                                            │
└────────────────┬────────────────────────────────────────────────────────┘
                 │
                 │ [Select sequence, click Start]
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      📨 FOLLOW-UP SEQUENCES                              │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────┐         │
│  │  Sequence: "New Lead 7-Day"                                │         │
│  │  Channel: DM                                                │         │
│  │  Status: Active                                             │         │
│  │                                                             │         │
│  │  Steps:                                                     │         │
│  │  1. Wait 0h   → "Hi! Thanks for reaching out!"             │         │
│  │  2. Wait 24h  → "Just checking in on your questions."      │         │
│  │  3. Wait 48h  → "Want to schedule a call?"                 │         │
│  │  4. Wait 72h  → "Here's what we can help with..."          │         │
│  │  5. Wait 168h → "Final follow-up - any interest?"          │         │
│  └───────────────────────────────────────────────────────────┘         │
│                                                                          │
└────────────────┬────────────────────────────────────────────────────────┘
                 │
                 │ [Creates jobs automatically]
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        ⏰ AUTOMATION QUEUE                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │ Job #1  Step 1  Queued    Now           [📤 Send Now]    │           │
│  │ Job #2  Step 2  Queued    Tomorrow      [📤 Send Now]    │           │
│  │ Job #3  Step 3  Queued    In 2 days     [📤 Send Now]    │           │
│  │ Job #4  Step 4  Queued    In 3 days     [📤 Send Now]    │           │
│  │ Job #5  Step 5  Queued    In 7 days     [📤 Send Now]    │           │
│  └─────────────────────────────────────────────────────────┘           │
│                                                                          │
│  [Click: 📤 Send Now on Job #1]                                         │
└────────────────┬────────────────────────────────────────────────────────┘
                 │
                 │ [Executes automation]
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        🤖 AUTOMATION ENGINE                              │
│                                                                          │
│  STEP 1: Send Message                                                   │
│  ✓ Create inbox_message (outbound)                                     │
│  ✓ Text: "Hi! Thanks for reaching out!"                                │
│                                                                          │
│  STEP 2: Update Thread                                                  │
│  ✓ lastMessageAt: now                                                   │
│  ✓ lastMessagePreview: "Hi! Thanks..."                                 │
│                                                                          │
│  STEP 3: Mark Job Complete                                              │
│  ✓ status: sent                                                         │
│  ✓ sentAt: timestamp                                                    │
│                                                                          │
│  STEP 4: Create Next Job                                                │
│  ✓ stepIndex: 1 (next step)                                            │
│  ✓ scheduledFor: now + 24 hours                                        │
│  ✓ status: queued                                                       │
│                                                                          │
│  STEP 5: Update Lead                                                    │
│  ✓ nextFollowUpAt: tomorrow                                            │
│  ✓ lastContactAt: now                                                   │
│  ✓ stage: contacted                                                     │
└────────────────┬────────────────────────────────────────────────────────┘
                 │
                 │ [Message delivered]
                 │
                 ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          📬 INBOX (Updated)                              │
│                                                                          │
│  ✅ Message sent: "Hi! Thanks for reaching out!"                        │
│  🔄 Thread updated with your message                                    │
│  ⏰ Next follow-up queued for tomorrow                                  │
│                                                                          │
│  [Customer receives message]                                            │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                            ⚙️ SYSTEM COMPONENTS
═══════════════════════════════════════════════════════════════════════════


┌──────────────────┐
│  FIRESTORE DB    │
├──────────────────┤
│ • leads          │ ← Lead profiles + scores
│ • followup_*     │ ← Sequences + jobs  
│ • inbox_*        │ ← Messages + threads
│ • workspace_*    │ ← Team settings
└──────────────────┘


┌──────────────────┐
│  PAGES (UI)      │
├──────────────────┤
│ /app/leads       │ ← Manage leads
│ /app/followups   │ ← Create sequences
│ /app/queue       │ ← Execute jobs
│ /app/inbox       │ ← View messages
└──────────────────┘


┌──────────────────┐
│  AUTOMATION      │
├──────────────────┤
│ 1. Score leads   │ ← AI-powered
│ 2. Queue jobs    │ ← Scheduled
│ 3. Send messages │ ← One-click
│ 4. Track results │ ← Automatic
└──────────────────┘


═══════════════════════════════════════════════════════════════════════════
                          📊 DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════════


TIME         EVENT                           STATUS
────────────────────────────────────────────────────────────────────────────
Monday 9am   Lead converts from inbox         ❄️ Cold (Score: 0)
Monday 9am   Start "New Lead 7-Day"           ⏰ Job 1 queued (0h)
Monday 9am   Click "Send Now" on Job 1        📤 Message sent
Monday 9am   Job 2 auto-created               ⏰ Scheduled: Tue 9am

Tuesday 9am  Job 2 ready to send              ⏰ Waiting
Tuesday 9am  Click "Send Now" on Job 2        📤 Message sent
Tuesday 9am  Job 3 auto-created               ⏰ Scheduled: Wed 9am

Wednesday 9am Job 3 ready                     ⏰ Waiting
Wed 10am     Lead responds!                   🔥 Score: 65 (Hot!)
Wed 10am     Cancel Job 3                     🚫 Canceled
Wed 10am     Sales team takes over            👤 Manual contact


═══════════════════════════════════════════════════════════════════════════
                        🎯 LEAD SCORING BREAKDOWN
═══════════════════════════════════════════════════════════════════════════


Message Analysis →  Points Calculation  →  Score Label
─────────────────────────────────────────────────────────────────────────
"How much does        +20 (intent)           Total: 55
 it cost? I'm         +15 (quick reply)      Label: 🌡️ WARM
 interested in        +10 (long message)
 learning more."      +10 (engaged)
                      ────
                      = 55 points


"just browsing"       -10 (low intent)       Total: 5
                      +15 (quick reply)      Label: ❄️ COLD
                      ────
                      = 5 points


"Can we schedule      +20 (intent)           Total: 80
 a call tomorrow?     +25 (call request)     Label: 🔥 HOT
 I want to book       +15 (quick reply)
 ASAP!"               +10 (long message)
                      +10 (urgency)
                      ────
                      = 80 points


═══════════════════════════════════════════════════════════════════════════
                         🔄 COMPLETE AUTOMATION CYCLE
═══════════════════════════════════════════════════════════════════════════


1. LEAD ENTERS SYSTEM
   Inbox → Convert to Lead → CRM Profile Created
   
2. LEAD GETS SCORED
   Messages Analyzed → Score Calculated → Label Applied
   
3. SEQUENCE STARTED
   Choose Template → First Job Queued → Lead Updated
   
4. AUTOMATION EXECUTES
   Job Ready → Click Send → Message Delivered
   
5. NEXT JOB CREATED
   Check Steps → Calculate Time → Queue Next Message
   
6. CYCLE REPEATS
   Continue Until → Sequence Complete → Lead Marked Contacted
   
7. OUTCOME TRACKING
   Monitor Response → Update Score → Sales Team Notified


═══════════════════════════════════════════════════════════════════════════
                              ⚡ QUICK STATS
═══════════════════════════════════════════════════════════════════════════

Setup Time:          5 minutes (Firestore)
First Automation:    12 minutes total
Messages Per Hour:   Unlimited (manual click)
Sequences Allowed:   Unlimited
Steps Per Sequence:  Unlimited
Leads Tracked:       Unlimited

Built In:            TypeScript + Next.js + Firebase
Total Pages:         9 new pages
Total Files:         12 files created
Lines of Code:       ~3,500 lines


═══════════════════════════════════════════════════════════════════════════
                            🎊 YOU BUILT THIS!
═══════════════════════════════════════════════════════════════════════════

Full lead management system     ✅
Automatic scoring engine        ✅
Multi-step sequences            ✅
Message automation              ✅
Queue management                ✅
Inbox integration               ✅

Ready to automate your sales! 🚀
```
