jest.mock('@google-cloud/firestore', () => {
  const mDoc = {
    get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mCollection = {
    doc: jest.fn(() => mDoc),
    add: jest.fn(),
    where: jest.fn(() => mCollection),
    get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
  };
    function mFirestore() {
      return {
        collection: jest.fn(() => mCollection),
        doc: jest.fn(() => mDoc),
        runTransaction: jest.fn(),
      };
    }
    mFirestore.FieldValue = { serverTimestamp: jest.fn() };
    return { Firestore: mFirestore, FieldValue: mFirestore.FieldValue };
  });
  // ------------------------------
  // 2. IMPORT AFTER MOCKS
  // ------------------------------
  // Using Jest's default globals: describe, it, expect, beforeEach
  import { executeToolCallWithGovernance } from '../executeToolCallWithGovernance';

// ------------------------------
// 3. GLOBAL HELPERS
// ------------------------------
global.getExecutionPolicy = jest.fn(async () => ({
  budgets: { maxRetriesPerStep: 2 },
  retry: { retryOn: ['tool_failure', 'timeout'] },
}));

global.createToolInvocation = jest.fn(async () => ({
  invocationId: 'test-invocation',
  docId: 'test-doc',
}));

global.markToolInvocation = jest.fn(async () => true);
global.emitUsageEvent = jest.fn(async () => true);
global.pushNeedsReview = jest.fn(async () => true);
global.computeBackoffMs = jest.fn(() => 0);
global.sleep = jest.fn(async () => {});
global.now = jest.fn(() => '2026-01-08T00:00:00.000Z');

// ------------------------------
// 4. BEFORE EACH
// ------------------------------
let gateToolOrNeedsReviewMock;

beforeEach(() => {
  jest.clearAllMocks();
  global.gateToolOrNeedsReview = jest.fn(async () => ({
    ok: true,
    tool: { version: '1.0.0' },
  }));
  gateToolOrNeedsReviewMock = global.gateToolOrNeedsReview;
});

jest.setTimeout(15000);

describe('executeToolCallWithGovernance', () => {
  const baseArgs = {
    run: { workspaceId: 'ws1', id: 'run1', policyKey: 'default' },
    agent: { id: 'agent1' },
    step: { id: 'step1' },
    toolCall: { toolKey: 'core.noop', input: {}, stepId: 'step1' },
    actorUid: 'user1',
    executeTool: jest.fn(async () => ({ ok: true })),
  };

  it('succeeds on first try', async () => {
    const result = await executeToolCallWithGovernance(baseArgs);
    expect(result.ok).toBe(true);
    expect(result.output).toEqual({ ok: true });
    expect(global.markToolInvocation).toHaveBeenCalledWith('test-doc', expect.objectContaining({ status: 'succeeded' }));
    expect(global.emitUsageEvent).toHaveBeenCalledWith(expect.objectContaining({ meta: expect.objectContaining({ status: 'succeeded' }) }));
  }, 15000);

  it('handles tool gating (denied)', async () => {
    (gateToolOrNeedsReviewMock as any).mockResolvedValueOnce({ ok: false, denyReason: 'plan', needsReviewId: 'review1' });
    const result = await executeToolCallWithGovernance(baseArgs);
    expect(result.ok).toBe(false);
    expect(result.gated).toBe(true);
    expect(result.needsReviewId).toBe('review1');
    expect(global.markToolInvocation).toHaveBeenCalledWith('test-doc', expect.objectContaining({ status: 'failed' }));
    expect(global.emitUsageEvent).toHaveBeenCalledWith(expect.objectContaining({ meta: expect.objectContaining({ status: 'denied' }) }));
  }, 15000);

  it('retries on tool failure and then succeeds', async () => {
    let callCount = 0;
    (baseArgs.executeTool as jest.Mock).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) throw new Error('tool_failure');
      return { ok: true };
    });
    (gateToolOrNeedsReviewMock as any).mockResolvedValue({ ok: true, tool: { version: '1.0.0' } });
    const result = await executeToolCallWithGovernance(baseArgs);
    expect(result.ok).toBe(true);
    expect(callCount).toBe(2);
    expect(global.emitUsageEvent).toHaveBeenCalledWith(expect.objectContaining({ meta: expect.objectContaining({ status: 'succeeded', attempt: 2 }) }));
  }, 15000);

  it('escalates after max retries', async () => {
    (baseArgs.executeTool as jest.Mock).mockImplementation(async () => { throw new Error('tool_failure'); });
    (gateToolOrNeedsReviewMock as any).mockResolvedValue({ ok: true, tool: { version: '1.0.0' } });
    const result = await executeToolCallWithGovernance(baseArgs);
    expect(result.ok).toBe(false);
    expect(global.pushNeedsReview).toHaveBeenCalledWith(expect.objectContaining({ reason: 'repeated_failures' }));
    expect(global.emitUsageEvent).toHaveBeenCalledWith(expect.objectContaining({ meta: expect.objectContaining({ status: 'failed' }) }));
  }, 15000);
});
