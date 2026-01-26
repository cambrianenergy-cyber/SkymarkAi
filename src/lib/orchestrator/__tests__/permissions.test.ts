import { assertCollectionAllowed, assertEntityAllowed } from "../permissions";
// Jest migration

describe("permissions", () => {
  const basePolicy = {
    workspaceId: "w1",
    agentId: "a1",
    policyVersion: 1,
    canRead: ["foo", "bar"],
    canWrite: ["foo"],
    canDelete: ["bar"],
    canMessage: true,
    canTriggerWorkflows: false,
    allowedEntityTypes: ["lead", "contact"],
    updatedAt: 0,
  };

  it("allows collection if in canRead/canWrite/canDelete", () => {
    expect(() => assertCollectionAllowed(basePolicy, "read", "foo")).not.toThrow();
    expect(() => assertCollectionAllowed(basePolicy, "write", "foo")).not.toThrow();
    expect(() => assertCollectionAllowed(basePolicy, "delete", "bar")).not.toThrow();
  });

  it("denies collection if not in allowed set", () => {
    expect(() => assertCollectionAllowed(basePolicy, "read", "baz")).toThrow(/PERMISSION_DENIED/);
    expect(() => assertCollectionAllowed(basePolicy, "write", "bar")).toThrow(/PERMISSION_DENIED/);
    expect(() => assertCollectionAllowed(basePolicy, "delete", "foo")).toThrow(/PERMISSION_DENIED/);
  });

  it("allows wildcard '*' in canRead/canWrite/canDelete", () => {
    const pol = { ...basePolicy, canRead: ["*"] };
    expect(() => assertCollectionAllowed(pol, "read", "anything")).not.toThrow();
  });

  it("allows entity if in allowedEntityTypes", () => {
    expect(() => assertEntityAllowed(basePolicy, "lead")).not.toThrow();
    expect(() => assertEntityAllowed(basePolicy, "contact")).not.toThrow();
  });

  it("denies entity if not in allowedEntityTypes", () => {
    expect(() => assertEntityAllowed(basePolicy, "deal")).toThrow(/PERMISSION_DENIED/);
  });

  it("allows wildcard '*' in allowedEntityTypes", () => {
    const pol = { ...basePolicy, allowedEntityTypes: ["*"] };
    expect(() => assertEntityAllowed(pol, "anything")).not.toThrow();
  });
});
