export interface AgentDoc {
  workspaceId: string;
  agentId: string;

  name: string;
  type: string; // "content_writer" etc.
  capabilities: string[];

  health: "ok" | "degraded" | "down";
  lastHeartbeatAt: FirebaseFirestore.Timestamp | null;

  // Optional operational metadata
  version?: string;
  runtime?: "cloud-run" | "functions" | "server";
  meta?: Record<string, any>;

  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
