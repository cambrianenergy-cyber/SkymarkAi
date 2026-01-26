// src/lib/env.ts
// Throws on startup if required env vars are missing

const REQUIRED_ENV_VARS = [
  "OPENAI_API_KEY",
  "UQENTRA_LLM_MODEL",
  "ORCHESTRATOR_SECRET",
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key] || process.env[key].includes("changeme") || process.env[key].trim() === "");
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Please set them in your .env file or environment.`
    );
  }
}

// Call this at the top of your main entry/server file:
// import { validateEnv } from "../lib/env";
// validateEnv();
