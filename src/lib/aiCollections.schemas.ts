import { z } from "zod";

/** Common helpers */
export const zTimestampish = z.any(); // Firestore Timestamp on server, Date/number on client. Normalize in adapters.
export const zISODateString = z.string().datetime().or(z.string()); // allow relaxed strings if needed
export const zObject = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();

export const WorkspaceScoped = zObject({
  workspaceId: z.string().min(6),
  createdAt: zTimestampish,
  updatedAt: zTimestampish,
});

export const Actor = zObject({
  uid: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["owner", "admin", "member", "viewer"]).optional(),
});

export const AuditMeta = zObject({
  actor: Actor.optional(),
  requestId: z.string().optional(),
  traceId: z.string().optional(),
  userAgent: z.string().optional(),
  ip: z.string().optional(),
});

/* =========================================================
   1) tool_registry (workspace-scoped tool catalog)
   ========================================================= */

export const ToolRegistryDoc = WorkspaceScoped.extend({
  // docId recommended: `${toolKey}` or `${toolKey}_${version}`
  toolKey: z.string().min(2), // stable key e.g. "web.search" or "crm.createLead"
  version: z.string().default("1.0.0"),
  displayName: z.string().min(2),
  description: z.string().min(2),

  category: z.enum([
    "core",
    "search",
    "crm",
    "calendar",
    "email",
    "documents",
    "payments",
    "custom",
  ]),

  // if you enforce plan gates
  planGate: z
    .object({
      minPlan: z.enum(["free", "starter", "pro", "business", "enterprise"]).default("starter"),
      allowFounderOverride: z.boolean().default(true),
    })
    .default({ minPlan: "starter", allowFounderOverride: true }),

  // permissions
  allowedRoles: z.array(z.enum(["owner", "admin", "member", "viewer"])).default(["owner", "admin"]),
  risk: z.enum(["low", "medium", "high"]).default("low"),

  // JSON Schema for params
  inputSchema: z.record(z.string(), z.any()).default({}),
  outputSchema: z.record(z.string(), z.any()).default({}),

  // execution
  timeoutMs: z.number().int().min(1000).max(300000).default(60000),
  rateLimit: z
    .object({
      perMinute: z.number().int().min(1).default(60),
      perHour: z.number().int().min(1).default(1000),
    })
    .default({ perMinute: 60, perHour: 1000 }),

  isEnabled: z.boolean().default(true),
});

export type ToolRegistryDocT = z.infer<typeof ToolRegistryDoc>;

/* =========================================================
   2) tool_invocations (append-only tool execution log)
   ========================================================= */

export const ToolInvocationDoc = WorkspaceScoped.extend({
  invocationId: z.string().min(8), // can match docId
  runId: z.string().min(6), // workflow_run id
  agentId: z.string().min(6),
  stepId: z.string().min(1),
  toolKey: z.string().min(2),
  toolVersion: z.string().optional(),

  status: z.enum(["queued", "running", "succeeded", "failed", "canceled"]).default("queued"),

  // request/response blobs
  input: z.record(z.string(), z.any()).default({}),
  output: z.record(z.string(), z.any()).optional(),

  error: z
    .object({
      code: z.string().optional(),
      message: z.string(),
      stack: z.string().optional(),
      kind: z.enum(["tool_failure", "model_failure", "invalid_input", "permission_denied", "timeout"]).optional(),
      retriable: z.boolean().default(false),
    })
    .optional(),

  // cost + timing
  startedAt: zTimestampish.optional(),
  finishedAt: zTimestampish.optional(),
  durationMs: z.number().int().min(0).optional(),

  // attribution
  meta: AuditMeta.optional(),
});

export type ToolInvocationDocT = z.infer<typeof ToolInvocationDoc>;

/* =========================================================
   3) agent_memory (short/long term memory store)
   ========================================================= */

export const AgentMemoryDoc = WorkspaceScoped.extend({
  agentId: z.string().min(6),

  // docId recommended: auto-id
  memoryType: z.enum(["short_term", "long_term", "profile", "facts", "preferences"]).default("short_term"),

  // for retrieval
  tags: z.array(z.string()).default([]),
  source: z.enum(["user", "agent", "system", "tool"]).default("agent"),

  // content
  title: z.string().optional(),
  content: z.string().min(1),

  // vector hooks (optional)
  embedding: z.array(z.number()).optional(),
  embeddingModel: z.string().optional(),

  // lifecycle
  importance: z.number().min(0).max(1).default(0.5),
  expiresAt: zTimestampish.optional(), // short term memory TTL
});

export type AgentMemoryDocT = z.infer<typeof AgentMemoryDoc>;

