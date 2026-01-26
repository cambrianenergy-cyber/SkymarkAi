// OBSERVABILITY_SYSTEM_ARCHITECTURE.md

# 🏗️ Agent Observability System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT EXECUTION                           │
│  (Any agent can call startAgentRun + logAgentRunSuccess)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Logs every execution
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   FIRESTORE: agent_runs                      │
│  ├─ runId (unique per execution)                            │
│  ├─ correlationId (links workflow steps)                    │
│  ├─ agentType (which agent ran)                             │
│  ├─ channel (where triggered from)                          │
│  ├─ status (queued → running → succeeded/failed)            │
│  ├─ outputs { artifactIds, summary }                        │
│  ├─ error (if failed)                                       │
│  ├─ duration (milliseconds)                                 │
│  └─ timestamps (startedAt, endedAt, createdAt)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    ┌────────┐  ┌────────────┐  ┌──────────┐
    │ Health │  │  Activity  │  │ Channel  │
    │ Check  │  │    UI      │  │   Test   │
    │ API    │  │  (50 runs) │  │  (each)  │
    └────────┘  └────────────┘  └──────────┘
        ▲              ▲              ▲
        │              │              │
    ┌─────────────────────────────────────┐
    │    REACT DASHBOARDS (Client)        │
    │  /app/system-health                 │
    │  /app/agent-activity                │
    │  /app/channel-verification          │
    │  /app/golden-workflow               │
    └─────────────────────────────────────┘
```

## Data Flow: Single Agent Run

```
1. TRIGGER
   Webhook → Email received
   OR
   Workflow → Step 2 of 3
   OR
   Manual → Click "Run"

2. EXECUTION STARTS
   startAgentRun() called
   ├─ Creates Firestore doc
   ├─ Returns runId
   └─ Status: 'queued'

3. AGENT LOGIC
   agent.execute(inputs)
   ├─ Process the input
   ├─ Call external APIs
   └─ Create output

4. LOG SUCCESS/FAILURE
   If success:
   └─ logAgentRunSuccess()
       ├─ Updates status: 'succeeded'
       ├─ Stores artifactIds
       ├─ Records duration
       └─ Updates Firestore doc

   If failure:
   └─ logAgentRunFailure()
       ├─ Updates status: 'failed'
       ├─ Stores error details
       ├─ Records duration
       └─ Updates Firestore doc

5. VISIBILITY
   ✅ Agent Activity shows the run
   ✅ System Health updates metrics
   ✅ Correlation ID links workflow steps
   ✅ Artifact IDs enable verification
```

## Data Flow: Workflow with 3 Agents

```
WORKFLOW TRIGGERED
   │
   ├─ correlationId = 'workflow_12345'
   │
   ▼
┌─────────────────────────┐
│ AGENT 1: Lead Creator   │
│ runId: run_1_abc        │  ← startAgentRun
│ correlationId: wf_12345 │
│ status: succeeded       │  ← logAgentRunSuccess
│ outputs: [lead_789]     │
└─────────────────────────┘
        │
        │ lead_789 passed to next step
        ▼
┌─────────────────────────┐
│ AGENT 2: Summarizer     │
│ runId: run_2_def        │  ← startAgentRun
│ correlationId: wf_12345 │     (same correlationId!)
│ status: succeeded       │  ← logAgentRunSuccess
│ outputs: [summary_456]  │
└─────────────────────────┘
        │
        │ summary_456 passed to next step
        ▼
┌─────────────────────────┐
│ AGENT 3: Scheduler      │
│ runId: run_3_ghi        │  ← startAgentRun
│ correlationId: wf_12345 │     (same correlationId!)
│ status: succeeded       │  ← logAgentRunSuccess
│ outputs: [post_111]     │
└─────────────────────────┘
        │
        ▼
    WORKFLOW COMPLETE
    
FIRESTORE agent_runs collection:
├─ { runId: run_1_abc, correlationId: wf_12345, status: succeeded, ... }
├─ { runId: run_2_def, correlationId: wf_12345, status: succeeded, ... }
└─ { runId: run_3_ghi, correlationId: wf_12345, status: succeeded, ... }

