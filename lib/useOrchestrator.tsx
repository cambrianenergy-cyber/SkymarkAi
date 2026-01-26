// lib/useOrchestrator.tsx
'use client';

import { useState, useCallback } from 'react';
import { initializeOrchestrator, type OrchestratorDecision, type AgentRecommendation } from './orchestratorProdigy';

interface UseOrchestratorResult {
  analyzeTask: (params: {
    taskType: string;
    template?: string;
    inputs: any;
    context?: any;
  }) => Promise<OrchestratorDecision>;
  executeWithOrchestrator: (params: any) => Promise<any>;
  showRecommendations: AgentRecommendation[];
  clearRecommendations: () => void;
  isAnalyzing: boolean;
  lastDecision: OrchestratorDecision | null;
}

export function useOrchestrator(workspaceId: string | null): UseOrchestratorResult {
  const [showRecommendations, setShowRecommendations] = useState<AgentRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastDecision, setLastDecision] = useState<OrchestratorDecision | null>(null);

  const analyzeTask = useCallback(async (params: {
    taskType: string;
    template?: string;
    inputs: any;
    context?: any;
  }): Promise<OrchestratorDecision> => {
    if (!workspaceId) {
      throw new Error('Workspace ID required');
    }

    setIsAnalyzing(true);
    try {
      console.log('[useOrchestrator]  Analyzing task...');
      
      const orchestrator = await initializeOrchestrator(workspaceId);
      const decision = await orchestrator.makeDecision(params);

      console.log('[useOrchestrator]  Decision made:', {
        assignedAgents: decision.assignedAgents.length,
        missingAgents: decision.missingAgents.length,
        recommendations: decision.recommendations.length,
      });

      // Store decision
      setLastDecision(decision);

      // Show recommendations if there are any high/medium priority ones
      const importantRecs = decision.recommendations.filter(
        r => r.priority === 'high' || r.priority === 'medium'
      );

      if (importantRecs.length > 0) {
        setShowRecommendations(importantRecs);
      }

      return decision;
    } finally {
      setIsAnalyzing(false);
    }
  }, [workspaceId]);

  const executeWithOrchestrator = useCallback(async (params: any) => {
    if (!workspaceId) {
      throw new Error('Workspace ID required');
    }

    console.log('[useOrchestrator]  Executing with orchestrator...');

    // First analyze the task
    const decision = await analyzeTask(params);

    // Then execute it
    const orchestrator = await initializeOrchestrator(workspaceId);
    const result = await orchestrator.executePlan(decision);

    return {
      decision,
      result,
    };
  }, [workspaceId, analyzeTask]);

  const clearRecommendations = useCallback(() => {
    setShowRecommendations([]);
  }, []);

  return {
    analyzeTask,
    executeWithOrchestrator,
    showRecommendations,
    clearRecommendations,
    isAnalyzing,
    lastDecision,
  };
}

