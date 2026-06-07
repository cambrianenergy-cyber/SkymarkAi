import { Timestamp } from "firebase/firestore";

// Minimal WorkflowRun type for client-safe usage
export type ClientWorkflowRun = {
  id: string;
  status: string;
  // add fields as needed
};

/**
 * Workflow Type Definitions
 */
export interface Workflow {
  id?: string;
  workspaceId: string;
  name: string;
  steps: WorkflowStep[];
  status: "draft" | "scheduled" | "running" | "completed" | "failed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkflowStep {
  id: string;
  agentType: string;
  agentName?: string;
  prompt: string;
  dependencies?: string[];
  status?: "pending" | "running" | "completed" | "failed";
  output?: any;
  error?: string;
}

export interface WorkflowRun {
  id?: string;
  workspaceId: string;
  workflowId?: string;
  steps: WorkflowStep[];
  status: "pending" | "running" | "completed" | "failed";
  currentStepIndex?: number;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  error?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
