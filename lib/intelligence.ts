// Workspace Intelligence Engine
// Learns what works for each business and applies it automatically

import { db } from './firebase';
import { collection, doc, getDoc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

interface IntelligenceData {
  bestOffers: Array<{ offer: string; conversionRate: number; revenue: number; uses: number }>;
  bestHooks: Array<{ hook: string; engagementRate: number; replyRate: number; uses: number }>;
  bestPostingTimes: Array<{ dayOfWeek: string; hour: number; engagementScore: number; platform: string }>;
  bestAgentCombos: Array<{ agents: string[]; successRate: number; avgOutcome: number; uses: number }>;
  audienceInsights: Array<{ segment: string; responseRate: number; preferredChannels: string[]; bestMessaging: string[] }>;
}

export async function getWorkspaceIntelligence(workspaceId: string): Promise<IntelligenceData | null> {
  try {
    const intRef = doc(db, 'workspace_intelligence', workspaceId);
    const snap = await getDoc(intRef);
    if (snap.exists()) {
      return snap.data().learnings as IntelligenceData;
    }
    return null;
  } catch (e) {
    console.error('Failed to load intelligence:', e);
    return null;
  }
}

export async function learnFromCampaign(workspaceId: string, campaignData: {
  offer?: string;
  hook?: string;
  conversionRate?: number;
  revenue?: number;
  engagementRate?: number;
  replyRate?: number;
}) {
  try {
    const intRef = doc(db, 'workspace_intelligence', workspaceId);
    const snap = await getDoc(intRef);
    
    let intelligence: any = snap.exists() ? snap.data() : {
      workspaceId,
      learnings: {
        bestOffers: [],
        bestHooks: [],
        bestPostingTimes: [],
        bestAgentCombos: [],
        audienceInsights: [],
      },
      patterns: {
        conversionDrivers: [],
        dropoffPoints: [],
        successFactors: [],
      },
    };

    // Learn from offer
    if (campaignData.offer && campaignData.conversionRate !== undefined) {
      const existing = intelligence.learnings.bestOffers.find((o: any) => o.offer === campaignData.offer);
      if (existing) {
        existing.conversionRate = (existing.conversionRate * existing.uses + campaignData.conversionRate) / (existing.uses + 1);
        existing.revenue = (existing.revenue || 0) + (campaignData.revenue || 0);
        existing.uses += 1;
      } else {
        intelligence.learnings.bestOffers.push({
          offer: campaignData.offer,
          conversionRate: campaignData.conversionRate,
          revenue: campaignData.revenue || 0,
          uses: 1,
        });
      }
      // Sort by conversion rate
      intelligence.learnings.bestOffers.sort((a: any, b: any) => b.conversionRate - a.conversionRate);
      intelligence.learnings.bestOffers = intelligence.learnings.bestOffers.slice(0, 10); // Keep top 10
    }

    // Learn from hook
    if (campaignData.hook && (campaignData.engagementRate !== undefined || campaignData.replyRate !== undefined)) {
      const existing = intelligence.learnings.bestHooks.find((h: any) => h.hook === campaignData.hook);
      if (existing) {
        if (campaignData.engagementRate !== undefined) {
          existing.engagementRate = (existing.engagementRate * existing.uses + campaignData.engagementRate) / (existing.uses + 1);
        }
        if (campaignData.replyRate !== undefined) {
          existing.replyRate = (existing.replyRate * existing.uses + campaignData.replyRate) / (existing.uses + 1);
        }
        existing.uses += 1;
      } else {
        intelligence.learnings.bestHooks.push({
          hook: campaignData.hook,
          engagementRate: campaignData.engagementRate || 0,
          replyRate: campaignData.replyRate || 0,
          uses: 1,
        });
      }
      intelligence.learnings.bestHooks.sort((a: any, b: any) => b.engagementRate - a.engagementRate);
      intelligence.learnings.bestHooks = intelligence.learnings.bestHooks.slice(0, 10);
    }

    await setDoc(intRef, {
      ...intelligence,
      lastUpdated: serverTimestamp(),
    }, { merge: true });

    return intelligence;
  } catch (e) {
    console.error('Failed to learn from campaign:', e);
    return null;
  }
}

export async function learnFromWorkflowRun(workspaceId: string, runData: {
  agents: string[];
  outcome: number;
  success: boolean;
}) {
  try {
    const intRef = doc(db, 'workspace_intelligence', workspaceId);
    const snap = await getDoc(intRef);
    
    let intelligence: any = snap.exists() ? snap.data() : {
      workspaceId,
      learnings: {
        bestOffers: [],
        bestHooks: [],
        bestPostingTimes: [],
        bestAgentCombos: [],
        audienceInsights: [],
      },
      patterns: {
        conversionDrivers: [],
        dropoffPoints: [],
        successFactors: [],
      },
    };

    // Learn from agent combinations
    const comboKey = runData.agents.sort().join(',');
    const existing = intelligence.learnings.bestAgentCombos.find((c: any) => c.agents.sort().join(',') === comboKey);
    
    if (existing) {
      existing.successRate = (existing.successRate * existing.uses + (runData.success ? 1 : 0)) / (existing.uses + 1);
      existing.avgOutcome = (existing.avgOutcome * existing.uses + runData.outcome) / (existing.uses + 1);
      existing.uses += 1;
    } else {
      intelligence.learnings.bestAgentCombos.push({
        agents: runData.agents,
        successRate: runData.success ? 1 : 0,
        avgOutcome: runData.outcome,
        uses: 1,
      });
    }
    
    intelligence.learnings.bestAgentCombos.sort((a: any, b: any) => b.successRate - a.successRate);
    intelligence.learnings.bestAgentCombos = intelligence.learnings.bestAgentCombos.slice(0, 10);

    await setDoc(intRef, {
      ...intelligence,
      lastUpdated: serverTimestamp(),
    }, { merge: true });

    return intelligence;
  } catch (e) {
    console.error('Failed to learn from workflow:', e);
    return null;
  }
}

export async function getRecommendations(workspaceId: string, context: {
  type: 'campaign' | 'workflow' | 'post';
  goal?: string;
}): Promise<string[]> {
  const intelligence = await getWorkspaceIntelligence(workspaceId);
  if (!intelligence) return [];

  const recommendations: string[] = [];

  if (context.type === 'campaign') {
    if (intelligence.bestOffers.length > 0) {
      const topOffer = intelligence.bestOffers[0];
      recommendations.push(`Consider using "${topOffer.offer}" (${(topOffer.conversionRate * 100).toFixed(1)}% conversion rate)`);
    }
    if (intelligence.bestHooks.length > 0) {
      const topHook = intelligence.bestHooks[0];
      recommendations.push(`Try hook: "${topHook.hook}" (${(topHook.engagementRate * 100).toFixed(1)}% engagement)`);
    }
  }

  if (context.type === 'workflow') {
    if (intelligence.bestAgentCombos.length > 0) {
      const topCombo = intelligence.bestAgentCombos[0];
      recommendations.push(`Best agent combo: ${topCombo.agents.join(' + ')} (${(topCombo.successRate * 100).toFixed(1)}% success)`);
    }
  }

  if (context.type === 'post') {
    if (intelligence.bestPostingTimes.length > 0) {
      const topTime = intelligence.bestPostingTimes[0];
      recommendations.push(`Best posting time: ${topTime.dayOfWeek} at ${topTime.hour}:00 on ${topTime.platform}`);
    }
  }

  return recommendations;
}
