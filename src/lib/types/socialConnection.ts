// Stub for SocialConnection type to unblock build
export default interface SocialConnection {
  id: string;
  userId: string;
  workspaceId: string;
  platform: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scopes: string[];
  status: string;
  lastChecked: number;
  meta?: Record<string, any>;
}
