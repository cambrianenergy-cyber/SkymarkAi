// OBSERVABILITY_IMPLEMENTATION_CHECKLIST.md

# ✅ Agent Observability - Implementation Checklist

This checklist guides you through adding logging to all your agent code so every execution is auditable.

## Phase 1: Setup ✓ DONE
- [x] Install dependencies (already done)
- [x] Create logging utilities (`lib/agentRunLogger.ts`)
- [x] Define TypeScript interfaces (`lib/types/agentAudit.ts`)
- [x] Create validator (`lib/integrationValidator.ts`)
- [x] Build UI dashboards (Activity, Health, Channels, Golden Workflow)
- [x] Setup API endpoints (health checks, webhook tests)

## Phase 2: Integration Points - DO THIS NOW

### For Each Agent File

For each agent in `lib/agentRunners/` and anywhere agents execute:

#### ☐ Step 1: Import the Logger
```typescript
import { startAgentRun, logAgentRunSuccess, logAgentRunFailure } from '@/lib/agentRunLogger';
```

#### ☐ Step 2: Wrap Agent Execution
Find where the agent runs (e.g., `executeAgent()` or `run()` method):

**Before:**
```typescript
async function executeAgent(workspaceId, inputs) {
  // ... agent logic
  return result;
}
```

**After:**
```typescript
async function executeAgent(workspaceId, inputs) {
  const startTime = Date.now();
  
  // 1️⃣ Start logging FIRST
  const runId = await startAgentRun({
    workspaceId,
    agentType: 'Agent_Name_Here', // e.g., 'Brand_Voice_Guardian'
    channel: inputs.channel || 'api',
    triggerSource: inputs.triggerSource || 'manual',
    triggerDescription: inputs.description,
    inputs,
    correlationId: inputs.correlationId,
  });

  try {
    // 2️⃣ Run agent logic
    // ... agent logic ...
    const result = await agent.execute(inputs);

    // 3️⃣ Log success BEFORE returning
    await logAgentRunSuccess({
      runId,
      workspaceId,
      outputs: {
        artifactIds: [result.id], // IDs of created items
        artifactLinks: result.links, // Optional: direct links
        summary: `Processed ${result.type}: ${result.title}`,
      },
      duration: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    // 4️⃣ Log failure before re-throwing
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

### Agents to Instrument

Update these agent runners with logging:

- [ ] `lib/agentRunners/Algorithm_Hunter.ts`
- [ ] `lib/agentRunners/Brand_Voice_Guardian.ts`
- [ ] `lib/agentRunners/Campaign_Director.ts`
- [ ] `lib/agentRunners/Competitor_Watchdog.ts`
- [ ] `lib/agentRunners/Content_Creator.ts`
- [ ] `lib/agentRunners/Copywriter.ts`
- [ ] `lib/agentRunners/Engagement_Analyst.ts`
- [ ] `lib/agentRunners/Hashtag_SEO.ts`
- [ ] `lib/agentRunners/Scheduling_Master.ts`
- [ ] `lib/agentRunners/Trend_Hunter.ts`

### Workflow Engine

Also instrument workflow execution in:
- [ ] `lib/orchestrator.ts` - Main workflow execution
- [ ] `lib/agentRunner.ts` - Agent run coordinator
- [ ] `app/api/orchestrator/execute/route.ts` - API execution endpoint
- [ ] `app/api/orchestrator/execute-parallel/route.ts` - Parallel execution
- [ ] `app/api/appointments/route.ts` - Scheduled executions

## Phase 3: Testing

### ☐ Test Individual Agents
1. For each agent, verify logs appear in `/app/agent-activity`
2. Check artifact IDs are captured
3. Verify error logging if you intentionally break the agent

### ☐ Test Workflows
1. Create a test workflow with multiple agents
2. Run it and check `/app/agent-activity`
3. See all steps appear with matching `correlationId`
4. Verify outputs from each step

### ☐ Run Golden Workflow
1. Go to `/app/golden-workflow`
2. Click "Run Golden Test"
3. Should see 3 agents execute with audit trail
4. Verify in Agent Activity that 3 runs appear

### ☐ Verify Dashboards
1. **Agent Activity:** Shows your agent runs ✅
2. **System Health:** Metrics update correctly ✅
3. **Golden Workflow:** Completes successfully ✅
4. **Channel Verification:** All channels connected ✅

## Phase 4: Monitoring

### Daily Checks
- [ ] Review `/app/system-health` for any degraded metrics
- [ ] Check error rate in `/app/system-health` (should be <5%)
- [ ] Monitor avg latency (should be stable)
- [ ] Verify `totalRuns24h` shows activity

### Weekly Review
- [ ] Export agent run data from Firestore for analysis
- [ ] Review common failure modes in `/app/agent-activity`
- [ ] Check integration tokens approaching expiration
- [ ] Analyze workflow success rates

### Monthly Optimization
- [ ] Review slowest agent runs (duration field)
- [ ] Check for agents with high error rates
- [ ] Plan optimizations based on latency data
- [ ] Verify artifact IDs are being stored properly

## Special Cases

### Agents That Create Multiple Outputs
```typescript
await logAgentRunSuccess({
  runId,
  workspaceId,
  outputs: {
    artifactIds: [
      lead_id,
      summary_id,
      email_id,
      post_id,
    ],
    summary: 'Created lead, summary, email, and post',
  },
  duration: Date.now() - startTime,
});
```

### Agents in Parallel Execution
```typescript
// For each parallel agent, use same correlationId
const correlationId = `workflow_${Date.now()}`;

