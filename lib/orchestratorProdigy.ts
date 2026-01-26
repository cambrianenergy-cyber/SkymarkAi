// lib/orchestratorProdigy.ts

import { db } from "./firebase";
import { agentRunner } from "./agentRunner";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getWorkspaceSubscriptions } from "./subscriptionHelper";

export interface AgentRecommendation {
  recommendedAgent: string;
  agentName: string;
  agentIcon: string;
  reason: string;
  benefit: string;
  estimatedImprovement: string;
  currentAgentUsed?: string;
  taskType: string;
  priority: 'high' | 'medium' | 'low';
}

export interface OrchestratorDecision {
  taskId: string;
  taskType: string;
  template?: string;
  requiredAgents: string[];
  assignedAgents: string[];
  missingAgents: string[];
  recommendations: AgentRecommendation[];
  executionPlan: ExecutionStep[];
  estimatedDuration: number;
  confidence: number;
}

export interface ExecutionStep {
  stepId: string;
  order: number;
  agentType: string;
  agentName: string;
  action: string;
  inputs: any;
  dependencies: string[];
  canRunInParallel: boolean;
  estimatedDuration: number;
}

/**
 * THE ORCHESTRATOR - Prodigy-level AI that oversees ALL operations
 * 
 * Responsibilities:
 * 1. Analyzes every task and selects optimal agents
 * 2. Detects when better agents are available (but not subscribed)
 * 3. Creates intelligent execution plans
 * 4. Monitors all agent performance
 * 5. Makes real-time optimizations
 * 6. Overrides Campaign Manager when necessary
 */
export class OrchestratorProdigy {
  private workspaceId: string;
  private subscribedAgents: string[];

  constructor(workspaceId: string, subscribedAgents: string[] = []) {
    this.workspaceId = workspaceId;
    this.subscribedAgents = subscribedAgents;
  }

  /**
   * Primary decision-making function
   * Called for EVERY task execution
   */
  async makeDecision(params: {
    taskType: string;
    template?: string;
    inputs: any;
    context?: any;
  }): Promise<OrchestratorDecision> {
    console.log('[ORCHESTRATOR]  Analyzing task:', params.taskType);

    // 1. Determine required agents for this task
    const requiredAgents = await this.determineRequiredAgents(params);

    // 2. Check which agents user has
    const assignedAgents = requiredAgents.filter(agent =>
      this.subscribedAgents.includes(agent)
    );

    // 3. Identify missing agents
    const missingAgents = requiredAgents.filter(agent =>
      !this.subscribedAgents.includes(agent)
    );

    // 4. Generate recommendations for missing/better agents
    const recommendations = await this.generateRecommendations(
      params,
      requiredAgents,
      assignedAgents,
      missingAgents
    );

    // 5. Create execution plan with available agents
    const executionPlan = await this.createExecutionPlan(
      params,
      assignedAgents
    );

    // 6. Calculate confidence and duration
    const confidence = this.calculateConfidence(assignedAgents, requiredAgents);
    const estimatedDuration = executionPlan.reduce(
      (sum, step) => sum + step.estimatedDuration,
      0
    );

    const decision: OrchestratorDecision = {
      taskId: `task_${Date.now()}`,
      taskType: params.taskType,
      template: params.template,
      requiredAgents,
      assignedAgents,
      missingAgents,
      recommendations,
      executionPlan,
      estimatedDuration,
      confidence,
    };

    // 7. Log the decision
    await this.logDecision(decision);

    return decision;
  }

  /**
   * Determine which agents are needed for a task
   */
  private async determineRequiredAgents(params: {
    taskType: string;
    template?: string;
    inputs: any;
  }): Promise<string[]> {
    const { taskType, template } = params;

    // Smart agent selection based on task type
    const agentMap: Record<string, string[]> = {
      // Campaign tasks
      'create_campaign': ['Campaign_Director', 'Brand_Voice_Guardian', 'Content_Creator'],
      'social_campaign': ['Campaign_Director', 'Social_Manager', 'Hashtag_SEO', 'Scheduler'],
      'content_campaign': ['Campaign_Director', 'Content_Creator', 'Copywriter', 'Brand_Voice_Guardian'],
      
      // Content creation
      'create_post': ['Content_Creator', 'Copywriter', 'Hashtag_SEO'],
      'write_content': ['Copywriter', 'Brand_Voice_Guardian', 'Hashtag_SEO'],
      'create_video_script': ['Copywriter', 'Content_Creator', 'Trend_Hunter'],
      
      // Lead management
      'generate_leads': ['Lead_Creator', 'Engagement_Analyst'],
      'nurture_leads': ['Lead_Creator', 'Copywriter', 'Social_Manager'],
      'qualify_leads': ['Lead_Creator', 'Engagement_Analyst'],
      
      // Social media
      'schedule_posts': ['Scheduler', 'Social_Manager', 'Hashtag_SEO'],
      'engage_audience': ['Social_Manager', 'Engagement_Analyst', 'Trend_Hunter'],
      'monitor_competitors': ['Competitor_Watchdog', 'Trend_Hunter', 'Engagement_Analyst'],
      
      // Analytics
      'analyze_performance': ['Engagement_Analyst', 'Algorithm_Hunter'],
      'track_trends': ['Trend_Hunter', 'Algorithm_Hunter', 'Competitor_Watchdog'],
      
      // Workflows
      'run_workflow': ['Campaign_Director'], // Campaign Director orchestrates workflows
      'execute_template': ['Campaign_Director', 'Content_Creator', 'Scheduler'],
    };

    // Get base agents for task type
    let agents = agentMap[taskType] || ['Campaign_Director'];

    // If template specified, load template agents
    if (template) {
      const templateAgents = await this.getTemplateAgents(template);
      agents = [...new Set([...agents, ...templateAgents])];
    }

    return agents;
  }

