import { DefaultLLMOutputSchema } from "./llm";
import { describe, it, expect, vi } from "vitest";
vi.mock("openai", () => ({
  default: class MockOpenAI {
    constructor() {}
    // Add any mocked methods if needed
  }
}));
import { z } from "zod";

describe("runLLM pipeline", () => {
  // OpenAI client is mocked above
  it("should validate structured output and extract tool calls", async () => {
    // Simulate a valid LLM output
    const fakeResponse = {
      summary: "Test summary",
      toolRequests: [
        { name: "testTool", input: { foo: "bar" } }
      ],
      outputText: "Some output"
    };
    // Mock OpenAI client and Firestore if needed (not shown here)
    // Instead, directly test validation logic
    const validation = DefaultLLMOutputSchema.safeParse(fakeResponse);
    expect(validation.success).toBe(true);
    expect(validation.data?.toolRequests?.length).toBe(1);
    expect(validation.data?.summary).toBe("Test summary");
  });

  it("should fail validation for missing summary", async () => {
    const badResponse = {
      toolRequests: []
    };
    const validation = DefaultLLMOutputSchema.safeParse(badResponse);
    expect(validation.success).toBe(false);
    expect(validation.error?.issues.length).toBeGreaterThan(0);
  });
});
