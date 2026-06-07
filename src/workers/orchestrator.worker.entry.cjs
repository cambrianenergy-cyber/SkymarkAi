// CommonJS entry point for orchestrator worker loop
// Usage: node src/workers/orchestrator.worker.entry.cjs

const { executeWorkflowRun } = require('./orchestrator.worker.mjs');

async function findQueuedWorkflowRun() {
  // Import the actual implementation from the ESM file
  // You may need to refactor this if findQueuedWorkflowRun is not exported
  throw new Error('findQueuedWorkflowRun() must be implemented or imported here.');
}

(async function orchestratorWorkerLoop() {
  while (true) {
    const nextRun = await findQueuedWorkflowRun();
    if (nextRun) {
      await executeWorkflowRun(nextRun.runId);
    } else {
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
})();
