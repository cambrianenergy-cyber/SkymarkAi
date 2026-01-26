// Shareable Wins - Generate exportable growth reports

import { db } from './firebase';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';

export interface ReportMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
}

export async function generateWeeklyReport(workspaceId: string): Promise<{ title: string; metrics: ReportMetric[]; insights: string[]; type: 'weekly' }> {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Fetch data for this week and last week
    const [
      leadsThisWeek,
      leadsLastWeek,
      postsThisWeek,
      postsLastWeek,
      workflowRunsThisWeek,
      workflowRunsLastWeek,
    ] = await Promise.all([
      getDocs(query(collection(db, 'leads'), where('workspaceId', '==', workspaceId), where('createdAt', '>=', weekAgo))),
      getDocs(query(collection(db, 'leads'), where('workspaceId', '==', workspaceId), where('createdAt', '>=', twoWeeksAgo), where('createdAt', '<', weekAgo))),
      getDocs(query(collection(db, 'scheduled_posts'), where('workspaceId', '==', workspaceId), where('createdAt', '>=', weekAgo))),
      getDocs(query(collection(db, 'scheduled_posts'), where('workspaceId', '==', workspaceId), where('createdAt', '>=', twoWeeksAgo), where('createdAt', '<', weekAgo))),
      getDocs(query(collection(db, 'workflow_runs'), where('workspaceId', '==', workspaceId), where('createdAt', '>=', weekAgo))),
      getDocs(query(collection(db, 'workflow_runs'), where('workspaceId', '==', workspaceId), where('createdAt', '>=', twoWeeksAgo), where('createdAt', '<', weekAgo))),
    ]);

    const metrics: ReportMetric[] = [
      {
        label: 'New Leads',
        value: leadsThisWeek.size,
        change: leadsLastWeek.size > 0 ? ((leadsThisWeek.size - leadsLastWeek.size) / leadsLastWeek.size) * 100 : 0,
        trend: leadsThisWeek.size > leadsLastWeek.size ? 'up' : leadsThisWeek.size < leadsLastWeek.size ? 'down' : 'flat',
      },
      {
        label: 'Posts Published',
        value: postsThisWeek.size,
        change: postsLastWeek.size > 0 ? ((postsThisWeek.size - postsLastWeek.size) / postsLastWeek.size) * 100 : 0,
        trend: postsThisWeek.size > postsLastWeek.size ? 'up' : postsThisWeek.size < postsLastWeek.size ? 'down' : 'flat',
      },
      {
        label: 'Workflows Executed',
        value: workflowRunsThisWeek.size,
        change: workflowRunsLastWeek.size > 0 ? ((workflowRunsThisWeek.size - workflowRunsLastWeek.size) / workflowRunsLastWeek.size) * 100 : 0,
        trend: workflowRunsThisWeek.size > workflowRunsLastWeek.size ? 'up' : workflowRunsThisWeek.size < workflowRunsLastWeek.size ? 'down' : 'flat',
      },
    ];

    const insights: string[] = [];
    if (leadsThisWeek.size > leadsLastWeek.size) {
      insights.push(` Lead generation up ${((leadsThisWeek.size - leadsLastWeek.size) / (leadsLastWeek.size || 1) * 100).toFixed(0)}% week-over-week`);
    }
    if (workflowRunsThisWeek.size > 10) {
      insights.push(` High automation velocity: ${workflowRunsThisWeek.size} workflow runs this week`);
    }
    if (postsThisWeek.size > 0) {
      insights.push(` Consistent content cadence: ${postsThisWeek.size} posts published`);
    }

    return {
      title: `Weekly Growth Report  ${weekAgo.toLocaleDateString()} to ${now.toLocaleDateString()}`,
      metrics,
      insights,
      type: 'weekly',
    };
  } catch (e) {
    console.error('Failed to generate weekly report:', e);
    return { title: 'Weekly Growth Report', metrics: [], insights: [], type: 'weekly' };
  }
}

export async function saveShareableReport(workspaceId: string, report: { title: string; metrics: ReportMetric[]; insights: string[]; type: 'weekly' | 'campaign' | 'client_results' }) {
  try {
    const docRef = await addDoc(collection(db, 'shareable_reports'), {
      workspaceId,
      ...report,
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      createdAt: serverTimestamp(),
    });

    const shareLink = `${window.location.origin}/share/${docRef.id}`;
    return shareLink;
  } catch (e) {
    console.error('Failed to save shareable report:', e);
    return null;
  }
}

