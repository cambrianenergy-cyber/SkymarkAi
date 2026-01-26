# Agent Observability System - Implementation Guide

## Overview

This system provides comprehensive audit trails and observability for all AI agent executions. It enables you to **prove that agents are working correctly** by tracking every step of execution, capturing outputs, and providing real-time dashboards.

## 7-Part Framework

### 1. ✅ Audit Trail Infrastructure
**What it captures:**
- Every agent run gets a unique `runId` and `correlationId`
- Trigger source (manual, webhook, workflow, cron)
- Agent type, channel, inputs, and outputs
- Execution status: queued → running → succeeded/failed
- Duration and error details
- Artifact IDs for all outputs

**Database:** `agent_runs` collection in Firestore

**Key fields:**
```typescript
{
  runId: string;                    // Unique run identifier
  correlationId: string;            // Track related runs (workflow steps)
  agentType: string;                // Which agent ran
  channel: string;                  // Where it was triggered (email, crm, scheduler)
  triggerSource: 'manual' | 'webhook' | 'workflow' | 'cron';
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  outputs: {
    artifactIds: string[];          // IDs of created assets
    summary: string;                // What the agent created
  };
  error: { code, message, stack }?; // If it failed
  duration: number;                 // Milliseconds to complete
  startedAt, endedAt, createdAt;
}
```

### 2. ✅ Live Activity UI
**Location:** `/app/agent-activity`

**Features:**
- Shows last 50 agent runs in real-time
- Status indicators (✅ succeeded, ❌ failed, ⏳ running)
- Duration display (how long each agent took)
- Artifact IDs clickable for verification
- Error messages visible inline
- Filter by agent type, channel, or trigger source (future)

**How to use:**
1. Navigate to `/app/agent-activity` in your workspace
2. Watch as agents execute and their runs appear
3. Click on artifact IDs to verify outputs
4. See status in real-time

### 3. ✅ Channel Verification System
**Location:** `/app/channel-verification`

**Purpose:** Test that all integration channels are connected and can receive events

**Supported Channels:**
- Email (SMTP)
- Instagram
- Meta/Facebook
- LinkedIn
- CRM (HubSpot, Salesforce)
- Scheduler (Buffer, Hootsuite)

**How it works:**
1. Click "Test" next to each channel
2. System sends a test event to that channel
3. Verifies credentials are valid
4. Confirms channel can receive events
5. Shows last test timestamp

**What gets verified:**
- API keys are present and valid format
- Token expiration dates
- Channel connectivity
- Webhook endpoints are reachable

### 4. ✅ Health Check System
**Location:** `/app/system-health`
**API Endpoint:** `GET /api/health/{workspaceId}`

**Metrics Displayed:**
- **Success Rate (24h):** % of agents that succeeded
- **Error Rate (24h):** % of agents that failed
- **Avg Latency (24h):** Average execution time
- **Total Runs (24h):** How many agents ran

**Component Status:**
- Orchestrator: Is the agent runner reachable?
- Database: Can we read/write to Firestore?
- Queue: Are webhook events being processed?

**Integration Status:**
- Shows all connected integrations
- Credential validity
- Token expiration warnings
- Last verification timestamp

### 5. ✅ Golden Test Workflow
**Location:** `/app/golden-workflow`

**Purpose:** Automatic self-verification that everything works

**What it does (3-step flow):**
1. **Agent 1 (Lead_Creator):** Creates a test lead in your CRM marked "TEST – DO NOT CONTACT"
2. **Agent 2 (Summarizer):** Generates a summary of the lead
3. **Agent 3 (Scheduler):** Creates a draft social media post (sandbox mode)

**How to run it:**
1. Navigate to `/app/golden-workflow`
2. Click "Run Golden Test"
3. Watch the execution log in real-time
4. See artifact IDs for each step
5. Verify results:
   - Check `/app/agent-activity` to see the 3 agent runs
   - Check CRM for the test lead
   - Check scheduler for the draft post
   - Check `/app/system-health` to see metrics captured

**Why it matters:**
- Proves all three agents work together
- Creates verifiable outputs (lead, summary, post)
- Generates audit trail showing execution
- Can be run anytime to smoke-test the system

### 6. ✅ 4-Key Metrics Tracking
**Real-time metrics updated with every agent run:**

1. **Success Rate:** `successCount / totalRuns * 100`
2. **Error Rate:** `errorCount / totalRuns * 100`
3. **Avg Latency:** `totalDuration / successCount` in milliseconds
4. **Total Runs:** Count of all executions in past 24 hours

**Where to see them:**
- `/app/system-health` dashboard (top 4 cards)
- Updated automatically every 30 seconds
- 24-hour rolling window

**Advanced metrics (available in audit data):**
- Trigger latency (time between trigger and execution)
- Channel delivery success rates
- Failure reasons categorization
- Retry counts

### 7. ✅ Proof of Execution Strategy
**How agents prove they worked:**

#### Event Came In ✓
- Check `agent_runs` for a record with matching `correlationId`
- Look at `triggerSource` (webhook, manual, etc.)
- See `startedAt` timestamp

#### Correct Agent(s) Triggered ✓
- Check `agentType` field matches expected agent
- See `channel` field for where it was triggered
- View `inputs` to verify the data passed to agent

#### Outputs Produced ✓
- Check `status` is 'succeeded' (not 'failed')
- See `outputs.artifactIds` with IDs of created assets
- View `outputs.summary` for what was created
- Verify duration is reasonable (not stuck)

