const admin = require('firebase-admin');
const { AI_COLLECTIONS } = require('../src/lib/aiCollections.firestore');
const { ExecutionPolicyDoc } = require('../src/lib/aiCollections.schemas');
const { z } = require('zod');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const adminDb = admin.firestore();
const adminFieldValue = admin.firestore.FieldValue;

function validate(schema, data) {
  return schema.parse(data);
}

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
      maxRetriesPerStep: 3,
    },
    retry: {
      strategy: "exponential",
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      jitter: true,
      retryOn: ["tool_failure", "model_failure", "invalid_input", "timeout"],
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
