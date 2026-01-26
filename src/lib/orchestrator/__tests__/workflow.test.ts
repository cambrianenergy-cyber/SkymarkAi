
// Mock Firestore module to prevent real network calls
const store: Record<string, any> = {};
jest.mock('../firestore', () => ({
  db: () => ({
    doc: (path: string) => ({
      path,
      async get() {
        return { exists: !!store[path], data: () => store[path] };
      },
      async set(data: any, opts?: { merge?: boolean }) {
        if (opts?.merge && store[path]) {
          store[path] = { ...store[path], ...data };
        } else {
          store[path] = { ...data };
        }
        return undefined;
      },
    }),
  }),
  col: (collectionPath: string) => ({
    doc: (docId: string) => ({
      path: `${collectionPath}/${docId}`,
      async get() {
        const path = `${collectionPath}/${docId}`;
        return { exists: !!store[path], data: () => store[path] };
      },
      async set(data: any, opts?: { merge?: boolean }) {
        const path = `${collectionPath}/${docId}`;
        if (opts?.merge && store[path]) {
          store[path] = { ...store[path], ...data };
        } else {
          store[path] = { ...data };
        }
        return undefined;
      },
    }),
    // Mock add method for CollectionReference
    async add(data: any) {
      // Generate a random ID for the new document
      const docId = Math.random().toString(36).substring(2, 15);
      const path = `${collectionPath}/${docId}`;
      store[path] = { ...data };
      return {
        id: docId,
        path,
        async get() {
          return { exists: !!store[path], data: () => store[path] };
        },
      };
    },
  }),
  now: () => 1234567890,
}));
jest.setTimeout(15000);
import { markWorkflowRunStatus, advanceWorkflowCursor } from "../workflow";


describe("workflow", () => {
  beforeEach(() => {
    for (const k in store) delete store[k];
  });

  it("marks workflow run status and updates fields", async () => {
    store["workflow_runs/run1"] = {
      workspaceId: "w1",
      runId: "run1",
      workflowId: "wf1",
      status: "queued",
      createdAt: 1,
      updatedAt: 1,
    };
    await markWorkflowRunStatus({ workspaceId: "w1", runId: "run1", status: "running" });
    expect(store["workflow_runs/run1"].status).toBe("running");
    expect(store["workflow_runs/run1"].updatedAt).toBe(1234567890);
    expect(store["workflow_runs/run1"].startedAt).toBe(1234567890);
  });

  it("advances workflow cursor and updates state", async () => {
    store["workflow_runs/run2"] = {
      workspaceId: "w1",
      runId: "run2",
      workflowId: "wf1",
      status: "running",
      cursor: { stepIndex: 0, state: { foo: 1 } },
      createdAt: 1,
      updatedAt: 1,
    };
    await advanceWorkflowCursor({ workspaceId: "w1", runId: "run2", nextStepIndex: 1, statePatch: { bar: 2 } });
    expect(store["workflow_runs/run2"].cursor.stepIndex).toBe(1);
    expect(store["workflow_runs/run2"].cursor.state).toEqual({ foo: 1, bar: 2 });
    expect(store["workflow_runs/run2"].updatedAt).toBe(1234567890);
  });
});

