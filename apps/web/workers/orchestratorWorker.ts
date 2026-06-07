
// Proxy to the original implementation for now
import { executeWorkflowRun as realExecuteWorkflowRun } from "../../../src/workers/orchestrator.worker.mts";

export async function executeWorkflowRun(args: any) {
	// You can adapt this to match your new argument structure if needed
	return realExecuteWorkflowRun(args);
}
