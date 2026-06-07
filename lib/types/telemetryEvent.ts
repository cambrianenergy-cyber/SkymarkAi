export type TelemetryEventType =
  | "RUN_STARTED"
  | "RUN_STEP_STARTED"
  | "RUN_STEP_SUCCEEDED"
  | "RUN_STEP_FAILED"
  | "RUN_SUCCEEDED"
  | "RUN_FAILED"
  | "AGENT_HEARTBEAT"
  | "AGENT_TASK_ASSIGNED"
  | "AGENT_TASK_SUCCEEDED"
  | "AGENT_TASK_FAILED"
  | "OAUTH_CONNECTED"
  | "OAUTH_REFRESHED"
  | "OAUTH_REVOKED"
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_RESOLVED";

import { firestore } from 'firebase-admin';

export interface TelemetryEvent {
  workspaceId: string;
  type: TelemetryEventType;

  // Who/what caused it
  actor: {
    uid?: string;          // user
    agentId?: string;      // agent
    system?: boolean;      // backend job
  };

  // Correlation
  runId?: string;
  workflowId?: string;
  stepId?: string;
  approvalId?: string;
  leadId?: string;
  platform?: string;

  // Payload
  severity: "info" | "warn" | "error";
  message?: string;
  meta?: Record<string, any>;

  // Time
  createdAt: firestore.Timestamp; // server timestamp
}
