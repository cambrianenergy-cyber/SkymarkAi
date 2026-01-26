// Constraint Intelligence - AI that tells users what NOT to do

import { db } from './firebase';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';

export interface ConstraintRecommendation {
  type: 'pause' | 'delay' | 'skip' | 'modify';
  severity: 'high' | 'medium' | 'low';
  entityType: 'workflow' | 'campaign' | 'agent' | 'post';
  entityId: string;
  message: string;
  reason: string;
  suggestedAction: string;
}

export async function analyzeConstraints(workspaceId: string): Promise<ConstraintRecommendation[]> {
  const recommendations: ConstraintRecommendation[] = [];

  try {
    // Check workflow runs usage
    const workflowRunsQ = query(
      collection(db, 'workflow_runs'),
      where('workspaceId', '==', workspaceId)
    );
    const workflowRunsSnap = await getDocs(workflowRunsQ);
    const thisMonthRuns = workflowRunsSnap.docs.filter(d => {
      const createdAt = d.data().createdAt?.toDate?.();
      if (!createdAt) return false;
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return createdAt >= monthAgo;
    });

    // Get workspace plan limits
    const wsRef = await getDocs(query(collection(db, 'workspaces'), where('__name__', '==', workspaceId)));
    const wsPlan = wsRef.docs[0]?.data()?.plan || 'free';
    const runLimits: Record<string, number> = { starter: 50, pro: 200, agency: 1000, elite: 999999 };
    const limit = runLimits[wsPlan] || 10;

    if (thisMonthRuns.length >= limit * 0.9) {
      recommendations.push({
        type: 'pause',
        severity: 'high',
        entityType: 'workflow',
        entityId: 'general',
        message: "You're approaching your workflow run limit",
        reason: `You've used ${thisMonthRuns.length} of ${limit} runs this month (${((thisMonthRuns.length / limit) * 100).toFixed(0)}%)`,
        suggestedAction: 'Upgrade your plan or pause non-critical workflows until next month',
      });
    }

    // Check for workflows that haven't produced outcomes
    const workflows = await getDocs(query(collection(db, 'workflows'), where('workspaceId', '==', workspaceId)));
    for (const wf of workflows.docs) {
      const runs = workflowRunsSnap.docs.filter(r => r.data().workflowId === wf.id);
      if (runs.length > 5) {
        const outcomes = await getDocs(query(collection(db, 'attributions'), where('workspaceId', '==', workspaceId)));
        const hasOutcomes = outcomes.docs.some(o => {
          const touchpoints = o.data().touchpoints || [];
          return touchpoints.some((tp: any) => tp.entityId === wf.id);
        });

        if (!hasOutcomes) {
          recommendations.push({
            type: 'modify',
            severity: 'medium',
            entityType: 'workflow',
            entityId: wf.id,
            message: `"${wf.data().name}" hasn't produced tracked outcomes`,
            reason: `${runs.length} runs completed, but no attributed leads or revenue`,
            suggestedAction: 'Review the workflow steps or add better tracking',
          });
        }
      }
    }

    // Check for over-posting
    const postsLastWeek = await getDocs(query(
      collection(db, 'scheduled_posts'),
      where('workspaceId', '==', workspaceId)
    ));
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentPosts = postsLastWeek.docs.filter(p => {
      const createdAt = p.data().createdAt?.toDate?.();
      return createdAt && createdAt >= weekAgo;
    });

    if (recentPosts.length > 30) {
      recommendations.push({
        type: 'delay',
        severity: 'medium',
        entityType: 'post',
        entityId: 'general',
        message: "You're posting too frequently",
        reason: `${recentPosts.length} posts in the last 7 days may hurt engagement`,
        suggestedAction: 'Reduce cadence to 3-5 posts per week per platform',
      });
    }

    // Check for agents that aren't being used
    const agents = await getDocs(query(collection(db, 'agents'), where('workspaceId', '==', workspaceId)));
    for (const agent of agents.docs) {
      const usages = workflowRunsSnap.docs.filter(r => {
        const steps = r.data().steps || [];
        return steps.some((s: any) => s.agentType === agent.data().type);
      });

      if (usages.length === 0 && agent.data().status === 'active') {
        recommendations.push({
          type: 'skip',
          severity: 'low',
          entityType: 'agent',
          entityId: agent.id,
          message: `Agent "${agent.data().name}" is active but unused`,
          reason: 'No workflows are using this agent',
          suggestedAction: 'Pause or delete to keep your agent registry clean',
        });
      }
    }

    // Save recommendations to Firestore
    for (const rec of recommendations) {
      await addDoc(collection(db, 'constraint_recommendations'), {
        workspaceId,
        ...rec,
        dismissed: false,
        createdAt: serverTimestamp(),
      });
    }

    return recommendations;
  } catch (e) {
    console.error('Failed to analyze constraints:', e);
    return [];
  }
}

export async function getActiveConstraints(workspaceId: string): Promise<ConstraintRecommendation[]> {
  try {
    const q = query(
      collection(db, 'constraint_recommendations'),
      where('workspaceId', '==', workspaceId),
      where('dismissed', '==', false)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ConstraintRecommendation);
  } catch (e) {
    console.error('Failed to get constraints:', e);
    return [];
  }
}
