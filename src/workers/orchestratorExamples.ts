/**
 * Example: How to use the new orchestrator system
 * 
 * This file demonstrates how to create workflows and execute them.
 */

import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ============================================
// 1. CREATE A WORKFLOW
// ============================================

export async function createLeadNurturingWorkflow(workspaceId: string) {
  const db = getFirestore();
  
  const workflowRef = await db.collection("workflows").add({
    workspaceId,
    name: "Lead Nurturing Sequence",
    description: "Qualify leads, write personalized follow-ups, and schedule meetings",
    status: "active",
    steps: [
      {
        stepId: "step_1",
        order: 1,
        agentType: "lead_qualifier",
        instruction: "Analyze the lead information and provide a quality score with detailed reasoning.",
        required: true,
        retryMax: 2,
        timeoutMs: 60000,
      },
      {
        stepId: "step_2",
        order: 2,
        agentType: "follow_up_writer",
        instruction: "Based on the lead score, write a personalized follow-up email that addresses their specific needs.",
        required: true,
        retryMax: 2,
        timeoutMs: 60000,
      },
      {
        stepId: "step_3",
        order: 3,
        agentType: "scheduler",
        instruction: "Suggest 3 meeting time slots for next week during business hours (9am-5pm EST).",
        required: false, // Optional - won't fail workflow if it fails
        retryMax: 1,
        timeoutMs: 30000,
      },
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log("✅ Created workflow:", workflowRef.id);
  return workflowRef.id;
}

// ============================================
// 2. CREATE A WORKFLOW RUN
// ============================================

export async function createWorkflowRun(workspaceId: string, workflowId: string, leadData: any) {
  const db = getFirestore();
  
  const runRef = await db.collection("workflow_runs").add({
    workspaceId,
    workflowId,
    status: "queued",
    currentStepIndex: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    
    // Input data for the workflow
    input: {
      lead: leadData,
      source: "website_form",
      timestamp: new Date().toISOString(),
    },
    
    // Initial context (empty)
    context: {},
    
    // Outputs will accumulate here
    outputs: {},
    
    // Budget limits
    budget: {
      maxSteps: 10,
      maxMs: 300000, // 5 minutes
      maxTokens: 10000,
    },
    
    // Usage tracking
    usage: {
      stepsExecuted: 0,
      msElapsed: 0,
      tokensUsed: 0,
    },
  });

  console.log("✅ Created workflow run:", runRef.id);
  return runRef.id;
}

// ============================================
// 3. EXECUTE THE WORKFLOW RUN (Call the API)
// ============================================

export async function executeWorkflow(workspaceId: string, runId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/orchestrator/execute-v2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspaceId,
      runId,
      environment: "prod",
    }),
  });

  const result = await response.json();
  console.log("✅ Execution result:", result);
  return result;
}

// ============================================
// 4. FULL EXAMPLE: END-TO-END
// ============================================

export async function fullWorkflowExample(workspaceId: string) {
  // Step 1: Create the workflow (do this once)
  const workflowId = await createLeadNurturingWorkflow(workspaceId);
  
  // Step 2: Create a run with lead data
  const leadData = {
    name: "John Doe",
    email: "john@example.com",
    company: "Acme Corp",
    role: "CTO",
    source: "LinkedIn",
    message: "Interested in learning more about your product",
    budget: "$50k",
  };
  
  const runId = await createWorkflowRun(workspaceId, workflowId, leadData);
  
  // Step 3: Execute the workflow
  const result = await executeWorkflow(workspaceId, runId);
  
  return { workflowId, runId, result };
}

// ============================================
// 5. CHECK RUN STATUS
// ============================================

export async function checkRunStatus(workspaceId: string, runId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/orchestrator/execute-v2?workspaceId=${workspaceId}&runId=${runId}`
  );
  
  const result = await response.json();
  console.log("📊 Run status:", result);
  return result;
}

// ============================================
// 6. VIEW STEP RESULTS
// ============================================

export async function getStepResults(runId: string) {
  const db = getFirestore();
  
  const stepsSnapshot = await db
    .collection("workflow_runs")
    .doc(runId)
    .collection("steps")
    .orderBy("order", "asc")
    .get();
  
  const steps = stepsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  console.log("📋 Step results:", steps);
  return steps;
}

// ============================================
// 7. EXAMPLE: CONTENT CREATION WORKFLOW
// ============================================

export async function createContentWorkflow(workspaceId: string) {
  const db = getFirestore();
  
  const workflowRef = await db.collection("workflows").add({
    workspaceId,
    name: "AI Content Creation Pipeline",
    description: "Generate campaign, create content, and optimize for platforms",
    status: "active",
    steps: [
      {
        stepId: "trend_research",
        order: 1,
        agentType: "Trend_Hunter",
        instruction: "Research trending topics in the tech industry for the next 7 days.",
        required: true,
      },
      {
        stepId: "campaign_planning",
        order: 2,
        agentType: "Campaign_Director",
        instruction: "Create a 5-day content campaign based on the trending topics identified.",
        required: true,
      },
      {
        stepId: "content_creation",
        order: 3,
        agentType: "Content_Creator",
        instruction: "Create 5 social media posts for LinkedIn and Twitter based on the campaign plan.",
        required: true,
      },
      {
        stepId: "repurpose",
        order: 4,
        agentType: "Repurpose_Engine",
        instruction: "Take the first post and repurpose it for Instagram, TikTok, and Email.",
        required: false,
      },
      {
        stepId: "scheduling",
        order: 5,
        agentType: "Scheduler_Publisher",
        instruction: "Create an optimal posting schedule for all content pieces.",
        required: true,
      },
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log("✅ Created content workflow:", workflowRef.id);
  return workflowRef.id;
}
