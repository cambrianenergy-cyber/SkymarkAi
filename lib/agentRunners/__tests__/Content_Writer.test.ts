
jest.mock('../../firebase', () => {
  const { createFirestoreMock } = require('./mocks/firestoreMock');
  const mock = createFirestoreMock();
  return {
    db: mock.db,
    firestore: mock.firestore,
    collection: mock.collection,
    __firestoreMock: mock,
  };
});
// Mock agentRunLogger functions to prevent unhandled errors
jest.mock('../../agentRunLogger', () => ({
  startAgentRun: jest.fn(() => Promise.resolve('mock-run-id')),
  logAgentRunSuccess: jest.fn(() => Promise.resolve()),
  logAgentRunFailure: jest.fn(() => Promise.resolve()),
}));
import { ContentWriterRunner } from '../Content_Writer';
import { AgentRunnerInput } from '../../agentRunner';

describe('ContentWriterRunner', () => {
  it('should generate content for valid input', async () => {
    const input: AgentRunnerInput = {
      workspaceId: 'workspace-1',
      runId: 'run-1',
      step: {
        stepId: 'step-1',
        order: 1,
        agentType: 'ContentWriter',
        instruction: 'Write a LinkedIn post about AI productivity.',
        input: {
          userDescription: 'AI tools for productivity',
          template: 'linkedin',
        },
      },
    };
    const result = await ContentWriterRunner(input);
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
    expect(result.output.content).toBeDefined();
  });

  it('should fail if userDescription is missing', async () => {
    const input: AgentRunnerInput = {
      workspaceId: 'workspace-1',
      runId: 'run-2',
      step: {
        stepId: 'step-2',
        order: 1,
        agentType: 'ContentWriter',
        instruction: 'Write a LinkedIn post.',
        input: {},
      },
    };
    const result = await ContentWriterRunner(input);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    if (result.error) {
      expect(result.error.code).toBe('MISSING_INPUT');
    }
  });

  it('should enforce workspace boundaries', async () => {
    const input: AgentRunnerInput = {
      workspaceId: 'workspace-1',
      runId: 'run-3',
      step: {
        stepId: 'step-3',
        order: 1,
        agentType: 'ContentWriter',
        instruction: 'Write a LinkedIn post.',
        input: {
          userDescription: 'AI tools for productivity',
          agentWorkspaceId: 'workspace-2',
        },
      },
    };
    const result = await ContentWriterRunner(input);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    if (result.error) {
      expect(result.error.code).toBe('WORKSPACE_ISOLATION_ERROR');
    }
  });

  it("should block agent execution for 'viewer' role", async () => {
    const input: AgentRunnerInput = {
      workspaceId: 'workspace-1',
      runId: 'run-4',
      userRole: 'viewer',
      step: {
        stepId: 'step-4',
        order: 1,
        agentType: 'ContentWriter',
        instruction: 'Write a LinkedIn post.',
        input: {
          userDescription: 'AI tools for productivity',
        },
      },
    };
    const result = await ContentWriterRunner(input);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    if (result.error) {
      expect(result.error.code).toBe('RBAC_VIEWER_BLOCKED');
    }
  });
});
