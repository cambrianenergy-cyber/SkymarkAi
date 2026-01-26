import { getAuth } from "firebase-admin/auth";
import { adminDb } from "./firebaseAdmin";

export type AuthedUser = { uid: string; email?: string | null };

export async function requireAuth(req: Request): Promise<AuthedUser> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("UNAUTHENTICATED");

  const decoded = await getAuth().verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email ?? null };
}

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export async function requireWorkspaceMembership(
  workspaceId: string,
  uid: string
): Promise<{ role: WorkspaceRole }> {
  const db = adminDb();
  const memberId = `${workspaceId}_${uid}`;
  const snap = await db.collection("workspace_members").doc(memberId).get();
  if (!snap.exists) throw new Error("FORBIDDEN_NOT_MEMBER");

  const data = snap.data() as any;
  if (data.status !== "active") throw new Error("FORBIDDEN_INACTIVE_MEMBER");

  return { role: data.role as WorkspaceRole };
}

export function requireRole(role: WorkspaceRole, allowed: WorkspaceRole[]) {
  if (!allowed.includes(role)) throw new Error("FORBIDDEN_ROLE");
}
