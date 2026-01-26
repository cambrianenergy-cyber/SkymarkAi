// Minimal test to satisfy Jest
// Jest migration
describe('firestoreAdminMock', () => {
  it('should export getDb', () => {
    expect(typeof getDb).toBe('function');
  });
});
describe('firestoreAdminMock', () => {
  it('should export getDb', () => {
    expect(typeof getDb).toBe('function');
  });
});
// src/lib/orchestrator/__tests__/firestoreAdminMock.ts
// In-memory Firestore Admin mock for orchestrator tests

const store: Record<string, any> = {};

export function resetFirestoreMock() {
  for (const k in store) delete store[k];
}

export function getDoc(path: string) {
  return {
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
    async update(data: any) {
      if (!store[path]) throw new Error("not-found");
      store[path] = { ...store[path], ...data };
      return undefined;
    },
  };
}

export function getCollection(path: string) {
  return {
    async add(data: any) {
      const id = Math.random().toString(36).slice(2, 10);
      store[`${path}/${id}`] = { ...data, id };
      return getDoc(`${path}/${id}`);
    },
    doc(id?: string) {
      const docId = id || Math.random().toString(36).slice(2, 10);
      return getDoc(`${path}/${docId}`);
    },
    async where() { return this; },
    async limit() { return this; },
    async get() {
      const docs = Object.entries(store)
        .filter(([k]) => k.startsWith(path + "/") && k.split("/").length === path.split("/").length + 1)
        .map(([k, v]) => ({ id: k.split("/").pop(), data: () => v }));
      return {
        docs,
        empty: docs.length === 0,
        size: docs.length,
        forEach(cb: (d: any) => void) { docs.forEach(cb); },
      };
    },
  };
}

export function getDb() {
  return {
    collection: getCollection,
    doc: getDoc,
    runTransaction: async (fn: any) => fn({ get: getDoc, set: async () => {}, update: async () => {} }),
  };
}

export function now() { return 1234567890; }

export { store };
