// src/lib/config.server.ts
// Server-only config and secret loading

export type AppConfig = {
  openaiApiKey: string;
  llmModel: string;
  orchestratorSecret: string;
  env: "development" | "staging" | "production" | "test";
};

const ENV = (process.env.NODE_ENV || "development") as "development" | "staging" | "production" | "test";

// Local config fallback (for dev)
const localConfig: Partial<AppConfig> = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  llmModel: process.env.UQENTRA_LLM_MODEL,
  orchestratorSecret: process.env.ORCHESTRATOR_SECRET,
  env: ENV as any,
};

// Google Secret Manager loader
export async function loadSecretsFromGCP(): Promise<Partial<AppConfig>> {
  const { SecretManagerServiceClient } = await import("@google-cloud/secret-manager");
  const client = new SecretManagerServiceClient();
  async function getSecret(name: string) {
    const [version] = await client.accessSecretVersion({ name });
    return version.payload?.data?.toString() || "";
  }
  // Use your actual GCP project ID below
  return {
    openaiApiKey: await getSecret("projects/skymark-ai/secrets/OPENAI_API_KEY/versions/latest"),
    llmModel: await getSecret("projects/skymark-ai/secrets/UQENTRA_LLM_MODEL/versions/latest"),
    orchestratorSecret: await getSecret("projects/skymark-ai/secrets/ORCHESTRATOR_SECRET/versions/latest"),
    env: ENV as any,
  };
}

// Main config loader
export async function loadConfig(): Promise<AppConfig> {
  let config: Partial<AppConfig> = { ...localConfig };
  if (ENV === "production" || ENV === "staging") {
    const secrets = await loadSecretsFromGCP();
    config = { ...config, ...secrets };
  }
  // Validate required fields
  const missing = ["openaiApiKey", "llmModel", "orchestratorSecret"].filter((k) => !config[k as keyof AppConfig]);
  if (missing.length) {
    throw new Error(`Missing required config: ${missing.join(", ")}`);
  }
  return config as AppConfig;
}
