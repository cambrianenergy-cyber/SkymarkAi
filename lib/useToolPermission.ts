import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@lib/firebase";

/**
 * useToolPermission
 * Checks if the current agent/user is allowed to run a given tool in the workspace.
 *
 * @param agentId - The agent's ID
 * @param toolId - The tool's ID
 * @param workspaceId - The workspace ID
 * @returns { allowed: boolean | null, loading: boolean }
 */
export function useToolPermission(agentId: string, toolId: string, workspaceId: string) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId || !toolId || !workspaceId) {
      setAllowed(null);
      setLoading(false);
      return;
    }
    async function checkPermission() {
      setLoading(true);
      try {
        const permRef = doc(db, "agent_permissions", agentId);
        const permSnap = await getDoc(permRef);
        if (!permSnap.exists()) {
          setAllowed(false);
        } else {
          const data = permSnap.data();
          if (Array.isArray(data.allowedTools) && data.allowedTools.includes(toolId)) {
            setAllowed(true);
          } else {
            setAllowed(false);
          }
        }
      } catch (err) {
        setAllowed(false);
      }
      setLoading(false);
    }
    checkPermission();
  }, [agentId, toolId, workspaceId]);

  return { allowed, loading };
}
