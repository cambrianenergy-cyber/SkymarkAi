"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export interface UseWorkspaceResult {
  workspaces: Workspace[];
  memberships: Membership[];
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;
  currentRole: string;
  loading: boolean;
  workspaceId: string | null;
  switchWorkspace: (workspaceId: string) => void;
  canEdit: boolean;
  canAdmin: boolean;
  isOwner: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  ownerUserId: string;
  plan?: string;
  status?: string;
  businessDescription: string;
  brandPositioning: string;
  targetAudience: string;
  tone: string;
  geographicFocus?: string;
  timezone: string;
  operatingHours?: string;
  brandVoice: string;
  disabledChannels?: string[]; // List of disabled channel names
}

export interface Membership {
  id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited" | "removed";
}

export function useWorkspace(user: any): UseWorkspaceResult {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadWorkspaces();
  }, [user]);

  async function loadWorkspaces() {
    try {
      // Get all memberships for current user
      const memQ = query(
        collection(db, "workspace_members"),
        where("userId", "==", user.uid),
        where("status", "==", "active")
      );
      const memSnap = await getDocs(memQ);
      
      const mems = memSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Membership[];
      
      setMemberships(mems);

      if (mems.length === 0) {
        setCurrentWorkspaceId(null);
        setCurrentWorkspace(null);
        setLoading(false);
        return;
      }

      // Get workspace details for all memberships
      const workspaceIds = mems.map((m) => m.workspaceId);
      const workspaceDocs = await Promise.all(
        workspaceIds.map(async (wsId) => {
          const wsQ = query(
            collection(db, "workspaces"),
            where("__name__", "==", wsId)
          );
          const wsSnap = await getDocs(wsQ);
          if (!wsSnap.empty) {
            return {
              id: wsSnap.docs[0].id,
              ...wsSnap.docs[0].data(),
            } as Workspace;
          }
          return null;
        })
      );

      const validWorkspaces = workspaceDocs.filter((w) => w !== null) as Workspace[];
      setWorkspaces(validWorkspaces);

      // Set current workspace from localStorage or first workspace
      const storedWsId = localStorage.getItem("workspaceId");
      let wsId: string | null = storedWsId;
      
      // If stored workspace is not in valid workspaces, use first one
      if (!validWorkspaces.find((w) => w.id === storedWsId)) {
        wsId = mems[0].workspaceId;
      }
      
      if (!wsId) {
        wsId = mems[0].workspaceId;
      }
      
      setCurrentWorkspaceId(wsId);
      if (wsId) localStorage.setItem("workspaceId", wsId);
      
      const currentWs = validWorkspaces.find((w) => w.id === wsId);
      setCurrentWorkspace(currentWs || null);
      
      const currentMem = mems.find((m) => m.workspaceId === wsId);
      setCurrentRole(currentMem?.role || "viewer");
      
      console.log("useWorkspace loaded:", { 
        wsId, 
        workspaceName: currentWs?.name, 
        role: currentMem?.role,
        totalWorkspaces: validWorkspaces.length 
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading workspaces:", error);
      setLoading(false);
    }
  }

  function switchWorkspace(workspaceId: string) {
    console.log("Switching workspace to:", workspaceId);
    localStorage.setItem("workspaceId", workspaceId);
    setCurrentWorkspaceId(workspaceId);
    
    const ws = workspaces.find((w) => w.id === workspaceId);
    setCurrentWorkspace(ws || null);
    
    const mem = memberships.find((m) => m.workspaceId === workspaceId);
    setCurrentRole(mem?.role || "viewer");
    
    console.log("Workspace switched, reloading page...");
    // Reload page to refresh data
    window.location.reload();
  }

  return {
    workspaces,
    memberships,
    currentWorkspaceId,
    currentWorkspace,
    currentRole,
    loading,
    workspaceId: currentWorkspaceId,
    switchWorkspace,
    canEdit: currentRole === "owner" || currentRole === "admin" || currentRole === "member",
    canAdmin: currentRole === "owner" || currentRole === "admin",
    isOwner: currentRole === "owner",
  };
}