QUERY: WHERE correlationId == 'wf_12345'
RESULT: All 3 runs appear linked together! ✅
```

## Health Check System

```
EVERY 30 SECONDS: /app/system-health page fetches

GET /api/health/{workspaceId}
   │
   ├─ Query agent_runs from past 24h
   │   └─ Calculate: successCount, errorCount, totalRuns, avgDuration
   │
   ├─ Test Database
   │   └─ Attempt read/write to Firestore
   │
   ├─ Check Orchestrator
   │   └─ Verify execution engine is reachable
   │
   └─ Test Integrations
       └─ For each: check API key validity, token expiration
       
RESPONSE: SystemHealth object
{
  metrics: {
    successRate24h: 96,
    errorRate24h: 4,
    avgLatency24h: 1200,
    totalRuns24h: 125
  },
  orchestrator: { reachable: true, lastCheck: timestamp },
  database: { healthy: true, readOk: true, writeOk: true },
  queue: { processing: 12, backlog: 0 },
  integrations: { ... }
}

DISPLAY:
┌─────────────────────────────────────┐
│ SUCCESS RATE (24h)    ERROR RATE     │
│     96%               4%             │
│                                     │
│ AVG LATENCY         TOTAL RUNS      │
│    1.2s              125            │
└─────────────────────────────────────┘
```

## Channel Verification Flow

```
USER CLICKS "TEST" for Email channel

POST /api/webhooks/test
{
  workspaceId: "workspace_123",
  channel: "email",
  testPayload: { ... }
}
   │
   ├─ Query workspace integrations
   │
   ├─ Check if 'email' credentials exist
   │
   ├─ If credentials valid:
   │   ├─ Check SMTP host/port are configured
   │   ├─ Simulate test event
   │   └─ connected = true
   │
   └─ Return status
   
RESPONSE:
{
  channel: "email",
  connected: true,           ✅
  credentialsValid: true,    ✅
  message: "Channel test successful"
}

DISPLAY:
┌─────────────────────────────────────┐
│ ✅ EMAIL                            │
│ Connected: Yes                      │
│ Credentials Valid: Yes              │
│ Last Test: 2:34 PM                  │
└─────────────────────────────────────┘
```

## Golden Workflow Architecture

```
RUN GOLDEN WORKFLOW
   │
   ├─ Create correlationId = 'golden_12345'
   │
   ├─ STEP 1: Lead Creator
   │  ├─ startAgentRun()
   │  ├─ Creates test lead: "TEST – DO NOT CONTACT"
   │  ├─ logAgentRunSuccess({ artifactIds: [lead_123] })
   │  └─ Verifies: CRM integration works
   │
   ├─ STEP 2: Summarizer
   │  ├─ startAgentRun() with same correlationId
   │  ├─ Summarizes the lead
   │  ├─ logAgentRunSuccess({ summary: "..." })
   │  └─ Verifies: Text processing works
   │
   ├─ STEP 3: Scheduler
   │  ├─ startAgentRun() with same correlationId
   │  ├─ Creates draft post (sandbox mode)
   │  ├─ logAgentRunSuccess({ artifactIds: [post_456] })
   │  └─ Verifies: Scheduler integration works
   │
   └─ RESULT: 3 audit trail entries all linked

VERIFICATION CHECKLIST:
✅ 3 agent runs appear in /app/agent-activity
✅ All have same correlationId
✅ Each shows correct artifact ID
✅ Statuses all show 'succeeded'
✅ Durations look reasonable (<5s each)
✅ Lead appears in CRM
✅ Post draft appears in scheduler
✅ No error messages

