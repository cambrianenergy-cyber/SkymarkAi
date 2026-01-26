import { Timestamp } from "firebase/firestore";

/**
 * Campaign Type Definition
 * 
 * Represents a marketing campaign with AI-generated content strategy
 */
export interface Campaign {
  id?: string;
  workspaceId: string;
  name: string;
  goal: "awareness" | "leads" | "sales" | "launch";
  offer: string;
  audience: string;
  platforms: string[];
  messagingPillars?: string[];
  contentPlan?: any; // Generated content plan from AI workflow
  status: "draft" | "active" | "completed";
  generatedByRunId?: string;
  generatedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Campaign Creation Input (without generated fields)
 */
export interface CreateCampaignInput {
  workspaceId: string;
  name: string;
  goal: "awareness" | "leads" | "sales" | "launch";
  offer: string;
  audience: string;
  platforms: string[];
  status?: "draft" | "active" | "completed";
}

/**
 * Campaign Update Input (partial fields)
 */
export interface UpdateCampaignInput {
  name?: string;
  goal?: "awareness" | "leads" | "sales" | "launch";
  offer?: string;
  audience?: string;
  platforms?: string[];
  messagingPillars?: string[];
  contentPlan?: any;
  status?: "draft" | "active" | "completed";
  generatedByRunId?: string;
  generatedAt?: Timestamp;
}
