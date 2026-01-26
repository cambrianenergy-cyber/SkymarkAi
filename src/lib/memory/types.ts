// Agent and workspace memory architecture types

export type MemoryTier = "short_term" | "long_term";

export interface AgentMemory {
  workspaceId: string;
  agentId: string;
  memoryId: string;
  tier: MemoryTier;
  type: "fact" | "preference" | "summary" | "instruction" | "warning";
  content: string;
  source: "user" | "agent" | "system";
  confidence: number;
  reinforced: number; // reinforcement score
  decayAt?: number | null; // timestamp for decay
  expiresAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceKnowledge {
  workspaceId: string;
  knowledgeId: string;
  type: "doc" | "fact" | "faq" | "policy" | "summary";
  content: string;
  tags?: string[];
  source: "user" | "system";
  confidence: number;
  reinforced: number;
  decayAt?: number | null;
  expiresAt?: number | null;
  createdAt: number;
  updatedAt: number;
}
