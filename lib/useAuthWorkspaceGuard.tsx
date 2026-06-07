/**
 * Centralized Auth & Workspace Guard
 * 
 * This hook ensures that:
 * 1. User is authenticated
 * 2. A workspace is selected (has workspaceId in localStorage)
 * 3. User is an active member of that workspace
 * 
 * If any precondition fails, redirects to appropriate page.
 * 
 * Use this at the top of every protected page component.
 */

"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "./firebase";

interface GuardState {
  user: User | null;
  workspaceId: string | null;
  isReady: boolean;
  isAuthorized: boolean;
}

/**
 * Central auth and workspace guard hook
 * 
 * @returns {GuardState} Current guard state
 */
export function useAuthWorkspaceGuard(): GuardState {
  const router = useRouter();
  const [state, setState] = useState<GuardState>({
    user: null,
    workspaceId: null,
    isReady: false,
    isAuthorized: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Step 1: Check if user is authenticated
      if (!user) {
        console.log(" Auth Guard: No user authenticated");
        router.push("/login");
        setState({ user: null, workspaceId: null, isReady: true, isAuthorized: false });
        return;
      }

      // Step 2: Check if workspace is selected
      const workspaceId = localStorage.getItem("workspaceId");
      if (!workspaceId) {
        console.log(" Workspace Guard: No workspace selected");
        router.push("/app/workspaces");
        setState({ user, workspaceId: null, isReady: true, isAuthorized: false });
        return;
      }

      // Step 3: Verify user is an active member of this workspace
      try {
        const memberQuery = query(
          collection(db, "workspace_members"),
          where("userId", "==", user.uid),
          where("workspaceId", "==", workspaceId),
          where("status", "==", "active")
        );
        const memberSnap = await getDocs(memberQuery);

        if (memberSnap.empty) {
          console.log(" Workspace Guard: User not a member of workspace");
          localStorage.removeItem("workspaceId");
          localStorage.removeItem("workspaceName");
          router.push("/app/workspaces");
          setState({ user, workspaceId: null, isReady: true, isAuthorized: false });
          return;
        }

        setState({ user, workspaceId, isReady: true, isAuthorized: true });
      } catch (error) {
        console.error("Error checking workspace membership:", error);
        setState({ user, workspaceId, isReady: true, isAuthorized: false });
      }
    });

    return () => unsubscribe();
  }, [router]);

  return state;
}

/**
 * Simplified auth-only guard (no workspace requirement)
 */
export function useAuthGuard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
        setUser(null);
        setIsReady(true);
        return;
      }
      setUser(u);
      setIsReady(true);
    });

    return () => unsubscribe();
  }, [router]);

  return { user, isReady };
}

/**
 * Loading component to show while guard is checking
 */
export function GuardLoadingScreen(): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "4px solid #ddd",
            borderTopColor: "#0070f3",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          Loading...
        </p>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `,
        }}
      />
    </div>
  );
}

