export {};
// Stub for getFirestore to unblock build
export function getFirestore() {
  return {
    collection: (...args: any[]) => {
      const docs = [
        {
          data: () => ({}),
          id: "mock_id",
        },
      ];
      const collectionStub = {
        doc: (...args: any[]) => {
          const docStub = {
            id: "mock_id",
            set: async (...args: any[]) => {},
            update: async (...args: any[]) => {},
            get: async () => ({ exists: true, id: "mock_id", data: () => ({}) }),
            delete: async (...args: any[]) => {},
            collection: (...args: any[]) => collectionStub,
          };
          return docStub;
        },
        where: function (...args: any[]) { return this; },
        get: async () => {
          const snap = { docs, forEach: (cb: any) => docs.forEach(cb) };
          return snap;
        },
        add: async (...args: any[]) => ({ id: "mock_id" }),
      };
      return collectionStub;
    },
    runTransaction: async (fn: any) => {
      // Provide a minimal tx object with get and set
      const tx = {
        get: async (ref: any) => ({ exists: true, id: "mock_id", data: () => ({ workspaceId: "mock_workspace" }) }),
        set: (...args: any[]) => {},
      };
      return await fn(tx);
    },
  };
}
// Minimal stub for adminAuth for client-side compatibility
export const adminAuth = { getUser: async (uid: string) => ({ emailVerified: false }) };

// Add stubs for adminDb and adminFieldValue to unblock build
export const adminDb = getFirestore();
export const adminFieldValue = {
  serverTimestamp: () => new Date(),
};
export const FieldValue = {
  serverTimestamp: () => new Date(),
};


// Add stubs for missing utilities to unblock build
export function buildPlanGate(_plan?: any) {
  return {
    allowedAgentTypesList: [],
    limits: {
      maxStepsPerRun: 0,
      maxConcurrentRuns: 0,
      maxWorkflowRunsPerDay: 0,
      maxAgents: 0,
      maxTeamMembers: 0,
      maxActiveAgents: 0,
    },
    hiddenAgentTypesList: [],
    features: {},
    seats: {},
    overrides: {},
    stripe: {},
    maxStepsPerRun: 0,
    maxConcurrentRuns: 0,
    maxWorkflowsPerDay: 0,
  };
}

// Generic Firestore-like db() stub for legacy code
export function db() {
  return getFirestore();
}

// now() stub for server/client compatibility
export function now() {
  return new Date();
}
