import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import path from "path";

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), "Web", "Secrets", "serviceAccountKey.json");
  initializeApp({
    credential: cert(serviceAccountPath),
  });
}

const db = getFirestore();

interface AgentRunnerInput {
  workspaceId: string;
  runId: string;
  step: {
    stepId: string;
    order: number;
    agentType: string;
    instruction: string;
    input?: any;
  };
}

interface AgentRunnerOutput {
  success: boolean;
  output: any;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// Import OpenAI
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

async function executeAgentWithAI(input: AgentRunnerInput): Promise<AgentRunnerOutput> {
  try {
    // Define agent system prompts
    const agentPrompts: Record<string, string> = {
      Campaign_Director: "You are a Campaign Director. Create detailed campaign strategies with goals, task assignments, messaging pillars, and timelines. Return JSON with: campaignPlan, goals[], messagingPillars[] (3-5 key themes), taskAssignments[], timeline, kpis[].",
      Trend_Hunter: "You are a Trend Hunter. Identify trending topics across social platforms. Return JSON with: trends[] (each with topic, platform, strength, reason, contentAngles[]), recommendations.",
      Competitor_Watchdog: "You are a Competitor Watchdog. Analyze competitor activities and opportunities. Return JSON with: competitors[] (each with name, offers[], hooks[], formats[], performance), insights[], opportunities[].",
      Copywriter: "You are a Copywriter. Generate compelling copy variations with hooks and CTAs. Return JSON with: messagingPillars[], hooks[] (each with text, platform, emotionalAppeal), ctas[], variations[].",
      Content_Creator: "You are a Content Creator. Create engaging posts for different platforms. Return JSON with: posts[] (each with type, hook, content, cta, platform).",
      Visual_Designer: "You are a Visual Designer. Define creative direction and visual specifications. Return JSON with: creativeDirection (style, mood, colors[]), assetSpecs[] (each with platform, format, dimensions, visualElements[], overlaySpecs).",
      Video_Producer: "You are a Video Producer. Create video scripts and production plans. Return JSON with: scripts[] (each with title, platform, duration, hook, body, cta, shotList[], editingNotes).",
      Scheduler_Publisher: "You are a Scheduler/Publisher. Create optimal posting schedules. Return JSON with: schedule[] (each with day, time, platform, postType, reason), bestTimes{}, insights[], cadenceRecommendation.",
      Analytics_Analyst: "You are an Analytics Analyst. Define KPIs and optimization recommendations. Return JSON with: kpis[] (each with metric, target, platform), benchmarks{}, improvementAreas[], weeklyOptimizations[].",
      Hashtag_SEO: "You are a Hashtag SEO specialist. Generate optimal hashtags and keywords. Return JSON with: hashtagSets[] (each with postType, broad[], mid[], niche[]), seoKeywords[].",
      Brand_Voice_Guardian: "You are a Brand Voice Guardian. Review content for brand alignment. Return JSON with: reviewResult (brandAlignment, toneMatch, flaggedItems[], approvedItems[], suggestions[]).",
      Repurpose_Engine: "You are the Repurpose Engine. Take one piece of content and transform it into 5-10 platform-specific variations. Return JSON with: posts[] (each with platform, type, hook, content, cta), variations[] for different platforms and formats. Adapt the core message for Instagram, TikTok, LinkedIn, Email, Blog, etc.",
      Community_Manager: "You are a Community Manager. Draft helpful, on-brand replies to customer messages and comments. Return JSON with: reply (the suggested response text), tone (friendly/professional/casual), escalate (true/false if needs human attention), tags[] (support/lead/feedback/complaint).",
      Scheduling_Master: "You are a Scheduling Master. Create optimal posting schedules. Return JSON with: schedule[] (each with day, time, platform, postType, reason), insights.",
      Engagement_Analyst: "You are an Engagement Analyst. Analyze performance metrics. Return JSON with: performanceMetrics (totalEngagement, topPerformingPost, engagementRate, bestPlatform, worstPlatform), insights[], recommendations[].",
    };

    const systemPrompt = agentPrompts[input.step.agentType] || "You are an AI assistant. Complete the given task and return your response as JSON.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.step.instruction },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const output = JSON.parse(completion.choices[0].message.content || "{}");

    return {
      success: true,
      output: {
        ...output,
        instruction: input.step.instruction,
        model: "gpt-4",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error("AI execution error:", error);
    return {
      success: false,
      output: null,
      error: {
        message: error.message || "AI execution failed",
        code: error.code || "AI_ERROR",
        details: error,
      },
    };
  }
}

async function executeStepWithRetry(
  runId: string,
  stepId: string,
  maxRetries: number = 3
): Promise<{ success: boolean; message: string }> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const runRef = db.collection("workflow_runs").doc(runId);
      const runSnap = await runRef.get();

      if (!runSnap.exists) {
        return { success: false, message: "Run not found" };
      }

      const runData = runSnap.data()!;
      const step = runData.steps.find((s: any) => s.stepId === stepId);

      if (!step) {
        return { success: false, message: "Step not found" };
      }

      // Update step to running
      const updatedSteps = runData.steps.map((s: any) =>
        s.stepId === stepId
          ? { ...s, status: "running", startedAt: Timestamp.now(), retryAttempt: attempt }
          : s
      );

      await runRef.update({
        steps: updatedSteps,
        updatedAt: Timestamp.now(),
      });

      // Execute with AI
      const input: AgentRunnerInput = {
        workspaceId: runData.workspaceId,
        runId,
        step: {
          stepId: step.stepId,
          order: step.order,
          agentType: step.agentType,
          instruction: step.instruction,
          input: step.input,
        },
      };

      const result = await executeAgentWithAI(input);

      if (result.success) {
        // Success - update step
        const completedSteps = runData.steps.map((s: any) =>
          s.stepId === stepId
            ? {
                ...s,
                status: "completed",
                completedAt: Timestamp.now(),
                output: result.output,
                retryAttempt: attempt,
              }
            : s
        );

        const completedCount = completedSteps.filter((s: any) => s.status === "completed").length;

        await runRef.update({
          steps: completedSteps,
          "progress.completedSteps": completedCount,
          updatedAt: Timestamp.now(),
        });

        return { success: true, message: `Step completed on attempt ${attempt}` };
      } else {
        lastError = result.error;
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    } catch (error: any) {
      lastError = error;
      console.error(`Retry attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  // All retries failed
  try {
    const runRef = db.collection("workflow_runs").doc(runId);
    const runSnap = await runRef.get();
    const runData = runSnap.data()!;

    const failedSteps = runData.steps.map((s: any) =>
      s.stepId === stepId
        ? {
            ...s,
            status: "failed",
            completedAt: Timestamp.now(),
            error: lastError || { message: "Max retries exceeded", code: "MAX_RETRIES" },
            retryAttempt: maxRetries,
          }
        : s
    );

    await runRef.update({
      steps: failedSteps,
      status: "failed",
      error: lastError || { message: "Step failed after max retries", code: "MAX_RETRIES" },
      updatedAt: Timestamp.now(),
    });
  } catch (updateError) {
    console.error("Error updating failed step:", updateError);
  }

  return {
    success: false,
    message: `Step failed after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, action, stepId } = body;

    if (!runId) {
      return NextResponse.json({ success: false, message: "runId is required" }, { status: 400 });
    }

    const runRef = db.collection("workflow_runs").doc(runId);
    const runSnap = await runRef.get();

    if (!runSnap.exists) {
      return NextResponse.json({ success: false, message: "Run not found" }, { status: 404 });
    }

    const runData = runSnap.data()!;

    if (action === "executeNext") {
      // Find next pending step
      const nextStep = runData.steps.find((s: any) => s.status === "pending");

      if (!nextStep) {
        await runRef.update({
          status: "completed",
          completedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        return NextResponse.json({ success: true, message: "All steps completed" });
      }

      // Update run to running if queued
      if (runData.status === "queued") {
        await runRef.update({
          status: "running",
          startedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      // Execute with retry logic
      const result = await executeStepWithRetry(runId, nextStep.stepId);
      return NextResponse.json(result);
    } else if (action === "executeAll") {
      // Execute all remaining steps
      if (runData.status === "queued") {
        await runRef.update({
          status: "running",
          startedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      let continueExecution = true;
      let lastResult: any = { success: true, message: "Starting execution" };

      while (continueExecution) {
        const currentRunSnap = await runRef.get();
        const currentRunData = currentRunSnap.data()!;
        const nextStep = currentRunData.steps.find((s: any) => s.status === "pending");

        if (!nextStep) {
          await runRef.update({
            status: "completed",
            completedAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          continueExecution = false;
          lastResult = { success: true, message: "All steps completed" };
        } else {
          lastResult = await executeStepWithRetry(runId, nextStep.stepId);
          if (!lastResult.success) {
            continueExecution = false;
          }
        }
      }

      return NextResponse.json(lastResult);
    } else if (action === "executeStep" && stepId) {
      // Execute specific step
      const result = await executeStepWithRetry(runId, stepId);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action or missing parameters" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
