import { executeToolCallWithGovernance } from './executeToolCallWithGovernance';
// Import your types and helpers as needed

/**
 * Example orchestrator runner that executes a tool step with governance.
 * Replace the mock data and wire this up to your real workflow/agent/task logic.
 */
export async function runOrchestratorStep({
  run,
  agent,
  step,
  toolCall,
  actorUid,
  executeTool,
}: {
  run: any; // Replace with WorkflowRun type
  agent: any; // Replace with Agent type
  step: any; // Replace with Step type
  toolCall: any; // Replace with ToolCall type
  actorUid: string;
  executeTool: (toolKey: string, input: any) => Promise<any>;
}) {
  // All tool execution is now governed
  return executeToolCallWithGovernance({
    run,
    agent,
    step,
    toolCall,
    actorUid,
    executeTool,
  });
}

// Example usage (remove or adapt for your real orchestrator):
// runOrchestratorStep({ run, agent, step, toolCall, actorUid, executeTool })
