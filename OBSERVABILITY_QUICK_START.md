// OBSERVABILITY_QUICK_START.md

# 🎯 Agent Observability - Quick Start Guide

## 30-Second Overview
You now have a complete system to **prove your AI agents are working correctly**. Every agent run is logged, auditable, and verifiable.

## 5-Step Verification Process

### 1️⃣ Verify Integrations Are Connected
```
👉 Go to: /app/channel-verification
✓ Click "Test" next to each channel
✓ Should see ✅ connected status for all
✓ Check that credentials haven't expired
```

### 2️⃣ Run the Golden Test Workflow
```
👉 Go to: /app/golden-workflow
✓ Click "Run Golden Test"
✓ Watch 3 agents execute in sequence:
   - Create a test lead
   - Summarize it
   - Schedule a draft post
✓ See artifact IDs for each step
```

### 3️⃣ Check the Audit Trail
```
👉 Go to: /app/agent-activity
✓ Should see 3 new agent runs from golden workflow
✓ Each shows: agent type, status ✅, duration, artifact ID
✓ Click artifact IDs to verify outputs
```

### 4️⃣ Monitor System Health
```
👉 Go to: /app/system-health
✓ View 4 key metrics: success rate, error rate, latency, total runs
✓ Check component status: Orchestrator, Database, Queue
✓ Verify all integrations show as valid
```

### 5️⃣ Start Using It for Your Agents
```
In your agent execution code:

import { startAgentRun, logAgentRunSuccess, logAgentRunFailure } from '@/lib/agentRunLogger';

async function runMyAgent(workspaceId, inputs) {
  const runId = await startAgentRun({
    workspaceId,
    agentType: 'My_Agent',
    channel: 'email',
    triggerSource: 'webhook',
    inputs,
  });

  try {
    const result = await agent.execute(inputs);
    await logAgentRunSuccess({
      runId,
      workspaceId,
      outputs: { artifactIds: [result.id], summary: 'Created...' },
      duration: 1234,
    });
  } catch (error) {
    await logAgentRunFailure({
      runId,
      workspaceId,
      error: { message: error.message },
      duration: 1234,
    });
  }
}
```

## Dashboard Navigation Map

```
🏠 Workspace Home
├─ 🎯 Agent Activity (/app/agent-activity)
│  └─ See all agent executions, artifact IDs, errors
├─ 💓 System Health (/app/system-health)
│  └─ View metrics, component status, integrations
├─ 🔗 Channel Verification (/app/channel-verification)
│  └─ Test and verify integrations
└─ 🏆 Golden Workflow (/app/golden-workflow)
   └─ Run self-test to verify everything works
```

## Key Metrics at a Glance

| Metric | What It Means | Target |
|--------|--------------|--------|
| **Success Rate** | % of agents that completed successfully | 95%+ |
| **Error Rate** | % of agents that failed | <5% |
| **Avg Latency** | Average time per agent run | <2s |
| **Total Runs** | Executions in past 24h | Trending up |

## What Gets Captured

When an agent runs, you'll see:
- ✅ **Status:** queued, running, succeeded, or failed
- 🔗 **Artifact IDs:** IDs of everything created
- ⏱️ **Duration:** How long the agent took
- 📋 **Inputs/Outputs:** What was passed in and produced
- 🎯 **Trigger:** How it was triggered (webhook, workflow, manual)
- 🐛 **Errors:** Full error message if it failed
- 📍 **Trace:** Correlation IDs to track workflow steps

## Common Verification Tasks

### "Did agent X process the input?"
1. Find the run in Agent Activity
2. Check triggerSource and inputs field
3. Verify startedAt timestamp

### "What did agent X output?"
1. Open the run in Agent Activity
2. Check outputs.artifactIds
3. Click ID to find the created asset
4. Verify in the target system (CRM, scheduler, etc.)

### "Why did agent X fail?"
1. Open the run in Agent Activity
2. Check error.message field
3. Verify channel is connected in Channel Verification
4. Check System Health for component failures

### "Are all integrations working?"
1. Go to Channel Verification
2. Click Test next to each channel
3. All should show ✅ Connected
4. Check expiration warnings for tokens

## Real-World Example Flow

```
Customer sends email → Email agent triggered
  ↓
Logs startAgentRun { channel: 'email', inputs: { ...email } }
  ↓
Processes email, creates CRM lead
  ↓
Logs logAgentRunSuccess { outputs: { artifactIds: ['lead_123'] } }
  ↓
You verify in Agent Activity: ✅ succeeded, duration: 1.2s
  ↓
Click artifact ID 'lead_123' → Find the lead in CRM
  ↓
System Health shows: success rate 98%, avg latency 1.3s
```

## File Structure

```
lib/
├─ agentRunLogger.ts              ← Import and use these
├─ integrationValidator.ts        
├─ goldenWorkflow.ts              
└─ types/agentAudit.ts            ← Type definitions

app/app/
├─ agent-activity/page.tsx        ← 4 main dashboards
├─ system-health/page.tsx
├─ channel-verification/page.tsx
└─ golden-workflow/page.tsx

app/api/
├─ health/[workspaceId]/route.ts ← Backend endpoints
└─ webhooks/test/route.ts
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Golden workflow failed | Check Channel Verification first, ensure all channels ✅ |
| Agent Activity is empty | Verify agent code calls startAgentRun/logAgentRunSuccess |
| System Health shows red | Check component status, verify Firestore connectivity |
| Integration test failed | Check Settings → Integrations for valid API keys |

## Next Steps

1. ✅ Verify all channels are connected (Channel Verification)
2. ✅ Run golden test workflow (Golden Workflow page)
3. ✅ Check audit trail populated (Agent Activity page)
4. ✅ Review system metrics (System Health page)
5. 🚀 Add logging to your agent code (see 5-Step Verification)
6. 🔄 Watch your agents populate audit trail in real-time
7. 📊 Use dashboards to monitor and debug

---

**You now have complete observability. Your agents are provably working!**
