// Minimal test to satisfy Jest
describe('firestoreMock', () => {
  it('should export createFirestoreMock', () => {
    expect(typeof createFirestoreMock).toBe('function');
  });
});
// __tests__/mocks/firestoreMock.ts
// In-memory Firestore mock for Jest

type DocData = Record<string, any>;

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

type Store = Map<string, DocData>;

export function createFirestoreMock() {
  const store: Store = new Map();

  const makePath = (...parts: string[]) => parts.filter(Boolean).join("/");

  class DocumentSnapshotMock {
    constructor(private _path: string) {}
    exists() {
      return store.has(this._path);
    }
    data() {
      return store.get(this._path);
    }
    get id() {
      const parts = this._path.split("/");
      return parts[parts.length - 1];
    }
    get ref() {
      return { path: this._path };
    }
  }

  const docRef = (path: string) => ({
    path,
    id: path.split("/").pop() as string,

    async set(data: DocData, opts?: { merge?: boolean }) {
      if (opts?.merge && store.has(path)) {
        const prev = store.get(path) || {};
        store.set(path, { ...prev, ...data });
      } else {
        store.set(path, { ...data });
      }
      return undefined;
    },

    async update(data: DocData) {
      const prev = store.get(path);
      if (!prev) throw new Error(`not-found: ${path}`);
      store.set(path, { ...prev, ...data });
      return undefined;
    },

    async get() {
      return new DocumentSnapshotMock(path);
    },

    collection(sub: string) {
      return collectionRef(makePath(path, sub));
    },
  });

  const collectionRef = (path: string) => ({
    path,

    doc(id?: string) {
      const docId = id ?? randomId();
      return docRef(makePath(path, docId));
    },

    async add(data: DocData) {
      const ref = docRef(makePath(path, randomId()));
      await ref.set(data);
      return ref;
    },

    where() {
      return this;
    },
    orderBy() {
      return this;
    },
    limit() {
      return this;
    },

    async get() {
      const docs = [...store.entries()]
        .filter(([p]) => p.startsWith(path + "/") && p.split("/").length === path.split("/").length + 1)
        .map(([p]) => new DocumentSnapshotMock(p));

      return {
        docs,
        empty: docs.length === 0,
        size: docs.length,
        forEach(cb: (d: any) => void) {
          docs.forEach(cb);
        },
      };
    },
  });


  // Classic API: db.collection('name')
  const db = {
    collection(name: string) {
      return collectionRef(name);
    },
  };

  // Modular API: collection(firestore, 'name')
  const firestore = { _delegate: {}, _firestoreClient: {} };
  function collection(firestoreArg: any, name: string) {
    // Accept either (firestore, name) or (name) for compatibility
    if (typeof firestoreArg === 'string' && !name) {
      return collectionRef(firestoreArg);
    }
    return collectionRef(name);
  }

  return {
    db,
    firestore,
    collection,
    store,
    getDocByPath: (path: string) => store.get(path),
    getAll: () => [...store.entries()],
  };
}