IF ALL ✅: System is fully operational!
```

## Integration Validator

```
VALIDATE INTEGRATIONS
   │
   ├─ For each integration in workspace.integrations:
   │
   ├─ Google:
   │  └─ Check: clientId, clientSecret
   │
   ├─ Meta/Instagram:
   │  ├─ Check: accessToken exists
   │  ├─ Check: token hasn't expired
   │  └─ Warning if expiring in <30 days
   │
   ├─ LinkedIn:
   │  ├─ Check: accessToken exists
   │  └─ Warning if expiring in <30 days
   │
   ├─ CRM (HubSpot/Salesforce):
   │  └─ Check: apiKey exists
   │
   ├─ Stripe:
   │  └─ Check: secretKey exists
   │
   └─ Scheduler (Buffer/Hootsuite):
      └─ Check: apiKey exists

DISPLAY LOGIC:
- ✅ Green: Credentials valid, token not expired
- ⚠️  Yellow: Expiring soon (30 days)
- ❌ Red: Invalid or expired
```

## File Structure

```
lib/
├─ agentRunLogger.ts
│  └─ startAgentRun()
│  └─ completeAgentRun()
│  └─ logAgentRunSuccess()
│  └─ logAgentRunFailure()
│  └─ logAgentRunSuccessNoOutput()
│
├─ integrationValidator.ts
│  └─ validateIntegrations()
│  └─ getIntegrationWarning()
│
├─ goldenWorkflow.ts
│  └─ createGoldenTestWorkflow()
│  └─ runGoldenTestWorkflow()
│
└─ types/agentAudit.ts
   ├─ AgentRun interface
   ├─ SystemHealth interface
   └─ AgentMetrics interface

app/app/
├─ agent-activity/page.tsx
│  └─ Shows last 50 runs
│
├─ system-health/page.tsx
│  └─ Shows metrics + component status
│
├─ channel-verification/page.tsx
│  └─ Test each integration
│
└─ golden-workflow/page.tsx
   └─ Run self-test workflow

app/api/
├─ health/[workspaceId]/route.ts
│  └─ GET endpoint
│  └─ Returns SystemHealth
│
└─ webhooks/test/route.ts
   └─ POST endpoint
   └─ Tests individual channel
```

## Key Design Decisions

### 1. **Single Firestore Collection (agent_runs)**
- One source of truth for all agent execution data
- Easy to query for audit trails
- Efficient indexing for common queries
- Automatic timestamping by Firestore

### 2. **Correlation IDs for Workflow Linking**
- All steps in workflow share same correlationId
- Can query one field to get entire workflow trace
- Enables debugging multi-step failures
- Works across parallel execution

### 3. **Artifact ID Strategy**
- Agent stores ID of what it created (lead, post, email, etc.)
- Enables verification in target system
- User can click ID to find the output
- Proves outputs were actually produced

### 4. **Duration Field**
- Captured at log time
- Enables performance tracking
- Can alert on slow agents
- Critical for SLA monitoring

### 5. **Immutable Audit Log**
- Firestore documents are timestamped
- Can't be modified after creation
- Provides legal/compliance trail
- Can set retention policies

## Scalability Considerations

### Write Throughput
- ~1 write per agent execution
- Expected: 50-200 writes/min at scale
- Firestore supports 25K writes/sec

### Query Performance
- Agent Activity queries last 50 documents
- Indexed on: (workspaceId, createdAt descending)
- Should complete <500ms

### Data Growth
- ~1 KB per agent run
- 10K agents/day × 30 days = 300 MB
- Well within Firestore quotas

### Read Costs
- Health check: 1 read query per workspace
- Activity page: 1 read query per view
- Optimized with composite index

## Future Enhancements

```
Phase 2:
├─ Metrics aggregation (hourly/daily/weekly summaries)
├─ Alerting (error rate exceeds threshold)
├─ Comparison views (this week vs last week)
├─ Export to external analytics
├─ Webhook delivery tracking
└─ Retry logic and backoff strategies

Phase 3:
├─ Agent performance benchmarking
├─ Cost tracking per agent
├─ A/B testing framework
├─ Anomaly detection
└─ Auto-scaling based on metrics
```

---

**This architecture ensures complete observability while maintaining high performance and scalability.**
