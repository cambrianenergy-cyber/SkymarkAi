// CampaignMessage TypeScript interface for Firestore
// Represents a single message sent as part of a campaign_run

export type CampaignMessageChannel = "email" | "sms" | "social";
export type CampaignMessageStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "failed"
  | "replied";

export interface CampaignMessage {
  id?: string;
  channel: CampaignMessageChannel;
  to: {
    contactId: string;
    address: string; // email, phone, or social handle
  };
  content: {
    subject?: string;
    body: string;
  };
  sendAt?: any; // Firestore Timestamp
  status: CampaignMessageStatus;
  providerMessageId?: string;
  error?: {
    code?: string;
    message?: string;
    details?: any;
  };
  createdAt: any;
  updatedAt: any;
}