  /**
   * Get agents specified in a template
   */
  private async getTemplateAgents(templateId: string): Promise<string[]> {
    try {
      const templateRef = doc(db, 'templates', templateId);
      const templateSnap = await getDoc(templateRef);

      if (!templateSnap.exists()) return [];

      const templateData = templateSnap.data();
      const steps = templateData.steps || [];

      // Extract unique agent types from template steps
      const agents = steps
        .map((step: any) => step.agentType)
        .filter((agent: string) => agent) as string[];

      return [...new Set(agents)];
    } catch (error) {
      console.error('[ORCHESTRATOR] Error loading template:', error);
      return [];
    }
  }

  /**
   * Generate recommendations for better/missing agents
   * NOTE: Never recommends Orchestrator_Prodigy (works invisibly for everyone)
   */
  private async generateRecommendations(
    params: any,
    requiredAgents: string[],
    assignedAgents: string[],
    missingAgents: string[]
  ): Promise<AgentRecommendation[]> {
    const recommendations: AgentRecommendation[] = [];

    // Define agent capabilities and benefits
    // NOTE: Orchestrator_Prodigy is NOT included - he works behind the scenes for everyone
    const agentInfo: Record<string, { name: string; icon: string; superpower: string; benefit: string }> = {
      'Campaign_Director': {
        name: 'Campaign Director',
        icon: '',
        superpower: 'Strategic campaign planning',
        benefit: 'Creates comprehensive strategies that increase ROI by 50%'
      },
      'Campaign_Manager': {
        name: 'Campaign Manager',
        icon: '',
        superpower: 'Multi-channel campaign orchestration',
        benefit: 'Coordinates all agents and ensures brand consistency across channels'
      },
      'Content_Creator': {
        name: 'Content Creator',
        icon: '',
        superpower: 'High-quality content generation',
        benefit: 'Creates engaging, platform-optimized content that drives results'
      },
      'Copywriter': {
        name: 'Copywriter',
        icon: '',
        superpower: 'Persuasive copy that converts',
        benefit: 'Writes compelling copy proven to increase engagement by 40%'
      },
      'Brand_Voice_Guardian': {
        name: 'Brand Voice Guardian',
        icon: '',
        superpower: 'Brand consistency enforcement',
        benefit: 'Ensures all content matches your unique brand voice and values'
      },
      'Social_Manager': {
        name: 'Social Manager',
        icon: '',
        superpower: 'Social media optimization',
        benefit: 'Maximizes social reach and engagement across all platforms'
      },
      'Scheduler': {
        name: 'Scheduling Master',
        icon: '',
        superpower: 'Optimal timing algorithm',
        benefit: 'Posts at peak engagement times, increasing visibility by 60%'
      },
      'Hashtag_SEO': {
        name: 'Hashtag SEO',
        icon: '#',
        superpower: 'Viral hashtag discovery',
        benefit: 'Finds trending hashtags that expand your reach exponentially'
      },
      'Engagement_Analyst': {
        name: 'Engagement Analyst',
        icon: '',
        superpower: 'Performance insights',
        benefit: 'Identifies what content performs best and why'
      },
      'Trend_Hunter': {
        name: 'Trend Hunter',
        icon: '',
        superpower: 'Real-time trend detection',
        benefit: 'Catches viral trends early, giving you first-mover advantage'
      },
      'Competitor_Watchdog': {
        name: 'Competitor Watchdog',
        icon: '',
        superpower: 'Competitive intelligence',
        benefit: 'Monitors competitors and alerts you to their strategies'
      },
      'Lead_Creator': {
        name: 'Lead Creator',
        icon: '',
        superpower: 'Lead generation & qualification',
        benefit: 'Generates high-quality leads and identifies buying signals'
      },
      'Algorithm_Hunter': {
        name: 'Algorithm Hunter',
        icon: '',
        superpower: 'Platform algorithm mastery',
        benefit: 'Reverse-engineers platform algorithms for maximum visibility'
      },
    };

    // Generate recommendations for missing agents (excluding Orchestrator)
    for (const agentType of missingAgents) {
      // Never recommend Orchestrator - he's always working invisibly
      if (agentType === 'Orchestrator_Prodigy') continue;
      
      const info = agentInfo[agentType];
      if (!info) continue;

      // Determine priority based on task type
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (params.taskType.includes('campaign')) {
        priority = agentType === 'Campaign_Director' ? 'high' : 'medium';
      } else if (params.taskType.includes('content')) {
        priority = ['Content_Creator', 'Copywriter'].includes(agentType) ? 'high' : 'medium';
      }

      recommendations.push({
        recommendedAgent: agentType,
        agentName: info.name,
        agentIcon: info.icon,
        reason: `${info.name} is required for optimal ${params.taskType} execution`,
        benefit: info.benefit,
        estimatedImprovement: this.estimateImprovement(agentType, params.taskType),
        taskType: params.taskType,
        priority,
      });
    }

    // Check for upgrade opportunities (even if not strictly required)
    const upgradeOpportunities = this.checkUpgradeOpportunities(params, assignedAgents);
    recommendations.push(...upgradeOpportunities);

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Check if there are better agents available for upgrade
   */
  private checkUpgradeOpportunities(params: any, assignedAgents: string[]): AgentRecommendation[] {
    const opportunities: AgentRecommendation[] = [];

    // Example: If doing social campaign without Trend Hunter, recommend it
    if (params.taskType.includes('social') && !assignedAgents.includes('Trend_Hunter')) {
      opportunities.push({
        recommendedAgent: 'Trend_Hunter',
        agentName: 'Trend Hunter',
        agentIcon: '',
        reason: 'Catch viral trends before your competitors',
        benefit: 'Increases content reach by 3x by leveraging trending topics',
        estimatedImprovement: '+200% reach',
        currentAgentUsed: 'Social_Manager',
        taskType: params.taskType,
        priority: 'medium',
      });
    }

    // Example: If creating content without Brand Voice Guardian
    if (params.taskType.includes('content') && !assignedAgents.includes('Brand_Voice_Guardian')) {
      opportunities.push({
        recommendedAgent: 'Brand_Voice_Guardian',
        agentName: 'Brand Voice Guardian',
        agentIcon: '',
        reason: 'Maintain consistent brand voice across all content',
        benefit: 'Ensures brand consistency, building trust and recognition',
        estimatedImprovement: '+40% brand recall',
        taskType: params.taskType,
        priority: 'high',
      });
    }

    return opportunities;
  }

  /**
   * Estimate improvement percentage
   */
  private estimateImprovement(agentType: string, taskType: string): string {
    const improvementMap: Record<string, string> = {
      'Campaign_Director': '+50% campaign success rate',
      'Content_Creator': '+60% content quality',
      'Copywriter': '+40% conversion rate',
      'Brand_Voice_Guardian': '+40% brand consistency',
      'Social_Manager': '+70% social engagement',
      'Scheduler': '+60% post visibility',
      'Hashtag_SEO': '+100% organic reach',
      'Engagement_Analyst': '+50% data-driven decisions',
      'Trend_Hunter': '+200% viral potential',
      'Competitor_Watchdog': '+80% competitive advantage',
      'Lead_Creator': '+90% lead quality',
      'Algorithm_Hunter': '+150% platform visibility',
    };

    return improvementMap[agentType] || '+30% performance';
  }

  /**
   * Create execution plan with available agents
   */
  private async createExecutionPlan(
    params: any,
    assignedAgents: string[]
  ): Promise<ExecutionStep[]> {
    const steps: ExecutionStep[] = [];

    // Campaign Director always goes first if available
    if (assignedAgents.includes('Campaign_Director')) {
      steps.push({
        stepId: 'step_director',
        order: 1,
        agentType: 'Campaign_Director',
        agentName: 'Campaign Director',
        action: 'Plan and coordinate execution',
        inputs: params.inputs,
        dependencies: [],
        canRunInParallel: false,
        estimatedDuration: 2000,
      });
    }

    // Add other agents in optimal order
    let order = 2;
    for (const agent of assignedAgents) {
      if (agent === 'Campaign_Director') continue;

      steps.push({
        stepId: `step_${agent.toLowerCase()}`,
        order: order++,
        agentType: agent,
        agentName: this.getAgentDisplayName(agent),
        action: this.getAgentAction(agent, params.taskType),
        inputs: params.inputs,
        dependencies: order === 2 ? [] : [steps[steps.length - 1].stepId],
        canRunInParallel: this.canRunInParallel(agent),
        estimatedDuration: this.estimateDuration(agent),
      });
    }

    return steps;
  }

  private getAgentDisplayName(agentType: string): string {
    const names: Record<string, string> = {
      'Campaign_Director': 'Campaign Director',
      'Content_Creator': 'Content Creator',
      'Copywriter': 'Copywriter',
      'Brand_Voice_Guardian': 'Brand Voice Guardian',
      'Social_Manager': 'Social Manager',
      'Scheduler': 'Scheduling Master',
      'Hashtag_SEO': 'Hashtag SEO',
      'Engagement_Analyst': 'Engagement Analyst',
      'Trend_Hunter': 'Trend Hunter',
      'Competitor_Watchdog': 'Competitor Watchdog',
      'Lead_Creator': 'Lead Creator',
      'Algorithm_Hunter': 'Algorithm Hunter',
    };
    return names[agentType] || agentType;
  }

  private getAgentAction(agentType: string, taskType: string): string {
    const actions: Record<string, string> = {
      'Campaign_Director': 'Orchestrate campaign execution',
      'Content_Creator': 'Generate content assets',
      'Copywriter': 'Write persuasive copy',
      'Brand_Voice_Guardian': 'Ensure brand consistency',
      'Social_Manager': 'Optimize for social platforms',
      'Scheduler': 'Schedule at optimal times',
      'Hashtag_SEO': 'Add viral hashtags',
      'Engagement_Analyst': 'Analyze performance data',
      'Trend_Hunter': 'Identify trending topics',
      'Competitor_Watchdog': 'Monitor competitor activity',
      'Lead_Creator': 'Generate qualified leads',
      'Algorithm_Hunter': 'Optimize for platform algorithms',
    };
    return actions[agentType] || 'Execute task';
  }

  private canRunInParallel(agentType: string): boolean {
    const parallelAgents = ['Hashtag_SEO', 'Trend_Hunter', 'Competitor_Watchdog', 'Engagement_Analyst'];
    return parallelAgents.includes(agentType);
  }

  private estimateDuration(agentType: string): number {
    const durations: Record<string, number> = {
      'Campaign_Director': 2000,
      'Content_Creator': 3000,
      'Copywriter': 2500,
      'Brand_Voice_Guardian': 1500,
      'Social_Manager': 2000,
      'Scheduler': 1000,
      'Hashtag_SEO': 1500,
      'Engagement_Analyst': 2000,
      'Trend_Hunter': 2500,
      'Competitor_Watchdog': 3000,
      'Lead_Creator': 2500,
      'Algorithm_Hunter': 3500,
    };
    return durations[agentType] || 2000;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(assignedAgents: string[], requiredAgents: string[]): number {
    if (requiredAgents.length === 0) return 100;
    const coverage = assignedAgents.length / requiredAgents.length;
    return Math.min(Math.round(coverage * 100), 100);
  }

  /**
   * Log decision to Firestore
   */
  private async logDecision(decision: OrchestratorDecision): Promise<void> {
    try {
      await addDoc(collection(db, 'orchestrator_decisions'), {
        ...decision,
        workspaceId: this.workspaceId,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('[ORCHESTRATOR] Error logging decision:', error);
    }
  }

  /**
   * Execute the plan (integrates with agent execution system)
   */
  async executePlan(decision: OrchestratorDecision): Promise<any> {
    console.log('[ORCHESTRATOR]  Executing plan with', decision.assignedAgents.length, 'agents');

    const results: any[] = [];

    for (const step of decision.executionPlan) {
      try {
        console.log(`[ORCHESTRATOR] Running ${step.agentName}...`);
        const start = Date.now();
        const agentResult = await agentRunner({
          workspaceId: this.workspaceId,
          runId: decision.taskId,
          userRole: "system",
          input: step.inputs,
          step: {
            stepId: step.stepId,
            order: step.order,
            agentType: step.agentType,
            instruction: step.action,
            input: step.inputs,
          },
        });
        results.push({
          stepId: step.stepId,
          agentType: step.agentType,
          status: agentResult.success ? 'completed' : 'failed',
          output: agentResult.output,
          error: agentResult.error,
          duration: Date.now() - start,
        });
      } catch (error) {
        console.error(`[ORCHESTRATOR] Error in ${step.agentName}:`, error);
        results.push({
          stepId: step.stepId,
          agentType: step.agentType,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      taskId: decision.taskId,
      status: 'completed',
      results,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
    };
  }
}

/**
 * Initialize Orchestrator for a workspace
 */
export async function initializeOrchestrator(workspaceId: string): Promise<OrchestratorProdigy> {
  const subscriptions = await getWorkspaceSubscriptions(workspaceId);
  return new OrchestratorProdigy(workspaceId, subscriptions.agentIds);
}

