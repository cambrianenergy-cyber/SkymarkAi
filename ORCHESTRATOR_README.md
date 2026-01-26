# Uqentra AI - Workflow Orchestration System

## Overview

The workflow orchestration system enables automatic execution of multi-step workflows using AI agents. Workflows are composed of ordered steps, where each step is executed by a specific agent type.

## Architecture

### Components

1. **Agent Runners** (`lib/agentRunners/`)
   - Individual agent implementations
   - Each agent type has its own runner file
   - Mock implementations that simulate AI processing

2. **Agent Runner Interface** (`lib/agentRunner.ts`)
   - Defines the contract for all agent runners
   - Input: `workspaceId`, `runId`, `step` (with instruction)
   - Output: `success`, `output`, optional `error`

3. **Agent Runner Registry** (`lib/agentRunnerRegistry.ts`)
   - Maps agent types to their runner implementations
   - Provides lookup function: `getAgentRunner(agentType)`

4. **Orchestrator** (`lib/orchestrator.ts`)
   - Core execution engine
   - Manages workflow run lifecycle
   - Updates Firestore in real-time
   - Two main methods:
     - `executeNextStep(runId)` - Execute one step
     - `executeAllSteps(runId)` - Execute all remaining steps

### Data Flow

```
1. User clicks "Run Workflow" on workflow detail page
2. System creates workflow_run document in Firestore with status="queued"
3. Navigation to run detail page + auto-execution starts
4. Orchestrator.executeAllSteps(runId) begins:
   a. Find next pending step
   b. Update step status to "running"
   c. Get appropriate agent runner
   d. Execute agent runner with step input
   e. Update step with output/error
   f. Update run progress
   g. Repeat until all steps complete or failure
5. Real-time updates via onSnapshot show progress live
```

## Agent Types

The system includes 9 agent types:

1. **Campaign_Director** - Creates campaign strategies and task assignments
2. **Trend_Hunter** - Identifies trending topics across platforms
3. **Competitor_Watchdog** - Monitors competitor activities
4. **Copywriter** - Generates copy variations with emotional appeals
5. **Content_Creator** - Creates posts for different platforms
6. **Hashtag_SEO** - Generates hashtag sets and SEO keywords
7. **Brand_Voice_Guardian** - Reviews content for brand alignment
8. **Scheduling_Master** - Creates optimal posting schedules
9. **Engagement_Analyst** - Analyzes performance metrics

## Usage

### Creating a Workflow

1. Navigate to `/app/workflows`
2. Click "Create Workflow"
3. Add steps with agent types and instructions
4. Save workflow

### Running a Workflow

**Option 1: Automatic Execution (Recommended)**
1. Open workflow detail page
2. Click "Run Workflow"
3. Automatically navigates to run detail page
4. Execution starts immediately in background
5. Watch real-time progress updates

**Option 2: Manual Control from Run Detail Page**
1. Click "▶ Execute Next Step" to run one step at a time
2. Click "⚡ Execute All Steps" to run all remaining steps
3. Use manual status buttons if needed

### Monitoring Progress

The run detail page shows:
- Overall run status (queued/running/completed/failed)
- Progress bar with percentage
- Individual step status and outputs
- Real-time updates via Firestore onSnapshot
- Error messages if any step fails

## Workflow Run States

### Run Status
- `queued` - Created but not started
- `running` - Currently executing
- `completed` - All steps successful
- `failed` - A step failed
- `canceled` - Manually canceled

### Step Status
- `pending` - Not yet started
- `running` - Currently executing
- `completed` - Finished successfully
- `failed` - Execution failed
- `skipped` - Manually skipped

## Implementation Details

### Orchestrator Logic

The orchestrator handles:

1. **Step Sequencing** - Executes steps in order based on `step.order`
2. **Status Management** - Updates run and step statuses appropriately
3. **Progress Tracking** - Maintains `completedSteps` and `currentStepOrder`
4. **Error Handling** - Captures errors and marks run as failed
5. **Real-time Updates** - Uses Firestore serverTimestamp for accuracy

### Agent Runner Pattern

Each agent runner follows this pattern:

