// Mock Firestore module to prevent real network calls
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
  now: () => 1234567890,
}));
jest.setTimeout(15000);
import { checkAndIncrementRateLimit } from "../rateLimit";

// Mock Firestore
const store: Record<string, any> = {};
const mockDoc = (path: string) => ({
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
});

// Jest migration

describe("checkAndIncrementRateLimit", () => {
  const origDateNow = Date.now;
  beforeEach(() => {
    for (const k in store) delete store[k];
    Date.now = () => 0; // fixed window for most tests
  });
  afterAll(() => {
    Date.now = origDateNow;
  });

  it("allows first call and increments count", async () => {
    await checkAndIncrementRateLimit({
      workspaceId: "w1",
      bucketId: "test",
      limit: 2,
      windowSeconds: 60,
    });
    expect(store["rate_limits/w1_test"]).toMatchObject({ count: 1 });
  });

  it("increments count within window", async () => {
    store["rate_limits/w1_test"] = {
      workspaceId: "w1",
      bucketId: "test",
      windowStartMs: 0,
      count: 1,
      limit: 2,
      updatedAt: 1234567890,
    };
    await checkAndIncrementRateLimit({
      workspaceId: "w1",
      bucketId: "test",
      limit: 2,
      windowSeconds: 60,
    });
    expect(store["rate_limits/w1_test"].count).toBe(2);
  });

  it("resets count on new window", async () => {
    store["rate_limits/w1_test"] = {
      workspaceId: "w1",
      bucketId: "test",
      windowStartMs: 0,
      count: 2,
      limit: 2,
      updatedAt: 1234567890,
    };
    Date.now = () => 60000; // simulate new window
    await checkAndIncrementRateLimit({
      workspaceId: "w1",
      bucketId: "test",
      limit: 2,
      windowSeconds: 60,
    });
    expect(store["rate_limits/w1_test"].count).toBe(1);
    Date.now = () => 0; // reset for other tests
  });

  it("throws if limit exceeded", async () => {
    store["rate_limits/w1_test"] = {
      workspaceId: "w1",
      bucketId: "test",
      windowStartMs: 0,
      count: 2,
      limit: 2,
      updatedAt: 1234567890,
    };
    await expect(
      checkAndIncrementRateLimit({
        workspaceId: "w1",
        bucketId: "test",
        limit: 2,
        windowSeconds: 60,
      })
    ).rejects.toThrow(/RATE_LIMITED/);
  });
});

// Removed Vitest-specific test file. Use Jest for testing in this project.
        windowSeconds: 60
