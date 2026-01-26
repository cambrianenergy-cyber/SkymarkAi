// CampaignRun TypeScript interface for Firestore
// Represents a real campaign execution job (not just AI asset generation)

export type CampaignChannel = "email" | "sms" | "social" | "ads";
export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export interface CampaignRun {
  id?: string;
  workspaceId: string;
  workflowRunId: string; // Link to the AI asset generation session
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  scheduledAt?: any; // Firestore Timestamp
  startedAt?: any;
  completedAt?: any;
  canceledAt?: any;
  failedAt?: any;
  createdByUid: string;
  createdByName?: string;
  audience: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    replied: number;
  };
  messageTemplateId?: string;
  messagePreview?: string;
  logs?: Array<{
    timestamp: any;
    event: string;
    details?: any;
  }>;
  createdAt: any;
  updatedAt: any;
}