```typescript
export const MyAgentRunner: AgentRunner = async (input: AgentRunnerInput): Promise<AgentRunnerOutput> => {
  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate output based on instruction
    const output = {
      // Agent-specific output structure
    };

    return {
      success: true,
      output
    };
  } catch (error: any) {
    return {
      success: false,
      output: null,
      error: {
        message: error.message || "Execution failed",
        code: "EXECUTION_ERROR"
      }
    };
  }
};
```

## Extending the System

### Adding a New Agent Type

1. Create agent runner file: `lib/agentRunners/New_Agent.ts`
2. Implement the `AgentRunner` interface
3. Add to registry in `lib/agentRunnerRegistry.ts`:
   ```typescript
   import { NewAgentRunner } from "./agentRunners/New_Agent";
   
   export const AGENT_RUNNERS: Record<string, AgentRunner> = {
     // ... existing agents
     New_Agent: NewAgentRunner,
   };
   ```
4. Add to agent catalog in workflow builder

### Connecting Real AI

To replace mock implementations with real AI:

1. Install AI SDK (e.g., OpenAI, Anthropic)
2. Update agent runner to call AI API:
   ```typescript
   const response = await openai.chat.completions.create({
     model: "gpt-4",
     messages: [{ role: "user", content: input.step.instruction }]
   });
   
   const output = JSON.parse(response.choices[0].message.content);
   ```
3. Handle rate limits and retries
4. Store API keys in environment variables

## Future Enhancements

### Planned Features

1. **Server-Side Execution** - Move orchestrator to API route for background processing
2. **Scheduled Workflows** - Cron-based execution
3. **Step Dependencies** - Allow parallel execution where possible
4. **Agent State Passing** - Pass output from one step as input to next
5. **Retry Logic** - Automatic retry on transient failures
6. **Webhooks** - Notify external systems on completion
7. **Run Templates** - Save common input configurations

### Step 4E-2: Auto-run via Server Route

For production-ready background execution:

1. Create API route: `/api/orchestrator/execute`
2. Move orchestration logic to server
3. Use Firebase Admin SDK for server-side operations
4. Implement job queue for reliability
5. Add webhook notifications

## Testing

### Manual Testing Flow

1. Create a test workflow with 2-3 steps
2. Use different agent types
3. Click "Run Workflow"
4. Verify:
   - Navigation to run detail page
   - Status changes from queued → running
   - Steps execute in order
   - Progress bar updates
   - Step outputs appear
   - Final status is completed
5. Test failure scenario:
   - Manually modify agent runner to throw error
   - Verify error handling

### Expected Behavior

- ✅ Workflow list shows all workflows
- ✅ Create workflow saves successfully
- ✅ Run workflow creates run and navigates
- ✅ Steps execute automatically
- ✅ Real-time updates show progress
- ✅ Outputs display correctly
- ✅ Errors are caught and displayed
- ✅ Manual controls still work

## Troubleshooting

### Common Issues

**Execution doesn't start**
- Check browser console for errors
- Verify Firestore rules allow write access
- Ensure agent type exists in registry

**Steps stay pending**
- Check orchestrator is being called
- Verify agent runner is properly imported
- Look for JavaScript errors in console

**Real-time updates not working**
- Verify onSnapshot listener is active
- Check Firestore connection
- Ensure runId is correct

**Agent runner not found**
- Verify agent type name matches exactly
- Check registry imports
- Ensure file paths are correct

## Security Considerations

1. **Firestore Rules** - Restrict workflow_runs to workspace members
2. **API Keys** - Never expose in client code
3. **Rate Limiting** - Implement per-workspace limits
4. **Input Validation** - Sanitize user instructions
5. **Output Size** - Limit agent output size to prevent bloat

## Performance

Current mock implementation:
- Execution time: 400-1200ms per step
- No rate limits
- Runs fully client-side

Production considerations:
- Move to server for reliability
- Implement caching for repeated operations
- Use batch updates for Firestore writes
- Add monitoring and logging

## Conclusion

The orchestration system is now fully functional with:
- ✅ 9 mock agent runners
- ✅ Automatic workflow execution
- ✅ Real-time progress tracking
- ✅ Manual control options
- ✅ Error handling
- ✅ Clean architecture for extensions

You can now run workflows from creation to completion automatically!
