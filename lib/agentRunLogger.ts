// lib/agentRunLogger.ts

import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { AgentRun } from '@lib/types/agentAudit';
import { writeToDeadLetterQueue } from './deadLetterQueue';

export interface LogAgentRunParams {
  workspaceId: string;
  agentType: string;
  channel: string;
  triggerSource: AgentRun['triggerSource'];
  triggerDescription?: string;
  inputs?: Record<string, any>;
  correlationId?: string;
  workflowRunId?: string;
}

/**
 * Start logging an agent run - returns a runId for tracking
 * IMPORTANT: Store this runId to pass to completeAgentRun later
 */
export async function startAgentRun(params: LogAgentRunParams): Promise<string> {
  try {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const docRef = await addDoc(collection(db, 'agent_runs'), {
      workspaceId: params.workspaceId,
      runId,
      triggerSource: params.triggerSource,
      triggerDescription: params.triggerDescription || '',
      agentType: params.agentType,
      channel: params.channel,
      inputs: params.inputs || {},
      status: 'queued',
      startedAt: serverTimestamp(),
      correlationId: params.correlationId || runId,
      workflowRunId: params.workflowRunId || null,
      retries: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Return the internal Firestore doc ID along with runId for efficient updates
    // Format: "runId:docId" so completeAgentRun can directly update the doc
    return `${runId}:${docRef.id}`;
  } catch (error) {
    console.error('Failed to start agent run:', error);
    throw error;
  }
}

export interface CompleteAgentRunParams {
  runId: string; // Can be "runId" or "runId:docId" from startAgentRun
  workspaceId: string;
  status: 'succeeded' | 'failed' | 'succeeded_with_no_output';
  outputs?: {
    artifactIds?: string[];
    artifactLinks?: string[];
    summary?: string;
  };
  error?: {
    code?: string;
    message: string;
    stack?: string;
  };
  duration?: number;
}

/**
 * Complete an agent run with results - efficiently updates the run document
 */
export async function completeAgentRun(params: CompleteAgentRunParams): Promise<void> {
  try {
    let docId: string | null = null;
    let actualRunId = params.runId;

    // If runId includes docId (from startAgentRun), extract it for direct update
    if (params.runId.includes(':')) {
      [actualRunId, docId] = params.runId.split(':');
    }

    // If we don't have docId, query to find it (less efficient but works)
    if (!docId) {
      const q = query(
        collection(db, 'agent_runs'),
        where('workspaceId', '==', params.workspaceId),
        where('runId', '==', actualRunId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.warn(`Agent run not found: ${actualRunId}`);
        return;
      }
      
      docId = querySnapshot.docs[0].id;
    }

    // Update the existing document
    const docRef = doc(db, 'agent_runs', docId);
    await updateDoc(docRef, {
      status: params.status,
      outputs: params.outputs || {},
      error: params.error || null,
      endedAt: serverTimestamp(),
      duration: params.duration || 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to complete agent run:', error);
    throw error;
  }
}

/**
 * Log a failed agent run
 */
export async function logAgentRunFailure(params: {
  runId: string;
  workspaceId: string;
  error: { code?: string; message: string; stack?: string };
  duration?: number;
}): Promise<void> {
  await completeAgentRun({
    ...params,
    status: 'failed',
  });
  // Write to dead letter queue for permanent failure
  await writeToDeadLetterQueue({
    type: 'agent_task',
    payload: { runId: params.runId, workspaceId: params.workspaceId },
    error: params.error.message,
    workspaceId: params.workspaceId,
  });
}

/**
 * Log a successful agent run
 */
export async function logAgentRunSuccess(params: {
  runId: string;
  workspaceId: string;
  outputs?: {
    artifactIds?: string[];
    artifactLinks?: string[];
    summary?: string;
  };
  duration?: number;
}): Promise<void> {
  return completeAgentRun({
    ...params,
    status: 'succeeded',
  });
}

/**
 * Log successful run with no output (edge case)
 */
export async function logAgentRunSuccessNoOutput(params: {
  runId: string;
  workspaceId: string;
  duration?: number;
}): Promise<void> {
  return completeAgentRun({
    ...params,
    status: 'succeeded_with_no_output',
  });
}
