import { adminDb, adminFieldValue } from "../src/lib/firebaseAdmin";
import { AI_COLLECTIONS, validate } from "../src/lib/aiCollections.firestore";
import { ExecutionPolicyDoc } from "../src/lib/aiCollections.schemas";

async function createDefaultExecutionPolicy() {
  const now = () => adminFieldValue.serverTimestamp();
  const data = validate(ExecutionPolicyDoc, {
    workspaceId: "sample_workspace",
    policyKey: "default",
    name: "Default Policy",
    description: "Sample default execution policy.",
    llm: {
      model: "gpt-5",
      maxTokens: 8000,
      temperature: 0.3,
    },
    budgets: {
      maxToolInvocationsPerRun: 50,
      maxRuntimeMsPerRun: 600000,
      maxRetriesPerStep: 2,
    },
    retry: {
      strategy: "exponential",
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      jitter: true,
      retryOn: ["tool_failure", "timeout"],
    },
    permissions: {
      enforceAllowlist: true,
      requireHumanForHighRisk: true,
    },
    isEnabled: true,
    createdAt: now(),
    updatedAt: now(),
  });

  const docId = `${data.workspaceId}_${data.policyKey}`;
  await adminDb.collection(AI_COLLECTIONS.execution_policies).doc(docId).set(data, { merge: true });
  console.log("Execution policy created:", docId);
}

createDefaultExecutionPolicy().catch(console.error);
