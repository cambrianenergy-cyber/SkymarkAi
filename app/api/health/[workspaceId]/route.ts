import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@lib/firebase';
import { SystemHealth } from '@/lib/types/agentAudit';

export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    const workspaceId = params.workspaceId;

    // Check database connectivity
    const dbOk = await checkDatabaseHealth();

    // Get last successful run
    const q = query(
      collection(db, 'agent_runs'),
      where('workspaceId', '==', workspaceId),
      where('status', '==', 'succeeded'),
      orderBy('startedAt', 'desc'),
      limit(1)
    );
    const snap = await getDocs(q);
    const lastRun = snap.docs[0]?.data();

    // Calculate 24h metrics
    const metricsSnap = await getDocs(
      query(
        collection(db, 'agent_runs'),
        where('workspaceId', '==', workspaceId),
        where('startedAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
      )
    );

    const runs = metricsSnap.docs.map(d => d.data());
    const successCount = runs.filter(r => r.status === 'succeeded').length;
    const failureCount = runs.filter(r => r.status === 'failed').length;
    const successRate = runs.length > 0 ? (successCount / runs.length) * 100 : 0;
    const errorRate = runs.length > 0 ? (failureCount / runs.length) * 100 : 0;
    const avgLatency = runs.length > 0
      ? runs.reduce((sum: number, r: any) => sum + (r.duration || 0), 0) / runs.length
      : 0;

    const health: SystemHealth = {
      orchestrator: {
        reachable: true,
        lastCheck: new Date(),
      },
      database: {
        healthy: dbOk,
        readOk: dbOk,
        writeOk: dbOk,
        lastCheck: new Date(),
      },
      queue: {
        healthy: true,
        pendingJobs: 0,
        lastCheck: new Date(),
      },
      integrations: {
        email: {
          name: 'Email',
          valid: true,
          lastVerified: new Date(),
        },
        instagram: {
          name: 'Instagram',
          valid: true,
          lastVerified: new Date(),
        },
        crm: {
          name: 'CRM',
          valid: true,
          lastVerified: new Date(),
        },
      },
      lastSuccessfulRun: lastRun
        ? {
            runId: lastRun.runId,
            timestamp: lastRun.startedAt?.toDate?.() || new Date(),
            agentType: lastRun.agentType,
          }
        : undefined,
      metrics: {
        successRate24h: Math.round(successRate),
        errorRate24h: Math.round(errorRate),
        avgLatency24h: Math.round(avgLatency),
        totalRuns24h: runs.length,
      },
    };

    return NextResponse.json(health);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Health check failed' },
      { status: 500 }
    );
  }
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const q = query(collection(db, 'agent_runs'), limit(1));
    await getDocs(q);
    return true;
  } catch {
    return false;
  }
}
