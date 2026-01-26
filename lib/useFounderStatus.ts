import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const FOUNDER_EMAILS = [
  "cambrianenergy@gmail.com",
  "financialgrowthdfw@gmail.com",
];

export function useFounderStatus(user: any, workspaceId: string | null) {
  const [isFounder, setIsFounder] = useState(false);
  const [workspaceMeta, setWorkspaceMeta] = useState<any>(null);

  useEffect(() => {
    async function checkFounderStatus() {
      if (!user) {
        setIsFounder(false);
        return;
      }

      // Check email first
      if (FOUNDER_EMAILS.includes(user.email)) {
        setIsFounder(true);
        return;
      }

      // Check workspace metadata
      if (workspaceId) {
        try {
          const workspaceRef = doc(db, "workspaces", workspaceId);
          const workspaceDoc = await getDoc(workspaceRef);
          if (workspaceDoc.exists()) {
            const data = workspaceDoc.data();
            setWorkspaceMeta(data);
            setIsFounder(data?.isFounder === true);
          }
        } catch (error) {
          console.error("Error checking founder status:", error);
        }
      }
    }

    checkFounderStatus();
  }, [user, workspaceId]);

  return { isFounder, workspaceMeta };
}
