export interface WorkspaceDailyStats {
  workspaceId: string;
  day: string; // "2026-01-31"

  runs: {
    started: number;
    succeeded: number;
    failed: number;
  };

  agents: {
    activeCount: number;
    downCount: number;
    degradedCount: number;
  };

  oauth: {
    connected: number;
    refreshed: number;
    revoked: number;
  };

  leads: {
    created: number;
    updated: number;
  };

  approvals: {
    requested: number;
    resolved: number;
  };

  updatedAt: FirebaseFirestore.Timestamp;
}
