import { col, now } from "./firestore";
import { sendOrchestratorAlert } from "./alertEmail";

/**
 * Detects abuse patterns in tool execution and logs/alerts if suspicious activity is found.
 * This is a simple stub: extend with more rules as needed.
 */
export async function detectAbuse({
  workspaceId,
  agentId,
  toolType,
  toolName,
  error,
  denialReason,
  meta = {},
}: {
  workspaceId: string;
  agentId: string;
  toolType: string;
  toolName: string;
  error?: { code: string; message: string };
  denialReason?: string;
  meta?: Record<string, any>;
}) {
  // Example rules: too many failures, repeated denials, suspicious tool usage
  if (error?.code === "PERMISSION_DENIED" || denialReason) {
    await col("abuse_logs").add({
      workspaceId,
      agentId,
      toolType,
      toolName,
      error,
      denialReason,
      meta,
      detectedAt: now(),
      rule: "permission_denied",
    });
    await sendOrchestratorAlert(
      `Abuse Alert: Permission denied for tool ${toolType}/${toolName}`,
      `Workspace: ${workspaceId}\nAgent: ${agentId}\nReason: Permission denied\nTool: ${toolType}/${toolName}\nMeta: ${JSON.stringify(meta)}`
    );
  }
  if (error?.code === "TOOL_FAILED") {
    await col("abuse_logs").add({
      workspaceId,
      agentId,
      toolType,
      toolName,
      error,
      meta,
      detectedAt: now(),
      rule: "tool_failed",
    });
    // Optionally: alert on repeated failures
    // Example: send alert for tool failures (can be rate-limited or thresholded in production)
    // await sendOrchestratorAlert(
    //   `Abuse Alert: Tool failed for ${toolType}/${toolName}`,
    //   `Workspace: ${workspaceId}\nAgent: ${agentId}\nError: ${JSON.stringify(error)}\nMeta: ${JSON.stringify(meta)}`
    // );
  }
  // Add more rules as needed (rate, frequency, suspicious input, etc)
}
