// CLEAN REBUILD - tools.ts
import { runLLM } from "./llm";
import { db, now } from "./firestore";
import { loadConfig } from "../config.server";

export const tools = {
	llm_function: async ({ input, agentInstructions, outputSchema, ...rest }: any) => {
		// Tool sandbox policy enforcement
		const config = await loadConfig();
		const env = config.env;
		// Example: restrict certain models/tools in production
		if (env === "production") {
			if (input?.model && ["gpt-3.5-turbo", "gpt-4-1106-preview"].includes(input.model)) {
				throw new Error("This model is not allowed in production environment.");
			}
			// Add more prod restrictions as needed
		}
		if (env === "development") {
			// In dev, allow all models/tools, but log a warning for risky actions
			if (input?.model && input.model.startsWith("gpt-4")) {
				console.warn("[DEV SANDBOX] Using GPT-4 model in development mode.");
			}
		}
		// input: { agentInstructions, task, memory }
		const {
			task = {},
			memory = {},
			responseFormat = "text",
			model = "gpt-4",
			maxOutputTokens = 1024,
			temperature = 0.7,
			workspaceId,
			agentId,
			metadata = {},
		} = input || {};
		const instructions = agentInstructions || input?.agentInstructions || "";
		const prompt = input?.task?.description || input?.task?.title || "";

		// Log tool call to Firestore (tool_calls collection)
		const toolCallRef = db().collection("tool_calls").doc();
		await toolCallRef.set({
			toolCallId: toolCallRef.id,
			workspaceId: workspaceId || null,
			agentId: agentId || null,
			toolKey: "llm_function",
			model,
			task,
			memory,
			instructions,
			input: prompt,
			responseFormat,
			maxOutputTokens,
			temperature,
			metadata: { ...metadata, ...rest },
			status: "started",
			createdAt: now(),
			updatedAt: now(),
		});

		const result = await runLLM({
			model,
			instructions,
			input: prompt,
			responseFormat,
			maxOutputTokens,
			temperature,
			metadata: { ...metadata, ...rest },
			workspaceId,
			agentId,
			outputSchema,
		});

		// Update tool call with result
		await toolCallRef.update({
			status: "completed",
			output: result?.outputText || null,
			raw: result?.raw || null,
			validation: result?.validation || null,
			usage: result?.usage || null,
			updatedAt: now(),
		});

		return result;
	},
};
