
import { z, ZodTypeAny } from "zod";
// Default LLM output schema (can be extended or replaced per use-case)
export const DefaultLLMOutputSchema = z.object({
  summary: z.string(),
  toolRequests: z.array(z.object({
    name: z.string(),
    input: z.any(),
    agentKey: z.string().optional(),
    objective: z.string().optional(),
    context: z.any().optional(),
    requestedBy: z.any().optional(),
    toolPlan: z.any().optional(),
  })).optional(),
  ["outputText"]: z.any().optional(),
  // Add more fields as needed
});

import OpenAI from "openai";
import { db, now } from "./firestore";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`MISSING_ENV: ${name}`);
  return v;
}

// Simple output validation (expand as needed)
function validateLLMOutput(output: any, format: "text" | "json", schema?: ZodTypeAny) {
  if (format === "json") {
    try {
      const parsed = typeof output === "string" ? JSON.parse(output) : output;
      if (typeof parsed !== "object" || parsed === null) throw new Error("Not an object");
      if (schema) {
        const result = schema.safeParse(parsed);
        if (!result.success) {
          return { ok: false, error: result.error.issues, value: parsed };
        }
        return { ok: true, value: result.data };
      }
      return { ok: true, value: parsed };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }
  // For text, just check it's a string
  if (typeof output !== "string") return { ok: false, error: "Not a string" };
  return { ok: true, value: output };
}

/**
 * Calls OpenAI Responses API and returns:
 * - outputText (what you want to store as "summary" / primary content)
 * - raw (full response object if you want to log/debug)
 */


export async function runLLM(args: {
  model: string; // e.g. "gpt-5"
  instructions: string; // agent instructions / system rules
  input: string; // task-specific request
  responseFormat?: "text" | "json"; // optional
  maxOutputTokens?: number;
  temperature?: number;
  metadata?: Record<string, any>;
  workspaceId?: string;
  agentId?: string;
  outputSchema?: ZodTypeAny; // optional strict schema
}): Promise<{
  outputText: string | null;
  raw: any;
  validation: any;
  usage: any;
  logId: string | null;
  toolCalls: any[];
  error?: string;
}> {
  // Budget enforcement (token/latency caps)
  const MAX_TOKENS = 4096; // Example cap, can be made configurable
  const MAX_COST = 5.0; // Example $5 per call cap
  if ((args.maxOutputTokens && args.maxOutputTokens > MAX_TOKENS)) {
    return {
      outputText: null,
      raw: null,
      validation: { ok: false, error: `MAX_TOKENS_EXCEEDED: Requested ${args.maxOutputTokens} > ${MAX_TOKENS}` },
      usage: {},
      logId: null,
      toolCalls: [],
      error: 'Token budget exceeded',
    };
  }

  requiredEnv("OPENAI_API_KEY");

  const {
    model,
    instructions,
    input,
    responseFormat = "text",
    maxOutputTokens,
    temperature,
    metadata,
    workspaceId,
    agentId,
    outputSchema,
  } = args;

  // Use default schema if none provided and responseFormat is json
  const schemaToUse = outputSchema || (responseFormat === "json" ? DefaultLLMOutputSchema : undefined);

  // Responses API: top-level instructions + input.
  const response = await client.responses.create({
    model,
    instructions,
    input,
    max_output_tokens: maxOutputTokens,
    temperature,
    metadata,
  });

  const outputText = (response as any).output_text ?? "";

  // Output validation
  const validation = validateLLMOutput(outputText, responseFormat, schemaToUse);

  // Token/cost accounting (OpenAI API returns usage)
  const usage = (response as any).usage || {};
  const tokensIn = usage.prompt_tokens ?? null;
  const tokensOut = usage.completion_tokens ?? null;
  const totalTokens = usage.total_tokens ?? null;
  const cost = usage.total_cost ?? null;

  // Centralized logging
  const logRef = db().collection("llm_logs").doc();

  // Budget enforcement after call (actual usage)
  if (totalTokens && totalTokens > MAX_TOKENS) {
    await logRef.set({
      workspaceId: workspaceId || null,
      agentId: agentId || null,
      model,
      instructions,
      input,
      responseFormat,
      outputText,
      validation,
      usage: { tokensIn, tokensOut, totalTokens, cost },
      raw: response,
      createdAt: now(),
      metadata: metadata || null,
    });
    return {
      outputText: null,
      raw: response,
      validation: { ok: false, error: `MAX_TOKENS_EXCEEDED: Used ${totalTokens} > ${MAX_TOKENS}` },
      usage: { tokensIn, tokensOut, totalTokens, cost },
      logId: logRef.id,
      toolCalls: [],
      error: 'Token budget exceeded',
    };
  }
  if (cost && cost > MAX_COST) {
    await logRef.set({
      workspaceId: workspaceId || null,
      agentId: agentId || null,
      model,
      instructions,
      input,
      responseFormat,
      outputText,
      validation,
      usage: { tokensIn, tokensOut, totalTokens, cost },
      raw: response,
      createdAt: now(),
      metadata: metadata || null,
    });
    return {
      outputText: null,
      raw: response,
      validation: { ok: false, error: `MAX_COST_EXCEEDED: Used $${cost} > $${MAX_COST}` },
      usage: { tokensIn, tokensOut, totalTokens, cost },
      logId: logRef.id,
      toolCalls: [],
      error: 'Cost budget exceeded',
    };
  }

  await logRef.set({
    workspaceId: workspaceId || null,
    agentId: agentId || null,
    model,
    instructions,
    input,
    responseFormat,
    outputText,
    validation,
    usage: { tokensIn, tokensOut, totalTokens, cost },
    raw: response,
    createdAt: now(),
    metadata: metadata || null,
  });

  // LLM session logging (llm_sessions collection)
  const sessionRef = db().collection("llm_sessions").doc();
  await sessionRef.set({
    llmSessionId: sessionRef.id,
    workspaceId: workspaceId || null,
    agentId: agentId || null,
    model,
    instructions,
    input,
    responseFormat,
    outputText,
    validation,
    usage: { tokensIn, tokensOut, totalTokens, cost },
    raw: response,
    createdAt: now(),
    updatedAt: now(),
    metadata: metadata || null,
  });

  // Budget enforcement after call (actual usage)
  if (totalTokens && totalTokens > MAX_TOKENS) {
    return {
      outputText: null,
      raw: response,
      validation: { ok: false, error: `MAX_TOKENS_EXCEEDED: Used ${totalTokens} > ${MAX_TOKENS}` },
      usage: { tokensIn, tokensOut, totalTokens, cost },
      logId: logRef.id,
      toolCalls: [],
      error: 'Token budget exceeded',
    };
  }
  if (cost && cost > MAX_COST) {
    return {
      outputText: null,
      raw: response,
      validation: { ok: false, error: `MAX_COST_EXCEEDED: Used $${cost} > $${MAX_COST}` },
      usage: { tokensIn, tokensOut, totalTokens, cost },
      logId: logRef.id,
      toolCalls: [],
      error: 'Cost budget exceeded',
    };
  }

  // Optionally, update workspace cost/token usage
  if (workspaceId && (tokensIn || tokensOut || cost)) {
    const wsRef = db().collection("workspaces").doc(workspaceId);
    await wsRef.set({
      llmTokens: (tokensIn || 0) + (tokensOut || 0),
      llmCost: cost || 0,
      llmLastUsed: now(),
    }, { merge: true });
  }

  // Tool-call extraction (if present and valid)
  let toolCalls: any[] = [];
  if (validation.ok && validation.value && Array.isArray(validation.value.toolRequests)) {
    toolCalls = validation.value.toolRequests;
  }

  return {
    outputText,
    raw: response,
    validation,
    usage: { tokensIn, tokensOut, totalTokens, cost },
    logId: logRef.id,
    toolCalls,
  };
}
