import { Timestamp } from "firebase/firestore";

/**
 * Content Asset Type Definitions
 */
export interface ContentAsset {
  id?: string;
  workspaceId: string;
  campaignId?: string;
  sourceAssetId?: string; // For repurposing chains
  type: "post" | "reel" | "video" | "email" | "blog" | "ad" | "script" | "carousel" | "story" | "image";
  platform: string; // instagram, tiktok, youtube, linkedin, email, web, etc.
  status: "draft" | "approved" | "scheduled" | "published" | "review";
  title?: string;
  copy: string | object;
  mediaSpec?: {
    imageUrl?: string;
    videoUrl?: string;
    dimensions?: { width: number; height: number };
    duration?: number;
    format?: string;
  };
  hooks?: string[];
  ctas?: string[];
  createdByRunId?: string;
  metadata?: {
    hashtags?: string[];
    mentions?: string[];
    imageUrl?: string;
    videoUrl?: string;
  };
  // Legacy fields for backward compatibility
  mediaRefs?: string[];
  parentAssetId?: string;
  repurposedCount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Scheduled Post Type Definitions
 */
export interface ScheduledPost {
  id?: string;
  workspaceId: string;
  assetId: string;
  campaignId?: string;
  platform: string;
  scheduledFor: Timestamp;
  status: "scheduled" | "published" | "failed" | "cancelled";
  publishedAt?: Timestamp;
  error?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
