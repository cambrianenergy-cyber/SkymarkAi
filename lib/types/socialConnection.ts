// Firestore type for social media connection
export default interface SocialConnection {
  id: string; // doc id: `${userId}_${platform}`
  userId: string;
  workspaceId: string;
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // ms since epoch
  scopes: string[];
  status: 'connected' | 'expired' | 'revoked';
  lastChecked: number; // ms since epoch
  meta?: Record<string, any>; // platform-specific
}
