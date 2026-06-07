// Firestore type for social media connection
export interface SocialConnection {
  id: string; // doc id: `${workspaceId}/${userId}_${platform}` (Phase 2: workspace-scoped)
  userId: string;
  workspaceId: string;
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | string;
  tokenRef: string; // server-managed token reference
  expiresAt?: number; // ms since epoch
  scopes: string[];
  status: 'connected' | 'expired' | 'revoked' | 'error' | 'disconnected' | 'pending';
  lastChecked: number; // ms since epoch
  meta?: Record<string, any>; // platform-specific

  // Audit fields
  createdAt: number; // ms since epoch
  updatedAt: number; // ms since epoch
  connectedAt?: number; // ms since epoch
  lastRefreshedAt?: number; // ms since epoch


  // OAuth token (added for compatibility)
  accessToken?: string;

  // Profile info
  profile?: {
    handle?: string;
    displayName?: string;
    platformUserId?: string;
  };

  // Error info
  error?: {
    code: string;
    message: string;
    at: number; // ms since epoch
  } | null;
}
export default SocialConnection;
