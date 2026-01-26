// Type augmentation for WorkflowStep to support manual approval
import type { Timestamp } from 'firebase/firestore';

export interface WorkflowStep {
  stepId: string;
  order: number;
  agentType: string;
  instruction: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped" | "pending_approval";
  requiresApproval?: boolean;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  input?: any;
  output?: any;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}