/* =========================================================
   4) workflow_templates (reusable workflow definitions)
   ========================================================= */

export const WorkflowTemplateDoc = WorkspaceScoped.extend({
  templateKey: z.string().min(2), // stable identifier
  version: z.string().default("1.0.0"),
  name: z.string().min(2),
  description: z.string().optional(),

  // who can use it
  allowedRoles: z.array(z.enum(["owner", "admin", "member", "viewer"])).default(["owner", "admin", "member"]),
  isPublished: z.boolean().default(false),

  // workflow definition (steps, schema, etc.)
  definition: z.record(z.string(), z.any()).default({}),

  // optional marketplace metadata
  tags: z.array(z.string()).default([]),
});

export type WorkflowTemplateDocT = z.infer<typeof WorkflowTemplateDoc>;

/* =========================================================
   5) execution_policies (governance rules per workspace)
   ========================================================= */

export const ExecutionPolicyDoc = WorkspaceScoped.extend({
  policyKey: z.string().min(2), // e.g. "default", "strict", "founder"
  name: z.string().min(2),
  description: z.string().optional(),

  // model + budgets
  llm: z
    .object({
      model: z.string().default("gpt-5"),
      maxTokens: z.number().int().min(256).max(200000).default(8000),
      temperature: z.number().min(0).max(2).default(0.3),
    })
    .default({ model: "gpt-5", maxTokens: 8000, temperature: 0.3 }),

  budgets: z
    .object({
      maxToolInvocationsPerRun: z.number().int().min(0).default(50),
      maxRuntimeMsPerRun: z.number().int().min(1000).default(10 * 60 * 1000),
      maxRetriesPerStep: z.number().int().min(0).default(2),
    })
    .default({ maxToolInvocationsPerRun: 50, maxRuntimeMsPerRun: 600000, maxRetriesPerStep: 2 }),

  retry: z
    .object({
      strategy: z.enum(["none", "linear", "exponential"]).default("exponential"),
      baseDelayMs: z.number().int().min(0).default(1000),
      maxDelayMs: z.number().int().min(0).default(30000),
      jitter: z.boolean().default(true),
      retryOn: z.array(z.enum(["tool_failure", "timeout", "model_failure"])).default(["tool_failure", "timeout"]),
    })
    .default({
      strategy: "exponential",
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      jitter: true,
      retryOn: ["tool_failure", "timeout"],
    }),

  permissions: z
    .object({
      // if true, any tool requires explicit allowlist (allowedTools per agent + tool_registry allowedRoles)
      enforceAllowlist: z.boolean().default(true),
      requireHumanForHighRisk: z.boolean().default(true),
    })
    .default({ enforceAllowlist: true, requireHumanForHighRisk: true }),

  isEnabled: z.boolean().default(true),
});

export type ExecutionPolicyDocT = z.infer<typeof ExecutionPolicyDoc>;

/* =========================================================
   6) billing_usage_events (metering, append-only)
   ========================================================= */

export const BillingUsageEventDoc = WorkspaceScoped.extend({
  eventId: z.string().min(8), // docId recommended
  kind: z.enum([
    "llm_tokens",
    "tool_invocation",
    "workflow_run",
    "storage_write",
    "storage_read",
  ]),
  runId: z.string().optional(),
  agentId: z.string().optional(),
  toolKey: z.string().optional(),

  quantity: z.number().min(0),
  unit: z.enum(["tokens", "invocation", "run", "op"]).default("op"),

  // optional cost fields
  costUsd: z.number().min(0).optional(),
  currency: z.string().default("USD"),

  meta: AuditMeta.optional(),
});

export type BillingUsageEventDocT = z.infer<typeof BillingUsageEventDoc>;

/* =========================================================
   7) needs_review_queue (human-in-the-loop)
   ========================================================= */

export const NeedsReviewQueueDoc = WorkspaceScoped.extend({
  itemId: z.string().min(8), // docId recommended
  runId: z.string().min(6),
  agentId: z.string().min(6),
  stepId: z.string().min(1),

  reason: z.enum([
    "permission_denied",
    "high_risk_action",
    "ambiguous_user_intent",
    "repeated_failures",
    "policy_violation",
    "manual_override_required",
  ]),

  status: z.enum(["open", "acknowledged", "resolved", "dismissed"]).default("open"),

  summary: z.string().min(2),
  details: z.record(z.string(), z.any()).default({}),

  assignedTo: z.string().nullable().default(null), // reviewer uid
  resolvedBy: z.string().nullable().default(null),
  resolvedAt: zTimestampish.optional(),

  meta: AuditMeta.optional(),
});

export type NeedsReviewQueueDocT = z.infer<typeof NeedsReviewQueueDoc>;