await Promise.all([
  executeAgent1(workspaceId, { ...inputs, correlationId }),
  executeAgent2(workspaceId, { ...inputs, correlationId }),
  executeAgent3(workspaceId, { ...inputs, correlationId }),
]);

// All 3 runs will link together via correlationId
```

### Agents with Retries
```typescript
let lastError;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const runId = await startAgentRun({ ...params, retryAttempt: attempt });
    // ... execute ...
    await logAgentRunSuccess({ runId, ... });
    return result;
  } catch (error) {
    lastError = error;
    // Wait before retry
    await new Promise(r => setTimeout(r, delayMs));
  }
}

// Final attempt failed
await logAgentRunFailure({
  runId: finalRunId,
  workspaceId,
  error: lastError,
});
```

### Agents with Conditional Logic
```typescript
const runId = await startAgentRun({ ...params });

if (shouldSkip) {
  // Agent decided not to run
  await logAgentRunSuccessNoOutput({ runId, workspaceId });
  return;
}

// Normal execution path
```

## Verification Queries

After implementing, you can verify logging is working:

### Check logs in Firestore Console
```
Collection: agent_runs
Query: workspaceId == [your-workspace-id]
Order by: createdAt (descending)
Limit: 50
```

### Check specific agent
```
Collection: agent_runs
Filter: agentType == 'Brand_Voice_Guardian'
Order by: createdAt (descending)
Limit: 20
```

### Check workflow runs by correlation
```
Collection: agent_runs
Filter: correlationId == [workflow-id]
Order by: createdAt (ascending)
Shows all steps in order
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Logs not appearing | Verify startAgentRun/logAgentRunSuccess are being called |
| runId is null | Ensure startAgentRun returns value and you're using it |
| Duration is 0 | Use `Date.now() - startTime` not just passing 0 |
| Artifact IDs missing | Check outputs object has artifactIds array populated |
| Error not captured | Ensure error object has message field at minimum |

## Success Criteria

✅ **Complete when:**
- All 10 agents have startAgentRun/logAgentRunSuccess calls
- Workflow engine logs multi-step executions with correlationId
- API endpoints instrument their agent calls
- Agent Activity page shows real runs from your code
- System Health metrics update as agents execute
- Golden Workflow runs without error


✅ **Proven to work when:**
- Run golden workflow
- See 3 agent runs in Agent Activity
- Each shows correct artifact IDs
- System Health shows success rate and latency
- Channel Verification shows all connected
- You can trace execution via correlationId

---

## Troubleshooting & FAQ

**Q: Why don't I see agent runs in the dashboard?**
- Ensure logging is correctly imported and called in the agent runner.
- Check Firestore rules and API permissions.

**Q: Why are some runs missing artifact IDs?**
- Make sure outputs are passed to `logAgentRunSuccess`.
- Check agent logic for correct result formatting.

**Q: How do I debug failed runs?**
- Review error details in `/app/agent-activity`.
- Check stack trace and error code in the log entry.

**Q: Metrics are not updating in System Health?**
- Confirm backend jobs and API endpoints are running.
- Check for errors in the orchestrator logs.

**Q: How do I verify integration connectivity?**
- Use `/app/channel-verification` and run the test for each channel.

For more help, see the full documentation in `AGENT_OBSERVABILITY.md` or contact support.

---

**Once complete, you have full observability and auditability for all agent execution.**
