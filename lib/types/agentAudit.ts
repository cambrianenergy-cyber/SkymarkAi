// lib/types/agentAudit.ts

export interface AgentRun {
  id: string;
  workspaceId: string;
  runId: string; // Unique run identifier
  triggerSource: 'manual' | 'webhook' | 'cron' | 'workflow';
  triggerDescription?: string; // "Convert Thread  Lead", "New inbox message", etc.
  agentType: string;
  channel: string; // Email, Instagram, CRM, Slack, etc.
  inputs?: Record<string, any>; // Lightweight summary
  outputs?: {
    artifactIds?: string[]; // IDs of created artifacts
    artifactLinks?: string[]; // Links to created items
    summary?: string;
  };
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'succeeded_with_no_output';
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // milliseconds
  error?: {
    code?: string;
    message: string;
    stack?: string;
  };
  correlationId?: string; // Ties orchestrator + sub-agents together
  retries?: number;
  workflowRunId?: string; // Link to parent workflow run if applicable
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemHealth {
  orchestrator: {
    reachable: boolean;
    lastCheck: Date;
    error?: string;
  };
  database: {
    healthy: boolean;
    lastCheck: Date;
    readOk: boolean;
    writeOk: boolean;
    error?: string;
  };
  queue: {
    healthy: boolean;
    pendingJobs: number;
    lastCheck: Date;
    error?: string;
  };
  integrations: {
    [key: string]: {
      name: string;
      valid: boolean;
      expiresAt?: Date;
      lastVerified: Date;
      error?: string;
    };
  };
  lastSuccessfulRun?: {
    runId: string;
    timestamp: Date;
    agentType: string;
  };
  metrics: {
    successRate24h: number; // 0-100
    errorRate24h: number; // 0-100
    avgLatency24h: number; // milliseconds
    totalRuns24h: number;
  };
}

export interface AgentMetrics {
  workspaceId: string;
  period: 'hour' | 'day' | 'week';
  triggerLatency: {
    avg: number; // ms
    p50: number;
    p95: number;
    p99: number;
  };
  successRate: number; // 0-100
  channelDeliverySuccess: {
    [channel: string]: number; // 0-100
  };
  failureReasons: {
    [reason: string]: number; // count
  };
  totalRuns: number;
  succeededRuns: number;
  failedRuns: number;
  retryCount: number;
}

