import { requireAuth, requireRole, requireWorkspaceMembership } from "./auth";

export type GuardOptions = {
  allowedRoles?: ("owner" | "admin" | "member" | "viewer")[];
};

export async function guardWorkspaceRequest(req: Request, opts: GuardOptions = {}) {
  const user = await requireAuth(req);

  // workspaceId can come from header, query param, or JSON body
  const url = new URL(req.url);
  const headerWs = req.headers.get("x-workspace-id");
  const queryWs = url.searchParams.get("workspaceId");

  let body: any = null;
  if (req.headers.get("content-type")?.includes("application/json")) {
    body = await req.json().catch(() => null);
  }

  const bodyWs = body?.workspaceId;
  const workspaceId = (headerWs || queryWs || bodyWs) as string;

  if (!workspaceId) throw new Error("MISSING_WORKSPACE_ID");

  const { role } = await requireWorkspaceMembership(workspaceId, user.uid);

  // default: viewers can read, not write. Routes decide.
  if (opts.allowedRoles && opts.allowedRoles.length) {
    requireRole(role, opts.allowedRoles);
  }

  return { user, role, workspaceId, body };
}

/**
 * Never trust client data for these fields.
 * Always overwrite them server-side.
 */
export function enforceWorkspaceFields<T extends Record<string, any>>(
  input: T,
  ctx: {
    workspaceId: string;
    uid: string;
    now: Date;
  }
): T & {
  workspaceId: string;
  updatedAt: Date;
  updatedBy: string;
  createdAt: Date;
  createdBy: string;
} {
  // Always overwrite these fields server-side, never trust client
  const out = { ...input } as T & {
    workspaceId: string;
    updatedAt: Date;
    updatedBy: string;
    createdAt: Date;
    createdBy: string;
  };
  out.workspaceId = ctx.workspaceId;
  out.updatedAt = ctx.now;
  out.updatedBy = ctx.uid;

  if (!out.createdAt) out.createdAt = ctx.now;
  if (!out.createdBy) out.createdBy = ctx.uid;

  return out;
}