#### Complete Audit Trail ✓
- Every execution creates a Firestore document
- Immutable record with timestamps
- Can trace workflow steps via `correlationId`
- Error messages captured for debugging
- All data linked to workspace for multi-tenancy

---

## Integration Guide: Adding Logging to Your Agents

### Step 1: Import the Logger
```typescript
import { startAgentRun, logAgentRunSuccess, logAgentRunFailure } from '@/lib/agentRunLogger';
```

### Step 2: Start the Run at Agent Execution
```typescript
async function executeAgent(workspaceId, agentConfig, inputs) {
  // Start logging
  const runId = await startAgentRun({
    workspaceId,
    agentType: 'Brand_Voice_Guardian',
    channel: 'email',
    triggerSource: 'webhook',
    triggerDescription: 'Email received from customer',
    inputs,
    correlationId: inputs.correlationId, // Optional: for workflow linking
  });

  try {
    // ... agent logic here ...
    const result = await agent.execute(inputs);

    // Log success
    await logAgentRunSuccess({
      runId,
      workspaceId,
      outputs: {
        artifactIds: [result.contentId],
        summary: `Created branded content: ${result.title}`,
      },
      duration: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    // Log failure
    await logAgentRunFailure({
      runId,
      workspaceId,
      error: {
        code: error.code,
        message: error.message,
        stack: error.stack,
      },
      duration: Date.now() - startTime,
    });
    throw error;
  }
}
```

### Step 3: Important - Pass runId to Next Step
If agents are chained in a workflow:
```typescript
// In workflow execution
const step1RunId = await startAgentRun({...});
const step1Result = await agent1.execute(inputs);
await logAgentRunSuccess({ runId: step1RunId, ... });

// Next step uses correlationId to link runs
const step2RunId = await startAgentRun({
  ...params,
  correlationId: step1RunId, // Links the workflow steps
});
```

---

## Dashboard Walkthrough

### Agent Activity Page (`/app/agent-activity`)
**Shows:** Last 50 agent executions in descending order

**Read this to:**
- Verify agents are actually running
- Check execution times (duration)
- See error messages if agents failed
- Find artifact IDs to verify outputs
- Audit who triggered what and when

### Channel Verification (`/app/channel-verification`)
**Shows:** Integration connection status

**Check this to:**
- Ensure all channels are "connected ✅"
- Verify credentials are valid
- See token expiration warnings
- Debug why agents can't reach external services

### System Health (`/app/system-health`)
**Shows:** Real-time health metrics

**Use this to:**
- Get executive summary (% success, error rate, latency)
- Verify database connectivity
- Check orchestrator status
- See last successful agent run
- Monitor system performance

### Golden Workflow (`/app/golden-workflow`)
**Shows:** Three-agent test execution

**Run this to:**
- Smoke-test the entire system
- Create verifiable outputs
- Generate a complete audit trail
- Prove everything integrates correctly

---

## Example Scenarios

### "Prove an agent received an email and processed it"
1. Find the email in logs
2. Check `/app/agent-activity` for matching `runId`
3. Verify `triggerSource: 'webhook'` and `channel: 'email'`
4. See the artifact ID of the response sent
5. Check duration (should be < 5s)

### "Verify all agents worked in a workflow"
1. Run golden workflow at `/app/golden-workflow`
2. Note the correlation ID from the log
3. Go to `/app/agent-activity`
4. Search for all runs with that correlation ID
5. Should see 3 runs: Lead_Creator → Summarizer → Scheduler
6. Check artifact IDs at each step
7. Verify outputs in CRM and scheduler

### "Debug why an agent failed"
1. Find the run in `/app/agent-activity`
2. Click on the agent run
3. View the error message and stack trace
4. Check `/app/channel-verification` to verify channel is connected
5. Check `/app/system-health` to verify database/orchestrator are healthy
6. Check integration credentials in Settings

---

## FAQ

**Q: How long does audit data stay?**
A: By default, 30 days. You can adjust retention in Firestore settings.

**Q: Can I export the audit trail?**
A: Yes! The data is in Firestore, so you can query it programmatically or use Firestore's export features.

**Q: What if an agent runs but no output is created?**
A: Check the status field. If it's `succeeded_with_no_output`, the agent ran but didn't create anything. Check `error` field if status is `failed`.

**Q: How do I filter agent runs?**
A: Currently showing last 50. To filter, you can:
1. Navigate to specific agent page (each has its own activity)
2. Use browser dev tools to filter JSON
3. Implement filtering UI (in progress)

**Q: My integration test shows as failed. How do I fix it?**
A: Check:
1. Settings → Integrations: Verify API keys are entered
2. Check token hasn't expired
3. Verify webhook URL is correct
4. Test credentials directly in the integration's dashboard

---

## Files Reference

- **Logger:** `/lib/agentRunLogger.ts` - Core logging functions
- **Types:** `/lib/types/agentAudit.ts` - TypeScript interfaces
- **Validator:** `/lib/integrationValidator.ts` - Check integration health
- **Golden Workflow:** `/lib/goldenWorkflow.ts` - Self-test utilities
- **UI Pages:**
  - `/app/app/agent-activity/page.tsx` - Audit trail dashboard
  - `/app/app/system-health/page.tsx` - Health metrics
  - `/app/app/channel-verification/page.tsx` - Integration testing
  - `/app/app/golden-workflow/page.tsx` - Self-verification
- **API Routes:**
  - `/app/api/health/[workspaceId]/route.ts` - Health check endpoint
  - `/app/api/webhooks/test/route.ts` - Channel test endpoint
