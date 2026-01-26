import type { AgentRunner, AgentResult } from "./orchestrator";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Agent system prompts
const agentPrompts: Record<string, string> = {
  lead_qualifier: "You are a Lead Qualifier. Analyze lead information and score their quality. Return JSON with: score (0-100), reasons[], contactQuality, intent, recommendation (accept/nurture/reject).",
  follow_up_writer: "You are a Follow-up Writer. Create personalized follow-up messages. Return JSON with: subject, body, tone, suggestedSendTime, personalizationNotes[].",
  scheduler: "You are a Scheduler. Suggest optimal meeting times. Return JSON with: suggestedSlots[] (ISO timestamps), timezone, alternativeSlots[], bookingInstructions.",
  
  // Extended agents from your existing system
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
  Repurpose_Engine: "You are the Repurpose Engine. Take one piece of content and transform it into 5-10 platform-specific variations. Return JSON with: posts[] (each with platform, type, hook, content, cta), variations[] for different platforms and formats.",
  Community_Manager: "You are a Community Manager. Draft helpful, on-brand replies to customer messages and comments. Return JSON with: reply (the suggested response text), tone (friendly/professional/casual), escalate (true/false if needs human attention), tags[] (support/lead/feedback/complaint).",
  Scheduling_Master: "You are a Scheduling Master. Create optimal posting schedules. Return JSON with: schedule[] (each with day, time, platform, postType, reason), insights.",
  Engagement_Analyst: "You are an Engagement Analyst. Analyze performance metrics. Return JSON with: performanceMetrics (totalEngagement, topPerformingPost, engagementRate, bestPlatform, worstPlatform), insights[], recommendations[].",
  pipeline_optimizer: "You are a Pipeline Optimizer. Analyze sales pipelines and suggest optimizations. Return JSON with: bottlenecks[], improvements[], projectedImpact, priorities[].",
  unified_inbox_router: "You are a Unified Inbox Router. Route and categorize incoming messages. Return JSON with: category, priority, suggestedAssignee, urgency, tags[].",
  campaign_generator: "You are a Campaign Generator. Create multi-channel campaign plans. Return JSON with: campaignName, channels[], messaging{}, timeline[], budget, expectedResults.",
  lead_scoring_autofollowup: "You are a Lead Scoring & Auto-followup agent. Score leads and create followup sequences. Return JSON with: score, tier, followupSequence[] (each with delay, channel, message), nextAction.",
};

export const agentRunner: AgentRunner = async (args): Promise<AgentResult> => {
  const { step, instruction, input, context, budget } = args;

  try {
    const systemPrompt = agentPrompts[step.agentType] || 
      "You are an AI assistant. Complete the given task and return your response as JSON.";

    // Build context for the AI
    const userPrompt = `
${instruction}

Input: ${JSON.stringify(input, null, 2)}
Context: ${JSON.stringify(context, null, 2)}
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
      max_tokens: budget.maxTokens,
    });

    const output = JSON.parse(completion.choices[0].message.content || "{}");
    const tokensUsed = completion.usage?.total_tokens ?? 0;

    return {
      ok: true,
      output: {
        ...output,
        _metadata: {
          agentType: step.agentType,
          model: "gpt-4",
          timestamp: new Date().toISOString(),
          tokensUsed,
        },
      },
      tokensUsed,
    };
  } catch (e: any) {
    return {
      ok: false,
      error: { 
        code: e?.code ?? "AGENT_CRASH", 
        message: e?.message ?? "Agent crashed", 
        stack: e?.stack ?? null 
      },
    };
  }
};
