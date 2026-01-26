import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/requireSession";
import { assertWorkspaceAdminOrOwner } from "@/lib/auth/workspaceAccess";
import { ensureWorkspaceOnboarding } from "../../../../lib/onboarding/ensureWorkspaceOnboarding";

export async function POST(req: Request) {
  const session = await requireSession(req);
  const { workspaceId } = await req.json();
  if (!workspaceId) return NextResponse.json({ ok: false, error: "workspaceId required" }, { status: 400 });

  await assertWorkspaceAdminOrOwner(session.uid, workspaceId);
  await ensureWorkspaceOnboarding(workspaceId);

  return NextResponse.json({ ok: true });
}
